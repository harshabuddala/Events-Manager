import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { buildReportDataForEventTest } from '@/lib/pdf/buildReportData'
import { loadLetterheadBuffer, type LetterheadInfo } from '@/lib/pdf/letterhead'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { ReportCardPdf } from '@/lib/pdf/ReportCardPdf'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || (session.role !== 'ADMIN' && session.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const built = await buildReportDataForEventTest(id)
    if (!built) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

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
        'Content-Disposition': `inline; filename="test-print-${id}.pdf"`,
        'Content-Length': String(pdf.length),
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Test-print PDF error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
