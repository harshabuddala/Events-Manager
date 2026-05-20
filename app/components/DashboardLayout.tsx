'use client';

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu, Calendar, Bell, Plus, ChevronDown } from 'lucide-react';

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex bg-[#F5F6FA] min-h-screen text-slate-800 font-sans selection:bg-violet-200">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main className="flex-1 flex flex-col min-w-0 bg-[#F5F6FA] max-w-[100vw]">
        {/* Header */}
        <header className="h-[72px] px-4 sm:px-6 lg:px-8 flex items-center justify-between flex-shrink-0 bg-[#F5F6FA]/90 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button 
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors -ml-2"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-[18px] sm:text-[20px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
                {title}
              </h2>
              <p className="hidden md:block text-[12px] font-medium text-slate-500 mt-0.5">{subtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            {headerAction}
            
            {/* Notifications */}
            <div className="relative p-2 bg-white border border-slate-200/80 rounded-lg text-slate-500 shadow-sm hover:text-slate-800 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-violet-600 rounded-full border border-white"></span>
            </div>

            {/* CTA */}
            <button className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-[0_4px_12px_rgba(108,59,255,0.25)] hover:shadow-[0_6px_16px_rgba(108,59,255,0.3)] hover:-translate-y-[1px]">
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Create Event</span>
              <span className="sm:hidden">Create</span>
            </button>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8 pt-0 overflow-y-auto space-y-4 sm:space-y-5 pb-16">
          {children}
        </div>
      </main>
    </div>
  );
}
