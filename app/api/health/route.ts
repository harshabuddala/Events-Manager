import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const checks: Record<string, string> = {}
  let healthy = true

  // Database check
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = 'ok'
  } catch {
    checks.database = 'unavailable'
    healthy = false
  }

  // Prisma engine check
  try {
    await prisma.$connect()
    checks.prisma = 'ok'
  } catch {
    checks.prisma = 'unavailable'
    healthy = false
  }

  return NextResponse.json(
    {
      status: healthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
      uptime: process.uptime(),
    },
    { status: healthy ? 200 : 503 }
  )
}
