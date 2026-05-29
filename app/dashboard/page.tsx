'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, UserPlus, QrCode, ChevronDown, Loader2 } from 'lucide-react';
import DashboardLayout from '@/app/components/DashboardLayout';
import VolunteerDashboardView from '@/app/components/VolunteerDashboardView';
import { useAuth } from '@/hooks/useAuth';

interface Community {
  id: string;
  name: string;
  location: string;
}

/* ================================================
   ADMIN / MANAGER DASHBOARD (Community Selector)
   ================================================ */
function AdminDashboard() {
  const router = useRouter();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    fetch('/api/communities')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const list = data.communities || data || [];
        setCommunities(list);
        if (list.length > 0) setSelectedCommunity(list[0].id);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 sm:space-y-8">
      {/* Community Selection */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)] p-4 sm:p-8">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-violet-600" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Select Community</h2>
            <p className="text-xs sm:text-sm text-slate-500">Choose a community to manage events</p>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between px-3 sm:px-4 py-3 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-left hover:border-violet-300 hover:bg-white transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-600" />
              </div>
              <span className="font-semibold text-slate-800 text-sm sm:text-base truncate">{selectedCommunityName}</span>
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

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <button
          onClick={() => handleAction('/events')}
          className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)] p-5 sm:p-6 hover:border-violet-300 hover:shadow-[0_8px_30px_rgba(108,59,255,0.08)] hover:-translate-y-0.5 transition-all group text-left active:scale-[0.98]"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-violet-600 group-hover:border-violet-600 transition-colors">
            <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-violet-600 group-hover:text-white transition-colors" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1">Register Student</h3>
          <p className="text-xs sm:text-sm text-slate-500">Register students for events in selected community</p>
        </button>

        <button
          onClick={() => router.push('/scan?autostart=true')}
          className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)] p-5 sm:p-6 hover:border-emerald-300 hover:shadow-[0_8px_30px_rgba(16,185,129,0.08)] hover:-translate-y-0.5 transition-all group text-left active:scale-[0.98]"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-emerald-600 group-hover:border-emerald-600 transition-colors">
            <QrCode className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 group-hover:text-white transition-colors" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1">Scan ID</h3>
          <p className="text-xs sm:text-sm text-slate-500">Scan student QR codes to check in or evaluate</p>
        </button>
      </div>
    </div>
  );
}

/* ================================================
   MAIN DASHBOARD PAGE — Role-based routing
   ================================================ */
export default function Dashboard() {
  const { user, isLoading, isVolunteer, canManage } = useAuth();

  if (isLoading) {
    return (
      <DashboardLayout title="Dashboard" subtitle="Loading...">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      </DashboardLayout>
    );
  }

  // Admin / Manager dashboard
  if (canManage) {
    return (
      <DashboardLayout 
        title="Dashboard"
        subtitle={`Welcome back, ${user?.name || 'Admin'} — here's your overview`}
      >
        <VolunteerDashboardView />
      </DashboardLayout>
    );
  }

  // Volunteer dashboard
  return (
    <DashboardLayout 
      title="Trip Manager"
      subtitle="Select a community and choose an action"
    >
      <AdminDashboard />
    </DashboardLayout>
  );
}
