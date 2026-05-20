'use client';

import React from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import { 
  MapPin, Users, Target, Search, Filter, 
  MoreVertical, ArrowRight, Building2, CheckCircle2, AlertCircle, Plus
} from 'lucide-react';

const communities = [
  {
    id: 'C-001',
    name: 'Greenfield Society',
    location: 'Whitefield, Zone ' + 1,
    status: 'active',
    eventsHosted: 3,
    totalParticipants: 854,
    avgCompletion: 82.1,
    contactPerson: 'Rahul Sharma',
  },
  {
    id: 'C-002',
    name: 'Sunrise Apartments',
    location: 'Indiranagar, Zone 2',
    status: 'active',
    eventsHosted: 2,
    totalParticipants: 532,
    avgCompletion: 77.3,
    contactPerson: 'Priya Patel',
  },
  {
    id: 'C-003',
    name: 'Maple Residency',
    location: 'Koramangala, Zone 3',
    status: 'upcoming',
    eventsHosted: 1,
    totalParticipants: 198,
    avgCompletion: 80.8,
    contactPerson: 'Amit Kumar',
  },
  {
    id: 'C-004',
    name: 'Dream Valley',
    location: 'HSR Layout, Zone 2',
    status: 'active',
    eventsHosted: 4,
    totalParticipants: 1240,
    avgCompletion: 72.7,
    contactPerson: 'Sneha Reddy',
  },
  {
    id: 'C-005',
    name: 'Lakeview Enclave',
    location: 'Electronic City, Zone 4',
    status: 'inactive',
    eventsHosted: 1,
    totalParticipants: 156,
    avgCompletion: 78.8,
    contactPerson: 'Vikram Singh',
  }
];

export default function CommunitiesPage() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0">
            <CheckCircle2 className="w-3 h-3" />
            Active
          </span>
        );
      case 'upcoming':
        return (
          <span className="flex items-center gap-1.5 bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0">
            <AlertCircle className="w-3 h-3" />
            Upcoming
          </span>
        );
      case 'inactive':
        return (
          <span className="flex items-center gap-1.5 bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0">
            Inactive
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout 
      title="Communities"
      subtitle="Manage residential communities and engagement metrics."
      headerAction={
        <button className="hidden lg:flex items-center gap-1.5 bg-white border border-slate-200/80 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 shadow-sm hover:border-slate-300 hover:shadow-md transition-all">
          <Plus className="w-3.5 h-3.5 text-slate-400" />
          <span>Add Community</span>
        </button>
      }
    >
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 hide-scrollbar">
          <button className="px-4 py-2 bg-slate-800 text-white rounded-md text-xs font-semibold shrink-0 shadow-sm">All Communities</button>
          <button className="px-4 py-2 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-md text-xs font-semibold shrink-0 shadow-sm">Active</button>
          <button className="px-4 py-2 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-md text-xs font-semibold shrink-0 shadow-sm">Upcoming</button>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search communities..." 
              className="w-full pl-9 pr-4 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 shadow-sm placeholder:text-slate-400"
            />
          </div>
          <button className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 shadow-sm transition-colors shrink-0">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Communities List */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-[35%]">Community Details</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Events Hosted</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Participants</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Avg Completion</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right w-[80px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {communities.map((community) => (
                <tr key={community.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex gap-3 items-center">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">{community.id}</span>
                          <h4 className="text-sm font-bold text-slate-800">{community.name}</h4>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {community.location}</span>
                          <span className="text-slate-300">•</span>
                          <span>Contact: {community.contactPerson}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {getStatusBadge(community.status)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="text-sm font-bold text-slate-800">{community.eventsHosted}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end">
                      <span className="text-sm font-bold text-slate-800 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">{community.totalParticipants}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {community.status === 'inactive' && community.eventsHosted === 0 ? (
                      <span className="block text-right text-[11px] font-medium text-slate-400">-</span>
                    ) : (
                      <div className="flex flex-col items-end gap-1.5 max-w-[120px] ml-auto">
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[11px] font-bold text-slate-700">{community.avgCompletion}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-violet-500" 
                            style={{ width: `${community.avgCompletion}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button className="flex items-center gap-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-colors shadow-sm">
                         View <ArrowRight className="w-3 h-3" />
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
          <p className="text-[11px] font-medium text-slate-500">Showing <span className="font-bold text-slate-700">1</span> to <span className="font-bold text-slate-700">5</span> of <span className="font-bold text-slate-700">12</span> communities</p>
          <div className="flex items-center gap-1">
            <button className="px-2.5 py-1 border border-slate-200 text-slate-400 bg-white rounded text-[11px] font-semibold opacity-50 cursor-not-allowed">Prev</button>
            <button className="px-2.5 py-1 border border-violet-500 bg-violet-600 text-white rounded text-[11px] font-semibold">1</button>
            <button className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 text-slate-600 bg-white rounded text-[11px] font-semibold">2</button>
            <button className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 text-slate-600 bg-white rounded text-[11px] font-semibold">Next</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
