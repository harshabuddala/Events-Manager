import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withApiKey } from '@/lib/api-auth'
import { apiSuccess, apiNotFound } from '@/lib/api-response'

export const GET = withApiKey(async (request: NextRequest, context?: unknown) => {
  const { params } = context as { params: Promise<{ id: string }> }
  const { id } = await params

  const visit = await prisma.stallVisit.findUnique({
    where: { id },
    include: {
      stall: { select: { id: true, name: true } },
      student: { select: { id: true, name: true, rollNumber: true } },
      performance: true,
    },
  })

  if (!visit) return apiNotFound('Stall Visit')
  return apiSuccess(visit)
})
