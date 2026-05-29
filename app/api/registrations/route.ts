import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: any = {}
    if (status && status !== 'ALL') {
      where.status = status
    }
    if (search) {
      where.OR = [
        { registrationCode: { contains: search, mode: 'insensitive' } },
        { student: { name: { contains: search, mode: 'insensitive' } } },
        { student: { rollNumber: { contains: search, mode: 'insensitive' } } },
        { event: { name: { contains: search, mode: 'insensitive' } } },
        { event: { community: { name: { contains: search, mode: 'insensitive' } } } },
      ]
    }

    // Volunteers can only see registrations for events they are assigned to
    if (session.role === 'VOLUNTEER' || session.role === 'LEAD_EVALUATOR' || session.role === 'COORDINATOR') {
      const volunteer = await prisma.volunteer.findUnique({
        where: { email: session.email },
        include: { assignments: { select: { eventId: true } } },
      })
      if (volunteer) {
        const eventIds = volunteer.assignments.map(a => a.eventId)
        where.eventId = { in: eventIds }
      } else {
        return NextResponse.json({ registrations: [] })
      }
    }

    const registrations = await prisma.registration.findMany({
      where,
      include: {
        student: {
          select: { id: true, rollNumber: true, name: true, grade: true, age: true, email: true, parentName: true, phoneNumber: true }
        },
        event: {
          select: { id: true, name: true, date: true, status: true, community: { select: { name: true } } }
        },
        stallVisits: {
          include: {
            stall: { select: { id: true, name: true } },
            performance: { select: { id: true } },
          },
        },
      },
      orderBy: { registeredAt: 'desc' },
    })

    // Transform to include stall counts
    const transformed = registrations.map(reg => ({
      ...reg,
      stallsVisited: reg.stallVisits.filter(sv => sv.performance).length,
      totalStalls: reg.stallVisits.length,
      event: reg.event,
      community: reg.event.community.name,
    }))

    return NextResponse.json({ registrations: transformed })
  } catch (error) {
    console.error('Registrations API error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.role !== 'ADMIN' && session.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { registrationId } = body

    if (!registrationId || typeof registrationId !== 'string') {
      return NextResponse.json({ error: 'registrationId is required' }, { status: 400 })
    }

    const registration = await prisma.registration.findFirst({
      where: { id: registrationId },
      include: { stallVisits: true },
    })

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      const stallVisitIds = registration.stallVisits.map(sv => sv.id)
      if (stallVisitIds.length > 0) {
        await tx.performance.deleteMany({ where: { stallVisitId: { in: stallVisitIds } } })
        await tx.stallVisit.deleteMany({ where: { id: { in: stallVisitIds } } })
      }
      await tx.registration.delete({ where: { id: registrationId } })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete registration error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
