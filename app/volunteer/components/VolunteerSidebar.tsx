'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home, ScanLine, ClipboardCheck, BarChart2, User, 
  HelpCircle, LogOut, X, GraduationCap, Calendar, ChevronDown
} from 'lucide-react';

export default function VolunteerSidebar({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (val: boolean) => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [volunteerName, setVolunteerName] = useState('Volunteer');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    async function fetchVolunteer() {
      try {
        const res = await fetch('/api/volunteer/me');
        if (res.ok) {
          const data = await res.json();
          setVolunteerName(data.volunteer.name);
        }
      } catch {
        // Fallback to auth endpoint
        const authRes = await fetch('/api/auth/me');
        if (authRes.ok) {
          const data = await authRes.json();
          setVolunteerName(data.user.name);
        }
      }
    }
    fetchVolunteer();
  }, []);

  const isCurrent = (path: string) => pathname === path;

  const getLinkClasses = (path: string) => {
    if (isCurrent(path)) {
      return "flex items-center gap-3 px-3.5 py-3 bg-emerald-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-emerald-600/20";
    }
    return "flex items-center gap-3 px-3.5 py-3 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-xl font-semibold transition-all hover:pl-4";
  };

  const getIconClasses = (path: string) => {
    return isCurrent(path) ? "w-[20px] h-[20px]" : "w-[20px] h-[20px]";
  };

  const handleLogout = async () => {
    if (!showLogoutConfirm) {
      setShowLogoutConfirm(true);
      setTimeout(() => setShowLogoutConfirm(false), 3000);
      return;
    }

    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch {
      // ignore
    } finally {
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ================= VOLUNTEER SIDEBAR ================= */}
      <aside className={`fixed lg:sticky top-0 left-0 w-[280px] sm:w-[260px] flex-shrink-0 bg-gradient-to-b from-[#059669] to-[#047857] text-slate-300 flex flex-col h-[100dvh] border-r border-emerald-700/50 shadow-xl z-50 transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        
        {/* Logo Area */}
        <div className="p-4 sm:p-5 pb-2 sm:pb-3 flex items-start justify-between safe-area-top">
          <div>
            <div className="flex items-center gap-2.5 text-white mb-1">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 shadow-lg backdrop-blur-sm">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold tracking-tight leading-none">Volunteer Portal</h1>
              </div>
            </div>
            <p className="text-[9px] text-emerald-100/70 font-semibold tracking-wider uppercase mt-1.5 ml-1">Edunura Events</p>
          </div>
          <button 
            className="lg:hidden p-2.5 text-emerald-100 hover:text-white mt-1 rounded-xl hover:bg-white/10 transition-colors"
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pt-3 sm:pt-4 pb-4 px-3 custom-scrollbar">
          
          {/* Main Navigation */}
          <div className="space-y-1">
            <Link href="/volunteer/dashboard" className={getLinkClasses('/volunteer/dashboard')} onClick={() => setIsOpen(false)}>
              <Home className={getIconClasses('/volunteer/dashboard')} />
              <span className="text-[13px]">Dashboard</span>
            </Link>
            <Link href="/scan?autostart=true" className={getLinkClasses('/scan')} onClick={() => setIsOpen(false)}>
              <ScanLine className={getIconClasses('/scan')} />
              <span className="text-[13px]">Scan Student</span>
            </Link>
            <Link href="/volunteer/evaluations" className={getLinkClasses('/volunteer/evaluations')} onClick={() => setIsOpen(false)}>
              <ClipboardCheck className={getIconClasses('/volunteer/evaluations')} />
              <span className="text-[13px]">My Evaluations</span>
            </Link>
            <Link href="/volunteer/performance" className={getLinkClasses('/volunteer/performance')} onClick={() => setIsOpen(false)}>
              <BarChart2 className={getIconClasses('/volunteer/performance')} />
              <span className="text-[13px]">Performance</span>
            </Link>
            <Link href="/volunteer/schedule" className={getLinkClasses('/volunteer/schedule')} onClick={() => setIsOpen(false)}>
              <Calendar className={getIconClasses('/volunteer/schedule')} />
              <span className="text-[13px]">My Schedule</span>
            </Link>
          </div>

          <div className="mt-6 mb-2 px-3">
            <h3 className="text-[10px] font-bold text-emerald-200/60 tracking-widest uppercase">Account</h3>
          </div>
          <div className="space-y-1">
            <Link href="/volunteer/profile" className={getLinkClasses('/volunteer/profile')} onClick={() => setIsOpen(false)}>
              <User className={getIconClasses('/volunteer/profile')} />
              <span className="text-[13px]">Profile</span>
            </Link>
            <Link href="/volunteer/help" className={getLinkClasses('/volunteer/help')} onClick={() => setIsOpen(false)}>
              <HelpCircle className={getIconClasses('/volunteer/help')} />
              <span className="text-[13px]">Help & Guide</span>
            </Link>
          </div>
        </div>

        {/* User Profile & Logout */}
        <div className="p-3 border-t border-white/10 bg-black/10 safe-area-bottom">
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group mb-2">
            <div className="w-9 h-9 rounded-full bg-white/20 border-2 border-emerald-500/30 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {volunteerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-emerald-50 truncate group-hover:text-white transition-colors">{volunteerName}</p>
              <p className="text-[11px] text-emerald-200/60 font-medium truncate">Volunteer</p>
            </div>
            <ChevronDown className="w-4 h-4 text-emerald-200/60 group-hover:text-emerald-100 transition-colors shrink-0" />
          </div>
          
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all font-semibold text-[13px] disabled:opacity-50 active:scale-[0.98] ${
              showLogoutConfirm 
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                : 'text-emerald-100 hover:text-rose-300 hover:bg-rose-500/10'
            }`}
          >
            <LogOut className="w-[20px] h-[20px]" />
            <span>
              {isLoggingOut ? 'Signing out...' : showLogoutConfirm ? 'Click again to confirm' : 'Sign Out'}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
