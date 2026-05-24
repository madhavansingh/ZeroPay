# ZeroPay Production Operations Runbook

**Version:** 1.0  
**Last Updated:** 2026-05-25  
**Maintained by:** ZeroPay Platform Engineering Team

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Pre-Deployment Checklist](#2-pre-deployment-checklist)
3. [Docker Compose Deployment Guide](#3-docker-compose-deployment-guide)
4. [Environment Variables Reference](#4-environment-variables-reference)
5. [Health Check & Monitoring Endpoints](#5-health-check--monitoring-endpoints)
6. [SLA / SLO Targets & Alerting](#6-sla--slo-targets--alerting)
7. [Disaster Recovery Protocols](#7-disaster-recovery-protocols)
   - [7.1 Redis Outage Recovery](#71-redis-outage-recovery)
   - [7.2 MongoDB Outage Recovery](#72-mongodb-outage-recovery)
   - [7.3 Blockfrost API Failure](#73-blockfrost-api-failure)
   - [7.4 Pinata IPFS Failure](#74-pinata-ipfs-failure)
8. [Manual Escrow Recovery Protocol](#8-manual-escrow-recovery-protocol)
9. [BullMQ Queue Management](#9-bullmq-queue-management)
10. [Scaling Procedures](#10-scaling-procedures)
11. [Security Incident Response](#11-security-incident-response)
12. [Common Troubleshooting Runbooks](#12-common-troubleshooting-runbooks)

---

## 1. System Architecture Overview

```
Internet
    │
    ▼
[ Nginx / CDN ] ──── apps/web (Vite SPA)
    │
    ▼
[ zeropay-api ] ─── Express + Socket.IO (Port 5001)
    │         │
    │         └── BullMQ Queue Producer
    │
    ├── MongoDB Atlas / Replica Set
    ├── Redis (Upstash TLS / self-hosted with AOF)
    ├── Blockfrost Cardano API
    ├── Pinata IPFS
    ├── Firebase Admin SDK
    └── Gemini AI API

[ zeropay-worker ] ── BullMQ Consumers (decoupled process)
    ├── Confirmation Worker
    ├── Receipt Worker
    ├── Notification Worker
    ├── Expiry Worker
    ├── Reconciliation Worker
    ├── Daily Stats Worker
    ├── Dispute Resolution Worker
    └── Webhook Delivery Worker
```

The API server and Worker server are **intentionally separate processes** to allow independent horizontal scaling. The worker consumes from the same Redis-backed BullMQ queues the API produces to.

---

## 2. Pre-Deployment Checklist

Before deploying to production, verify the following:

- [ ] All environment variables in `backend/.env` are populated (see Section 4)
- [ ] MongoDB Atlas cluster is accessible and credentials are correct
- [ ] Upstash Redis credentials (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_TLS_URL`) are valid
- [ ] Blockfrost project ID matches the target network (`mainnet` vs `preprod`)
- [ ] Pinata JWT token is valid and has pinning permissions
- [ ] Firebase Admin SDK service account JSON is available
- [ ] Gemini API key has quota for production traffic
- [ ] Sentry DSN is configured (errors will not report otherwise)
- [ ] Escrow script address (`ESCROW_SCRIPT_ADDRESS`) matches deployed Plutus V3 validator hash
- [ ] Admin credentials (`ADMIN_USERNAME`, `ADMIN_PASSWORD`) have been changed from defaults
- [ ] Run `npm run type-check` — must complete with **0 errors**
- [ ] Run `npm test --workspace=backend` — all tests must pass
- [ ] Run `npm run build` — both backend and web must compile cleanly

---

## 3. Docker Compose Deployment Guide

### First-time Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-org/zeropay.git
cd zeropay

# 2. Copy and configure backend environment
cp backend/.env.example backend/.env
# Edit backend/.env with your production values

# 3. Build and start all containers in detached mode
docker compose up --build -d

# 4. Verify all containers are healthy
docker compose ps

# 5. Check logs for startup errors
docker compose logs zeropay-api --tail=50
docker compose logs zeropay-worker --tail=50
```

### Expected Healthy State

```
NAME              STATUS              PORTS
zeropay-mongo     healthy             0.0.0.0:27017->27017/tcp
zeropay-redis     healthy             0.0.0.0:6379->6379/tcp
zeropay-api       healthy             0.0.0.0:5001->5001/tcp
zeropay-worker    running
zeropay-web       healthy             0.0.0.0:3000->80/tcp
```

### Rolling Update (Zero-Downtime)

```bash
# 1. Pull latest code
git pull origin main

# 2. Rebuild only updated services
docker compose up --build -d zeropay-api zeropay-worker zeropay-web

# 3. Monitor logs
docker compose logs -f zeropay-api
```

### Stopping Services

```bash
# Graceful stop (preserves data volumes)
docker compose down

# Full reset (WARNING: DESTROYS ALL DATA VOLUMES)
docker compose down -v
```

---

## 4. Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `PORT` | ✅ | HTTP server port (default: 5001) |
| `NODE_ENV` | ✅ | `production` or `development` |
| `MONGODB_URI` | ✅ | Full MongoDB connection URI (e.g. `mongodb+srv://...`) |
| `UPSTASH_REDIS_REST_URL` | ✅ | Upstash REST URL for caching and rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ | Upstash REST auth token |
| `UPSTASH_REDIS_TLS_URL` | ✅ | Upstash TCP/TLS URL for BullMQ persistent queues |
| `BLOCKFROST_PROJECT_ID` | ✅ | Blockfrost API project ID |
| `BLOCKFROST_NETWORK` | ✅ | `mainnet`, `preprod`, or `preview` |
| `PINATA_JWT` | ✅ | Pinata cloud JWT for IPFS pinning |
| `FIREBASE_PROJECT_ID` | ✅ | Firebase project identifier |
| `FIREBASE_PRIVATE_KEY` | ✅ | Firebase Admin SDK private key (PEM format) |
| `FIREBASE_CLIENT_EMAIL` | ✅ | Firebase Admin SDK service account email |
| `FIREBASE_DATABASE_URL` | ✅ | Firebase Realtime Database URL |
| `JWT_SECRET` | ✅ | Min 64-char secret for signing ZeroPay session tokens |
| `ESCROW_SCRIPT_ADDRESS` | ✅ | Deployed Plutus V3 escrow script address on the network |
| `PLATFORM_FEE_PERCENT` | ✅ | Platform fee % deducted from escrow releases (e.g. `1.5`) |
| `ALLOWED_ORIGINS` | ✅ | Comma-separated list of allowed CORS origins |
| `GEMINI_API_KEY` | ✅ | Google AI Gemini API key for AI features |
| `SENTRY_DSN` | ⚠️ | Sentry error reporting DSN (optional but recommended) |
| `ADMIN_USERNAME` | ✅ | Bull Board admin UI username |
| `ADMIN_PASSWORD` | ✅ | Bull Board admin UI password |

---

## 5. Health Check & Monitoring Endpoints

### Public Health Routes

| Endpoint | Description | Expected Response |
|---|---|---|
| `GET /health` | Overall system health aggregation | `{ ok: true, services: {...} }` |
| `GET /health/mongo` | MongoDB connectivity check | `{ status: 'ok' }` |
| `GET /health/redis` | Redis connectivity check | `{ status: 'ok' }` |
| `GET /health/blockchain` | Blockfrost API reachability (30s cached) | `{ status: 'ok', latencyMs: N }` |
| `GET /health/queues` | BullMQ queue depth report | `{ queues: {...} }` |

### Admin Monitoring

| Endpoint | Auth Required | Description |
|---|---|---|
| `GET /metrics` | No | Prometheus-format metrics (request rates, socket counts, circuit breaker states, queue depths) |
| `GET /admin/queues` | Basic Auth | Bull Board real-time queue management UI |
| `GET /api/v1/ops/slo` | JWT + Admin role | JSON SLO compliance report |
| `GET /api/v1/ops/slo/prometheus` | JWT + Admin role | Prometheus SLO metrics export |

---

## 6. SLA / SLO Targets & Alerting

### Service Level Objectives

| Metric | Target | Alert Threshold | Critical Threshold |
|---|---|---|---|
| Escrow settlement success rate | ≥ 95% | < 95% | < 80% |
| API p95 response latency | ≤ 500ms | > 500ms | > 2000ms |
| Escrow lock confirmation latency | ≤ 120s | > 120s | > 240s |
| Dispute resolution MTTR | ≤ 24 hours | > 24h | > 48h |
| Risk block rate (false positives) | ≤ 5% | > 5% | > 20% |
| Background queue processing lag | ≤ 30s | > 30s | > 5 min |

### Alerting Integration

For production deployments, configure Grafana alerts to scrape `/metrics` and `/api/v1/ops/slo/prometheus` endpoints:

```yaml
# Example Prometheus scrape config
scrape_configs:
  - job_name: zeropay_api
    static_configs:
      - targets: ['zeropay-api:5001']
    metrics_path: /metrics
    scrape_interval: 15s
```

---

## 7. Disaster Recovery Protocols

### 7.1 Redis Outage Recovery

**Symptoms:** BullMQ workers fail to process jobs; rate limiting bypasses (fail-open); caching misses; elevated latency.

**Diagnosis:**
```bash
# Check Redis container status
docker compose ps redis

# Check Redis logs
docker compose logs redis --tail=50

# Test Redis connectivity manually
docker compose exec redis redis-cli ping
```

**Recovery Steps:**
1. **If Redis container is down:** Restart it
   ```bash
   docker compose restart redis
   # Wait for healthy status
   docker compose ps redis
   ```
2. **If Redis data is corrupted:** Clear AOF and restart
   ```bash
   docker compose stop redis
   docker compose run --rm redis redis-server --appendonly no
   docker compose up -d redis
   ```
3. **BullMQ jobs lost:** BullMQ uses delayed job persistence. Upon Redis reconnection, active workers automatically reattempt failed jobs. Check the Bull Board UI at `/admin/queues` to monitor recovery.
4. **Rate limits bypass:** During Redis outage, rate limiters `fail-open`. Monitor `/metrics` for unusual request spikes and check application logs for `[RateLimit]` bypass warnings.

> **RTO Target:** < 5 minutes for Redis restart  
> **RPO:** No job loss — BullMQ stalled jobs are auto-retried upon reconnection

---

### 7.2 MongoDB Outage Recovery

**Symptoms:** All API endpoints return 500 errors; worker jobs fail to persist state changes.

**Diagnosis:**
```bash
docker compose logs mongodb --tail=100
docker compose exec mongodb mongosh --eval "db.adminCommand('ping')"
```

**Recovery Steps:**
1. Restart the MongoDB container:
   ```bash
   docker compose restart mongodb
   ```
2. If using MongoDB Atlas, check the Atlas Status page and trigger a manual failover from the Atlas console if needed.
3. After reconnection, Mongoose automatically re-establishes the connection pool. Monitor logs for `MongoDB reconnected` messages.
4. Run a data integrity check:
   ```bash
   docker compose exec mongodb mongosh zeropay --eval "db.invoices.countDocuments()"
   ```

> **RTO Target:** < 10 minutes  
> **RPO:** Dependent on MongoDB Atlas replication lag (typically < 1s for Atlas M10+)

---

### 7.3 Blockfrost API Failure

**Symptoms:** Escrow lock confirmations stall; `/health/blockchain` returns `degraded`.

**Response:**
1. The circuit breaker automatically trips to `OPEN` state after 2 consecutive Blockfrost failures.
2. During `OPEN` state:
   - New escrow lock confirmations are **queued in BullMQ** and retried after the cooldown period.
   - Customers receive a "confirmation pending" state — escrow funds remain safely locked on-chain.
3. Check circuit state via `/metrics` endpoint: `zeropay_circuit_state{breaker="blockfrost"}`.
4. Monitor Blockfrost status: https://status.blockfrost.io
5. Once Blockfrost recovers, the circuit transitions automatically to `HALF_OPEN` then `CLOSED`.

**If Blockfrost is down >1 hour:** Contact Blockfrost support and consider temporarily switching `BLOCKFROST_PROJECT_ID` to a backup project pointing to Koios or another provider.

---

### 7.4 Pinata IPFS Failure

**Symptoms:** Receipt generation jobs fail; evidence upload returns 503.

**Response:**
1. The Pinata circuit breaker trips to `OPEN` after consecutive failures.
2. Receipt jobs in BullMQ have a retry policy with exponential backoff — they will automatically retry when Pinata recovers.
3. Evidence uploads will return a `503` response to clients with a retry advisory.
4. Monitor Pinata status: https://status.pinata.cloud

---

## 8. Manual Escrow Recovery Protocol

> ⚠️ **CRITICAL: Only execute this procedure if automated reconciliation has failed and funds are demonstrably stuck on-chain.**

### When to Use
- Automated confirmation polling has stopped and a UTxO is confirmed on-chain but the database still shows `Locked`.
- An escrow has passed its timeout period but the expiry worker failed to process the refund.

### Prerequisites
- Access to `PLATFORM_ADMIN_KEY` — the Cardano signing key with admin authority over the escrow script.
- The target `invoiceId`.
- The `scriptUtxoTxHash` and `scriptUtxoIndex` of the stuck UTxO (query via Blockfrost or `cardano-cli`).

### Steps

1. **Identify the stuck UTxO via Blockfrost:**
   ```bash
   curl -H "project_id: $BLOCKFROST_PROJECT_ID" \
     https://cardano-mainnet.blockfrost.io/api/v0/addresses/$ESCROW_SCRIPT_ADDRESS/utxos
   ```

2. **Trigger manual admin resolution via API:**
   ```bash
   # First authenticate as admin
   ADMIN_TOKEN=$(curl -s -X POST $API_URL/api/v1/auth/login \
     -H 'Content-Type: application/json' \
     -d '{"phone": "$ADMIN_PHONE", "firebaseToken": "$FIREBASE_TOKEN"}' \
     | jq -r '.data.token')

   # Trigger admin resolution
   curl -X POST $API_URL/api/v1/escrow/$INVOICE_ID/resolve \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -H 'Content-Type: application/json' \
     -d '{
       "resolution": "refund_customer",
       "adminNote": "Manual recovery: automated expiry worker failed",
       "scriptUtxoTxHash": "$TX_HASH",
       "scriptUtxoIndex": 0
     }'
   ```

3. **Submit the resolution transaction:**
   Use the unsigned CBOR returned by the resolve endpoint, sign with the platform admin key, and submit via the `/resolve/submit` endpoint.

4. **Verify state recovery:**
   ```bash
   curl $API_URL/api/v1/escrow/$INVOICE_ID/status
   ```
   Should return `{ escrowState: "Resolved" }`.

5. **Log the incident** in `ProtocolAuditLog` by ensuring the resolve API was called (it does this automatically).

---

## 9. BullMQ Queue Management

### Bull Board UI
Access the real-time queue management dashboard at `/admin/queues` using the configured `ADMIN_USERNAME` and `ADMIN_PASSWORD`.

### Queue Inventory

| Queue Name | Purpose | Retry Policy |
|---|---|---|
| `tx-confirmation` | Poll Blockfrost for escrow lock confirmations | 10 retries, exponential backoff |
| `receipt-generation` | Pin IPFS receipts to Pinata on settlement | 5 retries |
| `notification` | Send Firebase push notifications | 3 retries |
| `invoice-expiry` | Mark expired pending invoices | 3 retries |
| `daily-stats` | Aggregate merchant daily analytics | 2 retries |
| `dispute-resolution` | AI-powered dispute auto-verdict processing | 5 retries |
| `webhook-delivery` | Deliver HMAC-signed webhook payloads | 10 retries, auto-deactivate after 10 failures |
| `reconciliation` | Reconcile on-chain UTxO state with MongoDB | 5 retries |

### Manual Queue Draining

```bash
# Clear all failed jobs from a specific queue via Bull Board UI
# Or via redis-cli:
docker compose exec redis redis-cli
> KEYS bull:tx-confirmation:* | grep failed
> DEL bull:tx-confirmation:failed
```

### Stalled Job Recovery

If workers crash mid-execution, BullMQ marks jobs as `stalled`. Upon worker restart, stalled jobs are automatically moved back to `waiting` and retried. Monitor via the Bull Board stalled count panel.

---

## 10. Scaling Procedures

### Horizontal Worker Scaling

To add more worker replicas during high queue throughput:

```bash
# Scale workers to 3 instances
docker compose up --scale zeropay-worker=3 -d

# Monitor worker activity
docker compose logs zeropay-worker -f
```

### API Server Scaling

For high HTTP request volumes, scale the API server and add a load balancer (e.g. Nginx upstream or AWS ALB):

```bash
docker compose up --scale zeropay-api=3 -d
```

> Note: Socket.IO sticky sessions must be configured on the load balancer when running multiple API replicas.

### Redis Scaling

For high-volume deployments (>10,000 transactions/day), switch from single-node Redis to Upstash Pro cluster or a managed Redis Cluster. Update `UPSTASH_REDIS_TLS_URL` to a comma-separated list of cluster node URLs.

---

## 11. Security Incident Response

### Suspected API Key Compromise

1. Immediately revoke the compromised key via `DELETE /api/v1/developer/keys/:keyId` (admin only).
2. Review `ProtocolAuditLog` for any unusual API key activity in the past 7 days.
3. Rotate `JWT_SECRET` in the environment and restart the API server.
4. Notify affected merchants.

### High Risk Score Alert (Risk Block Rate > 20%)

1. Query `/api/v1/ops/slo` to review the `riskBlockRatePct` metric.
2. Review recent `RiskAssessmentAnomaly` entries in `ProtocolAuditLog`.
3. If a coordinated wallet attack is detected, manually block specific wallet patterns by adding them to a blocklist and redeploying.
4. Increase sliding window thresholds in `riskScorer.ts` if false positives are too high.

### Data Breach Protocol

1. Immediately revoke all active JWT tokens by rotating `JWT_SECRET`.
2. Revoke Firebase credentials and generate new service account keys.
3. Audit `ProtocolAuditLog` for unauthorized access patterns.
4. Notify users per GDPR/regulatory requirements within 72 hours.

---

## 12. Common Troubleshooting Runbooks

### Problem: API returns 503 on all routes

```bash
# 1. Check container health
docker compose ps

# 2. Check API logs
docker compose logs zeropay-api --tail=100

# 3. Check MongoDB connection
curl http://localhost:5001/health/mongo

# 4. Check Redis connection  
curl http://localhost:5001/health/redis

# 5. Restart if needed
docker compose restart zeropay-api
```

### Problem: Escrow confirmations not processing

```bash
# 1. Check tx-confirmation queue depth
curl http://localhost:5001/health/queues

# 2. Verify worker is running
docker compose ps zeropay-worker

# 3. Check Blockfrost health
curl http://localhost:5001/health/blockchain

# 4. Check circuit breaker state
curl http://localhost:5001/metrics | grep circuit

# 5. Restart worker if needed
docker compose restart zeropay-worker
```

### Problem: Memory usage growing on API server

```bash
# 1. Check container memory
docker stats zeropay-api

# 2. Check active socket connections
curl http://localhost:5001/metrics | grep socket

# 3. Review event listener leaks in application logs
docker compose logs zeropay-api | grep 'MaxListenersExceededWarning'

# 4. Rolling restart (zero-downtime if load-balanced)
docker compose up --build -d zeropay-api
```

### Problem: SLO violations appearing in dashboard

```bash
# 1. Pull current SLO report
curl -H 'Authorization: Bearer $ADMIN_TOKEN' \
  http://localhost:5001/api/v1/ops/slo | jq '.data.slaViolations'

# 2. Check specific violation type and correlate with recent deployments or incidents
# 3. Review ProtocolAuditLog entries in the violation window
# 4. Escalate critical violations (severity: 'critical') to on-call engineer
```

---

*This runbook should be reviewed and updated after every major deployment, incident, or infrastructure change.*
