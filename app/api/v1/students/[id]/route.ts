import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withApiKey } from '@/lib/api-auth'
import { apiSuccess, apiError, apiNotFound } from '@/lib/api-response'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  grade: z.string().min(1).max(20).optional(),
  age: z.number().int().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phoneNumber: z.string().max(30).optional(),
  parentName: z.string().max(200).optional(),
  parentEmail: z.string().email().optional(),
  parentPhone: z.string().max(30).optional(),
  address: z.string().max(500).optional(),
})

export const GET = withApiKey(async (request: NextRequest, context?: unknown) => {
  const { params } = context as { params: Promise<{ id: string }> }
  const { id } = await params

  const student = await prisma.student.findUnique({
    where: { id },
    include: { registrations: { include: { event: { select: { id: true, name: true } } } } },
  })

  if (!student) return apiNotFound('Student')
  return apiSuccess(student)
})

export const PUT = withApiKey(async (request: NextRequest, context?: unknown) => {
  const { params } = context as { params: Promise<{ id: string }> }
  const { id } = await params

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return apiError('VALIDATION_ERROR', parsed.error.issues[0].message)

  const existing = await prisma.student.findUnique({ where: { id } })
  if (!existing) return apiNotFound('Student')

  const student = await prisma.student.update({ where: { id }, data: parsed.data })
  return apiSuccess(student)
})
