'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Calendar, MapPin, FileText, Hash, Plus, Link2, Trash2, Users, Star, Check, ChevronRight, Building2, User, Mail, Phone, Shield } from 'lucide-react';

type Tab = 'general' | 'stalls' | 'volunteers';

interface Community {
  id: string;
  name: string;
  code: string;
  location: string;
}

interface Stall {
  id: string;
  code: string;
  name: string;
  status: string;
}

interface Volunteer {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface Assignment {
  id?: string;
  volunteerId: string;
  stallId: string;
  volunteerName?: string;
  stallName?: string;
  volunteerEmail?: string;
}

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editEvent?: {
    id: string;
    code: string;
    name: string;
    communityId: string;
    date: string;
    endDate?: string;
    status: string;
    description?: string;
    stalls?: Array<{ id: string; code: string; name: string; status: string }> | null;
    assignments?: Array<{
      id: string;
      volunteer: { id: string; name: string; role: string; email: string };
      stall: { id: string; name: string };
    }> | null;
  } | null;
}

export default function EventFormModal({ isOpen, onClose, onSuccess, editEvent }: EventFormModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // General form data
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    communityId: '',
    date: '',
    endDate: '',
    status: 'UPCOMING',
    description: '',
  });

  // Resources
  const [communities, setCommunities] = useState<Community[]>([]);
  const [availableStalls, setAvailableStalls] = useState<Stall[]>([]);
  const [availableVolunteers, setAvailableVolunteers] = useState<Volunteer[]>([]);

  // Stalls state
  const [linkedStallIds, setLinkedStallIds] = useState<Set<string>>(new Set());
  const [originalLinkedStallIds, setOriginalLinkedStallIds] = useState<Set<string>>(new Set());
  const [showQuickStall, setShowQuickStall] = useState(false);
  const [quickStallName, setQuickStallName] = useState('');
  const [isCreatingStall, setIsCreatingStall] = useState(false);

  // Volunteers state
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [originalAssignments, setOriginalAssignments] = useState<Assignment[]>([]);
  const [showQuickVolunteer, setShowQuickVolunteer] = useState(false);
  const [quickVolunteer, setQuickVolunteer] = useState({ name: '', email: '', phone: '', role: 'VOLUNTEER' });
  const [isCreatingVolunteer, setIsCreatingVolunteer] = useState(false);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState('');
  const [selectedAssignmentStallId, setSelectedAssignmentStallId] = useState('');

  // Quick community state
  const [showQuickCommunity, setShowQuickCommunity] = useState(false);
  const [quickCommunity, setQuickCommunity] = useState({ code: '', name: '', location: '', zone: '', contactPerson: '', contactEmail: '', contactPhone: '' });
  const [isCreatingCommunity, setIsCreatingCommunity] = useState(false);

  const isEditing = !!editEvent?.id;

  // Reset and load data when modal opens
  useEffect(() => {
    if (!isOpen) return;

    setActiveTab('general');
    setError('');
    setLinkedStallIds(new Set());
    setOriginalLinkedStallIds(new Set());
    setAssignments([]);
    setOriginalAssignments([]);
    setShowQuickStall(false);
    setShowQuickVolunteer(false);
    setShowQuickCommunity(false);
    setQuickStallName('');
    setQuickVolunteer({ name: '', email: '', phone: '', role: 'VOLUNTEER' });
    setQuickCommunity({ code: '', name: '', location: '', zone: '', contactPerson: '', contactEmail: '', contactPhone: '' });

    if (editEvent) {
      setFormData({
        code: editEvent.code,
        name: editEvent.name,
        communityId: editEvent.communityId,
        date: editEvent.date ? new Date(editEvent.date).toISOString().split('T')[0] : '',
        endDate: editEvent.endDate ? new Date(editEvent.endDate).toISOString().split('T')[0] : '',
        status: editEvent.status,
        description: editEvent.description || '',
      });
      setLinkedStallIds(new Set(Array.isArray(editEvent.stalls) ? editEvent.stalls.map(s => s.id) : []));
      setAssignments(Array.isArray(editEvent.assignments) ? editEvent.assignments.map(a => ({
        id: a.id,
        volunteerId: a.volunteer.id,
        stallId: a.stall.id,
        volunteerName: a.volunteer.name,
        stallName: a.stall.name,
        volunteerEmail: a.volunteer.email,
      })) : []);
    } else {
      setFormData({ code: '', name: '', communityId: '', date: '', endDate: '', status: 'UPCOMING', description: '' });
    }

    // Fetch resources
    const loadResources = async () => {
      try {
        const [commRes, resRes] = await Promise.all([
          fetch('/api/communities/list'),
          fetch('/api/events/resources'),
        ]);
        const commData = await commRes.json();
        const resData = await resRes.json();
        setCommunities(commData.communities || []);
        setAvailableStalls(resData.stalls || []);
        setAvailableVolunteers(resData.volunteers || []);
      } catch {
        // silent fail
      }
    };

    // Always fetch full event data when editing (list view only provides summary counts)
    const loadFullEvent = async () => {
      if (editEvent?.id) {
        try {
          const res = await fetch(`/api/events/${editEvent.id}`);
          if (res.ok) {
            const data = await res.json();
            const event = data.event;
            const stallIds = new Set<string>(event.stalls?.map((s: any) => s.id as string) || []);
            const fetchedAssignments = event.assignments?.map((a: any) => ({
              id: a.id,
              volunteerId: a.volunteer.id,
              stallId: a.stall.id,
              volunteerName: a.volunteer.name,
              stallName: a.stall.name,
              volunteerEmail: a.volunteer.email,
            })) || [];
            setLinkedStallIds(stallIds);
            setOriginalLinkedStallIds(stallIds);
            setAssignments(fetchedAssignments);
            setOriginalAssignments(fetchedAssignments);
            // Also update available stalls to include linked ones
            setAvailableStalls(prev => {
              const existingIds = new Set(prev.map(s => s.id));
              const linked = event.stalls?.filter((s: any) => !existingIds.has(s.id)) || [];
              return [...prev, ...linked];
            });
          }
        } catch {
          // silent fail
        }
      }
    };

    loadResources();
    loadFullEvent();
  }, [isOpen, editEvent]);

  // Get current linked stalls list (existing + available)
  const currentLinkedStalls = useCallback((): Stall[] => {
    const linked = availableStalls.filter(s => linkedStallIds.has(s.id));
    return linked;
  }, [availableStalls, linkedStallIds]);

  // Helper: Create a stall and auto-link it
  const handleQuickCreateStall = async () => {
    if (!quickStallName.trim()) return;
    setIsCreatingStall(true);
    setError('');
    try {
      const res = await fetch('/api/stalls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: quickStallName.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create stall');
      }
      const data = await res.json();
      const newStall: Stall = data.stall;
      setAvailableStalls(prev => [...prev, newStall]);
      setLinkedStallIds(prev => new Set(prev).add(newStall.id));
      setQuickStallName('');
      setShowQuickStall(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create stall');
    } finally {
      setIsCreatingStall(false);
    }
  };

  // Helper: Create a volunteer
  const handleQuickCreateVolunteer = async () => {
    if (!quickVolunteer.name.trim() || !quickVolunteer.email.trim()) return;
    setIsCreatingVolunteer(true);
    setError('');
    try {
      const res = await fetch('/api/volunteers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: quickVolunteer.name.trim(),
          email: quickVolunteer.email.trim(),
          phoneNumber: quickVolunteer.phone || undefined,
          role: quickVolunteer.role,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create volunteer');
      }
      const data = await res.json();
      const newVol: Volunteer = data.volunteer;
      setAvailableVolunteers(prev => [...prev, newVol]);
      setQuickVolunteer({ name: '', email: '', phone: '', role: 'VOLUNTEER' });
      setShowQuickVolunteer(false);
      // Auto-select the new volunteer
      setSelectedVolunteerId(newVol.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create volunteer');
    } finally {
      setIsCreatingVolunteer(false);
    }
  };

  // Helper: Create a community
  const handleQuickCreateCommunity = async () => {
    if (!quickCommunity.code.trim() || !quickCommunity.name.trim() || !quickCommunity.location.trim() || !quickCommunity.contactPerson.trim()) return;
    setIsCreatingCommunity(true);
    setError('');
    try {
      const res = await fetch('/api/communities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: quickCommunity.code.trim(),
          name: quickCommunity.name.trim(),
          location: quickCommunity.location.trim(),
          zone: quickCommunity.zone.trim() || undefined,
          contactPerson: quickCommunity.contactPerson.trim(),
          contactEmail: quickCommunity.contactEmail.trim() || undefined,
          contactPhone: quickCommunity.contactPhone.trim() || undefined,
          status: 'ACTIVE',
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create community');
      }
      const data = await res.json();
      const newComm: Community = data.community;
      setCommunities(prev => [...prev, newComm]);
      setFormData(prev => ({ ...prev, communityId: newComm.id }));
      setQuickCommunity({ code: '', name: '', location: '', zone: '', contactPerson: '', contactEmail: '', contactPhone: '' });
      setShowQuickCommunity(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create community');
    } finally {
      setIsCreatingCommunity(false);
    }
  };

  // Assign volunteer to stall
  const handleAddAssignment = () => {
    if (!selectedVolunteerId || !selectedAssignmentStallId) return;
    const vol = availableVolunteers.find(v => v.id === selectedVolunteerId);
    const stall = currentLinkedStalls().find(s => s.id === selectedAssignmentStallId);
    if (!vol || !stall) return;

    // Prevent duplicate assignments
    const exists = assignments.some(a => a.volunteerId === selectedVolunteerId && a.stallId === selectedAssignmentStallId);
    if (exists) {
      setError('This volunteer is already assigned to this stall');
      return;
    }

    setAssignments(prev => [...prev, {
      volunteerId: vol.id,
      stallId: stall.id,
      volunteerName: vol.name,
      stallName: stall.name,
      volunteerEmail: vol.email,
    }]);
    setSelectedVolunteerId('');
    setSelectedAssignmentStallId('');
    setError('');
  };

  const handleRemoveAssignment = (index: number) => {
    setAssignments(prev => prev.filter((_, i) => i !== index));
  };

  // Toggle stall link
  const toggleStallLink = (stallId: string) => {
    setLinkedStallIds(prev => {
      const next = new Set(prev);
      if (next.has(stallId)) {
        next.delete(stallId);
        // Also remove any assignments for this stall
        setAssignments(a => a.filter(ass => ass.stallId !== stallId));
      } else {
        next.add(stallId);
      }
      return next;
    });
  };

  // Main save handler
  const handleSave = async () => {
    setIsSaving(true);
    setError('');

    try {
      // Validate general tab
      if (!formData.code.trim() || !formData.name.trim() || !formData.communityId || !formData.date) {
        setActiveTab('general');
        throw new Error('Please fill in all required fields in the General tab');
      }

      const payload = {
        ...formData,
        date: new Date(formData.date).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
      };

      let eventId = editEvent?.id;

      // Step 1: Save event
      if (isEditing && eventId) {
        const res = await fetch(`/api/events/${eventId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to update event');
        }
      } else {
        const res = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to create event');
        }
        const data = await res.json();
        eventId = data.event.id;
      }

      if (!eventId) throw new Error('Event ID not available');

      // Step 2: Sync stalls
      const currentStallIds = currentLinkedStalls().map(s => s.id);

      // Link new stalls
      for (const stallId of currentStallIds) {
        if (!originalLinkedStallIds.has(stallId)) {
          await fetch(`/api/events/${eventId}/stalls`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stallId }),
          });
        }
      }

      // Unlink removed stalls
      if (isEditing) {
        for (const stallId of originalLinkedStallIds) {
          if (!linkedStallIds.has(stallId)) {
            await fetch(`/api/events/${eventId}/stalls?stallId=${stallId}`, { method: 'DELETE' });
          }
        }
      }

      // Step 3: Sync volunteer assignments
      const currentAssignmentKeys = new Set(assignments.map(a => `${a.volunteerId}-${a.stallId}`));
      const originalAssignmentKeys = new Set(originalAssignments.map(a => `${a.volunteerId}-${a.stallId}`));

      // Add new assignments
      for (const assignment of assignments) {
        const key = `${assignment.volunteerId}-${assignment.stallId}`;
        if (!originalAssignmentKeys.has(key)) {
          await fetch(`/api/events/${eventId}/volunteers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ volunteerId: assignment.volunteerId, stallId: assignment.stallId }),
          });
        }
      }

      // Remove deleted assignments
      if (isEditing) {
        for (const original of originalAssignments) {
          const key = `${original.volunteerId}-${original.stallId}`;
          if (!currentAssignmentKeys.has(key)) {
            await fetch(`/api/events/${eventId}/volunteers?assignmentId=${original.id}`, { method: 'DELETE' });
          }
        }
      }

      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  // Tab validation indicators
  const generalValid = formData.code.trim() && formData.name.trim() && formData.communityId && formData.date;
  const stallCount = linkedStallIds.size;
  const assignmentCount = assignments.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{isEditing ? 'Edit Event' : 'Create New Event'}</h2>
            <p className="text-xs text-slate-500 mt-0.5">Configure all event details in one place</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center border-b border-slate-200 shrink-0 bg-slate-50/50">
          <button onClick={() => setActiveTab('general')} className={`relative px-5 py-3 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${activeTab === 'general' ? 'text-slate-900 border-b-2 border-slate-900 bg-white' : 'text-slate-500 hover:text-slate-700'}`}>
            <Building2 className="w-3.5 h-3.5" />
            General
            {generalValid && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>}
          </button>
          <button onClick={() => setActiveTab('stalls')} className={`relative px-5 py-3 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${activeTab === 'stalls' ? 'text-slate-900 border-b-2 border-slate-900 bg-white' : 'text-slate-500 hover:text-slate-700'}`}>
            <Star className="w-3.5 h-3.5" />
            Stalls
            {stallCount > 0 && <span className="bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full text-[10px]">{stallCount}</span>}
          </button>
          <button onClick={() => setActiveTab('volunteers')} className={`relative px-5 py-3 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${activeTab === 'volunteers' ? 'text-slate-900 border-b-2 border-slate-900 bg-white' : 'text-slate-500 hover:text-slate-700'}`}>
            <Users className="w-3.5 h-3.5" />
            Volunteers
            {assignmentCount > 0 && <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full text-[10px]">{assignmentCount}</span>}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-600 font-medium">{error}</div>
          )}

          {/* ===== GENERAL TAB ===== */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700" htmlFor="code">Code <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input id="code" type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="E-1287" disabled={isEditing} className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all placeholder:text-slate-400 text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed" required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700" htmlFor="status">Status</label>
                  <select id="status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-slate-800">
                    <option value="UPCOMING">Upcoming</option>
                    <option value="LIVE">Live</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700" htmlFor="name">Event Name <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input id="name" type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Greenfield Science Fest" className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all placeholder:text-slate-400 text-slate-800" required />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-700" htmlFor="community">Community <span className="text-rose-500">*</span></label>
                  <button onClick={() => setShowQuickCommunity(!showQuickCommunity)} className="text-[10px] font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1">
                    <Plus className="w-3 h-3" />
                    {showQuickCommunity ? 'Cancel' : 'Quick Add Community'}
                  </button>
                </div>

                {showQuickCommunity ? (
                  <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 space-y-3">
                    <p className="text-xs font-bold text-violet-700">Create New Community</p>
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" value={quickCommunity.code} onChange={(e) => setQuickCommunity({ ...quickCommunity, code: e.target.value })} placeholder="Code (e.g. C-001)" className="px-3 py-2 text-sm bg-white border border-violet-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 placeholder:text-slate-400 text-slate-800" />
                      <input type="text" value={quickCommunity.name} onChange={(e) => setQuickCommunity({ ...quickCommunity, name: e.target.value })} placeholder="Community Name" className="px-3 py-2 text-sm bg-white border border-violet-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 placeholder:text-slate-400 text-slate-800" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" value={quickCommunity.location} onChange={(e) => setQuickCommunity({ ...quickCommunity, location: e.target.value })} placeholder="Location" className="px-3 py-2 text-sm bg-white border border-violet-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 placeholder:text-slate-400 text-slate-800" />
                      <input type="text" value={quickCommunity.zone} onChange={(e) => setQuickCommunity({ ...quickCommunity, zone: e.target.value })} placeholder="Zone (optional)" className="px-3 py-2 text-sm bg-white border border-violet-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 placeholder:text-slate-400 text-slate-800" />
                    </div>
                    <input type="text" value={quickCommunity.contactPerson} onChange={(e) => setQuickCommunity({ ...quickCommunity, contactPerson: e.target.value })} placeholder="Contact Person" className="w-full px-3 py-2 text-sm bg-white border border-violet-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 placeholder:text-slate-400 text-slate-800" />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="email" value={quickCommunity.contactEmail} onChange={(e) => setQuickCommunity({ ...quickCommunity, contactEmail: e.target.value })} placeholder="Contact Email" className="px-3 py-2 text-sm bg-white border border-violet-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 placeholder:text-slate-400 text-slate-800" />
                      <input type="tel" value={quickCommunity.contactPhone} onChange={(e) => setQuickCommunity({ ...quickCommunity, contactPhone: e.target.value })} placeholder="Contact Phone" className="px-3 py-2 text-sm bg-white border border-violet-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 placeholder:text-slate-400 text-slate-800" />
                    </div>
                    <button onClick={handleQuickCreateCommunity} disabled={isCreatingCommunity} className="w-full py-2 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-60 transition-colors">
                      {isCreatingCommunity ? 'Creating...' : 'Create & Select Community'}
                    </button>
                  </div>
                ) : (
                  <select id="community" value={formData.communityId} onChange={(e) => setFormData({ ...formData, communityId: e.target.value })} className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-slate-800" required>
                    <option value="">Select a community...</option>
                    {communities.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.code}) - {c.location}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700" htmlFor="date">Start Date <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input id="date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-slate-800" required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700" htmlFor="endDate">End Date</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input id="endDate" type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-slate-800" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700" htmlFor="description">Description</label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe the event..." rows={3} className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all placeholder:text-slate-400 text-slate-800 resize-none" />
                </div>
              </div>
            </div>
          )}

          {/* ===== STALLS TAB ===== */}
          {activeTab === 'stalls' && (
            <div className="space-y-4">
              {/* Linked Stalls */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-800">Linked Stalls ({stallCount})</h3>
                  <button onClick={() => setShowQuickStall(!showQuickStall)} className="text-[10px] font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1">
                    <Plus className="w-3 h-3" />
                    {showQuickStall ? 'Cancel' : 'Quick Create Stall'}
                  </button>
                </div>

                {showQuickStall && (
                  <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 mb-3 space-y-3">
                    <p className="text-xs font-bold text-violet-700">Create New Stall & Auto-Link</p>
                    <div className="relative">
                      <Star className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input type="text" value={quickStallName} onChange={(e) => setQuickStallName(e.target.value)} placeholder="e.g. Math Quest, Science Lab..." className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-violet-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 placeholder:text-slate-400 text-slate-800" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setShowQuickStall(false)} className="flex-1 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
                      <button onClick={handleQuickCreateStall} disabled={isCreatingStall || !quickStallName.trim()} className="flex-1 py-2 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-60 transition-colors">
                        {isCreatingStall ? 'Creating...' : 'Create & Link'}
                      </button>
                    </div>
                  </div>
                )}

                {stallCount === 0 ? (
                  <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    <Star className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm text-slate-500 font-medium">No stalls linked yet</p>
                    <p className="text-xs text-slate-400 mt-1">Create stalls or link existing ones below</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentLinkedStalls().map(stall => (
                      <div key={stall.id} className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                            <Star className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{stall.name}</p>
                            <p className="text-[10px] text-slate-500">{stall.code}</p>
                          </div>
                        </div>
                        <button onClick={() => toggleStallLink(stall.id)} className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-md transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Available Stalls to Link */}
              {availableStalls.filter(s => !linkedStallIds.has(s.id)).length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-800 mb-3">Available Stalls</h3>
                  <div className="space-y-2">
                    {availableStalls.filter(s => !linkedStallIds.has(s.id)).map(stall => (
                      <div key={stall.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                            <Star className="w-4 h-4 text-slate-400" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{stall.name}</p>
                            <p className="text-[10px] text-slate-500">{stall.code}</p>
                          </div>
                        </div>
                        <button onClick={() => toggleStallLink(stall.id)} className="flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700 px-3 py-1.5 rounded-lg hover:bg-violet-50 transition-colors">
                          <Link2 className="w-3 h-3" />
                          Link
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {availableStalls.filter(s => !linkedStallIds.has(s.id)).length === 0 && !showQuickStall && stallCount > 0 && (
                <p className="text-xs text-slate-400 text-center">All available stalls are linked to this event</p>
              )}
            </div>
          )}

          {/* ===== VOLUNTEERS TAB ===== */}
          {activeTab === 'volunteers' && (
            <div className="space-y-4">
              {/* Add Assignment */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">Assign Volunteer to Stall</h3>
                  <button onClick={() => setShowQuickVolunteer(!showQuickVolunteer)} className="text-[10px] font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1">
                    <Plus className="w-3 h-3" />
                    {showQuickVolunteer ? 'Cancel' : 'Quick Add Volunteer'}
                  </button>
                </div>

                {showQuickVolunteer && (
                  <div className="bg-violet-50 border border-violet-200 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-bold text-violet-700">Create New Volunteer</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input type="text" value={quickVolunteer.name} onChange={(e) => setQuickVolunteer({ ...quickVolunteer, name: e.target.value })} placeholder="Full Name" className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-violet-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 placeholder:text-slate-400 text-slate-800" />
                      </div>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input type="email" value={quickVolunteer.email} onChange={(e) => setQuickVolunteer({ ...quickVolunteer, email: e.target.value })} placeholder="Email" className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-violet-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 placeholder:text-slate-400 text-slate-800" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input type="tel" value={quickVolunteer.phone} onChange={(e) => setQuickVolunteer({ ...quickVolunteer, phone: e.target.value })} placeholder="Phone (optional)" className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-violet-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 placeholder:text-slate-400 text-slate-800" />
                      </div>
                      <div className="relative">
                        <Shield className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <select value={quickVolunteer.role} onChange={(e) => setQuickVolunteer({ ...quickVolunteer, role: e.target.value })} className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-violet-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-800">
                          <option value="VOLUNTEER">Volunteer</option>
                          <option value="LEAD_EVALUATOR">Lead Evaluator</option>
                          <option value="COORDINATOR">Coordinator</option>
                        </select>
                      </div>
                    </div>
                    <button onClick={handleQuickCreateVolunteer} disabled={isCreatingVolunteer || !quickVolunteer.name.trim() || !quickVolunteer.email.trim()} className="w-full py-2 text-xs font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-60 transition-colors">
                      {isCreatingVolunteer ? 'Creating...' : 'Create Volunteer'}
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <select value={selectedVolunteerId} onChange={(e) => setSelectedVolunteerId(e.target.value)} className="px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-800">
                    <option value="">Select volunteer...</option>
                    {availableVolunteers.map(v => (
                      <option key={v.id} value={v.id}>{v.name} ({v.role})</option>
                    ))}
                  </select>
                  <select value={selectedAssignmentStallId} onChange={(e) => setSelectedAssignmentStallId(e.target.value)} className="px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-800">
                    <option value="">Select stall...</option>
                    {currentLinkedStalls().map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <button onClick={handleAddAssignment} disabled={!selectedVolunteerId || !selectedAssignmentStallId} className="w-full py-2 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-60 transition-colors">
                  Assign Volunteer to Stall
                </button>
              </div>

              {/* Current Assignments */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-3">Volunteer Assignments ({assignmentCount})</h3>
                {assignmentCount === 0 ? (
                  <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm text-slate-500 font-medium">No volunteers assigned yet</p>
                    <p className="text-xs text-slate-400 mt-1">Select a volunteer and stall above to assign</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {assignments.map((a, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 text-[10px] font-bold text-emerald-600">
                            {(a.volunteerName || 'V').charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{a.volunteerName || 'Unknown'}</p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500">
                              <span>{a.volunteerEmail}</span>
                              <span className="text-slate-300">•</span>
                              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium">{a.stallName || 'Unknown Stall'}</span>
                            </div>
                          </div>
                        </div>
                        <button onClick={() => handleRemoveAssignment(idx)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 shrink-0 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className={`flex items-center gap-1 ${generalValid ? 'text-emerald-600' : ''}`}>
                {generalValid ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border border-slate-300" />}
                General
              </span>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className={`flex items-center gap-1 ${stallCount > 0 ? 'text-emerald-600' : ''}`}>
                {stallCount > 0 ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border border-slate-300" />}
                {stallCount} Stall{stallCount !== 1 ? 's' : ''}
              </span>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className={`flex items-center gap-1 ${assignmentCount > 0 ? 'text-emerald-600' : ''}`}>
                {assignmentCount > 0 ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border border-slate-300" />}
                {assignmentCount} Volunteer{assignmentCount !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={isSaving || !generalValid} className="px-6 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-60 transition-colors">
                {isSaving ? 'Saving...' : isEditing ? 'Update Event & Save' : 'Create Event & Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
