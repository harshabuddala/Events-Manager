import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Mock schedule data
    const schedule = [
      {
        id: '1',
        eventName: 'Spring Learning Festival',
        stallName: 'Science Lab',
        location: 'Greenwood Community Center',
        date: new Date().toISOString(),
        startTime: '09:00 AM',
        endTime: '02:00 PM',
        status: 'ongoing' as const,
        studentsRegistered: 45
      },
      {
        id: '2',
        eventName: 'Summer Science Camp',
        stallName: 'Math Corner',
        location: 'Riverside Apartments',
        date: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days from now
        startTime: '10:00 AM',
        endTime: '03:00 PM',
        status: 'upcoming' as const,
        studentsRegistered: 32
      },
      {
        id: '3',
        eventName: 'Back to School Event',
        stallName: 'Art Station',
        location: 'Oakwood Community',
        date: new Date(Date.now() - 86400000 * 7).toISOString(), // 1 week ago
        startTime: '09:00 AM',
        endTime: '01:00 PM',
        status: 'completed' as const,
        studentsRegistered: 38
      }
    ]

    return NextResponse.json({ schedule })
  } catch (error) {
    console.error('Volunteer schedule API error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}