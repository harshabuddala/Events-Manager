'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

interface StallData {
  stallTraffic: Array<{ name: string; visits: number; fill: string }>;
  stallEngagement: Array<{ name: string; avgTime: number; completions: number }>;
}

export default function StallAnalyticsPage() {
  const [data, setData] = useState<StallData | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/stalls')
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const stallTraffic = data?.stallTraffic || [];
  const stallEngagement = data?.stallEngagement || [];

  if (isLoading) {
    return (
      <DashboardLayout title="Stall Analytics" subtitle="Loading stall data...">
        <div className="text-center py-12 text-slate-500">Loading analytics...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Stall Analytics"
      subtitle="Analyze traffic, engagement time, and completion rates per stall."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5 sm:mb-8">
        {/* Traffic Distribution */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-[15px] font-bold text-slate-800">Traffic Distribution</h3>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">Total visits breakdown by stall</p>
            </div>
          </div>
          <div className="flex-1 relative">
            {stallTraffic.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No stall visit data.</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stallTraffic}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="visits"
                      onMouseEnter={onPieEnter}
                    >
                      {stallTraffic.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.fill} 
                          opacity={activeIndex === index ? 1 : 0.8}
                          strokeWidth={activeIndex === index ? 2 : 1}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: any) => [`${value} visits`, 'Traffic']}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Legend 
                      layout="vertical" 
                      verticalAlign="middle" 
                      align="right"
                      wrapperStyle={{ fontSize: '11px' }}
                      iconSize={8}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
                {stallTraffic[activeIndex] && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none -ml-[120px]">
                    <div className="text-center">
                      <span className="block text-2xl font-bold text-slate-800 leading-none">
                        {stallTraffic[activeIndex].visits}
                      </span>
                      <span className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-1">
                        Visits
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Engagement Time vs Completion */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-[15px] font-bold text-slate-800">Engagement & Completion</h3>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">Avg score (mins proxy) vs completion rate (%)</p>
            </div>
          </div>
          <div className="flex-1">
            {stallEngagement.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No engagement data available.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stallEngagement} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B' }} dy={10} />
                  <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} domain={[0, 100]} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{fill: '#f8fafc'}}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar yAxisId="left" dataKey="avgTime" name="Avg Score (mins)" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={16} />
                  <Bar yAxisId="right" dataKey="completions" name="Completion Rate (%)" fill="#10b981" radius={[4, 4, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
