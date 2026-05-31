import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const totalVisits = await prisma.stallVisit.count()
    const completedVisits = await prisma.stallVisit.count({
      where: { completedAt: { not: null } },
    })
    const avgCompletion = totalVisits > 0
      ? Math.round((completedVisits / totalVisits) * 100 * 10) / 10
      : 0
    const activeStalls = await prisma.stall.count({ where: { status: 'ACTIVE' } })
    const communities = await prisma.community.count()

    const visits = await prisma.stallVisit.findMany({
      select: { visitedAt: true },
      orderBy: { visitedAt: 'asc' },
    })

    const visitMap = new Map<string, number>()
    visits.forEach(v => {
      const date = v.visitedAt.toISOString().split('T')[0]
      visitMap.set(date, (visitMap.get(date) || 0) + 1)
    })
    const visitTrends = Array.from(visitMap.entries()).map(([date, count]) => ({
      time: date.slice(5),
      visits: count,
    }))

    const performances = await prisma.performance.findMany({
      include: {
        stallVisit: {
          include: {
            student: { select: { grade: true } },
          },
        },
      },
    })

    const gradeMap = new Map<string, { creativity: number[]; problemSolving: number[]; communication: number[]; learningAbility: number[] }>()
    performances.forEach(p => {
      const grade = p.stallVisit.student.grade || 'Unknown'
      if (!gradeMap.has(grade)) {
        gradeMap.set(grade, { creativity: [], problemSolving: [], communication: [], learningAbility: [] })
      }
      const g = gradeMap.get(grade)!
      if (p.creativity != null) g.creativity.push(p.creativity)
      if (p.problemSolving != null) g.problemSolving.push(p.problemSolving)
      if (p.communication != null) g.communication.push(p.communication)
      if (p.learningAbility != null) g.learningAbility.push(p.learningAbility)
    })

    const avg = (arr: number[]) => arr.length > 0 ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0

    const performanceByGrade = Array.from(gradeMap.entries()).map(([grade, vals]) => ({
      grade: grade.replace(' Class', ''),
      creativity: avg(vals.creativity),
      problemSolving: avg(vals.problemSolving),
      communication: avg(vals.communication),
      learningAbility: avg(vals.learningAbility),
    })).sort((a, b) => a.grade.localeCompare(b.grade))

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
