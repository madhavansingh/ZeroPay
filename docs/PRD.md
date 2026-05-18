# ZeroPay — Product Requirements Document (PRD)

### Version 1.0 · Team Null Void · Cardano Hackathon Asia IBW 2025 → Production
### Document Owner: Madhavan Singh Parihar
### Status: Living Document — Updated as Product Evolves

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Product Vision & Mission](#3-product-vision--mission)
4. [Goals & Non-Goals](#4-goals--non-goals)
5. [User Personas](#5-user-personas)
6. [User Stories & Jobs-to-be-Done](#6-user-stories--jobs-to-be-done)
7. [Functional Requirements](#7-functional-requirements)
8. [Non-Functional Requirements](#8-non-functional-requirements)
9. [System Architecture Overview](#9-system-architecture-overview)
10. [Data Requirements](#10-data-requirements)
11. [Blockchain Requirements](#11-blockchain-requirements)
12. [Security Requirements](#12-security-requirements)
13. [UX & Accessibility Requirements](#13-ux--accessibility-requirements)
14. [Integration Requirements](#14-integration-requirements)
15. [Feature Specifications — Detailed](#15-feature-specifications--detailed)
16. [Invoice & Payment State Machine](#16-invoice--payment-state-machine)
17. [Error Handling Requirements](#17-error-handling-requirements)
18. [Performance Requirements](#18-performance-requirements)
19. [Testing Requirements](#19-testing-requirements)
20. [Release Strategy & Milestones](#20-release-strategy--milestones)
21. [Success Metrics & KPIs](#21-success-metrics--kpis)
22. [Risk Register](#22-risk-register)
23. [Open Questions & Decisions Log](#23-open-questions--decisions-log)
24. [Glossary](#24-glossary)

---

## 1. Executive Summary

ZeroPay is a blockchain-native payment application that brings ADA (Cardano's native cryptocurrency) payments into a familiar, chat-first user experience modeled after widely understood messaging apps. It is designed to solve a specific and measurable problem: small merchants, street vendors, and micro-businesses in markets like India cannot practically accept cryptocurrency payments today because the tooling is hostile — wallet addresses are 60+ characters long, there is no concept of an invoice, confirmations take place in separate explorer windows, and receipts do not exist.

ZeroPay changes this by embedding a complete payment lifecycle — invoice creation, transaction signing, blockchain confirmation, and tamper-proof receipt generation — inside a chat interface that both the merchant and customer already know how to use. The experience is designed to feel as natural as WhatsApp Pay or UPI, while being entirely non-custodial, trustless through on-chain smart contracts, and settling on Cardano's low-fee infrastructure.

The product is built entirely on a zero-rupee infrastructure stack, using free-tier services that are sufficient to reach meaningful early traction. Every infrastructure cost — hosting, database, caching, blockchain access, IPFS storage — operates within free tier limits. Transaction fees on Cardano (~0.17 ADA per payment) are borne by the user, not the developer.

This PRD defines the full product requirements for building ZeroPay to production quality — every feature, every constraint, every integration, and every success criterion that makes the difference between a hackathon prototype and a shipping product.

---

## 2. Problem Statement

### The Gap This Product Fills

Cryptocurrency payments have failed to achieve real-world retail adoption not because blockchain technology is insufficient, but because the user experience of sending and receiving crypto is fundamentally mismatched to the context of everyday commerce. Three specific failures define this gap:

**Failure 1: The address problem.** Sending ADA to a merchant requires knowing their wallet address — a 58-103 character string like `addr1qx9d7p...kz9y`. No customer memorizes this. No merchant can display it readably. QR codes help for walk-ins but break entirely in remote or chat-initiated payment contexts. There is no concept analogous to a UPI ID or a phone number — something human-memorable that resolves to a payment destination.

**Failure 2: The confirmation problem.** When a customer sends ADA, neither party knows when the payment is "done." The merchant has to manually open a blockchain explorer, search for their address, find recent transactions, and interpret block confirmations — a workflow that is completely alien to a chai stall owner. No existing Cardano payment product sends a merchant a simple push notification saying "₹150 received."

**Failure 3: The receipt problem.** UPI generates a reference number. Bank transfers generate a UTR. But a Cardano transaction gives a 64-character hex string that means nothing to a merchant filing GST returns or reconciling daily sales. There is no structured, human-readable receipt that connects a blockchain transaction to a specific purchase.

### Who Suffers From These Problems

The primary sufferers are the 63 million micro, small, and medium enterprises (MSMEs) in India — the street food vendor, the neighborhood grocery, the auto parts shop — who have been digitized by UPI but remain completely excluded from the crypto economy. They cannot accept ADA even if they wanted to.

The secondary sufferers are the growing population of ADA holders who cannot spend their holdings in the physical world, forcing them to stay entirely within the crypto-to-crypto economy or convert to fiat before every purchase.

### Why This Problem Is Solvable Now

Cardano's fee structure makes micro-transactions economically viable in a way that Ethereum-based solutions cannot match — a ₹50 chai payment does not make sense if the gas fee is ₹200. Cardano's block time (~20 seconds) and confirmation threshold (~3 blocks, ~60 seconds) are comparable to UPI's 2-minute settlement window. The technical prerequisites for a real payment product are present. What has been missing is the UX layer that makes it accessible.

---

## 3. Product Vision & Mission

### Vision

ZeroPay becomes the standard payment layer for ADA in physical and semi-physical commerce — the app that a merchant in Indore puts a QR code sticker for at their counter, the same way they currently have a PhonePe QR sticker.

### Mission

To make sending and receiving ADA as frictionless as sending a WhatsApp message, for users who have never heard of a UTXO.

### North Star

**Number of complete payment conversations** — defined as a customer-merchant interaction that starts with a payment request and ends with a settled invoice and a generated IPFS receipt. Every product decision is evaluated against whether it moves this number.

### Product Tagline

*Pay like you chat. Settle on Cardano.*

---

## 4. Goals & Non-Goals

### Goals for Version 1.0 (Production Launch)

- A merchant can onboard, connect their Cardano wallet, and generate a printable QR code in under 10 minutes with no blockchain knowledge required.
- A customer can scan a QR code, receive a payment request in chat, approve it in their Cardano wallet, and receive a receipt in under 90 seconds.
- Every settled payment generates a permanent, tamper-proof IPFS receipt with its CID recorded on the Cardano blockchain.
- The entire application runs on zero infrastructure cost to the developer for the first several hundred daily transactions.
- The payment flow is trustless — an Aiken smart contract on Cardano enforces that funds go to the right address, only the merchant can collect, and expired invoices are refundable.
- The system correctly handles Cardano's probabilistic finality — no invoice is marked as settled until at least 3 block confirmations are received.

### Goals for Version 2.0 (Post-Launch)

- A fully functional React Native mobile app (Android and iOS) that replaces the browser wallet dependency with an in-app wallet or WalletConnect integration.
- A fiat on-ramp integration that allows merchants to trigger INR withdrawals from their ADA balance directly from the dashboard.
- An Atala PRISM DID-based merchant verification flow that issues a verifiable credential to merchants who complete KYC.
- A webhook system that allows POS-integrated merchants to receive payment confirmation events programmatically.
- Counter Checkout Mode — a streamlined full-screen interface for high-throughput physical transactions without the chat layer.

### Non-Goals

These are explicitly excluded from the Version 1.0 scope:

- The product does not support native tokens (CNFTs, stablecoins) in Version 1.0. ADA-only.
- The product does not support peer-to-peer payments between customers (individual-to-individual transfers without a merchant context).
- The product does not provide fiat conversion or on-ramp/off-ramp in Version 1.0.
- The product does not operate as a custodian. No private keys are ever held by the application.
- The product does not target DeFi, staking, NFTs, or any financial instrument beyond payment settlement.
- The product does not use Midnight, zero-knowledge proofs, or private smart contracts (not applicable to Track 1 General).
- The product does not replace the user's primary Cardano wallet — it works alongside it.

---

## 5. User Personas

### Persona 1 — Meena, the Street Vendor

**Background:** Meena runs a snack stall outside a college in Indore. She is 34 years old. She has a basic Android smartphone. She accepts UPI payments via a PhonePe QR code that she prints and tapes to her cart. She receives roughly 80-150 transactions per day, mostly between ₹20 and ₹200. She has heard of crypto but thinks it is for investors, not for her daily business.

**Goals:** Receive payments quickly, see her daily total without doing math, know immediately when a payment has come in.

**Frustrations:** Customers sometimes screenshot the payment screen and claim they paid when they did not. Her daily bookkeeping is manual. She has no way to prove what happened in a disputed transaction.

**Technology comfort:** Comfortable with WhatsApp, UPI, Facebook. Not comfortable with anything that requires reading wallet addresses or opening links in a browser.

**How ZeroPay helps:** Meena displays a ZeroPay QR code next to her PhonePe QR. Customers who hold ADA scan it. She receives a push notification when payment is confirmed. Her dashboard shows her daily total automatically. The IPFS receipt is irrefutable proof of every transaction.

**What will make her reject the product:** If setup takes more than 15 minutes, if she sees anything blockchain-technical during normal use, or if a payment confirmation takes more than 2 minutes.

---

### Persona 2 — Arjun, the Crypto-Native Customer

**Background:** Arjun is 23, a computer science student in Pune. He holds ADA in an Eternl wallet that he set up 6 months ago after learning about Cardano on Twitter. He has never spent ADA in the physical world because no shop accepts it. He mostly trades and stakes. He is frustrated that his crypto feels locked in the crypto economy.

**Goals:** Spend his ADA at local businesses. Feel like his crypto investment has real-world utility.

**Frustrations:** Every time he wants to pay someone in crypto, he has to ask for their wallet address, copy-paste it, open his wallet app, manually enter the amount, and then explain to the merchant how to verify the transaction. It takes 5 minutes and is embarrassing.

**Technology comfort:** Very high. Comfortable with DeFi, wallets, transaction explorers, browser extensions.

**How ZeroPay helps:** Arjun scans a QR code, a payment request appears in the familiar chat interface, he taps Pay, his Eternl extension pops up with the correct amount pre-filled, he approves, done. He receives a receipt. The whole flow takes under 90 seconds.

**What will make him reject the product:** If it asks him to trust a centralized custodian with his funds, if it charges a service fee on top of Cardano's network fee, or if it does not work with his preferred wallet.

---

### Persona 3 — Raj, the Tech-Forward Shop Owner

**Background:** Raj owns a mobile phone accessories shop in a tech market. He is 29. He already accepts UPI, handles online orders via WhatsApp, and is comfortable with digital tools. He has a basic understanding of crypto — he has bought Bitcoin once. He is interested in accepting ADA specifically because he has seen Cardano news and believes in its India-relevant narrative.

**Goals:** Get a professional payment setup, keep records for his accountant, be an early adopter of something he believes in.

**Frustrations:** Crypto payment tools he has found are either too complex, require expensive hardware, or are clearly built for developers, not shop owners.

**Technology comfort:** High for business tools. Medium for crypto specifically.

**How ZeroPay helps:** Raj completes the full merchant onboarding, sets up counter checkout mode on an old Android tablet at his counter, and has a running dashboard of daily ADA receipts that he can show his accountant. The IPFS receipts serve as auditable records.

---

### Persona 4 — The Backend Developer (Internal Persona)

**Background:** The developer building and maintaining ZeroPay. Has strong Node.js and React experience, moderate Cardano/blockchain experience, learning Aiken for smart contracts.

**Goals:** Build a reliable, maintainable system that handles edge cases gracefully. Ship working software without a budget.

**Concerns:** Cardano's UTXO model and probabilistic finality create edge cases that do not exist in traditional payment systems. The free-tier infrastructure has limits that must be worked around architecturally.

**How this PRD helps:** Every requirement is written with the developer's constraints in mind — zero cost, free-tier limits, and Cardano-specific behavior are first-class concerns throughout.

---

## 6. User Stories & Jobs-to-be-Done

### Merchant User Stories

**M-001 — Onboarding**
As a merchant, I want to create an account and configure my payment setup in under 10 minutes, so that I can start accepting ADA payments the same day I learn about ZeroPay.

Acceptance criteria: The onboarding flow is four screens or fewer. No screen requires blockchain knowledge to understand. After completion, the merchant has a usable QR code and their wallet is connected.

---

**M-002 — Invoice Creation in Chat**
As a merchant, I want to send a payment request to a specific customer inside our chat conversation, so that the customer knows exactly how much to pay and for what.

Acceptance criteria: The merchant can create an invoice by tapping a single button in the chat interface, entering an amount in INR, and optionally a description or line items. The invoice appears as an interactive bubble in the chat that shows the INR amount, the current ADA equivalent, and the expiry timer.

---

**M-003 — Counter Checkout**
As a merchant, I want to generate a payment QR code for the amount a customer owes, so that any customer with a Cardano wallet can scan and pay without needing the ZeroPay app.

Acceptance criteria: The merchant types an amount in INR, the system generates a QR code containing the invoice details. The QR is scannable by any CIP-30 Cardano wallet. The merchant's screen shows a real-time confirmation animation when payment is confirmed.

---

**M-004 — Payment Confirmation Notification**
As a merchant, I want to receive a push notification the moment a payment is confirmed on-chain, so that I can hand over the goods or food without waiting to check a screen.

Acceptance criteria: A push notification is delivered within 10 seconds of the third block confirmation. The notification shows the customer name (if known), the INR amount, and the ADA amount. Tapping the notification navigates directly to the relevant invoice.

---

**M-005 — Dashboard Overview**
As a merchant, I want to see my daily totals and payment history in a clean dashboard, so that I know how my business is performing without manual bookkeeping.

Acceptance criteria: The dashboard loads in under 2 seconds. It shows today's total in both INR and ADA. It shows a 7-day trend chart. It shows all transactions with their status, filterable by status and date. Each transaction row is expandable to show the tx hash and receipt link.

---

**M-006 — IPFS Receipt Access**
As a merchant, I want every settled payment to have a permanent receipt I can retrieve at any time, so that I have irrefutable records for accounting and dispute resolution.

Acceptance criteria: Every settled invoice has an IPFS CID stored in the system. The receipt is accessible via a public IPFS gateway URL. The receipt contains all material payment details. The receipt cannot be modified after creation.

---

**M-007 — Invoice Expiry Management**
As a merchant, I want invoices that have not been paid to expire automatically, so that I am not left with phantom pending invoices clogging my dashboard.

Acceptance criteria: Invoices expire automatically after the configured window (default 10 minutes). Expired invoices are clearly labeled in the dashboard. The merchant can also manually expire a pending invoice. Both parties receive a notification when an invoice expires.

---

### Customer User Stories

**C-001 — QR Scan to Chat**
As a customer, I want to scan a merchant's QR code and immediately see a chat conversation with them, so that I can place an order and initiate payment in one place.

Acceptance criteria: Scanning a valid ZeroPay QR code opens the app (or the web app in a browser) and either creates or opens an existing chat room with the merchant. The customer does not need to type any wallet address or merchant ID.

---

**C-002 — Payment in Chat**
As a customer, I want to see a payment request from the merchant inside the chat and pay it with a single tap, so that the payment feels like a natural part of the conversation.

Acceptance criteria: The payment request appears as a structured card in the chat, showing amount in INR, amount in ADA (calculated at the locked rate), and a "Pay Now" button. Tapping "Pay Now" opens the customer's connected Cardano wallet extension with the correct amount pre-filled. After wallet approval, the transaction is submitted automatically.

---

**C-003 — Real-Time Status Visibility**
As a customer, I want to see the status of my payment update in real time inside the chat, so that I know my payment went through without having to open a blockchain explorer.

Acceptance criteria: After submitting a transaction, the payment bubble in chat updates to show "Processing" with the tx hash. After 3 confirmations, the bubble updates to "Confirmed" with a green checkmark. The customer does not need to take any action between submission and confirmation.

---

**C-004 — Receipt in Chat**
As a customer, I want to receive a receipt in the chat conversation after payment is settled, so that I have a record of what I paid and for what.

Acceptance criteria: A receipt message appears in the chat after settlement. It contains the amount, description, timestamp, and a link to the IPFS receipt document. The receipt link is publicly accessible and verifiable.

---

**C-005 — Refund After Expiry**
As a customer who has locked funds in the escrow contract for an expired invoice, I want to reclaim my ADA, so that I am not at risk of losing funds if a payment flow does not complete.

Acceptance criteria: After an invoice's expiry time, the customer can trigger a refund transaction from the contract. The refund goes to the customer's wallet. The system guides the customer through this process within the app.

---

### System User Stories

**S-001 — Automatic Confirmation Polling**
The system must automatically detect when a submitted transaction reaches 3 block confirmations on the Cardano blockchain, without any user or merchant action required.

**S-002 — Blockfrost Failover**
The system must automatically switch to Koios when Blockfrost returns errors or exceeds rate limits, without any interruption to the confirmation polling pipeline.

**S-003 — Invoice Expiry Processing**
The system must automatically expire pending invoices that pass their expiry timestamp, updating their status in MongoDB, writing the update to Firebase, and notifying both parties.

**S-004 — Rate Cache Maintenance**
The system must maintain a live ADA/INR exchange rate cache in Redis, refreshing it every 60 seconds from CoinGecko, so that invoice creation always uses a rate no older than 60 seconds.

---

## 7. Functional Requirements

### FR-01: User Authentication and Account Management

**FR-01-1:** The system shall support user registration and login via Firebase Authentication using phone number OTP.

**FR-01-2:** The system shall support user registration and login via Firebase Authentication using email and password.

**FR-01-3:** The system shall create a corresponding User document in MongoDB upon first successful authentication, capturing the Firebase UID, authentication method, and timestamp.

**FR-01-4:** The system shall support user role assignment — a user may be a customer, a merchant, or both. The role field shall update immediately when a user completes merchant onboarding.

**FR-01-5:** The system shall verify Firebase ID tokens on every protected API request using the Firebase Admin SDK. Requests with missing, expired, or invalid tokens shall be rejected with HTTP 401.

**FR-01-6:** The system shall update the user's last-seen timestamp on every authenticated API request.

**FR-01-7:** The system shall support FCM (Firebase Cloud Messaging) token registration so that the backend can send push notifications to specific devices. The FCM token shall be updated every time the user opens the app.

---

### FR-02: Merchant Onboarding

**FR-02-1:** Any authenticated user shall be able to initiate merchant onboarding from their account settings or dashboard.

**FR-02-2:** The merchant onboarding flow shall require: shop name, business category (from a predefined set: food, retail, services, vendor, other), and a connected Cardano wallet address.

**FR-02-3:** Upon completing merchant onboarding, the system shall generate a unique merchantId in the format `MC-XXXX` (e.g., `MC-0042`). This ID is permanent and does not change.

**FR-02-4:** The system shall generate a QR code for the merchant encoding the URI `zeropay://pay?m={merchantId}`. This QR code shall be available for download as a PNG or SVG.

**FR-02-5:** Merchant onboarding shall be resumable — if a user completes step 1 but not step 2 (wallet connection), they shall be able to return and complete from where they left off.

**FR-02-6:** A merchant profile shall be retrievable by merchantId via a public API endpoint (no authentication required) to support QR code resolution by customer devices.

---

### FR-03: Cardano Wallet Integration

**FR-03-1:** The web application shall detect all installed CIP-30 compliant browser wallet extensions (including but not limited to Eternl, Nami, Lace, Flint, Typhon, GeroWallet) and display them to the user for selection.

**FR-03-2:** After the user selects and approves a wallet connection, the system shall read the user's receiving address and stake address from the wallet extension.

**FR-03-3:** The system shall store the connected wallet address on the User document in MongoDB and use it as the source address for transaction building.

**FR-03-4:** The system shall read the user's ADA balance from the wallet extension and display it in the app UI, refreshed when the payment screen is opened.

**FR-03-5:** The system shall never generate, store, or transmit private keys. All transaction signing shall occur within the user's browser wallet extension without any private key exposure to the application backend.

**FR-03-6:** The wallet connection state shall be persisted across browser sessions. On page load, the system shall attempt silent reconnection to the previously connected wallet without requiring the user to click again.

---

### FR-04: Invoice Creation

**FR-04-1:** An authenticated merchant shall be able to create a payment invoice by providing: INR amount (required), description (optional, max 140 characters), line items (optional), and a chat room ID (optional, for in-chat invoices).

**FR-04-2:** The system shall fetch the current ADA/INR rate from the price oracle at invoice creation time and calculate the lovelace equivalent of the INR amount. This lovelace amount shall be stored in the invoice and shall not change for the lifetime of the invoice.

**FR-04-3:** The system shall enforce a minimum invoice amount of 1,000,000 lovelace (1 ADA) due to Cardano's minimum UTXO requirement. Invoices below this minimum shall be rejected with a clear error message stating the minimum in both ADA and INR.

**FR-04-4:** The invoice shall have a configurable expiry, defaulting to 600 seconds (10 minutes) from creation. Merchants shall be able to configure their default expiry between 300 seconds (5 minutes) and 1800 seconds (30 minutes).

**FR-04-5:** Each invoice shall be assigned a unique invoiceId in the format `INV-{timestamp}-{nanoid}` (e.g., `INV-20250518-A3X9K2`).

**FR-04-6:** The merchant's payment address at the time of invoice creation shall be snapshotted into the invoice document. If the merchant later changes their wallet address, in-flight invoices shall continue to use the address that was registered at creation time.

**FR-04-7:** If a chat room ID is provided, the system shall automatically write a payment request message to the corresponding Firebase chat room upon invoice creation.

---

### FR-05: Transaction Building and Submission

**FR-05-1:** The system shall expose an API endpoint that accepts an invoice ID and returns an unsigned Cardano transaction in CBOR hex format, ready for wallet signing.

**FR-05-2:** The unsigned transaction shall send exactly `amountLovelace` to the merchant's `paymentAddress` as specified in the invoice.

**FR-05-3:** The unsigned transaction shall include Cardano transaction metadata under key `674` containing at minimum: the invoiceId, the merchant ID, a schema version, and the ZeroPay application identifier.

**FR-05-4:** When building transactions for the Aiken escrow contract, the transaction shall lock funds at the contract script address with a datum containing: invoiceId, merchant public key hash, lovelace amount, and the invoice expiry timestamp in POSIX milliseconds.

**FR-05-5:** The system shall expose an API endpoint for submitting a signed transaction. This endpoint accepts the tx hash returned by the wallet extension after signing and broadcasting.

**FR-05-6:** Upon receiving a tx hash, the system shall update the invoice status to `submitted`, write the tx hash to MongoDB, update Firebase with the new status, and enqueue a confirmation polling job in BullMQ. The endpoint shall return HTTP 202 Accepted immediately.

**FR-05-7:** The system shall prevent double-submission — if a tx hash is submitted for an invoice that is already in `submitted`, `confirming`, `confirmed`, or `settled` status, the request shall be rejected with HTTP 409 Conflict.

---

### FR-06: Blockchain Confirmation Pipeline

**FR-06-1:** The system shall poll Blockfrost for the status of every `submitted` transaction, checking at 20-second intervals (matching Cardano's approximate block time).

**FR-06-2:** When a transaction is first found on-chain (present in a block), the system shall update the invoice status to `confirming` and record the block height.

**FR-06-3:** The system shall continue polling until the transaction reaches at least 3 block confirmations. When 3 confirmations are reached, the invoice status shall be updated to `confirmed`.

**FR-06-4:** After reaching `confirmed` status, the system shall trigger three sequential operations: generate and pin the IPFS receipt, update the merchant's aggregate stats, and send push notifications to both parties. After all three complete, the invoice status shall be updated to `settled`.

**FR-06-5:** If a transaction is not found on-chain within 60 polling attempts (~20 minutes), the invoice status shall be set to `failed`. Both parties shall be notified.

**FR-06-6:** The system shall automatically failover to Koios when Blockfrost returns any 5xx error, 429 rate limit response, or times out after 5 seconds. The failover shall be transparent to the user.

**FR-06-7:** All invoice status transitions shall be written to both MongoDB (source of truth) and to the corresponding Firebase path (`/invoices/{invoiceId}/status`) to enable real-time frontend updates without polling.

---

### FR-07: Real-Time Chat Interface

**FR-07-1:** The system shall support persistent chat rooms between a customer and a merchant, with each pair having exactly one room. The room ID shall be deterministically derived from the customer and merchant IDs.

**FR-07-2:** All chat messages shall be stored in Firebase Realtime Database and shall be delivered to all connected clients within 500 milliseconds under normal network conditions.

**FR-07-3:** The system shall support the following message types, each with distinct rendering: `text`, `payment_request`, `payment_submitted`, `payment_confirmed`, `receipt`, and `system` (for automated status updates).

**FR-07-4:** A `payment_request` message bubble shall display: INR amount prominently, ADA equivalent in smaller text, the exchange rate used, the invoice description, a countdown timer showing time until expiry, and a "Pay Now" button.

**FR-07-5:** The `payment_request` bubble shall update in place (not create a new message) as the invoice status changes from `pending` to `submitted` to `confirming` to `confirmed` to `settled`. The button changes from "Pay Now" to a status indicator.

**FR-07-6:** The merchant shall be able to see when a customer is online (active within the last 5 minutes) using Firebase presence. Online status shall be shown as a green dot next to the customer's name in the chat room list.

**FR-07-7:** The system shall maintain a list of all chat rooms for a given user, sorted by most recent message timestamp. Each room in the list shall show: the other party's name, the last message preview, the last message timestamp, and an unread message count badge.

---

### FR-08: QR Payment System

**FR-08-1:** Every merchant shall have a static QR code that encodes their unique merchant URI. This QR code does not contain any amount — it is an identity QR, not an invoice QR.

**FR-08-2:** Scanning the static merchant QR in the ZeroPay app shall navigate the customer directly to the existing chat room with that merchant, or create a new one if none exists.

**FR-08-3:** The merchant's counter checkout mode shall allow generating a dynamic invoice QR that encodes a specific amount. This QR shall be scannable by any standard Cardano wallet and shall include the contract script address and datum as the payment destination.

**FR-08-4:** Dynamic invoice QRs shall display a live countdown timer on the merchant's screen showing time until expiry.

**FR-08-5:** When a dynamic invoice QR is paid, the merchant's counter checkout screen shall display a large green checkmark animation with the confirmed amount and customer identifier (if available).

**FR-08-6:** The static merchant QR code shall be downloadable in two formats: a standard size PNG (suitable for screen sharing) and a high-resolution print-ready format (minimum 300 DPI, suitable for A5 or smaller printing).

---

### FR-09: Merchant Dashboard

**FR-09-1:** The merchant dashboard shall display an overview panel containing: today's revenue in INR and ADA, the number of completed transactions today, the number of currently pending invoices, and a 7-day daily revenue bar chart.

**FR-09-2:** The dashboard shall display a transaction history table showing all invoices, paginated at 25 per page, sortable by date and filterable by status.

**FR-09-3:** Each transaction row shall be expandable to show: the full invoice ID, the tx hash (tappable link to Cardano explorer), the block height, the confirmation count at settlement, the IPFS receipt URL, and the exact ADA rate used.

**FR-09-4:** The dashboard shall update in real time — when a pending payment is confirmed while the merchant has the dashboard open, the relevant row's status shall update without a page refresh.

**FR-09-5:** The merchant shall be able to configure their account settings from the dashboard, including: default invoice expiry, payment address (wallet address for receiving ADA), shop name, category, and notification preferences.

**FR-09-6:** The dashboard shall show a "pending invoices" panel listing all invoices in `pending` status, with their amounts and expiry countdowns, and a button to manually expire each one.

---

### FR-10: Price Oracle

**FR-10-1:** The system shall maintain a current ADA/INR exchange rate cache in Upstash Redis with a 60-second TTL.

**FR-10-2:** The system shall expose an API endpoint that returns the current ADA/INR and ADA/USD rates. This endpoint shall serve from cache when available and fetch from CoinGecko when the cache is empty or expired.

**FR-10-3:** The system shall fetch rates from CoinGecko's public API endpoint (`/simple/price?ids=cardano&vs_currencies=inr,usd`) with a 5-second timeout.

**FR-10-4:** If CoinGecko fails or times out, the system shall return the most recently cached rate with a `stale: true` flag and a `cachedAt` timestamp in the response. Invoice creation shall still succeed with a stale rate, with the staleness clearly visible to the merchant.

**FR-10-5:** The frontend shall display the ADA equivalent and current rate on every payment request bubble and every checkout screen. The rate shall be labeled with its source and timestamp (e.g., "rate as of 10:00 AM").

**FR-10-6:** If the live rate has changed by more than 2% from the rate locked in an invoice, the customer's payment screen shall display a visible notice: the amount in ADA is fixed, but the market rate has moved.

---

### FR-11: IPFS Receipt System

**FR-11-1:** Upon invoice settlement, the system shall generate a structured JSON receipt document containing: invoiceId, merchantId, shopName, customerDisplayName, amountINR (in paise), amountLovelace, adaInrRate, description, items, txHash, blockHeight, confirmationsAtSettlement, settledAt timestamp, Cardano network, and zeropay_version.

**FR-11-2:** The system shall upload this JSON document to Pinata's IPFS pinning service. The upload shall use Pinata's pinning API with the invoiceId as the IPFS file name for human readability.

**FR-11-3:** The CID returned by Pinata shall be stored on the Invoice document in MongoDB and on the corresponding Firebase path for real-time delivery to the chat interface.

**FR-11-4:** The system shall construct a public IPFS gateway URL for the receipt (e.g., `https://gateway.pinata.cloud/ipfs/{cid}`) and include it in the receipt message written to the Firebase chat room.

**FR-11-5:** The system shall submit a secondary Cardano metadata transaction recording the invoiceId and IPFS CID on-chain. This creates a permanent, blockchain-verifiable link from the invoice to its receipt document.

**FR-11-6:** The receipt document shall be immutable after creation. No modification to the stored JSON content shall ever occur. Re-pinning is acceptable for redundancy, but the content hash (CID) shall remain unchanged.

---

### FR-12: Push Notifications

**FR-12-1:** The system shall send FCM push notifications to the merchant device when: a customer submits a payment transaction for their invoice, a payment is confirmed with 3+ block confirmations, and when an invoice expires without payment.

**FR-12-2:** The system shall send FCM push notifications to the customer device when: a merchant sends them a new payment request in chat, a payment they submitted is confirmed, and when an invoice they were sent expires.

**FR-12-3:** All push notifications shall include a `data` payload containing the invoiceId and the target app route, enabling deep linking from notification tap to the correct screen.

**FR-12-4:** Payment confirmation notifications shall be delivered within 10 seconds of the job queue detecting the 3rd block confirmation.

**FR-12-5:** The system shall gracefully handle invalid or stale FCM tokens by catching the registration-not-found error from FCM and removing the stale token from the User document.

---

## 8. Non-Functional Requirements

### NFR-01: Performance

**NFR-01-1:** All dashboard API endpoints shall respond within 300 milliseconds under normal load (fewer than 50 concurrent users).

**NFR-01-2:** Invoice creation endpoints shall respond within 500 milliseconds, inclusive of the price oracle cache lookup.

**NFR-01-3:** Transaction building endpoints shall respond within 1 second.

**NFR-01-4:** The web application initial page load (LCP — Largest Contentful Paint) shall be under 3 seconds on a 4G mobile connection.

**NFR-01-5:** Chat messages shall appear in the recipient's UI within 500 milliseconds of sending under normal network conditions.

**NFR-01-6:** The dashboard's 7-day chart data shall load within 200 milliseconds (served from Redis pre-computed cache).

---

### NFR-02: Reliability

**NFR-02-1:** The confirmation polling pipeline shall achieve a success rate of at least 99% — no more than 1 in 100 submitted valid transactions shall fail to be detected and settled.

**NFR-02-2:** The system shall tolerate Blockfrost being unavailable for up to 30 continuous minutes by failing over to Koios without manual intervention.

**NFR-02-3:** The Render backend shall maintain at least 99.5% uptime, enabled by UptimeRobot keep-alive monitoring.

**NFR-02-4:** No user action shall result in data loss if the backend server is temporarily unavailable between when the user signs the transaction (in their wallet) and when they submit the tx hash. The tx hash can be re-submitted.

**NFR-02-5:** The BullMQ job queue shall persist jobs through backend restarts. Jobs in progress at the time of a restart shall resume polling without requiring re-submission by the user.

---

### NFR-03: Scalability

**NFR-03-1:** The Version 1.0 architecture shall be capable of handling up to 500 payment transactions per day without exceeding any free-tier service limit.

**NFR-03-2:** The Blockfrost free tier (50,000 requests/day) shall be sufficient for up to approximately 1,000 active daily transactions when confirmation polling optimization (reduced frequency after first detection) is implemented.

**NFR-03-3:** MongoDB Atlas M0 (512 MB) shall be sufficient for at least 500,000 invoice records based on estimated document sizes of approximately 1 KB per invoice.

**NFR-03-4:** The architecture shall be horizontally scalable — adding more Render instances (on paid plans) shall increase throughput without architectural changes.

---

### NFR-04: Security

**NFR-04-1:** All API endpoints shall enforce authentication except: the merchant public profile endpoint (for QR resolution), the price oracle endpoint, and the health check endpoint.

**NFR-04-2:** All environment secrets (Firebase service account, MongoDB URI, Blockfrost API key, Pinata JWT, Upstash credentials) shall never be committed to version control and shall be injected via environment variables.

**NFR-04-3:** All communication between the frontend and backend shall use HTTPS. HTTP connections shall be redirected to HTTPS automatically by the hosting platform.

**NFR-04-4:** All monetary calculations (INR to lovelace conversion, confirmation thresholds) shall occur on the backend and shall be treated as the canonical authoritative values. Frontend-provided amounts shall never be trusted.

**NFR-04-5:** Firebase Realtime Database security rules shall prevent any user from reading or writing to a chat room unless their UID is listed in the room's participants map.

**NFR-04-6:** Firebase Realtime Database security rules shall prevent any non-service-account from writing messages of type `payment_request`, `payment_submitted`, or `receipt` — only the authenticated backend service account may write these types.

---

### NFR-05: Maintainability

**NFR-05-1:** The backend shall be organized in distinct layers (routes, services, jobs, blockchain, database) with clear boundaries. No route handler shall contain business logic — it shall delegate to a service function.

**NFR-05-2:** All TypeScript types shared between the frontend and backend shall be maintained in a single `packages/shared-types` package, preventing drift between client and server expectations.

**NFR-05-3:** All environment variables shall be documented in a committed `.env.example` file with descriptions for each variable.

**NFR-05-4:** All public API endpoints shall be documented with their request shape, response shape, authentication requirements, and error codes.

**NFR-05-5:** The codebase shall be linted (ESLint) and type-checked (TypeScript strict mode) on every CI run. Builds that fail these checks shall not be deployable.

---

## 9. System Architecture Overview

### The Seven-Layer Architecture

ZeroPay is organized into seven distinct layers, each with a single responsibility. Layers communicate in defined ways only — they do not skip layers or create circular dependencies.

**Layer 1 — Presentation.** The React web application and the React Native mobile app. This layer renders UI, manages client-side state, handles wallet connection through the CIP-30 browser API, and communicates with Layer 2 (API) and Layer 7 (Firebase). This layer never communicates directly with Blockfrost, MongoDB, or any blockchain node.

**Layer 2 — API Gateway.** The Node.js + Express server hosted on Render. Handles HTTP routing, authentication verification (Firebase Admin SDK token verification), rate limiting, input validation (Zod schemas), and request routing to the appropriate Layer 3 service. Acts as the single entry point for all client-to-server communication.

**Layer 3 — Business Logic.** Pure service modules organized by domain: InvoiceService, MerchantService, UserService, ChatService, PriceService, ReceiptService. Each service function takes typed inputs and returns typed outputs. No service module imports Express types or has knowledge of HTTP request/response objects. Services talk to Layer 4 (storage) and Layer 5 (blockchain).

**Layer 4 — Job Queue.** BullMQ workers processing asynchronous tasks: confirmation polling, receipt generation, notification dispatch, invoice expiry processing. This layer handles everything that cannot block a synchronous HTTP response. Workers communicate with Layer 3 services and Layer 7 storage.

**Layer 5 — Blockchain Interaction.** A dedicated module that wraps all Cardano network communication. Contains the Blockfrost client, Koios fallback client, MeshJS transaction builder, and Aiken contract interaction utilities. This is the only layer authorized to communicate with Cardano nodes. All other layers access blockchain data through this layer.

**Layer 6 — Smart Contracts.** Aiken validator scripts deployed on Cardano. These are immutable programs running entirely on-chain. They enforce payment rules without requiring trust in any party, including the ZeroPay application. Once deployed, they cannot be modified — only deprecated and replaced with a new contract version.

**Layer 7 — Storage.** Three storage systems used for distinct purposes. MongoDB Atlas is the source of truth for all business data: users, merchants, invoices, transactions. Upstash Redis stores ephemeral data: price cache, active payment state, job queue backing. Firebase Realtime Database stores chat messages and real-time status updates that must be pushed to connected clients.

### Infrastructure Map

All services are free-tier, zero-cost to the developer:

- Frontend hosting: Vercel Hobby (unlimited, free)
- Backend hosting: Render Free (750 hrs/month, kept alive by UptimeRobot)
- Database: MongoDB Atlas M0 (512 MB, free forever)
- Cache + Queue backing: Upstash Redis (10,000 commands/day, free)
- Realtime: Firebase Spark (1 GB, 10 GB/month transfer, free)
- Auth: Firebase Auth (10k phone OTPs/month, unlimited email, free)
- Push notifications: Firebase FCM (unlimited, always free)
- Blockchain reads: Blockfrost Free (50,000 req/day) + Koios (unlimited, community-funded)
- Wallet SDK: MeshJS (open source)
- Smart contracts: Aiken (open source compiler and tooling)
- IPFS: Pinata Free (1 GB)
- Mobile builds: Expo EAS Free (30 builds/month)
- CI/CD: GitHub Actions (2,000 min/month private, unlimited public)
- Error monitoring: Sentry Free (5,000 errors/month)
- Uptime monitoring: UptimeRobot Free (10-minute check intervals)
- Price data: CoinGecko Public API (no key required)

---

## 10. Data Requirements

### Entity Definitions

**User:** The base identity entity for any person using the system. Fields include: Firebase UID (indexed, unique), phone number (optional), email (optional), display name, role (customer / merchant / both), connected Cardano wallet address (indexed), stake address, FCM device token, DID identifier (optional), verified status, and timestamps. One User document per person regardless of how many roles they hold.

**Merchant:** A profile extension on top of a User that enables payment receiving. Fields include: reference to User ID, shop name, category, receiving payment address (indexed), stake address, QR code data, merchantId (unique, human-readable), default invoice expiry in seconds, auto-settle enabled flag, denormalized aggregate stats (total ADA received in lovelace, total order count), active status, and timestamps. Not every User has a Merchant document.

**Invoice:** The core business entity representing a single payment transaction lifecycle. Fields include: invoiceId (unique), reference to Merchant ID, reference to Customer User ID (optional for walk-in counter payments), chat room ID (optional), INR amount in paise, lovelace amount, ADA/INR rate at creation, ADA/USD rate at creation, payment address snapshot, description, line items array, status (7-state machine), tx hash (sparse index), block height, confirmation count, IPFS CID, IPFS receipt URL, expiry timestamp (with TTL index for automatic MongoDB document cleanup), confirmation timestamp, settlement timestamp, and timestamps. This is the highest-write collection in the system.

**Transaction:** An on-chain record linked to an Invoice. Fields include: reference to Invoice ID, tx hash (unique indexed), status (submitted / confirming / confirmed / failed), block height, confirmation count, submitted at timestamp, confirmed at timestamp, amount verified in lovelace, verification result. This is a separate document from Invoice to allow clean separation between business state and blockchain state.

**ChatRoom:** Stored in Firebase Realtime Database, not MongoDB. Contains: room ID, merchant ID, customer ID, participants map (user IDs as keys), last message preview, last updated timestamp. The room ID is deterministic: `room_{hash(customerId + merchantId)}`.

**Message:** Stored in Firebase Realtime Database as children of ChatRoom. Contains: message ID (auto-generated), sender ID, type (text / payment_request / payment_submitted / payment_confirmed / receipt / system), content or structured payload depending on type, and timestamp.

### Data Integrity Rules

Every invoice must have its payment address snapshotted at creation time — the merchant's current wallet address must be stored in the invoice and used exclusively for that invoice's payment routing, regardless of any subsequent address changes.

Every monetary value stored in the system must be an integer. INR amounts are stored in paise (multiply by 100). ADA amounts are stored in lovelace (multiply by 1,000,000). No floating-point representation of any monetary value is permitted at the storage layer.

Invoice status transitions are unidirectional. No status can move backwards. The only exception is that a `pending` invoice can move to `expired`. A `failed` invoice can never be retried — a new invoice must be created.

### Indexes Required

MongoDB indexes must be created explicitly before any production data is written. Required indexes: users — unique on firebaseUid, sparse on walletAddress, sparse on stakeAddress. merchants — unique on merchantId, indexed on paymentAddress. invoices — unique on invoiceId, compound on merchantId + status + createdAt (for dashboard queries), sparse on txHash, TTL on expiresAt. transactions — unique on txHash, indexed on invoiceId.

---

## 11. Blockchain Requirements

### Cardano Network Support

The system shall support two Cardano networks: `preprod` (for development and testing) and `mainnet` (for production). The network is a single environment variable that changes the Blockfrost URL prefix and the Cardano transaction builder's network parameter. No other code changes are required to switch networks.

All development and testing shall occur on `preprod`. The Cardano faucet provides free test ADA for preprod. The `mainnet` network shall only be used for production deployment after the complete test checklist has been passed on `preprod`.

### Transaction Metadata Requirements

Every payment transaction created by ZeroPay must include Cardano transaction metadata under key `674` (the Cardano community standard for general application metadata). The metadata object shall contain at minimum: a schema version identifier, the application name ("zeropay"), the invoice ID, and the merchant ID. All metadata values shall be within the 64-byte per-value Cardano limit. Values that may exceed 64 bytes (such as description text) shall be truncated or split across multiple keys.

### Aiken Smart Contract Requirements

**Contract Deployment:** The contract shall be deployed once on each network (preprod and mainnet) and its script hash stored as an immutable configuration constant. The contract shall use the reference script pattern to avoid paying full script bytes on every interaction transaction.

**Datum Requirements:** Every payment locked in the contract shall include a datum containing: invoiceId as bytes, merchant public key hash (Blake2b-224 hash of the merchant's verification key), the exact lovelace amount to be paid, and the invoice expiry time as a POSIX timestamp in milliseconds.

**Collect Validation:** The contract's collect spending path shall verify: the transaction is signed by the key whose hash matches the merchant public key hash in the datum, and the output to an address controlled by the merchant contains at least the lovelace amount specified in the datum.

**Refund Validation:** The contract's refund spending path shall verify: the current transaction validity interval begins after the expiry timestamp in the datum, and the transaction is signed by the customer's public key hash stored in a separate datum field.

**No Permanent Lock Guarantee:** The contract shall always have a valid spending path. Under all circumstances — including merchant key loss, merchant business closure, or application shutdown — the customer shall have a time-based refund path to recover their ADA.

### Finality Requirements

The system shall define financial finality as 3 block confirmations. This threshold shall never be reduced below 3. For invoices with amounts above the equivalent of USD $500 (calculated at the ADA/USD rate at invoice creation), the system shall require 6 block confirmations before settlement.

---

## 12. Security Requirements

### Critical Security Rules — Non-Negotiable

**Rule 1: No private keys, ever.** The application backend shall never generate, store, receive, transmit, log, or process any private key material. This rule has no exceptions. Any feature request that would require the backend to handle private keys must be redesigned at the architectural level before implementation.

**Rule 2: Backend is the sole authority on amounts.** The lovelace amount for any payment is calculated and stored by the backend at invoice creation time. No frontend-provided amount shall be used to build a transaction or to evaluate whether a payment is sufficient. The backend reads the lovelace amount from the invoice document — it does not accept it from the client.

**Rule 3: Firebase security rules match application logic.** If the application does not allow a user to perform an action, the Firebase security rules shall independently enforce the same restriction. Application-level checks are not sufficient — they can be bypassed. Firebase rules are the enforcement layer for all Firebase reads and writes.

**Rule 4: Rate limiting on all writes.** Every endpoint that writes data (invoice creation, transaction submission, wallet registration, merchant onboarding) shall have an independent rate limit per authenticated user. Rate limits are enforced at the Redis layer and cannot be bypassed by authentication.

**Rule 5: Input validation before any processing.** All API request inputs shall be validated against Zod schemas as the first operation in every route handler, before any database calls, before any blockchain calls, before any business logic runs. Invalid inputs are rejected immediately with descriptive error messages.

### Secret Management

All secrets are managed at three levels: local development uses `.env` files that are never committed to version control, the `.gitignore` at the repository root explicitly excludes all `.env` files, and production secrets are injected via Render's environment variable panel and GitHub repository secrets. A `.env.example` file committed to version control documents every required variable name with descriptive comments and no values.

### CORS Policy

The backend shall implement a strict CORS policy that allows requests only from: the production Vercel domain, the local development origin (`localhost:5173`), and any staging domains created for testing. All other origins shall receive a 403 response. CORS headers shall be applied before authentication checks so that preflight requests are handled correctly.

### Cardano Address Validation

Every Cardano address received from any source (user input, QR scan, API request) shall be validated against the bech32 address format specification before being stored or used. Invalid addresses shall be rejected immediately with a descriptive error. Addresses shall also be validated for network match — a mainnet address shall not be accepted when the system is configured for preprod, and vice versa.

---

## 13. UX & Accessibility Requirements

### Core UX Principles

**Principle 1: Blockchain is invisible.** The words "blockchain," "UTXO," "lovelace," "datum," "validator," and "confirmation" shall never appear in any user-facing UI text. The words a user sees are: "payment," "received," "confirmed," "processing," "ADA," "₹," "receipt," and "wallet." Technical terms are internal only.

**Principle 2: INR is always primary.** Every amount displayed to the user shall show INR prominently and ADA subordinately. A merchant requesting ₹150 sees `₹150.00` in large text and `3.24 ADA` in smaller supporting text. A customer paying sees the same hierarchy. No user ever needs to calculate or think in ADA amounts.

**Principle 3: Status is always visible.** At no point in the payment flow shall the user be unsure what is happening. The system displays one of these four states at all times: "Waiting for payment," "Payment processing," "Payment confirmed," or "Expired." Each state has a distinct visual indicator.

**Principle 4: Mobile first.** All UI is designed for 390px viewport width first and scales up. Tap targets are a minimum of 44px. No feature requires hover state to discover. The most common actions (create invoice, view status, scan QR) are reachable within two taps from the home screen.

**Principle 5: Failure is recoverable.** Every failed action presents a clear error message, an explanation of why it happened in plain language, and a specific next step. No dead ends.

### Accessibility Requirements

Text contrast shall meet WCAG AA standard (4.5:1 for normal text, 3:1 for large text). All interactive elements shall have visible focus states for keyboard navigation. All images and icons shall have descriptive alt text. Form inputs shall have visible, persistent labels (not placeholder-only labels). The application shall be navigable using the browser's native tab order without custom JavaScript event trapping that breaks assistive technology.

### Loading State Requirements

Every API call that may take more than 300 milliseconds shall show a skeleton UI or loading indicator specific to the content being loaded. Generic spinners are acceptable for user-triggered actions (invoice creation, payment submission). Skeleton screens are required for dashboard data loads. The application shall never show a blank white screen while data is loading.

---

## 14. Integration Requirements

### Firebase Integration

Firebase Realtime Database shall be initialized on the frontend using the Firebase web SDK v9+ modular API. The database region shall be `ap-south-1` (Mumbai) for lowest latency from Indian users. The Firebase Admin SDK on the backend shall be initialized using a base64-encoded service account JSON stored as an environment variable. The Admin SDK is the only way the backend writes to Firebase — it bypasses security rules and has full database access.

### Blockfrost Integration

The Blockfrost client shall be configured with the project ID from the environment variable and the appropriate base URL for the configured network. All Blockfrost calls shall use a 5-second request timeout. Every Blockfrost call shall be wrapped in error handling that catches network errors, timeout errors, 5xx responses, and 429 responses. On any of these errors, the call shall immediately retry against Koios.

### Koios Integration

Koios is the fallback Cardano indexer used when Blockfrost is unavailable. Koios requires no API key for the public endpoints. The Koios client shall be configured with the appropriate base URL for the configured network. The Koios API surface used by this application is: transaction details lookup by tx hash, and block information lookup by hash. All other Blockfrost-equivalent operations shall use the same Koios endpoints.

### CoinGecko Integration

The price oracle uses CoinGecko's public `/simple/price` endpoint with `ids=cardano&vs_currencies=inr,usd`. No API key is required. The call shall use a 5-second timeout. Rate limit handling is handled architecturally by the 60-second Redis cache — the direct CoinGecko call happens at most once per 60 seconds regardless of traffic.

### Pinata Integration

The IPFS pinning client shall use Pinata's REST API with JWT authentication. The receipt JSON shall be uploaded using Pinata's `/pinning/pinJSONToIPFS` endpoint. The `pinataMetadata` field shall include the invoiceId as the `name` property for easy identification in the Pinata dashboard. The resulting `IpfsHash` from Pinata's response is the CID stored in the invoice document.

### MeshJS Integration

MeshJS is used for all Cardano transaction building, CIP-30 wallet connection management, and wallet state reading. Transaction building shall use MeshJS's `Transaction` builder class. Wallet connection shall use `BrowserWallet.enable(walletName)`. All available installed wallets shall be detected using `BrowserWallet.getInstalledWallets()`. MeshJS handles CBOR encoding, fee calculation, and UTXO selection internally.

---

## 15. Feature Specifications — Detailed

### Feature: Payment Request in Chat — Complete Specification

**Entry points:** The merchant can initiate a payment request from two places — the chat input bar (a ₹ icon button) and the counter checkout screen. Both paths create an Invoice document and result in a payment request message in the chat.

**Input fields:** INR amount (required, minimum 100 paise = ₹1, maximum 1,000,000 paise = ₹10,000), description (optional, max 140 characters, validated against Cardano metadata byte limit), line items (optional, array of name/quantity/unit price tuples, total must match the INR amount within rounding tolerance).

**Amount validation:** The backend validates that the INR amount converts to at least 1,000,000 lovelace at the current rate. If the amount is too small (because ADA/INR rate is high), the backend returns the minimum INR amount at the current rate, e.g. "Minimum payment is ₹47 at current ADA rate."

**Rate locking behavior:** The ADA/INR rate is fetched from the Redis cache at the moment the backend creates the invoice. This rate, and the resulting lovelace amount, are stored in the invoice and displayed to the customer when they view the request. This rate does not change for the lifetime of the invoice even as the market moves.

**Chat message creation:** Immediately after the invoice is created in MongoDB, the backend writes a `payment_request` message to Firebase at the path `/chatrooms/{roomId}/messages`. This write uses the Firebase Admin SDK (bypasses security rules). The message payload includes the full invoice details needed to render the bubble without a secondary API call.

**Expiry handling:** The invoice has an `expiresAt` timestamp. Firebase Real-time Database stores a copy of this timestamp. The frontend renders a countdown timer on the payment bubble using the `expiresAt` value. When the timer reaches zero, the bubble displays "Expired" without waiting for the backend to process the expiry — this is a frontend-only visual update. The backend's expiry job runs independently and updates the canonical status.

**Cancellation:** The merchant can cancel a pending invoice from the chat (by long-pressing the payment bubble) or from the dashboard pending panel. Cancellation sets the invoice status to `expired` and updates the Firebase status path, causing the bubble to show "Cancelled by merchant."

---

### Feature: Counter Checkout Mode — Complete Specification

**Purpose:** Designed for high-throughput physical transactions where the merchant and customer are in the same physical location and there is no existing chat relationship. The merchant uses this for walk-in customers who may not have the ZeroPay app — only a standard Cardano wallet.

**UI layout:** Full-screen mode with a large numeric keypad. The merchant enters the INR amount. A description can be added from a pre-saved template list (configurable in settings). The displayed ADA equivalent updates as the merchant types. A "Generate Bill" button creates the invoice and displays the QR code.

**QR code content for counter checkout:** Unlike the static identity QR, the counter checkout QR encodes a Cardano payment URI that specifies: the contract script address, the lovelace amount, and the datum hash (for escrow-based payments) or the merchant's direct receiving address and amount (for simple transfer mode). The URI format follows community conventions for Cardano payment URIs.

**Confirmation display:** The merchant's screen actively listens to the Firebase invoice status path. When the backend job queue updates the status to `confirmed`, the screen displays a large animated confirmation with the amount. The merchant presses a physical "New Transaction" button to reset for the next customer.

**Timeout:** If no payment is received within the invoice's expiry window, the QR code screen automatically returns to the keypad with a "Expired — start a new bill" message. The merchant does not need to manually cancel.

---

### Feature: Wallet Connection — Complete Specification

**Discovery:** On the wallet connection screen, the frontend calls `BrowserWallet.getInstalledWallets()` which returns an array of wallet descriptors for all CIP-30 compliant extensions currently active in the browser. Each descriptor includes the wallet name and icon. If no wallets are detected, the UI shows guidance text with links to install Eternl or Lace, the two recommended wallets.

**Connection flow:** The user clicks their chosen wallet. The frontend calls `BrowserWallet.enable(walletName)` which triggers the wallet extension's approval dialog. The user approves. The frontend calls `wallet.getUsedAddresses()` (returns addresses that have been used in prior transactions) and `wallet.getChangeAddress()` (the primary receiving address for new funds). The first used address, or the change address if no used addresses exist, is used as the merchant's payment address.

**Address registration:** The frontend sends the wallet address and stake address to the backend, which validates the address format and network, and updates the Merchant or User document.

**Reconnection:** The wallet name is stored in `localStorage` under a defined key. On page load, the frontend checks for this key and attempts `BrowserWallet.enable(storedWalletName)` automatically. Many wallets grant silent reconnection if the user has previously approved the connection. If the wallet requires approval again, the approval dialog appears without blocking the rest of the UI.

**Balance display:** After connection, the frontend calls `wallet.getBalance()` which returns the total UTXO balance as a lovelace amount. This is displayed as ADA in the header bar, refreshed whenever the payment screen is opened.

---

## 16. Invoice & Payment State Machine

### State Definitions

The invoice status is the single most important data field in the system. It must be correct at all times. The following describes every valid state, how it is entered, what it means, and where it transitions to.

**pending:** The initial state when an invoice is created. The invoice has been created in MongoDB, a payment request has been sent to Firebase chat (if applicable). No transaction has been submitted by the customer. The invoice will remain in this state until either the customer submits a transaction (→ `submitted`) or the expiry timestamp passes (→ `expired`). This state can also be manually transitioned to `expired` by the merchant.

**submitted:** The customer has submitted a signed transaction to the Cardano network through their wallet extension. The tx hash is recorded. The backend has received the tx hash and enqueued a BullMQ confirmation polling job. The payment has left the customer's wallet (the UTXO is spent) but has not yet appeared in a Cardano block. The system transitions this to `confirming` when the tx is first found on-chain, or to `failed` if it is not found within the polling window.

**confirming:** The transaction has been included in a Cardano block and is visible on-chain. It has between 1 and 2 confirmations. The polling job is actively checking the block depth. The system transitions to `confirmed` when the confirmation count reaches 3.

**confirmed:** The transaction has at least 3 block confirmations. The payment is considered final for all practical purposes. This state is transient — the system immediately triggers the post-confirmation processing pipeline (IPFS receipt generation, stat updates, notifications). The system transitions to `settled` when all post-processing completes.

**settled:** The complete lifecycle is finished. The invoice has: a confirmed tx hash, a settlement timestamp, an IPFS CID, an IPFS receipt URL, and the merchant's aggregate stats have been updated. This is the terminal success state.

**expired:** The invoice's `expiresAt` timestamp passed while the invoice was in `pending` status. No payment was received. Both parties have been notified. If the customer had locked funds in the escrow contract for this invoice (which requires them to have submitted a transaction, moving the invoice to `submitted` before expiry), this state does not apply — `submitted` invoices are tracked until they confirm or fail regardless of the original expiry time.

**failed:** A transaction was submitted but was not found on-chain within the polling window (approximately 20 minutes). This may occur because the transaction expired at the Cardano protocol level (Cardano transactions have a TTL of approximately 2 hours, but network congestion can prevent mempool inclusion), because the transaction was rejected by node mempool validation, or because a brief chain reorganization affected the transaction. Both parties are notified. The customer's ADA was not deducted (a failed Cardano transaction never spends UTXOs). A new invoice should be created if the merchant and customer wish to retry.

### Allowed Transitions

The state machine enforces these transitions and no others:

- pending → submitted (customer submits tx hash)
- pending → expired (expiry timer fires, or merchant manually cancels)
- submitted → confirming (tx found on-chain for first time)
- submitted → failed (tx not found after polling window exhausted)
- confirming → confirmed (3+ block confirmations detected)
- confirmed → settled (post-processing pipeline completes)

Any attempted transition not in this list shall be treated as a programming error, logged to Sentry, and shall not be applied. The current status shall remain unchanged.

---

## 17. Error Handling Requirements

### Error Response Standard

Every API error response shall follow this structure: an `error` field containing a human-readable message suitable for display to the user, a `code` field containing a machine-readable error identifier (e.g., `INVOICE_EXPIRED`, `INSUFFICIENT_AMOUNT`, `WALLET_ADDRESS_INVALID`), and an HTTP status code appropriate to the error type. Optional: a `details` field for structured additional information useful to developers.

### Payment Flow Error Scenarios

**Scenario: Customer submits payment after invoice expires.**
The backend checks invoice status before building the transaction. If status is `expired`, the endpoint returns HTTP 410 Gone with error code `INVOICE_EXPIRED`. The frontend displays "This payment request has expired. Ask the merchant to send a new one." No transaction is built.

**Scenario: Customer tries to pay an invoice that is already submitted.**
The backend checks invoice status before building the transaction. If status is `submitted`, `confirming`, `confirmed`, or `settled`, the endpoint returns HTTP 409 Conflict with the current status. The frontend displays a status-appropriate message such as "Your payment is already processing" or "This invoice has already been paid."

**Scenario: Transaction fails to appear on-chain.**
The job queue exhausts its retry limit. The invoice is set to `failed`. The backend sends push notifications to both parties. The customer sees: "Your payment could not be confirmed. Your ADA was not deducted. Please try again." The merchant sees: "Payment for ₹150 could not be confirmed. Ask your customer to try again."

**Scenario: CoinGecko is unavailable when creating an invoice.**
The backend returns the most recently cached rate with a `stale: true` flag. The invoice is created with the stale rate, clearly labeled in the API response and in the frontend as "Rate may be slightly outdated (last updated X minutes ago)." Invoice creation proceeds — a slightly stale rate is preferable to blocking the merchant from creating invoices.

**Scenario: Blockfrost returns 429 during confirmation polling.**
The BullMQ worker catches the 429 error and immediately retries the same request against Koios. If Koios also fails, the job fails its current attempt and BullMQ schedules a retry after 20 seconds. This is transparent to the user — they see the invoice in `submitted` or `confirming` status and the polling continues in the background.

**Scenario: Pinata IPFS upload fails.**
The receipt generation job fails and is retried up to 3 times with 30-second intervals. If all retries fail, the invoice is set to `settled` with a null `receiptCid` and a `receiptPending: true` flag. A background retry job is scheduled. The merchant is notified "Your receipt is generating — check back in a few minutes." The absence of a receipt does not block settlement.

---

## 18. Performance Requirements

### Baseline Targets (Version 1.0)

These targets are evaluated against the free-tier infrastructure stack under a load of up to 50 concurrent users:

Dashboard load time (time from route navigation to full data render): under 2 seconds. Invoice creation (time from merchant tapping "Send Request" to the message appearing in chat): under 1 second. Payment confirmation time (time from Cardano block confirmation to merchant receiving push notification and dashboard updating): under 30 seconds from the job queue detecting the confirmation. QR code generation (time from merchant opening counter checkout to QR code appearing on screen): under 300 milliseconds (client-side generation, no network round trip).

### Optimization Strategies

The 7-day revenue chart data shall be pre-computed daily by a scheduled job and cached in Redis. Dashboard loads read from this cache, not from MongoDB aggregation queries. This reduces dashboard query time from potentially 500+ milliseconds (aggregate over large invoice collection) to under 50 milliseconds (Redis read).

The confirmation polling job shall use an adaptive polling frequency: every 20 seconds when the invoice is in `submitted` status (waiting for first block), then every 60 seconds once in `confirming` status (waiting for 2 additional confirmations). This reduces Blockfrost API usage by approximately 66% per confirming transaction, allowing the free tier to handle more simultaneous payments.

The merchant profile lookup (triggered on every QR scan) shall be cached in Redis for 5 minutes per merchantId. This prevents the public merchant profile endpoint from hitting MongoDB on every scan during busy periods.

---

## 19. Testing Requirements

### Test Coverage Requirements

Unit tests shall cover: all service-layer business logic functions, all price calculation functions (INR to lovelace conversion, rate locking), invoice ID generation and format validation, Cardano address validation, and the Aiken smart contract's spending paths (using Aiken's built-in test framework).

Integration tests shall cover: the full invoice creation API endpoint (request → MongoDB → Firebase write → response), the transaction submission endpoint (request → MongoDB update → BullMQ job enqueue → response), the price oracle endpoint (cache miss path → CoinGecko → cache write → response, and cache hit path), Blockfrost confirmation detection for a known preprod tx hash, and Koios failover when Blockfrost returns an error.

End-to-end tests shall cover the complete payment flow on preprod: merchant creates invoice in chat → customer pays → polling detects confirmation → IPFS receipt generated → both parties notified. This test must use real test ADA on the preprod network.

### Preprod QA Checklist (Manual, Pre-Launch)

Before any production launch, a human tester who did not build the feature must manually verify each of the following scenarios on the preprod network:

Merchant signup, wallet connect, and QR generation in under 10 minutes. Customer QR scan creates chat room correctly. Merchant sends payment request in chat, customer sees bubble with correct amount and rate. Customer pays, merchant sees "confirming" status update in real time. Payment settles after 3 blocks, merchant sees "settled" status with green checkmark. IPFS receipt is generated and URL is accessible. Both parties receive push notifications at each stage. Counter checkout QR is generated and scanned with an external Cardano wallet successfully. Invoice expires without payment, both parties see expired state. Blockfrost failover — with Blockfrost's domain blocked locally, Koios takes over and confirmation is detected. Render cold start — server responds within 60 seconds after an idle period (UptimeRobot is active). Aiken refund path — a customer locks funds in the escrow contract, the invoice expires, the customer successfully claims a refund.

---

## 20. Release Strategy & Milestones

### Milestone 1 — Core Payment Loop (End of Week 4)

The minimum viable version that proves the concept works end-to-end on preprod. Scope includes: merchant onboarding with wallet connect, invoice creation via API, unsigned transaction building with MeshJS, customer signs and submits via wallet extension, backend polling detects confirmation, invoice status updates in MongoDB and Firebase, frontend displays status update. No Aiken contracts, no IPFS, no mobile app, no push notifications. Just the core loop.

Success criterion: A developer can create a merchant account, create an invoice, pay it with test ADA from a second wallet, and see the invoice move from `pending` to `settled` within 90 seconds.

### Milestone 2 — Smart Contract + IPFS (End of Week 5)

The same payment loop now uses the Aiken escrow contract for locking and settlement. IPFS receipts are generated after every settlement. The secondary metadata transaction recording the IPFS CID on-chain is submitted.

Success criterion: Every settled payment has an IPFS CID stored in MongoDB, a receipt accessible at the Pinata gateway URL, and a Cardano metadata transaction linking the invoice ID to the CID.

### Milestone 3 — Full Chat + Dashboard + Notifications (End of Week 8)

Every feature described in this PRD for the web app is working on preprod. The chat interface, counter checkout QR, merchant dashboard with real-time updates, push notifications via FCM, and the complete error handling for all documented failure scenarios.

Success criterion: The complete preprod QA checklist is passed by a tester who did not build the feature. All dashboard data loads within targets. Push notifications are delivered within 10 seconds of confirmation.

### Milestone 4 — Mobile App Alpha (End of Week 10)

React Native mobile app for Android available as an EAS build for internal testing. Core payment flows work on mobile. WalletConnect integration with at least one Cardano mobile wallet (Eternl Mobile or Nami Mobile).

Success criterion: A tester using only an Android phone with Eternl Mobile installed can complete the full payment flow — receive a payment request via push notification, open the app, tap Pay, approve in Eternl Mobile, and receive the receipt — without touching a desktop browser.

### Milestone 5 — Production Launch (End of Week 12)

CI/CD pipeline fully operational. Sentry capturing production errors. UptimeRobot keeping Render awake. All environment variables documented. First real merchant onboarded. If regulatory clarity on mainnet is achieved, deployed on mainnet. Otherwise, production on preprod with a defined mainnet migration date.

Success criterion: The production system processes its first end-to-end payment from a real merchant to a real customer with real ADA on mainnet, generating a real IPFS receipt, with zero developer intervention required.

---

## 21. Success Metrics & KPIs

### Primary Metric (North Star)

**Complete payment conversations per day:** The count of invoices that transition from `pending` to `settled` in a 24-hour period. This is the single number that captures whether the product is working and being used.

Target trajectory: 1 at Milestone 1 (first successful end-to-end test), 10 at Milestone 3 (team testing), 50 at Milestone 5 (early merchant pilot), 500 at 30 days post-launch.

### Product Health Metrics

**Invoice settlement rate:** The percentage of submitted invoices (those that reach `submitted` status) that eventually reach `settled`. Target: above 97%. A drop below 95% indicates a problem in the confirmation pipeline or smart contract.

**Merchant onboarding completion rate:** The percentage of users who begin the merchant onboarding flow and complete it through QR code generation. Target: above 70%. A drop below 50% indicates a UX problem in the onboarding flow.

**Median time from payment submission to settlement:** How long the full confirmation + receipt pipeline takes in practice. Target: under 90 seconds at the 50th percentile. This is driven by Cardano block times and is largely outside the product's control, but pipeline inefficiencies can add time on top of the blockchain's inherent timing.

**Invoice expiry rate:** The percentage of created invoices that expire without payment. A high expiry rate (above 30%) may indicate the invoice expiry window is too short, the payment flow has too much friction, or users are creating test invoices without intending to pay.

**Push notification delivery rate:** The percentage of sent FCM notifications that are delivered and not bounced. Target: above 95%. Drops indicate stale FCM tokens need more aggressive cleanup.

### Infrastructure Health Metrics

**Blockfrost failover events per day:** The number of times the system fell back to Koios due to Blockfrost errors. Zero is ideal. More than 5 per day indicates a Blockfrost reliability issue requiring attention.

**BullMQ failed jobs per day:** Jobs that exhausted all retries. These correspond directly to payments that could not be confirmed. Target: zero. Any non-zero value requires investigation.

**MongoDB storage utilization:** Percentage of Atlas M0's 512 MB used. Alert when above 70%. Requires an upgrade plan or archiving strategy.

**Blockfrost request utilization:** Percentage of the 50,000 daily request limit consumed. Alert when above 80%. Requires polling optimization or plan upgrade.

---

## 22. Risk Register

### Risk: Smart Contract Bug

**Description:** An error in the Aiken validator logic could result in funds being permanently locked in the contract with no spending path, or in funds being claimable by an unauthorized party.

**Likelihood:** Low with thorough testing. Non-zero because smart contracts are immutable once deployed.

**Impact:** Critical. Customer funds could be lost.

**Mitigation:** Exhaustive property-based tests covering all spending paths including boundary cases (payment exactly at minimum, payment at exactly expiry time, etc.). At least two people read the contract source before mainnet deployment. Always maintain a time-based refund path so no UTXO is permanently unspendable. Deploy to preprod and run with real-money-scale amounts (in test ADA) before any mainnet deployment.

**Contingency:** If a critical bug is found post-deployment, the contract cannot be patched. The application must deploy a new contract version, update the script hash in configuration, and provide migration tooling to move any existing locked UTXOs to the new contract if technically feasible. All new invoices use the new contract from the deployment date.

---

### Risk: Render Free Tier Cold Start

**Description:** The Render backend spins down after 15 minutes of inactivity and takes approximately 50 seconds to restart on the first incoming request.

**Likelihood:** Certain — this behavior is documented and inherent to the free tier.

**Impact:** Medium. The first customer of the day (or after a slow period) may experience a 50-second wait when the app tries to reach the API.

**Mitigation:** UptimeRobot monitors the backend health endpoint every 10 minutes, keeping it permanently awake. If UptimeRobot fails or is misconfigured, the cold start resumes.

**Contingency:** Monitor UptimeRobot itself for uptime. If the product reaches meaningful transaction volume, upgrade to Render's $7/month plan which eliminates cold starts.

---

### Risk: CoinGecko Rate Limit

**Description:** CoinGecko's public API has a 50 calls/minute rate limit without an API key. A sudden spike in invoice creation could exhaust this.

**Likelihood:** Very low with the 60-second Redis cache, which reduces direct CoinGecko calls to at most one per minute regardless of traffic.

**Impact:** Low. Stale rates (up to 60 seconds old) are used with a visible label. Invoice creation is not blocked.

**Mitigation:** 60-second Redis cache. If the cache is ever found to be insufficient, the free CoinGecko demo API key provides higher rate limits.

---

### Risk: Blockfrost Free Tier Exhaustion

**Description:** 50,000 Blockfrost requests per day. At 3 polls per active transaction per minute, this supports approximately 11 simultaneous active transactions continuously, or about 1,000 transactions per day with typical distribution.

**Likelihood:** Low at early scale. Becomes a real constraint as the product grows.

**Impact:** Medium. Confirmation polling pauses when limit is hit, delaying settlement by up to the next day's quota reset.

**Mitigation:** Adaptive polling (switch from 20-second to 60-second intervals after first on-chain detection). Koios as unlimited fallback. Monitor daily usage in Blockfrost dashboard.

**Contingency:** At scale, upgrade to Blockfrost's paid plan or self-host a Cardano node and Ogmios/Kupo for unbounded access.

---

### Risk: Firebase Spark Plan Limits

**Description:** Firebase Realtime Database free tier is 1 GB storage and 10 GB/month data transfer.

**Likelihood:** Very low at early scale. A typical chat message is under 500 bytes; 10 GB supports approximately 20 million message reads per month.

**Impact:** High if exceeded — Firebase locks the database until the next month's quota resets.

**Mitigation:** Minimize data stored per message. Do not store redundant data in Firebase. Monitor usage in Firebase Console monthly.

**Contingency:** At scale, upgrade Firebase to Blaze pay-as-you-go which has no hard limits (only billing).

---

### Risk: Customer Unfamiliarity with Cardano Wallets

**Description:** The CIP-30 browser wallet requirement means customers need to have a Cardano wallet extension installed before they can pay. In India, where the Cardano ecosystem is small, this limits the customer base significantly.

**Likelihood:** High. Cardano wallet extension penetration in India is very low compared to MetaMask or any EVM wallet.

**Impact:** High. Limits the total addressable market for Version 1.0.

**Mitigation:** Build the in-app wallet (Version 2.0 priority) which eliminates the need for an external browser extension. Make the wallet installation guides prominent and clear for users who want to onboard.

---

## 23. Open Questions & Decisions Log

### Open: Regulatory status of receiving ADA payments in India

**Question:** Is it legally permissible for an Indian merchant to accept ADA as payment for goods and services in 2025?

**Status:** Unresolved. The Indian government's stance on crypto as a payment mechanism (distinct from investment) is evolving. This is not a blocker for preprod development and testing, but must be resolved before mainnet launch with real merchants.

**Decision required by:** Milestone 5 (production launch).

**Who decides:** Legal counsel familiar with India's crypto regulations. Reference: RBI circulars, FEMA guidelines, and any Crypto Bill developments.

---

### Open: Aiken vs Plutus V2 for smart contracts

**Question:** Should the escrow contract be written in Aiken (newer, easier syntax) or Plutus V2 (older, more ecosystem examples)?

**Decision:** Aiken is the selected approach. Rationale: Aiken compiles to the same UPLC as Plutus, has a built-in testing framework, significantly better developer experience for a small team, and the Aiken ecosystem has matured sufficiently for a straightforward payment escrow. Plutus V2 offers no meaningful advantage for this contract's scope.

**Status:** Decided.

---

### Open: In-app wallet vs WalletConnect for mobile

**Question:** For the React Native mobile app (Version 2.0), should the wallet be an in-app non-custodial wallet (keys stored in device secure keystore) or WalletConnect-based integration with external mobile wallets?

**Status:** Recommendation is WalletConnect first (lower regulatory risk, no key management responsibility), with in-app wallet as a secondary option for users without external wallets.

**Decision required by:** Before Milestone 4 development begins.

---

### Decided: Firebase vs custom WebSocket for chat

**Decision:** Firebase Realtime Database for all chat and real-time payment status.

**Rationale:** Firebase handles reconnection, offline queuing, and multi-device sync without custom infrastructure. A custom WebSocket server on Render's free tier would have connection limits and restart-related disconnection issues. Firebase's free tier is sufficient for the scale of Version 1.0.

---

### Decided: Monetary representation

**Decision:** All monetary values are stored as integers — INR amounts in paise (multiply face value by 100), ADA amounts in lovelace (multiply ADA by 1,000,000). No floating-point monetary values at the storage layer.

**Rationale:** Floating-point arithmetic on monetary values introduces rounding errors that compound across thousands of transactions. Integer arithmetic is exact.

---

## 24. Glossary

**ADA:** The native cryptocurrency of the Cardano blockchain. Divisible into 1,000,000 lovelace.

**Aiken:** A functional programming language for writing Cardano smart contracts, compiled to UPLC (Untyped Plutus Lambda Calculus). The language used for the ZeroPay escrow contract.

**Blockfrost:** A commercial API provider that indexes the Cardano blockchain and exposes a REST API for querying transaction status, block height, wallet balances, and more. The primary blockchain indexer for this application.

**BullMQ:** A Redis-backed job queue library for Node.js. Used for all asynchronous processing in ZeroPay: confirmation polling, receipt generation, and notification dispatch.

**CBOR:** Concise Binary Object Representation. The binary encoding format used for Cardano transaction data. Unsigned and signed transactions are exchanged between the backend and the browser wallet as CBOR hex strings.

**CID:** Content Identifier. The hash-based unique identifier for content stored on IPFS. A CID is derived from the content's cryptographic hash, making it tamper-proof — the CID changes if the content changes.

**CIP-30:** Cardano Improvement Proposal 30. The standard that defines how web applications communicate with Cardano browser wallet extensions. Wallet names supported: Eternl, Nami, Lace, Flint, Typhon, GeroWallet, and others.

**Counter Checkout Mode:** A specialized UI mode for merchants serving walk-in customers. The merchant enters an amount, a dynamic QR code is generated, and the customer scans it with any Cardano wallet to pay.

**Datum:** Data stored alongside a UTXO locked in a Cardano smart contract. The datum contains the parameters that the validator script uses to determine whether spending the UTXO is permitted.

**DID:** Decentralized Identifier. A self-sovereign identity standard. Atala PRISM is Cardano's DID system, used optionally for merchant identity verification.

**FCM:** Firebase Cloud Messaging. Google's push notification service, used to deliver real-time payment notifications to merchant and customer devices.

**INR:** Indian Rupee. The fiat currency reference for all merchant-facing pricing in ZeroPay.

**Invoice:** The core business entity representing a single payment request from a merchant to a customer. Contains the amount, description, status, and blockchain tracking data.

**IPFS:** InterPlanetary File System. A distributed storage protocol where content is addressed by its hash rather than by location. Used for storing permanent payment receipts.

**Koios:** A community-run Cardano blockchain indexer with no rate limits and no API key requirement. Used as the fallback when Blockfrost is unavailable.

**Lovelace:** The smallest unit of ADA. 1 ADA = 1,000,000 lovelace. All ADA amounts in the system are stored and processed as integers in lovelace to avoid floating-point arithmetic.

**MeshJS:** An open-source TypeScript SDK for Cardano development. Handles CIP-30 wallet connections, transaction building, CBOR encoding, UTXO selection, and fee calculation.

**Merchant:** A user of ZeroPay who has completed merchant onboarding and is configured to receive ADA payments. May also be a customer in other contexts.

**merchantId:** A short human-readable identifier assigned to a merchant during onboarding, in the format `MC-XXXX`. Used in QR codes and displayed to customers.

**Pinata:** A commercial IPFS pinning service. The free tier provides 1 GB of pinned content storage. Used for storing ZeroPay payment receipts on IPFS.

**Plutus:** The smart contract language ecosystem for Cardano. Aiken compiles to the same UPLC bytecode as Plutus V2 and V3.

**Preprod:** The Cardano pre-production testnet. Functionally identical to mainnet but uses worthless test ADA available from the Cardano faucet. All development and testing uses preprod.

**Rate Lock:** The practice of capturing the ADA/INR exchange rate at invoice creation time and using that rate for the lifetime of the invoice, regardless of subsequent market movements.

**Render:** A cloud hosting platform with a free tier that hosts the ZeroPay backend. The free tier spins down after 15 minutes of inactivity and is kept alive by UptimeRobot monitoring.

**Settled:** The terminal success state of an invoice lifecycle. Indicates that the payment has been confirmed on-chain with 3+ block confirmations, the merchant's stats have been updated, an IPFS receipt has been generated, and both parties have been notified.

**Upstash:** A serverless Redis provider. The free tier provides 10,000 commands per day. Used for price oracle caching, BullMQ job queue backing, and rate limiting counters.

**UptimeRobot:** A free website monitoring service. Configured to ping the Render backend every 10 minutes to prevent it from sleeping.

**UTXO:** Unspent Transaction Output. The fundamental unit of value in Cardano's accounting model. Unlike account-based blockchains (Ethereum), Cardano tracks individual UTXOs rather than account balances. Understanding UTXOs is required for correct transaction building but is abstracted away from end users by MeshJS.

**Validator Script:** The on-chain program (compiled Aiken code) that enforces the spending rules for a UTXO locked in the escrow contract.

**Vercel:** A frontend hosting platform. The ZeroPay React web app is hosted on Vercel's free Hobby plan, with automatic deployments on every GitHub push to `main`.

---

*ZeroPay — Product Requirements Document*
*Team Null Void · Cardano Hackathon Asia IBW 2025 → Production*
*Total monthly infrastructure cost to developer: ₹0*
*Blockchain transaction fees: paid by users from their own wallets*
*Document status: Living — update when product decisions change*