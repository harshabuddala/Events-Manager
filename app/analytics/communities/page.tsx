'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts';
import { Trophy } from 'lucide-react';

interface CommunityData {
  communityRankings: Array<{
    rank: number;
    name: string;
    score: number;
    participants: number;
  }>;
  participationTrends: Array<Record<string, string | number>>;
}

export default function CommunityAnalyticsPage() {
  const [data, setData] = useState<CommunityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/communities')
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const communityRanking = data?.communityRankings || [];
  const participationRates = data?.participationTrends || [];

  // Determine line keys dynamically
  const lineKeys = participationRates.length > 0
    ? Object.keys(participationRates[0]).filter(k => k !== 'date')
    : [];

  const lineColors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'];

  if (isLoading) {
    return (
      <DashboardLayout title="Community Analytics" subtitle="Loading community data...">
        <div className="text-center py-12 text-slate-500">Loading analytics...</div>
      </DashboardLayout>
    );
  }

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
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">Based on registration activity and participation</p>
            </div>
          </div>
          
          {communityRanking.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No community data available.</p>
          ) : (
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
          )}
        </div>

        {/* Participation Trends */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-[15px] font-bold text-slate-800">Participation Trends</h3>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">Daily registrations from major communities</p>
            </div>
          </div>
          <div className="flex-1">
            {participationRates.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No trend data available.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={participationRates} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  {lineKeys.map((key, idx) => (
                    <Line 
                      key={key}
                      type="monotone" 
                      dataKey={key} 
                      stroke={lineColors[idx % lineColors.length]} 
                      strokeWidth={3} 
                      dot={{ r: 4 }} 
                      activeDot={{ r: 6 }} 
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
