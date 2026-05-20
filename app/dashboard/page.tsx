'use client';

import React, { useState } from 'react';
import {
  LayoutDashboard, Calendar, Users, FileText, ShoppingBag, UserCheck, 
  BarChart3, Settings, Users2, ChevronDown, GraduationCap, Bell, Plus, 
  TrendingUp, ArrowRight, Award, UserPlus, MapPin, Target, FileOutput,
  PieChart as PieChartIcon, Menu, X
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import Sidebar from '@/app/components/Sidebar';

/** ==============================
 *  DATA MOCKS
 *  ============================== */

const participationData = [
  { name: 'May 20', participants: 480, completed: 220 },
  { name: 'May 21', participants: 700, completed: 310 },
  { name: 'May 22', participants: 1200, completed: 520 },
  { name: 'May 23', participants: 850, completed: 390 },
  { name: 'May 24', participants: 780, completed: 600 },
  { name: 'May 25', participants: 650, completed: 410 },
  { name: 'May 26', participants: 1050, completed: 640 },
];

const stallVisitsData = [
  { name: 'Math Quest', value: 1256, color: '#0ea5e9' },
  { name: 'Science Lab', value: 1102, color: '#8b5cf6' },
  { name: 'English Arena', value: 987, color: '#10b981' },
  { name: 'Logical Challenge', value: 876, color: '#f59e0b' },
  { name: 'Memory Master', value: 734, color: '#f43f5e' },
  { name: 'Quick Think', value: 727, color: '#06b6d4' },
];

const topCommunities = [
  { name: 'Greenfield Society', participants: 312, completed: 256, rate: 82.1 },
  { name: 'Sunrise Apartments', participants: 278, completed: 215, rate: 77.3 },
  { name: 'Maple Residency', participants: 198, completed: 160, rate: 80.8 },
  { name: 'Dream Valley', participants: 176, completed: 128, rate: 72.7 },
  { name: 'Lakeview Enclave', participants: 156, completed: 123, rate: 78.8 },
];

const liveActivities = [
  { id: 1, title: 'New participant registered', roll: 'EDN784512', time: '2 min ago', type: 'register' },
  { id: 2, title: 'Scored in Math Quest', roll: 'EDN784512', time: '3 min ago', type: 'score' },
  { id: 3, title: 'Completed all stalls', roll: 'EDN784512', time: '5 min ago', type: 'complete' },
  { id: 4, title: 'Report card generated', roll: 'EDN784512', time: '7 min ago', type: 'report' },
  { id: 5, title: 'New participant registered', roll: 'EDN784678', time: '9 min ago', type: 'register' },
];

const funnelData = [
  { label: 'Registered', val: 1248, pct: '100%', color: 'bg-violet-500' },
  { label: 'Visited ≥ 1', val: 1102, pct: '88.3%', color: 'bg-blue-500' },
  { label: 'Visited ≥ 3', val: 965, pct: '77.3%', color: 'bg-teal-400' },
  { label: 'Visited All', val: 965, pct: '77.3%', color: 'bg-emerald-500' },
  { label: 'Report Generated', val: 965, pct: '77.3%', color: 'bg-orange-400' },
];

/** ==============================
 *  COMPONENTS
 *  ============================== */

const TinySparkline = ({ color, dataKey }: { color: string, dataKey: string }) => (
  <div className="h-6 w-full mt-1">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={participationData}>
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex bg-[#F5F6FA] min-h-screen text-slate-800 font-sans selection:bg-violet-200">
      
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#F5F6FA] max-w-[100vw]">
        
        {/* Header */}
        <header className="h-[72px] px-4 sm:px-6 lg:px-8 flex items-center justify-between flex-shrink-0 bg-[#F5F6FA]/90 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button 
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors -ml-2"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-[18px] sm:text-[20px] font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span className="hidden sm:inline">Good morning,</span> Admin <span className="animate-pulse origin-bottom-right">👋</span>
              </h2>
              <p className="hidden md:block text-[12px] font-medium text-slate-500 mt-0.5">Here&apos;s what&apos;s happening with your events today.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Date Range */}
            <div className="hidden lg:flex items-center gap-2 bg-white border border-slate-200/80 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 shadow-sm hover:border-slate-300 hover:shadow-md transition-all cursor-pointer">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>May 20 – May 26</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>

            {/* Notifications */}
            <div className="relative p-2 bg-white border border-slate-200/80 rounded-lg text-slate-500 shadow-sm hover:text-slate-800 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-violet-600 rounded-full border border-white"></span>
            </div>

            {/* CTA */}
            <button className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-[0_4px_12px_rgba(108,59,255,0.25)] hover:shadow-[0_6px_16px_rgba(108,59,255,0.3)] hover:-translate-y-[1px]">
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Create Event</span>
              <span className="sm:hidden">Create</span>
            </button>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="p-4 sm:p-6 lg:p-8 pt-0 overflow-y-auto space-y-4 sm:space-y-5 pb-16">
          
          {/* Row 1: Top Metrics - 5 Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            
            <div className="bg-white rounded-xl p-4 lg:p-5 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] relative overflow-hidden group hover:shadow-[0_4px_24px_rgb(0,0,0,0.04)] transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1">Total Participants</p>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight leading-none">1,248</h3>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded flex items-center gap-0.5">
                      <TrendingUp className="w-2.5 h-2.5" /> 18.6%
                    </span>
                  </div>
                  <p className="text-[10px] font-medium text-slate-400 mt-1.5">vs last 7 days</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center text-violet-600 shrink-0">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <TinySparkline color="#8b5cf6" dataKey="participants" />
            </div>

            <div className="bg-white rounded-xl p-4 lg:p-5 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] relative overflow-hidden group hover:shadow-[0_4px_24px_rgb(0,0,0,0.04)] transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1">Communities</p>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight leading-none">12</h3>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded flex items-center gap-0.5">
                      <TrendingUp className="w-2.5 h-2.5" /> 2
                    </span>
                  </div>
                  <p className="text-[10px] font-medium text-slate-400 mt-1.5">vs last 7 days</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
              </div>
              <TinySparkline color="#10b981" dataKey="completed" />
            </div>

            <div className="bg-white rounded-xl p-4 lg:p-5 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] relative overflow-hidden group hover:shadow-[0_4px_24px_rgb(0,0,0,0.04)] transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1">Stall Visits</p>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight leading-none">5,682</h3>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded flex items-center gap-0.5">
                      <TrendingUp className="w-2.5 h-2.5" /> 23.4%
                    </span>
                  </div>
                  <p className="text-[10px] font-medium text-slate-400 mt-1.5">vs last 7 days</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <TinySparkline color="#3b82f6" dataKey="participants" />
            </div>

            <div className="bg-white rounded-xl p-4 lg:p-5 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] relative overflow-hidden group hover:shadow-[0_4px_24px_rgb(0,0,0,0.04)] transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1">Report Cards Generated</p>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight leading-none">965</h3>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded flex items-center gap-0.5">
                      <TrendingUp className="w-2.5 h-2.5" /> 19.3%
                    </span>
                  </div>
                  <p className="text-[10px] font-medium text-slate-400 mt-1.5">vs last 7 days</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                  <FileOutput className="w-4 h-4" />
                </div>
              </div>
              <TinySparkline color="#f43f5e" dataKey="completed" />
            </div>

            <div className="bg-white rounded-xl p-4 lg:p-5 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] relative overflow-hidden group hover:shadow-[0_4px_24px_rgb(0,0,0,0.04)] transition-shadow sm:col-span-2 lg:col-span-1">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1">Completion Rate</p>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight leading-none">78.2%</h3>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded flex items-center gap-0.5">
                      <TrendingUp className="w-2.5 h-2.5" /> 15.7%
                    </span>
                  </div>
                  <p className="text-[10px] font-medium text-slate-400 mt-1.5">vs last 7 days</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <TinySparkline color="#f97316" dataKey="participants" />
            </div>
          </div>

           {/* Row 2: Main Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-12 gap-4 sm:gap-5">
            
            {/* Left: Participation Line Chart */}
            <div className="lg:col-span-2 xl:col-span-6 bg-white rounded-xl p-4 sm:p-5 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col">
              <div className="flex items-center justify-between mb-4 sm:mb-5">
                <h3 className="font-bold text-slate-800 text-sm sm:text-[15px]">Participation Overview</h3>
                <div className="flex items-center gap-1.5 border border-slate-200 px-2.5 py-1 rounded-lg text-[11px] text-slate-600 font-semibold cursor-pointer hover:bg-slate-50 transition-colors">
                  <span>Daily</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-4 sm:mb-5 px-1 sm:px-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-1 bg-violet-600 rounded-full"></div>
                  <span className="text-xs font-semibold text-slate-600">Participants</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-1 border-t-2 border-dashed border-violet-400"></div>
                  <span className="text-xs font-semibold text-slate-600">Completed All Stalls</span>
                </div>
              </div>

              <div className="flex-1 w-full min-h-[160px] sm:min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={participationData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }} dx={-5} tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}K` : val} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px -10px rgba(0,0,0,0.1)' }}
                      itemStyle={{ fontWeight: 700, fontSize: '12px' }}
                    />
                    <Line type="monotone" dataKey="participants" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 3.5, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 5, stroke: '#7c3aed', strokeWidth: 2 }} />
                    <Line type="monotone" dataKey="completed" stroke="#a78bfa" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 2.5, fill: '#fff' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 sm:mt-6 pt-4 sm:pt-5 border-t border-slate-100">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Today</p>
                  <p className="text-lg sm:text-[18px] font-bold text-slate-800 leading-tight">312</p>
                  <p className="text-[10px] font-medium text-slate-400 mt-0.5">Participants</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">This Week</p>
                  <p className="text-lg sm:text-[18px] font-bold text-slate-800 leading-tight">1,248</p>
                  <p className="text-[10px] font-medium text-slate-400 mt-0.5">Participants</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Completed</p>
                  <p className="text-lg sm:text-[18px] font-bold text-slate-800 leading-tight">965</p>
                  <p className="text-[10px] font-medium text-slate-400 mt-0.5">Participants</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Avg Rate</p>
                  <p className="text-lg sm:text-[18px] font-bold text-slate-800 leading-tight">78.2%</p>
                  <p className="text-[10px] font-medium text-slate-400 mt-0.5">Completion</p>
                </div>
              </div>
            </div>

            {/* Center: Stall Visits Donut Chart */}
            <div className="lg:col-span-1 xl:col-span-3 bg-white rounded-xl p-4 sm:p-5 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 text-sm sm:text-[15px]">Stall Visits</h3>
                <div className="flex items-center gap-1.5 border border-slate-200 px-2.5 py-1 rounded-lg text-[11px] text-slate-600 font-semibold cursor-pointer hover:bg-slate-50 transition-colors">
                  <span>All Stalls</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </div>
              </div>
              
              <div className="flex-1 flex flex-col items-center justify-center relative mt-1 min-h-[160px]">
                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stallVisitsData}
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                        cornerRadius={4}
                      >
                        {stallVisitsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }}
                        itemStyle={{ fontWeight: 700, fontSize: '11px', color: '#334155' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Center Text for Donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-5px]">
                  <span className="text-xl font-bold text-slate-800 tracking-tight">5,682</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
                </div>
              </div>

              <div className="mt-5 space-y-2.5">
                {stallVisitsData.map((stall, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stall.color }}></div>
                    <span className="text-[11px] text-slate-600 font-semibold flex-1 truncate">{stall.name}</span>
                    <span className="text-[11px] font-bold text-slate-800">{stall.value}</span>
                    <span className="text-[10px] font-bold text-slate-400 w-8 text-right">{((stall.value / 5682) * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>

              <button className="mt-6 flex items-center justify-center gap-1.5 w-full py-2.5 text-xs font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors">
                <span>View Analytics</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Right: Live Activity */}
            <div className="lg:col-span-1 xl:col-span-3 bg-white rounded-xl p-4 sm:p-5 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col">
              <div className="flex items-center justify-between mb-5 sm:mb-6">
                <h3 className="font-bold text-slate-800 text-sm sm:text-[15px]">Live Activity</h3>
                <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  Live
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-5">
                {liveActivities.map((activity, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="relative mt-0.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 border-white ring-1 ring-slate-100 ${
                        activity.type === 'register' ? 'bg-pink-100 text-pink-600' :
                        activity.type === 'score' ? 'bg-blue-100 text-blue-600' :
                        activity.type === 'complete' ? 'bg-emerald-100 text-emerald-600' :
                        'bg-orange-100 text-orange-600'
                      } shadow-sm z-10`}>
                        {activity.type === 'register' && <UserPlus className="w-3.5 h-3.5" />}
                        {activity.type === 'score' && <Target className="w-3.5 h-3.5" />}
                        {activity.type === 'complete' && <Award className="w-3.5 h-3.5" />}
                        {activity.type === 'report' && <FileOutput className="w-3.5 h-3.5" />}
                      </div>
                      {/* Connector Line */}
                      {i !== liveActivities.length - 1 && (
                        <div className="absolute top-8 bottom-[-20px] left-1/2 w-[2px] bg-slate-100 transform -translate-x-1/2 rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-1">
                      <div className="flex justify-between items-start">
                        <p className="text-xs font-semibold text-slate-800 leading-tight pr-2">{activity.title}</p>
                        <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">{activity.time}</span>
                      </div>
                      <p className="text-[10px] font-medium text-slate-500 mt-1">Roll: {activity.roll}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button className="mt-6 flex items-center justify-center gap-1.5 w-full py-2.5 text-xs font-bold text-violet-600 border border-violet-100 hover:bg-violet-50 rounded-lg transition-colors">
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
            
            {/* Left: Top Communities Table */}
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col">
              <div className="flex items-center justify-between mb-4 sm:mb-5">
                <h3 className="font-bold text-slate-800 text-sm sm:text-[15px]">Top Communities</h3>
                <button className="text-[11px] font-bold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-lg hover:bg-violet-100 transition-colors">
                  View All
                </button>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse min-w-[300px]">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="pb-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Community</th>
                      <th className="pb-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right leading-none">Participants</th>
                      <th className="pb-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right leading-none">Completed</th>
                      <th className="pb-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right leading-none">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {topCommunities.map((comm, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors group cursor-pointer border-b border-slate-50 last:border-0">
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-[28px] h-[28px] rounded-lg bg-slate-100 group-hover:bg-white flex items-center justify-center shrink-0 border border-slate-200/50 shadow-sm transition-colors">
                              <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            </div>
                            <span className="text-[11px] font-semibold text-slate-700 whitespace-nowrap">{comm.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 text-right text-[11px] font-bold text-slate-800">{comm.participants}</td>
                        <td className="py-2.5 text-right text-[11px] font-bold text-slate-800">{comm.completed}</td>
                        <td className="py-2.5 pl-2">
                          <div className="flex items-center justify-end gap-2 pr-1">
                            <div className="w-8 sm:w-10 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                              <div className="h-full bg-violet-500 rounded-full" style={{ width: `${comm.rate}%` }}></div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 w-6 text-right">{comm.rate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Center: Event Summary Hero Card */}
            <div className="rounded-xl p-5 sm:p-6 border border-[#5a2ee0] shadow-[0_10px_30px_-10px_rgba(108,59,255,0.4)] overflow-hidden relative" style={{ background: 'linear-gradient(145deg, #6C3BFF 0%, #4D21E0 100%)' }}>
              {/* Decorative elements */}
              <div className="absolute top-[-40px] right-[-40px] w-[140px] h-[140px] bg-white/10 rounded-full blur-2xl mix-blend-overlay"></div>
              <div className="absolute bottom-[-20px] left-[-20px] w-[100px] h-[100px] bg-indigo-400/30 rounded-full blur-xl mix-blend-overlay"></div>
              
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <h3 className="font-bold text-white/90 text-[10px] bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-md inline-block self-start mb-4 border border-white/10 tracking-widest uppercase shadow-sm">Event Summary</h3>
                  
                  <div className="mt-1">
                      <h2 className="text-[20px] sm:text-[22px] font-bold text-white leading-tight mb-2 tracking-tight">Excellent Progress! <span className="inline-block animate-bounce ml-1 text-lg sm:text-xl">🎉</span></h2>
                      <p className="text-violet-100 text-[11px] font-medium sm:pr-10 leading-relaxed opacity-90">Your events are performing great this week. Keep up the good work and momentum.</p>
                  </div>
                </div>

                <div className="mt-6 flex gap-2 sm:gap-2.5 w-full">
                  <div className="flex-1 bg-white/10 backdrop-blur-md rounded-xl p-2 sm:p-2.5 border border-white/10 flex flex-col gap-1.5 hover:bg-white/15 transition-colors group">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0 border border-white/10 shadow-sm group-hover:bg-white/30 transition-colors">
                      <Target className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-white" />
                    </div>
                    <div>
                      <p className="text-[8px] sm:text-[9px] uppercase tracking-wider text-violet-200 font-bold mb-0.5">Active</p>
                      <p className="text-sm sm:text-[16px] font-bold text-white leading-none">3</p>
                    </div>
                  </div>
                  <div className="flex-1 bg-white/10 backdrop-blur-md rounded-xl p-2 sm:p-2.5 border border-white/10 flex flex-col gap-1.5 hover:bg-white/15 transition-colors group">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0 border border-white/10 shadow-sm group-hover:bg-white/30 transition-colors">
                      <Users2 className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-white" />
                    </div>
                    <div>
                      <p className="text-[8px] sm:text-[9px] uppercase tracking-wider text-violet-200 font-bold mb-0.5">Volunteers</p>
                      <p className="text-sm sm:text-[16px] font-bold text-white leading-none">48</p>
                    </div>
                  </div>
                  <div className="flex-1 bg-white/10 backdrop-blur-md rounded-xl p-2 sm:p-2.5 border border-white/10 flex flex-col gap-1.5 hover:bg-white/15 transition-colors group">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0 border border-white/10 shadow-sm group-hover:bg-white/30 transition-colors">
                      <ShoppingBag className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-white" />
                    </div>
                    <div>
                      <p className="text-[8px] sm:text-[9px] uppercase tracking-wider text-violet-200 font-bold mb-0.5">Stalls</p>
                      <p className="text-sm sm:text-[16px] font-bold text-white leading-none">6</p>
                    </div>
                  </div>
                </div>

                {/* Decorative Icon */}
                <div className="hidden md:flex absolute right-1 top-10 w-20 h-20 bg-white/10 rounded-2xl backdrop-blur-sm items-center justify-center border border-white/20 shadow-lg transform rotate-[15deg] hover:rotate-[5deg] transition-transform duration-500">
                  <Award className="w-[42px] h-[42px] text-[#FDE047] drop-shadow-[0_8px_12px_rgba(253,224,71,0.3)]" strokeWidth={1.5} />
                </div>
              </div>
            </div>

            {/* Right: Stall Completion Funnel */}
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col">
              <div className="flex items-center justify-between mb-5 sm:mb-6">
                <h3 className="font-bold text-slate-800 text-sm sm:text-[15px]">Completion Funnel</h3>
                <div className="flex items-center gap-1.5 border border-slate-200 px-2.5 py-1 rounded-lg text-[11px] text-slate-600 font-semibold cursor-pointer hover:bg-slate-50 transition-colors">
                  <span>All Events</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center space-y-3 sm:space-y-4">
                {funnelData.map((stage, i) => (
                  <div key={i} className="flex items-center gap-2 sm:gap-3 group">
                    <div className="w-[85px] sm:w-[105px] text-[8.5px] sm:text-[9.5px] font-bold text-slate-400 uppercase tracking-wide shrink-0 truncate xs:whitespace-normal">{stage.label}</div>
                    <div className="flex-1 h-5 sm:h-6 rounded-md bg-slate-50 overflow-hidden flex items-center relative border border-slate-100">
                      <div 
                        className={`h-full ${stage.color} rounded-sm flex items-center shrink-0 pr-1 sm:pr-2 transition-all duration-1000 ease-out`} 
                        style={{ width: stage.pct }}
                      >
                      </div>
                    </div>
                    <div className="w-[40px] sm:w-[50px] shrink-0 text-right flex flex-col items-end">
                      <span className="text-[11px] sm:text-xs font-bold text-slate-800 leading-none">{stage.val}</span>
                      <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 mt-1">{stage.pct}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Row 4: Quick Actions */}
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
            <h3 className="font-bold text-slate-800 text-sm sm:text-[15px] mb-3 sm:mb-4">Quick Actions</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
              <button className="flex flex-col items-center justify-center p-3 sm:p-4 bg-slate-50/50 rounded-xl border border-slate-200/60 hover:border-violet-300 hover:shadow-[0_4px_15px_rgba(108,59,255,0.08)] hover:bg-white transition-all group gap-2 sm:gap-2.5">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white text-violet-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform group-hover:bg-violet-600 group-hover:text-white border border-slate-100 group-hover:border-violet-600">
                  <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 text-center leading-tight">Register<br/>Participant</span>
              </button>

              <button className="flex flex-col items-center justify-center p-3 sm:p-4 bg-slate-50/50 rounded-xl border border-slate-200/60 hover:border-emerald-300 hover:shadow-[0_4px_15px_rgba(16,185,129,0.08)] hover:bg-white transition-all group gap-2 sm:gap-2.5">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white text-emerald-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform group-hover:bg-emerald-600 group-hover:text-white border border-slate-100 group-hover:border-emerald-600">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 text-center leading-tight">Add<br/>Community</span>
              </button>

              <button className="flex flex-col items-center justify-center p-3 sm:p-4 bg-slate-50/50 rounded-xl border border-slate-200/60 hover:border-blue-300 hover:shadow-[0_4px_15px_rgba(59,130,246,0.08)] hover:bg-white transition-all group gap-2 sm:gap-2.5">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white text-blue-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform group-hover:bg-blue-600 group-hover:text-white border border-slate-100 group-hover:border-blue-600">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 text-center leading-tight">Create<br/>Event</span>
              </button>

              <button className="flex flex-col items-center justify-center p-3 sm:p-4 bg-slate-50/50 rounded-xl border border-slate-200/60 hover:border-orange-300 hover:shadow-[0_4px_15px_rgba(249,115,22,0.08)] hover:bg-white transition-all group gap-2 sm:gap-2.5">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white text-orange-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform group-hover:bg-orange-600 group-hover:text-white border border-slate-100 group-hover:border-orange-600">
                  <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 text-center leading-tight">Add<br/>Stall</span>
              </button>

              <button className="flex flex-col items-center justify-center p-3 sm:p-4 bg-slate-50/50 rounded-xl border border-slate-200/60 hover:border-pink-300 hover:shadow-[0_4px_15px_rgba(236,72,153,0.08)] hover:bg-white transition-all group gap-2 sm:gap-2.5">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white text-pink-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform group-hover:bg-pink-600 group-hover:text-white border border-slate-100 group-hover:border-pink-600">
                  <FileOutput className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 text-center leading-tight">Generate<br/>Report</span>
              </button>

              <button className="flex flex-col items-center justify-center p-3 sm:p-4 bg-slate-50/50 rounded-xl border border-slate-200/60 hover:border-teal-300 hover:shadow-[0_4px_15px_rgba(20,184,166,0.08)] hover:bg-white transition-all group gap-2 sm:gap-2.5">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white text-teal-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform group-hover:bg-teal-600 group-hover:text-white border border-slate-100 group-hover:border-teal-600">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 text-center leading-tight">View<br/>Reports</span>
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
