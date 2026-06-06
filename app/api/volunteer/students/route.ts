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
    const stallId = searchParams.get('stallId')
    const eventId = searchParams.get('eventId')

    const volunteer = await prisma.volunteer.findUnique({
      where: { email: session.email },
      select: { id: true, assignments: { select: { stallId: true, eventId: true } } },
    })
    if (!volunteer) {
      return NextResponse.json({ students: [] })
    }

    const allowedStallIds = Array.from(new Set(volunteer.assignments.map((a) => a.stallId)))
    const allowedEventIds = Array.from(new Set(volunteer.assignments.map((a) => a.eventId)))

    if (allowedStallIds.length === 0) {
      return NextResponse.json({ students: [] })
    }

    const targetStallId = stallId && allowedStallIds.includes(stallId) ? stallId : allowedStallIds[0]
    const targetEventId = eventId && allowedEventIds.includes(eventId) ? eventId : allowedEventIds[0]

    const registrations = await prisma.registration.findMany({
      where: {
        eventId: targetEventId,
        stallVisits: {
          some: { stallId: targetStallId },
        },
      },
      include: {
        student: {
          select: { id: true, name: true, rollNumber: true, grade: true },
        },
        stallVisits: {
          where: { stallId: targetStallId },
          include: {
            performance: { select: { score: true, grade: true, updatedAt: true } },
          },
        },
      },
      orderBy: { registeredAt: 'desc' },
      take: 50,
    })

    const students = registrations.map((reg) => {
      const visit = reg.stallVisits[0]
      const perf = visit?.performance
      return {
        id: reg.id,
        registrationId: reg.id,
        name: reg.student.name,
        rollNumber: reg.student.rollNumber,
        grade: reg.student.grade,
        stallName: '',
        visitTime: (visit?.visitedAt ?? reg.registeredAt).toISOString(),
        status: perf ? 'completed' : 'pending',
        score: perf?.score ?? null,
        evaluationGrade: perf?.grade ?? null,
      }
    })

    return NextResponse.json({ students })
  } catch (error) {
    console.error('Volunteer students API error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
