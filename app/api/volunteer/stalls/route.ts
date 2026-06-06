import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(_request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const where: any = {}

    if (session.role === 'VOLUNTEER' || session.role === 'LEAD_EVALUATOR' || session.role === 'COORDINATOR') {
      const volunteer = await prisma.volunteer.findUnique({
        where: { email: session.email },
        select: { id: true, assignments: { select: { stallId: true } } },
      })
      if (!volunteer) {
        return NextResponse.json({ stalls: [] })
      }
      const stallIds = Array.from(new Set(volunteer.assignments.map((a) => a.stallId)))
      if (stallIds.length === 0) {
        return NextResponse.json({ stalls: [] })
      }
      where.id = { in: stallIds }
    } else if (session.role !== 'ADMIN' && session.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const stalls = await prisma.stall.findMany({
      where,
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ stalls })
  } catch (error) {
    console.error('Volunteer stalls API error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
