'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import VolunteerFormModal from '@/app/components/VolunteerFormModal';
import ResetPasswordModal from '@/app/components/ResetPasswordModal';
import QrLoginGenerator from '@/app/components/QrLoginGenerator';
import { 
  UserCheck, Search, 
  MoreVertical, ArrowRight, Plus, 
  CheckCircle2, Mail, Phone, Calendar as CalendarIcon, Star, Loader2,
  Edit2, Trash2, AlertTriangle, KeyRound, QrCode
} from 'lucide-react';

interface Volunteer {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  rawRole: string;
  preferredStall: string;
  totalEvents: number;
  rating: number | null;
  status: string;
  avatar: string;
  hasPassword: boolean;
}

export default function VolunteersPage() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingVolunteer, setEditingVolunteer] = useState<Volunteer | null>(null);
  const [deletingVolunteer, setDeletingVolunteer] = useState<Volunteer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [resetPasswordVolunteer, setResetPasswordVolunteer] = useState<Volunteer | null>(null);
  const [qrLoginVolunteer, setQrLoginVolunteer] = useState<Volunteer | null>(null);

  const fetchVolunteers = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (roleFilter !== 'ALL') params.set('role', roleFilter);
      const res = await fetch(`/api/volunteers?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setVolunteers(data.volunteers);
      }
    } catch (error) {
      console.error('Failed to fetch volunteers:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, roleFilter]);

  useEffect(() => {
    // Fetch current user role
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.user) {
          setUserRole(data.user.role);
          setCurrentUserEmail(data.user.email);
        }
      })
      .catch(console.error);
    
    fetchVolunteers();
  }, [fetchVolunteers]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'assigned':
        return (
          <span className="flex items-center gap-1.5 bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0">
            <UserCheck className="w-3 h-3" />
            Assigned
          </span>
        );
      case 'available':
        return (
          <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0">
            <CheckCircle2 className="w-3 h-3" />
            Available
          </span>
        );
      case 'on_leave':
        return (
          <span className="flex items-center gap-1.5 bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0">
            On Leave
          </span>
        );
      default:
        return null;
    }
  };

  const isLead = (rawRole: string) => rawRole === 'LEAD_EVALUATOR';
  const canManageVolunteers = userRole === 'ADMIN' || userRole === 'MANAGER';
  const isVolunteerRole = ['VOLUNTEER', 'LEAD_EVALUATOR', 'COORDINATOR'].includes(userRole);

  const handleAddVolunteer = () => {
    setEditingVolunteer(null);
    setIsFormModalOpen(true);
  };

  const handleEditVolunteer = (volunteer: Volunteer) => {
    setEditingVolunteer(volunteer);
    setIsFormModalOpen(true);
  };

  const handleDeleteVolunteer = (volunteer: Volunteer) => {
    setDeletingVolunteer(volunteer);
  };

  const confirmDelete = async () => {
    if (!deletingVolunteer) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/volunteers/${deletingVolunteer.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setVolunteers(volunteers.filter(v => v.id !== deletingVolunteer.id));
        setDeletingVolunteer(null);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete volunteer');
      }
    } catch (error) {
      alert('An error occurred while deleting the volunteer');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DashboardLayout 
      title="Volunteers & Evaluators"
      subtitle="Manage your volunteer network, assign stalls, and track performance."
      headerAction={
        canManageVolunteers && (
          <button 
            onClick={handleAddVolunteer}
            className="hidden lg:flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white px-3 py-2 rounded-lg text-xs font-semibold shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Volunteer</span>
          </button>
        )
      }
    >
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 hide-scrollbar">
          <button 
            onClick={() => { setStatusFilter('ALL'); setRoleFilter('ALL'); }}
            className={`px-4 py-2 rounded-md text-xs font-semibold shrink-0 shadow-sm transition-colors ${statusFilter === 'ALL' && roleFilter === 'ALL' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            All
          </button>
          <button 
            onClick={() => { setStatusFilter('AVAILABLE'); setRoleFilter('ALL'); }}
            className={`px-4 py-2 rounded-md text-xs font-semibold shrink-0 shadow-sm transition-colors ${statusFilter === 'AVAILABLE' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            Available
          </button>
          <button 
            onClick={() => { setStatusFilter('ALL'); setRoleFilter('LEAD_EVALUATOR'); }}
            className={`px-4 py-2 rounded-md text-xs font-semibold shrink-0 shadow-sm transition-colors ${roleFilter === 'LEAD_EVALUATOR' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            Lead Evaluators
          </button>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by name, email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 shadow-sm placeholder:text-slate-400"
            />
          </div>
          
        </div>
      </div>

      {/* Volunteers List */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-[25%]">Volunteer Details</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Contact Information</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status / Stall</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Performance</th>
                <th className="px-5 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right w-[80px] sticky right-0 bg-white z-10">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Loading volunteers...
                  </td>
                </tr>
              ) : volunteers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                    No volunteers found.
                  </td>
                </tr>
              ) : (
                volunteers.map((vol) => (
                  <tr key={vol.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex gap-3 items-center">
                        <div className="w-10 h-10 rounded-full bg-violet-100 border border-violet-200/60 flex items-center justify-center shrink-0 text-violet-700 text-sm font-bold shadow-sm">
                          {vol.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <h4 className="text-sm font-bold text-slate-800">{vol.name}</h4>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                            {isLead(vol.rawRole) ? (
                              <span className="text-amber-600 font-bold flex items-center gap-1"><Star className="w-3 h-3 fill-amber-500" /> {vol.role}</span>
                            ) : (
                              <span className="text-slate-500">{vol.role}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1 text-[11px] font-medium text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {vol.email}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {vol.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                       <div className="flex flex-col items-start gap-2">
                          {getStatusBadge(vol.status)}
                          {vol.preferredStall !== '—' && (
                            <span className="text-[10px] font-bold text-slate-500 pl-1 border-l-2 border-slate-200">Prefers: {vol.preferredStall}</span>
                          )}
                       </div>
                     </td>
                     <td className="px-5 py-4">
                       <div className="flex flex-col items-end gap-1">
                        {vol.rating != null ? (
                          <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-100 text-[11px] font-bold">
                             <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                             {vol.rating}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">No rating</span>
                        )}
                        <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3" /> {vol.totalEvents} events
                        </span>
                      </div>
                    </td>
                     <td className="px-5 py-4 text-right sticky right-0 bg-white z-10">
                       <div className="flex items-center justify-end gap-2">
                            {canManageVolunteers ? (
                              <>
                               <button
                                 onClick={() => setQrLoginVolunteer(vol)}
                                 className="p-1.5 text-slate-400 hover:bg-violet-50 hover:text-violet-600 rounded-md transition-colors"
                                 title="Generate Login QR"
                               >
                                 <QrCode className="w-4 h-4" />
                               </button>
                               <button
                                 onClick={() => setResetPasswordVolunteer(vol)}
                                 className="p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-600 rounded-md transition-colors"
                                 title="Reset Password"
                               >
                                 <KeyRound className="w-4 h-4" />
                               </button>
                               <button
                                 onClick={() => handleEditVolunteer(vol)}
                                 className="p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors"
                                 title="Edit"
                               >
                                 <Edit2 className="w-4 h-4" />
                               </button>
                               <button
                                 onClick={() => handleDeleteVolunteer(vol)}
                                 className="p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-md transition-colors"
                                 title="Delete"
                               >
                                 <Trash2 className="w-4 h-4" />
                               </button>
                             </>
                           ) : (
                             <span className="text-[11px] text-slate-400">View Only</span>
                           )}
                       </div>
                     </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] font-medium text-slate-500">
            Total: <span className="font-bold text-slate-700">{volunteers.length}</span> volunteers
          </p>
        </div>
      </div>

      {/* Volunteer Form Modal */}
      <VolunteerFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        volunteer={editingVolunteer}
        onSuccess={fetchVolunteers}
      />

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={!!resetPasswordVolunteer}
        onClose={() => setResetPasswordVolunteer(null)}
        volunteer={resetPasswordVolunteer ? {
          id: resetPasswordVolunteer.id,
          name: resetPasswordVolunteer.name,
          email: resetPasswordVolunteer.email,
          avatar: resetPasswordVolunteer.avatar,
        } : null}
        onSuccess={fetchVolunteers}
      />

      {/* QR Login Generator Modal */}
      <QrLoginGenerator
        isOpen={!!qrLoginVolunteer}
        onClose={() => setQrLoginVolunteer(null)}
        targetUserId={qrLoginVolunteer?.id}
        targetUserType="volunteer"
        targetUserName={qrLoginVolunteer?.name}
      />

      {/* Delete Confirmation Modal */}
      {deletingVolunteer && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Delete Volunteer</h3>
                <p className="text-sm text-slate-500">This action cannot be undone</p>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-slate-700">
                Are you sure you want to delete <strong>{deletingVolunteer.name}</strong>? This will permanently remove their account and all associated data.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setDeletingVolunteer(null)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 rounded-lg transition-colors"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Volunteer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
