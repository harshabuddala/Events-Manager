import React from 'react'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import ScanClientPage from './ScanClientPage'
import PublicReportView from './PublicReportView'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: Promise<{ code: string }>
}

// Fields that contain PII (parent name/phone/email, student age/email).
// These are only returned to authenticated users. Unauthenticated callers
// get a sanitized registration with only public-safe fields.
const PII_FIELDS = ['email', 'parentName', 'phoneNumber', 'age'] as const

function sanitizeRegistration(reg: any) {
  if (!reg) return reg
  const { student, ...rest } = reg
  if (!student) return rest
  const safeStudent: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(student)) {
    if (!(PII_FIELDS as readonly string[]).includes(k)) {
      safeStudent[k] = v
    }
  }
  return { ...rest, student: safeStudent }
}

function PassInvalid({ message }: { message?: string }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full border border-slate-100 shadow-xl">
        <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <h1 className="text-lg font-extrabold text-slate-800">Pass Invalid</h1>
        <p className="text-xs text-slate-500 mt-2">
          {message || 'This registration scan code is invalid or has expired.'}
        </p>
      </div>
    </div>
  )
}

export default async function ScanPage({ params }: PageProps) {
  const { code } = await params

  // Cap URL length to avoid OOM from huge path segments
  if (code.length > 100) {
    return <PassInvalid />
  }

  // Fetch the registration by either its persistent registrationCode
  // (for backward compat with old printed cards) or its opaque qrToken
  // (new QR codes encode /r/<qrToken> → /scan/<qrToken>).
  const fullRegistration = await prisma.registration.findFirst({
    where: {
      OR: [
        { registrationCode: code },
        { qrToken: code },
      ],
    },
    include: {
      student: true,
      event: {
        include: {
          community: true,
          stalls: {
            where: { status: 'ACTIVE' },
            select: { id: true, code: true, name: true, metrics: true }
          }
        }
      },
      stallVisits: {
        include: {
          stall: true,
          performance: {
            include: {
              volunteer: {
                select: { name: true }
              }
            }
          }
        }
      }
    }
  })

  if (!fullRegistration) {
    return <PassInvalid />
  }

  // Universal QR: anyone with the code can see a public report card (no PII).
  // Volunteers and staff get the full evaluation interface.
  const session = await getSession()

  if (!session) {
    // Unauthenticated → render sanitized public report. No PII exposed.
    const publicRegistration = sanitizeRegistration(fullRegistration)
    return (
      <PublicReportView
        registration={publicRegistration}
        event={fullRegistration.event}
      />
    )
  }

  // Volunteer assignment lookup (only meaningful for volunteer roles)
  let volunteer = null
  let assignments: any[] = []

  if (['VOLUNTEER', 'LEAD_EVALUATOR', 'COORDINATOR'].includes(session.role)) {
    volunteer = await prisma.volunteer.findUnique({
      where: { email: session.email }
    })

    if (volunteer) {
      assignments = await prisma.volunteerAssignment.findMany({
        where: {
          eventId: fullRegistration.eventId,
          volunteerId: volunteer.id
        },
        include: {
          stall: true
        }
      })
    }
  }

  // Volunteers get a redacted registration (no PII) even after login —
  // they don't need parent contact details to evaluate a student.
  const isStaffRole = ['ADMIN', 'MANAGER'].includes(session.role)
  const registration = isStaffRole
    ? fullRegistration
    : sanitizeRegistration(fullRegistration)

  return (
    <ScanClientPage
      initialRegistration={registration}
      session={session}
      volunteer={volunteer}
      assignments={assignments}
    />
  )
}
