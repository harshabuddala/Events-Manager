'use client'
import { useState } from 'react'
import { Calculator, FlaskConical, Palette, Activity, X } from 'lucide-react'
import { useScrollAnimation } from '../hooks/useScrollAnimation'

const zones = [
  { id: 'math', title: 'Math Mania', icon: Calculator, color: 'bg-orange-500', lightColor: 'bg-orange-50', textColor: 'text-orange-600', borderColor: 'border-orange-100', eligibility: 'Class 5th–10th', activities: ['Equation Hunt', 'Math Relay Race'], image: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?q=80&w=2071&auto=format&fit=crop', description: 'Get ready to race against numbers! Kids take on an Equation Hunt to sharpen quick thinking, then team up for a high-energy Math Relay Race.' },
  { id: 'science', title: 'Science Street', icon: FlaskConical, color: 'bg-teal-500', lightColor: 'bg-teal-50', textColor: 'text-teal-600', borderColor: 'border-teal-100', eligibility: 'Class 5th–10th', activities: ['Sink or Float Prediction Challenge', 'Build a Tower'], image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=2070&auto=format&fit=crop', description: 'Curious minds, get ready to experiment! Kids predict what floats and what sinks, then put their engineering skills to the test in Build a Tower.' },
  { id: 'creative', title: 'Creative Corner', icon: Palette, color: 'bg-pink-500', lightColor: 'bg-pink-50', textColor: 'text-pink-600', borderColor: 'border-pink-100', eligibility: 'All Age Groups', activities: ['Ice Cream Sticks Activity', 'Painting the Letter', 'Wax Crayon Art', 'String Art'], image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=2071&auto=format&fit=crop', description: 'Time to get creative! From Ice Cream Sticks and String Art to Painting the Letter and Wax Crayon Art, little ones explore colors and imagination.' },
  { id: 'fitness', title: 'Fitness Zone', icon: Activity, color: 'bg-blue-500', lightColor: 'bg-blue-50', textColor: 'text-blue-600', borderColor: 'border-blue-100', eligibility: 'All Age Groups', activities: ['Jump & Warm-up', 'Shuttle Run, Camel Walk, Mountain Hold', 'Engaging Game (2 games)'], image: 'https://images.unsplash.com/photo-1472162072942-cd5147eb3902?q=80&w=2069&auto=format&fit=crop', description: 'Let\'s get moving! Kids kick off with Jump & Warm-up, test their strength and balance, then wrap up with two exciting team games.' }
]

export default function ActivityZones() {
  const [selectedZone, setSelectedZone] = useState<typeof zones[0] | null>(null)
  const { ref, isVisible } = useScrollAnimation()

  return (
    <>
      <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-auto">
        {zones.map((zone, index) => {
          const Icon = zone.icon
          return (
            <div key={zone.id} onClick={() => setSelectedZone(zone)} className={`bg-white rounded-2xl overflow-hidden border border-gray-100 flex flex-col shadow-sm h-auto cursor-pointer hover:shadow-md transition-all duration-700 ease-out group ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: `${index * 100}ms` }}>
              <div className={`h-2 w-full shrink-0 ${zone.color}`} />
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-center gap-3 mb-3 shrink-0">
                  <div className={`w-10 h-10 rounded-full ${zone.lightColor} flex items-center justify-center ${zone.textColor} font-bold shrink-0 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-base lg:text-lg leading-tight">{zone.title}</h4>
                </div>
                <div className="mb-3 shrink-0">
                  <span className={`text-[10px] ${zone.lightColor} ${zone.textColor} px-2 py-1 rounded uppercase font-bold inline-block`}>{zone.eligibility}</span>
                </div>
                <ul className="mt-auto text-xs sm:text-sm space-y-2 text-gray-600 font-medium italic flex-1 flex flex-col justify-start">
                  {zone.activities.map((activity, idx) => (
                    <li key={idx} className="flex items-start gap-1.5"><span className="shrink-0 font-bold">•</span><span>{activity}</span></li>
                  ))}
                </ul>
                <div className="mt-4 text-xs font-bold text-brand-accent uppercase tracking-wider flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">View Details →</div>
              </div>
            </div>
          )
        })}
      </div>

      {selectedZone && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedZone(null)}>
          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-lg w-full relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedZone(null)} className="absolute top-4 right-4 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center z-10 transition-colors backdrop-blur-md">
              <X className="w-5 h-5" />
            </button>
            <div className="h-48 md:h-64 relative">
              <div className={`absolute inset-0 opacity-20 mix-blend-multiply ${selectedZone.color}`} />
              <img src={selectedZone.image} alt={selectedZone.title} className="w-full h-full object-cover" />
            </div>
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-full ${selectedZone.lightColor} flex items-center justify-center ${selectedZone.textColor} font-bold shrink-0`}>
                  <selectedZone.icon className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-black text-brand-primary">{selectedZone.title}</h3>
              </div>
              <span className={`text-[10px] ${selectedZone.lightColor} ${selectedZone.textColor} px-2 py-1 rounded uppercase font-bold inline-block mb-4`}>{selectedZone.eligibility}</span>
              <p className="text-gray-600 mb-6 font-medium leading-relaxed">{selectedZone.description}</p>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <h4 className="font-bold text-sm uppercase tracking-wider text-gray-500 mb-3">Activities Included:</h4>
                <ul className="space-y-2">
                  {selectedZone.activities.map((activity, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm font-medium text-brand-primary">
                      <div className={`w-1.5 h-1.5 rounded-full ${selectedZone.color} mt-1.5 shrink-0`} />
                      <span>{activity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
