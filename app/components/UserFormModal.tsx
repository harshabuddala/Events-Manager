'use client';

import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Phone, Shield, UserCheck, ShieldAlert, Eye, EyeOff, Check, Circle } from 'lucide-react';

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: string;
  phoneNumber: string;
}

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => Promise<void>;
  editUser?: {
    id: string;
    name: string;
    email: string;
    role: string;
    phoneNumber?: string;
  } | null;
}

export default function UserFormModal({ isOpen, onClose, onSubmit, editUser }: UserFormModalProps) {
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    role: 'VOLUNTEER',
    phoneNumber: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (editUser) {
      setFormData({
        name: editUser.name,
        email: editUser.email,
        password: '',
        role: editUser.role,
        phoneNumber: editUser.phoneNumber || '',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'VOLUNTEER',
        phoneNumber: '',
      });
      setShowPassword(false);
    }
    setError('');
    setTouched({});
    setErrors({});
  }, [editUser, isOpen]);

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'name':
        return !value.trim() ? 'Full name is required' : '';
      case 'email':
        if (!value.trim()) return 'Email address is required';
        return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Invalid email format' : '';
      case 'password':
        if (!editUser && !value) return 'Password is required';
        if (!value) return '';
        if (value.length < 8) return 'At least 8 characters';
        if (!/[A-Z]/.test(value)) return 'Must contain an uppercase letter';
        if (!/[a-z]/.test(value)) return 'Must contain a lowercase letter';
        if (!/[0-9]/.test(value)) return 'Must contain a number';
        if (!/[^A-Za-z0-9]/.test(value)) return 'Must contain a special character';
        return '';
      default:
        return '';
    }
  };

  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const err = validateField(name, formData[name as keyof UserFormData]);
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
    const fieldsToCheck = editUser ? ['name', 'email'] : ['name', 'email', 'password'];
    const newErrors: Record<string, string> = {};
    let allValid = true;
    for (const field of fieldsToCheck) {
      const err = validateField(field, formData[field as keyof UserFormData]);
      if (err) { newErrors[field] = err; allValid = false; }
    }
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

  const inputClass = (name: string) => {
    const hasErr = touched[name] && errors[name];
    return `w-full pl-9 pr-4 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 transition-all placeholder:text-slate-400 ${
      hasErr
        ? 'bg-rose-50 border border-rose-300 focus:ring-rose-500/20 focus:border-rose-500 text-rose-800'
        : 'bg-slate-50 border border-slate-200 focus:ring-violet-500/20 focus:border-violet-500 text-slate-800'
    } disabled:opacity-60 disabled:cursor-not-allowed`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">
            {editUser ? 'Edit User' : 'Create New User'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-600 font-medium">{error}</div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700" htmlFor="name">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${touched.name && errors.name ? 'text-rose-400' : 'text-slate-400'}`} />
              <input
                id="name" type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                onBlur={() => handleBlur('name')}
                placeholder="John Doe"
                className={inputClass('name')}
              />
            </div>
            {touched.name && errors.name && <p className="text-[11px] text-rose-500 font-medium">{errors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700" htmlFor="email">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${touched.email && errors.email ? 'text-rose-400' : 'text-slate-400'}`} />
              <input
                id="email" type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                placeholder="john@example.com"
                disabled={!!editUser}
                className={inputClass('email')}
              />
            </div>
            {touched.email && errors.email && <p className="text-[11px] text-rose-500 font-medium">{errors.email}</p>}
          </div>

          {!editUser && (
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700" htmlFor="password">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${touched.password && errors.password ? 'text-rose-400' : 'text-slate-400'}`} />
                <input
                  id="password" type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  placeholder="••••••••"
                  className={inputClass('password') + ' pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {touched.password && errors.password && <p className="text-[11px] text-rose-500 font-medium">{errors.password}</p>}
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-1.5">
                {[
                  { rule: '8+ characters', test: (v: string) => v.length >= 8 },
                  { rule: 'Uppercase letter', test: (v: string) => /[A-Z]/.test(v) },
                  { rule: 'Lowercase letter', test: (v: string) => /[a-z]/.test(v) },
                  { rule: 'Number', test: (v: string) => /[0-9]/.test(v) },
                  { rule: 'Special character', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
                ].map(({ rule, test }) => {
                  const passed = test(formData.password);
                  return (
                    <div key={rule} className="flex items-center gap-1.5">
                      {passed ? (
                        <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                      ) : (
                        <Circle className="w-3 h-3 text-slate-300 shrink-0" />
                      )}
                      <span className={`text-[11px] font-medium ${passed ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {rule}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700" htmlFor="phone">Phone Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="phone" type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all placeholder:text-slate-400 text-slate-800"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">Role <span className="text-rose-500">*</span></label>
            <div className="grid grid-cols-3 gap-2">
              {(['ADMIN', 'MANAGER', 'VOLUNTEER'] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setFormData({ ...formData, role })}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
                    formData.role === role
                      ? role === 'ADMIN' ? 'border-violet-500 bg-violet-50 text-violet-700'
                        : role === 'MANAGER' ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {role === 'ADMIN' ? <ShieldAlert className="w-5 h-5" />
                    : role === 'MANAGER' ? <Shield className="w-5 h-5" />
                    : <UserCheck className="w-5 h-5" />}
                  <span className="text-xs font-semibold">{role.charAt(0) + role.slice(1).toLowerCase()}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
            <button type="submit" disabled={isLoading} className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-60 transition-colors">
              {isLoading ? 'Saving...' : editUser ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
