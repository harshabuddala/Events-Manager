'use client';

import React, { useState, useEffect } from 'react';
import { X, User2, Mail, Phone, Briefcase, Clock, Save, CheckCircle2, Lock, Eye, EyeOff, KeyRound } from 'lucide-react';

interface VolunteerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  volunteer?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    rawRole: string;
    status: string;
    preferredStall: string;
    hasPassword?: boolean;
  } | null;
  onSuccess: () => void;
}

type rawRole = 'VOLUNTEER' | 'LEAD_EVALUATOR' | 'COORDINATOR';
type Status = 'AVAILABLE' | 'ASSIGNED' | 'ON_LEAVE';

export default function VolunteerFormModal({ isOpen, onClose, volunteer, onSuccess }: VolunteerFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    role: 'VOLUNTEER' as rawRole,
    status: 'AVAILABLE' as Status,
    preferredStall: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditMode = !!volunteer;

  useEffect(() => {
    if (volunteer) {
      setFormData({
        name: volunteer.name,
        email: volunteer.email,
        password: '',
        confirmPassword: '',
        phoneNumber: volunteer.phone !== '—' ? volunteer.phone : '',
        role: volunteer.role as rawRole,
        status: volunteer.status.toUpperCase() as Status,
        preferredStall: volunteer.preferredStall !== '—' ? volunteer.preferredStall : '',
      });
      setChangePassword(false);
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phoneNumber: '',
        role: 'VOLUNTEER',
        status: 'AVAILABLE',
        preferredStall: '',
      });
      setChangePassword(true);
    }
    setError('');
    setSuccess(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setTouched({});
    setErrors({});
  }, [volunteer, isOpen]);

  const validateField = (name: string): string => {
    switch (name) {
      case 'name':
        return !formData.name.trim() ? 'Full name is required' : '';
      case 'email':
        if (!formData.email.trim()) return 'Email address is required';
        return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) ? 'Invalid email format' : '';
      case 'password':
        if (!isEditMode || changePassword) {
          if (!formData.password) return 'Password is required';
          if (formData.password.length < 8) return 'Password must be at least 8 characters';
        }
        return '';
      case 'confirmPassword':
        if (!isEditMode || changePassword) {
          if (!formData.confirmPassword) return 'Please confirm your password';
          if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
        }
        return '';
      default:
        return '';
    }
  };

  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: validateField(name) }));
  };

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      setErrors(prev => ({ ...prev, [name]: validateField(name) }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    let allValid = true;

    const nameErr = validateField('name');
    if (nameErr) { newErrors.name = nameErr; allValid = false; }

    const emailErr = validateField('email');
    if (emailErr) { newErrors.email = emailErr; allValid = false; }

    if (!isEditMode || changePassword) {
      const passErr = validateField('password');
      if (passErr) { newErrors.password = passErr; allValid = false; }
      const confirmErr = validateField('confirmPassword');
      if (confirmErr) { newErrors.confirmPassword = confirmErr; allValid = false; }
    }

    setErrors(newErrors);
    const allTouched: Record<string, boolean> = {};
    Object.keys(formData).forEach(k => { allTouched[k] = true; });
    if (!isEditMode || changePassword) {
      allTouched.password = true;
      allTouched.confirmPassword = true;
    }
    setTouched(allTouched);
    return allValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    setError('');
    setSuccess(false);

    try {
      const url = isEditMode ? `/api/volunteers/${volunteer!.id}` : '/api/volunteers';
      const payload: any = {
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        role: formData.role,
        status: formData.status,
        preferredStall: formData.preferredStall,
      };

      if (!isEditMode || (changePassword && formData.password)) {
        payload.password = formData.password;
      }

      const response = await fetch(url, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to save volunteer');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = (name: string) => {
    const hasErr = touched[name] && errors[name];
    return `w-full pl-10 pr-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all ${
      hasErr
        ? 'border-rose-300 bg-rose-50 focus:ring-rose-500/20 focus:border-rose-500 text-rose-800'
        : 'border-slate-200 bg-white focus:ring-violet-500/20 focus:border-violet-500 text-slate-800'
    }`;
  };

  const iconClass = (name: string) =>
    touched[name] && errors[name] ? 'text-rose-400' : 'text-slate-400';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            {isEditMode ? 'Edit Volunteer' : 'Add New Volunteer'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Volunteer saved successfully!
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User2 className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${iconClass('name')}`} />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                onBlur={() => handleBlur('name')}
                placeholder="Enter volunteer's full name"
                className={inputClass('name')}
              />
            </div>
            {touched.name && errors.name && <p className="text-[11px] text-rose-500 font-medium mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${iconClass('email')}`} />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                placeholder="volunteer@example.com"
                className={inputClass('email')}
              />
            </div>
            {touched.email && errors.email && <p className="text-[11px] text-rose-500 font-medium mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="+1 234 567 8900"
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Role</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as rawRole })}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 appearance-none bg-white cursor-pointer"
                >
                  <option value="VOLUNTEER">Volunteer</option>
                  <option value="LEAD_EVALUATOR">Lead Evaluator</option>
                  <option value="COORDINATOR">Coordinator</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Status</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Status })}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 appearance-none bg-white cursor-pointer"
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="ON_LEAVE">On Leave</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Preferred Stall</label>
            <select
              value={formData.preferredStall}
              onChange={(e) => setFormData({ ...formData, preferredStall: e.target.value })}
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 appearance-none bg-white cursor-pointer"
            >
              <option value="">No preference</option>
              <option value="Science Lab">Science Lab</option>
              <option value="Math Corner">Math Corner</option>
              <option value="Art Station">Art Station</option>
              <option value="Sports Zone">Sports Zone</option>
            </select>
          </div>

          <div className="pt-2 border-t border-slate-200">
            {isEditMode && (
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-700">Password</span>
                  {volunteer?.hasPassword && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Set</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setChangePassword(!changePassword);
                    setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
                    setTouched(prev => ({ ...prev, password: false, confirmPassword: false }));
                    setErrors(prev => ({ ...prev, password: '', confirmPassword: '' }));
                  }}
                  className="text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors"
                >
                  {changePassword ? 'Cancel' : 'Change Password'}
                </button>
              </div>
            )}

            {(!isEditMode || changePassword) && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    {isEditMode ? 'New Password' : 'Password'} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${iconClass('password')}`} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      onBlur={() => handleBlur('password')}
                      placeholder="Min. 8 characters"
                      className={inputClass('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {touched.password && errors.password && <p className="text-[11px] text-rose-500 font-medium mt-1">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${iconClass('confirmPassword')}`} />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      onBlur={() => handleBlur('confirmPassword')}
                      placeholder="Repeat password"
                      className={inputClass('confirmPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {touched.confirmPassword && errors.confirmPassword && <p className="text-[11px] text-rose-500 font-medium mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 rounded-lg transition-colors shadow-lg"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEditMode ? 'Update Volunteer' : 'Add Volunteer'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
