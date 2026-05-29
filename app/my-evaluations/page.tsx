'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { 
  Search, CheckCircle2, Star, Loader2, 
  Clock, ArrowRight, AlertCircle,
  ClipboardCheck, Filter
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  grade: string;
  stallName: string;
  visitTime: string;
  score?: number;
  evaluationGrade?: string;
}

interface Stall {
  id: string;
  name: string;
  code: string;
}

export default function MyEvaluationsPage() {
  const { user, isVolunteer, isLoading: authLoading } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [selectedStall, setSelectedStall] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        
        const studentsRes = await fetch('/api/volunteer/students');
        if (studentsRes.ok) {
          const data = await studentsRes.json();
          setStudents(data.students || []);
        }

        const stallsRes = await fetch('/api/volunteer/stalls');
        if (stallsRes.ok) {
          const data = await stallsRes.json();
          setStalls(data.stalls || []);
        }
      } catch (error) {
        console.error('Failed to fetch evaluations data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStall = selectedStall === 'all' || student.stallName === stalls.find(s => s.id === selectedStall)?.name;
    
    return matchesSearch && matchesStall;
  });

  if (authLoading) {
    return (
      <DashboardLayout title="My Evaluations" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="My Evaluations"
      subtitle="Rate and evaluate student performance at your assigned stalls"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                  <ClipboardCheck className="w-5 h-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Students</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900">{students.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Evaluated</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900">{students.filter(s => s.score !== undefined && s.score !== null).length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Controls - Mobile optimized */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search by name, roll number..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                />
              </div>

              {/* Filter Toggle (Mobile) + Select */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="sm:hidden flex items-center gap-2 px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 active:bg-slate-100"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                </button>
                
                {stalls.length > 0 && (
                  <select
                    value={selectedStall}
                    onChange={(e) => setSelectedStall(e.target.value)}
                    className={`px-3 py-3 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 ${showFilters ? '' : 'hidden sm:block'}`}
                  >
                    <option value="all">All Stalls</option>
                    {stalls.map(stall => (
                      <option key={stall.id} value={stall.id}>{stall.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Expanded filters on mobile */}
            {showFilters && stalls.length > 0 && (
              <div className="sm:hidden mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 mb-2">Filter by Stall</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedStall('all')}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      selectedStall === 'all' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    All Stalls
                  </button>
                  {stalls.map(stall => (
                    <button
                      key={stall.id}
                      onClick={() => setSelectedStall(stall.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        selectedStall === stall.id ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {stall.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Students List - Desktop Table */}
          <div className="hidden sm:block bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Student Details</th>
                    <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Stall</th>
                    <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Visit Time</th>
                    <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Performance</th>
                    <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-violet-100 border border-violet-200/60 flex items-center justify-center text-violet-700 text-sm font-bold shrink-0">
                            {student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-800">{student.name}</h4>
                            <p className="text-xs font-medium text-slate-500">{student.rollNumber} • Grade {student.grade}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-medium text-slate-700">{student.stallName}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(student.visitTime).toLocaleString([], { 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {student.score !== undefined && student.score !== null ? (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-lg border border-amber-100 text-xs font-bold">
                              <Star className="w-3.5 h-3.5 fill-amber-500" />
                              {student.score}
                            </div>
                            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                              Grade {student.evaluationGrade}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Not evaluated</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {student.score === undefined || student.score === null ? (
                            <a 
                              href={`/scan/${student.rollNumber}`}
                              className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-colors shadow-md hover:shadow-lg active:scale-95"
                            >
                              Evaluate
                              <ArrowRight className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <button className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs font-semibold transition-colors active:scale-95">
                              View Details
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Students List - Mobile Cards */}
          <div className="sm:hidden space-y-3">
            {filteredStudents.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center">
                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-500 mb-2">No students found</p>
                <p className="text-xs text-slate-400">Try adjusting your filters or search query.</p>
              </div>
            ) : (
              filteredStudents.map((student) => (
                <div key={student.id} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-[0_2px_12px_rgb(0,0,0,0.04)] animate-fade-in">
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-11 h-11 rounded-full bg-violet-100 border border-violet-200/60 flex items-center justify-center text-violet-700 text-sm font-bold shrink-0">
                      {student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-800">{student.name}</h4>
                      <p className="text-xs font-medium text-slate-500">{student.rollNumber} • Grade {student.grade}</p>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        {new Date(student.visitTime).toLocaleString([], { 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Stall & Performance */}
                  <div className="flex items-center justify-between mb-3 py-2 border-y border-slate-100">
                    <span className="text-xs font-medium text-slate-600">{student.stallName}</span>
                    {student.score !== undefined && student.score !== null ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-lg border border-amber-100 text-xs font-bold">
                          <Star className="w-3 h-3 fill-amber-500" />
                          {student.score}
                        </div>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg">
                          {student.evaluationGrade}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">Pending</span>
                    )}
                  </div>

                  {/* Action */}
                  {student.score === undefined || student.score === null ? (
                    <a 
                      href={`/scan/${student.rollNumber}`}
                      className="flex items-center justify-center gap-2 bg-violet-600 text-white py-3 rounded-xl text-sm font-semibold shadow-md active:scale-[0.98] transition-transform"
                    >
                      Evaluate Now
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  ) : (
                    <button className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-3 rounded-xl text-sm font-semibold active:scale-[0.98] transition-transform">
                      View Details
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
