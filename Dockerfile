# =============================================================================
# Multi-stage Dockerfile for Edunura Events (Next.js 15 + Prisma)
# BuildKit cache mounts used for fast repeated builds.
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Install OS deps + npm packages
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

COPY package.json package-lock.json ./

# BuildKit cache mount: persists npm download cache between builds
# After the first build, npm ci goes from ~2 min → ~15 sec
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline

# ---------------------------------------------------------------------------
# Stage 2: Generate Prisma client + build Next.js
# ---------------------------------------------------------------------------
FROM node:22-alpine AS builder
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    cairo \
    pango \
    libjpeg-turbo \
    giflib \
    librsvg
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Generate Prisma Client (no real DB needed — dummy URL satisfies config)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN node ./node_modules/prisma/build/index.js generate --schema=./prisma/schema.prisma

# Copy app source after Prisma generate to maximize cache hits
COPY next.config.ts tsconfig.json postcss.config.mjs eslint.config.mjs global.d.ts ./
COPY app ./app/
COPY lib ./lib/
COPY hooks ./hooks/
COPY middleware.ts ./
COPY entrypoint.sh ./
COPY public ./public/

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Next.js build cache persists between builds — only changed modules recompile
RUN --mount=type=cache,target=/app/.next/cache \
    node ./node_modules/next/dist/bin/next build

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

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/generated/prisma ./generated/prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/entrypoint.sh ./entrypoint.sh

RUN chmod +x ./entrypoint.sh && \
    mkdir -p /app/uploads && \
    chown -R nextjs:nodejs /app/uploads

USER nextjs

EXPOSE 8472

HEALTHCHECK --interval=30s --timeout=10s --start-period=180s --retries=5 \
  CMD curl -f http://localhost:8472/api/health || exit 1

ENTRYPOINT ["./entrypoint.sh"]
