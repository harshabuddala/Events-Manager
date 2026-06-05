import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { buildReportDataForRegistration, buildReportDataForEventTest } from '@/lib/pdf/buildReportData'
import { loadLetterheadBuffer, type LetterheadInfo } from '@/lib/pdf/letterhead'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { ReportCardPdf } from '@/lib/pdf/ReportCardPdf'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { code } = await params
    const reg = await prisma.registration.findUnique({
      where: { registrationCode: code },
      select: { id: true },
    })
    if (!reg) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const built = await buildReportDataForRegistration(reg.id)
    if (!built) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    let letterheadInfo: LetterheadInfo | null = null
    let letterheadBuffer: Buffer | null = null
    if (built.letterheadFilePath && built.letterheadId) {
      const lh = await prisma.letterhead.findUnique({
        where: { id: built.letterheadId },
        select: { id: true, filePath: true, cropX: true, cropY: true, cropW: true, cropH: true, imageW: true, imageH: true, isActive: true },
      })
      if (lh && lh.isActive) {
        letterheadInfo = {
          id: lh.id,
          filePath: lh.filePath,
          cropX: lh.cropX,
          cropY: lh.cropY,
          cropW: lh.cropW,
          cropH: lh.cropH,
          imageW: lh.imageW,
          imageH: lh.imageH,
        }
        letterheadBuffer = await loadLetterheadBuffer(letterheadInfo)
      }
    }

    const element = createElement(ReportCardPdf, {
      data: built.data,
      letterhead: letterheadInfo,
      letterheadBuffer,
    })
    const pdf = await renderToBuffer(element as any)

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="report-${code}.pdf"`,
        'Content-Length': String(pdf.length),
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
