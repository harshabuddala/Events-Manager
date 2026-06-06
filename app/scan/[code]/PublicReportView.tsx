'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  Award,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ScanLine,
  IdCard,
  Loader2,
  LogIn,
  UserCheck,
  Clock,
  Star,
  Shield,
  X,
} from 'lucide-react'
import { fetchReportCardImageBase64 } from '@/lib/letterheads'
import { fetchIdCardImageBase64 } from '@/lib/letterheads'

// ReportCardPdf and IdCardPdf are loaded dynamically inside the PDF
// generation handlers to keep @react-pdf/renderer out of the initial
// client bundle. They are re-exported from the letterheads/pdf modules.

interface PublicReportViewProps {
  registration: any
  event: any
}

function fmtDate(value: any): string {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return String(value)
  }
}

function fmtScore(score: any): string {
  if (score === null || score === undefined || score === '') return '-'
  const n = Number(score)
  if (Number.isNaN(n)) return String(score)
  return n % 1 === 0 ? String(n) : n.toFixed(1)
}

function gradeColor(grade: any): string {
  const g = String(grade || '').toUpperCase()
  if (!g) return 'bg-slate-100 text-slate-700'
  if (g === 'A+' || g === 'A') return 'bg-emerald-100 text-emerald-700'
  if (g === 'B' || g === 'B+') return 'bg-sky-100 text-sky-700'
  if (g === 'C' || g === 'C+') return 'bg-amber-100 text-amber-700'
  if (g === 'D') return 'bg-orange-100 text-orange-700'
  if (g === 'F') return 'bg-rose-100 text-rose-700'
  return 'bg-slate-100 text-slate-700'
}

export default function PublicReportView({ registration, event }: PublicReportViewProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [bgImageBase64, setBgImageBase64] = useState<string | null>(null)
  const [idBgImageBase64, setIdBgImageBase64] = useState<string | null>(null)
  const [generatingDoc, setGeneratingDoc] = useState<'report' | 'id' | null>(null)
  const [openStallId, setOpenStallId] = useState<string | null>(null)

  useEffect(() => {
    setIsMounted(true)
    fetchReportCardImageBase64().then(setBgImageBase64).catch(console.error)
    fetchIdCardImageBase64().then(setIdBgImageBase64).catch(console.error)

    // Hide the persistent registration code from the address bar so it
    // doesn't get captured by OCR (e.g. Google Lens) or end up in browser
    // history. The QR encodes /r/<code>; the page renders under
    // /scan/<code> then immediately rewrites the URL to a clean path.
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      try {
        window.history.replaceState(
          window.history.state,
          '',
          '/scan',
        )
      } catch {
        // Some browsers throw on cross-origin replaceState; safe to ignore.
      }
    }
  }, [])

  const student = registration?.student || {}
  const visits = Array.isArray(registration?.stallVisits) ? registration.stallVisits : []
  const evaluatedVisits = visits.filter((v: any) => v.performance)
  const totalStalls = Array.isArray(event?.stalls) ? event.stalls.length : 0
  const completed = totalStalls > 0 && evaluatedVisits.length >= totalStalls
  const isRegistered = !!registration

  const handleViewReportCard = async () => {
    if (!isRegistered) return
    const newWindow = window.open('', '_blank')
    if (newWindow) newWindow.document.write('Loading Report Card...')
    try {
      setGeneratingDoc('report')
      const [{ ReportCardPdf }, { pdf }] = await Promise.all([
        import('@/app/components/ReportCardPdf'),
        import('@react-pdf/renderer'),
      ])
      const doc = (
        <ReportCardPdf
          registration={registration}
          backgroundImage={bgImageBase64 || undefined}
        />
      )
      const blob = await pdf(doc as any).toBlob()
      const url = URL.createObjectURL(blob)
      if (newWindow) {
        newWindow.document.write(
          `<html><head><title>Report Card</title></head><body style="margin:0"><iframe src="${url}" style="border:0;width:100%;height:100vh"></iframe></body></html>`,
        )
      } else {
        const a = document.createElement('a')
        a.href = url
        a.download = `report-card-${registration.registrationCode || 'student'}.pdf`
        a.click()
      }
    } catch (err) {
      console.error(err)
      if (newWindow) newWindow.document.write('Failed to generate report card.')
    } finally {
      setGeneratingDoc(null)
    }
  }

  const handleViewIdCard = async () => {
    if (!isRegistered) return
    const newWindow = window.open('', '_blank')
    if (newWindow) newWindow.document.write('Loading ID Card...')
    try {
      setGeneratingDoc('id')
      const [{ IdCardPdf }, { pdf }] = await Promise.all([
        import('@/app/components/IdCardPdf'),
        import('@react-pdf/renderer'),
      ])
      const doc = (
        <IdCardPdf
          registration={registration}
          backgroundImage={idBgImageBase64 || undefined}
        />
      )
      const blob = await pdf(doc as any).toBlob()
      const url = URL.createObjectURL(blob)
      if (newWindow) {
        newWindow.document.write(
          `<html><head><title>ID Card</title></head><body style="margin:0"><iframe src="${url}" style="border:0;width:100%;height:100vh"></iframe></body></html>`,
        )
      } else {
        const a = document.createElement('a')
        a.href = url
        a.download = `id-card-${registration.registrationCode || 'student'}.pdf`
        a.click()
      }
    } catch (err) {
      console.error(err)
      if (newWindow) newWindow.document.write('Failed to generate ID card.')
    } finally {
      setGeneratingDoc(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40">
      {/* Top header strip */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-white/70 border-b border-slate-200/60">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white grid place-items-center shadow-sm">
              <ScanLine size={16} />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-extrabold text-slate-800">Event Pass</div>
              <div className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">
                Public Report
              </div>
            </div>
          </div>
          <Link
            href={`/?next=/scan`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <LogIn size={14} />
            Volunteer Login
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-5">
        {/* Hero card */}
        <section className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/70 shadow-sm">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-amber-400" />
          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                  <Shield size={11} />
                  Verified Pass
                </div>
                <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight truncate">
                  {event?.name || 'Event'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  {event?.community?.name ? `${event.community.name} • ` : ''}
                  {fmtDate(event?.date)}
                </p>
              </div>
              <div
                className={`shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl grid place-items-center ${
                  completed
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-amber-100 text-amber-600'
                }`}
              >
                {completed ? <Award size={26} /> : <Clock size={26} />}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <Stat label="Roll No" value={maskRollNumber(student?.rollNumber)} />
              <Stat label="Name" value={student?.name || '-'} small />
              <Stat label="Grade" value={student?.grade ?? '-'} />
              <Stat
                label="Status"
                value={completed ? 'Completed' : `${evaluatedVisits.length}/${totalStalls || '–'}`}
                valueClassName={completed ? 'text-emerald-600' : 'text-amber-600'}
              />
            </div>
          </div>
        </section>

        {/* Documents row */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleViewReportCard}
            disabled={!isMounted || !isRegistered || generatingDoc !== null}
            className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200/70 shadow-sm p-4 text-left hover:border-indigo-200 hover:shadow-md transition-all disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 grid place-items-center group-hover:bg-indigo-100 transition-colors">
                <BookOpen size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-extrabold text-slate-800">Report Card</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  View or download all evaluations
                </div>
              </div>
              {generatingDoc === 'report' ? (
                <Loader2 size={18} className="animate-spin text-indigo-500" />
              ) : (
                <ChevronDown size={18} className="-rotate-90 text-slate-400" />
              )}
            </div>
          </button>

          <button
            type="button"
            onClick={handleViewIdCard}
            disabled={!isMounted || !isRegistered || generatingDoc !== null}
            className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200/70 shadow-sm p-4 text-left hover:border-fuchsia-200 hover:shadow-md transition-all disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-fuchsia-50 text-fuchsia-600 grid place-items-center group-hover:bg-fuchsia-100 transition-colors">
                <IdCard size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-extrabold text-slate-800">ID Card</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Quick identity verification
                </div>
              </div>
              {generatingDoc === 'id' ? (
                <Loader2 size={18} className="animate-spin text-fuchsia-500" />
              ) : (
                <ChevronDown size={18} className="-rotate-90 text-slate-400" />
              )}
            </div>
          </button>
        </section>

        {/* Evaluations */}
        <section className="rounded-2xl bg-white border border-slate-200/70 shadow-sm overflow-hidden">
          <header className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-800">Stall Evaluations</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {evaluatedVisits.length} of {totalStalls || '–'} stalls evaluated
              </p>
            </div>
            {completed ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                <CheckCircle2 size={11} /> All Done
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                <AlertCircle size={11} /> In Progress
              </span>
            )}
          </header>

          {visits.length === 0 ? (
            <div className="px-5 py-10 text-center text-xs text-slate-500">
              No stall visits recorded yet.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {visits.map((v: any) => {
                const perf = v.performance
                const open = openStallId === v.id
                return (
                  <li key={v.id} className="px-5 py-3.5">
                    <button
                      type="button"
                      onClick={() => setOpenStallId(open ? null : v.id)}
                      className="w-full flex items-center justify-between gap-3 text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-lg grid place-items-center shrink-0 ${
                            perf
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {perf ? <Star size={16} /> : <Clock size={16} />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-800 truncate">
                            {v.stall?.name || 'Stall'}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {perf ? (
                              <>By {perf.volunteer?.name || 'Evaluator'}</>
                            ) : (
                              'Not evaluated yet'
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {perf && (
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${gradeColor(
                              perf.grade,
                            )}`}
                          >
                            {perf.grade || '—'}
                          </span>
                        )}
                        <ChevronDown
                          size={16}
                          className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </button>
                    {open && perf && (
                      <div className="mt-3 ml-12 grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Score
                          </div>
                          <div className="text-base font-extrabold text-slate-800">
                            {fmtScore(perf.score)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Evaluated
                          </div>
                          <div className="text-sm font-semibold text-slate-700">
                            {fmtDate(perf.evaluatedAt || v.visitedAt)}
                          </div>
                        </div>
                        {perf.remarks && (
                          <div className="col-span-2">
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                              Remarks
                            </div>
                            <div className="text-sm text-slate-700 mt-0.5 whitespace-pre-wrap">
                              {perf.remarks}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {open && !perf && (
                      <div className="mt-3 ml-12 text-[11px] text-slate-500 italic">
                        Waiting for an evaluator to grade this stall.
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* Volunteer CTA */}
        <section className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 grid place-items-center shrink-0">
            <UserCheck size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-extrabold text-indigo-900">Are you a volunteer?</h3>
            <p className="text-[12px] text-indigo-700/80 mt-0.5">
              Log in to record evaluations for the stalls you are assigned to. The
              information above is shown to anyone with this QR code — login is only
              required for grading.
            </p>
            <Link
              href={`/?next=/scan`}
              className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              <LogIn size={14} />
              Volunteer Login
            </Link>
          </div>
        </section>

        <footer className="text-center text-[10px] text-slate-400 pt-2 pb-6">
          Powered by Edunura Events • Report generated {fmtDate(registration?.registeredAt)}
        </footer>
      </main>
    </div>
  )
}

function Stat({
  label,
  value,
  valueClassName,
  small,
}: {
  label: string
  value: any
  valueClassName?: string
  small?: boolean
}) {
  return (
    <div className="rounded-xl bg-slate-50/80 border border-slate-100 px-3 py-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div
        className={`mt-0.5 font-extrabold text-slate-800 ${valueClassName || ''} ${
          small ? 'text-xs' : 'text-sm'
        } truncate`}
      >
        {value}
      </div>
    </div>
  )
}

// Mask a roll number so it isn't fully exposed in the public view (e.g.,
// "EDU-1234" → "EDU-****1234"). The last 4 chars stay visible for sanity
// confirmation; the rest is hidden. Returns the input unchanged if it
// doesn't have at least 4 trailing digits/letters.
function maskRollNumber(roll: any): string {
  if (!roll) return '-'
  const s = String(roll)
  if (s.length <= 4) return s
  // Keep the prefix up to the first dash (e.g. "EDU-"), then mask the body
  // and show only the last 4 characters.
  const dashIdx = s.indexOf('-')
  if (dashIdx >= 0 && dashIdx < s.length - 5) {
    const prefix = s.slice(0, dashIdx + 1)
    const body = s.slice(dashIdx + 1)
    if (body.length <= 4) return s
    return `${prefix}****${body.slice(-4)}`
  }
  // No dash — mask everything except the last 4 characters
  return `****${s.slice(-4)}`
}
