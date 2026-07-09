'use client'
import { Share2 } from 'lucide-react'

export default function ShareStrip({ eventName, eventDate }: { eventName: string; eventDate: string }) {
  const formattedDate = new Date(eventDate).toLocaleDateString('en-IN', { month: 'long', day: 'numeric' })
  const shareText = encodeURIComponent(`Hey! Check out the ${eventName} happening on ${formattedDate}. Register here: ${typeof window !== 'undefined' ? window.location.href : ''}`)
  const whatsappUrl = `https://wa.me/?text=${shareText}`

  return (
    <section className="py-2 w-full shrink-0">
      <div className="bg-[#E8F4EC] border border-[#C3E6CF] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div>
          <h4 className="text-xl font-black text-[#0B4D2C] mb-2 uppercase italic">Bring a Friend!</h4>
          <p className="text-[#13663C] font-medium text-sm md:text-base">Know another family with kids? Invite them along!</p>
        </div>
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95 shadow-md shadow-[#25D366]/30 w-full md:w-auto">
          <Share2 className="w-5 h-5" /> <span>Invite via WhatsApp</span>
        </a>
      </div>
    </section>
  )
}
