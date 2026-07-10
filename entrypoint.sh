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

# Regenerate Prisma client at runtime to guarantee schema/client alignment.
# This is cheap (<1s) and prevents stale client issues if the bundled client
# was generated against an older schema.
if [ -f "node_modules/prisma/build/index.js" ]; then
  echo "  → Regenerating Prisma client..."
  node ./node_modules/prisma/build/index.js generate --schema=./prisma/schema.prisma > /dev/null 2>&1 && \
    echo "  → Prisma client regenerated successfully!" || \
    echo "  → WARNING: Prisma client regeneration failed. Continuing with bundled client."
fi

echo "  → Pushing schema to database (prisma db push)..."
if node ./node_modules/prisma/build/index.js db push --schema=./prisma/schema.prisma --accept-data-loss 2>&1; then
  echo "  → Schema pushed successfully!"
  MIGRATION_STATUS="success"
else
  echo "  → WARNING: Schema push failed. Attempting to continue..."
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

# ─── Seed Database (only if events table is empty) ───────────────────────────
echo "[4/5] Checking if database needs seeding..."

# ─── Cleanup expired auth tokens ──────────────────────────────────────────────
echo "  → Cleaning up expired auth tokens..."
node -e "
  const { PrismaClient } = require('./generated/prisma/client');
  const { PrismaPg } = require('./node_modules/@prisma/adapter-pg');
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  prisma.authToken.deleteMany({ where: { expiresAt: { lt: new Date() } } })
    .then(r => { console.log('  → Removed ' + r.count + ' expired tokens'); return prisma.\$disconnect(); })
    .catch(err => { console.error('  → Token cleanup warning:', err.message); return prisma.\$disconnect(); })
    .finally(() => pool.end());
" 2>/dev/null || echo "  → Token cleanup skipped"

EVENT_COUNT=$(node -e "
  const { PrismaClient } = require('./generated/prisma/client');
  const { PrismaPg } = require('./node_modules/@prisma/adapter-pg');
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  prisma.event.count().then(c => { console.log(c); prisma.\$disconnect(); }).catch(() => { console.log(0); prisma.\$disconnect(); });
" 2>/dev/null || echo "0")

if [ "$EVENT_COUNT" = "0" ]; then
  echo "  → No events found in database, running seed..."
  
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
  echo "  → Database already has $EVENT_COUNT event(s), skipping seed."
  SEED_STATUS="skipped"
  
  if [ -n "$ADMIN_PASSWORD" ]; then
    echo "  → Syncing admin password from ADMIN_PASSWORD env var..."
    node -e "
      const { PrismaClient } = require('./generated/prisma/client');
      const { PrismaPg } = require('./node_modules/@prisma/adapter-pg');
      const { Pool } = require('pg');
      const { hash } = require('bcryptjs');
      
      async function syncPassword() {
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        const adapter = new PrismaPg(pool);
        const prisma = new PrismaClient({ adapter });
        
        try {
          const admin = await prisma.user.findUnique({ where: { email: 'admin@edunura.com' } });
          if (admin) {
            const hashedPassword = await hash(process.env.ADMIN_PASSWORD, 12);
            await prisma.user.update({
              where: { email: 'admin@edunura.com' },
              data: { password: hashedPassword }
            });
            console.log('  → Admin password synced successfully!');
          } else {
            console.log('  → Admin user not found, skipping password sync.');
          }
        } catch (err) {
          console.error('  → WARNING: Failed to sync admin password:', err.message);
        } finally {
          await prisma.\$disconnect();
          await pool.end();
        }
      }
      
      syncPassword();
    " 2>&1
  fi
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
  echo "  ║  Password: [auto-generated - check seed output]      ║"
  echo "  ║  ⚠️  Set ADMIN_PASSWORD env var for next deploy!    ║"
fi
echo "  ╚══════════════════════════════════════════════════════╝"
echo ""
 
# ─── Print Status Summary ──────────────────────────────────────────────────
echo "  📊 STATUS SUMMARY:"
echo "     • Migrations: $MIGRATION_STATUS ($MIGRATION_COUNT migrations applied)"
echo "     • Seed:       $SEED_STATUS"
echo "     • Events:      $EVENT_COUNT"
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
