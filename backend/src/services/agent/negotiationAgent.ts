import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { env } from '../../config/env';
import { Invoice } from '../../models/Invoice';
import { AIAgentConfig } from '../../models/AIAgentConfig';
import { AIAuditLog } from '../../models/AIAuditLog';
import { paiseToLovelace } from '../price.service';
import { getFirebaseDatabase } from '../../config/firebase-admin';
import { logger } from '../../config/logger';

const isMockMode = env.GEMINI_API_KEY.startsWith('mock-');
const ai = !isMockMode ? new GoogleGenAI({ apiKey: env.GEMINI_API_KEY }) : null;

export interface NegotiationResult {
  responseMessage: string;
  proposedPricePaise?: number;
  dealAgreed: boolean;
}

const negotiationSchema = z.object({
  responseMessage: z.string(),
  proposedPricePaise: z.number().int().optional(),
  dealAgreed: z.boolean(),
  reasoning: z.string(),
});

export async function runNegotiationStep(
  invoiceId: string,
  customerMessage: string,
  actorId: string = 'customer',
  requestId?: string
): Promise<NegotiationResult> {
  const startTime = Date.now();

  // 1. Fetch Invoice
  const invoice = await Invoice.findOne({ invoiceId });
  if (!invoice) {
    throw new Error(`Invoice not found: ${invoiceId}`);
  }

  if (invoice.status !== 'pending') {
    return {
      responseMessage: `This invoice is already ${invoice.status} and cannot be negotiated.`,
      dealAgreed: false,
    };
  }

  // Set originalAmountPaise if not set yet
  if (!invoice.originalAmountPaise) {
    invoice.originalAmountPaise = invoice.amountPaise;
    await invoice.save();
  }

  // 2. Fetch AI Config
  const config = await AIAgentConfig.findOne({ merchantId: invoice.merchantId });
  if (!config || !config.negotiationEnabled) {
    return {
      responseMessage: "Hello! I am the merchant's automated checkout assistant. Price negotiation is currently disabled for this shop. Please complete payment using the standard checkout options.",
      dealAgreed: false,
    };
  }

  // 3. Query Chat Room History from Firebase
  let chatHistoryString = '';
  if (invoice.chatRoomId) {
    try {
      const db = getFirebaseDatabase();
      const snap = await db.ref(`chats/${invoice.chatRoomId}/messages`).limitToLast(6).once('value');
      const messages: any[] = [];
      snap.forEach((child) => {
        const val = child.val();
        if (val) {
          const sender = val.senderId === 'system' ? 'system' : val.senderId === actorId ? 'customer' : 'assistant';
          messages.push(`[${sender}]: ${val.payload?.text || ''}`);
        }
      });
      chatHistoryString = messages.join('\n');
    } catch (e: any) {
      logger.warn('[negotiation] Failed to load chat history from Firebase, falling back to message only', { error: e.message });
    }
  }

  const originalPricePaise = invoice.originalAmountPaise;
  const currentPricePaise = invoice.amountPaise;
  const minDiscountPct = config.minDiscountPct;
  const minPricePaise = Math.round(originalPricePaise * (1 - minDiscountPct / 100));
  const style = config.negotiationStyle;

  const promptTemplate = `You are a professional shop assistant and price negotiator for a merchant.
You are helping a customer with an invoice.
Invoice Description: "{{description}}"
Original Price: INR {{originalPrice}} (in paise: {{originalPricePaise}})
Current Price: INR {{currentPrice}} (in paise: {{currentPricePaise}})
Maximum allowed discount set by merchant: {{minDiscountPct}}%
Your absolute minimum price limit: INR {{minPrice}} (in paise: {{minPricePaise}})
Your negotiation style is: {{style}}

Rules:
1. Be polite, concise, and helpful. Act according to your negotiation style:
   - friendly: compromising, warm, offers discounts easily.
   - firm: polite but strict, holds value, gives discounts slowly.
   - aggressive: defends value strongly, demands commitments before discount.
2. NEVER accept or propose any price lower than the absolute minimum price ({{minPricePaise}} paise).
3. If the customer requests a discount that is within your limit, you may offer a discount or accept their offer.
4. If a discount or price has been agreed upon, or if you propose a new price, specify "proposedPricePaise" in your JSON response.
5. If the customer explicitly agrees to pay the price (or if you reach a deal and they say yes), set "dealAgreed" to true.

Conversation History:
{{chatHistory}}
[customer]: "{{customerMessage}}"

Response Mime Type MUST be application/json matching this schema:
{
  "responseMessage": "The message to send to the customer.",
  "proposedPricePaise": 12345 (integer paise, optional if price changes),
  "dealAgreed": true/false (boolean, set true to finalize the deal),
  "reasoning": "Internal reasoning notes"
}`;

  const prompt = promptTemplate
    .replace('{{description}}', invoice.description || 'Goods or Services')
    .replace('{{originalPrice}}', (originalPricePaise / 100).toFixed(2))
    .replace('{{originalPricePaise}}', String(originalPricePaise))
    .replace('{{currentPrice}}', (currentPricePaise / 100).toFixed(2))
    .replace('{{currentPricePaise}}', String(currentPricePaise))
    .replace('{{minDiscountPct}}', String(minDiscountPct))
    .replace('{{minPrice}}', (minPricePaise / 100).toFixed(2))
    .replace('{{minPricePaise}}', String(minPricePaise))
    .replace('{{style}}', style)
    .replace('{{chatHistory}}', chatHistoryString)
    .replace('{{customerMessage}}', customerMessage);

  if (isMockMode) {
    // Determine mock behavior: if customer mentions "discount" or "cheaper", offer 5% discount if allowed
    let proposedPricePaise: number | undefined;
    let dealAgreed = false;
    let responseMessage = "I can't offer any discounts on this item right now, sorry!";

    if (customerMessage.toLowerCase().includes('discount') || customerMessage.toLowerCase().includes('cheaper')) {
      const discountAmount = Math.round(originalPricePaise * 0.05); // 5% discount
      const testPrice = originalPricePaise - discountAmount;
      if (testPrice >= minPricePaise) {
        proposedPricePaise = testPrice;
        responseMessage = `Sure, I can offer you a 5% discount on this. The new price is ₹${(testPrice / 100).toFixed(2)}.`;
      }
    } else if (customerMessage.toLowerCase().includes('ok') || customerMessage.toLowerCase().includes('agree') || customerMessage.toLowerCase().includes('deal')) {
      dealAgreed = true;
      responseMessage = "Excellent! I have updated the invoice. You can now proceed to pay.";
    } else {
      responseMessage = `Hello! How can I help you with your purchase of ₹${(currentPricePaise / 100).toFixed(2)}?`;
    }

    const mockOutput = {
      responseMessage,
      proposedPricePaise,
      dealAgreed,
      reasoning: 'Simulated mock response',
    };

    // If deal or price update agreed, perform updates
    if (proposedPricePaise && proposedPricePaise >= minPricePaise) {
      await updateInvoicePrice(invoice, proposedPricePaise);
    } else if (dealAgreed) {
      // Just keep current price and finalized state
    }

    await AIAuditLog.create({
      timestamp: new Date(),
      action: 'negotiate-price',
      actorId,
      requestId,
      promptTemplate,
      inputData: { customerMessage, invoiceId, originalPricePaise, minPricePaise },
      rawResponse: JSON.stringify(mockOutput),
      parsedResponse: mockOutput,
      confidenceScore: 100,
      latencyMs: Date.now() - startTime,
      status: 'success',
    });

    return {
      responseMessage: mockOutput.responseMessage,
      proposedPricePaise: mockOutput.proposedPricePaise,
      dealAgreed: mockOutput.dealAgreed,
    };
  }

  try {
    const responseSchema = {
      type: 'OBJECT',
      properties: {
        responseMessage: { type: 'STRING' },
        proposedPricePaise: { type: 'INTEGER' },
        dealAgreed: { type: 'BOOLEAN' },
        reasoning: { type: 'STRING' },
      },
      required: ['responseMessage', 'dealAgreed', 'reasoning'],
    };

    // We make a direct call using GoogleGenAI
    const response = await ai!.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema as any,
      },
    });

    const latencyMs = Date.now() - startTime;
    if (!response.text) {
      throw new Error('Gemini returned an empty response');
    }

    const rawParsed = JSON.parse(response.text);
    const parsed = negotiationSchema.parse(rawParsed);

    // Enforce safety limits: Price must be >= minPricePaise
    if (parsed.proposedPricePaise && parsed.proposedPricePaise < minPricePaise) {
      logger.warn('[negotiation] AI attempted to offer discount below limit, overriding to minimum price', {
        proposed: parsed.proposedPricePaise,
        minAllowed: minPricePaise,
      });
      parsed.proposedPricePaise = minPricePaise;
    }

    // Apply price updates
    if (parsed.proposedPricePaise && parsed.proposedPricePaise !== currentPricePaise) {
      await updateInvoicePrice(invoice, parsed.proposedPricePaise);
    }

    await AIAuditLog.create({
      timestamp: new Date(),
      action: 'negotiate-price',
      actorId,
      requestId,
      promptTemplate,
      inputData: { customerMessage, invoiceId, originalPricePaise, minPricePaise },
      rawResponse: response.text,
      parsedResponse: parsed,
      confidenceScore: 90,
      latencyMs,
      status: 'success',
    });

    return {
      responseMessage: parsed.responseMessage,
      proposedPricePaise: parsed.proposedPricePaise,
      dealAgreed: parsed.dealAgreed,
    };
  } catch (err: any) {
    logger.error('[negotiation] AI execution failed', { error: err.message });
    return {
      responseMessage: "I encountered an error while trying to look up pricing adjustments. Please proceed with the checkout at the current price.",
      dealAgreed: false,
    };
  }
}

async function updateInvoicePrice(invoice: any, newPricePaise: number): Promise<void> {
  const oldPrice = invoice.amountPaise;
  invoice.amountPaise = newPricePaise;
  invoice.amountLovelace = paiseToLovelace(newPricePaise, invoice.adaInrRate);

  // Pro-rate milestones if any exist
  if (invoice.milestones && invoice.milestones.length > 0) {
    const totalOldMilestonePaise = invoice.milestones.reduce((s: number, m: any) => s + m.amountLovelace, 0); // using lovelace as proxy
    let accumulatedLovelace = 0;

    for (let i = 0; i < invoice.milestones.length; i++) {
      if (i === invoice.milestones.length - 1) {
        // Last milestone gets remainder to prevent rounding errors
        invoice.milestones[i].amountLovelace = invoice.amountLovelace - accumulatedLovelace;
      } else {
        const ratio = invoice.milestones[i].amountLovelace / totalOldMilestonePaise;
        const target = Math.round(invoice.amountLovelace * ratio);
        invoice.milestones[i].amountLovelace = target;
        accumulatedLovelace += target;
      }
    }
  }

  await invoice.save();
  logger.info('[negotiation] Invoice price updated successfully', {
    invoiceId: invoice.invoiceId,
    oldPricePaise: oldPrice,
    newPricePaise,
    newLovelace: invoice.amountLovelace,
  });

  // Mirror updated escrow details to Firebase Realtime Database
  try {
    const db = getFirebaseDatabase();
    await db.ref(`invoices/${invoice.invoiceId}`).update({
      amountPaise: invoice.amountPaise,
      amountLovelace: invoice.amountLovelace,
    });
    if (invoice.escrowState !== 'None') {
      await db.ref(`escrow/${invoice.invoiceId}`).update({
        milestones: invoice.milestones.map((m: any) => ({
          title: m.title,
          amountLovelace: m.amountLovelace,
          status: m.status,
          releasedAt: m.releasedAt ? m.releasedAt.toISOString() : null,
        })),
      });
    }
  } catch (e: any) {
    logger.warn('[negotiation] Failed to push updated price to Firebase', { error: e.message });
  }
}
