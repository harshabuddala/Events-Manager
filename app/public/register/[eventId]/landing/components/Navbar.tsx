'use client'
import { useState, useRef, useEffect } from 'react'
import { Volume2, VolumeX } from 'lucide-react'

export default function Navbar({ fee }: { fee: number }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    audioRef.current = new Audio('https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=cheerful-kids-114757.mp3')
    audioRef.current.loop = true
    audioRef.current.volume = 0.2
    return () => { if (audioRef.current) audioRef.current.pause() }
  }, [])

  const toggleSound = () => {
    if (!audioRef.current) return
    if (isPlaying) { audioRef.current.pause() } else { audioRef.current.play().catch(() => {}) }
    setIsPlaying(!isPlaying)
  }

  const scrollToRegistration = () => {
    document.getElementById('registration')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav className="h-16 w-full px-4 md:px-8 bg-white border-b border-gray-200 flex items-center justify-between z-50 shadow-sm shrink-0">
      <a href="/" className="flex items-center h-full py-3">
        <img src="https://edunura.com/images/edunura-font-02.png" alt="EduNura Logo" className="h-10 object-contain" />
      </a>
      <div className="flex items-center gap-4 text-[10px] md:text-xs uppercase font-bold tracking-widest">
        <button onClick={toggleSound} className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 text-brand-primary hover:bg-gray-200 transition-colors hidden sm:flex shrink-0" title="Toggle Carnival Sound">
          {isPlaying ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
        <span className="text-brand-accent hidden sm:inline-block">Limited Slots Available</span>
        <button onClick={scrollToRegistration} className="bg-brand-accent hover:bg-orange-600 text-white px-6 py-2 rounded-full transition-all hover:shadow-lg animate-pulse-scale">
          Register Now{fee > 0 ? ` — ₹${fee}` : ''}
        </button>
      </div>
    </nav>
  )
}
