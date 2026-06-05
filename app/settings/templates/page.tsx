'use client'

import React, { useEffect, useState, useCallback } from 'react'
import DashboardLayout from '@/app/components/DashboardLayout'
import LetterheadFormModal from './LetterheadFormModal'
import { Plus, Edit2, Trash2, FileImage, Eye, Upload, Layers, AlertCircle, Loader2 } from 'lucide-react'

interface Letterhead {
  id: string
  name: string
  fileName: string
  sizeBytes: number
  cropX: number
  cropY: number
  cropW: number
  cropH: number
  imageW: number
  imageH: number
  isActive: boolean
  createdAt: string
  _count: { events: number }
}

export default function TemplatesPage() {
  const [letterheads, setLetterheads] = useState<Letterhead[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState<Letterhead | null>(null)
  const [previewing, setPreviewing] = useState<Letterhead | null>(null)
  const [userRole, setUserRole] = useState<string>('')
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.user?.role) setUserRole(d.user.role) })
      .catch(() => {})
  }, [])

  const canManage = userRole === 'ADMIN' || userRole === 'MANAGER'

  const fetchLetterheads = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/letterheads')
      if (res.ok) {
        const d = await res.json()
        setLetterheads(d.letterheads || [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLetterheads() }, [fetchLetterheads])

  const handleDelete = async (lh: Letterhead) => {
    const msg = lh._count.events > 0
      ? `${lh.name} is used by ${lh._count.events} event(s). It will be deactivated and detached from those events. Continue?`
      : `Permanently delete "${lh.name}"? This cannot be undone.`
    if (!confirm(msg)) return
    setActionError('')
    const res = await fetch(`/api/letterheads/${lh.id}`, { method: 'DELETE' })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setActionError(d.error || 'Failed to delete')
      return
    }
    fetchLetterheads()
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  const aspectRatio = previewing
    ? previewing.imageW / previewing.imageH
    : 0

  return (
    <DashboardLayout
      title="Report Templates"
      subtitle="Upload A4 letterhead images and define the print area for report cards."
      headerAction={
        canManage ? (
          <button
            onClick={() => { setEditing(null); setIsModalOpen(true) }}
            className="hidden lg:flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Template</span>
          </button>
        ) : null
      }
    >
      {actionError && (
        <div className="mb-4 flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg p-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Info banner */}
      <div className="mb-4 bg-violet-50 border border-violet-100 rounded-xl p-4 flex items-start gap-3">
        <Upload className="w-4 h-4 text-violet-600 mt-0.5 shrink-0" />
        <div className="text-xs text-violet-900 leading-relaxed">
          <p className="font-bold mb-1">How to use a template</p>
          <ol className="list-decimal list-inside space-y-0.5 text-violet-800/90">
            <li>Design an A4 PNG in Canva or Photoshop — leave a blank area for the report.</li>
            <li>Upload the PNG below and drag a rectangle over the empty area.</li>
            <li>Open any event → <strong>Template</strong> tab → pick this template → <strong>Test Print</strong>.</li>
          </ol>
          <p className="mt-2 text-[10px] text-violet-700/80">
            Recommended image size: A4 at 300dpi = 2480 × 3508 pixels. PNG only, max 15MB.
          </p>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-10 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading templates…
        </div>
      ) : letterheads.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-10 text-center">
          <FileImage className="w-10 h-10 mx-auto mb-3 text-slate-200" />
          <p className="text-sm font-semibold text-slate-500 mb-1">No templates yet</p>
          <p className="text-xs text-slate-400 mb-4">Upload your first A4 letterhead to start printing branded reports.</p>
          {canManage && (
            <button
              onClick={() => { setEditing(null); setIsModalOpen(true) }}
              className="inline-flex items-center gap-1.5 bg-violet-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-violet-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Upload Template
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {letterheads.map((lh) => (
            <div
              key={lh.id}
              className="bg-white rounded-xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden flex flex-col"
            >
              {/* Thumbnail */}
              <div className="bg-slate-100 border-b border-slate-200 p-4 flex items-center justify-center" style={{ minHeight: '180px' }}>
                <div
                  className="relative shadow-md"
                  style={{
                    width: '120px',
                    aspectRatio: `${lh.imageW} / ${lh.imageH}`,
                    backgroundImage: `url(/api/letterheads/${lh.id}/file)`,
                    backgroundSize: '100% 100%',
                    backgroundRepeat: 'no-repeat',
                  }}
                >
                  {/* Crop overlay marker */}
                  <div
                    className="absolute border-2 border-violet-500 bg-violet-500/10 pointer-events-none"
                    style={{
                      left: `${(lh.cropX / lh.imageW) * 100}%`,
                      top: `${(lh.cropY / lh.imageH) * 100}%`,
                      width: `${(lh.cropW / lh.imageW) * 100}%`,
                      height: `${(lh.cropH / lh.imageH) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-extrabold text-slate-800 truncate">{lh.name}</h3>
                  <span className="text-[10px] font-bold text-slate-400 shrink-0">
                    {lh._count.events} event{lh._count.events !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-500 space-y-0.5 mb-3">
                  <p>{lh.imageW} × {lh.imageH}px · {formatSize(lh.sizeBytes)}</p>
                  <p>Crop: {lh.cropW} × {lh.cropH}px @ ({lh.cropX},{lh.cropY})</p>
                </div>
                {canManage && (
                  <div className="mt-auto flex items-center gap-1.5 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => setPreviewing(lh)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:text-violet-700 hover:bg-violet-50 rounded-md transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> Preview
                    </button>
                    <button
                      onClick={() => { setEditing(lh); setIsModalOpen(true) }}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:text-violet-700 hover:bg-violet-50 rounded-md transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(lh)}
                      className="ml-auto flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewing && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setPreviewing(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-800">{previewing.name}</h3>
              <button
                onClick={() => setPreviewing(null)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Close
              </button>
            </div>
            <div className="p-5 sm:p-6 bg-slate-100">
              <div
                className="relative mx-auto bg-white shadow-xl"
                style={{
                  width: '100%',
                  maxWidth: '560px',
                  aspectRatio: `${previewing.imageW} / ${previewing.imageH}`,
                  backgroundImage: `url(/api/letterheads/${previewing.id}/file)`,
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                }}
              >
                <div
                  className="absolute border-2 border-dashed border-violet-500 bg-violet-500/5 flex items-center justify-center"
                  style={{
                    left: `${(previewing.cropX / previewing.imageW) * 100}%`,
                    top: `${(previewing.cropY / previewing.imageH) * 100}%`,
                    width: `${(previewing.cropW / previewing.imageW) * 100}%`,
                    height: `${(previewing.cropH / previewing.imageH) * 100}%`,
                  }}
                >
                  <span className="text-[10px] font-bold text-violet-700 bg-white/80 px-2 py-0.5 rounded">
                    Report content area
                  </span>
                </div>
              </div>
              <div className="mt-4 text-[11px] font-mono text-slate-600 text-center">
                {previewing.imageW} × {previewing.imageH}px · Crop {previewing.cropW} × {previewing.cropH}px
              </div>
            </div>
          </div>
        </div>
      )}

      <LetterheadFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditing(null) }}
        onSuccess={() => { setIsModalOpen(false); setEditing(null); fetchLetterheads() }}
        editLetterhead={editing}
      />
    </DashboardLayout>
  )
}
