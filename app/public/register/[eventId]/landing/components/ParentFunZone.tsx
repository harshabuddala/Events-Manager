'use client'
export default function ParentFunZone() {
  return (
    <div className="bg-gradient-to-r from-[#F5730B] to-[#FF4D4D] rounded-2xl p-6 md:p-8 text-white flex flex-col justify-center shadow-lg relative overflow-hidden shrink-0 min-h-[140px]">
      <div className="absolute right-[-20px] top-[-20px] opacity-10 font-black text-6xl md:text-8xl italic">PLAY</div>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center relative z-10 gap-8">
        <div className="flex-1 max-w-2xl">
          <div className="text-xs font-bold uppercase tracking-widest text-white/80 mb-2">Why Parents Matter Most</div>
          <h4 className="text-3xl md:text-4xl font-black uppercase mb-6 italic drop-shadow-md">Parents, You&apos;re Invited Too!</h4>
          <div className="space-y-2 mb-6 text-sm md:text-base opacity-95">
            <p>A child&apos;s overall development is shaped by many contributors — 20% the child, 30% the school, 30% the environment & society, and 20% the parents.</p>
            <p>That 20% from parents is the most essential piece of all — the foundation everything else builds on.</p>
            <p>That&apos;s why your participation matters here: the score you earn in these activities adds directly to your child&apos;s overall score. So parents, come play with us!</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 w-full max-w-2xl">
            {[{ label: 'Child', pct: '20%' }, { label: 'School', pct: '30%' }, { label: 'Environment & Society', pct: '30%' }].map(item => (
              <div key={item.label} className="bg-white/10 text-white text-xs sm:text-sm py-3 px-3 rounded-xl flex flex-col items-center justify-center text-center border border-white/20">
                <span className="opacity-80 font-medium">{item.label}</span>
                <span className="font-bold text-lg mt-0.5">{item.pct}</span>
              </div>
            ))}
            <div className="bg-brand-primary text-brand-accent text-xs sm:text-sm py-3 px-3 rounded-xl flex flex-col items-center justify-center text-center border-2 border-white shadow-xl relative transform md:-translate-y-1 md:scale-105 z-10">
              <span className="font-bold text-white flex items-center gap-1">Parents <span className="text-brand-accent">⭐</span></span>
              <span className="font-black text-xl mt-0.5">20%</span>
              <span className="text-[9px] uppercase tracking-widest mt-1 text-white/80 font-bold">Most Essential</span>
            </div>
          </div>
          <div className="bg-white/10 border-l-4 border-white p-4 rounded-r-xl mb-3">
            <p className="font-bold text-base">The score you earn in these activities adds directly to your child&apos;s overall score — your participation is part of their growth.</p>
          </div>
        </div>
        <div className="flex flex-row lg:flex-col gap-4 w-full lg:w-auto overflow-x-auto hide-scrollbar pt-2 lg:pt-0 shrink-0">
          <div className="bg-white/20 backdrop-blur-md p-4 rounded-xl border border-white/30 text-center w-36 shrink-0 shadow-lg">
            <div className="text-[10px] font-bold uppercase mb-1 text-white/90 tracking-wider">Activity 01</div>
            <div className="text-base font-bold leading-tight">Match the Ball</div>
          </div>
          <div className="bg-white/20 backdrop-blur-md p-4 rounded-xl border border-white/30 text-center w-36 shrink-0 shadow-lg">
            <div className="text-[10px] font-bold uppercase mb-1 text-white/90 tracking-wider">Activity 02</div>
            <div className="text-base font-bold leading-tight">Hula Hoop</div>
          </div>
        </div>
      </div>
    </div>
  )
}
