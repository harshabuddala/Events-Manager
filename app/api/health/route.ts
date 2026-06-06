import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const checks: Record<string, string> = {}
  let healthy = true

  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = 'ok'
    checks.prisma = 'ok'
  } catch {
    checks.database = 'unavailable'
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
