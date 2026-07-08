import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withApiKey } from '@/lib/api-auth'
import { apiSuccess } from '@/lib/api-response'

export const GET = withApiKey(async (request: NextRequest) => {
  const communities = await prisma.community.findMany({
    include: {
      events: {
        include: {
          _count: { select: { registrations: true } },
          registrations: { select: { status: true } },
        },
      },
    },
  })

  const result = communities.map(c => {
    const participants = c.events.reduce((sum, e) => sum + e._count.registrations, 0)
    const completed = c.events.reduce((sum, e) => sum + e.registrations.filter(r => r.status === 'COMPLETED').length, 0)
    return {
      id: c.id, name: c.name, location: c.location, status: c.status,
      participants, completed,
      completionRate: participants > 0 ? Math.round((completed / participants) * 100 * 10) / 10 : 0,
    }
  }).sort((a, b) => b.participants - a.participants)

  return apiSuccess(result)
})
