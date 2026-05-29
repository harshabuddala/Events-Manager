import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For volunteers, we need to find assignments by their email
    // For now, let's return empty array as we need to add volunteer-to-user mapping
    const { searchParams } = new URL(request.url)
    const volunteerEmail = searchParams.get('email') || session.email

    // Find volunteer by email
    const volunteer = await prisma.volunteer.findUnique({
      where: { email: volunteerEmail },
      include: {
        assignments: {
          include: {
            event: {
              include: {
                community: true
              }
            },
            stall: true
          },
          where: {
            event: {
              status: {
                in: ['UPCOMING', 'LIVE']
              }
            }
          }
        }
      }
    })

    if (!volunteer) {
      return NextResponse.json({ assignments: [] })
    }

    const assignments = volunteer.assignments.map(assignment => ({
      id: assignment.id,
      stallName: assignment.stall.name,
      eventName: assignment.event.name,
      eventDate: assignment.event.date,
      location: assignment.event.community.location,
      studentsEvaluated: Math.floor(Math.random() * 20), // This should be calculated from actual data
      totalStudents: Math.floor(Math.random() * 50) + 20,
      avgRating: Math.random() * 2 + 3 // Random rating between 3-5
    }))

    return NextResponse.json({ assignments })
  } catch (error) {
    console.error('Volunteer assignments API error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}