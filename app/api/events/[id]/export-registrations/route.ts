import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import xlsx from 'xlsx'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const event = await prisma.event.findUnique({
      where: { id },
      select: { name: true, date: true },
    })
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const registrations = (await prisma.registration.findMany({
      where: { eventId: id },
      include: {
        student: {
          select: {
            name: true,
            rollNumber: true,
            grade: true,
            age: true,
            email: true,
            phoneNumber: true,
            parentName: true,
            parentEmail: true,
            parentPhone: true,
          },
        },
        stallVisits: {
          include: {
            stall: { select: { name: true } },
            performance: {
              select: {
                score: true,
                grade: true,
                remarks: true,
                participation: true,
                creativity: true,
                problemSolving: true,
                communication: true,
                learningAbility: true,
              },
            },
          },
        },
      },
      orderBy: { registeredAt: 'desc' },
    })) as any[]

    // Sheet 1: Registrations
    const regHeaders = [
      'Registration Code',
      'QR Token',
      'Status',
      'Registered At',
      'Completed At',
      'Registered By',
      'Notes',
      'Student Name',
      'Roll Number',
      'Grade',
      'Age',
      'Student Email',
      'Student Phone',
      'Parent Name',
      'Parent Email',
      'Parent Phone',
    ]

    const regRows = registrations.map((reg) => [
      reg.registrationCode,
      reg.qrToken || '',
      reg.status,
      reg.registeredAt ? new Date(reg.registeredAt).toISOString() : '',
      reg.completedAt ? new Date(reg.completedAt).toISOString() : '',
      reg.registeredBy,
      reg.notes || '',
      reg.student?.name || '',
      reg.student?.rollNumber || '',
      reg.student?.grade || '',
      reg.student?.age ?? '',
      reg.student?.email || '',
      reg.student?.phoneNumber || '',
      reg.student?.parentName || '',
      reg.student?.parentEmail || '',
      reg.student?.parentPhone || '',
    ])

    const regSheet = xlsx.utils.aoa_to_sheet([regHeaders, ...regRows])

    // Sheet 2: Stall Visits
    const visitHeaders = [
      'Registration Code',
      'Student Name',
      'Roll Number',
      'Stall Name',
      'Score',
      'Grade',
      'Remarks',
      'Participation',
      'Creativity',
      'Problem Solving',
      'Communication',
      'Learning Ability',
    ]

    const visitRows: any[][] = []
    for (const reg of registrations) {
      for (const visit of reg.stallVisits) {
        visitRows.push([
          reg.registrationCode,
          reg.student?.name || '',
          reg.student?.rollNumber || '',
          visit.stall?.name || '',
          visit.performance?.score ?? '',
          visit.performance?.grade || '',
          visit.performance?.remarks || '',
          visit.performance?.participation ?? '',
          visit.performance?.creativity ?? '',
          visit.performance?.problemSolving ?? '',
          visit.performance?.communication ?? '',
          visit.performance?.learningAbility ?? '',
        ])
      }
    }

    const visitSheet = xlsx.utils.aoa_to_sheet([visitHeaders, ...visitRows])

    // Create workbook
    const workbook = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(workbook, regSheet, 'Registrations')
    xlsx.utils.book_append_sheet(workbook, visitSheet, 'Stall Visits')

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    const safeName = event.name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40)
    const filename = `${safeName}_registrations.xlsx`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Export registrations error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
