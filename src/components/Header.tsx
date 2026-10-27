'use client';

import React, { useState, useEffect } from 'react';
import { usePamugas } from '@/lib/store';
import { MANILA_TZ, formatInTz } from '@/lib/timezone';
import {
  Clock,
  ShieldCheck,
  Building2,
  UserCheck,
  RotateCcw,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';

export default function Header() {
  const {
    role,
    setRole,
    theme,
    toggleTheme,
    selectedClientId,
    setSelectedClientId,
    clients,
    resetAllData,
  } = usePamugas();

  const [manilaClock, setManilaClock] = useState('');

  useEffect(() => {
    const updateTime = () => {
      setManilaClock(formatInTz(new Date(), MANILA_TZ, 'hh:mm:ss a'));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800/80 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-emerald-600 text-white shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/30">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Pamugas</span>
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/30">
                PH Agency Ops
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Freelancer & Agency Operations Portal</p>
          </div>
        </div>

        {/* Live Manila HQ Clock */}
        <div className="hidden lg:flex items-center gap-3 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/60 px-4 py-1.5 text-xs text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <Clock className="h-3.5 w-3.5" />
            <span>Manila HQ (PHT UTC+8):</span>
          </div>
          <span className="font-mono font-semibold text-slate-900 dark:text-white tracking-wide">
            {manilaClock || 'Loading...'}
          </span>
        </div>

        {/* Persona, Theme & Client Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Client Selector */}
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/80 px-2.5 py-1 text-xs">
            <Building2 className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">
                  {c.name} ({c.tzLabel})
                </option>
              ))}
            </select>
          </div>

          {/* Role Toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-900/90 p-0.5 text-xs">
            <button
              onClick={() => setRole('agency_admin')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-all ${
                role === 'agency_admin'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Switch to Agency Admin persona (Manila HQ)"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Agency Admin</span>
            </button>
            <button
              onClick={() => setRole('client_viewer')}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-all ${
                role === 'client_viewer'
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Switch to Client Viewer persona (Global Client)"
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Client View</span>
            </button>
          </div>

          {/* Theme Toggle (Light / Dark) */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 transition-colors hover:border-slate-300 dark:hover:border-slate-700 hover:text-amber-500"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-slate-700" />
            )}
          </button>

          {/* Reset Demo Data Button */}
          <button
            onClick={resetAllData}
            title="Reset to default seed data"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 transition-colors hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
