'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import { 
  Calendar as CalendarIcon, Clock, MapPin, ShoppingBag,
  CheckCircle2, AlertCircle, Filter, Loader2, ArrowRight,
  ChevronDown
} from 'lucide-react';

interface ScheduleItem {
  id: string;
  eventName: string;
  stallName: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  studentsRegistered: number;
}

export default function MySchedulePage() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'ongoing' | 'completed'>('all');
  const [showFilterPicker, setShowFilterPicker] = useState(false);

  useEffect(() => {
    async function fetchSchedule() {
      try {
        setIsLoading(true);
        const res = await fetch('/api/volunteer/schedule');
        if (res.ok) {
          const data = await res.json();
          setSchedule(data.schedule || []);
        }
      } catch (error) {
        console.error('Failed to fetch schedule:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSchedule();
  }, []);

  const filteredSchedule = schedule.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ongoing':
        return (
          <span className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
            <Clock className="w-3 h-3 animate-pulse" />
            Live Now
          </span>
        );
      case 'upcoming':
        return (
          <span className="flex items-center gap-1.5 bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
            <CalendarIcon className="w-3 h-3" />
            Upcoming
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center gap-1.5 bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </span>
        );
      default:
        return null;
    }
  };

  const isToday = (date: string) => {
    const today = new Date();
    const itemDate = new Date(date);
    return today.toDateString() === itemDate.toDateString();
  };

  return (
    <DashboardLayout 
      title="My Schedule"
      subtitle="View your assigned events and stall shifts"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {/* Filter Bar - Mobile optimized */}
          <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-semibold text-slate-700 hidden sm:inline">Filter by Status</span>
            </div>
            
            {/* Desktop filter buttons */}
            <div className="hidden sm:flex items-center gap-2">
              {(['all', 'ongoing', 'upcoming', 'completed'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-colors ${
                    filter === status 
                      ? 'bg-violet-600 text-white shadow-md' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Mobile filter dropdown */}
            <div className="sm:hidden relative">
              <button
                onClick={() => setShowFilterPicker(!showFilterPicker)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 capitalize"
              >
                {filter === 'all' ? 'All Events' : filter}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilterPicker ? 'rotate-180' : ''}`} />
              </button>
              {showFilterPicker && (
                <div className="absolute top-full right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden w-40">
                  {(['all', 'ongoing', 'upcoming', 'completed'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => { setFilter(status); setShowFilterPicker(false); }}
                      className={`w-full px-4 py-2.5 text-xs font-semibold capitalize text-left transition-colors ${
                        filter === status ? 'bg-violet-50 text-violet-600' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {status === 'all' ? 'All Events' : status}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Schedule Cards */}
          <div className="space-y-3 sm:space-y-4">
            {filteredSchedule.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center">
                <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-500 mb-2">No scheduled events found</p>
                <p className="text-xs text-slate-400">Contact your coordinator for assignments.</p>
              </div>
            ) : (
              filteredSchedule.map((item) => (
                <div 
                  key={item.id} 
                  className={`bg-white rounded-2xl border p-4 sm:p-6 transition-all ${
                    item.status === 'ongoing' 
                      ? 'border-violet-200 shadow-[0_4px_20px_rgba(108,59,255,0.1)]' 
                      : 'border-slate-200/80 shadow-[0_2px_12px_rgb(0,0,0,0.04)]'
                  } hover:shadow-md`}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Date Card */}
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex flex-col items-center justify-center text-center shrink-0 ${
                      item.status === 'ongoing' 
                        ? 'bg-violet-600 text-white' 
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      <span className="text-[10px] sm:text-[11px] font-bold uppercase">
                        {new Date(item.date).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-xl sm:text-2xl font-bold">
                        {new Date(item.date).getDate()}
                      </span>
                    </div>

                    {/* Event Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {getStatusBadge(item.status)}
                        {isToday(item.date) && (
                          <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                            Today
                          </span>
                        )}
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">{item.eventName}</h3>
                      
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-slate-600 mb-3">
                        <span className="flex items-center gap-1.5">
                          <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                          {item.stallName}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {item.location}
                        </span>
                      </div>

                      {/* Time & Students */}
                      <div className="flex items-center justify-between py-2 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium">
                            {item.startTime} - {item.endTime}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          {item.studentsRegistered} students
                        </div>
                      </div>

                      {/* Action Button */}
                      {item.status === 'ongoing' && (
                        <a 
                          href="/scan?autostart=true"
                          className="mt-3 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-3 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-violet-600/20 active:scale-[0.98]"
                        >
                          Start Evaluating
                          <ArrowRight className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Tips */}
          <div className="bg-gradient-to-r from-violet-50 to-blue-50 rounded-2xl p-4 sm:p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-violet-600" />
              Schedule Tips
            </h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-violet-600 mt-0.5 flex-shrink-0" />
                Arrive 15 minutes early for setup and briefing
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-violet-600 mt-0.5 flex-shrink-0" />
                Check your assigned stall location before the event starts
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-violet-600 mt-0.5 flex-shrink-0" />
                Contact your coordinator if you&apos;re unable to attend a scheduled shift
              </li>
            </ul>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
