import 'dotenv/config';
import { initSentry, Sentry } from './config/sentry';
// Init Sentry before everything else
initSentry();
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import basicAuth from 'express-basic-auth';

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
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      env: env.NODE_ENV,
      network: env.BLOCKFROST_NETWORK,
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

  // ── 404 + Error handlers ─────────────────────────────────────────────────────
  app.use(notFound);
  app.use(errorHandler);
  // Sentry must be last — after all routes and error handlers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.use(Sentry.expressErrorHandler() as any);

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
  await startExpiryWorker();
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
