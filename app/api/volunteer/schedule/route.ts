import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(_request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const volunteer = await prisma.volunteer.findUnique({
      where: { email: session.email },
      include: {
        assignments: {
          include: {
            event: {
              select: {
                id: true,
                name: true,
                date: true,
                endDate: true,
                status: true,
                community: { select: { name: true, location: true } },
              },
            },
            stall: { select: { id: true, name: true } },
          },
        },
      },
    })

    if (!volunteer) {
      return NextResponse.json({ schedule: [] })
    }

    const now = new Date()
    const schedule = volunteer.assignments
      .map((a) => {
        const event = a.event
        const eventDate = new Date(event.date)
        const endDate = event.endDate ? new Date(event.endDate) : null
        const isFuture = eventDate.getTime() > now.getTime()
        const isOngoing = eventDate.getTime() <= now.getTime() && (endDate ? endDate.getTime() >= now.getTime() : eventDate.getDate() === now.getDate())

        let status: 'upcoming' | 'ongoing' | 'completed' = 'upcoming'
        if (event.status === 'COMPLETED' || (!isFuture && !isOngoing)) status = 'completed'
        else if (event.status === 'LIVE' || isOngoing) status = 'ongoing'
        else if (event.status === 'CANCELLED') return null

        return {
          id: a.id,
          eventName: event.name,
          stallName: a.stall.name,
          location: event.community.location,
          date: event.date.toISOString(),
          endDate: event.endDate?.toISOString() ?? null,
          startTime: '09:00 AM',
          endTime: '06:00 PM',
          status,
          studentsRegistered: 0,
        }
      })
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return NextResponse.json({ schedule })
  } catch (error) {
    console.error('Volunteer schedule API error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
