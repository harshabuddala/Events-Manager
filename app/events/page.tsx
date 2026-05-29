'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/DashboardLayout';
import EventFormModal from '@/app/components/EventFormModal';
import { 
  Calendar, MapPin, Users, Target, Search, 
  MoreVertical, ArrowRight, CheckCircle2, Clock, Plus, Trash2, Edit2, Eye, Loader2
} from 'lucide-react';

interface Event {
  id: string;
  code: string;
  name: string;
  communityId: string;
  community: string;
  location: string;
  date: string;
  endDate?: string;
  status: string;
  description?: string;
  participants: number;
  stalls: number;
  volunteers: number;
  completion: number;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [menuState, setMenuState] = useState<{id: string; top: number; left: number} | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.user?.role) setUserRole(data.user.role);
      })
      .catch(console.error);
  }, []);

  const canManageEvents = userRole === 'ADMIN' || userRole === 'MANAGER';

  const getComputedStatus = (dateStr: string, dbStatus?: string) => {
    if (dbStatus === 'CANCELLED') return 'CANCELLED';
    const eventDate = new Date(dateStr);
    const today = new Date();
    
    const dEvent = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate()).getTime();
    const dToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    
    if (dEvent < dToday) {
      return 'COMPLETED';
    } else if (dEvent === dToday) {
      return 'LIVE';
    } else {
      return 'UPCOMING';
    }
  };

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        const mapped = data.events.map((e: any) => ({
          ...e,
          status: getComputedStatus(e.date, e.status)
        }));
        setEvents(mapped);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleSuccess = () => {
    setEditingEvent(null);
    fetchEvents();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json();
        alert(error.error || 'Failed to delete event');
        return;
      }
      fetchEvents();
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  const filteredEvents = events.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.community.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'LIVE':
        return (
          <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            Live Now
          </span>
        );
      case 'UPCOMING':
        return (
          <span className="flex items-center gap-1.5 bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0">
            <Clock className="w-3 h-3" />
            Upcoming
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="flex items-center gap-1.5 bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="flex items-center gap-1.5 bg-rose-50 text-rose-600 border border-rose-100 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0">
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <DashboardLayout 
      title="Events Management"
      subtitle="View, manage and create educational events across communities."
      headerAction={
        canManageEvents && (
          <button 
            onClick={() => { setEditingEvent(null); setIsModalOpen(true); }}
            className="hidden lg:flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Event</span>
          </button>
        )
      }
    >
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 hide-scrollbar">
          <button onClick={() => setStatusFilter('ALL')} className={`px-4 py-2 rounded-md text-xs font-semibold shrink-0 shadow-sm ${statusFilter === 'ALL' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>All Events</button>
          <button onClick={() => setStatusFilter('LIVE')} className={`px-4 py-2 rounded-md text-xs font-semibold shrink-0 shadow-sm ${statusFilter === 'LIVE' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>Live</button>
          <button onClick={() => setStatusFilter('UPCOMING')} className={`px-4 py-2 rounded-md text-xs font-semibold shrink-0 shadow-sm ${statusFilter === 'UPCOMING' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>Upcoming</button>
          <button onClick={() => setStatusFilter('COMPLETED')} className={`px-4 py-2 rounded-md text-xs font-semibold shrink-0 shadow-sm ${statusFilter === 'COMPLETED' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>Completed</button>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search events..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 shadow-sm placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Backdrop for action menu */}
      {menuState && (
        <div className="fixed inset-0 z-20" onClick={() => setMenuState(null)} />
      )}

      {/* Floating action menu */}
      {menuState && (
        <div
          className="fixed z-30 w-36 bg-white border border-slate-200 rounded-lg shadow-xl py-1"
          style={{ top: menuState.top, left: menuState.left }}
        >
          <button
            onClick={() => { router.push(`/events/${menuState.id}`); setMenuState(null); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Eye className="w-3.5 h-3.5" /> View Details
          </button>
          {canManageEvents && (
            <>
              <button
                onClick={() => {
                  const event = events.find(e => e.id === menuState.id);
                  if (event) { setEditingEvent(event); setIsModalOpen(true); }
                  setMenuState(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
              <button
                onClick={() => { handleDelete(menuState.id); setMenuState(null); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </>
          )}
        </div>
      )}

      {/* Events List */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-[34%] bg-slate-50/80">Event Details</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50/80">Status</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right bg-slate-50/80">Registrations</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right bg-slate-50/80">Stalls</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right bg-slate-50/80">Volunteers</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right w-[80px] bg-slate-50/80">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4">
                      <div className="flex gap-3 items-center">
                        <div className="w-10 h-10 rounded-lg bg-slate-200 shrink-0" />
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-16 bg-slate-200 rounded" />
                            <div className="h-4 w-32 bg-slate-200 rounded" />
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="h-3 w-20 bg-slate-100 rounded" />
                            <div className="h-3 w-24 bg-slate-100 rounded" />
                          </div>
                        </div>
                      </div>
                    </td>
                    {[...Array(4)].map((_, j) => (
                      <td key={j} className="px-5 py-4 text-right">
                        <div className="h-4 w-10 bg-slate-200 rounded ml-auto" />
                      </td>
                    ))}
                    <td className="px-5 py-4 text-right">
                      <div className="h-4 w-4 bg-slate-200 rounded ml-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Calendar className="w-8 h-8 text-slate-300" />
                      <p className="text-sm font-medium text-slate-500">No events found</p>
                      <p className="text-xs text-slate-400">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => (
                  <tr 
                    key={event.id} 
                    onClick={() => router.push(`/events/${event.id}`)}
                    className="hover:bg-slate-50 transition-colors group cursor-pointer border-b border-slate-100"
                  >
                    <td className="px-5 py-4">
                      <div className="flex gap-3 items-center">
                        <div className="w-10 h-10 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                          <Calendar className="w-5 h-5 text-violet-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded border border-violet-100">{event.code}</span>
                            <h4 className="text-sm font-bold text-slate-800">{event.name}</h4>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.community}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDate(event.date)}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {getStatusBadge(event.status)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-sm font-bold text-slate-800">{event.participants}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-sm font-bold text-slate-800">{event.stalls}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-sm font-bold text-slate-800">{event.volunteers}</span>
                    </td>
                    <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          setMenuState(menuState?.id === event.id ? null : {
                            id: event.id,
                            top: rect.bottom + 4,
                            left: rect.right - 144,
                          });
                        }}
                        className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <p className="text-[11px] font-medium text-slate-500">Total: <span className="font-bold text-slate-700">{filteredEvents.length}</span> events</p>
        </div>
      </div>

      <EventFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingEvent(null); }}
        onSuccess={handleSuccess}
        editEvent={editingEvent ? {
          id: editingEvent.id,
          code: editingEvent.code,
          name: editingEvent.name,
          communityId: editingEvent.communityId,
          date: editingEvent.date,
          endDate: editingEvent.endDate,
          status: editingEvent.status,
          description: editingEvent.description,
        } as any : null}
      />
    </DashboardLayout>
  );
}
