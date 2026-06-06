import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { publicRegRateLimiter } from '@/lib/rate-limiter'
import { readJsonBody } from '@/lib/request'
import { generateQrToken } from '@/lib/utils'
import { z } from 'zod'

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() || '127.0.0.1'
}

const publicRegSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  grade: z.string().min(1, 'Class/Grade is required').max(20),
  age: z.union([z.coerce.number().int().min(1).max(100), z.literal('')]).optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phoneNumber: z.string().min(1, 'Parent phone number is required').max(30),
  parentName: z.string().min(1, 'Parent/guardian name is required').max(200),
})

// Derive short community code from name
const getCommunityCode = (name: string): string => {
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return words[0].slice(0, 4).toUpperCase()
  const acronym = words.map(w => w[0]).join('').toUpperCase()
  return acronym.length <= 4 ? acronym : words[0].slice(0, 3).toUpperCase()
}

async function getNextRollNumber(prefix: string): Promise<string> {
  const highest = await prisma.student.findFirst({
    where: { rollNumber: { startsWith: prefix + '-' } },
    orderBy: { rollNumber: 'desc' },
    select: { rollNumber: true },
  })
  let nextNum = 1
  if (highest) {
    const match = highest.rollNumber.match(/-(\d+)$/)
    if (match) nextNum = parseInt(match[1], 10) + 1
  }
  return `${prefix}-${String(nextNum).padStart(4, '0')}`
}

// GET — returns event info (name, date, status) for the public registration page header
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const event = await prisma.event.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        code: true,
        date: true,
        endDate: true,
        status: true,
        description: true,
        isPublicRegistrationEnabled: true,
        community: { select: { name: true, location: true } },
      },
    })
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    if (event.status === 'CANCELLED') {
      return NextResponse.json({ error: 'This event has been cancelled' }, { status: 410 })
    }
    if (event.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Registrations for this event are closed' }, { status: 410 })
    }
    if (!event.isPublicRegistrationEnabled) {
      return NextResponse.json({ error: 'Public registration for this event is currently disabled' }, { status: 403 })
    }
    return NextResponse.json({ event })
  } catch (error) {
    console.error('Public event fetch error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — create a new public registration (no auth required)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const clientIp = getClientIp(request)
  try {
    await publicRegRateLimiter.consume(`public-reg:${clientIp}`)
  } catch {
    return NextResponse.json(
      { error: 'Too many registration attempts from your IP. Please try again later.' },
      { status: 429 }
    )
  }

  try {
    const { id: eventId } = await params

    // Validate event exists and is open for registration
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { community: true },
    })
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    if (event.status === 'CANCELLED') {
      return NextResponse.json({ error: 'This event has been cancelled' }, { status: 410 })
    }
    if (event.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Registrations for this event are closed' }, { status: 410 })
    }
    if (!event.isPublicRegistrationEnabled) {
      return NextResponse.json({ error: 'Public registration for this event is currently disabled' }, { status: 403 })
    }

    const parsed = await readJsonBody(request, publicRegSchema)
    if (!parsed.ok) return parsed.response
    const result = parsed.data

    const { name, grade, age, email, phoneNumber, parentName } = result

    const communityCode = getCommunityCode(event.community.name)
    const prefix = `EDU-${communityCode}`

    // Race-condition-safe roll number creation
    let student = null
    let attempts = 0
    let currentRoll = await getNextRollNumber(prefix)

    while (attempts < 10) {
      const existing = await prisma.student.findUnique({ where: { rollNumber: currentRoll } })
      if (!existing) {
        try {
          student = await prisma.student.create({
            data: {
              rollNumber: currentRoll,
              name,
              grade,
              age: age ? Number(age) : null,
              ...(email ? { email } : {}),
              ...(phoneNumber ? { phoneNumber } : {}),
              ...(parentName ? { parentName } : {}),
            },
          })
          break
        } catch (err: any) {
          if (err.code === 'P2002') {
            attempts++
            currentRoll = await getNextRollNumber(prefix)
            continue
          }
          throw err
        }
      } else {
        attempts++
        currentRoll = await getNextRollNumber(prefix)
      }
    }

    if (!student) {
      return NextResponse.json(
        { error: 'Could not generate a unique roll number. Please try again.' },
        { status: 409 }
      )
    }

    // Check if already registered (shouldn't happen for new students but be safe)
    const existingReg = await prisma.registration.findFirst({
      where: { eventId, studentId: student.id },
    })
    if (existingReg) {
      return NextResponse.json({ error: 'Already registered for this event' }, { status: 409 })
    }

    const regCode = `REG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
    const qrToken = generateQrToken()

    const registration = await prisma.registration.create({
      data: {
        registrationCode: regCode,
        qrToken,
        eventId,
        studentId: student.id,
        status: 'REGISTERED',
        registeredBy: 'PUBLIC',
      },
      include: {
        student: {
          select: {
            id: true,
            rollNumber: true,
            name: true,
            grade: true,
            age: true,
            email: true,
            parentName: true,
            phoneNumber: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            date: true,
            community: { select: { name: true, location: true } },
          },
        },
      },
    })

    return NextResponse.json({ registration }, { status: 201 })
  } catch (error) {
    console.error('Public registration error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
