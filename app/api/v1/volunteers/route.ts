import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withApiKey } from '@/lib/api-auth'
import { apiCreated, apiError, apiPaginated } from '@/lib/api-response'
import { hash } from 'bcryptjs'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  phoneNumber: z.string().max(30).optional(),
  role: z.enum(['VOLUNTEER', 'LEAD_EVALUATOR', 'COORDINATOR']).optional(),
  preferredStall: z.string().optional(),
})

export const GET = withApiKey(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))
  const status = searchParams.get('status')
  const role = searchParams.get('role')
  const q = searchParams.get('q')

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (role) where.role = role
  if (q) where.OR = [
    { name: { contains: q, mode: 'insensitive' } },
    { email: { contains: q, mode: 'insensitive' } },
  ]

  const [volunteers, total] = await Promise.all([
    prisma.volunteer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.volunteer.count({ where }),
  ])

  const safe = volunteers.map(({ password, ...v }) => v)
  return apiPaginated(safe, page, limit, total)
})

export const POST = withApiKey(async (request: NextRequest) => {
  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return apiError('VALIDATION_ERROR', parsed.error.issues[0].message)

  const existing = await prisma.volunteer.findUnique({ where: { email: parsed.data.email } })
  if (existing) return apiError('CONFLICT', 'Volunteer email already exists')

  const hashedPassword = await hash(parsed.data.password, 12)
  const volunteer = await prisma.volunteer.create({
    data: { ...parsed.data, password: hashedPassword },
  })

  const { password, ...safe } = volunteer
  return apiCreated(safe)
})
