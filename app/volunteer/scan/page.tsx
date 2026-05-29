import { redirect } from 'next/navigation';

// /volunteer/scan is no longer used — redirect to the single unified scan page.
export default function VolunteerScanRedirect() {
  redirect('/scan?autostart=true');
}
