'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VolunteerPortalRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F6FA]">
      <p className="text-slate-500 text-sm">Redirecting to unified dashboard...</p>
    </div>
  );
}