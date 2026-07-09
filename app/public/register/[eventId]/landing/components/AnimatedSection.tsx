'use client'
import { ReactNode } from 'react'
import { useScrollAnimation } from '../hooks/useScrollAnimation'

export default function AnimatedSection({ children, delay = 0, className = '' }: { children: ReactNode, delay?: number, className?: string }) {
  const { ref, isVisible } = useScrollAnimation()
  return (
    <div ref={ref} className={`transition-all duration-700 ease-out overflow-visible ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}
