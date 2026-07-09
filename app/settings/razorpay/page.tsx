'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/app/components/DashboardLayout'
import { CreditCard, Save, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff, Wifi } from 'lucide-react'

interface RazorpayConfig {
  id: string
  keyId: string
  keySecret: string
  webhookSecret: string | null
  isActive: boolean
}

export default function RazorpaySettingsPage() {
  const [config, setConfig] = useState<RazorpayConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [showSecret, setShowSecret] = useState(false)
  const [showWebhookSecret, setShowWebhookSecret] = useState(false)

  const [form, setForm] = useState({
    keyId: '',
    keySecret: '',
    webhookSecret: '',
  })

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/settings/razorpay')
        if (res.ok) {
          const data = await res.json()
          if (data.config) {
            setConfig(data.config)
            setForm({
              keyId: data.config.keyId,
              keySecret: '',
              webhookSecret: '',
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
    if (!form.keyId.trim() || !form.keySecret.trim()) {
      setSaveMessage('Key ID and Key Secret are required')
      return
    }

    setIsSaving(true)
    setSaveMessage(null)

    try {
      const res = await fetch('/api/settings/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyId: form.keyId.trim(),
          keySecret: form.keySecret.trim(),
          webhookSecret: form.webhookSecret.trim() || null,
        }),
      })

      if (res.ok) {
        setSaveMessage('Configuration saved successfully')
        setForm(prev => ({ ...prev, keySecret: '', webhookSecret: '' }))
        // Reload config to get masked values
        const reload = await fetch('/api/settings/razorpay')
        if (reload.ok) {
          const data = await reload.json()
          if (data.config) setConfig(data.config)
        }
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
      const res = await fetch('/api/settings/razorpay/test', { method: 'POST' })
      const data = await res.json()

      setTestResult({
        success: data.success,
        message: data.success
          ? data.message
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
      <DashboardLayout title="Razorpay Configuration" subtitle="Loading...">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Razorpay Configuration"
      subtitle="Configure Razorpay for collecting paid registration fees"
    >
      <div className="max-w-2xl space-y-6">
        {/* Status Card */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Razorpay Payment Gateway</h3>
              <p className="text-xs text-slate-500">Collect registration fees via UPI, cards, netbanking & wallets</p>
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
            <label className="text-xs font-semibold text-slate-700">Key ID *</label>
            <input
              type="text"
              value={form.keyId}
              onChange={e => setForm({ ...form, keyId: e.target.value })}
              placeholder="rzp_test_xxxxx or rzp_live_xxxxx"
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-800 placeholder:text-slate-400 font-mono"
            />
            {config && (
              <p className="text-[10px] text-slate-400">Current: {config.keyId}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Key Secret *</label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                value={form.keySecret}
                onChange={e => setForm({ ...form, keySecret: e.target.value })}
                placeholder={config ? 'Enter new secret to update' : 'Your Razorpay key secret'}
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-800 placeholder:text-slate-400 pr-10 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {config && (
              <p className="text-[10px] text-slate-400">Current: {config.keySecret}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Webhook Secret</label>
            <div className="relative">
              <input
                type={showWebhookSecret ? 'text' : 'password'}
                value={form.webhookSecret}
                onChange={e => setForm({ ...form, webhookSecret: e.target.value })}
                placeholder={config?.webhookSecret ? 'Enter new secret to update' : 'Optional — for webhook signature verification'}
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-800 placeholder:text-slate-400 pr-10 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showWebhookSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {config?.webhookSecret && (
              <p className="text-[10px] text-slate-400">Current: {config.webhookSecret}</p>
            )}
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

        {/* How to get keys */}
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
          <h3 className="text-sm font-bold text-blue-900 mb-2">How to get Razorpay API keys</h3>
          <ol className="text-xs text-blue-800 space-y-1.5 list-decimal list-inside">
            <li>Go to <a href="https://dashboard.razorpay.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Razorpay Dashboard</a></li>
            <li>Login or create a Razorpay account</li>
            <li>Navigate to Settings → API Keys</li>
            <li>Click "Generate Key" to create a new key pair</li>
            <li>Copy the <strong>Key ID</strong> (starts with <code className="bg-blue-100 px-1 rounded">rzp_test_</code> or <code className="bg-blue-100 px-1 rounded">rzp_live_</code>)</li>
            <li>Copy the <strong>Key Secret</strong> (shown only once — save it securely)</li>
            <li>For webhooks: go to Settings → Webhooks, create a webhook, and copy the <strong>Secret</strong></li>
          </ol>
          <div className="mt-3 p-3 bg-blue-100 rounded-lg">
            <p className="text-[11px] text-blue-900 font-semibold">Test vs Live Mode</p>
            <p className="text-[11px] text-blue-800 mt-1">Use <code className="bg-blue-200 px-1 rounded">rzp_test_</code> keys for testing. Switch to <code className="bg-blue-200 px-1 rounded">rzp_live_</code> keys when ready for production. Test card: <code className="bg-blue-200 px-1 rounded">4111 1111 1111 1111</code></p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
