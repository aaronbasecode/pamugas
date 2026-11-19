export type UserRole = 'payroll_admin' | 'employee_self';

export type NavTab =
  | 'overview'
  | 'dtr'
  | 'payroll'
  | 'schedule'
  | 'annual'
  | 'termination';

export type PayFrequency = 'semi_monthly' | 'monthly';

export type DayType = 'regular' | 'rest_day' | 'special_holiday' | 'regular_holiday';

export type LeaveType = 'VL' | 'SL' | 'CTO' | 'SIL' | 'SPL';

export type TerminationCause =
  | 'resignation'
  | 'end_of_contract'
  | 'redundancy'
  | 'retrenchment'
  | 'retirement'
  | 'just_cause';

export interface DeMinimisPackage {
  riceSubsidy: number; // BIR cap: P2,000/mo
  uniformAllowance: number; // BIR cap: P6,000/yr = P500/mo
  laundryAllowance: number; // BIR cap: P300/mo
  medicalCash: number; // BIR cap: P10,000/yr = P833.33/mo
}

export interface LeaveBalances {
  vlDays: number;
  slDays: number;
  ctoHours: number;
}

export interface Employee {
  id: string;
  employeeNo: string;
  name: string;
  position: string;
  department: string;
  hireDate: string; // YYYY-MM-DD
  status: 'active' | 'resigned';
  monthlyBasic: number;
  workingDaysPerMonth: number; // typically 22 or 26
  shiftStart: string; // HH:mm e.g. '08:00'
  shiftEnd: string; // HH:mm e.g. '17:00'
  breakMinutes: number; // e.g. 60
  graceMinutes: number; // e.g. 10
  restDays: number[]; // 0=Sun..6=Sat e.g. [0, 6]
  deMinimis: DeMinimisPackage;
  leaveBalances: LeaveBalances;
  ytdBasicEarned: number; // Closed payroll basic earned before current cutoff
  ytdBonusesReceived: number; // Other bonuses already counted toward P90k threshold
  sssNo: string;
  philhealthNo: string;
  pagibigNo: string;
  tinNo: string;
}

export interface LiveTimeSession {
  employeeId: string;
  isClockedIn: boolean;
  isOnBreak: boolean;
  date: string; // YYYY-MM-DD
  clockInIso: string;
  breakStartIso?: string;
  accumulatedBreakMinutes: number;
  dayType: DayType;
  convertOtToCto: boolean;
}

export interface DtrEntry {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  dayType: DayType;
  timeIn: string; // HH:mm
  timeOut: string; // HH:mm
  breakMinutes: number;
  regularHours: number;
  lateMinutes: number;
  undertimeMinutes: number;
  overtimeHours: number;
  nightDiffHours: number;
  convertOtToCto: boolean;
  ctoHoursCredited: number;
  notes?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: LeaveType;
  date: string;
  hours: number;
  reason: string;
  status: 'approved' | 'pending';
  isPaid: boolean;
}

export interface StatutoryBreakdown {
  sss: {
    msc: number;
    regularEE: number;
    wispEE: number;
    totalEE: number;
    totalER: number;
  };
  philhealth: {
    baseSalary: number;
    totalEE: number;
    totalER: number;
  };
  pagibig: {
    baseSalary: number;
    totalEE: number;
    totalER: number;
  };
  withholdingTax: {
    taxableIncome: number;
    tax: number;
    bracketLabel: string;
    excessOver: number;
    baseTax: number;
    ratePct: number;
  };
}

export interface PayCalculationResult {
  frequency: PayFrequency;
  monthlyBasic: number;
  dailyRate: number;
  hourlyRate: number;
  basicPay: number;
  overtimePay: number;
  holidayRestPay: number;
  nightDiffPay: number;
  paidLeavePay: number;
  deMinimisNonTaxable: number;
  deMinimisTaxableExcess: number;
  taxableBonus: number;
  tardinessDeduction: number;
  undertimeDeduction: number;
  grossPay: number;
  statutory: StatutoryBreakdown;
  otherDeductions: number;
  totalDeductions: number;
  netPay: number;
  totalLateMinutes: number;
  totalUndertimeMinutes: number;
  totalRegularHours: number;
  totalPaidOtHours: number;
  totalNightDiffHours: number;
  totalCtoCreditedHours: number;
}

export interface ClosedPayrollRun {
  id: string;
  employeeId: string;
  periodLabel: string;
  frequency: PayFrequency;
  closedAt: string;
  basicPayEarned: number;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  sssEE: number;
  philhealthEE: number;
  pagibigEE: number;
  withholdingTax: number;
  taxableBonusIncluded: number;
}
