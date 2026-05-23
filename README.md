# ZeroPay 🚀

**Blockchain-native payment system for Indian merchants** — Accept ADA (Cardano) payments with a simple QR code or chat flow. No blockchain knowledge required for end users.

---

## Architecture

```
zeropay/
├── apps/
│   └── web/          # React + Vite + Tailwind frontend (PWA)
├── backend/          # Express + TypeScript + BullMQ API
└── packages/
    └── shared-types/ # Shared TypeScript types
```

**Stack:**
- **Blockchain:** Cardano (preprod testnet) via Blockfrost + Koios fallback
- **Database:** MongoDB Atlas (source of truth)
- **Realtime:** Firebase RTDB (chat + invoice status sync)
- **Auth:** Firebase Phone Auth (OTP)
- **Queue:** BullMQ on Upstash Redis
- **IPFS:** Pinata (immutable receipts)
- **Wallet:** CIP-30 browser wallets (Eternl, Lace, Nami)

---

## Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/your-org/zeropay
cd zeropay
npm install  # installs all workspaces
```

### 2. Configure Environment

**Backend:**
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials
```

**Frontend:**
```bash
cp apps/web/.env.example apps/web/.env.local
# Edit apps/web/.env.local with Firebase web config
```

### 3. Run Development Servers
```bash
# Run backend + frontend together
npm run dev

# Or separately:
npm run dev:backend   # http://localhost:4000
npm run dev:web       # http://localhost:5173
```

---

## Required Services

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| [MongoDB Atlas](https://cloud.mongodb.com) | Database | ✅ 512MB |
| [Firebase](https://console.firebase.google.com) | Auth + RTDB | ✅ Spark plan |
| [Upstash Redis](https://console.upstash.com) | Cache + BullMQ | ✅ 10K req/day |
| [Blockfrost](https://blockfrost.io) | Cardano indexer | ✅ 50K req/day |
| [Pinata](https://app.pinata.cloud) | IPFS receipts | ✅ 1GB storage |

---

## API Reference

```
POST /api/v1/auth/sync        — Sync Firebase user to MongoDB
GET  /api/v1/auth/me          — Get current user
POST /api/v1/merchant/onboard — Register as merchant
GET  /api/v1/merchant/:id     — Public merchant profile
POST /api/v1/invoices/create  — Create payment invoice
GET  /api/v1/invoices/:id     — Get invoice details
POST /api/v1/payments/build-tx — Build unsigned Cardano TX
POST /api/v1/payments/submit  — Submit tx hash for confirmation
GET  /api/v1/price/ada-inr    — Live ADA/INR rate
GET  /health                  — Health check
```

---

## Payment Flow

```
Merchant creates invoice → Customer scans QR → 
Wallet signs tx (client-side) → Backend polls blockchain → 
Confirmed after 3 blocks → IPFS receipt generated → 
Both parties notified via FCM
```

---

## Security

- **No private keys on server** — Backend only builds unsigned transactions; signing is always done client-side via CIP-30 wallet
- **Rate limiting** — Redis-backed per-IP limits on all endpoints
- **Immutable invoice snapshots** — ADA/INR rate locked at invoice creation; immune to price manipulation
- **Deduplication** — txHash uniqueness enforced at DB level

---

## Hackathon Checklist

- [x] Firebase OTP authentication
- [x] Merchant onboarding + shop setup
- [x] CIP-30 wallet connection
- [x] Invoice creation with ADA conversion
- [x] QR code generation
- [x] CIP-30 wallet signing (client-side)
- [x] BullMQ confirmation polling (Blockfrost + Koios fallback)
- [x] IPFS receipt via Pinata
- [x] Firebase RTDB real-time chat
- [x] FCM push notifications
- [x] Counter checkout (physical POS)
