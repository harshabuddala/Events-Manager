import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find volunteer by email (volunteers are linked to users by email)
    const volunteer = await prisma.volunteer.findUnique({
      where: { email: session.email },
    })

    if (!volunteer) {
      return NextResponse.json({ error: 'Volunteer not found' }, { status: 404 })
    }

    // Format response to match what the frontend expects
    const formattedVolunteer = {
      id: volunteer.id,
      name: volunteer.name,
      email: volunteer.email,
      phoneNumber: volunteer.phoneNumber || '',
      role: volunteer.role,
      totalEvents: volunteer.totalEvents,
      rating: volunteer.rating || 0,
      status: volunteer.status,
      joinedAt: volunteer.createdAt.toISOString(),
      bio: '', // Bio field doesn't exist in schema, default to empty
      preferences: {
        preferredStall: volunteer.preferredStall || '',
        availability: 'Full-time', // Default since field doesn't exist in schema
        notifications: true, // Default
      },
    }

    return NextResponse.json({ volunteer: formattedVolunteer })
  } catch (error) {
    console.error('Volunteer me API error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}