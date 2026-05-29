'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/DashboardLayout';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  AreaChart, Area
} from 'recharts';
import {
  ArrowLeft, Users, CheckCircle2, Clock, TrendingUp, Star,
  ShoppingBag, Award, BarChart3, GraduationCap, UserCheck,
  FileText, Loader2, Medal, Crown, Target, Activity
} from 'lucide-react';

interface AnalyticsData {
  summary: {
    totalRegs: number;
    completedRegs: number;
    inProgressRegs: number;
    pendingRegs: number;
    completionRate: number;
    avgOverallScore: number | null;
    totalEvaluations: number;
    totalStalls: number;
  };
  registrationTrend: Array<{ time: string; count: number }>;
  stallStats: Array<{
    id: string;
    name: string;
    code: string;
    visits: number;
    completed: number;
    avgScore: number | null;
    gradeCount: Record<string, number>;
    skills: { creativity: number | null; problemSolving: number | null; communication: number | null; learningAbility: number | null };
  }>;
  gradeDistribution: Record<string, number>;
  overallSkills: { creativity: number; problemSolving: number; communication: number; learningAbility: number };
  studentRankings: Array<{
    id: string;
    name: string;
    grade: string;
    rollNumber: string;
    avgScore: number;
    stallCount: number;
    totalScore: number;
  }>;
  gradeParticipation: Array<{ grade: string; count: number }>;
  volunteerPerformance: Array<{ name: string; evaluations: number; avgScore: number }>;
  scoreByStall: Array<{ name: string; score: number }>;
  statusData: Array<{ label: string; value: number; color: string }>;
}

const GRADE_COLORS: Record<string, string> = {
  'A+': '#059669', 'A': '#10b981', 'B': '#3b82f6', 'C': '#f59e0b',
  'D': '#f97316', 'E': '#ef4444', 'N/A': '#94a3b8',
};

const SKILL_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

export default function EventAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!eventId) return;
    fetch(`/api/events/${eventId}/analytics`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) setData(data);
        else setError('Failed to load analytics');
      })
      .catch(() => setError('Network error'))
      .finally(() => setIsLoading(false));
  }, [eventId]);

  if (isLoading) {
    return (
      <DashboardLayout title="Event Analytics" subtitle="Loading detailed insights...">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout title="Event Analytics" subtitle="Error loading data">
        <div className="text-center py-12 text-rose-500">{error || 'No data available'}</div>
      </DashboardLayout>
    );
  }

  const { summary } = data;

  const StatCard = ({ icon: Icon, label, value, sub, color }: any) => (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-[0_2px_12px_rgb(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgb(0,0,0,0.06)] transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-${color}-50 border border-${color}-100 flex items-center justify-center`}>
          <Icon className={`w-5 h-5 text-${color}-600`} />
        </div>
      </div>
      <div className="space-y-0.5">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  );

  return (
    <DashboardLayout
      title="Event Analytics"
      subtitle={`Comprehensive insights for event performance`}
      headerAction={
        <button
          onClick={() => router.push(`/events/${eventId}`)}
          className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Event
        </button>
      }
    >
      <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto">
        {/* ===== SUMMARY KPIs ===== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard icon={Users} label="Total Registered" value={summary.totalRegs} sub={`${summary.completionRate}% completed`} color="violet" />
          <StatCard icon={CheckCircle2} label="Completed" value={summary.completedRegs} sub="Finished all stalls" color="emerald" />
          <StatCard icon={Activity} label="Evaluations" value={summary.totalEvaluations} sub={`Across ${summary.totalStalls} stalls`} color="blue" />
          <StatCard icon={Star} label="Avg Score" value={summary.avgOverallScore ?? '—'} sub="Out of 10" color="amber" />
        </div>

        {/* ===== CHARTS ROW 1 ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {/* Registration Status Pie */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-[0_2px_12px_rgb(0,0,0,0.04)]">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-violet-600" />
              Registration Status
            </h3>
            <p className="text-xs text-slate-500 mb-4">How students are progressing through the event</p>
            {summary.totalRegs === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No registrations yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={data.statusData} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={75} innerRadius={45} paddingAngle={3}>
                    {data.statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => [v, '']} />
                  <Legend iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Registration Trend */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-[0_2px_12px_rgb(0,0,0,0.04)]">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-violet-600" />
              Registration Trend
            </h3>
            <p className="text-xs text-slate-500 mb-4">Registrations by hour</p>
            {data.registrationTrend.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No registration data</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data.registrationTrend}>
                  <defs>
                    <linearGradient id="regColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                  <Area type="monotone" dataKey="count" stroke="#8b5cf6" fillOpacity={1} fill="url(#regColor)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ===== CHARTS ROW 2 ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {/* Score by Stall */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-[0_2px_12px_rgb(0,0,0,0.04)]">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-violet-600" />
              Average Score by Stall
            </h3>
            <p className="text-xs text-slate-500 mb-4">Performance across activity stalls</p>
            {data.scoreByStall.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No scores recorded yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.scoreByStall} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="score" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Skill Radar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-[0_2px_12px_rgb(0,0,0,0.04)]">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Target className="w-5 h-5 text-violet-600" />
              Skill Assessment Overview
            </h3>
            <p className="text-xs text-slate-500 mb-4">Average scores across 4 key skills</p>
            {Object.values(data.overallSkills).every(v => v === 0) ? (
              <p className="text-sm text-slate-400 text-center py-8">No skill data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={[
                  { skill: 'Creativity', score: data.overallSkills.creativity },
                  { skill: 'Problem Solving', score: data.overallSkills.problemSolving },
                  { skill: 'Communication', score: data.overallSkills.communication },
                  { skill: 'Learning', score: data.overallSkills.learningAbility },
                ]}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                  <Radar name="Average" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} strokeWidth={2} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ===== STALL PERFORMANCE BREAKDOWN ===== */}
        {data.stallStats.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-violet-600" />
                Stall Performance Breakdown
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {data.stallStats.map((stall, i) => {
                const completionPct = stall.visits > 0 ? Math.round((stall.completed / stall.visits) * 100) : 0;
                const barColors = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];
                const barColor = barColors[i % barColors.length];
                return (
                  <div key={stall.id} className="px-5 sm:px-6 py-4 sm:py-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 font-mono">{stall.code}</span>
                        <span className="text-sm font-bold text-slate-900">{stall.name}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-slate-500 font-medium">
                        <span className="bg-slate-100 px-2 py-1 rounded-lg">{stall.visits} visits</span>
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg">{stall.completed} completed</span>
                        {stall.avgScore !== null && (
                          <span className="bg-violet-50 text-violet-700 font-bold px-2 py-1 rounded-lg">Avg {stall.avgScore}</span>
                        )}
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                      <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${completionPct}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-400 mb-3">{completionPct}% completion rate</p>

                    {/* Grade pills */}
                    {Object.keys(stall.gradeCount).length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(stall.gradeCount).sort(([a], [b]) => a.localeCompare(b)).map(([grade, count]) => (
                          <span key={grade} className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${GRADE_COLORS[grade] ? `text-white` : 'bg-slate-100 text-slate-600 border-slate-200'}`} style={{ backgroundColor: GRADE_COLORS[grade] }}>
                            {grade}: {count}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== GRADE DISTRIBUTION & PARTICIPATION ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {/* Grade Distribution */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-[0_2px_12px_rgb(0,0,0,0.04)]">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-violet-600" />
              Grade Distribution
            </h3>
            {Object.keys(data.gradeDistribution).length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No grades recorded yet</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(data.gradeDistribution).sort(([a], [b]) => a.localeCompare(b)).map(([grade, count]) => {
                  const total = Object.values(data.gradeDistribution).reduce((a, b) => a + b, 0);
                  const pct = Math.round((count / total) * 100);
                  const color = GRADE_COLORS[grade] || '#94a3b8';
                  return (
                    <div key={grade}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-slate-800">Grade {grade}</span>
                        <span className="text-xs font-medium text-slate-500">{count} students ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Grade-wise Participation */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-[0_2px_12px_rgb(0,0,0,0.04)]">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-violet-600" />
              Participation by Grade
            </h3>
            {data.gradeParticipation.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No grade data</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.gradeParticipation} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="grade" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ===== TOP PERFORMING STUDENTS ===== */}
        {data.studentRankings.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                Top Performing Students
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {data.studentRankings.slice(0, 10).map((student, idx) => (
                <div key={student.id} className="px-5 sm:px-6 py-3 flex items-center gap-3 sm:gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    idx === 0 ? 'bg-amber-100 text-amber-700' :
                    idx === 1 ? 'bg-slate-200 text-slate-700' :
                    idx === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-slate-50 text-slate-500'
                  }`}>
                    {idx < 3 ? <Medal className="w-4 h-4" /> : idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{student.name}</p>
                    <p className="text-xs text-slate-500">{student.rollNumber} · Grade {student.grade}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-slate-500">{student.stallCount} stalls</span>
                    <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-lg border border-amber-100 text-xs font-bold">
                      <Star className="w-3 h-3 fill-amber-500" />
                      {student.avgScore}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== VOLUNTEER PERFORMANCE ===== */}
        {data.volunteerPerformance.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-violet-600" />
                Volunteer Performance
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {data.volunteerPerformance.map((vol) => (
                <div key={vol.name} className="px-5 sm:px-6 py-3 flex items-center gap-3 sm:gap-4">
                  <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-xs font-bold shrink-0">
                    {vol.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{vol.name}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-slate-500">{vol.evaluations} evaluations</span>
                    <div className="flex items-center gap-1 bg-violet-50 text-violet-700 px-2 py-1 rounded-lg border border-violet-100 text-xs font-bold">
                      <Star className="w-3 h-3 fill-violet-500" />
                      {vol.avgScore}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function PieChartIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  );
}
