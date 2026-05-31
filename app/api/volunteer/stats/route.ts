import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const volunteer = await prisma.volunteer.findUnique({ where: { email: session.email } })
    if (!volunteer) {
      return NextResponse.json({
        stats: { todayEvaluations: 0, totalEvaluations: 0, assignedStalls: 0, avgRating: 0, hoursWorked: 0 },
        recentActivity: [],
      })
    }

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const [todayEvaluations, totalEvaluations, assignedStalls, avgResult, recentPerformances] = await Promise.all([
      prisma.performance.count({
        where: { volunteerId: volunteer.id, createdAt: { gte: todayStart } },
      }),
      prisma.performance.count({
        where: { volunteerId: volunteer.id },
      }),
      prisma.volunteerAssignment.count({
        where: {
          volunteerId: volunteer.id,
          event: { status: { in: ['UPCOMING', 'LIVE'] } },
        },
      }),
      prisma.performance.aggregate({
        where: { volunteerId: volunteer.id },
        _avg: { score: true },
      }),
      prisma.performance.findMany({
        where: { volunteerId: volunteer.id },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          stallVisit: {
            include: {
              student: { select: { rollNumber: true } },
              stall: { select: { name: true } },
            },
          },
        },
      }),
    ])

    const stats = {
      todayEvaluations,
      totalEvaluations,
      assignedStalls,
      avgRating: Math.round((avgResult._avg.score || 0) * 10) / 10,
      hoursWorked: todayEvaluations > 0 ? Math.ceil(todayEvaluations / 3) : 0,
    }

    const recentActivity = recentPerformances.map((p) => ({
      id: p.id,
      studentRoll: p.stallVisit?.student?.rollNumber || 'Unknown',
      stallName: p.stallVisit?.stall?.name || 'Unknown',
      score: p.score,
      time: formatTimeAgo(p.createdAt),
    }))

    return NextResponse.json({ stats, recentActivity })
  } catch (error) {
    console.error('Volunteer stats API error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`
  return `${Math.floor(diff / 86400)} day ago`
}
