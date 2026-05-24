import 'dotenv/config';
import { initSentry, Sentry } from './config/sentry';
// Init Sentry before everything else
initSentry();
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import basicAuth from 'express-basic-auth';
import mongoose from 'mongoose';

import { env } from './config/env';
import { connectDatabase } from './config/db';
import { initFirebase } from './config/firebase-admin';
import { bullMqRedis } from './config/redis';

import authRoutes from './routes/auth.routes';
import merchantRoutes from './routes/merchant.routes';
import invoiceRoutes from './routes/invoice.routes';
import paymentRoutes from './routes/payment.routes';
import priceRoutes from './routes/price.routes';
import chatRoutes from './routes/chat.routes';
import dashboardRoutes from './routes/dashboard.routes';

import { errorHandler, notFound } from './middleware/errorHandler';
import { startConfirmationWorker } from './workers/confirmation.worker';
import { startReceiptWorker } from './workers/receipt.worker';
import { startNotificationWorker } from './workers/notification.worker';
import { startExpiryWorker } from './workers/expiry.worker';
import { startDailyStatsWorker } from './workers/dailyStats.worker';
import { dailyStatsQueue } from './queues/queue.definitions';
import { createAdminRouter } from './admin/bullboard';

async function bootstrap(): Promise<void> {
  initFirebase();
  await connectDatabase();

  const app = express();

  app.set('trust proxy', 1);

  app.use(helmet({
    // Allow Bull Board UI assets
    contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
  }));
  app.use(
    cors({
      origin: env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()),
      credentials: true,
    })
  );
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // ── Health check ─────────────────────────────────────────────────────────────
  app.get('/health', async (_req, res) => {
    const mongoConnected = mongoose.connection.readyState === 1;
    let redisConnected = false;
    try {
      const isReady = bullMqRedis.status === 'ready';
      const ping = await bullMqRedis.ping();
      redisConnected = isReady && ping === 'PONG';
    } catch (err) {
      console.error('[health] Redis ping failed:', err);
    }

    const isHealthy = mongoConnected && redisConnected;

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      env: env.NODE_ENV,
      network: env.BLOCKFROST_NETWORK,
      services: {
        mongodb: mongoConnected ? 'connected' : 'disconnected',
        redis: redisConnected ? 'connected' : 'disconnected',
      },
    });
  });

  // ── Bull Board admin UI (basic auth protected) ────────────────────────────
  const adminUser = process.env.ADMIN_USERNAME ?? 'zeropay-admin';
  const adminPass = process.env.ADMIN_PASSWORD ?? 'changeme-in-production';

  app.use(
    '/admin/queues',
    basicAuth({
      users: { [adminUser]: adminPass },
      challenge: true,
      realm: 'ZeroPay Admin',
    }),
    createAdminRouter()
  );

  // ── API routes ───────────────────────────────────────────────────────────────
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/merchant', merchantRoutes);
  app.use('/api/v1/merchant', dashboardRoutes);   // GET /api/v1/merchant/dashboard
  app.use('/api/v1/invoices', invoiceRoutes);
  app.use('/api/v1/payments', paymentRoutes);
  app.use('/api/v1/price', priceRoutes);
  app.use('/api/v1/chat', chatRoutes);

  // ── Sentry Error Handler (Must be registered BEFORE custom error handlers) ───
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.use(Sentry.expressErrorHandler() as any);

  // ── 404 + Custom error handlers ──────────────────────────────────────────────
  app.use(notFound);
  app.use(errorHandler);

  // ── Start server ──────────────────────────────────────────────────────────────
  const server = app.listen(env.PORT, () => {
    console.log(`🚀 ZeroPay API  →  http://localhost:${env.PORT}  [${env.NODE_ENV}]`);
    console.log(`   Cardano:      ${env.BLOCKFROST_NETWORK}`);
    console.log(`   Admin UI:     http://localhost:${env.PORT}/admin/queues`);
  });

  // ── BullMQ workers ────────────────────────────────────────────────────────────
  startConfirmationWorker();
  startReceiptWorker();
  startNotificationWorker();
  startDailyStatsWorker();
  await startExpiryWorker();

  // Schedule nightly stats sync at 00:05 IST (18:35 UTC)
  await dailyStatsQueue.add(
    'nightly-sync',
    {},
    {
      repeat: { pattern: '35 18 * * *' }, // 00:05 IST daily
      jobId: 'daily-stats-nightly',
      removeOnComplete: { count: 7 },
      removeOnFail: { count: 30 },
    }
  );

  console.log('✅ All BullMQ workers started');

  // ── Graceful shutdown ─────────────────────────────────────────────────────────
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n[${signal}] Shutting down gracefully...`);
    server.close(async () => {
      await bullMqRedis.quit();
      console.log('✅ Shutdown complete');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('❌ Bootstrap failed:', err);
  process.exit(1);
});
