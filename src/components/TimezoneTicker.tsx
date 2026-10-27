'use client';

import React, { useState, useEffect } from 'react';
import { usePamugas } from '@/lib/store';
import { getLiveTimeComparison } from '@/lib/timezone';
import { Clock, MapPin, Zap } from 'lucide-react';

export default function TimezoneTicker() {
  const { activeClient } = usePamugas();
  const [mounted, setMounted] = useState(false);
  const [timeData, setTimeData] = useState<ReturnType<typeof getLiveTimeComparison> | null>(null);

  useEffect(() => {
    setMounted(true);
    const targetTz = activeClient?.timezone || 'America/New_York';
    const update = () => setTimeData(getLiveTimeComparison(targetTz));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [activeClient]);

  if (!activeClient) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-5 shadow-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Client Context Banner */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/80 text-amber-400 font-bold text-lg">
            {activeClient.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold text-white">{activeClient.name}</h2>
              <span className="flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                <MapPin className="h-3 w-3 text-amber-400" />
                {activeClient.city}
              </span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                {activeClient.tzLabel}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
              <span>Primary Contact:</span>
              <span className="text-slate-200 font-medium">{activeClient.contactName}</span>
              <span className="text-slate-500">({activeClient.contactEmail})</span>
            </p>
          </div>
        </div>

        {/* Center: Live Dual Time Compare */}
        <div className="grid grid-cols-2 gap-3 sm:gap-6 rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 sm:px-5">
          {/* Manila Time */}
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400/90 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Manila (PHT)
            </span>
            <span className="text-base sm:text-lg font-mono font-bold text-white mt-0.5">
              {mounted && timeData ? timeData.phtFormatted : '--:--:--'}
            </span>
            <span className="text-[11px] text-slate-400">
              {mounted && timeData ? timeData.phtDateFormatted : 'Asia/Manila'}
            </span>
          </div>

          {/* Client Local Time */}
          <div className="flex flex-col border-l border-slate-800 pl-3 sm:pl-6">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Client Local
            </span>
            <span className="text-base sm:text-lg font-mono font-bold text-white mt-0.5">
              {mounted && timeData ? timeData.clientFormatted : '--:--:--'}
            </span>
            <span className="text-[11px] text-slate-400">
              {mounted && timeData ? timeData.clientDateFormatted : activeClient.tzLabel}
            </span>
          </div>
        </div>

        {/* Right: Overlap Window & Working Hours status */}
        <div className="flex flex-col justify-center rounded-xl border border-slate-800 bg-slate-900/40 p-3 lg:max-w-xs">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-medium text-slate-300 flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              Live Collaboration Window
            </span>
            {mounted && timeData?.isOverlapping ? (
              <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
                ACTIVE NOW
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                ASYNCHRONOUS
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Overlap: <span className="text-slate-200 font-medium">{activeClient.overlapWindow}</span>
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            Deliverables submitted overnight can use Smart 9:00 AM Client Dispatch.
          </p>
        </div>
      </div>
    </div>
  );
}
