import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withApiKey } from '@/lib/api-auth'
import { apiSuccess } from '@/lib/api-response'

export const GET = withApiKey(async (request: NextRequest) => {
  const volunteers = await prisma.volunteer.findMany({
    include: {
      performances: { select: { score: true } },
      assignments: { select: { eventId: true, stallId: true } },
    },
  })

  const result = volunteers.map(v => {
    const evaluations = v.performances.length
    const avgRating = evaluations > 0
      ? Math.round((v.performances.reduce((s, p) => s + p.score, 0) / evaluations) * 10) / 10
      : 0

    return {
      id: v.id, name: v.name, email: v.email, role: v.role, status: v.status,
      evaluations, avgRating,
      assignments: v.assignments.length,
    }
  }).sort((a, b) => b.evaluations - a.evaluations)

  return apiSuccess(result)
})
