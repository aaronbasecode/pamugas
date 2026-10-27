'use client';

import React, { useState } from 'react';
import { usePamugas } from '@/lib/store';
import { Deliverable, DeliverableStatus } from '@/types';
import { formatInTz, MANILA_TZ } from '@/lib/timezone';
import {
  FileCheck2,
  Clock,
  AlertCircle,
  CheckCircle2,
  Plus,
  Eye,
} from 'lucide-react';
import ReviewDrawer from './ReviewDrawer';
import NewDeliverableModal from './NewDeliverableModal';

export default function DeliverablesQueue() {
  const { role, deliverables, clients, activeClient, selectedClientId } = usePamugas();
  const [filter, setFilter] = useState<'all' | DeliverableStatus>('all');
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  const clientDeliverables = deliverables.filter((d) => {
    const matchesClient = d.clientId === selectedClientId;
    const matchesStatus = filter === 'all' || d.status === filter;
    return matchesClient && matchesStatus;
  });

  const getStatusBadge = (status: DeliverableStatus, smartDispatch: boolean) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="h-3.5 w-3.5" /> Approved
          </span>
        );
      case 'revision_requested':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-1 text-xs font-semibold text-rose-400 border border-rose-500/30">
            <AlertCircle className="h-3.5 w-3.5" /> Revision Requested
          </span>
        );
      case 'pending_review':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-400 border border-amber-500/30">
            <Clock className="h-3.5 w-3.5" />
            {smartDispatch ? 'Queued (9 AM Dispatch)' : 'Pending Review'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Bar: Title, Stats & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white tracking-tight">Deliverables Queue</h3>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-300">
              {clientDeliverables.length} total
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Timezone-aware client review pipeline with atomic sign-offs and revision caps.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Tabs */}
          <div className="flex rounded-lg border border-slate-800 bg-slate-900/80 p-0.5 text-xs">
            {(['all', 'pending_review', 'revision_requested', 'approved'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`rounded-md px-2.5 py-1 font-medium capitalize transition-colors ${
                  filter === tab
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab === 'all'
                  ? 'All'
                  : tab === 'pending_review'
                  ? 'Pending'
                  : tab === 'revision_requested'
                  ? 'Revisions'
                  : 'Approved'}
              </button>
            ))}
          </div>

          {/* New Deliverable Button (Agency Admin only) */}
          {role === 'agency_admin' && (
            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-amber-400 shadow-md shadow-amber-500/20"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Submit Deliverable</span>
            </button>
          )}
        </div>
      </div>

      {/* Deliverables Grid/List */}
      {clientDeliverables.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 p-8 text-center">
          <FileCheck2 className="mx-auto h-10 w-10 text-slate-600 mb-2" />
          <h4 className="text-sm font-semibold text-slate-300">No deliverables found</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {role === 'agency_admin'
              ? 'Click "Submit Deliverable" to upload a new asset with Smart 9:00 AM Client Dispatch.'
              : 'There are no deliverables currently requiring your review.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clientDeliverables.map((item) => {
            const client = clients.find((c) => c.id === item.clientId) || activeClient;
            return (
              <div
                key={item.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 sm:p-5 transition-all hover:border-slate-700 hover:bg-slate-900/90 shadow-lg"
              >
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-md bg-slate-800/80 px-2 py-0.5 text-[11px] font-mono font-medium text-slate-300">
                      {item.id}
                    </span>
                    {getStatusBadge(item.status, item.smartDispatch)}
                  </div>

                  <h4 className="text-sm font-semibold text-white mt-2 group-hover:text-amber-400 transition-colors">
                    {item.title}
                  </h4>

                  <span className="mt-1 inline-block rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                    {item.category}
                  </span>

                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">{item.notes}</p>

                  {/* Feedback preview if revision requested */}
                  {item.status === 'revision_requested' && item.feedback && (
                    <div className="mt-3 rounded-lg border border-rose-500/20 bg-rose-500/10 p-2.5 text-xs text-rose-300">
                      <span className="font-semibold text-rose-400">Client Feedback: </span>
                      {item.feedback}
                    </div>
                  )}
                </div>

                {/* Footer with Timestamps & Action */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                    <div>
                      <span className="block text-[10px] text-slate-500 uppercase">Uploaded (PHT)</span>
                      <span className="font-mono text-slate-300">
                        {formatInTz(item.submittedAtPht, MANILA_TZ, 'MMM d · hh:mm a')}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500 uppercase">
                        {item.smartDispatch ? 'Scheduled Local' : 'Released Local'}
                      </span>
                      <span className="font-mono text-slate-300">
                        {formatInTz(
                          item.scheduledClientRelease,
                          client?.timezone || 'America/New_York',
                          'MMM d · hh:mm a'
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">
                      Revisions: <strong className="text-slate-200">{item.revisionCount}</strong>
                    </span>

                    <button
                      onClick={() => setSelectedDeliverable(item)}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5 text-amber-400" />
                      <span>{role === 'client_viewer' ? 'Review & Sign-Off' : 'Inspect Details'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Drawer Modal */}
      {selectedDeliverable && (
        <ReviewDrawer
          deliverable={selectedDeliverable}
          onClose={() => setSelectedDeliverable(null)}
        />
      )}

      {/* New Deliverable Modal */}
      {showNewModal && <NewDeliverableModal onClose={() => setShowNewModal(false)} />}
    </div>
  );
}
