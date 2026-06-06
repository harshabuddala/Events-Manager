import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { readJsonBody } from '@/lib/request'
import { generateQrToken } from '@/lib/utils'
import { z } from 'zod'

const quickRegSchema = z.object({
  rollNumber: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  grade: z.string().min(1).max(20),
  age: z.union([z.coerce.number().int().min(1).max(100), z.literal('')]).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phoneNumber: z.string().optional().or(z.literal('')),
  parentName: z.string().optional().or(z.literal('')),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)

    // Next roll number helper
    if (searchParams.get('action') === 'nextRoll') {
      const prefix = searchParams.get('prefix') || 'EDU'
      const count = await prisma.student.count({
        where: { rollNumber: { startsWith: prefix + '-' } },
      })
      const next = String(count + 1).padStart(4, '0')
      return NextResponse.json({ rollNumber: `${prefix}-${next}` })
    }

    const isStaff = session.role === 'ADMIN' || session.role === 'MANAGER'
    const studentSelect = isStaff
      ? { id: true, rollNumber: true, name: true, grade: true, age: true, email: true, parentName: true, phoneNumber: true }
      : { id: true, rollNumber: true, name: true, grade: true }

    const registrations = await prisma.registration.findMany({
      where: { eventId: id },
      select: {
        id: true,
        registrationCode: true,
        qrToken: true,
        status: true,
        registeredAt: true,
        completedAt: true,
        notes: true,
        registeredBy: true,
        student: { select: studentSelect },
        stallVisits: {
          include: {
            stall: { select: { id: true, name: true, metrics: true } },
            performance: { select: { score: true, grade: true, remarks: true, metricScores: true } },
          },
        },
        event: {
          select: {
            stalls: {
              where: { status: 'ACTIVE' },
              select: { id: true, code: true, name: true, metrics: true },
            },
          },
        },
      },
      orderBy: { registeredAt: 'desc' },
    })

    return NextResponse.json({ registrations })
  } catch (error) {
    console.error('Event registrations error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper to derive community code from community name
const getCommunityCode = (name: string): string => {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 4).toUpperCase();
  const acronym = words.map(w => w[0]).join('').toUpperCase();
  return acronym.length <= 4 ? acronym : words[0].slice(0, 3).toUpperCase();
};

// Helper to get the next sequential roll number safely
async function getNextRollNumber(prefix: string): Promise<string> {
  const highestStudent = await prisma.student.findFirst({
    where: { rollNumber: { startsWith: prefix + '-' } },
    orderBy: { rollNumber: 'desc' },
    select: { rollNumber: true }
  });
  
  let nextNum = 1;
  if (highestStudent) {
    const match = highestStudent.rollNumber.match(/-(\d+)$/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }
  return `${prefix}-${String(nextNum).padStart(4, '0')}`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: eventId } = await params

    // RBAC: Volunteers can only register students for events they are assigned to
    if (session.role === 'VOLUNTEER' || session.role === 'LEAD_EVALUATOR' || session.role === 'COORDINATOR') {
      const volunteer = await prisma.volunteer.findUnique({
        where: { email: session.email },
        include: {
          assignments: {
            where: { eventId },
          },
        },
      })
      if (!volunteer || volunteer.assignments.length === 0) {
        return NextResponse.json({ error: 'You are not assigned to this event' }, { status: 403 })
      }
    }

    // Admins/Managers can always register
    const parsed = await readJsonBody(request, quickRegSchema)
    if (!parsed.ok) return parsed.response
    const result = parsed.data

    const { rollNumber, name, grade, age, email, phoneNumber, parentName } = result

    // Fetch the event to get the community name for prefix derivation
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { community: true },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const communityCode = getCommunityCode(event.community.name)
    const prefix = `EDU-${communityCode}`

    let student = null
    let attempts = 0
    let currentRoll = rollNumber

    // If the frontend sent a temporary roll number placeholder
    if (currentRoll.includes('....') || currentRoll.includes('?')) {
      currentRoll = await getNextRollNumber(prefix)
    }

    while (attempts < 10) {
      // Check if student with this roll number already exists
      const existingStudent = await prisma.student.findUnique({
        where: { rollNumber: currentRoll },
      })

      if (!existingStudent) {
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
          break // Success!
        } catch (err: any) {
          // If a race condition occurred and another request created this rollNumber in the split second
          if (err.code === 'P2002') {
            attempts++
            currentRoll = await getNextRollNumber(prefix)
            continue
          }
          throw err
        }
      } else {
        // Conflict detected! The roll number is already in use by another student.
        // Auto-increment and try the next sequential number to prevent overwrite or error.
        attempts++
        currentRoll = await getNextRollNumber(prefix)
      }
    }

    if (!student) {
      return NextResponse.json({ error: 'Failed to generate a unique roll number. Please try again.' }, { status: 409 })
    }

    // Check if already registered
    const existing = await prisma.registration.findFirst({
      where: { eventId, studentId: student.id },
    })
    if (existing) {
      return NextResponse.json({ error: `${name} is already registered for this event` }, { status: 409 })
    }

    // Generate registration code and opaque QR token
    const regCode = `REG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
    const qrToken = generateQrToken()

    const registration = await prisma.registration.create({
      data: {
        registrationCode: regCode,
        qrToken,
        eventId,
        studentId: student.id,
        status: 'REGISTERED',
        registeredBy: session.role === 'ADMIN' || session.role === 'MANAGER' ? 'ADMIN' : 'VOLUNTEER',
      },
      include: {
        student: { select: { id: true, rollNumber: true, name: true, grade: true, age: true, email: true, parentName: true, phoneNumber: true } },
        stallVisits: { include: { stall: { select: { name: true } }, performance: { select: { score: true, grade: true } } } },
      },
    })

    return NextResponse.json({ registration }, { status: 201 })
  } catch (error) {
    console.error('Quick register error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

const editStudentSchema = z.object({
  studentId: z.string().min(1),
  name: z.string().min(1).max(200),
  grade: z.string().min(1).max(20),
  age: z.union([z.coerce.number().int().min(1).max(100), z.literal('')]).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phoneNumber: z.string().optional().or(z.literal('')),
  parentName: z.string().optional().or(z.literal('')),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: eventId } = await params

    // RBAC: Volunteers can only edit registrations for events they are assigned to
    if (session.role === 'VOLUNTEER' || session.role === 'LEAD_EVALUATOR' || session.role === 'COORDINATOR') {
      const volunteer = await prisma.volunteer.findUnique({
        where: { email: session.email },
        include: {
          assignments: {
            where: { eventId },
          },
        },
      })
      if (!volunteer || volunteer.assignments.length === 0) {
        return NextResponse.json({ error: 'You are not assigned to this event' }, { status: 403 })
      }
    }
    const parsed = await readJsonBody(request, editStudentSchema)
    if (!parsed.ok) return parsed.response
    const result = parsed.data

    const { studentId, name, grade, age, email, phoneNumber, parentName } = result

    // Update student details
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        name,
        grade,
        age: age ? Number(age) : null,
        email: email || null,
        phoneNumber: phoneNumber || null,
        parentName: parentName || null,
      }
    })

    // Fetch updated registration
    const updatedRegistration = await prisma.registration.findUnique({
      where: {
        eventId_studentId: {
          eventId,
          studentId: updatedStudent.id
        }
      },
      include: {
        student: { select: { id: true, rollNumber: true, name: true, grade: true, age: true, email: true, parentName: true, phoneNumber: true } },
        stallVisits: { include: { stall: { select: { name: true } }, performance: { select: { score: true, grade: true } } } },
      }
    })

    return NextResponse.json({ registration: updatedRegistration })
  } catch (error) {
    console.error('Edit student error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only ADMIN and MANAGER can delete registrations
    if (session.role !== 'ADMIN' && session.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: eventId } = await params
    const body = await request.json()
    const { registrationId } = body

    if (!registrationId || typeof registrationId !== 'string') {
      return NextResponse.json({ error: 'registrationId is required' }, { status: 400 })
    }

    // Verify the registration exists and belongs to this event
    const registration = await prisma.registration.findFirst({
      where: { id: registrationId, eventId },
      include: { stallVisits: true }
    })

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    // Delete in transaction: performances -> stallVisits -> registration
    await prisma.$transaction(async (tx) => {
      const stallVisitIds = registration.stallVisits.map(sv => sv.id)
      if (stallVisitIds.length > 0) {
        await tx.performance.deleteMany({
          where: { stallVisitId: { in: stallVisitIds } }
        })
        await tx.stallVisit.deleteMany({
          where: { id: { in: stallVisitIds } }
        })
      }
      await tx.registration.delete({
        where: { id: registrationId }
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete registration error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

