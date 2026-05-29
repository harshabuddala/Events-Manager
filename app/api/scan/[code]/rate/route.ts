import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { hash } from 'bcryptjs'
import { z } from 'zod'

const rateSchema = z.object({
  stallId: z.string().min(1, 'Stall is required'),
  score: z.number().min(1).max(10),
  grade: z.string().min(1, 'Grade is required').max(10),
  remarks: z.string().optional().or(z.literal('')),
})

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

    const { stallId, score, grade, remarks } = result.data

    // Fetch the registration using the registration code
    const registration = await prisma.registration.findUnique({
      where: { registrationCode: code },
      include: { student: true, event: { include: { stalls: true } } }
    })

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    // Determine volunteer context based on logged-in user
    let volunteer = null
    if (session.role === 'VOLUNTEER') {
      volunteer = await prisma.volunteer.findUnique({
        where: { email: session.email }
      })
      if (!volunteer) {
        return NextResponse.json({ error: 'Volunteer record not found. Please contact administration.' }, { status: 403 })
      }
    } else {
      // Admins/Managers can also evaluate using an arbitrary volunteer or a dummy coordinator
      // Let's find first volunteer in the event or create a system volunteer
      volunteer = await prisma.volunteer.findFirst()
      if (!volunteer) {
      // Fallback create dummy evaluation volunteer
      volunteer = await prisma.volunteer.create({
        data: {
          name: 'System Evaluator',
          email: 'system.evaluator@example.com',
          password: await hash('System@Eval123', 12),
          role: 'LEAD_EVALUATOR',
          status: 'AVAILABLE'
        }
      })
      }
    }

    // 1. Find or create StallVisit record
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
      // Mark it as completed if not done
      stallVisit = await prisma.stallVisit.update({
        where: { id: stallVisit.id },
        data: { completedAt: new Date() },
        include: { performance: true }
      })
    }

    // 2. Upsert the Performance record
    const performance = await prisma.performance.upsert({
      where: { stallVisitId: stallVisit.id },
      update: {
        volunteerId: volunteer.id,
        score: parseFloat(score.toString()),
        grade,
        remarks: remarks || ''
      },
      create: {
        stallVisitId: stallVisit.id,
        volunteerId: volunteer.id,
        score: parseFloat(score.toString()),
        grade,
        remarks: remarks || ''
      }
    })

    // 3. Check if all stalls are completed
    const totalStalls = registration.event.stalls?.length || 0;
    
    // Fetch all stall visits for this registration that have a performance
    const allVisits = await prisma.stallVisit.findMany({
      where: { registrationId: registration.id },
      include: { performance: true }
    });
    
    const gradedVisits = allVisits.filter(v => v.performance !== null);
    const isCompleted = totalStalls > 0 && gradedVisits.length >= totalStalls;
    
    if (isCompleted) {
      // Calculate overall score
      const totalScore = gradedVisits.reduce((acc, curr) => acc + (curr.performance?.score || 0), 0);
      const avgScore = totalScore / gradedVisits.length;
      
      // Determine overall grade
      let overallGrade = 'E';
      if (avgScore >= 9) overallGrade = 'A+';
      else if (avgScore >= 8) overallGrade = 'A';
      else if (avgScore >= 7) overallGrade = 'B';
      else if (avgScore >= 6) overallGrade = 'C';
      else if (avgScore >= 5) overallGrade = 'D';
      
      // Determine top skill (stall with highest score)
      let topSkill = 'None';
      let highestScore = -1;
      for (const visit of gradedVisits) {
        if (visit.performance && visit.performance.score > highestScore) {
          highestScore = visit.performance.score;
          const stallInfo = registration.event.stalls.find((s: any) => s.id === visit.stallId);
          if (stallInfo) topSkill = `${stallInfo.name} (${(highestScore / 10) * 100}%)`;
        }
      }
      
      // Check if report card exists
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
      // Keep registration status updated (e.g. IN_PROGRESS)
      await prisma.registration.update({
        where: { id: registration.id },
        data: { status: 'IN_PROGRESS' }
      })
    }

    return NextResponse.json({ success: true, performance })
  } catch (error) {
    console.error('Rating performance error:', error instanceof Error ? error.message : 'Unknown')
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

    // Only admins/managers can edit evaluations
    if (!['ADMIN', 'MANAGER'].includes(session.role)) {
      return NextResponse.json({ error: 'Only admins can edit evaluations' }, { status: 403 })
    }

    const { code } = await params
    const body = await request.json()
    const result = rateSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
    }

    const { stallId, score, grade, remarks } = result.data

    const registration = await prisma.registration.findUnique({
      where: { registrationCode: code },
      include: { student: true, event: { include: { stalls: true } } }
    })

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    // Find the existing stall visit
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

    // Update the performance record
    const performance = await prisma.performance.update({
      where: { id: stallVisit.performance.id },
      data: {
        score: parseFloat(score.toString()),
        grade,
        remarks: remarks || ''
      }
    })

    // Recalculate report card if all stalls are completed
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
    console.error('Edit evaluation error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
