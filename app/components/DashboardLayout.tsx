'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';
import { Menu, Bell, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardLayout({ 
  children, 
  title, 
  subtitle,
  headerAction
}: { 
  children: React.ReactNode, 
  title: React.ReactNode, 
  subtitle: string,
  headerAction?: React.ReactNode
}) {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();

  const isVolunteerRole = user && ['VOLUNTEER', 'LEAD_EVALUATOR', 'COORDINATOR'].includes(user.role);

  return (
    <div className="flex bg-[#F5F6FA] min-h-screen text-slate-800 font-sans selection:bg-violet-200 pb-[64px] lg:pb-0">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main className="flex-1 flex flex-col min-w-0 bg-[#F5F6FA] max-w-[100vw]">
        {/* Header */}
        <header className="h-[56px] sm:h-[72px] px-3 sm:px-6 lg:px-8 flex items-center justify-between flex-shrink-0 bg-[#F5F6FA]/90 sticky top-0 z-10 backdrop-blur-md safe-area-top">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button 
              className="lg:hidden p-2.5 text-slate-600 hover:bg-slate-200/50 rounded-xl transition-colors -ml-1 shrink-0"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h2 className="text-[16px] sm:text-[20px] font-bold text-slate-900 tracking-tight flex items-center gap-2 truncate">
                {title}
              </h2>
              <p className="hidden sm:block text-[12px] font-medium text-slate-500 mt-0.5">{subtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {headerAction}
            
            {/* Notifications */}
            <button 
              className="relative p-2.5 bg-white border border-slate-200/80 rounded-xl text-slate-500 shadow-sm hover:text-slate-800 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer active:scale-95"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-violet-600 rounded-full border-2 border-white"></span>
            </button>

            {/* CTA - only for admins/managers */}
            {!isVolunteerRole && (
              <button 
                onClick={() => router.push('/events?create=true')}
                className="hidden sm:flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white px-3 sm:px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-[0_4px_12px_rgba(108,59,255,0.25)] hover:shadow-[0_6px_16px_rgba(108,59,255,0.3)] active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Create Event</span>
                <span className="sm:hidden">Create</span>
              </button>
            )}
          </div>
        </header>

        <div className="px-3 sm:px-6 lg:px-8 py-3 sm:py-4 overflow-y-auto space-y-4 sm:space-y-5">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation for Volunteers */}
      {isVolunteerRole && <MobileBottomNav />}
    </div>
  );
}
