'use client'
import { ArrowRight } from 'lucide-react'

export default function CTABanner({ text, fee }: { text: string; fee: number }) {
  const scrollToForm = () => {
    document.getElementById('registration')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="bg-[#0B1F4D] rounded-2xl p-4 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md border border-blue-900/50">
      <p className="text-white font-bold text-sm md:text-base text-center sm:text-left leading-tight">{text}</p>
      <button onClick={scrollToForm} className="bg-[#F5730B] hover:bg-orange-600 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-[0_4px_14px_0_rgba(245,115,11,0.39)] active:scale-95 flex items-center gap-2 whitespace-nowrap shrink-0">
        Register Now{fee > 0 ? ` — ₹${fee}` : ''} <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}
