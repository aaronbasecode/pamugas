'use client';

import React, { useState } from 'react';
import { usePamugas } from '@/lib/store';
import {
  CheckCircle2,
  Clock,
  Shield,
  FileSignature,
  AlertCircle,
} from 'lucide-react';

export default function ContractsSla() {
  const { contracts, activeClient, selectedClientId, signContract } = usePamugas();
  const [signatureInput, setSignatureInput] = useState('');
  const [signingContractId, setSigningContractId] = useState<string | null>(null);

  const clientContracts = contracts.filter((c) => c.clientId === selectedClientId);

  const handleSign = (contractId: string) => {
    if (!signatureInput.trim()) return;
    signContract(contractId, signatureInput.trim());
    setSigningContractId(null);
    setSignatureInput('');
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
          Client Contracts & SLA Governance
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Turnaround SLA guarantees, intellectual property assignment terms, and e-signatures.
        </p>
      </div>

      {clientContracts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-950/40 p-8 text-center text-xs text-slate-500 dark:text-slate-400">
          No active agreements found for this client account.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {clientContracts.map((contract) => (
            <div
              key={contract.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm dark:shadow-xl space-y-4"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {contract.id}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">{contract.title}</h4>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{activeClient?.name}</span>
                </div>

                <div>
                  {contract.signedByClient ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Executed & Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-500/30">
                      <Clock className="h-3.5 w-3.5" /> Awaiting Signature
                    </span>
                  )}
                </div>
              </div>

              {/* Terms Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {/* Turnaround SLA */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40 p-3.5 space-y-1">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Turnaround SLA
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {contract.turnaroundSla}
                  </p>
                </div>

                {/* Revision Policy */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40 p-3.5 space-y-1">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Revision Policy
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {contract.revisionPolicy}
                  </p>
                </div>

                {/* IP Transfer */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40 p-3.5 space-y-1">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Shield className="h-3 w-3" /> IP Assignment
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {contract.ipTransfer}
                  </p>
                </div>
              </div>

              {/* Signature Banner / Interactive E-sign */}
              <div className="pt-2">
                {contract.signedByClient ? (
                  <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5 p-3.5 text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <FileSignature className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white">Digitally Executed by: </span>
                        <span className="font-mono text-emerald-700 dark:text-emerald-400">{contract.signatureName}</span>
                        <span className="text-slate-500 ml-2">on {contract.signedDate}</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">Cryptographically Verified</span>
                  </div>
                ) : (
                  <div>
                    {signingContractId === contract.id ? (
                      <div className="rounded-xl border border-amber-500/30 bg-slate-50 dark:bg-slate-950 p-4 space-y-3">
                        <label className="block text-xs font-semibold text-amber-700 dark:text-amber-300">
                          Type Full Legal Name to Electronically Sign:
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={signatureInput}
                            onChange={(e) => setSignatureInput(e.target.value)}
                            placeholder="e.g. Marcus Vance, Managing Partner"
                            className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-amber-400 focus:outline-none"
                          />
                          <button
                            onClick={() => handleSign(contract.id)}
                            className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400 transition"
                          >
                            Sign Agreement
                          </button>
                          <button
                            onClick={() => setSigningContractId(null)}
                            className="rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-3.5">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Digital sign-off required to lock monthly capacity and IP conveyance.
                        </span>
                        <button
                          onClick={() => setSigningContractId(contract.id)}
                          className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-400 transition shadow-sm"
                        >
                          <FileSignature className="h-3.5 w-3.5" />
                          <span>E-Sign Agreement</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
