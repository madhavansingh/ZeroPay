# Slide 4 — Product Specifications
## Technical and Physical Specifications

### Platform
- **Web App:** React + Vite → hosted on Vercel
- **Mobile App:** Expo + React Native (iOS & Android)
- **Backend API:** Node.js + Express → hosted on Render

### Data Layer
- **Primary Database:** MongoDB Atlas M0 — Users, Merchants, Invoices, Transactions collections
- **Real-time Sync:** Firebase Realtime Database — chat rooms, presence, live payment status mirror
- **Cache + Job Queues:** Upstash Redis — rate limiting, ADA/INR price cache (60s TTL), BullMQ queues

### Blockchain Layer
- **Network:** Cardano (preprod testnet → mainnet)
- **Smart Contracts:** Aiken escrow validator — trustless collect & refund paths
- **Transaction Building:** MeshJS (client-side, unsigned CBOR only from server)
- **Indexer:** Blockfrost (primary) + Koios (failover)
- **Wallet:** CIP-30 browser extension (Eternl/Lace) on web; WalletConnect (CIP-62) on mobile

### Payment Flow Specs
- **Invoice Expiry:** 10 minutes (configurable 5–30 min per merchant)
- **Finality Threshold:** 3 block confirmations (~3–4 minutes on Cardano)
- **Currency Precision:** All INR stored in paise (integer), all ADA stored in lovelace (integer) — no floats in DB
- **Receipt Storage:** IPFS via Pinata (free tier, 1 GB)
- **On-chain Metadata:** CIP-674 standard, key `674`, 64-byte field limit enforced

### Invoice Lifecycle (7 States)
`pending → submitted → confirming → confirmed → settled`
`pending → expired` (timer) | `submitted → failed` (tx not found after 20 min)
