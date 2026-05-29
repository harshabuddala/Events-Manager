#!/bin/sh
set -e

echo "=========================================="
echo "  Edunura Events - Starting up"
echo "  $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "=========================================="

# ─── Wait for Database ───────────────────────────────────────────────────────
echo "[1/4] Waiting for PostgreSQL to be ready..."
RETRIES=30
COUNT=0
until node -e "
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  pool.query('SELECT 1').then(() => { pool.end(); process.exit(0); }).catch(() => { pool.end(); process.exit(1); });
" 2>/dev/null; do
  COUNT=$((COUNT + 1))
  if [ $COUNT -ge $RETRIES ]; then
    echo "  → ERROR: Database not ready after $RETRIES attempts. Exiting."
    exit 1
  fi
  echo "  → Database not ready, retrying in 2s... ($COUNT/$RETRIES)"
  sleep 2
done
echo "  → Database is ready!"

# ─── Run Prisma Migrations ──────────────────────────────────────────────────
echo "[2/4] Running database migrations..."
if node ./node_modules/prisma/build/index.js migrate deploy --schema=./prisma/schema.prisma; then
  echo "  → Migrations applied successfully!"
else
  echo "  → WARNING: Migration failed. Attempting to continue..."
  echo "  → Check database connectivity and migration files."
fi

# ─── Seed Database (only if users table is empty) ───────────────────────────
echo "[3/4] Checking if database needs seeding..."
USER_COUNT=$(node -e "
  const { PrismaClient } = require('./generated/prisma/client');
  const { PrismaPg } = require('./node_modules/@prisma/adapter-pg');
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  prisma.user.count().then(c => { console.log(c); prisma.\$disconnect(); }).catch(() => { console.log(0); prisma.\$disconnect(); });
" 2>/dev/null || echo "0")

if [ "$USER_COUNT" = "0" ]; then
  echo "  → Database is empty, running seed..."
  if node ./node_modules/prisma/build/index.js db seed --schema=./prisma/schema.prisma; then
    echo "  → Seed completed!"
  else
    echo "  → WARNING: Seed failed. You may need to seed manually."
  fi
else
  echo "  → Database already has $USER_COUNT user(s), skipping seed."
fi

# ─── Validate Environment ───────────────────────────────────────────────────
echo "  → Validating environment..."
if [ -z "$JWT_SECRET" ]; then
  echo "  → WARNING: JWT_SECRET is not set! Authentication will fail."
fi
if [ -z "$DATABASE_URL" ]; then
  echo "  → ERROR: DATABASE_URL is not set! Exiting."
  exit 1
fi

# ─── Start Application ──────────────────────────────────────────────────────
echo "[4/4] Starting Next.js server on port ${PORT:-8472}..."
echo "  → NODE_ENV=${NODE_ENV:-production}"
echo "=========================================="
exec node server.js
