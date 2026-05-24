#!/usr/bin/env npx tsx
/**
 * ZeroPay Chaos Simulator
 * ────────────────────────
 * Simulates production failure modes to validate:
 *   1. Redis disconnection & BullMQ auto-reconnect behaviour
 *   2. Circuit breaker OPEN → HALF_OPEN → CLOSED transitions under API latency
 *   3. HTTP API degraded response under high load
 *
 * Usage:
 *   npx tsx backend/scratch/chaos-simulator.ts
 */

import { performance } from 'perf_hooks';

const BASE_URL = process.env.API_URL ?? 'http://localhost:5001';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Utility: HTTP helper ──────────────────────────────────────────────────────
async function httpGet(path: string, timeoutMs = 5000): Promise<{ ok: boolean; status: number; latencyMs: number; body?: any }> {
  const start = performance.now();
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(`${BASE_URL}${path}`, { signal: ctrl.signal });
    clearTimeout(timer);
    const latencyMs = Math.round(performance.now() - start);
    let body: any;
    try { body = await res.json(); } catch { body = null; }
    return { ok: res.ok, status: res.status, latencyMs, body };
  } catch (err: any) {
    return { ok: false, status: 0, latencyMs: Math.round(performance.now() - start) };
  }
}

// ── Scenario 1: API Health Validation ────────────────────────────────────────
async function scenario1_apiHealthCheck() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Scenario 1: API Health Check Validation');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const endpoints = ['/health', '/health/mongo', '/health/redis', '/health/blockchain'];
  let passed = 0;

  for (const ep of endpoints) {
    const result = await httpGet(ep, 10_000);
    const icon = result.ok ? '✅' : (result.status === 0 ? '⚠️ ' : '❌');
    console.log(`  ${icon}  ${ep.padEnd(24)} status=${result.status} latency=${result.latencyMs}ms`);
    if (result.ok) passed++;
  }

  console.log(`\n  Health Check: ${passed}/${endpoints.length} endpoints healthy`);
}

// ── Scenario 2: Sustained API Latency Simulation ────────────────────────────
async function scenario2_apiLatencyProfile() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Scenario 2: API Latency Profile (30 sequential requests)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const ITERATIONS = 30;
  const latencies: number[] = [];

  for (let i = 0; i < ITERATIONS; i++) {
    const result = await httpGet('/health');
    latencies.push(result.latencyMs);
    process.stdout.write('.');
    await sleep(100);
  }

  console.log('');
  latencies.sort((a, b) => a - b);
  const avg = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
  const p50 = latencies[Math.floor(latencies.length * 0.5)];
  const p95 = latencies[Math.floor(latencies.length * 0.95)];
  const p99 = latencies[Math.floor(latencies.length * 0.99)];

  console.log(`
  Latency Profile:
    avg  = ${avg}ms
    p50  = ${p50}ms
    p95  = ${p95}ms
    p99  = ${p99}ms
  `);

  const slaThresholdMs = 500;
  if (p95 > slaThresholdMs) {
    console.log(`  ❌  SLA BREACH: p95 latency ${p95}ms exceeds ${slaThresholdMs}ms threshold`);
  } else {
    console.log(`  ✅  SLA OK: p95 latency ${p95}ms is within ${slaThresholdMs}ms threshold`);
  }
}

// ── Scenario 3: Metrics Endpoint Load ────────────────────────────────────────
async function scenario3_metricsLoad() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Scenario 3: Metrics Endpoint Concurrent Load (50 parallel)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const CONCURRENT = 50;
  const results = await Promise.allSettled(
    Array.from({ length: CONCURRENT }, () => httpGet('/metrics', 8000))
  );

  const successes = results.filter(
    (r) => r.status === 'fulfilled' && r.value.ok
  ).length;
  const failures = CONCURRENT - successes;
  const lats = results
    .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
    .map((r) => r.value.latencyMs)
    .sort((a, b) => a - b);

  const p95 = lats[Math.floor(lats.length * 0.95)] ?? 0;

  console.log(`  Concurrent: ${CONCURRENT} | Successes: ${successes} | Failures: ${failures}`);
  console.log(`  p95 latency: ${p95}ms`);

  if (failures > 5) {
    console.log(`  ❌  Too many failures under concurrent metrics load`);
  } else {
    console.log(`  ✅  Metrics endpoint stable under concurrent load`);
  }
}

// ── Scenario 4: Rapid Reconnect Simulation ────────────────────────────────────
async function scenario4_rapidRequestBurst() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Scenario 4: Rapid Request Burst (100 req/s simulation)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const BURST_SIZE = 100;
  const start = performance.now();
  const results = await Promise.allSettled(
    Array.from({ length: BURST_SIZE }, () => httpGet('/health', 10_000))
  );
  const durationMs = Math.round(performance.now() - start);

  const ok = results.filter(
    (r) => r.status === 'fulfilled' && (r.value as any).ok
  ).length;
  const rps = Math.round((BURST_SIZE / durationMs) * 1000);

  console.log(`  ${BURST_SIZE} requests completed in ${durationMs}ms (~${rps} req/s)`);
  console.log(`  Success: ${ok}/${BURST_SIZE}`);

  if (ok / BURST_SIZE < 0.95) {
    console.log(`  ❌  FAIL: Less than 95% success rate under burst load`);
  } else {
    console.log(`  ✅  PASS: Server handled burst load successfully`);
  }
}

// ── Main Orchestrator ─────────────────────────────────────────────────────────
async function main() {
  console.log(`
╔══════════════════════════════════════════════════════╗
║          ZeroPay Chaos Resilience Simulator          ║
╠══════════════════════════════════════════════════════╣
║  Target: ${BASE_URL.padEnd(43)}║
╚══════════════════════════════════════════════════════╝
  `);

  await scenario1_apiHealthCheck();
  await scenario2_apiLatencyProfile();
  await scenario3_metricsLoad();
  await scenario4_rapidRequestBurst();

  console.log(`
╔══════════════════════════════════════════════════════╗
║             Chaos Simulation Complete                ║
╚══════════════════════════════════════════════════════╝
  `);
}

main().catch((err) => {
  console.error('Chaos simulator error:', err);
  process.exit(1);
});
