'use client'

import React, { useEffect, useRef, useState, useLayoutEffect } from 'react'
import { X, Upload, Image as ImageIcon, AlertCircle, Loader2 } from 'lucide-react'

// Cropper is browser-only; import dynamically to avoid SSR "HTMLElement is not defined"
type CropperType = any
let _Cropper: CropperType | null = null
async function getCropper(): Promise<CropperType> {
  if (!_Cropper) {
    const mod = await import('cropperjs')
    _Cropper = mod.default
  }
  return _Cropper
}

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

interface LetterheadFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editLetterhead: Letterhead | null
}

export default function LetterheadFormModal({
  isOpen,
  onClose,
  onSuccess,
  editLetterhead,
}: LetterheadFormModalProps) {
  const [name, setName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageDims, setImageDims] = useState<{ w: number; h: number } | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 0, h: 0 })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [cropperReady, setCropperReady] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [cropperLoading, setCropperLoading] = useState(false)

  const imageRef = useRef<HTMLImageElement | null>(null)
  const cropperRef = useRef<any>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (!isOpen) return
    setError('')
    setCropperReady(false)
    setImageLoaded(false)
    if (editLetterhead) {
      setName(editLetterhead.name)
      setImageUrl(`/api/letterheads/${editLetterhead.id}/file`)
      setImageDims({ w: editLetterhead.imageW, h: editLetterhead.imageH })
      setCrop({
        x: editLetterhead.cropX,
        y: editLetterhead.cropY,
        w: editLetterhead.cropW,
        h: editLetterhead.cropH,
      })
    } else {
      setName('')
      setFile(null)
      setImageUrl(null)
      setImageDims(null)
      setCrop({ x: 0, y: 0, w: 0, h: 0 })
    }
  }, [isOpen, editLetterhead])

  // Preload cropper when modal opens
  useEffect(() => {
    if (!isOpen) return
    setCropperLoading(true)
    getCropper()
      .then(() => setCropperLoading(false))
      .catch(() => setCropperLoading(false))
  }, [isOpen])

  // Initialize cropper once image is loaded and cropper class is ready
  useLayoutEffect(() => {
    if (!isOpen || !imageUrl || !imageRef.current || !imageLoaded || cropperLoading) return

    const imgEl = imageRef.current
    // Only init if not already attached
    if (cropperRef.current) return

    let cancelled = false
    ;(async () => {
      const CropperCtor = await getCropper()
      if (cancelled || !imageRef.current) return
      // Final guard: image must have dimensions
      if (imageRef.current.clientWidth === 0 || imageRef.current.clientHeight === 0) {
        // Wait one frame for layout
        await new Promise(r => requestAnimationFrame(r))
        if (cancelled || !imageRef.current) return
      }
      const cropper = new CropperCtor(imageRef.current, {
        viewMode: 1,
        autoCropArea: editLetterhead ? 1 : 0.7,
        responsive: true,
        restore: false,
        background: false,
        movable: true,
        resizable: true,
        zoomable: false,
        rotatable: false,
        scalable: false,
        guides: true,
        center: true,
        highlight: false,
        cropBoxMovable: true,
        cropBoxResizable: true,
        toggleDragModeOnDblclick: false,
        minContainerWidth: 320,
        minContainerHeight: 240,
        ready() {
          if (editLetterhead) {
            cropper.setData({
              x: editLetterhead.cropX,
              y: editLetterhead.cropY,
              width: editLetterhead.cropW,
              height: editLetterhead.cropH,
            })
          }
          const d = cropper.getData()
          setCrop({ x: Math.round(d.x), y: Math.round(d.y), w: Math.round(d.width), h: Math.round(d.height) })
          setCropperReady(true)
        },
        crop(event: any) {
          const d = event.detail
          setCrop({ x: Math.round(d.x), y: Math.round(d.y), w: Math.round(d.width), h: Math.round(d.height) })
        },
      })
      cropperRef.current = cropper
    })()

    return () => {
      cancelled = true
      if (cropperRef.current) {
        try { cropperRef.current.destroy() } catch {}
        cropperRef.current = null
      }
    }
  }, [imageUrl, isOpen, editLetterhead, imageLoaded, cropperLoading])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.type !== 'image/png') {
      setError('Only PNG files are accepted')
      return
    }
    if (f.size > 15 * 1024 * 1024) {
      setError('File too large (max 15MB)')
      return
    }
    setError('')
    setFile(f)
    setImageLoaded(false)
    setCropperReady(false)
    if (cropperRef.current) {
      try { cropperRef.current.destroy() } catch {}
      cropperRef.current = null
    }
    if (imageUrl && imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imageUrl)
    }
    const url = URL.createObjectURL(f)
    setImageUrl(url)
    const img = new window.Image()
    img.onload = () => setImageDims({ w: img.naturalWidth, h: img.naturalHeight })
    img.src = url
  }

  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  const handleSave = async () => {
    setError('')
    if (!name.trim()) {
      setError('Template name is required')
      return
    }
    if (!imageDims || crop.w === 0 || crop.h === 0) {
      setError('Please draw a crop area on the image')
      return
    }
    if (crop.x + crop.w > imageDims.w || crop.y + crop.h > imageDims.h) {
      setError('Crop area exceeds image bounds')
      return
    }

    setSaving(true)
    try {
      let res: Response
      if (editLetterhead) {
        res = await fetch(`/api/letterheads/${editLetterhead.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            cropX: crop.x,
            cropY: crop.y,
            cropW: crop.w,
            cropH: crop.h,
          }),
        })
      } else {
        if (!file) {
          setError('Please choose a PNG file to upload')
          setSaving(false)
          return
        }
        const fd = new FormData()
        fd.append('name', name.trim())
        fd.append('file', file)
        fd.append('cropX', String(crop.x))
        fd.append('cropY', String(crop.y))
        fd.append('cropW', String(crop.w))
        fd.append('cropH', String(crop.h))
        fd.append('imageW', String(imageDims.w))
        fd.append('imageH', String(imageDims.h))
        res = await fetch('/api/letterheads', { method: 'POST', body: fd })
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setError(err.error || 'Failed to save')
        return
      }
      onSuccess()
    } catch (e) {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-800">
              {editLetterhead ? 'Edit Template' : 'New Report Template'}
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Drag the box over the empty area where the report should print.
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 min-h-0">
          {/* Name */}
          <div>
            <label className="text-xs font-bold text-slate-700">Template Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Edunura Classic 2026"
              className="mt-1 w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
              maxLength={120}
            />
          </div>

          {/* File picker (only for new) */}
          {!editLetterhead && (
            <div>
              <label className="text-xs font-bold text-slate-700">PNG File (max 15MB)</label>
              <div className="mt-1 flex items-center gap-3">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                  <Upload className="w-4 h-4" />
                  {file ? 'Change file' : 'Choose PNG'}
                  <input type="file" accept="image/png" className="hidden" onChange={handleFileChange} />
                </label>
                {file && (
                  <span className="text-xs text-slate-500 truncate max-w-[300px]">
                    {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg p-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Cropper — outside scrolling container, fixed-aspect area with stable dimensions */}
        {imageUrl && (
          <div className="px-5 sm:px-6 pb-4 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700">Print Area</label>
              <div className="flex items-center gap-3">
                {imageDims && (
                  <span className="text-[10px] font-mono text-slate-500">
                    Image: {imageDims.w} × {imageDims.h}px
                  </span>
                )}
                {imageDims && (
                  <span className="text-[10px] font-mono text-slate-500">
                    Crop: {crop.w} × {crop.h}px
                  </span>
                )}
              </div>
            </div>
            <div
              className="relative bg-slate-100 border border-slate-200 rounded-xl overflow-hidden w-full"
              style={{ height: '52vh', minHeight: '420px' }}
            >
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Letterhead preview"
                onLoad={handleImageLoad}
                className="block max-w-full"
                style={{ display: 'block', maxWidth: '100%', maxHeight: '100%', margin: '0 auto' }}
                crossOrigin="anonymous"
              />
              {/* Loading overlay */}
              {(!imageLoaded || !cropperReady || cropperLoading) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-sm pointer-events-none">
                  <Loader2 className="w-6 h-6 text-violet-600 animate-spin" />
                  <span className="text-xs font-semibold text-slate-500 mt-2">
                    {!imageLoaded ? 'Loading image…' : cropperLoading ? 'Loading cropper…' : 'Preparing canvas…'}
                  </span>
                </div>
              )}
            </div>
            <p className="text-[10px] text-slate-500 mt-2 text-center">
              Drag the highlighted box to position it over the empty area. Use the corner handles to resize.
            </p>
          </div>
        )}

        <div className="px-5 sm:px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !cropperReady}
            className="px-4 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg disabled:opacity-60"
          >
            {saving ? 'Saving…' : editLetterhead ? 'Save Changes' : 'Create Template'}
          </button>
        </div>
      </div>
    </div>
  )
}
