import React from 'react'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ScanClientPage from './ScanClientPage'

interface PageProps {
  params: Promise<{ code: string }>
}

export default async function ScanPage({ params }: PageProps) {
  const { code } = await params

  // 1. Fetch registration
  const registration = await prisma.registration.findUnique({
    where: { registrationCode: code },
    include: {
      student: true,
      event: {
        include: {
          community: true,
          stalls: {
            where: { status: 'ACTIVE' },
            select: { id: true, code: true, name: true }
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

  if (!registration) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full border border-slate-100 shadow-xl">
          <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h1 className="text-lg font-extrabold text-slate-800">Pass Invalid</h1>
          <p className="text-xs text-slate-500 mt-2">This registration scan code is invalid or has expired.</p>
        </div>
      </div>
    )
  }

  // 2. Fetch logged in session
  const session = await getSession()
  
  // 3. If volunteer is logged in, retrieve their details and assignments
  let volunteer = null
  let assignments: any[] = []
  
  if (session && ['VOLUNTEER', 'LEAD_EVALUATOR', 'COORDINATOR'].includes(session.role)) {
    volunteer = await prisma.volunteer.findUnique({
      where: { email: session.email }
    })
    
    if (volunteer) {
      assignments = await prisma.volunteerAssignment.findMany({
        where: {
          eventId: registration.eventId,
          volunteerId: volunteer.id
        },
        include: {
          stall: true
        }
      })
    }
  }

  // Pass everything to the client page for premium interactive rendering
  return (
    <ScanClientPage 
      initialRegistration={registration}
      session={session}
      volunteer={volunteer}
      assignments={assignments}
    />
  )
}
