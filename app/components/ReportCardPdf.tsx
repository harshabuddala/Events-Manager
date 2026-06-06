import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

let cachedBase64Image: string | null = null;
let imageFetchPromise: Promise<string> | null = null;

export const fetchReportCardImageBase64 = async (): Promise<string> => {
  if (typeof window === 'undefined') return '/report_card_design.png';
  if (cachedBase64Image) return cachedBase64Image;
  if (imageFetchPromise) return imageFetchPromise;
  
  imageFetchPromise = (async () => {
    try {
      console.log("[DEBUG] Fetching report card design template from origin...");
      const origin = window.location.origin;
      const url = `${origin}/report_card_design.png`;
      console.log(`[DEBUG] Attempting fetch to: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log(`[DEBUG] Image loaded, size: ${blob.size} bytes, type: ${blob.type}`);
      
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          cachedBase64Image = base64data;
          console.log("[DEBUG] Successfully converted image to base64 data URI.");
          resolve(base64data);
        };
        reader.onerror = (err) => {
          console.error("[DEBUG] FileReader error:", err);
          reject(err);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("[DEBUG] Error pre-fetching background image:", error);
      // Fallback to absolute URL if fetch fails
      return `${window.location.origin}/report_card_design.png`;
    }
  })();
  
  return imageFetchPromise;
};

const styles = StyleSheet.create({
  page: {
    padding: 0,
  },
  contentWrapper: {
    paddingTop: 235,
    paddingBottom: 110,
    paddingHorizontal: 40,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#334155', // slate-700
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
    borderBottomColor: '#f97316', // Edunura Orange
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
    flexDirection: 'column',
  },
  label: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    color: '#64748b',
    marginBottom: 3,
  },
  value: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#0a0f2d',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0a0f2d', // Dark Navy
    color: 'white',
    padding: 6,
    borderRadius: 4,
    fontFamily: 'Helvetica-Bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  colStall: { flex: 1.8 },
  colMetrics: { flex: 2.2, paddingRight: 10 },
  colRemarks: { flex: 2.8, paddingRight: 10 },
  colScore: { flex: 1, textAlign: 'center' },
  colGrade: { flex: 1, textAlign: 'center' },
  metricItem: {
    fontSize: 8,
    color: '#475569',
    marginBottom: 2,
  },
  remarksText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Oblique',
    lineHeight: 1.3,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f1f5f9',
    padding: 10,
    borderRadius: 6,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#475569',
    marginRight: 4,
  },
  summaryValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#f97316',
  },
});

interface ReportCardPdfProps {
  registration: any;
  backgroundImage?: string | null;
}

export const ReportCardPage = ({ registration, backgroundImage }: ReportCardPdfProps) => {
  const { student, event, stallVisits = [] } = registration;
  const stalls = event?.stalls || [];
  
  const mappedVisits = stalls.map((stall: any) => {
    const visit = stallVisits.find((v: any) => v.stallId === stall.id);
    const perf = visit?.performance;
    
    // Process metric scores
    const metricScoresData = perf?.metricScores && typeof perf.metricScores === 'object'
      ? (perf.metricScores as Record<string, unknown>)
      : null;
    const metricEntries = metricScoresData
      ? Object.entries(metricScoresData).filter(([, v]) => typeof v === 'number')
      : [];
    const metricsStringList = metricEntries.map(([name, value]) => `${name}: ${value}/5`);

    return {
      stallName: stall.name,
      metricsList: metricsStringList,
      remarks: perf?.remarks || (perf ? 'Evaluated successfully.' : 'Did not visit'),
      score: perf ? perf.score.toFixed(1) : 'N/A',
      grade: perf ? perf.grade : 'N/A',
    };
  });

  const totalStalls = stalls.length;
  const visitedStallsCount = stallVisits.filter((v: any) => v.performance).length;
  const totalScores = stallVisits.reduce((acc: number, curr: any) => {
    return acc + (curr.performance ? curr.performance.score : 0);
  }, 0);
  
  const averageScore = visitedStallsCount > 0 
    ? (totalScores / visitedStallsCount).toFixed(1) 
    : '0.0';

  // Calculate final letter grade from average score
  const getFinalGrade = (avg: number) => {
    if (visitedStallsCount === 0) return '—';
    if (avg >= 9) return 'A+ (Outstanding)';
    if (avg >= 8) return 'A (Excellent)';
    if (avg >= 7) return 'B (Good)';
    if (avg >= 6) return 'C (Satisfactory)';
    if (avg >= 5) return 'D (Needs Improvement)';
    return 'E (Unsatisfactory)';
  };

  const finalGradeStr = getFinalGrade(Number(averageScore));

  const formattedDate = event?.date 
    ? new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <Page size="A4" style={styles.page}>
        <Image 
          fixed 
          style={styles.background} 
          src={backgroundImage || (typeof window !== 'undefined' ? `${window.location.origin}/report_card_design.png` : '/report_card_design.png')} 
        />

        <View style={styles.contentWrapper}>
          {/* Student Name and Title */}
          <View style={styles.studentHeader}>
            <View>
              <Text style={styles.studentName}>{student.name}</Text>
              <Text style={{ fontSize: 9, color: '#64748b', fontFamily: 'Helvetica-Bold', marginTop: 2 }}>
                Roll Number: {student.rollNumber}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#0a0f2d' }}>STUDENT REPORT CARD</Text>
              <Text style={{ fontSize: 8, color: '#64748b', marginTop: 2 }}>{formattedDate}</Text>
            </View>
          </View>

          {/* Info Grid */}
          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <Text style={styles.label}>Class / Grade</Text>
              <Text style={styles.value}>Grade {student.grade} {student.age ? `(${student.age} yrs)` : ''}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.label}>Parent Name</Text>
              <Text style={styles.value}>{student.parentName || '—'}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.label}>Event Location</Text>
              <Text style={styles.value}>{event?.community?.name || '—'}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Learning Activity Breakdown</Text>

          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.colStall}>Activity Stall</Text>
            <Text style={styles.colMetrics}>Key Metrics</Text>
            <Text style={styles.colRemarks}>Remarks & Feedback</Text>
            <Text style={styles.colScore}>Score</Text>
            <Text style={styles.colGrade}>Grade</Text>
          </View>

          {/* Table Rows */}
          {mappedVisits.map((v: any, i: number) => (
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

          {/* Summary Card */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Total Stalls:</Text>
              <Text style={[styles.summaryValue, { color: '#0a0f2d' }]}>{visitedStallsCount} / {totalStalls}</Text>
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
  );
};

export const ReportCardPdf = (props: ReportCardPdfProps) => (
  <Document>
    <ReportCardPage {...props} />
  </Document>
);
