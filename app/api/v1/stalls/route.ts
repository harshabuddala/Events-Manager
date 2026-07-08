import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withApiKey } from '@/lib/api-auth'
import { apiCreated, apiError, apiPaginated } from '@/lib/api-response'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  icon: z.string().max(50).optional(),
  maxVolunteers: z.number().int().min(1).max(50).optional(),
  status: z.enum(['ACTIVE', 'MAINTENANCE', 'INACTIVE']).optional(),
  metrics: z.array(z.string().min(1).max(50)).max(20).optional(),
})

export const GET = withApiKey(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))
  const status = searchParams.get('status')
  const q = searchParams.get('q')

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (q) where.name = { contains: q, mode: 'insensitive' }

  const [stalls, total] = await Promise.all([
    prisma.stall.findMany({
      where,
      include: { _count: { select: { stallVisits: true, assignments: true, events: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.stall.count({ where }),
  ])

  return apiPaginated(stalls, page, limit, total)
})

export const POST = withApiKey(async (request: NextRequest) => {
  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return apiError('VALIDATION_ERROR', parsed.error.issues[0].message)

  const data = parsed.data
  const code = `ST-${data.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toUpperCase()}${Math.floor(Math.random() * 900) + 100}`

  const stall = await prisma.stall.create({
    data: {
      code,
      name: data.name,
      description: data.description || 'Educational activity stall',
      icon: data.icon || 'Star',
      maxVolunteers: data.maxVolunteers || 5,
      status: data.status || 'ACTIVE',
      metrics: data.metrics || [],
    },
  })

  return apiCreated(stall)
})
