import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { sendRegistrationMessage, formatPhone } from '@/lib/whatsapp'
import QRCode from 'qrcode'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { registrationId } = body

    if (!registrationId) {
      return NextResponse.json({ error: 'registrationId is required' }, { status: 400 })
    }

    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        student: { select: { name: true, rollNumber: true, parentName: true, phoneNumber: true } },
        event: { select: { name: true, community: { select: { name: true } } } },
      },
    })

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    if (!registration.student.phoneNumber) {
      return NextResponse.json({ error: 'No phone number on file for this student' }, { status: 400 })
    }

    const phone = formatPhone(registration.student.phoneNumber)
    const parentName = registration.student.parentName || 'Parent'
    const studentName = registration.student.name
    const eventName = registration.event.name
    const rollNumber = registration.student.rollNumber
    const qrToken = registration.qrToken || registration.registrationCode

    const scanUrl = `${process.env.APP_URL || 'http://localhost:8472'}/r/${qrToken}`
    const qrBuffer = await QRCode.toBuffer(scanUrl, {
      width: 300,
      margin: 2,
      color: { dark: '#0a0f2d', light: '#ffffff' },
    })

    const result = await sendRegistrationMessage(
      phone,
      parentName,
      studentName,
      eventName,
      rollNumber,
      qrBuffer
    )

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        message: `Registration confirmation sent to ${phone}`,
      })
    }

    return NextResponse.json({
      success: false,
      error: result.error,
      message: 'Failed to send WhatsApp message',
    }, { status: 500 })
  } catch (error) {
    console.error('Send registration WhatsApp error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
