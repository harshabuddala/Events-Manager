import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const communities = await prisma.community.findMany({
      include: {
        events: {
          include: {
            registrations: {
              include: {
                student: { select: { id: true, name: true } },
                stallVisits: {
                  include: {
                    performance: { select: { score: true } },
                  },
                },
              },
            },
            _count: { select: { registrations: true } },
          },
        },
      },
    })

    const communityRankings = communities
      .map(c => {
        const allRegistrations = c.events.flatMap(e => e.registrations)
        const totalParticipants = allRegistrations.length
        
        if (totalParticipants === 0) {
          return { id: c.id, name: c.name, participants: 0, score: 0 }
        }

        const completed = allRegistrations.filter(r => r.status === 'COMPLETED').length
        const completionRate = Math.round((completed / totalParticipants) * 100)

        const allScores: number[] = []
        allRegistrations.forEach(r => {
          r.stallVisits.forEach(v => {
            if (v.performance?.score != null) allScores.push(v.performance.score)
          })
        })

        const avgScore = allScores.length > 0
          ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10)
          : 0

        const score = Math.round((completionRate * 0.6) + (avgScore * 0.4))

        return { id: c.id, name: c.name, participants: totalParticipants, score, completed }
      })
      .sort((a, b) => b.score - a.score)
      .map((c, idx) => ({ ...c, rank: idx + 1 }))

    const top3Ids = communityRankings.slice(0, 3).map(c => c.id)
    const registrations = await prisma.registration.findMany({
      where: { event: { communityId: { in: top3Ids } } },
      include: {
        event: { select: { communityId: true, community: { select: { name: true } } } },
      },
      orderBy: { registeredAt: 'asc' },
    })

    const trendMap = new Map<string, Record<string, number>>()
    registrations.forEach(r => {
      const date = r.registeredAt.toISOString().split('T')[0]
      const commName = r.event.community.name.split(' ')[0]
      if (!trendMap.has(date)) trendMap.set(date, {})
      const day = trendMap.get(date)!
      day[commName] = (day[commName] || 0) + 1
    })

    const participationTrends = Array.from(trendMap.entries()).map(([date, counts]) => ({
      date: date.slice(5),
      ...counts,
    }))

    return NextResponse.json({ communityRankings, participationTrends })
  } catch (error) {
    console.error('Analytics communities error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
