'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, Clock, TrendingUp, 
  ShoppingBag, Star, ArrowRight, Loader2,
  MapPin, Calendar as CalendarIcon
} from 'lucide-react';

interface Assignment {
  id: string;
  stallName: string;
  eventName: string;
  eventDate: string;
  location: string;
  studentsEvaluated: number;
  totalStudents: number;
  avgRating: number;
}

interface Stats {
  todayEvaluations: number;
  totalEvaluations: number;
  assignedStalls: number;
  avgRating: number;
  hoursWorked: number;
}

export default function VolunteerDashboardView() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [stats, setStats] = useState<Stats>({
    todayEvaluations: 0,
    totalEvaluations: 0,
    assignedStalls: 0,
    avgRating: 0,
    hoursWorked: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        
        const assignRes = await fetch('/api/volunteer/assignments');
        if (assignRes.ok) {
          const data = await assignRes.json();
          setAssignments(data.assignments || []);
        }

        const statsRes = await fetch('/api/volunteer/stats');
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const StatCard = ({ 
    icon: Icon, 
    label, 
    value, 
    change, 
    color = 'violet' 
  }: { 
    icon: any, 
    label: string, 
    value: string | number, 
    change?: string, 
    color?: string 
  }) => {
    const colorMap: Record<string, { bg: string, border: string, text: string }> = {
      violet: { bg: 'bg-violet-50', border: 'border-violet-100', text: 'text-violet-600' },
      blue: { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-600' },
      emerald: { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600' },
      amber: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-600' },
    };
    const colors = colorMap[color] || colorMap.violet;

    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-[0_2px_12px_rgb(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgb(0,0,0,0.06)] transition-shadow">
        <div className="flex items-start justify-between mb-2 sm:mb-3">
          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center shrink-0`}>
            <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${colors.text}`} />
          </div>
          {change && (
            <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
              {change}
            </span>
          )}
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">{value}</p>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard 
          icon={CheckCircle2}
          label="Today's Evaluations"
          value={stats.todayEvaluations}
          change="+12%"
          color="emerald"
        />
        <StatCard 
          icon={Users}
          label="Total Evaluations"
          value={stats.totalEvaluations}
          color="blue"
        />
        <StatCard 
          icon={ShoppingBag}
          label="Assigned Stalls"
          value={stats.assignedStalls}
          color="violet"
        />
        <StatCard 
          icon={Star}
          label="Avg. Rating"
          value={stats.avgRating.toFixed(1)}
          color="amber"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-violet-600 to-violet-700 rounded-2xl p-4 sm:p-6 shadow-lg shadow-violet-600/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-white">
            <h3 className="text-base sm:text-lg font-bold mb-1">Ready to evaluate students?</h3>
            <p className="text-violet-100 text-xs sm:text-sm">Scan QR codes or start a new evaluation from your assigned stalls.</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a 
              href="/scan?autostart=true"
              className="flex items-center justify-center gap-2 bg-white text-violet-700 px-4 py-3 sm:py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-50 transition-colors shadow-lg w-full sm:w-auto active:scale-[0.98]"
            >
              <CheckCircle2 className="w-4 h-4" />
              Start Scanning
              <ArrowRight className="w-4 h-4 hidden sm:block" />
            </a>
          </div>
        </div>
      </div>

      {/* Active Assignments */}
      <div>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h3 className="text-sm sm:text-base font-bold text-slate-900">Your Active Assignments</h3>
          <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
            {assignments.length} active
          </span>
        </div>

        {assignments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500 mb-2">No active assignments</p>
            <p className="text-xs text-slate-400">Contact your coordinator to get assigned to a stall.</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-[0_2px_12px_rgb(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgb(0,0,0,0.06)] transition-all hover:border-violet-200">
                <div className="flex flex-col gap-4">
                  {/* Top section: Info */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <ShoppingBag className="w-4 h-4 text-violet-600 shrink-0" />
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 truncate">{assignment.stallName}</h4>
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-slate-600 mb-2">{assignment.eventName}</p>
                      
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className="w-3.5 h-3.5" />
                          {new Date(assignment.eventDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[120px]">{assignment.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Mobile: Stats in a row */}
                    <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                      <div className="text-center">
                        <div className="text-lg sm:text-2xl font-bold text-slate-900">
                          {assignment.studentsEvaluated}/{assignment.totalStudents}
                        </div>
                        <p className="text-[9px] sm:text-[10px] font-medium text-slate-500 uppercase tracking-wider">Students</p>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center gap-0.5 text-amber-600 justify-center">
                          <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-500" />
                          <span className="text-lg sm:text-2xl font-bold">{assignment.avgRating.toFixed(1)}</span>
                        </div>
                        <p className="text-[9px] sm:text-[10px] font-medium text-slate-500 uppercase tracking-wider">Avg Rating</p>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] sm:text-xs font-medium text-slate-500">Progress</span>
                      <span className="text-[10px] sm:text-xs font-bold text-violet-600">
                        {Math.round((assignment.studentsEvaluated / assignment.totalStudents) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-violet-500 to-violet-600 rounded-full transition-all duration-500"
                        style={{ width: `${(assignment.studentsEvaluated / assignment.totalStudents) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Action button */}
                  <a 
                    href={`/my-evaluations?stall=${assignment.id}`}
                    className="flex items-center justify-center gap-1.5 bg-violet-50 text-violet-700 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold hover:bg-violet-100 transition-colors active:scale-[0.98]"
                  >
                    View Evaluations
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-[0_2px_12px_rgb(0,0,0,0.04)]">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-3 sm:mb-4">Recent Activity</h3>
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center gap-3 p-2.5 sm:p-3 bg-slate-50 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-slate-800 truncate">Evaluated student #REG-001</p>
              <p className="text-[10px] sm:text-xs text-slate-500">Science Stall • 2 minutes ago</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2.5 sm:p-3 bg-slate-50 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-slate-800 truncate">Shift started at Math Stall</p>
              <p className="text-[10px] sm:text-xs text-slate-500">1 hour ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
