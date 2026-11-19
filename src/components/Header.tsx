'use client';

import React, { useEffect, useState } from 'react';
import { usePamugas } from '@/lib/store';
import { Menu, Sun, Moon, Clock } from 'lucide-react';

export default function Header() {
  const { activeTab, setActiveTab, toggleSidebar, theme, toggleTheme, activeEmployee, activeLiveSession } =
    usePamugas();
  const [phtTime, setPhtTime] = useState<string>('');

  useEffect(() => {
    const tick = () => {
      setPhtTime(
        new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Manila',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }).format(new Date())
      );
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  const tabTitles: Record<string, string> = {
    overview: 'Dashboard Overview',
    dtr: 'Timekeeping & Daily Time Record (DTR)',
    payroll: 'Payroll & PH Deductions',
    schedule: 'Schedule, Leave & CTO',
    annual: '13th Month Pay & ₱90k Non-Taxable Cap',
    termination: 'Termination & Final Pay Calculator',
  };

  return (
    <header className="sticky top-0 z-20 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-800/70 transition-colors">
      <div className="mx-auto flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8 gap-3">
        {/* Left: Mobile Menu Trigger & Section Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={toggleSidebar}
            className="lg:hidden flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-200/70 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-800 transition"
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <h1 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">
              {tabTitles[activeTab] || 'PH Payroll & DTR Tracker'}
            </h1>
            <p className="text-[11px] text-slate-500 hidden sm:block truncate">
              {activeEmployee.name} · {activeEmployee.employeeNo} ·{' '}
              {activeEmployee.department}
            </p>
          </div>
        </div>

        {/* Right: Compact PHT Status Pill & Theme Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('dtr')}
            title="View Timekeeping & DTR"
            className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800 transition-colors"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                activeLiveSession?.isClockedIn
                  ? activeLiveSession.isOnBreak
                    ? 'bg-amber-500'
                    : 'bg-emerald-500 animate-pulse'
                  : 'bg-slate-400'
              }`}
            />
            <Clock className="h-3.5 w-3.5 text-sky-500" />
            <span className="font-mono font-semibold">{phtTime || '--:--'} PHT</span>
          </button>

          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-200/60 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 transition-colors hover:text-sky-500"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-slate-700" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
