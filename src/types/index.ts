export type UserRole = 'agency_admin' | 'client_viewer';

export interface Client {
  id: string;
  name: string;
  contactName: string;
  contactEmail: string;
  city: string;
  timezone: string; // IANA e.g. America/New_York
  tzLabel: string; // e.g. EST (UTC-5)
  overlapWindow: string; // e.g. 8:00 PM - 1:00 AM PHT (8:00 AM - 1:00 PM EST)
  currency: 'USD' | 'PHP';
  retainerUsd: number;
  revisionsUsed: number;
  revisionsMax: number;
  status: 'active' | 'paused' | 'onboarding';
  services: string[];
  avatarUrl?: string;
}

export type DeliverableCategory = 
  | 'SEO Audit'
  | 'Paid Ads Creatives'
  | 'Content & Copy'
  | 'CRO & Landing Page'
  | 'Technical Dev';

export type DeliverableStatus = 
  | 'pending_review'
  | 'revision_requested'
  | 'approved';

export interface Deliverable {
  id: string;
  clientId: string;
  title: string;
  category: DeliverableCategory;
  submittedAtPht: string; // ISO string
  scheduledClientRelease: string; // ISO string
  smartDispatch: boolean;
  status: DeliverableStatus;
  assetUrl: string;
  notes: string;
  feedback?: string;
  revisionCount: number;
  approvedAt?: string;
}

export type PaymentRail = 'wise' | 'stripe';

export type InvoiceStatus = 'unpaid' | 'paid' | 'overdue';

export interface Invoice {
  id: string;
  clientId: string;
  description: string;
  amountUsd: number;
  lockedFxRate: number; // e.g. 58.65 PHP/USD
  rail: PaymentRail;
  feePercent: number; // Wise = 0.6%, Stripe = 3.4%
  birTaxType: string; // 'Zero-Rated Export (0% VAT) - Sec. 108(B) NIRC'
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  status: InvoiceStatus;
  paidAt?: string;
}

export interface Contract {
  id: string;
  clientId: string;
  title: string;
  turnaroundSla: string;
  revisionPolicy: string;
  ipTransfer: string;
  signedByClient: boolean;
  signedDate?: string;
  signatureName?: string;
  contractPdfUrl?: string;
}

export interface FxRateResponse {
  rate: number;
  base: string;
  target: string;
  source: string;
  updatedAt: string;
}
