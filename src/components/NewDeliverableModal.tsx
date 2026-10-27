'use client';

import React, { useState } from 'react';
import { usePamugas } from '@/lib/store';
import { DeliverableCategory } from '@/types';
import { calculateNextClient9AM, formatInTz } from '@/lib/timezone';
import { X, Sparkles, Clock, FilePlus2 } from 'lucide-react';

interface NewDeliverableModalProps {
  onClose: () => void;
}

const CATEGORIES: DeliverableCategory[] = [
  'SEO Audit',
  'Paid Ads Creatives',
  'Content & Copy',
  'CRO & Landing Page',
  'Technical Dev',
];

export default function NewDeliverableModal({ onClose }: NewDeliverableModalProps) {
  const { clients, activeClient, addDeliverable } = usePamugas();

  const [clientId, setClientId] = useState(activeClient?.id || clients[0]?.id || '');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DeliverableCategory>('SEO Audit');
  const [assetUrl, setAssetUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [smartDispatch, setSmartDispatch] = useState(true);

  const targetClient = clients.find((c) => c.id === clientId);
  const scheduledTime = targetClient
    ? calculateNextClient9AM(targetClient.timezone)
    : '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !clientId) return;

    addDeliverable({
      clientId,
      title: title.trim(),
      category,
      assetUrl: assetUrl.trim() || 'https://workspace.pamugas.agency/assets',
      notes: notes.trim() || 'Uploaded by Manila operations team.',
      smartDispatch,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <FilePlus2 className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-white">Upload New Deliverable</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-900 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Client select */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Assign to Global Client
            </label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.city} ({c.tzLabel})
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Deliverable Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q4 Technical SEO Audit & Backlink Matrix"
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as DeliverableCategory)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Asset URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Asset Link (Figma, Google Docs, Loom, etc.)
            </label>
            <input
              type="url"
              value={assetUrl}
              onChange={(e) => setAssetUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Scope of Work & Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Summary of changes, deliverables included, key metrics..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Smart 9 AM Dispatch toggle */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <div>
                  <span className="text-xs font-semibold text-white">Smart 9:00 AM Client Dispatch</span>
                  <p className="text-[11px] text-slate-400">
                    Holds notification until 9:00 AM in client's local timezone.
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={smartDispatch}
                onChange={(e) => setSmartDispatch(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 text-amber-500 focus:ring-amber-400 cursor-pointer"
              />
            </div>

            {smartDispatch && targetClient && (
              <div className="mt-2.5 pt-2 border-t border-slate-800 text-[11px] text-slate-300 flex items-center gap-1.5 font-mono">
                <Clock className="h-3 w-3 text-emerald-400" />
                <span>
                  Will release:{' '}
                  {formatInTz(scheduledTime, targetClient.timezone, 'MMM d, yyyy · 09:00 AM')} ({targetClient.tzLabel})
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400 transition shadow-md shadow-amber-500/20"
            >
              Confirm & Queue Deliverable
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
