# ZeroPay — God-Level Implementation Plan
### Team Null Void · Cardano Hackathon Asia IBW 2025 → Production Roadmap

---

## Table of Contents

1. [Project Vision & North Star](#1-project-vision--north-star)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [Zero-Cost Infrastructure Map](#3-zero-cost-infrastructure-map)
4. [Data Architecture & Domain Model](#4-data-architecture--domain-model)
5. [Phase 01 — Foundation & Project Setup](#5-phase-01--foundation--project-setup)
6. [Phase 02 — Identity & Authentication Layer](#6-phase-02--identity--authentication-layer)
7. [Phase 03 — Cardano Wallet Integration](#7-phase-03--cardano-wallet-integration)
8. [Phase 04 — Backend API & Business Logic](#8-phase-04--backend-api--business-logic)
9. [Phase 05 — Payment Orchestration Engine](#9-phase-05--payment-orchestration-engine)
10. [Phase 06 — Smart Contract Layer (Aiken)](#10-phase-06--smart-contract-layer-aiken)
11. [Phase 07 — Real-Time Chat Interface](#11-phase-07--real-time-chat-interface)
12. [Phase 08 — QR Payment System](#12-phase-08--qr-payment-system)
13. [Phase 09 — Merchant Dashboard](#13-phase-09--merchant-dashboard)
14. [Phase 10 — Price Oracle & ADA/INR Conversion](#14-phase-10--price-oracle--adainr-conversion)
15. [Phase 11 — IPFS Receipt System](#15-phase-11--ipfs-receipt-system)
16. [Phase 12 — Push Notifications & Alerts](#16-phase-12--push-notifications--alerts)
17. [Phase 13 — Mobile App (React Native + Expo)](#17-phase-13--mobile-app-react-native--expo)
18. [Phase 14 — Blockchain Confirmation Pipeline](#18-phase-14--blockchain-confirmation-pipeline)
19. [Phase 15 — Security Hardening](#19-phase-15--security-hardening)
20. [Phase 16 — Testing Strategy](#20-phase-16--testing-strategy)
21. [Phase 17 — DevOps & CI/CD Pipeline](#21-phase-17--devops--cicd-pipeline)
22. [Phase 18 — Monitoring & Observability](#22-phase-18--monitoring--observability)
23. [Master Timeline & Milestones](#23-master-timeline--milestones)
24. [Risk Register](#24-risk-register)
25. [Definition of Done](#25-definition-of-done)

---

## 1. Project Vision & North Star

### What ZeroPay Is

ZeroPay is a blockchain-native payment application that makes sending and receiving ADA feel as natural as messaging on WhatsApp. It is not a crypto wallet. It is not a DeFi protocol. It is a real-world payment layer built on top of Cardano's infrastructure, designed specifically for small merchants, street vendors, and everyday customers in markets like India where digital payment adoption is high but crypto remains complex.

The product lives at the intersection of three things the world already understands — messaging, QR payments, and instant settlements — and replaces their centralized backends with Cardano's blockchain.

### North Star Metric

The single metric that defines success: **number of payment conversations completed end-to-end** (customer sends ADA → merchant receives settled ADA → receipt generated). Every decision in this plan should be measured against whether it moves this number.

### Who This Is Built For

**Primary user — the small merchant.** A chai stall owner in Indore. A street vendor at a mela. A neighborhood grocery. They have a smartphone, they understand QR payments from UPI, but they do not understand wallets, gas fees, or blockchain explorers. The product must never force them to understand those things.

**Secondary user — the customer.** A young professional or student who holds ADA in a Cardano wallet and wants to spend it at real physical shops without copy-pasting a 60-character wallet address.

### What Success Looks Like at Launch

A merchant can set up their account, print their QR code, and start receiving ADA payments in under 10 minutes. A customer can scan a QR, see the INR equivalent, approve the transaction in their wallet, and receive a receipt — all within 90 seconds. Neither user needs to know what a UTXO is.

---

## 2. System Architecture Overview

### Architectural Principle: Layers Never Bleed Into Each Other

The system is built in clean, isolated layers. The chat UI never talks to the blockchain directly. The backend never holds private keys. The blockchain layer never knows about chat rooms. This separation is not just good engineering — it is the difference between a hackathon demo and a production system.

### The Seven Layers

**Layer 1 — Presentation Layer**
Everything the user sees and touches. This includes the web app (React with Vite), the mobile app (React Native with Expo), and the merchant's QR code printout. This layer only ever talks to the backend API and to Firebase Realtime Database. It never calls Blockfrost, MongoDB, or any blockchain node directly.

**Layer 2 — API Gateway Layer**
A single Node.js + Express server hosted on Render's free tier. Every request from the frontend passes through here. This layer handles authentication verification, rate limiting, input validation, and routing. It acts as the single source of truth about what the application is allowed to do.

**Layer 3 — Business Logic Layer**
Service modules inside the backend that handle specific domains: invoice management, merchant operations, user management, chat room orchestration, and price oracle queries. These services are pure functions that talk to the database and return results — they have no knowledge of Express request/response objects.

**Layer 4 — Job Queue Layer**
An asynchronous processing layer built on BullMQ using Upstash Redis. This handles everything that cannot block a user-facing HTTP request: polling for blockchain confirmations, generating IPFS receipts, sending push notifications after settlement, and expiring stale invoices. Nothing slow happens in a synchronous request handler.

**Layer 5 — Blockchain Interaction Layer**
A dedicated module that communicates with the Cardano network through Blockfrost (primary) and Koios (failover). This layer is responsible for building unsigned transactions using MeshJS, submitting signed transactions, polling for confirmation status, and reading on-chain metadata. It is the only layer allowed to talk to Cardano directly.

**Layer 6 — Smart Contract Layer**
Aiken validator scripts deployed on the Cardano preprod testnet (and eventually mainnet). These are immutable programs that live on-chain and enforce payment rules: the right amount must go to the right address, the merchant must sign the collection, expired invoices can be refunded. This layer runs entirely on Cardano — it does not involve your servers at all.

**Layer 7 — Storage Layer**
Three distinct storage systems, each used for what it does best. MongoDB Atlas stores persistent business data (users, merchants, invoices, transactions). Upstash Redis stores ephemeral state (active payment statuses, price cache, job queues). Firebase Realtime Database stores chat messages and live payment status updates that need to push to connected clients instantly.

### How a Payment Flows Across Layers

When a merchant requests payment from a customer inside the chat, a message is written to Firebase Realtime Database (Layer 1 → Layer 7). The backend creates an invoice in MongoDB and stores the ADA lovelace amount calculated from the live INR rate (Layer 3 → Layer 7). The customer's frontend builds an unsigned Cardano transaction using MeshJS, the customer signs it in their browser wallet without any private key ever touching your server (Layer 1). The signed transaction is submitted to Cardano (Layer 5). The job queue begins polling Blockfrost every 20 seconds for confirmations (Layer 4). Once 3 confirmations are reached, the invoice is settled, an IPFS receipt is generated, the chat message is updated in Firebase, and a push notification is sent to both parties (Layers 4, 5, 7).

---

## 3. Zero-Cost Infrastructure Map

### Philosophy: Pay With Limits, Not With Rupees

Every service used in this stack has a free tier that is sufficient for development, testing, and early production (hundreds of transactions per day). The only "cost" is working within rate limits — which is handled by the architecture itself (Redis caching, job queues, Koios failover). Total monthly infrastructure cost to you: ₹0.

**Important distinction:** Cardano transaction fees (~0.17 ADA per payment) are paid by the user from their own wallet, just like UPI has a per-transaction cost borne by the merchant's bank. You, the developer, pay nothing per transaction.

### Service Map

| What You Need | Free Service | Free Limit | Notes |
|---|---|---|---|
| Web app hosting | Vercel Hobby | Unlimited deploys | Connect GitHub, auto-deploys |
| Backend hosting | Render Free | 750 hrs/month | Sleeps after 15 min idle — fix with UptimeRobot |
| Database | MongoDB Atlas M0 | 512 MB forever | Sufficient for tens of thousands of tx |
| Cache + queues | Upstash Redis | 10,000 cmds/day | More than enough for early traffic |
| Realtime chat | Firebase Spark | 1 GB storage, 10 GB/month transfer | Free forever, no credit card |
| Auth | Firebase Auth | 10,000 phone OTPs/month | Unlimited email/password |
| Push notifications | Firebase FCM | Unlimited | Always free |
| Blockchain reads | Blockfrost Free | 50,000 req/day | Primary indexer |
| Blockchain fallback | Koios | No limits | Community-run, open source |
| Wallet SDK | MeshJS | Open source | No license, no cost |
| Smart contracts | Aiken | Open source | Compiler, testing framework, all free |
| Test ADA | Cardano Faucet | Free tADA on request | For preprod testing |
| IPFS receipts | Pinata Free | 1 GB pinning | Sufficient for thousands of receipts |
| Mobile builds | Expo EAS Free | 30 builds/month | Android + iOS |
| CI/CD | GitHub Actions | 2,000 min/month (private) | Unlimited for public repos |
| Error monitoring | Sentry Free | 5,000 errors/month | Production-grade alerting |
| Uptime monitor | UptimeRobot Free | 50 monitors, 5-min checks | Keeps Render awake |
| Price data | CoinGecko Public API | 50 calls/min, no key | ADA/INR real-time rate |

### Render Sleep Problem — The Only Real Friction

Render's free tier spins down the server after 15 minutes of no incoming requests. The first request after a sleep takes ~50 seconds to respond (cold start). For a payment app this is unacceptable. The fix is simple and free: UptimeRobot pings your Render URL every 10 minutes, keeping it permanently awake. Set this up on day one and never think about it again.

---

## 4. Data Architecture & Domain Model

### Core Entities and Their Relationships

The domain model has six core entities. Understanding how they relate is essential before writing a single line of code.

**User** is the base identity of any person using the app. A user can be a customer, a merchant, or both. A user has exactly one Firebase Auth identity and optionally one connected Cardano wallet address. The wallet address is provided by the user connecting their browser extension wallet — you never generate or store keys.

**Merchant** is a profile layer on top of a User. Not every User is a Merchant. A Merchant has a shop name, a category, a registered Cardano payment address where they receive funds, a generated merchantId used in QR codes, and aggregated stats (total orders, total ADA received). A User becomes a Merchant by completing the merchant onboarding flow.

**Invoice** is the core transaction object. It is created by a Merchant and represents a specific payment request. An Invoice has a fixed INR amount, a calculated ADA lovelace amount (locked at creation time using the exchange rate at that moment), the merchant's payment address (snapshotted at creation so rate changes don't affect in-flight payments), a status that moves through a defined state machine, an expiry timestamp, and links to both the chat room and the Cardano transaction hash.

**Transaction** is the on-chain record. It is created once a customer submits a signed Cardano transaction. It stores the tx hash, block height, confirmation count, and links back to the Invoice it settles. This is separate from Invoice because one Invoice maps to exactly one Transaction, but you may need to handle edge cases (double-spend attempts, stale tx, chain rollback).

**ChatRoom** lives in Firebase Realtime Database, not MongoDB. A ChatRoom is a channel between one Customer and one Merchant. It contains an ordered list of Messages. ChatRooms are created the first time a customer scans a merchant's QR code or initiates contact. Each ChatRoom has a unique roomId derived from the combination of customer user ID and merchant ID.

**Message** also lives in Firebase and belongs to a ChatRoom. Messages have a type field that changes how the UI renders them: a plain text message, a payment request bubble (showing invoice details and a Pay button), a payment submitted bubble (showing the tx hash), a payment confirmed bubble, or a receipt message with a link to the IPFS document.

### Invoice Status Machine — The Most Critical Design Decision

An Invoice moves through exactly these states in order. No state can be skipped. No state can go backwards (except expired from pending).

- **pending** — Invoice created, waiting for customer to initiate payment. Has an expiry timer.
- **submitted** — Customer has submitted a signed transaction to Cardano. The tx hash is known.
- **confirming** — The transaction has been found on-chain but has fewer than 3 block confirmations. The job queue is actively polling.
- **confirmed** — The transaction has 3 or more block confirmations. Safe to treat as final.
- **settled** — Post-confirmation processing is complete: IPFS receipt generated, merchant stats updated, push notification sent.
- **expired** — Invoice was pending for longer than the expiry window (default 10 minutes) without a tx being submitted.
- **failed** — A submitted transaction was not found on-chain within the polling window, or a chain rollback was detected.

Transitions only happen in the job queue, never in a synchronous API call. The API sets status to `submitted` when it receives a tx hash. Everything after that is the job queue's responsibility.

### MongoDB Collection Design Principles

Every collection uses compound indexes on the fields most commonly queried together. The Invoice collection indexes on `merchantId + status + createdAt` to power the merchant dashboard efficiently. The Transaction collection indexes on `txHash` (unique) for deduplication. All monetary amounts are stored in lovelace (the smallest Cardano unit, equivalent to satoshi for Bitcoin) to avoid floating point errors. INR amounts are stored as integers in paise (multiply by 100) for the same reason.

### Firebase Realtime Database Structure

The Firebase database has a flat structure by design. Deep nesting in Firebase Realtime Database creates performance problems because reads at a parent node download all children. The top-level keys are: `/users/{uid}/` for user presence and online status, `/chatrooms/{roomId}/` for room metadata, `/chatrooms/{roomId}/messages/{msgId}/` for individual messages, and `/invoices/{invoiceId}/status` for real-time status that the frontend listens to.

The invoice status path in Firebase is a separate copy of the Invoice's status from MongoDB. It exists solely so the frontend can receive a real-time push update when the job queue settles a payment, without polling the REST API. When the job queue updates MongoDB, it also writes to this Firebase path. The frontend listens to it and updates the UI instantly.

---

## 5. Phase 01 — Foundation & Project Setup

### Duration: 3 days
### Goal: A working monorepo that all three apps (web, mobile, backend) run from, with all free services configured and environment secrets in place.

### Monorepo Structure Decision

Use a standard npm workspace monorepo without Turborepo or Nx — those tools add complexity that is not justified at this stage. The root `package.json` declares three workspaces: `apps/web` (React + Vite), `apps/mobile` (Expo), and `backend`. A fourth directory `packages/shared-types` holds TypeScript type definitions shared between the web frontend and the backend — this prevents the type drift that causes bugs where the frontend expects a field the backend stopped sending.

The smart contracts live in a completely separate directory called `contracts/` at the root and are managed by Aiken's own tooling, not npm. They are intentionally isolated because the Aiken build system is not JavaScript and should not be mixed into the npm workspace.

### Service Configuration Order

Configure services in this exact order because later services depend on earlier ones:

First, create the GitHub repository and push the initial empty monorepo structure. Every service you configure next will connect to this repo via OAuth. Set the repo to private. GitHub Actions is free for private repos up to 2,000 minutes per month.

Second, set up Firebase. Create a project in the Firebase Console. Enable Authentication with the Email/Password provider and the Phone provider. Enable Realtime Database in `ap-south-1` (Mumbai) for lowest latency from India. Go to Project Settings → Service Accounts → Generate New Private Key. This downloads a JSON file. Base64-encode this file and store it as a GitHub secret called `FIREBASE_SERVICE_ACCOUNT_JSON`. You will use this in both the backend environment and in GitHub Actions.

Third, create MongoDB Atlas. Choose the M0 free cluster, region `AP_SOUTH_1` (Mumbai). Create a database user with a strong password. Whitelist `0.0.0.0/0` for IP access (Render's IPs change, so broad access is needed for the free tier — in production you would use VPC peering). Copy the connection string. Never commit this to Git — it goes in the backend's `.env` file and as a GitHub secret.

Fourth, create Upstash Redis. Choose the free plan, region closest to Mumbai. Copy the REST URL and REST token. Upstash exposes Redis via HTTPS with a REST API, which means it works from any serverless or free-tier environment without a persistent TCP connection.

Fifth, create a Blockfrost account. Create a project on the `preprod` network. Copy the project ID. This is your API key for reading the Cardano preprod blockchain. When you are ready to go to mainnet, you create a second project on the `mainnet` network — the API interface is identical, only the URL prefix changes.

Sixth, create a Pinata account. Navigate to API Keys and generate a new API key with pinning permissions. Copy the JWT. This is used to upload receipt JSON files to IPFS.

Seventh, connect the `backend` directory to Render. Create a new Web Service, connect GitHub, point to the backend directory, set the build command and start command, and add all environment variables from your `.env` file. Render will attempt a first deploy — this will fail until you have actual code, and that is fine.

Eighth, connect the `apps/web` directory to Vercel. Connect GitHub, point to the web app directory, and leave all settings default. Vercel auto-detects Vite and configures the build correctly.

Ninth, set up UptimeRobot. Create a new HTTP(s) monitor pointing to your Render URL's health endpoint. Set the check interval to 10 minutes. This is the only configuration that keeps Render's free tier permanently alive.

### Environment Variable Management

All secrets live in three places: a `.env` file in the `backend` directory (never committed to Git, always in `.gitignore`), GitHub repository secrets (used by Actions for CI/CD), and Render's environment variable panel (copied manually from the `.env` file). The `.env` file is the canonical source of truth for local development. GitHub secrets are the canonical source for CI. Render's panel is for production.

Create a `.env.example` file that lists every variable name with no values. This file IS committed to Git. Every new developer who clones the repo knows exactly which variables to fill in.

---

## 6. Phase 02 — Identity & Authentication Layer

### Duration: 4 days
### Goal: Users can create accounts with phone OTP or email, and the backend can verify their identity on every request.

### Authentication Strategy

The app uses Firebase Authentication as the identity provider. This is a deliberate choice: Firebase Auth handles the complexities of OTP delivery, session management, token refresh, and account security for free. Your backend does not issue or manage passwords or session tokens — it only verifies Firebase ID tokens.

The flow is: the user authenticates with Firebase on the frontend (phone OTP or email), receives a Firebase ID token (a JWT signed by Google's keys), and sends this token in the `Authorization: Bearer` header with every API request. The backend middleware calls Firebase Admin SDK to verify the token, which involves checking the signature against Google's public key and the token's expiry time. If valid, the middleware either finds or creates a User document in MongoDB and attaches it to the request object for downstream handlers.

This architecture means your backend never stores passwords, never issues tokens, and never has to handle token expiry logic. All of that is Firebase's problem.

### Merchant vs Customer Role Architecture

Roles are stored on the User document in MongoDB, not in Firebase Custom Claims. Firebase Custom Claims would require a server call to set them and would be baked into the token — meaning a role change would not take effect until the user's token refreshes (up to 1 hour). A MongoDB role field is checked fresh on every request, so role changes are instant.

A user starts with the `customer` role. When they complete merchant onboarding (fill in shop name, connect wallet), their role changes to `merchant`. A user who is both a customer and a merchant gets the role `both`. The backend middleware reads this role from MongoDB on every protected request and enforces it.

### Merchant Onboarding Flow — Step by Step

The onboarding flow is four distinct screens, each completing one atomic action before advancing. This matters because network failures are common on mobile networks in India — partial completions must be recoverable.

**Screen 1 — Basic signup.** The user enters their phone number, receives a Firebase OTP, verifies it. Firebase creates an Auth account. The backend creates a User document in MongoDB. The user lands on the dashboard in customer mode.

**Screen 2 — Become a merchant.** The user clicks "Set up merchant account." They enter their shop name and select a category. The backend creates a Merchant document linked to their User. At this point they are a merchant, but without a wallet address — they cannot receive payments yet.

**Screen 3 — Connect Cardano wallet.** A modal shows all installed CIP-30 compatible browser wallet extensions (Nami, Eternl, Lace, Flint) detected automatically. The user clicks their preferred wallet. The wallet extension prompts them to approve the connection. The frontend reads their receiving address and sends it to the backend. The backend updates the Merchant document's `paymentAddress` field. From this point, payments can be received at this address.

**Screen 4 — Get your QR code.** The app generates a QR code that encodes the merchant's unique URL: `zeropay://pay?m=MC-0001`. The merchant sees this on screen and can download it as a PNG to print. A large-format print-ready version is also available. The QR code never needs to change unless the merchant wants to use a different wallet address.

---

## 7. Phase 03 — Cardano Wallet Integration

### Duration: 4 days
### Goal: The app can connect to any CIP-30 browser wallet, read addresses, and sign and submit transactions.

### CIP-30 Standard — What It Is and Why It Matters

CIP-30 is the Cardano Improvement Proposal that standardizes how web apps communicate with browser wallet extensions. It defines a JavaScript API that every compliant Cardano wallet extension injects into the browser's `window` object. This means your app can connect to Nami, Eternl, Lace, Flint, Typhon, GeroWallet, or any future CIP-30-compliant wallet using identical code. You never target a specific wallet — you target the CIP-30 interface.

This is the Cardano equivalent of how MetaMask and other EVM wallets use the EIP-1193 standard. The key operations you will use are: `enable()` to request wallet connection, `getUsedAddresses()` to get the user's receiving address, `getBalance()` to check available ADA, `signTx()` to have the user sign a transaction without exposing their key, and `submitTx()` to broadcast the signed transaction to the network.

### MeshJS — The SDK That Does the Heavy Lifting

MeshJS is an open-source TypeScript SDK specifically built for Cardano development. It wraps the low-level CBOR encoding of Cardano transactions into readable, chainable JavaScript. Use MeshJS for all transaction building — do not attempt to build raw UTXO transactions manually, as the Cardano UTXO model is complex and getting the fee calculation or input selection wrong will cause transactions to fail or overpay.

The transaction building process in MeshJS works as follows: you create a `Transaction` object, specify a recipient address and a lovelace amount, add metadata (the invoice ID), set the network (preprod or mainnet), and call `build()`. This produces an unsigned transaction in CBOR format as a hex string. This hex string is what you send to the customer's frontend. The frontend passes it to the CIP-30 wallet's `signTx()` method, which prompts the user to approve the transaction in their wallet extension. The wallet signs it and returns another hex string (the signed CBOR). You then call `submitTx()` with this signed string to broadcast it to the Cardano network.

### The "No Private Keys on Your Server" Rule

This is the single most important security rule in this entire plan. Your backend never holds, generates, stores, or touches any private key. When a payment is initiated, your backend builds an unsigned transaction and sends it to the user's browser. The user's wallet extension signs it locally on their device. The private key never leaves the user's device. Your server only sees the already-signed transaction, which is safe to broadcast.

This architecture is non-negotiable. Any deviation from it is a security vulnerability. If you are ever tempted to "hold a key for convenience," it means you need to redesign the flow, not make an exception.

### Wallet State Management Strategy

The wallet connection state is stored in React Context at the app level. The context stores: the connected wallet instance, the user's Cardano address, the user's available ADA balance (fetched from the wallet), and a loading state. This context is initialized from `localStorage` — if the user previously connected a wallet, the app attempts to reconnect automatically on page load without requiring another approval click from the user.

The wallet balance displayed to the user is fetched from the wallet extension itself (which reads the blockchain), not from Blockfrost. This is because the wallet extension handles UTXO selection and knows the real spendable balance after accounting for UTXOs locked in contracts. Blockfrost is used for confirming received payments, not for checking the sending balance.

---

## 8. Phase 04 — Backend API & Business Logic

### Duration: 7 days
### Goal: A fully working REST API that handles all user-facing operations with proper validation, authentication, and error handling.

### API Design Principles

Every endpoint follows a consistent contract. Successful responses always include a `data` field containing the result. Error responses always include an `error` field with a human-readable message and a `code` field with a machine-readable error code. HTTP status codes are used semantically: 200 for success, 201 for created, 400 for invalid input, 401 for unauthenticated, 403 for unauthorized, 404 for not found, 429 for rate limited, 500 for server error.

All monetary amounts in API requests and responses are in INR paise (integer) or ADA lovelace (integer), never in floating-point ADA or rupees. This prevents rounding errors that would cause payments to be underpaid or overpaid by fractions. The frontend is responsible for converting these integer values to human-readable strings (divide by 100 for INR paise to rupees, divide by 1,000,000 for lovelace to ADA) before displaying them.

### Rate Limiting Strategy

Rate limiting runs on Upstash Redis using a sliding window algorithm. Different endpoint categories get different limits: authentication endpoints (login, register) are limited to 10 requests per minute per IP to prevent OTP spam. Payment creation endpoints are limited to 30 per hour per authenticated user to prevent invoice spam. General API endpoints are limited to 200 requests per minute per authenticated user. These limits are generous enough that no legitimate user will ever hit them, but tight enough to prevent abuse from bots or buggy clients.

### Input Validation

Every request body is validated using Zod schemas before any business logic runs. If validation fails, the request is rejected with a 400 error and a message that tells the user exactly which field is wrong. This is placed in a middleware layer so validation is never forgotten. Common validations: wallet addresses must match the Cardano bech32 format, INR amounts must be positive integers in paise, invoice descriptions must be under 140 characters (matching Cardano metadata limits), merchant category must be one of the defined enum values.

### Critical API Endpoints — Detailed Behavior

**POST /api/invoices/create** — Called by a merchant to create a payment request. Validates that the merchant exists and is active. Fetches the live ADA/INR rate from the price oracle (which reads from Redis cache first, then CoinGecko). Calculates the lovelace amount by dividing the INR amount by the rate and multiplying by 1,000,000, then rounding to the nearest integer. Enforces a minimum of 1,000,000 lovelace (1 ADA) due to Cardano's minimum UTXO requirement. Creates the Invoice document in MongoDB with status `pending` and an expiry 10 minutes from now. If a `chatRoomId` was included in the request, writes a payment request message to Firebase Realtime Database at the correct chat path. Returns the complete invoice object including the calculated lovelace amount and the merchant's payment address.

**POST /api/payments/build-tx** — Called by the customer's frontend when they click Pay on a payment request. Validates the invoice exists, is in `pending` status, and has not expired. Uses MeshJS to construct an unsigned Cardano transaction that sends exactly `amountLovelace` to the invoice's `paymentAddress`, with the invoice ID embedded in the transaction metadata under key `674` (the Cardano community's standard for application metadata). Returns the unsigned transaction as a CBOR hex string. Does not change the invoice status yet — the customer has not signed anything.

**POST /api/payments/submit** — Called by the customer's frontend after they have signed the transaction with their wallet and received a tx hash back from the Cardano network. Updates the invoice status to `submitted` and stores the tx hash. Writes the tx hash and new status to Firebase so the merchant's UI updates in real time. Enqueues a job in BullMQ to begin polling for confirmations. Returns immediately with a 202 Accepted — the actual confirmation will arrive asynchronously.

**GET /api/price/ada-inr** — Returns the current ADA/INR exchange rate. First checks Upstash Redis for a cached rate (TTL: 60 seconds). If cached, returns it immediately. If not cached, fetches from CoinGecko's public API, caches the result, and returns it. This endpoint is called every time the customer opens a payment request, so they always see the current price before approving.

---

## 9. Phase 05 — Payment Orchestration Engine

### Duration: 5 days
### Goal: The system reliably converts a signed transaction hash into a settled invoice with an IPFS receipt, handling all blockchain timing and edge cases.

### Why Asynchronous Processing Is Non-Negotiable

A Cardano block is produced roughly every 20 seconds. A transaction needs 3 blocks to be considered safely confirmed — that is 60 seconds minimum from submission to settlement. An HTTP request cannot hold open for 60+ seconds. More critically, the user should not have to wait on a loading screen for 60+ seconds just to know their payment is being processed. The correct solution is asynchronous processing: accept the transaction hash, enqueue a background job, respond immediately with "payment submitted," and push updates to the user via Firebase as the blockchain confirms.

### BullMQ Job Queue Architecture

The job queue has three distinct queue types, each with its own worker process:

**Confirmation Polling Queue** — The most important queue. Each job represents one active payment that needs watching. When the API receives a submitted tx hash, it adds a job to this queue with a 20-second delay (the approximate Cardano block time). The worker checks Blockfrost for the transaction's block height. If not found yet, the job throws an error, causing BullMQ to retry after another 20 seconds. This continues for up to 60 attempts (about 20 minutes), after which the job is marked as failed and the invoice status is set to `failed`. When the transaction is found and has 3+ confirmations, the worker marks the invoice as `confirmed` and triggers the next two queues.

**Receipt Generation Queue** — Triggered automatically when a payment is confirmed. The worker fetches the complete invoice from MongoDB, constructs a structured JSON receipt object (containing all relevant details), and sends it to Pinata's IPFS pinning API. Pinata returns a CID (Content Identifier — the IPFS hash of the file). The worker saves this CID and its public IPFS URL back to the Invoice document and updates the invoice status to `settled`. It also updates the Merchant document's total received amount and total order count.

**Notification Queue** — Also triggered after confirmation. The worker fetches the FCM tokens of both the merchant and the customer from their User documents and sends targeted push notifications using Firebase Cloud Messaging. The merchant receives "Payment received: ₹150 from [Customer Name]." The customer receives "Payment confirmed. View receipt." Both notifications include the invoice ID as payload data so tapping the notification opens the correct screen.

### Blockfrost + Koios Failover Logic

Every call to Blockfrost is wrapped in a try/catch. If Blockfrost returns a 5xx error, a 429 rate limit response, or times out after 5 seconds, the code immediately retries the same request against Koios, which requires no API key and has no stated rate limits (it is funded by the Cardano community). If Koios also fails, the error is propagated up to BullMQ, which handles the retry with its configured backoff. This failover is invisible to the user and ensures the confirmation pipeline continues working even during Blockfrost outages.

### Chain Rollback Detection

Cardano has probabilistic finality, which means there is a small chance that a transaction confirmed at block height N gets rolled back if a chain fork occurs. This is extremely rare (probability decreases exponentially with each confirmation) but must be handled. After an invoice is marked as `settled`, a periodic job runs every hour that checks all invoices settled in the last 24 hours and verifies their tx hashes are still present at their recorded block heights. If a settled tx is no longer found on-chain, the invoice is flagged for manual review and both the merchant and the customer are notified. This edge case has never affected real users, but the code must handle it.

---

## 10. Phase 06 — Smart Contract Layer (Aiken)

### Duration: 6 days
### Goal: A deployed Aiken smart contract on Cardano preprod that provides trustless payment escrow, eliminating the need for either party to trust the other or the app.

### Why Smart Contracts When Simple Transfers Work

Without smart contracts, ZeroPay is a communication layer on top of direct ADA transfers. The merchant creates an invoice and shares their address. The customer sends ADA to that address. This works, but it has problems: there is no way to enforce that the customer sends exactly the right amount, there is no automatic refund mechanism if the invoice expires, and there is no on-chain proof that the payment was for a specific invoice (the metadata alone is not enforceable).

With an Aiken payment escrow contract, the flow changes: the customer sends ADA to the *contract address* (not directly to the merchant), with the invoice ID and merchant's public key hash in the datum. The contract enforces that only the merchant can collect the funds (by requiring their signature), only the exact correct amount can be collected, and after the invoice expires the customer can reclaim their ADA. This makes the payment trustless — neither the merchant, the customer, nor your app can steal or misroute the funds.

### Aiken Language Overview

Aiken is a functional language designed specifically for Cardano smart contracts. It compiles to UPLC (Untyped Plutus Lambda Calculus), which is what runs on-chain. Aiken's syntax is influenced by Rust and Elm — it is statically typed, exhaustively pattern-matched, and has no mutable state. The Aiken toolchain includes a compiler (`aiken build`), an automatic test framework (`aiken check`), and a blueprint generator that produces a JSON file describing your contract's interface for use in transaction building.

### What the Escrow Contract Enforces

The contract has two spending paths: Collect and Refund.

The **Collect** path is used by the merchant after the customer has locked funds. The contract verifies three conditions must all be true simultaneously: the transaction must be signed by the public key hash stored in the datum (proving the merchant is the one collecting), the output to the merchant's address must contain at least the lovelace amount specified in the datum (preventing the merchant from collecting less and leaving dust), and the current transaction validity interval must be within the invoice expiry time (preventing collection of expired payments).

The **Refund** path is used by the customer if the invoice expires without the merchant collecting. The contract verifies: the current transaction slot must be after the expiry time in the datum (preventing premature refunds), and the transaction must be signed by the customer's public key hash stored in the datum.

The contract does not enforce the exact amount locked by the customer — this is intentional, as Cardano requires a minimum UTXO, and the customer may have slightly more than the invoice amount in the UTXO they select. The contract only enforces the minimum the merchant can receive.

### Contract Deployment Strategy

For development and testing, all contracts are deployed on the Cardano **preprod** network using free test ADA from the faucet. The contract's script hash (its unique on-chain identifier) is stored as a constant in the backend's configuration. This hash never changes for a given deployed contract — if you update the contract, you deploy a new version and update the configuration.

For the transition to mainnet, the same Aiken source is compiled with no changes (the UPLC output is network-agnostic), deployed once on mainnet (this costs a small ADA fee from your own wallet — the only real-ADA cost in the entire project), and the new script hash is used for mainnet transactions. Existing preprod invoices are unaffected.

### Reference Script Strategy (Cost Optimization)

Deploying a Plutus/Aiken script inline in every transaction that uses it is expensive because you pay for the script bytes each time. The correct approach is to deploy the script as a **reference script** — store it once at a dedicated output address on-chain, and reference that output in all transactions that use the script. This way, subsequent transactions that interact with the contract pay only a small reference fee instead of the full script size in fees. MeshJS supports reference scripts natively.

---

## 11. Phase 07 — Real-Time Chat Interface

### Duration: 6 days
### Goal: A WhatsApp-style chat interface where payment requests appear as interactive bubbles inside the conversation.

### Firebase Realtime Database as the Chat Backend

Firebase Realtime Database is chosen over building a WebSocket server from scratch for a specific reason: it handles all the complexity of reconnection, offline message queuing, and multi-device sync for free. When a phone loses network coverage for 30 seconds and reconnects, Firebase automatically delivers any messages the client missed. Building this behavior on a custom WebSocket server would take weeks and would still be less reliable.

The Firebase Realtime Database SDK on the frontend uses a persistent WebSocket connection to Firebase's servers. When any data at a listened path changes, Firebase pushes the update to all connected clients within milliseconds. This is how the chat interface updates in real time when a payment is confirmed — the backend job queue writes to Firebase, and every connected client that has that chatroom open receives the update instantly.

### Chat Room Architecture

A chat room is created the first time a customer initiates contact with a merchant (by scanning their QR code). The room ID is derived by hashing the combination of the customer's user ID and the merchant's ID — this ensures the same two users always get the same room and two people never create two separate rooms with each other. The room ID is deterministic and collision-resistant.

Chat rooms are listed for a user by querying Firebase for all rooms where the current user's ID is a key in the `participants` map. Firebase Realtime Database allows querying by child value, so this is efficient even with hundreds of rooms.

### Message Type System

Every message in a chat room has a `type` field that drives how it is rendered. This is the core architectural decision that separates ZeroPay from a generic chat app. The message types are:

**text** — Standard text message. Rendered as a plain chat bubble.

**payment_request** — A structured message sent by the merchant that contains the invoice ID, INR amount, ADA amount, description, list of items, and a `status` field. Rendered as a card with the invoice details, an ADA/INR breakdown, and a green "Pay Now" button. The card updates in place when the invoice status changes — the same message bubble transitions from "Pay Now" to "Processing" to "Confirmed" without creating new messages.

**payment_submitted** — Sent automatically by the system when the customer submits a transaction. Contains the tx hash (displayed shortened, e.g. `abc123...xyz789`, tappable to open the Cardano explorer). Shows a spinner while confirming.

**receipt** — Sent automatically by the job queue when a payment is settled. Contains the IPFS receipt URL, a summary of what was paid, and the timestamp. This is the permanent record of the transaction.

**refund** — Sent when a refund is initiated (either customer-triggered after expiry, or system-triggered after failure).

### The "Pay In Chat" Flow — Exact UX Steps

The merchant opens the chat with the customer and taps the "₹" button in the input bar. A bottom sheet slides up with fields for amount (INR) and description. The merchant optionally adds line items. They tap "Request." The backend creates the invoice and writes a `payment_request` message to Firebase. The merchant sees their message appear. The customer, who may be in the same chat or may be anywhere, receives a push notification saying the merchant has sent a payment request. The customer opens the app and sees the payment request bubble. They tap "Pay Now." The app fetches the current ADA rate and confirms it with the customer. The customer taps "Confirm." Their browser wallet extension pops up for approval. They approve. The transaction is submitted. The bubble updates to show the tx hash. The merchant sees the bubble update in real time. After 60-90 seconds, the bubble updates once more to show "Confirmed" with a green checkmark. The receipt message appears below it.

---

## 12. Phase 08 — QR Payment System

### Duration: 4 days
### Goal: A merchant can display a QR code at their counter, a customer can scan it with the app, and the payment flow begins without any manual ID entry.

### QR Code Content Format

The QR code encodes a URI in the format `zeropay://pay?m={merchantId}`. The `merchantId` is the human-readable ID generated during merchant onboarding (e.g. `MC-0042`). This URI is short enough that the QR code can be printed at a small size and still scan reliably. The content is deterministic — a merchant's QR code never changes unless they explicitly regenerate it.

When a customer scans this QR code using the ZeroPay app, the app extracts the merchant ID, fetches the merchant's profile from the backend, and presents two options: start a chat with the merchant (to discuss what they want to order before paying) or create an instant payment (where the customer enters the amount themselves, for cases like exact-amount street food purchases).

### QR Generation — Client-Side, No Cost

QR codes are generated entirely in the browser using the `react-qr-code` library. There is no API call, no external service, no cost per QR generated. The library takes a string input and produces a scalable SVG. This means the merchant can resize the QR code for any print format without quality loss. The QR generation happens on the frontend — the backend only needs to tell the frontend the merchant's ID.

For printing, the frontend renders the QR code SVG inside a styled card that includes the merchant's shop name, a ZeroPay logo, and the human-readable merchant ID below the QR. The customer presses the browser's print dialog or downloads the SVG. All of this is client-side.

### Counter Checkout Mode — The Merchant's Perspective

Beyond the chat interface, merchants have a "Counter Checkout" mode designed for high-volume situations like a busy food stall. In counter checkout mode, the merchant's screen shows a large-format numeric keypad. They type in the amount (e.g. ₹75), optionally add a quick description from a pre-saved list, and tap "Generate Bill." The app immediately generates a payment QR code on screen containing the invoice ID, amount, and merchant address. The customer scans this with their own Cardano wallet app (not necessarily the ZeroPay app) and sends exactly the right amount to the merchant. The merchant's screen shows a confirmation animation within 90 seconds.

This mode requires no chat, no account linking between customer and merchant, and works for walk-in customers who do not have the ZeroPay app — they only need any CIP-30 compatible Cardano wallet.

---

## 13. Phase 09 — Merchant Dashboard

### Duration: 5 days
### Goal: A clean, functional dashboard where merchants see their complete payment history, daily totals, settlement status, and account settings.

### Dashboard Data Strategy

The dashboard is built for speed. Showing a merchant their daily total should take under 100ms. Showing their complete payment history with pagination should take under 300ms. This is achieved through two mechanisms: denormalized summary fields on the Merchant document (total received, total orders — updated by the job queue after every settlement), and efficient MongoDB queries with compound indexes on `merchantId + status + createdAt`.

The dashboard does not attempt to read from the Cardano blockchain directly. All data comes from MongoDB, which is the system of record after the job queue processes each transaction. The dashboard is a read-heavy interface — it should never trigger blockchain queries.

### Dashboard Sections

**Overview panel** — Shows today's total in INR and ADA, the number of completed orders today, the number of pending invoices (those awaiting payment), and a 7-day bar chart of daily totals. All numbers come from MongoDB aggregation queries. The 7-day chart uses data that is pre-computed nightly by a scheduled job (free on Render using a cron-style scheduler) and cached in Redis to avoid running a heavy aggregation on every page load.

**Transaction history** — A paginated table of all invoices, showing date, description, amount in INR, amount in ADA, and status. Filterable by status (pending / confirmed / settled / expired / failed) and by date range. Each row is expandable to show the tx hash, block height, confirmation count, and a link to the IPFS receipt. Clicking the tx hash opens the relevant Cardano explorer (CardanoScan or PoolPM) in a new tab.

**Invoice management** — A quick-access view of all currently pending invoices. Merchants can expire an invoice manually (useful if a customer left without paying and the merchant wants to cancel the request). They can also resend a payment request link to a customer via the chat.

**Settings panel** — Shows the merchant's current payment address, the QR code (downloadable), invoice expiry setting (adjustable between 5 and 30 minutes), default description templates for quick invoice creation, and account information.

### Settlement Tracking

Settlement in ZeroPay means ADA has arrived in the merchant's wallet with 3+ confirmations. The dashboard makes this visible through a three-state display for recent transactions: orange dot (submitted, confirming), yellow dot (confirmed, receipt generating), green dot (settled, receipt ready). Each state transition happens automatically as the job queue processes events — the dashboard listens to Firebase for real-time updates without needing to poll the REST API.

---

## 14. Phase 10 — Price Oracle & ADA/INR Conversion

### Duration: 2 days
### Goal: Every payment request shows the current ADA equivalent of an INR amount, with the rate locked at invoice creation time.

### The Rate Lock Problem

Exchange rates move continuously. If a merchant requests ₹150, the ADA equivalent at 10:00 AM might be 3.24 ADA. By the time the customer looks at the request at 10:05 AM, the ADA equivalent might have changed. If the invoice says "pay 3.24 ADA" and the customer sends 3.24 ADA, but the current rate would make that equivalent to ₹148, the merchant has a problem.

The solution is rate locking: when the invoice is created, the current ADA/INR rate is fetched, the lovelace amount is calculated and stored in the invoice, and that lovelace amount never changes for the lifetime of the invoice. The customer pays exactly the lovelace amount in the invoice regardless of what happens to the rate between creation and payment. The merchant knows exactly how many lovelace they will receive, and they can verify this against the ADA price at the time they look at their settlement.

### Rate Display Strategy

The customer sees both values at every step: "₹150.00 → 3.24 ADA (rate: ₹46.29 per ADA)." The rate used is always the rate locked in the invoice, not the live rate. This prevents confusion if the rate moves between when the invoice was created and when the customer approves. A small timestamp shows when the rate was locked: "rate as of 10:00 AM." If the rate has moved more than 2% since the invoice was created, the app shows a warning: "Note: ADA price has changed since this invoice was created. The amount in ADA is fixed."

### CoinGecko Integration Reliability

CoinGecko's public API is reliable but has a stated rate limit of 50 calls per minute without an API key. The Redis cache ensures you almost never make more than one call per minute in practice — every price fetch serves from cache. The one exception is the first call after cache expiry, which is a direct CoinGecko fetch.

If CoinGecko returns an error or times out, the system falls back to the most recently cached rate with a flag indicating it may be stale. The invoice creation endpoint shows the staleness in the response: "rate may be up to 5 minutes old." This is acceptable — a 5-minute-old rate causes at most ~0.3% variation for typical ADA price movements. The invoice lovelace amount is still locked at this cached rate and clearly displayed.

---

## 15. Phase 11 — IPFS Receipt System

### Duration: 3 days
### Goal: Every settled payment generates a permanent, tamper-proof receipt stored on IPFS with its CID recorded in the Cardano transaction metadata.

### Why IPFS for Receipts

A receipt stored in your MongoDB database is only as permanent as your database. If ZeroPay shuts down tomorrow, every merchant loses all their payment records. A receipt stored on IPFS is permanent — it exists as long as any node pins it, and Pinata's free tier pins it for you at no cost. More importantly, the CID (the IPFS content address) is derived by hashing the file's content — this means the receipt is mathematically tamper-proof. No one can change the receipt without changing its CID, which would be detectable.

Recording the CID in the Cardano transaction metadata creates a chain of custody: the blockchain permanently records that a specific transaction was associated with a specific IPFS document. Even if your entire backend disappears, anyone with the tx hash can look up the metadata on any Cardano explorer, find the CID, and retrieve the receipt from IPFS. This is a capability that no UPI receipt system can match.

### Receipt Document Structure

The IPFS receipt is a structured JSON document. It contains: the invoice ID, the merchant's shop name and merchantId, the customer's display name, the INR amount, the ADA amount in lovelace, the exchange rate used, the line items if any, the payment description, the Cardano tx hash, the block height at which it was confirmed, the number of confirmations at settlement time, the timestamp of settlement, the Cardano network (preprod or mainnet), and a `zeropay_version` field for future-proofing. This document is immutable — once pinned, it is never modified.

### The IPFS CID on Cardano

After pinning the receipt, the CID is written to a second piece of metadata in the invoice's transaction. Since the original transaction is already submitted, this cannot be added to it retroactively. Instead, the CID is stored in the Invoice document in MongoDB and referenced via a subsequent metadata transaction that the backend submits. This "receipt registration" transaction is a tiny ADA transfer (minimum UTXO) to a burn address, with the invoice ID and IPFS CID in the metadata. This transaction provides an on-chain pointer from the invoice to its permanent receipt.

---

## 16. Phase 12 — Push Notifications & Alerts

### Duration: 2 days
### Goal: Both merchant and customer receive relevant push notifications at every stage of a payment without any notification spam.

### Firebase Cloud Messaging Architecture

FCM tokens are stored on the User document in MongoDB. Tokens are updated every time the user opens the app — FCM tokens can change if the user reinstalls the app or clears app data, so the app should send the current token to the backend on every session start.

Notifications are sent from the backend (job queue workers) using the Firebase Admin SDK. The Admin SDK can send to a single device by token, to a topic (a named group of tokens), or to a condition (complex boolean topic combinations). For ZeroPay, all notifications are sent to individual tokens — no topics needed at this scale.

### Notification Taxonomy

**For the merchant:**
- "Payment request created" — Confirmation that their invoice was created (shown in app, not as a push)
- "Payment submitted — [Customer Name] sent ₹150" — Shown when customer submits tx
- "Payment confirmed — ₹150 settled" — Shown when 3+ confirmations reached
- "Invoice expired — ₹150 request expired" — Shown when an invoice times out without payment

**For the customer:**
- "Payment request from [Shop Name] for ₹150" — Shown when merchant creates invoice
- "Payment processing — your payment is confirming" — Shown after tx submitted
- "Payment confirmed — receipt ready" — Shown when settled, with link to receipt
- "Invoice expired — please contact the merchant" — Shown if they didn't pay in time

### Notification Click Behavior

Every push notification carries a `data` payload (not just a display message). The `data` payload contains the invoice ID and the relevant screen route. When the user taps a notification, the app reads the data payload, navigates to the correct screen, and highlights the relevant invoice or chat room. This deep linking from notification to specific content is what separates a useful notification from a useless one.

---

## 17. Phase 13 — Mobile App (React Native + Expo)

### Duration: 10 days
### Goal: A fully functional Android and iOS app with the same feature set as the web app, adapted for mobile UX patterns.

### Why a Mobile App Is Essential

The target users — street vendors, chai stall owners, customers at physical shops — are on mobile. A web app that requires a browser extension wallet does not work on mobile. Cardano wallet browser extensions only exist for desktop browsers. Mobile users need a different wallet integration approach.

The mobile app uses Expo (a React Native framework) for two reasons: it allows sharing code with the web app (routing logic, API calls, Firebase integration, business logic) through the `packages/shared` directory, and it provides Expo EAS Build which handles the complexity of building Android APKs and iOS IPAs in the cloud for free.

### Mobile Wallet Integration

On mobile, browser extension wallets are not available. The approach is one of two options:

**Option A — WalletConnect for Cardano.** Some Cardano mobile wallets (Nami Mobile, Eternl Mobile) support connecting to web apps via deep links. The user opens ZeroPay, taps "Connect Wallet," the app opens their Cardano mobile wallet, they approve the connection, and return to ZeroPay. This is similar to how WalletConnect works in the Ethereum world. Implementation uses the CIP-62 standard for Cardano WalletConnect sessions.

**Option B — In-App Wallet (Non-Custodial).** ZeroPay generates a Cardano key pair on the device using MeshJS's wallet generation functions, encrypts the private key with the user's PIN or biometric auth using the device's secure keystore, and stores only the encrypted key blob. The private key never leaves the device and never touches your server. This is a fully non-custodial in-app wallet — you have no access to users' funds. This option provides the best UX (no external wallet app needed) at the cost of the user being solely responsible for their seed phrase backup.

The recommended approach for Phase 1 is Option A (WalletConnect) to avoid the regulatory questions that come with being perceived as a custodian of user funds. Option B can be added as an advanced feature later.

### Shared Code Strategy

The mobile app imports all business logic from `packages/shared-types` and a new package `packages/api-client` — a typed API client that wraps all backend API calls. Both the web app and the mobile app use the same API client, so a change in the API surface is fixed in one place. React Native components are separate from web React components because the underlying rendering is different (native views vs DOM), but all state management, API calls, and Firebase interactions are shared.

### Expo Build and Distribution

During development, the app runs via Expo Go on the developer's physical device by scanning a QR code from the terminal. No build needed for development.

For testing with real users before publishing to app stores, use Expo EAS Build to create an APK (Android) or TestFlight build (iOS). The EAS Build free tier allows 30 builds per month, which is ample. Builds run on Expo's cloud servers — no local Xcode or Android Studio required.

For app store submission, a Google Play Developer account costs $25 (one-time). An Apple Developer account costs $99/year. These are the only non-zero costs in the entire project that cannot be avoided for native app distribution.

---

## 18. Phase 14 — Blockchain Confirmation Pipeline

### Duration: 4 days (partially covered in Phase 05)
### Goal: A bulletproof pipeline that never misses a transaction confirmation, handles all Cardano edge cases, and maintains correct invoice states under all failure conditions.

### The Confirmation Requirements

Three block confirmations is the minimum safe threshold for payment finality on Cardano. Each block takes approximately 20 seconds, meaning minimum settlement time is approximately 60 seconds from submission. This is comparable to UPI's 2-minute settlement window. The probability of a 3-block-confirmed transaction being rolled back is astronomically small (equivalent to a one-in-several-billion event) and no production payment system needs to guard against it beyond logging.

For larger payment amounts (above 10,000 ADA — unlikely but possible), require 6 confirmations before settling. For the typical small-merchant use case (₹50 to ₹5,000), 3 confirmations is the industry standard.

### Blockfrost API Usage Optimization

With a 50,000 request per day limit on Blockfrost's free tier and payment polling happening every 20 seconds per active transaction, the system can support approximately 28 simultaneous active payments before hitting the limit (50,000 / (24 × 60 × 3 polls per minute) = ~11.5 active simultaneous transactions per second — actually far more than you will need at early scale). Smart polling reduces this further: once a transaction is found on-chain (status `confirming`), reduce polling frequency to once per 60 seconds since it only needs to accumulate 2 more confirmations. This triples the number of simultaneous payments the system can handle within the free tier.

### Transaction Not Found Scenarios

A transaction submitted to Cardano may not appear in a block for several reasons: the transaction expired (Cardano transactions have a TTL — time to live — of approximately 2 hours by default), the node that received the submission was temporarily disconnected, the fee calculation was slightly off and the transaction was rejected at the mempool level.

When polling finds no transaction after 20 minutes, the invoice is not immediately marked as failed. Instead, a final check is made using both Blockfrost and Koios. If both return "not found," the invoice is marked as `failed` and both parties are notified. The customer is told their ADA was not deducted (because a failed Cardano transaction never spends the UTXO) and prompted to try again if they wish to pay.

---

## 19. Phase 15 — Security Hardening

### Duration: 5 days
### Goal: The system is resistant to the most common attack vectors against payment applications and blockchain dApps.

### The Most Critical Security Rules

**Rule 1: No private keys on your server, ever.** Already covered, but worth repeating. The backend builds transactions and presents them to the user for signing. The backend never holds keys.

**Rule 2: All monetary calculations happen on the backend.** The frontend can display amounts, but the canonical lovelace amount for an invoice is calculated on the backend at invoice creation time and stored in MongoDB. The frontend never calculates how much ADA to send — it reads the lovelace amount from the invoice. This prevents a class of attacks where the frontend is manipulated to send less than the correct amount.

**Rule 3: The invoice lovelace amount is verified on-chain.** The Aiken smart contract enforces that the merchant can only collect `amountLovelace` from the contract — not less, not more. The backend's confirmation check verifies that the amount received at the payment address matches the invoice's lovelace amount. A discrepancy (customer tried to send less) results in the invoice remaining in `confirming` status and not settling.

**Rule 4: Rate limiting on all mutation endpoints.** The invoice creation endpoint, the payment submission endpoint, and the wallet registration endpoint all have strict rate limits per authenticated user. This prevents someone from generating thousands of fake invoices, flooding the job queue with polling jobs, or rapidly registering wallet addresses to probe the system.

**Rule 5: Input sanitization for all Cardano addresses.** Before accepting a wallet address from any input (frontend, API, QR scan), validate it against the Cardano bech32 address format. An invalid address that gets into MongoDB would cause transaction building to fail later in a confusing way. Validation at the entry point provides a clear error message immediately.

**Rule 6: Metadata cannot exceed 64 bytes per value.** Cardano transaction metadata has a 64-byte limit per metadata value. The invoice ID, description, and other fields stored in metadata must be validated to fit within this limit before building the transaction. Exceeding the limit causes transaction building to fail at the MeshJS level.

### CORS and API Security

The backend sets a strict CORS policy: only requests from the production Vercel domain and `localhost:5173` (local development) are allowed. All other origins receive a 403. API keys and secrets are never sent to the frontend — even Blockfrost calls happen through your backend, not directly from the browser. This prevents your Blockfrost API key from being visible in the browser's network tab.

### Firebase Security Rules

The Firebase Realtime Database security rules enforce that: a user can only read and write to chat rooms where their user ID is in the `participants` map, a user can only write new messages (not edit or delete existing ones), system-written fields like `type: payment_request` can only be created by the authenticated backend service account (not by regular users), and no unauthenticated access is allowed to any path.

---

## 20. Phase 16 — Testing Strategy

### Duration: Ongoing throughout all phases
### Goal: Confidence that payments work correctly before any real ADA is at stake.

### Testing Hierarchy

**Unit tests** cover individual service functions: price conversion calculations, invoice ID generation, Aiken contract logic (Aiken has a built-in test framework). These run in every CI pipeline and must all pass before any deployment.

**Integration tests** cover API endpoint behavior: creating an invoice and verifying the MongoDB document, building a transaction and verifying the CBOR output contains the correct metadata, polling a known preprod tx hash and verifying the confirmation count. These run against the preprod network using real (but worthless) test ADA.

**End-to-end tests** cover complete user flows: merchant creates invoice → customer pays → system confirms → receipt generated. These run on the preprod network and are triggered manually before each production release.

**Smart contract tests** are written in Aiken using its built-in property-based testing framework. Tests cover all success cases (correct collect, correct refund) and all failure cases (wrong amount, wrong signer, wrong timing, expired invoice collected, unexpired invoice refunded).

### The Preprod Testing Environment

Cardano's preprod network is a permanent test network that is functionally identical to mainnet. It uses test ADA (tADA) available for free from the Cardano faucet. All testing happens on preprod — never on mainnet until the system is fully production-ready. Deploying Aiken contracts on preprod costs tADA (free). Testing payment flows costs tADA (free). The preprod explorer is CardanoScan Preprod — all transactions are visible there just like mainnet.

### Manual QA Checklist (Pre-Launch)

Before declaring the system production-ready, every flow on the following checklist must be verified manually on the preprod network:

- Merchant signup → wallet connect → QR generation
- Customer signup → QR scan → chat room created
- Merchant creates invoice in chat → customer sees payment bubble
- Customer pays → merchant sees "confirming" status
- Payment confirms after 3 blocks → merchant sees "settled" status
- IPFS receipt generated → receipt link works in browser
- Both parties receive push notifications at each stage
- Invoice expires without payment → customer sees expired state
- Customer attempts payment after expiry → contract rejects it
- Merchant tries to collect after expiry → contract rejects it
- Customer claims refund after expiry → refund succeeds
- Blockfrost is unreachable → Koios failover works transparently
- Render server is cold → warm-up completes before first user action (UptimeRobot)

---

## 21. Phase 17 — DevOps & CI/CD Pipeline

### Duration: 3 days
### Goal: Every push to the main branch automatically runs tests and deploys the updated app to production with zero manual steps.

### GitHub Actions Workflow

The CI/CD pipeline has three jobs that run in sequence on every push to `main`:

**Job 1 — Lint and type-check.** Runs ESLint on all TypeScript files in the monorepo and runs the TypeScript compiler in check mode (no emit). If any type errors or lint errors exist, the pipeline fails immediately. No deployment happens until the code is clean.

**Job 2 — Test.** Runs all unit tests and integration tests. Integration tests use a test MongoDB Atlas database (created by cloning the main database schema), a test Upstash Redis instance, and the Cardano preprod network. Tests use real network calls where necessary (especially blockchain tests) because mocking the Cardano blockchain is unreliable.

**Job 3 — Deploy.** Only runs if Jobs 1 and 2 pass. Deploys the backend to Render by triggering Render's deploy hook URL (a secret stored in GitHub). Deploys the web app to Vercel automatically — Vercel listens to GitHub push events and deploys when it sees changes in the `apps/web` directory. Mobile builds are triggered manually via `eas build` when a significant feature is ready for testing, not on every push.

### Branch Strategy

The `main` branch is production. Direct pushes to `main` are not allowed. All work happens on feature branches (`feature/invoice-creation`, `fix/confirmation-polling`, etc.). Feature branches are merged to `main` via pull requests. Each pull request triggers the CI pipeline — the PR cannot be merged if the pipeline fails. This keeps `main` always in a deployable state.

---

## 22. Phase 18 — Monitoring & Observability

### Duration: 2 days
### Goal: When something breaks in production, you know about it before your users do.

### Sentry Error Monitoring

Sentry is configured in both the backend and the web app. In the backend, Sentry's Express middleware catches all unhandled errors and all explicit `Sentry.captureException()` calls. Every error is enriched with: the authenticated user's ID (not their sensitive data), the request URL and method, the environment (development/production), and a sanitized request body (with wallet addresses and amounts but without tokens or passwords).

In the web app, Sentry's React error boundary catches all unhandled React rendering errors. Each error is tagged with the current route and the user's wallet address if connected. Sentry's free tier gives 5,000 errors per month — that is enough to catch and fix every bug in early production.

### Critical Alerts

Configure Sentry alerts to send to your email for: any error rate spike above 10 errors per minute, any unhandled exception in the payment submission or confirmation endpoints, any Blockfrost call that fails more than 5 times in a row (suggesting the failover to Koios is happening), and any job queue job that fails its maximum retry count (suggesting a transaction that could not be confirmed within 20 minutes).

### BullMQ Job Dashboard

BullMQ provides a dashboard called Bull Board. Deploy it as a protected route on the backend (accessible only with a secret URL or behind Basic Auth). The dashboard shows: all active jobs currently polling for confirmations, the number of completed jobs, failed jobs, and delayed jobs. This is the primary tool for debugging payment issues in production — if a merchant reports their payment is stuck, look up the invoice ID in Bull Board and see the exact state of the polling job.

### Health Check Endpoint

The backend exposes a `/health` endpoint that returns: API server status, MongoDB connection status, Redis connection status, Firebase Admin SDK status, and the most recent Blockfrost ping result. UptimeRobot monitors this endpoint every 10 minutes. The endpoint also serves as the proof of life for Render's keep-awake mechanism.

---

## 23. Master Timeline & Milestones

### Overall Duration: 12 Weeks to Production-Ready

| Week | Phase | Deliverable |
|---|---|---|
| Week 1 | 01, 02 (partial) | Monorepo set up, all services configured, Firebase Auth working, user can sign up |
| Week 2 | 02, 03 | Wallet connection working, merchant onboarding complete, QR code generated |
| Week 3 | 04 (partial) | Invoice creation API, price oracle, chat room creation |
| Week 4 | 04, 05 | Payment build/submit API, BullMQ confirmation pipeline |
| Week 5 | 06 | Aiken contract written, tested with Aiken test framework, deployed on preprod |
| Week 6 | 07 | Firebase chat UI complete, payment request bubbles working |
| Week 7 | 08, 09 | QR payment system, merchant dashboard |
| Week 8 | 10, 11 | Price oracle fully cached, IPFS receipts generating |
| Week 9 | 12, 13 (partial) | Push notifications, Expo mobile app setup |
| Week 10 | 13 | Mobile wallet integration (WalletConnect), core mobile flows |
| Week 11 | 15, 16 | Security hardening, full preprod QA checklist |
| Week 12 | 17, 18 | CI/CD pipeline, Sentry monitoring, production launch |

### Milestone 1 — Proof of Concept (End of Week 4)
A complete payment flow works end-to-end on preprod: merchant creates invoice → customer pays → system detects confirmation. All in the browser on the web app. No mobile, no smart contracts, no IPFS. Just the core payment loop.

### Milestone 2 — Smart Contract Integration (End of Week 5)
The same payment flow now uses the Aiken escrow contract. Funds lock to the contract, merchant collects, receipt is generated with tx hash. Refund path tested.

### Milestone 3 — Full Web App (End of Week 8)
Every feature described in this document is working on the web app against preprod. Chat interface, QR payments, merchant dashboard, IPFS receipts, push notifications. Full QA checklist passed.

### Milestone 4 — Mobile App (End of Week 10)
Android APK distributed via EAS for internal testing. Core payment flows working on mobile. WalletConnect integration with at least one Cardano mobile wallet verified.

### Milestone 5 — Production Launch (End of Week 12)
CI/CD pipeline live. Sentry monitoring active. UptimeRobot active. All tests passing. Deployed on mainnet (if regulatory situation is clear) or on preprod for a controlled beta. First real merchant onboarded.

---

## 24. Risk Register

### Technical Risks

**Risk: Blockfrost rate limit exceeded during high-traffic period**
Likelihood: Low at early scale. Impact: Confirmation polling pauses.
Mitigation: Koios failover is automatic. Optimize polling frequency as described in Phase 14. Monitor Blockfrost usage via their dashboard.

**Risk: Render cold start during peak merchant hours**
Likelihood: High (this will happen). Impact: First request of the day takes 50 seconds.
Mitigation: UptimeRobot keeps server awake. Acceptable because UptimeRobot is always free and always running.

**Risk: CoinGecko API rate limit hit**
Likelihood: Low with Redis caching. Impact: Price oracle returns stale rate.
Mitigation: 60-second Redis cache handles all but the most extreme traffic. Fallback to cached rate with staleness flag is implemented.

**Risk: Aiken contract bug causing locked funds**
Likelihood: Low with thorough testing. Impact: Customer's ADA locked in contract without ability to collect.
Mitigation: Exhaustive Aiken property tests. Always include a time-based refund path so funds can never be permanently locked. Audit the contract with a second developer before mainnet.

**Risk: Firebase Realtime Database limits exceeded**
Likelihood: Very low at early scale. Impact: Chat messages stop delivering.
Mitigation: Firebase Spark plan includes 1 GB storage and 10 GB/month transfer. Exceeding this requires significant user growth — upgrade to Blaze pay-as-you-go before this point.

**Risk: MongoDB Atlas M0 storage filled**
Likelihood: Very low in year one. Impact: Database writes fail.
Mitigation: 512 MB handles approximately 500,000 transaction records. Monitor storage usage monthly. Upgrade to M2 ($9/month) when 75% full.

### Product Risks

**Risk: Merchants don't understand ADA pricing**
Likelihood: High for early adopters unfamiliar with crypto.
Mitigation: Always show INR amount prominently, ADA amount secondarily. Never show lovelace. Exchange rate explanation is always one tap away.

**Risk: Customers don't have Cardano wallets**
Likelihood: High in India where Cardano penetration is low.
Mitigation: Build the in-app wallet (Phase 13, Option B) as a priority feature after launch. Allow onboarding with just a phone number and create a managed wallet for non-crypto users.

---

## 25. Definition of Done

### For Each Phase

A phase is done when: all features described in the phase section of this document are implemented and working on the preprod network, all unit tests for the phase's code are passing in CI, the feature has been manually verified by at least one person who is not the person who built it, and no known bugs are outstanding that would block a user from completing the primary flow.

### For the Overall Project

ZeroPay is production-ready when: every item on the preprod QA checklist passes, the CI/CD pipeline deploys to production with zero manual steps, Sentry is capturing errors, UptimeRobot confirms the server has been online for 72 continuous hours, at least one real merchant has completed the full onboarding flow and processed a test payment end-to-end, and a senior developer who has not worked on the project can read this plan and the codebase and understand how every piece fits together within one hour.

---

*ZeroPay Implementation Plan — Team Null Void*
*Cardano Hackathon Asia IBW 2025 → Production Roadmap*
*Total monthly infrastructure cost: ₹0 | Blockchain tx fees: paid by users*