'use client';

import React, { useState } from 'react';
import { usePamugas } from '@/lib/store';
import { Invoice } from '@/types';
import { calculateBillingBreakdown } from '@/lib/billing';
import {
  DollarSign,
  TrendingUp,
  Plus,
  RefreshCw,
  Sparkles,
  FileText,
  CheckCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import CreateInvoiceModal from './CreateInvoiceModal';
import BirInvoiceModal from './BirInvoiceModal';

export default function BillingHub() {
  const {
    role,
    invoices,
    clients,
    selectedClientId,
    fxRate,
    refreshFxRate,
    fxRateLoading,
    markInvoicePaid,
  } = usePamugas();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBirInvoice, setSelectedBirInvoice] = useState<Invoice | null>(null);

  const clientInvoices = invoices.filter((inv) =>
    role === 'client_viewer' ? inv.clientId === selectedClientId : true
  );

  const totalUsdInvoiced = clientInvoices.reduce((acc, curr) => acc + curr.amountUsd, 0);

  let totalNetTakeHomePhp = 0;
  let totalWiseSavingsPhp = 0;

  clientInvoices.forEach((inv) => {
    const b = calculateBillingBreakdown(inv.amountUsd, inv.rail, inv.lockedFxRate || fxRate);
    totalNetTakeHomePhp += b.netPhpTakeHome;
    totalWiseSavingsPhp += b.wiseVsStripeSavingsPhp;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner: FX Rate & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Dual-Currency (USD / PHP) Billing & BIR Tagging
            </h3>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              Sec. 108(B) NIRC Compliant
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time FX lock, fee deduction breakdown (Wise 0.6% vs Stripe 3.4%), and zero-rated VAT metadata.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Live FX Badge */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 px-3 py-1.5 text-xs shadow-sm">
            <span className="text-slate-500 dark:text-slate-400">Locked Spot FX:</span>
            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
              1 USD = ₱{fxRate.toFixed(2)} PHP
            </span>
            <button
              onClick={refreshFxRate}
              disabled={fxRateLoading}
              title="Refresh live exchange rate"
              className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${fxRateLoading ? 'animate-spin text-amber-500' : ''}`} />
            </button>
          </div>

          {role === 'agency_admin' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-amber-400 shadow-md shadow-amber-500/20"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoiced */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 shadow-sm dark:shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Total Invoiced</span>
            <DollarSign className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-mono font-bold text-slate-900 dark:text-white">
              ${totalUsdInvoiced.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">USD</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            ₱{(totalUsdInvoiced * fxRate).toLocaleString(undefined, { maximumFractionDigits: 0 })} PHP gross
          </p>
        </div>

        {/* Net PHP Take-Home */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-gradient-to-br dark:from-slate-900/80 dark:to-emerald-950/20 p-4 shadow-sm dark:shadow-lg">
          <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 font-medium">
            <span>Net Take-Home (PHP)</span>
            <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-mono font-bold text-slate-900 dark:text-white">
              ₱{totalNetTakeHomePhp.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">PHP</span>
          </div>
          <p className="text-[11px] text-emerald-600/80 dark:text-emerald-500/80 mt-1">After payment rail fees deduction</p>
        </div>

        {/* Fee Savings via Wise */}
        <div className="rounded-2xl border border-amber-500/20 bg-amber-50/50 dark:bg-slate-900/60 p-4 shadow-sm dark:shadow-lg">
          <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-400 font-medium">
            <span>Wise Rail Fee Alpha</span>
            <Sparkles className="h-4 w-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-mono font-bold text-amber-600 dark:text-amber-400">
              ₱{totalWiseSavingsPhp.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Saved</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Saved vs 3.4% standard cross-border Stripe</p>
        </div>

        {/* BIR Zero-Rated Status */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 shadow-sm dark:shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>BIR Tax Status</span>
            <ShieldCheck className="h-4 w-4 text-blue-500 dark:text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-lg font-bold text-slate-900 dark:text-white">0% VAT</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Sec. 108(B)</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Cross-Border Foreign Inbound Invoicing</p>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm dark:shadow-xl">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Invoices & Settlement Ledger</h4>
          <span className="text-xs text-slate-500 dark:text-slate-400">Dual-Currency Breakdown</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3 font-semibold">Invoice #</th>
                <th className="px-5 py-3 font-semibold">Client</th>
                <th className="px-5 py-3 font-semibold">Amount (USD)</th>
                <th className="px-5 py-3 font-semibold">Locked Rate</th>
                <th className="px-5 py-3 font-semibold">Net PHP Take-Home</th>
                <th className="px-5 py-3 font-semibold">Rail & Fee</th>
                <th className="px-5 py-3 font-semibold">Due Date</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Receipt & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {clientInvoices.map((inv) => {
                const client = clients.find((c) => c.id === inv.clientId);
                const breakdown = calculateBillingBreakdown(
                  inv.amountUsd,
                  inv.rail,
                  inv.lockedFxRate || fxRate
                );

                return (
                  <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3 font-mono font-medium text-slate-900 dark:text-white">{inv.id}</td>
                    <td className="px-5 py-3">
                      <span className="font-medium text-slate-900 dark:text-slate-200">{client?.name}</span>
                      <span className="block text-[10px] text-slate-400 dark:text-slate-500">{client?.city}</span>
                    </td>
                    <td className="px-5 py-3 font-mono font-bold text-slate-900 dark:text-white">
                      ${inv.amountUsd.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 font-mono text-slate-700 dark:text-slate-300">
                      ₱{(inv.lockedFxRate || fxRate).toFixed(2)}
                    </td>
                    <td className="px-5 py-3 font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                      ₱{breakdown.netPhpTakeHome.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          inv.rail === 'wise'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20'
                        }`}
                      >
                        {inv.rail} ({inv.feePercent}%)
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-slate-500 dark:text-slate-400">{inv.dueDate}</td>
                    <td className="px-5 py-3">
                      {inv.status === 'paid' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                          <CheckCircle className="h-3 w-3" /> Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400 border border-amber-500/30">
                          <Clock className="h-3 w-3" /> Due Soon
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {role === 'agency_admin' && inv.status === 'unpaid' && (
                          <button
                            onClick={() => markInvoicePaid(inv.id)}
                            className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                          >
                            Mark Paid
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedBirInvoice(inv)}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <FileText className="h-3 w-3 text-amber-500 dark:text-amber-400" />
                          <span>BIR Receipt</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      {showCreateModal && <CreateInvoiceModal onClose={() => setShowCreateModal(false)} />}

      {/* BIR Official Invoice Slip Modal */}
      {selectedBirInvoice && (
        <BirInvoiceModal
          invoice={selectedBirInvoice}
          onClose={() => setSelectedBirInvoice(null)}
        />
      )}
    </div>
  );
}
