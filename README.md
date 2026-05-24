# ZeroPay

> **Blockchain-native payment infrastructure for Indian merchants.**  
> Accept Cardano (ADA) payments via QR code or in-chat — no crypto knowledge required for end users.

---

## What is ZeroPay?

ZeroPay is a full-stack payment platform built on Cardano. Merchants create invoices, customers pay with any CIP-30 wallet, and the blockchain confirmation + IPFS receipt generation happen automatically in the background.

**Current status:** MVP — fully functional on Cardano preprod testnet. Firebase OTP auth, real-time chat, QR payments, BullMQ confirmation pipeline, and IPFS receipts are all working end-to-end.

---

## Architecture

```
zeropay/                         ← npm workspaces monorepo
├── apps/
│   └── web/                     ← React 18 + Vite + Tailwind (PWA)
├── backend/                     ← Node.js + Express + TypeScript API
├── contracts/                   ← Aiken smart contracts (Cardano)
├── packages/
│   └── shared-types/            ← Shared TypeScript types (web + backend)
└── docs/                        ← Architecture, deployment, and API docs
```

### Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18 + Vite + Tailwind CSS | PWA merchant/customer UI |
| **Backend** | Node.js + Express + TypeScript | REST API + background jobs |
| **Auth** | Firebase Phone Auth (OTP) | Passwordless login |
| **Database** | MongoDB Atlas | Persistent data store |
| **Realtime** | Firebase Realtime Database | Chat + invoice status sync |
| **Queue** | BullMQ + Upstash Redis | Async job processing |
| **Blockchain** | Cardano via Blockfrost + Koios | Transaction building + confirmation |
| **Wallet** | MeshJS + CIP-30 browser wallets | Client-side transaction signing |
| **IPFS** | Pinata | Tamper-proof payment receipts |
| **Notifications** | Firebase Cloud Messaging (FCM) | Push notifications |
| **Monitoring** | Sentry | Error tracking |
| **Smart Contracts** | Aiken | Escrow contracts (in development) |

---

## Quick Start

### Prerequisites

- Node.js ≥ 20.0.0
- npm ≥ 9.0.0
- A CIP-30 Cardano wallet browser extension (Eternl recommended for preprod)

### 1. Clone & Install

```bash
git clone https://github.com/your-org/zeropay
cd zeropay
npm install          # installs all workspace packages
```

### 2. Configure Environment Variables

**Backend:**
```bash
cp backend/.env.example backend/.env
# Fill in all values — see backend/.env.example for descriptions
```

**Frontend:**
```bash
cp apps/web/.env.example apps/web/.env.local
# Fill in Firebase web config values
```

See [Required Services](#required-services) below for where to get each credential.

### 3. Start Development Servers

```bash
# Both together (recommended)
npm run dev

# Or individually
npm run dev:backend    # → http://localhost:4000
npm run dev:web        # → http://localhost:5173
```

Frontend automatically proxies `/api/*` → `localhost:4000` via Vite config.

---

## Required External Services

All services have a free tier sufficient for development.

| Service | Purpose | Free Tier | Get Credentials |
|---|---|---|---|
| [MongoDB Atlas](https://cloud.mongodb.com) | Database | 512 MB | Connect → Drivers → Connection string |
| [Firebase](https://console.firebase.google.com) | Auth + RTDB + FCM | Spark plan | Project Settings → Service Accounts |
| [Upstash Redis](https://console.upstash.com) | BullMQ + Cache | 10K req/day | Redis → Your DB → REST API + Details |
| [Blockfrost](https://blockfrost.io) | Cardano indexer | 50K req/day | Dashboard → Add project → Cardano preprod |
| [Pinata](https://app.pinata.cloud) | IPFS storage | 1 GB | API Keys → New Key |

---

## Project Scripts

Run from the **root** directory:

```bash
npm run dev              # Start backend + frontend concurrently
npm run dev:backend      # Start backend only (port 4000)
npm run dev:web          # Start frontend only (port 5173)
npm run build:backend    # Compile backend TypeScript → dist/
npm run build:web        # Build frontend → apps/web/dist/
npm run type-check       # Type-check backend + frontend (no emit)
npm run lint             # Lint backend + frontend
```

Run from **backend/** directory:

```bash
npm run dev              # ts-node-dev with hot reload
npm run build            # tsc → dist/
npm run type-check       # tsc --noEmit
npm run start            # node dist/server.js (production)
```

---

## API Reference

All endpoints are prefixed with `/api/v1/`.

### Auth

```
POST /api/v1/auth/sync          Sync Firebase user to MongoDB (called on login)
GET  /api/v1/auth/me            Get current authenticated user
POST /api/v1/auth/role          Set user role (merchant | customer | both)
POST /api/v1/auth/logout        Reset user session on backend
```

### Merchant

```
POST /api/v1/merchant/onboard          Register merchant profile + wallet
GET  /api/v1/merchant/:merchantId      Get public merchant profile
POST /api/v1/merchant/connect-wallet   Connect/update wallet address
```

### Invoices

```
POST /api/v1/invoices/create    Create a new payment invoice
GET  /api/v1/invoices/:id       Get invoice by ID
GET  /api/v1/invoices           List merchant's invoices (paginated)
```

### Payments

```
POST /api/v1/payments/build-tx  Build unsigned Cardano transaction (CBOR)
POST /api/v1/payments/submit    Submit signed tx hash for confirmation polling
```

### Price & Utilities

```
GET  /api/v1/price/ada-inr      Live ADA/INR exchange rate (cached 5 min)
GET  /health                    Health check — DB, Redis, service status
GET  /admin/queues              BullMQ Bull Board UI (basic auth required)
```

---

## Payment Flow

```
1. Merchant creates invoice (amount in INR → converted to lovelace at creation time)
2. Customer scans QR code or opens payment link in chat
3. Customer's wallet signs the transaction (client-side — private key never leaves device)
4. Customer submits tx hash to backend
5. BullMQ confirmation worker polls Blockfrost every 20s
6. Koios used as fallback if Blockfrost returns errors
7. After 3 block confirmations → invoice status → "settled"
8. IPFS receipt generated + pinned to Pinata
9. Both parties notified via Firebase FCM push notification
10. Receipt CID stored in MongoDB + sent as chat message
```

---

## Security Model

- **No private keys on server** — Backend only builds *unsigned* CBOR transactions. All signing is done client-side via the CIP-30 wallet API (`wallet.signTx()`).
- **Rate limiting** — Redis-backed per-IP limits on all endpoints.
- **Immutable invoice snapshots** — ADA/INR rate is locked at invoice creation. Price manipulation is impossible.
- **Transaction deduplication** — `txHash` uniqueness is enforced at the MongoDB schema level.
- **Firebase token verification** — Every authenticated request verifies the Firebase ID token server-side via the Admin SDK.
- **Helmet + CORS** — Security headers and strict origin allowlisting on all responses.
- **Input validation** — Zod schema validation on all incoming request bodies.

---

## Wallet Compatibility

The following CIP-30 browser extension wallets are supported on **Cardano preprod testnet**:

| Wallet | Preprod Support | Notes |
|---|---|---|
| [Eternl](https://eternl.io) | ✅ | Recommended for testing |
| [Lace](https://www.lace.io) | ✅ | |
| [Nami](https://namiwallet.io) | ✅ | |
| [Flint](https://flint-wallet.com) | ✅ | |

Switch your wallet to **Cardano Preprod** testnet before testing. Get test ADA from the [Cardano Faucet](https://docs.cardano.org/cardano-testnet/tools/faucet/).

---

## Folder Structure (Detailed)

```
apps/web/src/
├── components/
│   ├── atoms/           ← Smallest reusable components (StatusBadge, etc.)
│   └── organisms/       ← Composed components (BottomNav, InvoiceSheet, etc.)
├── hooks/
│   └── useAuth.tsx      ← Firebase auth context + OTP send/verify/logout
├── pages/
│   ├── auth/            ← SplashPage, PhoneAuthPage, RoleSelectPage
│   ├── merchant/        ← DashboardPage, CounterCheckoutPage, QRDisplayPage
│   ├── customer/        ← ChatListPage, ChatRoomPage, ScanQRPage, PaymentApprovalPage
│   ├── onboarding/      ← WalletConnectPage, ShopSetupPage
│   └── shared/          ← ProfilePage, ReceiptPage
├── services/
│   ├── api.ts           ← All backend HTTP calls (Axios + Firebase token injection)
│   └── firebase.ts      ← Firebase app + auth + RTDB initialization
└── stores/
    └── authStore.ts     ← Zustand global auth state (user, role, wallet, onboarding)

backend/src/
├── config/              ← DB, Firebase Admin, Redis, logger, Sentry, env validation
├── middleware/          ← requireAuth, validate (Zod), rateLimit, errorHandler
├── models/              ← Mongoose schemas: User, Merchant, Invoice, Transaction
├── routes/              ← auth, merchant, invoice, payment, price, chat, dashboard
├── services/            ← blockchain, mesh, invoice, notification, price
├── workers/             ← BullMQ workers: confirmation, receipt, notification, expiry, dailyStats
├── queues/              ← Queue definitions (confirmationQueue, receiptQueue, etc.)
├── admin/               ← Bull Board admin UI setup
└── server.ts            ← Express app bootstrap, middleware stack, graceful shutdown

contracts/
├── validators/          ← Aiken smart contract validators
├── aiken.toml           ← Aiken project config
└── plutus.json          ← Compiled contract artifacts

packages/
└── shared-types/src/
    └── index.ts         ← All shared TypeScript interfaces (Invoice, User, Merchant, etc.)

docs/
├── DEPLOYMENT.md        ← Step-by-step deployment guide
├── FIREBASE_SETUP.md    ← Firebase project setup guide
├── RENDER_DEPLOY.md     ← Render backend deployment
├── VERCEL_DEPLOY.md     ← Vercel frontend deployment
├── env.production.example ← Production environment variable template
├── PRD.md               ← Product Requirements Document
├── TRD.md               ← Technical Requirements Document
├── appflow.md           ← Complete app flow documentation
├── backendSchema.md     ← MongoDB schema reference
└── uiux.md              ← UI/UX design documentation
```

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | ✅ | `development` or `production` |
| `PORT` | ✅ | API port (default: `4000`) |
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `FIREBASE_PROJECT_ID` | ✅ | Firebase project ID |
| `FIREBASE_PRIVATE_KEY` | ✅ | Firebase Admin SDK private key |
| `FIREBASE_CLIENT_EMAIL` | ✅ | Firebase Admin SDK client email |
| `FIREBASE_DATABASE_URL` | ✅ | Firebase Realtime Database URL |
| `UPSTASH_REDIS_REST_URL` | ✅ | Upstash REST URL (for caching) |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ | Upstash REST token |
| `UPSTASH_REDIS_TLS_URL` | ✅ | Upstash TLS URL (for BullMQ) |
| `BLOCKFROST_PROJECT_ID` | ✅ | Blockfrost project ID (preprod) |
| `BLOCKFROST_NETWORK` | ✅ | `preprod` or `mainnet` |
| `PINATA_API_KEY` | ✅ | Pinata API key |
| `PINATA_SECRET_KEY` | ✅ | Pinata secret API key |
| `PINATA_JWT` | ✅ | Pinata JWT token |
| `ALLOWED_ORIGINS` | ✅ | Comma-separated CORS origins |
| `MIN_CONFIRMATIONS` | ✅ | Block confirmations required (default: `3`) |
| `ADMIN_USERNAME` | ⚠️ | Bull Board admin username |
| `ADMIN_PASSWORD` | ⚠️ | Bull Board admin password |

### Frontend (`apps/web/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | ✅ | Firebase Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | ✅ | Firebase auth domain |
| `VITE_FIREBASE_DATABASE_URL` | ✅ | Firebase Realtime Database URL |
| `VITE_FIREBASE_PROJECT_ID` | ✅ | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | ✅ | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ✅ | FCM sender ID |
| `VITE_FIREBASE_APP_ID` | ✅ | Firebase app ID |

---

## Deployment

| Platform | Service | Guide |
|---|---|---|
| [Render](https://render.com) | Backend API | [docs/RENDER_DEPLOY.md](docs/RENDER_DEPLOY.md) |
| [Vercel](https://vercel.com) | Frontend | [docs/VERCEL_DEPLOY.md](docs/VERCEL_DEPLOY.md) |

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the complete step-by-step guide including environment variable configuration for production.

---

## Development Notes

- **Testnet only** — The current configuration targets Cardano **preprod** testnet. Never use real ADA during development.
- **Wallet extension required** — A CIP-30 browser wallet extension must be installed to test payment flows.
- **Firebase emulators not configured** — The app connects to real Firebase services even in development. Use a separate Firebase project for dev vs production.
- **BullMQ dashboard** — Access the queue admin UI at `http://localhost:4000/admin/queues` (credentials from `ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars, default: `zeropay-admin` / `changeme-in-production`).
- **Cold starts on Render free tier** — The backend may take 30–60 seconds to respond on the first request after inactivity. Upgrade to Render Starter ($7/month) to eliminate this.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make your changes with proper TypeScript types
4. Run `npm run type-check` and `npm run lint` — both must pass
5. Commit with a descriptive message following [Conventional Commits](https://www.conventionalcommits.org/)
6. Open a pull request against `main`

---

## License

Private — All rights reserved. ZeroPay team.
