'use client';

import React, { useState } from 'react';
import { X, ShoppingBag, Plus, ListChecks, Hash, FileText, Users, Activity } from 'lucide-react';

export interface StallFormPayload {
  name: string;
  description?: string;
  maxVolunteers?: number;
  status?: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  metrics: string[];
}

interface StallFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialData?: {
    name?: string;
    description?: string | null;
    maxVolunteers?: number;
    status?: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
    metrics?: string[];
  };
  onClose: () => void;
  onSubmit: (data: StallFormPayload) => Promise<void>;
}

export default function StallFormModal({ isOpen, mode, initialData, onClose, onSubmit }: StallFormModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [maxVolunteers, setMaxVolunteers] = useState<number>(5);
  const [status, setStatus] = useState<'ACTIVE' | 'MAINTENANCE' | 'INACTIVE'>('ACTIVE');
  const [metrics, setMetrics] = useState<string[]>([]);
  const [metricDraft, setMetricDraft] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setName(initialData?.name ?? '');
      setDescription(initialData?.description ?? '');
      setMaxVolunteers(initialData?.maxVolunteers ?? 5);
      setStatus((initialData?.status as 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE' | undefined) ?? 'ACTIVE');
      setMetrics(initialData?.metrics ?? []);
      setMetricDraft('');
      setError('');
      setTouched(false);
    }
  }, [isOpen, initialData]);

  const nameError = !name.trim() ? 'Stall name is required' : '';
  const maxVolunteersError = !Number.isFinite(maxVolunteers) || maxVolunteers < 1 || maxVolunteers > 50
    ? 'Must be between 1 and 50'
    : '';

  const addMetric = () => {
    const trimmed = metricDraft.trim();
    if (!trimmed) return;
    if (metrics.some(m => m.toLowerCase() === trimmed.toLowerCase())) {
      setError(`"${trimmed}" is already added.`);
      return;
    }
    if (metrics.length >= 20) {
      setError('Maximum 20 metrics allowed.');
      return;
    }
    setMetrics([...metrics, trimmed]);
    setMetricDraft('');
    setError('');
  };

  const removeMetric = (idx: number) => {
    setMetrics(metrics.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (nameError || maxVolunteersError) return;
    setIsLoading(true);
    setError('');

    try {
      const payload: StallFormPayload = {
        name: name.trim(),
        metrics,
      }
      if (mode === 'edit') {
        payload.description = description.trim()
        payload.maxVolunteers = maxVolunteers
        payload.status = status
      }
      await onSubmit(payload);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const title = mode === 'edit' ? 'Edit Stall' : 'Create New Stall';
  const submitLabel = mode === 'edit' ? 'Save Changes' : 'Create Stall';
  const submittingLabel = mode === 'edit' ? 'Saving...' : 'Creating...';

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-600 font-medium">{error}</div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700" htmlFor="name">
              Stall Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <ShoppingBag className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${touched && nameError ? 'text-rose-400' : 'text-slate-400'}`} />
              <input
                id="name" type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); if (touched) setError(''); }}
                onBlur={() => setTouched(true)}
                placeholder="e.g. Math Quest"
                className={`w-full pl-9 pr-4 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 transition-all placeholder:text-slate-400 ${
                  touched && nameError
                    ? 'bg-rose-50 border border-rose-300 focus:ring-rose-500/20 focus:border-rose-500 text-rose-800'
                    : 'bg-slate-50 border border-slate-200 focus:ring-violet-500/20 focus:border-violet-500 text-slate-800'
                }`}
              />
            </div>
            {touched && nameError && (
              <p className="text-[11px] text-rose-500 font-medium">{nameError}</p>
            )}
          </div>

          {mode === 'edit' && (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5" htmlFor="description">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  Description
                </label>
                <textarea
                  id="description"
                  rows={2}
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); if (error) setError(''); }}
                  placeholder="Short description of this activity"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-800 placeholder:text-slate-400 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5" htmlFor="max">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    Max Volunteers
                  </label>
                  <input
                    id="max" type="number" min={1} max={50}
                    value={Number.isFinite(maxVolunteers) ? maxVolunteers : ''}
                    onChange={(e) => { setMaxVolunteers(Number(e.target.value)); if (error) setError(''); }}
                    onBlur={() => setTouched(true)}
                    className={`w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 transition-all ${
                      touched && maxVolunteersError
                        ? 'bg-rose-50 border border-rose-300 focus:ring-rose-500/20 focus:border-rose-500 text-rose-800'
                        : 'bg-slate-50 border border-slate-200 focus:ring-violet-500/20 focus:border-violet-500 text-slate-800'
                    }`}
                  />
                  {touched && maxVolunteersError && (
                    <p className="text-[11px] text-rose-500 font-medium">{maxVolunteersError}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5" htmlFor="status">
                    <Activity className="w-3.5 h-3.5 text-slate-500" />
                    Status
                  </label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => { setStatus(e.target.value as 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE'); if (error) setError(''); }}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-800 font-semibold"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <ListChecks className="w-3.5 h-3.5 text-slate-500" />
              Evaluation Metrics
              <span className="text-slate-400 font-normal text-[11px]">(optional)</span>
            </label>
            <p className="text-[11px] text-slate-500 leading-snug">
              Add star-rated criteria like &quot;thinking&quot;, &quot;execution&quot;. Evaluators will rate 1-5 stars per metric; overall score is auto-calculated.
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Hash className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="metric" type="text"
                  value={metricDraft}
                  onChange={(e) => { setMetricDraft(e.target.value); if (error) setError(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMetric(); } }}
                  placeholder="e.g. Creativity"
                  className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-slate-800 placeholder:text-slate-400"
                />
              </div>
              <button
                type="button"
                onClick={addMetric}
                disabled={!metricDraft.trim()}
                className="px-3 py-2 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>
            {metrics.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {metrics.map((m, idx) => (
                  <span key={`${m}-${idx}`} className="inline-flex items-center gap-1 bg-violet-50 border border-violet-100 text-violet-800 text-xs font-semibold px-2 py-1 rounded-lg">
                    {m}
                    <button
                      type="button"
                      onClick={() => removeMetric(idx)}
                      className="text-violet-400 hover:text-rose-500 transition-colors"
                      aria-label={`Remove ${m}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic pt-1">No metrics yet — leave empty to keep the standard score slider.</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
            <button type="submit" disabled={isLoading} className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-60 transition-colors">
              {isLoading ? submittingLabel : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
