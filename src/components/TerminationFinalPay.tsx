'use client';

import React, { useMemo, useState } from 'react';
import { usePamugas } from '@/lib/store';
import { TerminationCause } from '@/types';
import { calculateFinalPay, formatPhp } from '@/lib/phPayroll';
import { FileOutput, Printer } from 'lucide-react';

export default function TerminationFinalPay() {
  const { activeEmployee } = usePamugas();

  const [cause, setCause] = useState<TerminationCause>('resignation');
  const [yearsOfService, setYearsOfService] = useState<number>(3);
  const [unpaidDays, setUnpaidDays] = useState<number>(7);
  const [unusedVl, setUnusedVl] = useState<number>(activeEmployee.leaveBalances.vlDays);
  const [unusedSl, setUnusedSl] = useState<number>(0);
  const [unusedCto, setUnusedCto] = useState<number>(
    activeEmployee.leaveBalances.ctoHours
  );
  const [otherReceivables, setOtherReceivables] = useState<number>(0);
  const [clearanceDeductions, setClearanceDeductions] = useState<number>(0);

  const finalPay = useMemo(
    () =>
      calculateFinalPay({
        monthlyBasic: activeEmployee.monthlyBasic,
        workingDaysPerMonth: activeEmployee.workingDaysPerMonth,
        unpaidDaysWorked: Math.max(0, unpaidDays),
        unusedVlDays: Math.max(0, unusedVl),
        unusedSlDays: Math.max(0, unusedSl),
        unusedCtoHours: Math.max(0, unusedCto),
        ytdBasicSalaryEarned: activeEmployee.ytdBasicEarned,
        yearsOfService: Math.max(0, yearsOfService),
        cause,
        otherReceivables: Math.max(0, otherReceivables),
        loanOrClearanceDeductions: Math.max(0, clearanceDeductions),
      }),
    [
      activeEmployee,
      unpaidDays,
      unusedVl,
      unusedSl,
      unusedCto,
      yearsOfService,
      cause,
      otherReceivables,
      clearanceDeductions,
    ]
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Separation Parameters */}
        <div className="lg:col-span-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 space-y-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-400">
              <FileOutput className="h-3.5 w-3.5" />
              DOLE Labor Advisory No. 06-20 (30-Day Release Rule)
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-2">
              Termination &amp; Final Pay Inputs
            </h2>
            <p className="text-xs text-slate-500">
              Employee: {activeEmployee.name} · Daily Rate:{' '}
              {formatPhp(finalPay.dailyRate)}
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Cause of Separation / Contract End
              </label>
              <select
                value={cause}
                onChange={(e) => setCause(e.target.value as TerminationCause)}
                className="w-full rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2.5 text-xs font-semibold text-slate-900 dark:text-white"
              >
                <option value="resignation">Voluntary Resignation (No Separation Pay)</option>
                <option value="end_of_contract">End of Fixed-Term / Project Contract</option>
                <option value="redundancy">
                  Authorized Cause: Redundancy (1 mo / year of service)
                </option>
                <option value="retrenchment">
                  Authorized Cause: Retrenchment / Closure (0.5 mo / year)
                </option>
                <option value="retirement">
                  Retirement under RA 7641 (22.5 days / year)
                </option>
                <option value="just_cause">Termination for Just Cause (Art. 297)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Years of Service
                </label>
                <input
                  type="number"
                  value={yearsOfService}
                  onChange={(e) => setYearsOfService(Number(e.target.value) || 0)}
                  min={0}
                  step={0.5}
                  className="w-full rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Unpaid Days Worked
                </label>
                <input
                  type="number"
                  value={unpaidDays}
                  onChange={(e) => setUnpaidDays(Number(e.target.value) || 0)}
                  min={0}
                  step={0.5}
                  className="w-full rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Unused VL (days)
                </label>
                <input
                  type="number"
                  value={unusedVl}
                  onChange={(e) => setUnusedVl(Number(e.target.value) || 0)}
                  min={0}
                  step={0.5}
                  className="w-full rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Unused SL (days)
                </label>
                <input
                  type="number"
                  value={unusedSl}
                  onChange={(e) => setUnusedSl(Number(e.target.value) || 0)}
                  min={0}
                  step={0.5}
                  className="w-full rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Unused CTO (hrs)
                </label>
                <input
                  type="number"
                  value={unusedCto}
                  onChange={(e) => setUnusedCto(Number(e.target.value) || 0)}
                  min={0}
                  step={0.5}
                  className="w-full rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Clearance Ded. (₱)
                </label>
                <input
                  type="number"
                  value={clearanceDeductions}
                  onChange={(e) => setClearanceDeductions(Number(e.target.value) || 0)}
                  min={0}
                  step={500}
                  className="w-full rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Other Receivables / Tax Refund (₱)
              </label>
              <input
                type="number"
                value={otherReceivables}
                onChange={(e) => setOtherReceivables(Number(e.target.value) || 0)}
                min={0}
                step={500}
                className="w-full rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 font-mono text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Right: Itemized Final Pay Statement */}
        <div className="lg:col-span-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 flex flex-col justify-between gap-5">
          <div className="space-y-4">
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                  Final Pay Statement (Back Pay)
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {activeEmployee.name}
                </h3>
                <p className="text-[11px] text-slate-500">{finalPay.separationRule}</p>
              </div>

              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-white transition"
              >
                <Printer className="h-3.5 w-3.5" />
                Print
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1">
                <span className="text-slate-600 dark:text-slate-300">
                  Unpaid Salary ({unpaidDays} days × {formatPhp(finalPay.dailyRate)})
                </span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {formatPhp(finalPay.unpaidSalary)}
                </span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-slate-600 dark:text-slate-300">
                  Pro-Rated 13th Month Pay (YTD + Unpaid ÷ 12)
                </span>
                <span className="font-mono font-semibold text-sky-600 dark:text-sky-400">
                  +{formatPhp(finalPay.prorated13thMonth)}
                </span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-slate-600 dark:text-slate-300">
                  Unused Leave Cash Conversion ({unusedVl + unusedSl} days)
                </span>
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  +{formatPhp(finalPay.leaveConversion)}
                </span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-slate-600 dark:text-slate-300">
                  CTO Cash Conversion ({unusedCto} hrs)
                </span>
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  +{formatPhp(finalPay.ctoConversion)}
                </span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-slate-600 dark:text-slate-300">
                  Statutory Separation / Retirement Pay
                </span>
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  +{formatPhp(finalPay.separationPay)}
                </span>
              </div>

              {otherReceivables > 0 && (
                <div className="flex justify-between py-1">
                  <span className="text-slate-600 dark:text-slate-300">
                    Other Receivables / Tax Refund
                  </span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                    +{formatPhp(otherReceivables)}
                  </span>
                </div>
              )}

              <div className="flex justify-between py-2 border-t border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white">
                <span>Total Gross Final Pay</span>
                <span className="font-mono">{formatPhp(finalPay.totalFinalGross)}</span>
              </div>

              {clearanceDeductions > 0 && (
                <div className="flex justify-between py-1 text-rose-600 dark:text-rose-400">
                  <span>Less: Accountabilities / Loan Balance</span>
                  <span className="font-mono">-{formatPhp(clearanceDeductions)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-emerald-500/15 p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                Net Final Pay Release
              </span>
              <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                To be released within 30 calendar days from separation
              </span>
            </div>
            <span className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
              {formatPhp(finalPay.netFinalPay)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

