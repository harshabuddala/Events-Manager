import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || 'week'
    const days = range === 'month' ? 30 : range === 'all' ? 365 : 7
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const volunteer = await prisma.volunteer.findUnique({
      where: { email: session.email },
      select: { id: true },
    })
    if (!volunteer) {
      return NextResponse.json({
        performance: {
          totalEvaluations: 0,
          avgRating: 0,
          totalHours: 0,
          studentsPerHour: 0,
          ratingTrend: [],
          skillDistribution: { participation: 0, creativity: 0, problemSolving: 0, communication: 0, learningAbility: 0 },
          recentRatings: [],
        },
      })
    }

    const [totalEvaluations, avgAgg, recentPerf] = await Promise.all([
      prisma.performance.count({ where: { volunteerId: volunteer.id } }),
      prisma.performance.aggregate({
        where: { volunteerId: volunteer.id },
        _avg: { score: true, participation: true, creativity: true, problemSolving: true, communication: true, learningAbility: true },
      }),
      prisma.performance.findMany({
        where: { volunteerId: volunteer.id, createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          stallVisit: {
            include: {
              student: { select: { name: true } },
            },
          },
        },
      }),
    ])

    const recentRatings = recentPerf.slice(0, 10).map((p) => ({
      date: p.createdAt.toISOString(),
      rating: p.score,
      studentName: p.stallVisit?.student?.name ?? 'Unknown',
    }))

    const todayEvaluations = await prisma.performance.count({
      where: {
        volunteerId: volunteer.id,
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    })

    const ratingTrend = recentPerf
      .slice(0, 7)
      .reverse()
      .map((p) => p.score)

    const performance = {
      totalEvaluations,
      avgRating: Math.round((avgAgg._avg.score ?? 0) * 10) / 10,
      totalHours: Math.max(1, Math.round(todayEvaluations / 3)),
      studentsPerHour: todayEvaluations > 0 ? Math.round((todayEvaluations / 8) * 10) / 10 : 0,
      ratingTrend,
      skillDistribution: {
        participation: Math.round((avgAgg._avg.participation ?? 0) * 10) / 10,
        creativity: Math.round((avgAgg._avg.creativity ?? 0) * 10) / 10,
        problemSolving: Math.round((avgAgg._avg.problemSolving ?? 0) * 10) / 10,
        communication: Math.round((avgAgg._avg.communication ?? 0) * 10) / 10,
        learningAbility: Math.round((avgAgg._avg.learningAbility ?? 0) * 10) / 10,
      },
      recentRatings,
    }

    return NextResponse.json({ performance })
  } catch (error) {
    console.error('Volunteer performance API error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
