import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

let cachedBase64Image: string | null = null;
let imageFetchPromise: Promise<string> | null = null;

export const fetchIdCardImageBase64 = async (): Promise<string> => {
  if (typeof window === 'undefined') return '/id_card_design.png';
  if (cachedBase64Image) return cachedBase64Image;
  if (imageFetchPromise) return imageFetchPromise;
  
  imageFetchPromise = (async () => {
    try {
      const origin = window.location.origin;
      const url = `${origin}/id_card_design.png`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          cachedBase64Image = base64data;
          resolve(base64data);
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      // Fallback to absolute URL if fetch fails
      return `${window.location.origin}/id_card_design.png`;
    }
  })();
  
  return imageFetchPromise;
};

const styles = StyleSheet.create({
  page: {
    padding: 0,
    backgroundColor: '#ffffff',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 297.64, // A6 width in points
    height: 419.53, // A6 height in points
    zIndex: -1,
  },
  contentWrapper: {
    paddingTop: 115, // Below the edunura top banner
    paddingBottom: 35, // Above the address footer
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
    color: '#0a0f2d', // Navy blue matching the theme
    textAlign: 'center',
    marginBottom: 5,
  },
  studentDetails: {
    fontSize: 9.5,
    fontFamily: 'Helvetica',
    color: '#475569', // Slate grey
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
    color: '#f97316', // Edunura orange
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
});

interface IdCardPdfProps {
  registration: any;
  backgroundImage?: string | null;
  qrCodeDataUrl?: string | null;
}

export const IdCardPdf = ({ registration, backgroundImage, qrCodeDataUrl }: IdCardPdfProps) => {
  const { student, event } = registration;
  const eventName = event?.name || 'Edunura Event';

  return (
    <Document>
      <Page size="A6" style={styles.page}>
        {/* Background ID card template image */}
        <Image 
          src={backgroundImage || (typeof window !== 'undefined' ? `${window.location.origin}/id_card_design.png` : '/id_card_design.png')} 
          style={styles.background} 
        />

        {/* Main content overlays */}
        <View style={styles.contentWrapper}>
          {/* Student Details (Top of the middle section) */}
          <View style={styles.studentSection}>
            <Text style={styles.studentName}>{student?.name}</Text>
            <Text style={styles.studentDetails}>
              Roll No: {student?.rollNumber}  •  Class: Grade {student?.grade}
            </Text>
            <Text style={styles.parentDetails}>
              Parent: {student?.parentName || '—'}
            </Text>
          </View>

          {/* Dynamic centered QR Code (Middle of the section) */}
          <View style={styles.qrSection}>
            {qrCodeDataUrl ? (
              <View style={styles.qrBorder}>
                <Image src={qrCodeDataUrl} style={styles.qrImage} />
              </View>
            ) : (
              <View style={[styles.qrBorder, { backgroundColor: '#f8fafc' }]}>
                <Text style={{ fontSize: 8, color: '#94a3b8' }}>Generating QR...</Text>
              </View>
            )}
          </View>

          {/* Footer pass labels (Bottom of the middle section) */}
          <View style={styles.footerSection}>
            <Text style={styles.footerLabel}>STUDENT ENTRY PASS</Text>
            <Text style={{ fontSize: 7, fontFamily: 'Helvetica', color: '#64748b', marginTop: 2, textAlign: 'center' }}>
              {eventName}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
