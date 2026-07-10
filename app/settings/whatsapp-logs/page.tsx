'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/app/components/DashboardLayout'
import { 
  Search, Filter, RefreshCw, CheckCircle, XCircle, 
  Clock, FileText, ArrowRight, MessageSquare, AlertTriangle 
} from 'lucide-react'

interface WhatsAppLog {
  id: string
  eventId: string | null
  studentId: string | null
  phoneNumber: string
  status: 'SUCCESS' | 'FAILED'
  messageType: string
  errorMessage: string | null
  messageId: string | null
  createdAt: string
  event: { name: string } | null
  student: { name: string; rollNumber: string } | null
}

interface EventItem {
  id: string
  name: string
  code: string
}

export default function WhatsAppLogsPage() {
  const [logs, setLogs] = useState<WhatsAppLog[]>([])
  const [events, setEvents] = useState<EventItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({
    eventId: 'all',
    status: 'all',
    search: '',
  })

  // Load events for the filter dropdown
  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch('/api/events')
        if (res.ok) {
          const data = await res.json()
          if (data.events) {
            setEvents(data.events)
          }
        }
      } catch (err) {
        console.error('Failed to load events for filter:', err)
      }
    }
    loadEvents()
  }, [])

  // Load logs based on filters
  const loadLogs = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.eventId && filters.eventId !== 'all') {
        params.append('eventId', filters.eventId)
      }
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status)
      }
      if (filters.search) {
        params.append('search', filters.search)
      }

      const res = await fetch(`/api/whatsapp-logs?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs || [])
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [filters.eventId, filters.status])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    loadLogs()
  }

  return (
    <DashboardLayout
      title="WhatsApp Logs"
      subtitle="Audit and debug automated WhatsApp messages and ID card delivery statuses"
      headerAction={
        <button
          onClick={loadLogs}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 bg-[#121B45] hover:bg-[#1a255c] active:scale-[0.98] border border-[#1e274a] text-slate-300 font-semibold px-4 py-2.5 rounded-xl transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      }
    >
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Filters */}
        <div className="bg-[#0A0F2D] border border-[#1e274a] rounded-2xl p-5 shadow-xl">
          <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row items-center gap-4">
            {/* Search Input */}
            <div className="w-full lg:flex-1 relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Search className="w-5 h-5" />
              </span>
              <input
                type="text"
                placeholder="Search by phone, student name, or roll number..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full bg-[#121B45] border border-[#1e274a] focus:border-violet-500 text-slate-200 placeholder-slate-500 text-sm rounded-xl pl-11 pr-4 py-3 outline-none transition-all"
              />
              {filters.search && (
                <button
                  type="button"
                  onClick={() => {
                    setFilters({ ...filters, search: '' })
                    setTimeout(loadLogs, 0)
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Filter Controls */}
            <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center gap-4">
              {/* Event Filter */}
              <div className="w-full sm:w-64 relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Filter className="w-4 h-4" />
                </span>
                <select
                  value={filters.eventId}
                  onChange={(e) => setFilters({ ...filters, eventId: e.target.value })}
                  className="w-full bg-[#121B45] border border-[#1e274a] focus:border-violet-500 text-slate-200 text-sm rounded-xl pl-10 pr-8 py-3 outline-none appearance-none transition-all cursor-pointer"
                >
                  <option value="all">All Events</option>
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  ▼
                </span>
              </div>

              {/* Status Filter */}
              <div className="w-full sm:w-48 relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Filter className="w-4 h-4" />
                </span>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full bg-[#121B45] border border-[#1e274a] focus:border-violet-500 text-slate-200 text-sm rounded-xl pl-10 pr-8 py-3 outline-none appearance-none transition-all cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="SUCCESS">Success</option>
                  <option value="FAILED">Failed</option>
                </select>
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  ▼
                </span>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 active:scale-[0.98] text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg shadow-violet-600/20"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Logs Table / List */}
        <div className="bg-[#0A0F2D] border border-[#1e274a] rounded-2xl shadow-xl overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <RefreshCw className="w-8 h-8 text-violet-500 animate-spin" />
              <p className="text-slate-400 text-sm font-semibold">Fetching WhatsApp logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-[#1e274a] flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-white">No logs found</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm">
                No matching WhatsApp logs found for the selected filter combination. Try clearing your filters or testing registration messages.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1e274a] bg-black/20">
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Recipient</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Student Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Event</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Message Type</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Twilio SID / Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e274a] text-sm text-slate-300">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Date & Time */}
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span className="font-medium text-slate-200">
                            {new Date(log.createdAt).toLocaleString(undefined, {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Recipient */}
                      <td className="px-6 py-4.5 whitespace-nowrap font-semibold text-slate-200">
                        +{log.phoneNumber}
                      </td>

                      {/* Student Name */}
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        {log.student ? (
                          <div>
                            <p className="font-semibold text-white">{log.student.name}</p>
                            <p className="text-xs text-slate-500">{log.student.rollNumber}</p>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">No associated student</span>
                        )}
                      </td>

                      {/* Event */}
                      <td className="px-6 py-4.5 whitespace-nowrap text-slate-300">
                        {log.event?.name || <span className="text-slate-500 italic">Global System</span>}
                      </td>

                      {/* Message Type */}
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <span className="bg-[#121B45] text-violet-400 border border-violet-500/20 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                          {log.messageType.replace('TEMPLATE_', '')}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4.5 whitespace-nowrap text-center">
                        {log.status === 'SUCCESS' ? (
                          <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-xs font-bold">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Delivered</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-full text-xs font-bold">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Failed</span>
                          </span>
                        )}
                      </td>

                      {/* Twilio ID or Error */}
                      <td className="px-6 py-4.5 max-w-xs truncate">
                        {log.status === 'SUCCESS' ? (
                          <span className="text-xs text-slate-400 font-mono select-all">
                            {log.messageId || 'N/A'}
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5 text-rose-400 text-xs">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span className="font-medium whitespace-pre-wrap leading-tight">{log.errorMessage || 'Unknown sending error'}</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
