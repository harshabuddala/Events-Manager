'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Calendar, Users, FileText, ShoppingBag, UserCheck, 
  BarChart3, Settings, Users2, ChevronDown, GraduationCap,
  PieChart as PieChartIcon, TrendingUp, FileOutput, X
} from 'lucide-react';

export default function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (val: boolean) => void }) {
  const pathname = usePathname();

  const isCurrent = (path: string) => pathname === path;

  const getLinkClasses = (path: string) => {
    if (isCurrent(path)) {
      return "flex items-center gap-2.5 px-3 py-2 bg-violet-600 text-white rounded-lg font-semibold transition-colors shadow-lg shadow-violet-600/20";
    }
    return "flex items-center gap-2.5 px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-lg font-semibold transition-colors";
  };

  const getIconClasses = (path: string) => {
    return isCurrent(path) ? "w-[18px] h-[18px] opacity-90" : "w-[18px] h-[18px] opacity-80";
  };

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside className={`fixed lg:sticky top-0 left-0 w-[240px] flex-shrink-0 bg-gradient-to-b from-[#0A0F2D] to-[#121B45] text-slate-300 flex flex-col h-screen border-r border-[#1e274a] shadow-xl z-50 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        
        {/* Logo Area */}
        <div className="p-5 pb-2 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2.5 text-white mb-1">
              <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/20">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight leading-none tracking-[-0.02em]">Edunura</h1>
              </div>
            </div>
            <p className="text-[9px] text-slate-400/80 font-semibold tracking-wider uppercase mt-1.5 ml-1">Learn Today, Lead Tomorrow</p>
          </div>
          <button 
            className="lg:hidden text-slate-400 hover:text-white mt-1"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pt-6 pb-4 px-3 custom-scrollbar">
          
          {/* Main Nav */}
          <div className="space-y-1">
            <Link href="/dashboard" className={getLinkClasses('/dashboard')}>
              <LayoutDashboard className={getIconClasses('/dashboard')} />
              <span className="text-xs">Dashboard</span>
            </Link>
            <Link href="/events" className={getLinkClasses('/events')}>
              <Calendar className={getIconClasses('/events')} />
              <span className="text-xs">Events</span>
            </Link>
            <Link href="/communities" className={getLinkClasses('/communities')}>
              <Users className={getIconClasses('/communities')} />
              <span className="text-xs">Communities</span>
            </Link>
            <Link href="/registrations" className={getLinkClasses('/registrations')}>
              <FileText className={getIconClasses('/registrations')} />
              <span className="text-xs">Registrations</span>
            </Link>
            <Link href="/stalls" className={getLinkClasses('/stalls')}>
              <ShoppingBag className={getIconClasses('/stalls')} />
              <span className="text-xs">Stalls</span>
            </Link>
            <Link href="/volunteers" className={getLinkClasses('/volunteers')}>
              <UserCheck className={getIconClasses('/volunteers')} />
              <span className="text-xs">Volunteers</span>
            </Link>
            <Link href="/reports" className={getLinkClasses('/reports')}>
              <FileOutput className={getIconClasses('/reports')} />
              <span className="text-xs">Report Cards</span>
            </Link>
          </div>

          <div className="mt-6 mb-2 px-3">
            <h3 className="text-[9px] font-bold text-slate-500/80 tracking-widest uppercase">Analytics</h3>
          </div>
          <div className="space-y-1">
            <Link href="/analytics/overview" className={getLinkClasses('/analytics/overview')}>
              <BarChart3 className={getIconClasses('/analytics/overview')} />
              <span className="text-xs">Overview</span>
            </Link>
            <Link href="/analytics/stalls" className={getLinkClasses('/analytics/stalls')}>
              <PieChartIcon className={getIconClasses('/analytics/stalls')} />
              <span className="text-xs">Stall Analytics</span>
            </Link>
            <Link href="/analytics/communities" className={getLinkClasses('/analytics/communities')}>
              <Users2 className={getIconClasses('/analytics/communities')} />
              <span className="text-xs">Community Analytics</span>
            </Link>
            <Link href="/analytics/volunteers" className={getLinkClasses('/analytics/volunteers')}>
              <TrendingUp className={getIconClasses('/analytics/volunteers')} />
              <span className="text-xs">Volunteer Performance</span>
            </Link>
          </div>

          <div className="mt-6 mb-2 px-3">
            <h3 className="text-[9px] font-bold text-slate-500/80 tracking-widest uppercase">Settings</h3>
          </div>
          <div className="space-y-1">
            <Link href="/settings/users" className={getLinkClasses('/settings/users')}>
              <Users className={getIconClasses('/settings/users')} />
              <span className="text-xs">Users & Roles</span>
            </Link>
            <Link href="/settings/general" className={getLinkClasses('/settings/general')}>
              <Settings className={getIconClasses('/settings/general')} />
              <span className="text-xs">Settings</span>
            </Link>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-3 border-t border-white/5 bg-black/10">
          <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
            <img src="https://ui-avatars.com/api/?name=Admin+User&background=6C3BFF&color=fff&rounded=true&bold=true" alt="Admin" className="w-8 h-8 rounded-full border-2 border-slate-700/50 group-hover:border-violet-500 transition-colors" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-white transition-colors">Admin User</p>
              <p className="text-[10px] text-slate-500 font-medium truncate">Super Admin</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
          </div>
        </div>
      </aside>
    </>
  );
}
