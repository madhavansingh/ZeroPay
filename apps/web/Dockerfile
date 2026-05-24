# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copy manifests for cache efficiency
COPY package.json package-lock.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/sdk/package.json ./packages/sdk/
COPY apps/web/package.json ./apps/web/

RUN npm ci

# Copy source code
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

# Build Vite SPA bundle (pass Firebase env vars as build args)
ARG VITE_API_BASE_URL=http://localhost:5001
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_DATABASE_URL
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID

RUN npm run build:web

# ── Stage 2: Nginx SPA Server ─────────────────────────────────────────────────
FROM nginx:1.25-alpine AS runner

# Copy built assets
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copy optimized Nginx config
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
