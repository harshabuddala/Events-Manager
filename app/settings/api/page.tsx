'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/app/components/DashboardLayout';
import {
  Key, Plus, Trash2, Copy, CheckCircle2, Loader2, Eye, EyeOff,
  BookOpen, Code, Shield, ExternalLink, ChevronDown, ChevronRight,
  AlertCircle, Clock, X
} from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  keyPreview: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

export default function ApiSettingsPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'keys' | 'docs' | 'playground'>('keys');
  const [expandedSection, setExpandedSection] = useState<string | null>('auth');

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/api-keys');
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setCreatedKey(data.key);
        setNewKeyName('');
        fetchKeys();
      }
    } catch {
      // ignore
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevokeKey = async (id: string) => {
    setRevokingId(id);
    try {
      const res = await fetch(`/api/settings/api-keys/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchKeys();
      }
    } catch {
      // ignore
    } finally {
      setRevokingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <DashboardLayout
      title="API"
      subtitle="Manage API keys, view documentation, and test endpoints"
    >
      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200/80 p-1.5 w-fit">
        {[
          { id: 'keys', label: 'API Keys', icon: Key },
          { id: 'docs', label: 'Documentation', icon: BookOpen },
          { id: 'playground', label: 'Playground', icon: Code },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'keys' | 'docs' | 'playground')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== API KEYS TAB ===== */}
      {activeTab === 'keys' && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">API Keys</h3>
              <p className="text-xs text-slate-500 mt-0.5">Create and manage API keys for external integrations</p>
            </div>
            <button
              onClick={() => { setShowCreateModal(true); setCreatedKey(null); }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Create API Key
            </button>
          </div>

          {/* Keys List */}
          {isLoading ? (
            <div className="bg-white rounded-xl border border-slate-200/80 p-10 text-center">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-violet-500" />
              <p className="text-xs text-slate-400">Loading API keys...</p>
            </div>
          ) : keys.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200/80 p-10 text-center">
              <Key className="w-10 h-10 mx-auto mb-3 text-slate-200" />
              <p className="text-sm font-semibold text-slate-400 mb-1">No API keys yet</p>
              <p className="text-xs text-slate-400">Create your first API key to start integrating with external services</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Name</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Key</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Last Used</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {keys.map(key => (
                    <tr key={key.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-semibold text-slate-800">{key.name}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <code className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">{key.keyPreview}</code>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          key.isActive
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${key.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {key.isActive ? 'Active' : 'Revoked'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-slate-400">
                          {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {key.isActive && (
                          <button
                            onClick={() => handleRevokeKey(key.id)}
                            disabled={revokingId === key.id}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors disabled:opacity-50"
                            title="Revoke Key"
                          >
                            {revokingId === key.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Create Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                {createdKey ? (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">API Key Created</h3>
                        <p className="text-xs text-slate-500">Save this key — it won&apos;t be shown again</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-xs font-mono text-slate-700 break-all">{createdKey}</code>
                        <button
                          onClick={() => copyToClipboard(createdKey)}
                          className="p-1.5 text-slate-400 hover:text-violet-600 rounded-md transition-colors shrink-0"
                        >
                          {copiedKey ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700">Copy this key now. For security, it won&apos;t be displayed again.</p>
                    </div>
                    <button
                      onClick={() => { setShowCreateModal(false); setCreatedKey(null); }}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-colors"
                    >
                      Done
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-bold text-slate-900">Create API Key</h3>
                      <button onClick={() => setShowCreateModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mb-4">
                      <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Key Name</label>
                      <input
                        type="text"
                        value={newKeyName}
                        onChange={e => setNewKeyName(e.target.value)}
                        placeholder="e.g. Landing Page Integration"
                        className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-800 placeholder:text-slate-400"
                        onKeyDown={e => e.key === 'Enter' && handleCreateKey()}
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowCreateModal(false)}
                        className="flex-1 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateKey}
                        disabled={isCreating || !newKeyName.trim()}
                        className="flex-1 py-2.5 text-sm font-semibold text-white bg-violet-600 rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors"
                      >
                        {isCreating ? 'Creating...' : 'Create Key'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== DOCUMENTATION TAB ===== */}
      {activeTab === 'docs' && (
        <div className="space-y-4">
          {/* Quick Start */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Quick Start</h3>
            <div className="space-y-3">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Base URL</p>
                <code className="text-sm font-mono text-violet-700 bg-violet-50 px-3 py-1.5 rounded-lg border border-violet-100 block">
                  {typeof window !== 'undefined' ? window.location.origin : ''}/api/v1
                </code>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Authentication</p>
                <p className="text-xs text-slate-600 mb-2">Include your API key in the <code className="bg-slate-200 px-1.5 py-0.5 rounded">x-api-key</code> header:</p>
                <code className="text-xs font-mono text-slate-700 bg-white px-3 py-2 rounded-lg border border-slate-200 block">
                  {`curl -H "x-api-key: YOUR_API_KEY" ${typeof window !== 'undefined' ? window.location.origin : ''}/api/v1/events`}
                </code>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Response Format</p>
                <pre className="text-xs font-mono text-slate-700 bg-white px-3 py-2 rounded-lg border border-slate-200 overflow-x-auto">
{`{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "limit": 50, "total": 100, "totalPages": 2 }
}`}</pre>
              </div>
            </div>
          </div>

          {/* Endpoints */}
          <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">API Endpoints</h3>
              <p className="text-xs text-slate-500 mt-0.5">All endpoints require the <code className="bg-slate-100 px-1 rounded">x-api-key</code> header</p>
            </div>

            {[
              {
                id: 'auth',
                title: 'Authentication',
                icon: Shield,
                endpoints: [
                  { method: 'POST', path: '/api/v1/api-keys', desc: 'Generate a new API key' },
                  { method: 'GET', path: '/api/v1/api-keys', desc: 'List all API keys (masked)' },
                  { method: 'DELETE', path: '/api/v1/api-keys/:id', desc: 'Revoke an API key' },
                ],
              },
              {
                id: 'events',
                title: 'Events',
                icon: Calendar,
                endpoints: [
                  { method: 'GET', path: '/api/v1/events', desc: 'List events (pagination, filter by status, search by name)' },
                  { method: 'POST', path: '/api/v1/events', desc: 'Create event (requires: name, communityId, date)' },
                  { method: 'GET', path: '/api/v1/events/:id', desc: 'Get event with stalls, assignments, registration count' },
                  { method: 'PUT', path: '/api/v1/events/:id', desc: 'Update event fields' },
                  { method: 'DELETE', path: '/api/v1/events/:id', desc: 'Delete event (fails if registrations exist)' },
                ],
              },
              {
                id: 'communities',
                title: 'Communities',
                icon: Users,
                endpoints: [
                  { method: 'GET', path: '/api/v1/communities', desc: 'List communities (pagination, filter by status, search)' },
                  { method: 'POST', path: '/api/v1/communities', desc: 'Create community (requires: code, name, location, contactPerson)' },
                  { method: 'GET', path: '/api/v1/communities/:id', desc: 'Get community with event count' },
                  { method: 'PUT', path: '/api/v1/communities/:id', desc: 'Update community fields' },
                  { method: 'DELETE', path: '/api/v1/communities/:id', desc: 'Delete community (fails if events exist)' },
                ],
              },
              {
                id: 'stalls',
                title: 'Stalls',
                icon: ShoppingBag,
                endpoints: [
                  { method: 'GET', path: '/api/v1/stalls', desc: 'List stalls (pagination, filter by status)' },
                  { method: 'POST', path: '/api/v1/stalls', desc: 'Create stall (requires: name, optional: metrics array)' },
                  { method: 'GET', path: '/api/v1/stalls/:id', desc: 'Get stall with visit/assignment/event counts' },
                  { method: 'PUT', path: '/api/v1/stalls/:id', desc: 'Update stall fields' },
                  { method: 'DELETE', path: '/api/v1/stalls/:id', desc: 'Delete stall' },
                ],
              },
              {
                id: 'volunteers',
                title: 'Volunteers',
                icon: UserCheck,
                endpoints: [
                  { method: 'GET', path: '/api/v1/volunteers', desc: 'List volunteers (pagination, filter by status/role, search)' },
                  { method: 'POST', path: '/api/v1/volunteers', desc: 'Create volunteer (requires: name, email, password)' },
                  { method: 'GET', path: '/api/v1/volunteers/:id', desc: 'Get volunteer details' },
                  { method: 'PUT', path: '/api/v1/volunteers/:id', desc: 'Update volunteer fields' },
                  { method: 'DELETE', path: '/api/v1/volunteers/:id', desc: 'Delete volunteer' },
                ],
              },
              {
                id: 'users',
                title: 'Users (Admin)',
                icon: Users,
                endpoints: [
                  { method: 'GET', path: '/api/v1/users', desc: 'List admin/manager users (pagination, filter by role)' },
                  { method: 'POST', path: '/api/v1/users', desc: 'Create user (requires: name, email, password, optional: role)' },
                  { method: 'GET', path: '/api/v1/users/:id', desc: 'Get user details' },
                  { method: 'PUT', path: '/api/v1/users/:id', desc: 'Update user fields' },
                  { method: 'DELETE', path: '/api/v1/users/:id', desc: 'Delete user (cannot delete last admin)' },
                ],
              },
              {
                id: 'registrations',
                title: 'Registrations',
                icon: FileText,
                endpoints: [
                  { method: 'GET', path: '/api/v1/registrations', desc: 'List registrations (pagination, filter by status/eventId, search)' },
                  { method: 'POST', path: '/api/v1/registrations', desc: 'Create registration (requires: eventId + studentId OR name/grade/phone/parentName)' },
                  { method: 'GET', path: '/api/v1/registrations/:id', desc: 'Get registration with student, event, stall visits' },
                  { method: 'PUT', path: '/api/v1/registrations/:id', desc: 'Update registration status/notes' },
                  { method: 'DELETE', path: '/api/v1/registrations/:id', desc: 'Delete registration (cascades to visits/performances)' },
                ],
              },
              {
                id: 'students',
                title: 'Students',
                icon: GraduationCap,
                endpoints: [
                  { method: 'GET', path: '/api/v1/students', desc: 'List students (pagination, search by name/rollNumber)' },
                  { method: 'GET', path: '/api/v1/students/:id', desc: 'Get student with registrations' },
                  { method: 'PUT', path: '/api/v1/students/:id', desc: 'Update student fields' },
                ],
              },
              {
                id: 'stall-visits',
                title: 'Stall Visits',
                icon: Clock,
                endpoints: [
                  { method: 'GET', path: '/api/v1/stall-visits', desc: 'List stall visits (pagination, filter by registrationId/stallId)' },
                  { method: 'POST', path: '/api/v1/stall-visits', desc: 'Create stall visit (requires: registrationId, stallId, studentId)' },
                  { method: 'GET', path: '/api/v1/stall-visits/:id', desc: 'Get stall visit with performance' },
                ],
              },
              {
                id: 'performances',
                title: 'Performances',
                icon: Star,
                endpoints: [
                  { method: 'GET', path: '/api/v1/performances', desc: 'List performances (pagination, filter by volunteerId)' },
                  { method: 'POST', path: '/api/v1/performances', desc: 'Create performance (requires: stallVisitId, volunteerId, score, grade)' },
                  { method: 'GET', path: '/api/v1/performances/:id', desc: 'Get performance with stall visit and student info' },
                ],
              },
              {
                id: 'analytics',
                title: 'Analytics',
                icon: BarChart3,
                endpoints: [
                  { method: 'GET', path: '/api/v1/analytics/overview', desc: 'Overview stats, visit trends, performance by grade' },
                  { method: 'GET', path: '/api/v1/analytics/communities', desc: 'Per-community stats (participants, completion rate)' },
                  { method: 'GET', path: '/api/v1/analytics/stalls', desc: 'Per-stall stats (visits, volunteers)' },
                  { method: 'GET', path: '/api/v1/analytics/volunteers', desc: 'Per-volunteer stats (evaluations, avg rating)' },
                ],
              },
            ].map(section => (
              <div key={section.id} className="border-b border-slate-100 last:border-b-0">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <section.icon className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-800">{section.title}</span>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      {section.endpoints.length}
                    </span>
                  </div>
                  {expandedSection === section.id ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>
                {expandedSection === section.id && (
                  <div className="px-5 pb-4 space-y-2">
                    {section.endpoints.map((ep, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                          ep.method === 'GET' ? 'bg-blue-100 text-blue-700' :
                          ep.method === 'POST' ? 'bg-emerald-100 text-emerald-700' :
                          ep.method === 'PUT' ? 'bg-amber-100 text-amber-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          {ep.method}
                        </span>
                        <div className="min-w-0">
                          <code className="text-xs font-mono text-violet-700">{ep.path}</code>
                          <p className="text-[11px] text-slate-500 mt-0.5">{ep.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Query Parameters */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Common Query Parameters</h3>
            <div className="space-y-2">
              {[
                { param: 'page', desc: 'Page number (default: 1)', example: '?page=2' },
                { param: 'limit', desc: 'Items per page (default: 50, max: 100)', example: '?limit=25' },
                { param: 'q', desc: 'Search query (name, email, etc.)', example: '?q=john' },
                { param: 'status', desc: 'Filter by status', example: '?status=LIVE' },
                { param: 'role', desc: 'Filter by role (volunteers/users)', example: '?role=VOLUNTEER' },
                { param: 'eventId', desc: 'Filter by event ID (registrations)', example: '?eventId=uuid' },
              ].map(p => (
                <div key={p.param} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg">
                  <code className="text-xs font-mono text-violet-700 bg-violet-50 px-2 py-0.5 rounded shrink-0">{p.param}</code>
                  <span className="text-xs text-slate-600 flex-1">{p.desc}</span>
                  <code className="text-[10px] font-mono text-slate-400">{p.example}</code>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== PLAYGROUND TAB ===== */}
      {activeTab === 'playground' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200/80 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">API Playground</h3>
                <p className="text-xs text-slate-500 mt-0.5">Test API endpoints directly from the browser</p>
              </div>
              <a
                href="/api/v1/docs/ui"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-violet-600 bg-violet-50 rounded-lg hover:bg-violet-100 transition-colors border border-violet-100"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Swagger UI
              </a>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-600 mb-3">Try these example requests with your API key:</p>
              <div className="space-y-3">
                {[
                  { label: 'List Events', method: 'GET', path: '/api/v1/events' },
                  { label: 'List Communities', method: 'GET', path: '/api/v1/communities' },
                  { label: 'List Stalls', method: 'GET', path: '/api/v1/stalls' },
                  { label: 'List Volunteers', method: 'GET', path: '/api/v1/volunteers' },
                  { label: 'List Registrations', method: 'GET', path: '/api/v1/registrations' },
                  { label: 'Overview Analytics', method: 'GET', path: '/api/v1/analytics/overview' },
                ].map(ex => (
                  <div key={ex.path} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded shrink-0">
                      {ex.method}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700">{ex.label}</p>
                      <code className="text-[10px] font-mono text-slate-400">{ex.path}</code>
                    </div>
                    <button
                      onClick={() => copyToClipboard(`curl -H "x-api-key: YOUR_KEY" ${window.location.origin}${ex.path}`)}
                      className="p-1.5 text-slate-400 hover:text-violet-600 rounded-md transition-colors"
                      title="Copy curl command"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Tester */}
          <ApiTester />
        </div>
      )}
    </DashboardLayout>
  );
}

function Calendar(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
    </svg>
  );
}

function Users(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

function ShoppingBag(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  );
}

function UserCheck(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>
    </svg>
  );
}

function FileText(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/>
    </svg>
  );
}

function GraduationCap(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
    </svg>
  );
}

function Star(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}

function BarChart3(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>
    </svg>
  );
}

function ApiTester() {
  const [method, setMethod] = useState('GET');
  const [path, setPath] = useState('/api/v1/events');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTest = async () => {
    setIsLoading(true);
    setResponse(null);
    try {
      const res = await fetch(path, {
        method,
        headers: { 'x-api-key': apiKey },
      });
      const data = await res.json();
      setResponseStatus(res.status);
      setResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      setResponseStatus(null);
      setResponse(`Error: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5">
      <h3 className="text-sm font-bold text-slate-900 mb-4">Test an Endpoint</h3>
      <div className="space-y-3">
        <div className="grid grid-cols-4 gap-2">
          <select
            value={method}
            onChange={e => setMethod(e.target.value)}
            className="px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-800"
          >
            {['GET', 'POST', 'PUT', 'DELETE'].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <input
            type="text"
            value={path}
            onChange={e => setPath(e.target.value)}
            placeholder="/api/v1/events"
            className="col-span-3 px-4 py-2.5 text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-800"
          />
        </div>
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="Enter your API key"
            className="w-full px-4 py-2.5 text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-800 pr-10"
          />
          <button
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <button
          onClick={handleTest}
          disabled={isLoading || !apiKey}
          className="w-full py-2.5 text-sm font-semibold text-white bg-violet-600 rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Sending...' : 'Send Request'}
        </button>
      </div>

      {response && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-slate-500">Response</span>
            {responseStatus && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                responseStatus >= 200 && responseStatus < 300 ? 'bg-emerald-100 text-emerald-700' :
                responseStatus >= 400 ? 'bg-rose-100 text-rose-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                {responseStatus}
              </span>
            )}
          </div>
          <pre className="text-xs font-mono text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-4 overflow-x-auto max-h-96 overflow-y-auto">
            {response}
          </pre>
        </div>
      )}
    </div>
  );
}
