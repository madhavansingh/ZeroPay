# Vercel Deployment Guide (Frontend PWA)

Vercel is the recommended platform for deploying the ZeroPay React PWA due to its global CDN, instant cache invalidation, and seamless integration with Vite.

---

## 🚀 Step-by-Step Vercel Setup

1. Go to the [Vercel Dashboard](https://vercel.com) and click **Add New** → **Project**.
2. Import the Git repository containing ZeroPay.
3. In the project settings, configure the following:

| Config | Value |
|---|---|
| **Framework Preset** | `Vite` |
| **Root Directory** | `apps/web` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

---

## 🔒 Environment Configuration

Add the following environment variables under **Environment Variables** in the project settings:

- `VITE_API_URL`: The public HTTPS URL of your backend service deployed on Render (e.g., `https://zeropay-backend.onrender.com`).
- `VITE_FIREBASE_API_KEY`: Firebase web API key.
- `VITE_FIREBASE_AUTH_DOMAIN`: Firebase auth domain.
- `VITE_FIREBASE_DATABASE_URL`: Firebase Realtime Database URL.
- `VITE_FIREBASE_PROJECT_ID`: Firebase project ID.
- `VITE_FIREBASE_STORAGE_BUCKET`: Firebase storage bucket.
- `VITE_FIREBASE_MESSAGING_SENDER_ID`: Firebase messaging sender ID.
- `VITE_FIREBASE_APP_ID`: Firebase application ID.

---

## 🔄 SPA Routing Configuration

Since React Router handles page navigation on the client-side, direct links (e.g., `/merchant/dashboard`) will return a 404 when refreshed if Vercel is not configured to rewrite all URLs to `index.html`.

ZeroPay includes a `vercel.json` file in the frontend root or workspace root. Ensure it contains the following configuration:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
If deploying from the monorepo root, place this `vercel.json` file at `apps/web/vercel.json`.
