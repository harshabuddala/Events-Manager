'use client'
import { CalendarDays, MapPin, Clock, Ticket, Download } from 'lucide-react'
import { type LandingEventData } from '../types'

export default function EventDetails({ event }: { event: LandingEventData }) {
  const eventDate = new Date(event.date)
  const formattedDate = eventDate.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const formattedTime = eventDate.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
  const fee = event.registrationFee ?? 0

  const generateICS = () => {
    const dtStart = eventDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    const dtEnd = event.endDate
      ? new Date(event.endDate).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
      : new Date(eventDate.getTime() + 4 * 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

    const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${dtStart}\nDTEND:${dtEnd}\nSUMMARY:${event.name}\nDESCRIPTION:${event.description || 'Join us for a fun-filled day!'}\nEND:VEVENT\nEND:VCALENDAR`
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.setAttribute('download', `${event.name.replace(/\s+/g, '_')}.ics`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <section className="py-4">
      <div className="bg-white rounded-2xl border-2 border-brand-primary shadow-[4px_4px_0px_#0B1F4D] overflow-hidden flex flex-col md:flex-row">
        <div className="p-6 md:p-8 md:w-2/3 border-b-2 md:border-b-0 md:border-r-2 border-brand-primary border-dashed">
          <h3 className="text-xl font-black uppercase italic mb-6 text-brand-primary">Event Details</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100"><CalendarDays className="w-5 h-5 text-blue-600" /></div>
              <div><p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Date</p><p className="font-bold text-brand-primary">{formattedDate}</p></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded bg-green-50 flex items-center justify-center shrink-0 border border-green-100"><Clock className="w-5 h-5 text-green-600" /></div>
              <div><p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Time</p><p className="font-bold text-brand-primary">4:00 PM</p></div>
            </div>
          </div>
        </div>
        <div className="p-6 md:p-8 md:w-1/3 bg-[#FAFAF7] flex flex-col items-center justify-center text-center">
          <Ticket className="w-8 h-8 text-brand-accent mb-2" />
          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1">Entry Fee</p>
          <div className="text-5xl font-black text-brand-primary mb-1">{fee > 0 ? `₹${fee}` : 'Free'}</div>
          <p className="text-xs font-bold uppercase text-brand-accent">{fee > 0 ? 'per child' : 'registration'}</p>
          <button onClick={generateICS} className="mt-6 flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-brand-primary transition-colors bg-white px-4 py-2.5 rounded-lg border border-gray-200 hover:border-brand-primary shadow-sm active:scale-95">
            <Download className="w-4 h-4" /> Add to Calendar
          </button>
        </div>
      </div>
    </section>
  )
}
