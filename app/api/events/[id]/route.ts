import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { readJsonBody } from '@/lib/request'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  communityId: z.string().uuid().optional(),
  date: z.string().datetime().optional(),
  endDate: z.string().datetime().optional().or(z.literal('')),
  status: z.enum(['UPCOMING', 'LIVE', 'COMPLETED', 'CANCELLED']).optional(),
  description: z.string().max(2000).optional().or(z.literal('')),
  isPublicRegistrationEnabled: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        community: { select: { name: true, location: true } },
        organizer: { select: { name: true } },
        stalls: { select: { id: true, code: true, name: true, status: true, metrics: true } },
        assignments: {
          include: {
            volunteer: { select: { id: true, name: true, role: true, status: true } },
            stall: { select: { id: true, name: true } },
          },
        },
        _count: { select: { registrations: true } },
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    return NextResponse.json({ event })
  } catch (error) {
    console.error('Fetch event error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const parsed = await readJsonBody(request, updateSchema)
    if (!parsed.ok) return parsed.response
    const result = parsed.data

    const data: any = { ...result }
    if (data.endDate === '') data.endDate = null
    if (data.date) data.date = new Date(data.date)
    if (data.endDate) data.endDate = new Date(data.endDate)

    const event = await prisma.event.update({
      where: { id },
      data,
    })

    return NextResponse.json({ event })
  } catch (error) {
    console.error('Update event error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const regCount = await prisma.registration.count({ where: { eventId: id } })
    if (regCount > 0) {
      return NextResponse.json({ error: 'Cannot delete event with registrations' }, { status: 400 })
    }

    await prisma.event.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete event error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
