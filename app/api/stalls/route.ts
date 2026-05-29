import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const stallStatusEnum = z.enum(['ACTIVE', 'MAINTENANCE', 'INACTIVE'])

const createSchema = z.object({
  name: z.string().min(1).max(200),
})

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().or(z.literal('')),
  icon: z.string().max(50).optional(),
  maxVolunteers: z.coerce.number().int().min(1).max(50).optional(),
  status: stallStatusEnum.optional(),
})

function generateCode(name: string): string {
  const prefix = 'ST'
  const suffix = name
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase())
    .join('')
    .slice(0, 5)
  const random = Math.floor(Math.random() * 900) + 100
  return `${prefix}-${suffix}${random}`
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stalls = await prisma.stall.findMany({
      include: {
        _count: { select: { stallVisits: true, assignments: true, events: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const result = stalls.map(s => ({
      id: s.id,
      code: s.code,
      name: s.name,
      description: s.description,
      icon: s.icon,
      maxVolunteers: s.maxVolunteers,
      status: s.status,
      eventCount: s._count.events,
      totalVisits: s._count.stallVisits,
      assignedVolunteers: s._count.assignments,
      createdAt: s.createdAt,
    }))

    return NextResponse.json({ stalls: result })
  } catch (error) {
    console.error('Fetch stalls error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role === 'VOLUNTEER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const result = createSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
    }

    const trimmedName = result.data.name.trim()
    const code = generateCode(trimmedName)

    let uniqueCode = code
    let attempts = 0
    while (await prisma.stall.findUnique({ where: { code: uniqueCode } }) && attempts < 10) {
      uniqueCode = generateCode(trimmedName)
      attempts++
    }

    const stall = await prisma.stall.create({
      data: {
        code: uniqueCode,
        name: trimmedName,
        description: 'Educational activity stall',
        icon: 'Star',
        maxVolunteers: 5,
        status: 'ACTIVE',
      },
    })

    return NextResponse.json({ stall }, { status: 201 })
  } catch (error) {
    console.error('Create stall error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
