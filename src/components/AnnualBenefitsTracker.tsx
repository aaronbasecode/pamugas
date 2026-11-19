'use client';

import React, { useMemo, useState } from 'react';
import { usePamugas } from '@/lib/store';
import {
  calculateAnnualBenefits,
  evaluateDeMinimis,
  formatPhp,
} from '@/lib/phPayroll';
import { Award, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function AnnualBenefitsTracker() {
  const { activeEmployee, closedPayRuns, updateYtdBonuses } = usePamugas();

  const [monthsServed, setMonthsServed] = useState(12);
  const [projectedBonus, setProjectedBonus] = useState(
    activeEmployee.ytdBonusesReceived
  );

  const deMinimisEval = useMemo(
    () => evaluateDeMinimis(activeEmployee.deMinimis),
    [activeEmployee.deMinimis]
  );

  const empClosedRuns = useMemo(
    () => closedPayRuns.filter((r) => r.employeeId === activeEmployee.id),
    [closedPayRuns, activeEmployee.id]
  );

  // Actual YTD closed records calculation
  const actualAnnual = useMemo(
    () =>
      calculateAnnualBenefits({
        totalBasicSalaryEarnedYtd: activeEmployee.ytdBasicEarned,
        otherBonusesYtd: activeEmployee.ytdBonusesReceived,
        excessDeMinimisAnnual: deMinimisEval.taxableExcessMonthly * 12,
      }),
    [activeEmployee, deMinimisEval]
  );

  // Full / Pro-Rated Simulation based on Months Served
  const simulatedBasicEarned = activeEmployee.monthlyBasic * monthsServed;
  const simulatedAnnual = useMemo(
    () =>
      calculateAnnualBenefits({
        totalBasicSalaryEarnedYtd: simulatedBasicEarned,
        otherBonusesYtd: projectedBonus,
        excessDeMinimisAnnual: deMinimisEval.taxableExcessMonthly * monthsServed,
      }),
    [simulatedBasicEarned, projectedBonus, deMinimisEval, monthsServed]
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Split: Actual YTD from Closed Pay Runs + Non-Taxable P90,000 Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 13th Month Pay (PD 851) */}
        <div className="lg:col-span-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/15 px-3 py-1 text-[11px] font-bold text-sky-700 dark:text-sky-400">
                <Award className="h-3.5 w-3.5" />
                Presidential Decree No. 851
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-2">
                13th Month Pay (Closed Payroll Records)
              </h2>
              <p className="text-xs text-slate-500">
                Formula: Total Basic Salary Earned within Calendar Year ÷ 12
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-100/80 dark:bg-slate-950/70 p-4 space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Closed YTD Basic Earned</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {formatPhp(activeEmployee.ytdBasicEarned)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Closed Payroll Cutoffs Recorded</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                {empClosedRuns.length} recent runs posted
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="font-bold text-slate-900 dark:text-white">
                Accrued 13th Month Pay
              </span>
              <span className="text-xl font-bold font-mono text-sky-600 dark:text-sky-400">
                {formatPhp(actualAnnual.thirteenthMonthPay)}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500">
            Note: Overtime pay, night shift differential, holiday premiums, and non-taxable de
            minimis allowances are excluded from 13th month basic computation under DOLE rules.
          </div>
        </div>

        {/* BIR Non-Taxable P90,000 Annual Cap Tracker */}
        <div className="lg:col-span-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                TRAIN Law (RA 10963)
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-2">
                Non-Taxable ₱90,000 Annual Threshold
              </h2>
              <p className="text-xs text-slate-500">
                13th Month Pay + Other Bonuses + De Minimis Excess exempt up to ₱90,000/yr.
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-600 dark:text-slate-300">
                Used: {formatPhp(actualAnnual.totalBenefitsToward90k)}
              </span>
              <span className="font-mono text-slate-500">Cap: ₱90,000.00</span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  actualAnnual.taxableExcess > 0 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${actualAnnual.usagePct}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-2xl bg-emerald-500/10 p-3">
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold block">
                Tax-Exempt Applied
              </span>
              <span className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-300">
                {formatPhp(actualAnnual.nonTaxableAmount)}
              </span>
            </div>

            <div
              className={`rounded-2xl p-3 ${
                actualAnnual.taxableExcess > 0
                  ? 'bg-amber-500/15'
                  : 'bg-slate-100/80 dark:bg-slate-950/70'
              }`}
            >
              <span className="text-[11px] text-slate-500 font-semibold block">
                {actualAnnual.taxableExcess > 0 ? 'Taxable Excess (>₱90k)' : 'Remaining Room'}
              </span>
              <span
                className={`text-lg font-bold font-mono ${
                  actualAnnual.taxableExcess > 0
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-slate-900 dark:text-white'
                }`}
              >
                {actualAnnual.taxableExcess > 0
                  ? formatPhp(actualAnnual.taxableExcess)
                  : formatPhp(actualAnnual.remainingCeiling)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pro-Rated & Full-Year Simulator */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Full &amp; Pro-Rated Year-End Benefit Simulator
            </h3>
            <p className="text-xs text-slate-500">
              Adjust months worked &amp; other bonuses to forecast year-end 13th Month + taxable excess.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-slate-100/80 dark:bg-slate-950/70 p-4 space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span>Months Worked in Year</span>
              <span className="font-mono text-sky-600 dark:text-sky-400">
                {monthsServed} {monthsServed === 1 ? 'month' : 'months'}{' '}
                {monthsServed === 12 ? '(Full Year)' : '(Pro-Rated)'}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={12}
              value={monthsServed}
              onChange={(e) => setMonthsServed(Number(e.target.value))}
              className="w-full accent-sky-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">
              Simulated Basic Earned: {formatPhp(simulatedBasicEarned)}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-100/80 dark:bg-slate-950/70 p-4 space-y-2">
            <label className="block text-xs font-semibold">
              Other Annual Bonuses / Incentives (₱)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={projectedBonus}
                onChange={(e) => setProjectedBonus(Math.max(0, Number(e.target.value) || 0))}
                step={1000}
                className="flex-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => updateYtdBonuses(activeEmployee.id, projectedBonus)}
                className="rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-3.5 transition"
              >
                Save YTD Bonus
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="rounded-2xl bg-slate-100/80 dark:bg-slate-950/70 p-4">
            <span className="text-slate-500 block">Projected 13th Month</span>
            <span className="text-xl font-bold font-mono text-sky-600 dark:text-sky-400">
              {formatPhp(simulatedAnnual.thirteenthMonthPay)}
            </span>
          </div>
          <div className="rounded-2xl bg-slate-100/80 dark:bg-slate-950/70 p-4">
            <span className="text-slate-500 block">Exempt Under ₱90k Cap</span>
            <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {formatPhp(simulatedAnnual.nonTaxableAmount)}
            </span>
          </div>
          <div className="rounded-2xl bg-slate-100/80 dark:bg-slate-950/70 p-4">
            <span className="text-slate-500 flex items-center gap-1">
              {simulatedAnnual.taxableExcess > 0 && (
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              )}
              Taxable Bonus Excess
            </span>
            <span
              className={`text-xl font-bold font-mono ${
                simulatedAnnual.taxableExcess > 0
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-slate-400'
              }`}
            >
              {formatPhp(simulatedAnnual.taxableExcess)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

