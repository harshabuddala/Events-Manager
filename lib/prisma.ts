import { PrismaClient } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prisma2: PrismaClient | undefined
  pgPool: Pool | undefined
}

function createPrismaClient() {
  const pool = globalForPrisma.pgPool ?? new Pool({
    connectionString: process.env.DATABASE_URL!,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  })

  if (!globalForPrisma.pgPool) {
    globalForPrisma.pgPool = pool
  }

  const adapter = new PrismaPg(pool)
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'production'
      ? [{ level: 'error', emit: 'event' }]
      : [],
  })
}

export const prisma = globalForPrisma.prisma2 ?? createPrismaClient()

if (!globalForPrisma.prisma2) {
  globalForPrisma.prisma2 = prisma
}
