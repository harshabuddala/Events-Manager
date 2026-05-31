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
    const volunteerEmail = searchParams.get('email') || session.email

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

    const assignments = await Promise.all(
      volunteer.assignments.map(async (assignment) => {
        const [studentsEvaluated, totalStudents, avgResult] = await Promise.all([
          prisma.performance.count({
            where: {
              volunteerId: volunteer.id,
              stallVisit: {
                stallId: assignment.stallId,
                registration: { eventId: assignment.eventId },
              },
            },
          }),
          prisma.registration.count({
            where: { eventId: assignment.eventId },
          }),
          prisma.performance.aggregate({
            where: {
              volunteerId: volunteer.id,
              stallVisit: {
                stallId: assignment.stallId,
                registration: { eventId: assignment.eventId },
              },
            },
            _avg: { score: true },
          }),
        ])

        return {
          id: assignment.id,
          stallName: assignment.stall.name,
          eventName: assignment.event.name,
          eventDate: assignment.event.date,
          location: assignment.event.community.location,
          studentsEvaluated,
          totalStudents,
          avgRating: Math.round((avgResult._avg.score || 0) * 10) / 10,
        }
      })
    )

    return NextResponse.json({ assignments })
  } catch (error) {
    console.error('Volunteer assignments API error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
