import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Script from 'next/script'
import { prisma } from '@/lib/prisma'
import PublicLandingPage from './PublicLandingPage'

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
    title: `${event.name} | ${event.community.name}`,
    description: `Register for ${event.name} organized by ${event.community.name}.`,
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
      registrationFee: true,
      feeCurrency: true,
      feeDescription: true,
      community: { select: { name: true, location: true } },
    },
  })

  if (!event) notFound()

  const isClosed = event.status === 'CANCELLED' || event.status === 'COMPLETED' || !event.isPublicRegistrationEnabled

  const eventData = {
    id: event.id,
    name: event.name,
    code: event.code,
    date: event.date.toISOString(),
    endDate: event.endDate?.toISOString() ?? null,
    description: event.description,
    registrationFee: event.registrationFee ? Number(event.registrationFee) : null,
    feeCurrency: event.feeCurrency,
    feeDescription: event.feeDescription,
    isClosed,
    community: { name: event.community.name, location: event.community.location },
  }

  return (
    <>
      {event.registrationFee && Number(event.registrationFee) > 0 && (
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      )}
      <PublicLandingPage event={eventData} />
    </>
  )
}
