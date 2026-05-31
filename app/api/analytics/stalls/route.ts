import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const stalls = await prisma.stall.findMany({
      include: {
        _count: { select: { stallVisits: true } },
        stallVisits: { select: { completedAt: true } },
      },
    })

    const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#64748b', '#06b6d4', '#f97316']

    const stallTraffic = stalls.map((s, idx) => ({
      name: s.name,
      visits: s._count.stallVisits,
      fill: colors[idx % colors.length],
    })).sort((a, b) => b.visits - a.visits)

    const stallsWithPerf = await prisma.stall.findMany({
      include: {
        stallVisits: { include: { performance: true } },
      },
    })

    const stallEngagement = stallsWithPerf.map(s => {
      const totalVisits = s.stallVisits.length
      const completed = s.stallVisits.filter(v => v.completedAt != null).length
      const scores = s.stallVisits.map(v => v.performance?.score).filter((score): score is number => score != null)
      const avgScore = scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
        : 0
      const completionRate = totalVisits > 0 ? Math.round((completed / totalVisits) * 100) : 0
      return { name: s.name, avgTime: avgScore * 2, completions: completionRate }
    }).filter(s => s.avgTime > 0 || s.completions > 0)

    return NextResponse.json({ stallTraffic, stallEngagement })
  } catch (error) {
    console.error('Analytics stalls error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
