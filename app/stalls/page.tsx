'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import StallFormModal from '@/app/components/StallFormModal';
import { 
  Plus, MoreVertical, Star, Trash2, Loader2
} from 'lucide-react';

interface Stall {
  id: string;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  maxVolunteers: number;
  status: string;
  eventCount: number;
  totalVisits: number;
  assignedVolunteers: number;
}

export default function StallsPage() {
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [menuState, setMenuState] = useState<{id: string; top: number; left: number} | null>(null);

  const fetchStalls = useCallback(async () => {
    try {
      const res = await fetch('/api/stalls');
      if (res.ok) {
        const data = await res.json();
        setStalls(data.stalls);
      }
    } catch (error) {
      console.error('Failed to fetch stalls:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStalls();
  }, [fetchStalls]);

  const handleCreate = async (data: { name: string }) => {
    const res = await fetch('/api/stalls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create stall');
    }
    fetchStalls();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this stall?')) return;
    try {
      const res = await fetch(`/api/stalls/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json();
        alert(error.error || 'Failed to delete stall');
        return;
      }
      fetchStalls();
    } catch (error) {
      console.error('Failed to delete stall:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">Active</span>;
      case 'MAINTENANCE': return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">Maintenance</span>;
      case 'INACTIVE': return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">Inactive</span>;
      default: return null;
    }
  };

  return (
    <DashboardLayout 
      title="Activity Stalls"
      subtitle="Manage educational activity stalls and view performance metrics."
      headerAction={
        <button 
          onClick={() => setIsModalOpen(true)}
          className="hidden lg:flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Stall</span>
        </button>
      }
    >
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
            onClick={() => { handleDelete(menuState.id); setMenuState(null); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      )}

      {/* Stalls Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)] p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-slate-200 shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-28 bg-slate-200 rounded" />
                  <div className="h-3 w-20 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pb-4 border-b border-slate-100">
                <div className="space-y-2">
                  <div className="h-3 w-12 bg-slate-100 rounded" />
                  <div className="h-5 w-10 bg-slate-200 rounded" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-16 bg-slate-100 rounded" />
                  <div className="h-5 w-14 bg-slate-200 rounded" />
                </div>
              </div>
              <div className="flex items-center justify-between pt-4">
                <div className="h-5 w-16 bg-slate-200 rounded-full" />
                <div className="h-3 w-12 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {stalls.map((stall) => (
            <div key={stall.id} className="bg-white rounded-xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-5 flex flex-col relative group">
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={(e) => {
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    setMenuState(menuState?.id === stall.id ? null : {
                      id: stall.id,
                      top: rect.bottom + 4,
                      left: rect.right - 144,
                    });
                  }}
                  className="p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-700 rounded-md transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                  <Star className="w-6 h-6 text-slate-400" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[15px] font-bold text-slate-800 leading-tight truncate">{stall.name}</h4>
                  <span className="text-[11px] font-medium text-slate-500">{stall.eventCount} Linked Event{stall.eventCount !== 1 ? 's' : ''}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-4 border-b border-slate-100 mt-auto">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Visits</p>
                  <p className="text-lg font-bold text-slate-800 leading-none">{stall.totalVisits}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Volunteers</p>
                  <p className="text-lg font-bold text-slate-800 leading-none">{stall.assignedVolunteers}/{stall.maxVolunteers}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                {getStatusBadge(stall.status)}
                <span className="text-[10px] font-medium text-slate-400">{stall.code}</span>
              </div>
            </div>
          ))}

          {/* Add New Stall Card */}
          <div onClick={() => setIsModalOpen(true)} className="bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200/80 hover:border-violet-300 hover:bg-slate-50 transition-all duration-300 p-5 flex flex-col items-center justify-center min-h-[220px] cursor-pointer group">
            <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm group-hover:shadow-md group-hover:border-violet-200">
              <Plus className="w-6 h-6 text-slate-400 group-hover:text-violet-600" />
            </div>
            <h4 className="text-sm font-bold text-slate-700 group-hover:text-violet-700">Create New Stall</h4>
            <p className="text-[11px] text-slate-500 text-center mt-1 max-w-[180px]">Add a new educational activity to your library.</p>
          </div>
        </div>
      )}

      <StallFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
      />
    </DashboardLayout>
  );
}
