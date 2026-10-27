'use client';

import React, { useState } from 'react';
import { usePamugas } from '@/lib/store';
import { Deliverable } from '@/types';
import { formatInTz, MANILA_TZ } from '@/lib/timezone';
import {
  X,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Clock,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

interface ReviewDrawerProps {
  deliverable: Deliverable;
  onClose: () => void;
}

export default function ReviewDrawer({ deliverable, onClose }: ReviewDrawerProps) {
  const {
    role,
    clients,
    activeClient,
    approveDeliverable,
    requestRevision,
  } = usePamugas();

  const client = clients.find((c) => c.id === deliverable.clientId) || activeClient;

  const [feedback, setFeedback] = useState('');
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const handleApprove = () => {
    const res = approveDeliverable(deliverable.id);
    if (res.success) {
      setStatusMessage({ text: res.message, isError: false });
      setTimeout(onClose, 1200);
    } else {
      setStatusMessage({ text: res.message, isError: true });
    }
  };

  const handleRevisionSubmit = () => {
    if (!feedback.trim()) {
      setStatusMessage({ text: 'Please enter revision notes/feedback for the agency team.', isError: true });
      return;
    }
    const res = requestRevision(deliverable.id, feedback);
    if (res.success) {
      setStatusMessage({ text: res.message, isError: false });
      setTimeout(onClose, 1200);
    } else {
      setStatusMessage({ text: res.message, isError: true });
    }
  };

  const isQuotaExceeded = client ? client.revisionsUsed >= client.revisionsMax : false;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="h-full w-full max-w-lg border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 flex flex-col justify-between overflow-y-auto shadow-2xl transition-colors">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-amber-500/10 px-2 py-0.5 font-mono text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {deliverable.id}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{client?.name}</span>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Title & Category */}
          <div className="mt-4">
            <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-300">
              {deliverable.category}
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-2 leading-snug">
              {deliverable.title}
            </h3>
          </div>

          {/* Status Message Banner */}
          {statusMessage && (
            <div
              className={`mt-4 rounded-xl p-3 text-xs font-medium border ${
                statusMessage.isError
                  ? 'bg-rose-50 dark:bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-300'
                  : 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
              }`}
            >
              {statusMessage.text}
            </div>
          )}

          {/* Timezone Audit Trail */}
          <div className="mt-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" /> Timezone Audit Trail
            </span>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="block text-[11px] text-slate-400 dark:text-slate-500">Agency Submission (PHT)</span>
                <span className="font-mono text-slate-800 dark:text-slate-200 font-medium">
                  {formatInTz(deliverable.submittedAtPht, MANILA_TZ, 'MMM d, yyyy · hh:mm a')}
                </span>
              </div>
              <div>
                <span className="block text-[11px] text-slate-400 dark:text-slate-500">
                  Client Release ({client?.tzLabel})
                </span>
                <span className="font-mono text-slate-800 dark:text-slate-200 font-medium">
                  {formatInTz(
                    deliverable.scheduledClientRelease,
                    client?.timezone || 'America/New_York',
                    'MMM d, yyyy · hh:mm a'
                  )}
                </span>
              </div>
            </div>

            {deliverable.smartDispatch && (
              <div className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-1 text-[11px] text-amber-700 dark:text-amber-300 border border-amber-500/20">
                <Sparkles className="h-3 w-3" />
                <span>Queued for 9:00 AM dispatch in client local time to prevent off-hour alerts.</span>
              </div>
            )}
          </div>

          {/* Scope & Notes */}
          <div className="mt-5 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Agency Notes & Deliverable Scope
            </span>
            <p className="text-xs text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-3 leading-relaxed">
              {deliverable.notes}
            </p>
          </div>

          {/* Asset Preview Link */}
          <div className="mt-4">
            <a
              href={deliverable.assetUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-colors"
            >
              <span>View Full Asset in External Workspace</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          {/* Revision Quota Tracker */}
          {client && (
            <div className="mt-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Client Revision Quota:</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {client.revisionsUsed} / {client.revisionsMax} rounds used
                </span>
              </div>

              <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    isQuotaExceeded ? 'bg-rose-500' : 'bg-amber-500'
                  }`}
                  style={{
                    width: `${Math.min(100, (client.revisionsUsed / client.revisionsMax) * 100)}%`,
                  }}
                />
              </div>

              {isQuotaExceeded && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-2 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>Quota reached! Revisions beyond SLA are billed at $65/hr.</span>
                </p>
              )}
            </div>
          )}

          {/* Revision Input Box */}
          {showFeedbackInput && (
            <div className="mt-4 space-y-2 animate-fade-in">
              <label className="block text-xs font-semibold text-rose-600 dark:text-rose-400">
                Specify Revision Notes / Adjustments:
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                placeholder="Detail required adjustments, design tweaks, or copy changes..."
                className="w-full rounded-xl border border-rose-500/30 bg-white dark:bg-slate-900/90 p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-rose-400 focus:outline-none"
              />
              <button
                onClick={handleRevisionSubmit}
                disabled={isQuotaExceeded}
                className={`w-full rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  isQuotaExceeded
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    : 'bg-rose-600 text-white hover:bg-rose-500 shadow-md shadow-rose-600/20'
                }`}
              >
                Submit Revision Request
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3">
          {role === 'client_viewer' ? (
            <div className="space-y-2">
              <button
                onClick={handleApprove}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Approve Deliverable (Digital Sign-Off)</span>
              </button>

              {!showFeedbackInput && (
                <button
                  onClick={() => setShowFeedbackInput(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-rose-500/40 hover:text-rose-500 dark:hover:text-rose-400 transition"
                >
                  <AlertCircle className="h-4 w-4" />
                  <span>Request Revision</span>
                </button>
              )}
            </div>
          ) : (
            <div className="text-center text-xs text-slate-500">
              Agency Admin Mode: Switch to "Client View" at top right to test atomic client approval and revision requests.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
