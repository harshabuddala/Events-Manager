'use client';

import React, { useState, useEffect } from 'react';
import { X, MapPin, User, Mail, Phone, Building2, FileText } from 'lucide-react';

interface CommunityFormData {
  code: string;
  name: string;
  location: string;
  zone: string;
  status: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  description: string;
}

const REQUIRED_FIELDS = ['code', 'name', 'location', 'contactPerson'] as const;

const FIELD_LABELS: Record<string, string> = {
  code: 'Code',
  name: 'Community Name',
  location: 'Location',
  contactPerson: 'Contact Person',
};

interface CommunityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CommunityFormData) => Promise<void>;
  editCommunity?: {
    id: string;
    code: string;
    name: string;
    location: string;
    zone?: string;
    status: string;
    contactPerson: string;
    contactEmail?: string;
    contactPhone?: string;
    description?: string;
  } | null;
}

export default function CommunityFormModal({ isOpen, onClose, onSubmit, editCommunity }: CommunityFormModalProps) {
  const [formData, setFormData] = useState<CommunityFormData>({
    code: '',
    name: '',
    location: '',
    zone: '',
    status: 'ACTIVE',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    description: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editCommunity) {
      setFormData({
        code: editCommunity.code,
        name: editCommunity.name,
        location: editCommunity.location,
        zone: editCommunity.zone || '',
        status: editCommunity.status,
        contactPerson: editCommunity.contactPerson,
        contactEmail: editCommunity.contactEmail || '',
        contactPhone: editCommunity.contactPhone || '',
        description: editCommunity.description || '',
      });
    } else {
      setFormData({
        code: '',
        name: '',
        location: '',
        zone: '',
        status: 'ACTIVE',
        contactPerson: '',
        contactEmail: '',
        contactPhone: '',
        description: '',
      });
    }
    setError('');
    setTouched({});
    setErrors({});
  }, [editCommunity, isOpen]);

  const validateField = (name: string, value: string): string => {
    if ((REQUIRED_FIELDS as readonly string[]).includes(name) && !value.trim()) {
      return `${FIELD_LABELS[name] || name} is required`;
    }
    if (name === 'contactEmail' && value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Invalid email format';
    }
    return '';
  };

  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const err = validateField(name, formData[name as keyof CommunityFormData]);
    setErrors(prev => ({ ...prev, [name]: err }));
  };

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      const err = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: err }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    let allValid = true;
    for (const field of REQUIRED_FIELDS) {
      const err = validateField(field, formData[field]);
      if (err) { newErrors[field] = err; allValid = false; }
    }
    const emailErr = validateField('contactEmail', formData.contactEmail);
    if (emailErr) { newErrors.contactEmail = emailErr; allValid = false; }
    setErrors(newErrors);
    setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
    return allValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    setError('');

    try {
      await onSubmit(formData);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = (name: string, hasError?: boolean) =>
    `w-full pl-9 pr-4 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 transition-all placeholder:text-slate-400 ${
      hasError
        ? 'bg-rose-50 border border-rose-300 focus:ring-rose-500/20 focus:border-rose-500 text-rose-800'
        : 'bg-slate-50 border border-slate-200 focus:ring-violet-500/20 focus:border-violet-500 text-slate-800'
    } disabled:opacity-60 disabled:cursor-not-allowed`;

  const selectClass = (name: string, hasError?: boolean) =>
    `w-full px-4 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 transition-all ${
      hasError
        ? 'bg-rose-50 border border-rose-300 focus:ring-rose-500/20 focus:border-rose-500 text-slate-800'
        : 'bg-slate-50 border border-slate-200 focus:ring-violet-500/20 focus:border-violet-500 text-slate-800'
    }`;

  if (!isOpen) return null;

  const hasError = (name: string) => !!(touched[name] && errors[name]);

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-slate-900">
            {editCommunity ? 'Edit Community' : 'Add New Community'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-600 font-medium">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700" htmlFor="code">
                Code <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${hasError('code') ? 'text-rose-400' : 'text-slate-400'}`} />
                <input
                  id="code" type="text"
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value)}
                  onBlur={() => handleBlur('code')}
                  placeholder="C-006"
                  disabled={!!editCommunity}
                  className={inputClass('code', hasError('code'))}
                />
              </div>
              {hasError('code') && <p className="text-[11px] text-rose-500 font-medium">{errors.code}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700" htmlFor="status">Status</label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className={selectClass('status')}
              >
                <option value="ACTIVE">Active</option>
                <option value="UPCOMING">Upcoming</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700" htmlFor="name">
              Community Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Building2 className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${hasError('name') ? 'text-rose-400' : 'text-slate-400'}`} />
              <input
                id="name" type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                onBlur={() => handleBlur('name')}
                placeholder="Greenfield Society"
                className={inputClass('name', hasError('name'))}
              />
            </div>
            {hasError('name') && <p className="text-[11px] text-rose-500 font-medium">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700" htmlFor="location">
                Location <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MapPin className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${hasError('location') ? 'text-rose-400' : 'text-slate-400'}`} />
                <input
                  id="location" type="text"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  onBlur={() => handleBlur('location')}
                  placeholder="Whitefield"
                  className={inputClass('location', hasError('location'))}
                />
              </div>
              {hasError('location') && <p className="text-[11px] text-rose-500 font-medium">{errors.location}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700" htmlFor="zone">Zone</label>
              <input
                id="zone" type="text"
                value={formData.zone}
                onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                placeholder="Zone 1"
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all placeholder:text-slate-400 text-slate-800"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700" htmlFor="contactPerson">
              Contact Person <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${hasError('contactPerson') ? 'text-rose-400' : 'text-slate-400'}`} />
              <input
                id="contactPerson" type="text"
                value={formData.contactPerson}
                onChange={(e) => handleChange('contactPerson', e.target.value)}
                onBlur={() => handleBlur('contactPerson')}
                placeholder="Rahul Sharma"
                className={inputClass('contactPerson', hasError('contactPerson'))}
              />
            </div>
            {hasError('contactPerson') && <p className="text-[11px] text-rose-500 font-medium">{errors.contactPerson}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700" htmlFor="contactEmail">Email</label>
              <div className="relative">
                <Mail className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${hasError('contactEmail') ? 'text-rose-400' : 'text-slate-400'}`} />
                <input
                  id="contactEmail" type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleChange('contactEmail', e.target.value)}
                  onBlur={() => handleBlur('contactEmail')}
                  placeholder="contact@example.com"
                  className={inputClass('contactEmail', hasError('contactEmail'))}
                />
              </div>
              {hasError('contactEmail') && <p className="text-[11px] text-rose-500 font-medium">{errors.contactEmail}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700" htmlFor="contactPhone">Phone</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="contactPhone" type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all placeholder:text-slate-400 text-slate-800"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700" htmlFor="description">Description</label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description about the community..."
                rows={3}
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all placeholder:text-slate-400 text-slate-800 resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
            <button type="submit" disabled={isLoading} className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-60 transition-colors">
              {isLoading ? 'Saving...' : editCommunity ? 'Update Community' : 'Create Community'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
