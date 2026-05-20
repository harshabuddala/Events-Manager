'use client';

import React from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import { 
  Users, Search, Filter, 
  MoreVertical, ArrowRight, Printer, 
  CheckCircle2, Clock, MapPin, Target
} from 'lucide-react';

const registrations = [
  { 
    id: 'REG-8451', 
    roll: 'EDN784512', 
    name: 'Aarav Sharma', 
    grade: '5th Class', 
    community: 'Greenfield Society', 
    stallsVisited: 6, 
    totalStalls: 6,
    status: 'completed', 
    date: 'May 26, 2026' 
  },
  { 
    id: 'REG-8452', 
    roll: 'EDN784513', 
    name: 'Neha Gupta', 
    grade: '3rd Class', 
    community: 'Greenfield Society', 
    stallsVisited: 4, 
    totalStalls: 6,
    status: 'in-progress', 
    date: 'May 26, 2026' 
  },
  { 
    id: 'REG-8453', 
    roll: 'EDN784514', 
    name: 'Vihaan Singh', 
    grade: '7th Class', 
    community: 'Sunrise Apartments', 
    stallsVisited: 5, 
    totalStalls: 5,
    status: 'completed', 
    date: 'May 25, 2026' 
  },
  { 
    id: 'REG-8454', 
    roll: 'EDN784515', 
    name: 'Ananya Patel', 
    grade: '2nd Class', 
    community: 'Dream Valley', 
    stallsVisited: 0, 
    totalStalls: 4,
    status: 'registered', 
    date: 'May 28, 2026' 
  },
  { 
    id: 'REG-8455', 
    roll: 'EDN784516', 
    name: 'Rohan Kumar', 
    grade: '8th Class', 
    community: 'Maple Residency', 
    stallsVisited: 6, 
    totalStalls: 6,
    status: 'completed', 
    date: 'May 22, 2026' 
  },
];

export default function RegistrationsPage() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </span>
        );
      case 'in-progress':
        return (
          <span className="flex items-center gap-1.5 bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
            In Progress
          </span>
        );
      case 'registered':
        return (
          <span className="flex items-center gap-1.5 bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0">
            <Clock className="w-3 h-3" />
            Registered
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout 
      title="Student Registrations"
      subtitle="Track participation, print identities, and monitor learning activity."
      headerAction={
        <div className="hidden lg:flex items-center gap-2 bg-white border border-slate-200/80 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 shadow-sm hover:border-slate-300 hover:shadow-md transition-all cursor-pointer">
          <Printer className="w-3.5 h-3.5 text-slate-400" />
          <span>Batch Print ID Cards</span>
        </div>
      }
    >
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 hide-scrollbar">
          <button className="px-4 py-2 bg-slate-800 text-white rounded-md text-xs font-semibold shrink-0 shadow-sm">All</button>
          <button className="px-4 py-2 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-md text-xs font-semibold shrink-0 shadow-sm">Completed</button>
          <button className="px-4 py-2 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-md text-xs font-semibold shrink-0 shadow-sm">In Progress</button>
          <button className="px-4 py-2 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-md text-xs font-semibold shrink-0 shadow-sm">Registered</button>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search roll no, name..." 
              className="w-full pl-9 pr-4 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 shadow-sm placeholder:text-slate-400"
            />
          </div>
          <button className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 shadow-sm transition-colors shrink-0">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Registrations List */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-[30%]">Student Details</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Event Context</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Progress</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right w-[140px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {registrations.map((reg) => (
                <tr key={reg.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex gap-3 items-center">
                      <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200/60 flex items-center justify-center shrink-0 text-slate-600 text-sm font-bold">
                        {reg.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <h4 className="text-sm font-bold text-slate-800">{reg.name}</h4>
                          <span className="text-[10px] font-bold text-pink-600 bg-pink-50 px-1.5 py-0.5 rounded border border-pink-100">{reg.roll}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
                          <span className="flex items-center gap-1 text-slate-600">{reg.grade}</span>
                          <span className="text-slate-300">•</span>
                          <span>{reg.id}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {reg.community}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 pl-[22px]">
                        {reg.date}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {getStatusBadge(reg.status)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col items-end gap-1.5 max-w-[140px] ml-auto">
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                          <Target className="w-3 h-3 text-slate-400" />
                          {reg.stallsVisited} / {reg.totalStalls}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">
                          {Math.round((reg.stallsVisited / reg.totalStalls) * 100)}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${reg.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                          style={{ width: `${(reg.stallsVisited / reg.totalStalls) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button className="flex items-center gap-1 bg-white border border-slate-200 hover:border-violet-300 hover:text-violet-700 text-slate-600 px-2 py-1.5 rounded-md text-[11px] font-semibold transition-colors shadow-sm" title="Print ID Pass">
                         <Printer className="w-3.5 h-3.5" />
                       </button>
                       {reg.status === 'completed' ? (
                         <button className="flex items-center gap-1 bg-violet-50 border border-violet-200 hover:bg-violet-100 hover:text-violet-700 text-violet-600 px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-colors shadow-sm">
                           Report
                         </button>
                       ) : (
                         <button className="flex items-center gap-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-colors shadow-sm">
                           View <ArrowRight className="w-3 h-3" />
                         </button>
                       )}
                       <button className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-md transition-colors">
                         <MoreVertical className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] font-medium text-slate-500">Showing <span className="font-bold text-slate-700">1</span> to <span className="font-bold text-slate-700">5</span> of <span className="font-bold text-slate-700">1,248</span> registrations</p>
          <div className="flex items-center gap-1">
            <button className="px-2.5 py-1 border border-slate-200 text-slate-400 bg-white rounded text-[11px] font-semibold opacity-50 cursor-not-allowed">Prev</button>
            <button className="px-2.5 py-1 border border-violet-500 bg-violet-600 text-white rounded text-[11px] font-semibold">1</button>
            <button className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 text-slate-600 bg-white rounded text-[11px] font-semibold">2</button>
            <button className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 text-slate-600 bg-white rounded text-[11px] font-semibold">3</button>
            <span className="text-slate-400 px-1 text-xs">...</span>
            <button className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 text-slate-600 bg-white rounded text-[11px] font-semibold">250</button>
            <button className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 text-slate-600 bg-white rounded text-[11px] font-semibold">Next</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
