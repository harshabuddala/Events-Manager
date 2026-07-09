'use client'
import { ArrowRight } from 'lucide-react'
import { type LandingEventData } from './landing/types'
import ScrollProgress from './landing/components/ScrollProgress'
import Navbar from './landing/components/Navbar'
import Hero from './landing/components/Hero'
import AnimatedSection from './landing/components/AnimatedSection'
import HowItWorks from './landing/components/HowItWorks'
import TrustStrip from './landing/components/TrustStrip'
import ActivityZones from './landing/components/ActivityZones'
import CTABanner from './landing/components/CTABanner'
import ParentFunZone from './landing/components/ParentFunZone'
import EventDetails from './landing/components/EventDetails'
import AboutEduNura from './landing/components/AboutEduNura'
import CarnivalHighlights from './landing/components/CarnivalHighlights'
import RegistrationForm from './landing/components/RegistrationForm'
import FAQ from './landing/components/FAQ'
import ShareStrip from './landing/components/ShareStrip'
import Footer from './landing/components/Footer'
import WhatsAppBubble from './landing/components/WhatsAppBubble'

export default function PublicLandingPage({ event }: { event: LandingEventData }) {
  const fee = event.registrationFee ?? 0

  const scrollToRegistration = () => {
    document.getElementById('registration')?.scrollIntoView({ behavior: 'smooth' })
  }

  if (event.isClosed) {
    return (
      <div className="min-h-screen w-full bg-brand-bg font-sans text-brand-primary flex items-center justify-center p-8">
        <div className="max-w-md text-center p-12 rounded-3xl border border-gray-200 bg-white shadow-xl">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold mb-2">Registrations Closed</h2>
          <p className="text-gray-500">This event is no longer accepting registrations.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-brand-bg font-sans text-brand-primary flex flex-col relative">
      <ScrollProgress />
      <Navbar fee={fee} />
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8 pb-32 sm:pb-12 mt-1">
        <Hero eventName={event.name} eventDate={event.date} venueName={event.community.name} venueDetail={event.community.location} />
        <AnimatedSection><HowItWorks fee={fee} eventDate={event.date} /></AnimatedSection>
        <TrustStrip />
        <ActivityZones />
        <CTABanner text="Loved what you saw? Grab your spot before slots run out." fee={fee} />
        <AnimatedSection><ParentFunZone /></AnimatedSection>
        <AnimatedSection><EventDetails event={event} /></AnimatedSection>
        <AnimatedSection><AboutEduNura /></AnimatedSection>
        <CTABanner text={`Only a few spots left for ${event.name}!`} fee={fee} />
        <AnimatedSection><CarnivalHighlights /></AnimatedSection>
        <AnimatedSection><RegistrationForm event={event} /></AnimatedSection>
        <AnimatedSection><FAQ /></AnimatedSection>
        <AnimatedSection><ShareStrip eventName={event.name} eventDate={event.date} /></AnimatedSection>
      </main>
      <Footer />
      {/* Sticky Bottom Mobile CTA */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] sm:hidden z-50">
        <button onClick={scrollToRegistration} className="w-full bg-brand-accent text-white font-bold py-3.5 px-6 rounded-xl shadow-[0_4px_14px_0_rgba(245,115,11,0.39)] flex items-center justify-between active:scale-[0.98] transition-transform animate-pulse-scale">
          <span className="text-lg font-black">{fee > 0 ? `₹${fee}` : 'FREE'}</span>
          <span className="flex items-center gap-2 text-sm uppercase tracking-wide font-bold">Register Now <ArrowRight className="w-5 h-5" /></span>
        </button>
      </div>
      <WhatsAppBubble />
    </div>
  )
}
