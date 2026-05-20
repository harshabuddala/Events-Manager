'use client';

import React from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, Cell
} from 'recharts';

const ratingsDistribution = [
  { rating: '5 Stars', count: 18, fill: '#10b981' },
  { rating: '4 Stars', count: 24, fill: '#8b5cf6' },
  { rating: '3 Stars', count: 4, fill: '#f59e0b' },
  { rating: '1-2 Stars', count: 2, fill: '#ef4444' },
];

const workloadVsRating = [
  { name: 'Anjali D.', workload: 12, rating: 4.9 },
  { name: 'Priya I.', workload: 15, rating: 4.8 },
  { name: 'Neha S.', workload: 9, rating: 4.9 },
  { name: 'Rahul V.', workload: 8, rating: 4.7 },
  { name: 'Amit K.', workload: 14, rating: 4.3 },
  { name: 'Rohan T.', workload: 6, rating: 4.0 },
  { name: 'Sneha R.', workload: 11, rating: 4.6 },
  { name: 'Vikram M.', workload: 20, rating: 4.2 }, // high workload, lower rating
];

export default function VolunteerAnalyticsPage() {
  return (
    <DashboardLayout 
      title="Volunteer Performance"
      subtitle="Analyze volunteer effectiveness, workload balance, and feedback ratings."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5 sm:mb-8">
        
        {/* Rating Distribution */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-[15px] font-bold text-slate-800">Feedback Ratings</h3>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">Distribution of volunteer evaluations</p>
            </div>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratingsDistribution} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis dataKey="rating" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 'bold', fill: '#475569' }} />
                <RechartsTooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                  {ratingsDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Workload vs Rating Scatter */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-[15px] font-bold text-slate-800">Workload vs. Rating</h3>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">Events participated vs average rating score</p>
            </div>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis type="number" dataKey="workload" name="Events" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} label={{ value: 'Events Participated', position: 'bottom', fontSize: 10, fill: '#94a3b8' }} />
                <YAxis type="number" dataKey="rating" name="Rating" domain={[3.5, 5]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <ZAxis type="category" dataKey="name" name="Volunteer" />
                <RechartsTooltip 
                  cursor={{strokeDasharray: '3 3'}}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                />
                <Scatter data={workloadVsRating} fill="#8b5cf6" shape="circle" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
