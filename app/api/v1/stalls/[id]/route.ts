import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withApiKey } from '@/lib/api-auth'
import { apiSuccess, apiError, apiNotFound } from '@/lib/api-response'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  icon: z.string().max(50).optional(),
  maxVolunteers: z.number().int().min(1).max(50).optional(),
  status: z.enum(['ACTIVE', 'MAINTENANCE', 'INACTIVE']).optional(),
  metrics: z.array(z.string().min(1).max(50)).max(20).optional(),
})

export const GET = withApiKey(async (request: NextRequest, context?: unknown) => {
  const { params } = context as { params: Promise<{ id: string }> }
  const { id } = await params

  const stall = await prisma.stall.findUnique({
    where: { id },
    include: { _count: { select: { stallVisits: true, assignments: true, events: true } } },
  })

  if (!stall) return apiNotFound('Stall')
  return apiSuccess(stall)
})

export const PUT = withApiKey(async (request: NextRequest, context?: unknown) => {
  const { params } = context as { params: Promise<{ id: string }> }
  const { id } = await params

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return apiError('VALIDATION_ERROR', parsed.error.issues[0].message)

  const existing = await prisma.stall.findUnique({ where: { id } })
  if (!existing) return apiNotFound('Stall')

  const stall = await prisma.stall.update({ where: { id }, data: parsed.data })
  return apiSuccess(stall)
})

export const DELETE = withApiKey(async (request: NextRequest, context?: unknown) => {
  const { params } = context as { params: Promise<{ id: string }> }
  const { id } = await params

  const existing = await prisma.stall.findUnique({ where: { id } })
  if (!existing) return apiNotFound('Stall')

  await prisma.stall.delete({ where: { id } })
  return apiSuccess({ deleted: true })
})
