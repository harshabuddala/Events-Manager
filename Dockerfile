# =============================================================================
# Multi-stage Dockerfile for Edunura Events (Next.js 15 + Prisma)
# Optimized for Dokploy deployment with standalone output
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Install dependencies (cached unless package files change)
# ---------------------------------------------------------------------------
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy only package files first (rarely changes = better cache)
COPY package.json package-lock.json ./

# Install dependencies (cached unless package files change)
RUN npm ci --prefer-offline

# ---------------------------------------------------------------------------
# Stage 2: Generate Prisma client & build Next.js
# ---------------------------------------------------------------------------
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy node_modules from deps stage (cached unless deps stage changed)
COPY --from=deps /app/node_modules ./node_modules

# Copy package files
COPY package.json package-lock.json ./

# Copy Prisma schema first (changes less frequently than app code)
COPY prisma ./prisma/

# Copy prisma.config.ts BEFORE generate (Prisma 7.x needs it for datasource URL)
COPY prisma.config.ts ./

# Generate Prisma Client (dummy DATABASE_URL required by Prisma 7.x config)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate

# Copy remaining files needed for build (app code, configs, etc.)
# This layer invalidates on app code changes, but deps + prisma are already cached
COPY next.config.ts tsconfig.json postcss.config.mjs eslint.config.mjs ./
COPY app ./app/
COPY lib ./lib/
COPY hooks ./hooks/
COPY middleware.ts ./
COPY entrypoint.sh ./
COPY public ./public/

# Clear any stale .next cache before building to prevent cache-related errors
RUN rm -rf .next

# Build Next.js (standalone output)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 3: Production runner (minimal image)
# ---------------------------------------------------------------------------
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat openssl curl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Ensure uploads directory exists
RUN mkdir -p /app/uploads && chown -R nextjs:nodejs /app/uploads

# Copy generated Prisma client (custom output path in schema)
# Must be writable by nextjs so runtime `prisma generate` can refresh it
COPY --from=builder --chown=nextjs:nodejs /app/generated/prisma ./generated/prisma

# Copy full node_modules (needed for Prisma CLI migrations + seed)
COPY --from=builder /app/node_modules ./node_modules

# Copy prisma schema + seed (needed at runtime for migrations)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copy prisma config (needed for Prisma 7.x datasource URL)
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts

# Copy entrypoint script
COPY --from=builder --chown=nextjs:nodejs /app/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nextjs

EXPOSE 8472

ENV PORT=8472
ENV HOSTNAME="0.0.0.0"

# Health check hits the /api/health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=180s --retries=5 \
  CMD curl -f http://localhost:8472/api/health || exit 1

ENTRYPOINT ["./entrypoint.sh"]
