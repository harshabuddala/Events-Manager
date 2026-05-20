'use client';

import React from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import { 
  FileOutput, Search, Filter, 
  MoreVertical, ArrowRight, Printer, Download,
  CheckCircle2, FileText, Medal
} from 'lucide-react';

const reports = [
  {
    id: 'RC-9812',
    roll: 'EDN784512',
    name: 'Aarav Sharma',
    grade: '5th Class',
    community: 'Greenfield Society',
    score: '94%',
    overallGrade: 'A+',
    topSkill: 'Mathematics (98%)',
    status: 'generated',
    date: 'May 26, 2026'
  },
  {
    id: 'RC-9813',
    roll: 'EDN784514',
    name: 'Vihaan Singh',
    grade: '7th Class',
    community: 'Sunrise Apartments',
    score: '88%',
    overallGrade: 'A',
    topSkill: 'Science (95%)',
    status: 'generated',
    date: 'May 25, 2026'
  },
  {
    id: 'RC-9814',
    roll: 'EDN784516',
    name: 'Rohan Kumar',
    grade: '8th Class',
    community: 'Maple Residency',
    score: '76%',
    overallGrade: 'B+',
    topSkill: 'Arts (92%)',
    status: 'generated',
    date: 'May 22, 2026'
  },
  {
    id: 'RC-9815',
    roll: 'EDN784518',
    name: 'Ishaan Verma',
    grade: '4th Class',
    community: 'Dream Valley',
    score: '91%',
    overallGrade: 'A+',
    topSkill: 'Reasoning (94%)',
    status: 'generated',
    date: 'May 20, 2026'
  },
  {
    id: 'RC-9816',
    roll: 'EDN784521',
    name: 'Kavya Reddy',
    grade: '6th Class',
    community: 'Greenfield Society',
    score: '84%',
    overallGrade: 'A',
    topSkill: 'Languages (89%)',
    status: 'pending',
    date: 'Pending Evaluation'
  }
];

export default function ReportCardsPage() {
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
          <button className="hidden lg:flex items-center gap-1.5 bg-violet-600 border border-violet-700 px-3 py-2 rounded-lg text-xs font-semibold text-white shadow-sm hover:bg-violet-700 hover:shadow-md transition-all">
            <FileOutput className="w-3.5 h-3.5" />
            <span>Generate Reports</span>
          </button>
        </div>
      }
    >
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 hide-scrollbar">
          <button className="px-4 py-2 bg-slate-800 text-white rounded-md text-xs font-semibold shrink-0 shadow-sm">All Reports</button>
          <button className="px-4 py-2 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-md text-xs font-semibold shrink-0 shadow-sm">Generated</button>
          <button className="px-4 py-2 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-md text-xs font-semibold shrink-0 shadow-sm">Pending</button>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by roll no or name..." 
              className="w-full pl-9 pr-4 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 shadow-sm placeholder:text-slate-400"
            />
          </div>
          <button className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 shadow-sm transition-colors shrink-0">
            <Filter className="w-4 h-4" />
          </button>
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
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right w-[140px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-slate-50/80 transition-colors group">
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
                          <span>{report.id}</span>
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
                    {report.status === 'generated' ? (
                      <div className="flex items-center gap-2">
                        <Medal className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-semibold text-slate-700">{report.topSkill}</span>
                      </div>
                    ) : (
                      <span className="text-xs italic text-slate-400">Awaiting evaluations...</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       {report.status === 'generated' ? (
                         <>
                           <button className="flex items-center gap-1 bg-white border border-slate-200 hover:border-violet-300 hover:text-violet-700 text-slate-600 px-2 py-1.5 rounded-md text-[11px] font-semibold transition-colors shadow-sm" title="Print Report">
                             <Printer className="w-3.5 h-3.5" />
                           </button>
                           <button className="flex items-center gap-1 bg-white border border-slate-200 hover:border-violet-300 hover:text-violet-700 text-slate-600 px-2 py-1.5 rounded-md text-[11px] font-semibold transition-colors shadow-sm" title="Download PDF">
                             <Download className="w-3.5 h-3.5" />
                           </button>
                           <button className="flex items-center gap-1 bg-violet-50 border border-violet-200 hover:bg-violet-100 hover:text-violet-700 text-violet-600 px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-colors shadow-sm">
                             View <ArrowRight className="w-3 h-3" />
                           </button>
                         </>
                       ) : (
                         <button className="flex items-center gap-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-colors shadow-sm">
                           Details <ArrowRight className="w-3 h-3" />
                         </button>
                       )}
                       <button className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-md transition-colors">
                         <MoreVertical className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] font-medium text-slate-500">Showing <span className="font-bold text-slate-700">1</span> to <span className="font-bold text-slate-700">5</span> of <span className="font-bold text-slate-700">1,248</span> reports</p>
          <div className="flex items-center gap-1">
            <button className="px-2.5 py-1 border border-slate-200 text-slate-400 bg-white rounded text-[11px] font-semibold opacity-50 cursor-not-allowed">Prev</button>
            <button className="px-2.5 py-1 border border-violet-500 bg-violet-600 text-white rounded text-[11px] font-semibold">1</button>
            <button className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 text-slate-600 bg-white rounded text-[11px] font-semibold">2</button>
            <button className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 text-slate-600 bg-white rounded text-[11px] font-semibold">3</button>
            <span className="text-slate-400 px-1 text-xs">...</span>
            <button className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 text-slate-600 bg-white rounded text-[11px] font-semibold">250</button>
            <button className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 text-slate-600 bg-white rounded text-[11px] font-semibold">Next</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
