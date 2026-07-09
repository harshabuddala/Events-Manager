import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { readJsonBody } from '@/lib/request'
import { verifyPaymentSignature } from '@/lib/razorpay'
import { generateQrToken } from '@/lib/utils'
import { z } from 'zod'

const studentSchema = z.object({
  name: z.string().min(1),
  grade: z.string().min(1),
  age: z.union([z.coerce.number().int().min(1).max(100), z.literal('')]).optional(),
})

const verifySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  phoneNumber: z.string().min(1),
  parentName: z.string().min(1),
  students: z.array(studentSchema).min(1).max(10),
})

const getCommunityCode = (name: string): string => {
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return words[0].slice(0, 4).toUpperCase()
  const acronym = words.map(w => w[0]).join('').toUpperCase()
  return acronym.length <= 4 ? acronym : words[0].slice(0, 3).toUpperCase()
}

async function getNextRollNumber(prefix: string, tx: any): Promise<string> {
  const highest = await tx.student.findFirst({
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { community: true },
    })
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    const parsed = await readJsonBody(request, verifySchema)
    if (!parsed.ok) return parsed.response
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, phoneNumber, parentName, students } = parsed.data

    // Verify signature
    const isValid = await verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)
    if (!isValid) {
      await prisma.payment.update({
        where: { razorpayOrderId: razorpay_order_id },
        data: { status: 'FAILED', errorDescription: 'Signature verification failed' },
      })
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 })
    }

    // Find payment
    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId: razorpay_order_id },
    })
    if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    if (payment.eventId !== eventId) return NextResponse.json({ error: 'Event mismatch' }, { status: 400 })

    // Idempotent: if already captured, return existing registrations
    if (payment.status === 'CAPTURED') {
      const existingRegs = await prisma.registration.findMany({
        where: { eventId, student: { phoneNumber }, paymentRequired: true },
        include: {
          student: { select: { id: true, rollNumber: true, name: true, grade: true, age: true, parentName: true, phoneNumber: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: students.length,
      })
      if (existingRegs.length > 0) {
        return NextResponse.json({ registrations: existingRegs }, { status: 200 })
      }
    }

    // Create all students + registrations in one transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update payment to CAPTURED
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          status: 'CAPTURED',
          capturedAt: new Date(),
        },
      })

      const communityCode = getCommunityCode(event.community.name)
      const prefix = `EDU-${communityCode}`
      const registrations: any[] = []

      for (const studentData of students) {
        // Race-condition-safe roll number creation
        let student = null
        let attempts = 0
        let currentRoll = await getNextRollNumber(prefix, tx)

        while (attempts < 10) {
          const existing = await tx.student.findUnique({ where: { rollNumber: currentRoll } })
          if (!existing) {
            try {
              student = await tx.student.create({
                data: {
                  rollNumber: currentRoll,
                  name: studentData.name,
                  grade: studentData.grade,
                  age: studentData.age ? Number(studentData.age) : null,
                  phoneNumber,
                  parentName,
                },
              })
              break
            } catch (err: any) {
              if (err.code === 'P2002') {
                attempts++
                currentRoll = await getNextRollNumber(prefix, tx)
                continue
              }
              throw err
            }
          } else {
            attempts++
            currentRoll = await getNextRollNumber(prefix, tx)
          }
        }

        if (!student) throw new Error(`Could not generate unique roll number for ${studentData.name}`)

        const regCode = `REG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
        const qrToken = generateQrToken()

        const registration = await tx.registration.create({
          data: {
            registrationCode: regCode,
            qrToken,
            eventId,
            studentId: student.id,
            status: 'REGISTERED',
            registeredBy: 'PUBLIC',
            paymentRequired: true,
          },
          include: {
            student: { select: { id: true, rollNumber: true, name: true, grade: true, age: true, parentName: true, phoneNumber: true } },
          },
        })

        // Link first registration to payment
        if (registrations.length === 0) {
          await tx.payment.update({
            where: { id: payment.id },
            data: { registrationId: registration.id },
          })
        }

        registrations.push(registration)
      }

      return { registrations }
    })

    // Auto-send WhatsApp ID cards (non-blocking)
    try {
      const { autoSendOnRegistration } = await import('@/lib/whatsapp')
      for (const reg of result.registrations) {
        autoSendOnRegistration({
          student: reg.student,
          event: { name: event.name, date: event.date, community: event.community },
          registrationCode: reg.registrationCode,
          qrToken: reg.qrToken || reg.registrationCode,
        }).catch(() => {})
      }
    } catch {}

    return NextResponse.json({ registrations: result.registrations }, { status: 201 })
  } catch (error) {
    console.error('Verify payment error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 })
  }
}
