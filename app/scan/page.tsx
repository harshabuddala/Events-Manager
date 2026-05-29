'use client';

import DashboardLayout from '@/app/components/DashboardLayout';
import QrScannerWidget from '@/app/components/QrScannerWidget';

export default function ScanPage() {
  return (
    <DashboardLayout title="Scan Student" subtitle="Scan QR codes or enter registration codes to find students">
      <QrScannerWidget theme="violet" storageKey="edunura_recent_scans" />
    </DashboardLayout>
  );
}
