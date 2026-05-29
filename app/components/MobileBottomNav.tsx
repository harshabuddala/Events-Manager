'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, ScanLine, ClipboardCheck, BarChart2, Calendar
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Home', icon: Home },
  { path: '/scan', label: 'Scan', icon: ScanLine },
  { path: '/my-evaluations', label: 'Evals', icon: ClipboardCheck },
  { path: '/my-performance', label: 'Stats', icon: BarChart2 },
  { path: '/my-schedule', label: 'Schedule', icon: Calendar },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  // Only show on volunteer-facing routes
  const volunteerRoutes = ['/dashboard', '/scan', '/my-evaluations', '/my-performance', '/my-schedule', '/volunteer'];
  const shouldShow = volunteerRoutes.some(route => pathname.startsWith(route)) || pathname === '/';

  if (!shouldShow) return null;

  // Don't show on login page
  if (pathname === '/') return null;

  const isActive = (path: string) => {
    if (path === '/dashboard' && pathname === '/dashboard') return true;
    if (path !== '/dashboard' && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200/80 safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around h-[64px] max-w-lg mx-auto">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-colors ${
                active
                  ? 'text-violet-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className={`relative p-1.5 rounded-xl transition-all ${
                active ? 'bg-violet-50' : ''
              }`}>
                <item.icon className={`w-5 h-5 ${active ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                {active && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-violet-600 rounded-full border-2 border-white" />
                )}
              </div>
              <span className={`text-[10px] font-semibold ${active ? 'text-violet-600' : 'text-slate-500'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
