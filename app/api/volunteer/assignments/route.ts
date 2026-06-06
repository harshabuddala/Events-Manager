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
    const requestedEmail = searchParams.get('email')

    // Only ADMIN/MANAGER may look up another volunteer's assignments.
    // Volunteers can only see their own.
    const isStaff = session.role === 'ADMIN' || session.role === 'MANAGER'
    const volunteerEmail = isStaff && requestedEmail ? requestedEmail : session.email

    const volunteer = await prisma.volunteer.findUnique({
      where: { email: volunteerEmail },
      include: {
        assignments: {
          include: {
            event: { include: { community: true } },
            stall: true,
          },
          where: {
            event: { status: { in: ['UPCOMING', 'LIVE'] } },
          },
        },
      },
    })

    if (!volunteer) {
      return NextResponse.json({ assignments: [] })
    }

    const eventIds = volunteer.assignments.map((a) => a.eventId)

    // One groupBy over all the volunteer's performances (keyed by eventId+stallId)
    // replaces 2*N queries that ran in the original per-assignment loop.
    const [perfStats, eventRegCounts] = await Promise.all([
      prisma.performance.groupBy({
        by: ['stallVisitId'],
        where: { volunteerId: volunteer.id },
        _avg: { score: true },
        _count: { _all: true },
      }).then(async (rows) => {
        // We need the stallVisit.registration.eventId + stallVisit.stallId to
        // map back to each assignment. Fetch the related stallVisits in one
        // query.
        const stallVisitIds = rows.map((r) => (r as { stallVisitId: string }).stallVisitId)
        const stallVisits = await prisma.stallVisit.findMany({
          where: { id: { in: stallVisitIds } },
          select: { id: true, stallId: true, registration: { select: { eventId: true } } },
        })
        const map = new Map<string, { eventId: string; stallId: string; avgScore: number; count: number }>()
        for (const sv of stallVisits) {
          const row = rows.find((r) => (r as { stallVisitId: string }).stallVisitId === sv.id)
          if (!row) continue
          map.set(`${sv.registration.eventId}::${sv.stallId}`, {
            eventId: sv.registration.eventId,
            stallId: sv.stallId,
            avgScore: (row._avg.score || 0),
            count: row._count._all,
          })
        }
        return map
      }),
      prisma.registration.groupBy({
        by: ['eventId'],
        where: { eventId: { in: eventIds } },
        _count: { _all: true },
      }).then((rows) => new Map(rows.map((r) => [r.eventId, r._count._all]))),
    ])

    const assignments = volunteer.assignments.map((assignment) => {
      const stat = perfStats.get(`${assignment.eventId}::${assignment.stallId}`)
      const totalStudents = eventRegCounts.get(assignment.eventId) || 0
      return {
        id: assignment.id,
        stallName: assignment.stall.name,
        eventName: assignment.event.name,
        eventDate: assignment.event.date,
        location: assignment.event.community.location,
        studentsEvaluated: stat?.count ?? 0,
        totalStudents,
        avgRating: Math.round((stat?.avgScore ?? 0) * 10) / 10,
      }
    })

    return NextResponse.json({ assignments })
  } catch (error) {
    console.error('Volunteer assignments API error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
