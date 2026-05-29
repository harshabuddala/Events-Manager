import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, return mock stats
    // In production, this would be calculated from actual performance data
    const stats = {
      todayEvaluations: Math.floor(Math.random() * 15) + 5,
      totalEvaluations: Math.floor(Math.random() * 200) + 100,
      assignedStalls: Math.floor(Math.random() * 3) + 1,
      avgRating: Math.random() * 1 + 4, // Rating between 4-5
      hoursWorked: Math.floor(Math.random() * 4) + 2
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Volunteer stats API error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}