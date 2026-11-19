'use client';

import React, { useMemo, useState } from 'react';
import { usePamugas } from '@/lib/store';
import { PayFrequency } from '@/types';
import { formatPhp, interpretPayroll } from '@/lib/phPayroll';
import {
  Calculator,
  FileText,
  CheckCircle2,
  Printer,
  X,
  Sliders,
} from 'lucide-react';

export default function PayrollCalculator() {
  const {
    activeEmployee,
    dtrEntries,
    leaveRequests,
    closedPayRuns,
    postPayrollRun,
    updateEmployeeSchedule,
  } = usePamugas();

  const [frequency, setFrequency] = useState<PayFrequency>('semi_monthly');
  const [sourceMode, setSourceMode] = useState<'dtr' | 'custom'>('dtr');
  const [periodLabel, setPeriodLabel] = useState('Nov 1–15, 2026');

  // Custom / Sandbox inputs
  const [customBasic, setCustomBasic] = useState<number>(activeEmployee.monthlyBasic);
  const [regOtHours, setRegOtHours] = useState<number>(4);
  const [restDayHours, setRestDayHours] = useState<number>(0);
  const [specHolHours, setSpecHolHours] = useState<number>(0);
  const [regHolHours, setRegHolHours] = useState<number>(0);
  const [nightDiffHours, setNightDiffHours] = useState<number>(2);
  const [lateMinutes, setLateMinutes] = useState<number>(15);
  const [taxableBonus, setTaxableBonus] = useState<number>(0);
  const [otherDeductions, setOtherDeductions] = useState<number>(0);

  const [showPayslipModal, setShowPayslipModal] = useState(false);

  const empDtr = useMemo(
    () => dtrEntries.filter((d) => d.employeeId === activeEmployee.id),
    [dtrEntries, activeEmployee.id]
  );

  const empLeaves = useMemo(
    () => leaveRequests.filter((l) => l.employeeId === activeEmployee.id),
    [leaveRequests, activeEmployee.id]
  );

  const effectiveEmployee = useMemo(
    () =>
      sourceMode === 'custom'
        ? { ...activeEmployee, monthlyBasic: Math.max(0, customBasic) }
        : activeEmployee,
    [activeEmployee, sourceMode, customBasic]
  );

  const result = useMemo(
    () =>
      interpretPayroll({
        employee: effectiveEmployee,
        frequency,
        dtrEntries: empDtr,
        approvedLeaves: empLeaves,
        manualOverride:
          sourceMode === 'custom'
            ? {
                regularOtHours: regOtHours,
                restDayHours,
                specialHolidayHours: specHolHours,
                regularHolidayHours: regHolHours,
                nightDiffHours,
                lateMinutes,
                undertimeMinutes: 0,
              }
            : undefined,
        taxableBonus,
        otherDeductions,
      }),
    [
      effectiveEmployee,
      frequency,
      empDtr,
      empLeaves,
      sourceMode,
      regOtHours,
      restDayHours,
      specHolHours,
      regHolHours,
      nightDiffHours,
      lateMinutes,
      taxableBonus,
      otherDeductions,
    ]
  );

  const empClosedRuns = useMemo(
    () => closedPayRuns.filter((r) => r.employeeId === activeEmployee.id),
    [closedPayRuns, activeEmployee.id]
  );

  const handlePostPayRun = () => {
    postPayrollRun({
      employeeId: activeEmployee.id,
      periodLabel: periodLabel.trim() || 'Cutoff Pay Run',
      frequency,
      basicPayEarned: result.basicPay,
      grossPay: result.grossPay,
      totalDeductions: result.totalDeductions,
      netPay: result.netPay,
      sssEE: result.statutory.sss.totalEE,
      philhealthEE: result.statutory.philhealth.totalEE,
      pagibigEE: result.statutory.pagibig.totalEE,
      withholdingTax: result.statutory.withholdingTax.tax,
      taxableBonusIncluded: result.taxableBonus,
    });
  };

  const handleApplyBasicToEmployee = () => {
    if (customBasic > 0) {
      updateEmployeeSchedule(activeEmployee.id, { monthlyBasic: customBasic });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Control Strip */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-950 p-1 text-xs">
            <button
              onClick={() => setSourceMode('dtr')}
              className={`rounded-lg px-3 py-1.5 font-bold transition ${
                sourceMode === 'dtr'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Sync Live DTR ({empDtr.length} logs)
            </button>
            <button
              onClick={() => setSourceMode('custom')}
              className={`rounded-lg px-3 py-1.5 font-bold transition inline-flex items-center gap-1 ${
                sourceMode === 'custom'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              Interactive Calculator
            </button>
          </div>

          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-950 p-1 text-xs">
            <button
              onClick={() => setFrequency('semi_monthly')}
              className={`rounded-lg px-3 py-1.5 font-bold transition ${
                frequency === 'semi_monthly'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Semi-Monthly (15th/30th)
            </button>
            <button
              onClick={() => setFrequency('monthly')}
              className={`rounded-lg px-3 py-1.5 font-bold transition ${
                frequency === 'monthly'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={periodLabel}
            onChange={(e) => setPeriodLabel(e.target.value)}
            placeholder="Cutoff label"
            className="w-36 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white"
          />

          <button
            onClick={() => setShowPayslipModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-white transition"
          >
            <FileText className="h-3.5 w-3.5" />
            Payslip
          </button>

          <button
            onClick={handlePostPayRun}
            className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 px-4 py-2 text-xs font-bold text-white transition"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Post &amp; Close Pay Run
          </button>
        </div>
      </div>

      {/* Main Split: Inputs / Statutory Cards + Pay Interpretation Statement */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Interactive Inputs + PH Statutory Breakdown Cards */}
        <div className="lg:col-span-6 space-y-5">
          {sourceMode === 'custom' && (
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-sky-500" />
                  Custom Salary &amp; Attendance Simulator
                </h3>
                {customBasic !== activeEmployee.monthlyBasic && (
                  <button
                    onClick={handleApplyBasicToEmployee}
                    className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    Save salary to {activeEmployee.name}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Monthly Basic (₱)
                  </label>
                  <input
                    type="number"
                    value={customBasic}
                    onChange={(e) => setCustomBasic(Number(e.target.value) || 0)}
                    min={0}
                    step={500}
                    className="w-full rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Regular OT (hrs)
                  </label>
                  <input
                    type="number"
                    value={regOtHours}
                    onChange={(e) => setRegOtHours(Math.max(0, Number(e.target.value) || 0))}
                    step={0.5}
                    className="w-full rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Rest Day (hrs)
                  </label>
                  <input
                    type="number"
                    value={restDayHours}
                    onChange={(e) => setRestDayHours(Math.max(0, Number(e.target.value) || 0))}
                    step={1}
                    className="w-full rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Spec Holiday (hrs)
                  </label>
                  <input
                    type="number"
                    value={specHolHours}
                    onChange={(e) => setSpecHolHours(Math.max(0, Number(e.target.value) || 0))}
                    step={1}
                    className="w-full rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Reg Holiday (hrs)
                  </label>
                  <input
                    type="number"
                    value={regHolHours}
                    onChange={(e) => setRegHolHours(Math.max(0, Number(e.target.value) || 0))}
                    step={1}
                    className="w-full rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Night Diff (hrs)
                  </label>
                  <input
                    type="number"
                    value={nightDiffHours}
                    onChange={(e) => setNightDiffHours(Math.max(0, Number(e.target.value) || 0))}
                    step={0.5}
                    className="w-full rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Late / UT (mins)
                  </label>
                  <input
                    type="number"
                    value={lateMinutes}
                    onChange={(e) => setLateMinutes(Math.max(0, Number(e.target.value) || 0))}
                    step={5}
                    className="w-full rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Optional Bonus & Loan Adjustment */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Additional Adjustments (Cutoff)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Taxable Bonus / Commission (₱)
                </label>
                <input
                  type="number"
                  value={taxableBonus}
                  onChange={(e) => setTaxableBonus(Math.max(0, Number(e.target.value) || 0))}
                  step={500}
                  className="w-full rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  SSS / Pag-IBIG Loan / Other Ded. (₱)
                </label>
                <input
                  type="number"
                  value={otherDeductions}
                  onChange={(e) =>
                    setOtherDeductions(Math.max(0, Number(e.target.value) || 0))
                  }
                  step={100}
                  className="w-full rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* 4 Standard PH Statutory Deductions Breakdown */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Philippine Statutory Deductions Breakdown
              </h3>
              <p className="text-[11px] text-slate-500">
                Updated 2025/2026 SSS (15%), PhilHealth (5%), Pag-IBIG (₱10k cap), &amp; BIR TRAIN Law
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* SSS */}
              <div className="rounded-2xl bg-slate-100/80 dark:bg-slate-950/70 p-3.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sky-700 dark:text-sky-400">SSS Contribution</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {formatPhp(result.statutory.sss.totalEE)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  MSC: {formatPhp(result.statutory.sss.msc)} · Reg:{' '}
                  {formatPhp(result.statutory.sss.regularEE)} + WISP:{' '}
                  {formatPhp(result.statutory.sss.wispEE)}
                </p>
                <p className="text-[10px] text-slate-400">
                  Employer Share (ER): {formatPhp(result.statutory.sss.totalER)}
                </p>
              </div>

              {/* PhilHealth */}
              <div className="rounded-2xl bg-slate-100/80 dark:bg-slate-950/70 p-3.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    PhilHealth (2.5% EE)
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {formatPhp(result.statutory.philhealth.totalEE)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Base: {formatPhp(result.statutory.philhealth.baseSalary)} (₱10k–₱100k cap)
                </p>
                <p className="text-[10px] text-slate-400">
                  Employer Share (ER): {formatPhp(result.statutory.philhealth.totalER)}
                </p>
              </div>

              {/* Pag-IBIG */}
              <div className="rounded-2xl bg-slate-100/80 dark:bg-slate-950/70 p-3.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-700 dark:text-amber-400">
                    Pag-IBIG / HDMF
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {formatPhp(result.statutory.pagibig.totalEE)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  2% of min(Basic, ₱10,000) = ₱200/mo max
                </p>
                <p className="text-[10px] text-slate-400">
                  Employer Share (ER): {formatPhp(result.statutory.pagibig.totalER)}
                </p>
              </div>

              {/* Withholding Tax */}
              <div className="rounded-2xl bg-slate-100/80 dark:bg-slate-950/70 p-3.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-700 dark:text-rose-400">
                    Withholding Tax (BIR)
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {formatPhp(result.statutory.withholdingTax.tax)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {result.statutory.withholdingTax.bracketLabel}
                </p>
                <p className="text-[10px] text-slate-400">
                  Taxable Income:{' '}
                  {formatPhp(result.statutory.withholdingTax.taxableIncome)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Pay Interpretation Statement */}
        <div className="lg:col-span-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 flex flex-col justify-between gap-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                  Pay Interpretation Line Items
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {effectiveEmployee.name} — {periodLabel}
                </h2>
                <p className="text-[11px] text-slate-500 font-mono">
                  Daily Rate: {formatPhp(result.dailyRate)} · Hourly Rate:{' '}
                  {formatPhp(result.hourlyRate)}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-semibold text-slate-500 block">
                  NET TAKE-HOME PAY
                </span>
                <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {formatPhp(result.netPay)}
                </span>
              </div>
            </div>

            {/* Earnings Line Items */}
            <div className="space-y-2 text-xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Earnings &amp; Premiums
              </p>
              <div className="flex justify-between py-1">
                <span className="text-slate-600 dark:text-slate-300">
                  Basic Salary ({frequency === 'semi_monthly' ? 'Semi-Monthly' : 'Monthly'})
                </span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {formatPhp(result.basicPay)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-600 dark:text-slate-300">
                  Overtime Pay ({result.totalPaidOtHours}h paid OT)
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                  +{formatPhp(result.overtimePay)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-600 dark:text-slate-300">
                  Rest Day / Holiday Premiums
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                  +{formatPhp(result.holidayRestPay)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-600 dark:text-slate-300">
                  Night Shift Differential (+10%, {result.totalNightDiffHours}h)
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                  +{formatPhp(result.nightDiffPay)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-600 dark:text-slate-300">
                  De Minimis Allowances (Tax-Exempt BIR)
                </span>
                <span className="font-mono text-sky-600 dark:text-sky-400">
                  +{formatPhp(result.deMinimisNonTaxable)}
                </span>
              </div>
              {(result.deMinimisTaxableExcess > 0 || result.taxableBonus > 0) && (
                <div className="flex justify-between py-1">
                  <span className="text-slate-600 dark:text-slate-300">
                    Taxable Bonus &amp; De Minimis Excess
                  </span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                    +{formatPhp(result.taxableBonus + result.deMinimisTaxableExcess)}
                  </span>
                </div>
              )}
              {(result.tardinessDeduction > 0 || result.undertimeDeduction > 0) && (
                <div className="flex justify-between py-1">
                  <span className="text-rose-600 dark:text-rose-400">
                    Less: Tardiness / Undertime ({result.totalLateMinutes}m L,{' '}
                    {result.totalUndertimeMinutes}m UT)
                  </span>
                  <span className="font-mono text-rose-600 dark:text-rose-400">
                    -
                    {formatPhp(result.tardinessDeduction + result.undertimeDeduction)}
                  </span>
                </div>
              )}

              <div className="flex justify-between py-2 border-t border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white">
                <span>Gross Pay</span>
                <span className="font-mono">{formatPhp(result.grossPay)}</span>
              </div>
            </div>

            {/* Deductions Line Items */}
            <div className="space-y-2 text-xs pt-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Statutory &amp; Other Deductions
              </p>
              <div className="flex justify-between py-1">
                <span className="text-slate-600 dark:text-slate-300">
                  SSS Employee Share (incl. WISP)
                </span>
                <span className="font-mono text-rose-600 dark:text-rose-400">
                  -{formatPhp(result.statutory.sss.totalEE)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-600 dark:text-slate-300">
                  PhilHealth Contribution (2.5%)
                </span>
                <span className="font-mono text-rose-600 dark:text-rose-400">
                  -{formatPhp(result.statutory.philhealth.totalEE)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-600 dark:text-slate-300">
                  Pag-IBIG Fund (HDMF)
                </span>
                <span className="font-mono text-rose-600 dark:text-rose-400">
                  -{formatPhp(result.statutory.pagibig.totalEE)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-600 dark:text-slate-300">
                  BIR Withholding Tax ({result.statutory.withholdingTax.ratePct}%)
                </span>
                <span className="font-mono text-rose-600 dark:text-rose-400">
                  -{formatPhp(result.statutory.withholdingTax.tax)}
                </span>
              </div>
              {result.otherDeductions > 0 && (
                <div className="flex justify-between py-1">
                  <span className="text-slate-600 dark:text-slate-300">
                    Loans / Other Deductions
                  </span>
                  <span className="font-mono text-rose-600 dark:text-rose-400">
                    -{formatPhp(result.otherDeductions)}
                  </span>
                </div>
              )}

              <div className="flex justify-between py-2 border-t border-slate-200 dark:border-slate-800 font-bold text-rose-600 dark:text-rose-400">
                <span>Total Deductions</span>
                <span className="font-mono">-{formatPhp(result.totalDeductions)}</span>
              </div>
            </div>
          </div>

          {/* Note on Paid Leaves / CTO */}
          {(result.paidLeavePay > 0 || result.totalCtoCreditedHours > 0) && (
            <div className="rounded-2xl bg-sky-500/10 px-4 py-3 text-xs text-sky-800 dark:text-sky-300 flex flex-wrap justify-between gap-2">
              <span>
                Approved Paid Leave Value Covered: <b>{formatPhp(result.paidLeavePay)}</b>
              </span>
              {result.totalCtoCreditedHours > 0 && (
                <span>
                  OT Banked as CTO: <b>+{result.totalCtoCreditedHours}h</b>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Closed Pay Runs History */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 space-y-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Closed Payroll Records ({activeEmployee.name})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="py-2.5 pr-3">Period</th>
                <th className="py-2.5 px-3">Basic Earned</th>
                <th className="py-2.5 px-3">Gross Pay</th>
                <th className="py-2.5 px-3">SSS / PHIC / HDMF</th>
                <th className="py-2.5 px-3">W-Tax</th>
                <th className="py-2.5 pl-3 text-right">Net Pay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
              {empClosedRuns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500">
                    No closed pay runs yet. Click &ldquo;Post &amp; Close Pay Run&rdquo; above.
                  </td>
                </tr>
              ) : (
                empClosedRuns.map((run) => (
                  <tr key={run.id}>
                    <td className="py-2.5 pr-3 font-semibold text-slate-900 dark:text-white">
                      {run.periodLabel}
                    </td>
                    <td className="py-2.5 px-3 font-mono">{formatPhp(run.basicPayEarned)}</td>
                    <td className="py-2.5 px-3 font-mono">{formatPhp(run.grossPay)}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">
                      {formatPhp(run.sssEE)} / {formatPhp(run.philhealthEE)} /{' '}
                      {formatPhp(run.pagibigEE)}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-rose-500">
                      -{formatPhp(run.withholdingTax)}
                    </td>
                    <td className="py-2.5 pl-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatPhp(run.netPay)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Philippine Payslip Modal */}
      {showPayslipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-xl rounded-3xl bg-white text-slate-900 p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-sky-700">
                  Pamugas PH Payroll System
                </p>
                <h3 className="text-xl font-bold">Official Employee Payslip</h3>
                <p className="text-xs text-slate-500">Pay Period: {periodLabel}</p>
              </div>
              <button
                onClick={() => setShowPayslipModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3.5 rounded-xl">
              <div>
                <span className="text-slate-500">Employee:</span>{' '}
                <b>{effectiveEmployee.name}</b>
              </div>
              <div>
                <span className="text-slate-500">Emp No:</span>{' '}
                <b className="font-mono">{effectiveEmployee.employeeNo}</b>
              </div>
              <div>
                <span className="text-slate-500">TIN:</span>{' '}
                <span className="font-mono">{effectiveEmployee.tinNo}</span>
              </div>
              <div>
                <span className="text-slate-500">SSS:</span>{' '}
                <span className="font-mono">{effectiveEmployee.sssNo}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 text-xs">
              <div className="space-y-1.5">
                <p className="font-bold uppercase text-slate-500 border-b pb-1">
                  Earnings
                </p>
                <div className="flex justify-between">
                  <span>Basic Pay</span>
                  <span className="font-mono">{formatPhp(result.basicPay)}</span>
                </div>
                <div className="flex justify-between">
                  <span>OT &amp; Premiums</span>
                  <span className="font-mono">
                    {formatPhp(result.overtimePay + result.holidayRestPay)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Night Diff</span>
                  <span className="font-mono">{formatPhp(result.nightDiffPay)}</span>
                </div>
                <div className="flex justify-between">
                  <span>De Minimis</span>
                  <span className="font-mono">{formatPhp(result.deMinimisNonTaxable)}</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-1.5">
                  <span>Gross Pay</span>
                  <span className="font-mono">{formatPhp(result.grossPay)}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="font-bold uppercase text-slate-500 border-b pb-1">
                  Deductions
                </p>
                <div className="flex justify-between">
                  <span>SSS EE</span>
                  <span className="font-mono">{formatPhp(result.statutory.sss.totalEE)}</span>
                </div>
                <div className="flex justify-between">
                  <span>PhilHealth EE</span>
                  <span className="font-mono">
                    {formatPhp(result.statutory.philhealth.totalEE)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Pag-IBIG EE</span>
                  <span className="font-mono">
                    {formatPhp(result.statutory.pagibig.totalEE)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Withholding Tax</span>
                  <span className="font-mono">
                    {formatPhp(result.statutory.withholdingTax.tax)}
                  </span>
                </div>
                <div className="flex justify-between font-bold border-t pt-1.5 text-rose-700">
                  <span>Total Deductions</span>
                  <span className="font-mono">{formatPhp(result.totalDeductions)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center justify-between">
              <span className="text-sm font-bold text-emerald-900">NET TAKE-HOME PAY</span>
              <span className="text-2xl font-bold font-mono text-emerald-700">
                {formatPhp(result.netPay)}
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-sky-700 text-white px-4 py-2 text-xs font-bold hover:bg-sky-600"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Payslip
              </button>
              <button
                onClick={() => setShowPayslipModal(false)}
                className="rounded-xl bg-slate-200 text-slate-800 px-4 py-2 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

