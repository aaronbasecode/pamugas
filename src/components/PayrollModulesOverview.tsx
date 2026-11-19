'use client';

import React, { useMemo } from 'react';
import { usePamugas } from '@/lib/store';
import {
  calculateAnnualBenefits,
  evaluateDeMinimis,
  formatPhp,
  interpretPayroll,
} from '@/lib/phPayroll';
import { NavTab } from '@/types';
import { ArrowRight } from 'lucide-react';

export default function PayrollModulesOverview() {
  const {
    activeEmployee,
    dtrEntries,
    leaveRequests,
    closedPayRuns,
    setActiveTab,
  } = usePamugas();

  const empDtr = useMemo(
    () => dtrEntries.filter((d) => d.employeeId === activeEmployee.id),
    [dtrEntries, activeEmployee.id]
  );

  const empLeaves = useMemo(
    () => leaveRequests.filter((l) => l.employeeId === activeEmployee.id),
    [leaveRequests, activeEmployee.id]
  );

  const payrollPreview = useMemo(
    () =>
      interpretPayroll({
        employee: activeEmployee,
        frequency: 'semi_monthly',
        dtrEntries: empDtr,
        approvedLeaves: empLeaves,
      }),
    [activeEmployee, empDtr, empLeaves]
  );

  const deMinimisEval = useMemo(
    () => evaluateDeMinimis(activeEmployee.deMinimis),
    [activeEmployee.deMinimis]
  );

  const annual = useMemo(
    () =>
      calculateAnnualBenefits({
        totalBasicSalaryEarnedYtd: activeEmployee.ytdBasicEarned,
        otherBonusesYtd: activeEmployee.ytdBonusesReceived,
        excessDeMinimisAnnual: deMinimisEval.taxableExcessMonthly * 12,
      }),
    [activeEmployee, deMinimisEval]
  );

  const empRunsCount = closedPayRuns.filter(
    (r) => r.employeeId === activeEmployee.id
  ).length;

  const modules: {
    title: string;
    desc: string;
    metric: string;
    tab: NavTab;
  }[] = [
    {
      title: 'Timekeeping',
      desc: 'Capture clock-ins, breaks, tardiness, and OT — fed directly into pay computation.',
      metric: `${empDtr.length} DTR entries · ${payrollPreview.totalLateMinutes}m late · ${payrollPreview.totalPaidOtHours}h OT`,
      tab: 'dtr',
    },
    {
      title: 'Scheduling',
      desc: 'Define shift patterns and rest days that drive accurate payroll calculations.',
      metric: `Shift ${activeEmployee.shiftStart}–${activeEmployee.shiftEnd} (${activeEmployee.graceMinutes}m grace)`,
      tab: 'schedule',
    },
    {
      title: 'Leave & Benefits',
      desc: 'Reflect approved leave, de minimis, and benefit items in every pay run.',
      metric: `VL ${activeEmployee.leaveBalances.vlDays}d · SL ${activeEmployee.leaveBalances.slDays}d · ${formatPhp(deMinimisEval.nonTaxableMonthly)}/mo De Minimis`,
      tab: 'schedule',
    },
    {
      title: 'CTO Credits',
      desc: 'Convert eligible extra hours into CTO leave credits automatically.',
      metric: `${activeEmployee.leaveBalances.ctoHours}h CTO balance available`,
      tab: 'schedule',
    },
    {
      title: 'Pay Interpretation',
      desc: 'Translate attendance, premiums, and statutory deductions into pay line items.',
      metric: `Est. Semi-Monthly Net: ${formatPhp(payrollPreview.netPay)}`,
      tab: 'payroll',
    },
    {
      title: '13th Month Pay',
      desc: 'Compute full and pro-rated 13th month pay from closed payroll records.',
      metric: `${formatPhp(annual.thirteenthMonthPay)} accrued (${empRunsCount} closed runs)`,
      tab: 'annual',
    },
    {
      title: '₱90k Non-Taxable Cap',
      desc: 'Track and apply non-taxable compensation against the ₱90,000 annual threshold.',
      metric: `${formatPhp(annual.nonTaxableAmount)} / ₱90,000 (${annual.usagePct}% used)`,
      tab: 'annual',
    },
    {
      title: 'Termination & Final Pay',
      desc: 'Compute and organize final pay items when an employee’s contract ends.',
      metric: 'Separation pay, leave cashout & pro-rated 13th month',
      tab: 'termination',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Quick Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Est. Cutoff Net Pay
          </p>
          <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {formatPhp(payrollPreview.netPay)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            After SSS, PhilHealth, Pag-IBIG &amp; Tax
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            PH Statutory (Semi-Mo)
          </p>
          <p className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
            -{formatPhp(payrollPreview.totalDeductions)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Tax: {formatPhp(payrollPreview.statutory.withholdingTax.tax)} (
            {payrollPreview.statutory.withholdingTax.ratePct}%)
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            13th Month Accrued
          </p>
          <p className="text-2xl font-bold font-mono text-sky-600 dark:text-sky-400 mt-1">
            {formatPhp(annual.thirteenthMonthPay)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            YTD Basic: {formatPhp(activeEmployee.ytdBasicEarned)}
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            ₱90k Non-Taxable Room
          </p>
          <p className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
            {formatPhp(annual.remainingCeiling)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {annual.usagePct}% of ₱90,000 BIR threshold used
          </p>
        </div>
      </div>

      {/* Payroll Modules */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-7">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Payroll Modules
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Select a module to open
          </span>
        </div>

        <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
          {modules.map((mod) => (
            <button
              key={mod.title}
              onClick={() => setActiveTab(mod.tab)}
              className="w-full py-4 px-2 sm:px-3 -mx-2 sm:-mx-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-6 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition group"
            >
              <div className="sm:w-52 shrink-0">
                <span className="text-sm sm:text-base font-bold text-sky-800 dark:text-sky-400 group-hover:underline">
                  {mod.title}
                </span>
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {mod.desc}
                </p>
                <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  {mod.metric}
                </p>
              </div>

              <div className="shrink-0 hidden sm:flex items-center text-slate-400 group-hover:text-sky-500 transition">
                <ArrowRight className="h-4 w-4" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

