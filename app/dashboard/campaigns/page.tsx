'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, MoreVertical, MessageCircle, ArrowRight, Loader2, Calendar as CalendarIcon, Users, Download, Upload } from 'lucide-react';
import DashboardLayout from '@/app/components/DashboardLayout';
import { useRouter } from 'next/navigation';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('Gymnastics Campaign');
  const [newContentSid, setNewContentSid] = useState('HXd909c058fd34a420b04a87e8c44e15ba');

  const router = useRouter();

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/campaigns');
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns);
        setFilteredCampaigns(data.campaigns);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    let result = campaigns;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(q) || c.contentSid.toLowerCase().includes(q));
    }
    if (statusFilter !== 'ALL') {
      result = result.filter(c => c.status === statusFilter);
    }
    setFilteredCampaigns(result);
  }, [searchQuery, statusFilter, campaigns]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCampaignName, contentSid: newContentSid })
    });
    if (res.ok) {
      setIsCreating(false);
      setNewCampaignName('');
      fetchCampaigns();
    } else {
      alert('Failed to create campaign');
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(campaigns, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'campaigns_export.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      const res = await fetch('/api/campaigns/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (res.ok) {
        const result = await res.json();
        alert(`Successfully imported ${result.count} campaigns.`);
        fetchCampaigns();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Import failed: ${err.error || 'Server error'}`);
      }
    } catch (err) {
      alert('Invalid JSON file');
    }
    setIsImporting(false);
    e.target.value = '';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return (
          <span className="flex items-center gap-1.5 bg-amber-50 text-amber-600 border border-amber-100 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0">
            Running
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0">
            Completed
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0">
            Draft
          </span>
        );
    }
  };

  return (
    <DashboardLayout 
      title="WhatsApp Campaigns" 
      subtitle="Manage your marketing campaigns, track analytics, and upload contacts."
      headerAction={
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <label className={`flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer ${isImporting ? 'opacity-50' : ''}`}>
            {isImporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Import</span>
            <input type="file" accept=".json" className="hidden" onChange={handleImport} disabled={isImporting} />
          </label>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white px-3 py-2 rounded-lg text-xs font-semibold shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Campaign</span>
          </button>
        </div>
      }
    >
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2 mb-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 hide-scrollbar">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 w-full sm:w-64 transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 cursor-pointer min-w-[120px]"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="RUNNING">Running</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {isCreating && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden ring-1 ring-slate-900/5">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">New Campaign</h2>
              <button 
                onClick={() => setIsCreating(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <MoreVertical className="w-5 h-5 opacity-0" /> {/* Spacer */}
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Campaign Name</label>
                  <input
                    type="text"
                    required
                    value={newCampaignName}
                    onChange={(e) => setNewCampaignName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                    placeholder="e.g. Summer Brochure 2026"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Twilio Content SID</label>
                  <input
                    type="text"
                    required
                    value={newContentSid}
                    onChange={(e) => setNewContentSid(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                    Your approved template SID from Twilio
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold bg-violet-600 text-white rounded-xl hover:bg-violet-700 shadow-sm transition-all"
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Table Area */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-[30%]">Campaign Details</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-[25%]">Content SID</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Contacts</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right w-[80px] sticky right-0 bg-slate-50/80 z-10">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Loading campaigns...
                  </td>
                </tr>
              ) : filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                    <p className="mb-4">No campaigns found.</p>
                    <button
                      onClick={async () => {
                        const res = await fetch('/api/campaigns', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ name: 'Gymnastics Campaign', contentSid: 'HXd909c058fd34a420b04a87e8c44e15ba' })
                        });
                        if (res.ok) {
                          fetchCampaigns();
                        } else {
                          const errorData = await res.json().catch(() => ({}));
                          alert(`Failed to initialize default campaign: ${errorData.error || 'Check server logs'}`);
                        }
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100 hover:bg-violet-200 text-violet-700 rounded-lg text-sm font-semibold transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Initialize Default Campaign
                    </button>
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex gap-3 items-center">
                        <div className="w-10 h-10 rounded-full bg-violet-100 border border-violet-200/60 flex items-center justify-center shrink-0 text-violet-700 shadow-sm">
                          <MessageCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <Link href={`/dashboard/campaigns/${campaign.id}`} className="text-sm font-bold text-slate-800 hover:text-violet-600 transition-colors">
                            {campaign.name}
                          </Link>
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 mt-1">
                            <CalendarIcon className="w-3 h-3 text-slate-400" />
                            {new Date(campaign.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-1 rounded">
                        {campaign.contentSid}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col items-start gap-2">
                        {getStatusBadge(campaign.status)}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 text-[13px] font-medium text-slate-700">
                        <Users className="w-4 h-4 text-slate-400 mr-1" />
                        {campaign._count?.contacts || 0}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right sticky right-0 bg-white group-hover:bg-slate-50/80 transition-colors z-10 border-l border-transparent">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/campaigns/${campaign.id}`}
                          className="p-1.5 text-slate-400 hover:bg-violet-50 hover:text-violet-600 rounded-md transition-colors"
                          title="View Details"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
