import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import {
  txConfirmationQueue,
  receiptQueue,
  notificationQueue,
  expiryQueue,
  dailyStatsQueue,
} from '../queues/queue.definitions';

export function createAdminRouter() {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [
      new BullMQAdapter(txConfirmationQueue),
      new BullMQAdapter(receiptQueue),
      new BullMQAdapter(notificationQueue),
      new BullMQAdapter(expiryQueue),
      new BullMQAdapter(dailyStatsQueue),
    ],
    serverAdapter,
  });

  return serverAdapter.getRouter();
}
