'use client';

import React, { useEffect } from 'react';
import { usePamugas } from '@/lib/store';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast() {
  const { toast, clearToast } = usePamugas();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      clearToast();
    }, 3800);
    return () => clearTimeout(timer);
  }, [toast, clearToast]);

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />,
    info: <Info className="h-4 w-4 text-amber-400 shrink-0" />,
  };

  const bgStyles = {
    success: 'bg-emerald-950/90 text-emerald-100',
    error: 'bg-rose-950/90 text-rose-100',
    info: 'bg-slate-900/95 text-slate-100',
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-fade-in max-w-sm w-full pointer-events-auto">
      <div
        className={`flex items-center justify-between gap-3 p-3.5 rounded-2xl ${bgStyles[toast.type]} backdrop-blur-md`}
      >
        <div className="flex items-center gap-2.5">
          {icons[toast.type]}
          <p className="text-xs font-medium leading-snug">{toast.message}</p>
        </div>
        <button
          onClick={clearToast}
          className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
