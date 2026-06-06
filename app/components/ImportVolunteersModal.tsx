'use client'

import React, { useState, useMemo } from 'react'
import { X, Upload, Loader2 } from 'lucide-react'

interface ImportVolunteersModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (data: {
    rows: any[][]
    nameColumn: number
    emailColumn: number
    passwordColumn?: number
  }) => void
  previewRows: any[][]
  isImporting: boolean
}

export default function ImportVolunteersModal({
  isOpen,
  onClose,
  onImport,
  previewRows,
  isImporting,
}: ImportVolunteersModalProps) {
  const [nameColumn, setNameColumn] = useState<number>(0)
  const [emailColumn, setEmailColumn] = useState<number>(1)
  const [passwordColumn, setPasswordColumn] = useState<number | undefined>(undefined)

  // Generate column labels: A, B, C... or 1, 2, 3... based on content
  const maxCols = useMemo(() => {
    if (!previewRows.length) return 0
    return Math.max(...previewRows.map((r) => r.length))
  }, [previewRows])

  const colOptions = useMemo(() => {
    const opts: { idx: number; label: string }[] = []
    for (let i = 0; i < maxCols; i++) {
      // Try to detect header name from first row
      const headerName = previewRows[0]?.[i]
        ? String(previewRows[0][i]).trim()
        : ''
      const label = headerName
        ? `Col ${i + 1} — "${headerName}"`
        : `Col ${i + 1}`
      opts.push({ idx: i, label })
    }
    return opts
  }, [maxCols, previewRows])

  const previewDataRows = previewRows.slice(1, 4) // show first 3 data rows

  const handleImport = () => {
    if (nameColumn === emailColumn) {
      alert('Name and Email cannot be the same column')
      return
    }
    if (
      passwordColumn !== undefined &&
      (passwordColumn === nameColumn || passwordColumn === emailColumn)
    ) {
      alert('Password column must be different from Name and Email')
      return
    }

    // Strip header row before sending
    const dataRows = previewRows.slice(1)
    onImport({
      rows: dataRows,
      nameColumn,
      emailColumn,
      passwordColumn,
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Import Volunteers</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              Map columns and preview before importing
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isImporting}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Column mapping */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Column Mapping
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">
                  Name <span className="text-rose-500">*</span>
                </label>
                <select
                  value={nameColumn}
                  onChange={(e) => setNameColumn(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-800"
                >
                  {colOptions.map((opt) => (
                    <option key={opt.idx} value={opt.idx}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">
                  Email <span className="text-rose-500">*</span>
                </label>
                <select
                  value={emailColumn}
                  onChange={(e) => setEmailColumn(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-800"
                >
                  {colOptions.map((opt) => (
                    <option key={opt.idx} value={opt.idx}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">
                  Password <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <select
                  value={passwordColumn ?? ''}
                  onChange={(e) => {
                    const val = e.target.value
                    setPasswordColumn(val === '' ? undefined : Number(val))
                  }}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-800"
                >
                  <option value="">Auto-generate</option>
                  {colOptions.map((opt) => (
                    <option key={opt.idx} value={opt.idx}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Preview */}
          {previewRows.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Preview (first 3 data rows)
              </h4>
              <div className="rounded-xl border border-slate-200 overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      {Array.from({ length: maxCols }).map((_, i) => (
                        <th
                          key={i}
                          className={`px-3 py-2 font-bold text-slate-500 border-b border-slate-200 whitespace-nowrap ${
                            i === nameColumn
                              ? 'bg-emerald-50/60 text-emerald-700'
                              : i === emailColumn
                                ? 'bg-sky-50/60 text-sky-700'
                                : i === passwordColumn
                                  ? 'bg-amber-50/60 text-amber-700'
                                  : ''
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            {i === nameColumn && (
                              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                            )}
                            {i === emailColumn && (
                              <span className="inline-block w-2 h-2 rounded-full bg-sky-500" />
                            )}
                            {i === passwordColumn && (
                              <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
                            )}
                            <span>Col {i + 1}</span>
                          </div>
                          {i === nameColumn && (
                            <span className="block text-[10px] text-emerald-600 mt-0.5">Name</span>
                          )}
                          {i === emailColumn && (
                            <span className="block text-[10px] text-sky-600 mt-0.5">Email</span>
                          )}
                          {i === passwordColumn && (
                            <span className="block text-[10px] text-amber-600 mt-0.5">Password</span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewDataRows.map((row, rowIdx) => (
                      <tr key={rowIdx}>
                        {Array.from({ length: maxCols }).map((_, colIdx) => {
                          const cell = row[colIdx]
                          return (
                            <td
                              key={colIdx}
                              className={`px-3 py-2 text-slate-700 whitespace-nowrap ${
                                colIdx === nameColumn
                                  ? 'bg-emerald-50/30'
                                  : colIdx === emailColumn
                                    ? 'bg-sky-50/30'
                                    : colIdx === passwordColumn
                                      ? 'bg-amber-50/30'
                                      : ''
                              }`}
                            >
                              {cell !== undefined && cell !== null && cell !== ''
                                ? String(cell)
                                : '—'}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-slate-400">
                Total rows in file: <strong>{previewRows.length - 1}</strong> (excluding header)
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            disabled={isImporting}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={isImporting}
            className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-md transition-all disabled:opacity-50"
          >
            {isImporting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Upload size={16} />
            )}
            {isImporting ? 'Importing...' : `Import ${previewRows.length > 1 ? previewRows.length - 1 : 0} Volunteers`}
          </button>
        </div>
      </div>
    </div>
  )
}
