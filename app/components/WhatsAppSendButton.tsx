'use client'

import { useState } from 'react'
import { MessageCircle, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface WhatsAppSendButtonProps {
  registrationId: string
  phoneNumber?: string | null
  type: 'registration' | 'report' | 'id-card'
  variant?: 'icon' | 'full'
  disabled?: boolean
  className?: string
}

export default function WhatsAppSendButton({
  registrationId,
  phoneNumber,
  type,
  variant = 'icon',
  disabled = false,
  className = '',
}: WhatsAppSendButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSend = async () => {
    if (!phoneNumber) {
      setStatus('error')
      setErrorMsg('No phone number')
      setTimeout(() => setStatus('idle'), 3000)
      return
    }

    setStatus('loading')
    setErrorMsg('')

    try {
      const endpoint = type === 'registration'
        ? '/api/whatsapp/send-registration'
        : type === 'id-card'
        ? '/api/whatsapp/send-id-card'
        : '/api/whatsapp/send-report'

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId }),
      })

      const data = await res.json()

      if (data.success) {
        setStatus('success')
        setTimeout(() => setStatus('idle'), 3000)
      } else {
        setStatus('error')
        setErrorMsg(data.error || 'Failed')
        setTimeout(() => setStatus('idle'), 5000)
      }
    } catch {
      setStatus('error')
      setErrorMsg('Network error')
      setTimeout(() => setStatus('idle'), 5000)
    }
  }

  const labels = {
    registration: 'Send QR',
    report: 'Send Report',
    'id-card': 'Send ID Card',
  }

  const buttonLabel = labels[type]
  const iconSize = variant === 'full' ? 'w-3.5 h-3.5' : 'w-3.5 h-3.5'

  if (variant === 'full') {
    return (
      <button
        onClick={handleSend}
        disabled={disabled || status === 'loading' || !phoneNumber}
        className={`flex items-center gap-2 text-xs font-medium transition-colors disabled:opacity-40 ${className}`}
        title={!phoneNumber ? 'No phone number' : `${buttonLabel} via WhatsApp`}
      >
        {status === 'loading' ? (
          <Loader2 className={`${iconSize} animate-spin`} />
        ) : status === 'success' ? (
          <CheckCircle2 className={`${iconSize} text-emerald-600`} />
        ) : status === 'error' ? (
          <AlertCircle className={`${iconSize} text-rose-600`} />
        ) : (
          <MessageCircle className={`${iconSize} text-emerald-600`} />
        )}
        <span>{status === 'success' ? 'Sent!' : status === 'error' ? errorMsg : buttonLabel}</span>
      </button>
    )
  }

  if (status === 'success') {
    return (
      <button
        className={`p-1.5 text-emerald-600 bg-emerald-50 rounded-md transition-colors ${className}`}
        title="Sent successfully"
        disabled
      >
        <CheckCircle2 className={iconSize} />
      </button>
    )
  }

  if (status === 'error') {
    return (
      <button
        className={`p-1.5 text-rose-600 bg-rose-50 rounded-md transition-colors ${className}`}
        title={errorMsg || 'Failed to send'}
        disabled
      >
        <AlertCircle className={iconSize} />
      </button>
    )
  }

  return (
    <button
      onClick={handleSend}
      disabled={disabled || status === 'loading' || !phoneNumber}
      className={`p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors disabled:opacity-40 ${className}`}
      title={!phoneNumber ? 'No phone number' : `${buttonLabel} via WhatsApp`}
    >
      {status === 'loading' ? (
        <Loader2 className={`${iconSize} animate-spin`} />
      ) : (
        <MessageCircle className={iconSize} />
      )}
    </button>
  )
}
