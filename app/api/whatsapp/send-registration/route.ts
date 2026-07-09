import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { sendIdCardMessage, formatPhone } from '@/lib/whatsapp'

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
        student: { select: { name: true, rollNumber: true, grade: true, parentName: true, phoneNumber: true } },
        event: { select: { id: true, name: true, date: true, community: { select: { name: true } } } },
      },
    })

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    if (!registration.student.phoneNumber) {
      return NextResponse.json({ error: 'No phone number on file' }, { status: 400 })
    }

    const phone = formatPhone(registration.student.phoneNumber)

    const eventDate = new Date(registration.event.date).toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    // Generate ID card PDF using existing design
    const { generateIdCardPdf } = await import('@/lib/id-card-pdf')
    const idCardPdfBuffer = await generateIdCardPdf({
      student: {
        name: registration.student.name,
        rollNumber: registration.student.rollNumber,
        grade: registration.student.grade,
        parentName: registration.student.parentName,
      },
      event: {
        name: registration.event.name,
      },
      qrToken: registration.qrToken || registration.registrationCode,
    })

    // Send with customizable template
    const result = await sendIdCardMessage(
      phone,
      registration.student.parentName || 'Parent',
      registration.student.name,
      registration.event.name,
      registration.student.rollNumber,
      registration.student.grade,
      eventDate,
      registration.event.community?.name || '',
      registration.registrationCode,
      idCardPdfBuffer
    )

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        message: `Registration confirmation with ID card sent to ${phone}`,
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
