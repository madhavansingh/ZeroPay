import { Queue, QueueOptions } from 'bullmq';
import { bullMqRedis } from '../config/redis';

const defaultQueueOptions: QueueOptions = {
  connection: bullMqRedis,
  defaultJobOptions: {
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
};

// ─── Queue definitions ────────────────────────────────────────────────────────

export const txConfirmationQueue = new Queue('tx-confirmation', {
  ...defaultQueueOptions,
  defaultJobOptions: {
    ...defaultQueueOptions.defaultJobOptions,
    attempts: 60,          // ~20 minutes with 20s delay
    backoff: { type: 'fixed', delay: 20_000 },
    delay: 20_000,         // first check after 20s
  },
});

export const receiptQueue = new Queue('receipt-generation', {
  ...defaultQueueOptions,
  defaultJobOptions: {
    ...defaultQueueOptions.defaultJobOptions,
    attempts: 3,
    backoff: { type: 'exponential', delay: 30_000 },
  },
});

export const notificationQueue = new Queue('notification-dispatch', {
  ...defaultQueueOptions,
  defaultJobOptions: {
    ...defaultQueueOptions.defaultJobOptions,
    attempts: 3,
    backoff: { type: 'fixed', delay: 5_000 },
  },
});

export const expiryQueue = new Queue('invoice-expiry', {
  ...defaultQueueOptions,
});

export const dailyStatsQueue = new Queue('daily-stats', {
  ...defaultQueueOptions,
});

// ─── Job payload types ────────────────────────────────────────────────────────

export interface TxConfirmationJobData {
  invoiceId: string;
  txHash: string;
  merchantId: string;
  customerId?: string;
  amountLovelace: number;
  paymentAddress: string;
}

export interface ReceiptJobData {
  invoiceId: string;
  txHash: string;
}

export interface NotificationJobData {
  type: 'payment-confirmed' | 'invoice-expired' | 'payment-incoming';
  merchantUserId?: string;
  customerUserId?: string;
  invoiceId: string;
  amountPaise: number;
  shopName: string;
}

// ─── Enqueue helpers ──────────────────────────────────────────────────────────

export async function enqueueTxConfirmation(data: TxConfirmationJobData): Promise<void> {
  await txConfirmationQueue.add('confirm', data, {
    jobId: `confirm:${data.invoiceId}`,
  });
}

export async function enqueueReceipt(data: ReceiptJobData): Promise<void> {
  await receiptQueue.add('generate', data, {
    jobId: `receipt:${data.invoiceId}`,
  });
}

export async function enqueueNotification(data: NotificationJobData): Promise<void> {
  await notificationQueue.add('dispatch', data);
}
