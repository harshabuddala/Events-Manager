#!/bin/sh
set -e

echo "=========================================="
echo "  Edunura Events - Starting up"
echo "  $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "=========================================="

# ─── Wait for Database ───────────────────────────────────────────────────────
echo "[1/5] Waiting for PostgreSQL to be ready..."
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
echo "[2/5] Running database migrations..."
if node ./node_modules/prisma/build/index.js migrate deploy --schema=./prisma/schema.prisma 2>&1; then
  echo "  → Migrations applied successfully!"
  MIGRATION_STATUS="success"
else
  echo "  → WARNING: Migration failed. Attempting to continue..."
  echo "  → Check database connectivity and migration files."
  MIGRATION_STATUS="failed"
fi

# ─── Check Migration Status ──────────────────────────────────────────────────
echo "[3/5] Checking migration status..."
MIGRATION_COUNT=$(node -e "
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  pool.query(\"SELECT COUNT(*) FROM _prisma_migrations WHERE finished_at IS NOT NULL\")
    .then(r => { console.log(r.rows[0].count); pool.end(); process.exit(0); })
    .catch(() => { console.log(0); pool.end(); process.exit(0); });
" 2>/dev/null || echo "0")
echo "  → Applied migrations: $MIGRATION_COUNT"

# ─── Seed Database (only if users table is empty) ───────────────────────────
echo "[4/5] Checking if database needs seeding..."
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
  
  # Check if tsx is available (it should be in node_modules since we copy full node_modules)
  if [ -f "./node_modules/tsx/dist/cli.mjs" ]; then
    echo "  → Using tsx from node_modules..."
    if node ./node_modules/tsx/dist/cli.mjs prisma/seed.ts 2>&1; then
      echo "  → Seed completed successfully!"
      SEED_STATUS="success"
    else
      echo "  → WARNING: Seed script failed."
      SEED_STATUS="failed"
    fi
  else
    echo "  → WARNING: tsx not found in node_modules. Cannot run seed script."
    SEED_STATUS="failed"
  fi
else
  echo "  → Database already has $USER_COUNT user(s), skipping seed."
  SEED_STATUS="skipped"
fi

# ─── Print Credentials ──────────────────────────────────────────────────────
echo ""
echo "  ╔══════════════════════════════════════════════════════╗"
echo "  ║           DEFAULT ADMIN CREDENTIALS                  ║"
echo "  ╠══════════════════════════════════════════════════════╣"
echo "  ║  Email:    admin@edunura.com                         ║"
if [ -n "$ADMIN_PASSWORD" ]; then
  echo "  ║  Password: [set via ADMIN_PASSWORD env var]          ║"
else
  echo "  ║  Password: admin123                                  ║"
  echo "  ║  ⚠️  Change this immediately after first login!     ║"
fi
echo "  ╚══════════════════════════════════════════════════════╝"
echo ""

# ─── Print Status Summary ──────────────────────────────────────────────────
echo "  📊 STATUS SUMMARY:"
echo "     • Migrations: $MIGRATION_STATUS ($MIGRATION_COUNT migrations applied)"
echo "     • Seed:       $SEED_STATUS"
echo "     • Users:      $USER_COUNT"
echo ""

# ─── Validate Environment ───────────────────────────────────────────────────
echo "[5/5] Validating environment..."
if [ -z "$JWT_SECRET" ]; then
  echo "  → WARNING: JWT_SECRET is not set! Authentication will fail."
fi
if [ -z "$DATABASE_URL" ]; then
  echo "  → ERROR: DATABASE_URL is not set! Exiting."
  exit 1
fi

# ─── Start Application ──────────────────────────────────────────────────────
echo "=========================================="
echo "  Starting Next.js server on port ${PORT:-8472}..."
echo "  NODE_ENV=${NODE_ENV:-production}"
echo "=========================================="
exec node server.js
