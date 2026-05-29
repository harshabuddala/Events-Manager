import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role === 'VOLUNTEER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const stalls = await prisma.stall.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, code: true, name: true },
      orderBy: { name: 'asc' },
    })

    const volunteers = await prisma.volunteer.findMany({
      where: { status: { in: ['AVAILABLE', 'ASSIGNED'] } },
      select: { id: true, name: true, role: true, email: true },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ stalls, volunteers })
  } catch (error) {
    console.error('Fetch available resources error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
