'use client'
import { useState, useEffect } from 'react'

export default function ScrollProgress() {
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight
      const scroll = windowHeight > 0 ? totalScroll / windowHeight : 0
      setScrollProgress(scroll)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="fixed top-0 left-0 w-full h-1.5 bg-gray-200 z-[60]">
      <div className="h-full bg-brand-accent transition-all duration-150 ease-out" style={{ width: `${scrollProgress * 100}%` }} />
    </div>
  )
}
