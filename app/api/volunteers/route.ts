import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { hash } from 'bcryptjs'
import { z } from 'zod'

const querySchema = z.object({
  q: z.string().max(200).optional(),
  status: z.enum(['ALL', 'AVAILABLE', 'ASSIGNED', 'ON_LEAVE']).optional(),
  role: z.enum(['ALL', 'VOLUNTEER', 'LEAD_EVALUATOR', 'COORDINATOR']).optional(),
})

const createSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  phoneNumber: z.string().max(30).optional().or(z.literal('')),
  role: z.enum(['VOLUNTEER', 'LEAD_EVALUATOR', 'COORDINATOR']).optional(),
})

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const statusFilter = searchParams.get('status') || 'ALL'
    const roleFilter = searchParams.get('role') || 'ALL'

    const where: any = {}
    if (statusFilter !== 'ALL') {
      where.status = statusFilter.toUpperCase()
    }
    if (roleFilter !== 'ALL') {
      where.role = roleFilter.toUpperCase()
    }

    const volunteers = await prisma.volunteer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    const data = volunteers
      .filter(v => {
        if (!query) return true
        const q = query.toLowerCase()
        return v.name.toLowerCase().includes(q) || v.email.toLowerCase().includes(q)
      })
      .map(v => ({
        id: v.id,
        name: v.name,
        email: v.email,
        phone: v.phoneNumber || '—',
        role: v.role.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
        rawRole: v.role,
        preferredStall: v.preferredStall || '—',
        totalEvents: v.totalEvents,
        rating: v.rating,
        status: v.status.toLowerCase(),
        avatar: v.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
        hasPassword: !!v.password && v.password.length > 0,
      }))

    return NextResponse.json({ volunteers: data })
  } catch (error) {
    console.error('Volunteers API error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const result = createSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
    }

    const existing = await prisma.volunteer.findUnique({ where: { email: result.data.email } })
    if (existing) {
      return NextResponse.json({ error: 'Volunteer email already exists' }, { status: 409 })
    }

    const hashedPassword = await hash(result.data.password, 12)

    const volunteer = await prisma.volunteer.create({
      data: {
        name: result.data.name,
        email: result.data.email,
        password: hashedPassword,
        phoneNumber: result.data.phoneNumber || null,
        role: result.data.role || 'VOLUNTEER',
        status: 'AVAILABLE',
      },
    })

    return NextResponse.json({ volunteer }, { status: 201 })
  } catch (error) {
    console.error('Create volunteer error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
