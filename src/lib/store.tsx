'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  ClosedPayrollRun,
  DayType,
  DeMinimisPackage,
  DtrEntry,
  Employee,
  LeaveRequest,
  LeaveType,
  LiveTimeSession,
  NavTab,
  UserRole,
} from '@/types';
import {
  INITIAL_CLOSED_PAY_RUNS,
  INITIAL_DTR_ENTRIES,
  INITIAL_EMPLOYEES,
  INITIAL_LEAVE_REQUESTS,
} from './mockData';
import { calculateDtrMetrics, round2 } from './phPayroll';

export interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

interface PamugasContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  employees: Employee[];
  selectedEmployeeId: string;
  setSelectedEmployeeId: (id: string) => void;
  activeEmployee: Employee;
  liveSessions: Record<string, LiveTimeSession>;
  activeLiveSession: LiveTimeSession | null;
  dtrEntries: DtrEntry[];
  leaveRequests: LeaveRequest[];
  closedPayRuns: ClosedPayrollRun[];
  clockIn: (dayType?: DayType, convertOtToCto?: boolean) => void;
  toggleBreak: () => void;
  clockOut: (notes?: string) => void;
  toggleLiveSessionCto: () => void;
  setLiveSessionDayType: (dayType: DayType) => void;
  addManualDtrEntry: (input: {
    date: string;
    dayType: DayType;
    timeIn: string;
    timeOut: string;
    breakMinutes: number;
    convertOtToCto: boolean;
    notes?: string;
  }) => void;
  toggleDtrEntryCto: (entryId: string) => void;
  deleteDtrEntry: (entryId: string) => void;
  updateEmployeeSchedule: (
    empId: string,
    patch: Partial<
      Pick<
        Employee,
        | 'shiftStart'
        | 'shiftEnd'
        | 'breakMinutes'
        | 'graceMinutes'
        | 'restDays'
        | 'workingDaysPerMonth'
        | 'monthlyBasic'
      >
    >
  ) => void;
  updateEmployeeDeMinimis: (empId: string, pkg: DeMinimisPackage) => void;
  addEmployee: (input: {
    name: string;
    position: string;
    department: string;
    monthlyBasic: number;
    shiftStart: string;
    shiftEnd: string;
  }) => void;
  createLeaveRequest: (input: {
    type: LeaveType;
    date: string;
    hours: number;
    reason: string;
    isPaid: boolean;
  }) => void;
  approveLeaveRequest: (leaveId: string) => void;
  postPayrollRun: (run: Omit<ClosedPayrollRun, 'id' | 'closedAt'>) => void;
  updateYtdBonuses: (empId: string, amount: number) => void;
  resetAllData: () => void;
  toast: ToastNotification | null;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  clearToast: () => void;
}

const STORAGE_KEY = 'pamugas_ph_payroll_dtr_v1';

const PamugasContext = createContext<PamugasContextType | undefined>(undefined);

function getManilaDateStr(d = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const y = parts.find((p) => p.type === 'year')?.value || '2026';
  const m = parts.find((p) => p.type === 'month')?.value || '01';
  const day = parts.find((p) => p.type === 'day')?.value || '01';
  return `${y}-${m}-${day}`;
}

function getManilaHHMM(d = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Manila',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const h = parts.find((p) => p.type === 'hour')?.value || '08';
  const min = parts.find((p) => p.type === 'minute')?.value || '00';
  return `${h === '24' ? '00' : h}:${min}`;
}

export function PamugasProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>('payroll_admin');
  const [activeTab, setActiveTabState] = useState<NavTab>('dtr');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('emp-juan');
  const [liveSessions, setLiveSessions] = useState<Record<string, LiveTimeSession>>({});
  const [dtrEntries, setDtrEntries] = useState<DtrEntry[]>(INITIAL_DTR_ENTRIES);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(INITIAL_LEAVE_REQUESTS);
  const [closedPayRuns, setClosedPayRuns] = useState<ClosedPayrollRun[]>(INITIAL_CLOSED_PAY_RUNS);
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<ToastNotification | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ id: String(Date.now()), message, type });
  };

  const clearToast = () => setToast(null);

  const setActiveTab = (tab: NavTab) => {
    setActiveTabState(tab);
    setIsSidebarOpen(false);
  };

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const applyTheme = (t: 'dark' | 'light') => {
    if (typeof document !== 'undefined') {
      if (t === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      }
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      return next;
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.employees?.length) setEmployees(parsed.employees);
          if (parsed.selectedEmployeeId) setSelectedEmployeeId(parsed.selectedEmployeeId);
          if (parsed.liveSessions) setLiveSessions(parsed.liveSessions);
          if (parsed.dtrEntries) setDtrEntries(parsed.dtrEntries);
          if (parsed.leaveRequests) setLeaveRequests(parsed.leaveRequests);
          if (parsed.closedPayRuns) setClosedPayRuns(parsed.closedPayRuns);
          if (parsed.theme) {
            setTheme(parsed.theme);
            applyTheme(parsed.theme);
          } else {
            applyTheme('light');
          }
          if (parsed.activeTab) setActiveTabState(parsed.activeTab);
          if (parsed.role) setRole(parsed.role);
        } else {
          applyTheme('light');
        }
      } catch {
        // Ignore corrupt cache
      }
      setHydrated(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          employees,
          selectedEmployeeId,
          liveSessions,
          dtrEntries,
          leaveRequests,
          closedPayRuns,
          theme,
          activeTab,
          role,
        })
      );
    } catch {
      // Ignore quota errors
    }
  }, [
    hydrated,
    employees,
    selectedEmployeeId,
    liveSessions,
    dtrEntries,
    leaveRequests,
    closedPayRuns,
    theme,
    activeTab,
    role,
  ]);

  const activeEmployee = useMemo(
    () => employees.find((e) => e.id === selectedEmployeeId) || employees[0],
    [employees, selectedEmployeeId]
  );

  const activeLiveSession = liveSessions[activeEmployee.id] || null;

  const clockIn = (dayType: DayType = 'regular', convertOtToCto = false) => {
    const now = new Date();
    const session: LiveTimeSession = {
      employeeId: activeEmployee.id,
      isClockedIn: true,
      isOnBreak: false,
      date: getManilaDateStr(now),
      clockInIso: now.toISOString(),
      accumulatedBreakMinutes: 0,
      dayType,
      convertOtToCto,
    };
    setLiveSessions((prev) => ({ ...prev, [activeEmployee.id]: session }));
    showToast(`${activeEmployee.name} clocked in at ${getManilaHHMM(now)} PHT`, 'success');
  };

  const toggleBreak = () => {
    const session = liveSessions[activeEmployee.id];
    if (!session || !session.isClockedIn) return;
    const now = new Date();

    if (!session.isOnBreak) {
      setLiveSessions((prev) => ({
        ...prev,
        [activeEmployee.id]: {
          ...session,
          isOnBreak: true,
          breakStartIso: now.toISOString(),
        },
      }));
      showToast('Break started — timer paused for unpaid break', 'info');
    } else {
      const breakStart = session.breakStartIso ? new Date(session.breakStartIso).getTime() : now.getTime();
      const addedMin = Math.max(1, Math.round((now.getTime() - breakStart) / 60000));
      setLiveSessions((prev) => ({
        ...prev,
        [activeEmployee.id]: {
          ...session,
          isOnBreak: false,
          breakStartIso: undefined,
          accumulatedBreakMinutes: session.accumulatedBreakMinutes + addedMin,
        },
      }));
      showToast(`Break ended (${addedMin} mins recorded)`, 'success');
    }
  };

  const toggleLiveSessionCto = () => {
    const session = liveSessions[activeEmployee.id];
    if (!session) return;
    setLiveSessions((prev) => ({
      ...prev,
      [activeEmployee.id]: { ...session, convertOtToCto: !session.convertOtToCto },
    }));
  };

  const setLiveSessionDayType = (dayType: DayType) => {
    const session = liveSessions[activeEmployee.id];
    if (!session) return;
    setLiveSessions((prev) => ({
      ...prev,
      [activeEmployee.id]: { ...session, dayType },
    }));
  };

  const clockOut = (notes = 'Live DTR clock session') => {
    const session = liveSessions[activeEmployee.id];
    if (!session || !session.isClockedIn) return;

    const now = new Date();
    const inDate = new Date(session.clockInIso);
    const timeIn = getManilaHHMM(inDate);
    let timeOut = getManilaHHMM(now);

    // If clicked quickly in demo (< 1 min), ensure minimum 1 min difference or log realistic time
    let totalBreak = session.accumulatedBreakMinutes;
    if (session.isOnBreak && session.breakStartIso) {
      totalBreak += Math.max(
        0,
        Math.round((now.getTime() - new Date(session.breakStartIso).getTime()) / 60000)
      );
    }

    if (timeOut === timeIn) {
      // Advance 1 minute for clean representation during instant testing
      const plusOne = new Date(inDate.getTime() + 60000);
      timeOut = getManilaHHMM(plusOne);
    }

    const metrics = calculateDtrMetrics({
      timeIn,
      timeOut,
      breakMinutes: totalBreak,
      dayType: session.dayType,
      shiftStart: activeEmployee.shiftStart,
      shiftEnd: activeEmployee.shiftEnd,
      graceMinutes: activeEmployee.graceMinutes,
      convertOtToCto: session.convertOtToCto,
    });

    const newEntry: DtrEntry = {
      id: `dtr-${Date.now()}`,
      employeeId: activeEmployee.id,
      date: session.date,
      dayType: session.dayType,
      timeIn,
      timeOut,
      breakMinutes: totalBreak,
      ...metrics,
      convertOtToCto: session.convertOtToCto,
      notes,
    };

    setDtrEntries((prev) => [newEntry, ...prev]);

    if (metrics.ctoHoursCredited > 0) {
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === activeEmployee.id
            ? {
                ...e,
                leaveBalances: {
                  ...e.leaveBalances,
                  ctoHours: round2(e.leaveBalances.ctoHours + metrics.ctoHoursCredited),
                },
              }
            : e
        )
      );
    }

    setLiveSessions((prev) => {
      const next = { ...prev };
      delete next[activeEmployee.id];
      return next;
    });

    showToast(
      `Clocked out at ${timeOut} PHT (${metrics.regularHours}h reg${
        metrics.ctoHoursCredited > 0 ? `, +${metrics.ctoHoursCredited}h CTO` : ''
      })`,
      'success'
    );
  };

  const addManualDtrEntry: PamugasContextType['addManualDtrEntry'] = (input) => {
    const metrics = calculateDtrMetrics({
      timeIn: input.timeIn,
      timeOut: input.timeOut,
      breakMinutes: input.breakMinutes,
      dayType: input.dayType,
      shiftStart: activeEmployee.shiftStart,
      shiftEnd: activeEmployee.shiftEnd,
      graceMinutes: activeEmployee.graceMinutes,
      convertOtToCto: input.convertOtToCto,
    });

    const entry: DtrEntry = {
      id: `dtr-${Date.now()}`,
      employeeId: activeEmployee.id,
      date: input.date,
      dayType: input.dayType,
      timeIn: input.timeIn,
      timeOut: input.timeOut,
      breakMinutes: input.breakMinutes,
      ...metrics,
      convertOtToCto: input.convertOtToCto,
      notes: input.notes || 'Manual DTR log',
    };

    setDtrEntries((prev) => [entry, ...prev]);
    if (metrics.ctoHoursCredited > 0) {
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === activeEmployee.id
            ? {
                ...e,
                leaveBalances: {
                  ...e.leaveBalances,
                  ctoHours: round2(e.leaveBalances.ctoHours + metrics.ctoHoursCredited),
                },
              }
            : e
        )
      );
    }
    showToast(`DTR entry added for ${input.date}`, 'success');
  };

  const toggleDtrEntryCto = (entryId: string) => {
    const target = dtrEntries.find((e) => e.id === entryId);
    if (!target) return;
    const emp = employees.find((e) => e.id === target.employeeId);
    if (!emp) return;

    const nextConvert = !target.convertOtToCto;
    const metrics = calculateDtrMetrics({
      timeIn: target.timeIn,
      timeOut: target.timeOut,
      breakMinutes: target.breakMinutes,
      dayType: target.dayType,
      shiftStart: emp.shiftStart,
      shiftEnd: emp.shiftEnd,
      graceMinutes: emp.graceMinutes,
      convertOtToCto: nextConvert,
    });

    const deltaCto = round2(metrics.ctoHoursCredited - target.ctoHoursCredited);

    setDtrEntries((prev) =>
      prev.map((e) =>
        e.id === entryId
          ? {
              ...e,
              convertOtToCto: nextConvert,
              ctoHoursCredited: metrics.ctoHoursCredited,
            }
          : e
      )
    );

    if (deltaCto !== 0) {
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === emp.id
            ? {
                ...e,
                leaveBalances: {
                  ...e.leaveBalances,
                  ctoHours: Math.max(0, round2(e.leaveBalances.ctoHours + deltaCto)),
                },
              }
            : e
        )
      );
    }

    showToast(
      nextConvert
        ? `Converted ${target.overtimeHours}h OT into +${metrics.ctoHoursCredited}h CTO credit`
        : 'Reverted OT hours back to cash overtime pay',
      'info'
    );
  };

  const deleteDtrEntry = (entryId: string) => {
    const target = dtrEntries.find((e) => e.id === entryId);
    if (!target) return;
    setDtrEntries((prev) => prev.filter((e) => e.id !== entryId));
    if (target.ctoHoursCredited > 0) {
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === target.employeeId
            ? {
                ...e,
                leaveBalances: {
                  ...e.leaveBalances,
                  ctoHours: Math.max(0, round2(e.leaveBalances.ctoHours - target.ctoHoursCredited)),
                },
              }
            : e
        )
      );
    }
    showToast('DTR record removed', 'info');
  };

  const updateEmployeeSchedule: PamugasContextType['updateEmployeeSchedule'] = (empId, patch) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === empId ? { ...e, ...patch } : e))
    );
    showToast('Schedule & salary settings updated', 'success');
  };

  const updateEmployeeDeMinimis = (empId: string, pkg: DeMinimisPackage) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === empId ? { ...e, deMinimis: pkg } : e))
    );
    showToast('De Minimis benefit package updated', 'success');
  };

  const addEmployee: PamugasContextType['addEmployee'] = (input) => {
    const id = `emp-${Date.now()}`;
    const num = String(employees.length + 1).padStart(3, '0');
    const newEmp: Employee = {
      id,
      employeeNo: `EMP-2026-${num}`,
      name: input.name,
      position: input.position,
      department: input.department,
      hireDate: getManilaDateStr(),
      status: 'active',
      monthlyBasic: input.monthlyBasic,
      workingDaysPerMonth: 22,
      shiftStart: input.shiftStart,
      shiftEnd: input.shiftEnd,
      breakMinutes: 60,
      graceMinutes: 10,
      restDays: [0, 6],
      deMinimis: {
        riceSubsidy: 2000,
        uniformAllowance: 500,
        laundryAllowance: 300,
        medicalCash: 500,
      },
      leaveBalances: {
        vlDays: 10,
        slDays: 10,
        ctoHours: 0,
      },
      ytdBasicEarned: input.monthlyBasic * 6,
      ytdBonusesReceived: 0,
      sssNo: '34-0000000-0',
      philhealthNo: '02-000000000-0',
      pagibigNo: '1210-0000-0000',
      tinNo: '000-000-000-000',
    };
    setEmployees((prev) => [...prev, newEmp]);
    setSelectedEmployeeId(id);
    showToast(`Added ${input.name} to PH Payroll roster`, 'success');
  };

  const createLeaveRequest: PamugasContextType['createLeaveRequest'] = (input) => {
    const req: LeaveRequest = {
      id: `lv-${Date.now()}`,
      employeeId: activeEmployee.id,
      type: input.type,
      date: input.date,
      hours: input.hours,
      reason: input.reason,
      status: role === 'payroll_admin' ? 'approved' : 'pending',
      isPaid: input.isPaid,
    };

    setLeaveRequests((prev) => [req, ...prev]);

    if (req.status === 'approved') {
      setEmployees((prev) =>
        prev.map((e) => {
          if (e.id !== activeEmployee.id) return e;
          const b = { ...e.leaveBalances };
          if (input.type === 'CTO') b.ctoHours = Math.max(0, round2(b.ctoHours - input.hours));
          if (input.type === 'VL' || input.type === 'SIL') {
            b.vlDays = Math.max(0, round2(b.vlDays - input.hours / 8));
          }
          if (input.type === 'SL') b.slDays = Math.max(0, round2(b.slDays - input.hours / 8));
          return { ...e, leaveBalances: b };
        })
      );
    }

    showToast(
      req.status === 'approved'
        ? `${input.type} leave (${input.hours}h) approved and reflected in pay run`
        : `${input.type} leave request submitted for approval`,
      'success'
    );
  };

  const approveLeaveRequest = (leaveId: string) => {
    const target = leaveRequests.find((l) => l.id === leaveId);
    if (!target || target.status === 'approved') return;

    setLeaveRequests((prev) =>
      prev.map((l) => (l.id === leaveId ? { ...l, status: 'approved' } : l))
    );

    setEmployees((prev) =>
      prev.map((e) => {
        if (e.id !== target.employeeId) return e;
        const b = { ...e.leaveBalances };
        if (target.type === 'CTO') b.ctoHours = Math.max(0, round2(b.ctoHours - target.hours));
        if (target.type === 'VL' || target.type === 'SIL') {
          b.vlDays = Math.max(0, round2(b.vlDays - target.hours / 8));
        }
        if (target.type === 'SL') b.slDays = Math.max(0, round2(b.slDays - target.hours / 8));
        return { ...e, leaveBalances: b };
      })
    );
    showToast('Leave approved and deducted from balance', 'success');
  };

  const postPayrollRun = (run: Omit<ClosedPayrollRun, 'id' | 'closedAt'>) => {
    const record: ClosedPayrollRun = {
      ...run,
      id: `run-${Date.now()}`,
      closedAt: new Date().toISOString(),
    };
    setClosedPayRuns((prev) => [record, ...prev]);
    setEmployees((prev) =>
      prev.map((e) =>
        e.id === run.employeeId
          ? {
              ...e,
              ytdBasicEarned: round2(e.ytdBasicEarned + run.basicPayEarned),
              ytdBonusesReceived: round2(e.ytdBonusesReceived + run.taxableBonusIncluded),
            }
          : e
      )
    );
    showToast(
      `Posted payroll run (${run.periodLabel}) — 13th Month & ₱90k YTD updated`,
      'success'
    );
  };

  const updateYtdBonuses = (empId: string, amount: number) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === empId ? { ...e, ytdBonusesReceived: Math.max(0, amount) } : e))
    );
  };

  const resetAllData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setEmployees(INITIAL_EMPLOYEES);
    setSelectedEmployeeId('emp-juan');
    setLiveSessions({});
    setDtrEntries(INITIAL_DTR_ENTRIES);
    setLeaveRequests(INITIAL_LEAVE_REQUESTS);
    setClosedPayRuns(INITIAL_CLOSED_PAY_RUNS);
    showToast('Reset all DTR & Payroll data to defaults', 'info');
  };

  return (
    <PamugasContext.Provider
      value={{
        role,
        setRole,
        activeTab,
        setActiveTab,
        isSidebarOpen,
        setIsSidebarOpen,
        toggleSidebar,
        theme,
        toggleTheme,
        employees,
        selectedEmployeeId,
        setSelectedEmployeeId,
        activeEmployee,
        liveSessions,
        activeLiveSession,
        dtrEntries,
        leaveRequests,
        closedPayRuns,
        clockIn,
        toggleBreak,
        clockOut,
        toggleLiveSessionCto,
        setLiveSessionDayType,
        addManualDtrEntry,
        toggleDtrEntryCto,
        deleteDtrEntry,
        updateEmployeeSchedule,
        updateEmployeeDeMinimis,
        addEmployee,
        createLeaveRequest,
        approveLeaveRequest,
        postPayrollRun,
        updateYtdBonuses,
        resetAllData,
        toast,
        showToast,
        clearToast,
      }}
    >
      {children}
    </PamugasContext.Provider>
  );
}

export function usePamugas() {
  const ctx = useContext(PamugasContext);
  if (!ctx) throw new Error('usePamugas must be used inside PamugasProvider');
  return ctx;
}
