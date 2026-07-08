import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withApiKey } from '@/lib/api-auth'
import { apiSuccess } from '@/lib/api-response'

export const GET = withApiKey(async (request: NextRequest) => {
  const stalls = await prisma.stall.findMany({
    include: {
      _count: { select: { stallVisits: true, assignments: true } },
    },
  })

  const result = stalls.map(s => ({
    id: s.id, code: s.code, name: s.name, status: s.status,
    visitCount: s._count.stallVisits,
    volunteerCount: s._count.assignments,
  })).sort((a, b) => b.visitCount - a.visitCount)

  return apiSuccess(result)
})
