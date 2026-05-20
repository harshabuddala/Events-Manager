'use client';

import React from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import { 
  UserCheck, Search, Filter, 
  MoreVertical, ArrowRight, Plus, 
  CheckCircle2, Mail, Phone, Calendar as CalendarIcon, Star
} from 'lucide-react';

const volunteers = [
  {
    id: 'VOL-001',
    name: 'Anjali Desai',
    role: 'Lead Evaluator',
    email: 'anjali.d@example.com',
    phone: '+91 98765 43210',
    preferredStall: 'Math Quest',
    eventsParticipated: 12,
    rating: 4.9,
    status: 'assigned',
    avatar: 'AD'
  },
  {
    id: 'VOL-002',
    name: 'Rahul Verma',
    role: 'Volunteer',
    email: 'rahul.v@example.com',
    phone: '+91 98765 43211',
    preferredStall: 'Science Lab',
    eventsParticipated: 8,
    rating: 4.7,
    status: 'available',
    avatar: 'RV'
  },
  {
    id: 'VOL-003',
    name: 'Priya Iyer',
    role: 'Evaluator',
    email: 'priya.i@example.com',
    phone: '+91 98765 43212',
    preferredStall: 'English Arena',
    eventsParticipated: 15,
    rating: 4.8,
    status: 'assigned',
    avatar: 'PI'
  },
  {
    id: 'VOL-004',
    name: 'Karan Singh',
    role: 'Volunteer',
    email: 'karan.s@example.com',
    phone: '+91 98765 43213',
    preferredStall: 'Logical Challenge',
    eventsParticipated: 5,
    rating: 4.5,
    status: 'available',
    avatar: 'KS'
  },
  {
    id: 'VOL-005',
    name: 'Neha Sharma',
    role: 'Lead Evaluator',
    email: 'neha.s@example.com',
    phone: '+91 98765 43214',
    preferredStall: 'Creative Corner',
    eventsParticipated: 9,
    rating: 4.9,
    status: 'on-leave',
    avatar: 'NS'
  }
];

export default function VolunteersPage() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'assigned':
        return (
          <span className="flex items-center gap-1.5 bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0">
            <UserCheck className="w-3 h-3" />
            Assigned
          </span>
        );
      case 'available':
        return (
          <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0">
            <CheckCircle2 className="w-3 h-3" />
            Available
          </span>
        );
      case 'on-leave':
        return (
          <span className="flex items-center gap-1.5 bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0">
            On Leave
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout 
      title="Volunteers & Evaluators"
      subtitle="Manage your volunteer network, assign stalls, and track performance."
      headerAction={
        <button className="hidden lg:flex items-center gap-1.5 bg-white border border-slate-200/80 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 shadow-sm hover:border-slate-300 hover:shadow-md transition-all">
          <Plus className="w-3.5 h-3.5 text-slate-400" />
          <span>Add Volunteer</span>
        </button>
      }
    >
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 hide-scrollbar">
          <button className="px-4 py-2 bg-slate-800 text-white rounded-md text-xs font-semibold shrink-0 shadow-sm">All</button>
          <button className="px-4 py-2 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-md text-xs font-semibold shrink-0 shadow-sm">Available</button>
          <button className="px-4 py-2 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-md text-xs font-semibold shrink-0 shadow-sm">Lead Evaluators</button>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by name, email..." 
              className="w-full pl-9 pr-4 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 shadow-sm placeholder:text-slate-400"
            />
          </div>
          <button className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 shadow-sm transition-colors shrink-0">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Volunteers List */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-[30%]">Volunteer Details</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Contact Information</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status / Stall</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Performance</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right w-[80px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {volunteers.map((vol) => (
                <tr key={vol.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex gap-3 items-center">
                      <div className="w-10 h-10 rounded-full bg-violet-100 border border-violet-200/60 flex items-center justify-center shrink-0 text-violet-700 text-sm font-bold shadow-sm">
                        {vol.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <h4 className="text-sm font-bold text-slate-800">{vol.name}</h4>
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{vol.id}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                          {vol.role === 'Lead Evaluator' ? (
                            <span className="text-amber-600 font-bold flex items-center gap-1"><Star className="w-3 h-3 fill-amber-500" /> {vol.role}</span>
                          ) : (
                            <span className="text-slate-500">{vol.role}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1 text-[11px] font-medium text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {vol.email}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {vol.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col items-start gap-2">
                       {getStatusBadge(vol.status)}
                       <span className="text-[10px] font-bold text-slate-500 pl-1 border-l-2 border-slate-200">Prefers: {vol.preferredStall}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-100 text-[11px] font-bold">
                         <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                         {vol.rating}
                      </div>
                      <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" /> {vol.eventsParticipated} events
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button className="flex items-center gap-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-colors shadow-sm">
                         Profile <ArrowRight className="w-3 h-3" />
                       </button>
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
          <p className="text-[11px] font-medium text-slate-500">Showing <span className="font-bold text-slate-700">1</span> to <span className="font-bold text-slate-700">5</span> of <span className="font-bold text-slate-700">48</span> volunteers</p>
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
