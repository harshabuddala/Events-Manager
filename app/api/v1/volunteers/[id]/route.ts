import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withApiKey } from '@/lib/api-auth'
import { apiSuccess, apiError, apiNotFound } from '@/lib/api-response'
import { hash } from 'bcryptjs'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).max(100).optional(),
  phoneNumber: z.string().max(30).optional(),
  role: z.enum(['VOLUNTEER', 'LEAD_EVALUATOR', 'COORDINATOR']).optional(),
  preferredStall: z.string().optional(),
  status: z.enum(['AVAILABLE', 'ASSIGNED', 'ON_LEAVE']).optional(),
})

export const GET = withApiKey(async (request: NextRequest, context?: unknown) => {
  const { params } = context as { params: Promise<{ id: string }> }
  const { id } = await params

  const volunteer = await prisma.volunteer.findUnique({ where: { id } })
  if (!volunteer) return apiNotFound('Volunteer')

  const { password, ...safe } = volunteer
  return apiSuccess(safe)
})

export const PUT = withApiKey(async (request: NextRequest, context?: unknown) => {
  const { params } = context as { params: Promise<{ id: string }> }
  const { id } = await params

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return apiError('VALIDATION_ERROR', parsed.error.issues[0].message)

  const existing = await prisma.volunteer.findUnique({ where: { id } })
  if (!existing) return apiNotFound('Volunteer')

  const data: Record<string, unknown> = { ...parsed.data }
  if (data.password) data.password = await hash(data.password as string, 12)

  const volunteer = await prisma.volunteer.update({ where: { id }, data })
  const { password, ...safe } = volunteer
  return apiSuccess(safe)
})

export const DELETE = withApiKey(async (request: NextRequest, context?: unknown) => {
  const { params } = context as { params: Promise<{ id: string }> }
  const { id } = await params

  const existing = await prisma.volunteer.findUnique({ where: { id } })
  if (!existing) return apiNotFound('Volunteer')

  await prisma.volunteer.delete({ where: { id } })
  return apiSuccess({ deleted: true })
})
