import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { env } from '../config/env';
import { Invoice } from '../models/Invoice';
import { Evidence } from '../models/Evidence';
import { getFirebaseDatabase } from '../config/firebase-admin';
import { logger } from '../config/logger';
import { AIAuditLog } from '../models/AIAuditLog';

// Prompt Versioning Constants
export const PROMPT_VERSIONS = {
  GENERATE_MILESTONES: 'v2.1-milestone-structurer',
  SUMMARIZE_DISPUTE: 'v3.2-dispute-arbitrator',
  DETECT_ANOMALY: 'v1.0-anomaly-scorer',
} as const;

// Instantiate the SDK only if not in mock mode to prevent initialization errors
const isMockMode = env.GEMINI_API_KEY.startsWith('mock-');
const ai = !isMockMode ? new GoogleGenAI({ apiKey: env.GEMINI_API_KEY }) : null;

export interface MilestoneSuggestion {
  title: string;
  amountPaise: number;
}

export interface DisputeSummary {
  summary: string;
  keyClaims: string[];
  recommendedSplitMerchantPercent: number;
  recommendedSplitCustomerPercent: number;
  reasoning: string;
}

export interface EscrowExplanation {
  headline: string;
  details: string;
  nextActionRequiredBy: 'buyer' | 'seller' | 'admin' | 'none';
  plainEnglishStatus: string;
}

export interface AnomalyReport {
  isAnomaly: boolean;
  score: number; // 0-100
  factors: string[];
}

// ─── Zod Schemas for AI Response Validation ───────────────────────────────────

const milestoneSuggestionSchema = z.object({
  title: z.string().min(3, 'Milestone title is too short'),
  amountPaise: z.number().int().positive('Milestone amount must be positive'),
});

export const milestonesResponseSchema = z.object({
  milestones: z.array(milestoneSuggestionSchema).min(1, 'At least one milestone is required'),
});

export const disputeSummaryResponseSchema = z.object({
  summary: z.string().min(10, 'Dispute summary must be detailed'),
  keyClaims: z.array(z.string()).min(1, 'Must extract at least one claim'),
  recommendedSplitMerchantPercent: z.number().int().min(0).max(100),
  recommendedSplitCustomerPercent: z.number().int().min(0).max(100),
  reasoning: z.string().min(10, 'Must provide full reasoning for recommended split'),
});

// ─── Gemini API call wrapper with retry strategy ──────────────────────────────

async function generateContentWithRetry(
  prompt: string,
  responseSchema: any,
  maxAttempts: number = 3
): Promise<{ text: string; latencyMs: number }> {
  let attempt = 0;
  let delay = 1000;

  while (true) {
    const startTime = Date.now();
    try {
      attempt++;
      if (isMockMode || !ai) {
        throw new Error('Gemini API is in mock/unconfigured mode');
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
        },
      });

      const latencyMs = Date.now() - startTime;
      if (!response.text) {
        throw new Error('Gemini returned an empty response');
      }
      return { text: response.text, latencyMs };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      if (attempt >= maxAttempts) {
        logger.error(`[AI Service] Gemini call failed permanently after ${attempt} attempts.`, { error: err.message });
        throw err;
      }
      logger.warn(`[AI Service] Attempt ${attempt} failed: ${err.message}. Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2; // exponential backoff
    }
  }
}

// ─── Core Services ────────────────────────────────────────────────────────────

/**
 * Generate structural milestones suggestion based on description and total amount.
 */
export async function generateMilestones(
  description: string,
  totalAmountPaise: number,
  actorId: string = 'system',
  requestId?: string
): Promise<MilestoneSuggestion[]> {
  const startTime = Date.now();
  const promptTemplate = `[Version: ${PROMPT_VERSIONS.GENERATE_MILESTONES}] You are a professional freelance project manager. Split the contract description into 2 to 5 logical milestones.
The total amount of all milestones combined MUST equal exactly {{totalAmount}} paise.
Contract Description: "{{description}}"
Ensure the sum of all 'amountPaise' equals {{totalAmount}} exactly.`;

  const prompt = promptTemplate
    .replace(/\{\{totalAmount\}\}/g, String(totalAmountPaise))
    .replace('{{description}}', description);

  const responseSchema = {
    type: 'OBJECT',
    properties: {
      milestones: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING', description: 'Brief description of the milestone deliverable' },
            amountPaise: { type: 'INTEGER', description: 'Amount allocated to this milestone in paise' },
          },
          required: ['title', 'amountPaise'],
        },
      },
    },
    required: ['milestones'],
  };

  const inputData = { description, totalAmountPaise, promptVersion: PROMPT_VERSIONS.GENERATE_MILESTONES };

  if (isMockMode) {
    const half = Math.floor(totalAmountPaise / 2);
    const mockOutput = [
      { title: 'Milestone 1: Design and Scaffolding', amountPaise: half },
      { title: 'Milestone 2: Delivery & Final Codebase Handover', amountPaise: totalAmountPaise - half },
    ];

    // Log mock execution in AIAuditLog
    await AIAuditLog.create({
      timestamp: new Date(),
      action: 'generate-milestones',
      actorId,
      requestId,
      promptTemplate,
      inputData,
      rawResponse: JSON.stringify({ milestones: mockOutput }),
      parsedResponse: { milestones: mockOutput },
      confidenceScore: 100,
      latencyMs: Date.now() - startTime,
      status: 'success',
    });

    return mockOutput;
  }

  try {
    const { text, latencyMs } = await generateContentWithRetry(prompt, responseSchema);
    const rawParsed = JSON.parse(text);

    // 1. Zod response schema validation
    const parsed = milestonesResponseSchema.safeParse(rawParsed);
    if (!parsed.success) {
      logger.error('[AI Service] Milestones response validation failed', { detail: JSON.stringify(parsed.error.flatten()) });
      throw new Error(`Zod validation failure: ${JSON.stringify(parsed.error.flatten())}`);
    }

    const milestones = parsed.data.milestones;

    // 2. Business logic sanity check & normalization (ensure exact total amount match)
    const sum = milestones.reduce((s, m) => s + m.amountPaise, 0);
    let confidenceScore = 100;
    if (sum !== totalAmountPaise) {
      confidenceScore = 75; // reduced confidence if normalized
      logger.warn('[AI Service] Milestones sum mismatch — normalizing last milestone', { sum, expected: totalAmountPaise });
      const diff = totalAmountPaise - sum;
      if (milestones.length > 0) {
        milestones[milestones.length - 1].amountPaise += diff;
      }
    }

    // Save success audit log
    await AIAuditLog.create({
      timestamp: new Date(),
      action: 'generate-milestones',
      actorId,
      requestId,
      promptTemplate,
      inputData,
      rawResponse: text,
      parsedResponse: { milestones },
      confidenceScore,
      latencyMs,
      status: 'success',
    });

    return milestones;
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    logger.error('[AI Service] Failed to generate milestones, executing safe fallback.', { error: err.message });

    // Save failure audit log
    await AIAuditLog.create({
      timestamp: new Date(),
      action: 'generate-milestones',
      actorId,
      requestId,
      promptTemplate,
      inputData,
      validationErrors: err.message,
      latencyMs,
      status: 'failure',
    });

    // Safe fallback: Single final milestone
    return [{ title: 'Fulfillment & Final Delivery', amountPaise: totalAmountPaise }];
  }
}

/**
 * Compile chat logs and IPFS evidence into a structured dispute brief.
 */
export async function summarizeDispute(
  invoiceId: string,
  actorId: string = 'system',
  requestId?: string
): Promise<DisputeSummary> {
  const startTime = Date.now();
  const invoice = await Invoice.findOne({ invoiceId });
  const evidenceList = await Evidence.find({ invoiceId });

  if (!invoice) throw new Error('Invoice not found');

  let chatText = 'No chat messages found.';
  if (invoice.chatRoomId) {
    try {
      const db = getFirebaseDatabase();
      const snapshot = await db.ref(`/chatrooms/${invoice.chatRoomId}/messages`).get();
      if (snapshot.exists()) {
        const messages: Record<string, any> = snapshot.val();
        chatText = Object.values(messages)
          .map((m) => `[${new Date(m.timestamp).toISOString()}] ${m.senderId}: ${JSON.stringify(m.payload || m.text || '')}`)
          .join('\n');
      }
    } catch (e: any) {
      logger.warn('[AI Service] Failed to fetch chat logs for dispute summary:', { error: e.message });
    }
  }

  const evidenceText = evidenceList.map((e) => `- File: ${e.fileName} (IPFS: ${e.ipfsHash}, Type: ${e.mimeType})`).join('\n');
  const inputData = { invoiceId, hasEvidence: evidenceList.length > 0, promptVersion: PROMPT_VERSIONS.SUMMARIZE_DISPUTE };

  const promptTemplate = `[Version: ${PROMPT_VERSIONS.SUMMARIZE_DISPUTE}] Analyze this dispute for Invoice {{invoiceId}}.
Total Amount: {{totalAmount}} Paise.
Description: "{{description}}"

--- CHAT LOGS ---
{{chatText}}

--- ATTACHED EVIDENCE ---
{{evidenceText}}

Decide a fair split percentage between merchant and customer. The sum of recommendedSplitMerchantPercent and recommendedSplitCustomerPercent must be exactly 100. Provide structured arbitration output.`;

  const prompt = promptTemplate
    .replace('{{invoiceId}}', invoiceId)
    .replace('{{totalAmount}}', String(invoice.amountPaise))
    .replace('{{description}}', invoice.description || '')
    .replace('{{chatText}}', chatText)
    .replace('{{evidenceText}}', evidenceText || 'No files attached');

  const responseSchema = {
    type: 'OBJECT',
    properties: {
      summary: { type: 'STRING', description: 'Overview of the dispute context' },
      keyClaims: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Core arguments raised by each party' },
      recommendedSplitMerchantPercent: { type: 'INTEGER', description: 'Suggested percentage of funds to pay the merchant (0-100)' },
      recommendedSplitCustomerPercent: { type: 'INTEGER', description: 'Suggested percentage of funds to refund the customer (0-100)' },
      reasoning: { type: 'STRING', description: 'Detailed reasoning behind the recommended split decision' },
    },
    required: ['summary', 'keyClaims', 'recommendedSplitMerchantPercent', 'recommendedSplitCustomerPercent', 'reasoning'],
  };

  if (isMockMode) {
    const mockOutput: DisputeSummary = {
      summary: `Dispute summary for Invoice ${invoiceId} based on mock analysis. Dispute raised due to delivery delays.`,
      keyClaims: ['Merchant claims work is complete.', 'Customer claims work is incomplete.'],
      recommendedSplitMerchantPercent: 50,
      recommendedSplitCustomerPercent: 50,
      reasoning: 'Compromise recommended due to lack of distinct proof of completion.',
    };

    // Log mock execution
    await AIAuditLog.create({
      timestamp: new Date(),
      action: 'summarize-dispute',
      invoiceId,
      actorId,
      requestId,
      promptTemplate,
      inputData,
      rawResponse: JSON.stringify(mockOutput),
      parsedResponse: mockOutput,
      confidenceScore: 90,
      latencyMs: Date.now() - startTime,
      status: 'success',
    });

    return mockOutput;
  }

  try {
    const { text, latencyMs } = await generateContentWithRetry(prompt, responseSchema);
    const rawParsed = JSON.parse(text);

    // 1. Zod response schema validation
    const parsed = disputeSummaryResponseSchema.safeParse(rawParsed);
    if (!parsed.success) {
      logger.error('[AI Service] Dispute summary response validation failed', { detail: JSON.stringify(parsed.error.flatten()) });
      throw new Error(`Zod validation failure: ${JSON.stringify(parsed.error.flatten())}`);
    }

    const brief = parsed.data;

    // 2. Business logic validation (percentages must sum to 100)
    let confidenceScore = 95;
    const totalSplit = brief.recommendedSplitMerchantPercent + brief.recommendedSplitCustomerPercent;
    if (totalSplit !== 100) {
      confidenceScore = 60; // low confidence
      logger.warn('[AI Service] Recommended split percentages do not equal 100. Normalizing split.', {
        invoiceId,
        merchantPercent: brief.recommendedSplitMerchantPercent,
        customerPercent: brief.recommendedSplitCustomerPercent,
      });
      brief.recommendedSplitCustomerPercent = 100 - brief.recommendedSplitMerchantPercent;
    }

    // Save success audit log
    await AIAuditLog.create({
      timestamp: new Date(),
      action: 'summarize-dispute',
      invoiceId,
      actorId,
      requestId,
      promptTemplate,
      inputData,
      rawResponse: text,
      parsedResponse: brief,
      confidenceScore,
      latencyMs,
      status: 'success',
    });

    return brief;
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    logger.error('[AI Service] Failed to summarize dispute, executing fallback.', { error: err.message });

    // Save failure audit log
    await AIAuditLog.create({
      timestamp: new Date(),
      action: 'summarize-dispute',
      invoiceId,
      actorId,
      requestId,
      promptTemplate,
      inputData,
      validationErrors: err.message,
      latencyMs,
      status: 'failure',
    });

    // Fallback: 100% split to customer
    return {
      summary: `Unable to compile AI dispute summary: ${err.message}`,
      keyClaims: ['Dispute raised by one of the parties.'],
      recommendedSplitMerchantPercent: 0,
      recommendedSplitCustomerPercent: 100,
      reasoning: 'Default fallback recommendation: refund 100% of funds to the customer.',
    };
  }
}

/**
 * Score transaction anomaly risk.
 */
export async function detectTransactionAnomaly(
  merchantAddress: string,
  customerAddress: string,
  amountLovelace: number,
  actorId: string = 'system',
  requestId?: string
): Promise<AnomalyReport> {
  const startTime = Date.now();
  const amountAda = amountLovelace / 1_000_000;
  logger.info('[ai] Scanning for transaction anomalies', { amountAda });

  const promptTemplate = `[Version: ${PROMPT_VERSIONS.DETECT_ANOMALY}] Rule-based anomaly validation engine for address check.`;
  const inputData = { merchantAddress, customerAddress, amountLovelace };

  // Advanced deterministic risk checking
  const factors: string[] = [];
  let score = 5;

  if (amountAda > 20000) {
    score += 40;
    factors.push('Extremely large ADA transaction amount');
  } else if (amountAda > 5000) {
    score += 20;
    factors.push('Large ADA transaction amount');
  }

  if (merchantAddress === customerAddress) {
    score += 50;
    factors.push('Merchant and Customer addresses are identical (Self-dealing)');
  }

  const report: AnomalyReport = {
    isAnomaly: score >= 50,
    score,
    factors,
  };

  // Log to AIAuditLog for parity in tracking
  await AIAuditLog.create({
    timestamp: new Date(),
    action: 'detect-anomaly',
    actorId,
    requestId,
    promptTemplate,
    inputData,
    rawResponse: JSON.stringify(report),
    parsedResponse: report,
    confidenceScore: 100,
    latencyMs: Date.now() - startTime,
    status: 'success',
  });

  return report;
}

/**
 * Explain the current escrow contract status in plain English.
 */
export async function explainEscrowStatus(invoiceId: string): Promise<EscrowExplanation> {
  const invoice = await Invoice.findOne({ invoiceId });
  if (!invoice) throw new Error('Invoice not found');

  const state = invoice.escrowState;

  const mapping: Record<string, EscrowExplanation> = {
    None: {
      headline: 'Invoice Generated',
      details: 'The invoice has been created but funds have not been locked into the escrow smart contract yet.',
      nextActionRequiredBy: 'buyer',
      plainEnglishStatus: 'Awaiting Lock',
    },
    Created: {
      headline: 'Contract Setup',
      details: 'The contract has been initialized. Awaiting customer deposit.',
      nextActionRequiredBy: 'buyer',
      plainEnglishStatus: 'Awaiting Lock',
    },
    Locked: {
      headline: 'Funds Secured',
      details: 'Funds are securely held in the Cardano smart contract. Work can safely begin. The merchant can request release upon milestone completion.',
      nextActionRequiredBy: 'seller',
      plainEnglishStatus: 'Work In Progress',
    },
    PartiallyReleased: {
      headline: 'Milestones in Progress',
      details: `Active milestone: ${invoice.milestoneIndex + 1} of ${invoice.totalMilestones}. Previous milestones have been successfully paid out.`,
      nextActionRequiredBy: 'seller',
      plainEnglishStatus: 'Progressive Release',
    },
    Released: {
      headline: 'Contract Completed',
      details: 'All funds have been successfully released to the merchant wallet. This contract is closed.',
      nextActionRequiredBy: 'none',
      plainEnglishStatus: 'Settled',
    },
    Refunded: {
      headline: 'Funds Refunded',
      details: 'Funds have been returned to the customer wallet. This contract is closed.',
      nextActionRequiredBy: 'none',
      plainEnglishStatus: 'Refunded',
    },
    Disputed: {
      headline: 'Contract Frozen (Dispute)',
      details: 'A dispute has been raised. Escrow funds are locked from spending by either party pending admin resolution.',
      nextActionRequiredBy: 'admin',
      plainEnglishStatus: 'Under Review',
    },
    Resolved: {
      headline: 'Dispute Resolved',
      details: 'The dispute was adjudicated by the platform admin, and remaining funds have been split and paid out.',
      nextActionRequiredBy: 'none',
      plainEnglishStatus: 'Resolved',
    },
  };

  return mapping[state] || {
    headline: 'Status Unknown',
    details: 'Status of this escrow contract is currently being fetched or synced.',
    nextActionRequiredBy: 'none',
    plainEnglishStatus: 'Syncing',
  };
}
