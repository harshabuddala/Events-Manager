'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Redirect() {
  const router = useRouter();
  useEffect(() => { router.push('/my-schedule'); }, [router]);
  return <div className="min-h-screen flex items-center justify-center bg-[#F5F6FA]"><p className="text-slate-500 text-sm">Redirecting...</p></div>;
}