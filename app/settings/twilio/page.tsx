'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/app/components/DashboardLayout'
import { Save, Loader2, CheckCircle2, AlertCircle, MessageCircle } from 'lucide-react'

interface TwilioConfig {
  id: string
  accountSid: string | null
  authToken: string | null
  whatsAppFrom: string | null
  autoSendOnRegistration: boolean
  registrationContentSid: string | null
  reportContentSid: string | null
  isActive: boolean
}

export default function TwilioSettingsPage() {
  const [config, setConfig] = useState<TwilioConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [appUrl, setAppUrl] = useState('')
  
  const [form, setForm] = useState({
    accountSid: '',
    authToken: '',
    whatsAppFrom: '',
    autoSendOnRegistration: false,
    registrationContentSid: '',
    reportContentSid: '',
    isActive: true,
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAppUrl(window.location.origin)
    }

    async function loadConfig() {
      try {
        const res = await fetch('/api/settings/twilio')
        if (res.ok) {
          const data = await res.json()
          if (data.config) {
            setConfig(data.config)
            setForm({
              accountSid: data.config.accountSid || '',
              authToken: data.config.authToken || '',
              whatsAppFrom: data.config.whatsAppFrom || '',
              autoSendOnRegistration: data.config.autoSendOnRegistration || false,
              registrationContentSid: data.config.registrationContentSid || '',
              reportContentSid: data.config.reportContentSid || '',
              isActive: data.config.isActive ?? true,
            })
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    loadConfig()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage(null)

    try {
      const res = await fetch('/api/settings/twilio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountSid: form.accountSid.trim() || null,
          authToken: form.authToken.trim() || null,
          whatsAppFrom: form.whatsAppFrom.trim() || null,
          autoSendOnRegistration: form.autoSendOnRegistration,
          registrationContentSid: form.registrationContentSid.trim() || null,
          reportContentSid: form.reportContentSid.trim() || null,
          isActive: form.isActive,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setConfig(data.config)
        setSaveMessage({ type: 'success', text: 'Configuration saved successfully' })
        setTimeout(() => setSaveMessage(null), 3000)
      } else {
        const data = await res.json()
        setSaveMessage({ type: 'error', text: data.error || 'Failed to save' })
      }
    } catch {
      setSaveMessage({ type: 'error', text: 'Network error' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DashboardLayout
      title="Twilio Settings"
      subtitle="Manage your Twilio WhatsApp integration for automated messages."
    >
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Twilio Integration</h1>
            <p className="text-sm text-slate-500">
              Configure your Twilio account details to send automated WhatsApp messages.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-12 bg-white rounded-xl shadow-sm border border-slate-100">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-6">
                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                  Account Configuration
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 block">Account SID</label>
                    <input
                      type="text"
                      className="w-full text-sm px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="AC..."
                      value={form.accountSid}
                      onChange={(e) => setForm({ ...form, accountSid: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 block">Auth Token</label>
                    <input
                      type="password"
                      className="w-full text-sm px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="••••••••••••••••"
                      value={form.authToken}
                      onChange={(e) => setForm({ ...form, authToken: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 block">WhatsApp From Number</label>
                  <input
                    type="text"
                    className="w-full text-sm px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="whatsapp:+14155238886"
                    value={form.whatsAppFrom}
                    onChange={(e) => setForm({ ...form, whatsAppFrom: e.target.value })}
                  />
                  <p className="text-[10px] text-slate-400">Must include the "whatsapp:" prefix</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-6">
                <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                  Templates & Triggers
                </h2>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">Auto-Send on Registration</h3>
                    <p className="text-xs text-slate-500">Automatically send the Welcome Message upon registration.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={form.autoSendOnRegistration}
                      onChange={(e) => setForm({ ...form, autoSendOnRegistration: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 block">Registration Template Content SID</label>
                    <input
                      type="text"
                      className="w-full text-sm px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="HX..."
                      value={form.registrationContentSid}
                      onChange={(e) => setForm({ ...form, registrationContentSid: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 block">Report Template Content SID</label>
                    <input
                      type="text"
                      className="w-full text-sm px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="HX..."
                      value={form.reportContentSid}
                      onChange={(e) => setForm({ ...form, reportContentSid: e.target.value })}
                    />
                  </div>
                </div>

                {saveMessage && (
                  <div className={`p-4 rounded-lg flex items-start gap-2 border text-sm ${
                    saveMessage.type === 'success' 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    {saveMessage.type === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
                    )}
                    <span>{saveMessage.text}</span>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Configuration
                  </button>
                </div>
              </div>
            </div>

            <div className="md:col-span-1 space-y-6">
              <div className="bg-slate-900 text-white p-6 rounded-xl shadow-sm border border-slate-800">
                <h3 className="font-semibold mb-4 text-purple-400">Twilio Webhook URL</h3>
                <p className="text-sm text-slate-300 mb-4">
                  Copy this URL and paste it into your Twilio Console under WhatsApp Senders ➜ <strong>Webhook for incoming messages</strong>. This allows the system to process "Get ID Card" button clicks.
                </p>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-700 break-all text-xs text-purple-300 font-mono">
                  {appUrl}/api/public/webhook/twilio
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
