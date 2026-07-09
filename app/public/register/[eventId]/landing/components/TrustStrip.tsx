'use client'
import { Puzzle, TrendingUp, Users, Gift } from 'lucide-react'
import { useScrollAnimation } from '../hooks/useScrollAnimation'

export default function TrustStrip() {
  const benefits = [
    { icon: Puzzle, title: 'Learn Through Play' },
    { icon: TrendingUp, title: 'Build Confidence' },
    { icon: Users, title: 'Teamwork & Friendship' },
    { icon: Gift, title: 'Exciting Fun & Prizes' },
  ]
  const { ref, isVisible } = useScrollAnimation()

  return (
    <section className="py-2 w-full" ref={ref}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 overflow-visible">
        {benefits.map((benefit, index) => {
          const Icon = benefit.icon
          return (
            <div key={index} className={`flex flex-col sm:flex-row items-center sm:items-start md:items-center text-center sm:text-left gap-2 sm:gap-3 bg-white p-3 sm:p-4 rounded-xl border border-gray-200 shadow-sm transition-all duration-700 ease-out h-full ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: `${index * 100}ms` }}>
              <div className="w-10 h-10 rounded-full bg-orange-50 text-brand-accent flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" strokeWidth={2} />
              </div>
              <h4 className="font-bold text-xs sm:text-sm uppercase tracking-wide">{benefit.title}</h4>
            </div>
          )
        })}
      </div>
    </section>
  )
}
