import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withApiKey } from '@/lib/api-auth'
import { apiSuccess, apiCreated, apiError, apiNotFound, apiPaginated } from '@/lib/api-response'
import { generateQrToken } from '@/lib/utils'
import { z } from 'zod'

const createSchema = z.object({
  eventId: z.string().uuid(),
  studentId: z.string().uuid().optional(),
  name: z.string().min(1).max(200).optional(),
  grade: z.string().min(1).max(20).optional(),
  age: z.number().int().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phoneNumber: z.string().max(30).optional(),
  parentName: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
  registeredBy: z.string().max(50).optional(),
})

const getCommunityCode = (name: string): string => {
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return words[0].slice(0, 4).toUpperCase()
  return words.map(w => w[0]).join('').toUpperCase().slice(0, 4)
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

export const GET = withApiKey(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))
  const status = searchParams.get('status')
  const eventId = searchParams.get('eventId')
  const q = searchParams.get('q')

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (eventId) where.eventId = eventId
  if (q) where.OR = [
    { registrationCode: { contains: q, mode: 'insensitive' } },
    { student: { name: { contains: q, mode: 'insensitive' } } },
    { student: { rollNumber: { contains: q, mode: 'insensitive' } } },
  ]

  const [registrations, total] = await Promise.all([
    prisma.registration.findMany({
      where,
      include: {
        student: { select: { id: true, rollNumber: true, name: true, grade: true } },
        event: { select: { id: true, name: true, code: true } },
      },
      orderBy: { registeredAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.registration.count({ where }),
  ])

  return apiPaginated(registrations, page, limit, total)
})

export const POST = withApiKey(async (request: NextRequest) => {
  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return apiError('VALIDATION_ERROR', parsed.error.issues[0].message)

  const { eventId, studentId, name, grade, age, email, phoneNumber, parentName, notes, registeredBy } = parsed.data

  const event = await prisma.event.findUnique({ where: { id: eventId }, include: { community: true } })
  if (!event) return apiNotFound('Event')
  if (event.status === 'CANCELLED') return apiError('EVENT_CANCELLED', 'This event has been cancelled')
  if (event.status === 'COMPLETED') return apiError('EVENT_COMPLETED', 'Registrations for this event are closed')

  let student

  if (studentId) {
    student = await prisma.student.findUnique({ where: { id: studentId } })
    if (!student) return apiNotFound('Student')
  } else {
    if (!name || !grade || !phoneNumber || !parentName) {
      return apiError('VALIDATION_ERROR', 'name, grade, phoneNumber, and parentName are required when studentId is not provided')
    }

    const communityCode = getCommunityCode(event.community.name)
    const prefix = `EDU-${communityCode}`

    let attempts = 0
    let currentRoll = await getNextRollNumber(prefix)

    while (attempts < 10) {
      const existing = await prisma.student.findUnique({ where: { rollNumber: currentRoll } })
      if (!existing) {
        try {
          student = await prisma.student.create({
            data: { rollNumber: currentRoll, name, grade, age: age || null, email: email || null, phoneNumber, parentName },
          })
          break
        } catch (err: unknown) {
          if ((err as { code?: string }).code === 'P2002') {
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

    if (!student) return apiError('ROLL_NUMBER_EXHAUSTED', 'Could not generate unique roll number')
  }

  const existingReg = await prisma.registration.findFirst({ where: { eventId, studentId: student.id } })
  if (existingReg) return apiError('ALREADY_REGISTERED', 'Student is already registered for this event')

  const regCode = `REG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
  const qrToken = generateQrToken()

  const registration = await prisma.registration.create({
    data: {
      registrationCode: regCode,
      qrToken,
      eventId,
      studentId: student.id,
      status: 'REGISTERED',
      notes: notes || null,
      registeredBy: registeredBy || 'API',
    },
    include: {
      student: { select: { id: true, rollNumber: true, name: true, grade: true, parentName: true, phoneNumber: true } },
      event: { select: { id: true, name: true, code: true, date: true, community: { select: { name: true } } } },
    },
  })

  // Auto-send WhatsApp ID card (non-blocking)
  try {
    const { autoSendOnRegistration } = await import('@/lib/whatsapp')
    autoSendOnRegistration({
      student: registration.student,
      event: registration.event,
      registrationCode: registration.registrationCode,
      qrToken: registration.qrToken || registration.registrationCode,
    }).catch(() => {})
  } catch {}

  return apiCreated(registration)
})
