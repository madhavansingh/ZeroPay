# ZeroPay — Technical Requirements Document (TRD)

### Version 1.0 · Team Null Void · Cardano Hackathon Asia IBW 2025 → Production
### Document Owner: Madhavan Singh Parihar
### Depends On: PRD v1.0
### Status: Living Document — Updated as Architecture Evolves

---

## Table of Contents

1. [Document Purpose & Scope](#1-document-purpose--scope)
2. [Technology Stack — Definitive Decisions](#2-technology-stack--definitive-decisions)
3. [Monorepo Structure & Project Layout](#3-monorepo-structure--project-layout)
4. [Environment Configuration](#4-environment-configuration)
5. [Database Architecture — MongoDB](#5-database-architecture--mongodb)
6. [Realtime Layer — Firebase Realtime Database](#6-realtime-layer--firebase-realtime-database)
7. [Cache & Queue Layer — Upstash Redis + BullMQ](#7-cache--queue-layer--upstash-redis--bullmq)
8. [Authentication Architecture](#8-authentication-architecture)
9. [API Architecture — Express Backend](#9-api-architecture--express-backend)
10. [Cardano Blockchain Layer](#10-cardano-blockchain-layer)
11. [Smart Contract Architecture — Aiken](#11-smart-contract-architecture--aiken)
12. [Wallet Integration Architecture — CIP-30](#12-wallet-integration-architecture--cip-30)
13. [Payment Orchestration Pipeline](#13-payment-orchestration-pipeline)
14. [Price Oracle Architecture](#14-price-oracle-architecture)
15. [IPFS Receipt Architecture](#15-ipfs-receipt-architecture)
16. [Push Notification Architecture](#16-push-notification-architecture)
17. [Chat Architecture](#17-chat-architecture)
18. [QR System Architecture](#18-qr-system-architecture)
19. [Frontend Architecture — React Web App](#19-frontend-architecture--react-web-app)
20. [Mobile Architecture — React Native + Expo](#20-mobile-architecture--react-native--expo)
21. [Security Architecture](#21-security-architecture)
22. [Error Handling Architecture](#22-error-handling-architecture)
23. [Logging & Observability](#23-logging--observability)
24. [CI/CD Pipeline Architecture](#24-cicd-pipeline-architecture)
25. [Infrastructure & Deployment](#25-infrastructure--deployment)
26. [Performance Architecture](#26-performance-architecture)
27. [Testing Architecture](#27-testing-architecture)
28. [Data Flow Diagrams](#28-data-flow-diagrams)
29. [Dependency Graph & Third-Party Services](#29-dependency-graph--third-party-services)
30. [Technical Debt Register](#30-technical-debt-register)

---

## 1. Document Purpose & Scope

### What This Document Is

The Technical Requirements Document translates every product requirement defined in the PRD into precise technical specifications. Where the PRD says what the system must do and why, the TRD says how the system must be built, with what technologies, following which patterns, under which constraints. Every architectural decision in this document has a rationale. Decisions that were debated and settled are documented alongside the alternatives that were rejected and why.

This document is the authoritative reference for every engineer building ZeroPay. If this document and the code ever disagree, the document is considered the intended state and the code is considered a bug unless a formal decision is recorded in the Open Decisions Log (Section 30).

### Scope

This TRD covers the complete technical architecture of ZeroPay Version 1.0, including: the React web application, the Node.js backend API, the BullMQ asynchronous job pipeline, the Aiken smart contract layer, the Cardano blockchain interaction module, the Firebase Realtime Database chat and notification system, the MongoDB data layer, the Upstash Redis cache and queue layer, the IPFS receipt system, the mobile app foundations, the CI/CD pipeline, and all third-party integrations.

The TRD does not cover: business logic decisions (covered in PRD), design decisions (covered in a separate design system document), legal or compliance requirements (covered separately), or future features explicitly scoped to Version 2.0.

### How to Read This Document

Read Sections 1–4 first regardless of your role — they establish the foundational decisions every other section depends on. After that, engineers can read the sections relevant to their module. The data flow diagrams in Section 28 provide a visual complement to the prose in Sections 9–18.

---

## 2. Technology Stack — Definitive Decisions

### Why These Choices Are Final for Version 1.0

Every technology choice below was evaluated against three constraints that are unique to this project: zero infrastructure cost to the developer, suitability for Cardano blockchain integration, and the ability of a small team to build and maintain the system. Alternatives were rejected when they failed one or more of these constraints.

### Backend

**Runtime:** Node.js 20 LTS (active support through April 2026, then maintenance through April 2028). Selected over Bun because Render's free tier has predictable Node.js support. Selected over Deno because the Cardano ecosystem's NPM packages (MeshJS, BullMQ) are tested against Node.js.

**Framework:** Express 4.x. Selected over Fastify because the team's existing knowledge reduces build time. Selected over NestJS because NestJS's abstraction adds complexity that is not justified for this service's scope. Express with TypeScript provides sufficient structure through explicit layering.

**Language:** TypeScript 5.x with strict mode enabled. No JavaScript files in the backend. Strict mode catches the class of null-safety and type-mismatch bugs that cause the most runtime errors in payment systems.

**ORM / Database Client:** Mongoose 8.x for MongoDB. Selected over Prisma (no MongoDB Prisma support at the required level) and over the raw MongoDB driver (Mongoose's schema validation layer catches data integrity violations before they reach the database).

**Job Queue:** BullMQ 5.x backed by Upstash Redis. Selected over Agenda (uses MongoDB, creating coupling between the job queue and the primary database) and over simple `setInterval` polling (no persistence across restarts, no retry logic, no observability).

**Validation:** Zod 3.x for all request body and environment variable validation. Selected over Joi (worse TypeScript inference) and over class-validator (requires decorator syntax which conflicts with functional service patterns).

**HTTP Client:** Native `fetch` (Node.js 18+). No Axios. Native fetch is sufficient for all outbound HTTP calls in this application, eliminating a dependency.

### Frontend

**Framework:** React 18 with Vite 5. Selected over Next.js because server-side rendering provides no advantage for a chat-centric payment app where all meaningful data requires user authentication, and Next.js on Vercel's free hobby plan has serverless function constraints that complicate long-polling and WebSocket approaches.

**State Management:** React Context for global state (auth, wallet connection) and TanStack Query (React Query) v5 for server state (API data fetching, caching, background refetching). No Redux. Selected because TanStack Query eliminates the majority of manual loading/error/caching state that makes payment UIs complex.

**Styling:** Tailwind CSS 3.x. No CSS-in-JS. Tailwind's utility classes are processed at build time with no runtime overhead. No component library is used — all UI components are custom-built to avoid the bundle weight of a full component library for a focused application.

**Routing:** React Router v6 with data router pattern.

**Form Handling:** React Hook Form v7 with Zod resolvers. Consistent with backend validation schemas.

**QR Generation:** react-qr-code (client-side SVG QR generation, no backend call required).

**Wallet Integration:** @meshsdk/core and @meshsdk/react for CIP-30 wallet connection and transaction building.

### Blockchain

**Cardano SDK:** @meshsdk/core 1.x. Handles CIP-30 wallet connections, Cardano transaction building, CBOR serialization, UTXO selection, and fee calculation. No lower-level cardano-serialization-lib usage directly — MeshJS provides the necessary abstraction.

**Smart Contracts:** Aiken (latest stable release). Aiken CLI for compiling, testing, and generating blueprints. The compiled UPLC is used within MeshJS transaction builders.

**Blockchain Indexer (Primary):** Blockfrost REST API v0. Access via direct HTTP calls using native fetch, no Blockfrost SDK (the SDK adds unnecessary abstraction and bundle weight).

**Blockchain Indexer (Fallback):** Koios REST API v1. Same request/response pattern as Blockfrost for the endpoints used by this application, enabling transparent failover with minimal code branching.

### Data Storage

**Primary Database:** MongoDB Atlas M0 (512 MB free tier). Access via Mongoose.

**Cache + Queue:** Upstash Redis. BullMQ uses Upstash via the ioredis adapter. The price oracle uses Upstash via the @upstash/redis HTTP client. Two separate clients exist because BullMQ requires a persistent TCP Redis connection (ioredis) while the price oracle benefits from Upstash's HTTP API which works in serverless and edge contexts.

**Realtime:** Firebase Realtime Database. Access via Firebase Admin SDK (server-side writes) and Firebase Web SDK v9 (client-side reads and real-time subscriptions).

**IPFS:** Pinata API. Access via direct HTTP calls to Pinata's REST endpoints.

### Mobile

**Framework:** Expo SDK 51 with React Native 0.74. Selected over bare React Native for the managed workflow's build infrastructure (EAS Build) which enables cloud builds without local Xcode or Android Studio.

**Wallet:** CIP-62 WalletConnect protocol for connecting to external Cardano mobile wallets (Eternl Mobile, Nami Mobile). In-app wallet using MeshJS key generation and Expo SecureStore is a Version 2.0 feature.

### Infrastructure

**Frontend Hosting:** Vercel (hobby plan, free).
**Backend Hosting:** Render (free web service, 750 hrs/month).
**CI/CD:** GitHub Actions.
**Error Monitoring:** Sentry (free plan, 5,000 errors/month).
**Uptime Monitoring:** UptimeRobot (free, 10-minute intervals).
**Mobile Builds:** Expo EAS Build (free plan, 30 builds/month).

---

## 3. Monorepo Structure & Project Layout

### Repository Organization

The repository is a standard npm workspace monorepo without a build orchestrator (no Turborepo, no Nx). The absence of a build orchestrator is intentional: this project has a small number of packages, a simple dependency graph, and Turborepo's caching benefits do not outweigh the added conceptual overhead for a small team. If the project grows beyond 10 packages with complex inter-dependencies, Turborepo should be evaluated.

### Directory Structure — Canonical

The canonical directory structure is the authoritative layout. Any deviation from this structure requires a documented decision. New files go in the directory that matches their category according to the layer architecture.

```
zeropay/
│
├── apps/
│   ├── web/                          ← React + Vite web application
│   │   ├── src/
│   │   │   ├── components/           ← Reusable UI components
│   │   │   │   ├── chat/             ← Chat interface components
│   │   │   │   ├── payment/          ← Payment bubble, checkout components
│   │   │   │   ├── dashboard/        ← Merchant dashboard components
│   │   │   │   ├── wallet/           ← Wallet connect UI components
│   │   │   │   └── shared/           ← Generic reusable UI (buttons, inputs, cards)
│   │   │   ├── pages/                ← Route-level page components
│   │   │   ├── hooks/                ← Custom React hooks
│   │   │   │   ├── useCardanoWallet.ts
│   │   │   │   ├── useAuth.ts
│   │   │   │   ├── useInvoice.ts
│   │   │   │   └── useChat.ts
│   │   │   ├── contexts/             ← React Context providers
│   │   │   │   ├── AuthContext.tsx
│   │   │   │   └── WalletContext.tsx
│   │   │   ├── lib/                  ← Utility libraries and wrappers
│   │   │   │   ├── firebase.ts       ← Firebase SDK initialization
│   │   │   │   ├── apiClient.ts      ← Typed API client (wraps all backend calls)
│   │   │   │   └── formatters.ts     ← Currency, date, address formatters
│   │   │   ├── router/               ← React Router configuration
│   │   │   └── main.tsx              ← Application entry point
│   │   ├── public/
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── mobile/                       ← Expo React Native application
│       ├── app/                      ← Expo Router file-system routing
│       ├── components/
│       ├── hooks/
│       ├── lib/
│       ├── app.json                  ← Expo configuration
│       └── package.json
│
├── backend/
│   ├── src/
│   │   ├── routes/                   ← Express route handlers (HTTP layer only)
│   │   │   ├── auth.routes.ts
│   │   │   ├── merchant.routes.ts
│   │   │   ├── invoice.routes.ts
│   │   │   ├── payment.routes.ts
│   │   │   ├── chat.routes.ts
│   │   │   ├── price.routes.ts
│   │   │   └── receipt.routes.ts
│   │   ├── services/                 ← Business logic (no HTTP dependencies)
│   │   │   ├── invoice.service.ts
│   │   │   ├── merchant.service.ts
│   │   │   ├── user.service.ts
│   │   │   ├── chat.service.ts
│   │   │   ├── price.service.ts
│   │   │   ├── receipt.service.ts
│   │   │   └── notification.service.ts
│   │   ├── jobs/                     ← BullMQ job definitions and workers
│   │   │   ├── queues.ts             ← Queue instances (singleton)
│   │   │   ├── workers/
│   │   │   │   ├── confirmationPoller.worker.ts
│   │   │   │   ├── receiptGenerator.worker.ts
│   │   │   │   ├── notificationDispatcher.worker.ts
│   │   │   │   └── invoiceExpiry.worker.ts
│   │   │   └── schedulers/           ← Recurring cron-style jobs
│   │   │       └── dailyStats.scheduler.ts
│   │   ├── middleware/               ← Express middleware functions
│   │   │   ├── auth.middleware.ts
│   │   │   ├── rateLimit.middleware.ts
│   │   │   ├── validate.middleware.ts
│   │   │   └── errorHandler.middleware.ts
│   │   ├── blockchain/               ← All Cardano interaction (no business logic)
│   │   │   ├── blockfrost.client.ts
│   │   │   ├── koios.client.ts
│   │   │   ├── indexer.ts            ← Unified indexer (handles failover)
│   │   │   ├── txBuilder.ts          ← MeshJS transaction builder wrappers
│   │   │   └── contract.ts           ← Aiken contract interaction utilities
│   │   ├── db/                       ← MongoDB models and connection
│   │   │   ├── connection.ts
│   │   │   └── models/
│   │   │       ├── User.model.ts
│   │   │       ├── Merchant.model.ts
│   │   │       ├── Invoice.model.ts
│   │   │       └── Transaction.model.ts
│   │   ├── firebase/                 ← Firebase Admin SDK initialization
│   │   │   └── admin.ts
│   │   ├── redis/                    ← Upstash Redis clients
│   │   │   ├── cache.client.ts       ← @upstash/redis for price cache
│   │   │   └── queue.client.ts       ← ioredis for BullMQ
│   │   ├── schemas/                  ← Zod validation schemas
│   │   │   ├── invoice.schema.ts
│   │   │   ├── merchant.schema.ts
│   │   │   └── payment.schema.ts
│   │   ├── config/                   ← Typed environment variable access
│   │   │   └── env.ts
│   │   └── index.ts                  ← Express app entry point
│   ├── tsconfig.json
│   └── package.json
│
├── contracts/                        ← Aiken smart contracts (separate toolchain)
│   ├── lib/
│   │   └── zeropay/
│   │       └── types.ak              ← Datum and Redeemer type definitions
│   ├── validators/
│   │   └── payment_escrow.ak         ← Main validator script
│   ├── tests/
│   │   └── payment_escrow_test.ak    ← Aiken property tests
│   ├── plutus.json                   ← Compiled blueprint (generated by aiken build)
│   └── aiken.toml                    ← Aiken project configuration
│
├── packages/
│   └── shared-types/                 ← TypeScript types shared between web and backend
│       ├── src/
│       │   ├── invoice.types.ts
│       │   ├── merchant.types.ts
│       │   ├── user.types.ts
│       │   ├── api.types.ts          ← Request/response shapes
│       │   └── index.ts
│       ├── tsconfig.json
│       └── package.json
│
├── .github/
│   └── workflows/
│       ├── ci.yml                    ← Lint, type-check, test on every PR
│       └── deploy.yml                ← Deploy to Render + Vercel on main merge
│
├── .gitignore                        ← Includes all .env files, node_modules, plutus.json
├── .env.example                      ← All variable names with descriptions, no values
├── package.json                      ← Workspace root, npm workspaces config
└── README.md
```

### Package Dependency Rules

The following dependency directions are permitted. Violations of these rules create circular dependencies and must be rejected in code review:

- `apps/web` may import from `packages/shared-types` and from no other internal package.
- `apps/mobile` may import from `packages/shared-types` and from no other internal package.
- `backend` may import from `packages/shared-types` and from no other internal package.
- `packages/shared-types` may not import from any other internal package.
- `contracts/` has no npm dependencies and no dependency relationships with other packages.

### The `shared-types` Package

Every TypeScript type or interface that is used in both a frontend app and the backend must live in `packages/shared-types`. The canonical examples are API request shapes, API response shapes, invoice status enum values, and merchant category enum values. If a type exists in both the backend and the frontend as separate definitions that drift apart, it is a maintenance hazard that `shared-types` eliminates by design.

The `shared-types` package has no runtime dependencies — only TypeScript type definitions. It compiles to declaration files (`.d.ts`) with no JavaScript output. Both the frontend and backend consume it via the workspace reference (e.g., `"@zeropay/shared-types": "*"` in package.json).

---

## 4. Environment Configuration

### Environment Variable Architecture

All environment variable access in the backend goes through a single typed configuration module at `backend/src/config/env.ts`. This module uses Zod to parse and validate all environment variables at application startup. If any required variable is missing or has an invalid format, the process exits immediately with a descriptive error message listing exactly which variables failed validation. This prevents the silent failures that occur when undefined environment variables create `undefined` values that propagate through the system before failing at an unexpected point.

No other file in the backend imports from `process.env` directly. All environment access goes through the typed config object exported from `env.ts`. This makes it immediately clear which variables any given module depends on.

### Variable Groups

**Firebase group:** Firebase API key (public, safe to expose to frontend), Firebase Auth domain, Firebase Realtime Database URL, Firebase project ID (public), and Firebase service account JSON (private, base64-encoded, backend only).

**MongoDB group:** MongoDB connection URI (private). The URI includes the username, password, cluster hostname, and database name.

**Upstash group:** Upstash Redis REST URL (used by @upstash/redis HTTP client for price cache), Upstash Redis REST token (used by @upstash/redis HTTP client), and Upstash Redis connection string in `rediss://` format (used by ioredis for BullMQ).

**Blockfrost group:** Blockfrost project ID (acts as API key), Blockfrost base URL (network-specific).

**Koios group:** Koios base URL (network-specific, public endpoint, no key).

**Pinata group:** Pinata JWT (private).

**Application group:** Node environment (`development`, `test`, or `production`), port number, JWT secret (64 random hex bytes), Cardano network identifier (`preprod` or `mainnet`), and Aiken contract script hash (the on-chain identifier of the deployed escrow validator).

### Variable Naming Convention

All environment variables use `SCREAMING_SNAKE_CASE`. Variables are prefixed by their service: `FIREBASE_`, `MONGODB_`, `UPSTASH_`, `BLOCKFROST_`, `KOIOS_`, `PINATA_`. Application-level variables have no prefix: `NODE_ENV`, `PORT`, `JWT_SECRET`, `CARDANO_NETWORK`, `CONTRACT_SCRIPT_HASH`.

### Network Configuration Variable

The `CARDANO_NETWORK` variable controls which Cardano network the application targets. Valid values are `preprod` and `mainnet`. This variable is used by: the Blockfrost client (to select the correct base URL), the Koios client (to select the correct base URL), the MeshJS transaction builder (to set the correct network magic for address encoding), and the address validator (to reject addresses from the wrong network). The application does not support mixing networks within a single deployment.

---

## 5. Database Architecture — MongoDB

### Connection Strategy

The MongoDB connection is established once at application startup and reused for the lifetime of the process. Mongoose maintains a connection pool (default size: 5 connections for the M0 free tier). The connection module exports a `connectDB` function that is called in `index.ts` before the Express server starts accepting requests. If the initial connection fails (MongoDB unavailable, wrong credentials, network unreachable), the process exits with a non-zero code — there is no value in running an API server that cannot reach its database.

Mongoose connection events (connected, disconnected, reconnected, error) are logged at the appropriate severity level. Reconnection is handled automatically by Mongoose with exponential backoff.

### Schema Design Principles

**Principle 1: Monetary values are integers.** INR is stored in paise (rupees × 100). ADA is stored in lovelace (ADA × 1,000,000). This is enforced at the Mongoose schema level with `type: Number` and a validator that rejects non-integers and negative values.

**Principle 2: Timestamps are always stored as UTC.** Mongoose's `timestamps: true` option adds `createdAt` and `updatedAt` fields automatically in UTC. Additional timestamp fields like `expiresAt`, `confirmedAt`, and `settledAt` are also stored as UTC Date objects. The frontend is responsible for timezone conversion during display.

**Principle 3: Enum fields use string enums, not numeric codes.** Status values are stored as human-readable strings (`"pending"`, `"submitted"`, `"settled"`) rather than numeric codes (0, 1, 2). This makes MongoDB documents readable without a codebook and prevents off-by-one errors if enum positions shift.

**Principle 4: References use MongoDB ObjectIDs, not string IDs.** Cross-collection references (e.g., `Invoice.merchantId` referencing a `Merchant._id`) use `mongoose.Schema.Types.ObjectId` with a `ref` property. This enables Mongoose's `populate()` for join-like queries when needed.

**Principle 5: Sparse indexes for optional unique fields.** Fields like `walletAddress` on the User model are optional (not every user connects a wallet immediately) but must be unique when present. Sparse indexes accomplish this: they only index documents where the field exists, allowing multiple documents with a missing field while enforcing uniqueness among those that have it.

### User Model — Field Specifications

The User model is the base identity entity. It is created automatically when a new user authenticates for the first time. The `firebaseUid` field is the primary join key between Firebase Auth and MongoDB. The `role` field controls access to merchant-specific endpoints — its value is read from MongoDB on every authenticated request, not from the Firebase token, ensuring role changes take effect immediately.

The `fcmToken` field stores the device's current push notification token. This field is overwritten on every session start because FCM tokens can rotate. The FCM token is not indexed because it is only ever used in the context of a known user document (fetched by user ID, then the token is read from the document).

The `walletAddress` field holds the Cardano bech32 enterprise address registered for this user. It is indexed (sparse) because the confirmation pipeline looks up invoices by payment address when processing incoming transactions. The `stakeAddress` field holds the Cardano bech32 stake address, used for querying all addresses belonging to an HD wallet account via Blockfrost's accounts API.

### Merchant Model — Field Specifications

The Merchant model extends the User model conceptually but is a separate collection for clean separation of concerns. A `userId` ObjectID links to the corresponding User document. The `paymentAddress` field is the Cardano address where this merchant receives funds — it is snapshotted into every Invoice at creation time so that changing the merchant's payment address does not affect in-flight invoices.

The `totalReceived` and `totalOrders` fields are denormalized aggregates maintained by the job queue after every settlement. Denormalization is chosen over live aggregation because the merchant dashboard's overview panel must load in under 200 milliseconds — running a MongoDB aggregation over the full Invoice collection on every dashboard load is unacceptable at even moderate scale.

The `invoiceExpiry` field stores the merchant's preferred invoice expiry in seconds. The valid range is enforced at the schema level: minimum 300 (5 minutes), maximum 1800 (30 minutes), default 600 (10 minutes).

### Invoice Model — Field Specifications

The Invoice model is the highest-write collection. It is written at creation (status: pending), written when a tx is submitted (status: submitted, txHash added), written when confirming begins (status: confirming, blockHeight added), written when confirmed (status: confirmed, confirmations updated), and written when settled (status: settled, settledAt added, receiptCid added). Five writes per invoice lifecycle minimum.

The `expiresAt` field has a MongoDB TTL index with `expireAfterSeconds: 0`. This means MongoDB will automatically delete documents where `expiresAt` is in the past. However, this is used only for cleaning up very old expired and failed invoices from the collection — the application does not rely on TTL deletion for business logic. The invoice expiry state machine is driven by the application's job queue, not by MongoDB's TTL mechanism.

The `items` field is an embedded array of line item sub-documents. Each sub-document contains: `name` (string, max 60 characters), `qty` (positive integer), and `priceINR` (positive integer in paise). The total of all items' `qty × priceINR` must equal the invoice's `amountINR`, validated by a Mongoose pre-save hook.

The `paymentAddress` field stores the merchant's Cardano address as a snapshot at invoice creation time. This field is never updated after invoice creation. The compound index on `paymentAddress + status` supports the confirmation poller's query pattern: when the poller detects an incoming transaction to an address, it needs to find any pending or submitted invoice for that address quickly.

### Compound Index Definitions

Indexes are created explicitly by Mongoose's schema index definitions. The following compound indexes are required and must be created before any production data is written:

Invoice collection — compound index on `merchantId` ascending + `status` ascending + `createdAt` descending. This supports the merchant dashboard's transaction history query which filters by merchant and optionally by status, ordered by most recent.

Invoice collection — compound index on `paymentAddress` ascending + `status` ascending. This supports the confirmation poller's lookup when it detects an incoming transaction to a known merchant address.

Transaction collection — unique index on `txHash`. This is the deduplication guard: if a tx hash is submitted twice (race condition, duplicate request), the second insert fails with a duplicate key error rather than creating a phantom transaction record.

---

## 6. Realtime Layer — Firebase Realtime Database

### Database Structure Design

The Firebase Realtime Database uses a deliberately flat structure. Deep nesting is avoided because in the Firebase Realtime Database, reading a node downloads all its children. A nested structure where `/users/{uid}/chatrooms/{roomId}/messages/{msgId}` would download the entire message history whenever a user's data is read. The flat structure separates these concerns:

`/presence/{uid}/` — Online status for each user (last seen timestamp, online boolean). Written by the Firebase client SDK's onDisconnect hook.

`/chatrooms/{roomId}/` — Room metadata: merchantId, customerId, participants map, lastMessage preview (truncated to 50 characters), lastUpdated timestamp, and unread counts per user. This node is small and safe to read fully on room list load.

`/chatrooms/{roomId}/messages/{pushId}/` — Individual messages, each as a flat object with no nested children. The Firebase push ID (auto-generated, sortable by time) is the message key. Messages are read with `limitToLast(50)` for initial load and new messages arrive via the `child_added` listener.

`/invoices/{invoiceId}/status` — A single string value mirroring the invoice's status from MongoDB. Written by the backend job queue using the Firebase Admin SDK whenever an invoice status changes. The frontend listens to this path with Firebase's `onValue` listener to receive instant status updates without polling the REST API.

### Firebase Security Rules — Complete Specification

The security rules are the enforcement layer for all client-side Firebase access. The Firebase Admin SDK (used by the backend) bypasses these rules. The rules must be written to exactly mirror the application's permission model.

A user may read `/presence/{uid}` for any uid where that uid is a participant in any chatroom the current user is also a participant in. Writing presence is only permitted for the current user's own presence path.

A user may read `/chatrooms/{roomId}` only if their uid is a key in the room's `participants` map. A user may write to `/chatrooms/{roomId}/messages` only to create new messages (no editing or deleting), only for their own senderId, and only for message types `text`. The `payment_request`, `payment_submitted`, `receipt`, and `system` message types may only be written by the service account (enforced by checking that the request's auth token has a custom claim `serviceAccount: true`).

A user may read `/invoices/{invoiceId}/status` only if their uid matches either the customer or merchant associated with that invoice. This requires a cross-document lookup which Firebase Realtime Database supports through its rules language.

No unauthenticated access is permitted to any path.

### Chat Room ID Generation

The chat room ID is deterministic and derived from the customer and merchant IDs. The algorithm: sort the two IDs lexicographically, concatenate them with a separator, and take the SHA-256 hash of the result. The hex digest is the room ID, prefixed with `room_`. Determinism ensures that the same two users always get the same room regardless of which party initiates first. The SHA-256 hash ensures the ID is a fixed length regardless of user ID formats and has negligible collision probability.

### Message Push ID and Ordering

Firebase Realtime Database's `push()` function generates IDs that are lexicographically sortable by creation time. This means messages are retrieved in chronological order by default when using `orderByKey()`. No separate timestamp-based sorting is needed for rendering messages in order. The auto-generated push ID is used as the message key — no custom ID generation is needed for messages.

---

## 7. Cache & Queue Layer — Upstash Redis + BullMQ

### Two Redis Clients

The application uses two separate Redis clients for two distinct purposes, and they are initialized separately. They must not be confused.

**Client 1 — @upstash/redis HTTP client.** Used exclusively for caching (price oracle cache, dashboard stats cache, merchant profile cache). This client communicates with Upstash over HTTPS using the REST API. It works in any environment including serverless and edge runtimes. It does not require a persistent TCP connection. This client is initialized in `backend/src/redis/cache.client.ts`.

**Client 2 — ioredis TCP client.** Used exclusively by BullMQ for job queue operations. BullMQ requires a persistent TCP Redis connection for Lua scripts, blocking commands, and pub/sub messaging. Upstash supports ioredis connections via its `rediss://` TLS endpoint. This client is initialized in `backend/src/redis/queue.client.ts`. ioredis is not used for caching — the HTTP client handles all caching operations.

### Cache Key Conventions

All cache keys follow a hierarchical naming pattern: `{service}:{entity}:{identifier}`. Examples: `price:ada_inr` for the ADA/INR rate, `merchant:profile:MC-0042` for a merchant profile, `stats:daily:MC-0042:2025-05-18` for a merchant's daily stats. This convention enables pattern-based cache invalidation (delete all keys matching `stats:daily:MC-0042:*` when a merchant's data changes) and makes the cache contents self-documenting.

### BullMQ Queue Architecture

Four queues are defined, each with its own worker process. All queues share the same ioredis connection.

**Queue 1 — `tx-confirmation`:** Contains one job per submitted invoice. Each job stores the tx hash and invoice ID. The worker polls Blockfrost (with Koios failover) every 20 seconds until 3 confirmations are found, then triggers downstream queues. Job configuration: delay of 20 seconds before first attempt (Cardano block time), maximum 60 attempts, fixed 20-second backoff between attempts, no exponential backoff (uniform Cardano block times make exponential backoff counterproductive).

**Queue 2 — `receipt-generation`:** Added automatically when a `tx-confirmation` job completes successfully. One job per settled invoice. The worker fetches the invoice from MongoDB, constructs the receipt JSON, uploads to Pinata, and updates the Invoice document with the CID. Job configuration: 3 maximum attempts, 30-second exponential backoff (Pinata rate limiting can cause brief failures). Settlement is not blocked by this queue — the invoice moves to `settled` status immediately when confirmation is complete, and receipt generation is best-effort.

**Queue 3 — `notification-dispatch`:** Added when confirmation is complete. One job per settled invoice. The worker fetches FCM tokens for both parties and sends push notifications. Job configuration: 3 maximum attempts, immediate retry on first failure, 5-second backoff on second failure.

**Queue 4 — `invoice-expiry`:** A scheduled repeatable job that runs every 60 seconds. The worker queries MongoDB for all invoices with status `pending` and `expiresAt` in the past. For each such invoice, it updates status to `expired`, writes the update to Firebase, and adds a notification job for both parties. This queue does not use one job per invoice — it is a single batch job that processes all expired invoices in one pass.

### Job Failure Handling

When a job exhausts all retry attempts, BullMQ moves it to the "failed" set. All queues are configured with `removeOnComplete: 100` (keep the 100 most recent completed jobs for debugging) and `removeOnFail: 500` (keep the 500 most recent failed jobs for investigation). Failed `tx-confirmation` jobs trigger a separate action: the invoice status is set to `failed` and notifications are sent. This fallback is implemented in the worker's `failed` event listener on the BullMQ worker object, not as another retry.

---

## 8. Authentication Architecture

### Token Verification Flow

Every protected API request must include a Firebase ID token in the `Authorization: Bearer {token}` header. The authentication middleware performs the following operations in order:

First, the middleware extracts the token from the Authorization header. If the header is absent or malformed, the middleware immediately returns HTTP 401 with error code `AUTH_MISSING_TOKEN`.

Second, the middleware calls `firebaseAdmin.auth().verifyIdToken(token)`. This call verifies the token's cryptographic signature against Google's public keys (cached by the Admin SDK), checks that the token is not expired, and returns the decoded payload including the user's Firebase UID. If verification fails for any reason (expired, malformed, revoked), the middleware returns HTTP 401 with error code `AUTH_INVALID_TOKEN`.

Third, the middleware queries MongoDB for the User document matching the `firebaseUid` from the decoded token. If no document exists, it creates one (upsert). This is the only place in the codebase where a User document is created. The upsert uses `$setOnInsert` to set default values only on creation, and always updates `lastSeen` to the current timestamp.

Fourth, the middleware attaches the full Mongoose User document to `req.user`. All downstream route handlers and service functions access the authenticated user through `req.user` — they never decode tokens themselves.

### Role Authorization Middleware

Role authorization is a separate middleware that runs after the authentication middleware. Two role guards exist: `requireMerchant` (allows only users with role `merchant` or `both`) and `requireCustomer` (allows all authenticated users, since all users are customers by default).

The role is read from the MongoDB User document attached to `req.user`, not from the Firebase token. This ensures that role changes (e.g., completing merchant onboarding) take effect on the next request, not after the token refreshes (which can take up to 1 hour).

### Session and Token Lifecycle

Firebase ID tokens expire after 1 hour. The Firebase Web SDK automatically refreshes tokens using the refresh token before they expire. The backend does not need to handle token refresh — the client SDK does this transparently. The backend only needs to handle the case where a token is presented that is already expired (the user's device was offline during the refresh window), returning HTTP 401 which prompts the client to force a token refresh.

The backend does not issue or maintain its own session tokens. Firebase is the sole identity provider and token issuer. The backend is stateless with respect to sessions.

---

## 9. API Architecture — Express Backend

### Application Bootstrap Sequence

The Express application starts in a strict sequential order that ensures all dependencies are available before the server accepts requests. The sequence is: validate environment variables (exit if invalid), connect to MongoDB (exit if fails), initialize Firebase Admin SDK (exit if fails), initialize Redis clients (log warning if fails, continue — Redis unavailability degrades the price oracle to direct CoinGecko calls but does not prevent the API from serving), start BullMQ workers, register Express middleware in order, register route handlers, start HTTP server on the configured port, log successful startup.

### Middleware Registration Order

Middleware order in Express is significant — middleware runs in registration order. The correct order is: cors middleware (must be first to handle preflight), helmet (security headers), morgan (HTTP request logging, before auth to log all requests including rejected ones), express.json (body parser, needed before validation), rateLimiter (applied globally before auth to protect against DoS), requireAuth (extracts user, must come after body parser), route handlers.

Error handling middleware is registered last, after all routes.

### Route Handler Pattern

Route handlers follow a strict pattern with no exceptions. The handler's only responsibilities are: call the Zod validation schema for the request body, call the appropriate service function with typed arguments extracted from the validated body and from `req.user`, and return the result in the standard response envelope. No business logic lives in a route handler. No database calls live in a route handler.

The standard response envelope for success: `{ success: true, data: <result> }` with the appropriate HTTP status code. The standard response envelope for errors: `{ success: false, error: "<message>", code: "<ERROR_CODE>" }` with the appropriate HTTP status code. This envelope is enforced by the error handler middleware and by the route handler pattern — handlers always call `res.json({ success: true, data: result })` not `res.json(result)`.

### API Versioning

All routes are prefixed with `/api/v1/`. Version 1.0 does not have a `/api/v2/` — the versioning prefix exists to allow non-breaking additions without a flag day migration for clients when breaking changes are required. The Vercel frontend is deployed as a unit with the backend so versioning is less critical for the web client, but the mobile app (once released) cannot be forced to update, making versioned endpoints essential for long-term support.

### Rate Limiting Implementation

Rate limiting uses a sliding window algorithm implemented against the Upstash Redis cache client. Each rate limit check increments a counter key with a TTL equal to the window size. If the counter exceeds the limit, the request is rejected with HTTP 429.

Rate limit configurations by endpoint category: authentication endpoints (register, wallet linking) — 10 requests per minute per IP address. Invoice creation — 30 requests per hour per authenticated user ID. Payment submission — 10 requests per 10 minutes per authenticated user ID. Price oracle — 60 requests per minute per IP (effectively unlimited for legitimate use). All other endpoints — 200 requests per minute per authenticated user ID.

Rate limit keys include the relevant identifier (IP or user ID) and the endpoint category: `ratelimit:auth:{ip}`, `ratelimit:invoice:{userId}`, `ratelimit:payment:{userId}`. Using user ID (not IP) for authenticated endpoints prevents shared IP scenarios (corporate NAT, university networks) from causing legitimate users to hit each other's rate limits.

### Health Check Endpoint

The `/health` endpoint is unauthenticated, not rate limited, and returns within 100 milliseconds. It performs a lightweight check of each dependency: MongoDB (`db.command({ ping: 1 })`), Upstash Redis (a GET on a known non-existent key to verify connectivity), Firebase Admin SDK (check that the app is initialized), and Blockfrost (a cached ping result — actual Blockfrost ping is done by a background job every 5 minutes, not on every health check). The response indicates overall health as `healthy` or `degraded`, with per-dependency status.

---

## 10. Cardano Blockchain Layer

### Unified Indexer Architecture

The blockchain interaction module exposes a single `indexer` object that all other modules use to read from the Cardano blockchain. The indexer internally manages the Blockfrost client and the Koios client, implementing automatic failover between them.

The indexer exposes these methods: `getTransaction(txHash)` returns transaction details, `getTransactionConfirmations(txHash)` returns the number of block confirmations, `getAddressTransactions(address)` returns recent transactions to/from an address, and `getBlock(blockHash)` returns block details. All methods have identical signatures regardless of which underlying client is used.

### Blockfrost Client

The Blockfrost client is a thin wrapper around native `fetch` calls to the Blockfrost REST API. It adds the `project_id` header to every request, handles 404 responses (return null, not throw), handles 429 responses (trigger failover to Koios), handles 5xx responses (trigger failover to Koios), enforces a 5-second timeout on all requests using `AbortSignal.timeout(5000)`, and handles network-level errors (DNS failure, connection refused — trigger failover to Koios).

The Blockfrost client does not implement retry logic itself. Retry logic is the responsibility of the BullMQ job queue for confirmation polling (where retries are meaningful) and the error handler for direct API calls (where the Koios failover is the retry).

### Koios Client

The Koios client mirrors the Blockfrost client's interface exactly. When the indexer calls `getTransaction(txHash)` and Blockfrost fails, the indexer retries the same call using the Koios client. The Koios API endpoint structure differs from Blockfrost's, but this is encapsulated within the respective client implementations. The calling code sees a single unified interface.

Koios requires no API key. The `Content-Type: application/json` and `Accept: application/json` headers are sufficient. Koios uses POST requests with JSON bodies for most endpoints (unlike Blockfrost's GET-heavy API), so the client implementations are not identical in their HTTP mechanics, but their TypeScript interfaces are.

### Transaction Builder

The transaction builder module wraps MeshJS's `Transaction` class to provide application-specific convenience functions. Two builder functions are exposed:

`buildDirectTransfer(invoice)` — Builds an unsigned transaction that sends `invoice.amountLovelace` directly to `invoice.paymentAddress`. Embeds invoice metadata under key `674`. Returns the CBOR hex string of the unsigned transaction.

`buildEscrowDeposit(invoice, customerPubKeyHash)` — Builds an unsigned transaction that sends `invoice.amountLovelace` to the Aiken escrow contract address. Includes a datum constructed from the invoice fields and the customer's public key hash. Returns the CBOR hex string of the unsigned transaction.

Both builders use MeshJS's UTXO selection internally — they do not manually select UTXOs. The customer's UTXOs are fetched from their wallet extension on the frontend and passed to the builder via the API request body (the UTXOs are provided by the frontend because only the user's wallet knows their UTXO set without querying Blockfrost for every payment).

### Confirmation Count Calculation

Confirmation count is calculated as: `latestBlockHeight - transactionBlockHeight`. This requires two values: the block height at which the transaction was included, and the current chain tip's block height. Both are available from Blockfrost (or Koios as fallback). The confirmation count is re-calculated on every polling attempt — it is not stored incrementally. The stored `confirmations` field on the Invoice document reflects the confirmation count at the time of the last poll, which is the value the frontend displays.

---

## 11. Smart Contract Architecture — Aiken

### Contract Design Philosophy

The Aiken escrow contract is intentionally minimal. It enforces exactly one property: funds locked at the contract address for a specific invoice can only leave the contract in one of two valid ways — collected by the merchant before expiry, or refunded to the customer after expiry. The contract does not enforce pricing, merchant identity beyond the public key hash, or any application-level business logic. Simplicity reduces the attack surface and reduces the probability of bugs.

### Datum Type Specification

The datum is a record type containing exactly four fields. The `invoice_id` field is a ByteArray representation of the invoice ID string (UTF-8 encoded). The `merchant_pkh` field is a 28-byte Blake2b-224 hash of the merchant's verification key, which is the payment credential of their wallet address. The `lovelace_amount` field is an integer representing the minimum lovelace that must be received by the merchant's address for the collect path to succeed. The `expires_at` field is a POSIX timestamp in milliseconds as an integer.

### Redeemer Type Specification

The redeemer is a sum type (Aiken's equivalent of a tagged union) with two constructors: `Collect` with no fields, and `Refund` with no fields. The spending path is determined entirely by which constructor is present in the redeemer — no additional data is needed because all necessary data is in the datum.

### Collect Path Validation Logic

When the redeemer is `Collect`, the validator asserts all of the following conditions in a single boolean expression (Aiken uses `and` to combine assertions). All conditions must be true simultaneously:

The transaction's extra signatories list contains the merchant's public key hash from the datum. The transaction's validity interval upper bound is less than the datum's `expires_at` timestamp. The transaction outputs contain at least one output to an address whose payment credential matches the merchant's public key hash, and that output's lovelace value is greater than or equal to `lovelace_amount` from the datum.

### Refund Path Validation Logic

When the redeemer is `Refund`, the validator asserts all of the following conditions simultaneously:

The transaction's validity interval lower bound is greater than the datum's `expires_at` timestamp (the invoice has expired). The transaction's extra signatories list contains the customer's public key hash. The customer's public key hash must be stored in the datum — this requires a fifth field in the datum type: `customer_pkh` (Blake2b-224 hash of the customer's verification key). This field is added to the datum to support the refund path.

### Blueprint and Script Hash

After running `aiken build`, Aiken generates a `plutus.json` file (the blueprint) in the contracts directory. This file contains the compiled UPLC in hex format and the validator's hash (script hash). The script hash is the unique on-chain identifier for this specific version of the contract. Once deployed, the script hash never changes for that version.

The script hash is stored as the `CONTRACT_SCRIPT_HASH` environment variable. The contract address (where funds are locked) is derived from the script hash using Cardano's address derivation formula, which MeshJS can compute given the script hash and the network (preprod or mainnet).

### Reference Script Deployment

The compiled script is deployed to the Cardano network once as a reference script stored at a designated output. This is done by submitting a transaction that creates a UTXO at the developer's own address containing the script as an output reference script. The UTXO reference (transaction hash and output index) is stored as environment variables: `CONTRACT_REF_TX_HASH` and `CONTRACT_REF_OUTPUT_INDEX`. Subsequent transactions that interact with the contract reference this UTXO instead of including the full script bytes inline, reducing transaction fees by approximately 80%.

---

## 12. Wallet Integration Architecture — CIP-30

### Wallet Discovery

On the frontend, `BrowserWallet.getInstalledWallets()` from MeshJS returns an array of wallet descriptors for every CIP-30 compliant extension currently active in the browser. Each descriptor contains the wallet's name, icon URL, and API version. The UI renders these dynamically — the list is not hardcoded. If the array is empty, the UI renders wallet installation guidance with links to install Eternl (recommended for Cardano-native users) and Lace (recommended for users familiar with MetaMask's UX).

### Wallet Enable Flow

When the user selects a wallet, `BrowserWallet.enable(walletName)` is called. This triggers the wallet extension's permission dialog. If the user approves, `enable()` resolves with a `BrowserWallet` instance. If the user rejects, `enable()` rejects with an error — the frontend catches this and shows a "Wallet connection rejected" message without crashing.

### Address Reading Strategy

After enabling the wallet, two address reads are performed. `wallet.getUsedAddresses()` returns an array of enterprise addresses that have appeared in prior transactions on this account. These are the addresses the user has actually used as destinations before. `wallet.getChangeAddress()` returns the wallet's change address (also an enterprise address) which is the primary address for new funds.

The application uses the first element of `getUsedAddresses()` as the primary registered address. If `getUsedAddresses()` returns an empty array (new wallet with no transaction history), `getChangeAddress()` is used as the fallback. This handles both new and established wallets correctly.

HD wallet address rotation (Cardano HD wallets derive a new address for each transaction for privacy) is handled by using the stake address (`getRewardAddresses()`) as the canonical identifier for address lookup via Blockfrost's accounts API, which returns all enterprise addresses associated with a stake key. This allows the confirmation pipeline to find transactions sent to any of the user's derived addresses.

### Transaction Signing Flow

The frontend receives a CBOR hex string from the backend (the unsigned transaction). It calls `wallet.signTx(cbor, true)`. The second argument `true` indicates partial signing — only the user's key is needed. The wallet extension presents the transaction details to the user (recipient address, amount, fee) in its native UI. If the user approves, `signTx()` resolves with the signed CBOR hex string. If rejected, it rejects with an error.

The signed CBOR is then submitted to the Cardano network. Submission can happen in two ways: via `wallet.submitTx(signedCbor)` (the wallet extension broadcasts the transaction) or via the backend (the frontend sends the signed CBOR to a submit endpoint, which calls Blockfrost's transaction submission API). The preferred approach is via the wallet extension, as it uses the wallet's own node connections. The backend submission path is the fallback for wallets that do not implement `submitTx`.

After successful submission, the wallet extension returns the transaction hash. This hash is sent to the backend's payment submission endpoint.

### Wallet State Persistence

The connected wallet's name is stored in `localStorage` under the key `zeropay_wallet`. On every page load, the `WalletContext` reads this key and attempts silent reconnection. Many wallet extensions grant silent reconnection to previously approved dApps without requiring a new approval dialog. If the extension is no longer installed or refuses silent reconnection, the user sees the wallet selection screen as if connecting for the first time. `localStorage` is cleared when the user explicitly disconnects their wallet from the app's settings.

---

## 13. Payment Orchestration Pipeline

### Pipeline Overview

The payment orchestration pipeline is the sequence of operations from invoice creation to final settlement. It spans synchronous API calls, blockchain interactions, and asynchronous job queue processing. Understanding this pipeline is essential for debugging payment issues.

### Stage 1 — Invoice Creation (Synchronous)

The merchant calls `POST /api/v1/invoices/create`. The route handler validates the request, calls `InvoiceService.create()`, and returns the invoice document. This is synchronous and returns within 500 milliseconds. At the end of this stage: the Invoice document exists in MongoDB with status `pending`, a payment request message exists in Firebase (if chatRoomId was provided), and the invoice expiry timer has started.

### Stage 2 — Transaction Building (Synchronous)

The customer's frontend calls `POST /api/v1/payments/build-tx` with the invoice ID. The route handler fetches the invoice, calls the transaction builder, and returns the unsigned CBOR. This is synchronous and returns within 1 second. The invoice status does not change at this stage — the customer has not committed to anything yet. Multiple calls to build-tx for the same invoice are idempotent.

### Stage 3 — Wallet Signing (Client-Side, No Backend Involvement)

The customer's wallet extension signs the CBOR. This happens entirely in the browser, with no API calls. The backend is not involved. This stage can take anywhere from 2 seconds (quick approve) to several minutes (user reads the details carefully or steps away). The invoice remains in `pending` status during this time.

### Stage 4 — Transaction Submission (Synchronous)

The customer's frontend submits the signed transaction to the Cardano network (via wallet extension or via the backend's submit endpoint) and receives a tx hash. The frontend immediately calls `POST /api/v1/payments/submit` with the tx hash. The backend validates the invoice is still pending (not expired), updates its status to `submitted`, stores the tx hash, writes the new status to Firebase, and enqueues a `tx-confirmation` job with a 20-second delay. This is synchronous and returns HTTP 202 within 200 milliseconds. The actual confirmation will arrive asynchronously.

### Stage 5 — Confirmation Polling (Asynchronous, BullMQ)

The `tx-confirmation` worker wakes up 20 seconds after the job was enqueued. It calls the unified indexer's `getTransactionConfirmations(txHash)`. If Blockfrost cannot find the transaction yet (not yet in a block), the worker throws an error, causing BullMQ to schedule a retry in 20 seconds. This repeats up to 60 times (~20 minutes total).

When the transaction is first found in a block, the worker updates the invoice to `confirming` and records the block height. It writes the `confirming` status to Firebase. On subsequent polls (now at 60-second intervals), the worker re-checks the confirmation count. When 3+ confirmations are reached, the worker updates the invoice to `confirmed`, writes to Firebase, enqueues `receipt-generation` and `notification-dispatch` jobs, and completes.

### Stage 6 — Receipt Generation (Asynchronous, BullMQ)

The `receipt-generation` worker fetches the complete Invoice, Merchant, and User documents needed for the receipt JSON. It constructs the receipt object and uploads it to Pinata. On success, it updates the Invoice with the CID and receipt URL, updates the Merchant's `totalReceived` and `totalOrders` aggregates, and sets the Invoice status to `settled`. It writes the `settled` status to Firebase. This stage runs concurrently with the notification dispatch.

### Stage 7 — Notification Dispatch (Asynchronous, BullMQ)

The `notification-dispatch` worker fetches the merchant's and customer's FCM tokens from their User documents. It sends two push notifications using the Firebase Admin SDK. If a token is stale (FCM returns `REGISTRATION_TOKEN_NOT_REGISTERED`), the worker updates the User document to clear the stale token.

### Error Recovery in Each Stage

Stages 1-4 are synchronous — if they fail, the client receives an error response and can retry. Stage 5 has built-in retry logic in BullMQ with a 20-minute total window. Stage 6 has 3 retries with 30-second backoff — if it fails completely, the invoice is settled without a receipt and a manual re-run can be triggered. Stage 7 has 3 retries — notification failure does not affect settlement.

---

## 14. Price Oracle Architecture

### Cache Strategy

The price oracle is a read-through cache. Every request to the price oracle endpoint first reads from the Upstash Redis cache key `price:ada_inr`. If the key exists (not expired), the cached value is returned immediately — no external network call occurs. If the key does not exist (expired or never populated), the oracle fetches from CoinGecko, stores the result in Redis with a 60-second TTL, and returns it.

The 60-second TTL means the cache is refreshed at most once per minute, regardless of how many invoice creations are happening. At 100 invoice creations per minute (far beyond current expected scale), the system makes exactly one CoinGecko API call per minute rather than 100. This is the key reason CoinGecko rate limits are not a concern.

### Stale Rate Handling

If CoinGecko is unreachable when the cache is empty, the oracle falls back to the most recently written cache value by checking a secondary key `price:ada_inr:last_known`. This key has no TTL — it persists indefinitely and is overwritten every time a fresh rate is cached. If the last known rate is more than 5 minutes old, the response includes `{ stale: true, staleBySeconds: <seconds>, rate: <lastKnownRate> }`. Invoice creation proceeds with the stale rate — the staleness is visible in the response and labeled in the UI.

### Currency Conversion Precision

The conversion from INR paise to lovelace uses integer arithmetic throughout. The formula is: `lovelaceAmount = Math.round((amountPaise / 100) / adaInrRate * 1_000_000)`. The `Math.round()` is applied once at the final step. All intermediate calculations use floating-point (unavoidable given the ADA/INR rate is a floating-point decimal), but the final lovelace amount stored and used for all payment operations is always an integer.

The minimum lovelace requirement (1,000,000 lovelace) is enforced after this calculation. If the calculated lovelace is below the minimum (because the INR amount is very small relative to the ADA price), the endpoint returns HTTP 400 with the minimum INR amount at the current rate in the error response, so the merchant knows exactly what the minimum is.

---

## 15. IPFS Receipt Architecture

### Receipt Document Specification

The receipt is a JSON document with a fixed schema. Schema version is stored in the document to enable future parsers to understand historical receipts. The receipt contains: `schemaVersion` (string, "1.0"), `receiptId` (same as invoiceId), `generatedAt` (ISO 8601 UTC timestamp), `cardanoPayVersion` (application version string), `network` (cardano network: preprod or mainnet), `merchant` (object: id, shopName, category, paymentAddress), `customer` (object: displayName, walletAddress — only if the customer is a registered app user), `payment` (object: amountINR in paise, amountLovelace, adaInrRate, description, items array), `blockchain` (object: txHash, blockHeight, confirmationsAtSettlement, settledAt UTC timestamp), and `ipfs` (object: selfCid — populated after pinning, this field is added in a second update after the document is pinned and its CID is known).

### Two-Phase CID Storage

There is an inherent bootstrap problem: the receipt document references its own CID, but the CID is derived from the document's content (which includes the CID field). This is resolved with a two-phase approach. Phase 1: generate and pin the receipt JSON with the `selfCid` field set to `"pending"`. Pinata returns the CID. Phase 2: store the CID in MongoDB's Invoice document and in Firebase. The receipt document itself is not updated (IPFS content is immutable — updating it would create a new CID). The `selfCid: "pending"` is acceptable because any system parsing the receipt can determine the self-CID by hashing the document itself.

### Pinata Upload Parameters

The Pinata upload request includes: `pinataContent` (the receipt JSON object, serialized by Pinata's client), `pinataMetadata` with `name` set to the invoiceId for human readability in the Pinata dashboard, and `pinataOptions` with `cidVersion: 1` to use CIDv1 encoding (more future-proof than CIDv0, and produces a consistent 59-character Base32 string). The resulting IPFS URL uses the Pinata public gateway: `https://gateway.pinata.cloud/ipfs/{cid}`.

### On-Chain CID Registration

After the receipt CID is obtained, the backend submits a metadata-only transaction to Cardano. This is a minimal ADA transaction (minimum UTXO: 1,000,000 lovelace) from the backend's own operational wallet to a designated metadata storage address. The metadata under key `674` contains: `type: "zeropay_receipt"`, `invoiceId: <id>`, `receiptCid: <cid>`. This backend operational wallet requires a small amount of ADA to fund these metadata transactions — this is the one operational cost that requires ADA (not INR). Approximately 1.17 ADA per receipt (1 ADA minimum UTXO + 0.17 ADA tx fee). This ADA is recoverable: the minimum UTXO at the metadata storage address accumulates and can be reclaimed by spending those UTXOs.

---

## 16. Push Notification Architecture

### FCM Token Lifecycle

FCM tokens are updated on every session start by the frontend. The update call is fire-and-forget: `POST /api/v1/users/fcm-token` with the current token in the body. This endpoint is unauthenticated in the rate-limit sense (it uses auth for user identification, but it is not rate limited strictly because legitimate clients call it exactly once per session). The backend updates `User.fcmToken` with the new value, overwriting the old one.

FCM tokens become invalid when: the user uninstalls and reinstalls the app, the user clears app data, or FCM rotates the token (rare but possible). Invalid tokens cause FCM to return `REGISTRATION_TOKEN_NOT_REGISTERED`. When the notification worker receives this error, it immediately updates the User document to set `fcmToken: null` and logs the invalidation. The next session start will provide a fresh token.

### Notification Payload Structure

Every FCM notification has two parts: a `notification` object (for display when the app is in the background or closed) and a `data` object (for handling when the app is in the foreground, and for deep linking when tapped from the notification shade).

The `notification` object contains `title` and `body` strings. The `data` object contains: `invoiceId`, `merchantId`, `type` (the notification type: `payment_request`, `payment_confirmed`, etc.), and `route` (the target app route: `/invoice/{invoiceId}` or `/chat/{roomId}`).

When the user taps a notification, the app reads the `data.route` field and navigates there. This requires the app to handle deep link navigation from notification taps in both foreground (app is open) and background (app is closed, opened by the tap) states. React Navigation's deep linking configuration handles this on mobile. React Router's programmatic navigation handles this on web.

---

## 17. Chat Architecture

### Message Rendering Engine

The chat interface renders messages using a type-dispatch pattern. The message list component iterates over the messages array from Firebase. For each message, it reads the `type` field and renders the appropriate component: `TextBubble`, `PaymentRequestCard`, `PaymentSubmittedCard`, `ReceiptCard`, or `SystemMessage`. This dispatch is implemented as a simple object map from message type string to component, not as a chain of if-else statements.

### Payment Request Card Live Updates

The `PaymentRequestCard` component subscribes to the Firebase path `/invoices/{invoiceId}/status` using Firebase's `onValue` listener. This subscription is created when the card mounts and cleaned up when it unmounts (standard React `useEffect` cleanup). When the backend writes a new status to this path (via the job queue), Firebase pushes the update to all subscribed clients within ~500 milliseconds. The card re-renders with the new status, updating the button state and visual indicator in place — no new message is created.

### Message Pagination

The initial message load uses `limitToLast(50)` on the Firebase query, loading the 50 most recent messages. As the user scrolls up, older messages are loaded on demand: `endBefore(oldestLoadedPushId).limitToLast(20)`. Firebase's lexicographically-sortable push IDs make this efficient. There is no concept of a "page number" — pagination is cursor-based using the oldest visible message's push ID.

### Optimistic UI for Sent Messages

When the user sends a text message, the message is written to Firebase using `push()`. Firebase's `push()` call is optimistic by design: the SDK immediately adds the message to the local cache and syncs it to the server. The user sees their message appear instantly. If the sync fails (no network), the message is shown in a "pending" state and will sync when connectivity is restored.

Payment request messages are not sent optimistically. They require the backend to create the invoice first, so there is a genuine latency between the merchant tapping "Send Request" and the bubble appearing. The frontend shows a loading indicator during this window (typically 300-500 milliseconds).

---

## 18. QR System Architecture

### Static Merchant QR

The static merchant QR encodes the URI `zeropay://pay?m={merchantId}`. This URI scheme is registered as a custom URL scheme for the mobile app (configured in `app.json` for Expo). When the mobile app is installed and a user scans this URI with any QR code reader, the operating system opens the ZeroPay app at the correct route. On the web app, the QR is scanned using the browser's camera via the `html5-qrcode` library, which calls the app's QR handler with the decoded URI.

The static QR is generated client-side using `react-qr-code` which produces an SVG. The SVG is rendered in the browser with no network call. The download button uses the browser's SVG-to-Canvas-to-PNG pipeline (or offers the raw SVG for scalable use). No backend endpoint is involved in QR generation.

### Dynamic Invoice QR

The counter checkout dynamic QR encodes a Cardano payment URI. The URI format encodes: the payment address (the merchant's address or the contract address), the amount in lovelace, and the invoice ID as a metadata hint. The exact format follows the draft Cardano payment URI CIP. This URI is encodable as a QR code that standard Cardano wallets (Eternl, Nami, Lace) can scan and parse — the wallet pre-fills the recipient address and amount, and the user only needs to approve.

The dynamic QR changes with each invoice. It is generated client-side once the backend confirms the invoice is created and returns the invoice data. The QR component re-renders whenever the invoice ID changes.

### QR Scanning on Web

Web-based QR scanning uses the browser's `getUserMedia` API to access the device camera. The `html5-qrcode` library wraps this API and decodes QR codes from the video stream. Camera permissions are requested only when the user explicitly opens the scanner. If permission is denied, the user is offered a manual merchant ID entry field as an alternative.

---

## 19. Frontend Architecture — React Web App

### Context Architecture

Two global contexts exist: `AuthContext` and `WalletContext`. All other state is local to components or managed by TanStack Query.

`AuthContext` wraps the Firebase Auth state listener. It exposes: the current Firebase user object (or null), the current MongoDB User document (fetched once after Firebase auth and cached), a loading state, and convenience methods for sign-in, sign-out, and getting the current ID token. Every component that needs user identity reads from this context.

`WalletContext` wraps the CIP-30 wallet state. It exposes: the connected wallet instance (or null), the user's Cardano address (or null), the user's ADA balance (or null), a list of available wallet extensions, a `connect(walletName)` function, a `disconnect()` function, and a `signAndSubmitTx(cbor)` function. The context attempts silent reconnection on mount using the stored wallet name from localStorage.

### TanStack Query Configuration

TanStack Query (React Query) is configured with: `staleTime: 30_000` (data is considered fresh for 30 seconds, preventing refetches on every route change), `gcTime: 300_000` (unused data is kept in cache for 5 minutes), `retry: 2` (failed requests retry twice with exponential backoff), `refetchOnWindowFocus: true` (data refetches when the user returns to the tab, important for payment status that may have changed while the user was in another tab). The query client is created once and provided at the root of the component tree.

### API Client

All backend API calls go through a single typed `apiClient` module. This module is not a class — it is a collection of exported async functions, each corresponding to one API endpoint. The functions accept typed request parameters and return typed response data. Error handling is centralized in this module: if any API call returns `success: false`, the function throws a typed `ApiError` object that TanStack Query's error handling picks up.

The `apiClient` module uses the Firebase ID token from `AuthContext` on every call. The token is retrieved via `firebaseUser.getIdToken()`, which returns the cached token if valid or a refreshed token if the cached one has expired. This is transparent to the calling code.

### Route Architecture

Routes are defined using React Router v6's data router. Protected routes (those requiring authentication) use a layout route that checks the AuthContext and redirects to the login page if no user is present. The route tree: public routes (login, merchant profile lookup for QR scan), protected routes (dashboard, chat list, chat room, invoice detail, counter checkout, settings, wallet connect).

---

## 20. Mobile Architecture — React Native + Expo

### Expo Managed Workflow

The mobile app uses Expo's managed workflow. The managed workflow's benefit is that building for Android and iOS does not require local native toolchains (Xcode, Android Studio). Builds run on Expo's EAS Build servers. This is essential for a small team on a zero-cost infrastructure constraint.

The trade-off of managed workflow is that native modules not included in Expo's managed set require a custom development build (Expo's term for an app that includes custom native code but is still built via EAS). The wallet integration (CIP-62 WalletConnect for Cardano mobile wallets) requires a custom development build because WalletConnect's React Native SDK includes native modules.

### Shared Code Strategy

The mobile app shares all business logic with the web app through two mechanisms. First, `packages/shared-types` is available to both apps through the npm workspace. Second, the API client logic is the same: the mobile app uses the same `apiClient` functions, adapted to use Expo's `SecureStore` for token storage instead of the browser's Firebase SDK, and adapted to use React Native's `fetch` (which is available globally).

Firebase SDK requires the `@react-native-firebase` packages on mobile (different from the web SDK). The interface is similar but not identical — the auth, database, and messaging APIs have React Native-specific implementations.

### Expo Router

The mobile app uses Expo Router for file-system-based routing. Route files in the `app/` directory map to screens. Deep linking from push notifications uses the `expo-linking` module to parse incoming URLs and navigate to the correct route. The notification payload's `route` field is used directly as the deep link path.

---

## 21. Security Architecture

### The No-Keys Invariant

The single most important security invariant: no private key material ever passes through the application's backend. This invariant is enforced architecturally, not just by policy. The backend has no key generation code, no key storage schema fields, no key derivation imports, and no signing primitives. Code review must reject any pull request that imports a cryptographic signing library to the backend without a documented exception (the only exception being the Firebase Admin SDK's JWT verification, which uses public keys, not private keys).

### Monetary Calculation Authority

The backend is the sole authority on all monetary calculations. The lovelace amount for any payment is calculated once, stored in the Invoice document, and never recalculated or overridden by frontend-provided values. The payment building endpoint ignores any amount in the request body — it reads only the invoice ID and fetches the amount from MongoDB. The confirmation poller verifies the on-chain amount against the stored lovelace amount — a discrepancy prevents settlement.

### Input Sanitization

All string inputs that will be stored in MongoDB are stripped of leading and trailing whitespace before storage. Description fields and item name fields are validated against a character allowlist (alphanumeric, common punctuation, and standard Unicode letters for regional language support). Cardano addresses are validated against the bech32 format specification and the network magic before any storage or transaction building. Lovelace amounts in requests (if any are accepted) are validated as integers within the range [1_000_000, 10_000_000_000_000] (1 ADA to 10M ADA).

### HTTPS Enforcement

All traffic to the backend and frontend is HTTPS. Render and Vercel enforce HTTPS automatically and redirect HTTP to HTTPS. The backend's Express application does not need to implement HTTP-to-HTTPS redirection because it sits behind these platforms. The application does not use HTTP for any external API calls — all outbound calls (CoinGecko, Blockfrost, Koios, Pinata, Firebase) use HTTPS.

### Secrets Rotation Plan

If any secret is compromised (accidentally committed to Git, visible in logs, leaked in a data breach): the Firebase service account key must be revoked in the Firebase Console and a new key generated; the MongoDB URI password must be changed in Atlas; the Blockfrost project ID must be regenerated; the Pinata JWT must be revoked; the Upstash Redis credentials must be rotated. These operations are done in the respective service dashboards. After rotation, the new secrets are updated in Render's environment variable panel and in GitHub repository secrets. The backend must be restarted after Render variable updates.

---

## 22. Error Handling Architecture

### Centralized Error Handler

Express's error handling middleware is the single place where all unhandled errors are converted to HTTP responses. Route handlers and service functions throw typed errors. The error handler categorizes errors by type: `ZodError` → HTTP 400 with field-level validation details, `MongoServerError` with code 11000 (duplicate key) → HTTP 409 with the conflicting field name, custom `ApiError` class instances → HTTP status from the error's `statusCode` property, `Error` instances with specific message patterns → mapped HTTP status codes, and all other errors → HTTP 500 with a generic message (the actual error is logged to Sentry).

### Custom ApiError Class

The `ApiError` class extends the standard `Error` class with two additional fields: `statusCode` (HTTP status code) and `code` (machine-readable error code string). Service functions throw `ApiError` instances for business logic violations. Route handlers do not catch these — they propagate to the centralized error handler. This means service functions contain no response-writing code.

### Error Logging

Every error that reaches the centralized error handler is logged to Sentry using `Sentry.captureException()` with the request URL, method, and authenticated user ID as additional context. Errors with status codes below 500 (client errors) are logged at Sentry's `info` level — they are expected and do not require immediate investigation. Errors with status codes 500+ (server errors) are logged at Sentry's `error` level and trigger an alert notification.

---

## 23. Logging & Observability

### Structured Logging

All backend logging uses a structured JSON format rather than free-form strings. The log entry structure is: `{ timestamp, level, message, service, requestId, userId, data }`. The `requestId` is a UUID generated per request by middleware and attached to `req.requestId`. Using structured JSON allows log aggregation tools (Render's log viewer, future Datadog or Logtail integration) to filter and search log entries by field values.

Log levels follow the standard: `error` for exceptions and failures that require investigation, `warn` for expected but notable events (stale price oracle, Blockfrost failover, stale FCM token cleanup), `info` for significant business events (invoice created, payment submitted, invoice settled), and `debug` for detailed diagnostic information (disabled in production).

### Sentry Integration Points

Sentry is initialized in three places: the Express backend (using `@sentry/node`), the React web app (using `@sentry/react` with the React Router integration for automatic page view tracking), and the React Native mobile app (using `@sentry/react-native`). Each integration uses a separate Sentry DSN from the same Sentry project, tagged with the platform (`backend`, `web`, `mobile`).

In the backend, Sentry's `requestHandler` middleware is registered before all routes and `errorHandler` middleware is registered after all routes. This automatically captures request context for every error.

### BullMQ Observability

Bull Board (BullMQ's built-in dashboard) is mounted at `/admin/queues` and protected by a middleware that checks a secret token in the request query parameter (`?token={ADMIN_TOKEN}`). This is not a robust authentication mechanism — it is sufficient for a development/monitoring tool that exposes no write operations and is accessed only by the development team. The `ADMIN_TOKEN` is a random 32-character string stored as an environment variable.

The dashboard shows live queue depths, job processing rates, recent completed and failed jobs, and job retry history. Checking this dashboard when a payment is reported stuck is the first step in diagnosis.

---

## 24. CI/CD Pipeline Architecture

### Pipeline Trigger Events

The GitHub Actions CI pipeline triggers on two events: pull requests (targeting the `main` branch) run the lint, type-check, and test jobs. Pushes to the `main` branch (after PR merge) run the lint, type-check, test jobs followed by the deploy jobs. Direct pushes to `main` are not permitted by branch protection rules — all code reaches `main` via pull requests.

### CI Job: Lint and Type Check

This job runs on every PR and push. It installs npm workspace dependencies at the root level, then runs ESLint across all TypeScript files in `apps/web/src`, `apps/mobile`, and `backend/src`. It then runs `tsc --noEmit` with the strict TypeScript configuration for both the web app and the backend. The Aiken contracts are checked separately by running `aiken check` in the `contracts/` directory, which runs the Aiken type checker and all property tests. This job must pass for the deploy job to run.

### CI Job: Test

This job runs after the lint job passes. It requires a test MongoDB Atlas connection string (separate from production) and the Cardano preprod Blockfrost project ID, stored as GitHub repository secrets. Unit tests run with `jest --testPathPattern=unit`. Integration tests run with `jest --testPathPattern=integration` against real Blockfrost (preprod) and real MongoDB (test cluster). End-to-end tests do not run in CI — they run manually pre-release.

### Deploy Job: Backend (Render)

When CI passes and the push is to `main`, the deploy workflow sends a POST request to Render's deploy hook URL (stored as a GitHub secret). Render pulls the latest commit from the connected GitHub repository, builds the backend, and deploys it. The hook triggers a zero-downtime deployment: Render spins up the new instance, verifies it starts successfully (health check passes), and then routes traffic to the new instance before terminating the old one.

### Deploy Job: Web App (Vercel)

Vercel's GitHub integration handles web app deployment automatically — no GitHub Actions job is needed. Vercel detects pushes to `main`, builds the web app in Vercel's build environment, and deploys to its CDN. Preview deployments are created automatically for every PR, providing a live preview URL for code review without any configuration.

### Aiken Contract Deployment

Aiken contract deployment is not automated in CI/CD. It is a manual, deliberate operation performed by a developer using the Aiken CLI and a developer-controlled wallet. The compiled `plutus.json` blueprint is committed to the repository (it is a build artifact, not a secret). The deployment transaction is submitted once per network per contract version. The resulting script hash is then stored in the environment variables for that network's deployment.

---

## 25. Infrastructure & Deployment

### Render Configuration

The Render web service is configured with: build command `cd backend && npm install && npm run build`, start command `cd backend && node dist/index.js`, health check path `/health`, environment set to `Node`. The build compiles TypeScript to JavaScript in `backend/dist/`. The compiled output is what runs — not `ts-node` or similar transpilation at runtime. TypeScript compilation happens at build time only.

The Render free tier instance type is the `Free` tier with 512 MB RAM and 0.5 CPU. This is sufficient for the application's requirements under the expected load profile (bursty, not sustained).

UptimeRobot is configured to send a GET request to `{RENDER_URL}/health` every 10 minutes. The health endpoint responds with HTTP 200 within 100 milliseconds, satisfying Render's keep-alive requirement. UptimeRobot's free plan supports 50 monitors with 5-minute minimum check intervals — the 10-minute interval for this use case is well within the free tier.

### Vercel Configuration

The Vercel project is configured to build from the `apps/web` directory. The build command is `npm run build` (Vite's build command). The output directory is `dist`. Environment variables for the web app (Firebase public config, backend API base URL) are set in Vercel's project settings as production environment variables.

Vercel's hobby plan deploys to Vercel's global edge CDN with no bandwidth limits for static assets. API routes are not used — all API calls go to the Render backend, not to Vercel Functions.

### MongoDB Atlas Configuration

The Atlas cluster is configured with: cluster tier M0 (free, shared), region `AP_SOUTH_1` (Mumbai), database name `zeropay`. The database user has `readWrite` access to the `zeropay` database only. Network access is set to allow all IP addresses (`0.0.0.0/0`) because Render's free tier does not provide a static IP. Atlas M0 does not support VPC peering or private endpoints.

Performance Advisor (Atlas's free query optimization tool) should be checked weekly during the first month of production to identify slow queries that need additional indexes.

### Firebase Configuration

The Firebase project is configured with Realtime Database in `ap-south-1` for lowest latency from Indian users. The security rules are deployed via the Firebase CLI (`firebase deploy --only database`). Authentication is enabled for Email/Password and Phone providers. FCM is enabled with no additional configuration (it is on by default in any Firebase project).

---

## 26. Performance Architecture

### Dashboard Query Optimization

The merchant dashboard's 7-day revenue chart requires aggregating the Invoice collection by day. Running this aggregation on every page load is prohibitive at scale. A scheduled job runs at midnight UTC using BullMQ's repeatable job feature. The job aggregates the previous 7 days' data per active merchant and writes the results to Redis keys `stats:daily:{merchantId}:{date}` with a 25-hour TTL (slightly more than one day so the cache is never empty between midnight runs). The dashboard's chart endpoint reads from these Redis keys, returning in under 50 milliseconds.

The dashboard's "today's total" widget cannot use the precomputed cache because it needs real-time accuracy. It runs a MongoDB aggregation on the Invoice collection filtered by `merchantId`, `status: settled`, and `createdAt >= today UTC midnight`. This query uses the compound index on `merchantId + status + createdAt` and runs in under 100 milliseconds at the expected Invoice collection size.

### Blockfrost API Call Reduction

Confirmation polling is the largest consumer of Blockfrost API calls. The polling frequency adapts based on invoice status:

When the invoice is in `submitted` status (waiting for the transaction to appear in any block), polling happens every 20 seconds because each Cardano block is approximately 20 seconds.

When the invoice is in `confirming` status (transaction found in a block, waiting for 2 more confirmations), polling switches to every 60 seconds because each additional confirmation takes approximately 20 seconds. Checking every 20 seconds provides no advantage since the confirmation count can only increment once per block.

This adaptive frequency reduces Blockfrost calls by approximately 66% for each confirmation-stage invoice, tripling the number of simultaneous payments the system can handle within the 50,000 daily request limit.

### Frontend Bundle Optimization

The web app uses Vite's code splitting. Each route is a lazy-loaded chunk. The initial bundle contains only the authentication logic, the Firebase SDK, and the routing configuration. The merchant dashboard, chat interface, and payment components are loaded on demand when navigated to. This reduces the initial page load weight to under 200 KB of JavaScript (gzipped), achieving the target LCP of under 3 seconds on 4G connections.

MeshJS is only imported in components that require wallet interaction (the wallet connect page and the payment page). It is not imported in the dashboard or chat components, preventing its ~300 KB weight from loading on routes that do not need it.

---

## 27. Testing Architecture

### Unit Test Conventions

Unit tests live alongside the code they test in `__tests__` subdirectories. Test file names mirror the source file names with a `.test.ts` suffix. Unit tests use Jest with the `ts-jest` transformer for TypeScript support. Unit tests must not make network calls, must not access a real database, and must not access real environment variables. All external dependencies are mocked using Jest's module mocking.

The `backend/src/services/` directory is the highest-priority target for unit test coverage. Every service function that performs a calculation (price conversion, invoice ID generation, confirmation count evaluation) must have unit tests covering: the happy path, the minimum valid input, the maximum valid input, and all documented error conditions.

### Aiken Property Tests

The Aiken test file at `contracts/tests/payment_escrow_test.ak` uses Aiken's built-in property testing framework. Tests are written using Aiken's `test` keyword with descriptive names. Tests cover:

Collect succeeds when merchant signs before expiry with correct output amount. Collect fails when merchant does not sign. Collect fails when merchant signs after expiry. Collect fails when output amount is less than datum amount. Refund succeeds when customer signs after expiry. Refund fails when customer tries to refund before expiry. Refund fails when non-customer tries to refund after expiry. Random property tests using Aiken's `fuzz` module verify that the contract behaves correctly across a range of randomly generated lovelace amounts, expiry times, and public key hashes.

### Integration Test Strategy

Integration tests run against real external services (preprod Blockfrost, test MongoDB Atlas cluster) using the test environment configuration. They test the full request-to-response cycle for each API endpoint, including authentication, validation, service logic, and database writes.

Integration tests are slower than unit tests (each may take 1-10 seconds due to network calls) and are run in a separate Jest project configuration with a longer timeout. They are not run on every save during development — they run in CI and as pre-release validation.

### Test Data Management

Integration tests create their own test data and clean it up after each test. A `afterEach` cleanup hook deletes any MongoDB documents created during the test using a test-specific prefix on IDs (all test invoiceIds start with `TEST-`). The test MongoDB cluster is a separate Atlas M0 cluster from the production and development clusters, provisioned for testing only.

---

## 28. Data Flow Diagrams

### Payment Creation Flow (Text Representation)

Merchant (browser) → POST /api/v1/invoices/create → Auth Middleware verifies Firebase token → Validate request body with Zod → InvoiceService.create() → Price Oracle (Redis cache or CoinGecko) → MongoDB: create Invoice document (status: pending) → Firebase Admin SDK: write payment_request message to /chatrooms/{roomId}/messages → Return invoice data to browser → Merchant's chat UI shows payment request bubble → Firebase client SDK: Customer's browser receives payment_request message in real time.

### Payment Confirmation Flow (Text Representation)

Customer (browser) → wallet.signTx(cbor) → wallet extension approval dialog → wallet.submitTx(signedCbor) → Cardano network accepts transaction → tx hash returned to browser → POST /api/v1/payments/submit with tx hash → Auth Middleware → Invoice status updated to submitted in MongoDB → Firebase: /invoices/{invoiceId}/status updated to submitted → BullMQ: tx-confirmation job enqueued with 20s delay → Return HTTP 202 to browser.

BullMQ worker wakes after 20s → Blockfrost: getTransactionConfirmations(txHash) → if not found: throw error, BullMQ retries in 20s → if found (1 confirmation): MongoDB update to confirming, Firebase update to confirming → BullMQ retries at 60s interval → Blockfrost: 3 confirmations found → MongoDB update to confirmed → Firebase update to confirmed → Enqueue receipt-generation job and notification-dispatch job → Receipt worker: fetch invoice, build JSON, upload to Pinata, get CID, update MongoDB, update Firebase, update MongoDB status to settled → Notification worker: fetch FCM tokens, send FCM messages to merchant and customer.

### QR Scan to Payment Flow (Text Representation)

Customer scans merchant QR (encodes zeropay://pay?m=MC-0042) → App decodes URI → GET /api/v1/merchants/MC-0042 (unauthenticated) → Returns merchant profile → App checks for existing chat room between customer and merchant in Firebase → If exists: open room; if not: POST /api/v1/chat/room → create room in Firebase → App navigates to chat room → Merchant creates invoice in chat → (see Payment Creation Flow above).

---

## 29. Dependency Graph & Third-Party Services

### Critical Path Dependencies

These services, if unavailable, directly prevent payment processing:

**MongoDB Atlas:** Invoice creation, reading, and status updates all require MongoDB. If MongoDB is unavailable, the API cannot function. No fallback exists — MongoDB is the source of truth.

**Firebase Admin SDK:** Writing payment status updates to Firebase is part of every status transition. If Firebase is unavailable, status updates do not reach the frontend in real time, but the database state in MongoDB remains correct. The frontend can poll the REST API as a degraded fallback.

**Blockfrost (primary):** Confirmation polling requires a Cardano indexer. Blockfrost failure triggers Koios failover — this is the designed fallback, not a critical outage.

**Koios (fallback):** If both Blockfrost and Koios are unavailable simultaneously, confirmation polling pauses until one recovers. This is a theoretical scenario given Koios is community-run with many nodes.

### Non-Critical Path Dependencies

These services, if unavailable, degrade the user experience but do not prevent settlement:

**CoinGecko:** Price oracle falls back to stale cache. Invoice creation is mildly degraded (stale rate) but functional.

**Pinata:** Receipt generation fails and retries. Settlement proceeds without a receipt initially. Receipt is generated when Pinata recovers.

**FCM (Firebase Cloud Messaging):** Push notifications are not delivered. Users must check the app manually for payment status. Settlement proceeds normally.

**UptimeRobot:** If UptimeRobot stops pinging the Render backend, the first request after an idle period will have a ~50 second cold start delay. This degrades UX but does not prevent functionality.

### Third-Party Service Version Pinning

All npm package versions are pinned using exact versions (no `^` or `~` prefixes) in `package.json`. This prevents unexpected breaking changes from automatic upgrades. A weekly automated dependency update check (Dependabot or Renovate) creates pull requests for version updates, which are reviewed and tested before merging.

---

## 30. Technical Debt Register

### TD-001: No formal database migration system

**Description:** Schema changes to MongoDB models are applied by updating the Mongoose schema definition and running the application. There is no formal migration system (like Flyway or Liquibase) to track schema versions or apply migrations atomically.

**Impact:** Risky for production schema changes. A bad schema change cannot be rolled back automatically.

**Mitigation until resolved:** All schema changes must be backward compatible (additive only) for the first 6 months. Breaking schema changes require a coordinated deployment.

**Resolution path:** Evaluate `migrate-mongo` or `mongoose-migrate` for Version 2.0.

---

### TD-002: No distributed tracing

**Description:** The system has logging and error monitoring (Sentry) but no distributed tracing (no Jaeger, Zipkin, or OpenTelemetry). Following a payment's journey across the API server, the BullMQ worker, and multiple blockchain API calls requires manually correlating log entries by `requestId` and `invoiceId`.

**Impact:** Debugging slow or failed payments in production is more difficult than necessary.

**Resolution path:** Add OpenTelemetry instrumentation in Version 2.0. OpenTelemetry has free-tier compatible exporters.

---

### TD-003: BullMQ ioredis connection to Upstash is TCP-based over TLS

**Description:** BullMQ requires a persistent TCP connection. Upstash's free tier supports this via the `rediss://` connection string. However, Upstash's free tier has connection count limits. A single BullMQ instance with 4 workers could consume 4+ connections simultaneously.

**Impact:** May hit connection limits under load. Exact limits are not documented by Upstash for the free tier.

**Resolution path:** Monitor connection count in Upstash dashboard. Upgrade to Upstash Pay-As-You-Go (no connection limits) if the free tier proves insufficient.

---

### TD-004: No smart contract audit

**Description:** The Aiken escrow contract has been tested by the development team but has not been audited by an independent smart contract security expert.

**Impact:** An undiscovered bug in the contract could result in locked or stolen user funds on mainnet.

**Resolution path:** Do not deploy to Cardano mainnet until an audit is complete. Run on preprod indefinitely or with very low transaction amounts (under 10 ADA) until audit is done. Seek pro-bono audit from the Cardano security community or delay mainnet launch by 4-6 weeks to schedule an external review.

---

### TD-005: FCM token refresh is session-only, not persistent

**Description:** FCM tokens are updated when the user starts a new session. If a user's FCM token is invalidated between sessions (app reinstall, app data clear) and the user does not open the app, the backend has a stale token and cannot deliver notifications.

**Impact:** Payment confirmation notifications are not delivered to users who have reinstalled the app without reopening it.

**Resolution path:** Implement FCM token validation on invoice creation — check whether the merchant's FCM token is still valid before the payment flow starts, so a stale token is detected proactively.

---

*ZeroPay — Technical Requirements Document*
*Team Null Void · Cardano Hackathon Asia IBW 2025 → Production*
*This document is the authoritative technical reference for all engineering decisions.*
*Deviations from this document must be recorded in the Open Decisions Log before implementation.*