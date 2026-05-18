# Slide 6 — Architecture *(Optional)*
## Tech / Hardware Architecture

```
┌─────────────────────────────────────────────────┐
│  LAYER 1 — PRESENTATION                         │
│  React + Vite (Web · Vercel)                    │
│  Expo + React Native (iOS & Android)            │
└──────────────────────┬──────────────────────────┘
                       │ HTTPS / REST
┌──────────────────────▼──────────────────────────┐
│  LAYER 2 — API GATEWAY                          │
│  Node.js + Express (Render)                     │
│  Auth · Rate Limiting · Validation · Routing    │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│  LAYER 3 — BUSINESS LOGIC                       │
│  Invoice · Merchant · User · Price Oracle       │
└──────────────────────┬──────────────────────────┘
                       │ Enqueue
┌──────────────────────▼──────────────────────────┐
│  LAYER 4 — JOB QUEUE (BullMQ + Upstash Redis)  │
│  tx-confirmation · receipt · notification       │
└──────────────────────┬──────────────────────────┘
                       │ Poll
┌──────────────────────▼──────────────────────────┐
│  LAYER 5 — BLOCKCHAIN INTERACTION               │
│  MeshJS (tx build) · Blockfrost → Koios         │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│  LAYER 6 — SMART CONTRACT                       │
│  Aiken Escrow Validator on Cardano              │
│  Collect path · Refund path                     │
└─────────────────────────────────────────────────┘

LAYER 7 — STORAGE (cross-cutting)
  MongoDB Atlas · Firebase RTDB · Upstash Redis · Pinata IPFS
```

### Key Security Rule
> The backend **never holds private keys**. All transaction signing happens client-side via CIP-30 wallet extension. Backend only builds and returns unsigned CBOR.
