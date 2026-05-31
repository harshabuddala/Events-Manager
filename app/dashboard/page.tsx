'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin, UserPlus, QrCode, ChevronDown, Loader2,
  Users, Building2, Footprints, FileText, TrendingUp,
  Activity, Calendar, School, ShoppingBag, Award
} from 'lucide-react';
import DashboardLayout from '@/app/components/DashboardLayout';
import VolunteerDashboardView from '@/app/components/VolunteerDashboardView';
import { useAuth } from '@/hooks/useAuth';

interface Community {
  id: string;
  name: string;
  location: string;
}

interface DashboardData {
  kpi: {
    totalRegistrations: number;
    totalCommunities: number;
    totalStallVisits: number;
    totalReportCards: number;
    completionRate: number;
  };
  topCommunities: Array<{
    name: string;
    participants: number;
    completed: number;
    rate: number;
  }>;
  liveActivities: Array<{
    id: string;
    title: string;
    roll: string;
    time: string;
    type: 'register' | 'score' | 'complete' | 'report';
  }>;
  funnelData: Array<{
    label: string;
    val: number;
    pct: string;
    color: string;
  }>;
  eventSummary: {
    liveEvents: number;
    totalVolunteers: number;
    totalStalls: number;
  };
}

/* ================================================
   ADMIN / MANAGER DASHBOARD
   ================================================ */
function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/communities').then(r => r.ok ? r.json() : Promise.reject()),
      fetch('/api/dashboard').then(r => r.ok ? r.json() : Promise.reject()),
    ])
      .then(([communityData, dashboardData]) => {
        const list = communityData.communities || communityData || [];
        setCommunities(list);
        if (list.length > 0) setSelectedCommunity(list[0].id);
        setData(dashboardData);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const selectedCommunityName = communities.find(c => c.id === selectedCommunity)?.name || 'Select Community';

  const handleAction = (path: string) => {
    if (selectedCommunity) {
      router.push(`${path}?communityId=${selectedCommunity}`);
    } else {
      alert('Please select a community first');
    }
  };

  const activityTypeConfig: Record<string, { icon: any; color: string; bg: string }> = {
    register: { icon: UserPlus, color: 'text-violet-600', bg: 'bg-violet-100' },
    score: { icon: Award, color: 'text-amber-600', bg: 'bg-amber-100' },
    complete: { icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    report: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5 sm:space-y-6">
      {/* KPI Cards */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <KpiCard
            icon={Users}
            label="Registrations"
            value={data.kpi.totalRegistrations}
            color="violet"
            suffix=""
          />
          <KpiCard
            icon={Building2}
            label="Communities"
            value={data.kpi.totalCommunities}
            color="blue"
            suffix=""
          />
          <KpiCard
            icon={Footprints}
            label="Stall Visits"
            value={data.kpi.totalStallVisits}
            color="emerald"
            suffix=""
          />
          <KpiCard
            icon={FileText}
            label="Report Cards"
            value={data.kpi.totalReportCards}
            color="amber"
            suffix=""
          />
          <KpiCard
            icon={TrendingUp}
            label="Completion"
            value={data.kpi.completionRate}
            color="rose"
            suffix="%"
          />
        </div>
      )}

      {/* Event Summary */}
      {data && (
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-[0_2px_12px_rgb(0,0,0,0.04)] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{data.eventSummary.liveEvents}</p>
              <p className="text-xs font-medium text-slate-500">Live Events</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-[0_2px_12px_rgb(0,0,0,0.04)] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
              <School className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{data.eventSummary.totalVolunteers}</p>
              <p className="text-xs font-medium text-slate-500">Volunteers</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-[0_2px_12px_rgb(0,0,0,0.04)] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{data.eventSummary.totalStalls}</p>
              <p className="text-xs font-medium text-slate-500">Stalls</p>
            </div>
          </div>
        </div>
      )}

      {/* Funnel Data */}
      {data && data.funnelData.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)] p-4 sm:p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Registration Funnel</h3>
          <div className="flex items-end gap-2 sm:gap-3">
            {data.funnelData.map((step, i) => (
              <div key={step.label} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-xs font-bold text-slate-700">{step.val}</span>
                <div
                  className={`w-full ${step.color} rounded-t-md transition-all`}
                  style={{ height: `${Math.max(8, (step.val / Math.max(1, data.kpi.totalRegistrations)) * 80)}px` }}
                />
                <span className="text-[10px] text-slate-500 text-center leading-tight">{step.label}</span>
                {i < data.funnelData.length - 1 && (
                  <span className="text-[10px] font-bold text-slate-400 mt-0.5">{step.pct}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Community Selection + Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)] p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Select Community</h2>
              <p className="text-xs text-slate-500">Choose a community to manage events</p>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center justify-between px-3 sm:px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-left hover:border-violet-300 hover:bg-white transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-violet-600" />
                </div>
                <span className="font-semibold text-slate-800 text-sm truncate">{selectedCommunityName}</span>
              </div>
              <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform shrink-0 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
                {communities.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-slate-500">No communities available</div>
                ) : (
                  communities.map((community) => (
                    <button
                      key={community.id}
                      onClick={() => {
                        setSelectedCommunity(community.id);
                        setDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors ${selectedCommunity === community.id ? 'bg-violet-50/50' : ''}`}
                    >
                      <div className={`w-2 h-2 rounded-full shrink-0 ${selectedCommunity === community.id ? 'bg-violet-600' : 'bg-slate-300'}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{community.name}</p>
                        <p className="text-xs text-slate-500">{community.location}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)] p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Actions</h2>
              <p className="text-xs text-slate-500">Quick links for daily operations</p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handleAction('/events')}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition-all text-left active:scale-[0.98]"
            >
              <div className="w-9 h-9 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                <UserPlus className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Register Student</p>
                <p className="text-xs text-slate-500">Register students for community events</p>
              </div>
            </button>
            <button
              onClick={() => router.push('/scan?autostart=true')}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all text-left active:scale-[0.98]"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                <QrCode className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Scan ID</p>
                <p className="text-xs text-slate-500">Scan student QR to check in or evaluate</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom row: Top Communities + Live Activity */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {/* Top Communities */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)] p-4 sm:p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Top Communities</h3>
            {data.topCommunities.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No data yet</p>
            ) : (
              <div className="space-y-3">
                {data.topCommunities.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 w-5 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{c.name}</p>
                      <div className="flex items-center gap-0.5">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-violet-500 to-violet-600 rounded-full"
                            style={{ width: `${c.rate}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 ml-1 w-9 shrink-0">{c.rate}%</span>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-600 shrink-0">{c.participants} ppl</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Activity */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)] p-4 sm:p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Recent Activity</h3>
            {data.liveActivities.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {data.liveActivities.map((a) => {
                  const config = activityTypeConfig[a.type] || activityTypeConfig.register;
                  const Icon = config.icon;
                  return (
                    <div key={a.id} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{a.title}</p>
                        <p className="text-xs text-slate-500">#{a.roll}</p>
                      </div>
                      <span className="text-xs text-slate-400 shrink-0">{a.time}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  color = 'violet',
  suffix = '',
}: {
  icon: any;
  label: string;
  value: number;
  color?: string;
  suffix?: string;
}) {
  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    violet: { bg: 'bg-violet-50', border: 'border-violet-100', text: 'text-violet-600' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-600' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-600' },
    rose: { bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-600' },
  };
  const colors = colorMap[color] || colorMap.violet;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-[0_2px_12px_rgb(0,0,0,0.04)]">
      <div className={`w-8 h-8 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center mb-2`}>
        <Icon className={`w-4 h-4 ${colors.text}`} />
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-slate-900">{value}{suffix}</p>
      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}

/* ================================================
   MAIN DASHBOARD PAGE — Role-based routing
   ================================================ */
export default function Dashboard() {
  const { user, isLoading, canManage } = useAuth();

  if (isLoading) {
    return (
      <DashboardLayout title="Dashboard" subtitle="Loading...">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (canManage) {
    return (
      <DashboardLayout
        title="Dashboard"
        subtitle={`Welcome back, ${user?.name || 'Admin'} — here's your overview`}
      >
        <AdminDashboard />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="Your volunteer overview"
    >
      <VolunteerDashboardView />
    </DashboardLayout>
  );
}
