import { PaymentRail } from '@/types';

export const DEFAULT_USD_PHP_RATE = 58.85;

export interface BillingBreakdown {
  amountUsd: number;
  fxRate: number;
  grossPhp: number;
  rail: PaymentRail;
  feePercent: number;
  feeUsd: number;
  feePhp: number;
  netPhpTakeHome: number;
  wiseVsStripeSavingsPhp: number;
}

/**
 * Computes exact financial breakdown comparing Wise (0.6%) vs Stripe (3.4%)
 * with BIR Zero-Rated Export compliance metrics.
 */
export function calculateBillingBreakdown(
  amountUsd: number,
  rail: PaymentRail = 'wise',
  fxRate = DEFAULT_USD_PHP_RATE
): BillingBreakdown {
  const feePercent = rail === 'wise' ? 0.6 : 3.4;
  const grossPhp = amountUsd * fxRate;
  const feeUsd = amountUsd * (feePercent / 100);
  const feePhp = feeUsd * fxRate;
  const netPhpTakeHome = grossPhp - feePhp;

  // Potential savings if Wise is selected over Stripe
  const stripeFeePhp = amountUsd * (3.4 / 100) * fxRate;
  const wiseFeePhp = amountUsd * (0.6 / 100) * fxRate;
  const wiseVsStripeSavingsPhp = Math.max(0, stripeFeePhp - wiseFeePhp);

  return {
    amountUsd,
    fxRate,
    grossPhp,
    rail,
    feePercent,
    feeUsd,
    feePhp,
    netPhpTakeHome,
    wiseVsStripeSavingsPhp,
  };
}

export const BIR_ZERO_RATED_TEXT = 
  'This transaction qualifies for Zero-Rated (0%) Value-Added Tax pursuant to Section 108(B)(2) of the National Internal Revenue Code (NIRC) of 1997, as amended (Services rendered to persons engaged in business outside the Philippines).';
