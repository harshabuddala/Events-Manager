import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { sendReportMessage, formatPhone } from '@/lib/whatsapp'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { registrationId } = body

    if (!registrationId) {
      return NextResponse.json({ error: 'registrationId is required' }, { status: 400 })
    }

    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        student: { select: { name: true, rollNumber: true, grade: true, age: true, parentName: true, phoneNumber: true } },
        event: {
          select: {
            name: true,
            date: true,
            community: { select: { name: true } },
            stalls: { where: { status: 'ACTIVE' }, select: { id: true, name: true, metrics: true } },
          },
        },
        stallVisits: {
          include: {
            stall: { select: { name: true, metrics: true } },
            performance: { select: { score: true, grade: true, remarks: true, metricScores: true } },
          },
        },
      },
    })

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    if (!registration.student.phoneNumber) {
      return NextResponse.json({ error: 'No phone number on file for this student' }, { status: 400 })
    }

    const phone = formatPhone(registration.student.phoneNumber)
    const parentName = registration.student.parentName || 'Parent'
    const studentName = registration.student.name
    const rollNumber = registration.student.rollNumber
    const eventName = registration.event.name
    const totalStalls = registration.event.stalls.length
    const visitedStalls = registration.stallVisits.filter(sv => sv.performance).length

    const scores = registration.stallVisits
      .filter(sv => sv.performance)
      .map(sv => sv.performance!.score)

    const avgScore = scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : 0

    const grades = registration.stallVisits
      .filter(sv => sv.performance)
      .map(sv => sv.performance!.grade)

    const gradeCounts: Record<string, number> = {}
    grades.forEach(g => { gradeCounts[g] = (gradeCounts[g] || 0) + 1 })
    const topGrade = Object.entries(gradeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

    // Generate PDF report card using existing design
    const { generateReportCardPdf } = await import('@/lib/report-card-pdf')
    const reportPdfBuffer = await generateReportCardPdf({
      student: {
        name: studentName,
        rollNumber,
        grade: registration.student.grade,
        age: registration.student.age,
        parentName: registration.student.parentName,
      },
      event: {
        name: eventName,
        date: registration.event.date.toISOString(),
        community: registration.event.community,
      },
      stallVisits: registration.stallVisits,
      registrationCode: registration.registrationCode,
    })

    const result = await sendReportMessage(
      phone,
      parentName,
      studentName,
      eventName,
      totalStalls,
      visitedStalls,
      avgScore,
      topGrade,
      rollNumber,
      reportPdfBuffer
    )

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        message: `Report card PDF sent to ${phone}`,
      })
    }

    return NextResponse.json({
      success: false,
      error: result.error,
      message: 'Failed to send WhatsApp message',
    }, { status: 500 })
  } catch (error) {
    console.error('Send report WhatsApp error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
