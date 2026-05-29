import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { z } from 'zod'

const querySchema = z.object({
  q: z.string().max(200).optional(),
  status: z.enum(['ALL', 'PENDING', 'GENERATED', 'PRINTED']).optional(),
})

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const statusFilter = searchParams.get('status') || 'ALL'

    const where: any = {}
    if (statusFilter !== 'ALL') {
      where.status = statusFilter.toUpperCase()
    }

    const reportCards = await prisma.reportCard.findMany({
      where,
      include: {
        student: {
          select: {
            rollNumber: true,
            name: true,
            grade: true,
            registrations: {
              include: {
                event: { include: { community: { select: { name: true } } } },
              },
              take: 1,
              orderBy: { registeredAt: 'desc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const reports = reportCards
      .filter(r => {
        if (!query) return true
        const q = query.toLowerCase()
        return (
          r.student.name.toLowerCase().includes(q) ||
          r.student.rollNumber.toLowerCase().includes(q) ||
          r.reportCode.toLowerCase().includes(q)
        )
      })
      .map(r => {
        const community = r.student.registrations[0]?.event?.community?.name || '—'
        const date = r.generatedAt
          ? new Date(r.generatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : 'Pending Evaluation'
        return {
          id: r.id,
          code: r.reportCode,
          roll: r.student.rollNumber,
          name: r.student.name,
          grade: r.student.grade,
          community,
          score: r.totalScore > 0 ? `${r.totalScore}%` : '—',
          overallGrade: r.overallGrade || '—',
          topSkill: r.topSkill || '—',
          status: r.status.toLowerCase() === 'pending' ? 'pending' : 'generated',
          date,
          rawDate: r.generatedAt,
        }
      })

    return NextResponse.json({ reports })
  } catch (error) {
    console.error('Reports API error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
