import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { PamugasProvider } from '@/lib/store';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Pamugas · Freelancer & Agency Operations Portal',
  description:
    'Localized client portal with timezone-aware approvals, contract management, and automated dual-currency billing (PHP/USD) with BIR zero-rated compliance for Philippine digital agencies.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className={`${inter.className} min-h-full bg-slate-950 text-slate-100 flex flex-col`}>
        <PamugasProvider>{children}</PamugasProvider>
      </body>
    </html>
  );
}
