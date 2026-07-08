import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withApiKey } from '@/lib/api-auth'
import { apiSuccess, apiNotFound } from '@/lib/api-response'

export const GET = withApiKey(async (request: NextRequest, context?: unknown) => {
  const { params } = context as { params: Promise<{ id: string }> }
  const { id } = await params

  const performance = await prisma.performance.findUnique({
    where: { id },
    include: {
      stallVisit: {
        include: {
          stall: { select: { id: true, name: true } },
          student: { select: { id: true, name: true, rollNumber: true } },
        },
      },
    },
  })

  if (!performance) return apiNotFound('Performance')
  return apiSuccess(performance)
})
