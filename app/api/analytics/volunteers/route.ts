import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const volunteers = await prisma.volunteer.findMany({
      select: { name: true, rating: true, totalEvents: true },
    })

    const buckets: Record<string, number> = {
      '5 Stars': 0,
      '4 Stars': 0,
      '3 Stars': 0,
      '1-2 Stars': 0,
    }

    volunteers.forEach(v => {
      if (v.rating == null) return
      if (v.rating >= 4.8) buckets['5 Stars']++
      else if (v.rating >= 4.0) buckets['4 Stars']++
      else if (v.rating >= 3.0) buckets['3 Stars']++
      else buckets['1-2 Stars']++
    })

    const fills: Record<string, string> = {
      '5 Stars': '#10b981',
      '4 Stars': '#8b5cf6',
      '3 Stars': '#f59e0b',
      '1-2 Stars': '#ef4444',
    }

    const ratingsDistribution = Object.entries(buckets).map(([rating, count]) => ({
      rating,
      count,
      fill: fills[rating],
    }))

    const workloadVsRating = volunteers
      .filter(v => v.rating != null)
      .map(v => ({
        name: v.name.split(' ')[0] + ' ' + v.name.split(' ')[1]?.charAt(0) + '.' || v.name,
        workload: v.totalEvents,
        rating: v.rating,
      }))

    return NextResponse.json({ ratingsDistribution, workloadVsRating })
  } catch (error) {
    console.error('Analytics volunteers error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
