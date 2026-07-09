'use client'
import { BookOpen, Activity, Layout, Users } from 'lucide-react'

export default function AboutEduNura() {
  return (
    <section className="py-2 w-full shrink-0">
      <div className="bg-brand-primary rounded-2xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg border border-blue-900">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-brand-accent/20 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-white p-2 rounded-lg w-12 h-12 flex items-center justify-center shrink-0 shadow-md">
              <img src="https://edunura.com/images/edunura-font-02.png" alt="EduNura" className="w-full object-contain" />
            </div>
            <h3 className="text-xl md:text-2xl font-black uppercase italic">About EduNura</h3>
          </div>
          <p className="text-blue-100 mb-8 max-w-3xl font-medium leading-relaxed text-sm md:text-base">
            EduNura is your local tutoring partner. We provide comprehensive online & offline classes for Class 5 to Intermediate, alongside holistic skill-development tracks designed to nurture every talent.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: BookOpen, label: 'Class 5–Inter Tutoring' },
              { icon: Activity, label: 'Yoga & Fitness Programs' },
              { icon: Layout, label: 'Online + Offline' },
              { icon: Users, label: 'Community First' },
            ].map(item => (
              <div key={item.label} className="bg-white/10 p-4 rounded-xl border border-white/10 flex flex-col items-center text-center shadow-inner hover:bg-white/15 transition-colors">
                <item.icon className="w-6 h-6 text-brand-accent mb-2" />
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-wide text-blue-50 leading-tight">{item.label}</span>
              </div>
            ))}
          </div>
          <a href="https://edunura.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-brand-accent hover:text-orange-400 font-bold transition-colors uppercase tracking-wide text-xs md:text-sm group bg-white/5 py-2 px-4 rounded-lg border border-brand-accent/20">
            Know more about EduNura Programs
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </a>
        </div>
      </div>
    </section>
  )
}
