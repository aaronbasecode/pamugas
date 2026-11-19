import {
  DayType,
  DeMinimisPackage,
  DtrEntry,
  Employee,
  LeaveRequest,
  PayCalculationResult,
  PayFrequency,
  StatutoryBreakdown,
  TerminationCause,
} from '@/types';

/** Parse HH:mm into minutes from midnight */
export function timeToMinutes(hhmm: string): number {
  const [hStr, mStr] = hhmm.split(':');
  const h = Number(hStr) || 0;
  const m = Number(mStr) || 0;
  return h * 60 + m;
}

/** Format Philippine Peso neatly */
export function formatPhp(amount: number): string {
  const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
  return `₱${rounded.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Round to 2 decimal places */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Compute Night Shift Differential overlap minutes (10:00 PM - 6:00 AM PHT).
 * Supports shifts that cross midnight.
 */
function computeNightDiffMinutes(startMin: number, endMin: number): number {
  let effectiveEnd = endMin;
  if (effectiveEnd <= startMin) {
    effectiveEnd += 24 * 60;
  }

  // Night windows covering Day 0 [0..360], Day 0 night [1320..1800], Day 1 night [2760..3240]
  const windows: [number, number][] = [
    [0, 360], // 12:00 AM - 6:00 AM
    [22 * 60, 30 * 60], // 10:00 PM - 6:00 AM next day
  ];

  let overlap = 0;
  for (const [wStart, wEnd] of windows) {
    const oStart = Math.max(startMin, wStart);
    const oEnd = Math.min(effectiveEnd, wEnd);
    if (oEnd > oStart) {
      overlap += oEnd - oStart;
    }
  }
  return overlap;
}

/**
 * Compute DTR attendance metrics against an employee's shift schedule.
 */
export function calculateDtrMetrics(params: {
  timeIn: string;
  timeOut: string;
  breakMinutes: number;
  dayType: DayType;
  shiftStart: string;
  shiftEnd: string;
  graceMinutes: number;
  convertOtToCto: boolean;
}): {
  regularHours: number;
  lateMinutes: number;
  undertimeMinutes: number;
  overtimeHours: number;
  nightDiffHours: number;
  ctoHoursCredited: number;
} {
  const {
    timeIn,
    timeOut,
    breakMinutes,
    dayType,
    shiftStart,
    shiftEnd,
    graceMinutes,
    convertOtToCto,
  } = params;

  const inMin = timeToMinutes(timeIn);
  let outMin = timeToMinutes(timeOut);
  if (outMin <= inMin) outMin += 24 * 60; // overnight

  const schedStart = timeToMinutes(shiftStart);
  let schedEnd = timeToMinutes(shiftEnd);
  if (schedEnd <= schedStart) schedEnd += 24 * 60;

  const grossWorkedMin = Math.max(0, outMin - inMin - Math.max(0, breakMinutes));
  const totalWorkedHours = round2(grossWorkedMin / 60);

  let lateMinutes = 0;
  let undertimeMinutes = 0;
  let regularHours = 0;
  let overtimeHours = 0;

  if (dayType === 'regular') {
    // Tardiness if clocked in after scheduled start + grace period
    if (inMin > schedStart + graceMinutes) {
      lateMinutes = inMin - schedStart;
    }
    // Undertime if clocked out before scheduled end
    if (outMin < schedEnd) {
      undertimeMinutes = schedEnd - outMin;
    }
    regularHours = Math.min(8, totalWorkedHours);
    overtimeHours = Math.max(0, round2(totalWorkedHours - 8));
  } else {
    // Rest day or Holiday: all first 8 hours receive holiday/rest-day basic rate; >8h is OT
    regularHours = Math.min(8, totalWorkedHours);
    overtimeHours = Math.max(0, round2(totalWorkedHours - 8));
  }

  const nightOverlapMin = computeNightDiffMinutes(inMin, outMin);
  // Deduct proportional break if shift falls heavily inside night diff
  const nightDiffHours = round2(Math.max(0, nightOverlapMin) / 60);

  // CTO conversion (eligible OT hours converted directly to leave credits)
  const ctoMultiplier = dayType === 'regular' ? 1.0 : 1.25;
  const ctoHoursCredited = convertOtToCto ? round2(overtimeHours * ctoMultiplier) : 0;

  return {
    regularHours,
    lateMinutes,
    undertimeMinutes,
    overtimeHours,
    nightDiffHours,
    ctoHoursCredited,
  };
}

/**
 * 2025/2026 SSS Contribution Schedule (15% total = 5% EE + 10% ER)
 * MSC range: P5,000 minimum to P35,000 maximum (increments of P500).
 * Regular SSS MSC up to P20,000; WISP (MPF) applies from P20,500 to P35,000.
 */
export function calculateSSS(monthlyBasic: number): StatutoryBreakdown['sss'] {
  if (monthlyBasic <= 0) {
    return { msc: 0, regularEE: 0, wispEE: 0, totalEE: 0, totalER: 0 };
  }

  const clamped = Math.max(5000, Math.min(35000, monthlyBasic));
  // Standard bracket rounding to nearest P500 step
  const msc = Math.min(35000, Math.max(5000, Math.round(clamped / 500) * 500));

  const regularMsc = Math.min(msc, 20000);
  const wispMsc = Math.max(0, msc - 20000);

  const regularEE = round2(regularMsc * 0.05);
  const wispEE = round2(wispMsc * 0.05);
  const totalEE = round2(regularEE + wispEE);
  const totalER = round2(msc * 0.10);

  return { msc, regularEE, wispEE, totalEE, totalER };
}

/**
 * PhilHealth Contribution (5% total rate under UHC Act: 2.5% EE, 2.5% ER)
 * Floor: P10,000 | Ceiling: P100,000
 */
export function calculatePhilHealth(monthlyBasic: number): StatutoryBreakdown['philhealth'] {
  if (monthlyBasic <= 0) {
    return { baseSalary: 0, totalEE: 0, totalER: 0 };
  }
  const baseSalary = Math.max(10000, Math.min(100000, monthlyBasic));
  const totalEE = round2(baseSalary * 0.025);
  const totalER = round2(baseSalary * 0.025);
  return { baseSalary, totalEE, totalER };
}

/**
 * Pag-IBIG (HDMF) Contribution (Updated P10,000 Salary Cap)
 * EE: 1% if <= P1,500; 2% if > P1,500 (max P200/mo)
 * ER: 2% (max P200/mo)
 */
export function calculatePagIBIG(monthlyBasic: number): StatutoryBreakdown['pagibig'] {
  if (monthlyBasic <= 0) {
    return { baseSalary: 0, totalEE: 0, totalER: 0 };
  }
  const baseSalary = Math.min(10000, monthlyBasic);
  const eeRate = monthlyBasic <= 1500 ? 0.01 : 0.02;
  const totalEE = round2(baseSalary * eeRate);
  const totalER = round2(baseSalary * 0.02);
  return { baseSalary, totalEE, totalER };
}

/**
 * BIR TRAIN Law (RA 10963) Revised Withholding Tax Table (2023 onwards)
 */
export function calculateWithholdingTax(
  taxableIncome: number,
  frequency: PayFrequency
): StatutoryBreakdown['withholdingTax'] {
  const divisor = frequency === 'semi_monthly' ? 2 : 1;
  const income = Math.max(0, round2(taxableIncome));

  const brackets = [
    { max: 20833 / divisor, excessOver: 0, baseTax: 0, rate: 0, label: '0% (Tax-Exempt ≤ ₱20,833/mo)' },
    { max: 33332 / divisor, excessOver: 20833 / divisor, baseTax: 0, rate: 0.15, label: '15% Bracket (TRAIN)' },
    { max: 66666 / divisor, excessOver: 33333 / divisor, baseTax: 1875 / divisor, rate: 0.20, label: '20% Bracket (TRAIN)' },
    { max: 166666 / divisor, excessOver: 66667 / divisor, baseTax: 8541.80 / divisor, rate: 0.25, label: '25% Bracket (TRAIN)' },
    { max: 666666 / divisor, excessOver: 166667 / divisor, baseTax: 33541.80 / divisor, rate: 0.30, label: '30% Bracket (TRAIN)' },
    { max: Infinity, excessOver: 666667 / divisor, baseTax: 183541.80 / divisor, rate: 0.35, label: '35% Top Bracket (TRAIN)' },
  ];

  const matched = brackets.find((b) => income <= b.max) || brackets[brackets.length - 1];
  const excess = Math.max(0, income - matched.excessOver);
  const tax = round2(matched.baseTax + excess * matched.rate);

  return {
    taxableIncome: income,
    tax,
    bracketLabel: matched.label,
    excessOver: round2(matched.excessOver),
    baseTax: round2(matched.baseTax),
    ratePct: matched.rate * 100,
  };
}

/** Compute BIR-exempt vs taxable De Minimis allowances per month */
export function evaluateDeMinimis(pkg: DeMinimisPackage): {
  nonTaxableMonthly: number;
  taxableExcessMonthly: number;
} {
  const riceExempt = Math.min(pkg.riceSubsidy, 2000);
  const uniformExempt = Math.min(pkg.uniformAllowance, 500); // P6,000/yr
  const laundryExempt = Math.min(pkg.laundryAllowance, 300);
  const medicalExempt = Math.min(pkg.medicalCash, 833.33); // P10,000/yr

  const total = pkg.riceSubsidy + pkg.uniformAllowance + pkg.laundryAllowance + pkg.medicalCash;
  const nonTaxableMonthly = round2(riceExempt + uniformExempt + laundryExempt + medicalExempt);
  const taxableExcessMonthly = round2(Math.max(0, total - nonTaxableMonthly));

  return { nonTaxableMonthly, taxableExcessMonthly };
}

/**
 * Full Philippine Pay Interpretation Engine
 */
export function interpretPayroll(params: {
  employee: Employee;
  frequency: PayFrequency;
  dtrEntries?: DtrEntry[];
  approvedLeaves?: LeaveRequest[];
  manualOverride?: {
    regularOtHours?: number;
    restDayHours?: number;
    specialHolidayHours?: number;
    regularHolidayHours?: number;
    nightDiffHours?: number;
    lateMinutes?: number;
    undertimeMinutes?: number;
  };
  taxableBonus?: number;
  otherDeductions?: number;
}): PayCalculationResult {
  const {
    employee,
    frequency,
    dtrEntries = [],
    approvedLeaves = [],
    manualOverride,
    taxableBonus = 0,
    otherDeductions = 0,
  } = params;

  const divisor = frequency === 'semi_monthly' ? 2 : 1;
  const monthlyBasic = employee.monthlyBasic;
  const dailyRate = round2(monthlyBasic / Math.max(1, employee.workingDaysPerMonth));
  const hourlyRate = round2(dailyRate / 8);
  const minuteRate = hourlyRate / 60;

  const basicPay = round2(monthlyBasic / divisor);

  // Aggregate attendance either from DTR entries or direct manual overrides
  let totalLateMinutes = 0;
  let totalUndertimeMinutes = 0;
  let totalRegularHours = 0;
  let totalPaidOtHours = 0;
  let totalNightDiffHours = 0;
  let totalCtoCreditedHours = 0;
  let overtimePay = 0;
  let holidayRestPay = 0;

  if (manualOverride) {
    totalLateMinutes = manualOverride.lateMinutes || 0;
    totalUndertimeMinutes = manualOverride.undertimeMinutes || 0;
    totalNightDiffHours = manualOverride.nightDiffHours || 0;
    const regOt = manualOverride.regularOtHours || 0;
    const restHrs = manualOverride.restDayHours || 0;
    const specHrs = manualOverride.specialHolidayHours || 0;
    const regHolHrs = manualOverride.regularHolidayHours || 0;

    totalPaidOtHours = regOt;
    overtimePay = round2(regOt * hourlyRate * 1.25);
    // Premium portions (+30% for rest day / special holiday, +100% additional for regular holiday assuming basic already in basicPay)
    holidayRestPay = round2(
      restHrs * hourlyRate * 0.30 +
        specHrs * hourlyRate * 0.30 +
        regHolHrs * hourlyRate * 1.0
    );
  } else {
    for (const entry of dtrEntries) {
      totalLateMinutes += entry.lateMinutes;
      totalUndertimeMinutes += entry.undertimeMinutes;
      totalRegularHours += entry.regularHours;
      totalNightDiffHours += entry.nightDiffHours;
      totalCtoCreditedHours += entry.ctoHoursCredited;

      const paidOt = entry.convertOtToCto ? 0 : entry.overtimeHours;
      totalPaidOtHours += paidOt;

      if (entry.dayType === 'regular') {
        overtimePay += paidOt * hourlyRate * 1.25;
      } else if (entry.dayType === 'rest_day' || entry.dayType === 'special_holiday') {
        // Basic pay covers 1.0x for scheduled days, so add +0.30x premium + 1.69x OT
        holidayRestPay += entry.regularHours * hourlyRate * 0.30;
        overtimePay += paidOt * hourlyRate * 1.69;
      } else if (entry.dayType === 'regular_holiday') {
        // Basic pay covers 1.0x, so add +1.0x additional premium + 2.60x OT
        holidayRestPay += entry.regularHours * hourlyRate * 1.0;
        overtimePay += paidOt * hourlyRate * 2.60;
      }
    }
    overtimePay = round2(overtimePay);
    holidayRestPay = round2(holidayRestPay);
  }

  const nightDiffPay = round2(totalNightDiffHours * hourlyRate * 0.10);

  // Paid Leave credit note (CTO/VL/SL) — reflects hours covered without salary deduction
  const paidLeavePay = round2(
    approvedLeaves
      .filter((l) => l.status === 'approved' && l.isPaid)
      .reduce((acc, l) => acc + l.hours * hourlyRate, 0)
  );

  const tardinessDeduction = round2(totalLateMinutes * minuteRate);
  const undertimeDeduction = round2(totalUndertimeMinutes * minuteRate);

  const deMinimisEval = evaluateDeMinimis(employee.deMinimis);
  const deMinimisNonTaxable = round2(deMinimisEval.nonTaxableMonthly / divisor);
  const deMinimisTaxableExcess = round2(deMinimisEval.taxableExcessMonthly / divisor);

  // Gross Taxable Earnings before statutory EE deductions
  const taxableEarnings = Math.max(
    0,
    round2(
      basicPay +
        overtimePay +
        holidayRestPay +
        nightDiffPay +
        deMinimisTaxableExcess +
        taxableBonus -
        tardinessDeduction -
        undertimeDeduction
    )
  );

  const grossPay = round2(taxableEarnings + deMinimisNonTaxable);

  // Compute full monthly statutory contributions then prorate by pay frequency
  const fullSSS = calculateSSS(monthlyBasic);
  const fullPH = calculatePhilHealth(monthlyBasic);
  const fullPagibig = calculatePagIBIG(monthlyBasic);

  const sss = {
    msc: fullSSS.msc,
    regularEE: round2(fullSSS.regularEE / divisor),
    wispEE: round2(fullSSS.wispEE / divisor),
    totalEE: round2(fullSSS.totalEE / divisor),
    totalER: round2(fullSSS.totalER / divisor),
  };

  const philhealth = {
    baseSalary: fullPH.baseSalary,
    totalEE: round2(fullPH.totalEE / divisor),
    totalER: round2(fullPH.totalER / divisor),
  };

  const pagibig = {
    baseSalary: fullPagibig.baseSalary,
    totalEE: round2(fullPagibig.totalEE / divisor),
    totalER: round2(fullPagibig.totalER / divisor),
  };

  const totalMandatoryEE = round2(sss.totalEE + philhealth.totalEE + pagibig.totalEE);
  const taxableIncome = Math.max(0, round2(taxableEarnings - totalMandatoryEE));
  const withholdingTax = calculateWithholdingTax(taxableIncome, frequency);

  const totalDeductions = round2(
    totalMandatoryEE + withholdingTax.tax + Math.max(0, otherDeductions)
  );
  const netPay = Math.max(0, round2(grossPay - totalDeductions));

  return {
    frequency,
    monthlyBasic,
    dailyRate,
    hourlyRate,
    basicPay,
    overtimePay,
    holidayRestPay,
    nightDiffPay,
    paidLeavePay,
    deMinimisNonTaxable,
    deMinimisTaxableExcess,
    taxableBonus,
    tardinessDeduction,
    undertimeDeduction,
    grossPay,
    statutory: {
      sss,
      philhealth,
      pagibig,
      withholdingTax,
    },
    otherDeductions,
    totalDeductions,
    netPay,
    totalLateMinutes,
    totalUndertimeMinutes,
    totalRegularHours: round2(totalRegularHours),
    totalPaidOtHours: round2(totalPaidOtHours),
    totalNightDiffHours: round2(totalNightDiffHours),
    totalCtoCreditedHours: round2(totalCtoCreditedHours),
  };
}

/** Compute 13th Month Pay & Non-Taxable P90,000 Threshold */
export function calculateAnnualBenefits(params: {
  totalBasicSalaryEarnedYtd: number;
  otherBonusesYtd: number;
  excessDeMinimisAnnual: number;
}) {
  const thirteenthMonthPay = round2(params.totalBasicSalaryEarnedYtd / 12);
  const totalBenefitsToward90k = round2(
    thirteenthMonthPay + params.otherBonusesYtd + params.excessDeMinimisAnnual
  );
  const cap = 90000;
  const nonTaxableAmount = Math.min(cap, totalBenefitsToward90k);
  const taxableExcess = round2(Math.max(0, totalBenefitsToward90k - cap));
  const remainingCeiling = round2(Math.max(0, cap - totalBenefitsToward90k));
  const usagePct = Math.min(100, Math.round((totalBenefitsToward90k / cap) * 100));

  return {
    thirteenthMonthPay,
    totalBenefitsToward90k,
    nonTaxableAmount,
    taxableExcess,
    remainingCeiling,
    usagePct,
  };
}

/**
 * Compute Termination / Final Pay under Philippine Labor Code (Art. 298-299 & DOLE Labor Advisory 06-20)
 */
export function calculateFinalPay(params: {
  monthlyBasic: number;
  workingDaysPerMonth: number;
  unpaidDaysWorked: number;
  unusedVlDays: number;
  unusedSlDays: number;
  unusedCtoHours: number;
  ytdBasicSalaryEarned: number;
  yearsOfService: number;
  cause: TerminationCause;
  otherReceivables: number;
  loanOrClearanceDeductions: number;
}) {
  const dailyRate = round2(params.monthlyBasic / Math.max(1, params.workingDaysPerMonth));
  const hourlyRate = round2(dailyRate / 8);

  const unpaidSalary = round2(params.unpaidDaysWorked * dailyRate);
  const prorated13thMonth = round2((params.ytdBasicSalaryEarned + unpaidSalary) / 12);
  const leaveConversion = round2((params.unusedVlDays + params.unusedSlDays) * dailyRate);
  const ctoConversion = round2(params.unusedCtoHours * hourlyRate);

  // Separation Pay under PH Labor Code
  let separationPay = 0;
  let separationRule = 'Not applicable for this separation cause';
  // A fraction of at least 6 months counts as 1 whole year
  const creditedYears = params.yearsOfService;
  if (params.cause === 'redundancy') {
    separationPay = round2(Math.max(1, creditedYears) * params.monthlyBasic);
    separationRule = '1 month pay per year of service (Art. 298 — Redundancy)';
  } else if (params.cause === 'retrenchment') {
    separationPay = round2(Math.max(1, creditedYears) * (params.monthlyBasic * 0.5));
    separationRule = '0.5 month pay per year of service (Art. 298 — Retrenchment/Closure)';
  } else if (params.cause === 'retirement') {
    // 22.5 days per year of service (RA 7641 minimum retirement pay)
    separationPay = round2(creditedYears * 22.5 * dailyRate);
    separationRule = '22.5 days per year of service (RA 7641 Retirement Law)';
  }

  const totalFinalGross = round2(
    unpaidSalary +
      prorated13thMonth +
      leaveConversion +
      ctoConversion +
      separationPay +
      params.otherReceivables
  );

  const netFinalPay = Math.max(
    0,
    round2(totalFinalGross - params.loanOrClearanceDeductions)
  );

  return {
    dailyRate,
    unpaidSalary,
    prorated13thMonth,
    leaveConversion,
    ctoConversion,
    separationPay,
    separationRule,
    totalFinalGross,
    netFinalPay,
  };
}

