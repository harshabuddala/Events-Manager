'use client';

import React from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts';
import { Trophy } from 'lucide-react';

const communityRanking = [
  { rank: 1, name: 'Greenfield Soc.', score: 92.4, participants: 854 },
  { rank: 2, name: 'Sunrise Apts.', score: 88.7, participants: 532 },
  { rank: 3, name: 'Maple Res.', score: 85.1, participants: 198 },
  { rank: 4, name: 'Dream Valley', score: 81.3, participants: 1240 },
  { rank: 5, name: 'Lakeview Enc.', score: 78.5, participants: 156 },
];

const participationRates = [
  { date: 'Mon', 'Greenfield': 120, 'Sunrise': 80, 'Dream Valley': 150 },
  { date: 'Tue', 'Greenfield': 140, 'Sunrise': 95, 'Dream Valley': 180 },
  { date: 'Wed', 'Greenfield': 160, 'Sunrise': 110, 'Dream Valley': 210 },
  { date: 'Thu', 'Greenfield': 150, 'Sunrise': 100, 'Dream Valley': 190 },
  { date: 'Fri', 'Greenfield': 180, 'Sunrise': 120, 'Dream Valley': 240 },
  { date: 'Sat', 'Greenfield': 210, 'Sunrise': 140, 'Dream Valley': 300 },
];

export default function CommunityAnalyticsPage() {
  return (
    <DashboardLayout 
      title="Community Analytics"
      subtitle="Track participation and performance metrics across different communities."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5 sm:mb-8">
        {/* Top Communities */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-[15px] font-bold text-slate-800">Top Performing Communities</h3>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">Based on overall student completion scores</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {communityRanking.map((community, idx) => (
              <div key={community.name} className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                  idx === 0 ? 'bg-amber-100 text-amber-600' :
                  idx === 1 ? 'bg-slate-200 text-slate-600' :
                  idx === 2 ? 'bg-orange-100 text-orange-700' :
                  'bg-slate-50 text-slate-400 border border-slate-100'
                }`}>
                  {idx < 3 ? <Trophy className="w-4 h-4" /> : community.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-sm text-slate-800 truncate">{community.name}</h4>
                    <span className="text-sm font-bold text-violet-600">{community.score}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-violet-500 h-full rounded-full" 
                      style={{ width: `${community.score}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wider">
                    {community.participants} Participants
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Participation Trends */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-[15px] font-bold text-slate-800">Participation Trends</h3>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">Daily active participants from major communities</p>
            </div>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={participationRates} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="Greenfield" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Sunrise" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Dream Valley" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
