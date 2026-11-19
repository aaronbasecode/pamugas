import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { PamugasProvider } from '@/lib/store';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Pamugas · PH Payroll & DTR Tracker',
  description:
    'Philippine Daily Time Record (DTR) & Payroll suite with live Time-In/Time-Out tracking, automated SSS, PhilHealth, Pag-IBIG, and BIR TRAIN Law Withholding Tax calculator, Scheduling, Leave & Benefits, CTO credits, 13th Month Pay, ₱90k Non-Taxable tracker, and Termination Final Pay.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className={`${inter.className} min-h-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col`}>
        <PamugasProvider>{children}</PamugasProvider>
      </body>
    </html>
  );
}
