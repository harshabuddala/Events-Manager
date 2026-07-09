'use client'
import React, { useState } from 'react'
import { Lock, CheckCircle, Share2, AlertCircle, IdCard, Download, Eye, Loader2 } from 'lucide-react'
import confetti from 'canvas-confetti'
import { type LandingEventData } from '../types'

interface RazorpayResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

export default function RegistrationForm({ event }: { event: LandingEventData }) {
  const fee = event.registrationFee ?? 0

  const [formData, setFormData] = useState({
    parentName: '',
    whatsappNumber: '',
    numberOfKids: 1,
  })
  const [kids, setKids] = useState([{ name: '', age: '', grade: '' }])
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [registrations, setRegistrations] = useState<any[]>([])

  const totalAmount = formData.numberOfKids * fee

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name === 'numberOfKids') {
      const newCount = parseInt(value)
      setFormData(prev => ({ ...prev, numberOfKids: newCount }))
      setKids(prev => {
        const newKids = [...prev]
        if (newCount > prev.length) {
          for (let i = prev.length; i < newCount; i++) newKids.push({ name: '', age: '', grade: '' })
        } else if (newCount < prev.length) {
          newKids.splice(newCount)
        }
        return newKids
      })
    } else if (name === 'whatsappNumber') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10)
      setFormData(prev => ({ ...prev, whatsappNumber: digitsOnly }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
    setStatus('idle')
    setErrorMessage('')
  }

  const handleKidChange = (index: number, field: string, value: string) => {
    setKids(prev => {
      const newKids = [...prev]
      if (field === 'age') {
        const digitsOnly = value.replace(/\D/g, '').slice(0, 2)
        const num = parseInt(digitsOnly, 10)
        if (digitsOnly !== '' && (isNaN(num) || num < 0 || num > 16)) return prev
        newKids[index] = { ...newKids[index], [field]: digitsOnly }
      } else {
        newKids[index] = { ...newKids[index], [field]: value }
      }
      return newKids
    })
    setStatus('idle')
    setErrorMessage('')
  }

  const isFormValid = () => {
    if (!formData.parentName || !formData.whatsappNumber) return false
    if (formData.whatsappNumber.length !== 10) return false
    for (const kid of kids) {
      if (!kid.name || !kid.grade) return false
      const ageNum = parseInt(kid.age, 10)
      if (kid.age && (isNaN(ageNum) || ageNum < 0 || ageNum > 16)) return false
    }
    return true
  }

  const openRazorpay = (orderData: { orderId: string; amount: number; currency: string; keyId: string; prefill: any }): Promise<RazorpayResponse> => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.Razorpay) {
        reject(new Error('Razorpay SDK not loaded. Please refresh the page and try again.'))
        return
      }
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: event.name,
        description: `Registration for ${kids.length} kid${kids.length > 1 ? 's' : ''}`,
        order_id: orderData.orderId,
        prefill: orderData.prefill,
        theme: { color: '#F5730B' },
        redirect: false,
        retry: { enabled: false },
        timeout: 900,
        handler: (response: RazorpayResponse) => {
          resolve(response)
        },
        modal: {
          ondismiss: () => reject(new Error('Payment cancelled')),
          escape: true,
          closeOnSuccess: true,
          backdropclose: false,
        },
      }
      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (r: any) => reject(new Error(r.error?.description || 'Payment failed')))
      try {
        rzp.open()
      } catch (err) {
        reject(err)
      }
    })
  }

  const handleSubmit = async () => {
    if (!isFormValid()) {
      setStatus('error')
      setErrorMessage('Please fill in all required fields.')
      return
    }
    if (formData.whatsappNumber.length !== 10) {
      setStatus('error')
      setErrorMessage('Please enter a valid 10-digit WhatsApp number.')
      return
    }

    setStatus('loading')
    setErrorMessage('')

    try {
      if (fee > 0) {
        // PAID FLOW: one order for all kids
        const orderRes = await fetch(`/api/public/events/${event.id}/create-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: formData.whatsappNumber,
            parentName: formData.parentName,
            students: kids.map(kid => ({ name: kid.name, grade: kid.grade, age: kid.age || '' })),
          }),
        })
        const orderData = await orderRes.json()
        if (!orderRes.ok) {
          setStatus('error')
          setErrorMessage(orderData.error || 'Failed to create order')
          return
        }

        // Open Razorpay with total amount
        const paymentResponse = await openRazorpay(orderData)

        // Verify payment and create all students
        const verifyRes = await fetch(`/api/public/events/${event.id}/verify-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...paymentResponse,
            phoneNumber: formData.whatsappNumber,
            parentName: formData.parentName,
            students: kids.map(kid => ({ name: kid.name, grade: kid.grade, age: kid.age || '' })),
          }),
        })
        const verifyData = await verifyRes.json()
        if (!verifyRes.ok) {
          setStatus('error')
          setErrorMessage(verifyData.error || 'Payment verification failed')
          return
        }

        setRegistrations(verifyData.registrations || [])
      } else {
        // FREE FLOW: register each kid
        const completed: any[] = []
        for (const kid of kids) {
          const res = await fetch(`/api/public/events/${event.id}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: kid.name,
              grade: kid.grade,
              age: kid.age || '',
              email: '',
              phoneNumber: formData.whatsappNumber,
              parentName: formData.parentName,
            }),
          })
          const data = await res.json()
          if (!res.ok) {
            setStatus('error')
            setErrorMessage(data.error || `Failed to register ${kid.name}`)
            return
          }
          completed.push(data.registration)
        }
        setRegistrations(completed)
      }

      setStatus('success')
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F5730B', '#25D366', '#0B1F4D', '#FCD34D'],
      })

      // Auto-download ID cards for all registered students
      for (const reg of registrations) {
        const token = reg.qrToken || reg.registrationCode
        if (!token) continue
        try {
          const res = await fetch(`/api/public/registrations/${token}/id-card`)
          if (!res.ok) continue
          const blob = await res.blob()
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `id-card-${reg.student?.rollNumber || token}.pdf`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          await new Promise(r => setTimeout(r, 500))
        } catch {
          // Silent fail for individual downloads
        }
      }
    } catch (err: any) {
      setStatus('error')
      setErrorMessage(err.message || 'Something went wrong. Please try again.')
    }
  }

  const [downloadingCard, setDownloadingCard] = useState<string | null>(null)
  const [viewingCard, setViewingCard] = useState<{ token: string; url: string; name: string } | null>(null)
  const [viewingLoading, setViewingLoading] = useState<string | null>(null)

  const handleDownloadIdCard = async (reg: any) => {
    const token = reg.qrToken || reg.registrationCode
    if (!token) return
    setDownloadingCard(token)
    try {
      const res = await fetch(`/api/public/registrations/${token}/id-card`)
      if (!res.ok) throw new Error('Failed to generate ID card')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `id-card-${reg.student?.rollNumber || token}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setErrorMessage('Failed to download ID card. Please try again.')
    } finally {
      setDownloadingCard(null)
    }
  }

  const handleViewIdCard = async (reg: any) => {
    const token = reg.qrToken || reg.registrationCode
    if (!token) return
    setViewingLoading(token)
    try {
      const res = await fetch(`/api/public/registrations/${token}/id-card`)
      if (!res.ok) throw new Error('Failed to generate ID card')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setViewingCard({ token, url, name: reg.student?.name || 'Student' })
    } catch (err) {
      setErrorMessage('Failed to view ID card. Please try again.')
    } finally {
      setViewingLoading(null)
    }
  }

  const closeViewer = () => {
    if (viewingCard) URL.revokeObjectURL(viewingCard.url)
    setViewingCard(null)
  }

  // SUCCESS SCREEN
  if (status === 'success') {
    return (
      <section id="registration" className="py-20 px-4 bg-white scroll-mt-20">
        <div className="max-w-2xl mx-auto p-8 md:p-12 rounded-3xl border border-green-100 bg-green-50/50 shadow-xl">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h2 className="font-display text-4xl font-bold text-gray-900 mb-4">🎉 You&apos;re In!</h2>
            <p className="text-xl text-gray-600">
              {registrations.length} {registrations.length === 1 ? 'registration' : 'registrations'} confirmed!
            </p>
            <p className="text-sm text-green-700 mt-2 font-semibold">ID cards are being downloaded automatically...</p>
          </div>

          <div className="space-y-4 mb-8">
            {registrations.map((reg, i) => {
              const token = reg.qrToken || reg.registrationCode
              const isDownloading = downloadingCard === token
              const isViewing = viewingLoading === token
              return (
                <div key={i} className="bg-white rounded-xl border border-green-200 p-5 shadow-sm">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-xl shrink-0">
                      {reg.student?.name?.charAt(0) || kids[i]?.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-lg">{reg.student?.name || kids[i]?.name}</p>
                      <p className="text-sm text-gray-500">Grade {reg.student?.grade || kids[i]?.grade}</p>
                    </div>
                    <div className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded whitespace-nowrap">✓ Registered</div>
                  </div>

                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100">
                    <div className="flex items-center gap-2 mb-1">
                      <IdCard className="w-4 h-4 text-orange-600" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600">ID Card Number</span>
                    </div>
                    <p className="text-2xl font-black font-mono text-orange-700 tracking-wider">
                      {reg.student?.rollNumber || 'PENDING'}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1">Present this at the event entry</p>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleViewIdCard(reg)}
                      disabled={isViewing}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-orange-200 text-orange-700 rounded-lg text-xs font-bold hover:bg-orange-50 transition-colors disabled:opacity-50"
                    >
                      {isViewing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                      Show ID Card
                    </button>
                    <button
                      onClick={() => handleDownloadIdCard(reg)}
                      disabled={isDownloading}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      Download PDF
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="text-center">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`I just registered ${registrations.length} kid${registrations.length > 1 ? 's' : ''} for ${event.name}! Join us. Register here: ${typeof window !== 'undefined' ? window.location.href : ''}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-lg py-4 px-8 rounded-full transition-all hover:scale-105"
            >
              <Share2 className="w-5 h-5" /> Invite a friend on WhatsApp
            </a>
          </div>
        </div>

        {/* ID Card Viewer Modal */}
        {viewingCard && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={closeViewer}>
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <IdCard className="w-5 h-5 text-orange-600" />
                  <h3 className="font-bold text-gray-900">ID Card — {viewingCard.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={viewingCard.url}
                    download={`id-card-${viewingCard.token}.pdf`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </a>
                  <button
                    onClick={closeViewer}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold"
                  >
                    Close
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto bg-gray-100">
                <iframe
                  src={viewingCard.url}
                  className="w-full h-full min-h-[70vh]"
                  title="ID Card PDF"
                />
              </div>
            </div>
          </div>
        )}
      </section>
    )
  }

  // FORM
  return (
    <section id="registration" className="bg-white p-4 lg:p-6 border border-gray-200 rounded-2xl shadow-xl flex flex-col gap-3 shrink-0">
      {status === 'error' && (
        <div className="mb-2 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="font-bold">{errorMessage}</p>
        </div>
      )}

      <h3 className="text-xl font-bold border-b border-gray-100 pb-2 mb-2 text-brand-primary">Secure Your Spot</h3>

      <div className="grid grid-cols-1 gap-4 text-sm mt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input type="text" name="parentName" value={formData.parentName} onChange={handleInputChange} className="p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none w-full" placeholder="Parent Name *" />
          <input type="tel" name="whatsappNumber" value={formData.whatsappNumber} onChange={handleInputChange} inputMode="numeric" pattern="[0-9]*" maxLength={10} className="p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none w-full" placeholder="WhatsApp Number *" />
        </div>

        <div className="flex items-center justify-between mt-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
          <label className="font-bold text-brand-primary">Number of Kids:</label>
          <select name="numberOfKids" value={formData.numberOfKids} onChange={handleInputChange} className="p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none bg-white font-bold">
            {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n} Kid{n > 1 ? 's' : ''}</option>)}
          </select>
        </div>

        <div className="space-y-3">
          {kids.map((kid, index) => (
            <div key={index} className="p-4 border border-brand-accent/20 bg-orange-50/30 rounded-xl space-y-3">
              <h4 className="font-bold text-brand-accent text-sm">Kid {index + 1}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input type="text" value={kid.name} onChange={e => handleKidChange(index, 'name', e.target.value)} className="p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none w-full md:col-span-2" placeholder="Kid's Name *" />
                <input type="number" value={kid.age} onChange={e => handleKidChange(index, 'age', e.target.value)} inputMode="numeric" pattern="[0-9]*" min={0} max={16} maxLength={2} className="p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none w-full" placeholder="Age" />
                <select value={kid.grade} onChange={e => handleKidChange(index, 'grade', e.target.value)} className="p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none w-full text-gray-800">
                  <option value="">Select Class/Grade *</option>
                  {['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(g => (
                    <option key={g} value={g}>{isNaN(Number(g)) ? g : `Grade ${g}`}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between items-end mb-4">
          <div className="text-gray-500 font-medium text-sm">
            {fee > 0 ? `Total: ₹${fee} × ${formData.numberOfKids}` : 'Free Registration'}
          </div>
          <div className="text-2xl font-black text-brand-primary">
            {fee > 0 ? `₹${totalAmount}` : 'FREE'}
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={status === 'loading' || !isFormValid()}
          className="w-full bg-[#F5730B] hover:bg-orange-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg shadow-[0_4px_14px_0_rgba(245,115,11,0.39)] disabled:shadow-none transition-all flex items-center justify-center"
        >
          {status === 'loading' ? 'Processing...' : fee > 0 ? `Pay ₹${totalAmount} & Confirm Registration` : 'Register Now — It\'s Free!'}
        </button>
      </div>

      <div className="flex justify-center items-center gap-4 opacity-50 text-[10px] font-bold uppercase mt-2">
        {fee > 0 && <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Secure Razorpay</span>}
        <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> WhatsApp Confirmation</span>
      </div>
    </section>
  )
}
