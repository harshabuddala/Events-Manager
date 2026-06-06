'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import { useRouter } from 'next/navigation';
import { 
  Users, Search, Filter, Trash2, ArrowRight, Printer, 
  CheckCircle2, Clock, MapPin, Target, FileText, QrCode, Loader2, X, Eye, IdCard,
  Star, Pencil, Award, ShoppingBag, Send, AlertCircle
} from 'lucide-react';
import { ReportCardPdf, fetchReportCardImageBase64 } from '@/app/components/ReportCardPdf';
import { IdCardPdf, fetchIdCardImageBase64 } from '@/app/components/IdCardPdf';
// We will load @react-pdf/renderer dynamically inside our dynamic PDF generation handlers to prevent SSR issues.

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
    stalls?: Array<{ id: string; code: string; name: string; metrics?: string[] }>;
  };
  stallVisits: Array<{
    id: string;
    stall: { id: string; name: string; metrics?: string[] };
    performance: {
      id?: string;
      score: number;
      grade: string;
      remarks?: string | null;
      metricScores?: Record<string, number> | null;
    } | null;
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
  const [selectedStudent, setSelectedStudent] = useState<Registration | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  // Student report modal — inline evaluate/edit state
  const [reportEvalStall, setReportEvalStall] = useState<string | null>(null); // stallId being evaluated
  const [reportEvalMode, setReportEvalMode] = useState<'new' | 'edit'>('new');
  const [reportEvalScore, setReportEvalScore] = useState<number>(8);
  const [reportEvalGrade, setReportEvalGrade] = useState<string>('A');
  const [reportEvalRemarks, setReportEvalRemarks] = useState<string>('');
  const [reportEvalMetricScores, setReportEvalMetricScores] = useState<Record<string, number>>({});
  const [reportEvalLoading, setReportEvalLoading] = useState<boolean>(false);
  const [reportEvalError, setReportEvalError] = useState<string>('');
  const [reportEvalSuccess, setReportEvalSuccess] = useState<string>('');

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

  const [bgImageBase64, setBgImageBase64] = useState<string | null>(null);
  const [idBgImageBase64, setIdBgImageBase64] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.user) setUserRole(data.user.role); })
      .catch(() => {});
    
    fetchReportCardImageBase64().then((base64) => {
      setBgImageBase64(base64);
    }).catch(console.error);

    fetchIdCardImageBase64().then((base64) => {
      setIdBgImageBase64(base64);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const [generatingDoc, setGeneratingDoc] = useState<{ id: string; type: 'report-view' | 'report-print' | 'id-view' | 'id-print' } | null>(null);

  const handleViewReportCard = async (reg: Registration) => {
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write('Loading Report Card PDF... Please wait.');
    }
    try {
      setGeneratingDoc({ id: reg.id, type: 'report-view' });
      const { pdf } = await import('@react-pdf/renderer');
      const doc = <ReportCardPdf registration={reg} backgroundImage={bgImageBase64} />;
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      if (newWindow) {
        newWindow.location.href = url;
      } else {
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error("Failed to generate report card PDF:", error);
      if (newWindow) newWindow.close();
      alert("Failed to generate report card PDF. Please try again.");
    } finally {
      setGeneratingDoc(null);
    }
  };

  const handleDownloadReportCard = async (reg: Registration) => {
    try {
      setGeneratingDoc({ id: reg.id, type: 'report-print' });
      const { pdf } = await import('@react-pdf/renderer');
      const doc = <ReportCardPdf registration={reg} backgroundImage={bgImageBase64} />;
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'fixed';
      printFrame.style.top = '-10000px';
      printFrame.style.left = '-10000px';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.src = url;
      document.body.appendChild(printFrame);
      printFrame.onload = () => {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(printFrame);
          URL.revokeObjectURL(url);
        }, 1000);
      };
    } catch (error) {
      console.error("Failed to print report card PDF:", error);
      alert("Failed to print report card PDF. Please try again.");
    } finally {
      setGeneratingDoc(null);
    }
  };

  const handleViewIdCard = async (reg: Registration) => {
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write('Loading ID Card PDF... Please wait.');
    }
    try {
      setGeneratingDoc({ id: reg.id, type: 'id-view' });
      const { generateLogoQrCode } = await import('@/lib/qr');
      const qrCodeDataUrl = await generateLogoQrCode(reg.registrationCode, 250);

      const { pdf } = await import('@react-pdf/renderer');
      const doc = (
        <IdCardPdf 
          registration={reg} 
          backgroundImage={idBgImageBase64} 
          qrCodeDataUrl={qrCodeDataUrl} 
        />
      );
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      if (newWindow) {
        newWindow.location.href = url;
      } else {
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error("Failed to generate ID card PDF:", error);
      if (newWindow) newWindow.close();
      alert("Failed to generate ID card PDF. Please try again.");
    } finally {
      setGeneratingDoc(null);
    }
  };

  const handleDownloadIdCard = async (reg: Registration) => {
    try {
      setGeneratingDoc({ id: reg.id, type: 'id-print' });
      const { generateLogoQrCode } = await import('@/lib/qr');
      const qrCodeDataUrl = await generateLogoQrCode(reg.registrationCode, 250);

      const { pdf } = await import('@react-pdf/renderer');
      const doc = (
        <IdCardPdf 
          registration={reg} 
          backgroundImage={idBgImageBase64} 
          qrCodeDataUrl={qrCodeDataUrl} 
        />
      );
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'fixed';
      printFrame.style.top = '-10000px';
      printFrame.style.left = '-10000px';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.src = url;
      document.body.appendChild(printFrame);
      printFrame.onload = () => {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(printFrame);
          URL.revokeObjectURL(url);
        }, 1000);
      };
    } catch (error) {
      console.error("Failed to print ID card PDF:", error);
      alert("Failed to print ID card PDF. Please try again.");
    } finally {
      setGeneratingDoc(null);
    }
  };

  const handleBatchDownloadReportCards = async () => {
    if (registrations.length === 0) {
      alert("No registrations available to print.");
      return;
    }

    try {
      setGeneratingDoc({ id: 'batch', type: 'report-print' });
      // Sort alphabetically by student name
      const sortedRegistrations = [...registrations].sort((a, b) => 
        a.student.name.localeCompare(b.student.name)
      );

      const { pdf, Document } = await import('@react-pdf/renderer');
      const { ReportCardPage } = await import('@/app/components/ReportCardPdf');
      
      const doc = (
        <Document>
          {sortedRegistrations.map(reg => (
            <ReportCardPage key={reg.id} registration={reg} backgroundImage={bgImageBase64} />
          ))}
        </Document>
      );
      
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      
      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'fixed';
      printFrame.style.top = '-10000px';
      printFrame.style.left = '-10000px';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.src = url;
      document.body.appendChild(printFrame);
      printFrame.onload = () => {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(printFrame);
          URL.revokeObjectURL(url);
        }, 2000);
      };
    } catch (error) {
      console.error("Failed to batch print report cards:", error);
      alert("Failed to batch print report cards. Please try again.");
    } finally {
      setGeneratingDoc(null);
    }
  };

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
      const { generateLogoQrCode } = await import('@/lib/qr');
      const dataUrl = await generateLogoQrCode(code, 200);
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
          <button
            onClick={handleBatchDownloadReportCards}
            disabled={generatingDoc !== null || registrations.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 border border-indigo-100 shrink-0"
          >
            {generatingDoc?.id === 'batch' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Print All Reports</span>
            <span className="sm:hidden">Print All</span>
          </button>
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
                  <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right w-[140px] sticky right-0 bg-white z-10">Actions</th>
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
                            <button 
                              onClick={() => setSelectedStudent(reg)}
                              className="text-sm font-bold text-slate-800 hover:text-violet-600 hover:underline transition-colors cursor-pointer"
                            >
                              {reg.student.name}
                            </button>
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
                    <td className="px-5 py-4 text-right sticky right-0 bg-white z-10">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => showQr(reg.registrationCode)}
                          className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-md transition-colors"
                          title="Show QR Code"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={generatingDoc !== null}
                          onClick={() => handleViewReportCard(reg)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
                          title="View Report Card"
                        >
                          {generatingDoc?.id === reg.id && generatingDoc?.type === 'report-view' ? (
                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          disabled={generatingDoc !== null}
                          onClick={() => handleDownloadReportCard(reg)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors disabled:opacity-50"
                          title="Print Report Card"
                        >
                          {generatingDoc?.id === reg.id && generatingDoc?.type === 'report-print' ? (
                            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                          ) : (
                            <Printer className="w-4 h-4" />
                          )}
                        </button>
                        <span className="w-px h-4 bg-slate-200 mx-1" />
                        <button
                          type="button"
                          disabled={generatingDoc !== null}
                          onClick={() => handleViewIdCard(reg)}
                          className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-md transition-colors disabled:opacity-50"
                          title="View ID Card"
                        >
                          {generatingDoc?.id === reg.id && generatingDoc?.type === 'id-view' ? (
                            <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
                          ) : (
                            <IdCard className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          disabled={generatingDoc !== null}
                          onClick={() => handleDownloadIdCard(reg)}
                          className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors disabled:opacity-50"
                          title="Print ID Card"
                        >
                          {generatingDoc?.id === reg.id && generatingDoc?.type === 'id-print' ? (
                            <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
                          ) : (
                            <Printer className="w-4 h-4" />
                          )}
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

      {/* Student Detail Modal */}
      {selectedStudent && (() => {
        const reg = selectedStudent;
        const visits = reg.stallVisits || [];
        const visitedCount = visits.filter(v => v.performance).length;
        const totalStalls = visits.length;
        const progressPct = totalStalls > 0 ? Math.round((visitedCount / totalStalls) * 100) : 0;

        const handleEvalSubmit = async () => {
          if (!reportEvalStall) return;
          setReportEvalLoading(true);
          setReportEvalError('');
          setReportEvalSuccess('');
          try {
            const currentStall = reg.event?.stalls?.find((s: any) => s.id === reportEvalStall) || visits.find((v: any) => v.stall?.id === reportEvalStall)?.stall;
            const hasMetrics = currentStall?.metrics && Array.isArray(currentStall.metrics) && currentStall.metrics.length > 0;
            const bodyPayload = {
              stallId: reportEvalStall,
              remarks: reportEvalRemarks,
              ...(hasMetrics 
                ? { metricScores: reportEvalMetricScores } 
                : { score: Number(reportEvalScore), grade: reportEvalGrade })
            };

            const res = await fetch(`/api/scan/${reg.registrationCode}/rate`, {
              method: reportEvalMode === 'edit' ? 'PATCH' : 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(bodyPayload)
            });
            const data = await res.json();
            if (!res.ok) {
              setReportEvalError(data.error || 'Failed to submit.');
            } else {
              setReportEvalSuccess(reportEvalMode === 'edit' ? 'Evaluation updated!' : 'Evaluation submitted!');
              
              // Refresh registrations list
              await fetchRegistrations();

              // Update selectedStudent state so modal updates instantly
              const updatedRegRes = await fetch(`/api/registrations?search=${reg.registrationCode}`);
              if (updatedRegRes.ok) {
                const updatedData = await updatedRegRes.json();
                const matched = updatedData.registrations?.find((r: any) => r.registrationCode === reg.registrationCode);
                if (matched) setSelectedStudent(matched);
              }
              
              setTimeout(() => {
                setReportEvalStall(null);
                setReportEvalSuccess('');
              }, 1200);
            }
          } catch {
            setReportEvalError('Network error. Please try again.');
          } finally {
            setReportEvalLoading(false);
          }
        };

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => { setSelectedStudent(null); setReportEvalStall(null); setReportEvalError(''); setReportEvalSuccess(''); }}>
            <div className="bg-white/95 dark:bg-slate-900/95 shadow-2xl rounded-3xl w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col relative animate-fade-in border border-slate-200/80" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 px-6 py-5 shrink-0 border-b border-white/10 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-500 to-indigo-500 border border-white/20 flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-md">
                      {reg.student.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] font-extrabold tracking-widest text-indigo-300 uppercase bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-800/40">Student Profile</span>
                      <h2 className="text-base font-bold text-white truncate mt-1">{reg.student.name}</h2>
                      <p className="text-[10px] text-indigo-200 font-semibold font-mono mt-0.5">
                        {reg.student.rollNumber} • Grade {reg.student.grade}
                        {reg.student.age !== undefined && reg.student.age !== null && ` (${reg.student.age} yrs)`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setSelectedStudent(null); setReportEvalStall(null); setReportEvalError(''); setReportEvalSuccess(''); }}
                    className="p-2 rounded-xl text-indigo-200 hover:text-white hover:bg-white/10 transition-all active:scale-95 shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 px-6 py-4.5 bg-slate-50/50 border-b border-slate-100 shrink-0">
                {[
                  { 
                    label: 'Stalls Visited', 
                    value: `${visitedCount} / ${totalStalls}`, 
                    color: 'text-indigo-600 bg-white border border-indigo-100 shadow-[0_2px_8px_rgba(99,102,241,0.04)]',
                    icon: <ShoppingBag className="w-4 h-4 text-indigo-500" />
                  },
                  { 
                    label: 'Progress', 
                    value: `${progressPct}%`, 
                    color: 'text-amber-600 bg-white border border-amber-100 shadow-[0_2px_8px_rgba(245,158,11,0.04)]',
                    icon: <Award className="w-4 h-4 text-amber-500" />
                  },
                  { 
                    label: 'Status', 
                    value: reg.status === 'COMPLETED' ? 'Completed' : reg.status === 'IN_PROGRESS' ? 'In Progress' : 'Registered', 
                    color: reg.status === 'COMPLETED' 
                      ? 'text-emerald-700 bg-white border border-emerald-100 shadow-[0_2px_8px_rgba(16,185,129,0.04)]' 
                      : reg.status === 'IN_PROGRESS' 
                        ? 'text-blue-700 bg-white border border-blue-100 shadow-[0_2px_8px_rgba(59,130,246,0.04)]' 
                        : 'text-slate-500 bg-white border border-slate-200 shadow-[0_2px_8px_rgba(100,116,139,0.02)]',
                    icon: reg.status === 'COMPLETED' 
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 
                      : reg.status === 'IN_PROGRESS' 
                        ? <Clock className="w-4 h-4 text-blue-500" /> 
                        : <Users className="w-4 h-4 text-slate-400" />
                  },
                ].map(s => (
                  <div 
                    key={s.label} 
                    className={`flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${s.color.split(' ').slice(1).join(' ')}`}
                  >
                    <div className="p-2 bg-slate-50 rounded-xl shrink-0 border border-slate-100 shadow-inner">
                      {s.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">{s.label}</p>
                      <p className={`text-sm font-extrabold ${s.color.split(' ')[0]} mt-1`}>{s.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Event info */}
              <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-700">{reg.event.community.name}</span>
                  <span className="text-slate-300">•</span>
                  <span>{reg.event.name}</span>
                  <span className="text-slate-300">•</span>
                  <span>{new Date(reg.event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>

              {/* Stall visits list — scrollable */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Activity Stalls & Evaluations</p>
                  <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                    {visitedCount} of {totalStalls} Evaluated
                  </span>
                </div>
                
                {visits.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                    <p className="text-xs font-medium">No stalls linked to this registration</p>
                  </div>
                ) : (
                  visits.map((sv: any) => {
                    const isEvaluated = !!sv.performance;
                    const perf = sv.performance;
                    const isEvaluating = reportEvalStall === sv.stall.id;

                    return (
                      <div key={sv.id} className={`rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-md hover:border-indigo-100 ${
                        isEvaluated
                          ? 'bg-white border-emerald-100 shadow-sm'
                          : 'bg-white border-slate-200/80 shadow-sm'
                      }`}>
                        {/* Stall card header */}
                        <div className={`px-5 py-3.5 flex items-center justify-between gap-3 ${
                          isEvaluated ? 'bg-emerald-50/15' : 'bg-slate-50/30'
                        }`}>
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                              isEvaluated
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-600 shadow-sm'
                                : 'bg-amber-50/50 border-amber-100/50 text-amber-500/80 shadow-sm animate-pulse'
                            }`}>
                              {isEvaluated ? <CheckCircle2 className="w-4.5 h-4.5" /> : <Clock className="w-4.5 h-4.5" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate">{sv.stall.name}</p>
                              <p className="text-[10px] text-slate-400 font-semibold font-mono uppercase tracking-wide leading-none mt-1">{sv.stall.code || 'STALL'}</p>
                            </div>
                          </div>

                          {isEvaluated && perf ? (
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-lg font-mono">
                                {perf.score}/10
                              </span>
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-lg">
                                Grade {perf.grade}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                              Pending
                            </span>
                          )}
                        </div>

                        {/* Evaluated Metrics details (if rated and not currently in edit mode) */}
                        {isEvaluated && perf && !isEvaluating && perf.metricScores && Object.keys(perf.metricScores).length > 0 && (
                          <div className="px-5 py-3.5 bg-slate-50/40 border-t border-slate-100 grid grid-cols-2 gap-x-5 gap-y-2">
                            {Object.entries(perf.metricScores).map(([m, val]: [string, any]) => (
                              <div key={m} className="flex items-center justify-between text-xs py-0.5 border-b border-dashed border-slate-100">
                                <span className="truncate pr-2 font-semibold text-slate-500">{m}</span>
                                <div className="flex items-center gap-0.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-3.5 h-3.5 ${
                                        star <= Number(val)
                                          ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_2px_rgba(245,158,11,0.15)]'
                                          : 'text-slate-200'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Remarks (if evaluated and not in edit mode) */}
                        {isEvaluated && perf && !isEvaluating && perf.remarks && (
                          <div className="px-5 py-2.5 border-t border-slate-100 bg-white">
                            <p className="text-[11px] text-slate-500 italic">Remarks: "{perf.remarks}"</p>
                          </div>
                        )}

                        {/* Action buttons */}
                        {!isEvaluating && (
                          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-end bg-slate-50/30">
                            {isEvaluated ? (
                              // Edit button — admin/manager only
                              canManage && (
                                <button
                                  onClick={() => {
                                    setReportEvalStall(sv.stall.id);
                                    setReportEvalMode('edit');
                                    setReportEvalScore(perf.score);
                                    setReportEvalGrade(perf.grade);
                                    setReportEvalRemarks(perf.remarks || '');
                                    
                                    // Load existing metric scores
                                    const initialScores: Record<string, number> = {};
                                    const existingScores = perf.metricScores || {};
                                    const metricsList = sv.stall.metrics || reg.event?.stalls?.find((s: any) => s.id === sv.stall.id)?.metrics || [];
                                    if (Array.isArray(metricsList)) {
                                      metricsList.forEach((m: string) => {
                                        initialScores[m] = existingScores[m] !== undefined ? Number(existingScores[m]) : 5;
                                      });
                                    }
                                    setReportEvalMetricScores(initialScores);
                                    setReportEvalError('');
                                    setReportEvalSuccess('');
                                  }}
                                  className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 px-3.5 py-1.5 rounded-xl border border-indigo-100 transition-all active:scale-95 duration-200 shadow-sm cursor-pointer"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  Edit Scores
                                </button>
                              )
                            ) : (
                              // Evaluate button
                              <button
                                onClick={() => {
                                  setReportEvalStall(sv.stall.id);
                                  setReportEvalMode('new');
                                  setReportEvalScore(8);
                                  setReportEvalGrade('A');
                                  setReportEvalRemarks('');
                                  
                                  // Load default metric scores
                                  const defaultScores: Record<string, number> = {};
                                  const metricsList = sv.stall.metrics || reg.event?.stalls?.find((s: any) => s.id === sv.stall.id)?.metrics || [];
                                  if (Array.isArray(metricsList)) {
                                    metricsList.forEach((m: string) => {
                                      defaultScores[m] = 5;
                                    });
                                  }
                                  setReportEvalMetricScores(defaultScores);
                                  setReportEvalError('');
                                  setReportEvalSuccess('');
                                }}
                                className="flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 px-4 py-2 rounded-xl transition-all shadow-md active:scale-95 duration-200 hover:shadow-indigo-500/20 cursor-pointer"
                              >
                                <Star className="w-3.5 h-3.5" />
                                Evaluate Stalls
                              </button>
                            )}
                          </div>
                        )}

                        {/* Inline evaluation form */}
                        {isEvaluating && (
                          <div className="px-5 py-4 border-t border-indigo-100 bg-indigo-50/20 space-y-4">
                            {reportEvalError && (
                              <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl px-3.5 py-2.5 text-xs font-bold shadow-sm">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {reportEvalError}
                              </div>
                            )}
                            {reportEvalSuccess && (
                              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl px-3.5 py-2.5 text-xs font-bold shadow-sm">
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                                {reportEvalSuccess}
                              </div>
                            )}

                            {(() => {
                              const metricsList = sv.stall.metrics || reg.event?.stalls?.find((s: any) => s.id === sv.stall.id)?.metrics || [];
                              const hasMetrics = Array.isArray(metricsList) && metricsList.length > 0;

                              if (hasMetrics) {
                                // Calculate live score/grade to show admin in real time
                                const ratings = Object.values(reportEvalMetricScores);
                                const avgStars = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 5;
                                const liveScore = Math.round(avgStars * 2 * 10) / 10;
                                let liveGrade = 'E';
                                if (liveScore >= 9) liveGrade = 'A+';
                                else if (liveScore >= 8) liveGrade = 'A';
                                else if (liveScore >= 7) liveGrade = 'B';
                                else if (liveScore >= 6) liveGrade = 'C';
                                else if (liveScore >= 5) liveGrade = 'D';

                                return (
                                  <div className="space-y-3">
                                    <div className="bg-white border border-indigo-100 rounded-2xl p-4 shadow-sm space-y-4">
                                      <div className="flex justify-between items-center pb-2.5 border-b border-indigo-50">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Metrics Evaluation</span>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-100 font-mono shadow-sm">
                                            Derived: {liveScore}/10
                                          </span>
                                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-100 shadow-sm">
                                            Grade {liveGrade}
                                          </span>
                                        </div>
                                      </div>
                                      
                                      <div className="divide-y divide-slate-100">
                                        {metricsList.map((metric: string) => {
                                          const currentRating = reportEvalMetricScores[metric] || 5;
                                          return (
                                            <div key={metric} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                                              <div className="min-w-0 pr-4">
                                                <span className="text-xs font-extrabold text-slate-700 block truncate" title={metric}>{metric}</span>
                                                <span className="text-[10px] text-slate-400 font-medium">Rate student's performance</span>
                                              </div>
                                              <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                  <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => {
                                                      setReportEvalMetricScores(prev => ({
                                                        ...prev,
                                                        [metric]: star
                                                      }));
                                                      setReportEvalError('');
                                                      setReportEvalSuccess('');
                                                    }}
                                                    className="focus:outline-none transition-all hover:scale-110 active:scale-95 p-0.5"
                                                  >
                                                    <Star
                                                      className={`w-5 h-5 transition-colors duration-150 ${
                                                        star <= currentRating
                                                          ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_3px_rgba(245,158,11,0.25)]'
                                                          : 'text-slate-300 hover:text-slate-400'
                                                      }`}
                                                    />
                                                  </button>
                                                ))}
                                                <span className="text-xs font-extrabold text-slate-600 min-w-[20px] text-center font-mono ml-0.5 bg-white border border-slate-200 rounded-lg px-1.5 py-0.5 shadow-sm">{currentRating}</span>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                );
                              }

                              // Fallback to old rating inputs if no metrics exist
                              return (
                                <div className="bg-white border border-violet-100 rounded-2xl p-4 shadow-sm space-y-4">
                                  {/* Score slider */}
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <label className="text-xs font-bold text-slate-700 block">Evaluation Score</label>
                                        <span className="text-[10px] text-slate-400 font-medium">Select a score from 1 to 10</span>
                                      </div>
                                      <span className="text-sm font-extrabold text-violet-700 bg-violet-50 px-3 py-1 rounded-xl border border-violet-100 font-mono shadow-sm">
                                        {reportEvalScore} / 10
                                      </span>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                      <input
                                        type="range" min="1" max="10" step="0.5"
                                        value={reportEvalScore}
                                        onChange={e => { setReportEvalScore(Number(e.target.value)); setReportEvalError(''); setReportEvalSuccess(''); }}
                                        className="w-full accent-violet-600 h-2 bg-slate-200 rounded-lg cursor-pointer appearance-none"
                                      />
                                      <div className="flex justify-between text-[9px] text-slate-400 font-extrabold mt-2 px-0.5">
                                        <span>1 (Poor)</span><span>5 (Avg)</span><span>10 (Best)</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Grade dropdown */}
                                  <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 block">Performance Grade</label>
                                    <select
                                      value={reportEvalGrade}
                                      onChange={e => { setReportEvalGrade(e.target.value); setReportEvalError(''); setReportEvalSuccess(''); }}
                                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-800 font-bold transition-all shadow-sm"
                                    >
                                      <option value="A+">A+ (Outstanding)</option>
                                      <option value="A">A (Excellent)</option>
                                      <option value="B">B (Good)</option>
                                      <option value="C">C (Satisfactory)</option>
                                      <option value="D">D (Needs Improvement)</option>
                                      <option value="E">E (Unsatisfactory)</option>
                                    </select>
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Remarks */}
                            <div className="space-y-1.5">
                              <label className="text-xs font-bold text-slate-700 block">Remarks <span className="font-normal text-slate-400">(optional)</span></label>
                              <textarea
                                rows={2}
                                value={reportEvalRemarks}
                                onChange={e => { setReportEvalRemarks(e.target.value); setReportEvalError(''); setReportEvalSuccess(''); }}
                                placeholder="e.g. Great creativity, quick learner..."
                                className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 placeholder:text-slate-400 font-medium transition-all shadow-sm resize-none"
                              />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                              <button
                                onClick={() => { setReportEvalStall(null); setReportEvalError(''); setReportEvalSuccess(''); }}
                                className="flex-1 px-4 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleEvalSubmit}
                                disabled={reportEvalLoading}
                                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition-all active:scale-95 rounded-xl shadow-md cursor-pointer"
                              >
                                {reportEvalLoading ? (
                                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                                ) : (
                                  <><Send className="w-3.5 h-3.5" /> {reportEvalMode === 'edit' ? 'Update Scores' : 'Submit Evaluation'}</>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-between shrink-0 rounded-b-3xl">
                <p className="text-[11px] text-slate-400 font-bold font-mono tracking-wider">{reg.registrationCode}</p>
                <button
                  onClick={() => { setSelectedStudent(null); setReportEvalStall(null); setReportEvalError(''); setReportEvalSuccess(''); router.push(`/events/${reg.event.id}`); }}
                  className="flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl transition-all shadow-md active:scale-95 duration-200 hover:shadow-indigo-500/20"
                >
                  Go to Event <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </DashboardLayout>
  );
}
