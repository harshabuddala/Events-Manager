'use client'

import React, { useState, useEffect } from 'react'
import { 
  Award, BookOpen, Clock, CheckCircle2, AlertCircle, 
  Send, UserCheck, Star, Shield, ArrowLeft, LogIn,
  ChevronDown, ScanLine, Printer, Download, Eye, IdCard, Loader2
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ReportCardPdf, fetchReportCardImageBase64 } from '@/app/components/ReportCardPdf'
import { IdCardPdf, fetchIdCardImageBase64 } from '@/app/components/IdCardPdf'

// We will load @react-pdf/renderer dynamically inside our dynamic PDF generation handlers to prevent SSR issues.

interface ScanClientPageProps {
  initialRegistration: any
  session: any
  volunteer: any
  assignments: any[]
}

export default function ScanClientPage({ 
  initialRegistration, 
  session, 
  volunteer, 
  assignments 
}: ScanClientPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEmbed = searchParams.get('embed') === 'true'
  const [registration, setRegistration] = useState(initialRegistration)
  const [isMounted, setIsMounted] = useState(false)
  const [bgImageBase64, setBgImageBase64] = useState<string | null>(null)
  const [idBgImageBase64, setIdBgImageBase64] = useState<string | null>(null)
  const [idCardQrCode, setIdCardQrCode] = useState<string | null>(null)

  useEffect(() => {
    setIsMounted(true)
    fetchReportCardImageBase64().then((base64) => {
      setBgImageBase64(base64)
    }).catch(console.error)

    fetchIdCardImageBase64().then((base64) => {
      setIdBgImageBase64(base64)
    }).catch(console.error)
  }, [])

  useEffect(() => {
    if (!registration) return;
    import('qrcode').then((QRCodeLib) => {
      const QRCode = QRCodeLib.default || QRCodeLib;
      QRCode.toDataURL(registration.registrationCode, {
        width: 250,
        margin: 1,
        color: {
          dark: '#0a0f2d',
          light: '#ffffff',
        },
      }).then((url) => {
        setIdCardQrCode(url);
      }).catch(console.error);
    }).catch(console.error);
  }, [registration]);
  const [generatingDoc, setGeneratingDoc] = useState<'report-view' | 'report-print' | 'id-view' | 'id-print' | null>(null);

  const handleViewReportCard = async () => {
    if (!registration) return;
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write('Loading Report Card PDF... Please wait.');
    }
    try {
      setGeneratingDoc('report-view');
      const { pdf } = await import('@react-pdf/renderer');
      const doc = <ReportCardPdf registration={registration} backgroundImage={bgImageBase64} />;
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

  const handleDownloadReportCard = async () => {
    if (!registration) return;
    try {
      setGeneratingDoc('report-print');
      const { pdf } = await import('@react-pdf/renderer');
      const doc = <ReportCardPdf registration={registration} backgroundImage={bgImageBase64} />;
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ReportCard_${registration.student.name.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download report card PDF:", error);
      alert("Failed to download report card PDF. Please try again.");
    } finally {
      setGeneratingDoc(null);
    }
  };

  const handleViewIdCard = async () => {
    if (!registration) return;
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write('Loading ID Card PDF... Please wait.');
    }
    try {
      setGeneratingDoc('id-view');
      const { pdf } = await import('@react-pdf/renderer');
      const doc = (
        <IdCardPdf 
          registration={registration} 
          backgroundImage={idBgImageBase64} 
          qrCodeDataUrl={idCardQrCode} 
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

  const handleDownloadIdCard = async () => {
    if (!registration) return;
    try {
      setGeneratingDoc('id-print');
      const { pdf } = await import('@react-pdf/renderer');
      const doc = (
        <IdCardPdf 
          registration={registration} 
          backgroundImage={idBgImageBase64} 
          qrCodeDataUrl={idCardQrCode} 
        />
      );
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `IDCard_${registration.student.name.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download ID card PDF:", error);
      alert("Failed to download ID card PDF. Please try again.");
    } finally {
      setGeneratingDoc(null);
    }
  };

  const isGrader = session && ['VOLUNTEER', 'LEAD_EVALUATOR', 'COORDINATOR', 'ADMIN', 'MANAGER'].includes(session.role)

  const [activeTab, setActiveTab] = useState<'report' | 'grade'>(
    isGrader && assignments.length > 0 ? 'grade' : 'report'
  )

  // Allowed stalls computation
  const allowedStalls = assignments.length > 0 
    ? registration.event.stalls.filter((s: any) => assignments.some(a => a.stallId === s.id))
    : (['ADMIN', 'MANAGER'].includes(session?.role) ? registration.event.stalls : [])
    
  const allAllowedGraded = allowedStalls.length > 0 && allowedStalls.every((s: any) => {
    const visit = registration.stallVisits?.find((v: any) => v.stallId === s.id)
    return visit && visit.performance
  })

  // Form states
  const defaultStallId = (() => {
    for (const s of allowedStalls) {
      const visit = registration.stallVisits?.find((v: any) => v.stallId === s.id)
      if (!visit || !visit.performance) return s.id
    }
    return ''
  })()
  const [stallId, setStallId] = useState(defaultStallId)
  const [score, setScore] = useState(8)
  const [grade, setGrade] = useState('A')
  const [metricScores, setMetricScores] = useState<Record<string, number>>({})
  const [remarks, setRemarks] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const selectedStall: any = (() => {
    if (!stallId) return null
    return registration.event.stalls.find((s: any) => s.id === stallId) || null
  })()
  const selectedStallMetrics: string[] = Array.isArray(selectedStall?.metrics)
    ? (selectedStall.metrics as unknown[]).filter((m): m is string => typeof m === 'string')
    : []

  React.useEffect(() => {
    if (selectedStallMetrics.length === 0) {
      if (Object.keys(metricScores).length > 0) setMetricScores({})
      return
    }
    setMetricScores(prev => {
      const next: Record<string, number> = {}
      for (const m of selectedStallMetrics) {
        next[m] = prev[m] ?? 0
      }
      const sameKeys = Object.keys(prev).length === selectedStallMetrics.length &&
        selectedStallMetrics.every(m => m in prev)
      return sameKeys ? prev : next
    })
  }, [stallId, registration])

  const derivePreview = (m: Record<string, number>) => {
    const values = Object.values(m).filter(v => v > 0)
    if (values.length === 0) return { score: 0, grade: '—' }
    const avg = values.reduce((a, b) => a + b, 0) / values.length
    const score = Math.round(avg * 2 * 10) / 10
    let g = 'E'
    if (score >= 9) g = 'A+'
    else if (score >= 8) g = 'A'
    else if (score >= 7) g = 'B'
    else if (score >= 6) g = 'C'
    else if (score >= 5) g = 'D'
    return { score, grade: g }
  }
  const metricPreview = derivePreview(metricScores)
  const allMetricsRated = selectedStallMetrics.length > 0 &&
    selectedStallMetrics.every(m => metricScores[m] && metricScores[m] >= 1)

  const handleRateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stallId) {
      setError('Please select a stall.')
      return
    }

    if (selectedStallMetrics.length > 0 && !allMetricsRated) {
      setError('Please rate every metric (1-5 stars).')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const payload: Record<string, unknown> = { stallId, remarks }
      if (selectedStallMetrics.length > 0) {
        payload.metricScores = metricScores
      } else {
        payload.score = Number(score)
        payload.grade = grade
      }

      const res = await fetch(`/api/scan/${registration.registrationCode}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to submit rating.')
      } else {
        setSuccess('Student performance evaluated successfully!')
        setRemarks('')
        
        // Refetch registration data to update report card in real-time
        const fetchRes = await fetch(`/api/events/${registration.eventId}/registrations`)
        if (fetchRes.ok) {
          const rData = await fetchRes.json()
          const updatedReg = rData.registrations.find(
            (r: any) => r.registrationCode === registration.registrationCode
          )
          if (updatedReg) {
            setRegistration(updatedReg)
          }
        }
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Calculate statistics
  const visits = registration.stallVisits || []
  const totalStalls = registration.event?.stalls?.length || 0
  const visitedStallsCount = visits.filter((v: any) => v.performance).length
  
  const totalScores = visits.reduce((acc: number, curr: any) => {
    return acc + (curr.performance ? curr.performance.score : 0)
  }, 0)
  
  const averageScore = visitedStallsCount > 0 
    ? (totalScores / visitedStallsCount).toFixed(1) 
    : '0.0'

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-800 font-sans ${isEmbed ? 'pb-4' : 'pb-28'}`}>
      {/* Brand Header - Mobile optimized */}
      {!isEmbed && (
        <div className="bg-gradient-to-r from-slate-900 via-violet-950 to-slate-900 text-white px-4 sm:px-6 py-4 sm:py-6 shadow-md border-b border-violet-900/30 safe-area-top print:hidden">
          <div className="max-w-xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-violet-600/30 border border-violet-500/30 flex items-center justify-center shrink-0">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xs sm:text-sm font-extrabold tracking-tight uppercase text-violet-400 truncate">Edunura Events</h1>
                <p className="text-[10px] sm:text-xs text-slate-300 font-semibold truncate">{registration.event.name}</p>
              </div>
            </div>
            {session ? (
              <span className="text-[9px] sm:text-[10px] font-bold bg-violet-600/20 text-violet-300 border border-violet-500/30 px-2 py-1 rounded-full uppercase tracking-wider shrink-0">
                {session.role} Portal
              </span>
            ) : (
              <Link 
                href="/"
                className="flex items-center gap-1 text-[10px] font-bold bg-white/10 hover:bg-white/20 text-white px-2 sm:px-3 py-1.5 rounded-lg border border-white/10 transition-all shrink-0"
              >
                <LogIn className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Admin Login</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-xl mx-auto px-3 sm:px-4 mt-4 sm:mt-6">
        
        {/* Dynamic Dual Tab Navigation (Visible only to Graders/Admins) */}
        {isGrader && (
          <div className="bg-white p-1 rounded-2xl border border-slate-200 shadow-sm flex mb-4 sm:mb-5 font-semibold print:hidden">
            <button
              onClick={() => setActiveTab('grade')}
              className={`flex-1 py-3 sm:py-2.5 text-xs sm:text-sm rounded-xl transition-all ${
                activeTab === 'grade' 
                  ? 'bg-violet-600 text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="hidden sm:inline">✍️ Grader Terminal</span>
              <span className="sm:hidden">Evaluate</span>
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`flex-1 py-3 sm:py-2.5 text-xs sm:text-sm rounded-xl transition-all ${
                activeTab === 'report' 
                  ? 'bg-violet-600 text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="hidden sm:inline">📊 Student Report Card</span>
              <span className="sm:hidden">Report</span>
            </button>
          </div>
        )}

        {/* ==================== GRADER TERMINAL TAB ==================== */}
        {activeTab === 'grade' && session && (
          <div className="space-y-4 sm:space-y-5 animate-fade-in">
            {/* Student Info Panel */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm">
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Active Scanned Student</span>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-lg sm:text-xl font-bold shrink-0 shadow-md">
                  {registration.student.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-800 truncate">{registration.student.name}</h2>
                  <p className="text-xs font-semibold text-slate-500 font-mono mt-0.5">
                    {registration.student.rollNumber} • Grade {registration.student.grade} {registration.student.age && `(${registration.student.age} yrs)`}
                  </p>
                </div>
              </div>
            </div>

            {/* Volunteer Context Banner */}
            {volunteer && (
              <div className="bg-violet-50 border border-violet-100 rounded-2xl p-3 sm:p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center shrink-0 text-violet-600">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="text-xs min-w-0">
                  <p className="font-bold text-violet-800 truncate">Evaluator: {volunteer.name}</p>
                  <p className="text-violet-600/80 font-medium">
                    {assignments.length > 0 
                      ? `Assigned: ${assignments[0].stall.name}` 
                      : 'No specific stall assignment found'}
                  </p>
                </div>
              </div>
            )}

            {allAllowedGraded ? (
              <div className="bg-white rounded-2xl border border-emerald-200 p-6 shadow-sm text-center">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-800">Already Evaluated</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-6">You have successfully evaluated this student for your assigned stalls.</p>
                
                <div className="space-y-3 text-left">
                  {allowedStalls.map((s: any) => {
                    const visit = registration.stallVisits?.find((v: any) => v.stallId === s.id)
                    const perf = visit?.performance
                    return (
                      <div key={s.id} className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div>
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-0.5">{s.code}</span>
                          <span className="text-sm font-extrabold text-emerald-950">{s.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold bg-emerald-200 text-emerald-800 px-2.5 py-1 rounded-lg">Score: {perf?.score}/10</span>
                          <span className="text-xs font-bold bg-emerald-200 text-emerald-800 px-2.5 py-1 rounded-lg">Grade {perf?.grade}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : allowedStalls.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm text-center">
                <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <h3 className="text-base font-extrabold text-slate-800">No Assignments</h3>
                <p className="text-sm text-slate-500 mt-1">You are not assigned to any stalls for this event.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-5">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-800 border-b border-slate-100 pb-3">Evaluate Student Performance</h3>
                
                <form onSubmit={handleRateSubmit} className="space-y-4 sm:space-y-5">
                  {error && (
                    <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl px-4 py-3 text-xs font-semibold">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {error}
                    </div>
                  )}
                  
                  {success && (
                    <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl px-4 py-3 text-xs font-semibold">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      {success}
                    </div>
                  )}

                  {/* Assigned Stall (read-only — each volunteer is assigned to one stall) */}
                  {selectedStall && (
                    <div className="flex items-center justify-between gap-3 bg-violet-50 border border-violet-100 rounded-xl px-3.5 py-3">
                      <div className="min-w-0">
                        <span className="text-[9px] sm:text-[10px] font-bold text-violet-500 uppercase tracking-widest block">Assigned Stall</span>
                        <span className="text-sm sm:text-base font-extrabold text-violet-900 truncate block">{selectedStall.name}</span>
                      </div>
                      <span className="text-[10px] sm:text-xs font-mono font-bold text-violet-700 bg-white border border-violet-200 px-2 py-1 rounded-lg shrink-0">
                        {selectedStall.code}
                      </span>
                    </div>
                  )}

                  {/* Per-metric star ratings (only when the stall has metrics configured) */}
                  {selectedStallMetrics.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs sm:text-sm font-bold text-slate-700">
                          Star Ratings <span className="text-slate-400 font-normal">(per metric)</span>
                        </label>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] sm:text-xs font-extrabold text-violet-700 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-lg font-mono">
                            {metricPreview.score > 0 ? `${metricPreview.score}/10` : '—/10'}
                          </span>
                          <span className="text-[10px] sm:text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg">
                            Grade {metricPreview.grade}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2.5">
                        {selectedStallMetrics.map((metric) => {
                          const value = metricScores[metric] || 0
                          return (
                            <div key={metric} className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                              <span className="text-xs sm:text-sm font-semibold text-slate-700 capitalize truncate">{metric}</span>
                              <div className="flex items-center gap-1 shrink-0">
                                {[1, 2, 3, 4, 5].map((n) => {
                                  const filled = n <= value
                                  return (
                                    <button
                                      key={n}
                                      type="button"
                                      onClick={() => {
                                        setMetricScores(prev => ({ ...prev, [metric]: n }))
                                        if (error) setError('')
                                        if (success) setSuccess('')
                                      }}
                                      className="p-0.5 transition-transform active:scale-90"
                                      aria-label={`Rate ${metric} ${n} star${n > 1 ? 's' : ''}`}
                                    >
                                      <Star
                                        className={`w-5 h-5 ${filled ? 'text-amber-500 fill-amber-400' : 'text-slate-300'}`}
                                      />
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">Overall score is auto-calculated as the average of all star ratings × 2.</p>
                    </div>
                  ) : (
                    <>
                      {/* Score Input (fallback for stalls without metrics) */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-xs sm:text-sm font-bold text-slate-700">Score <span className="text-slate-400 font-normal">(1-10)</span></label>
                          <span className="text-sm sm:text-base font-extrabold text-violet-600 bg-violet-50 px-3 py-1 rounded-xl border border-violet-100 font-mono">
                            {score} / 10
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          step="0.5"
                          value={score}
                          onChange={e => { setScore(Number(e.target.value)); setError(''); setSuccess(''); }}
                          className="w-full accent-violet-600 h-2.5 bg-slate-100 rounded-lg cursor-pointer appearance-none"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1 uppercase tracking-wider">
                          <span>1 (Poor)</span>
                          <span>5 (Average)</span>
                          <span>10 (Excellent)</span>
                        </div>
                      </div>

                      {/* Grade Dropdown */}
                      <div className="space-y-1.5">
                        <label className="text-xs sm:text-sm font-bold text-slate-700">Performance Grade <span className="text-rose-500">*</span></label>
                        <select
                          value={grade}
                          onChange={e => { setGrade(e.target.value); setError(''); setSuccess(''); }}
                          className="w-full px-3.5 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-800 font-bold"
                        >
                          <option value="A+">Grade A+ (Outstanding)</option>
                          <option value="A">Grade A (Excellent)</option>
                          <option value="B">Grade B (Good)</option>
                          <option value="C">Grade C (Satisfactory)</option>
                          <option value="D">Grade D (Needs Improvement)</option>
                          <option value="E">Grade E (Unsatisfactory)</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Remarks */}
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-bold text-slate-700">Remarks / Feedback <span className="text-slate-400 font-normal">(optional)</span></label>
                    <textarea
                      rows={3}
                      value={remarks}
                      onChange={e => { setRemarks(e.target.value); setError(''); setSuccess(''); }}
                      placeholder="e.g. Exhibited superb creativity, quick problem solving skills..."
                      className="w-full px-3.5 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-800 placeholder:text-slate-400"
                    />
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={loading || !stallId}
                    className="w-full py-3.5 sm:py-3 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 disabled:opacity-60 transition-all flex items-center justify-center gap-2 shadow-md shadow-violet-500/10 active:scale-[0.98]"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving Evaluation...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit Score & Remarks
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ==================== STUDENT REPORT CARD TAB ==================== */}
        {activeTab === 'report' && (
          <div className="space-y-4 sm:space-y-5 animate-fade-in">
              {/* Student Badge Card */}
              <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-3xl p-5 sm:p-6 text-white shadow-lg border border-violet-500/20 relative overflow-hidden print:shadow-none print:border-violet-200">
              {visitedStallsCount === totalStalls && totalStalls > 0 && (
                 <div className="absolute top-4 right-4 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm border border-emerald-400 z-10">
                   OFFICIAL REPORT
                 </div>
              )}
              {/* Background glows */}
              <div className="absolute -right-12 -top-12 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -left-12 -bottom-12 w-32 h-32 bg-violet-500/30 rounded-full blur-2xl" />

              <div className="relative flex flex-row items-center gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white text-2xl sm:text-3xl font-extrabold shrink-0 backdrop-blur-sm shadow-inner">
                  {registration.student.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] sm:text-[10px] font-bold text-violet-200 uppercase tracking-widest">Student Report Pass</span>
                  <h2 className="text-base sm:text-lg font-extrabold leading-tight mt-0.5 truncate">{registration.student.name}</h2>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-[10px] sm:text-xs text-violet-100 font-semibold font-mono">
                    <span className="bg-white/10 px-2 py-0.5 rounded border border-white/5">{registration.student.rollNumber}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>Grade {registration.student.grade} {registration.student.age && `(${registration.student.age} yrs)`}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="text-violet-200 font-sans truncate">{registration.event.community.name}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Stats row */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { label: 'Stalls Scored', value: `${visitedStallsCount} / ${totalStalls}`, icon: <BookOpen className="w-4 h-4 text-violet-500" />, color: 'bg-violet-50/50 border-violet-100' },
                { label: 'Avg Rating', value: `${averageScore} / 10`, icon: <Star className="w-4 h-4 text-amber-500" />, color: 'bg-amber-50/50 border-amber-100' },
                { label: 'Status', value: registration.status === 'COMPLETED' ? 'Done' : 'In Progress', icon: <Clock className="w-4 h-4 text-emerald-500" />, color: 'bg-emerald-50/50 border-emerald-100' },
              ].map(stat => (
                <div key={stat.label} className={`bg-white rounded-2xl border p-3 sm:p-3.5 text-center flex flex-col items-center gap-1.5 shadow-sm ${stat.color}`}>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                    {stat.icon}
                  </div>
                  <div>
                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{stat.label}</span>
                    <span className="text-xs sm:text-sm font-extrabold text-slate-800 mt-0.5 block">{stat.value}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Stall list breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-800">Learning Activity Breakdown</h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase hidden sm:inline">Interactive Scorecard</span>
              </div>

              <div className="space-y-3">
                {registration.event.stalls.map((stall: any) => {
                  const visit = visits.find((v: any) => v.stallId === stall.id)
                  const perf = visit ? visit.performance : null

                  return (
                    <div 
                      key={stall.id} 
                      className={`p-3 sm:p-4 rounded-xl border flex items-start gap-3 transition-all print:break-inside-avoid ${
                        perf 
                          ? 'bg-slate-50/40 border-slate-200/80' 
                          : 'bg-white border-dashed border-slate-200/80'
                      }`}
                    >
                      {perf ? (
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-50 text-slate-400 border border-slate-200/60 flex items-center justify-center shrink-0 mt-0.5">
                          <Clock className="w-4 h-4" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 truncate">{stall.name}</h4>
                            <span className="text-[9px] sm:text-[10px] font-mono text-slate-400 uppercase tracking-wider">{stall.code}</span>
                          </div>
                          
                          {perf ? (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] sm:text-xs font-extrabold text-violet-700 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-lg font-mono">
                                {perf.score}/10
                              </span>
                              <span className="text-[10px] sm:text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg">
                                Grade {perf.grade}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded shrink-0 uppercase tracking-wider self-start">
                              Pending
                            </span>
                          )}
                        </div>

                        {perf && (() => {
                          const metricScoresData = perf.metricScores && typeof perf.metricScores === 'object'
                            ? (perf.metricScores as Record<string, unknown>)
                            : null
                          const metricEntries = metricScoresData
                            ? Object.entries(metricScoresData).filter(([, v]) => typeof v === 'number')
                            : []
                          return (
                            <div className="mt-2 space-y-2">
                              {metricEntries.length > 0 && (
                                <div className="bg-white border border-slate-100 rounded-xl p-2.5 sm:p-3 space-y-1.5">
                                  {metricEntries.map(([name, value]) => {
                                    const n = Number(value) || 0
                                    return (
                                      <div key={name} className="flex items-center justify-between gap-2">
                                        <span className="text-[11px] sm:text-xs font-semibold text-slate-700 capitalize truncate">{name}</span>
                                        <div className="flex items-center gap-0.5 shrink-0">
                                          {[1, 2, 3, 4, 5].map((i) => (
                                            <Star
                                              key={i}
                                              className={`w-3.5 h-3.5 ${i <= n ? 'text-amber-500 fill-amber-400' : 'text-slate-200'}`}
                                            />
                                          ))}
                                          <span className="text-[10px] font-mono text-slate-500 ml-1.5">{n}/5</span>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                              <div className="text-[11px] sm:text-xs bg-white border border-slate-100 rounded-xl p-2.5 sm:p-3 text-slate-500 leading-normal italic">
                                {perf.remarks ? `"${perf.remarks}"` : '"Evaluated successfully with standard criteria."'}
                                {perf.volunteer && (
                                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 block mt-1.5 uppercase not-italic">
                                    Evaluator: {perf.volunteer.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                  )
                })}

                {registration.event.stalls.length === 0 && (
                  <div className="text-center py-6 text-slate-400 text-xs italic">
                    No active stalls found for this event.
                  </div>
                )}
              </div>
            </div>
            {/* Action Buttons (Print + PDF) */}
             {totalStalls > 0 && (
               <div className="w-full space-y-4 print:hidden">
                 
                 {/* Student Report Card Actions */}
                 <div className="space-y-1.5">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Student Report Card</p>
                   <div className="flex flex-col sm:flex-row gap-3 w-full">
                     <button
                        onClick={() => window.print()}
                        className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white py-3.5 sm:py-3 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
                      >
                        <Printer className="w-4 h-4" />
                        Print Card
                      </button>

                      <button
                        type="button"
                        disabled={generatingDoc !== null}
                        onClick={handleViewReportCard}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3.5 sm:py-3 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
                      >
                        {generatingDoc === 'report-view' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                        {generatingDoc === 'report-view' ? 'Preparing...' : 'View Report'}
                      </button>

                      <button
                        type="button"
                        disabled={generatingDoc !== null}
                        onClick={handleDownloadReportCard}
                        className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white py-3.5 sm:py-3 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
                      >
                        {generatingDoc === 'report-print' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        {generatingDoc === 'report-print' ? 'Generating...' : 'Download PDF'}
                      </button>
                    </div>
                  </div>

                  {/* Student ID Card Actions */}
                  <div className="space-y-1.5 pt-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Student ID Card (A6 Size)</p>
                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                      <button
                        type="button"
                        disabled={generatingDoc !== null || !idBgImageBase64 || !idCardQrCode}
                        onClick={handleViewIdCard}
                        className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-3.5 sm:py-3 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
                        title={!idBgImageBase64 || !idCardQrCode ? "Preparing ID card assets..." : "View ID Card"}
                      >
                        {generatingDoc === 'id-view' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <IdCard className="w-4 h-4" />
                        )}
                        {generatingDoc === 'id-view' ? 'Preparing ID...' : 'View ID Card'}
                      </button>

                      <button
                        type="button"
                        disabled={generatingDoc !== null || !idBgImageBase64 || !idCardQrCode}
                        onClick={handleDownloadIdCard}
                        className="flex-1 flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white py-3.5 sm:py-3 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
                        title={!idBgImageBase64 || !idCardQrCode ? "Preparing ID card assets..." : "Download ID Card"}
                      >
                        {generatingDoc === 'id-print' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        {generatingDoc === 'id-print' ? 'Generating ID...' : 'Download ID Card'}
                      </button>
                   </div>
                 </div>

                </div>
              )}
            </div>
          )}

      </div>

      {/* Floating Scan Button */}
      {isGrader && !isEmbed && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_20px_rgb(0,0,0,0.05)] z-50">
          <div className="max-w-xl mx-auto">
            <button
              onClick={() => router.push('/scan?autostart=true')}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white py-3.5 sm:py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-violet-500/20 active:scale-[0.98]"
            >
              <ScanLine className="w-5 h-5" />
              Scan Next QR Code
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
