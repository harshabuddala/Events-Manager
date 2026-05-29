'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import CommunityFormModal from '@/app/components/CommunityFormModal';
import { 
  MapPin, Search, 
  MoreVertical, ArrowRight, Building2, CheckCircle2, AlertCircle, Plus, Trash2, Edit2
} from 'lucide-react';

interface Community {
  id: string;
  code: string;
  name: string;
  location: string;
  zone?: string;
  status: string;
  contactPerson: string;
  contactEmail?: string;
  contactPhone?: string;
  description?: string;
  eventsHosted: number;
  createdAt: string;
}

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCommunity, setEditingCommunity] = useState<Community | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const fetchCommunities = useCallback(async () => {
    try {
      const res = await fetch('/api/communities');
      if (res.ok) {
        const data = await res.json();
        setCommunities(data.communities);
      }
    } catch (error) {
      console.error('Failed to fetch communities:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommunities();
  }, [fetchCommunities]);

  const handleCreate = async (data: { code: string; name: string; location: string; zone: string; status: string; contactPerson: string; contactEmail: string; contactPhone: string; description: string }) => {
    const res = await fetch('/api/communities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create community');
    }
    fetchCommunities();
  };

  const handleUpdate = async (data: { code: string; name: string; location: string; zone: string; status: string; contactPerson: string; contactEmail: string; contactPhone: string; description: string }) => {
    if (!editingCommunity) return;
    const res = await fetch(`/api/communities/${editingCommunity.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to update community');
    }
    setEditingCommunity(null);
    fetchCommunities();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this community?')) return;
    try {
      const res = await fetch(`/api/communities/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json();
        alert(error.error || 'Failed to delete community');
        return;
      }
      fetchCommunities();
    } catch (error) {
      console.error('Failed to delete community:', error);
    }
  };

  const filteredCommunities = communities.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0">
            <CheckCircle2 className="w-3 h-3" />
            Active
          </span>
        );
      case 'UPCOMING':
        return (
          <span className="flex items-center gap-1.5 bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0">
            <AlertCircle className="w-3 h-3" />
            Upcoming
          </span>
        );
      case 'INACTIVE':
        return (
          <span className="flex items-center gap-1.5 bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0">
            Inactive
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout 
      title="Communities"
      subtitle="Manage residential communities and engagement metrics."
      headerAction={
        <button 
          onClick={() => { setEditingCommunity(null); setIsModalOpen(true); }}
          className="hidden lg:flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Community</span>
        </button>
      }
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 hide-scrollbar">
          <button onClick={() => setStatusFilter('ALL')} className={`px-4 py-2 rounded-md text-xs font-semibold shrink-0 shadow-sm ${statusFilter === 'ALL' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>All</button>
          <button onClick={() => setStatusFilter('ACTIVE')} className={`px-4 py-2 rounded-md text-xs font-semibold shrink-0 shadow-sm ${statusFilter === 'ACTIVE' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>Active</button>
          <button onClick={() => setStatusFilter('UPCOMING')} className={`px-4 py-2 rounded-md text-xs font-semibold shrink-0 shadow-sm ${statusFilter === 'UPCOMING' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>Upcoming</button>
          <button onClick={() => setStatusFilter('INACTIVE')} className={`px-4 py-2 rounded-md text-xs font-semibold shrink-0 shadow-sm ${statusFilter === 'INACTIVE' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>Inactive</button>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search communities..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 shadow-sm placeholder:text-slate-400" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-[35%]">Community Details</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Events</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right w-[80px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-500">Loading...</td></tr>
              ) : filteredCommunities.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-500">No communities found.</td></tr>
              ) : (
                filteredCommunities.map((community) => (
                  <tr key={community.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex gap-3 items-center">
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">{community.code}</span>
                            <h4 className="text-sm font-bold text-slate-800">{community.name}</h4>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {community.location}{community.zone ? `, ${community.zone}` : ''}</span>
                            <span className="text-slate-300">•</span>
                            <span>Contact: {community.contactPerson}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">{getStatusBadge(community.status)}</td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-sm font-bold text-slate-800">{community.eventsHosted}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="relative inline-block">
                        <button onClick={() => setOpenMenuId(openMenuId === community.id ? null : community.id)} className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-md transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {openMenuId === community.id && (
                          <div className="absolute right-0 top-8 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-10 py-1">
                            <button onClick={() => { setEditingCommunity(community); setIsModalOpen(true); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                              <Edit2 className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button onClick={() => { handleDelete(community.id); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50">
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <p className="text-[11px] font-medium text-slate-500">Total: <span className="font-bold text-slate-700">{filteredCommunities.length}</span> communities</p>
        </div>
      </div>

      <CommunityFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingCommunity(null); }}
        onSubmit={editingCommunity ? handleUpdate : handleCreate}
        editCommunity={editingCommunity}
      />
    </DashboardLayout>
  );
}
