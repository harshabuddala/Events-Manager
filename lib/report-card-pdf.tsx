import React from 'react'

interface ReportCardData {
  student: {
    name: string
    rollNumber: string
    grade: string
    age?: number | null
    parentName?: string | null
  }
  event: {
    id?: string
    name: string
    date: string
    community?: { name: string } | null
    stalls?: Array<{ id: string; name: string; metrics?: any }>
  }
  stallVisits: Array<{
    stallId?: string
    stall: { id: string; name: string; metrics?: any }
    performance: {
      score: number
      grade: string
      remarks?: string | null
      metricScores?: any
    } | null
  }>
  registrationCode: string
}

export async function generateReportCardPdf(data: ReportCardData): Promise<Buffer> {
  const { pdf } = await import('@react-pdf/renderer')
  const { ReportCardPdf } = await import('@/app/components/ReportCardPdf')
  const { fetchReportCardImageBase64 } = await import('@/lib/letterheads')

  // Fetch custom background template if configured in DB
  let bgImageBase64: string | null = null
  try {
    bgImageBase64 = await fetchReportCardImageBase64()
  } catch (err) {
    console.error('[WhatsApp Report PDF] Background fetch error:', err)
  }

  // Construct registration object matching props structure of ReportCardPdf
  const registration = {
    student: {
      name: data.student.name,
      rollNumber: data.student.rollNumber,
      grade: data.student.grade,
      age: data.student.age,
      parentName: data.student.parentName,
    },
    event: {
      name: data.event.name,
      date: data.event.date,
      community: data.event.community,
      stalls: data.event.stalls || data.stallVisits.map(sv => sv.stall),
    },
    stallVisits: data.stallVisits.map(sv => ({
      stallId: sv.stallId || sv.stall.id,
      performance: sv.performance,
    })),
    registrationCode: data.registrationCode,
  }

  const pdfDocument = React.createElement(ReportCardPdf, {
    registration,
    backgroundImage: bgImageBase64,
  })

  const pdfBlob = await pdf(pdfDocument as any).toBlob()
  const arrayBuffer = await pdfBlob.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
