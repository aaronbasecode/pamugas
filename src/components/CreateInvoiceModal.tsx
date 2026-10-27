'use client';

import React, { useState, useEffect } from 'react';
import { usePamugas } from '@/lib/store';
import { PaymentRail } from '@/types';
import { calculateBillingBreakdown } from '@/lib/billing';
import { X, Receipt } from 'lucide-react';

interface CreateInvoiceModalProps {
  onClose: () => void;
}

export default function CreateInvoiceModal({ onClose }: CreateInvoiceModalProps) {
  const { clients, activeClient, fxRate, createInvoice } = usePamugas();

  const [clientId, setClientId] = useState(activeClient?.id || clients[0]?.id || '');
  const [description, setDescription] = useState('');
  const [amountUsd, setAmountUsd] = useState(5000);
  const [rail, setRail] = useState<PaymentRail>('wise');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    setDueDate(d.toISOString().split('T')[0]);
  }, []);

  const breakdown = calculateBillingBreakdown(amountUsd, rail, fxRate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amountUsd <= 0) return;

    createInvoice({
      clientId,
      description: description.trim(),
      amountUsd,
      lockedFxRate: fxRate,
      rail,
      feePercent: rail === 'wise' ? 0.6 : 3.4,
      birTaxType: 'Zero-Rated Export (0% VAT) - Sec. 108(B) NIRC',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: dueDate || new Date().toISOString().split('T')[0],
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Receipt className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-white">Generate Dual-Currency Invoice</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-900 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Select Client</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.city})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Invoice Description / Scope
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. November Retainer: SEO, Paid Ads & Content Execution"
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Gross Amount (USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-slate-400">$</span>
                <input
                  type="number"
                  required
                  min={100}
                  step={50}
                  value={amountUsd}
                  onChange={(e) => setAmountUsd(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-7 pr-3 py-2 text-xs font-mono font-bold text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Rail</label>
              <select
                value={rail}
                onChange={(e) => setRail(e.target.value as PaymentRail)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="wise">Wise Business (0.6% fee)</option>
                <option value="stripe">Stripe Cross-Border (3.4% fee)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Due Date</label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Real-time Calculation Summary */}
          <div className="rounded-xl border border-emerald-500/20 bg-slate-900/60 p-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Gross USD &rarr; PHP @ ₱{fxRate.toFixed(2)}:</span>
              <span className="font-mono text-slate-200">
                ₱{breakdown.grossPhp.toLocaleString(undefined, { maximumFractionDigits: 0 })} PHP
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Rail Processing Fee ({breakdown.feePercent}%):</span>
              <span className="font-mono text-rose-400">
                -₱{breakdown.feePhp.toLocaleString(undefined, { maximumFractionDigits: 0 })} PHP
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-800 pt-2 font-semibold">
              <span className="text-emerald-400">Net PHP Take-Home:</span>
              <span className="font-mono text-emerald-400 text-sm">
                ₱{breakdown.netPhpTakeHome.toLocaleString(undefined, { maximumFractionDigits: 0 })} PHP
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition shadow-md shadow-emerald-500/20"
            >
              Issue & Register Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
