import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { readJsonBody } from '@/lib/request'
import { getRazorpayInstance, getRazorpayKeyId } from '@/lib/razorpay'
import { z } from 'zod'

const studentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  grade: z.string().min(1, 'Class/Grade is required').max(20),
  age: z.union([z.coerce.number().int().min(1).max(100), z.literal('')]).optional(),
})

const orderSchema = z.object({
  phoneNumber: z.string().min(1, 'Phone number is required').max(30),
  parentName: z.string().min(1, 'Parent/guardian name is required').max(200),
  students: z.array(studentSchema).min(1, 'At least one student is required').max(10),
})

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
    if (event.status === 'CANCELLED' || event.status === 'COMPLETED') {
      return NextResponse.json({ error: 'This event is not accepting registrations' }, { status: 410 })
    }
    if (!event.isPublicRegistrationEnabled) {
      return NextResponse.json({ error: 'Public registration is disabled' }, { status: 403 })
    }
    if (!event.registrationFee || event.registrationFee.toNumber() <= 0) {
      return NextResponse.json({ error: 'This event is free. Use the regular registration endpoint.' }, { status: 400 })
    }

    const parsed = await readJsonBody(request, orderSchema)
    if (!parsed.ok) return parsed.response
    const { phoneNumber, parentName, students } = parsed.data

    const feePerStudent = event.registrationFee.toNumber()
    const totalAmount = feePerStudent * students.length

    const razorpay = await getRazorpayInstance()
    const amountInPaise = Math.round(totalAmount * 100)

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: event.feeCurrency,
      receipt: `evt_${eventId.slice(0, 8)}_${Date.now()}`,
      notes: { eventId, eventName: event.name, studentCount: students.length.toString() },
    })

    const payment = await prisma.payment.create({
      data: {
        eventId,
        razorpayOrderId: order.id,
        amount: totalAmount,
        currency: event.feeCurrency,
        status: 'CREATED',
        studentSnapshot: { phoneNumber, parentName, students, studentCount: students.length },
      },
    })

    const keyId = await getRazorpayKeyId()

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      prefill: { contact: phoneNumber, name: parentName },
      paymentId: payment.id,
    })
  } catch (error) {
    console.error('Create order error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 })
  }
}
