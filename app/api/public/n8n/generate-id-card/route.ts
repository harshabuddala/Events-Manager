import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateIdCardPdf } from '@/lib/id-card-pdf'
import { formatPhone } from '@/lib/whatsapp/messages'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { phoneNumber } = body

    if (!phoneNumber) {
      return NextResponse.json({ error: 'phoneNumber is required' }, { status: 400 })
    }

    const phone = formatPhone(phoneNumber)

    const student = await prisma.student.findFirst({
      where: {
        OR: [
          { phoneNumber: { contains: phone } },
          { parentPhone: { contains: phone } }
        ]
      },
      include: {
        registrations: {
          include: { event: true },
          orderBy: { registeredAt: 'desc' },
          take: 1
        }
      }
    })

    if (!student || student.registrations.length === 0) {
      return NextResponse.json({ error: 'No registration found for this phone number' }, { status: 404 })
    }

    const registration = student.registrations[0]

    const pdfBuffer = await generateIdCardPdf({
      student: {
        name: student.name,
        rollNumber: student.rollNumber,
        grade: student.grade,
        parentName: student.parentName,
      },
      event: {
        name: registration.event.name,
      },
      qrToken: registration.qrToken || '',
    })

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${student.rollNumber}-idcard.pdf"`,
      },
    })
  } catch (error) {
    console.error('generate-id-card endpoint error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
