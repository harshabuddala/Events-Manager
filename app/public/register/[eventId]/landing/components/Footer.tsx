'use client'
import React, { useState } from 'react'

export default function Footer() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) { setStatus('error'); setMessage('Please enter a valid email.'); return }
    setStatus('loading')
    setTimeout(() => { setStatus('success'); setMessage('Thanks for subscribing!'); setEmail(''); setTimeout(() => setStatus('idle'), 3000) }, 1000)
  }

  return (
    <footer className="h-auto bg-[#0B1F4D] text-white px-4 md:px-8 py-8 flex flex-col md:flex-row items-center justify-between text-[11px] font-medium tracking-wide uppercase shrink-0 gap-6 mt-4 xl:mt-0 xl:rounded-t-none rounded-t-2xl">
      <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
        <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-8 text-blue-200">
          <span>★ Learn Through Play</span><span>★ Build Confidence</span><span>★ Teamwork & Friendship</span><span>★ Prizes</span>
        </div>
        <div className="w-full max-w-sm md:ml-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-2 relative">
            <span className="text-white/80 font-bold mb-1 block text-center md:text-left">Stay Updated</span>
            <div className="flex gap-2">
              <input type="email" value={email} onChange={e => { setEmail(e.target.value); setStatus('idle'); setMessage('') }} placeholder="Enter your email" className="bg-white placeholder-gray-400 border border-gray-200 shadow-sm px-3 py-2 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-accent w-full text-xs normal-case h-9" />
              <button type="submit" disabled={status === 'loading' || status === 'success'} className="bg-brand-accent hover:bg-brand-accent/90 text-[#0B1F4D] px-4 py-2 rounded-md font-bold disabled:opacity-50 transition-colors shrink-0 h-9 flex items-center">
                {status === 'loading' ? '...' : status === 'success' ? 'Done' : 'Subscribe'}
              </button>
            </div>
            {message && <span className={`text-[10px] normal-case absolute -bottom-5 left-0 ${status === 'error' ? 'text-red-400' : 'text-green-400'}`}>{message}</span>}
          </form>
        </div>
      </div>
      <div className="text-center md:text-right opacity-60 leading-tight md:ml-auto">
        Organised by EduNura LLP<br/>+91 80190 28822 • edunuraa@gmail.com
      </div>
    </footer>
  )
}
