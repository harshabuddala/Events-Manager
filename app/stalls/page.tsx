'use client';

import React from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import { 
  ShoppingBag, Search, Filter, 
  MoreVertical, ArrowRight, Plus, 
  CheckCircle2, Users, Star, BrainCircuit, Activity, Calculator,
  Palette, BookOpen
} from 'lucide-react';

const stalls = [
  {
    id: 'ST-001',
    name: 'Math Quest',
    category: 'Mathematics',
    icon: Calculator,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
    iconBorder: 'border-blue-100',
    totalVisits: 1256,
    avgScore: '8.4/10',
    status: 'active',
    assignedVolunteers: 12
  },
  {
    id: 'ST-002',
    name: 'Science Lab',
    category: 'Science',
    icon: Activity,
    iconColor: 'text-violet-600',
    iconBg: 'bg-violet-50',
    iconBorder: 'border-violet-100',
    totalVisits: 1102,
    avgScore: '9.1/10',
    status: 'active',
    assignedVolunteers: 14
  },
  {
    id: 'ST-003',
    name: 'English Arena',
    category: 'Languages',
    icon: BookOpen,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
    iconBorder: 'border-emerald-100',
    totalVisits: 987,
    avgScore: '8.7/10',
    status: 'active',
    assignedVolunteers: 10
  },
  {
    id: 'ST-004',
    name: 'Logical Challenge',
    category: 'Reasoning',
    icon: BrainCircuit,
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-50',
    iconBorder: 'border-orange-100',
    totalVisits: 876,
    avgScore: '7.9/10',
    status: 'active',
    assignedVolunteers: 8
  },
  {
    id: 'ST-005',
    name: 'Creative Corner',
    category: 'Arts',
    icon: Palette,
    iconColor: 'text-pink-600',
    iconBg: 'bg-pink-50',
    iconBorder: 'border-pink-100',
    totalVisits: 734,
    avgScore: '9.4/10',
    status: 'maintenance',
    assignedVolunteers: 6
  }
];

export default function StallsPage() {
  return (
    <DashboardLayout 
      title="Activity Stalls"
      subtitle="Manage educational activity stalls and view performance metrics."
      headerAction={
        <button className="hidden lg:flex items-center gap-1.5 bg-white border border-slate-200/80 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 shadow-sm hover:border-slate-300 hover:shadow-md transition-all">
          <Plus className="w-3.5 h-3.5 text-slate-400" />
          <span>Create Stall</span>
        </button>
      }
    >
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 hide-scrollbar">
          <button className="px-4 py-2 bg-slate-800 text-white rounded-md text-xs font-semibold shrink-0 shadow-sm">All Stalls</button>
          <button className="px-4 py-2 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-md text-xs font-semibold shrink-0 shadow-sm">Active</button>
          <button className="px-4 py-2 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-md text-xs font-semibold shrink-0 shadow-sm">Mathematics</button>
          <button className="px-4 py-2 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-md text-xs font-semibold shrink-0 shadow-sm">Science</button>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search stalls..." 
              className="w-full pl-9 pr-4 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 shadow-sm placeholder:text-slate-400"
            />
          </div>
          <button className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 shadow-sm transition-colors shrink-0">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stalls List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        {stalls.map((stall) => {
          const Icon = stall.icon;
          return (
            <div key={stall.id} className="bg-white rounded-xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-5 flex flex-col relative group">
              
              <div className="absolute top-4 right-4">
                <button className="p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-700 rounded-md transition-colors opacity-0 group-hover:opacity-100">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl ${stall.iconBg} border ${stall.iconBorder} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-6 h-6 ${stall.iconColor}`} />
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-slate-800 leading-tight">{stall.name}</h4>
                  <span className="text-[11px] font-medium text-slate-500">{stall.category}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-4 border-b border-slate-100 mt-auto">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Users className="w-3 h-3" /> Visits
                  </p>
                  <p className="text-lg font-bold text-slate-800 leading-none">{stall.totalVisits}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Star className="w-3 h-3" /> Avg Score
                  </p>
                  <p className="text-lg font-bold text-slate-800 leading-none">{stall.avgScore}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-600">
                        V{i}
                      </div>
                    ))}
                  </div>
                </div>
                <button className="p-1.5 bg-slate-50 hover:bg-violet-50 text-slate-500 hover:text-violet-600 rounded-lg transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          );
        })}

        {/* Add New Stall Card */}
        <div className="bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200/80 hover:border-violet-300 hover:bg-slate-50 transition-all duration-300 p-5 flex flex-col items-center justify-center min-h-[220px] cursor-pointer group">
          <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm group-hover:shadow-md group-hover:border-violet-200">
            <Plus className="w-6 h-6 text-slate-400 group-hover:text-violet-600" />
          </div>
          <h4 className="text-sm font-bold text-slate-700 group-hover:text-violet-700">Create New Stall</h4>
          <p className="text-[11px] text-slate-500 text-center mt-1 max-w-[180px]">Add a new educational activity to your library.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
