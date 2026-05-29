import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // ===== REGISTRATION STATS =====
    const totalRegs = await prisma.registration.count({ where: { eventId: id } })
    const completedRegs = await prisma.registration.count({ where: { eventId: id, status: 'COMPLETED' } })
    const inProgressRegs = await prisma.registration.count({ where: { eventId: id, status: 'IN_PROGRESS' } })
    const pendingRegs = await prisma.registration.count({ where: { eventId: id, status: 'REGISTERED' } })
    const completionRate = totalRegs > 0 ? Math.round((completedRegs / totalRegs) * 100) : 0

    // Registration trend (hourly buckets for the event day)
    const allRegistrations = await prisma.registration.findMany({
      where: { eventId: id },
      select: { registeredAt: true },
      orderBy: { registeredAt: 'asc' },
    })
    const regTrendMap = new Map<string, number>()
    allRegistrations.forEach(r => {
      const hour = new Date(r.registeredAt).getHours()
      const key = `${hour.toString().padStart(2, '0')}:00`
      regTrendMap.set(key, (regTrendMap.get(key) || 0) + 1)
    })
    const registrationTrend = Array.from(regTrendMap.entries()).map(([time, count]) => ({ time, count }))

    // ===== STALL STATS =====
    const stalls = await prisma.stall.findMany({
      where: { events: { some: { id } } },
      select: {
        id: true,
        name: true,
        code: true,
        stallVisits: {
          where: { registration: { eventId: id } },
          include: {
            performance: {
              select: { score: true, grade: true, creativity: true, problemSolving: true, communication: true, learningAbility: true },
            },
            student: { select: { grade: true, name: true } },
          },
        },
      },
    })

    const stallStats = stalls.map(stall => {
      const visits = stall.stallVisits
      const scored = visits.filter(v => v.performance)
      const avgScore = scored.length > 0
        ? Math.round(scored.reduce((sum, v) => sum + (v.performance?.score ?? 0), 0) / scored.length * 10) / 10
        : null

      // Skill averages per stall
      const skills = { creativity: [] as number[], problemSolving: [] as number[], communication: [] as number[], learningAbility: [] as number[] }
      scored.forEach(v => {
        if (v.performance?.creativity != null) skills.creativity.push(v.performance.creativity)
        if (v.performance?.problemSolving != null) skills.problemSolving.push(v.performance.problemSolving)
        if (v.performance?.communication != null) skills.communication.push(v.performance.communication)
        if (v.performance?.learningAbility != null) skills.learningAbility.push(v.performance.learningAbility)
      })
      const avgSkill = (arr: number[]) => arr.length > 0 ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null

      const gradeCount: Record<string, number> = {}
      scored.forEach(v => {
        const g = v.performance?.grade ?? 'N/A'
        gradeCount[g] = (gradeCount[g] || 0) + 1
      })

      return {
        id: stall.id,
        name: stall.name,
        code: stall.code,
        visits: visits.length,
        completed: visits.filter(v => v.completedAt).length,
        avgScore,
        gradeCount,
        skills: {
          creativity: avgSkill(skills.creativity),
          problemSolving: avgSkill(skills.problemSolving),
          communication: avgSkill(skills.communication),
          learningAbility: avgSkill(skills.learningAbility),
        },
      }
    }).sort((a, b) => (b.visits - a.visits))

    // ===== PERFORMANCE OVERALL =====
    const allPerformances = await prisma.performance.findMany({
      where: { stallVisit: { registration: { eventId: id } } },
      select: { grade: true, score: true, creativity: true, problemSolving: true, communication: true, learningAbility: true },
    })

    const gradeDistribution: Record<string, number> = {}
    allPerformances.forEach(p => {
      gradeDistribution[p.grade] = (gradeDistribution[p.grade] || 0) + 1
    })

    const avgOverallScore = allPerformances.length > 0
      ? Math.round((allPerformances.reduce((s, p) => s + p.score, 0) / allPerformances.length) * 10) / 10
      : null

    // ===== TOP PERFORMING STUDENTS =====
    const topStudents = await prisma.registration.findMany({
      where: { eventId: id },
      include: {
        student: { select: { id: true, name: true, grade: true, rollNumber: true } },
        stallVisits: {
          include: {
            performance: { select: { score: true, grade: true } },
          },
        },
      },
      take: 10,
    })

    const studentRankings = topStudents
      .map(reg => {
        const performances = reg.stallVisits.filter(v => v.performance).map(v => v.performance!)
        const totalScore = performances.reduce((sum, p) => sum + p.score, 0)
        const avgScore = performances.length > 0 ? Math.round((totalScore / performances.length) * 10) / 10 : 0
        const stallCount = performances.length
        return {
          id: reg.student.id,
          name: reg.student.name,
          grade: reg.student.grade,
          rollNumber: reg.student.rollNumber,
          avgScore,
          stallCount,
          totalScore,
        }
      })
      .filter(s => s.stallCount > 0)
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 10)

    // ===== GRADE-WISE PARTICIPATION =====
    const gradeWise = await prisma.registration.groupBy({
      by: ['studentId'],
      where: { eventId: id },
      _count: { studentId: true },
    })

    const studentsInEvent = await prisma.student.findMany({
      where: { registrations: { some: { eventId: id } } },
      select: { grade: true },
    })

    const gradeParticipationMap = new Map<string, number>()
    studentsInEvent.forEach(s => {
      const g = s.grade || 'Unknown'
      gradeParticipationMap.set(g, (gradeParticipationMap.get(g) || 0) + 1)
    })
    const gradeParticipation = Array.from(gradeParticipationMap.entries())
      .map(([grade, count]) => ({ grade, count }))
      .sort((a, b) => a.grade.localeCompare(b.grade))

    // ===== VOLUNTEER PERFORMANCE =====
    const volunteerStats = await prisma.performance.groupBy({
      by: ['volunteerId'],
      where: { stallVisit: { registration: { eventId: id } } },
      _count: { volunteerId: true },
      _avg: { score: true },
    })

    const volunteerDetails = await prisma.volunteer.findMany({
      where: { id: { in: volunteerStats.map(v => v.volunteerId) } },
      select: { id: true, name: true },
    })

    const volunteerPerformance = volunteerStats.map(v => {
      const vol = volunteerDetails.find(d => d.id === v.volunteerId)
      return {
        name: vol?.name || 'Unknown',
        evaluations: v._count.volunteerId,
        avgScore: v._avg.score ? Math.round(v._avg.score * 10) / 10 : 0,
      }
    }).sort((a, b) => b.evaluations - a.evaluations)

    // ===== SKILL DISTRIBUTION OVERALL =====
    const skillData = {
      creativity: [] as number[],
      problemSolving: [] as number[],
      communication: [] as number[],
      learningAbility: [] as number[],
    }
    allPerformances.forEach(p => {
      if (p.creativity != null) skillData.creativity.push(p.creativity)
      if (p.problemSolving != null) skillData.problemSolving.push(p.problemSolving)
      if (p.communication != null) skillData.communication.push(p.communication)
      if (p.learningAbility != null) skillData.learningAbility.push(p.learningAbility)
    })
    const avgSkill = (arr: number[]) => arr.length > 0 ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0
    const overallSkills = {
      creativity: avgSkill(skillData.creativity),
      problemSolving: avgSkill(skillData.problemSolving),
      communication: avgSkill(skillData.communication),
      learningAbility: avgSkill(skillData.learningAbility),
    }

    return NextResponse.json({
      summary: {
        totalRegs,
        completedRegs,
        inProgressRegs,
        pendingRegs,
        completionRate,
        avgOverallScore,
        totalEvaluations: allPerformances.length,
        totalStalls: stalls.length,
      },
      registrationTrend,
      stallStats,
      gradeDistribution,
      overallSkills,
      studentRankings,
      gradeParticipation,
      volunteerPerformance,
      scoreByStall: stallStats.filter(s => s.avgScore !== null).map(s => ({ name: s.name, score: s.avgScore! })),
      statusData: [
        { label: 'Registered', value: pendingRegs, color: '#8b5cf6' },
        { label: 'In Progress', value: inProgressRegs, color: '#3b82f6' },
        { label: 'Completed', value: completedRegs, color: '#10b981' },
      ],
    })
  } catch (error) {
    console.error('Event analytics error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
