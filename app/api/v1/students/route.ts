import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withApiKey } from '@/lib/api-auth'
import { apiPaginated } from '@/lib/api-response'

export const GET = withApiKey(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))
  const q = searchParams.get('q')

  const where: Record<string, unknown> = {}
  if (q) where.OR = [
    { name: { contains: q, mode: 'insensitive' } },
    { rollNumber: { contains: q, mode: 'insensitive' } },
  ]

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.student.count({ where }),
  ])

  return apiPaginated(students, page, limit, total)
})
