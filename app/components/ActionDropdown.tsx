'use client'

import { useState, useRef, useEffect } from 'react'
import { MoreVertical, QrCode, FileText, IdCard, Send, Eye, Printer, Trash2, ArrowRight, MessageCircle, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface Action {
  label: string
  icon: React.ReactNode
  onClick: () => void
  color?: string
  disabled?: boolean
  loading?: boolean
  dividerBefore?: boolean
}

interface ActionDropdownProps {
  actions: Action[]
}

export default function ActionDropdown({ actions }: ActionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
        title="Actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1.5 overflow-hidden">
          {actions.map((action, i) => (
            <div key={i}>
              {action.dividerBefore && <div className="h-px bg-slate-100 my-1" />}
              <button
                onClick={() => {
                  action.onClick()
                  setIsOpen(false)
                }}
                disabled={action.disabled || action.loading}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-xs font-medium transition-colors disabled:opacity-40 ${
                  action.color === 'rose'
                    ? 'text-rose-600 hover:bg-rose-50'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {action.loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                ) : (
                  <span className="w-3.5 h-3.5 shrink-0">{action.icon}</span>
                )}
                {action.label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
