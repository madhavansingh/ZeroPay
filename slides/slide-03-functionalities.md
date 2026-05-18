# Slide 3 — Functionalities of Product

## What is the product's USP?

- **Point 1:** Chat-first payments — merchants send ADA payment requests inside a WhatsApp-style chat room; customers pay in one tap, no blockchain knowledge required.
- **Point 2:** INR-primary UX — all amounts are displayed in rupees; ADA, lovelace, and wallets are fully invisible to both merchant and customer.
- **Point 3:** Zero-cost infrastructure — entire stack runs on free tiers (Vercel, Render, MongoDB Atlas, Firebase, Upstash Redis); monthly operational cost is ₹0.

---

## What is the technology used? Are there any licensed tools?

- **Point 1:** Cardano blockchain + Aiken smart contracts for trustless escrow; MeshJS for client-side transaction building — private keys never touch the server. All tools are open-source.
- **Point 2:** Node.js + Express API, BullMQ job queues, MongoDB Atlas, Firebase Realtime DB, Upstash Redis — standard open-source stack with free-tier cloud services.
- **Point 3:** Blockfrost API (free tier, 50K req/day) for blockchain indexing with Koios as a free fallback. No licensed or paid tools in the critical path.

---

## How easy is it to scale the product?

- **Point 1:** The stateless Express API and BullMQ workers are horizontally scalable independently. Adding more workers handles higher payment confirmation throughput with zero code changes. Moving from Render free tier to a paid instance requires only an environment variable update.
