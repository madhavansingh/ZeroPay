# Slide 8 — Execution Plan
## Steps from Drawing Board to Prototype

**Phase 1 — Foundation (Weeks 1–2)**
Set up monorepo (apps/web, apps/mobile, backend, contracts, packages/shared-types). Configure all free-tier services: MongoDB Atlas, Firebase project, Upstash Redis, Vercel, Render. Implement Firebase Auth + user onboarding flow.

**Phase 2 — Identity & Wallet (Weeks 2–3)**
Build merchant onboarding (shop setup, QR generation). Integrate CIP-30 wallet connection on web. Sync wallet address to MongoDB user document. Deploy Aiken escrow contract to Cardano preprod testnet.

**Phase 3 — Core Payment Flow (Weeks 4–5)**
Invoice creation API with ADA/INR price oracle (CoinGecko + Redis cache). MeshJS unsigned CBOR transaction builder. Payment submission endpoint + BullMQ confirmation polling pipeline (Blockfrost → Koios fallover).

**Phase 4 — Chat & Real-time UI (Weeks 6–7)**
Firebase RTDB chat rooms. Payment request / payment receipt message bubbles. Live invoice status mirror (`/invoices/{id}` path). Confirmation animation and receipt screen.

**Phase 5 — Merchant Dashboard & Receipts (Weeks 8–10)**
Merchant revenue dashboard with 7-day stats (pre-computed by daily BullMQ worker). Counter checkout flow (anonymous walk-in payments). IPFS receipt generation via Pinata. FCM push notifications (merchant + customer).

**Phase 6 — Mobile & QA (Weeks 11–14)**
Expo React Native app with WalletConnect (CIP-62) mobile wallet integration. Full preprod QA: 50-invoice end-to-end test, edge cases (expired invoice, amount mismatch, network failure). CI/CD via GitHub Actions. Sentry error tracking + UptimeRobot monitoring.

**Phase 7 — Production Launch (Weeks 15–18)**
Switch Blockfrost from preprod to mainnet. Security audit (rate limits, CORS, Firebase rules, MongoDB field validation). Soft launch with 5 pilot merchants. Monitor Sentry + BullMQ dashboard for 72 hours. Full production release.
