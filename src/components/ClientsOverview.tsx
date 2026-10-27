'use client';

import React from 'react';
import { usePamugas } from '@/lib/store';
import { MapPin } from 'lucide-react';

export default function ClientsOverview() {
  const { clients, deliverables, setSelectedClientId } = usePamugas();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-white tracking-tight">Active Client Accounts</h3>
        <p className="text-xs text-slate-400">
          Global client retainers, timezone alignments, and operational quotas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {clients.map((client) => {
          const clientDelivs = deliverables.filter((d) => d.clientId === client.id);
          const pendingCount = clientDelivs.filter((d) => d.status === 'pending_review').length;
          const isQuotaNear = client.revisionsUsed >= client.revisionsMax;

          return (
            <div
              key={client.id}
              onClick={() => setSelectedClientId(client.id)}
              className="cursor-pointer group rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 hover:border-slate-700 hover:bg-slate-900/90 transition-all shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-amber-400 font-bold text-sm border border-slate-700">
                    {client.name.substring(0, 2).toUpperCase()}
                  </span>
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
                    {client.tzLabel}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white mt-3 group-hover:text-amber-400 transition-colors">
                  {client.name}
                </h4>

                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-amber-400" />
                  {client.city}
                </p>

                {/* Retainer & Services */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Monthly Retainer:</span>
                    <span className="font-mono font-bold text-white">
                      ${client.retainerUsd.toLocaleString()} USD
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Revision Quota:</span>
                    <span className={`font-mono font-semibold ${isQuotaNear ? 'text-rose-400' : 'text-slate-200'}`}>
                      {client.revisionsUsed} / {client.revisionsMax} used
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Pending Approvals:</span>
                    <span className="font-mono font-semibold text-amber-400">{pendingCount}</span>
                  </div>
                </div>

                {/* Services Tags */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {client.services.map((svc) => (
                    <span
                      key={svc}
                      className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 font-medium"
                    >
                      {svc}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-end">
                <span className="text-[11px] font-semibold text-amber-400 group-hover:underline">
                  Switch Active Portal &rarr;
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
