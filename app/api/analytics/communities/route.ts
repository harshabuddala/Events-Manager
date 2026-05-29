import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const communities = await prisma.community.findMany({
      include: {
        events: {
          include: {
            _count: { select: { registrations: true } },
          },
        },
      },
    })

    const communityRankings = communities
      .map(c => {
        const totalParticipants = c.events.reduce((sum, e) => sum + e._count.registrations, 0)
        const score = totalParticipants > 0
          ? Math.min(99, Math.round(70 + (totalParticipants / 10) * 10))
          : 0
        return { id: c.id, name: c.name, participants: totalParticipants, score }
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
