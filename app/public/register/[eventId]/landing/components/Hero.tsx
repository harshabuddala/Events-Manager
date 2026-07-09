'use client'
import { CalendarDays, MapPin, Clock } from 'lucide-react'
import { useCountdown } from '../hooks/useCountdown'
import AnimatedSection from './AnimatedSection'

interface HeroProps {
  eventName: string
  eventDate: string
}

export default function Hero({ eventName, eventDate }: HeroProps) {
  const targetDate = new Date(eventDate)
  const timeLeft = useCountdown(targetDate)

  const formattedDate = targetDate.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const formattedTime = '5:30 AM – 4:00 PM'

  return (
    <section className="flex flex-col justify-between space-y-4">
      <div className="space-y-4">
        <div className="inline-block bg-[#FDE8E8] text-[#E02424] px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-[0.2em] w-max animate-bounce-in shadow-sm">
          A Fun Community Event for Children & Parents
        </div>
        <h1 className="text-6xl md:text-7xl lg:text-8xl font-black leading-[1.1] tracking-tight text-brand-primary">
          {eventName.split(' ').slice(0, -1).join(' ')} <br className="hidden sm:block" /><span className="text-brand-accent drop-shadow-[0_0_15px_rgba(245,115,11,0.4)]">{eventName.split(' ').slice(-1)}</span>
        </h1>
        <p className="text-lg font-medium opacity-80 italic">Play • Learn • Explore • Grow</p>

        <AnimatedSection delay={100}>
          <div className="w-full bg-brand-primary rounded-2xl p-6 text-white shadow-xl mt-6 relative overflow-hidden">
            <div className="text-center md:text-left text-brand-accent font-bold uppercase tracking-wider text-xs mb-6 flex items-center justify-center md:justify-start gap-2">
              <span>⏳</span> Event starts in
            </div>
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
              <div className="flex-1 grid grid-cols-2 gap-2 w-full">
                <div className="flex flex-col items-center md:items-start text-center md:text-left">
                  <div className="text-[10px] uppercase text-gray-400 font-bold tracking-widest mb-1.5 flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5 text-brand-accent"/> Date</div>
                  <div className="font-bold text-[10px] sm:text-xs leading-tight">{formattedDate}</div>
                </div>
                <div className="flex flex-col items-center md:items-start text-center md:text-left border-l border-white/10 pl-2 sm:pl-4">
                  <div className="text-[10px] uppercase text-gray-400 font-bold tracking-widest mb-1.5 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-brand-accent"/> Time</div>
                  <div className="font-bold text-[10px] sm:text-xs leading-tight">5:30 AM –<br className="sm:hidden"/> 4:00 PM</div>
                </div>
              </div>
              <div className="w-full h-px md:w-px md:h-16 bg-white/10 shrink-0" />
              <div className="flex justify-center items-center gap-2 sm:gap-3 shrink-0 w-full md:w-auto">
                {[
                  { val: timeLeft.days, label: 'Days' },
                  { val: timeLeft.hours, label: 'Hours' },
                  { val: timeLeft.minutes, label: 'Mins' },
                  { val: timeLeft.seconds, label: 'Secs' },
                ].map((item, i) => (
                  <div key={item.label} className="flex items-center gap-2 sm:gap-3">
                    <div className="flex flex-col items-center bg-white/10 rounded-lg p-2 min-w-[50px] sm:min-w-[60px] border border-brand-accent/30">
                      <div className="font-mono text-xl sm:text-2xl font-bold">{item.val}</div>
                      <div className="text-[9px] sm:text-[10px] uppercase text-brand-accent font-bold">{item.label}</div>
                    </div>
                    {i < 3 && <span className="text-white/30 font-bold">:</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}
