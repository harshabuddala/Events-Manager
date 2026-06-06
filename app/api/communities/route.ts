import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const communityStatusEnum = z.enum(['ACTIVE', 'UPCOMING', 'INACTIVE'])

const createSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(200),
  location: z.string().min(1).max(200),
  zone: z.string().max(50).optional(),
  status: communityStatusEnum.optional(),
  contactPerson: z.string().min(1).max(100),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().max(30).optional().or(z.literal('')),
  description: z.string().max(2000).optional().or(z.literal('')),
})

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  location: z.string().min(1).max(200).optional(),
  zone: z.string().max(50).optional(),
  status: communityStatusEnum.optional(),
  contactPerson: z.string().min(1).max(100).optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().max(30).optional().or(z.literal('')),
  description: z.string().max(2000).optional().or(z.literal('')),
})

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const communities = await prisma.community.findMany({
      include: {
        _count: { select: { events: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const result = communities.map(c => ({
      id: c.id,
      code: c.code,
      name: c.name,
      location: c.location,
      zone: c.zone,
      status: c.status,
      contactPerson: c.contactPerson,
      contactEmail: c.contactEmail,
      contactPhone: c.contactPhone,
      description: c.description,
      eventsHosted: c._count.events,
      createdAt: c.createdAt,
    }))

    return NextResponse.json({ communities: result })
  } catch (error) {
    console.error('Fetch communities error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const result = createSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
    }

    const existing = await prisma.community.findUnique({ where: { code: result.data.code } })
    if (existing) {
      return NextResponse.json({ error: 'Community code already exists' }, { status: 409 })
    }

    const community = await prisma.community.create({
      data: result.data,
    })

    return NextResponse.json({ community }, { status: 201 })
  } catch (error) {
    console.error('Create community error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
