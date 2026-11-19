'use client';

import React, { useMemo, useState } from 'react';
import { usePamugas } from '@/lib/store';
import { DeMinimisPackage, LeaveType } from '@/types';
import { evaluateDeMinimis, formatPhp } from '@/lib/phPayroll';
import { CalendarClock, Gift, RefreshCw, CheckCircle2, Plus } from 'lucide-react';

const WEEKDAYS = [
  { idx: 0, label: 'Sun' },
  { idx: 1, label: 'Mon' },
  { idx: 2, label: 'Tue' },
  { idx: 3, label: 'Wed' },
  { idx: 4, label: 'Thu' },
  { idx: 5, label: 'Fri' },
  { idx: 6, label: 'Sat' },
];

export default function ScheduleLeaveCto() {
  const {
    role,
    activeEmployee,
    leaveRequests,
    updateEmployeeSchedule,
    updateEmployeeDeMinimis,
    createLeaveRequest,
    approveLeaveRequest,
  } = usePamugas();

  // Scheduling local state
  const [shiftStart, setShiftStart] = useState(activeEmployee.shiftStart);
  const [shiftEnd, setShiftEnd] = useState(activeEmployee.shiftEnd);
  const [breakMinutes, setBreakMinutes] = useState(activeEmployee.breakMinutes);
  const [graceMinutes, setGraceMinutes] = useState(activeEmployee.graceMinutes);
  const [workingDays, setWorkingDays] = useState(activeEmployee.workingDaysPerMonth);
  const [restDays, setRestDays] = useState<number[]>(activeEmployee.restDays);

  // De Minimis local state
  const [deMinimis, setDeMinimis] = useState<DeMinimisPackage>(activeEmployee.deMinimis);

  // Leave / CTO Filing state
  const [leaveType, setLeaveType] = useState<LeaveType>('CTO');
  const [leaveDate, setLeaveDate] = useState('2026-11-16');
  const [leaveHours, setLeaveHours] = useState(4);
  const [leaveReason, setLeaveReason] = useState('');

  const deMinimisEval = useMemo(() => evaluateDeMinimis(deMinimis), [deMinimis]);

  const empLeaves = useMemo(
    () => leaveRequests.filter((l) => l.employeeId === activeEmployee.id),
    [leaveRequests, activeEmployee.id]
  );

  const toggleRestDay = (dayIdx: number) => {
    setRestDays((prev) =>
      prev.includes(dayIdx) ? prev.filter((d) => d !== dayIdx) : [...prev, dayIdx]
    );
  };

  const applyPreset = (start: string, end: string) => {
    setShiftStart(start);
    setShiftEnd(end);
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    updateEmployeeSchedule(activeEmployee.id, {
      shiftStart,
      shiftEnd,
      breakMinutes: Math.max(0, breakMinutes),
      graceMinutes: Math.max(0, graceMinutes),
      workingDaysPerMonth: workingDays,
      restDays,
    });
  };

  const handleSaveDeMinimis = (e: React.FormEvent) => {
    e.preventDefault();
    updateEmployeeDeMinimis(activeEmployee.id, deMinimis);
  };

  const handleFileLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReason.trim()) return;
    createLeaveRequest({
      type: leaveType,
      date: leaveDate,
      hours: Math.max(1, leaveHours),
      reason: leaveReason.trim(),
      isPaid: true,
    });
    setLeaveReason('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Shift Scheduling & Rest Days */}
        <form
          onSubmit={handleSaveSchedule}
          className="lg:col-span-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-sky-500" />
                Scheduling &amp; Rest Day Rules
              </h2>
              <p className="text-xs text-slate-500">
                Drives late detection, undertime, night diff, and rest-day premium pay.
              </p>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-1.5">
            {[
              ['Morning (8AM–5PM)', '08:00', '17:00'],
              ['Standard (9AM–6PM)', '09:00', '18:00'],
              ['Mid (2PM–11PM)', '14:00', '23:00'],
              ['Night (10PM–7AM)', '22:00', '07:00'],
            ].map(([label, s, e]) => (
              <button
                key={label}
                type="button"
                onClick={() => applyPreset(s, e)}
                className={`rounded-xl px-2.5 py-1 text-[11px] font-semibold transition ${
                  shiftStart === s && shiftEnd === e
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Shift Start
              </label>
              <input
                type="time"
                value={shiftStart}
                onChange={(e) => setShiftStart(e.target.value)}
                className="w-full rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Shift End
              </label>
              <input
                type="time"
                value={shiftEnd}
                onChange={(e) => setShiftEnd(e.target.value)}
                className="w-full rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Break (mins)
              </label>
              <input
                type="number"
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(Number(e.target.value) || 0)}
                min={0}
                max={120}
                className="w-full rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Grace (mins)
              </label>
              <input
                type="number"
                value={graceMinutes}
                onChange={(e) => setGraceMinutes(Number(e.target.value) || 0)}
                min={0}
                max={60}
                className="w-full rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                Designated Rest Days
              </label>
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAYS.map((w) => (
                  <button
                    key={w.idx}
                    type="button"
                    onClick={() => toggleRestDay(w.idx)}
                    className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
                      restDays.includes(w.idx)
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-950 text-slate-500'
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                Monthly Rate Factor
              </label>
              <select
                value={workingDays}
                onChange={(e) => setWorkingDays(Number(e.target.value))}
                className="w-full rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white"
              >
                <option value={22}>22 Days / Month (Mon–Fri)</option>
                <option value={26}>26 Days / Month (6-Day Week)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs py-2.5 transition"
          >
            Save Schedule Configuration
          </button>
        </form>

        {/* Right: De Minimis Non-Taxable Benefits */}
        <form
          onSubmit={handleSaveDeMinimis}
          className="lg:col-span-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 space-y-4 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Gift className="h-4 w-4 text-emerald-500" />
                De Minimis &amp; Benefit Items (BIR Caps)
              </h2>
              <p className="text-xs text-slate-500">
                Tax-exempt within BIR ceilings; any excess flows automatically into the ₱90k threshold.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Rice Subsidy / mo (Cap: ₱2,000)
                </label>
                <input
                  type="number"
                  value={deMinimis.riceSubsidy}
                  onChange={(e) =>
                    setDeMinimis({ ...deMinimis, riceSubsidy: Number(e.target.value) || 0 })
                  }
                  className="w-full rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Uniform / mo (Cap: ₱500)
                </label>
                <input
                  type="number"
                  value={deMinimis.uniformAllowance}
                  onChange={(e) =>
                    setDeMinimis({
                      ...deMinimis,
                      uniformAllowance: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Laundry / mo (Cap: ₱300)
                </label>
                <input
                  type="number"
                  value={deMinimis.laundryAllowance}
                  onChange={(e) =>
                    setDeMinimis({
                      ...deMinimis,
                      laundryAllowance: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Medical Cash / mo (Cap: ₱833)
                </label>
                <input
                  type="number"
                  value={deMinimis.medicalCash}
                  onChange={(e) =>
                    setDeMinimis({
                      ...deMinimis,
                      medicalCash: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="rounded-2xl bg-slate-100/80 dark:bg-slate-950/70 p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span>
                Non-Taxable Monthly:{' '}
                <b className="font-mono text-emerald-600 dark:text-emerald-400">
                  {formatPhp(deMinimisEval.nonTaxableMonthly)}
                </b>
              </span>
              <span>
                Excess (Counts to ₱90k):{' '}
                <b className="font-mono text-amber-600 dark:text-amber-400">
                  {formatPhp(deMinimisEval.taxableExcessMonthly)}
                </b>
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 transition"
          >
            Update De Minimis Package
          </button>
        </form>
      </div>

      {/* Leave & CTO Credits Section */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-sky-500" />
              Leave &amp; CTO (Compensatory Time-Off) Ledger
            </h2>
            <p className="text-xs text-slate-500">
              File Vacation Leave, Sick Leave, or redeem CTO hours earned from overtime work.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-xl bg-emerald-500/15 px-3 py-1.5 font-bold text-emerald-700 dark:text-emerald-400">
              VL: {activeEmployee.leaveBalances.vlDays} days
            </span>
            <span className="rounded-xl bg-amber-500/15 px-3 py-1.5 font-bold text-amber-700 dark:text-amber-400">
              SL: {activeEmployee.leaveBalances.slDays} days
            </span>
            <span className="rounded-xl bg-sky-500/15 px-3 py-1.5 font-bold text-sky-700 dark:text-sky-400">
              CTO Bank: {activeEmployee.leaveBalances.ctoHours} hrs (
              {(activeEmployee.leaveBalances.ctoHours / 8).toFixed(2)} days)
            </span>
          </div>
        </div>

        {/* File Leave / Redeem CTO Form */}
        <form
          onSubmit={handleFileLeave}
          className="rounded-2xl bg-slate-100/80 dark:bg-slate-950/70 p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
        >
          <div className="sm:col-span-3">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Leave / Offset Type
            </label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as LeaveType)}
              className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white"
            >
              <option value="CTO">Redeem CTO Credits</option>
              <option value="VL">Vacation Leave (VL)</option>
              <option value="SL">Sick Leave (SL)</option>
              <option value="SIL">Service Incentive Leave (SIL)</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Date
            </label>
            <input
              type="date"
              value={leaveDate}
              onChange={(e) => setLeaveDate(e.target.value)}
              className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Hours (8 = 1d)
            </label>
            <input
              type="number"
              value={leaveHours}
              onChange={(e) => setLeaveHours(Number(e.target.value) || 4)}
              min={1}
              max={40}
              className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Reason
            </label>
            <input
              type="text"
              placeholder="e.g. Personal time off"
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              required
              className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs py-2.5 px-3 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{role === 'payroll_admin' ? 'Log & Approve' : 'Submit'}</span>
            </button>
          </div>
        </form>

        {/* Leave Requests List */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
          {empLeaves.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">
              No leave or CTO requests filed yet for {activeEmployee.name}.
            </p>
          ) : (
            empLeaves.map((lv) => (
              <div
                key={lv.id}
                className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-sky-500/15 px-2.5 py-1 font-bold text-sky-700 dark:text-sky-400">
                    {lv.type}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {lv.date} · {lv.hours} hrs ({(lv.hours / 8).toFixed(2)} day)
                    </p>
                    <p className="text-slate-500">{lv.reason}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {lv.status === 'approved' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      Approved (Paid)
                    </span>
                  ) : (
                    <>
                      <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-400">
                        Pending
                      </span>
                      {role === 'payroll_admin' && (
                        <button
                          onClick={() => approveLeaveRequest(lv.id)}
                          className="rounded-lg bg-emerald-600 text-white px-2.5 py-1 text-[11px] font-bold hover:bg-emerald-500"
                        >
                          Approve
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

