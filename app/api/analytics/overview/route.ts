import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [totalVisits, completedVisits, activeStalls, communities] = await Promise.all([
      prisma.stallVisit.count(),
      prisma.stallVisit.count({ where: { completedAt: { not: null } } }),
      prisma.stall.count({ where: { status: 'ACTIVE' } }),
      prisma.community.count(),
    ])

    const avgCompletion = totalVisits > 0
      ? Math.round((completedVisits / totalVisits) * 100 * 10) / 10
      : 0

    const visitTrendsRaw = await prisma.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT TO_CHAR("visitedAt"::date, 'YYYY-MM-DD') as date, COUNT(*)::bigint as count
      FROM stall_visits
      GROUP BY "visitedAt"::date
      ORDER BY "visitedAt"::date ASC
    `

    const visitTrends = visitTrendsRaw.map(row => ({
      time: row.date.slice(5),
      visits: Number(row.count),
    }))

    const performanceByGradeRaw = await prisma.$queryRaw<{
      grade: string
      avg_creativity: number | null
      avg_problem_solving: number | null
      avg_communication: number | null
      avg_learning_ability: number | null
    }[]>`
      SELECT 
        s.grade,
        ROUND(AVG(p.creativity)::numeric, 1) as avg_creativity,
        ROUND(AVG(p."problemSolving")::numeric, 1) as avg_problem_solving,
        ROUND(AVG(p.communication)::numeric, 1) as avg_communication,
        ROUND(AVG(p."learningAbility")::numeric, 1) as avg_learning_ability
      FROM performances p
      INNER JOIN stall_visits sv ON sv.id = p."stallVisitId"
      INNER JOIN students s ON s.id = sv."studentId"
      WHERE p.creativity IS NOT NULL
         OR p."problemSolving" IS NOT NULL
         OR p.communication IS NOT NULL
         OR p."learningAbility" IS NOT NULL
      GROUP BY s.grade
      ORDER BY s.grade ASC
    `

    const performanceByGrade = performanceByGradeRaw.map(row => ({
      grade: row.grade.replace(' Class', ''),
      creativity: row.avg_creativity ?? 0,
      problemSolving: row.avg_problem_solving ?? 0,
      communication: row.avg_communication ?? 0,
      learningAbility: row.avg_learning_ability ?? 0,
    }))

    return NextResponse.json({
      stats: { totalVisits, avgCompletion, activeStalls, communities },
      visitTrends,
      performanceByGrade,
    })
  } catch (error) {
    console.error('Analytics overview error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
