import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const metricsSchema = z
  .array(z.string().min(1).max(50))
  .max(20, 'Up to 20 metrics per stall')
  .optional()

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().or(z.literal('')),
  icon: z.string().max(50).optional(),
  maxVolunteers: z.coerce.number().int().min(1).max(50).optional(),
  status: z.enum(['ACTIVE', 'MAINTENANCE', 'INACTIVE']).optional(),
  metrics: metricsSchema,
})

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role === 'VOLUNTEER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const result = updateSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
    }

    const data: any = { ...result.data }
    if (data.description === '') data.description = null
    if (Array.isArray(data.metrics)) {
      data.metrics = sanitizeMetrics(data.metrics)
    }

    const stall = await prisma.stall.update({
      where: { id },
      data,
    })

    return NextResponse.json({ stall })
  } catch (error) {
    console.error('Update stall error:', error)
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
    if (!id) {
      return NextResponse.json({ error: 'Stall id is required' }, { status: 400 })
    }

    const existing = await prisma.stall.findUnique({ where: { id }, select: { id: true } })
    if (!existing) {
      return NextResponse.json({ error: 'Stall not found' }, { status: 404 })
    }

    const eventCount = await prisma.event.count({
      where: { stalls: { some: { id } } },
    })
    if (eventCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete stall while it is assigned to ${eventCount} event${eventCount === 1 ? '' : 's'}. Remove it from the event first.` },
        { status: 409 }
      )
    }

    await prisma.stall.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete stall error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
