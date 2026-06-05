import React from 'react'
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import type { ReportCardData, LetterheadInfo } from './letterhead'

// A4 at 72dpi = 595.28 x 841.89 pt
const A4_W = 595.28
const A4_H = 841.89

const styles = StyleSheet.create({
  page: {
    position: 'relative',
    width: A4_W,
    height: A4_H,
    backgroundColor: '#ffffff',
  },
  letterhead: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  content: {
    position: 'absolute',
    padding: 14,
    color: '#1e293b',
    fontSize: 9,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 6,
    marginBottom: 8,
  },
  headerLeft: { flexDirection: 'column' },
  headerRight: { alignItems: 'flex-end' },
  title: { fontSize: 13, fontWeight: 700, color: '#4c1d95' },
  subtitle: { fontSize: 7.5, color: '#64748b', marginTop: 1 },
  badge: {
    fontSize: 6.5,
    fontWeight: 700,
    color: '#ffffff',
    backgroundColor: '#10b981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  badgeMuted: {
    fontSize: 6.5,
    fontWeight: 700,
    color: '#475569',
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 3 },
  metaChip: {
    fontSize: 7,
    color: '#334155',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: '#0f172a',
    marginTop: 4,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stallRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 6,
    marginBottom: 5,
  },
  stallLeft: { width: 22, justifyContent: 'center', alignItems: 'center' },
  stallCheckmark: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#d1fae5',
    color: '#059669',
    fontSize: 9,
    fontWeight: 700,
    textAlign: 'center',
    paddingTop: 1,
  },
  stallPending: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#e2e8f0',
    color: '#94a3b8',
    fontSize: 7,
    fontWeight: 700,
    textAlign: 'center',
    paddingTop: 3,
  },
  stallBody: { flex: 1, paddingLeft: 6 },
  stallTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stallName: { fontSize: 9, fontWeight: 700, color: '#0f172a' },
  stallCode: { fontSize: 6.5, color: '#94a3b8', fontFamily: 'Courier' },
  stallScoreChip: {
    fontSize: 8,
    fontWeight: 700,
    color: '#5b21b6',
    backgroundColor: '#ede9fe',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  stallGradeChip: {
    fontSize: 8,
    fontWeight: 700,
    color: '#047857',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    marginLeft: 3,
  },
  metricsBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 3,
    padding: 4,
    marginTop: 3,
  },
  metricLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 },
  metricName: { fontSize: 7.5, color: '#334155' },
  metricDots: { flexDirection: 'row' },
  metricDot: { fontSize: 7, marginRight: 1 },
  remarks: {
    fontSize: 7.5,
    color: '#475569',
    fontStyle: 'italic',
    marginTop: 3,
  },
  footer: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 6.5,
    color: '#94a3b8',
    borderTopWidth: 0.5,
    borderTopColor: '#e2e8f0',
    paddingTop: 4,
  },
  pageNum: { fontFamily: 'Courier' },
})

function StarRow({ score, max = 5 }: { score: number; max?: number }) {
  const stars = []
  for (let i = 1; i <= max; i++) {
    stars.push(
      <Text key={i} style={styles.metricDot}>
        {i <= score ? '★' : '☆'}
      </Text>
    )
  }
  return <View style={styles.metricDots}>{stars}</View>
}

export interface ReportCardPdfProps {
  data: ReportCardData
  letterhead: LetterheadInfo | null
  letterheadBuffer?: Buffer | null
}

export function ReportCardPdf({ data, letterhead, letterheadBuffer }: ReportCardPdfProps) {
  // Compute content area as percentages
  let contentStyle: any = {
    top: '5%',
    left: '7%',
    width: '86%',
    height: '90%',
  }
  if (letterhead) {
    contentStyle = {
      top: `${(letterhead.cropY / letterhead.imageH) * 100}%`,
      left: `${(letterhead.cropX / letterhead.imageW) * 100}%`,
      width: `${(letterhead.cropW / letterhead.imageW) * 100}%`,
      height: `${(letterhead.cropH / letterhead.imageH) * 100}%`,
    }
  }

  const imgSrc = letterheadBuffer ? `data:image/png;base64,${letterheadBuffer.toString('base64')}` : null

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {imgSrc && <Image src={imgSrc} style={styles.letterhead} />}
        <View style={[styles.content, contentStyle]}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>Student Report Card</Text>
              <Text style={styles.subtitle}>
                {data.event.name} · {data.event.community}
              </Text>
            </View>
            <View style={styles.headerRight}>
              {data.status === 'COMPLETED' ? (
                <Text style={styles.badge}>OFFICIAL REPORT</Text>
              ) : (
                <Text style={styles.badgeMuted}>{data.status.replace('_', ' ')}</Text>
              )}
            </View>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaChip}>Name: {data.student.name}</Text>
            <Text style={styles.metaChip}>Roll: {data.student.rollNumber}</Text>
            <Text style={styles.metaChip}>Grade: {data.student.grade}</Text>
            {data.student.age != null && <Text style={styles.metaChip}>Age: {data.student.age}</Text>}
            <Text style={styles.metaChip}>Avg: {data.averageScore.toFixed(1)} / 10</Text>
            <Text style={styles.metaChip}>Overall: {data.overallGrade}</Text>
            {data.isSample && <Text style={styles.badgeMuted}>SAMPLE / TEST PRINT</Text>}
          </View>

          <Text style={styles.sectionTitle}>Stall Evaluations</Text>

          {data.stalls.length === 0 ? (
            <Text style={{ fontSize: 8, color: '#94a3b8', fontStyle: 'italic' }}>
              No stalls configured for this event.
            </Text>
          ) : (
            data.stalls.map((s, idx) => (
              <View key={idx} style={styles.stallRow} wrap={false}>
                <View style={styles.stallLeft}>
                  {s.score != null ? (
                    <Text style={styles.stallCheckmark}>✓</Text>
                  ) : (
                    <Text style={styles.stallPending}>…</Text>
                  )}
                </View>
                <View style={styles.stallBody}>
                  <View style={styles.stallTopRow}>
                    <View style={{ flexDirection: 'column' }}>
                      <Text style={styles.stallName}>{s.name}</Text>
                      <Text style={styles.stallCode}>{s.code}</Text>
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                      {s.score != null && (
                        <>
                          <Text style={styles.stallScoreChip}>{s.score}/10</Text>
                          {s.grade && <Text style={styles.stallGradeChip}>{s.grade}</Text>}
                        </>
                      )}
                    </View>
                  </View>
                  {s.metrics.length > 0 && (
                    <View style={styles.metricsBox}>
                      {s.metrics.map((m, mi) => (
                        <View key={mi} style={styles.metricLine}>
                          <Text style={styles.metricName}>{m.name}</Text>
                          <StarRow score={m.score} />
                        </View>
                      ))}
                    </View>
                  )}
                  {s.remarks && <Text style={styles.remarks}>"{s.remarks}"</Text>}
                  {s.volunteer && (
                    <Text style={{ fontSize: 6.5, color: '#94a3b8', marginTop: 2, textTransform: 'uppercase', fontWeight: 700 }}>
                      Evaluator: {s.volunteer}
                    </Text>
                  )}
                </View>
              </View>
            ))
          )}

          <View style={styles.footer} fixed>
            <Text>Generated {data.generatedAt}</Text>
            <Text>Edunura · {data.event.code}</Text>
            <Text style={styles.pageNum} render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
          </View>
        </View>
      </Page>
    </Document>
  )
}
