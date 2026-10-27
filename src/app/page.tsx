'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import TimezoneTicker from '@/components/TimezoneTicker';
import DeliverablesQueue from '@/components/DeliverablesQueue';
import BillingHub from '@/components/BillingHub';
import ContractsSla from '@/components/ContractsSla';
import ClientsOverview from '@/components/ClientsOverview';
import { usePamugas } from '@/lib/store';
import {
  FileCheck2,
  DollarSign,
  FileSignature,
  Building,
  Sparkles,
} from 'lucide-react';

export default function Home() {
  const { role } = usePamugas();
  const [activeTab, setActiveTab] = useState<'deliverables' | 'billing' | 'contracts' | 'clients'>('deliverables');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Timezone & Collaboration Ticker */}
        <TimezoneTicker />

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 rounded-2xl border border-slate-800 bg-slate-900/60 p-1 text-xs sm:text-sm font-medium overflow-x-auto">
          <button
            onClick={() => setActiveTab('deliverables')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 transition-all whitespace-nowrap ${
              activeTab === 'deliverables'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <FileCheck2 className="h-4 w-4" />
            <span>Deliverables & Approvals</span>
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 transition-all whitespace-nowrap ${
              activeTab === 'billing'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <DollarSign className="h-4 w-4" />
            <span>Dual-Currency (USD/PHP) & BIR Billing</span>
          </button>

          <button
            onClick={() => setActiveTab('contracts')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 transition-all whitespace-nowrap ${
              activeTab === 'contracts'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <FileSignature className="h-4 w-4" />
            <span>Contracts & SLAs</span>
          </button>

          {role === 'agency_admin' && (
            <button
              onClick={() => setActiveTab('clients')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 transition-all whitespace-nowrap ${
                activeTab === 'clients'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Building className="h-4 w-4" />
              <span>Agency Accounts</span>
            </button>
          )}
        </div>

        {/* Tab Content Panels */}
        <div className="pt-2">
          {activeTab === 'deliverables' && <DeliverablesQueue />}
          {activeTab === 'billing' && <BillingHub />}
          {activeTab === 'contracts' && <ContractsSla />}
          {activeTab === 'clients' && role === 'agency_admin' && <ClientsOverview />}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p className="flex items-center justify-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>Pamugas Operations Portal · Built for Philippine Digital Agencies (SEO, Ads, Content)</span>
        </p>
      </footer>
    </div>
  );
}
