'use client'
import { MapPin } from 'lucide-react'

export default function MapSection({ venueAddress }: { venueAddress: string }) {
  const mapQuery = venueAddress.replace(/\s+/g, '+')
  return (
    <section className="py-2 w-full shrink-0">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <h3 className="text-xl font-black uppercase italic mb-2 text-brand-primary">Venue & Location</h3>
            <p className="text-gray-600 font-medium mb-6">{venueAddress}</p>
            <a href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-brand-primary hover:bg-blue-900 text-white font-bold py-2.5 px-6 rounded-full transition-colors text-sm shadow-md">
              <MapPin className="w-4 h-4" /> Get Directions
            </a>
          </div>
          <div className="w-full md:w-1/2 h-48 md:h-64 rounded-xl overflow-hidden border border-gray-200 shrink-0 shadow-inner bg-gray-50">
            <iframe src={`https://maps.google.com/maps?q=${mapQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" title="Venue Map" />
          </div>
        </div>
      </div>
    </section>
  )
}
