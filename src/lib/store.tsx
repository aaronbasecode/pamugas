'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Client, Deliverable, Invoice, Contract, UserRole, PaymentRail } from '@/types';
import {
  INITIAL_CLIENTS,
  INITIAL_DELIVERABLES,
  INITIAL_INVOICES,
  INITIAL_CONTRACTS,
} from './mockData';
import { calculateNextClient9AM } from './timezone';

interface PamugasContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;
  clients: Client[];
  deliverables: Deliverable[];
  invoices: Invoice[];
  contracts: Contract[];
  activeClient: Client | undefined;
  fxRate: number;
  refreshFxRate: () => Promise<void>;
  fxRateLoading: boolean;
  addDeliverable: (deliverable: Omit<Deliverable, 'id' | 'submittedAtPht' | 'scheduledClientRelease' | 'revisionCount' | 'status'>) => void;
  approveDeliverable: (deliverableId: string) => { success: boolean; message: string };
  requestRevision: (deliverableId: string, feedback: string) => { success: boolean; message: string };
  createInvoice: (invoice: Omit<Invoice, 'id' | 'status'>) => void;
  markInvoicePaid: (invoiceId: string) => void;
  signContract: (contractId: string, signatureName: string) => void;
  resetAllData: () => void;
}

const STORAGE_KEY = 'pamugas_app_state_v1';

const PamugasContext = createContext<PamugasContextType | undefined>(undefined);

export function PamugasProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>('agency_admin');
  const [selectedClientId, setSelectedClientId] = useState<string>('client-apex');
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [deliverables, setDeliverables] = useState<Deliverable[]>(INITIAL_DELIVERABLES);
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [contracts, setContracts] = useState<Contract[]>(INITIAL_CONTRACTS);
  const [fxRate, setFxRate] = useState<number>(58.85);
  const [fxRateLoading, setFxRateLoading] = useState<boolean>(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.clients) setClients(parsed.clients);
        if (parsed.deliverables) setDeliverables(parsed.deliverables);
        if (parsed.invoices) setInvoices(parsed.invoices);
        if (parsed.contracts) setContracts(parsed.contracts);
        if (parsed.role) setRole(parsed.role);
        if (parsed.selectedClientId) setSelectedClientId(parsed.selectedClientId);
      }
    } catch (e) {
      console.warn('Failed to parse cached state', e);
    } finally {
      setHydrated(true);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          clients,
          deliverables,
          invoices,
          contracts,
          role,
          selectedClientId,
        })
      );
    } catch (e) {
      console.warn('Failed to cache state', e);
    }
  }, [clients, deliverables, invoices, contracts, role, selectedClientId, hydrated]);

  // Fetch live FX rate
  const refreshFxRate = async () => {
    setFxRateLoading(true);
    try {
      const res = await fetch('/api/fx-rate');
      if (res.ok) {
        const data = await res.json();
        if (data.rate) setFxRate(data.rate);
      }
    } catch (err) {
      console.error('Error fetching FX rate', err);
    } finally {
      setFxRateLoading(false);
    }
  };

  useEffect(() => {
    refreshFxRate();
  }, []);

  const activeClient = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId) || clients[0];
  }, [clients, selectedClientId]);

  // Add Deliverable
  const addDeliverable = (
    data: Omit<Deliverable, 'id' | 'submittedAtPht' | 'scheduledClientRelease' | 'revisionCount' | 'status'>
  ) => {
    const targetClient = clients.find((c) => c.id === data.clientId) || activeClient;
    const nowIso = new Date().toISOString();

    let scheduledRelease = nowIso;
    if (data.smartDispatch && targetClient) {
      scheduledRelease = calculateNextClient9AM(targetClient.timezone);
    }

    const newDeliverable: Deliverable = {
      ...data,
      id: `DEL-${Math.floor(100 + Math.random() * 900)}`,
      submittedAtPht: nowIso,
      scheduledClientRelease: scheduledRelease,
      status: 'pending_review',
      revisionCount: 0,
    };

    setDeliverables((prev) => [newDeliverable, ...prev]);
  };

  // Approve Deliverable (Atomic State change)
  const approveDeliverable = (deliverableId: string) => {
    const item = deliverables.find((d) => d.id === deliverableId);
    if (!item) return { success: false, message: 'Deliverable not found' };

    setDeliverables((prev) =>
      prev.map((d) =>
        d.id === deliverableId
          ? {
              ...d,
              status: 'approved',
              approvedAt: new Date().toISOString(),
            }
          : d
      )
    );
    return { success: true, message: 'Deliverable approved successfully!' };
  };

  // Request Revision with quota enforcement
  const requestRevision = (deliverableId: string, feedback: string) => {
    const item = deliverables.find((d) => d.id === deliverableId);
    if (!item) return { success: false, message: 'Deliverable not found' };

    const client = clients.find((c) => c.id === item.clientId);
    if (!client) return { success: false, message: 'Client not found' };

    // Check revision quota
    if (client.revisionsUsed >= client.revisionsMax) {
      return {
        success: false,
        message: `Revision quota exceeded (${client.revisionsUsed}/${client.revisionsMax} used). Additional revisions are billed at $65/hr as per contract SLA.`,
      };
    }

    // Increment client revision count
    setClients((prev) =>
      prev.map((c) =>
        c.id === client.id ? { ...c, revisionsUsed: c.revisionsUsed + 1 } : c
      )
    );

    // Update deliverable
    setDeliverables((prev) =>
      prev.map((d) =>
        d.id === deliverableId
          ? {
              ...d,
              status: 'revision_requested',
              feedback,
              revisionCount: d.revisionCount + 1,
            }
          : d
      )
    );

    return {
      success: true,
      message: `Revision requested (${client.revisionsUsed + 1}/${client.revisionsMax} quota used).`,
    };
  };

  // Create Invoice
  const createInvoice = (invoiceData: Omit<Invoice, 'id' | 'status'>) => {
    const newInvoice: Invoice = {
      ...invoiceData,
      id: `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
      status: 'unpaid',
    };
    setInvoices((prev) => [newInvoice, ...prev]);
  };

  // Mark Paid
  const markInvoicePaid = (invoiceId: string) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId
          ? { ...inv, status: 'paid', paidAt: new Date().toISOString().split('T')[0] }
          : inv
      )
    );
  };

  // Sign Contract
  const signContract = (contractId: string, signatureName: string) => {
    setContracts((prev) =>
      prev.map((ctr) =>
        ctr.id === contractId
          ? {
              ...ctr,
              signedByClient: true,
              signedDate: new Date().toISOString().split('T')[0],
              signatureName,
            }
          : ctr
      )
    );
  };

  // Reset to initial
  const resetAllData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setClients(INITIAL_CLIENTS);
    setDeliverables(INITIAL_DELIVERABLES);
    setInvoices(INITIAL_INVOICES);
    setContracts(INITIAL_CONTRACTS);
    setRole('agency_admin');
    setSelectedClientId('client-apex');
  };

  return (
    <PamugasContext.Provider
      value={{
        role,
        setRole,
        selectedClientId,
        setSelectedClientId,
        clients,
        deliverables,
        invoices,
        contracts,
        activeClient,
        fxRate,
        refreshFxRate,
        fxRateLoading,
        addDeliverable,
        approveDeliverable,
        requestRevision,
        createInvoice,
        markInvoicePaid,
        signContract,
        resetAllData,
      }}
    >
      {children}
    </PamugasContext.Provider>
  );
}

export function usePamugas() {
  const context = useContext(PamugasContext);
  if (!context) {
    throw new Error('usePamugas must be used within a PamugasProvider');
  }
  return context;
}
