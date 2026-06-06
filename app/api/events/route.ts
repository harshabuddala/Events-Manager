import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { readJsonBody } from '@/lib/request'
import { z } from 'zod'

const eventStatusEnum = z.enum(['UPCOMING', 'LIVE', 'COMPLETED', 'CANCELLED'])

const createSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(200),
  communityId: z.string().uuid(),
  date: z.string().datetime(),
  endDate: z.string().datetime().optional().or(z.literal('')),
  status: eventStatusEnum.optional(),
  description: z.string().max(2000).optional().or(z.literal('')),
})

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  communityId: z.string().uuid().optional(),
  date: z.string().datetime().optional(),
  endDate: z.string().datetime().optional().or(z.literal('')),
  status: eventStatusEnum.optional(),
  description: z.string().max(2000).optional().or(z.literal('')),
})

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventIds = (await prisma.event.findMany({ select: { id: true } })).map((e) => e.id)
    const completedCounts = await prisma.registration.groupBy({
      by: ['eventId'],
      where: { eventId: { in: eventIds }, status: 'COMPLETED' },
      _count: { _all: true },
    })
    const completedMap = new Map(completedCounts.map((c) => [c.eventId, c._count._all]))

    const events = await prisma.event.findMany({
      include: {
        community: { select: { name: true, location: true } },
        organizer: { select: { name: true } },
        _count: { select: { registrations: true, stalls: true, assignments: true } },
      },
      orderBy: { date: 'desc' },
    })

    const result = events.map(e => {
      const totalRegs = e._count.registrations
      const completedRegs = completedMap.get(e.id) ?? 0
      const completion = totalRegs > 0 ? Math.round((completedRegs / totalRegs) * 100) : 0

      return {
        id: e.id,
        code: e.code,
        name: e.name,
        communityId: e.communityId,
        community: e.community.name,
        location: e.community.location,
        date: e.date,
        endDate: e.endDate,
        status: e.status,
        description: e.description,
        participants: totalRegs,
        stalls: e._count.stalls,
        volunteers: e._count.assignments,
        completion: completion,
        createdAt: e.createdAt,
      }
    })

    return NextResponse.json({ events: result })
  } catch (error) {
    console.error('Fetch events error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const parsed = await readJsonBody(request, createSchema)
    if (!parsed.ok) return parsed.response
    const result = parsed.data

    const existing = await prisma.event.findUnique({ where: { code: result.code } })
    if (existing) {
      return NextResponse.json({ error: 'Event code already exists' }, { status: 409 })
    }

    // Verify the session user still exists (defense against stale JWT after re-seed)
    const organizer = await prisma.user.findUnique({ where: { id: session.id }, select: { id: true } })
    if (!organizer) {
      return NextResponse.json({ error: 'Session invalid. Please log in again.' }, { status: 401 })
    }

    const event = await prisma.event.create({
      data: {
        code: result.code,
        name: result.name,
        communityId: result.communityId,
        date: result.date,
        endDate: result.endDate || null,
        description: result.description || null,
        organizerId: organizer.id,
        status: result.status || 'UPCOMING',
      },
    })

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    console.error('Create event error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
