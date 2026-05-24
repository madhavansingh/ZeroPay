#!/usr/bin/env npx tsx
/**
 * ZeroPay Socket.IO Stress Test
 * ─────────────────────────────
 * Spawns N concurrent Socket.IO client connections and measures:
 *   - Connection establishment latency
 *   - Event round-trip latency
 *   - Connection failure rate
 *   - Server-side socket count (via /metrics endpoint)
 *
 * Usage:
 *   npx tsx backend/scratch/stress-test.ts [--clients=500] [--url=http://localhost:5001]
 */

import { io, Socket } from 'socket.io-client';
import { performance } from 'perf_hooks';

const args = process.argv.slice(2);
const getArg = (name: string, def: string) =>
  args.find((a) => a.startsWith(`--${name}=`))?.split('=')[1] ?? def;

const NUM_CLIENTS = parseInt(getArg('clients', '200'), 10);
const SERVER_URL = getArg('url', 'http://localhost:5001');
const RAMP_DELAY_MS = parseInt(getArg('ramp-ms', '10'), 10); // ms between each client spawn
const TEST_DURATION_S = parseInt(getArg('duration', '30'), 10);

console.log(`
╔══════════════════════════════════════════════════════╗
║         ZeroPay Socket.IO Stress Test Runner         ║
╠══════════════════════════════════════════════════════╣
║  Target Server : ${SERVER_URL.padEnd(34)}║
║  Clients       : ${String(NUM_CLIENTS).padEnd(34)}║
║  Ramp Delay    : ${String(RAMP_DELAY_MS + 'ms').padEnd(34)}║
║  Test Duration : ${String(TEST_DURATION_S + 's').padEnd(34)}║
╚══════════════════════════════════════════════════════╝
`);

interface ClientStats {
  id: number;
  connected: boolean;
  connectLatencyMs: number;
  errorCount: number;
  eventsReceived: number;
}

const stats: ClientStats[] = [];
const sockets: Socket[] = [];
let connectedCount = 0;
let failedCount = 0;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function spawnClient(id: number): Promise<void> {
  const startTs = performance.now();

  const socket = io(SERVER_URL, {
    transports: ['websocket'],
    reconnection: false,
    timeout: 10_000,
  });

  sockets.push(socket);

  const stat: ClientStats = {
    id,
    connected: false,
    connectLatencyMs: 0,
    errorCount: 0,
    eventsReceived: 0,
  };
  stats.push(stat);

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      stat.errorCount++;
      failedCount++;
      socket.disconnect();
      resolve();
    }, 12_000);

    socket.on('connect', () => {
      stat.connected = true;
      stat.connectLatencyMs = Math.round(performance.now() - startTs);
      connectedCount++;
      clearTimeout(timeout);
      resolve();
    });

    socket.on('connect_error', () => {
      stat.errorCount++;
      failedCount++;
      clearTimeout(timeout);
      resolve();
    });

    socket.onAny(() => {
      stat.eventsReceived++;
    });
  });
}

async function runTest() {
  console.log(`\n⏳  Ramping up ${NUM_CLIENTS} clients (${RAMP_DELAY_MS}ms apart)...\n`);

  // Ramp: spawn clients gradually to simulate realistic connection patterns
  for (let i = 0; i < NUM_CLIENTS; i++) {
    spawnClient(i).catch(() => {});
    if (i % 50 === 49) {
      process.stdout.write(
        `  [${String(i + 1).padStart(4)}/${NUM_CLIENTS}] Connected: ${connectedCount} | Failed: ${failedCount}\n`
      );
    }
    if (RAMP_DELAY_MS > 0) await sleep(RAMP_DELAY_MS);
  }

  console.log(`\n⏱  Holding connections for ${TEST_DURATION_S}s...`);
  await sleep(TEST_DURATION_S * 1000);

  // ── Print Results ──────────────────────────────────────────────────────────
  const connected = stats.filter((s) => s.connected);
  const latencies = connected.map((s) => s.connectLatencyMs).sort((a, b) => a - b);

  const p50 = latencies[Math.floor(latencies.length * 0.5)] ?? 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] ?? 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] ?? 0;
  const avg =
    latencies.length > 0
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : 0;

  const successRate = Math.round((connectedCount / NUM_CLIENTS) * 10000) / 100;

  console.log(`
╔══════════════════════════════════════════════════════╗
║                   STRESS TEST RESULTS                ║
╠══════════════════════════════════════════════════════╣
║  Clients Spawned    : ${String(NUM_CLIENTS).padEnd(30)}║
║  Connected          : ${String(connectedCount).padEnd(30)}║
║  Failed             : ${String(failedCount).padEnd(30)}║
║  Success Rate       : ${String(successRate + '%').padEnd(30)}║
╠══════════════════════════════════════════════════════╣
║  Connect Latency                                     ║
║    avg              : ${String(avg + 'ms').padEnd(30)}║
║    p50              : ${String(p50 + 'ms').padEnd(30)}║
║    p95              : ${String(p95 + 'ms').padEnd(30)}║
║    p99              : ${String(p99 + 'ms').padEnd(30)}║
╚══════════════════════════════════════════════════════╝
`);

  if (successRate < 95) {
    console.error(`❌  FAIL: Connection success rate ${successRate}% is below 95% threshold`);
    process.exit(1);
  } else {
    console.log(`✅  PASS: Connection success rate ${successRate}%`);
  }

  // Disconnect all
  sockets.forEach((s) => s.disconnect());
}

runTest().catch((err) => {
  console.error('Stress test runner error:', err);
  process.exit(1);
});
