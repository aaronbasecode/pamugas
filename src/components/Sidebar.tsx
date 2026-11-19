'use client';

import React, { useState } from 'react';
import { usePamugas } from '@/lib/store';
import { NavTab } from '@/types';
import { formatPhp } from '@/lib/phPayroll';
import {
  Clock,
  Calculator,
  CalendarClock,
  Award,
  FileOutput,
  LayoutGrid,
  ShieldCheck,
  UserCheck,
  RotateCcw,
  Users,
  X,
  Plus,
} from 'lucide-react';

export default function Sidebar() {
  const {
    role,
    setRole,
    activeTab,
    setActiveTab,
    isSidebarOpen,
    setIsSidebarOpen,
    employees,
    selectedEmployeeId,
    setSelectedEmployeeId,
    activeEmployee,
    activeLiveSession,
    dtrEntries,
    leaveRequests,
    closedPayRuns,
    addEmployee,
    resetAllData,
  } = usePamugas();

  const [showAddEmp, setShowAddEmp] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [newDept, setNewDept] = useState('Operations');
  const [newBasic, setNewBasic] = useState('35000');

  const empDtrCount = dtrEntries.filter((d) => d.employeeId === activeEmployee.id).length;
  const pendingLeaves = leaveRequests.filter((l) => l.status === 'pending').length;
  const empRuns = closedPayRuns.filter((r) => r.employeeId === activeEmployee.id).length;

  const navItems: {
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: { text: string; isAlert?: boolean };
  }[] = [
    {
      id: 'overview',
      label: 'Dashboard Overview',
      icon: LayoutGrid,
    },
    {
      id: 'dtr',
      label: 'Timekeeping & DTR',
      icon: Clock,
      badge: activeLiveSession?.isClockedIn
        ? { text: 'LIVE', isAlert: true }
        : { text: `${empDtrCount} logs` },
    },
    {
      id: 'payroll',
      label: 'Payroll & PH Deductions',
      icon: Calculator,
      badge: { text: empRuns > 0 ? `${empRuns} runs` : 'TRAIN' },
    },
    {
      id: 'schedule',
      label: 'Schedule, Leave & CTO',
      icon: CalendarClock,
      badge:
        pendingLeaves > 0
          ? { text: `${pendingLeaves} req`, isAlert: true }
          : { text: `${activeEmployee.leaveBalances.ctoHours}h CTO` },
    },
    {
      id: 'annual',
      label: '13th Month & ₱90k Cap',
      icon: Award,
    },
    {
      id: 'termination',
      label: 'Termination & Final Pay',
      icon: FileOutput,
    },
  ];

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPosition.trim()) return;
    addEmployee({
      name: newName.trim(),
      position: newPosition.trim(),
      department: newDept.trim() || 'Operations',
      monthlyBasic: Math.max(5000, Number(newBasic) || 25000),
      shiftStart: '08:00',
      shiftEnd: '17:00',
    });
    setNewName('');
    setNewPosition('');
    setNewBasic('35000');
    setShowAddEmp(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full w-full justify-between px-4 py-5 min-w-0">
      {/* Top: Brand & Employee Context */}
      <div className="space-y-5 min-w-0">
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-blue-600 to-emerald-500 text-white font-bold shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  Pamugas
                </span>
                <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:text-sky-400 shrink-0">
                  PH Payroll
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                DTR &amp; Statutory Tracker
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Employee Roster Switcher */}
        <div className="rounded-2xl bg-slate-100/80 dark:bg-slate-950/60 p-3 space-y-2.5 min-w-0">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Users className="h-3 w-3 text-sky-500" />
              Active Employee
            </span>
            <button
              onClick={() => setShowAddEmp((v) => !v)}
              className="inline-flex items-center gap-0.5 rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:text-sky-400 hover:bg-sky-500/25 transition"
            >
              <Plus className="h-3 w-3" />
              Add
            </button>
          </div>

          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="w-full min-w-0 rounded-xl bg-white dark:bg-slate-900 px-2.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 cursor-pointer truncate"
          >
            {employees.map((emp) => (
              <option
                key={emp.id}
                value={emp.id}
                className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200"
              >
                {emp.name} — {emp.position}
              </option>
            ))}
          </select>

          <div className="flex items-center justify-between text-[11px] pt-0.5">
            <span className="text-slate-500 dark:text-slate-400 truncate">
              {activeEmployee.shiftStart}–{activeEmployee.shiftEnd}
            </span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
              {formatPhp(activeEmployee.monthlyBasic)}/mo
            </span>
          </div>

          {showAddEmp && (
            <form
              onSubmit={handleCreateEmployee}
              className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2 animate-fade-in"
            >
              <input
                type="text"
                placeholder="Full Name (e.g. Bea Reyes)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="w-full rounded-lg bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800"
              />
              <input
                type="text"
                placeholder="Position (e.g. Accountant)"
                value={newPosition}
                onChange={(e) => setNewPosition(e.target.value)}
                required
                className="w-full rounded-lg bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800"
              />
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="text"
                  placeholder="Department"
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  className="w-full rounded-lg bg-white dark:bg-slate-900 px-2 py-1.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800"
                />
                <input
                  type="number"
                  placeholder="Basic PHP"
                  value={newBasic}
                  onChange={(e) => setNewBasic(e.target.value)}
                  min={5000}
                  step={500}
                  className="w-full rounded-lg bg-white dark:bg-slate-900 px-2 py-1.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800"
                />
              </div>
              <div className="flex gap-1.5">
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-sky-600 py-1.5 text-[11px] font-bold text-white hover:bg-sky-500 transition"
                >
                  Save Employee
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddEmp(false)}
                  className="rounded-lg bg-slate-200 dark:bg-slate-800 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Navigation Links */}
        <div className="space-y-1 min-w-0">
          <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">
            Payroll Suite
          </span>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full min-w-0 flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 text-left ${
                    isActive
                      ? 'bg-sky-600 text-white font-bold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ml-2 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : item.badge.isAlert
                          ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 animate-pulse'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {item.badge.text}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800/60 min-w-0">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block px-2">
            Portal Role
          </span>
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 dark:bg-slate-950/80 p-1 text-xs">
            <button
              onClick={() => setRole('payroll_admin')}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 font-bold transition-all ${
                role === 'payroll_admin'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>HR Admin</span>
            </button>
            <button
              onClick={() => setRole('employee_self')}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 font-bold transition-all ${
                role === 'employee_self'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Employee</span>
            </button>
          </div>
        </div>

        <button
          onClick={resetAllData}
          title="Reset demo payroll & DTR records"
          className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-950/80 px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset Demo Data</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex flex-col w-72 shrink-0 h-screen sticky top-0 bg-white dark:bg-slate-900 overflow-y-auto overflow-x-hidden transition-colors z-30 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {sidebarContent}
      </aside>

      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden animate-fade-in flex">
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative w-72 max-w-[85vw] h-full bg-white dark:bg-slate-900 overflow-y-auto overflow-x-hidden z-10 transition-colors [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
