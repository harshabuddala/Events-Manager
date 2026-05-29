'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area, Legend
} from 'recharts';
import { TrendingUp, Users, Target, Activity, Calendar } from 'lucide-react';

interface AnalyticsData {
  stats: {
    totalVisits: number;
    avgCompletion: number;
    activeStalls: number;
    communities: number;
  };
  visitTrends: Array<{ time: string; visits: number }>;
  performanceByGrade: Array<{
    grade: string;
    creativity: number;
    problemSolving: number;
    communication: number;
    learningAbility: number;
  }>;
}

export default function AnalyticsOverviewPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/overview')
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <DashboardLayout title="Analytics Overview" subtitle="Loading analytics data...">
        <div className="text-center py-12 text-slate-500">Loading analytics...</div>
      </DashboardLayout>
    );
  }

  const stats = data?.stats || { totalVisits: 0, avgCompletion: 0, activeStalls: 0, communities: 0 };

  return (
    <DashboardLayout 
      title="Analytics Overview"
      subtitle="Comprehensive view of event performance, engagement, and learning outcomes."
      headerAction={
        <div className="flex items-center gap-2 bg-white border border-slate-200/80 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 shadow-sm">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>This Week</span>
        </div>
      }
    >
      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-5 sm:mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-600">Total Visits</h3>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-slate-900 tracking-tight">{stats.totalVisits.toLocaleString()}</p>
              <p className="text-xs font-semibold text-emerald-500 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Stall visits tracked
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-600">Avg Completion</h3>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Target className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-slate-900 tracking-tight">{stats.avgCompletion}%</p>
              <p className="text-xs font-semibold text-emerald-500 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Visits completed
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-600">Active Stalls</h3>
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
              <Activity className="w-4 h-4 text-violet-600" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-slate-900 tracking-tight">{stats.activeStalls}</p>
              <p className="text-xs font-medium text-slate-500 mt-1">
                Running concurrently
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-600">Communities</h3>
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-orange-600" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-slate-900 tracking-tight">{stats.communities}</p>
              <p className="text-xs font-medium text-slate-500 mt-1">
                Participating societies
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5 sm:mb-8">
        {/* Traffic Trends */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-[15px] font-bold text-slate-800">Visit Trends</h3>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">Daily stall visit counts</p>
            </div>
          </div>
          <div className="h-[280px]">
             <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.visitTrends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" name="Stall Visits" dataKey="visits" stroke="#7C3AED" strokeWidth={3} fillOpacity={1} fill="url(#colorVisits)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Skill Performance by Grade */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-[15px] font-bold text-slate-800">Performance By Grade</h3>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">Average scores across skill dimensions</p>
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.performanceByGrade || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="grade" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} domain={[0, 10]} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{fill: '#f8fafc'}}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="creativity" name="Creativity" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={12} />
                <Bar dataKey="problemSolving" name="Problem Solving" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
                <Bar dataKey="communication" name="Communication" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={12} />
                <Bar dataKey="learningAbility" name="Learning Ability" fill="#ec4899" radius={[4, 4, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
