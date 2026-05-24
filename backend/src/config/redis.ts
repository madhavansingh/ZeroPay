import { Redis } from '@upstash/redis';
import IORedis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

// ─── HTTP Redis (Upstash REST — for caching, rate limiting) ──────────────────
// Used with @upstash/redis — works in serverless, stateless requests

export const upstashRedis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

// ─── TLS IORedis (for BullMQ — requires persistent TCP connection) ────────────
// BullMQ cannot use HTTP Redis. This uses ioredis over TLS.

export const bullMqRedis = new IORedis(env.UPSTASH_REDIS_TLS_URL, {
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
  tls: {},
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

bullMqRedis.on('connect', () => logger.info('BullMQ Redis connected'));
bullMqRedis.on('error', (err) => logger.error('BullMQ Redis error', { detail: err instanceof Error ? err.message : String(err) }));

// ─── Cache helpers ────────────────────────────────────────────────────────────

export const cacheKeys = {
  adaInrRate: () => 'price:ada-inr',
  adaInrRateFallback: () => 'price:ada-inr:last-known',
  merchantProfile: (merchantId: string) => `merchant:profile:${merchantId}`,
  dailyStats: (merchantId: string, date: string) => `stats:daily:${merchantId}:${date}`,
  rateLimitAuth: (ip: string) => `ratelimit:auth:${ip}`,
  rateLimitInvoice: (userId: string) => `ratelimit:invoice:${userId}`,
  rateLimitPayment: (userId: string) => `ratelimit:payment:${userId}`,
} as const;

export const cacheTtl = {
  adaInrRate: 60,          // 60 seconds
  merchantProfile: 300,    // 5 minutes
  dailyStats: 90000,       // 25 hours
} as const;
