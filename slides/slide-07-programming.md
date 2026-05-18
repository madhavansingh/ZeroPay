# Slide 7 — Brief on Programming Module

## What programming languages will be used?

**Languages:**
TypeScript / JavaScript (frontend + backend), Aiken (Cardano smart contracts), UPLC (compiled contract output)

---

## What software modules will be built?

**Modules:**
- **API Gateway Module** — Express routes, Firebase Auth JWT verification, Zod validation, rate limiting
- **Invoice Service** — Invoice creation, snapshot locking, 7-state lifecycle management, expiry worker
- **Payment Confirmation Pipeline** — BullMQ worker, Blockfrost polling, Koios failover, optimistic locking
- **Chat & Real-time Module** — Firebase RTDB rooms, system message injection, live payment card updates
- **Price Oracle Module** — CoinGecko ADA/INR fetch, Redis 60s cache, last-known-good fallback
- **Smart Contract (Aiken)** — Escrow validator with collect + refund spending paths, deployed as reference script
- **Receipt Generator** — JSON receipt builder, Pinata IPFS pinning, on-chain metadata anchor transaction

---

## Cloud Solutions & Integrations

- **Point 1:** Firebase (Google Cloud) — Authentication (JWT), Realtime Database for chat and live payment state mirror, FCM for push notifications across iOS/Android/web.
- **Point 2:** MongoDB Atlas + Upstash Redis — Atlas M0 for persistent document storage; Upstash Redis via HTTP for caching and via TLS ioredis for BullMQ job queues. Both are serverless-compatible free-tier services.
