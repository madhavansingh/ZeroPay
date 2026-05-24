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

let tempRedis: IORedis;

try {
  if (env.UPSTASH_REDIS_TLS_URL.includes(',')) {
    const nodes = env.UPSTASH_REDIS_TLS_URL.split(',').map((n) => n.trim());
    tempRedis = new IORedis.Cluster(nodes, {
      redisOptions: {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        tls: {},
      },
    }) as any;
    logger.info('BullMQ Redis Cluster initialized');
  } else {
    tempRedis = new IORedis(env.UPSTASH_REDIS_TLS_URL, {
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false,
      tls: {},
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });
  }
} catch (err: any) {
  logger.error('Failed to initialize primary BullMQ Redis connection, attempting fallback', { detail: err.message });
  tempRedis = new IORedis(env.UPSTASH_REDIS_TLS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    tls: {},
    retryStrategy: (times) => Math.min(times * 100, 3000),
  });
}

export const bullMqRedis = tempRedis;

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
  rateLimitAI: (userId: string) => `ratelimit:ai:${userId}`,
  rateLimitUpload: (userId: string) => `ratelimit:upload:${userId}`,
  rateLimitDispute: (userId: string) => `ratelimit:dispute:${userId}`,
  storefrontProfile: (slug: string) => `storefront:${slug}`,
  marketplaceFeed: (city: string) => `marketplace:feed:${city}`,
  marketplaceTrending: () => 'marketplace:trending',
  reputation: (walletAddress: string) => `reputation:${walletAddress}`,
  rateLimitDeveloper: (keyId: string) => `ratelimit:developer:${keyId}`,
} as const;

export const cacheTtl = {
  adaInrRate: 60,          // 60 seconds
  merchantProfile: 300,    // 5 minutes
  dailyStats: 90000,       // 25 hours
  storefrontProfile: 600,  // 10 minutes
  marketplaceFeed: 300,    // 5 minutes
  marketplaceTrending: 60, // 1 minute
  reputation: 600,         // 10 minutes
} as const;
