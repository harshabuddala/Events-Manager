import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { readJsonBody } from '@/lib/request'
import { z } from 'zod'

const stallStatusEnum = z.enum(['ACTIVE', 'MAINTENANCE', 'INACTIVE'])

const metricsSchema = z
  .array(z.string().min(1).max(50))
  .max(20, 'Up to 20 metrics per stall')
  .optional()

const createSchema = z.object({
  name: z.string().min(1).max(200),
  metrics: metricsSchema,
})

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().or(z.literal('')),
  icon: z.string().max(50).optional(),
  maxVolunteers: z.coerce.number().int().min(1).max(50).optional(),
  status: stallStatusEnum.optional(),
  metrics: metricsSchema,
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
      metrics: s.metrics ?? [],
      eventCount: s._count.events,
      totalVisits: s._count.stallVisits,
      assignedVolunteers: s._count.assignments,
      createdAt: s.createdAt,
    }))

    return NextResponse.json({ stalls: result })
  } catch (error) {
    console.error('Fetch stalls error:', error)
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

    const trimmedName = result.name.trim()
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
        metrics: result.metrics ? sanitizeMetrics(result.metrics) : [],
      },
    })

    return NextResponse.json({ stall }, { status: 201 })
  } catch (error) {
    console.error('Create stall error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function sanitizeMetrics(metrics: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of metrics) {
    const cleaned = raw.trim()
    if (!cleaned) continue
    const key = cleaned.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(cleaned)
  }
  return out
}
