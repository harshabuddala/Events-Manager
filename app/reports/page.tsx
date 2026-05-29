'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import { 
  Search, Filter, 
  ArrowRight, Printer, Download,
  CheckCircle2, FileText, Medal, Loader2, X, Star, Clock, GraduationCap, MapPin, Award, Calendar
} from 'lucide-react';

interface Report {
  id: string;
  code: string;
  roll: string;
  name: string;
  grade: string;
  community: string;
  score: string;
  overallGrade: string;
  topSkill: string;
  status: string;
  date: string;
  rawDate: string | null;
}

export default function ReportCardsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      const res = await fetch(`/api/reports?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'generated':
        return (
          <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0">
            <CheckCircle2 className="w-3 h-3" />
            Generated
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1.5 bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0">
            Pending
          </span>
        );
      default:
        return null;
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade.includes('A')) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (grade.includes('B')) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (grade.includes('C')) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-slate-600 bg-slate-50 border-slate-200';
  };

  const handlePrint = (report: Report) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Report Card - ${report.name}</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 24px; }
        .header h1 { font-size: 20px; margin: 0; }
        .header p { color: #666; font-size: 14px; margin: 4px 0 0; }
        .section { margin-bottom: 20px; }
        .section h2 { font-size: 14px; text-transform: uppercase; color: #666; margin: 0 0 8px; }
        .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eee; font-size: 14px; }
        .grade-badge { display: inline-block; font-size: 24px; font-weight: bold; padding: 8px 24px; border: 2px solid; border-radius: 50%; text-align: center; }
        .center { text-align: center; margin: 20px 0; }
        .footer { text-align: center; font-size: 12px; color: #999; margin-top: 40px; border-top: 1px solid #eee; padding-top: 16px; }
      </style></head><body>
        <div class="header">
          <h1>Edunura — Student Report Card</h1>
          <p>${report.community}</p>
        </div>
        <div class="section">
          <h2>Student Details</h2>
          <div class="row"><span>Name</span><strong>${report.name}</strong></div>
          <div class="row"><span>Roll Number</span><strong>${report.roll}</strong></div>
          <div class="row"><span>Grade</span><strong>${report.grade}</strong></div>
          <div class="row"><span>Report Code</span><strong>${report.code}</strong></div>
          <div class="row"><span>Date</span><strong>${report.date}</strong></div>
        </div>
        ${report.status === 'generated' ? `
        <div class="center">
          <div class="grade-badge" style="border-color: ${report.overallGrade.includes('A') ? '#059669' : report.overallGrade.includes('B') ? '#2563eb' : report.overallGrade.includes('C') ? '#ea580c' : '#64748b'}; color: ${report.overallGrade.includes('A') ? '#059669' : report.overallGrade.includes('B') ? '#2563eb' : report.overallGrade.includes('C') ? '#ea580c' : '#64748b'}">
            ${report.overallGrade}
          </div>
          <p style="font-size: 18px; font-weight: bold; margin-top: 12px;">Score: ${report.score}</p>
        </div>
        <div class="section">
          <h2>Performance Highlights</h2>
          <div class="row"><span>Top Skill</span><strong>${report.topSkill}</strong></div>
        </div>
        ` : `
        <div class="center">
          <p style="color: #999; font-size: 16px;">Awaiting evaluations...</p>
        </div>
        `}
        <div class="footer">
          Generated on ${report.date} &bull; Edunura Community Engagement Platform
        </div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  return (
    <DashboardLayout 
      title="Report Cards"
      subtitle="View, generate, and print student performance report cards."
      headerAction={
        <div className="flex gap-2">
          <button className="hidden lg:flex items-center gap-1.5 bg-white border border-slate-200/80 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 shadow-sm hover:border-slate-300 hover:shadow-md transition-all">
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export Batch</span>
          </button>
        </div>
      }
    >
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 hide-scrollbar">
          <button 
            onClick={() => setStatusFilter('ALL')}
            className={`px-4 py-2 rounded-md text-xs font-semibold shrink-0 shadow-sm transition-colors ${statusFilter === 'ALL' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            All Reports
          </button>
          <button 
            onClick={() => setStatusFilter('GENERATED')}
            className={`px-4 py-2 rounded-md text-xs font-semibold shrink-0 shadow-sm transition-colors ${statusFilter === 'GENERATED' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            Generated
          </button>
          <button 
            onClick={() => setStatusFilter('PENDING')}
            className={`px-4 py-2 rounded-md text-xs font-semibold shrink-0 shadow-sm transition-colors ${statusFilter === 'PENDING' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            Pending
          </button>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by roll no or name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 shadow-sm placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-[30%]">Report Details</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status & Date</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Final Grade</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Highlights</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right w-[140px] bg-white z-10">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4">
                      <div className="flex gap-3 items-center">
                        <div className="w-10 h-10 rounded-lg bg-slate-200 shrink-0" />
                        <div className="space-y-2 flex-1">
                          <div className="h-4 w-40 bg-slate-200 rounded" />
                          <div className="h-3 w-56 bg-slate-100 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4"><div className="h-5 w-24 bg-slate-200 rounded-full" /></td>
                    <td className="px-5 py-4 text-center"><div className="h-8 w-8 bg-slate-200 rounded-full mx-auto" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-28 bg-slate-200 rounded" /></td>
                    <td className="px-5 py-4 text-right"><div className="h-4 w-20 bg-slate-200 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="w-8 h-8 text-slate-300" />
                      <p className="text-sm font-medium text-slate-500">No reports found</p>
                      <p className="text-xs text-slate-400">Complete student evaluations to generate report cards</p>
                    </div>
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50 transition-colors group cursor-pointer border-b border-slate-100" onClick={() => setSelectedReport(report)}>
                    <td className="px-5 py-4">
                      <div className="flex gap-3 items-center">
                        <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <h4 className="text-sm font-bold text-slate-800">{report.name}</h4>
                            <span className="text-[10px] font-bold text-pink-600 bg-pink-50 px-1.5 py-0.5 rounded border border-pink-100">{report.roll}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
                            <span className="text-slate-600">{report.grade}</span>
                            <span className="text-slate-300">•</span>
                            <span>{report.code}</span>
                            <span className="text-slate-300">•</span>
                            <span>{report.community}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col items-start gap-1.5">
                        {getStatusBadge(report.status)}
                        <span className="text-[10px] font-medium text-slate-500 pl-1">{report.date}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {report.status === 'generated' ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm font-bold shadow-sm ${getGradeColor(report.overallGrade)}`}>
                            {report.overallGrade}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">{report.score}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <span className="text-slate-300 font-bold">-</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {report.status === 'generated' && report.topSkill !== '—' ? (
                        <div className="flex items-center gap-2">
                          <Medal className="w-4 h-4 text-amber-500" />
                          <span className="text-xs font-semibold text-slate-700">{report.topSkill}</span>
                        </div>
                      ) : (
                        <span className="text-xs italic text-slate-400">Awaiting evaluations...</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right bg-white" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                         {report.status === 'generated' ? (
                           <>
                             <button
                               onClick={() => handlePrint(report)}
                               className="flex items-center gap-1 bg-white border border-slate-200 hover:border-violet-300 hover:text-violet-700 text-slate-600 px-2 py-1.5 rounded-md text-[11px] font-semibold transition-colors shadow-sm"
                               title="Print Report"
                             >
                               <Printer className="w-3.5 h-3.5" />
                             </button>
                             <button
                               onClick={() => setSelectedReport(report)}
                               className="flex items-center gap-1 bg-violet-50 border border-violet-200 hover:bg-violet-100 hover:text-violet-700 text-violet-600 px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-colors shadow-sm"
                             >
                               View <ArrowRight className="w-3 h-3" />
                             </button>
                           </>
                         ) : (
                           <button
                             onClick={() => setSelectedReport(report)}
                             className="flex items-center gap-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-colors shadow-sm"
                           >
                             Details <ArrowRight className="w-3 h-3" />
                           </button>
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
          <p className="text-[11px] font-medium text-slate-500">
            Total: <span className="font-bold text-slate-700">{reports.length}</span> reports
          </p>
        </div>
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (() => {
        const r = selectedReport;
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-4 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white text-lg font-extrabold shrink-0">
                      {r.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-sm font-extrabold text-white truncate">{r.name}</h2>
                      <p className="text-[10px] text-violet-200 font-semibold font-mono mt-0.5">
                        {r.roll} • Grade {r.grade}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.status === 'generated' && (
                      <button
                        onClick={() => handlePrint(r)}
                        className="p-1.5 rounded-lg text-violet-200 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                        title="Print"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedReport(null)}
                      className="p-1.5 rounded-lg text-violet-200 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 px-5 py-3 bg-white border-b border-slate-100 shrink-0">
                {[
                  { label: 'Community', value: r.community, icon: MapPin, color: 'text-violet-600' },
                  { label: 'Report Code', value: r.code, icon: FileText, color: 'text-amber-600' },
                  { label: 'Status', value: r.status === 'generated' ? 'Generated' : 'Pending', icon: r.status === 'generated' ? CheckCircle2 : Clock, color: r.status === 'generated' ? 'text-emerald-600' : 'text-slate-500' },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <s.icon className={`w-3.5 h-3.5 mx-auto mb-0.5 ${s.color}`} />
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
                    <p className={`text-[11px] font-extrabold ${s.color} mt-0.5 truncate`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {r.status === 'generated' ? (
                  <>
                    {/* Grade & Score */}
                    <div className="text-center py-4">
                      <div className={`w-20 h-20 rounded-full border-4 mx-auto flex items-center justify-center text-3xl font-extrabold shadow-sm ${getGradeColor(r.overallGrade)}`}>
                        {r.overallGrade}
                      </div>
                      <p className="text-lg font-bold text-slate-800 mt-3">Score: {r.score}</p>
                      <p className="text-[11px] text-slate-500 font-medium">Overall Performance</p>
                    </div>

                    {/* Top Skill */}
                    {r.topSkill !== '—' && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                          <Medal className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Top Skill</p>
                          <p className="text-sm font-bold text-amber-900">{r.topSkill}</p>
                        </div>
                      </div>
                    )}

                    {/* Details */}
                    <div className="bg-slate-50 rounded-xl p-4 space-y-2.5">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-medium">Student</span>
                        <span className="font-bold text-slate-800">{r.name}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-medium">Roll Number</span>
                        <span className="font-bold text-slate-800">{r.roll}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-medium">Grade</span>
                        <span className="font-bold text-slate-800">{r.grade}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-medium">Community</span>
                        <span className="font-bold text-slate-800">{r.community}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-medium">Generated On</span>
                        <span className="font-bold text-slate-800">{r.date}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-700 mb-1">Awaiting Evaluations</h3>
                    <p className="text-sm text-slate-500 max-w-xs mx-auto">
                      This report card will be generated once all stall evaluations for {r.name} are completed.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 shrink-0 flex items-center justify-between">
                <p className="text-[10px] text-slate-400 font-medium">
                  Report #{r.code}
                </p>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </DashboardLayout>
  );
}
