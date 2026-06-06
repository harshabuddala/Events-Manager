import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import RegisterForm from './RegisterForm'
import './public-register.css'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: Promise<{ eventId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { eventId } = await params
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { name: true, community: { select: { name: true } } },
  })
  if (!event) return { title: 'Event Not Found' }
  return {
    title: `Register for ${event.name} | ${event.community.name}`,
    description: `Register your student for ${event.name} organized by ${event.community.name}.`,
  }
}

export default async function PublicRegisterPage({ params }: PageProps) {
  const { eventId } = await params

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      name: true,
      code: true,
      date: true,
      endDate: true,
      status: true,
      description: true,
      isPublicRegistrationEnabled: true,
      community: { select: { name: true, location: true } },
    },
  })

  if (!event) notFound()

  const isClosed = event.status === 'CANCELLED' || event.status === 'COMPLETED' || !event.isPublicRegistrationEnabled

  const eventDate = new Date(event.date)
  const formattedDate = eventDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="pub-root">
      {/* Background blobs */}
      <div className="pub-blob pub-blob-1" />
      <div className="pub-blob pub-blob-2" />

      <div className="pub-container">
        {/* Header */}
        <header className="pub-header">
          <div className="pub-logo">
            <span className="pub-logo-dot" />
            Edunura
          </div>

          <div className="pub-event-badge">
            <span className={`event-status-dot status-${event.status.toLowerCase()}`} />
            {event.status}
          </div>
        </header>

        {/* Event Card */}
        <div className="pub-event-card">
          <div className="event-card-inner">
            <p className="event-community">{event.community.name} · {event.community.location}</p>
            <h1 className="event-name">{event.name}</h1>
            <div className="event-meta">
              <span className="event-meta-item">📅 {formattedDate}</span>
              <span className="event-meta-item">🎫 {event.code}</span>
            </div>
            {event.description && (
              <p className="event-description">{event.description}</p>
            )}
          </div>
        </div>

        {/* Form Card */}
        <div className="pub-form-card">
          {isClosed ? (
            <div className="closed-state">
              <div className="closed-icon">🔒</div>
              <h2 className="closed-title">Registrations Closed</h2>
              <p className="closed-desc">
                {event.status === 'CANCELLED'
                  ? 'This event has been cancelled.'
                  : !event.isPublicRegistrationEnabled
                  ? 'Public registration for this event is currently disabled.'
                  : 'Registrations for this event have closed. Thank you for your interest!'}
              </p>
            </div>
          ) : (
            <>
              <div className="form-header">
                <h2 className="form-title">Student Registration</h2>
                <p className="form-subtitle">Fill in the details to register your student for this event.</p>
              </div>
              <RegisterForm event={{
                ...event,
                date: event.date.toISOString(),
                endDate: event.endDate ? event.endDate.toISOString() : null,
              }} />
            </>
          )}
        </div>

        <footer className="pub-footer">
          <p>Powered by <strong>Edunura Events</strong></p>
        </footer>
      </div>
    </div>
  )
}
