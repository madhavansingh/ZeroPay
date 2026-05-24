# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copy root monorepo manifests first (for layer caching)
COPY package.json package-lock.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/sdk/package.json ./packages/sdk/
COPY backend/package.json ./backend/

# Install ALL dependencies (including devDependencies for tsc)
RUN npm ci

# Copy shared packages and compile them
COPY packages/ ./packages/
RUN cd packages/shared-types && npx tsc --noEmit || true

# Copy backend source and compile
COPY backend/ ./backend/
RUN npm run build:backend

# ── Stage 2: Production Runner ────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy only production manifests
COPY package.json package-lock.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/sdk/package.json ./packages/sdk/
COPY backend/package.json ./backend/

# Install production-only dependencies
RUN npm ci --omit=dev

# Copy compiled output from builder
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/packages ./packages

# Security: run as non-root user
RUN addgroup -S zeropay && adduser -S zeropay -G zeropay
USER zeropay

WORKDIR /app/backend
EXPOSE 5001

# Default: launch API server. Override CMD for worker: ["node", "dist/worker.js"]
CMD ["node", "dist/server.js"]
