// backend/src/config/logger.ts
// Centralized structured logger — no external deps, uses console

export interface LogCtx {
  requestId?: string;
  invoiceId?: string;
  txHash?: string;
  workerId?: string;
  jobId?: string | undefined;
  userId?: string;
  [key: string]: string | number | boolean | undefined;
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isProd = process.env.NODE_ENV === 'production';

function format(level: LogLevel, msg: string, ctx?: LogCtx): string {
  const ts = new Date().toISOString();
  const ctxStr = ctx && Object.keys(ctx).length > 0 ? ' ' + JSON.stringify(ctx) : '';
  return `[${ts}] ${level.toUpperCase().padEnd(5)} ${msg}${ctxStr}`;
}

export const logger = {
  debug(msg: string, ctx?: LogCtx): void {
    if (!isProd) console.debug(format('debug', msg, ctx));
  },
  info(msg: string, ctx?: LogCtx): void {
    console.log(format('info', msg, ctx));
  },
  warn(msg: string, ctx?: LogCtx): void {
    console.warn(format('warn', msg, ctx));
  },
  error(msg: string, ctx?: LogCtx): void {
    console.error(format('error', msg, ctx));
  },
};
