import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withApiKey } from '@/lib/api-auth'
import { apiSuccess, apiError, apiNotFound } from '@/lib/api-response'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  location: z.string().min(1).max(200).optional(),
  zone: z.string().max(50).optional(),
  status: z.enum(['ACTIVE', 'UPCOMING', 'INACTIVE']).optional(),
  contactPerson: z.string().min(1).max(100).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(30).optional(),
  description: z.string().max(2000).optional(),
})

export const GET = withApiKey(async (request: NextRequest, context?: unknown) => {
  const { params } = context as { params: Promise<{ id: string }> }
  const { id } = await params

  const community = await prisma.community.findUnique({
    where: { id },
    include: { _count: { select: { events: true } } },
  })

  if (!community) return apiNotFound('Community')
  return apiSuccess(community)
})

export const PUT = withApiKey(async (request: NextRequest, context?: unknown) => {
  const { params } = context as { params: Promise<{ id: string }> }
  const { id } = await params

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', parsed.error.issues[0].message)
  }

  const existing = await prisma.community.findUnique({ where: { id } })
  if (!existing) return apiNotFound('Community')

  const community = await prisma.community.update({ where: { id }, data: parsed.data })
  return apiSuccess(community)
})

export const DELETE = withApiKey(async (request: NextRequest, context?: unknown) => {
  const { params } = context as { params: Promise<{ id: string }> }
  const { id } = await params

  const existing = await prisma.community.findUnique({ where: { id } })
  if (!existing) return apiNotFound('Community')

  const eventCount = await prisma.event.count({ where: { communityId: id } })
  if (eventCount > 0) {
    return apiError('CONFLICT', `Cannot delete community with ${eventCount} event(s)`)
  }

  await prisma.community.delete({ where: { id } })
  return apiSuccess({ deleted: true })
})
