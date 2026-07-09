import React from 'react'
import fs from 'fs'
import path from 'path'

interface IdCardData {
  student: {
    name: string
    rollNumber: string
    grade: string
    parentName?: string | null
  }
  event: {
    name: string
  }
  qrToken: string
}

async function loadIdCardBackgroundBase64(): Promise<string | null> {
  try {
    const bgPath = path.join(process.cwd(), 'public', 'id_card_design.png')
    if (fs.existsSync(bgPath)) {
      const buffer = fs.readFileSync(bgPath)
      return `data:image/png;base64,${buffer.toString('base64')}`
    }
  } catch {
    // No background image
  }
  return null
}

export async function generateIdCardPdf(data: IdCardData): Promise<Buffer> {
  const { pdf, Document, Page, Text, View, StyleSheet, Image } = await import('@react-pdf/renderer')
  const QRCode = (await import('qrcode')).default

  const styles = StyleSheet.create({
    page: {
      padding: 0,
      backgroundColor: '#ffffff',
    },
    background: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: 297.64,
      height: 419.53,
      zIndex: -1,
    },
    contentWrapper: {
      paddingTop: 115,
      paddingBottom: 35,
      paddingHorizontal: 24,
      flex: 1,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    studentSection: {
      alignItems: 'center',
      width: '100%',
    },
    studentName: {
      fontSize: 16,
      fontFamily: 'Helvetica-Bold',
      color: '#0a0f2d',
      textAlign: 'center',
      marginBottom: 5,
    },
    studentDetails: {
      fontSize: 9.5,
      fontFamily: 'Helvetica',
      color: '#475569',
      textAlign: 'center',
      marginBottom: 4,
    },
    parentDetails: {
      fontSize: 9.5,
      fontFamily: 'Helvetica-Bold',
      color: '#0f172a',
      textAlign: 'center',
    },
    qrSection: {
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 12,
    },
    qrBorder: {
      width: 170,
      height: 170,
      borderWidth: 1.5,
      borderColor: '#f1f5f9',
      borderRadius: 12,
      backgroundColor: '#ffffff',
      padding: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    qrImage: {
      width: 150,
      height: 150,
    },
    footerSection: {
      alignItems: 'center',
    },
    footerLabel: {
      fontSize: 8,
      fontFamily: 'Helvetica-Bold',
      color: '#f97316',
      textTransform: 'uppercase',
      letterSpacing: 1,
      textAlign: 'center',
    },
  })

  const [bgImageUrl, scanUrl] = await Promise.all([
    loadIdCardBackgroundBase64(),
    Promise.resolve(`${process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8472'}/r/${data.qrToken}`),
  ])

  const qrCodeDataUrl = await QRCode.toDataURL(scanUrl, {
    width: 300,
    margin: 1,
    color: { dark: '#0a0f2d', light: '#ffffff' },
  })

  const IdCardPage = () => (
    <Page size="A6" style={styles.page}>
      {bgImageUrl && <Image src={bgImageUrl} style={styles.background} />}
      <View style={styles.contentWrapper}>
        <View style={styles.studentSection}>
          <Text style={styles.studentName}>{data.student.name}</Text>
          <Text style={styles.studentDetails}>
            Roll No: {data.student.rollNumber}  •  Class: Grade {data.student.grade}
          </Text>
          <Text style={styles.parentDetails}>
            Parent: {data.student.parentName || '—'}
          </Text>
        </View>

        <View style={styles.qrSection}>
          <View style={styles.qrBorder}>
            <Image src={qrCodeDataUrl} style={styles.qrImage} />
          </View>
        </View>

        <View style={styles.footerSection}>
          <Text style={styles.footerLabel}>STUDENT ENTRY PASS</Text>
          <Text style={{ fontSize: 7, fontFamily: 'Helvetica', color: '#64748b', marginTop: 2, textAlign: 'center' }}>
            {data.event.name}
          </Text>
        </View>
      </View>
    </Page>
  )

  const doc = (
    <Document>
      <IdCardPage />
    </Document>
  )

  const pdfBlob = await pdf(doc).toBlob()
  const arrayBuffer = await pdfBlob.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
