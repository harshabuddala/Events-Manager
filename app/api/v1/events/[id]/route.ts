import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withApiKey } from '@/lib/api-auth'
import { apiSuccess, apiError, apiNotFound } from '@/lib/api-response'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  communityId: z.string().uuid().optional(),
  date: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(['UPCOMING', 'LIVE', 'COMPLETED', 'CANCELLED']).optional(),
  description: z.string().max(2000).optional(),
  isPublicRegistrationEnabled: z.boolean().optional(),
})

export const GET = withApiKey(async (request: NextRequest, context?: unknown) => {
  const { params } = context as { params: Promise<{ id: string }> }
  const { id } = await params

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      community: { select: { name: true, location: true } },
      stalls: { select: { id: true, code: true, name: true, status: true } },
      _count: { select: { registrations: true, assignments: true } },
    },
  })

  if (!event) return apiNotFound('Event')
  return apiSuccess(event)
})

export const PUT = withApiKey(async (request: NextRequest, context?: unknown) => {
  const { params } = context as { params: Promise<{ id: string }> }
  const { id } = await params

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', parsed.error.issues[0].message)
  }

  const existing = await prisma.event.findUnique({ where: { id } })
  if (!existing) return apiNotFound('Event')

  const data = parsed.data
  const updateData: Record<string, unknown> = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.communityId !== undefined) updateData.communityId = data.communityId
  if (data.date !== undefined) updateData.date = new Date(data.date)
  if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null
  if (data.status !== undefined) updateData.status = data.status
  if (data.description !== undefined) updateData.description = data.description
  if (data.isPublicRegistrationEnabled !== undefined) updateData.isPublicRegistrationEnabled = data.isPublicRegistrationEnabled

  const event = await prisma.event.update({ where: { id }, data: updateData })
  return apiSuccess(event)
})

export const DELETE = withApiKey(async (request: NextRequest, context?: unknown) => {
  const { params } = context as { params: Promise<{ id: string }> }
  const { id } = await params

  const existing = await prisma.event.findUnique({ where: { id } })
  if (!existing) return apiNotFound('Event')

  const regCount = await prisma.registration.count({ where: { eventId: id } })
  if (regCount > 0) {
    return apiError('CONFLICT', `Cannot delete event with ${regCount} registration(s)`)
  }

  await prisma.$transaction([
    prisma.volunteerAssignment.deleteMany({ where: { eventId: id } }),
    prisma.event.delete({ where: { id } }),
  ])

  return apiSuccess({ deleted: true })
})
