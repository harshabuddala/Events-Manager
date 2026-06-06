import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

async function requireAdmin() {
  const session = await getSession()
  if (!session) {
    return { error: 'Unauthorized', status: 401 } as const
  }
  if (session.role !== 'ADMIN') {
    return { error: 'Admin access required', status: 403 } as const
  }
  return { session } as const
}

export async function GET() {
  const auth = await requireAdmin()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const migrations = await prisma.$queryRaw`
      SELECT migration_name, finished_at
      FROM _prisma_migrations
      ORDER BY finished_at DESC
      LIMIT 10
    `

    return NextResponse.json({
      status: 'ok',
      migrations: migrations || [],
      totalMigrations: Array.isArray(migrations) ? migrations.length : 0,
    })
  } catch (error) {
    // Log the full error server-side for debugging, but don't leak the raw
    // Prisma error message (which can include SQL, table names, and
    // connection details) to the client.
    console.error('Migrate status check failed:', error)
    return NextResponse.json({
      status: 'pending',
      message: 'Database migrations have not been run yet. Tables do not exist.',
      migrations: [],
      totalMigrations: 0,
    }, { status: 503 })
  }
}

export async function POST() {
  const auth = await requireAdmin()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  return NextResponse.json({
    message: 'Migrations are run automatically on container startup. Check GET /api/migrate for status.',
  })
}
