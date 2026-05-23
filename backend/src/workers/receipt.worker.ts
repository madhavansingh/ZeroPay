import { Worker, Job } from 'bullmq';
import axios from 'axios';
import { bullMqRedis } from '../config/redis';
import { env } from '../config/env';
import { Invoice } from '../models/Invoice';
import { Merchant } from '../models/Merchant';
import { User } from '../models/User';
import { transitionInvoiceStatus, injectChatMessage } from '../services/invoice.service';
import type { ReceiptJobData } from '../queues/queue.definitions';
import type { IpfsReceipt } from '@zeropay/shared-types';

async function pinReceiptToIPFS(receipt: IpfsReceipt): Promise<string> {
  const response = await axios.post<{ IpfsHash: string }>(
    'https://api.pinata.cloud/pinning/pinJSONToIPFS',
    {
      pinataContent: receipt,
      pinataMetadata: {
        name: `zeropay-receipt-${receipt.invoiceId}`,
        keyvalues: {
          invoiceId: receipt.invoiceId,
          txHash: receipt.txHash,
        },
      },
    },
    {
      headers: {
        Authorization: `Bearer ${env.PINATA_JWT}`,
        'Content-Type': 'application/json',
      },
      timeout: 30_000,
    }
  );

  return response.data.IpfsHash;
}

export function startReceiptWorker(): Worker {
  const worker = new Worker<ReceiptJobData>(
    'receipt-generation',
    async (job: Job<ReceiptJobData>) => {
      const { invoiceId, txHash } = job.data;

      const invoice = await Invoice.findOne({ invoiceId })
        .populate('merchantId')
        .populate('customerId');

      if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);
      if (invoice.status !== 'confirmed') {
        console.log(`[receipt] Invoice ${invoiceId} not confirmed — skipping`);
        return;
      }

      const merchant = await Merchant.findById(invoice.merchantId);
      if (!merchant) throw new Error(`Merchant not found for invoice ${invoiceId}`);

      const customer = invoice.customerId
        ? await User.findById(invoice.customerId)
        : null;

      // Build receipt document
      const receipt: IpfsReceipt = {
        version: '1.0',
        invoiceId: invoice.invoiceId,
        txHash,
        amountLovelace: invoice.amountLovelace,
        amountInr: invoice.amountPaise / 100,
        adaInrRate: invoice.adaInrRate,
        merchant: {
          merchantId: merchant.merchantId,
          shopName: merchant.shopName,
          paymentAddress: merchant.paymentAddress,
        },
        customer: {
          displayName: customer?.displayName ?? 'Anonymous',
          walletAddress: customer?.walletAddress,
        },
        confirmedAt: invoice.confirmedAt?.toISOString() ?? new Date().toISOString(),
        settledAt: new Date().toISOString(),
        networkConfirmations: invoice.networkConfirmations ?? 3,
      };

      // Pin to IPFS
      const cid = await pinReceiptToIPFS(receipt);

      // Transition to settled
      await transitionInvoiceStatus(invoiceId, 'confirmed', 'settled', {
        receiptCid: cid,
        receiptPending: false,
      });

      // Update merchant stats (atomic increment)
      await Merchant.findByIdAndUpdate(merchant._id, {
        $inc: {
          totalReceivedLovelace: invoice.amountLovelace,
          totalOrders: 1,
        },
      });

      // Inject receipt message into chat room
      if (invoice.chatRoomId) {
        await injectChatMessage(invoice.chatRoomId, 'receipt', {
          invoiceId,
          txHash,
          amountPaise: invoice.amountPaise,
          amountLovelace: invoice.amountLovelace,
          receiptCid: cid,
          ipfsUrl: `https://gateway.pinata.cloud/ipfs/${cid}`,
          settledAt: new Date().toISOString(),
        });
      }

      console.log(`✅ [receipt] Invoice ${invoiceId} settled. IPFS: ${cid}`);
    },
    {
      connection: bullMqRedis,
      concurrency: 10,
    }
  );

  worker.on('failed', async (job, err) => {
    if (job) {
      console.error(`[receipt] Job ${job.id} failed:`, err.message);
      // Mark receipt as pending so it can be retried manually
      await Invoice.findOneAndUpdate(
        { invoiceId: job.data.invoiceId },
        { $set: { receiptPending: true } }
      );
    }
  });

  return worker;
}
