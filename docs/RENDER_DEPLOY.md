# Render.com Deployment Guide (Backend)

Render.com is the recommended host for the ZeroPay backend API and BullMQ queue workers.

---

## 🚀 Setup Upstash Redis first
BullMQ requires a Redis instance with TLS enabled.
1. Create a Redis database on Upstash (with TLS enabled).
2. Note your **Rediss TLS URL** (`rediss://...`) and your **REST URL/Token**.

---

## 📦 Setting Up the Express Service on Render

We will deploy the backend API and BullMQ queue workers as a single **Web Service** on Render.

1. Log in to the [Render Dashboard](https://dashboard.render.com).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository.
4. Set the following configuration parameters:

| Config | Value |
|---|---|
| **Name** | `zeropay-backend` |
| **Language** | `Node` |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm run start` |

---

## 🔒 Environment Variables Configuration

In the service details page under **Environment**, add the environment variables defined in `docs/env.production.example`.

For multiline variables like `FIREBASE_PRIVATE_KEY`, copy-paste the private key verbatim, or escape newlines (`\n`) if copying directly from a JSON file.

---

## 🏥 Auto-Scaling & Health Checks

Render requires configuring a health check path for zero-downtime rolling updates.

1. Scroll to **Advanced Settings** on the service configuration page.
2. Under **Health Check Path**, enter `/health`.
3. Render will monitor this endpoint during deployments and ensure MongoDB and Redis connectivity are validated before sending user traffic to the new server instances.
