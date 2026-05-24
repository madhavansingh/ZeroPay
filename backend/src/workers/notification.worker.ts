import { Worker, Job } from 'bullmq';
import { bullMqRedis } from '../config/redis';
import { sendPushToUser } from '../services/notification.service';
import type { NotificationJobData } from '../queues/queue.definitions';

export function startNotificationWorker(): Worker {
  const worker = new Worker<NotificationJobData>(
    'notification-dispatch',
    async (job: Job<NotificationJobData>) => {
      const { type, merchantUserId, customerUserId, invoiceId, amountPaise, shopName } = job.data;
      const amountInr = (amountPaise / 100).toFixed(2);

      if (type === 'payment-confirmed') {
        const notifications = [];

        if (merchantUserId) {
          notifications.push(
            sendPushToUser(merchantUserId, {
              title: '✅ Payment Received!',
              body: `₹${amountInr} received at ${shopName}`,
              data: { type: 'payment-confirmed', invoiceId },
            })
          );
        }

        if (customerUserId) {
          notifications.push(
            sendPushToUser(customerUserId, {
              title: '✅ Payment Confirmed',
              body: `Your payment of ₹${amountInr} to ${shopName} is confirmed`,
              data: { type: 'payment-confirmed', invoiceId },
            })
          );
        }

        await Promise.all(notifications);
      } else if (type === 'payment-incoming') {
        if (merchantUserId) {
          await sendPushToUser(merchantUserId, {
            title: '💳 Payment Incoming',
            body: `₹${amountInr} payment submitted at ${shopName}`,
            data: { type: 'payment-incoming', invoiceId },
          });
        }
      } else if (type === 'invoice-expired') {
        if (merchantUserId) {
          await sendPushToUser(merchantUserId, {
            title: '⏰ Invoice Expired',
            body: `Payment request for ₹${amountInr} expired`,
            data: { type: 'invoice-expired', invoiceId },
          });
        }
      }
    },
    {
      connection: bullMqRedis,
      concurrency: 10,
    }
  );

  worker.on('active', (job) => {
    console.log(`[notification] Job ${job.id} is now active`);
  });

  worker.on('completed', (job) => {
    console.log(`[notification] Job ${job.id} has completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[notification] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
