import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withApiKey } from '@/lib/api-auth'
import { apiSuccess, apiCreated, apiError, apiPaginated } from '@/lib/api-response'
import { z } from 'zod'

const createSchema = z.object({
  code: z.string().min(1).max(20).optional(),
  name: z.string().min(1).max(200),
  communityId: z.string().uuid(),
  date: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  status: z.enum(['UPCOMING', 'LIVE', 'COMPLETED', 'CANCELLED']).optional(),
  description: z.string().max(2000).optional(),
  isPublicRegistrationEnabled: z.boolean().optional(),
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

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      include: {
        community: { select: { name: true, location: true } },
        _count: { select: { registrations: true, stalls: true } },
      },
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.event.count({ where }),
  ])

  return apiPaginated(events, page, limit, total)
})

export const POST = withApiKey(async (request: NextRequest) => {
  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', parsed.error.issues[0].message)
  }

  const data = parsed.data
  const code = data.code || `E-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

  const community = await prisma.community.findUnique({ where: { id: data.communityId } })
  if (!community) return apiError('NOT_FOUND', 'Community not found', 404)

  const event = await prisma.event.create({
    data: {
      code,
      name: data.name,
      communityId: data.communityId,
      date: new Date(data.date),
      endDate: data.endDate ? new Date(data.endDate) : null,
      status: data.status || 'UPCOMING',
      description: data.description || null,
      isPublicRegistrationEnabled: data.isPublicRegistrationEnabled ?? true,
      organizerId: '00000000-0000-0000-0000-000000000001',
    },
  })

  return apiCreated(event)
})
