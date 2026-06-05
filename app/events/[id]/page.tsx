'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/DashboardLayout';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  Calendar, Users, ArrowLeft, Plus, X, Link2, UserPlus,
  CheckCircle2, Clock, AlertCircle, ShoppingBag, UserCheck,
  BarChart3, TrendingUp, FileText, Search, QrCode, Pencil,
  Star, Send, Award, Trash2, Printer, FileImage
} from 'lucide-react';
import QRCode from 'qrcode';

interface EventDetail {
  id: string;
  code: string;
  name: string;
  date: string;
  endDate?: string;
  status: string;
  description?: string;
  community: { name: string; location: string };
  organizer: { name: string };
  letterhead?: {
    id: string;
    name: string;
    filePath: string;
    mimeType: string;
    cropX: number;
    cropY: number;
    cropW: number;
    cropH: number;
    imageW: number;
    imageH: number;
    isActive: boolean;
  } | null;
  stalls: Array<{ id: string; code: string; name: string; status: string }>;
  assignments: Array<{
    id: string;
    volunteer: { id: string; name: string; role: string; email: string };
    stall: { id: string; name: string };
  }>;
  _count: { registrations: number };
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'stalls' | 'volunteers' | 'registrations' | 'analytics' | 'template'>('registrations');
  const [userRole, setUserRole] = useState<string>('');
  const [isAssignedVolunteer, setIsAssignedVolunteer] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.user?.role) {
          setUserRole(data.user.role);
          // Check if this volunteer is assigned to this event
          if (['VOLUNTEER', 'LEAD_EVALUATOR', 'COORDINATOR'].includes(data.user.role)) {
            fetch(`/api/volunteer/assignments?eventId=${eventId}`)
              .then(r => r.ok ? r.json() : null)
              .then(d => {
                if (d?.assignments?.some((a: any) => a.eventId === eventId)) {
                  setIsAssignedVolunteer(true);
                }
              })
              .catch(console.error);
          }
        }
      })
      .catch(console.error);
  }, [eventId]);

  const canManageEvent = userRole === 'ADMIN' || userRole === 'MANAGER';
  const canRegisterStudents = canManageEvent || isAssignedVolunteer;

  // Registrations tab state
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<string | null>(null);
  // Student report modal — inline evaluate/edit state
  const [reportEvalStall, setReportEvalStall] = useState<string | null>(null); // stallId being evaluated
  const [reportEvalMode, setReportEvalMode] = useState<'new' | 'edit'>('new');
  const [reportEvalScore, setReportEvalScore] = useState(8);
  const [reportEvalGrade, setReportEvalGrade] = useState('A');
  const [reportEvalRemarks, setReportEvalRemarks] = useState('');
  const [reportEvalLoading, setReportEvalLoading] = useState(false);
  const [reportEvalError, setReportEvalError] = useState('');
  const [reportEvalSuccess, setReportEvalSuccess] = useState('');
  const [regSearch, setRegSearch] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // Analytics tab state
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Quick Register modal state
  const [showQuickReg, setShowQuickReg] = useState(false);
  const [qrForm, setQrForm] = useState({ rollNumber: '', name: '', grade: '', age: '', email: '', phoneNumber: '', parentName: '' });
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState('');
  const [qrSuccess, setQrSuccess] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedRegForQr, setSelectedRegForQr] = useState<any | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ studentId: '', rollNumber: '', name: '', grade: '', age: '', email: '', phoneNumber: '', parentName: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [availableStalls, setAvailableStalls] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [availableVolunteers, setAvailableVolunteers] = useState<Array<{ id: string; name: string; role: string; email: string }>>([]);

  // Template tab state
  const [availableLetterheads, setAvailableLetterheads] = useState<any[] | null>(null);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateMessage, setTemplateMessage] = useState('');
  
  // Modal states
  const [showLinkStall, setShowLinkStall] = useState(false);
  const [showAssignVolunteer, setShowAssignVolunteer] = useState(false);
  const [selectedStall, setSelectedStall] = useState('');
  const [selectedVolunteer, setSelectedVolunteer] = useState('');
  const [selectedVolunteerStall, setSelectedVolunteerStall] = useState('');
  // For assigning volunteer directly from a stall card
  const [assigningForStall, setAssigningForStall] = useState<{ id: string; name: string } | null>(null);

  const getComputedStatus = (dateStr: string, dbStatus?: string) => {
    if (dbStatus === 'CANCELLED') return 'CANCELLED';
    const eventDate = new Date(dateStr);
    const today = new Date();
    
    const dEvent = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate()).getTime();
    const dToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    
    if (dEvent < dToday) {
      return 'COMPLETED';
    } else if (dEvent === dToday) {
      return 'LIVE';
    } else {
      return 'UPCOMING';
    }
  };

  const fetchEvent = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}`);
      if (res.ok) {
        const data = await res.json();
        const computed = {
          ...data.event,
          status: getComputedStatus(data.event.date, data.event.status)
        };
        setEvent(computed);
      }
    } catch (error) {
      console.error('Failed to fetch event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchResources = async () => {
    try {
      const res = await fetch('/api/events/resources');
      if (res.ok) {
        const data = await res.json();
        setAvailableStalls(data.stalls);
        setAvailableVolunteers(data.volunteers);
      }
    } catch (error) {
      console.error('Failed to fetch resources:', error);
    }
  };

  useEffect(() => {
    fetchEvent();
    fetchResources();
  }, [eventId]);

  // Load registrations on mount when default tab is registrations
  useEffect(() => {
    if (activeTab === 'registrations' && registrations.length === 0 && event) {
      setRegLoading(true);
      fetch(`/api/events/${eventId}/registrations`)
        .then(r => r.json())
        .then(d => setRegistrations(d.registrations || []))
        .finally(() => setRegLoading(false));
    }
  }, [activeTab, event, eventId, registrations.length]);

  const handleLinkStall = async () => {
    if (!selectedStall) return;
    try {
      const res = await fetch(`/api/events/${eventId}/stalls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stallId: selectedStall }),
      });
      if (res.ok) {
        setShowLinkStall(false);
        setSelectedStall('');
        fetchEvent();
        fetchResources();
      }
    } catch (error) {
      console.error('Failed to link stall:', error);
    }
  };

  const handleUnlinkStall = async (stallId: string) => {
    if (!confirm('Remove this stall from the event?')) return;
    try {
      const res = await fetch(`/api/events/${eventId}/stalls?stallId=${stallId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchEvent();
        fetchResources();
      }
    } catch (error) {
      console.error('Failed to unlink stall:', error);
    }
  };

  const handleAssignVolunteer = async () => {
    const stallId = assigningForStall?.id || selectedVolunteerStall;
    if (!selectedVolunteer || !stallId) return;
    try {
      const res = await fetch(`/api/events/${eventId}/volunteers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volunteerId: selectedVolunteer, stallId }),
      });
      if (res.ok) {
        setShowAssignVolunteer(false);
        setAssigningForStall(null);
        setSelectedVolunteer('');
        setSelectedVolunteerStall('');
        fetchEvent();
        fetchResources();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to assign volunteer');
      }
    } catch (error) {
      console.error('Failed to assign volunteer:', error);
    }
  };

  const handleRemoveVolunteer = async (assignmentId: string) => {
    if (!confirm('Remove this volunteer from the event?')) return;
    try {
      const res = await fetch(`/api/events/${eventId}/volunteers?assignmentId=${assignmentId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchEvent();
        fetchResources();
      }
    } catch (error) {
      console.error('Failed to remove volunteer:', error);
    }
  };

  const openAssignForStall = (stall: { id: string; name: string }) => {
    setAssigningForStall(stall);
    setSelectedVolunteer('');
    setShowAssignVolunteer(true);
  };

  // Derive a 3-4 char community code from community name
  const getCommunityCode = (name: string): string => {
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return words[0].slice(0, 4).toUpperCase();
    const acronym = words.map(w => w[0]).join('').toUpperCase();
    return acronym.length <= 4 ? acronym : words[0].slice(0, 3).toUpperCase();
  };

  // Open quick register modal and auto-fetch the next roll number
  const openQuickReg = async () => {
    const code = getCommunityCode(event?.community?.name || 'EDU');
    const prefix = `EDU-${code}`;
    setQrForm({ rollNumber: `${prefix}-....`, name: '', grade: '', age: '', email: '', phoneNumber: '', parentName: '' });
    setQrError('');
    setQrSuccess('');
    setShowQuickReg(true);
    try {
      const res = await fetch(`/api/events/${eventId}/registrations?action=nextRoll&prefix=${encodeURIComponent(prefix)}`);
      const data = await res.json();
      setQrForm(f => ({ ...f, rollNumber: data.rollNumber }));
    } catch {
      setQrForm(f => ({ ...f, rollNumber: prefix + '-0001' }));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'LIVE': return <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>Live</span>;
      case 'UPCOMING': return <span className="flex items-center gap-1.5 bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"><Clock className="w-3 h-3" />Upcoming</span>;
      case 'COMPLETED': return <span className="flex items-center gap-1.5 bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"><CheckCircle2 className="w-3 h-3" />Completed</span>;
      case 'CANCELLED': return <span className="flex items-center gap-1.5 bg-rose-50 text-rose-600 border border-rose-100 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"><AlertCircle className="w-3 h-3" />Cancelled</span>;
      default: return null;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const matchesSearch = (r: any): boolean => {
    if (!regSearch) return true;
    const term = regSearch.trim().toLowerCase();
    if (!term) return true;

    // 1. Check student name
    if (r.student.name.toLowerCase().includes(term)) return true;

    // 2. Check parent/guardian name
    if (r.student.parentName && r.student.parentName.toLowerCase().includes(term)) return true;

    // 3. Check grade
    if (r.student.grade.toLowerCase().includes(term)) return true;

    // 4. Check roll number (either partial string match or exact sequential number match)
    if (r.student.rollNumber.toLowerCase().includes(term)) return true;

    // 5. Check if search term is numeric and matches the roll number sequence number
    const rollMatch = r.student.rollNumber.match(/-(\d+)$/);
    if (rollMatch) {
      const rollSuffix = rollMatch[1]; // e.g. "0001"
      const rollNumberVal = parseInt(rollSuffix, 10).toString(); // e.g. "1"
      
      const isTermNumeric = /^\d+$/.test(term);
      if (isTermNumeric) {
        const termVal = parseInt(term, 10).toString();
        if (rollNumberVal === termVal) {
          return true;
        }
      }
    }

    return false;
  };

  const openQrModal = (reg: any) => {
    setSelectedRegForQr(reg);
    setShowQrModal(true);
    setQrCodeDataUrl('');
    
    const scanUrl = `${window.location.origin}/scan/${reg.registrationCode}`;
    QRCode.toDataURL(scanUrl, { width: 300, margin: 2 }, (err, url) => {
      if (err) console.error(err);
      if (url) {
        setQrCodeDataUrl(url);
      }
    });
  };

  const openEditModal = (reg: any) => {
    setEditForm({
      studentId: reg.student.id || reg.studentId,
      rollNumber: reg.student.rollNumber,
      name: reg.student.name,
      grade: reg.student.grade,
      age: reg.student.age !== undefined && reg.student.age !== null ? reg.student.age.toString() : '',
      email: reg.student.email || '',
      phoneNumber: reg.student.phoneNumber || '',
      parentName: reg.student.parentName || '',
    });
    setEditError('');
    setShowEditModal(true);
  };

  const handleDeleteRegistration = async (registrationId: string) => {
    if (!confirm('Are you sure you want to delete this registration? This will remove all associated stall visits and scores.')) return;
    try {
      const res = await fetch(`/api/events/${eventId}/registrations`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId }),
      });
      if (!res.ok) {
        const error = await res.json();
        alert(error.error || 'Failed to delete registration');
        return;
      }
      // Remove from local state
      setRegistrations(prev => prev.filter(r => r.id !== registrationId));
      // Update event count
      setEvent((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          _count: {
            ...prev._count,
            registrations: Math.max(0, prev._count.registrations - 1)
          }
        };
      });
      // Update analytics if loaded
      setAnalytics((prev: any) => {
        if (!prev) return prev;
        const totalRegs = Math.max(0, prev.summary.totalRegs - 1);
        return {
          ...prev,
          summary: {
            ...prev.summary,
            totalRegs,
          }
        };
      });
    } catch (error) {
      console.error('Failed to delete registration:', error);
      alert('Failed to delete registration');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Event Details" subtitle="Loading...">
        <div className="text-center py-12 text-slate-500">Loading event details...</div>
      </DashboardLayout>
    );
  }

  if (!event) {
    return (
      <DashboardLayout title="Event Details" subtitle="Event not found">
        <div className="text-center py-12 text-slate-500">Event not found.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title={event.name}
      subtitle={`${event.code} • ${event.community.name}`}
      headerAction={
        <button onClick={() => router.push('/events')} className="flex items-center gap-1.5 bg-white border border-slate-200/80 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 shadow-sm hover:border-slate-300 hover:shadow-md transition-all">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Events</span>
        </button>
      }
    >
      {/* Event Overview Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {getStatusBadge(event.status)}
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">{event.code}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{event.name}</h1>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Calendar className="w-4 h-4" />
            {formatDate(event.date)}
            {event.endDate && ` - ${formatDate(event.endDate)}`}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Community</p>
            <p className="text-sm font-bold text-slate-800">{event.community.name}</p>
            <p className="text-[10px] text-slate-500">{event.community.location}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Organizer</p>
            <p className="text-sm font-bold text-slate-800">{event.organizer.name}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Registrations</p>
            <p className="text-sm font-bold text-slate-800">{event._count.registrations}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Stalls</p>
            <p className="text-sm font-bold text-slate-800">{event.stalls.length}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Volunteers</p>
            <p className="text-sm font-bold text-slate-800">{event.assignments?.length || 0}</p>
          </div>
        </div>

        {event.description && (
          <div className="text-sm text-slate-600 leading-relaxed">
            {event.description}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
        {(['overview', ...(canManageEvent ? ['stalls', 'volunteers', 'analytics', 'template'] as const : []), 'registrations'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              if (tab === 'registrations' && registrations.length === 0) {
                setRegLoading(true);
                fetch(`/api/events/${eventId}/registrations`)
                  .then(r => r.json())
                  .then(d => setRegistrations(d.registrations || []))
                  .finally(() => setRegLoading(false));
              }
              if (tab === 'analytics' && !analytics) {
                setAnalyticsLoading(true);
                fetch(`/api/events/${eventId}/analytics`)
                  .then(r => r.json())
                  .then(d => setAnalytics(d))
                  .finally(() => setAnalyticsLoading(false));
              }
              if (tab === 'template' && !availableLetterheads) {
                fetch('/api/letterheads')
                  .then(r => r.ok ? r.json() : null)
                  .then(d => setAvailableLetterheads(d?.letterheads || []))
                  .catch(() => {});
              }
            }}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab === 'overview' && 'Overview'}
            {tab === 'stalls' && `Stalls (${event.stalls.length})`}
            {tab === 'volunteers' && `Volunteers (${event.assignments.length})`}
            {tab === 'registrations' && `Registrations (${event._count.registrations})`}
            {tab === 'analytics' && 'Analytics'}
            {tab === 'template' && 'Template'}
          </button>
        ))}
      </div>

      {/* ===== OVERVIEW TAB ===== */}
      {activeTab === 'overview' && (
        <div className="space-y-4">

          {/* Quick Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-800 leading-none">{event.stalls.length}</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Stalls Linked</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                <UserCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-800 leading-none">{event.assignments.length}</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Staff Assigned</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-800 leading-none">{event._count.registrations}</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Registered</p>
              </div>
            </div>
          </div>

          {/* Stalls + Staff Overview */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">Stalls &amp; Assigned Staff</h3>
              {canManageEvent && (
                <button onClick={() => setActiveTab('stalls')} className="text-[10px] font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1">
                  Manage Stalls →
                </button>
              )}
            </div>

            {event.stalls.length === 0 ? (
              <div className="py-10 text-center">
                <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                <p className="text-sm text-slate-400 font-medium">No stalls linked to this event yet.</p>
                {canManageEvent && (
                  <button onClick={() => setActiveTab('stalls')} className="mt-3 text-xs font-bold text-violet-600 hover:text-violet-700">
                    + Link a Stall
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {event.stalls.map((stall, idx) => {
                  const stallVolunteers = event.assignments.filter(a => a.stall.id === stall.id);
                  const colors = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];
                  const accentColor = colors[idx % colors.length];
                  return (
                    <div key={stall.id} className="p-4 hover:bg-slate-50/60 transition-colors">
                      <div className="flex items-center gap-3">
                        {/* Stall color accent + icon */}
                        <div className={`w-1 self-stretch rounded-full ${accentColor} shrink-0`} />
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          <ShoppingBag className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-sm font-bold text-slate-800">{stall.name}</p>
                            <span className="text-[9px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">{stall.code}</span>
                            <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${stall.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : stall.status === 'MAINTENANCE' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                              {stall.status}
                            </span>
                          </div>

                          {/* Staff pills */}
                          {stallVolunteers.length === 0 ? (
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-400 italic">No staff assigned</span>
                              {canManageEvent && (
                                <button
                                  onClick={() => { setActiveTab('stalls'); }}
                                  className="text-[10px] font-bold text-violet-500 hover:text-violet-700"
                                >
                                  + Assign
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {stallVolunteers.map(a => (
                                <div
                                  key={a.id}
                                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 rounded-full pl-1 pr-2.5 py-1 transition-colors"
                                  title={`${a.volunteer.role.replace(/_/g, ' ')} · ${a.volunteer.email}`}
                                >
                                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                                    {a.volunteer.name.charAt(0)}
                                  </div>
                                  <span className="text-[11px] font-semibold text-slate-700">{a.volunteer.name}</span>
                                </div>
                              ))}
                              <button
                                onClick={() => openAssignForStall(stall)}
                                className="flex items-center gap-1 text-[10px] font-bold text-violet-500 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-full px-2.5 py-1 transition-colors"
                              >
                                <UserPlus className="w-2.5 h-2.5" />
                                Add
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== STALLS TAB ===== */}
      {activeTab === 'stalls' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">
              {event.stalls.length} stall{event.stalls.length !== 1 ? 's' : ''} linked to this event
            </p>
            {canManageEvent && (
              <button
                onClick={() => { setSelectedStall(''); setShowLinkStall(true); }}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              >
                <Link2 className="w-3.5 h-3.5" />
                Link Stall
              </button>
            )}
          </div>

          {event.stalls.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200/80 p-10 text-center">
              <ShoppingBag className="w-10 h-10 mx-auto mb-3 text-slate-200" />
              <p className="text-sm font-semibold text-slate-500 mb-1">No stalls linked</p>
              <p className="text-xs text-slate-400 mb-4">Link stalls to this event to start assigning volunteers</p>
              {canManageEvent && (
                <button
                  onClick={() => setShowLinkStall(true)}
                  className="inline-flex items-center gap-1.5 bg-violet-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-violet-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Link a Stall
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {event.stalls.map(stall => {
                const stallVolunteers = event.assignments.filter(a => a.stall.id === stall.id);
                return (
                  <div key={stall.id} className="bg-white rounded-xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden flex flex-col">
                    {/* Stall Header */}
                    <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                        <ShoppingBag className="w-5 h-5 text-violet-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{stall.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{stall.code}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${stall.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : stall.status === 'MAINTENANCE' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                          {stall.status}
                        </span>
                        {canManageEvent && (
                          <button
                            onClick={() => handleUnlinkStall(stall.id)}
                            title="Unlink stall from event"
                            className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Assigned Volunteers on this stall */}
                    <div className="p-3 flex-1 flex flex-col">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Assigned Staff ({stallVolunteers.length})
                        </p>
                        <button
                          onClick={() => openAssignForStall(stall)}
                          className="flex items-center gap-1 text-[10px] font-bold text-violet-600 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 px-2 py-1 rounded-md transition-colors"
                        >
                          <UserPlus className="w-3 h-3" />
                          Assign
                        </button>
                      </div>

                      {stallVolunteers.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center py-4">
                          <div className="text-center">
                            <UserCheck className="w-6 h-6 mx-auto mb-1 text-slate-200" />
                            <p className="text-[11px] text-slate-400">No staff assigned yet</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {stallVolunteers.map(a => (
                            <div key={a.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg group">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0 text-[9px] font-bold text-white">
                                {a.volunteer.name.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-bold text-slate-700 truncate">{a.volunteer.name}</p>
                                <p className="text-[9px] text-slate-400">{a.volunteer.role.replace(/_/g, ' ')}</p>
                              </div>
                              {canManageEvent && (
                                <button
                                  onClick={() => handleRemoveVolunteer(a.id)}
                                  title="Remove volunteer"
                                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-rose-500 rounded transition-all"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===== VOLUNTEERS TAB ===== */}
      {activeTab === 'volunteers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">
              {event.assignments.length} volunteer{event.assignments.length !== 1 ? 's' : ''} assigned to this event
            </p>
            {canManageEvent && (
              <button
                onClick={() => { setAssigningForStall(null); setSelectedVolunteer(''); setSelectedVolunteerStall(''); setShowAssignVolunteer(true); }}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Assign Volunteer
              </button>
            )}
          </div>

          {event.assignments.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200/80 p-10 text-center">
              <Users className="w-10 h-10 mx-auto mb-3 text-slate-200" />
              <p className="text-sm font-semibold text-slate-500 mb-1">No volunteers assigned</p>
              <p className="text-xs text-slate-400 mb-4">Assign volunteers to stalls for this event</p>
              {canManageEvent && (
                <button
                  onClick={() => { setAssigningForStall(null); setShowAssignVolunteer(true); }}
                  className="inline-flex items-center gap-1.5 bg-violet-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-violet-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Assign Volunteer
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {event.stalls.map(stall => {
                const stallVolunteers = event.assignments.filter(a => a.stall.id === stall.id);
                if (stallVolunteers.length === 0) return null;
                return (
                  <div key={stall.id} className="bg-white rounded-xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                      <ShoppingBag className="w-3.5 h-3.5 text-violet-500" />
                      <span className="text-xs font-bold text-slate-700">{stall.name}</span>
                      <button
                        onClick={() => openAssignForStall(stall)}
                        className="ml-2 flex items-center gap-1 text-[10px] font-bold text-violet-600 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 px-2 py-0.5 rounded-md transition-colors"
                      >
                        <UserPlus className="w-2.5 h-2.5" />
                        Assign
                      </button>
                      <span className="ml-auto text-[10px] text-slate-400 font-medium">{stallVolunteers.length} assigned</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {stallVolunteers.map(a => (
                        <div key={a.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors group">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0 text-sm font-bold text-white shadow-sm">
                              {a.volunteer.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{a.volunteer.name}</p>
                              <p className="text-[10px] text-slate-500">
                                {a.volunteer.email} • <span className="text-violet-600 font-semibold">{a.volunteer.role.replace(/_/g, ' ')}</span>
                              </p>
                            </div>
                          </div>
                          {canManageEvent && (
                            <button
                              onClick={() => handleRemoveVolunteer(a.id)}
                              title="Unlink volunteer from event"
                              className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 hover:text-rose-500 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <X className="w-3 h-3" />
                              Unlink
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===== LINK STALL MODAL ===== */}
      {showLinkStall && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Link Stall to Event</h2>
              <button onClick={() => setShowLinkStall(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {availableStalls.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No available stalls to link. All stalls are already linked or none exist.</p>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Select Stall</label>
                    <select
                      value={selectedStall}
                      onChange={(e) => setSelectedStall(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-slate-800"
                    >
                      <option value="">Choose a stall...</option>
                      {availableStalls.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setShowLinkStall(false)} className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
                    <button onClick={handleLinkStall} disabled={!selectedStall} className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed">Link Stall</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== ASSIGN VOLUNTEER MODAL ===== */}
      {showAssignVolunteer && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Assign Volunteer</h2>
                {assigningForStall && (
                  <p className="text-[11px] text-violet-600 font-semibold mt-0.5">Stall: {assigningForStall.name}</p>
                )}
              </div>
              <button
                onClick={() => { setShowAssignVolunteer(false); setAssigningForStall(null); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {availableVolunteers.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No available volunteers.</p>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Select Volunteer</label>
                    <select
                      value={selectedVolunteer}
                      onChange={(e) => setSelectedVolunteer(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-slate-800"
                    >
                      <option value="">Choose a volunteer...</option>
                      {availableVolunteers.map(v => (
                        <option key={v.id} value={v.id}>{v.name} — {v.role.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>

                  {!assigningForStall && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-bold text-slate-700">Assign to Stall</label>
                      {event.stalls.length === 0 ? (
                        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg p-3">No stalls linked to this event yet. Link a stall first.</p>
                      ) : (
                        <select
                          value={selectedVolunteerStall}
                          onChange={(e) => setSelectedVolunteerStall(e.target.value)}
                          className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-slate-800"
                        >
                          <option value="">Choose a stall...</option>
                          {event.stalls.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => { setShowAssignVolunteer(false); setAssigningForStall(null); }}
                      className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAssignVolunteer}
                      disabled={!selectedVolunteer || (!assigningForStall && !selectedVolunteerStall)}
                      className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      Assign
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== REGISTRATIONS TAB ===== */}
      {activeTab === 'registrations' && (
        <div className="space-y-4">
          {/* Search + Quick Register */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, roll number or grade..."
                value={regSearch}
                onChange={e => setRegSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
              />
            </div>
            {canRegisterStudents && (
              <button
                onClick={openQuickReg}
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Quick Register
              </button>
            )}
          </div>

          {regLoading ? (
            <div className="bg-white rounded-xl border border-slate-200/80 p-10 text-center text-slate-400 text-sm">Loading registrations...</div>
          ) : registrations.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200/80 p-10 text-center">
              <FileText className="w-10 h-10 mx-auto mb-3 text-slate-200" />
              <p className="text-sm font-semibold text-slate-400 mb-1">No registrations yet</p>
              <p className="text-xs text-slate-400 mb-4">Register your first student for this event</p>
              {canRegisterStudents && (
                <button
                  onClick={openQuickReg}
                  className="inline-flex items-center gap-1.5 bg-violet-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-violet-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Quick Register
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">All Registrations</h3>
                <span className="text-[11px] text-slate-400 font-medium">
                  {registrations.filter(matchesSearch).length} of {registrations.length}
                </span>
              </div>
              <div className="divide-y divide-slate-100 overflow-x-auto">
                {registrations
                  .filter(matchesSearch)
                  .map((reg: any) => {
                    const statusColors: Record<string, string> = {
                      COMPLETED: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                      IN_PROGRESS: 'bg-blue-50 text-blue-600 border-blue-100',
                      REGISTERED: 'bg-slate-100 text-slate-500 border-slate-200',
                    };
                    return (
                      <div key={reg.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/60 transition-colors min-w-[640px]">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-sm font-bold text-white shrink-0">
                          {reg.student.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <button 
                            onClick={() => setSelectedStudentForReport(reg.registrationCode)}
                            className="text-sm font-bold text-slate-800 truncate hover:text-violet-600 hover:underline transition-colors cursor-pointer text-left block w-full"
                          >
                            {reg.student.name}
                          </button>
                          <p className="text-[10px] text-slate-400">
                            <span className="font-mono">{reg.student.rollNumber}</span> • Grade {reg.student.grade}
                            {reg.student.age !== undefined && reg.student.age !== null && ` (${reg.student.age} yrs)`}
                            {reg.student.parentName && <span className="font-semibold text-slate-500"> • Guardian: {reg.student.parentName}</span>}
                          </p>
                        </div>
                        {/* Stall visit chips */}
                        <div className="hidden sm:flex items-center gap-1 flex-wrap justify-end max-w-[200px]">
                          {reg.stallVisits.map((sv: any) => (
                            <span
                              key={sv.id}
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                sv.performance ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'
                              }`}
                              title={sv.performance ? `Score: ${sv.performance.score} (${sv.performance.grade})` : 'Not scored'}
                            >
                              {sv.stall.name}
                            </span>
                          ))}
                          {reg.stallVisits.length === 0 && (
                            <span className="text-[10px] text-slate-400 italic">No visits</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 sticky right-0 bg-white pl-2 pr-1 z-10">
                          {canManageEvent && (
                            <>
                              <button
                                onClick={() => openEditModal(reg)}
                                title="Edit Student Details"
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50 transition-colors"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteRegistration(reg.id)}
                                title="Delete Registration"
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => openQrModal(reg)}
                            title="Show Registration QR Code"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50 transition-colors"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColors[reg.status] || ''}`}>
                            {reg.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== ANALYTICS TAB ===== */}
      {activeTab === 'analytics' && (
        <div className="space-y-5">
          {/* Link to full analytics */}
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl p-4 sm:p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold mb-0.5">Want deeper insights?</h3>
              <p className="text-violet-100 text-xs">View detailed stall breakdowns, student rankings, volunteer performance & more.</p>
            </div>
            <button
              onClick={() => router.push(`/events/${eventId}/analytics`)}
              className="flex items-center gap-2 bg-white text-violet-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-violet-50 transition-colors shadow-lg shrink-0 active:scale-[0.98]"
            >
              <BarChart3 className="w-4 h-4" />
              View Full Analytics
            </button>
          </div>

          {analyticsLoading || !analytics ? (
            <div className="bg-white rounded-xl border border-slate-200/80 p-10 text-center text-slate-400 text-sm">
              {analyticsLoading ? 'Loading analytics...' : 'No analytics data available.'}
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total Registered', value: analytics.summary.totalRegs, icon: <FileText className="w-4 h-4" />, color: 'text-violet-600 bg-violet-50' },
                  { label: 'Completed', value: analytics.summary.completedRegs, icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-emerald-600 bg-emerald-50' },
                  { label: 'In Progress', value: analytics.summary.inProgressRegs, icon: <Clock className="w-4 h-4" />, color: 'text-blue-600 bg-blue-50' },
                  { label: 'Completion Rate', value: `${analytics.summary.completionRate}%`, icon: <TrendingUp className="w-4 h-4" />, color: 'text-amber-600 bg-amber-50' },
                ].map(kpi => (
                  <div key={kpi.label} className="bg-white rounded-xl border border-slate-200/80 p-4 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${kpi.color}`}>
                      {kpi.icon}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-800 leading-none">{kpi.value}</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">{kpi.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Completion funnel + Status breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Registration Status Pie */}
                <div className="bg-white rounded-xl border border-slate-200/80 p-5">
                  <h3 className="text-sm font-bold text-slate-800 mb-4">Registration Status</h3>
                  {analytics.summary.totalRegs === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-6">No registrations yet</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={analytics.statusData}
                          dataKey="value"
                          nameKey="label"
                          cx="50%" cy="50%"
                          outerRadius={70}
                          innerRadius={40}
                          paddingAngle={3}
                        >
                          {analytics.statusData.map((entry: any, i: number) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: any) => [v, '']} />
                        <Legend iconType="circle" iconSize={8} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Score by Stall Bar Chart */}
                <div className="bg-white rounded-xl border border-slate-200/80 p-5">
                  <h3 className="text-sm font-bold text-slate-800 mb-4">Average Score by Stall</h3>
                  {analytics.scoreByStall.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-6">No scores recorded yet</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={analytics.scoreByStall} barSize={28}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <Tooltip
                          contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }}
                          cursor={{ fill: '#f8fafc' }}
                        />
                        <Bar dataKey="score" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Per-stall breakdown table */}
              {analytics.stallStats.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-800">Stall Performance Breakdown</h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {analytics.stallStats.map((s: any, i: number) => {
                      const pct = s.visits > 0 ? Math.round((s.completed / s.visits) * 100) : 0;
                      const barColors = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];
                      return (
                        <div key={i} className="px-5 py-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-sm font-bold text-slate-800">{s.name}</span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                              <span>{s.visits} visits</span>
                              <span className="text-emerald-600 font-bold">{s.completed} completed</span>
                              {s.avgScore !== null && (
                                <span className="bg-violet-50 text-violet-700 font-bold px-2 py-0.5 rounded-full">
                                  Avg {s.avgScore}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${barColors[i % barColors.length]} rounded-full transition-all duration-500`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">{pct}% completion rate</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Grade Distribution */}
              {Object.keys(analytics.gradeDistribution).length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200/80 p-5">
                  <h3 className="text-sm font-bold text-slate-800 mb-4">Grade Distribution</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(analytics.gradeDistribution)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([grade, count]: [string, any]) => {
                        const gradeColors: Record<string, string> = {
                          'A+': 'bg-emerald-100 text-emerald-700 border-emerald-200',
                          'A': 'bg-emerald-50 text-emerald-600 border-emerald-100',
                          'B': 'bg-blue-50 text-blue-600 border-blue-100',
                          'C': 'bg-amber-50 text-amber-600 border-amber-100',
                          'D': 'bg-rose-50 text-rose-500 border-rose-100',
                        };
                        return (
                          <div key={grade} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-bold ${gradeColors[grade] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                            <span className="text-lg font-extrabold">{grade}</span>
                            <span className="text-xs font-semibold opacity-70">{count} students</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ===== QUICK REGISTER MODAL ===== */}
      {showQuickReg && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Quick Register</h2>
                <p className="text-violet-200 text-[11px] mt-0.5">Register a student for <span className="font-bold">{event.name}</span></p>
              </div>
              <button
                onClick={() => setShowQuickReg(false)}
                className="p-1.5 rounded-lg text-violet-200 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Success banner */}
              {qrSuccess && (
                <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-3 text-sm font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {qrSuccess}
                </div>
              )}

              {/* Error banner */}
              {qrError && (
                <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg px-4 py-3 text-sm font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {qrError}
                </div>
              )}

              {/* Roll Number — auto-generated */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Roll Number <span className="text-slate-400 font-normal">(auto-generated)</span></label>
                <div className="flex gap-2 items-center">
                  <div className={`flex-1 flex items-center gap-2 px-3.5 py-2.5 text-sm rounded-lg border font-mono font-bold tracking-widest ${
                    qrForm.rollNumber.includes('....') 
                      ? 'bg-slate-50 border-slate-200 text-slate-400 animate-pulse' 
                      : 'bg-violet-50 border-violet-200 text-violet-700'
                  }`}>
                    {qrForm.rollNumber || '—'}
                  </div>
                  <button
                    type="button"
                    title="Regenerate roll number"
                    onClick={openQuickReg}
                    className="p-2.5 rounded-lg border border-slate-200 text-slate-400 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">Format: EDU-{getCommunityCode(event?.community?.name || 'EDU')}-XXXX</p>
              </div>

              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Full Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={qrForm.name}
                  onChange={e => { setQrForm(f => ({ ...f, name: e.target.value })); setQrError(''); setQrSuccess(''); }}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                />
              </div>

              {/* Parent / Guardian Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Parent / Guardian Name <span className="text-slate-400 font-normal">(optional)</span></label>
                <input
                  type="text"
                  value={qrForm.parentName}
                  onChange={e => setQrForm(f => ({ ...f, parentName: e.target.value }))}
                  placeholder="e.g. Ramesh Sharma"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                />
              </div>

              {/* Grade + Age + Phone in a row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Grade <span className="text-rose-500">*</span></label>
                  <select
                    value={qrForm.grade}
                    onChange={e => { setQrForm(f => ({ ...f, grade: e.target.value })); setQrError(''); setQrSuccess(''); }}
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-slate-800"
                  >
                    <option value="">Select...</option>
                    {['KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(g => (
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Age <span className="text-slate-400 font-normal">(optional)</span></label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={qrForm.age}
                    onChange={e => setQrForm(f => ({ ...f, age: e.target.value }))}
                    placeholder="e.g. 10"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Phone <span className="text-slate-400 font-normal">(optional)</span></label>
                  <input
                    type="tel"
                    value={qrForm.phoneNumber}
                    onChange={e => setQrForm(f => ({ ...f, phoneNumber: e.target.value }))}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Email <span className="text-slate-400 font-normal">(optional)</span></label>
                <input
                  type="email"
                  value={qrForm.email}
                  onChange={e => setQrForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="student@example.com"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowQuickReg(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!qrForm.rollNumber.trim() || !qrForm.name.trim() || !qrForm.grade) {
                      setQrError('Roll Number, Name, and Grade are required.');
                      return;
                    }
                    setQrLoading(true);
                    setQrError('');
                    setQrSuccess('');
                    try {
                      const res = await fetch(`/api/events/${eventId}/registrations`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(qrForm),
                      });
                      const data = await res.json();
                      if (!res.ok) {
                        setQrError(data.error || 'Registration failed.');
                      } else {
                        setRegistrations(prev => [data.registration, ...prev]);
                        
                        // Update registrations count card instantly
                        setEvent((prev: any) => {
                          if (!prev) return prev;
                          return {
                            ...prev,
                            _count: {
                              ...prev._count,
                              registrations: prev._count.registrations + 1
                            }
                          };
                        });

                        // Update analytics summary cards instantly if loaded
                        setAnalytics((prev: any) => {
                          if (!prev) return prev;
                          const totalRegs = prev.summary.totalRegs + 1;
                          const inProgressRegs = prev.summary.inProgressRegs + 1;
                          const completionRate = Math.round((prev.summary.completedRegs / totalRegs) * 100);
                          return {
                            ...prev,
                            summary: {
                              ...prev.summary,
                              totalRegs,
                              inProgressRegs,
                              completionRate
                            }
                          };
                        });

                        fetchEvent();
                        setShowQuickReg(false);
                      }
                    } catch {
                      setQrError('Something went wrong. Please try again.');
                    } finally {
                      setQrLoading(false);
                    }
                  }}
                  disabled={qrLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {qrLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Register Student
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== STUDENT QR CODE MODAL ===== */}
      {showQrModal && selectedRegForQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-sm w-full overflow-hidden animate-scale-up">
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-5 text-white relative">
              <button
                onClick={() => setShowQrModal(false)}
                className="absolute right-4 top-4 text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <h2 className="text-base font-bold">Student Scan Pass</h2>
              <p className="text-violet-100 text-[11px] mt-0.5">Registration badge & report card portal</p>
            </div>
            
            <div className="p-6 flex flex-col items-center text-center space-y-5">
              <div className="w-12 h-12 rounded-full bg-violet-50 flex items-center justify-center text-violet-600">
                <QrCode className="w-6 h-6 animate-pulse" />
              </div>
              
              <div>
                <h3 className="text-base font-bold text-slate-800">{selectedRegForQr.student.name}</h3>
                <p className="text-xs font-mono font-bold text-violet-600 mt-0.5">{selectedRegForQr.student.rollNumber}</p>
                <p className="text-[11px] text-slate-400 mt-1">Grade {selectedRegForQr.student.grade} {selectedRegForQr.student.parentName && `• Parent: ${selectedRegForQr.student.parentName}`}</p>
              </div>

              {/* QR Code Container */}
              <div className="relative bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center justify-center w-52 h-52 shrink-0 shadow-inner">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="Registration QR Code"
                    className="w-full h-full object-contain rounded-lg"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <div className="w-6 h-6 border-2 border-slate-300 border-t-violet-600 rounded-full animate-spin" />
                    <span className="text-[10px] font-semibold">Generating QR...</span>
                  </div>
                )}
              </div>

              <div className="w-full bg-slate-50 border border-slate-200/60 rounded-lg p-3 text-left space-y-1.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Scan Destination URL</span>
                <span className="text-[10px] font-mono text-slate-600 truncate block bg-white px-2 py-1 rounded border border-slate-100 select-all">
                  {`${window.location.origin}/scan/${selectedRegForQr.registrationCode}`}
                </span>
                <span className="text-[9px] text-slate-400 block italic leading-normal">
                  Allows parents to view the report card, and volunteers to scan & score the student.
                </span>
              </div>
              
              <button
                onClick={() => window.print()}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white py-2.5 rounded-lg text-xs font-semibold hover:bg-slate-900 transition-colors shadow-sm"
              >
                Print Pass Badge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== EDIT STUDENT MODAL ===== */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-sm w-full overflow-hidden animate-scale-up">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-5 text-white relative">
              <button
                onClick={() => setShowEditModal(false)}
                className="absolute right-4 top-4 text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <h2 className="text-base font-bold">Edit Student Details</h2>
              <p className="text-violet-100 text-[11px] mt-0.5">Modify information for <span className="font-mono font-bold">{editForm.rollNumber}</span></p>
            </div>
            
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {editError && (
                <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg px-4 py-3 text-sm font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {editError}
                </div>
              )}

              {/* Roll Number — read-only */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Roll Number <span className="text-slate-400 font-normal">(non-editable)</span></label>
                <div className="px-3.5 py-2.5 text-sm rounded-lg border bg-slate-50 border-slate-200 text-slate-400 font-mono font-bold tracking-widest select-none">
                  {editForm.rollNumber}
                </div>
              </div>

              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Full Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                />
              </div>

              {/* Parent / Guardian Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Parent / Guardian Name <span className="text-slate-400 font-normal">(optional)</span></label>
                <input
                  type="text"
                  value={editForm.parentName}
                  onChange={e => setEditForm(f => ({ ...f, parentName: e.target.value }))}
                  placeholder="e.g. Ramesh Sharma"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                />
              </div>

              {/* Grade + Age + Phone in a row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Grade <span className="text-rose-500">*</span></label>
                  <select
                    value={editForm.grade}
                    onChange={e => setEditForm(f => ({ ...f, grade: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-slate-800"
                  >
                    <option value="">Select...</option>
                    {['KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(g => (
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Age <span className="text-slate-400 font-normal">(optional)</span></label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={editForm.age}
                    onChange={e => setEditForm(f => ({ ...f, age: e.target.value }))}
                    placeholder="e.g. 10"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Phone <span className="text-slate-400 font-normal">(optional)</span></label>
                  <input
                    type="tel"
                    value={editForm.phoneNumber}
                    onChange={e => setEditForm(f => ({ ...f, phoneNumber: e.target.value }))}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Email <span className="text-slate-400 font-normal">(optional)</span></label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="student@example.com"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!editForm.name.trim() || !editForm.grade) {
                      setEditError('Name and Grade are required.');
                      return;
                    }
                    setEditLoading(true);
                    setEditError('');
                    try {
                      const res = await fetch(`/api/events/${eventId}/registrations`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(editForm),
                      });
                      const data = await res.json();
                      if (!res.ok) {
                        setEditError(data.error || 'Failed to update student details.');
                      } else {
                        // Update registrations list locally in place
                        setRegistrations(prev =>
                          prev.map(r => r.id === data.registration.id ? data.registration : r)
                        );
                        fetchEvent();
                        setShowEditModal(false);
                      }
                    } catch {
                      setEditError('Something went wrong. Please try again.');
                    } finally {
                      setEditLoading(false);
                    }
                  }}
                  disabled={editLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {editLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== STUDENT REPORT MODAL (Stall Cards) ===== */}
      {selectedStudentForReport && (() => {
        const reg = registrations.find((r: any) => r.registrationCode === selectedStudentForReport);
        if (!reg) return null;
        const visits = reg.stallVisits || [];
        const totalStalls = event?.stalls?.length || 0;
        const visitedCount = visits.filter((v: any) => v.performance).length;
        const totalScores = visits.reduce((acc: number, v: any) => acc + (v.performance ? v.performance.score : 0), 0);
        const avgScore = visitedCount > 0 ? (totalScores / visitedCount).toFixed(1) : '0.0';

        const handleEvalSubmit = async () => {
          if (!reportEvalStall) return;
          setReportEvalLoading(true);
          setReportEvalError('');
          setReportEvalSuccess('');
          try {
            const res = await fetch(`/api/scan/${reg.registrationCode}/rate`, {
              method: reportEvalMode === 'edit' ? 'PATCH' : 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                stallId: reportEvalStall,
                score: Number(reportEvalScore),
                grade: reportEvalGrade,
                remarks: reportEvalRemarks
              })
            });
            const data = await res.json();
            if (!res.ok) {
              setReportEvalError(data.error || 'Failed to submit.');
            } else {
              setReportEvalSuccess(reportEvalMode === 'edit' ? 'Evaluation updated!' : 'Evaluation submitted!');
              // Refresh registrations to get updated data
              const fetchRes = await fetch(`/api/events/${eventId}/registrations`);
              if (fetchRes.ok) {
                const d = await fetchRes.json();
                setRegistrations(d.registrations || []);
              }
              fetchEvent();
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col relative animate-fade-in border border-slate-700/20">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-4 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white text-lg font-extrabold shrink-0">
                    {reg.student.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-extrabold text-white truncate">{reg.student.name}</h2>
                    <p className="text-[10px] text-violet-200 font-semibold font-mono mt-0.5">
                      {reg.student.rollNumber} • Grade {reg.student.grade}
                      {reg.student.age !== undefined && reg.student.age !== null && ` (${reg.student.age} yrs)`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedStudentForReport(null); setReportEvalStall(null); setReportEvalError(''); setReportEvalSuccess(''); }}
                  className="p-1.5 rounded-lg text-violet-200 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 px-5 py-3 bg-white border-b border-slate-100 shrink-0">
              {[
                { label: 'Stalls', value: `${visitedCount} / ${totalStalls}`, color: 'text-violet-600' },
                { label: 'Avg Score', value: `${avgScore} / 10`, color: 'text-amber-600' },
                { label: 'Status', value: reg.status === 'COMPLETED' ? 'Completed' : reg.status === 'IN_PROGRESS' ? 'In Progress' : 'Registered', color: 'text-emerald-600' },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
                  <p className={`text-xs font-extrabold ${s.color} mt-0.5`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Stall cards — scrollable */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Activity Stalls</p>
              {(event?.stalls || []).map((stall: any) => {
                const visit = visits.find((v: any) => v.stall?.id === stall.id);
                const perf = visit?.performance;
                const isEvaluating = reportEvalStall === stall.id;

                return (
                  <div key={stall.id} className={`rounded-xl border overflow-hidden transition-all ${
                    perf
                      ? 'bg-white border-emerald-200/80 shadow-sm'
                      : 'bg-white border-slate-200/80 shadow-sm'
                  }`}>
                    {/* Stall card header */}
                    <div className={`px-4 py-3 flex items-center justify-between gap-3 ${
                      perf ? 'bg-emerald-50/60' : 'bg-slate-50/60'
                    }`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          perf
                            ? 'bg-emerald-100 text-emerald-600'
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          {perf ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{stall.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono uppercase">{stall.code}</p>
                        </div>
                      </div>

                      {perf ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-extrabold text-violet-700 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-lg font-mono">{perf.score}/10</span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg">Grade {perf.grade}</span>
                          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Evaluated</span>
                        </div>
                      ) : (
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">Pending</span>
                      )}
                    </div>

                    {/* Remarks (if evaluated and not in edit mode) */}
                    {perf && !isEvaluating && perf.remarks && (
                      <div className="px-4 py-2 border-t border-emerald-100">
                        <p className="text-[11px] text-slate-500 italic">"{perf.remarks}"</p>
                      </div>
                    )}

                    {/* Action buttons */}
                    {!isEvaluating && (
                      <div className="px-4 py-2.5 border-t border-slate-100 flex items-center justify-end gap-2">
                        {perf ? (
                          // Edit button — admin only
                          canManageEvent && (
                            <button
                              onClick={() => {
                                setReportEvalStall(stall.id);
                                setReportEvalMode('edit');
                                setReportEvalScore(perf.score);
                                setReportEvalGrade(perf.grade);
                                setReportEvalRemarks(perf.remarks || '');
                                setReportEvalError('');
                                setReportEvalSuccess('');
                              }}
                              className="flex items-center gap-1.5 text-[11px] font-bold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg border border-violet-100 transition-colors"
                            >
                              <Pencil className="w-3 h-3" />
                              Edit Evaluation
                            </button>
                          )
                        ) : (
                          // Evaluate button
                          <button
                            onClick={() => {
                              setReportEvalStall(stall.id);
                              setReportEvalMode('new');
                              setReportEvalScore(8);
                              setReportEvalGrade('A');
                              setReportEvalRemarks('');
                              setReportEvalError('');
                              setReportEvalSuccess('');
                            }}
                            className="flex items-center gap-1.5 text-[11px] font-bold text-white bg-violet-600 hover:bg-violet-700 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                          >
                            <Star className="w-3 h-3" />
                            Evaluate
                          </button>
                        )}
                      </div>
                    )}

                    {/* Inline evaluation form */}
                    {isEvaluating && (
                      <div className="px-4 py-4 border-t border-violet-100 bg-violet-50/30 space-y-3">
                        {reportEvalError && (
                          <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg px-3 py-2 text-[11px] font-semibold">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {reportEvalError}
                          </div>
                        )}
                        {reportEvalSuccess && (
                          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg px-3 py-2 text-[11px] font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            {reportEvalSuccess}
                          </div>
                        )}

                        {/* Score slider */}
                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <label className="text-[11px] font-bold text-slate-700">Score</label>
                            <span className="text-xs font-extrabold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-lg border border-violet-100 font-mono">{reportEvalScore} / 10</span>
                          </div>
                          <input
                            type="range" min="1" max="10" step="0.5"
                            value={reportEvalScore}
                            onChange={e => { setReportEvalScore(Number(e.target.value)); setReportEvalError(''); setReportEvalSuccess(''); }}
                            className="w-full accent-violet-600 h-2 bg-slate-100 rounded-lg cursor-pointer appearance-none"
                          />
                          <div className="flex justify-between text-[9px] text-slate-400 font-bold mt-1 px-0.5">
                            <span>1 (Poor)</span><span>5 (Avg)</span><span>10 (Best)</span>
                          </div>
                        </div>

                        {/* Grade dropdown */}
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">Grade</label>
                          <select
                            value={reportEvalGrade}
                            onChange={e => { setReportEvalGrade(e.target.value); setReportEvalError(''); setReportEvalSuccess(''); }}
                            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-800 font-semibold"
                          >
                            <option value="A+">A+ (Outstanding)</option>
                            <option value="A">A (Excellent)</option>
                            <option value="B">B (Good)</option>
                            <option value="C">C (Satisfactory)</option>
                            <option value="D">D (Needs Improvement)</option>
                            <option value="E">E (Unsatisfactory)</option>
                          </select>
                        </div>

                        {/* Remarks */}
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">Remarks <span className="font-normal text-slate-400">(optional)</span></label>
                          <textarea
                            rows={2}
                            value={reportEvalRemarks}
                            onChange={e => { setReportEvalRemarks(e.target.value); setReportEvalError(''); setReportEvalSuccess(''); }}
                            placeholder="e.g. Great creativity, quick learner..."
                            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-800 placeholder:text-slate-400"
                          />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setReportEvalStall(null); setReportEvalError(''); setReportEvalSuccess(''); }}
                            className="flex-1 px-3 py-2 text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleEvalSubmit}
                            disabled={reportEvalLoading}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-60 transition-colors"
                          >
                            {reportEvalLoading ? (
                              <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                            ) : (
                              <><Send className="w-3 h-3" /> {reportEvalMode === 'edit' ? 'Update' : 'Submit'}</>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {(event?.stalls || []).length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                  <p className="text-xs font-medium">No stalls linked to this event yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
        );
      })()}

      {/* ==================== TEMPLATE TAB ==================== */}
      {activeTab === 'template' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Report Template</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Pick the letterhead that will be used when printing report cards for this event.
                </p>
              </div>
              <a
                href="/settings/templates"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-violet-600 hover:text-violet-800 flex items-center gap-1"
              >
                Manage Templates →
              </a>
            </div>

            <div className="p-5 space-y-4">
              {templateMessage && (
                <div className={`text-xs font-semibold rounded-lg p-3 ${
                  templateMessage.startsWith('✓')
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    : 'bg-rose-50 border border-rose-200 text-rose-700'
                }`}>
                  {templateMessage}
                </div>
              )}

              {/* Current selection */}
              {event.letterhead ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div
                    className="relative shrink-0 shadow-sm border border-slate-200"
                    style={{
                      width: '80px',
                      aspectRatio: `${event.letterhead.imageW} / ${event.letterhead.imageH}`,
                      backgroundImage: `url(/api/letterheads/${event.letterhead.id}/file)`,
                      backgroundSize: '100% 100%',
                      backgroundRepeat: 'no-repeat',
                      backgroundColor: 'white',
                    }}
                  >
                    <div
                      className="absolute border-2 border-violet-500 bg-violet-500/10"
                      style={{
                        left: `${(event.letterhead.cropX / event.letterhead.imageW) * 100}%`,
                        top: `${(event.letterhead.cropY / event.letterhead.imageH) * 100}%`,
                        width: `${(event.letterhead.cropW / event.letterhead.imageW) * 100}%`,
                        height: `${(event.letterhead.cropH / event.letterhead.imageH) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-extrabold text-slate-800">{event.letterhead.name}</p>
                    <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                      {event.letterhead.imageW} × {event.letterhead.imageH}px · Crop {event.letterhead.cropW} × {event.letterhead.cropH}px
                    </p>
                    <p className="text-[11px] text-emerald-600 font-semibold mt-1">✓ Active for this event</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <a
                      href={`/api/events/${eventId}/test-print`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Test Print
                    </a>
                    <button
                      onClick={async () => {
                        setTemplateSaving(true);
                        setTemplateMessage('');
                        const res = await fetch(`/api/events/${eventId}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ letterheadId: null }),
                        });
                        if (res.ok) {
                          setTemplateMessage('✓ Template removed. Reports will print without background.');
                          fetchEvent();
                        } else {
                          const d = await res.json().catch(() => ({}));
                          setTemplateMessage(d.error || 'Failed to remove template');
                        }
                        setTemplateSaving(false);
                      }}
                      disabled={templateSaving}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                  <p className="text-xs font-semibold text-amber-800">No template assigned.</p>
                  <p className="text-[11px] text-amber-700 mt-1">Reports for this event will print without a background.</p>
                </div>
              )}

              {/* Picker */}
              {availableLetterheads === null ? (
                <div className="text-center py-4 text-slate-400 text-xs">Loading templates…</div>
              ) : availableLetterheads.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
                  <FileImage className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-semibold text-slate-500 mb-1">No templates uploaded yet</p>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Create your first A4 letterhead template to start printing branded reports.
                  </p>
                  <a
                    href="/settings/templates"
                    className="inline-flex items-center gap-1.5 bg-violet-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-violet-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Upload Template
                  </a>
                </div>
              ) : (
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Available Templates ({availableLetterheads.length})
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {availableLetterheads.map((lh: any) => {
                      const isCurrent = event.letterhead?.id === lh.id
                      return (
                        <button
                          key={lh.id}
                          onClick={async () => {
                            setTemplateSaving(true);
                            setTemplateMessage('');
                            const res = await fetch(`/api/events/${eventId}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ letterheadId: lh.id }),
                            });
                            if (res.ok) {
                              setTemplateMessage(`✓ Template set to "${lh.name}"`);
                              fetchEvent();
                            } else {
                              const d = await res.json().catch(() => ({}));
                              setTemplateMessage(d.error || 'Failed to set template');
                            }
                            setTemplateSaving(false);
                          }}
                          disabled={templateSaving}
                          className={`text-left rounded-xl border-2 p-2 transition-all relative ${
                            isCurrent
                              ? 'border-violet-500 bg-violet-50/50'
                              : 'border-slate-200 hover:border-violet-300 bg-white'
                          }`}
                        >
                          <div
                            className="relative bg-slate-100 rounded-md overflow-hidden"
                            style={{
                              width: '100%',
                              aspectRatio: `${lh.imageW} / ${lh.imageH}`,
                              backgroundImage: `url(/api/letterheads/${lh.id}/file)`,
                              backgroundSize: '100% 100%',
                              backgroundRepeat: 'no-repeat',
                            }}
                          >
                            <div
                              className="absolute border border-violet-500 bg-violet-500/20"
                              style={{
                                left: `${(lh.cropX / lh.imageW) * 100}%`,
                                top: `${(lh.cropY / lh.imageH) * 100}%`,
                                width: `${(lh.cropW / lh.imageW) * 100}%`,
                                height: `${(lh.cropH / lh.imageH) * 100}%`,
                              }}
                            />
                          </div>
                          <p className="text-[10px] font-bold text-slate-700 mt-1.5 truncate">{lh.name}</p>
                          <p className="text-[9px] font-mono text-slate-400">{lh.imageW}×{lh.imageH}</p>
                          {isCurrent && (
                            <div className="absolute top-1 right-1 bg-violet-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                              CURRENT
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
