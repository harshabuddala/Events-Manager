import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withApiKey } from '@/lib/api-auth'
import { apiSuccess, apiCreated, apiError, apiNotFound, apiPaginated } from '@/lib/api-response'
import { z } from 'zod'

const createSchema = z.object({
  registrationId: z.string().uuid(),
  stallId: z.string().uuid(),
  studentId: z.string().uuid(),
})

export const GET = withApiKey(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))
  const registrationId = searchParams.get('registrationId')
  const stallId = searchParams.get('stallId')

  const where: Record<string, unknown> = {}
  if (registrationId) where.registrationId = registrationId
  if (stallId) where.stallId = stallId

  const [visits, total] = await Promise.all([
    prisma.stallVisit.findMany({
      where,
      include: {
        stall: { select: { id: true, name: true } },
        student: { select: { id: true, name: true, rollNumber: true } },
        performance: true,
      },
      orderBy: { visitedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.stallVisit.count({ where }),
  ])

  return apiPaginated(visits, page, limit, total)
})

export const POST = withApiKey(async (request: NextRequest) => {
  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return apiError('VALIDATION_ERROR', parsed.error.issues[0].message)

  const { registrationId, stallId, studentId } = parsed.data

  const registration = await prisma.registration.findUnique({ where: { id: registrationId } })
  if (!registration) return apiNotFound('Registration')

  const stall = await prisma.stall.findUnique({ where: { id: stallId } })
  if (!stall) return apiNotFound('Stall')

  const existing = await prisma.stallVisit.findFirst({ where: { registrationId, stallId } })
  if (existing) return apiError('ALREADY_EXISTS', 'Student has already visited this stall')

  const visit = await prisma.stallVisit.create({
    data: { registrationId, stallId, studentId },
    include: { stall: { select: { id: true, name: true } } },
  })

  return apiCreated(visit)
})
