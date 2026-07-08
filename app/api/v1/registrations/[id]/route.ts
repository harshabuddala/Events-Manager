import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withApiKey } from '@/lib/api-auth'
import { apiSuccess, apiError, apiNotFound } from '@/lib/api-response'
import { z } from 'zod'

const updateSchema = z.object({
  status: z.enum(['REGISTERED', 'IN_PROGRESS', 'COMPLETED']).optional(),
  notes: z.string().max(1000).optional(),
})

export const GET = withApiKey(async (request: NextRequest, context?: unknown) => {
  const { params } = context as { params: Promise<{ id: string }> }
  const { id } = await params

  const registration = await prisma.registration.findUnique({
    where: { id },
    include: {
      student: true,
      event: { include: { community: { select: { name: true } } } },
      stallVisits: {
        include: {
          stall: { select: { id: true, name: true } },
          performance: true,
        },
      },
    },
  })

  if (!registration) return apiNotFound('Registration')
  return apiSuccess(registration)
})

export const PUT = withApiKey(async (request: NextRequest, context?: unknown) => {
  const { params } = context as { params: Promise<{ id: string }> }
  const { id } = await params

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return apiError('VALIDATION_ERROR', parsed.error.issues[0].message)

  const existing = await prisma.registration.findUnique({ where: { id } })
  if (!existing) return apiNotFound('Registration')

  const data: Record<string, unknown> = { ...parsed.data }
  if (data.status === 'COMPLETED') data.completedAt = new Date()

  const registration = await prisma.registration.update({ where: { id }, data })
  return apiSuccess(registration)
})

export const DELETE = withApiKey(async (request: NextRequest, context?: unknown) => {
  const { params } = context as { params: Promise<{ id: string }> }
  const { id } = await params

  const existing = await prisma.registration.findUnique({ where: { id } })
  if (!existing) return apiNotFound('Registration')

  await prisma.$transaction(async (tx) => {
    const stallVisits = await tx.stallVisit.findMany({ where: { registrationId: id }, select: { id: true } })
    const svIds = stallVisits.map(sv => sv.id)
    if (svIds.length > 0) {
      await tx.performance.deleteMany({ where: { stallVisitId: { in: svIds } } })
      await tx.stallVisit.deleteMany({ where: { id: { in: svIds } } })
    }
    await tx.registration.delete({ where: { id } })
  })

  return apiSuccess({ deleted: true })
})
