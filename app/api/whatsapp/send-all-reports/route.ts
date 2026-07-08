import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { sendReportMessage, formatPhone } from '@/lib/whatsapp'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { eventId, registrationIds } = body

    let registrations

    if (registrationIds && Array.isArray(registrationIds)) {
      registrations = await prisma.registration.findMany({
        where: { id: { in: registrationIds } },
        include: {
          student: { select: { name: true, parentName: true, phoneNumber: true } },
          event: {
            select: {
              name: true,
              stalls: { where: { status: 'ACTIVE' }, select: { id: true } },
            },
          },
          stallVisits: {
            include: { performance: { select: { score: true, grade: true } } },
          },
        },
      })
    } else if (eventId) {
      registrations = await prisma.registration.findMany({
        where: { eventId },
        include: {
          student: { select: { name: true, parentName: true, phoneNumber: true } },
          event: {
            select: {
              name: true,
              stalls: { where: { status: 'ACTIVE' }, select: { id: true } },
            },
          },
          stallVisits: {
            include: { performance: { select: { score: true, grade: true } } },
          },
        },
      })
    } else {
      return NextResponse.json({ error: 'eventId or registrationIds required' }, { status: 400 })
    }

    if (registrations.length === 0) {
      return NextResponse.json({ error: 'No registrations found' }, { status: 404 })
    }

    const results = []

    for (const reg of registrations) {
      if (!reg.student.phoneNumber) {
        results.push({ id: reg.id, name: reg.student.name, success: false, error: 'No phone number' })
        continue
      }

      const phone = formatPhone(reg.student.phoneNumber)
      const totalStalls = reg.event.stalls.length
      const visitedStalls = reg.stallVisits.filter(sv => sv.performance).length
      const scores = reg.stallVisits.filter(sv => sv.performance).map(sv => sv.performance!.score)
      const avgScore = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0
      const grades = reg.stallVisits.filter(sv => sv.performance).map(sv => sv.performance!.grade)
      const gradeCounts: Record<string, number> = {}
      grades.forEach(g => { gradeCounts[g] = (gradeCounts[g] || 0) + 1 })
      const topGrade = Object.entries(gradeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

      const result = await sendReportMessage(
        phone,
        reg.student.parentName || 'Parent',
        reg.student.name,
        reg.event.name,
        totalStalls,
        visitedStalls,
        avgScore,
        topGrade
      )

      results.push({ id: reg.id, name: reg.student.name, ...result })

      await new Promise(resolve => setTimeout(resolve, 500))
    }

    const sent = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: results.length,
      results,
    })
  } catch (error) {
    console.error('Send all reports error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
