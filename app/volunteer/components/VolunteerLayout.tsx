'use client';

import React, { useState } from 'react';
import VolunteerSidebar from './VolunteerSidebar';
import MobileBottomNav from '@/app/components/MobileBottomNav';
import { Menu, Bell, Clock, MapPin } from 'lucide-react';

export default function VolunteerLayout({ 
  children, 
  title, 
  subtitle,
  headerAction,
  eventInfo
}: { 
  children: React.ReactNode, 
  title: string, 
  subtitle: string,
  headerAction?: React.ReactNode,
  eventInfo?: { name: string; location: string; time: string }
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex bg-[#F0FDF4] min-h-screen text-slate-800 font-sans selection:bg-emerald-200 pb-[64px] lg:pb-0">
      <VolunteerSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main className="flex-1 flex flex-col min-w-0 bg-[#F0FDF4] max-w-[100vw]">
        {/* Header - Mobile optimized */}
        <header className="h-[56px] sm:h-[72px] px-3 sm:px-6 lg:px-8 flex items-center justify-between flex-shrink-0 bg-[#F0FDF4]/95 sticky top-0 z-10 backdrop-blur-md border-b border-emerald-100 safe-area-top">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button 
              className="lg:hidden p-2.5 text-emerald-700 hover:bg-emerald-100 rounded-xl transition-colors -ml-1 shrink-0"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h2 className="text-[16px] sm:text-[21px] font-bold text-slate-900 tracking-tight flex items-center gap-2 truncate">
                {title}
              </h2>
              <p className="hidden sm:block text-[12px] font-medium text-slate-500 mt-0.5">{subtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {headerAction}
            
            {/* Event Info Badge - hidden on very small screens */}
            {eventInfo && (
              <div className="hidden md:flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[10px] font-semibold text-emerald-700 truncate max-w-[120px]">{eventInfo.name}</span>
              </div>
            )}
            
            {/* Notifications */}
            <button 
              className="relative p-2.5 bg-white border border-emerald-200/80 rounded-xl text-emerald-600 shadow-sm hover:bg-emerald-50 hover:border-emerald-300 transition-all cursor-pointer active:scale-95"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-600 rounded-full border-2 border-white animate-pulse"></span>
            </button>

            {/* Current Time */}
            <div className="hidden sm:flex items-center gap-1.5 bg-white border border-emerald-200/80 px-3 py-1.5 rounded-xl text-slate-600 shadow-sm">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-semibold">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </header>

        <div className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 overflow-y-auto space-y-4 sm:space-y-5">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
