'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import { 
  TrendingUp, Star, Users, Clock, Award, 
  BarChart3, ArrowUp, ArrowDown, Target, Loader2,
  ChevronDown
} from 'lucide-react';

interface PerformanceData {
  totalEvaluations: number;
  avgRating: number;
  totalHours: number;
  studentsPerHour: number;
  ratingTrend: number[];
  skillDistribution: {
    participation: number;
    creativity: number;
    problemSolving: number;
    communication: number;
    learningAbility: number;
  };
  recentRatings: {
    date: string;
    rating: number;
    studentName: string;
  }[];
}

export default function MyPerformancePage() {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');
  const [showRangePicker, setShowRangePicker] = useState(false);

  useEffect(() => {
    async function fetchPerformanceData() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/volunteer/performance?range=${timeRange}`);
        if (res.ok) {
          const data = await res.json();
          setPerformanceData(data.performance);
        }
      } catch (error) {
        console.error('Failed to fetch performance data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPerformanceData();
  }, [timeRange]);

  const StatCard = ({ 
    icon: Icon, 
    label, 
    value, 
    change, 
    positive = true,
    color = 'violet'
  }: { 
    icon: any, 
    label: string, 
    value: string | number, 
    change?: number, 
    positive?: boolean,
    color?: string
  }) => {
    const colorMap: Record<string, { bg: string, border: string, text: string }> = {
      violet: { bg: 'bg-violet-50', border: 'border-violet-100', text: 'text-violet-600' },
      amber: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-600' },
      blue: { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-600' },
      emerald: { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600' },
      rose: { bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-600' },
    };
    const colors = colorMap[color] || colorMap.violet;

    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center shrink-0`}>
            <Icon className={`w-5 h-5 ${colors.text}`} />
          </div>
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
              positive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
              {positive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {Math.abs(change)}%
            </div>
          )}
        </div>
        <div className="space-y-0.5">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">{value}</p>
        </div>
      </div>
    );
  };

  const SkillBar = ({ label, value, color }: { label: string, value: number, color: string }) => {
    const colorMap: Record<string, string> = {
      violet: 'bg-violet-500',
      blue: 'bg-blue-500',
      emerald: 'bg-emerald-500',
      amber: 'bg-amber-500',
      rose: 'bg-rose-500',
    };
    const barColor = colorMap[color] || 'bg-violet-500';

    return (
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-slate-700">{label}</span>
          <span className="text-xs font-bold text-slate-900">{value.toFixed(1)}/10</span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full ${barColor} rounded-full transition-all duration-500`}
            style={{ width: `${(value / 10) * 100}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout 
      title="My Performance"
      subtitle="Track your evaluation metrics and improvement areas"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      ) : performanceData ? (
        <div className="space-y-4 sm:space-y-6">
          {/* Time Range Selector */}
          <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4">
            <h3 className="text-sm font-bold text-slate-900">Performance Overview</h3>
            
            {/* Desktop selector */}
            <div className="hidden sm:flex items-center gap-2">
              {(['week', 'month', 'all'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-colors ${
                    timeRange === range 
                      ? 'bg-violet-600 text-white shadow-md' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            {/* Mobile selector */}
            <div className="sm:hidden relative">
              <button
                onClick={() => setShowRangePicker(!showRangePicker)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700"
              >
                {timeRange}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showRangePicker ? 'rotate-180' : ''}`} />
              </button>
              {showRangePicker && (
                <div className="absolute top-full right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
                  {(['week', 'month', 'all'] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => { setTimeRange(range); setShowRangePicker(false); }}
                      className={`w-full px-4 py-2.5 text-xs font-semibold capitalize text-left transition-colors ${
                        timeRange === range ? 'bg-violet-50 text-violet-600' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard 
              icon={Users}
              label="Total Evaluations"
              value={performanceData.totalEvaluations}
              change={12}
              color="violet"
            />
            <StatCard 
              icon={Star}
              label="Average Rating"
              value={performanceData.avgRating.toFixed(1)}
              change={8}
              color="amber"
            />
            <StatCard 
              icon={Clock}
              label="Hours Worked"
              value={performanceData.totalHours.toFixed(1)}
              color="blue"
            />
            <StatCard 
              icon={Target}
              label="Students/Hour"
              value={performanceData.studentsPerHour.toFixed(1)}
              change={15}
              color="emerald"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Skill Distribution */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-5">
                <BarChart3 className="w-5 h-5 text-violet-600" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900">Skill Assessment Distribution</h3>
              </div>
              
              <div className="space-y-5">
                <SkillBar 
                  label="Participation" 
                  value={performanceData.skillDistribution.participation} 
                  color="violet" 
                />
                <SkillBar 
                  label="Creativity" 
                  value={performanceData.skillDistribution.creativity} 
                  color="blue" 
                />
                <SkillBar 
                  label="Problem Solving" 
                  value={performanceData.skillDistribution.problemSolving} 
                  color="emerald" 
                />
                <SkillBar 
                  label="Communication" 
                  value={performanceData.skillDistribution.communication} 
                  color="amber" 
                />
                <SkillBar 
                  label="Learning Ability" 
                  value={performanceData.skillDistribution.learningAbility} 
                  color="rose" 
                />
              </div>
            </div>

            {/* Recent Ratings */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="w-5 h-5 text-violet-600" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900">Recent Ratings</h3>
              </div>

              <div className="space-y-3">
                {performanceData.recentRatings.map((rating, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-sm font-bold shrink-0">
                      {rating.studentName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{rating.studentName}</p>
                      <p className="text-xs text-slate-500">{new Date(rating.date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-lg border border-amber-100 text-xs font-bold shrink-0">
                      <Star className="w-3 h-3 fill-amber-500" />
                      {rating.rating.toFixed(1)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Achievement Badges */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-5">
              <Award className="w-5 h-5 text-violet-600" />
              <h3 className="text-sm sm:text-base font-bold text-slate-900">Achievement Badges</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl border border-amber-200">
                <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center mx-auto mb-3">
                  <Star className="w-6 h-6 text-white fill-white" />
                </div>
                <p className="text-sm font-bold text-amber-900">Top Rater</p>
                <p className="text-xs text-amber-700 mt-1">Above 4.5 avg rating</p>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-violet-50 to-violet-100 rounded-2xl border border-violet-200">
                <div className="w-12 h-12 rounded-full bg-violet-500 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm font-bold text-violet-900">100 Evaluations</p>
                <p className="text-xs text-violet-700 mt-1">Milestone achieved</p>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200">
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm font-bold text-blue-900">Dedicated</p>
                <p className="text-xs text-blue-700 mt-1">50+ hours worked</p>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200 opacity-50">
                <div className="w-12 h-12 rounded-full bg-slate-300 flex items-center justify-center mx-auto mb-3">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm font-bold text-slate-700">Perfect Score</p>
                <p className="text-xs text-slate-500 mt-1">All 5-star ratings</p>
              </div>
            </div>
          </div>

          {/* Tips for Improvement */}
          <div className="bg-gradient-to-r from-violet-600 to-violet-700 rounded-2xl p-4 sm:p-6 text-white">
            <h3 className="text-sm sm:text-base font-bold mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Tips for Improvement
            </h3>
            <ul className="space-y-2 text-sm text-violet-100">
              <li className="flex items-start gap-2">
                <Star className="w-4 h-4 mt-0.5 flex-shrink-0 fill-amber-300 text-amber-300" />
                Focus on providing detailed and constructive feedback in remarks
              </li>
              <li className="flex items-start gap-2">
                <Star className="w-4 h-4 mt-0.5 flex-shrink-0 fill-amber-300 text-amber-300" />
                Ensure balanced scoring across all skill areas
              </li>
              <li className="flex items-start gap-2">
                <Star className="w-4 h-4 mt-0.5 flex-shrink-0 fill-amber-300 text-amber-300" />
                Maintain consistency in evaluation criteria
              </li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500">
          No performance data available
        </div>
      )}
    </DashboardLayout>
  );
}
