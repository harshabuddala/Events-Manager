'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/app/components/DashboardLayout'
import { MessageCircle, Save, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff, Wifi } from 'lucide-react'

interface WhatsAppConfig {
  id: string
  phoneNumberId: string
  accessToken: string
  apiVersion: string
  businessAccountId: string | null
  isActive: boolean
}

export default function WhatsAppSettingsPage() {
  const [config, setConfig] = useState<WhatsAppConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [showToken, setShowToken] = useState(false)

  const [form, setForm] = useState({
    phoneNumberId: '',
    accessToken: '',
    apiVersion: 'v18.0',
    businessAccountId: '',
  })

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/settings/whatsapp')
        if (res.ok) {
          const data = await res.json()
          if (data.config) {
            setConfig(data.config)
            setForm({
              phoneNumberId: data.config.phoneNumberId,
              accessToken: '',
              apiVersion: data.config.apiVersion,
              businessAccountId: data.config.businessAccountId || '',
            })
          }
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false)
      }
    }
    loadConfig()
  }, [])

  const handleSave = async () => {
    if (!form.phoneNumberId.trim() || !form.accessToken.trim()) {
      setSaveMessage('Phone Number ID and Access Token are required')
      return
    }

    setIsSaving(true)
    setSaveMessage(null)

    try {
      const res = await fetch('/api/settings/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumberId: form.phoneNumberId.trim(),
          accessToken: form.accessToken.trim(),
          apiVersion: form.apiVersion.trim(),
          businessAccountId: form.businessAccountId.trim() || null,
        }),
      })

      if (res.ok) {
        setSaveMessage('Configuration saved successfully')
        setForm(prev => ({ ...prev, accessToken: '' }))
        setTimeout(() => setSaveMessage(null), 3000)
      } else {
        const data = await res.json()
        setSaveMessage(data.error || 'Failed to save')
      }
    } catch {
      setSaveMessage('Network error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestResult(null)

    try {
      const res = await fetch('/api/settings/whatsapp/test', { method: 'POST' })
      const data = await res.json()

      setTestResult({
        success: data.success,
        message: data.success
          ? `Connected to ${data.phone || 'WhatsApp'}${data.verifiedName ? ` (${data.verifiedName})` : ''}`
          : data.error || 'Connection failed',
      })
    } catch {
      setTestResult({ success: false, message: 'Network error' })
    } finally {
      setIsTesting(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout title="WhatsApp Configuration" subtitle="Loading...">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="WhatsApp Configuration"
      subtitle="Configure WhatsApp Business API for sending messages"
    >
      <div className="max-w-2xl space-y-6">
        {/* Status Card */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">WhatsApp Business API</h3>
              <p className="text-xs text-slate-500">Meta Cloud API integration for sending messages</p>
            </div>
            <div className="ml-auto">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                config
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${config ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                {config ? 'Configured' : 'Not Configured'}
              </span>
            </div>
          </div>
        </div>

        {/* Configuration Form */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 mb-1">API Credentials</h3>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Phone Number ID *</label>
            <input
              type="text"
              value={form.phoneNumberId}
              onChange={e => setForm({ ...form, phoneNumberId: e.target.value })}
              placeholder="e.g. 123456789012345"
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-800 placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Access Token *</label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={form.accessToken}
                onChange={e => setForm({ ...form, accessToken: e.target.value })}
                placeholder={config ? 'Enter new token to update' : 'Your WhatsApp access token'}
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-800 placeholder:text-slate-400 pr-10"
              />
              <button
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {config && (
              <p className="text-[10px] text-slate-400">Current: {config.accessToken}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">API Version</label>
              <input
                type="text"
                value={form.apiVersion}
                onChange={e => setForm({ ...form, apiVersion: e.target.value })}
                placeholder="v18.0"
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-800"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Business Account ID</label>
              <input
                type="text"
                value={form.businessAccountId}
                onChange={e => setForm({ ...form, businessAccountId: e.target.value })}
                placeholder="Optional"
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-800 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </button>

            <button
              onClick={handleTestConnection}
              disabled={isTesting || !config}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wifi className="w-3.5 h-3.5" />}
              {isTesting ? 'Testing...' : 'Test Connection'}
            </button>
          </div>

          {/* Messages */}
          {saveMessage && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-xs font-medium ${
              saveMessage.includes('success') ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
            }`}>
              {saveMessage.includes('success') ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {saveMessage}
            </div>
          )}

          {testResult && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-xs font-medium ${
              testResult.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
            }`}>
              {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {testResult.message}
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
          <h3 className="text-sm font-bold text-blue-900 mb-2">How to get WhatsApp Business API credentials</h3>
          <ol className="text-xs text-blue-800 space-y-1.5 list-decimal list-inside">
            <li>Go to <a href="https://business.facebook.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Meta Business Suite</a></li>
            <li>Navigate to Business Settings → Accounts → WhatsApp Accounts</li>
            <li>Select your WhatsApp Business Account</li>
            <li>Go to WhatsApp Manager → Phone Numbers</li>
            <li>Copy your Phone Number ID</li>
            <li>Generate a Permanent Access Token in System Users</li>
          </ol>
        </div>
      </div>
    </DashboardLayout>
  )
}
