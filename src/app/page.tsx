'use client';

import React from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import PayrollModulesOverview from '@/components/PayrollModulesOverview';
import DtrTimekeeping from '@/components/DtrTimekeeping';
import PayrollCalculator from '@/components/PayrollCalculator';
import ScheduleLeaveCto from '@/components/ScheduleLeaveCto';
import AnnualBenefitsTracker from '@/components/AnnualBenefitsTracker';
import TerminationFinalPay from '@/components/TerminationFinalPay';
import Toast from '@/components/Toast';
import { usePamugas } from '@/lib/store';

export default function Home() {
  const { activeTab, activeEmployee } = usePamugas();

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors overflow-x-clip">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
          {activeTab === 'overview' && <PayrollModulesOverview key={activeEmployee.id} />}
          {activeTab === 'dtr' && <DtrTimekeeping key={activeEmployee.id} />}
          {activeTab === 'payroll' && <PayrollCalculator key={activeEmployee.id} />}
          {activeTab === 'schedule' && <ScheduleLeaveCto key={activeEmployee.id} />}
          {activeTab === 'annual' && <AnnualBenefitsTracker key={activeEmployee.id} />}
          {activeTab === 'termination' && <TerminationFinalPay key={activeEmployee.id} />}
        </main>

        {/* Footer */}
        <footer className="mt-auto py-5 text-center text-xs text-slate-500 px-4">
          Pamugas PH Payroll &amp; DTR Tracker · SSS, PhilHealth, Pag-IBIG &amp; BIR TRAIN Law Compliant
        </footer>
      </div>

      {/* Floating Global Toast Notifications */}
      <Toast />
    </div>
  );
}
