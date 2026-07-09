'use client'
import { Camera } from 'lucide-react'

const images = [
  '/landing/highlights/0K7A7075.JPG.jpg',
  '/landing/highlights/0K7A7135.JPG.jpeg',
  '/landing/highlights/DSC07383.JPG.jpg',
  '/landing/highlights/DSC07253.JPG.jpg',
  '/landing/highlights/DSC07256.JPG.jpg',
  '/landing/highlights/DSC07262.JPG.jpg',
  '/landing/highlights/DSC07264.JPG.jpg',
  '/landing/highlights/DSC07300.JPG.jpg',
  '/landing/highlights/DSC07385.JPG.jpg',
]

export default function CarnivalHighlights() {
  return (
    <section className="py-2 w-full shrink-0">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 relative overflow-hidden">
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-12 h-12 bg-orange-50 text-brand-accent rounded-full flex items-center justify-center mb-4"><Camera className="w-6 h-6" /></div>
          <h3 className="text-xl md:text-2xl font-black uppercase italic text-brand-primary">Carnival Highlights</h3>
          <p className="text-gray-600 font-medium text-sm mt-1">Glimpses of fun and learning from our events</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {images.map((src, index) => (
            <div key={index} className="aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 group relative cursor-pointer">
              <img src={src} alt={`Carnival Highlight ${index + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
              <div className="absolute inset-0 bg-brand-primary/0 group-hover:bg-brand-primary/20 transition-colors duration-300" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
