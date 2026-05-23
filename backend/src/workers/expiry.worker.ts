import { Worker } from 'bullmq';
import { bullMqRedis } from '../config/redis';
import { expireStaleInvoices } from '../services/invoice.service';
import { expiryQueue } from '../queues/queue.definitions';

export async function startExpiryWorker(): Promise<Worker> {
  // Schedule repeatable job every 60 seconds
  // BullMQ v5: QueueScheduler is removed — jobs are self-scheduling
  await expiryQueue.add(
    'expire-check',
    {},
    {
      repeat: { every: 60_000 },
      jobId: 'expiry-repeatable',
    }
  );

  const worker = new Worker(
    'invoice-expiry',
    async () => {
      const expired = await expireStaleInvoices();
      if (expired > 0) {
        console.log(`[expiry] Expired ${expired} stale invoices`);
      }
    },
    {
      connection: bullMqRedis,
      concurrency: 1,
    }
  );

  worker.on('failed', (job, err) => {
    console.error(`[expiry] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
