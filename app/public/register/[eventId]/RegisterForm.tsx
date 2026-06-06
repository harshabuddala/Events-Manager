'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, Loader2, AlertCircle, User, BookOpen, Phone, Mail, Users, Printer, IdCard, Hash } from 'lucide-react'
import { generateLogoQrCode } from '@/lib/qr'

interface EventInfo {
  id: string
  name: string
  code: string
  date: string
  endDate?: string | null
  status: string
  description?: string | null
  community: { name: string; location: string }
}

interface Registration {
  id: string
  registrationCode: string
  student: {
    rollNumber: string
    name: string
    grade: string
    age?: number | null
    email?: string | null
    parentName?: string | null
    phoneNumber?: string | null
  }
  event: {
    id: string
    name: string
    date: string
    community: { name: string; location: string }
  }
}

export default function RegisterForm({ event }: { event: EventInfo }) {
  const [form, setForm] = useState({
    name: '',
    grade: '',
    age: '',
    email: '',
    phoneNumber: '',
    parentName: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [registration, setRegistration] = useState<Registration | null>(null)
  const [printingId, setPrintingId] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!registration) {
      setQrCodeUrl(null)
      return
    }
    const generateQr = async () => {
      try {
        const dataUrl = await generateLogoQrCode(registration.registrationCode, 300)
        setQrCodeUrl(dataUrl)
      } catch (err) {
        console.error('Failed to generate QR code:', err)
      }
    }
    generateQr()
  }, [registration])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.grade.trim() || !form.parentName.trim() || !form.phoneNumber.trim()) {
      setError('Student Name, Class, Parent Name, and Phone Number are required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/public/events/${event.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Registration failed')
        return
      }
      setRegistration(data.registration)
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePrintIdCard = async () => {
    if (!registration || !qrCodeUrl) return
    setPrintingId(true)
    try {
      const { pdf } = await import('@react-pdf/renderer')
      const { IdCardPdf } = await import('@/app/components/IdCardPdf')

      const fullReg = {
        ...registration,
        event: {
          ...registration.event,
          stalls: [],
        },
      }

      const doc = (
        <IdCardPdf
          registration={fullReg}
          backgroundImage={null}
          qrCodeDataUrl={qrCodeUrl}
        />
      )

      const blob = await pdf(doc).toBlob()
      const url = URL.createObjectURL(blob)
      const printFrame = document.createElement('iframe')
      printFrame.style.position = 'fixed'
      printFrame.style.top = '-10000px'
      printFrame.style.left = '-10000px'
      printFrame.style.width = '0'
      printFrame.style.height = '0'
      printFrame.src = url
      document.body.appendChild(printFrame)
      printFrame.onload = () => {
        printFrame.contentWindow?.focus()
        printFrame.contentWindow?.print()
        setTimeout(() => {
          document.body.removeChild(printFrame)
          URL.revokeObjectURL(url)
        }, 1000)
      }
    } catch (err) {
      console.error('Print error:', err)
      alert('Failed to generate ID card. Please try again.')
    } finally {
      setPrintingId(false)
    }
  }

  const eventDate = new Date(event.date)
  const formattedDate = eventDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // ─── SUCCESS SCREEN ───────────────────────────────────────────────
  if (registration) {
    return (
      <div className="public-success">
        <div className="success-icon-wrap">
          <CheckCircle2 className="success-icon" />
        </div>
        <h2 className="success-title">You're Registered! 🎉</h2>
        <p className="success-subtitle">
          Your registration is confirmed.
        </p>

        <div className="id-card-container">
          <div className="id-card-visual">
            <img src="/id_card_design.png" alt="ID Card Template" className="id-card-bg" />
            <div className="id-card-overlay">
              <div className="id-card-student-section">
                <h3 className="id-card-name">{registration.student.name}</h3>
                <p className="id-card-meta">
                  Roll No: <span className="font-mono">{registration.student.rollNumber}</span> • Class: {isNaN(Number(registration.student.grade)) ? registration.student.grade : `Grade ${registration.student.grade}`}
                </p>
                <p className="id-card-parent">
                  Parent: {registration.student.parentName || '—'}
                </p>
              </div>

              <div className="id-card-qr-section">
                <div className="id-card-qr-border">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="QR Code" className="id-card-qr-img" />
                  ) : (
                    <div className="id-card-qr-loading">Generating QR...</div>
                  )}
                </div>
              </div>

              <div className="id-card-footer-section">
                <span className="id-card-pass-label">STUDENT ENTRY PASS</span>
                <span className="id-card-event-name">{registration.event.name}</span>
              </div>
            </div>
          </div>
        </div>

        <p className="qr-hint">Use the button below to print your ID card — bring it to the event!</p>

        <button
          onClick={handlePrintIdCard}
          disabled={printingId}
          className="print-btn"
        >
          {printingId ? (
            <><Loader2 className="btn-icon spin" /> Preparing ID Card...</>
          ) : (
            <><IdCard className="btn-icon" /> Print ID Card (A6)</>
          )}
        </button>

        <button
          onClick={() => {
            setRegistration(null)
            setForm({ name: '', grade: '', age: '', email: '', phoneNumber: '', parentName: '' })
          }}
          className="register-another-btn"
        >
          Register Another Student
        </button>
      </div>
    )
  }

  // ─── REGISTRATION FORM ────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="reg-form" noValidate>
      <div className="form-section-label">Student Details</div>

      <div className="form-group">
        <label htmlFor="name" className="form-label">
          <User className="label-icon" /> Full Name <span className="required">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={form.name}
          onChange={handleChange}
          placeholder="Enter student's full name"
          className="form-input"
          autoComplete="name"
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="grade" className="form-label">
            <BookOpen className="label-icon" /> Class / Grade <span className="required">*</span>
          </label>
          <select
            id="grade"
            name="grade"
            value={form.grade}
            onChange={handleChange}
            className="form-input"
            required
          >
            <option value="">Select Class / Grade...</option>
            {['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(g => (
              <option key={g} value={g}>
                {isNaN(Number(g)) ? g : `Grade ${g}`}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="age" className="form-label">
            <Hash className="label-icon" /> Age
          </label>
          <input
            id="age"
            name="age"
            type="number"
            min={1}
            max={100}
            value={form.age}
            onChange={handleChange}
            placeholder="e.g. 12"
            className="form-input"
          />
        </div>
      </div>

      <div className="form-section-label" style={{ marginTop: '1.5rem' }}>Parent / Guardian Details</div>

      <div className="form-group">
        <label htmlFor="parentName" className="form-label">
          <Users className="label-icon" /> Parent / Guardian Name <span className="required">*</span>
        </label>
        <input
          id="parentName"
          name="parentName"
          type="text"
          value={form.parentName}
          onChange={handleChange}
          placeholder="Parent or guardian name"
          className="form-input"
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="phoneNumber" className="form-label">
            <Phone className="label-icon" /> Phone <span className="required">*</span>
          </label>
          <input
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            value={form.phoneNumber}
            onChange={handleChange}
            placeholder="Contact number"
            className="form-input"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email" className="form-label">
            <Mail className="label-icon" /> Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="email@example.com"
            className="form-input"
          />
        </div>
      </div>

      {error && (
        <div className="form-error">
          <AlertCircle className="error-icon" />
          {error}
        </div>
      )}

      <button type="submit" disabled={loading} className="submit-btn">
        {loading ? (
          <><Loader2 className="btn-icon spin" /> Registering...</>
        ) : (
          <>Register Now</>
        )}
      </button>

      <p className="form-note">
        Your roll number will be generated automatically upon registration.
      </p>
    </form>
  )
}
