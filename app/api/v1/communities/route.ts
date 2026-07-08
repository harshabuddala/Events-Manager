import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withApiKey } from '@/lib/api-auth'
import { apiCreated, apiError, apiPaginated } from '@/lib/api-response'
import { z } from 'zod'

const createSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(200),
  location: z.string().min(1).max(200),
  zone: z.string().max(50).optional(),
  status: z.enum(['ACTIVE', 'UPCOMING', 'INACTIVE']).optional(),
  contactPerson: z.string().min(1).max(100),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(30).optional(),
  description: z.string().max(2000).optional(),
})

export const GET = withApiKey(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))
  const status = searchParams.get('status')
  const q = searchParams.get('q')

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (q) where.OR = [
    { name: { contains: q, mode: 'insensitive' } },
    { location: { contains: q, mode: 'insensitive' } },
  ]

  const [communities, total] = await Promise.all([
    prisma.community.findMany({
      where,
      include: { _count: { select: { events: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.community.count({ where }),
  ])

  return apiPaginated(communities, page, limit, total)
})

export const POST = withApiKey(async (request: NextRequest) => {
  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', parsed.error.issues[0].message)
  }

  const existing = await prisma.community.findUnique({ where: { code: parsed.data.code } })
  if (existing) return apiError('CONFLICT', 'Community code already exists')

  const community = await prisma.community.create({ data: parsed.data })
  return apiCreated(community)
})
