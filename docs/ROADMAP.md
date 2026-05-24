# ZeroPay — World-Class Platform Transformation Roadmap
## From Crypto Payment App → AI-Powered Programmable Trust Infrastructure

**Version:** 1.0 — Principal Architect Edition  
**Classification:** Strategic Internal Document  
**Scope:** Full Platform Evolution · 5-Year Horizon · Production-Grade

---

## Table of Contents

1. [Executive Vision](#1-executive-vision)
2. [Current System Analysis](#2-current-system-analysis)
3. [Product Evolution Strategy](#3-product-evolution-strategy)
4. [Full Feature Matrix](#4-full-feature-matrix)
5. [Technical Architecture — Complete Stack](#5-technical-architecture--complete-stack)
6. [React Native Migration Plan](#6-react-native-migration-plan)
7. [Smart Contract & Escrow Roadmap](#7-smart-contract--escrow-roadmap)
8. [AI Systems Architecture](#8-ai-systems-architecture)
9. [Realtime Communication Infrastructure](#9-realtime-communication-infrastructure)
10. [Fintech & Business Feature Roadmap](#10-fintech--business-feature-roadmap)
11. [Product Ecosystem — Beyond Payments](#11-product-ecosystem--beyond-payments)
12. [Scalability Architecture](#12-scalability-architecture)
13. [Security & Compliance Plan](#13-security--compliance-plan)
14. [UX/UI Design System](#14-uxui-design-system)
15. [Infrastructure & DevOps](#15-infrastructure--devops)
16. [Revenue & Business Model](#16-revenue--business-model)
17. [Competitive Positioning](#17-competitive-positioning)
18. [Execution Roadmap — Phase by Phase](#18-execution-roadmap--phase-by-phase)
19. [North Star Vision — 5 Years](#19-north-star-vision--5-years)

---

## 1. Executive Vision

### The Reframe

ZeroPay is not a payment app. It never was. What the current MVP accidentally built is the foundation of something far larger: a programmable trust layer for commerce.

Every meaningful commercial transaction between humans requires three things: a communication channel to negotiate, a trust mechanism to protect both parties, and a settlement mechanism to move value. Every major platform in history that captured a trillion-dollar market owned all three. Fiverr owns communication + trust + settlement for freelancers. Shopify owns storefront + commerce + settlement for merchants. Stripe owns the settlement layer and is now expanding into identity and fraud. PayPal owned trust + settlement before it lost the communication layer to competitors.

ZeroPay has the unique opportunity to own all three simultaneously — natively on a blockchain — with AI as the intelligence layer running across everything. The communication is the chat. The trust is the smart contract escrow. The settlement is Cardano. The intelligence is an AI system that watches every interaction, prevents fraud, resolves disputes, automates workflows, and makes every participant in the ecosystem smarter and safer.

The framing that guides every decision in this roadmap: **ZeroPay is the operating system for trust-based commerce.** Not a wallet. Not a chat app. Not a payment processor. An OS for trust.

### What "AI-Powered Programmable Trust Infrastructure" Means Concretely

Programmable trust means a customer can pay a freelancer with rules attached: funds release when the deliverable is approved, funds freeze if a dispute is raised, funds partially release at each milestone, funds automatically refund if a deadline passes. These rules are not enforced by ZeroPay's team or customer service — they are enforced by smart contracts that neither party can override.

AI-powered means ZeroPay's intelligence layer watches patterns across all transactions, chats, and commerce activity. It detects fraud before a payment is made. It scores the risk of every transaction in real time. It resolves disputes by analyzing conversation history, delivery evidence, and contract terms. It suggests invoice amounts, identifies business trends, automates tax categorization, and speaks to users in their native language.

Infrastructure means other developers and businesses can build on top of ZeroPay. Merchants can integrate ZeroPay payment into their own websites via an API. Enterprises can use ZeroPay's escrow engine for their own vendor payment workflows. Developers can deploy custom smart contract logic on top of ZeroPay's settlement layer.

### The Five-Year Destination

ZeroPay in 2030 is a platform that: 10 million merchants across South Asia and Southeast Asia use as their primary commerce operating system, 50 million customers use to pay for goods, services, and digital products with or without cryptocurrency, 100,000 freelancers use to manage client contracts and get paid on milestone completion, and a growing developer ecosystem builds specialized vertical applications on top of, paying ZeroPay API fees for trust and settlement infrastructure.

---

## 2. Current System Analysis

### Strengths — What Was Built Right

**The architectural instincts are correct.** The decision to separate concerns into distinct layers — Firebase for realtime, MongoDB for persistence, Redis for ephemeral state, Blockfrost for blockchain reads — reflects mature engineering thinking. This is not a monolithic mess. It is a service-oriented foundation that can be evolved.

**The Cardano bet is defensible.** Choosing Cardano over Ethereum or Solana is a strategic decision with real advantages: transaction fees measured in fractions of a dollar rather than dollars, a formal verification approach to smart contracts, a growing DeFi ecosystem, and institutional credibility (IOG, academic partnerships, government-level blockchain programs in Ethiopia and beyond). For a trust-and-settlement platform targeting emerging markets, Cardano's fee structure is not just cost-effective — it is the difference between a viable product and an unusable one.

**The chat-native payment concept is the right UX paradigm.** Most blockchain payment flows are terrible because they force users to leave their context (a conversation, a marketplace listing, a service agreement) and navigate to a separate payment interface. Embedding payment directly into the conversation thread is the correct approach. WhatsApp Pay has validated this model. ZeroPay should own it for Web3.

**Firebase Realtime Database for chat is pragmatically correct at MVP scale.** Not the ultimate architecture, but the right choice for a team moving fast with free infrastructure. The migration path to a more scalable realtime infrastructure is straightforward and non-destructive.

**IPFS receipts are genuinely novel.** No mainstream payment application provides tamper-proof, permanently verifiable, blockchain-anchored receipts. This is a real product differentiator that has not been marketed or positioned correctly yet.

### Weaknesses — What Must Be Fixed

**The product has no identity.** "A crypto payment app with chat" is not a product category. It does not answer "why would a merchant in Pune use this instead of UPI?" The product needs a clear, compelling answer to that question before it acquires real users. The answer exists — trustless escrow, AI-powered dispute resolution, cross-border payments, programmable contract terms — but it is not reflected in the current product or its positioning.

**The smart contract layer is missing.** Without Aiken escrow contracts, ZeroPay's "blockchain" value proposition is essentially "ADA transfers with a nice UI." Anyone with an Eternl wallet and a phone number can do that without ZeroPay. The smart contract layer is what makes ZeroPay irreplaceable.

**There is no AI anywhere.** A product positioning itself as an "AI-powered" platform has no AI in it yet. This gap must close in Phase 2 — not Phase 5.

**The mobile experience is secondary.** The current product is a Vite web app. The target users — street vendors, freelancers, small merchants — are on mobile. A web app that requires browser extensions for wallet connection is fundamentally broken for the primary use case. React Native is not optional.

**There is no merchant acquisition loop.** The product has no viral mechanism, no referral system, no reason for a merchant to tell another merchant about ZeroPay. Without a loop, user acquisition is purely paid (expensive) or word-of-mouth (slow).

**The revenue model is absent.** The current architecture has no mechanism to generate revenue. A payment platform with zero revenue model is not a product — it is a feature waiting to be acquired by someone else.

**Technical debt risks:** The Render free tier sleep behavior is a production risk for any payment-critical workflow. Storing Firebase service account JSON as a base64 environment variable is an operational anti-pattern that must be replaced by a proper secrets management system before scale. The lack of database migrations means schema changes are manual and error-prone.

### Architecture Gaps

**No event bus.** The current architecture processes events synchronously or through BullMQ in isolation. There is no central event streaming system that allows different parts of the platform to react to the same events. When a payment is confirmed, the invoice service, the notification service, the analytics service, the receipt service, and the AI system all need to know — but in the current architecture, each one is explicitly called in sequence by the job worker. An event bus (Kafka, Redis Streams, or equivalent) would let each service independently subscribe to the confirmation event, making the system extensible without modifying existing services.

**No API versioning.** The backend exposes unversioned routes. When the mobile app needs a different response shape than the web app, or when a partner integration needs a stable API contract, the lack of versioning creates breaking changes. All routes should be versioned from day one.

**No multi-tenancy.** Every data model assumes a single user base. When ZeroPay adds enterprise clients or builds a developer API, the lack of multi-tenancy at the data layer requires a complete schema redesign. Tenant isolation should be introduced now while the data volume is manageable.

**No observability beyond Sentry.** Error tracking is not observability. The platform needs distributed tracing (to understand why a payment took 30 seconds instead of 5), metrics (to see how many payments are in-flight at any moment), and structured logging (to search across all services when debugging a specific transaction).

### Scalability Gaps

At 100 active payments simultaneously, the current Blockfrost free tier (50,000 requests/day) runs into polling constraints. At 1,000 simultaneous payments, the single Node.js process on Render becomes a bottleneck. At 10,000 simultaneous payments, the MongoDB M0 free tier (512MB) is exhausted. Every layer has a known scaling ceiling, and none of them are high. The scaling strategy must be designed now, even if the infrastructure is not upgraded until the user numbers demand it.

---

## 3. Product Evolution Strategy

### Stage 1 — MVP to Startup (Months 1–6)

**The goal of Stage 1:** Prove that a real merchant will use ZeroPay instead of UPI for at least one category of transaction. The target category is freelancer payments and service agreements — not street vendor payments. Street vendors have UPI. Freelancers doing cross-border work do not have a good option.

**The target user:** An Indian freelance developer, designer, or content creator working with international clients. They get paid in ADA or stablecoin (no UPI for foreign payments), they need escrow to protect against non-payment, they want automatic milestone-based releases, and they need professional invoices and receipts. This user has a high willingness to try new products and a clear, painful problem that ZeroPay solves.

**Stage 1 deliverables:** Aiken escrow contracts live on mainnet, milestone-based payment contracts working end-to-end, a React Native app on Android, an AI invoice generator that creates professional invoices from a description, a referral system (freelancer refers another freelancer, both get reduced fees), and a verified merchant badge system.

**Stage 1 success metrics:** 500 real transactions on mainnet, 100 active freelancers, 50 active merchants, NPS above 50, at least one transaction above ₹10,000.

### Stage 2 — Startup to Scale-up (Months 6–18)

**The goal of Stage 2:** Expand from the freelancer niche into merchant commerce. Add the features that make ZeroPay a complete commerce operating system rather than a payment tool. At this stage, ZeroPay begins charging transaction fees and subscription plans.

**Stage 2 deliverables:** AI fraud detection live and blocking fraudulent transactions, merchant storefront pages (mini-websites for merchants), digital product delivery (freelancers sell templates, designers sell UI kits, developers sell code libraries), subscription billing for recurring services, a developer API for third-party integrations, iOS app on TestFlight, dispute resolution with AI arbitration, and UPI integration (fiat payments alongside crypto), stablecoin support.

**Stage 2 success metrics:** 10,000 active merchants, ₹1 crore in monthly transaction volume, ₹10 lakh monthly recurring revenue from subscriptions and fees, 50 developer API integrations, one enterprise partnership.

### Stage 3 — Scale-up to Platform (Months 18–36)

**The goal of Stage 3:** Open ZeroPay's infrastructure to the world. Transform from a consumer product that happens to have an API into a platform that consumer products are built on top of. Think: Stripe's trajectory from PayPal competitor to infrastructure layer for the internet economy.

**Stage 3 deliverables:** ZeroPay SDK published (JavaScript, Python, Swift, Kotlin), developer portal with documentation and sandbox, white-label escrow engine for enterprises, a marketplace where developers sell ZeroPay-powered applications, multi-chain settlement (Cardano + stablecoin bridging), on-chain reputation system using NFT-based credentials, a creator economy vertical (content creators monetize directly through ZeroPay), and a ZeroPay Visa debit card (ADA balance spendable anywhere Visa is accepted via a fintech banking partner).

**Stage 3 success metrics:** 1 million active users, ₹100 crore monthly transaction volume, 1,000 API developers, 10 enterprise clients, ₹1 crore monthly revenue.

### Stage 4 — Platform to Ecosystem (Months 36–60)

ZeroPay becomes infrastructure. Third parties build vertical applications (ZeroPay for real estate escrow, ZeroPay for gig economy workers, ZeroPay for creator subscriptions) on top of the smart contract and settlement engine. ZeroPay does not build these verticals — it provides the programmable trust rails and takes a protocol-level fee.

---

## 4. Full Feature Matrix

### Merchant Features

**Commerce Operations:** Storefront mini-website with custom domain or ZeroPay subdomain, product and service catalog with digital and physical offerings, dynamic QR payment generation per product, invoice generation with AI-powered line item suggestions, recurring invoice scheduling, bulk invoice creation for enterprise clients, multi-currency pricing display with auto-conversion, tax calculation and GST invoice generation, payment link generation for social media and email campaigns, checkout embed widget for third-party websites.

**Business Intelligence:** Revenue dashboard with daily, weekly, monthly, and custom date range views, average transaction value trends, customer lifetime value calculations, repeat customer identification, peak hours and days analysis, product-level revenue breakdown, AI-generated business insights ("Your Tuesday sales are 40% higher than other days — consider a Tuesday promotion"), cash flow forecasting, competitor pricing intelligence (in later stages), export to CSV/Excel/Tally-compatible formats.

**Customer Relationship Management:** Customer contact list with transaction history, customer notes and tags, custom customer segments, automated follow-up messages post-purchase, loyalty points configuration and management, referral tracking for customers who bring other customers, blacklist management for problematic customers, bulk messaging to customer segments.

**Team and Operations:** Multi-user merchant accounts with role-based permissions (owner, cashier, accountant, viewer), audit logs of all account actions, shift management for staff, expense tracking alongside revenue, inventory management basics, vendor payment outgoing via ZeroPay escrow, payroll scheduling for small teams.

### Customer Features

**Payment and Wallet:** Connect any CIP-30 browser wallet, in-app non-custodial wallet for mobile users, ADA balance display with INR equivalent, complete transaction history, IPFS receipt access for every purchase, payment scheduling for future-dated transfers, split payment with other users (group payments), saved merchants and favorites list, payment limits configuration for self-protection.

**Commerce and Discovery:** Merchant discovery by category, location, and reputation score, saved carts for multi-item purchases, order tracking for physical goods, digital product library (purchased templates, files, licenses), subscription management and upcoming billing preview, review and rating submission post-purchase, dispute initiation with evidence upload, refund tracking and status.

**Identity and Reputation:** ZeroPay verified badge after ID verification, decentralized identity credential (DID) linked to wallet, on-chain reputation score visible to merchants, trust level displayed during checkout, privacy controls for what is visible to whom.

### AI Features

**ZeroPay Copilot — the AI layer running across everything:**

*For merchants:* Invoice description to full structured invoice with line items and GST calculation. Business performance analysis from natural language questions ("Why did my revenue drop last week?"). Smart pricing suggestions based on market data and transaction history. Customer churn prediction ("These 20 customers haven't purchased in 45 days"). Automated response suggestions for chat messages. Inventory reorder suggestions. Tax liability estimations.

*For customers:* Smart dispute filing assistant that guides the customer through evidence collection and submission. Purchase recommendation based on history. Fraud warning when a merchant's behavior matches known fraud patterns. Budget tracking and spending insights.

*For the platform:* Real-time fraud detection scoring every transaction before it is submitted to the blockchain. Dispute resolution — AI analyzes conversation history, contract terms, delivery evidence, and recommends a resolution. Trust score computation — a continuously updated score for every merchant and customer based on behavioral signals. Content moderation for chat messages and merchant listings. Anomaly detection for unusual transaction patterns.

*AI Agents — autonomous systems:* Merchant Onboarding Agent guides new merchants through setup with conversational prompts, answering questions and filling forms on their behalf. Support Agent handles tier-1 customer support (FAQs, status checks, refund status) without human involvement. Commerce Agent for merchants — watches for abandoned payment requests and automatically sends a reminder, identifies upsell opportunities, drafts promotional messages. Invoice Agent — learns a merchant's pricing patterns and pre-fills invoices so the merchant only confirms rather than types.

### Blockchain Features

**Escrow System:** Single-payment escrow (funds locked, merchant releases on delivery confirmation or customer approves release), milestone-based escrow (multi-stage release as work progresses), time-locked escrow (funds automatically release after a date if no dispute is raised), dispute-frozen escrow (funds held pending AI or human arbitration decision), partial release (release percentage of locked funds at each milestone), multi-party escrow (multiple customers fund a shared project), subscription escrow (recurring locked amounts with automated periodic release).

**On-Chain Identity and Reputation:** NFT-based achievement badges (first transaction, 100 transactions, top merchant), verifiable credential certificates (identity verified, business verified, professional verified), on-chain transaction count and volume attestation, stake-based trust (ADA staked as reputation collateral), Atala PRISM DID integration for full decentralized identity.

**Advanced Blockchain Infrastructure:** Reference script optimization for gas efficiency, multi-wallet output transactions (one transaction pays multiple recipients), transaction batching for merchant payouts, Cardano Native Asset support (payments in tokens beyond ADA), future stablecoin support via iUSD and Djed, cross-chain bridge preparation (Cardano ↔ Ethereum bridge monitoring), on-chain voting for platform governance decisions.

### Commerce Features

**Storefront System:** Merchant profile page with bio, categories, portfolio, and reviews, custom slug URL (zeropay.in/madhavan-chai), portfolio showcase for freelancers, service packages with tiered pricing, digital product store with automatic file delivery on payment confirmation, physical product listings with basic inventory, promotional banners and announcements, embedded ZeroPay checkout widget.

**Marketplace Layer (Stage 3):** Category-based merchant discovery, search with filters (category, rating, price range, location, verification status), featured merchant placements, trending services surfacing, ZeroPay's own curated collections (Top Designers on ZeroPay, Verified Web Developers), affiliate link tracking, referral commission management.

**Creator Economy Tools:** Subscription tier creation (Basic/Pro/Premium with different benefits), one-time digital product sales, tip/support payments (a customer pays a merchant without a specific invoice), content unlock on payment, pay-what-you-want pricing, bundle deals, limited-time offers with countdown timers.

### Fintech Features

**Currency and Payments:** ADA payments (live from day one), iUSD/Djed stablecoin payments (Stage 2), UPI fiat on-ramp (customer pays in INR via UPI, ZeroPay converts to ADA on the backend — Stage 2), fiat off-ramp for merchants (convert ADA to INR and receive via bank transfer — Stage 2), multi-currency pricing (list in INR, USD, EUR, settle in ADA), split bill payments, recurring subscriptions.

**Financial Tools:** Treasury management view for merchants holding significant ADA, payroll scheduling, vendor payment management, tax report generation (GST-compliant for India), accounting export (CSV, Tally-compatible), expense categorization, P&L statements, invoiced-vs-received reconciliation.

**Compliance Infrastructure:** KYC levels (Level 0: phone OTP, Level 1: Aadhaar/PAN, Level 2: video verification), AML transaction monitoring, suspicious pattern flagging, regulatory reporting tools, GDPR/PDPB data handling, RBI virtual asset regulations compliance roadmap.

---

## 5. Technical Architecture — Complete Stack

### Frontend Architecture

**Primary consumer product: React Native (Expo managed workflow)**

The mobile app is the product. Everything else is secondary. The React Native codebase is organized as a monorepo alongside the web app and backend, but it is the primary engineering investment. All new features are designed mobile-first and then adapted for web, never the reverse.

The mobile app uses Expo SDK with Expo Router for file-based navigation (the React Native equivalent of Next.js routing). Expo provides the build infrastructure, over-the-air update capability (critical for pushing bug fixes without app store re-review), and a managed environment that handles native module linking automatically.

The state management architecture uses Zustand for global state (user session, wallet connection, merchant profile) because it is lightweight and avoids the boilerplate of Redux. React Query (TanStack Query) manages all server state — API calls, caching, background refetching, and optimistic updates. These two libraries cover every state management need without requiring a custom solution.

The web app (React + Vite) continues to exist but pivots to three use cases: the merchant admin dashboard (complex analytics and settings that are better suited to large screens), the developer portal (API documentation and sandbox), and the public marketing site. The web app is not where customers or merchants do their daily work — the mobile app is.

**Web app framework evolution:** The Vite-based React app continues as-is for the web. When complexity grows to warrant it (likely at Stage 2), the marketing site and public pages migrate to Next.js for server-side rendering and SEO, while the dashboard remains as the Vite SPA.

**Design system:** A single shared component library (`@zeropay/ui`) exports components that work across both the web app and React Native using platform-specific file extensions (`.web.tsx` for web-specific rendering, `.native.tsx` for React Native, shared logic in `.tsx`). Tokens (colors, typography, spacing) are defined once and consumed by both platforms.

### Backend Architecture

**Current:** Monolith Node.js + Express on Render free tier.
**Evolution:** Service-oriented monolith → domain-separated services → full microservices as traffic demands.

The backend evolves in three distinct phases:

**Phase 1 (current to Stage 1):** Refactor the existing monolith into a domain-organized monolith. Group routes and services by domain (auth, users, merchants, invoices, payments, blockchain, notifications, analytics, ai). Each domain is a module with its own router, service layer, and repository layer. The process remains a single Node.js application but the internal structure prevents domains from bleeding into each other. This is the strangler-fig pattern applied internally — it makes future extraction into separate services possible without a rewrite.

**Phase 2 (Stage 2):** Extract the two highest-load domains into separate services: the Blockchain Service (all Cardano interactions, indexer polling, transaction building) and the AI Service (all inference calls, fraud scoring, embeddings). These are extracted because they have fundamentally different scaling profiles: the blockchain service is IO-bound and horizontally scalable, the AI service is GPU-bound and needs different hardware. All other domains remain in the main service.

**Phase 3 (Stage 3):** Full microservices with an API gateway (Kong or custom Express gateway). Each domain becomes a service: Auth Service, User Service, Merchant Service, Invoice Service, Payment Service, Escrow Service, Notification Service, Chat Service, Analytics Service, AI Service, Blockchain Service, Storage Service. Services communicate via the event bus (Redis Streams in Phase 2, Kafka in Phase 3) and direct gRPC for synchronous inter-service calls where needed.

**API Gateway:** All client requests hit a single gateway endpoint. The gateway handles: authentication token verification, rate limiting, request routing to the correct service, response caching for public endpoints, API versioning enforcement, and request logging. In Stage 1, the gateway is a thin Express middleware layer. In Stage 3, it is Kong or a custom service with plugin architecture.

**API versioning strategy:** Every route is prefixed with `/api/v1/`. When a breaking change is needed, `/api/v2/` routes are added alongside the existing v1 routes. Old versions are deprecated with advance notice (minimum 6 months) and sunset after migration is complete. The mobile app always targets the latest stable version. Third-party developers can target whichever version they need.

### Realtime Layer Architecture

**Current:** Firebase Realtime Database for chat, no WebSocket infrastructure.
**Evolution:** Dual realtime infrastructure with domain-appropriate tools.

Firebase Realtime Database is retained for: chat messages (it handles offline queuing and reconnection elegantly), presence indicators (online/offline status), payment status real-time updates (the invoice status path), and push notification delivery via FCM.

A Socket.IO server is added for: high-frequency events that need server-to-client push (live payment dashboards, analytics updates, fraud alerts), typing indicators (these need to disappear after a timeout, which Firebase doesn't handle gracefully), voice call signaling, and events that need strict delivery guarantees with acknowledgement.

The architecture separates these concerns clearly: chat belongs to Firebase, everything else that requires real-time server-push belongs to Socket.IO. This avoids the temptation to misuse Firebase as a general event bus and keeps each system doing what it does best.

For the mobile app, the Socket.IO connection is managed by a background service that persists across navigation. The Firebase SDK handles reconnection automatically. Both connections use exponential backoff when the network is unavailable, and queue events locally to replay when connectivity is restored.

### Blockchain Layer Architecture

**Current:** Blockfrost reads, MeshJS transaction building, BullMQ confirmation polling.
**Evolution:** Full programmable settlement engine.

The blockchain layer evolves into a dedicated Escrow Engine — the most important new system in the entire roadmap. The Escrow Engine is a state machine that manages the lifecycle of every locked payment from creation through final settlement or refund.

The Escrow Engine has five components: the Contract Registry (maps invoice types to Aiken script addresses and reference script UTXOs), the Transaction Builder (constructs unsigned CBOR transactions for escrow lock, collect, dispute freeze, and refund operations), the State Machine (tracks every escrow through its states: locked → confirming → active → completing → settled or disputed or refunded), the Polling Service (watches for on-chain state changes using Blockfrost primary and Koios fallback), and the Settlement Processor (executes final payout computations, deducts platform fees, and triggers post-settlement actions).

The Indexer Strategy uses an event-driven approach: instead of polling every 20 seconds for every active transaction, the system registers Blockfrost webhook subscriptions (available on their paid tier — free equivalent is Koios websocket support) to receive push notifications when monitored addresses receive transactions. This reduces API calls by 95% compared to polling and enables near-instant confirmation detection.

### AI Layer Architecture

The AI layer is an independent service with its own infrastructure. It communicates with the main backend via an internal API and the event bus. External clients never call the AI service directly — they go through the main API gateway, which proxies AI-related requests.

**Inference:** Primary inference uses the Anthropic API (Claude models) for complex reasoning tasks: dispute resolution analysis, business insight generation, contract term generation, and conversational copilot. For high-frequency, low-complexity tasks (fraud scoring, intent classification, spam detection), a smaller fine-tuned model runs locally or via a cheaper inference endpoint to reduce API costs.

**Embeddings and vector storage:** Every merchant description, product listing, customer review, and chat message (with privacy controls) is embedded using a text embedding model and stored in a vector database. The vector database enables: semantic search (find merchants similar to a description even if the exact words don't match), RAG (Retrieval-Augmented Generation) for the AI copilot (the AI looks up relevant context before answering), and anomaly detection (transactions that are semantically unusual compared to a merchant's history).

**Event-driven AI workflows:** The AI service subscribes to events from the event bus. When a dispute is raised, the AI service automatically pulls the full conversation history, the contract terms, the invoice details, and the delivery evidence, runs analysis, and prepares a recommendation within 60 seconds. When a new merchant onboards, the AI agent sends a personalized welcome with setup tips. When a merchant's revenue drops 30% week-over-week, the AI generates a specific analysis and recommendation.

**Trust and Fraud Scoring:** Every transaction receives a risk score (0-100) computed before the payment is submitted to the blockchain. The score considers: account age, verification level, transaction history, amount relative to typical, recipient reputation, chat content signals, time of day patterns, device fingerprint, and IP geolocation. Transactions above a risk threshold require additional verification (biometric confirmation, OTP, manual review). The scoring model improves continuously as new fraud patterns are detected and labeled.

### Infrastructure Layer

**Current:** Render (backend), Vercel (web), MongoDB Atlas M0, Upstash Redis, Firebase Spark, Blockfrost free.
**Evolution:** Tiered infrastructure with clear upgrade triggers.

The infrastructure is managed as code from day one using Terraform (even for free-tier resources), so the transition from free to paid tiers requires changing a number, not rewriting configuration files. Each service has a defined upgrade trigger — a measurable threshold that, when hit, triggers an infrastructure upgrade.

Database upgrade trigger: MongoDB Atlas M0 → M2 ($9/month) when storage exceeds 400MB or query latency exceeds 100ms for dashboard queries. Backend hosting trigger: Render free → Render Starter ($7/month) when the cold-start problem materially impacts more than 5% of user sessions, as measured by Sentry. Redis trigger: Upstash free → Upstash Pay-As-You-Go when daily command count exceeds 8,000 (leaving 20% buffer below the 10,000 limit).

---

## 6. React Native Migration Plan

### The Strategic Context

The React Native migration is not a rewrite — it is a new product built alongside the existing web app, sharing maximum code through the monorepo structure. The web app continues to work and is actively maintained during the migration. Users are not forced to switch until the mobile app is demonstrably better for their primary use cases.

The migration follows the principle of user-following: build mobile first for the features new users will experience, while existing web users continue using the web version until the mobile app reaches feature parity. This avoids the "migration" narrative entirely — ZeroPay simply launches a world-class mobile app, and users naturally gravitate to it.

### Monorepo Structure for Code Sharing

The monorepo is organized to maximize shared code while allowing platform-specific implementations where necessary. Shared packages include: the API client (identical HTTP calls work from web and mobile), TypeScript type definitions, business logic utilities (date formatting, currency conversion, address validation), Zustand store definitions, and React Query query functions. Platform-specific code is isolated in the web and mobile app directories and uses the platform-specific file extension pattern to keep the shared code clean.

The design token system defines colors, typography, and spacing as plain JavaScript/TypeScript objects rather than CSS variables, so they are consumable by both React (CSS-in-JS or Tailwind) and React Native (StyleSheet). The token values are the single source of truth — changing the primary brand color happens in one place and propagates to both platforms immediately.

### Navigation Architecture

The mobile app uses Expo Router, which provides file-based routing on top of React Navigation. This is the recommended navigation approach for new Expo projects and provides automatic deep linking, type-safe routes, and layout-based navigation groups.

The top-level navigation has five tabs: Home (feed of recent activity, quick actions), Pay (the payment initiation flow — scan QR, send money, request money), Chat (list of conversations with merchants and customers), Commerce (merchant storefront, product catalog, orders), and Profile (account settings, wallet management, verification, analytics).

Each tab contains its own stack navigator for drill-down screens. Modal screens (the payment confirmation flow, the invoice creation form, the dispute filing flow) appear as full-screen modals over the current tab content, so the user's navigation context is preserved.

The merchant dashboard lives in the Commerce tab with a context switch — the user taps a "Merchant View" toggle in the tab header to switch between their customer-facing and merchant-facing view. This super-app pattern (where the same app serves both roles based on a mode switch) is used by Grab, Rapido, and other successful Asian super-apps. It eliminates the need for two separate apps while keeping each role's interface clean.

### Native Wallet Integration Strategy

On mobile, browser extension wallets do not exist. The wallet integration strategy for mobile uses two parallel approaches:

**Approach A — WalletConnect Protocol (CIP-62):** The ZeroPay mobile app acts as a WalletConnect dApp. Users who have a Cardano mobile wallet (Eternl Mobile, Nami Mobile) can connect it via WalletConnect. The user taps "Connect Wallet," a QR code or deep link opens their Cardano mobile wallet, they approve the ZeroPay connection, and return to the app. Subsequent transaction signing pops an approval prompt in the Cardano wallet app. This approach requires no private key handling on ZeroPay's side and supports every WalletConnect-compatible Cardano wallet.

**Approach B — ZeroPay In-App Wallet (Non-Custodial):** For users who do not have a separate Cardano wallet app, ZeroPay generates a Cardano key pair on-device using MeshJS's wallet utilities. The private key is encrypted with the user's 6-digit PIN using AES-256 encryption, and the encrypted blob is stored in Expo SecureStore (backed by Android Keystore on Android and Secure Enclave on iOS). The seed phrase is displayed once during setup — ZeroPay does not store or have access to it. This is a fully non-custodial in-app wallet.

Approach B is the default for Indian users (who are unlikely to have a separate Cardano wallet), and Approach A is available for crypto-native users who prefer to manage their own wallet externally. Both approaches present the same ZeroPay interface — the wallet type is abstracted behind a `WalletProvider` context that implements identical sign and submit methods regardless of which wallet type is active.

### Push Notifications Architecture

The push notification system on mobile uses Expo Notifications (which wraps APNs for iOS and FCM for Android) for the delivery layer, Firebase Cloud Messaging for the notification routing server, and the ZeroPay backend Notification Service as the dispatch system.

Notifications are categorized into three priority levels: Critical (payment confirmed, dispute raised, fraud alert — always delivered with sound even if the app is in foreground), Important (payment request received, invoice expiring, new chat message — delivered with sound when the app is in background), and Informational (business insights, promotional messages — silent badges only, never interrupt the user).

On Android, notification channels are configured at install time: a Critical channel (bypasses Do Not Disturb), an Important channel (respects Do Not Disturb), and an Informational channel (silent). Users can independently control each channel in Android system settings. This is required behavior for Android 8.0+ and is a significant UX improvement over apps that use a single notification channel.

Notification deep linking is handled by Expo Router's automatic deep link handling. Every notification carries a `screen` field that maps to a route in the app. Tapping the notification opens the app directly to the relevant screen (the specific chat room, the invoice in question, the dispute details).

### Secure Mobile Storage Strategy

The security model for mobile storage uses three distinct storage tiers based on sensitivity:

**Tier 1 — Expo SecureStore:** For the most sensitive data. The encrypted private key blob, the user's session token, and biometric authentication credentials. SecureStore is backed by the device's hardware security module (Android Keystore, iOS Secure Enclave). Data is not accessible to other apps and is wiped on factory reset.

**Tier 2 — Encrypted AsyncStorage:** For sensitive but not cryptographically critical data. The user's profile cache, wallet address, merchant details, and recent transaction summaries. Encrypted using a key derived from the SecureStore-stored session token, so data is protected but accessible without requiring biometric re-authentication on every app open.

**Tier 3 — Unencrypted AsyncStorage / MMKV:** For non-sensitive data that needs fast access. UI preferences, onboarding completion flags, draft invoice data, notification preferences. MMKV (a fast key-value store by WeChat) is used instead of AsyncStorage for performance-critical storage because it is 10-30x faster for read-heavy access patterns.

### Offline-First Architecture

ZeroPay targets users on Indian mobile networks, where 4G connectivity can be intermittent. The app must degrade gracefully when offline rather than showing error screens.

The offline strategy uses React Query's persistence plugin to write cached API responses to Encrypted AsyncStorage. When the user opens the app without network connectivity, React Query serves the cached responses immediately, and the UI renders with a "last updated at [time]" indicator. Actions that require network (initiating a payment, creating an invoice) show a clear "You're offline — this action requires internet" message rather than silently failing.

Chat messages typed while offline are queued in a local draft store and sent automatically when connectivity is restored. The Firebase SDK's built-in offline persistence handles the Firebase chat message queue automatically.

The QR code scanner works completely offline — it reads QR codes from the camera without any network call. The merchant's public profile is cached from their last visit, so a repeat customer can see the merchant's storefront and generate an invoice even without connectivity, though the actual payment submission requires network.

### Background Workers on Mobile

Mobile background processing is severely limited by iOS and Android power management. ZeroPay uses Expo Background Fetch for periodic background tasks: refreshing the ADA/INR exchange rate every 15 minutes (when the app is in background), checking for unread notifications that may have been missed, and syncing the local transaction cache with the server.

For tasks that must run while the app is not active (completing a payment confirmation that is in-flight when the user navigates away), ZeroPay uses Expo TaskManager to register a background task that runs for up to 30 seconds when the app transitions to background. If the confirmation is not complete in 30 seconds, a push notification is sent when the job queue worker on the server confirms the transaction.

### Biometric Authentication

Biometric authentication is implemented using Expo LocalAuthentication. It is used in three contexts: app unlock (optionally replacing the PIN for app access), high-value transaction approval (any transaction above a configurable threshold requires biometric confirmation before the wallet signs), and settings access (changing payment address, viewing seed phrase).

The biometric authentication is always a second factor on top of the session, never a replacement for it. The user's session is established once (Firebase Auth + JWT), and biometric confirmation is used for in-session sensitive actions without requiring re-login.

### APK Release Pipeline

The Android APK release pipeline is fully automated via GitHub Actions using Expo EAS Build. The pipeline has three channels: development (builds on every push to a feature branch, distributed via internal test link), staging (builds on every merge to main, distributed to a fixed list of beta testers via EAS internal distribution), and production (triggered manually after staging sign-off, published to Google Play Store).

Each build channel has its own `.env` configuration: development targets the Cardano preprod testnet, staging targets a separate staging Cardano preprod environment (isolated from the development environment), and production targets Cardano mainnet.

Over-the-air (OTA) updates via Expo Updates are used for all non-native changes (JavaScript, TypeScript, assets, styling). This means bug fixes can be pushed to all users within minutes without requiring them to update from the Play Store. Only changes that affect native code (adding a new native module, changing Expo SDK version) require a full app store build and release.

---

## 7. Smart Contract & Escrow Roadmap

### The Architecture Philosophy

The smart contract layer is the most technically irreversible part of ZeroPay's architecture. A bug in a database schema can be fixed with a migration. A bug in a deployed smart contract may lock real users' real ADA permanently. Every contract decision must be made with extreme care, and every contract must have a proven escape hatch for edge cases.

The design principle for all ZeroPay contracts is: **the contract enforces the rules, but humans (or AI arbitrators) decide on exceptions**. No contract should be so rigid that a clearly correct resolution (a customer is defrauded, a merchant delivers perfect work) cannot be executed because the contract's binary conditions weren't met.

### Contract Version 1 — Simple Escrow (Launch)

The first version of the ZeroPay escrow contract handles the simplest and most common use case: a customer locks funds for a merchant, the merchant delivers, the customer confirms, and the funds release.

The contract holds a datum containing: the invoice ID, the customer's public key hash, the merchant's public key hash, the locked lovelace amount, the ZeroPay platform fee amount, the invoice expiry timestamp, and a dispute window duration (the time after merchant claims delivery during which the customer can raise a dispute).

The contract has four spending paths: Customer Release (customer approves delivery and signs the release transaction), Auto-Release (after the dispute window expires without a dispute being raised, any signed transaction can release to the merchant — enforced by the time condition in the contract), Customer Refund (after the invoice expiry, the customer can reclaim their funds if the merchant never claimed delivery), and Admin Resolution (a 2-of-3 multisig between the customer, the merchant, and ZeroPay's platform key can resolve any dispute — this is the emergency exit that prevents funds from being locked forever).

The Admin Resolution path is important: it means ZeroPay's platform has the technical ability to resolve disputes on-chain, but only with the signature of one of the two parties. A unilateral ZeroPay resolution without either party's signature is not possible. This maintains trustlessness while preventing permanent fund loss.

### Contract Version 2 — Milestone Escrow (Stage 1)

The milestone escrow contract allows a project to be broken into stages, with each stage having a separate fund lock and release condition. A freelancer building a website might have four milestones: design approval (25%), development start (25%), development complete (25%), and final delivery (25%).

The contract holds a list of milestone datums, each with an amount, a description hash (the hash of the agreed milestone specification document, stored on IPFS), and a completion state. The merchant can claim each milestone when it is due by proving they hold the private key corresponding to the merchant public key hash. The customer can dispute any individual milestone without blocking the others.

This contract structure requires careful Aiken engineering because list operations in UPLC are expensive. The milestone list is bounded at 10 items to keep transaction fees reasonable.

### Contract Version 3 — Dispute Escrow (Stage 2)

Dispute escrow adds a freeze mechanism. When a dispute is raised, the contract transitions to a frozen state where neither party can withdraw or refund. The only way to exit the frozen state is through an Admin Resolution multisig transaction.

The ZeroPay AI arbitration system is the first-line dispute resolver. It examines the conversation history, the contract terms, the delivery evidence, and the customer's dispute statement, then generates a resolution recommendation (refund X%, release Y% to merchant). The ZeroPay human team reviews the AI recommendation for disputes above a certain value. Below the threshold, the AI recommendation is automatically executed via the Admin Resolution path.

The AI arbitration system is trained on historical dispute outcomes (anonymized) to improve its recommendations over time. The system tracks its own accuracy — when human reviewers override its recommendation, those cases are flagged for model improvement.

### Contract Version 4 — Programmable Escrow (Stage 3)

By Stage 3, ZeroPay's smart contract layer opens to third-party developers. Developers can define custom escrow logic using ZeroPay's Contract SDK — a TypeScript library that generates Aiken source code from high-level rule definitions. This is the platform play: ZeroPay provides the trust infrastructure, developers build the applications.

Custom logic examples: a gig economy platform where funds release only when an Uber-style ride completion event is received from an oracle, a freelancer platform where funds release only when a GitHub commit is made to a specific repository (verified via oracle), a real estate escrow where funds release only after a legal document is cryptographically signed by both parties.

### Fee Architecture On-Chain

ZeroPay's platform fee is deducted at the contract level — not by the backend, not by the gateway, but enforced by the smart contract itself. The contract requires that any collection transaction sends exactly the ZeroPay fee amount to the ZeroPay treasury address. If the fee is not included, the contract validator fails and the transaction is rejected.

This is critical: it means ZeroPay cannot be bypassed. Even if someone builds a frontend that tries to interact with ZeroPay contracts without paying the platform fee, the contract rejects the transaction at the Cardano node level.

The fee structure is: 1.5% of transaction value for standard escrow, 2% for dispute-involved escrow, 0.5% for subscription payments, 3% for AI-arbitrated resolution (the AI's work justifies a premium). Fees are collected to the ZeroPay treasury address and distributed to: operating costs (70%), development fund (20%), and a community/ecosystem fund (10%).

### Gas and Fee Optimization

Cardano's fee model is more complex than Ethereum's gas but predictable once understood. Fees depend on transaction size (bytes) and computational resources (execution units for script validation). ZeroPay's contracts are optimized for minimum fee impact:

Reference scripts are used for all contracts — deployed once at a UTxO, referenced by subsequent transactions rather than inlined. This reduces the script bytes that fee calculations include. Datum design minimizes the number of fields and their byte size without sacrificing security. Efficient Aiken coding patterns avoid expensive list operations on long lists. Transaction batching — collecting multiple platform fees in a single transaction rather than one transaction per settlement — amortizes the fixed transaction overhead.

### On-Chain Reputation System

Every completed ZeroPay transaction is counted in a merchant's on-chain reputation. The reputation system uses a Cardano Native Asset approach: ZeroPay mints non-transferable (soulbound) tokens to merchant wallet addresses at milestones (10 transactions, 100 transactions, verified merchant status, dispute-free track record). These tokens are visible in any Cardano wallet and on any explorer — they are public, verifiable credentials.

The reputation NFT metadata (stored in the transaction metadata following CIP-25) includes the merchant's ZeroPay ID, the achievement type, the verification date, and a link to the ZeroPay reputation page. Employers, clients, and customers can verify a merchant's ZeroPay track record without trusting ZeroPay's database — they can verify it directly on the Cardano blockchain.

---

## 8. AI Systems Architecture

### The AI-Native Design Principle

Every product decision at ZeroPay should ask: "Can AI make this better?" Not "Should we add an AI feature here?" The difference is fundamental. AI as an afterthought produces gimmicks — an AI chatbot attached to an otherwise unchanged product. AI as a native design principle produces a product where the AI makes every existing interaction faster, safer, and smarter without requiring the user to explicitly invoke it.

The user never interacts with "the AI." They interact with an invoice that fills itself in. They interact with a dispute resolution that feels instant. They interact with a fraud alert that stops a bad transaction before they even knew it was happening. The AI is invisible infrastructure, not a visible feature.

### Model Architecture

ZeroPay's AI system uses a tiered model architecture optimized for the trade-off between cost, latency, and capability:

**Tier 1 — Real-time inference (sub-100ms required):** Fraud scoring on every transaction, intent classification for chat messages (is this a payment request? a complaint? a spam message?), spam detection for merchant listings, and input auto-complete for invoice generation. These tasks use a small fine-tuned model (2-7B parameter range) that runs efficiently on CPU-optimized cloud instances. The model is trained on ZeroPay's own transaction and chat data (anonymized) and updated monthly.

**Tier 2 — Near-real-time inference (under 5 seconds acceptable):** AI dispute arbitration recommendation, business insight generation, invoice template suggestions, customer churn prediction, and anomaly alerts. These tasks use a mid-sized model via API — Claude claude-haiku-4-5 for high volume, Claude claude-sonnet-4-6 for complex reasoning tasks. The Claude API handles this tier because the latency is acceptable (5 seconds for a dispute recommendation feels fast to users) and the reasoning quality is consistently high.

**Tier 3 — Batch inference (minutes to hours acceptable):** Weekly business performance reports, tax categorization for the past month's transactions, training data preparation for the Tier 1 model, and proactive merchant coaching insights. These run as scheduled jobs using the cheapest available inference (bulk API batching) because there is no user waiting for an immediate response.

### Vector Database and RAG System

The vector database stores embeddings for: every merchant description and service listing (enabling semantic merchant search), every chat conversation (enabling the AI to retrieve relevant conversation context for dispute analysis), every support ticket and resolution (enabling the AI support agent to find precedents), and ZeroPay's own documentation and policies (enabling the AI to accurately answer policy questions).

When the AI copilot answers a merchant's question about their business performance, it first queries the vector database to retrieve the most relevant recent transactions, the merchant's historical patterns, and any relevant ZeroPay policies. This retrieved context is passed to the language model along with the question, grounding the AI's answer in real, specific data about that merchant rather than generic advice.

This RAG architecture has a critical privacy implication: the vector database must never allow a user to inadvertently access another user's embedded data. The retrieval queries are always filtered by user ID at the vector database query level, not in post-processing. This is enforced by the vector database's metadata filtering capability.

### AI Fraud Detection System

The fraud detection system runs as an event-driven pipeline. When a payment initiation event is published to the event bus, the fraud detection service subscribes to it and computes a risk score within 500 milliseconds. If the score is below 30 (low risk), the payment proceeds automatically. Between 30-70 (medium risk), an additional verification step is required (biometric confirmation). Above 70 (high risk), the payment is blocked and flagged for manual review.

The risk score computation uses a feature vector composed of: account age in days, number of previous transactions, average transaction value, deviation of current amount from historical average, recipient reputation score, time since last transaction from this device, IP geolocation match with account country, device fingerprint consistency, chat message sentiment analysis (did the conversation show social engineering patterns?), and amount-rounded patterns (exact round numbers are a fraud signal in many contexts).

The fraud model is adversarial — as ZeroPay detects and labels fraud patterns, the model updates. But sophisticated fraudsters also learn and adapt. The fraud model has a continuous evaluation pipeline: when fraud is reported after-the-fact (user complains they were defrauded), the system looks back at the risk score assigned to that transaction and uses the discrepancy to improve future predictions.

### AI Dispute Resolution Engine

When a dispute is raised, the AI Dispute Resolution Engine begins an automatic analysis within 60 seconds. The analysis has five components:

**Contract term analysis:** Parse the original invoice and escrow contract terms. Identify what was agreed: delivery timeline, scope of work, quality standards, revision policy. Check whether any terms are ambiguous.

**Conversation analysis:** Retrieve and analyze the full chat history between the parties. Identify: when was work delivered? What did the customer say about the delivery? Were there requests for revisions? Was there any agreement or disagreement expressed? Sentiment analysis identifies emotional tone and potential bad faith patterns.

**Evidence assessment:** If delivery evidence was submitted (file uploads, screenshots, links), the AI extracts key information. For a developer's code delivery, it checks if a GitHub link was provided and if it contains recent commits. For a designer's logo delivery, it checks if the file uploaded is the correct format and dimensions specified in the brief.

**Precedent matching:** Query the vector database for similar resolved disputes. Disputes with similar characteristics (same service category, similar amount, similar conversation pattern) that were resolved either in favor of merchant or customer serve as precedents with significant weight.

**Resolution recommendation:** Based on the above analysis, the AI generates a recommendation: full refund (customer), full release (merchant), or partial resolution with a specific percentage breakdown and rationale. The recommendation includes confidence score and the top three factors that drove the decision.

For disputes below ₹5,000, the AI recommendation is automatically executed after 24 hours unless either party requests human review. For disputes above ₹5,000, the AI recommendation is presented to both parties with a 48-hour window to accept or escalate to human review.

### AI Merchant Intelligence

The Merchant Intelligence system runs as a weekly batch job for each active merchant. It generates a personalized intelligence report delivered via push notification and visible in the merchant's dashboard. The report includes:

Revenue trend analysis with specific factors identified (not just "revenue is up 15%" but "revenue increased primarily on weekdays, particularly Wednesday evenings, correlating with the days you offered the '3-for-2' deal"). Customer behavior insights (which customers are at churn risk, which are the highest-value and most loyal, which items are being abandoned). Market position (how the merchant's average transaction value and completion rate compares to similar merchants in the same category — anonymized benchmarks). Actionable recommendations (specific, not generic: "Based on your data, sending a payment request reminder after 2 hours of no response increases your conversion rate by 22%.").

### Autonomous Commerce Agents

By Stage 2, ZeroPay introduces Autonomous Commerce Agents — AI systems that take actions on behalf of merchants with their permission. A merchant can configure: "When a customer hasn't responded to a payment request for 3 hours, send them a polite reminder." "When my weekly revenue drops 20% below my monthly average, send me an alert and suggest three promotions I could run." "When a new customer completes their first purchase, automatically send them a thank-you message with a discount code for their second purchase."

These agents are configured through a conversational interface: the merchant tells ZeroPay's AI copilot what they want to happen, and the AI translates this into a trigger-action rule that runs automatically. The merchant sees a list of their active agents and can disable any of them at any time.

At Stage 3, agents can be programmed to interact with the smart contract layer — automatically releasing milestone funds when a delivery is confirmed, automatically initiating a refund if a merchant hasn't responded within the dispute window, and automatically generating next-milestone invoices when the previous one is settled.

---

## 9. Realtime Communication Infrastructure

### Evolution Strategy

The current Firebase Realtime Database chat system is adequate for the MVP but has known limitations at scale: the flat structure creates read overhead as chat history grows, there is no native support for message delivery receipts, presence management is manual, and typed queries are limited. The evolution strategy adds capabilities without discarding the Firebase investment.

### Message Delivery States

Every message in the ZeroPay chat system has four delivery states forming a WhatsApp-style visual indicator: **Sent** (message written to Firebase at the sender's client — a single check), **Delivered** (message received at Firebase server — two checks), **Read** (recipient opened the conversation and the message was in view — two blue checks), **Failed** (message could not be sent after retry — a red error state).

The Read state is implemented using Firebase's `onValue` listener: when the recipient has the chat room open and receives a message, the client writes a read receipt to the Firebase path for that message. The sender's client listens to this path and updates the UI. This is Firebase's event-driven model used exactly as designed.

### Typing Indicators

Typing indicators are implemented using Firebase Realtime Database's transient data pattern. When a user starts typing, the client writes their user ID and a timestamp to a `typing` path in the chat room with a 5-second TTL (accomplished by scheduling a Firebase write to clear the field after 5 seconds). Other clients listening to the `typing` path see the update and display "Merchant is typing..." When the user stops typing or sends the message, the typing indicator is cleared immediately. The timestamp prevents stale typing indicators from persisting if the client disconnects without clearing it.

### Voice Notes

Voice notes are a critical feature for the Indian small merchant market, where voice communication is often faster and more comfortable than typing. Voice notes use React Native's Expo AV library to record audio on device, compress it to AAC format (smaller than MP3, better quality), upload it to Firebase Storage (which provides 5GB free on the Spark plan), and send a chat message of type `voice_note` containing the Firebase Storage URL, duration, and waveform data.

The waveform data is computed on device during recording (a sampled amplitude array) and stored with the message. The chat UI renders a playable voice note bubble with the waveform visualization and a progress indicator during playback. Voice notes are transcribed asynchronously by the AI system (Whisper API or similar) and the transcript is stored with the message for searchability and accessibility.

### Media Uploads

Photo, file, and document sharing in chat follows the same pattern as voice notes: local upload to Firebase Storage with a progress indicator in the chat bubble, then a message containing the download URL and metadata. The UI renders image previews inline for photos and a file icon with name and size for documents.

Media uploads are subject to size limits (photos: 10MB, documents: 25MB, voice notes: 5 minutes) enforced both on the client before upload begins and on Firebase Storage rules to prevent abuse. Firebase Storage's free tier provides 5GB of storage and 1GB/day download — sufficient for early scale, with a clear upgrade trigger.

### AI-Powered Chat Summaries

For long payment conversations (common in freelance negotiations), ZeroPay generates an AI summary of the conversation attached to the payment invoice. When a merchant creates an invoice from a conversation, the AI has already analyzed the conversation and pre-fills the invoice description, the agreed deliverables, the timeline, and any special conditions that were mentioned in the chat. The merchant reviews and confirms rather than typing from scratch.

For archived conversations (older than 30 days), full message history is replaced with an AI-generated summary to reduce storage costs while preserving the important information.

### Encrypted Chats

End-to-end encryption for chat is a Stage 2 feature. It uses the Signal Protocol (the same encryption used by WhatsApp and Signal), implemented using the LibSignal library. The key exchange happens at the start of each conversation using Diffie-Hellman key agreement — neither ZeroPay's servers nor Firebase sees plaintext message content after encryption is enabled.

Encrypted chats have a user-visible indicator (a lock icon in the chat header). When encryption is enabled, ZeroPay's AI cannot analyze message content for smart invoice pre-filling or dispute resolution (since it cannot see the plaintext). The AI features are therefore opt-in for encrypted chats — users who enable encryption understand they are trading AI assistance for privacy.

---

## 10. Fintech & Business Feature Roadmap

### UPI Integration Strategy

UPI integration is the single most important feature for Indian market penetration. A merchant who cannot accept UPI cannot replace their existing payment setup with ZeroPay — they would need both, which doubles their cognitive overhead and defeats the purpose.

The strategy is to integrate UPI as a fiat on-ramp: when a customer pays with UPI, ZeroPay receives the INR, converts it to ADA (or stablecoin) at the best available rate through a licensed exchange partner, and credits the merchant's ZeroPay balance. The merchant sees their earnings in INR equivalent but holds ADA on-chain. When they want to withdraw, the reverse process (ADA → INR via exchange → bank transfer via NEFT/IMPS) completes the off-ramp.

This architecture requires a partnership with a SEBI/RBI-registered exchange (CoinDCX, WazirX, or Mudrex) for the conversion layer and a registered payment aggregator (Razorpay, Cashfree) for the UPI collection. Razorpay's API makes this straightforward technically — the complexity is regulatory (a payments aggregator license or a partnership with a licensed PA).

The UPI integration does not change the merchant experience: they still receive funds in their ZeroPay wallet, they still see their dashboard, they still have IPFS receipts. The blockchain settlement happens in the background. The customer's experience changes: they see both a "Pay with UPI" and "Pay with ADA" option in the checkout flow.

### Stablecoin Strategy

Cardano has two native stablecoins: Djed (algorithmic, backed by ADA) and iUSD (from Indigo Protocol, synthetic). Both trade on Cardano's DEX ecosystem. ZeroPay's stablecoin integration allows merchants to price their goods and services in iUSD rather than ADA, eliminating the ADA price volatility risk that is the biggest objection from non-crypto merchants.

A merchant can set their pricing in INR, have ZeroPay display and accept payment in iUSD (pegged to the dollar), and convert periodically to INR via the off-ramp. The ADA price volatility risk is absorbed by the DEX swap that happens at settlement time — the merchant never holds volatile ADA, only the stablecoin.

### Split Payments

Split payments allow a group of friends to split a restaurant bill, a group of colleagues to share a subscription, or multiple buyers to contribute to a shared purchase. The UI flow: the payer initiates a payment request, selects "Split payment," adds the other participants from their contacts, and specifies each person's share. Each participant receives a push notification with their share amount and can pay independently. The merchant receives the full amount only when all splits are collected — or after a configurable timeout, in which case the organizer pays the remainder.

On the blockchain, split payments are elegantly handled by the escrow contract: all contributors lock their share to the same contract UTxO, and the merchant can only collect when the total locked amount equals the invoice amount.

### Recurring Billing

Recurring subscriptions require automatic payment initiation, which conflicts with Cardano's requirement for user-signed transactions (no private key on the server). The solution is a pre-authorization mechanism: the customer signs a "recurring payment authorization" transaction that locks funds in a time-release contract. The contract releases the agreed amount to the merchant at each billing interval without requiring the customer to re-sign.

This is technically complex in Cardano's UTXO model (it requires a contract that manages a recurring release schedule) but is architecturally clean. The customer sees the authorization as a single "Subscribe" action. Cancellation revokes the authorization by having the customer sign a cancellation transaction that voids the contract and returns remaining locked funds.

### Treasury Management for Merchants

High-volume merchants accumulate significant ADA holdings and face the challenge of managing an asset whose value fluctuates. ZeroPay's treasury management feature provides: current ADA balance with 30-day value chart, automated conversion alerts (notify when ADA price hits a target), off-ramp scheduling (convert a fixed percentage to INR every week automatically), staking integration (ADA held in the ZeroPay in-app wallet can be delegated to a Cardano stake pool, earning ~4% APY staking rewards), and yield summary (how much the merchant earned in staking rewards this month).

### Tax and Compliance Tools

Indian merchants using ZeroPay need GST-compliant invoices and annual transaction summaries for tax filing. ZeroPay generates: GST invoices with proper GSTIN, supply type, HSN/SAC codes, and IGST/CGST/SGST breakdown (when the merchant provides their GSTIN and the customer's GSTIN), quarterly GST summary reports (GSTR-1 format compatible), annual income summary for ITR filing, and export in formats compatible with Tally ERP (the dominant accounting software for Indian SMBs).

Tax categorization is AI-assisted: ZeroPay's AI automatically categorizes each transaction into the correct HSN/SAC code based on the invoice description, with the merchant able to override. Over time, the AI learns the merchant's specific categorization patterns and achieves near-100% automatic accuracy.

---

## 11. Product Ecosystem — Beyond Payments

### Merchant Storefront System

Every ZeroPay merchant gets a public storefront at `zeropay.in/{merchantId}`. The storefront displays: the merchant's name, logo, and category, a bio and location (optional), a service or product catalog with pricing, customer reviews and reputation score, available contact methods (chat, WhatsApp link, phone), and a ZeroPay payment button for each listing.

The storefront is a static-rendered page (generated by Next.js on the web backend) for SEO discoverability. A freelance graphic designer's ZeroPay storefront can rank on Google for "graphic designer in Indore" if their profile is optimized correctly. ZeroPay provides storefront SEO guidance as part of the AI onboarding flow.

Merchants can customize their storefront with a header image, portfolio gallery, featured work, client testimonials (pulled from the ZeroPay review system), and up to 20 listed services. A premium subscription unlocks custom domain support (`payments.madhavandesigns.com` pointing to the ZeroPay storefront) and advanced customization.

### Digital Product Marketplace

ZeroPay becomes a distribution channel for digital products: design templates, code snippets and boilerplates, educational content, music samples, photography presets, 3D assets, and any file-based digital product. The distribution is integrated with the payment system: when a customer pays for a digital product, they are automatically granted access to the file download without the merchant manually sending anything.

The digital product system integrates with IPFS for storage: digital products are stored on IPFS (pinned by ZeroPay's Pinata account) and the download is gated by ZeroPay's authenticated download endpoint. After payment confirmation, the customer receives a time-limited signed download URL that works for 48 hours. The merchant's files are never publicly accessible — only customers who have paid get access.

### Freelancer Ecosystem

The freelancer vertical is built on top of the smart contract escrow system with additional workflow tooling: contract creation from chat (the AI generates a scope-of-work agreement from the conversation), milestone planning with visual timeline, delivery submission (upload evidence of completion to request milestone release), revision tracking (keeping count of revisions against the agreed limit), and a portfolio system that automatically populates with completed projects.

ZeroPay becomes the Fiverr alternative for the blockchain era: all Fiverr's workflow tooling, but without the 20% platform fee for payments. ZeroPay charges 1.5% (a tenth of Fiverr's cut) because the smart contract handles the trust enforcement automatically — ZeroPay doesn't need a large customer service team adjudicating every dispute.

### Loyalty and Rewards Engine

The ZeroPay Rewards system is both a customer retention mechanism and a merchant growth tool. Customers earn ZeroPay Points for every payment (1 point per ₹10 spent). Points are redeemable for: discounts at participating merchants, reduced ZeroPay transaction fees, exclusive access to new features, and eventually (Stage 3) for ZeroPay's native governance token.

Merchants configure their own loyalty tiers on top of the ZeroPay base layer: a coffee shop might give a free coffee at 500 points, a freelancer might give a 10% discount for returning clients with 3+ completed projects. The loyalty system is visible to customers in the merchant's chat and storefront, incentivizing repeat business.

### Referral and Affiliate System

The referral system has two tiers: user-to-user referrals (a customer refers another customer and gets 100 ZeroPay Points when the referred user completes their first payment) and affiliate partnerships (content creators, influencers, and community managers who refer merchants get 0.5% of every transaction from their referred merchants for the first 12 months).

The affiliate system is designed for crypto community builders — anyone running a Cardano community Telegram group, a fintech YouTube channel, or a freelancer community can apply for the affiliate program and earn real revenue from their audience's ZeroPay usage. This is the primary merchant acquisition mechanism: a channel that is highly cost-effective (cost is paid from transaction revenue rather than upfront) and viral in nature.

---

## 12. Scalability Architecture

### Scaling Tiers and Triggers

**Tier 1 — 0 to 1,000 users (Current free infrastructure)**

No changes needed. The current stack handles this tier comfortably. MongoDB M0 at ~50MB used, Blockfrost at ~10% of daily limit, Render free tier with UptimeRobot alive, Firebase Spark well within limits.

The single most important action at this tier is instrumentation: add structured logging with correlation IDs (so a single transaction can be traced across all service calls), add Sentry for error tracking, and add basic metrics (daily active users, payment volume, confirmation latency) so you know precisely when you're approaching the next tier's limits.

**Tier 2 — 1,000 to 10,000 users**

Infrastructure upgrades: MongoDB Atlas M2 ($9/month) for 2GB storage and dedicated cluster resources. Render Starter ($7/month) eliminates the cold start problem. Upstash Redis Pro tier when daily commands approach 8,000. Blockfrost paid tier when daily requests approach 40,000 (80% of limit).

Architecture change: Extract the Blockchain Service as a separate process. The blockchain polling, confirmation detection, and transaction building is IO-bound and can be horizontally scaled independently. A single dedicated Blockchain Service handles all Cardano interactions, called by the main API via REST or message queue.

Database indexing review: Query performance audit of all MongoDB collections at 100,000 documents. Add compound indexes where query plans show full collection scans. Enable slow query logging (threshold: 100ms) to catch new slow queries as data volume grows.

**Tier 3 — 10,000 to 100,000 users**

Infrastructure upgrades: MongoDB Atlas M10 (dedicated cluster, auto-scaling storage). Redis Cluster (multiple Redis instances with consistent hashing for horizontal scaling). Backend hosted on a container orchestration platform (Railway, Fly.io, or self-managed Kubernetes on DigitalOcean) to enable horizontal scaling with load balancing. The Blockchain Service scaled to 3+ instances behind a load balancer.

Architecture change: Introduce the event bus. Redis Streams (built into Redis, no additional service needed at this tier) replaces direct service-to-service calls for async workflows. Events are published to named streams, and consumers read from their respective streams. This decouples services and makes the system resilient — if the notification service is temporarily down, events queue in Redis Streams and are processed when it comes back up.

Database read scaling: Introduce MongoDB read replicas for the dashboard and analytics queries. Write operations continue to the primary. Read-heavy operations (transaction history, merchant statistics) are directed to replicas to reduce primary load.

Caching strategy maturation: At this scale, not all caching needs are predictable in advance. Use cache profiling (track hit/miss ratios per cache key pattern) to identify which data is most frequently read. Implement a multi-level cache: L1 is in-process memory cache for the highest-frequency reads (price oracle, merchant profile for QR scanning), L2 is Redis, L3 is MongoDB.

**Tier 4 — 100,000 to 1,000,000 users**

This tier requires architectural changes that should be designed now even though the implementation is months away. The key changes: full microservices with Kubernetes orchestration, Kafka for the event bus (Redis Streams is not designed for the throughput needed at this scale), MongoDB Atlas sharding for the transaction collection (which by this point has tens of millions of documents), a CDN layer (Cloudflare or AWS CloudFront) in front of the API gateway for caching public API responses, and dedicated AI inference infrastructure (GPU-optimized instances for the fraud scoring model).

Database partitioning strategy: The transaction collection is sharded by merchant ID — all transactions for a given merchant live on the same shard, enabling efficient per-merchant queries without cross-shard scatter/gather. The invoice collection is sharded by creation date (range-based sharding) because time-based queries (dashboard views) dominate the access pattern.

Geographic distribution: At 1 million users across India, Southeast Asia, and the global diaspora, a single-region deployment in Mumbai creates latency for users outside India. The architecture at this tier adds regional API gateway nodes (Singapore for Southeast Asia, London for Europe/UK diaspora, US East for American users) that proxy to the nearest backend region. Database writes remain centralized (Cardano is the source of truth for payments), but reads are served from regional replicas.

---

## 13. Security & Compliance Plan

### Authentication Security Architecture

The authentication system uses defense in depth: Firebase Auth provides the primary authentication (token issuance and verification), the ZeroPay backend adds a secondary verification layer (checking the token against a known-active session in Redis), and biometric authentication adds a third factor for sensitive operations.

Session management: Firebase ID tokens expire every hour. The mobile app uses Firebase's automatic token refresh. The backend validates every token on every request — no session tokens are cached by the backend for more than 5 minutes. If a user's account is compromised and disabled in Firebase, their active sessions are terminated within 5 minutes.

Anomalous login detection: When a user logs in from a new device or location, the AI risk scoring system flags it. If the login IP is in a different country from all previous sessions, a push notification is sent to all the user's other devices. If no response is received within 10 minutes, the new session is temporarily suspended until the user confirms via their primary device.

### Wallet Security Architecture

The non-custodial wallet architecture means ZeroPay cannot access user funds — but this guarantee is only as strong as its implementation. The security model:

Private key generation uses cryptographically secure random number generation from the device's hardware entropy source (not JavaScript's Math.random()). The key is generated entirely on-device; no network call is made during generation.

Private key storage uses Expo SecureStore for the encrypted blob. The encryption key is derived from the user's PIN using PBKDF2 with 100,000 iterations and a random salt. The PBKDF2 parameters make brute-force attacks on the PIN computationally expensive even if the device storage is extracted. Biometric authentication unlocks the PIN-derived key without transmitting the PIN to any server.

The seed phrase (BIP39 mnemonic) is displayed to the user exactly once during wallet setup and never stored anywhere — not in SecureStore, not in MongoDB, not in Firebase. ZeroPay cannot recover a user's wallet if they lose their seed phrase. This is the expected behavior of a non-custodial wallet. The onboarding flow makes this explicit and requires the user to write down and confirm 3 randomly selected words from their seed phrase before proceeding.

### Transaction Safety

Every transaction submitted through ZeroPay passes three validation layers before touching the blockchain:

**Layer 1 — Frontend validation:** Amount is positive and within the user's available balance. Recipient address passes Cardano bech32 format validation. Invoice status is `pending` (not expired or already paid). This layer catches user errors and provides immediate feedback.

**Layer 2 — Backend validation:** Invoice exists in MongoDB, belongs to the claimed merchant, is in `pending` status, and has not expired. Lovelace amount matches what was calculated at invoice creation (preventing frontend manipulation of the amount). Rate limiting confirms the user hasn't submitted more than 5 payment attempts in 60 seconds.

**Layer 3 — Smart contract validation:** The Aiken contract enforces that the paid amount meets the minimum threshold, the recipient matches the registered merchant address, and the invoice hasn't expired. If any condition fails, the Cardano node rejects the transaction. This is the uncircumventable layer — even if ZeroPay's entire backend is compromised, the smart contract cannot be tricked into releasing funds incorrectly.

### Fraud Prevention Architecture

The fraud prevention system operates at three time horizons:

**Pre-transaction:** AI risk scoring, device fingerprinting, velocity checks (number of transactions per hour from a device or account), blacklist matching (known fraudulent wallet addresses, IPs, and device fingerprints), and social engineering detection (AI analysis of chat messages for patterns consistent with scam conversations).

**In-transaction:** Smart contract enforcement (amount and recipient validation), transaction monitoring service that compares submitted transactions against known fraud patterns, and flagging for human review when AI confidence is below threshold.

**Post-transaction:** Dispute pattern analysis (identifying merchants or customers who consistently raise disputes, a signal of potential abuse), refund velocity monitoring (multiple refund requests from the same user in a short time window), and network analysis (identifying clusters of accounts that may be coordinating fraud).

### KYC/AML Roadmap

**Level 0 (current):** Phone OTP verification only. Transaction limit: ₹5,000 per transaction, ₹20,000 per month.

**Level 1 (Stage 1):** Aadhaar or PAN verification via DigiLocker API integration. Transaction limit: ₹50,000 per transaction, ₹2,00,000 per month. Required for merchants who want the verified badge.

**Level 2 (Stage 2):** Video KYC via a regulated KYC provider (CKYC, VKYC). Required for merchants with monthly volume above ₹2,00,000. Transaction limit: No limit (subject to transaction monitoring).

**AML monitoring (Stage 2):** Transaction pattern analysis against RBI's AML guidelines for virtual asset service providers. Suspicious transaction reporting workflow for transactions above ₹10,00,000 or matching suspicion criteria. A compliance officer (human or AI-assisted) reviews flagged transactions within 24 hours.

**VASP compliance (Stage 3):** As ZeroPay's transaction volume grows, compliance with RBI's virtual asset service provider framework becomes mandatory. The compliance roadmap includes: registering with the FIU-IND (Financial Intelligence Unit — India), implementing travel rule compliance (sharing sender and recipient information for transactions above ₹50,000), and maintaining a compliance monitoring system that generates the reports required for regulatory examination.

---

## 14. UX/UI Design System

### Design Philosophy — Trusted Clarity

ZeroPay's visual design language has one overriding principle: every screen should make the user feel safe. Trust is the product's core value proposition, and the design must communicate it at every touchpoint. This means: clear visual hierarchy that surfaces the most important information (amount, recipient, status) immediately, generous use of confirmed states (green, checkmarks, celebrations) to reinforce safety, cautious use of orange and red (reserved for genuine warnings and errors, not decorative), and consistency so that the user always knows where they are and what will happen when they tap something.

The reference aesthetic is neither the maximalist complexity of Coinbase Pro nor the minimalist emptiness of basic wallets. The reference is the confident simplicity of Revolut and the warmth of Nubank — apps that handle complex financial operations with interfaces that feel approachable to first-time users.

### Color System

The primary palette is built around three core colors: ZeroPay Teal (`#00B896`) as the primary brand color, expressing trust and forward motion. Midnight (`#0A0E1A`) as the dark background for the financial core screens — money deserves a serious visual context. Cream White (`#F9F7F4`) as the light-mode base, warmer than pure white, less clinical. The accent palette adds ZeroPay Amber (`#F5A623`) for attention states (pending invoice, waiting for confirmation) and Signal Red (`#E5293D`) for genuine errors and disputes — never used decoratively.

### Typography

The type system uses two families: the primary sans-serif for all UI text is Inter (already used widely in fintech — familiar and trusted). Numbers always use tabular (monospaced) figures to align columns of amounts. A secondary monospace family (JetBrains Mono) is used exclusively for Cardano addresses, transaction hashes, and IPFS CIDs — data that must be visually distinct as machine-readable identifiers that should not be edited.

Font sizes follow a strict scale: 12px for labels and metadata, 14px for body text, 16px for primary text and inputs, 20px for section headings, 28px for amounts and prominent numbers, 40px for the large amount display on the payment confirmation screen. No other font sizes are used. The restrictive scale creates visual consistency across every screen.

### Motion and Animation

Animations are purposeful, not decorative. They communicate state changes and guide attention:

The payment confirmation screen shows a money-sending animation when the wallet submits the transaction — a coin traveling from the customer's side to the merchant's side, taking approximately 1.5 seconds. This animation communicates "your money is moving" and reduces the user's anxiety during the wait.

The confirmation checkmark animates with a stroke drawing animation when a payment is confirmed (3 blocks reached). The animation takes 0.8 seconds — fast enough to feel instant, slow enough to feel satisfying. A green ripple expands from the checkmark center to reinforce the completeness.

Status transitions in the payment bubble use a smooth crossfade between the old state and new state rather than an abrupt replacement. The user's eye follows the transition naturally.

All animations are disabled when the device has Reduce Motion enabled in accessibility settings.

### Immersive Onboarding

The onboarding flow is ZeroPay's first and most important UX moment. It must accomplish: communicating ZeroPay's value proposition in 60 seconds, making the user feel safe and competent rather than overwhelmed, and collecting the minimum information needed to get started.

The onboarding uses a progressive disclosure pattern: the user sees only what they need for the immediate step. Step 1 is a three-screen value prop carousel (payments in chat, trustless escrow, instant receipts) with a single "Get Started" CTA. Step 2 is phone OTP (2 inputs, clean). Step 3 is role selection (2 large tiles, merchant or customer, with a "both" option shown subtly). Step 4 is first action — for merchants, create your first invoice; for customers, scan a merchant's QR. The wallet setup happens when the user first attempts a payment, not during onboarding — delaying the most complex step until the user understands why they need it.

### Super-App Navigation Architecture

The mobile app's navigation uses a persistent bottom tab bar with five items: Home, Pay, Chat, Commerce, and Profile. The Home tab is the activity feed — a chronological list of all recent events (payment received, invoice created, dispute resolved, AI insight ready). It is designed like Instagram's notifications tab crossed with a banking app's activity feed.

The Pay tab is the primary action hub: large "Send" and "Request" buttons, a recent contacts list, and a QR scanner shortcut. This tab is always two taps from completing a payment — tapping Pay, then tapping Send opens the payment input directly.

Context switching between merchant and customer views happens within the same app via a toggle in the top navigation bar (a subtle merchant-hat icon that switches to a customer-face icon). The UI recolors subtly when in merchant mode — a warmer, deeper teal — so the user always knows which context they're in.

---

## 15. Infrastructure & DevOps

### Event-Driven Architecture

The event bus is the nervous system of ZeroPay's backend. Every significant state change in the system publishes an event that any service can subscribe to. This architecture enables extending the system without modifying existing code — to add a new reaction to payment confirmation (for example, a new analytics event), you add a new subscriber to the confirmation event without touching the payment or blockchain service.

Event naming follows a past-tense domain-event pattern: `invoice.created`, `payment.submitted`, `payment.confirmed`, `payment.settled`, `dispute.raised`, `dispute.resolved`, `merchant.onboarded`, `user.verified`. Events are structured JSON documents with a standard envelope: event type, event ID (UUID), aggregate type, aggregate ID, timestamp, and payload. The standard envelope enables event replay and audit without parsing the payload.

Event storage: At Stage 1, events are ephemeral (Redis Streams with a 7-day retention window). At Stage 2, critical payment events are stored permanently in MongoDB's event store collection — this enables complete transaction audit trails, event replay for debugging, and the ability to rebuild any derived state from scratch.

### Observability Stack

**Structured Logging:** Every log statement includes: correlation ID (a UUID generated at the API gateway and threaded through all service calls for a single request), user ID (when authenticated), service name, log level, and timestamp. Log statements never contain sensitive data (wallet private keys, full credit card numbers, Firebase service account credentials). Logs are shipped to a centralized log aggregation service — Logtail (free tier: 10GB/month) for Stage 1, Elasticsearch on a cheap VPS for Stage 2, AWS OpenSearch for Stage 3.

**Distributed Tracing:** Every operation that spans multiple service calls (creating an invoice involves the API, the database, the price oracle, and Firebase) generates a trace — a timeline of each operation with its duration and outcome. OpenTelemetry is the instrumentation standard (vendor-neutral, works with any tracing backend). Traces are sent to Jaeger (self-hosted on a $5/month VPS) for Stage 1, Datadog for Stage 2 when the volume justifies the cost.

**Metrics:** Custom business metrics are more valuable than infrastructure metrics at early scale. Track: payment initiation rate (payments started per hour), payment completion rate (payments settled / payments submitted), average confirmation latency (seconds from submission to 3 confirmations), dispute rate (disputes raised / payments settled), and AI fraud block rate (payments blocked by AI risk scoring). These metrics are computed by the analytics service and stored in a time-series database (InfluxDB, free self-hosted).

**Alerting:** PagerDuty-style alerting is overkill for Stage 1. A Slack webhook integration with Sentry is sufficient — when a new error type is detected or an error rate spike occurs, a message is posted to the team's Slack channel with the error details and a link to Sentry. As the system grows, escalation policies (wake someone up at 3 AM if the payment pipeline is down) are added using PagerDuty's free tier.

### CI/CD Pipeline

The CI/CD pipeline has three environments: development (feature branches), staging (main branch), and production (tagged releases). Each environment runs its own isolated stack — separate Firebase project, separate MongoDB database, separate Cardano preprod indexer configuration.

The pipeline has six stages: lint (ESLint, TypeScript check), test (unit and integration), build (compile TypeScript, build mobile APK via EAS), security scan (automated vulnerability scanning of npm dependencies using Snyk free tier), deploy staging (automatic), and deploy production (manual trigger with required approval from a second engineer — the four-eyes principle for production deployments).

Database migrations are managed through a migrations system (Mongoose's built-in migration support or a custom migration runner). Every schema change is a numbered migration file that runs on startup if not already applied. Rolling back a migration is always possible — down migrations are defined alongside up migrations. This eliminates the "I need to manually update the production database" antipattern that causes outages and data corruption.

### Disaster Recovery

The disaster recovery plan has three tiers based on what fails:

**Service failure (Render goes down):** The mobile app shows a "Service temporarily unavailable" message. Firebase chat continues working (Firebase is independent of the Render backend). Payments cannot be initiated. Recovery time: 5-15 minutes (Render's restart or manual redeploy). Mitigation: Vercel hosted status page shows service status, push notification sent to users informing them of the outage.

**Database failure (MongoDB Atlas cluster issue):** All API operations that require database writes fail gracefully with a "Please try again shortly" message. Read operations that are cached in Redis continue to work. Recovery time: MongoDB Atlas M2+ clusters have 99.95% uptime SLA with automatic failover in approximately 30 seconds. Mitigation: Daily MongoDB Atlas database snapshots (free, automatic on paid tiers) enable point-in-time recovery.

**Blockchain indexer failure (Blockfrost goes down):** Payments cannot be confirmed (the blockchain is still running, but ZeroPay cannot verify confirmations). The fallback to Koios activates automatically. If both Blockfrost and Koios are unavailable, the confirmation queue pauses (jobs stay in BullMQ) and resumes automatically when the indexer recovers. User-facing message: "Payment confirmation is delayed — your funds are safe and will settle shortly."

**Complete infrastructure failure:** The nuclear scenario — every ZeroPay service is down. User funds on the Cardano blockchain are never at risk (the blockchain is independent of ZeroPay). Pending escrow funds in smart contracts remain safe and can be refunded via the time-based refund path without ZeroPay's servers. This is the ultimate argument for smart contract escrow over centralized escrow — the platform can go offline and users can still recover their funds.

---

## 16. Revenue & Business Model

### The Three Revenue Phases

**Phase 1 — Transaction Fee Revenue (Months 1–12)**

ZeroPay charges a 1.5% fee on every settled transaction, deducted at the smart contract level. This is enforced on-chain, not by the backend — it cannot be circumvented. At ₹10 lakh monthly transaction volume, this generates ₹15,000 monthly revenue. At ₹1 crore monthly volume (Stage 1 target), it generates ₹1,50,000 monthly. This is the baseline revenue that justifies infrastructure upgrades.

**Phase 2 — Subscription Revenue (Months 6–18)**

Merchant subscription tiers provide recurring revenue:

*ZeroPay Basic (Free):* Core payment features, chat, QR payments, up to 100 transactions/month, standard support.

*ZeroPay Pro (₹499/month):* Unlimited transactions, merchant storefront, AI invoice generation, advanced analytics, custom QR, priority support, 1.2% transaction fee (reduced from 1.5% for subscribers).

*ZeroPay Business (₹1,999/month):* Everything in Pro plus: team accounts (5 members), API access, custom domain storefront, AI business intelligence, accounting exports, dedicated support, 1.0% transaction fee.

*ZeroPay Enterprise (Custom pricing):* White-label capability, custom smart contract logic, SLA guarantees, dedicated infrastructure, compliance support, 0.75% transaction fee.

At 1,000 Pro subscribers and 100 Business subscribers, subscription revenue reaches ₹6,99,000 monthly — significantly exceeding transaction fee revenue and providing predictable, recurring income.

**Phase 3 — Platform Revenue (Months 18–36)**

*Developer API:* $9/month for 10,000 API calls, $49/month for 100,000 calls, $199/month for 1 million calls. The API provides: escrow creation, payment link generation, merchant data access, and webhook integration. At 500 API developers across the three tiers, revenue is $20,000/month from API subscriptions alone.

*AI Services:* AI features above the basic copilot are metered. AI dispute arbitration: ₹100 per dispute resolved by AI. AI business intelligence report: ₹50 per report generated. AI contract generation: ₹199 per contract.

*Affiliate Commission Revenue:* ZeroPay charges affiliates nothing — they earn from the transaction fees their referred merchants generate. But at scale, the affiliate program drives merchant acquisition at a fraction of the cost of paid advertising, making it a revenue multiplier rather than a cost center.

*Marketplace Take Rate:* The digital product marketplace charges a 10% take rate on every sale (vs. Gumroad's 10% + transaction fee or Payhip's 5% — competitive). At ₹10 lakh monthly marketplace GMV, this generates ₹1 lakh monthly.

### Unit Economics at Scale

At 100,000 active merchants (Stage 3 target), the revenue model generates: ₹3 crore/month from transaction fees (at ₹200 crore monthly transaction volume), ₹1.5 crore/month from Pro and Business subscriptions, ₹50 lakh/month from API and AI services, ₹20 lakh/month from marketplace take rate. Total: approximately ₹5 crore/month (₹60 crore annually) with infrastructure costs of approximately ₹50 lakh/month at scale, resulting in healthy margins consistent with a SaaS-native fintech business.

---

## 17. Competitive Positioning

### vs. UPI Apps (GPay, PhonePe, Paytm)

UPI apps have zero transaction fees, massive user bases, and deep integrations with the Indian banking system. Competing on those dimensions is a losing strategy. ZeroPay wins on dimensions UPI cannot address: cross-border payments (UPI is India-only, ZeroPay is global), programmable trust (UPI has no escrow or contract layer), AI dispute resolution (UPI disputes are manual and slow), and digital product delivery (UPI cannot automatically deliver a file on payment).

The ZeroPay positioning: "UPI for agreements, not just transactions." ZeroPay is not better than UPI for paying a chai bill. It is dramatically better than UPI for paying a freelancer, settling a group booking, managing a service contract, or receiving payment from outside India.

### vs. Coinbase Commerce and Crypto Payments

Coinbase Commerce targets Western merchants and focuses on e-commerce store integrations. It does not have chat, escrow, or AI. It does not support India-focused currency markets. It has high transaction fees relative to Cardano. ZeroPay's advantage: purpose-built for small merchants in emerging markets, with escrow and AI as first-class features rather than afterthoughts, and Cardano's fee structure making micro-transactions viable.

### vs. Fiverr and Freelancer Platforms

Fiverr charges 20% to the seller and an additional 5.5% service fee to the buyer — a total 25.5% friction on every transaction. ZeroPay charges 1.5%. Fiverr provides a marketplace discovery layer (finding clients) in exchange for this premium. ZeroPay does not replace Fiverr's discovery mechanism — it provides the payment and escrow layer for freelancers who already have their clients, removing Fiverr's lock-in once the relationship is established.

The positioning: "Use Fiverr to find clients. Use ZeroPay to get paid forever after." This is the playbook Stripe used against PayPal — be a better infrastructure layer for people who already have their customer relationships, and let the discovery platforms focus on discovery.

### vs. Stripe and Shopify

Stripe and Shopify serve merchants in the US, Europe, and similar markets with stable banking systems. Their products are complex, enterprise-grade, and priced accordingly. They do not support Cardano, they do not have chat-native payments, and they are not designed for the Indian SMB market. ZeroPay's advantage: designed for Indian regulatory environment, built on a blockchain that makes escrow and programmable contracts native rather than bolted-on, and priced for markets where $29/month (Shopify Basic) is significant.

The long-term positioning: ZeroPay becomes the Shopify of emerging markets for the next generation of commerce infrastructure — where Web3 settlement, AI trust, and mobile-first experience are the baseline rather than premium add-ons.

### Defensible Moats

ZeroPay's long-term competitive advantages that are difficult to replicate:

**On-chain data network effects:** Every transaction on ZeroPay's smart contracts contributes to a growing dataset of on-chain commerce behavior. This data trains the fraud detection model, the risk scoring system, and the dispute arbitration AI. More transactions means better AI means fewer fraudulent transactions means more trust means more merchants. This loop compounds over time and becomes harder for a new entrant to replicate.

**Merchant switching costs:** A merchant who has 2 years of transaction history, customer relationships, a verified reputation badge, and a ZeroPay storefront that ranks on Google faces significant switching costs to move to a competitor. These switching costs grow with every month of usage.

**Smart contract lock-in (positive):** Merchants who use ZeroPay's milestone-based escrow contracts become dependent on ZeroPay's contract infrastructure. Migrating to a competitor requires either re-negotiating existing contracts or waiting for them to complete.

**Trust as a brand:** In a market plagued by payment fraud and defaulting freelancers, ZeroPay's AI-powered trust and escrow system becomes a strong brand signal. "Secured by ZeroPay" on a freelancer's invoice becomes a selling point — just as "Secured by Stripe" is on e-commerce checkouts.

---

## 18. Execution Roadmap — Phase by Phase

### Phase 0 — Foundation (Weeks 1–2)
Stabilize current codebase. Implement structured logging with correlation IDs. Set up proper environment variable management. Configure GitHub Actions CI. Write unit tests for all existing service functions. Achieve the state where every code change is automatically tested and every deployment is automated. This is not glamorous — it is the precondition for everything else.

### Phase 1 — The Minimum Viable Product that Matters (Weeks 3–8)
The goal of Phase 1 is to deploy one complete, production-grade feature that validates the core value proposition: trustless escrow. Aiken contract written, audited by a second developer, and deployed on preprod. Frontend flow for customer-initiates → funds lock to contract → merchant claims → funds release. This single flow, working end-to-end with a real user, is more valuable than fifty half-finished features.

### Phase 2 — Mobile and AI (Weeks 9–20)
React Native app built with the Expo managed workflow. The in-app non-custodial wallet implemented. The AI fraud scoring system deployed (even if the model is simple — a rule-based scoring system counts). The ZeroPay Copilot for invoice generation launched. The freelancer milestone escrow contract deployed. A referral system that generates growth without paid advertising.

### Phase 3 — Commerce and Platform (Weeks 21–36)
Merchant storefronts. Digital product delivery. Developer API (v1). Subscription billing contracts. UPI integration research and partnership discussion begins. iOS app on TestFlight. AI dispute arbitration system live for low-value disputes. Affiliate program launched. First 1,000 real merchants onboarded via affiliate and referral channels.

### Phase 4 — Scale and Ecosystem (Months 10–18)
Infrastructure upgrades as user numbers hit defined triggers. Microservices extraction of blockchain and AI services. Stablecoin support. Full KYC Level 2 implementation. Developer portal and SDK. Enterprise partnerships. UPI integration live (partnership executed). Geographic expansion targeting diaspora markets (UK, UAE, US — Indian freelancers and merchants dealing with international clients).

### Phase 5 — Platform Dominance (Months 18–36)
ZeroPay SDK widely adopted by third-party developers. White-label escrow engine sold to enterprises. Cross-chain architecture designed and prototyped. ZeroPay Visa debit card launched via fintech banking partner. Community governance token for platform decisions. ZeroPay becomes the standard infrastructure layer for Web3 commerce in South and Southeast Asia.

---

## 19. North Star Vision — 5 Years

In 2030, ZeroPay is not a payment app. It is not a blockchain project. It is not an AI tool. It is all three simultaneously, inseparably.

It is the layer that enables a freelance developer in Bangalore to get paid by a client in Dubai via an escrow contract that releases on GitHub commit, with every milestone negotiated in a ZeroPay chat room and every invoice generated by an AI that already knows both parties' preferences.

It is the layer that enables a street vendor in Mumbai to accept payments from a tourist from South Korea who has never heard of Cardano, because the tourist scanned a ZeroPay QR code and paid with their credit card, and ZeroPay handled the UPI → INR → ADA conversion in the background in 3 seconds.

It is the layer that enables a creator in Chennai to sell 10,000 copies of their digital course to buyers across 40 countries, with automatic payment splitting to their co-instructor, automatic tax categorization for their accountant, and a reputation on ZeroPay's blockchain that proves their credentials to every future client.

It is the infrastructure that 500 other applications are built on top of — niche platforms for specific verticals (ZeroPay for musicians, ZeroPay for photographers, ZeroPay for tutors) each using ZeroPay's trust and settlement rails to handle the hard parts, building only the parts that make their specific market unique.

At that scale, ZeroPay's value is not measured in transaction volume or monthly revenue — it is measured in how much commerce it enables that would otherwise not have happened. Freelancers who got paid for work that would have been stolen. Merchants who accepted international clients they couldn't previously trust. Customers who received exactly what they paid for, enforced by mathematics, not by hope.

That is what "AI-powered programmable trust infrastructure for commerce" means in practice. Not a vision statement — a description of a world that ZeroPay makes possible, piece by piece, starting from what already exists today.

The work begins now.

---