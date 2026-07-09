import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params

    if (!code) {
      return NextResponse.json({ error: 'Registration code is required' }, { status: 400 })
    }

    const registration = await prisma.registration.findFirst({
      where: {
        OR: [
          { registrationCode: code },
          { qrToken: code },
        ],
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            rollNumber: true,
            grade: true,
            age: true,
            parentName: true,
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

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    if (!registration.qrToken) {
      return NextResponse.json({ error: 'QR token not generated for this registration' }, { status: 400 })
    }

    const { generateIdCardPdf } = await import('@/lib/id-card-pdf')
    const pdfBuffer = await generateIdCardPdf({
      student: {
        name: registration.student.name,
        rollNumber: registration.student.rollNumber,
        grade: registration.student.grade,
        parentName: registration.student.parentName,
      },
      event: {
        name: registration.event.name,
      },
      qrToken: registration.qrToken,
    })

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="id-card-${registration.student.rollNumber}.pdf"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error) {
    console.error('ID card generation error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Failed to generate ID card' }, { status: 500 })
  }
}
