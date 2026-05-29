import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Check if migrations table exists
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
    // _prisma_migrations table doesn't exist yet (migrations not run)
    return NextResponse.json({
      status: 'pending',
      message: 'Database migrations have not been run yet. Tables do not exist.',
      error: error instanceof Error ? error.message : 'Unknown error',
      migrations: [],
      totalMigrations: 0,
    }, { status: 503 })
  }
}

export async function POST() {
  // This endpoint is just for checking status
  // Actual migrations should be run via the entrypoint or manually
  return NextResponse.json({
    message: 'Migrations are run automatically on container startup. Check GET /api/migrate for status.',
  })
}
