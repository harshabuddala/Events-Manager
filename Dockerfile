# =============================================================================
# Multi-stage Dockerfile for Edunura Events (Next.js 15 + Prisma)
# Optimized for fast builds + Dokploy deployment with standalone output
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Install OS deps + npm packages (cached unless package.json changes)
# ---------------------------------------------------------------------------
FROM node:22-alpine AS deps
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    python3 \
    make \
    g++ \
    cairo-dev \
    pango-dev \
    libjpeg-turbo-dev \
    giflib-dev \
    librsvg-dev \
    pkgconfig
WORKDIR /app

# Copy only package files first — changes rarely, maximizes Docker layer cache
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline

# ---------------------------------------------------------------------------
# Stage 2: Build Next.js app (only reruns when source code changes)
# ---------------------------------------------------------------------------
FROM node:22-alpine AS builder
# Runtime libs required for canvas (linked native binary from deps)
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    cairo \
    pango \
    libjpeg-turbo \
    giflib \
    librsvg
WORKDIR /app

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy package manifest
COPY package.json package-lock.json ./

# Copy Prisma schema + config (needed for prisma generate at build time)
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Generate Prisma Client (does NOT require a real database connection)
# dummy DATABASE_URL is only needed so prisma.config.ts does not throw
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN node ./node_modules/prisma/build/index.js generate --schema=./prisma/schema.prisma

# Copy app source (invalidates on any code change, but deps/prisma are cached)
COPY next.config.ts tsconfig.json postcss.config.mjs eslint.config.mjs global.d.ts ./
COPY app ./app/
COPY lib ./lib/
COPY hooks ./hooks/
COPY middleware.ts ./
COPY entrypoint.sh ./
COPY public ./public/

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build Next.js standalone output
# prisma generate is skipped here (already done above), next build runs directly
RUN node ./node_modules/next/dist/bin/next build

# ---------------------------------------------------------------------------
# Stage 3: Minimal production image
# ---------------------------------------------------------------------------
FROM node:22-alpine AS runner
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    curl \
    cairo \
    pango \
    libjpeg-turbo \
    giflib \
    librsvg
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8472
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Standalone Next.js server output
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Generated Prisma client
COPY --from=builder --chown=nextjs:nodejs /app/generated/prisma ./generated/prisma

# Full node_modules (Prisma CLI + runtime adapters needed by entrypoint)
COPY --from=builder /app/node_modules ./node_modules

# Prisma schema, seed, and config (for db push at container startup)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts

# Entrypoint script
COPY --from=builder --chown=nextjs:nodejs /app/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Uploads directory (persistent volume should be mounted here)
RUN mkdir -p /app/uploads && chown -R nextjs:nodejs /app/uploads

USER nextjs

EXPOSE 8472

HEALTHCHECK --interval=30s --timeout=10s --start-period=180s --retries=5 \
  CMD curl -f http://localhost:8472/api/health || exit 1

ENTRYPOINT ["./entrypoint.sh"]
