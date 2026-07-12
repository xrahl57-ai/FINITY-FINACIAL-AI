/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum AccountType {
  ASSET = "ASSET",
  LIABILITY = "LIABILITY",
  EQUITY = "EQUITY",
  REVENUE = "REVENUE",
  EXPENSE = "EXPENSE",
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  code: string; // e.g. "1000", "2000"
  balance: number;
  description: string;
  isSystem: boolean; // System accounts like Cash, Accounts Receivable, etc.
}

export interface JournalLine {
  accountId: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  reference?: string;
  status: "draft" | "posted" | "void";
  lines: JournalLine[];
  auditLogs: string[];
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  accountId: string; // The primary account (e.g., Cash or Bank)
  offsetAccountId: string; // The offsetting account (e.g., Revenue or Rent Expense)
  amount: number; // positive for positive change, negative for negative change in primary account
  category: string;
  type: "income" | "expense" | "transfer";
  status: "posted" | "pending" | "void";
  reference?: string;
  isRecurring?: boolean;
  recurrenceInterval?: "monthly" | "weekly" | "annually";
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  productId?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  date: string;
  dueDate: string;
  status: "draft" | "sent" | "paid" | "overdue";
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number; // e.g. 0.05 for 5%
  taxAmount: number;
  total: number;
  balanceDue: number;
  payments: {
    date: string;
    amount: number;
    method: string;
  }[];
  remindersSentCount: number;
}

export interface BillItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Bill {
  id: string;
  billNumber: string;
  supplierId: string;
  supplierName: string;
  date: string;
  dueDate: string;
  status: "received" | "paid" | "overdue";
  items: BillItem[];
  total: number;
  balanceDue: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  stockLevel: number;
  safetyStock: number;
  unitPrice: number;
  costPrice: number;
  category: string;
  supplierId?: string;
}

export interface Partner {
  id: string;
  name: string;
  type: "customer" | "supplier" | "employee";
  email: string;
  phone: string;
  address: string;
  balance: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  budget: number;
  cost: number;
  status: "active" | "completed";
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  spent: number;
  period: string; // e.g., "2026-07"
}

export interface Receipt {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  category: string;
  taxAmount: number;
  fileName: string;
  fileData?: string; // base64 representation if uploaded
  status: "extracted" | "linked" | "pending";
  linkedTransactionId?: string;
}

export interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number; // positive is deposit, negative is withdrawal
  reconciled: boolean;
}

export interface BankConnection {
  id: string;
  bankName: string;
  accountNumber: string;
  balance: number;
  lastSynced: string;
  transactions: BankTransaction[];
}

export interface DigitalWallet {
  id: string;
  name: string;
  currency: string;
  balance: number;
  provider: string;
  lastUpdated: string;
}

export interface PaymentGateway {
  id: string;
  name: string;
  status: "connected" | "disconnected" | "error";
  environment: "sandbox" | "live";
  credentialsType: "OAuth" | "API Key" | "Token";
  lastPing: string;
}

export interface ActivePayment {
  id: string;
  date: string;
  type: "supplier" | "payroll" | "refund" | "recurring";
  amount: number;
  currency: string;
  recipientName: string;
  status: "completed" | "pending" | "failed";
  routingPath: string;
  settlementTime: string;
  exchangeRateUsed?: number;
  sourceType: "bank" | "wallet";
  sourceId: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  user: string;
}

export interface FinityState {
  accounts: Account[];
  transactions: Transaction[];
  journalEntries: JournalEntry[];
  invoices: Invoice[];
  bills: Bill[];
  products: Product[];
  partners: Partner[];
  projects: Project[];
  budgets: Budget[];
  receipts: Receipt[];
  bankConnections: BankConnection[];
  auditLogs: AuditLog[];
  accountingPeriod?: "active" | "closed";
  fiscalYearClosed?: boolean;
  wallets?: DigitalWallet[];
  paymentGateways?: PaymentGateway[];
  activePayments?: ActivePayment[];
  exchangeRates?: Record<string, number>;
  isOnboarded?: boolean;
  userCredentials?: {
    email: string;
    password?: string;
    fullName?: string;
  };
  companyProfile?: {
    name: string;
    currency?: string;
    legalName?: string;
    registrationNumber?: string;
    businessType: string;
    industry: string;
    companySize: string;
    employees?: string;
    logo?: string;
    website?: string;
    country: string;
    state?: string;
    city?: string;
    address?: string;
    postalCode?: string;
    timezone: string;
    language: string;
    taxNumber?: string;
    taxSettings?: string;
    mfaEnabled?: boolean;
    approvalLimit?: number;
    departments?: string[];
    branches?: string[];
    costCenters?: string[];
    onboardedAt?: string;
    description?: string;
    email?: string;
    phone?: string;
    contactInfo?: string;
  };
  personalProfile?: {
    name: string;
    country: string;
    currency: string;
    timezone: string;
    language: string;
    goals?: string;
    onboardedAt?: string;
  };
}
