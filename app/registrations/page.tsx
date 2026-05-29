'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import { useRouter } from 'next/navigation';
import { 
  Users, Search, Filter, Trash2, ArrowRight, Printer, 
  CheckCircle2, Clock, MapPin, Target, FileText, QrCode, Loader2
} from 'lucide-react';
import QRCode from 'qrcode';

interface Registration {
  id: string;
  registrationCode: string;
  status: string;
  registeredAt: string;
  student: {
    id: string;
    rollNumber: string;
    name: string;
    grade: string;
    age: number | null;
    email: string | null;
    parentName: string | null;
    phoneNumber: string | null;
  };
  event: {
    id: string;
    name: string;
    date: string;
    status: string;
    community: { name: string };
  };
  stallVisits: Array<{
    id: string;
    stall: { id: string; name: string };
    performance: { id: string } | null;
  }>;
  stallsVisited: number;
  totalStalls: number;
  community: string;
}

export default function RegistrationsPage() {
  const router = useRouter();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [userRole, setUserRole] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [qrModal, setQrModal] = useState<{ code: string; dataUrl: string } | null>(null);

  const canManage = userRole === 'ADMIN' || userRole === 'MANAGER';

  const fetchRegistrations = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/registrations?${params}`);
      if (res.ok) {
        const data = await res.json();
        setRegistrations(data.registrations || []);
      }
    } catch (err) {
      console.error('Failed to fetch registrations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.user) setUserRole(data.user.role); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this registration? This will remove all stall visits and scores.')) return;
    setDeletingId(id);
    try {
      const res = await fetch('/api/registrations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId: id }),
      });
      if (res.ok) {
        setRegistrations(prev => prev.filter(r => r.id !== id));
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete');
      }
    } catch {
      alert('Failed to delete registration');
    } finally {
      setDeletingId(null);
    }
  };

  const showQr = async (code: string) => {
    try {
      const dataUrl = await QRCode.toDataURL(code, { width: 200, margin: 2 });
      setQrModal({ code, dataUrl });
    } catch {
      alert('Failed to generate QR code');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      COMPLETED: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      IN_PROGRESS: 'bg-blue-50 text-blue-600 border-blue-100',
      REGISTERED: 'bg-slate-100 text-slate-600 border-slate-200',
    };
    const icons: Record<string, React.ReactNode> = {
      COMPLETED: <CheckCircle2 className="w-3 h-3" />,
      IN_PROGRESS: <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />,
      REGISTERED: <Clock className="w-3 h-3" />,
    };
    return (
      <span className={`flex items-center gap-1.5 ${styles[status] || styles.REGISTERED} px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border shrink-0`}>
        {icons[status] || icons.REGISTERED}
        {status.replace('_', ' ')}
      </span>
    );
  };

  const filtered = registrations;

  return (
    <DashboardLayout 
      title="Student Registrations"
      subtitle={`Track ${registrations.length} registrations across all events.`}
    >
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 hide-scrollbar">
          {['ALL', 'COMPLETED', 'IN_PROGRESS', 'REGISTERED'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-md text-xs font-semibold shrink-0 shadow-sm transition-colors ${
                statusFilter === s
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {s === 'ALL' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search roll no, name, event..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 shadow-sm placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Registrations Table */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-10 text-center text-slate-400 text-sm">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-violet-500" />
          Loading registrations...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-10 text-center">
          <FileText className="w-10 h-10 mx-auto mb-3 text-slate-200" />
          <p className="text-sm font-semibold text-slate-400 mb-1">No registrations found</p>
          <p className="text-xs text-slate-400">
            {search || statusFilter !== 'ALL' ? 'Try adjusting your filters' : 'No registrations exist yet'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-[30%]">Student Details</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Event Context</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Progress</th>
                  <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right w-[140px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex gap-3 items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center shrink-0 text-white text-sm font-bold">
                          {reg.student.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <h4 className="text-sm font-bold text-slate-800">{reg.student.name}</h4>
                            <span className="text-[10px] font-bold text-pink-600 bg-pink-50 px-1.5 py-0.5 rounded border border-pink-100 font-mono">{reg.student.rollNumber}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
                            <span className="text-slate-600">{reg.student.grade}</span>
                            {reg.student.age && <><span className="text-slate-300">•</span><span>{reg.student.age} yrs</span></>}
                            <span className="text-slate-300">•</span>
                            <span className="font-mono">{reg.registrationCode}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {reg.event.community.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 pl-[22px]">
                          {reg.event.name} • {new Date(reg.event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {getStatusBadge(reg.status)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col items-end gap-1.5 max-w-[140px] ml-auto">
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                            <Target className="w-3 h-3 text-slate-400" />
                            {reg.stallsVisited} / {reg.totalStalls}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500">
                            {reg.totalStalls > 0 ? Math.round((reg.stallsVisited / reg.totalStalls) * 100) : 0}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${reg.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                            style={{ width: `${reg.totalStalls > 0 ? (reg.stallsVisited / reg.totalStalls) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => showQr(reg.registrationCode)}
                          className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-md transition-colors"
                          title="Show QR Code"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => router.push(`/events/${reg.event.id}`)}
                          className="flex items-center gap-1 bg-white border border-slate-200 hover:border-violet-300 hover:text-violet-700 text-slate-600 px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-colors shadow-sm"
                          title="View Event"
                        >
                          View <ArrowRight className="w-3 h-3" />
                        </button>
                        {canManage && (
                          <button 
                            onClick={() => handleDelete(reg.id)}
                            disabled={deletingId === reg.id}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors disabled:opacity-50"
                            title="Delete Registration"
                          >
                            {deletingId === reg.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Footer */}
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <p className="text-[11px] font-medium text-slate-500">
              Showing <span className="font-bold text-slate-700">{filtered.length}</span> registrations
            </p>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {qrModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setQrModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-xs w-full p-6 text-center" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-slate-800 mb-1">Registration QR Code</h3>
            <p className="text-[11px] text-slate-400 font-mono mb-4">{qrModal.code}</p>
            <img src={qrModal.dataUrl} alt="QR Code" className="mx-auto mb-4 rounded-lg" />
            <button onClick={() => setQrModal(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-600 transition-colors">Close</button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
