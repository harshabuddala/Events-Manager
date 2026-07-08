import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withApiKey } from '@/lib/api-auth'
import { apiSuccess, apiNotFound } from '@/lib/api-response'

export const DELETE = withApiKey(async (request: NextRequest, context?: unknown) => {
  const { params } = context as { params: Promise<{ id: string }> }
  const { id } = await params

  const existing = await prisma.apiKey.findUnique({ where: { id } })
  if (!existing) return apiNotFound('API Key')

  await prisma.apiKey.update({ where: { id }, data: { isActive: false } })
  return apiSuccess({ revoked: true })
})
