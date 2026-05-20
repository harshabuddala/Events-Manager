'use client';

import React from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import { 
  Calendar, MapPin, Users, Target, Search, Filter, 
  MoreVertical, ArrowRight, PlayCircle, CheckCircle2, Clock
} from 'lucide-react';

const events = [
  {
    id: 'E-1284',
    name: 'Greenfield Science Fest',
    community: 'Greenfield Society',
    date: 'May 26, 2026',
    status: 'live',
    participants: 312,
    stalls: 6,
    volunteers: 12,
    completion: 82.1,
  },
  {
    id: 'E-1283',
    name: 'Sunrise Math Quest',
    community: 'Sunrise Apartments',
    date: 'May 25, 2026',
    status: 'completed',
    participants: 278,
    stalls: 5,
    volunteers: 10,
    completion: 95.3,
  },
  {
    id: 'E-1285',
    name: 'Maple Learning Carnival',
    community: 'Maple Residency',
    date: 'May 28, 2026',
    status: 'upcoming',
    participants: 198, // Registered so far
    stalls: 8,
    volunteers: 15,
    completion: 0,
  },
  {
    id: 'E-1282',
    name: 'Dream Valley Brain Games',
    community: 'Dream Valley',
    date: 'May 22, 2026',
    status: 'completed',
    participants: 176,
    stalls: 4,
    volunteers: 8,
    completion: 72.7,
  },
  {
    id: 'E-1286',
    name: 'Lakeview Tech Day',
    community: 'Lakeview Enclave',
    date: 'Jun 02, 2026',
    status: 'upcoming',
    participants: 105,
    stalls: 6,
    volunteers: 10,
    completion: 0,
  }
];

export default function EventsPage() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return (
          <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            Live Now
          </span>
        );
      case 'upcoming':
        return (
          <span className="flex items-center gap-1.5 bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0">
            <Clock className="w-3 h-3" />
            Upcoming
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center gap-1.5 bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout 
      title="Events Management"
      subtitle="View, manage and create educational events across communities."
      headerAction={
        <div className="hidden lg:flex items-center gap-2 bg-white border border-slate-200/80 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 shadow-sm hover:border-slate-300 hover:shadow-md transition-all cursor-pointer">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>All Events</span>
        </div>
      }
    >
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 hide-scrollbar">
          <button className="px-4 py-2 bg-slate-800 text-white rounded-md text-xs font-semibold shrink-0 shadow-sm">All Events</button>
          <button className="px-4 py-2 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-md text-xs font-semibold shrink-0 shadow-sm">Live</button>
          <button className="px-4 py-2 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-md text-xs font-semibold shrink-0 shadow-sm">Upcoming</button>
          <button className="px-4 py-2 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-md text-xs font-semibold shrink-0 shadow-sm">Completed</button>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search events..." 
              className="w-full pl-9 pr-4 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 shadow-sm placeholder:text-slate-400"
            />
          </div>
          <button className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 shadow-sm transition-colors shrink-0">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap min-w-[700px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-[35%]">Event Details</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Participants</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Completion</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right w-[80px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex gap-3 items-center">
                      <div className="w-10 h-10 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5 text-violet-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded border border-violet-100">{event.id}</span>
                          <h4 className="text-sm font-bold text-slate-800">{event.name}</h4>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.community}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {event.date}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {getStatusBadge(event.status)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-bold text-slate-800">{event.participants}</span>
                      <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
                        <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {event.stalls} stalls</span>
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {event.volunteers} vols</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {event.status === 'upcoming' ? (
                      <span className="block text-right text-[11px] font-medium text-slate-400">Not started</span>
                    ) : (
                      <div className="flex flex-col items-end gap-1.5 max-w-[120px] ml-auto">
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[11px] font-bold text-slate-700">{event.completion}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${event.status === 'live' ? 'bg-emerald-500' : 'bg-slate-400'}`} 
                            style={{ width: `${event.completion}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       {event.status === 'live' ? (
                         <button className="flex items-center gap-1 bg-white border border-slate-200 hover:border-violet-300 hover:text-violet-700 text-slate-600 px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-colors shadow-sm">
                           Manage <ArrowRight className="w-3 h-3" />
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
          <p className="text-[11px] font-medium text-slate-500">Showing <span className="font-bold text-slate-700">1</span> to <span className="font-bold text-slate-700">5</span> of <span className="font-bold text-slate-700">24</span> events</p>
          <div className="flex items-center gap-1">
            <button className="px-2.5 py-1 border border-slate-200 text-slate-400 bg-white rounded text-[11px] font-semibold opacity-50 cursor-not-allowed">Prev</button>
            <button className="px-2.5 py-1 border border-violet-500 bg-violet-600 text-white rounded text-[11px] font-semibold">1</button>
            <button className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 text-slate-600 bg-white rounded text-[11px] font-semibold">2</button>
            <button className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 text-slate-600 bg-white rounded text-[11px] font-semibold">3</button>
            <button className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 text-slate-600 bg-white rounded text-[11px] font-semibold">Next</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
