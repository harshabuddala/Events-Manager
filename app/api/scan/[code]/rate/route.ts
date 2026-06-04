import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const rateSchema = z.object({
  stallId: z.string().min(1, 'Stall is required'),
  score: z.number().min(1).max(10).optional(),
  grade: z.string().min(1).max(10).optional(),
  metricScores: z.record(z.string(), z.number().int().min(1).max(5)).optional(),
  remarks: z.string().optional().or(z.literal('')),
})

function deriveScoreAndGrade(
  metricScores: Record<string, number>
): { score: number; grade: string } {
  const values = Object.values(metricScores)
  if (values.length === 0) {
    return { score: 5, grade: 'D' }
  }
  const avgStars = values.reduce((a, b) => a + b, 0) / values.length
  const score = Math.round(avgStars * 2 * 10) / 10
  let grade = 'E'
  if (score >= 9) grade = 'A+'
  else if (score >= 8) grade = 'A'
  else if (score >= 7) grade = 'B'
  else if (score >= 6) grade = 'C'
  else if (score >= 5) grade = 'D'
  return { score, grade }
}

async function resolveEvaluationPayload(
  stallId: string,
  provided: { score?: number; grade?: string; metricScores?: Record<string, number> }
): Promise<
  | { ok: true; score: number; grade: string; metricScores: Record<string, number> | null }
  | { ok: false; error: string; status: number }
> {
  const stall = await prisma.stall.findUnique({
    where: { id: stallId },
    select: { metrics: true },
  })
  if (!stall) {
    return { ok: false, error: 'Stall not found', status: 404 }
  }

  const configuredMetrics = Array.isArray(stall.metrics)
    ? (stall.metrics as unknown[]).filter((m): m is string => typeof m === 'string')
    : []

  if (configuredMetrics.length > 0) {
    if (!provided.metricScores) {
      return {
        ok: false,
        error: 'This stall requires star ratings for each configured metric.',
        status: 400,
      }
    }
    const missing = configuredMetrics.filter((m) => !(m in provided.metricScores!))
    if (missing.length > 0) {
      return {
        ok: false,
        error: `Missing star ratings for: ${missing.join(', ')}`,
        status: 400,
      }
    }
    const extra = Object.keys(provided.metricScores).filter(
      (k) => !configuredMetrics.includes(k)
    )
    const sanitized: Record<string, number> = {}
    for (const m of configuredMetrics) {
      sanitized[m] = provided.metricScores[m]
    }
    void extra
    const { score, grade } = deriveScoreAndGrade(sanitized)
    return { ok: true, score, grade, metricScores: sanitized }
  }

  if (provided.score == null || !provided.grade) {
    return { ok: false, error: 'Score and grade are required', status: 400 }
  }
  return {
    ok: true,
    score: provided.score,
    grade: provided.grade,
    metricScores: provided.metricScores ?? null,
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code } = await params
    const body = await request.json()
    const result = rateSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
    }

    const { stallId, remarks, metricScores, score, grade } = result.data

    const registration = await prisma.registration.findUnique({
      where: { registrationCode: code },
      include: { student: true, event: { include: { stalls: true } } }
    })

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    const resolved = await resolveEvaluationPayload(stallId, { score, grade, metricScores })
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error }, { status: resolved.status })
    }

    let volunteer = null
    if (session.role === 'VOLUNTEER' || session.role === 'LEAD_EVALUATOR' || session.role === 'COORDINATOR') {
      volunteer = await prisma.volunteer.findUnique({
        where: { email: session.email }
      })
      if (!volunteer) {
        return NextResponse.json({ error: 'Volunteer record not found. Please contact administration.' }, { status: 403 })
      }
    } else {
      const eventVolunteer = await prisma.volunteerAssignment.findFirst({
        where: { eventId: registration.eventId },
        include: { volunteer: true }
      })

      if (eventVolunteer) {
        volunteer = eventVolunteer.volunteer
      } else {
        volunteer = await prisma.volunteer.findFirst()
      }

      if (!volunteer) {
        return NextResponse.json({ error: 'No volunteers available in the system. Please create a volunteer first.' }, { status: 400 })
      }
    }

    let stallVisit = await prisma.stallVisit.findUnique({
      where: {
        registrationId_stallId: {
          registrationId: registration.id,
          stallId
        }
      },
      include: { performance: true }
    })

    if (stallVisit && stallVisit.performance) {
      return NextResponse.json({ error: 'This stall has already been evaluated for this student.' }, { status: 400 })
    }

    if (!stallVisit) {
      stallVisit = await prisma.stallVisit.create({
        data: {
          registrationId: registration.id,
          stallId,
          studentId: registration.studentId,
          completedAt: new Date()
        },
        include: { performance: true }
      })
    } else {
      stallVisit = await prisma.stallVisit.update({
        where: { id: stallVisit.id },
        data: { completedAt: new Date() },
        include: { performance: true }
      })
    }

    const performance = await prisma.performance.upsert({
      where: { stallVisitId: stallVisit.id },
      update: {
        volunteerId: volunteer.id,
        score: resolved.score,
        grade: resolved.grade,
        metricScores: resolved.metricScores ?? undefined,
        remarks: remarks || ''
      },
      create: {
        stallVisitId: stallVisit.id,
        volunteerId: volunteer.id,
        score: resolved.score,
        grade: resolved.grade,
        metricScores: resolved.metricScores ?? undefined,
        remarks: remarks || ''
      }
    })

    const totalStalls = registration.event.stalls?.length || 0;

    const allVisits = await prisma.stallVisit.findMany({
      where: { registrationId: registration.id },
      include: { performance: true }
    });

    const gradedVisits = allVisits.filter(v => v.performance !== null);
    const isCompleted = totalStalls > 0 && gradedVisits.length >= totalStalls;

    if (isCompleted) {
      const totalScore = gradedVisits.reduce((acc, curr) => acc + (curr.performance?.score || 0), 0);
      const avgScore = totalScore / gradedVisits.length;

      let overallGrade = 'E';
      if (avgScore >= 9) overallGrade = 'A+';
      else if (avgScore >= 8) overallGrade = 'A';
      else if (avgScore >= 7) overallGrade = 'B';
      else if (avgScore >= 6) overallGrade = 'C';
      else if (avgScore >= 5) overallGrade = 'D';

      let topSkill = 'None';
      let highestScore = -1;
      for (const visit of gradedVisits) {
        if (visit.performance && visit.performance.score > highestScore) {
          highestScore = visit.performance.score;
          const stallInfo = registration.event.stalls.find((s: any) => s.id === visit.stallId);
          if (stallInfo) topSkill = `${stallInfo.name} (${(highestScore / 10) * 100}%)`;
        }
      }

      const existingReport = await prisma.reportCard.findFirst({
        where: { studentId: registration.studentId, eventId: registration.eventId }
      });

      if (existingReport) {
         await prisma.reportCard.update({
            where: { id: existingReport.id },
            data: { totalScore, overallGrade, topSkill, skillsAssessed: gradedVisits.length, status: 'GENERATED', generatedAt: new Date() }
         });
      } else {
         const reportCode = `RC-${Math.floor(1000 + Math.random() * 9000)}`;
         await prisma.reportCard.create({
            data: {
              reportCode,
              studentId: registration.studentId,
              eventId: registration.eventId,
              totalScore,
              overallGrade,
              topSkill,
              skillsAssessed: gradedVisits.length,
              status: 'GENERATED',
              generatedAt: new Date()
            }
         });
      }

      await prisma.registration.update({
        where: { id: registration.id },
        data: { status: 'COMPLETED', completedAt: new Date() }
      })
    } else {
      await prisma.registration.update({
        where: { id: registration.id },
        data: { status: 'IN_PROGRESS' }
      })
    }

    return NextResponse.json({ success: true, performance })
  } catch (error) {
    console.error('Rating performance error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — Edit an existing evaluation (Admin/Manager only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['ADMIN', 'MANAGER'].includes(session.role)) {
      return NextResponse.json({ error: 'Only admins can edit evaluations' }, { status: 403 })
    }

    const { code } = await params
    const body = await request.json()
    const result = rateSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
    }

    const { stallId, remarks, metricScores, score, grade } = result.data

    const registration = await prisma.registration.findUnique({
      where: { registrationCode: code },
      include: { student: true, event: { include: { stalls: true } } }
    })

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    const resolved = await resolveEvaluationPayload(stallId, { score, grade, metricScores })
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error }, { status: resolved.status })
    }

    const stallVisit = await prisma.stallVisit.findUnique({
      where: {
        registrationId_stallId: {
          registrationId: registration.id,
          stallId
        }
      },
      include: { performance: true }
    })

    if (!stallVisit || !stallVisit.performance) {
      return NextResponse.json({ error: 'No existing evaluation found to edit' }, { status: 404 })
    }

    const performance = await prisma.performance.update({
      where: { id: stallVisit.performance.id },
      data: {
        score: resolved.score,
        grade: resolved.grade,
        metricScores: resolved.metricScores ?? undefined,
        remarks: remarks || ''
      }
    })

    const totalStalls = registration.event.stalls?.length || 0
    const allVisits = await prisma.stallVisit.findMany({
      where: { registrationId: registration.id },
      include: { performance: true }
    })
    const gradedVisits = allVisits.filter(v => v.performance !== null)
    const isCompleted = totalStalls > 0 && gradedVisits.length >= totalStalls

    if (isCompleted) {
      const totalScore = gradedVisits.reduce((acc, curr) => acc + (curr.performance?.score || 0), 0)
      const avgScore = totalScore / gradedVisits.length

      let overallGrade = 'E'
      if (avgScore >= 9) overallGrade = 'A+'
      else if (avgScore >= 8) overallGrade = 'A'
      else if (avgScore >= 7) overallGrade = 'B'
      else if (avgScore >= 6) overallGrade = 'C'
      else if (avgScore >= 5) overallGrade = 'D'

      let topSkill = 'None'
      let highestScore = -1
      for (const visit of gradedVisits) {
        if (visit.performance && visit.performance.score > highestScore) {
          highestScore = visit.performance.score
          const stallInfo = registration.event.stalls.find((s: any) => s.id === visit.stallId)
          if (stallInfo) topSkill = `${stallInfo.name} (${(highestScore / 10) * 100}%)`
        }
      }

      const existingReport = await prisma.reportCard.findFirst({
        where: { studentId: registration.studentId, eventId: registration.eventId }
      })

      if (existingReport) {
        await prisma.reportCard.update({
          where: { id: existingReport.id },
          data: { totalScore, overallGrade, topSkill, skillsAssessed: gradedVisits.length, status: 'GENERATED', generatedAt: new Date() }
        })
      }
    }

    return NextResponse.json({ success: true, performance })
  } catch (error) {
    console.error('Edit evaluation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
