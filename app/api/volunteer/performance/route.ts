import { NextRequest, NextResponse } from 'next/server'
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

    // Generate mock performance data based on range
    const multiplier = range === 'month' ? 4 : range === 'all' ? 12 : 1

    const performance = {
      totalEvaluations: Math.floor(Math.random() * 50 * multiplier) + 20,
      avgRating: Math.random() * 1.5 + 3.5, // Rating between 3.5-5
      totalHours: Math.floor(Math.random() * 20 * multiplier) + 10,
      studentsPerHour: Math.random() * 3 + 2, // Students per hour
      ratingTrend: Array.from({ length: 7 }, () => Math.random() * 2 + 3),
      skillDistribution: {
        participation: Math.random() * 3 + 7,
        creativity: Math.random() * 3 + 6,
        problemSolving: Math.random() * 3 + 7,
        communication: Math.random() * 3 + 6,
        learningAbility: Math.random() * 3 + 7
      },
      recentRatings: [
        {
          date: new Date().toISOString(),
          rating: Math.random() * 2 + 3,
          studentName: 'Aarav Sharma'
        },
        {
          date: new Date(Date.now() - 3600000).toISOString(),
          rating: Math.random() * 2 + 3,
          studentName: 'Diya Patel'
        },
        {
          date: new Date(Date.now() - 7200000).toISOString(),
          rating: Math.random() * 2 + 3,
          studentName: 'Rahul Kumar'
        }
      ]
    }

    return NextResponse.json({ performance })
  } catch (error) {
    console.error('Volunteer performance API error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}