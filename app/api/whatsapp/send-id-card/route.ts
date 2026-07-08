import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { sendImageMessage, uploadMedia, formatPhone } from '@/lib/whatsapp'

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
        event: { select: { name: true, community: { select: { name: true } } } },
      },
    })

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    if (!registration.student.phoneNumber) {
      return NextResponse.json({ error: 'No phone number on file' }, { status: 400 })
    }

    const phone = formatPhone(registration.student.phoneNumber)
    const studentName = registration.student.name
    const rollNumber = registration.student.rollNumber
    const eventName = registration.event.name

    const caption = `🎓 ID Card — ${studentName}\n\n` +
      `Roll Number: ${rollNumber}\n` +
      `Event: ${eventName}\n\n` +
      `Present this at the event entry.`

    const mediaId = await uploadMedia(
      Buffer.from('placeholder'),
      'image/png',
      `${rollNumber}-id-card.png`
    )

    const result = await sendImageMessage(phone, mediaId, caption)

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        message: `ID card sent to ${phone}`,
      })
    }

    return NextResponse.json({
      success: false,
      error: result.error,
      message: 'Failed to send ID card',
    }, { status: 500 })
  } catch (error) {
    console.error('Send ID card WhatsApp error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
