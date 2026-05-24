import { Worker, Job } from 'bullmq';
import { bullMqRedis } from '../config/redis';
import { env } from '../config/env';
import { Invoice } from '../models/Invoice';
import { Transaction } from '../models/Transaction';
import { getTxInfo, verifyPayment } from '../services/blockchain.service';
import { transitionInvoiceStatus } from '../services/invoice.service';
import { enqueueReceipt, enqueueNotification, TxConfirmationJobData } from '../queues/queue.definitions';
import { Merchant } from '../models/Merchant';

const MIN_CONFIRMATIONS = env.MIN_CONFIRMATIONS;
const HIGH_VALUE_THRESHOLD_USD = env.HIGH_VALUE_THRESHOLD_USD;
const HIGH_VALUE_CONFIRMATIONS = env.HIGH_VALUE_CONFIRMATIONS;

export function startConfirmationWorker(): Worker {
  const worker = new Worker<TxConfirmationJobData>(
    'tx-confirmation',
    async (job: Job<TxConfirmationJobData>) => {
      const { invoiceId, txHash, amountLovelace, paymentAddress } = job.data;

      // Verify invoice is still in a pollable state
      const invoice = await Invoice.findOne({ invoiceId });
      if (!invoice) {
        console.log(`[confirmation] Invoice ${invoiceId} not found — skipping`);
        return;
      }
      if (!['submitted', 'confirming'].includes(invoice.status)) {
        console.log(`[confirmation] Invoice ${invoiceId} status=${invoice.status} — no action`);
        return;
      }

      // Fetch tx from chain (Blockfrost → Koios fallback)
      let txInfo;
      try {
        txInfo = await getTxInfo(txHash);
      } catch (err) {
        console.warn(`[confirmation] Chain query failed for ${txHash}:`, err);
        throw err; // BullMQ will retry
      }

      if (!txInfo) {
        // Tx not found — still in mempool or invalid
        await Transaction.findOneAndUpdate(
          { txHash },
          { $inc: { pollingAttempts: 1 }, $set: { lastPolledAt: new Date() } }
        );
        throw new Error(`TX ${txHash} not found on chain — retrying`);
      }

      // Determine required confirmations (high-value check)
      const adaValue = amountLovelace / 1_000_000;
      // Rough USD estimate using a fixed rate (no external call needed here)
      const requiredConfirmations =
        adaValue * 0.4 > HIGH_VALUE_THRESHOLD_USD
          ? HIGH_VALUE_CONFIRMATIONS
          : MIN_CONFIRMATIONS;

      const { confirmations } = txInfo;

      // Update transaction record
      await Transaction.findOneAndUpdate(
        { txHash },
        {
          $set: {
            blockHeight: txInfo.blockHeight,
            blockHash: txInfo.blockHash,
            slot: txInfo.slot,
            networkConfirmations: confirmations,
            lastPolledAt: new Date(),
            status: confirmations >= requiredConfirmations ? 'confirmed' : 'confirming',
          },
          $inc: { pollingAttempts: 1 },
        }
      );

      // Transition to "confirming" after first on-chain detection
      if (invoice.status === 'submitted' && confirmations >= 1) {
        await transitionInvoiceStatus(invoiceId, 'submitted', 'confirming', {
          networkConfirmations: confirmations,
        });
        // Slow down polling to 60s
        await job.updateProgress(1); // signal that we've seen the tx
      }

      // Not yet enough confirmations — retry
      if (confirmations < requiredConfirmations) {
        await job.updateData({
          ...job.data,
        });
        // Change delay to 60s for subsequent polls
        throw new Error(
          `${confirmations}/${requiredConfirmations} confirmations — polling again`
        );
      }

      // ── Confirmed! ────────────────────────────────────────────────────────────
      const verificationResult = verifyPayment(txInfo, paymentAddress, amountLovelace);

      // Update transaction
      await Transaction.findOneAndUpdate(
        { txHash },
        {
          $set: {
            status: 'confirmed',
            networkConfirmations: confirmations,
            amountLovelaceVerified: txInfo.totalOutputLovelace,
            verificationResult,
            confirmedAt: new Date(),
          },
        }
      );

      // Transition invoice to confirmed
      const confirmedInvoice = await transitionInvoiceStatus(
        invoiceId,
        invoice.status as 'submitted' | 'confirming',
        'confirmed',
        {
          amountLovelaceVerified: txInfo.totalOutputLovelace,
          verificationResult,
          networkConfirmations: confirmations,
        }
      );

      if (!confirmedInvoice) {
        console.warn(`[confirmation] Invoice ${invoiceId} concurrent update — skipping`);
        return;
      }

      // Fetch merchant for notification
      const merchant = await Merchant.findById(confirmedInvoice.merchantId);

      // Enqueue receipt + notifications
      await Promise.all([
        enqueueReceipt({ invoiceId, txHash }),
        enqueueNotification({
          type: 'payment-confirmed',
          merchantUserId: merchant?.userId?.toString(),
          customerUserId: confirmedInvoice.customerId?.toString(),
          invoiceId,
          amountPaise: confirmedInvoice.amountPaise,
          shopName: merchant?.shopName ?? 'Unknown',
        }),
      ]);

      console.log(`✅ [confirmation] Invoice ${invoiceId} confirmed after ${confirmations} blocks`);
    },
    {
      connection: bullMqRedis,
      concurrency: 10,
    }
  );

  worker.on('active', (job) => {
    console.log(`[confirmation] Job ${job.id} is now active`);
  });

  worker.on('completed', (job) => {
    console.log(`[confirmation] Job ${job.id} has completed`);
  });

  worker.on('failed', (job, err) => {
    if (job && !err.message.includes('not found on chain') && !err.message.includes('confirmations')) {
      console.error(`[confirmation] Job ${job.id} failed permanently:`, err.message);
    }
  });

  return worker;
}
