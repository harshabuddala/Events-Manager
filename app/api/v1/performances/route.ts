import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withApiKey } from '@/lib/api-auth'
import { apiSuccess, apiCreated, apiError, apiNotFound, apiPaginated } from '@/lib/api-response'
import { z } from 'zod'

const createSchema = z.object({
  stallVisitId: z.string().uuid(),
  volunteerId: z.string().uuid(),
  score: z.number().min(0).max(10),
  grade: z.string().min(1).max(5),
  remarks: z.string().max(1000).optional(),
  participation: z.number().int().min(1).max(5).optional(),
  creativity: z.number().int().min(1).max(5).optional(),
  problemSolving: z.number().int().min(1).max(5).optional(),
  communication: z.number().int().min(1).max(5).optional(),
  learningAbility: z.number().int().min(1).max(5).optional(),
  metricScores: z.record(z.string(), z.number()).optional(),
})

export const GET = withApiKey(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))
  const volunteerId = searchParams.get('volunteerId')
  const stallVisitId = searchParams.get('stallVisitId')

  const where: Record<string, unknown> = {}
  if (volunteerId) where.volunteerId = volunteerId
  if (stallVisitId) where.stallVisitId = stallVisitId

  const [performances, total] = await Promise.all([
    prisma.performance.findMany({
      where,
      include: {
        stallVisit: {
          include: {
            stall: { select: { id: true, name: true } },
            student: { select: { id: true, name: true, rollNumber: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.performance.count({ where }),
  ])

  return apiPaginated(performances, page, limit, total)
})

export const POST = withApiKey(async (request: NextRequest) => {
  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return apiError('VALIDATION_ERROR', parsed.error.issues[0].message)

  const { stallVisitId, volunteerId, score, grade, remarks, participation, creativity, problemSolving, communication, learningAbility, metricScores } = parsed.data

  const visit = await prisma.stallVisit.findUnique({ where: { id: stallVisitId } })
  if (!visit) return apiNotFound('Stall Visit')

  const existing = await prisma.performance.findUnique({ where: { stallVisitId } })
  if (existing) return apiError('ALREADY_EXISTS', 'Performance already recorded for this visit')

  const performance = await prisma.performance.create({
    data: {
      stallVisitId,
      volunteerId,
      score,
      grade,
      remarks: remarks || null,
      participation: participation || 1,
      creativity: creativity || null,
      problemSolving: problemSolving || null,
      communication: communication || null,
      learningAbility: learningAbility || null,
      metricScores: metricScores || undefined,
    },
  })

  await prisma.stallVisit.update({ where: { id: stallVisitId }, data: { completedAt: new Date() } })

  return apiCreated(performance)
})
