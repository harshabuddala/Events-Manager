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
    name: string
    date: string
    community?: { name: string } | null
  }
  stallVisits: Array<{
    stall: { name: string; metrics?: any }
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
  const { pdf, Document, Page, Text, View, StyleSheet, Image } = await import('@react-pdf/renderer')

  const styles = StyleSheet.create({
    page: { padding: 0 },
    contentWrapper: {
      paddingTop: 235,
      paddingBottom: 110,
      paddingHorizontal: 40,
      fontSize: 9,
      fontFamily: 'Helvetica',
      color: '#334155',
      flex: 1,
    },
    background: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: 595.28,
      height: 841.89,
      zIndex: -1,
    },
    studentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      borderBottomWidth: 2,
      borderBottomColor: '#f97316',
      paddingBottom: 8,
      marginBottom: 12,
    },
    studentName: {
      fontSize: 15,
      fontFamily: 'Helvetica-Bold',
      color: '#0f172a',
    },
    infoGrid: {
      flexDirection: 'row',
      backgroundColor: '#f8fafc',
      borderWidth: 1,
      borderColor: '#f1f5f9',
      borderRadius: 8,
      padding: 10,
      marginBottom: 15,
    },
    infoCol: {
      flex: 1,
      paddingHorizontal: 5,
    },
    label: {
      fontSize: 7,
      fontFamily: 'Helvetica-Bold',
      color: '#94a3b8',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    value: {
      fontSize: 9.5,
      fontFamily: 'Helvetica-Bold',
      color: '#0f172a',
      marginTop: 2,
    },
    sectionTitle: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: '#0f172a',
      marginBottom: 8,
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: '#f1f5f9',
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#e2e8f0',
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 8,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#f1f5f9',
    },
    colStall: { width: '18%' },
    colMetrics: { width: '28%' },
    colRemarks: { width: '30%' },
    colScore: { width: '12%', textAlign: 'center' },
    colGrade: { width: '12%', textAlign: 'center' },
    metricItem: {
      fontSize: 7.5,
      color: '#64748b',
      marginBottom: 1,
    },
    remarksText: {
      fontSize: 8,
      color: '#64748b',
      fontStyle: 'italic',
    },
    summaryContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: '#0a0f2d',
      borderRadius: 8,
      padding: 12,
      marginTop: 15,
    },
    summaryCol: {
      alignItems: 'center',
    },
    summaryLabel: {
      fontSize: 7,
      fontFamily: 'Helvetica-Bold',
      color: '#94a3b8',
      textTransform: 'uppercase',
    },
    summaryValue: {
      fontSize: 14,
      fontFamily: 'Helvetica-Bold',
      color: '#10b981',
      marginTop: 2,
    },
  })

  const totalStalls = data.stallVisits.length
  const visitedStalls = data.stallVisits.filter(sv => sv.performance).length
  const scores = data.stallVisits.filter(sv => sv.performance).map(sv => sv.performance!.score)
  const averageScore = scores.length > 0
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
    : 0

  const gradeCounts: Record<string, number> = {}
  data.stallVisits.filter(sv => sv.performance).forEach(sv => {
    const g = sv.performance!.grade
    gradeCounts[g] = (gradeCounts[g] || 0) + 1
  })
  const finalGradeStr = Object.entries(gradeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

  const mappedVisits = data.stallVisits.map(sv => ({
    stallName: sv.stall.name,
    metricsList: sv.stall.metrics || [],
    remarks: sv.performance?.remarks,
    score: sv.performance ? `${sv.performance.score}` : 'N/A',
    grade: sv.performance?.grade || '—',
  }))

  const eventDate = new Date(data.event.date).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // Try to load background image
  let bgImageUrl: string | null = null
  try {
    const fs = await import('fs')
    const path = await import('path')
    const bgPath = path.join(process.cwd(), 'public', 'report_card_design.png')
    if (fs.existsSync(bgPath)) {
      const buffer = fs.readFileSync(bgPath)
      bgImageUrl = `data:image/png;base64,${buffer.toString('base64')}`
    }
  } catch {
    // No background image available
  }

  const ReportCardPage = () => (
    <Page size="A4" style={styles.page}>
      {bgImageUrl && <Image src={bgImageUrl} style={styles.background} />}
      <View style={styles.contentWrapper}>
        <View style={styles.studentHeader}>
          <View>
            <Text style={styles.studentName}>{data.student.name}</Text>
            <Text style={{ fontSize: 9, color: '#64748b', fontFamily: 'Helvetica-Bold', marginTop: 2 }}>
              Roll Number: {data.student.rollNumber}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#0a0f2d' }}>STUDENT REPORT CARD</Text>
            <Text style={{ fontSize: 8, color: '#64748b', marginTop: 2 }}>{eventDate}</Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.label}>Class / Grade</Text>
            <Text style={styles.value}>Grade {data.student.grade} {data.student.age ? `(${data.student.age} yrs)` : ''}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.label}>Parent Name</Text>
            <Text style={styles.value}>{data.student.parentName || '—'}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.label}>Event Location</Text>
            <Text style={styles.value}>{data.event.community?.name || '—'}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Learning Activity Breakdown</Text>

        <View style={styles.tableHeader}>
          <Text style={styles.colStall}>Activity Stall</Text>
          <Text style={styles.colMetrics}>Key Metrics</Text>
          <Text style={styles.colRemarks}>Remarks & Feedback</Text>
          <Text style={styles.colScore}>Score</Text>
          <Text style={styles.colGrade}>Grade</Text>
        </View>

        {mappedVisits.map((v, i) => (
          <View key={i} style={styles.tableRow}>
            <View style={styles.colStall}>
              <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9.5, color: '#0f172a' }}>{v.stallName}</Text>
            </View>
            <View style={styles.colMetrics}>
              {v.metricsList.length > 0 ? (
                v.metricsList.map((m: string, idx: number) => (
                  <Text key={idx} style={styles.metricItem}>• {m}</Text>
                ))
              ) : (
                <Text style={{ fontSize: 8, color: '#94a3b8' }}>—</Text>
              )}
            </View>
            <View style={styles.colRemarks}>
              {v.remarks ? (
                <Text style={styles.remarksText}>"{v.remarks}"</Text>
              ) : (
                <Text style={{ fontSize: 8, color: '#94a3b8' }}>—</Text>
              )}
            </View>
            <Text style={[styles.colScore, { fontFamily: 'Helvetica-Bold', color: '#0a0f2d' }]}>{v.score}</Text>
            <Text style={[styles.colGrade, { fontFamily: 'Helvetica-Bold', color: v.score === 'N/A' ? '#94a3b8' : '#10b981' }]}>{v.grade}</Text>
          </View>
        ))}

        <View style={styles.summaryContainer}>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>Total Stalls:</Text>
            <Text style={[styles.summaryValue, { color: '#ffffff' }]}>{visitedStalls} / {totalStalls}</Text>
          </View>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>Overall Score:</Text>
            <Text style={styles.summaryValue}>{averageScore} / 10.0</Text>
          </View>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>Final Grade:</Text>
            <Text style={[styles.summaryValue, { color: '#10b981' }]}>{finalGradeStr}</Text>
          </View>
        </View>
      </View>
    </Page>
  )

  const doc = (
    <Document>
      <ReportCardPage />
    </Document>
  )

  const pdfBlob = await pdf(doc).toBlob()
  const arrayBuffer = await pdfBlob.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
