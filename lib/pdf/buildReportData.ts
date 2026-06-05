import { prisma } from '@/lib/prisma'
import type { ReportCardData, ReportStallRow } from './letterhead'

export async function buildReportDataForRegistration(
  registrationId: string
): Promise<{ data: ReportCardData; letterheadFilePath: string | null; letterheadId: string | null } | null> {
  const reg = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: {
      student: true,
      event: {
        include: {
          community: { select: { name: true, code: true } },
          letterhead: true,
          stalls: {
            where: { status: 'ACTIVE' },
            select: { id: true, code: true, name: true, metrics: true },
            orderBy: { code: 'asc' },
          },
        },
      },
      stallVisits: {
        include: {
          stall: { select: { id: true, code: true, name: true, metrics: true } },
          performance: {
            include: { volunteer: { select: { name: true } } },
          },
        },
      },
    },
  })

  if (!reg) return null

  const stallMap = new Map<string, { code: string; name: string; metrics: any }>()
  for (const s of reg.event.stalls) {
    stallMap.set(s.id, { code: s.code, name: s.name, metrics: s.metrics })
  }

  const rows: ReportStallRow[] = []
  let totalScore = 0
  let scoredCount = 0

  for (const [stallId, info] of stallMap) {
    const visit = reg.stallVisits.find((v: any) => v.stallId === stallId)
    const perf = visit?.performance
    const metricScores: Record<string, number> =
      perf?.metricScores && typeof perf.metricScores === 'object'
        ? (perf.metricScores as Record<string, number>)
        : {}

    let stallMetrics: string[] = []
    if (Array.isArray(info.metrics)) {
      stallMetrics = (info.metrics as unknown[]).filter((m): m is string => typeof m === 'string')
    } else if (visit?.stall && Array.isArray(visit.stall.metrics)) {
      stallMetrics = (visit.stall.metrics as unknown[]).filter((m): m is string => typeof m === 'string')
    }

    const metricRows = stallMetrics.map((name) => ({
      name,
      score: typeof metricScores[name] === 'number' ? metricScores[name] : 0,
    }))

    if (perf) {
      totalScore += perf.score
      scoredCount += 1
    }

    rows.push({
      name: info.name,
      code: info.code,
      score: perf?.score ?? null,
      grade: perf?.grade ?? null,
      remarks: perf?.remarks ?? null,
      volunteer: perf?.volunteer?.name ?? null,
      metrics: metricRows,
    })
  }

  const averageScore = scoredCount > 0 ? totalScore / scoredCount : 0
  let overallGrade = '—'
  if (averageScore >= 9) overallGrade = 'A+'
  else if (averageScore >= 8) overallGrade = 'A'
  else if (averageScore >= 7) overallGrade = 'B'
  else if (averageScore >= 6) overallGrade = 'C'
  else if (averageScore >= 5) overallGrade = 'D'
  else if (averageScore > 0) overallGrade = 'E'

  return {
    data: {
      student: {
        name: reg.student.name,
        rollNumber: reg.student.rollNumber,
        grade: reg.student.grade,
        age: reg.student.age ?? null,
      },
      event: {
        name: reg.event.name,
        code: reg.event.code,
        community: reg.event.community.name,
      },
      stalls: rows,
      averageScore,
      overallGrade,
      status: reg.status,
      generatedAt: new Date().toISOString(),
    },
    letterheadFilePath: reg.event.letterhead?.filePath ?? null,
    letterheadId: reg.event.letterhead?.id ?? null,
  }
}

export async function buildReportDataForEventTest(
  eventId: string
): Promise<{ data: ReportCardData; letterheadFilePath: string | null; letterheadId: string | null } | null> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      community: { select: { name: true, code: true } },
      letterhead: true,
      stalls: {
        where: { status: 'ACTIVE' },
        select: { id: true, code: true, name: true, metrics: true },
        orderBy: { code: 'asc' },
      },
    },
  })
  if (!event) return null

  // Generate sample data with random-but-realistic scores
  const seed = eventId.charCodeAt(0) + eventId.length
  const rand = (i: number, min = 0, max = 1) => {
    const x = Math.sin(seed + i) * 10000
    return min + (x - Math.floor(x)) * (max - min)
  }

  const sampleStalls: ReportStallRow[] = event.stalls.map((s, i) => {
    const score = Math.round((6 + rand(i, 0, 4)) * 10) / 10 // 6.0-10.0
    const grade = score >= 9 ? 'A+' : score >= 8 ? 'A' : score >= 7 ? 'B' : score >= 6 ? 'C' : 'D'
    const metricsArr: string[] = Array.isArray(s.metrics)
      ? (s.metrics as unknown[]).filter((m): m is string => typeof m === 'string')
      : []
    const metrics = metricsArr.map((name, mi) => ({
      name,
      score: Math.min(5, Math.max(1, Math.round(rand(i * 10 + mi, 2, 5)))),
    }))
    const remarks = [
      'Excellent engagement throughout the activity.',
      'Showed strong problem-solving skills.',
      'Demonstrated creativity and curiosity.',
      'Needs more practice with timing.',
      'Outstanding collaboration with peers.',
    ][i % 5]
    return {
      name: s.name,
      code: s.code,
      score,
      grade,
      remarks,
      volunteer: ['Anjali Desai', 'Rahul Sharma', 'Priya Nair', 'Vikram Singh'][i % 4],
      metrics,
    }
  })

  const avg = sampleStalls.length > 0
    ? sampleStalls.reduce((a, b) => a + (b.score || 0), 0) / sampleStalls.length
    : 0
  const overall = avg >= 9 ? 'A+' : avg >= 8 ? 'A' : avg >= 7 ? 'B' : avg >= 6 ? 'C' : avg >= 5 ? 'D' : 'E'

  return {
    data: {
      student: {
        name: 'Aarav Kumar (Sample)',
        rollNumber: 'DEMO-001',
        grade: '8',
        age: 13,
      },
      event: {
        name: event.name,
        code: event.code,
        community: event.community.name,
      },
      stalls: sampleStalls,
      averageScore: avg,
      overallGrade: overall,
      status: 'COMPLETED',
      generatedAt: new Date().toISOString(),
      isSample: true,
    },
    letterheadFilePath: event.letterhead?.filePath ?? null,
    letterheadId: event.letterhead?.id ?? null,
  }
}
