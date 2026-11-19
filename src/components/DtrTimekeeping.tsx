'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePamugas } from '@/lib/store';
import { DayType } from '@/types';
import { calculateDtrMetrics, formatPhp, interpretPayroll } from '@/lib/phPayroll';
import {
  Play,
  Square,
  Coffee,
  Plus,
  Trash2,
  ArrowRight,
  Clock,
  RefreshCw,
} from 'lucide-react';

const DAY_TYPE_LABELS: Record<DayType, { label: string; pill: string }> = {
  regular: {
    label: 'Regular Day (1.0x)',
    pill: 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
  },
  rest_day: {
    label: 'Rest Day (1.30x)',
    pill: 'bg-sky-500/15 text-sky-700 dark:text-sky-400',
  },
  special_holiday: {
    label: 'Special Holiday (1.30x)',
    pill: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  },
  regular_holiday: {
    label: 'Regular Holiday (2.00x)',
    pill: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  },
};

export default function DtrTimekeeping() {
  const {
    activeEmployee,
    activeLiveSession,
    dtrEntries,
    leaveRequests,
    clockIn,
    toggleBreak,
    clockOut,
    toggleLiveSessionCto,
    setLiveSessionDayType,
    addManualDtrEntry,
    toggleDtrEntryCto,
    deleteDtrEntry,
    setActiveTab,
  } = usePamugas();

  const [elapsedStr, setElapsedStr] = useState('00:00:00');
  const [selectedDayType, setSelectedDayType] = useState<DayType>('regular');
  const [ctoOnClockIn, setCtoOnClockIn] = useState(false);

  // Manual entry modal / drawer state
  const [showManualForm, setShowManualForm] = useState(false);
  const [manDate, setManDate] = useState('2026-11-12');
  const [manDayType, setManDayType] = useState<DayType>('regular');
  const [manIn, setManIn] = useState(activeEmployee.shiftStart);
  const [manOut, setManOut] = useState('19:00');
  const [manBreak, setManBreak] = useState(String(activeEmployee.breakMinutes));
  const [manCto, setManCto] = useState(false);
  const [manNotes, setManNotes] = useState('');

  useEffect(() => {
    if (!activeLiveSession?.isClockedIn) {
      return;
    }

    const updateTimer = () => {
      const start = new Date(activeLiveSession.clockInIso).getTime();
      const now = Date.now();
      let breakMs = activeLiveSession.accumulatedBreakMinutes * 60000;
      if (activeLiveSession.isOnBreak && activeLiveSession.breakStartIso) {
        breakMs += Math.max(0, now - new Date(activeLiveSession.breakStartIso).getTime());
      }
      const netSec = Math.max(0, Math.floor((now - start - breakMs) / 1000));
      const h = String(Math.floor(netSec / 3600)).padStart(2, '0');
      const m = String(Math.floor((netSec % 3600) / 60)).padStart(2, '0');
      const s = String(netSec % 60).padStart(2, '0');
      setElapsedStr(`${h}:${m}:${s}`);
    };

    const kick = setTimeout(updateTimer, 0);
    const id = setInterval(updateTimer, 1000);
    return () => {
      clearTimeout(kick);
      clearInterval(id);
    };
  }, [activeLiveSession]);

  const displayedElapsed = activeLiveSession?.isClockedIn ? elapsedStr : '00:00:00';

  const empEntries = useMemo(
    () =>
      dtrEntries
        .filter((e) => e.employeeId === activeEmployee.id)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [dtrEntries, activeEmployee.id]
  );

  const empLeaves = useMemo(
    () => leaveRequests.filter((l) => l.employeeId === activeEmployee.id),
    [leaveRequests, activeEmployee.id]
  );

  const livePayrollPreview = useMemo(
    () =>
      interpretPayroll({
        employee: activeEmployee,
        frequency: 'semi_monthly',
        dtrEntries: empEntries,
        approvedLeaves: empLeaves,
      }),
    [activeEmployee, empEntries, empLeaves]
  );

  const manualMetricsPreview = useMemo(
    () =>
      calculateDtrMetrics({
        timeIn: manIn,
        timeOut: manOut,
        breakMinutes: Number(manBreak) || 0,
        dayType: manDayType,
        shiftStart: activeEmployee.shiftStart,
        shiftEnd: activeEmployee.shiftEnd,
        graceMinutes: activeEmployee.graceMinutes,
        convertOtToCto: manCto,
      }),
    [manIn, manOut, manBreak, manDayType, manCto, activeEmployee]
  );

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addManualDtrEntry({
      date: manDate,
      dayType: manDayType,
      timeIn: manIn,
      timeOut: manOut,
      breakMinutes: Math.max(0, Number(manBreak) || 0),
      convertOtToCto: manCto,
      notes: manNotes.trim() || undefined,
    });
    setShowManualForm(false);
    setManNotes('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Grid: Live Time-In / Time-Out Kiosk + Cutoff Pay Impact */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Live Timekeeping Terminal */}
        <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 flex flex-col justify-between gap-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/15 px-3 py-1 text-[11px] font-bold text-sky-700 dark:text-sky-400">
                <Clock className="h-3.5 w-3.5" />
                Live Time-In / Time-Out Kiosk
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-2">
                {activeEmployee.name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Scheduled Shift: {activeEmployee.shiftStart} – {activeEmployee.shiftEnd} (Break{' '}
                {activeEmployee.breakMinutes}m · Grace {activeEmployee.graceMinutes}m)
              </p>
            </div>

            <div className="text-right">
              <div className="font-mono text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {displayedElapsed}
              </div>
              <p className="text-[11px] text-slate-500">
                {activeLiveSession?.isClockedIn
                  ? activeLiveSession.isOnBreak
                    ? 'On Unpaid Break'
                    : 'Active Work Timer'
                  : 'Not Clocked In'}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="rounded-2xl bg-slate-100/80 dark:bg-slate-950/70 p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Day Classification
                </label>
                <select
                  value={activeLiveSession?.dayType ?? selectedDayType}
                  onChange={(e) => {
                    const val = e.target.value as DayType;
                    setSelectedDayType(val);
                    if (activeLiveSession) setLiveSessionDayType(val);
                  }}
                  className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white"
                >
                  <option value="regular">Regular Workday (1.0x)</option>
                  <option value="rest_day">Rest Day (1.30x)</option>
                  <option value="special_holiday">Special Non-Working Holiday (1.30x)</option>
                  <option value="regular_holiday">Regular Holiday (2.00x)</option>
                </select>
              </div>

              <div className="flex items-end">
                <label className="w-full flex items-center justify-between gap-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 cursor-pointer">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Convert OT → CTO Credits
                  </span>
                  <input
                    type="checkbox"
                    checked={
                      activeLiveSession
                        ? activeLiveSession.convertOtToCto
                        : ctoOnClockIn
                    }
                    onChange={() => {
                      if (activeLiveSession) toggleLiveSessionCto();
                      else setCtoOnClockIn((v) => !v);
                    }}
                    className="h-4 w-4 accent-sky-600 rounded"
                  />
                </label>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {!activeLiveSession?.isClockedIn ? (
                <button
                  onClick={() => clockIn(selectedDayType, ctoOnClockIn)}
                  className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm py-3 px-4 transition"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>Time In Now</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={toggleBreak}
                    className={`flex-1 min-w-[130px] inline-flex items-center justify-center gap-2 rounded-xl font-bold text-sm py-3 px-4 transition ${
                      activeLiveSession.isOnBreak
                        ? 'bg-sky-600 hover:bg-sky-500 text-white'
                        : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    <Coffee className="h-4 w-4" />
                    <span>
                      {activeLiveSession.isOnBreak ? 'End Break' : 'Start Break'}
                    </span>
                  </button>

                  <button
                    onClick={() => clockOut()}
                    className="flex-1 min-w-[130px] inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm py-3 px-4 transition"
                  >
                    <Square className="h-4 w-4 fill-current" />
                    <span>Time Out &amp; Log DTR</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Live Cutoff Attendance -> Pay Summary */}
        <div className="lg:col-span-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 flex flex-col justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              DTR Fed Into Pay Interpretation
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              Current Cutoff Attendance Summary
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-slate-100/80 dark:bg-slate-950/60 p-3">
              <p className="text-[11px] text-slate-500">Regular Hours</p>
              <p className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                {livePayrollPreview.totalRegularHours}h
              </p>
              <p className="text-[11px] text-slate-500">{empEntries.length} logged days</p>
            </div>

            <div className="rounded-2xl bg-slate-100/80 dark:bg-slate-950/60 p-3">
              <p className="text-[11px] text-slate-500">Tardiness &amp; UT</p>
              <p className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400">
                {livePayrollPreview.totalLateMinutes +
                  livePayrollPreview.totalUndertimeMinutes}
                m
              </p>
              <p className="text-[11px] text-rose-500">
                -
                {formatPhp(
                  livePayrollPreview.tardinessDeduction +
                    livePayrollPreview.undertimeDeduction
                )}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-100/80 dark:bg-slate-950/60 p-3">
              <p className="text-[11px] text-slate-500">Paid OT &amp; Night Diff</p>
              <p className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                +{livePayrollPreview.totalPaidOtHours}h OT
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                +
                {formatPhp(
                  livePayrollPreview.overtimePay +
                    livePayrollPreview.holidayRestPay +
                    livePayrollPreview.nightDiffPay
                )}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-100/80 dark:bg-slate-950/60 p-3">
              <p className="text-[11px] text-slate-500">CTO Credits Earned</p>
              <p className="text-lg font-bold font-mono text-sky-600 dark:text-sky-400">
                +{livePayrollPreview.totalCtoCreditedHours}h
              </p>
              <p className="text-[11px] text-slate-500">
                Balance: {activeEmployee.leaveBalances.ctoHours}h
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('payroll')}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs py-2.5 px-4 transition"
          >
            <span>Open Full Payroll &amp; Statutory Deductions</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* DTR Log Table + Manual Entry */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Daily Time Record (DTR) Ledger
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click the CTO button on any OT row to toggle Cash Overtime vs. CTO Leave Credits.
            </p>
          </div>

          <button
            onClick={() => setShowManualForm((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-3.5 py-2 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Manual DTR Log</span>
          </button>
        </div>

        {/* Manual DTR Form */}
        {showManualForm && (
          <form
            onSubmit={handleManualSubmit}
            className="rounded-2xl bg-slate-100/80 dark:bg-slate-950/70 p-4 space-y-4 animate-fade-in border border-slate-200 dark:border-slate-800"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={manDate}
                  onChange={(e) => setManDate(e.target.value)}
                  required
                  className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Day Type
                </label>
                <select
                  value={manDayType}
                  onChange={(e) => setManDayType(e.target.value as DayType)}
                  className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                >
                  <option value="regular">Regular Day</option>
                  <option value="rest_day">Rest Day (1.30x)</option>
                  <option value="special_holiday">Special Holiday (1.30x)</option>
                  <option value="regular_holiday">Regular Holiday (2.00x)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Time In
                </label>
                <input
                  type="time"
                  value={manIn}
                  onChange={(e) => setManIn(e.target.value)}
                  required
                  className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Time Out
                </label>
                <input
                  type="time"
                  value={manOut}
                  onChange={(e) => setManOut(e.target.value)}
                  required
                  className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Break (mins)
                </label>
                <input
                  type="number"
                  value={manBreak}
                  onChange={(e) => setManBreak(e.target.value)}
                  min={0}
                  max={180}
                  className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[220px]">
                <input
                  type="text"
                  placeholder="Remarks (e.g. Month-end closing OT)"
                  value={manNotes}
                  onChange={(e) => setManNotes(e.target.value)}
                  className="flex-1 min-w-[180px] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
                />

                <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={manCto}
                    onChange={(e) => setManCto(e.target.checked)}
                    className="h-4 w-4 accent-sky-600"
                  />
                  <span>Convert OT to CTO</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 transition"
                >
                  Save DTR Entry
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualForm(false)}
                  className="rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs px-3 py-2"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Instant Preview Strip */}
            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex flex-wrap gap-4 pt-1">
              <span>Preview Reg: {manualMetricsPreview.regularHours}h</span>
              <span>Late: {manualMetricsPreview.lateMinutes}m</span>
              <span>UT: {manualMetricsPreview.undertimeMinutes}m</span>
              <span>OT: {manualMetricsPreview.overtimeHours}h</span>
              <span>NSD: {manualMetricsPreview.nightDiffHours}h</span>
              {manualMetricsPreview.ctoHoursCredited > 0 && (
                <span className="text-sky-600 dark:text-sky-400 font-bold">
                  CTO: +{manualMetricsPreview.ctoHoursCredited}h
                </span>
              )}
            </div>
          </form>
        )}

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="py-3 pr-3 font-semibold">Date</th>
                <th className="py-3 px-3 font-semibold">Day Type</th>
                <th className="py-3 px-3 font-semibold">Time In / Out</th>
                <th className="py-3 px-3 font-semibold">Reg Hrs</th>
                <th className="py-3 px-3 font-semibold">Late / UT</th>
                <th className="py-3 px-3 font-semibold">OT / CTO</th>
                <th className="py-3 px-3 font-semibold">Night Diff</th>
                <th className="py-3 px-3 font-semibold">Notes</th>
                <th className="py-3 pl-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
              {empEntries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No DTR entries yet for {activeEmployee.name}. Clock in above or add a
                    manual entry.
                  </td>
                </tr>
              ) : (
                empEntries.map((entry) => {
                  const dt = DAY_TYPE_LABELS[entry.dayType];
                  return (
                    <tr
                      key={entry.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition"
                    >
                      <td className="py-3 pr-3 font-mono font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        {entry.date}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${dt.pill}`}
                        >
                          {dt.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {entry.timeIn} → {entry.timeOut}{' '}
                        <span className="text-[10px] text-slate-400">
                          ({entry.breakMinutes}m brk)
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-slate-900 dark:text-white">
                        {entry.regularHours}h
                      </td>
                      <td className="py-3 px-3 font-mono whitespace-nowrap">
                        {entry.lateMinutes > 0 || entry.undertimeMinutes > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400 font-semibold">
                            {entry.lateMinutes}m L / {entry.undertimeMinutes}m UT
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {entry.overtimeHours > 0 ? (
                          <button
                            onClick={() => toggleDtrEntryCto(entry.id)}
                            title="Toggle Cash OT vs CTO Conversion"
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold transition ${
                              entry.convertOtToCto
                                ? 'bg-sky-500/15 text-sky-700 dark:text-sky-400'
                                : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                            }`}
                          >
                            <RefreshCw className="h-2.5 w-2.5" />
                            {entry.convertOtToCto
                              ? `+${entry.ctoHoursCredited}h CTO`
                              : `${entry.overtimeHours}h Paid OT`}
                          </button>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                        {entry.nightDiffHours > 0 ? `${entry.nightDiffHours}h` : '—'}
                      </td>
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400 max-w-[180px] truncate">
                        {entry.notes || '—'}
                      </td>
                      <td className="py-3 pl-3 text-right">
                        <button
                          onClick={() => deleteDtrEntry(entry.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
                          title="Delete entry"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

