# ZeroPay Master Deployment Guide

ZeroPay is a monorepo consisting of:
- A backend server (`backend/`) running Express, MongoDB, and BullMQ queues backed by Redis.
- A frontend PWA (`apps/web/`) built using React, TypeScript, and Vite.
- Shared packages (`packages/shared-types/`) with static TS declarations.

---

## 📋 Prerequisites

Before deploying ZeroPay to production, you will need provisioning credentials for the following services:

1. **MongoDB Database**: A hosted Mongo instance (e.g., MongoDB Atlas).
2. **Upstash Redis**:
   - One Redis TLS endpoint (`rediss://...`) for BullMQ queue state persistence.
   - One Redis REST endpoint (`https://...` + Token) for API-side rate-limiting and pricing caches.
3. **Blockfrost Project ID**: An active project ID for Cardano block queries.
4. **Pinata IPFS Account**: A Pinata JWT token for uploading transaction receipts.
5. **Firebase Project**:
   - A Realtime Database instance.
   - A Firebase Admin SDK Service Account JSON key (for push notifications and customer wallet/chat sync).

---

## 🛠️ Monorepo Build Commands

To run a production build of the entire monorepo locally or inside a CI/CD server, execute the following commands in the workspace root:

```bash
# Install all dependencies across workspaces
npm install

# Build shared types, frontend, and backend packages
npm run build
```

---

## 🌐 Backend Deployment Options

The backend runs as a standard Node.js/Express web service that also spawns the background BullMQ workers.

### Step 1: Set Environment Variables
Copy `docs/env.production.example` to `.env` and fill out your secrets.

### Step 2: Start Service
To start the production API and workers:
```bash
cd backend
npm run build
npm run start
```

### Queue Management & Monitoring
ZeroPay mounts a Bull Board Admin UI at `GET /admin/queues` which is protected by Basic Auth.
Configure `ADMIN_USERNAME` and `ADMIN_PASSWORD` in your production environment variables to secure this dashboard.

---

## 🎨 Frontend Deployment Options

The frontend is a static Vite application compiled to single-page assets. It is optimized to be deployed to static hosts like **Vercel** or **Netlify**.

### Build Command
```bash
cd apps/web
npm run build
```
Vite outputs the built assets in `apps/web/dist/`. Point your static hosting provider to serve this directory.

---

## 🏥 Diagnostics & Health Auditing

Ensure your container deployment (e.g., Kubernetes or Render Web Services) is configured to poll the health checks for auto-recovery:

- **Aggregated Health**: `GET /health` (Verifies MongoDB, Redis, and overall node status)
- **Database Status**: `GET /health/db`
- **Redis Health**: `GET /health/redis`
- **Queue Status**: `GET /health/queues` (Tracks BullMQ latency and failed jobs)
- **Blockchain Connectivity**: `GET /health/blockchain` (Rate-limited via 30s cache guard)
