import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: any = {}

    if (eventId && eventId !== 'all') {
      where.eventId = eventId
    }

    if (status && status !== 'all') {
      where.status = status as 'SUCCESS' | 'FAILED'
    }

    if (search) {
      where.OR = [
        { phoneNumber: { contains: search, mode: 'insensitive' } },
        { student: { name: { contains: search, mode: 'insensitive' } } },
        { student: { rollNumber: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const logs = await prisma.whatsAppLog.findMany({
      where,
      include: {
        event: { select: { name: true } },
        student: { select: { name: true, rollNumber: true } },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Safe limit for dashboard display
    })

    return NextResponse.json({ logs })
  } catch (error) {
    console.error('Fetch WhatsApp logs error:', error)
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
  }
}
