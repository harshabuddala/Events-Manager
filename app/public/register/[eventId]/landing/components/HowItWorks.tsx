'use client'
import { MousePointerClick, MessageCircle, PartyPopper } from 'lucide-react'

export default function HowItWorks({ fee, eventDate }: { fee: number; eventDate: string }) {
  const formattedDate = new Date(eventDate).toLocaleDateString('en-IN', { month: 'long', day: 'numeric' })

  return (
    <section className="py-2 w-full shrink-0">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative overflow-hidden">
        <h3 className="text-center font-bold text-brand-primary mb-8 text-lg uppercase tracking-wide">How It Works</h3>
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-4 relative max-w-4xl mx-auto">
          <div className="hidden md:block absolute top-6 left-[10%] right-[10%] h-0.5 bg-gray-200 z-0" />
          {[
            { icon: MousePointerClick, title: fee > 0 ? `Register & Pay ₹${fee}` : 'Register Free' },
            { icon: MessageCircle, title: 'Get WhatsApp Confirmation' },
            { icon: PartyPopper, title: `Show Up & Have Fun on ${formattedDate}` }
          ].map((step, index) => {
            const Icon = step.icon
            return (
              <div key={index} className="flex flex-col items-center text-center relative z-10 w-full md:w-1/3 bg-white px-2">
                <div className="w-12 h-12 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold shadow-[0_4px_10px_rgba(11,31,77,0.2)] mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-[10px] uppercase text-brand-accent font-bold mb-1 tracking-wider bg-orange-50 px-2 py-0.5 rounded">Step {index + 1}</div>
                <p className="font-bold text-gray-800 text-sm max-w-[150px] leading-tight">{step.title}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
