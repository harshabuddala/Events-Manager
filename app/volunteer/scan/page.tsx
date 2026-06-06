import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic'

// /volunteer/scan is no longer used — redirect to the single unified scan page.
export default function VolunteerScanRedirect() {
  redirect('/scan?autostart=true');
}
