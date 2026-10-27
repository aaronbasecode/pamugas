'use client';

import React from 'react';
import { Invoice } from '@/types';
import { usePamugas } from '@/lib/store';
import { calculateBillingBreakdown, BIR_ZERO_RATED_TEXT } from '@/lib/billing';
import { X, Printer, ShieldCheck } from 'lucide-react';

interface BirInvoiceModalProps {
  invoice: Invoice;
  onClose: () => void;
}

export default function BirInvoiceModal({ invoice, onClose }: BirInvoiceModalProps) {
  const { clients } = usePamugas();
  const client = clients.find((c) => c.id === invoice.clientId);
  const breakdown = calculateBillingBreakdown(
    invoice.amountUsd,
    invoice.rail,
    invoice.lockedFxRate
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Official BIR Zero-Rated Export Invoice
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Compliant with Sec. 108(B)(2) National Internal Revenue Code (NIRC)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:text-white"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Invoice Receipt Body */}
        <div className="mt-6 space-y-6 text-xs text-slate-700 dark:text-slate-300">
          {/* Agency & Client Information Grid */}
          <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/40 p-4">
            <div>
              <span className="font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider text-[10px]">
                Issued By (Service Provider)
              </span>
              <p className="font-bold text-slate-900 dark:text-white mt-1 text-sm">Pamugas Digital Operations Inc.</p>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">TIN: 009-876-543-000 NV</p>
              <p className="text-slate-500 dark:text-slate-400">Bonifacio Global City, Taguig, Philippines</p>
              <p className="text-slate-500 dark:text-slate-400">BIR RDO: 044 (Taguig City)</p>
            </div>
            <div>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-[10px]">
                Billed To (Non-Resident Foreign Corporation)
              </span>
              <p className="font-bold text-slate-900 dark:text-white mt-1 text-sm">{client?.name}</p>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">{client?.contactName} ({client?.contactEmail})</p>
              <p className="text-slate-500 dark:text-slate-400">{client?.city}</p>
              <p className="text-slate-500 dark:text-slate-400">Jurisdiction: Non-Resident Foreign Entity</p>
            </div>
          </div>

          {/* Invoice Meta */}
          <div className="grid grid-cols-3 gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3 text-center">
            <div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase">Invoice Number</span>
              <p className="font-mono font-bold text-slate-900 dark:text-white">{invoice.id}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase">Date of Issue</span>
              <p className="font-mono text-slate-800 dark:text-slate-200">{invoice.issueDate}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase">Payment Status</span>
              <p className="font-semibold text-emerald-600 dark:text-emerald-400 uppercase">{invoice.status}</p>
            </div>
          </div>

          {/* Line Item Table */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-[10px] uppercase border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Description of Service</th>
                  <th className="p-3">Tax Type</th>
                  <th className="p-3 text-right">Amount (USD)</th>
                  <th className="p-3 text-right">Amount (PHP @ ₱{invoice.lockedFxRate.toFixed(2)})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                <tr>
                  <td className="p-3">
                    <span className="font-medium text-slate-900 dark:text-white">{invoice.description}</span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                      SEO, Content Creation, and Digital Media Optimization
                    </span>
                  </td>
                  <td className="p-3 font-medium text-emerald-600 dark:text-emerald-400">Zero-Rated (0% VAT)</td>
                  <td className="p-3 font-mono font-bold text-slate-900 dark:text-white text-right">
                    ${invoice.amountUsd.toLocaleString()} USD
                  </td>
                  <td className="p-3 font-mono text-slate-800 dark:text-slate-200 text-right">
                    ₱{breakdown.grossPhp.toLocaleString(undefined, { maximumFractionDigits: 2 })} PHP
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown */}
          <div className="space-y-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Gross Taxable Sales (Zero-Rated):</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">
                ₱{breakdown.grossPhp.toLocaleString(undefined, { maximumFractionDigits: 2 })} PHP
              </span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>VAT (0% pursuant to Sec 108-B NIRC):</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">₱0.00 PHP</span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Payment Gateway Processing ({invoice.rail.toUpperCase()} {invoice.feePercent}%):</span>
              <span className="font-mono text-rose-600 dark:text-rose-400">
                -₱{breakdown.feePhp.toLocaleString(undefined, { maximumFractionDigits: 2 })} PHP
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2 font-bold text-sm text-slate-900 dark:text-white">
              <span>Net Inward Remittance:</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">
                ₱{breakdown.netPhpTakeHome.toLocaleString(undefined, { maximumFractionDigits: 2 })} PHP
              </span>
            </div>
          </div>

          {/* Mandatory BIR Compliance Clause */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 p-3.5 text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed">
            <strong className="block text-amber-900 dark:text-amber-300 mb-1">Legal Tax Notice:</strong>
            {BIR_ZERO_RATED_TEXT}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-200 dark:bg-slate-800 px-5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition"
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
