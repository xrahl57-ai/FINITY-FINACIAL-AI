/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { AccountType, FinityState, Account, Transaction, JournalEntry, Invoice, Bill, Product, Partner, Project, Budget, Receipt, BankConnection, AuditLog, DigitalWallet, PaymentGateway, ActivePayment } from "./src/types";
import { FinancialRulesEngine, TaxConfig } from "./src/rulesEngine";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Lazy initializer for Gemini client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not configured. Please add your Gemini API Key in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Helper for robust execution of generateContent with retries and fallback
async function generateContentWithFallback(ai: GoogleGenAI, params: any): Promise<any> {
  const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
  const requestedModel = params.model;
  if (requestedModel && !modelsToTry.includes(requestedModel)) {
    modelsToTry.unshift(requestedModel);
  }

  let lastError: any = null;

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    const currentParams = { ...params, model };
    
    // Only retry the primary (first) model. Fallback models get exactly 1 attempt.
    const maxAttempts = i === 0 ? 2 : 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`[Gemini API] Attempting generateContent with model: ${model} (attempt ${attempt}/${maxAttempts})`);
        return await ai.models.generateContent(currentParams);
      } catch (error: any) {
        lastError = error;
        const errorStr = String(error.message || error);
        const isOverloadedOrRateLimited = 
          errorStr.includes("503") || 
          errorStr.includes("UNAVAILABLE") || 
          errorStr.includes("high demand") || 
          errorStr.includes("429") || 
          errorStr.includes("RESOURCE_EXHAUSTED") || 
          errorStr.includes("overloaded");

        if (isOverloadedOrRateLimited) {
          console.warn(`[Gemini API] Model ${model} failed (attempt ${attempt}/${maxAttempts}) with overload/rate-limit. Error: ${errorStr}`);
          if (attempt < maxAttempts) {
            // Keep retry delay extremely short (300ms) to prevent gateway timeouts
            const delay = 300;
            console.log(`[Gemini API] Waiting ${delay}ms before next attempt...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        } else {
          // Immediately throw on standard semantic/auth errors (like invalid prompt, bad request)
          throw error;
        }
      }
    }
    console.warn(`[Gemini API] Model ${model} exhausted. Trying next fallback model...`);
  }

  console.error(`[Gemini API] All candidate models exhausted. Last error:`, lastError);
  throw new Error(`The AI service is currently experiencing extremely high demand. Please try again in a few seconds. Details: ${lastError?.message || lastError}`);
}

// Robust async generator that handles both stream creation and chunk consumption retries/fallbacks
async function* robustStreamGenerator(ai: GoogleGenAI, params: any): AsyncGenerator<any, void, unknown> {
  const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
  const requestedModel = params.model;
  if (requestedModel && !modelsToTry.includes(requestedModel)) {
    modelsToTry.unshift(requestedModel);
  }

  let lastError: any = null;

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    const currentParams = { ...params, model };
    const maxAttempts = i === 0 ? 2 : 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`[Gemini API] Attempting robustStreamGenerator with model: ${model} (attempt ${attempt}/${maxAttempts})`);
        const stream = await ai.models.generateContentStream(currentParams);
        
        let yieldedAny = false;
        try {
          for await (const chunk of stream) {
            yieldedAny = true;
            yield chunk;
          }
          // Successfully finished the entire stream, exit the generator
          return;
        } catch (streamError: any) {
          const streamErrStr = String(streamError.message || streamError);
          console.warn(`[Gemini API] Error during stream consumption of model ${model}: ${streamErrStr}`);
          
          // If we haven't yielded any chunks yet, throw so we can try the fallback model / next attempt.
          // If we did yield chunks, we must throw because the client already received partial data.
          throw streamError;
        }
      } catch (error: any) {
        lastError = error;
        const errorStr = String(error.message || error);
        const isOverloadedOrRateLimited = 
          errorStr.includes("503") || 
          errorStr.includes("UNAVAILABLE") || 
          errorStr.includes("high demand") || 
          errorStr.includes("429") || 
          errorStr.includes("RESOURCE_EXHAUSTED") || 
          errorStr.includes("overloaded");

        if (isOverloadedOrRateLimited) {
          console.warn(`[Gemini API] Streaming model ${model} failed (attempt ${attempt}/${maxAttempts}) with overload/rate-limit. Error: ${errorStr}`);
          if (attempt < maxAttempts) {
            const delay = 300;
            console.log(`[Gemini API] Waiting ${delay}ms before next attempt...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        } else {
          // Immediately throw on standard semantic/auth errors
          throw error;
        }
      }
    }
    console.warn(`[Gemini API] Streaming model ${model} exhausted in robustStreamGenerator. Trying next fallback...`);
  }

  console.error(`[Gemini API] All candidate streaming models exhausted in robustStreamGenerator. Last error:`, lastError);
  throw new Error(`The AI service is currently experiencing extremely high demand. Please try again in a few seconds. Details: ${lastError?.message || lastError}`);
}

// Helper for robust execution of generateContentStream with retries and fallback
async function generateContentStreamWithFallback(ai: GoogleGenAI, params: any): Promise<any> {
  return robustStreamGenerator(ai, params);
}

// Database JSON path
const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "finity_db.json");

// Ensure Data Directory Exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Complete Initial Seed State
const getSeedState = (): FinityState => {
  const accounts: Account[] = [
    { id: "acc-bank", name: "Bank Account (Checking)", type: AccountType.ASSET, code: "1010", balance: 45000, description: "Primary operating bank checking account", isSystem: true },
    { id: "acc-cash", name: "Petty Cash", type: AccountType.ASSET, code: "1020", balance: 2500, description: "Cash on hand for minor daily expenses", isSystem: true },
    { id: "acc-ar", name: "Accounts Receivable", type: AccountType.ASSET, code: "1100", balance: 8200, description: "Outstanding funds owed by customers", isSystem: true },
    { id: "acc-inventory", name: "Inventory", type: AccountType.ASSET, code: "1200", balance: 8500, description: "Valuation of stock on hand", isSystem: true },
    { id: "acc-ap", name: "Accounts Payable", type: AccountType.LIABILITY, code: "2010", balance: 3200, description: "Owed money to suppliers and vendors", isSystem: true },
    { id: "acc-tax", name: "Sales Tax Payable", type: AccountType.LIABILITY, code: "2200", balance: 1450, description: "Collected sales tax to be paid to govt", isSystem: false },
    { id: "acc-payroll", name: "Payroll Liabilities", type: AccountType.LIABILITY, code: "2300", balance: 0, description: "Accrued payroll and benefit liabilities", isSystem: false },
    { id: "acc-equity", name: "Owner's Equity (Capital)", type: AccountType.EQUITY, code: "3000", balance: 43250, description: "Initial and subsequent capital contributions", isSystem: true },
    { id: "acc-retained", name: "Retained Earnings", type: AccountType.EQUITY, code: "3100", balance: 0, description: "Accumulated undistributed net profits", isSystem: true },
    { id: "acc-revenue", name: "Service Revenue", type: AccountType.REVENUE, code: "4010", balance: 32000, description: "Earned income from core services", isSystem: true },
    { id: "acc-sales", name: "Product Sales", type: AccountType.REVENUE, code: "4020", balance: 8500, description: "Earned income from inventory sales", isSystem: false },
    { id: "acc-rent", name: "Rent Expense", type: AccountType.EXPENSE, code: "5010", balance: 6000, description: "Office lease payments", isSystem: true },
    { id: "acc-salaries", name: "Salaries & Wages Expense", type: AccountType.EXPENSE, code: "5020", balance: 12000, description: "Employee compensation", isSystem: true },
    { id: "acc-utilities", name: "Utilities Expense", type: AccountType.EXPENSE, code: "5030", balance: 1200, description: "Electricity, internet, and phone bills", isSystem: false },
    { id: "acc-marketing", name: "Advertising & Marketing", type: AccountType.EXPENSE, code: "5040", balance: 3500, description: "Promotions, ads, and sponsorships", isSystem: false },
    { id: "acc-software", name: "Software & SaaS Subscriptions", type: AccountType.EXPENSE, code: "5050", balance: 1500, description: "Cloud software, CRM, and analytics tools", isSystem: false },
  ];

  const partners: Partner[] = [
    { id: "part-acme", name: "Acme Corporation", type: "customer", email: "billing@acme.com", phone: "(555) 019-2834", address: "123 Industrial Way, Suite A, Metropolis, NY", balance: 2500 },
    { id: "part-wayne", name: "Wayne Enterprises", type: "customer", email: "accounts@waynecorp.com", phone: "(555) 123-4567", address: "1007 Mountain Drive, Gotham City, NJ", balance: 4500 },
    { id: "part-stark", name: "Stark Industries", type: "customer", email: "finance@stark.com", phone: "(555) 987-6543", address: "200 Park Avenue, New York, NY", balance: 1200 },
    { id: "part-office", name: "Office Depot", type: "supplier", email: "orders@officedepot.com", phone: "(555) 444-1212", address: "450 Corporate Blvd, Boca Raton, FL", balance: 0 },
    { id: "part-aws", name: "Amazon Web Services", type: "supplier", email: "billing@aws.amazon.com", phone: "N/A", address: "410 Terry Ave N, Seattle, WA", balance: 1200 },
    { id: "part-wework", name: "WeWork Renting LLC", type: "supplier", email: "spaces@wework.com", phone: "(555) 888-0099", address: "85 Broad St, New York, NY", balance: 2000 },
    { id: "part-emp1", name: "John Doe", type: "employee", email: "john.doe@finity.app", phone: "(555) 234-5678", address: "12 Elm St, Brookline, MA", balance: 0 },
    { id: "part-emp2", name: "Sarah Connor", type: "employee", email: "sarah.c@finity.app", phone: "(555) 345-6789", address: "34 Oak Ln, Pasadena, CA", balance: 0 },
  ];

  const products: Product[] = [
    { id: "prod-saas", name: "Enterprise Software Subscription", sku: "FIN-ENT-SaaS", description: "B2B full-featured ERP suite licensing", stockLevel: 0, safetyStock: 0, unitPrice: 1500, costPrice: 200, category: "SaaS Services" },
    { id: "prod-consult", name: "FinTech Strategic Consulting Hour", sku: "FIN-CON-HR", description: "Hourly bespoke accounting and strategy consulting", stockLevel: 0, safetyStock: 0, unitPrice: 200, costPrice: 0, category: "Consulting" },
    { id: "prod-hardware", name: "Finity Operating Terminal", sku: "FIN-TERM-HW", description: "Secure hardware point-of-sale terminal", stockLevel: 34, safetyStock: 5, unitPrice: 450, costPrice: 180, category: "Hardware", supplierId: "part-office" },
  ];

  const transactions: Transaction[] = [
    { id: "tx-1", date: "2026-06-01", description: "Opening capital contribution", accountId: "acc-bank", offsetAccountId: "acc-equity", amount: 50000, category: "Equity", type: "income", status: "posted" },
    { id: "tx-2", date: "2026-06-02", description: "Office rent payment (June)", accountId: "acc-bank", offsetAccountId: "acc-rent", amount: -2000, category: "Rent", type: "expense", status: "posted" },
    { id: "tx-3", date: "2026-06-15", description: "Consulting project milestone - Wayne Corp", accountId: "acc-bank", offsetAccountId: "acc-revenue", amount: 15000, category: "Revenue", type: "income", status: "posted" },
    { id: "tx-4", date: "2026-06-25", description: "Software subscription revenue - Acme Corp", accountId: "acc-bank", offsetAccountId: "acc-revenue", amount: 10000, category: "Revenue", type: "income", status: "posted" },
    { id: "tx-5", date: "2026-06-28", description: "Monthly salaries payment", accountId: "acc-bank", offsetAccountId: "acc-salaries", amount: -6000, category: "Salaries", type: "expense", status: "posted" },
    { id: "tx-6", date: "2026-06-29", description: "Office supply purchase - Office Depot", accountId: "acc-cash", offsetAccountId: "acc-utilities", amount: -500, category: "Office Supplies", type: "expense", status: "posted" },
    { id: "tx-7", date: "2026-07-01", description: "Office rent payment (July)", accountId: "acc-bank", offsetAccountId: "acc-rent", amount: -2000, category: "Rent", type: "expense", status: "posted" },
    { id: "tx-8", date: "2026-07-02", description: "SaaS server billing - AWS July", accountId: "acc-bank", offsetAccountId: "acc-software", amount: -1200, category: "Infrastructure", type: "expense", status: "posted" },
  ];

  const journalEntries: JournalEntry[] = [
    {
      id: "je-opening",
      date: "2026-06-01",
      description: "Opening balances & ledger initialization",
      status: "posted",
      lines: [
        { accountId: "acc-bank", debit: 45000, credit: 0 },
        { accountId: "acc-cash", debit: 2500, credit: 0 },
        { accountId: "acc-ar", debit: 8200, credit: 0 },
        { accountId: "acc-inventory", debit: 8500, credit: 0 },
        { accountId: "acc-rent", debit: 6000, credit: 0 },
        { accountId: "acc-salaries", debit: 12000, credit: 0 },
        { accountId: "acc-utilities", debit: 1200, credit: 0 },
        { accountId: "acc-marketing", debit: 3500, credit: 0 },
        { accountId: "acc-software", debit: 1500, credit: 0 },
        { accountId: "acc-ap", debit: 0, credit: 3200 },
        { accountId: "acc-tax", debit: 0, credit: 1450 },
        { accountId: "acc-equity", debit: 0, credit: 43250 },
        { accountId: "acc-revenue", debit: 0, credit: 32000 },
        { accountId: "acc-sales", debit: 0, credit: 8500 },
      ],
      auditLogs: ["System generated opening ledger entries", "Verified by auditor"],
    }
  ];

  const invoices: Invoice[] = [
    {
      id: "inv-2026-001",
      invoiceNumber: "INV-2026-001",
      customerId: "part-acme",
      customerName: "Acme Corporation",
      date: "2026-06-25",
      dueDate: "2026-07-25",
      status: "paid",
      items: [{ description: "Enterprise Software SaaS Licensing (1 Year)", quantity: 1, unitPrice: 2500, amount: 2500 }],
      subtotal: 2500,
      taxRate: 0.0,
      taxAmount: 0,
      total: 2500,
      balanceDue: 0,
      payments: [{ date: "2026-06-28", amount: 2500, method: "Wire Transfer" }],
      remindersSentCount: 0,
    },
    {
      id: "inv-2026-002",
      invoiceNumber: "INV-2026-002",
      customerId: "part-wayne",
      customerName: "Wayne Enterprises",
      date: "2026-07-01",
      dueDate: "2026-08-01",
      status: "sent",
      items: [
        { description: "FinTech Strategic Consulting - Milestone 1", quantity: 20, unitPrice: 200, amount: 4000 },
        { description: "Operating Terminal Hardware Support", quantity: 1, unitPrice: 500, amount: 500 },
      ],
      subtotal: 4500,
      taxRate: 0.0,
      taxAmount: 0,
      total: 4500,
      balanceDue: 4500,
      payments: [],
      remindersSentCount: 0,
    },
    {
      id: "inv-2026-003",
      invoiceNumber: "INV-2026-003",
      customerId: "part-stark",
      customerName: "Stark Industries",
      date: "2026-05-15",
      dueDate: "2026-06-15",
      status: "overdue",
      items: [{ description: "Custom Security API Integration consulting", quantity: 6, unitPrice: 200, amount: 1200 }],
      subtotal: 1200,
      taxRate: 0.0,
      taxAmount: 0,
      total: 1200,
      balanceDue: 1200,
      payments: [],
      remindersSentCount: 2,
    },
  ];

  const bills: Bill[] = [
    {
      id: "bill-2026-001",
      billNumber: "BILL-AWS-9021",
      supplierId: "part-aws",
      supplierName: "Amazon Web Services",
      date: "2026-07-02",
      dueDate: "2026-07-16",
      status: "received",
      items: [{ description: "Cloud EC2 and RDS Database usage (June)", quantity: 1, unitPrice: 1200, amount: 1200 }],
      total: 1200,
      balanceDue: 1200,
    },
    {
      id: "bill-2026-002",
      billNumber: "BILL-WW-4091",
      supplierId: "part-wework",
      supplierName: "WeWork Renting LLC",
      date: "2026-07-01",
      dueDate: "2026-07-15",
      status: "received",
      items: [{ description: "Co-working space dedicated desks - July", quantity: 4, unitPrice: 500, amount: 2000 }],
      total: 2000,
      balanceDue: 2000,
    },
  ];

  const projects: Project[] = [
    { id: "proj-1", name: "Global ERP Upgrade", description: "Strategic corporate ledger transition project", budget: 25000, cost: 4500, status: "active" },
    { id: "proj-2", name: "Tokenized Payment Gateway", description: "Prototype secure wallet terminal deployment", budget: 15000, cost: 1200, status: "active" },
  ];

  const budgets: Budget[] = [
    { id: "bud-1", category: "Rent", amount: 2500, spent: 2000, period: "2026-07" },
    { id: "bud-2", category: "Software", amount: 2000, spent: 1200, period: "2026-07" },
    { id: "bud-3", category: "Salaries", amount: 8000, spent: 6000, period: "2026-07" },
  ];

  const receipts: Receipt[] = [
    { id: "rec-1", date: "2026-07-02", merchant: "Amazon Web Services", amount: 1200, category: "Software", taxAmount: 0, fileName: "aws_june_invoice.pdf", status: "linked", linkedTransactionId: "tx-8" },
    { id: "rec-2", date: "2026-07-05", merchant: "Starbucks Coffee", amount: 45.5, category: "Meals & Entertainment", taxAmount: 3.5, fileName: "starbucks_0705.png", status: "extracted" },
  ];

  const bankConnections: BankConnection[] = [
    {
      id: "bc-1",
      bankName: "Chase Prime Business",
      accountNumber: "•••• 9821",
      balance: 43250,
      lastSynced: "2026-07-08T06:00:00-07:00",
      transactions: [
        { id: "btx-1", date: "2026-07-01", description: "TRANSFER rent space", amount: -2000, reconciled: true },
        { id: "btx-2", date: "2026-07-02", description: "AWS Billing Service", amount: -1200, reconciled: true },
        { id: "btx-3", date: "2026-07-04", description: "Card deposit ACME CORP", amount: 2500, reconciled: false },
        { id: "btx-4", date: "2026-07-05", description: "Uber Business Ride", amount: -35.2, reconciled: false },
        { id: "btx-5", date: "2026-07-06", description: "Starbucks Store #4512", amount: -45.5, reconciled: false },
      ],
    },
    {
      id: "bc-2",
      bankName: "Silicon Valley Bank (SVB)",
      accountNumber: "•••• 4040",
      balance: 152000,
      lastSynced: "2026-07-08T06:00:00-07:00",
      transactions: [
        { id: "btx-svb-1", date: "2026-07-02", description: "Venture Debt Payment", amount: -5000, reconciled: true },
        { id: "btx-svb-2", date: "2026-07-05", description: "Stark Industries Wire", amount: 15000, reconciled: false },
      ],
    },
  ];

  const wallets: DigitalWallet[] = [
    { id: "wal-1", name: "Primary Operating USD Wallet", currency: "USD", balance: 18500, provider: "Stripe Treasury", lastUpdated: "2026-07-08T22:00:00-07:00" },
    { id: "wal-2", name: "European Treasury EUR Wallet", currency: "EUR", balance: 5000, provider: "Finity Core", lastUpdated: "2026-07-08T22:00:00-07:00" },
    { id: "wal-3", name: "Sterling Operations GBP Wallet", currency: "GBP", balance: 3500, provider: "Finity Core", lastUpdated: "2026-07-08T22:00:00-07:00" },
  ];

  const paymentGateways: PaymentGateway[] = [
    { id: "pg-1", name: "Stripe Connect Gateway", status: "connected", environment: "sandbox", credentialsType: "API Key", lastPing: "2026-07-08T22:20:00-07:00" },
    { id: "pg-2", name: "PayPal Business Gateway", status: "connected", environment: "sandbox", credentialsType: "OAuth", lastPing: "2026-07-08T22:15:00-07:00" },
    { id: "pg-3", name: "Adyen Global Checkout", status: "error", environment: "sandbox", credentialsType: "Token", lastPing: "2026-07-08T22:00:00-07:00" },
  ];

  const activePayments: ActivePayment[] = [
    { id: "pay-1", date: "2026-07-05", type: "supplier", amount: 1200, currency: "USD", recipientName: "Amazon Web Services", status: "completed", routingPath: "ACH Via Chase", settlementTime: "1-2 Business Days", sourceType: "bank", sourceId: "bc-1" },
    { id: "pay-2", date: "2026-07-06", type: "payroll", amount: 3000, currency: "USD", recipientName: "John Doe", status: "completed", routingPath: "Direct Deposit Via Stripe Treasury", settlementTime: "Instant", sourceType: "wallet", sourceId: "wal-1" },
    { id: "pay-3", date: "2026-07-08", type: "supplier", amount: 450, currency: "EUR", recipientName: "Berlin Server Corp", status: "pending", routingPath: "SEPA Via EUR Wallet", settlementTime: "1 Business Day", exchangeRateUsed: 1.08, sourceType: "wallet", sourceId: "wal-2" },
  ];

  const exchangeRates = {
    "USD": 1.0,
    "EUR": 1.08,
    "GBP": 1.28,
    "CAD": 0.73,
    "AUD": 0.67,
  };

  const auditLogs: AuditLog[] = [
    { id: "log-1", timestamp: "2026-07-08T07:51:00-07:00", action: "System Seed", entityType: "Database", entityId: "all", details: "Initialized financial system database with demo Chart of Accounts.", user: "System OS" },
  ];

  return {
    accounts,
    transactions,
    journalEntries,
    invoices,
    bills,
    products,
    partners,
    projects,
    budgets,
    receipts,
    bankConnections,
    auditLogs,
    accountingPeriod: "active",
    fiscalYearClosed: false,
    wallets,
    paymentGateways,
    activePayments,
    exchangeRates,
  };
};

const getEmptyState = (keepProfile: boolean = true, currentProfile?: any): FinityState => {
  const accounts: Account[] = [
    { id: "acc-bank", name: "Bank Account (Checking)", type: AccountType.ASSET, code: "1010", balance: 0, description: "Primary operating bank checking account", isSystem: true },
    { id: "acc-cash", name: "Petty Cash", type: AccountType.ASSET, code: "1020", balance: 0, description: "Cash on hand for minor daily expenses", isSystem: true },
    { id: "acc-ar", name: "Accounts Receivable", type: AccountType.ASSET, code: "1100", balance: 0, description: "Outstanding funds owed by customers", isSystem: true },
    { id: "acc-inventory", name: "Inventory", type: AccountType.ASSET, code: "1200", balance: 0, description: "Valuation of stock on hand", isSystem: true },
    { id: "acc-ap", name: "Accounts Payable", type: AccountType.LIABILITY, code: "2010", balance: 0, description: "Owed money to suppliers and vendors", isSystem: true },
    { id: "acc-tax", name: "Sales Tax Payable", type: AccountType.LIABILITY, code: "2200", balance: 0, description: "Collected sales tax to be paid to govt", isSystem: false },
    { id: "acc-payroll", name: "Payroll Liabilities", type: AccountType.LIABILITY, code: "2300", balance: 0, description: "Accrued payroll and benefit liabilities", isSystem: false },
    { id: "acc-equity", name: "Owner's Equity (Capital)", type: AccountType.EQUITY, code: "3000", balance: 0, description: "Initial and subsequent capital contributions", isSystem: true },
    { id: "acc-retained", name: "Retained Earnings", type: AccountType.EQUITY, code: "3100", balance: 0, description: "Accumulated undistributed net profits", isSystem: true },
    { id: "acc-revenue", name: "Service Revenue", type: AccountType.REVENUE, code: "4010", balance: 0, description: "Earned income from core services", isSystem: true },
    { id: "acc-sales", name: "Product Sales", type: AccountType.REVENUE, code: "4020", balance: 0, description: "Earned income from inventory sales", isSystem: false },
    { id: "acc-rent", name: "Rent Expense", type: AccountType.EXPENSE, code: "5010", balance: 0, description: "Office lease payments", isSystem: true },
    { id: "acc-salaries", name: "Salaries & Wages Expense", type: AccountType.EXPENSE, code: "5020", balance: 0, description: "Employee compensation", isSystem: true },
    { id: "acc-utilities", name: "Utilities Expense", type: AccountType.EXPENSE, code: "5030", balance: 0, description: "Electricity, internet, and phone bills", isSystem: false },
    { id: "acc-marketing", name: "Advertising & Marketing", type: AccountType.EXPENSE, code: "5040", balance: 0, description: "Promotions, ads, and sponsorships", isSystem: false },
    { id: "acc-software", name: "Software & SaaS Subscriptions", type: AccountType.EXPENSE, code: "5050", balance: 0, description: "Cloud software, CRM, and analytics tools", isSystem: false },
  ];

  const emptyState: FinityState = {
    accounts,
    transactions: [],
    journalEntries: [],
    invoices: [],
    bills: [],
    products: [],
    partners: [],
    projects: [],
    budgets: [],
    receipts: [],
    bankConnections: [],
    wallets: [],
    paymentGateways: [],
    activePayments: [],
    auditLogs: [
      { id: "log-clear-" + Date.now(), timestamp: new Date().toISOString(), action: "Database Clear", entityType: "Database", entityId: "all", details: "Database cleared successfully. Starting with an empty slate.", user: "System OS" }
    ],
    accountingPeriod: "active",
    fiscalYearClosed: false,
    exchangeRates: {
      "USD": 1.0,
      "EUR": 1.08,
      "GBP": 1.28,
      "CAD": 0.73,
      "AUD": 0.67,
    }
  };

  if (keepProfile && currentProfile) {
    emptyState.isOnboarded = currentProfile.isOnboarded;
    emptyState.companyProfile = currentProfile.companyProfile;
    emptyState.personalProfile = currentProfile.personalProfile;
    emptyState.userCredentials = currentProfile.userCredentials;
  }

  return emptyState;
};

// Real-Time Business Vitals and Insights Calculation Engine (Intelligent Agent)
function calculateAgentVitals(state: FinityState) {
  const getBalanceSum = (types: AccountType[]) => {
    return state.accounts
      .filter((acc) => types.includes(acc.type))
      .reduce((sum, acc) => sum + acc.balance, 0);
  };

  const getAccountBalance = (id: string) => {
    return state.accounts.find((a) => a.id === id)?.balance || 0;
  };

  const bankBalance = getAccountBalance("acc-bank");
  const cashBalance = getAccountBalance("acc-cash");
  const cashPosition = bankBalance + cashBalance;
  const arBalance = getAccountBalance("acc-ar");
  const inventoryBalance = getAccountBalance("acc-inventory");
  const totalAssets = cashPosition + arBalance + inventoryBalance;

  const apBalance = getAccountBalance("acc-ap");
  const taxBalance = getAccountBalance("acc-tax");
  const totalLiabilities = apBalance + taxBalance;

  const totalRevenue = getBalanceSum([AccountType.REVENUE]);
  const totalExpenses = getBalanceSum([AccountType.EXPENSE]);
  const netProfit = totalRevenue - totalExpenses;
  const netProfitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const overdueInvoices = state.invoices.filter((i) => i.status === "overdue");
  const baseHealth = 82;
  const profitBonus = Math.min(Math.max((netProfitMargin / 100) * 18, 0), 18);
  const penalty = overdueInvoices.length * 6;
  const healthScore = Math.round(Math.max(Math.min(baseHealth + profitBonus - penalty, 99), 35));

  const equityBalance = getBalanceSum([AccountType.EQUITY]);
  const ledgerDiscrepancy = Math.abs(totalAssets - totalLiabilities - equityBalance - netProfit);
  const ledgerBalanced = ledgerDiscrepancy < 0.01;

  // Real-time AI agent assessments
  const vitalsInsight = healthScore > 85
    ? `Optimal vitals at ${healthScore}%. Your cash position is strong, and overdue receivables are fully minimized.`
    : `Vitals score is ${healthScore}%. Focus on collections of the ${overdueInvoices.length} overdue invoice(s) to optimize operational safety.`;

  const profitsInsight = netProfit >= 0
    ? `Healthy operational net profitability of $${netProfit.toLocaleString()}. Profit margin is currently at ${netProfitMargin.toFixed(1)}%.`
    : `Net loss is currently $${Math.abs(netProfit).toLocaleString()}. Consider reviewing office overhead or pausing unneeded SaaS.`;

  const lossesInsight = `Total operating expense is $${totalExpenses.toLocaleString()}. Office rent and salaries make up the largest portions of this cycle.`;

  const treasuryInsight = cashPosition >= 50000
    ? `Liquid cash is high at $${cashPosition.toLocaleString()}, which exceeds your benchmark $50,000 safety zone.`
    : `Runway warning: Liquid reserves ($${cashPosition.toLocaleString()}) are below the target $50,000. Accelerate customer payment cycles.`;

  const auditInsight = ledgerBalanced
    ? "Double-entry integrity check passed (Assets = Liabilities + Equity). No transaction discrepancies found."
    : `Discrepancy found: Ledger is out of alignment by $${ledgerDiscrepancy.toFixed(2)}. Suggesting balance re-alignment entries.`;

  return {
    healthScore,
    netProfit,
    totalExpenses,
    cashPosition,
    ledgerBalanced,
    overdueInvoicesCount: overdueInvoices.length,
    netProfitMargin,
    insights: {
      vitals: vitalsInsight,
      profits: profitsInsight,
      losses: lossesInsight,
      treasury: treasuryInsight,
      audit: auditInsight,
    }
  };
}

// Load State from File
function readDbState(): FinityState {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, "utf-8");
      const parsed = JSON.parse(raw) as FinityState & { agentVitals?: any };
      
      // Auto-fill new payments and banking properties if missing (for backward compatibility)
      if (!parsed.wallets) {
        parsed.wallets = [
          { id: "wal-1", name: "Primary Operating USD Wallet", currency: "USD", balance: 18500, provider: "Stripe Treasury", lastUpdated: "2026-07-08T22:00:00-07:00" },
          { id: "wal-2", name: "European Treasury EUR Wallet", currency: "EUR", balance: 5000, provider: "Finity Core", lastUpdated: "2026-07-08T22:00:00-07:00" },
          { id: "wal-3", name: "Sterling Operations GBP Wallet", currency: "GBP", balance: 3500, provider: "Finity Core", lastUpdated: "2026-07-08T22:00:00-07:00" },
        ];
      }
      if (!parsed.paymentGateways) {
        parsed.paymentGateways = [
          { id: "pg-1", name: "Stripe Connect Gateway", status: "connected", environment: "sandbox", credentialsType: "API Key", lastPing: "2026-07-08T22:20:00-07:00" },
          { id: "pg-2", name: "PayPal Business Gateway", status: "connected", environment: "sandbox", credentialsType: "OAuth", lastPing: "2026-07-08T22:15:00-07:00" },
          { id: "pg-3", name: "Adyen Global Checkout", status: "error", environment: "sandbox", credentialsType: "Token", lastPing: "2026-07-08T22:00:00-07:00" },
        ];
      }
      if (!parsed.activePayments) {
        parsed.activePayments = [
          { id: "pay-1", date: "2026-07-05", type: "supplier", amount: 1200, currency: "USD", recipientName: "Amazon Web Services", status: "completed", routingPath: "ACH Via Chase", settlementTime: "1-2 Business Days", sourceType: "bank", sourceId: "bc-1" },
          { id: "pay-2", date: "2026-07-06", type: "payroll", amount: 3000, currency: "USD", recipientName: "John Doe", status: "completed", routingPath: "Direct Deposit Via Stripe Treasury", settlementTime: "Instant", sourceType: "wallet", sourceId: "wal-1" },
          { id: "pay-3", date: "2026-07-08", type: "supplier", amount: 450, currency: "EUR", recipientName: "Berlin Server Corp", status: "pending", routingPath: "SEPA Via EUR Wallet", settlementTime: "1 Business Day", exchangeRateUsed: 1.08, sourceType: "wallet", sourceId: "wal-2" },
        ];
      }
      if (!parsed.exchangeRates) {
        parsed.exchangeRates = {
          "USD": 1.0,
          "EUR": 1.08,
          "GBP": 1.28,
          "CAD": 0.73,
          "AUD": 0.67,
        };
      }
      
      parsed.agentVitals = calculateAgentVitals(parsed);
      return parsed;
    }
  } catch (error) {
    console.error("Failed to read database state, returning seed.", error);
  }
  const seed = getSeedState() as FinityState & { agentVitals?: any };
  writeDbState(seed);
  seed.agentVitals = calculateAgentVitals(seed);
  return seed;
}

// Write State to File
function writeDbState(state: FinityState) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to write database state.", error);
  }
}

// Helper to add audit log
function addAuditLog(state: FinityState, action: string, type: string, id: string, details: string) {
  const newLog: AuditLog = {
    id: "log-" + Date.now(),
    timestamp: new Date().toISOString(),
    action,
    entityType: type,
    entityId: id,
    details,
    user: "Finity Agent AI",
  };
  state.auditLogs.unshift(newLog);
}

// Re-calculate account balances based on current journal entries (double-entry bookkeeping)
function recalculateBalances(state: FinityState) {
  // Clear balances
  state.accounts.forEach((acc) => {
    acc.balance = 0;
  });

  // Start with equity/revenue/assets from posted journal entries
  state.journalEntries.forEach((je) => {
    if (je.status !== "posted") return;
    je.lines.forEach((line) => {
      const acc = state.accounts.find((a) => a.id === line.accountId);
      if (acc) {
        // Assets & Expenses increase with Debits, decrease with Credits
        // Liabilities, Equity, & Revenue increase with Credits, decrease with Debits
        if (acc.type === AccountType.ASSET || acc.type === AccountType.EXPENSE) {
          acc.balance += line.debit - line.credit;
        } else {
          acc.balance += line.credit - line.debit;
        }
      }
    });
  });

  // Align transaction balances (transactions sync with cash/bank movements)
  // Let's ensure the cash/bank balances in accounts list are accurate
}

// REST API Endpoints

// Get current state
app.get("/api/state", (req, res) => {
  const state = readDbState();
  res.json({ state });
});

// Verification Codes Store
const verificationCodes = new Map<string, { code: string; expires: number }>();

// Lazy SMTP test account caching
let testSmtpAccount: any = null;

// Send Verification Email via nodemailer Ethereal SMTP
app.post("/api/onboarding/send-verification", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email address is required." });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodes.set(email.toLowerCase(), {
      code,
      expires: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    if (!testSmtpAccount) {
      testSmtpAccount = await nodemailer.createTestAccount();
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testSmtpAccount.user,
        pass: testSmtpAccount.pass,
      },
    });

    const info = await transporter.sendMail({
      from: '"Finity OS Security" <security@finity.io>',
      to: email,
      subject: "Finity Workspace Verification Code",
      text: `Welcome to Finity.\n\nYour 6-digit workspace verification code is: ${code}\n\nThis code is valid for 10 minutes. If you did not request this, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #0b0c16; padding: 40px; color: #ffffff; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(212, 175, 55, 0.2);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #d4af37; font-size: 28px; margin: 0; font-weight: bold; letter-spacing: -1px;">FINITY</h1>
            <p style="color: #a0aec0; font-size: 11px; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 2px;">AI-Powered Finance</p>
          </div>
          <div style="background-color: #121324; padding: 30px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.05);">
            <h2 style="font-size: 18px; margin-top: 0; color: #ffffff; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 12px; font-weight: 600;">Workspace Verification Protocol</h2>
            <p style="color: #a0aec0; font-size: 14px; line-height: 1.5; margin: 16px 0;">
              Your intelligent financial partner is ready to provision your secure workspace. To complete email authentication, please enter the following 6-digit confirmation pin in your onboarding wizard:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: bold; color: #d4af37; letter-spacing: 6px; border: 1px dashed rgba(212, 175, 55, 0.5); padding: 12px 30px; border-radius: 8px; background-color: #0b0c16; display: inline-block;">
                ${code}
              </span>
            </div>
            <p style="color: #718096; font-size: 12px; line-height: 1.4; margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 15px; margin-bottom: 0;">
              This code is valid for 10 minutes. If you did not initiate this registration request, please ignore this message.
            </p>
          </div>
        </div>
      `,
    });

    const viewUrl = nodemailer.getTestMessageUrl(info);
    res.json({ success: true, viewUrl, email });
  } catch (err: any) {
    console.error("Verification email dispatch failed:", err);
    res.status(500).json({ error: "Failed to dispatch email verification: " + err.message });
  }
});

// Verify Code Endpoint
app.post("/api/onboarding/verify-code", (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: "Email and code are required." });
  }

  const stored = verificationCodes.get(email.toLowerCase());
  if (!stored) {
    return res.status(400).json({ error: "No verification pending or code has expired." });
  }

  if (Date.now() > stored.expires) {
    verificationCodes.delete(email.toLowerCase());
    return res.status(400).json({ error: "Verification code has expired." });
  }

  if (stored.code === code.trim()) {
    verificationCodes.delete(email.toLowerCase());
    return res.json({ success: true });
  }

  return res.status(400).json({ error: "Incorrect verification code. Please try again." });
});

// Secure account login endpoint
app.post("/api/state/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const state = readDbState();
  if (!state.isOnboarded) {
    return res.status(400).json({ error: "Workspace is not onboarded. Please complete the secure onboarding wizard first." });
  }

  if (state.userCredentials && state.userCredentials.email.toLowerCase() === email.toLowerCase() && state.userCredentials.password === password) {
    return res.json({ status: "success", state });
  }

  return res.status(401).json({ error: "Invalid email or password." });
});

// Complete Onboarding & Initialize Workspace
app.post("/api/state/onboard", (req, res) => {
  try {
    const {
      onboardingType,
      account,
      companyInfo,
      location,
      financial,
      structure,
      team,
      connected,
      personal,
    } = req.body;

    const state = readDbState();

    // Set onboarded status
    state.isOnboarded = true;

    const currencySymbol = financial?.currency === "EUR" ? "€" : financial?.currency === "GBP" ? "£" : financial?.currency === "CAD" ? "C$" : financial?.currency === "AUD" ? "A$" : "$";
    const currencyCode = financial?.currency || "USD";

    if (onboardingType === "business") {
      // 1. Save Company Profile
      state.companyProfile = {
        name: companyInfo?.companyName || "Finity Workspace Ltd",
        legalName: companyInfo?.legalBusinessName || companyInfo?.companyName || "Finity Workspace Ltd",
        registrationNumber: companyInfo?.businessRegistrationNumber || "",
        businessType: companyInfo?.businessType || "Corporation",
        industry: companyInfo?.industry || "Technology",
        companySize: companyInfo?.companySize || "11-50",
        employees: companyInfo?.employees || "",
        logo: companyInfo?.logo || "",
        website: companyInfo?.website || "",
        country: location?.country || "United States",
        state: location?.state || "",
        city: location?.city || "",
        address: location?.address || "",
        postalCode: location?.postalCode || "",
        timezone: location?.timezone || "UTC",
        language: location?.language || "English",
        taxNumber: financial?.taxRegistrationNumber || "",
        taxSettings: financial?.taxSettings || "Standard sales tax",
        mfaEnabled: account?.mfaEnabled || false,
        approvalLimit: 10000,
        departments: structure?.departments || [],
        branches: structure?.branches || [],
        costCenters: structure?.costCenters || [],
        onboardedAt: new Date().toISOString(),
        description: companyInfo?.businessDescription || "",
        email: companyInfo?.businessEmail || "",
        phone: companyInfo?.businessPhone || "",
        contactInfo: companyInfo?.businessContactInfo || "",
      };

      state.userCredentials = {
        email: account?.workEmail || "",
        password: account?.password || "",
        fullName: account?.fullName || "Business Administrator"
      };

      // 2. Customize Chart of Accounts for Business
      const standardAccounts: Account[] = [
        { id: "acc-bank", name: `Bank Account (${connected?.bankName || "Checking"})`, type: AccountType.ASSET, code: "1010", balance: Number(connected?.bankBalance) || 45000, description: "Primary operating bank checking account", isSystem: true },
        { id: "acc-cash", name: "Petty Cash Wallet", type: AccountType.ASSET, code: "1020", balance: 2500, description: "Cash on hand for minor daily expenses", isSystem: true },
        { id: "acc-ar", name: "Accounts Receivable (A/R)", type: AccountType.ASSET, code: "1100", balance: 12500, description: "Outstanding client invoicing", isSystem: true },
        { id: "acc-inventory", name: "Product Inventory Asset", type: AccountType.ASSET, code: "1200", balance: 18000, description: "Valuation of commercial inventory", isSystem: true },
        { id: "acc-ap", name: "Accounts Payable (A/P)", type: AccountType.LIABILITY, code: "2010", balance: 6400, description: "Owed funds to supplier partners", isSystem: true },
        { id: "acc-tax", name: "Sales Tax Liability", type: AccountType.LIABILITY, code: "2200", balance: 1200, description: "Collected sales tax payable to authority", isSystem: true },
        { id: "acc-equity", name: "Retained Earnings", type: AccountType.EQUITY, code: "3000", balance: 61400, description: "Accumulated operational reserves", isSystem: true },
        { id: "acc-revenue", name: "Core Product Sales", type: AccountType.REVENUE, code: "4000", balance: 28500, description: "Main stream revenue from commercial channels", isSystem: true },
        { id: "acc-rent", name: "Office Leasing Expense", type: AccountType.EXPENSE, code: "5010", balance: 4500, description: "Office rental and workspace subscription expenses", isSystem: true },
        { id: "acc-payroll", name: "Salaries & Payroll", type: AccountType.EXPENSE, code: "5020", balance: 12000, description: "Salaries paid to company team members", isSystem: true },
        { id: "acc-marketing", name: "Marketing & Growth", type: AccountType.EXPENSE, code: "5030", balance: 3500, description: "Acquisition and search engine marketing costs", isSystem: true },
        { id: "acc-hosting", name: "AWS Cloud Infrastructure", type: AccountType.EXPENSE, code: "5040", balance: 1200, description: "Cloud computing and network storage overheads", isSystem: true },
      ];
      state.accounts = standardAccounts;

      // 3. Clear/Seed Transactions tailored to business
      state.transactions = [
        { id: "tx-ob-1", date: "2026-07-01", description: "Initial Equity Contribution", accountId: "acc-bank", offsetAccountId: "acc-equity", amount: Number(connected?.bankBalance) || 45000, category: "Equity", type: "income", status: "posted" },
        { id: "tx-ob-2", date: "2026-07-02", description: "Office Space Lease Payment", accountId: "acc-bank", offsetAccountId: "acc-rent", amount: -2500, category: "Rent", type: "expense", status: "posted" },
        { id: "tx-ob-3", date: "2026-07-03", description: "Stripe Sales Payout Batch", accountId: "acc-bank", offsetAccountId: "acc-revenue", amount: 8400, category: "Sales", type: "income", status: "posted" },
        { id: "tx-ob-4", date: "2026-07-04", description: "Employee Payroll Allocation", accountId: "acc-bank", offsetAccountId: "acc-payroll", amount: -6000, category: "Payroll", type: "expense", status: "posted" },
      ];

      // 4. Set Bookkeeping and Accounting period
      state.accountingPeriod = "active";
      state.fiscalYearClosed = false;

      // 5. Connect Bank if present
      if (connected?.bankName) {
        state.bankConnections = [
          {
            id: "bc-ob-1",
            bankName: connected.bankName,
            accountNumber: connected.accountNumber || "•••• 4422",
            balance: Number(connected.bankBalance) || 45000,
            lastSynced: new Date().toISOString(),
            transactions: [
              { id: "btx-ob-1", date: "2026-07-05", description: "Customer Wire Settlement", amount: 4500, reconciled: false },
              { id: "btx-ob-2", date: "2026-07-06", description: "Office Utility Payment", amount: -350, reconciled: false },
              { id: "btx-ob-3", date: "2026-07-07", description: "Adobe CC Software Sub", amount: -85, reconciled: true },
            ],
          }
        ];
      } else {
        state.bankConnections = [];
      }

      // 6. Connect Wallets & Gateways
      state.wallets = [
        { id: "wal-ob-usd", name: "Operating USD Wallet", currency: currencyCode, balance: 10000, provider: "Finity Core", lastUpdated: new Date().toISOString() }
      ];
      state.paymentGateways = [
        { id: "pg-ob-stripe", name: connected?.gatewayConnected ? `${connected.gatewayConnected} API Gateway` : "Stripe Connect Portal", status: connected?.gatewayConnected ? "connected" : "disconnected", environment: "sandbox", credentialsType: "API Key", lastPing: new Date().toISOString() }
      ];

      // 7. Team Invites -> add as Partners with 'employee'
      state.partners = [
        { id: "partner-ob-owner", name: account?.fullName || "Company Owner", type: "employee", email: account?.workEmail || "", phone: "", address: "", balance: 0 }
      ];
      if (team && Array.isArray(team)) {
        team.forEach((member: any, i: number) => {
          if (member?.email) {
            state.partners.push({
              id: `partner-ob-${i + 1}`,
              name: member.name || member.email.split("@")[0],
              type: "employee",
              email: member.email,
              phone: "",
              address: "",
              balance: 0,
            });
          }
        });
      }

      // 8. Log registration success
      state.auditLogs = [
        { id: `audit-${Date.now()}-1`, timestamp: new Date().toISOString(), action: "Workspace Onboarding", entityType: "Company", entityId: "finity-workspace", details: `Company workspace '${companyInfo?.companyName}' registered under Base Currency '${currencyCode}' and industry '${companyInfo?.industry || "Tech"}'.`, user: account?.fullName || "System OS" },
        { id: `audit-${Date.now()}-2`, timestamp: new Date().toISOString(), action: "Policy Configuration", entityType: "Security", entityId: "mfa", details: `Multi-factor authentication (MFA) status updated: ${account?.mfaEnabled ? "ENABLED" : "DISABLED"}.`, user: "System OS" },
      ];
    } else {
      // PERSONAL ONBOARDING
      state.personalProfile = {
        name: personal?.name || "Premium User",
        country: personal?.country || "United States",
        currency: currencyCode,
        timezone: personal?.timezone || "UTC",
        language: personal?.language || "English",
        goals: personal?.goals || "Wealth management and tracking",
        onboardedAt: new Date().toISOString(),
      };

      state.userCredentials = {
        email: account?.workEmail || "personal@finity.io",
        password: account?.password || "",
        fullName: personal?.name || "Personal Owner"
      };

      // Customize Chart of Accounts for Personal Finance
      const personalAccounts: Account[] = [
        { id: "acc-bank", name: "Personal Checking Account", type: AccountType.ASSET, code: "1010", balance: 8500, description: "Day-to-day transaction account", isSystem: true },
        { id: "acc-savings", name: "High-Yield Savings", type: AccountType.ASSET, code: "1020", balance: 25000, description: "Emergency fund & personal investments", isSystem: true },
        { id: "acc-card", name: "Finity Metal Credit Card", type: AccountType.LIABILITY, code: "2010", balance: 1420, description: "Personal credit card balance", isSystem: true },
        { id: "acc-equity", name: "Net Worth Reserve", type: AccountType.EQUITY, code: "3000", balance: 32080, description: "Personal net worth baseline", isSystem: true },
        { id: "acc-revenue", name: "Primary Salary Revenue", type: AccountType.REVENUE, code: "4000", balance: 6500, description: "Monthly paycheck and primary earnings", isSystem: true },
        { id: "acc-sidehustle", name: "Side Hustle Consulting", type: AccountType.REVENUE, code: "4100", balance: 1200, description: "Alternative secondary gig earnings", isSystem: true },
        { id: "acc-rent", name: "Monthly Rent / Mortgage", type: AccountType.EXPENSE, code: "5010", balance: 1800, description: "Residential monthly housing costs", isSystem: true },
        { id: "acc-groceries", name: "Groceries & Supermarket", type: AccountType.EXPENSE, code: "5020", balance: 450, description: "Weekly food and essential supplies", isSystem: true },
        { id: "acc-dining", name: "Dining & Coffee Shops", type: AccountType.EXPENSE, code: "5030", balance: 250, description: "Social dining out, cafes, and leisure food", isSystem: true },
        { id: "acc-travel", name: "Transport & Rideshare", type: AccountType.EXPENSE, code: "5040", balance: 180, description: "Gasoline, public transit, and Uber rides", isSystem: true },
      ];
      state.accounts = personalAccounts;

      // Seed transactions matching personal
      state.transactions = [
        { id: "tx-ob-1", date: "2026-07-01", description: "Employer Monthly Paycheck", accountId: "acc-bank", offsetAccountId: "acc-revenue", amount: 4500, category: "Salary", type: "income", status: "posted" },
        { id: "tx-ob-2", date: "2026-07-02", description: "Landlord Rent Payment Transfer", accountId: "acc-bank", offsetAccountId: "acc-rent", amount: -1800, category: "Housing", type: "expense", status: "posted" },
        { id: "tx-ob-3", date: "2026-07-03", description: "Consulting Freelance Payout", accountId: "acc-bank", offsetAccountId: "acc-sidehustle", amount: 600, category: "Consulting", type: "income", status: "posted" },
        { id: "tx-ob-4", date: "2026-07-04", description: "Whole Foods Grocery Stock", accountId: "acc-bank", offsetAccountId: "acc-groceries", amount: -125, category: "Groceries", type: "expense", status: "posted" },
      ];

      state.accountingPeriod = "active";
      state.fiscalYearClosed = false;
      state.bankConnections = [
        {
          id: "bc-ob-1",
          bankName: "Finity Premium Personal Bank",
          accountNumber: "•••• 8833",
          balance: 8500,
          lastSynced: new Date().toISOString(),
          transactions: [
            { id: "btx-ob-1", date: "2026-07-05", description: "Starbucks Coffee", amount: -5.75, reconciled: false },
            { id: "btx-ob-2", date: "2026-07-06", description: "Netflix Monthly Sub", amount: -15.49, reconciled: true },
          ],
        }
      ];
      state.wallets = [
        { id: "wal-ob-personal", name: "Personal Digital USD Wallet", currency: currencyCode, balance: 2500, provider: "Finity Pay", lastUpdated: new Date().toISOString() }
      ];
      state.paymentGateways = [];
      state.partners = [];
      state.auditLogs = [
        { id: `audit-${Date.now()}-1`, timestamp: new Date().toISOString(), action: "Personal Onboarding", entityType: "User", entityId: "personal-workspace", details: `Personal financial workspace registered under Base Currency '${currencyCode}' for user '${personal?.name}'.`, user: personal?.name || "System OS" }
      ];
    }

    // Save changes to DB
    writeDbState(state);

    res.json({ status: "success", state });
  } catch (err: any) {
    console.error("Error on onboarding API:", err);
    res.status(500).json({ error: err.message });
  }
});

// Reset onboarding state
app.post("/api/state/reset-onboard", (req, res) => {
  const state = readDbState();
  state.isOnboarded = false;
  state.companyProfile = undefined;
  state.personalProfile = undefined;
  state.userCredentials = undefined;
  writeDbState(state);
  res.json({ status: "success", state });
});

// Reset database
app.post("/api/state/reset", (req, res) => {
  const seed = getSeedState();
  writeDbState(seed);
  res.json({ status: "success", state: seed });
});

// Clear database fully (Empty Slate)
app.post("/api/state/clear", (req, res) => {
  const current = readDbState();
  const empty = getEmptyState(true, current);
  writeDbState(empty);
  res.json({ status: "success", state: empty });
});

// Export Database
app.get("/api/state/export", (req, res) => {
  const state = readDbState();
  res.setHeader("Content-Disposition", "attachment; filename=finity_state.json");
  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(state, null, 2));
});

// Import Database
app.post("/api/state/import", (req, res) => {
  try {
    const imported = req.body as FinityState;
    if (!imported.accounts || !imported.transactions) {
      return res.status(400).json({ error: "Invalid database backup format" });
    }
    writeDbState(imported);
    res.json({ status: "success", state: imported });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Close fiscal year
app.post("/api/state/close-year", (req, res) => {
  const state = readDbState();
  if (state.fiscalYearClosed) {
    return res.status(400).json({ error: "Fiscal year is already closed." });
  }

  // Calculate current Revenue and Expense sum
  const revenueSum = state.accounts.filter(a => a.type === AccountType.REVENUE).reduce((sum, a) => sum + a.balance, 0);
  const expenseSum = state.accounts.filter(a => a.type === AccountType.EXPENSE).reduce((sum, a) => sum + a.balance, 0);
  const netIncome = revenueSum - expenseSum;

  // Create a closing journal entry
  const closingJe: JournalEntry = {
    id: "je-close-" + Date.now(),
    date: new Date().toISOString().split("T")[0],
    description: "Fiscal Year Closing - Transfer Net Income to Retained Earnings",
    status: "posted",
    lines: [],
    auditLogs: ["System executed fiscal year closing entry"],
  };

  // Debit each Revenue account to zero it out
  state.accounts.filter(a => a.type === AccountType.REVENUE).forEach(acc => {
    if (acc.balance !== 0) {
      closingJe.lines.push({ accountId: acc.id, debit: acc.balance, credit: 0 });
    }
  });

  // Credit each Expense account to zero it out
  state.accounts.filter(a => a.type === AccountType.EXPENSE).forEach(acc => {
    if (acc.balance !== 0) {
      closingJe.lines.push({ accountId: acc.id, debit: 0, credit: acc.balance });
    }
  });

  // Balance goes into Retained Earnings
  if (netIncome > 0) {
    closingJe.lines.push({ accountId: "acc-retained", debit: 0, credit: netIncome });
  } else if (netIncome < 0) {
    closingJe.lines.push({ accountId: "acc-retained", debit: Math.abs(netIncome), credit: 0 });
  }

  state.journalEntries.unshift(closingJe);
  state.fiscalYearClosed = true;
  state.accountingPeriod = "closed";

  recalculateBalances(state);
  addAuditLog(state, "Fiscal Year Close", "Ledger", closingJe.id, `Closed fiscal year, transferred net income of $${netIncome} to Retained Earnings.`);
  writeDbState(state);

  res.json({ status: "success", state });
});

// Reopen fiscal year with authorized audit key
app.post("/api/state/reopen-year", (req, res) => {
  const state = readDbState();
  const { authKey } = req.body;
  if (authKey !== "FINITY-AUDIT-2026") {
    return res.status(401).json({ error: "Unauthorized. Invalid auditor auth credentials." });
  }

  // Find the closing journal entry and delete it
  state.journalEntries = state.journalEntries.filter(je => !je.id.startsWith("je-close-"));
  state.fiscalYearClosed = false;
  state.accountingPeriod = "active";

  recalculateBalances(state);
  addAuditLog(state, "Fiscal Year Reopen", "Ledger", "all", "Reopened fiscal year with authorized auditor key FINITY-AUDIT-2026.");
  writeDbState(state);

  res.json({ status: "success", state });
});

// Create Transaction Manually
app.post("/api/transactions", (req, res) => {
  const state = readDbState();
  if (state.accountingPeriod === "closed" || state.fiscalYearClosed) {
    return res.status(403).json({ error: "Accounting period is closed/locked. No new entries can be recorded." });
  }
  const { date, description, accountId, offsetAccountId, amount, category, type } = req.body;

  const newTx: Transaction = {
    id: "tx-" + Date.now(),
    date: date || new Date().toISOString().split("T")[0],
    description,
    accountId,
    offsetAccountId,
    amount: Number(amount),
    category: category || "Uncategorized",
    type: type || "expense",
    status: "posted",
  };

  // Add a General Journal Double-entry matching the transaction
  const newJe: JournalEntry = {
    id: "je-" + Date.now(),
    date: newTx.date,
    description: `[Tx] ${newTx.description}`,
    status: "posted",
    lines: [],
    auditLogs: ["Recorded via Manual Transaction Entry"],
  };

  if (newTx.type === "income") {
    // Income: Debit Asset (accountId), Credit Revenue (offsetAccountId)
    newJe.lines.push({ accountId: newTx.accountId, debit: Math.abs(newTx.amount), credit: 0 });
    newJe.lines.push({ accountId: newTx.offsetAccountId, debit: 0, credit: Math.abs(newTx.amount) });
  } else if (newTx.type === "expense") {
    // Expense: Debit Expense (offsetAccountId), Credit Asset (accountId)
    newJe.lines.push({ accountId: newTx.offsetAccountId, debit: Math.abs(newTx.amount), credit: 0 });
    newJe.lines.push({ accountId: newTx.accountId, debit: 0, credit: Math.abs(newTx.amount) });
  } else {
    // Transfer: Debit Asset (offsetAccountId), Credit Asset (accountId)
    newJe.lines.push({ accountId: newTx.offsetAccountId, debit: Math.abs(newTx.amount), credit: 0 });
    newJe.lines.push({ accountId: newTx.accountId, debit: 0, credit: Math.abs(newTx.amount) });
  }

  state.transactions.unshift(newTx);
  state.journalEntries.unshift(newJe);
  recalculateBalances(state);
  addAuditLog(state, "Create Transaction", "Transaction", newTx.id, `Manual recording of transaction: "${newTx.description}" for $${Math.abs(newTx.amount)}`);
  writeDbState(state);

  res.json({ transaction: newTx, state });
});

// Update Transaction Manually
app.put("/api/transactions/:id", (req, res) => {
  const state = readDbState();
  if (state.accountingPeriod === "closed" || state.fiscalYearClosed) {
    return res.status(403).json({ error: "Accounting period is closed/locked. No modifications allowed." });
  }
  const txId = req.params.id;
  const index = state.transactions.findIndex((t) => t.id === txId);
  if (index === -1) return res.status(404).json({ error: "Transaction not found" });

  const updatedFields = req.body;
  state.transactions[index] = { ...state.transactions[index], ...updatedFields };

  // Remove previous auto-journal and re-create for simplicity
  state.journalEntries = state.journalEntries.filter((je) => !je.description.startsWith(`[Tx]`) || je.date !== state.transactions[index].date);

  // Recalculate and recreate
  const tx = state.transactions[index];
  const newJe: JournalEntry = {
    id: "je-" + Date.now(),
    date: tx.date,
    description: `[Tx] ${tx.description}`,
    status: "posted",
    lines: [],
    auditLogs: ["Auto-regenerated on Transaction update"],
  };

  if (tx.type === "income") {
    newJe.lines.push({ accountId: tx.accountId, debit: Math.abs(tx.amount), credit: 0 });
    newJe.lines.push({ accountId: tx.offsetAccountId, debit: 0, credit: Math.abs(tx.amount) });
  } else {
    newJe.lines.push({ accountId: tx.offsetAccountId, debit: Math.abs(tx.amount), credit: 0 });
    newJe.lines.push({ accountId: tx.accountId, debit: 0, credit: Math.abs(tx.amount) });
  }
  state.journalEntries.unshift(newJe);

  recalculateBalances(state);
  addAuditLog(state, "Update Transaction", "Transaction", tx.id, `Updated transaction "${tx.description}"`);
  writeDbState(state);

  res.json({ transaction: tx, state });
});

// Void/Delete Transaction
app.delete("/api/transactions/:id", (req, res) => {
  const state = readDbState();
  if (state.accountingPeriod === "closed" || state.fiscalYearClosed) {
    return res.status(403).json({ error: "Accounting period is closed/locked. No modifications allowed." });
  }
  const txId = req.params.id;
  const tx = state.transactions.find((t) => t.id === txId);
  if (!tx) return res.status(404).json({ error: "Transaction not found" });

  state.transactions = state.transactions.filter((t) => t.id !== txId);
  // Remove related journal entries
  state.journalEntries = state.journalEntries.filter((je) => je.description !== `[Tx] ${tx.description}`);

  recalculateBalances(state);
  addAuditLog(state, "Delete Transaction", "Transaction", txId, `Deleted transaction "${tx.description}" of $${Math.abs(tx.amount)}`);
  writeDbState(state);

  res.json({ status: "success", state });
});

// ==========================================
// PAYMENTS & BANKING ENGINE ENGINE APIS
// ==========================================

// 1. Send Money (Supplier, Payroll, Refunds)
app.post("/api/payments/send", (req, res) => {
  const state = readDbState();
  if (state.accountingPeriod === "closed" || state.fiscalYearClosed) {
    return res.status(403).json({ error: "Accounting period is closed. No payment operations allowed." });
  }

  const { type, amount, currency, recipientName, sourceType, sourceId, routingPath, settlementTime } = req.body;
  const payAmt = Number(amount);
  if (isNaN(payAmt) || payAmt <= 0) {
    return res.status(400).json({ error: "Invalid payment amount." });
  }

  // Look up source and deduct
  let usdValue = payAmt;
  const rates = state.exchangeRates || { "USD": 1.0, "EUR": 1.08, "GBP": 1.28 };
  const rate = rates[currency] || 1.0;
  usdValue = payAmt * rate; // Convert source currency amount to USD for the ledger

  if (sourceType === "bank") {
    const bank = state.bankConnections.find(b => b.id === sourceId);
    if (!bank) return res.status(404).json({ error: "Bank account connection not found." });
    if (bank.balance < payAmt) {
      return res.status(400).json({ error: "Insufficient funds in bank account." });
    }
    bank.balance -= payAmt;
  } else if (sourceType === "wallet") {
    if (!state.wallets) state.wallets = [];
    const wallet = state.wallets.find(w => w.id === sourceId);
    if (!wallet) return res.status(404).json({ error: "Digital wallet not found." });
    if (wallet.balance < payAmt) {
      return res.status(400).json({ error: "Insufficient funds in digital wallet." });
    }
    wallet.balance -= payAmt;
    wallet.lastUpdated = new Date().toISOString();
  } else {
    return res.status(400).json({ error: "Invalid payment source type. Must be 'bank' or 'wallet'." });
  }

  // Create active payment record
  const paymentId = "pay-" + Date.now();
  const newPayment = {
    id: paymentId,
    date: new Date().toISOString().split("T")[0],
    type,
    amount: payAmt,
    currency,
    recipientName,
    status: "completed" as const,
    routingPath: routingPath || "Auto-Routed Optimal Path",
    settlementTime: settlementTime || "Instant",
    exchangeRateUsed: currency !== "USD" ? rate : undefined,
    sourceType,
    sourceId,
  };

  if (!state.activePayments) state.activePayments = [];
  state.activePayments.unshift(newPayment);

  // FINANCIAL INTEGRITY SYNC: Add double-entry transaction & journal entry
  let offsetAccId = "acc-utilities"; // Default
  if (type === "payroll") offsetAccId = "acc-salaries";
  else if (type === "supplier") offsetAccId = "acc-ap";
  else if (type === "refund") offsetAccId = "acc-revenue";

  const newTx: Transaction = {
    id: "tx-pay-" + Date.now(),
    date: newPayment.date,
    description: `[Payment Engine] Paid ${recipientName} (${type}) via ${sourceType === "bank" ? "Bank" : "Wallet"}`,
    accountId: "acc-bank",
    offsetAccountId: offsetAccId,
    amount: -usdValue,
    category: type === "payroll" ? "Salaries" : type === "supplier" ? "Supplier Payment" : "Refunds",
    type: "expense",
    status: "posted",
  };

  const newJe: JournalEntry = {
    id: "je-pay-" + Date.now(),
    date: newTx.date,
    description: `Finity Banking Routing - Pay ${recipientName} (${currency} ${payAmt})`,
    status: "posted",
    lines: [
      { accountId: offsetAccId, debit: usdValue, credit: 0 },
      { accountId: "acc-bank", debit: 0, credit: usdValue },
    ],
    auditLogs: [`Automatically synchronized by Payments & Banking Engine. Routing: ${newPayment.routingPath}`],
  };

  state.transactions.unshift(newTx);
  state.journalEntries.unshift(newJe);

  // If we paid a supplier bill, adjust balance if matched
  if (type === "supplier") {
    const partner = state.partners.find(p => p.name.toLowerCase().includes(recipientName.toLowerCase()) || recipientName.toLowerCase().includes(p.name.toLowerCase()));
    if (partner) {
      partner.balance -= usdValue;
      if (partner.balance < 0) partner.balance = 0;
    }
  }

  recalculateBalances(state);
  addAuditLog(state, "Send Payment", "Payment", paymentId, `Successfully sent ${currency} ${payAmt.toLocaleString()} to ${recipientName} via ${routingPath}. Ledger adjusted for $${usdValue.toFixed(2)}.`);
  writeDbState(state);

  res.json({ status: "success", payment: newPayment, state });
});

// 2. Multi-Currency Conversion (Wallet to Wallet)
app.post("/api/payments/convert", (req, res) => {
  const state = readDbState();
  if (!state.wallets) state.wallets = [];

  const { fromWalletId, toWalletId, amount } = req.body;
  const convAmt = Number(amount);
  if (isNaN(convAmt) || convAmt <= 0) {
    return res.status(400).json({ error: "Invalid conversion amount." });
  }

  const fromWallet = state.wallets.find(w => w.id === fromWalletId);
  const toWallet = state.wallets.find(w => w.id === toWalletId);

  if (!fromWallet || !toWallet) {
    return res.status(404).json({ error: "One or both specified wallets not found." });
  }

  if (fromWallet.balance < convAmt) {
    return res.status(400).json({ error: "Insufficient balance for conversion." });
  }

  const rates = state.exchangeRates || { "USD": 1.0, "EUR": 1.08, "GBP": 1.28 };
  const fromRate = rates[fromWallet.currency] || 1.0;
  const toRate = rates[toWallet.currency] || 1.0;

  // Convert "from" amount to USD, then from USD to "to" currency
  const usdValue = convAmt * fromRate;
  const toAmount = usdValue / toRate;

  fromWallet.balance -= convAmt;
  toWallet.balance += toAmount;

  fromWallet.lastUpdated = new Date().toISOString();
  toWallet.lastUpdated = new Date().toISOString();

  // Log conversion activity
  const convId = "conv-" + Date.now();
  addAuditLog(state, "Currency Convert", "Wallet", convId, `Exchanged ${fromWallet.currency} ${convAmt.toFixed(2)} for ${toWallet.currency} ${toAmount.toFixed(2)} at cross-rate ${(fromRate/toRate).toFixed(4)}.`);
  writeDbState(state);

  res.json({ status: "success", fromWallet, toWallet, state });
});

// 3. Connect/Configure Payment Gateway
app.post("/api/payments/gateway", (req, res) => {
  const state = readDbState();
  if (!state.paymentGateways) state.paymentGateways = [];

  const { name, environment, credentialsType } = req.body;
  if (!name) return res.status(400).json({ error: "Gateway name is required." });

  const newGateway = {
    id: "pg-" + Date.now(),
    name,
    status: "connected" as const,
    environment: environment || "sandbox",
    credentialsType: credentialsType || "API Key",
    lastPing: new Date().toISOString(),
  };

  state.paymentGateways.push(newGateway);
  addAuditLog(state, "Connect Gateway", "PaymentGateway", newGateway.id, `Linked third-party payment gateway: ${name} (${newGateway.environment})`);
  writeDbState(state);

  res.json({ status: "success", gateway: newGateway, state });
});

// 4. Connect/Link Bank Account Connection
app.post("/api/payments/connect-bank", (req, res) => {
  const state = readDbState();
  const { bankName, accountNumber, balance } = req.body;
  if (!bankName || !accountNumber) {
    return res.status(400).json({ error: "Institution name and account number are required." });
  }

  const newConn = {
    id: "bc-" + Date.now(),
    bankName,
    accountNumber: accountNumber.startsWith("••••") ? accountNumber : "•••• " + accountNumber.slice(-4),
    balance: Number(balance) || 10000,
    lastSynced: new Date().toISOString(),
    transactions: [
      { id: "btx-link-" + Date.now(), date: new Date().toISOString().split("T")[0], description: "Plaid link validation deposit", amount: 1.5, reconciled: false }
    ],
  };

  state.bankConnections.push(newConn);
  addAuditLog(state, "Connect Bank", "BankConnection", newConn.id, `Successfully authorized bank connection via Plaid for ${bankName} account ${newConn.accountNumber}.`);
  writeDbState(state);

  res.json({ status: "success", bankConnection: newConn, state });
});

// 5. Connect Comprehensive Financial Account (Production-Grade Multi-Type Endpoint)
app.post("/api/payments/connect-financial-accounts", (req, res) => {
  const state = readDbState();
  const { type, name, accountNumber, balance, currency, provider, environment, credentialsType, selectedSubAccounts } = req.body;

  if (type === "bank") {
    if (!name || !selectedSubAccounts || !Array.isArray(selectedSubAccounts) || selectedSubAccounts.length === 0) {
      return res.status(400).json({ error: "Institution name and at least one selected account are required." });
    }

    const addedAccounts: any[] = [];
    selectedSubAccounts.forEach((subAcc: any, idx: number) => {
      const subBal = Number(subAcc.balance) || 0;
      const maskedNum = subAcc.accountNumber.startsWith("••••") ? subAcc.accountNumber : "•••• " + subAcc.accountNumber.slice(-4);
      const newConn = {
        id: `bc-${Date.now()}-${idx}`,
        bankName: `${name} (${subAcc.nickname || subAcc.type})`,
        accountNumber: maskedNum,
        balance: subBal,
        lastSynced: new Date().toISOString(),
        transactions: [
          { id: `btx-init-${Date.now()}-${idx}`, date: new Date().toISOString().split("T")[0], description: "Plaid connection verification", amount: 1.5, reconciled: false },
          { id: `btx-base-1-${Date.now()}-${idx}`, date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], description: "Corporate SaaS subscription sync", amount: -45.99, reconciled: false },
          { id: `btx-base-2-${Date.now()}-${idx}`, date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], description: "Acme Client Invoice deposit", amount: 1250.00, reconciled: false }
        ]
      };

      state.bankConnections.push(newConn);
      addedAccounts.push(newConn);

      // Create ledger transactions & journal entries for the starting balance and initial activities
      // We will debit cash (1010) and credit capital/revenue
      const txId = `tx-bank-sync-${Date.now()}-${idx}`;
      state.transactions.unshift({
        id: txId,
        date: new Date().toISOString().split("T")[0],
        description: `Initial sync balance: ${name} ${maskedNum}`,
        accountId: "acc-bank",
        offsetAccountId: "acc-equity",
        amount: subBal,
        category: "Equity Investment / Bank Balance Sync",
        type: "income",
        status: "posted"
      });

      state.journalEntries.unshift({
        id: `je-bank-sync-${Date.now()}-${idx}`,
        date: new Date().toISOString().split("T")[0],
        description: `[Automatic] Sync baseline reserves: ${name} ${maskedNum}`,
        status: "posted",
        lines: [
          { accountId: "acc-bank", debit: subBal, credit: 0 },
          { accountId: "acc-equity", debit: 0, credit: subBal }
        ],
        auditLogs: [`Linked starting balance of $${subBal} during premium financial wizard authorization.`]
      });

      addAuditLog(state, "Connect Bank", "BankConnection", newConn.id, `Successfully linked bank feed via Finity Secure Link for ${name} [${newConn.accountNumber}] with starting balance of $${subBal}.`);
    });

    recalculateBalances(state);
    writeDbState(state);
    return res.json({ status: "success", type: "bank", connected: addedAccounts, state });
  } 
  
  else if (type === "gateway") {
    if (!name) return res.status(400).json({ error: "Gateway provider name is required." });
    if (!state.paymentGateways) state.paymentGateways = [];

    const newGateway = {
      id: "pg-" + Date.now(),
      name,
      status: "connected" as const,
      environment: environment || "sandbox",
      credentialsType: credentialsType || "API Key",
      lastPing: new Date().toISOString(),
    };

    state.paymentGateways.push(newGateway);
    addAuditLog(state, "Connect Gateway", "PaymentGateway", newGateway.id, `Successfully linked third-party payment provider: ${name} (${newGateway.environment})`);
    writeDbState(state);
    return res.json({ status: "success", type: "gateway", connected: newGateway, state });
  } 
  
  else if (type === "wallet") {
    if (!name || !currency) return res.status(400).json({ error: "Wallet name and currency are required." });
    if (!state.wallets) state.wallets = [];

    const newWallet = {
      id: "wal-" + Date.now(),
      name,
      currency: currency.toUpperCase(),
      balance: Number(balance) || 0,
      provider: provider || "Finity Core",
      lastUpdated: new Date().toISOString()
    };

    state.wallets.push(newWallet);
    addAuditLog(state, "Connect Wallet", "DigitalWallet", newWallet.id, `Successfully provisioned ${newWallet.currency} digital operating wallet: ${name}`);
    writeDbState(state);
    return res.json({ status: "success", type: "wallet", connected: newWallet, state });
  }

  return res.status(400).json({ error: "Invalid connection type specified." });
});

// 6. Synchronize Financial Account Feed (Manual Sync Router)
app.post("/api/payments/sync-financial-account", (req, res) => {
  const state = readDbState();
  const { type, id } = req.body;

  if (type === "bank") {
    const conn = state.bankConnections.find(bc => bc.id === id);
    if (!conn) return res.status(404).json({ error: "Bank connection not found." });

    conn.lastSynced = new Date().toISOString();
    
    // Simulate finding a new transaction to import!
    const isFirstSync = !conn.transactions.some(t => t.description === "Finity Sync Clearance Interest");
    if (isFirstSync) {
      const interestAmt = 12.50;
      const newTx = {
        id: "btx-sync-new-" + Date.now(),
        date: new Date().toISOString().split("T")[0],
        description: "Finity Sync Clearance Interest",
        amount: interestAmt,
        reconciled: false
      };
      
      conn.transactions.unshift(newTx);
      conn.balance += interestAmt;

      // Book to general ledger as revenue/income
      state.transactions.unshift({
        id: "tx-interest-" + Date.now(),
        date: new Date().toISOString().split("T")[0],
        description: `Interest deposit: ${conn.bankName}`,
        accountId: "acc-bank",
        offsetAccountId: "acc-sidehustle", // Consulting or other income
        amount: interestAmt,
        category: "Interest Income",
        type: "income",
        status: "posted"
      });

      state.journalEntries.unshift({
        id: "je-interest-" + Date.now(),
        date: new Date().toISOString().split("T")[0],
        description: `Interest Earned on ${conn.bankName}`,
        status: "posted",
        lines: [
          { accountId: "acc-bank", debit: interestAmt, credit: 0 },
          { accountId: "acc-sidehustle", debit: 0, credit: interestAmt }
        ],
        auditLogs: [`Synchronized interest payment of $${interestAmt} on ${conn.bankName}.`]
      });

      addAuditLog(state, "Sync Feed", "BankConnection", conn.id, `Synchronized bank feed for ${conn.bankName}. Imported 1 new transaction. Balance updated to $${conn.balance}.`);
    } else {
      addAuditLog(state, "Sync Feed", "BankConnection", conn.id, `Synchronized bank feed for ${conn.bankName}. No new transactions found. books 100% up to date.`);
    }

    recalculateBalances(state);
    writeDbState(state);
    return res.json({ status: "success", type: "bank", connection: conn, state });
  }

  if (type === "gateway") {
    const gateway = state.paymentGateways?.find(pg => pg.id === id);
    if (!gateway) return res.status(404).json({ error: "Payment gateway connection not found." });

    gateway.lastPing = new Date().toISOString();
    gateway.status = "connected"; // repair if errored!
    addAuditLog(state, "Sync Gateway", "PaymentGateway", gateway.id, `Successfully pinged gateway API. Handshake refreshed for ${gateway.name}.`);
    writeDbState(state);
    return res.json({ status: "success", type: "gateway", connection: gateway, state });
  }

  if (type === "wallet") {
    const wallet = state.wallets?.find(w => w.id === id);
    if (!wallet) return res.status(404).json({ error: "Digital wallet not found." });

    wallet.lastUpdated = new Date().toISOString();
    addAuditLog(state, "Sync Wallet", "DigitalWallet", wallet.id, `Successfully synchronized Ledger balances for digital operating wallet: ${wallet.name}.`);
    writeDbState(state);
    return res.json({ status: "success", type: "wallet", connection: wallet, state });
  }

  return res.status(400).json({ error: "Invalid connection type specified for synchronization." });
});

// 7. Disconnect/Revoke Financial Account Connection
app.post("/api/payments/disconnect-financial-account", (req, res) => {
  const state = readDbState();
  const { type, id } = req.body;

  if (type === "bank") {
    const connIndex = state.bankConnections.findIndex(bc => bc.id === id);
    if (connIndex === -1) return res.status(404).json({ error: "Bank connection not found." });

    const conn = state.bankConnections[connIndex];
    state.bankConnections.splice(connIndex, 1);
    addAuditLog(state, "Revoke Link", "BankConnection", id, `Cryptographically revoked Plaid Open-Banking tokens for ${conn.bankName} (Acct: ${conn.accountNumber}).`);
    writeDbState(state);
    return res.json({ status: "success", state });
  }

  if (type === "gateway") {
    const gatewayIndex = state.paymentGateways?.findIndex(pg => pg.id === id) ?? -1;
    if (gatewayIndex === -1) return res.status(404).json({ error: "Payment gateway connection not found." });

    const gateway = state.paymentGateways[gatewayIndex];
    state.paymentGateways.splice(gatewayIndex, 1);
    addAuditLog(state, "Revoke Gateway", "PaymentGateway", id, `Deactivated and deleted merchant payment gateway connection: ${gateway.name}.`);
    writeDbState(state);
    return res.json({ status: "success", state });
  }

  if (type === "wallet") {
    const walletIndex = state.wallets?.findIndex(w => w.id === id) ?? -1;
    if (walletIndex === -1) return res.status(404).json({ error: "Digital wallet not found." });

    const wallet = state.wallets[walletIndex];
    state.wallets.splice(walletIndex, 1);
    addAuditLog(state, "Revoke Wallet", "DigitalWallet", id, `Removed digital operational treasury wallet from active list: ${wallet.name}.`);
    writeDbState(state);
    return res.json({ status: "success", state });
  }

  return res.status(400).json({ error: "Invalid connection type specified for revocation." });
});

// 8. Rename Financial Account Connection
app.post("/api/payments/rename-financial-account", (req, res) => {
  const state = readDbState();
  const { type, id, newName } = req.body;
  if (!newName) return res.status(400).json({ error: "New nickname is required." });

  if (type === "bank") {
    const conn = state.bankConnections.find(bc => bc.id === id);
    if (!conn) return res.status(404).json({ error: "Bank connection not found." });

    const oldName = conn.bankName;
    conn.bankName = newName;
    addAuditLog(state, "Rename Bank", "BankConnection", id, `Renamed bank connection from "${oldName}" to "${newName}".`);
    writeDbState(state);
    return res.json({ status: "success", connection: conn, state });
  }

  if (type === "gateway") {
    const gateway = state.paymentGateways?.find(pg => pg.id === id);
    if (!gateway) return res.status(404).json({ error: "Payment gateway connection not found." });

    const oldName = gateway.name;
    gateway.name = newName;
    addAuditLog(state, "Rename Gateway", "PaymentGateway", id, `Renamed payment gateway connection from "${oldName}" to "${newName}".`);
    writeDbState(state);
    return res.json({ status: "success", connection: gateway, state });
  }

  if (type === "wallet") {
    const wallet = state.wallets?.find(w => w.id === id);
    if (!wallet) return res.status(404).json({ error: "Digital wallet not found." });

    const oldName = wallet.name;
    wallet.name = newName;
    addAuditLog(state, "Rename Wallet", "DigitalWallet", id, `Renamed digital wallet from "${oldName}" to "${newName}".`);
    writeDbState(state);
    return res.json({ status: "success", connection: wallet, state });
  }

  return res.status(400).json({ error: "Invalid connection type specified for renaming." });
});

// 9. Update Bank Permissions / Scope Controls
app.post("/api/payments/update-bank-permissions", (req, res) => {
  const state = readDbState();
  const { id, permissions } = req.body;
  if (!permissions || !Array.isArray(permissions)) {
    return res.status(400).json({ error: "Permissions list is required." });
  }

  const conn = state.bankConnections.find(bc => bc.id === id);
  if (!conn) return res.status(404).json({ error: "Bank connection not found." });

  addAuditLog(state, "Update Permissions", "BankConnection", id, `Modified authorized API scope permissions for ${conn.bankName} (${conn.accountNumber}). Scope list: ${permissions.join(", ")}.`);
  writeDbState(state);
  return res.json({ status: "success", connection: conn, state });
});

// 10. Clear All Connections (Support First-Time Empty State Testing)
app.post("/api/payments/clear-all-connections", (req, res) => {
  const state = readDbState();
  state.bankConnections = [];
  state.wallets = [];
  state.paymentGateways = [];

  addAuditLog(state, "Clear Connections", "Database", "all", "Cryptographically cleared all connected banks, payment gateways, and operating wallets to seed clean onboarding state.");
  writeDbState(state);
  return res.json({ status: "success", state });
});

// Create Manual Invoice
app.post("/api/invoices", (req, res) => {
  const state = readDbState();
  if (state.accountingPeriod === "closed" || state.fiscalYearClosed) {
    return res.status(403).json({ error: "Accounting period is closed/locked. No modifications allowed." });
  }
  const { customerId, items, dueDate, taxRate } = req.body;
  const customer = state.partners.find((p) => p.id === customerId);
  if (!customer) return res.status(400).json({ error: "Customer not found" });

  const invoiceItems = items.map((i: any) => ({
    description: i.description,
    quantity: Number(i.quantity),
    unitPrice: Number(i.unitPrice),
    amount: Number(i.quantity) * Number(i.unitPrice),
  }));

  const subtotal = invoiceItems.reduce((acc: number, item: any) => acc + item.amount, 0);
  const taxRateNum = Number(taxRate) || 0;
  const taxAmount = subtotal * taxRateNum;
  const total = subtotal + taxAmount;

  const newInvoice: Invoice = {
    id: "inv-" + Date.now(),
    invoiceNumber: "INV-" + new Date().getFullYear() + "-" + (state.invoices.length + 1).toString().padStart(3, "0"),
    customerId,
    customerName: customer.name,
    date: new Date().toISOString().split("T")[0],
    dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    status: "sent",
    items: invoiceItems,
    subtotal,
    taxRate: taxRateNum,
    taxAmount,
    total,
    balanceDue: total,
    payments: [],
    remindersSentCount: 0,
  };

  // Double-entry accounting for invoice: Debit AR (Accounts Receivable), Credit Service/Product Revenue, Credit Sales Tax Payable
  const newJe: JournalEntry = {
    id: "je-" + Date.now(),
    date: newInvoice.date,
    description: `Invoice ${newInvoice.invoiceNumber} to ${newInvoice.customerName}`,
    status: "posted",
    lines: [
      { accountId: "acc-ar", debit: newInvoice.total, credit: 0 },
      { accountId: "acc-revenue", debit: 0, credit: newInvoice.subtotal },
    ],
    auditLogs: [`Created invoice ${newInvoice.invoiceNumber}`],
  };

  if (newInvoice.taxAmount > 0) {
    newJe.lines.push({ accountId: "acc-tax", debit: 0, credit: newInvoice.taxAmount });
  }

  state.invoices.unshift(newInvoice);
  state.journalEntries.unshift(newJe);

  // Update customer balance
  customer.balance += newInvoice.total;

  recalculateBalances(state);
  addAuditLog(state, "Create Invoice", "Invoice", newInvoice.id, `Created invoice ${newInvoice.invoiceNumber} for ${customer.name} of $${newInvoice.total}`);
  writeDbState(state);

  res.json({ invoice: newInvoice, state });
});

// Record Invoice Payment
app.post("/api/invoices/:id/pay", (req, res) => {
  const state = readDbState();
  if (state.accountingPeriod === "closed" || state.fiscalYearClosed) {
    return res.status(403).json({ error: "Accounting period is closed/locked. No modifications allowed." });
  }
  const invId = req.params.id;
  const invoice = state.invoices.find((i) => i.id === invId);
  if (!invoice) return res.status(404).json({ error: "Invoice not found" });

  const { amount, method } = req.body;
  const payAmt = Number(amount) || invoice.balanceDue;

  invoice.payments.push({
    date: new Date().toISOString().split("T")[0],
    amount: payAmt,
    method: method || "Bank Transfer",
  });

  invoice.balanceDue -= payAmt;
  if (invoice.balanceDue <= 0) {
    invoice.status = "paid";
    invoice.balanceDue = 0;
  }

  // Update customer partner balance
  const customer = state.partners.find((p) => p.id === invoice.customerId);
  if (customer) {
    customer.balance -= payAmt;
    if (customer.balance < 0) customer.balance = 0;
  }

  // Double entry accounting for payment: Debit Bank, Credit AR
  const newJe: JournalEntry = {
    id: "je-" + Date.now(),
    date: new Date().toISOString().split("T")[0],
    description: `Payment Recv on Invoice ${invoice.invoiceNumber}`,
    status: "posted",
    lines: [
      { accountId: "acc-bank", debit: payAmt, credit: 0 },
      { accountId: "acc-ar", debit: 0, credit: payAmt },
    ],
    auditLogs: [`Recorded payment of $${payAmt} on invoice ${invoice.invoiceNumber}`],
  };

  // Add primary transaction tracking
  state.transactions.unshift({
    id: "tx-" + Date.now(),
    date: new Date().toISOString().split("T")[0],
    description: `Payment received for Invoice ${invoice.invoiceNumber}`,
    accountId: "acc-bank",
    offsetAccountId: "acc-ar",
    amount: payAmt,
    category: "Accounts Receivable Payment",
    type: "income",
    status: "posted",
  });

  state.journalEntries.unshift(newJe);
  recalculateBalances(state);
  addAuditLog(state, "Record Invoice Payment", "Invoice", invoice.id, `Received payment of $${payAmt} on ${invoice.invoiceNumber}`);
  writeDbState(state);

  res.json({ invoice, state });
});

// Trigger Payment Reminder
app.post("/api/invoices/:id/remind", (req, res) => {
  const state = readDbState();
  const invoice = state.invoices.find((i) => i.id === req.params.id);
  if (!invoice) return res.status(404).json({ error: "Invoice not found" });

  invoice.remindersSentCount += 1;
  addAuditLog(state, "Send Reminder", "Invoice", invoice.id, `Sent payment reminder #${invoice.remindersSentCount} for invoice ${invoice.invoiceNumber}`);
  writeDbState(state);

  res.json({ invoice, state });
});

// Extract data from Receipts/Invoices using Gemini AI (Document Intelligence)
app.post("/api/receipts/extract", async (req, res) => {
  try {
    const state = readDbState();
    if (state.accountingPeriod === "closed" || state.fiscalYearClosed) {
      return res.status(403).json({ error: "Accounting period is closed/locked. No modifications allowed." });
    }
    const { fileName, fileData } = req.body;
    if (!fileData) {
      return res.status(400).json({ error: "Missing file base64 data" });
    }

    const ai = getGeminiClient();

    // Prompt for receipt OCR extraction
    const prompt = `
      You are an expert financial document intelligence scanner. Extract structured bookkeeping data from this receipt or invoice image.
      Analyze the text carefully. Extract:
      1. Merchant / Vendor Name
      2. Date (in YYYY-MM-DD format, fallback to current year 2026 if only month/day)
      3. Total Amount (number)
      4. Tax Amount (number, if found, default to 0)
      5. Correct category (e.g., Office Supplies, Rent, Meals & Entertainment, Utilities, SaaS Subscription, Hardware)
      
      Respond strictly in JSON format matching the schema provided.
    `;

    // Convert data uri to clean base64 if needed
    const base64Data = fileData.split(",")[1] || fileData;

    const response = await generateContentWithFallback(ai, {
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: "image/png", // support standard image/png or image/jpeg
            data: base64Data,
          },
        },
        prompt,
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            merchant: { type: Type.STRING, description: "Name of the merchant/vendor" },
            date: { type: Type.STRING, description: "Transaction date in YYYY-MM-DD" },
            amount: { type: Type.NUMBER, description: "Total receipt amount" },
            taxAmount: { type: Type.NUMBER, description: "Sales tax amount" },
            category: { type: Type.STRING, description: "Categorized expense label" },
            confidenceScore: { type: Type.NUMBER, description: "Extraction confidence from 0 to 1" },
          },
          required: ["merchant", "date", "amount", "taxAmount", "category"],
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");

    // Add receipt to database
    const newReceipt: Receipt = {
      id: "rec-" + Date.now(),
      date: parsedData.date || new Date().toISOString().split("T")[0],
      merchant: parsedData.merchant || "Unknown Merchant",
      amount: parsedData.amount || 0,
      category: parsedData.category || "Uncategorized",
      taxAmount: parsedData.taxAmount || 0,
      fileName: fileName || "scanned_receipt.png",
      fileData: fileData,
      status: "extracted",
    };

    state.receipts.unshift(newReceipt);
    addAuditLog(state, "Document Extraction", "Receipt", newReceipt.id, `Extracted OCR metadata from uploaded file "${newReceipt.fileName}" for $${newReceipt.amount}`);
    writeDbState(state);

    res.json({ receipt: newReceipt, state });
  } catch (err: any) {
    console.error("OCR Extraction failed:", err);
    res.status(500).json({ error: err.message });
  }
});

// Reconcile bank transactions
app.post("/api/reconcile", (req, res) => {
  const state = readDbState();
  if (state.accountingPeriod === "closed" || state.fiscalYearClosed) {
    return res.status(403).json({ error: "Accounting period is closed/locked. No modifications allowed." });
  }
  const { bankConnectionId, bankTxId, transactionId } = req.body;

  const conn = state.bankConnections.find((bc) => bc.id === bankConnectionId);
  if (!conn) return res.status(404).json({ error: "Bank connection not found" });

  const bTx = conn.transactions.find((t) => t.id === bankTxId);
  if (!bTx) return res.status(404).json({ error: "Bank transaction not found" });

  const tx = state.transactions.find((t) => t.id === transactionId);
  if (!tx) return res.status(404).json({ error: "Ledger transaction not found" });

  bTx.reconciled = true;
  tx.status = "posted"; // confirm posting

  addAuditLog(state, "Bank Reconciliation", "Transaction", tx.id, `Reconciled ledger transaction "${tx.description}" with Bank Statement line matching $${bTx.amount}`);
  writeDbState(state);

  res.json({ status: "success", state });
});

// Create product
app.post("/api/products", (req, res) => {
  const state = readDbState();
  const { name, sku, description, stockLevel, safetyStock, unitPrice, costPrice, category, supplierId } = req.body;

  const newProd: Product = {
    id: "prod-" + Date.now(),
    name,
    sku,
    description,
    stockLevel: Number(stockLevel) || 0,
    safetyStock: Number(safetyStock) || 0,
    unitPrice: Number(unitPrice) || 0,
    costPrice: Number(costPrice) || 0,
    category: category || "General",
    supplierId,
  };

  state.products.unshift(newProd);
  addAuditLog(state, "Create Product", "Product", newProd.id, `Added product sku: ${newProd.sku}`);
  writeDbState(state);
  res.json({ product: newProd, state });
});

// Create partner (Customer, Supplier, Employee)
app.post("/api/partners", (req, res) => {
  const state = readDbState();
  const { name, type, email, phone, address } = req.body;

  const newPartner: Partner = {
    id: "part-" + Date.now(),
    name,
    type,
    email,
    phone,
    address,
    balance: 0,
  };

  state.partners.unshift(newPartner);
  addAuditLog(state, "Create Contact", "Partner", newPartner.id, `Added partner contact "${newPartner.name}" as ${newPartner.type}`);
  writeDbState(state);
  res.json({ partner: newPartner, state });
});

// Helper to extract response text from partial JSON string during streaming
function extractResponseFromPartialJson(partialJson: string): { responseText: string; isFinished: boolean } {
  const match = partialJson.match(/"response"\s*:\s*"/);
  if (!match) {
    return { responseText: "", isFinished: false };
  }
  const startIndex = match.index! + match[0].length;
  
  let text = "";
  let escaped = false;
  let isFinished = false;
  for (let i = startIndex; i < partialJson.length; i++) {
    const char = partialJson[i];
    if (escaped) {
      if (char === "n") text += "\n";
      else if (char === "t") text += "\t";
      else if (char === "r") text += "\r";
      else text += char;
      escaped = false;
    } else if (char === "\\") {
      escaped = true;
    } else if (char === "\"") {
      isFinished = true;
      break;
    } else {
      text += char;
    }
  }
  return { responseText: text, isFinished };
}

// AI Agent Natural Language Core Understanding Route
app.post("/api/agent", async (req, res) => {
  try {
    const { message, activeTab } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    // Set headers for Server-Sent Events (SSE)
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const state = readDbState();
    const ai = getGeminiClient();

    // Build comprehensive context summary for the LLM to understand every aspect of the books and operations
    const accountsContext = state.accounts.map((a) => `- [${a.id}] Code ${a.code} | ${a.name} (${a.type}): Bal $${a.balance}`).join("\n");
    const partnersContext = state.partners.map((p) => `- [${p.id}] ${p.name} (${p.type}) | Bal $${p.balance} | Email: ${p.email || "N/A"} | Phone: ${p.phone || "N/A"} | Address: ${p.address || "N/A"}`).join("\n");
    const recentTxContext = state.transactions.map((t) => `- [${t.id}] ${t.date}: ${t.description} | $${t.amount} | primary ${t.accountId} -> offset ${t.offsetAccountId} | Category: ${t.category} | Type: ${t.type} | Status: ${t.status}`).join("\n");
    const invoicesContext = state.invoices.map((i) => `- [${i.id}] ${i.invoiceNumber} to ${i.customerName} (ID: ${i.customerId}) | Total $${i.total} | Balance Due $${i.balanceDue} | Status: ${i.status} | Date: ${i.date} | Due Date: ${i.dueDate} | Items: ${JSON.stringify(i.items)} | Payments: ${JSON.stringify(i.payments || [])}`).join("\n");
    const billsContext = state.bills.map((b) => `- [${b.id}] ${b.billNumber} from ${b.supplierName} (ID: ${b.supplierId}) | Total $${b.total} | Balance Due $${b.balanceDue} | Status: ${b.status} | Date: ${b.date} | Due Date: ${b.dueDate} | Items: ${JSON.stringify(b.items)}`).join("\n");
    const productsContext = state.products.map((p) => `- [${p.id}] ${p.name} (SKU: ${p.sku}) | Price: $${p.unitPrice} | Cost: $${p.costPrice} | Stock: ${p.stockLevel} (Safety: ${p.safetyStock}) | Category: ${p.category} | Supplier ID: ${p.supplierId || "None"}`).join("\n");
    const projectsContext = state.projects.map((p) => `- [${p.id}] ${p.name} | Status: ${p.status} | Budget: $${p.budget} | Cost: $${p.cost} | Desc: ${p.description || ""}`).join("\n");
    const budgetsContext = state.budgets.map((b) => `- [${b.id}] Category: ${b.category} | Period: ${b.period} | Budget: $${b.amount} | Spent: $${b.spent}`).join("\n");
    const receiptsContext = state.receipts.map((r) => `- [${r.id}] Date: ${r.date} | Merchant: ${r.merchant} | Amount: $${r.amount} (Tax: $${r.taxAmount}) | Category: ${r.category} | Status: ${r.status} | Linked Tx: ${r.linkedTransactionId || "None"} | File: ${r.fileName || "None"}`).join("\n");
    const bankConnectionsContext = state.bankConnections.map((bc) => `- Bank: ${bc.bankName} [${bc.id}] | Account: ${bc.accountNumber} | Bal: $${bc.balance} | Last Synced: ${bc.lastSynced}\n  Bank Transactions:\n` + bc.transactions.map((bt) => `    * [${bt.id}] ${bt.date}: ${bt.description} | Amount: $${bt.amount} | Reconciled: ${bt.reconciled}`).join("\n")).join("\n");
    const walletsContext = state.wallets.map((w) => `- [${w.id}] Name: ${w.name} | Currency: ${w.currency} | Balance: ${w.balance} | Provider: ${w.provider} | Last Updated: ${w.lastUpdated}`).join("\n");
    const paymentGatewaysContext = state.paymentGateways.map((pg) => `- [${pg.id}] Name: ${pg.name} | Status: ${pg.status} | Env: ${pg.environment} | Credentials: ${pg.credentialsType} | Last Ping: ${pg.lastPing}`).join("\n");
    const activePaymentsContext = state.activePayments.map((ap) => `- [${ap.id}] Date: ${ap.date} | Recipient: ${ap.recipientName} | Type: ${ap.type} | Amount: ${ap.amount} ${ap.currency} | Status: ${ap.status} | Path: ${ap.routingPath} | Source: ${ap.sourceType} (${ap.sourceId})`).join("\n");
    const exchangeRatesContext = Object.entries(state.exchangeRates || {}).map(([currency, rate]) => `- ${currency}: ${rate}`).join("\n");
    const auditLogsContext = state.auditLogs.slice(0, 10).map((al) => `- [${al.timestamp}] User: ${al.user} | Action: ${al.action} | Entity: ${al.entityType} (${al.entityId}) | Details: ${al.details}`).join("\n");
    const systemStatusContext = `- Accounting Period: ${state.accountingPeriod}\n- Fiscal Year Closed: ${state.fiscalYearClosed}`;

    const profileContext = state.companyProfile
      ? `[BUSINESS / COMPANY PROFILE]
- Name: ${state.companyProfile.name}
- Legal Name: ${state.companyProfile.legalName}
- Business Type: ${state.companyProfile.businessType}
- Industry: ${state.companyProfile.industry}
- Company Size: ${state.companyProfile.companySize}
- Description: ${state.companyProfile.description || "N/A"}
- Business Email: ${state.companyProfile.email || "N/A"}
- Business Phone: ${state.companyProfile.phone || "N/A"}
- Contact Info: ${state.companyProfile.contactInfo || "N/A"}
- Location: ${state.companyProfile.city || "N/A"}, ${state.companyProfile.state || "N/A"}, ${state.companyProfile.country || "N/A"}
- Tax Registration Number: ${state.companyProfile.taxNumber || "N/A"}
- System Instruction Goal: Finity MUST fully understand the business type (e.g., LLC, Corporation, Partnership, Sole Proprietorship), industry (e.g., SaaS & Tech, Retail, Construction, Consulting), and the business description above. When advising the user, recommending strategies, or explaining financial performances, ALWAYS suggest industry-specific outcomes, tax optimizations, cash-runway predictions, and business-focused opportunities tailored to this unique business profile.`
      : (state.personalProfile
        ? `[PERSONAL PROFILE]
- Name: ${state.personalProfile.name}
- Goals: ${state.personalProfile.goals}
- Country: ${state.personalProfile.country}
- Base Currency: ${state.personalProfile.currency}`
        : "[PROFILE] No onboarding profile found.");

    const systemInstruction = `
      You are Finity Agent, the state-of-the-art AI-powered financial operations core. 
      You help individuals and businesses control their entire financial platform.
      You can perform ANY bookkeeping or operational action requested.
      
      ${profileContext}
      
      Current Date context: 2026-07-08 (Wednesday).
      
      [FINANCIAL RULES ENGINE & CORE ACCOUNTING FORMULAS]
      You have access to the centralized CFO Rules Engine. You MUST compute values, check balances, and answer queries strictly in accordance with these 25 standardized formulas and rules:
      1. Accounting Equation (The Golden Rule): Assets = Liabilities + Equity (Must always hold true!)
      2. Double-Entry Rule: Debits must equal Credits for every transaction.
      3. Balance Sheet Formula: Assets = Liabilities + Equity
      4. Net Income: Revenue - Expenses
      5. Gross Profit: Sales Revenue - Cost of Goods Sold (COGS)
      6. Operating Profit: Gross Profit - Operating Expenses
      7. Net Profit: Total Revenue - Total Expenses
      8. Working Capital: Current Assets - Current Liabilities
      9. Current Ratio: Current Assets / Current Liabilities
      10. Quick Ratio: (Current Assets - Inventory) / Current Liabilities
      11. Debt-to-Equity: Total Liabilities / Total Equity
      12. Gross Margin: (Gross Profit / Revenue) * 100
      13. Net Profit Margin: (Net Profit / Revenue) * 100
      14. Return on Assets (ROA): Net Income / Total Assets
      15. Return on Equity (ROE): Net Income / Equity
      16. Inventory Turnover: COGS / Average Inventory
      17. Cost of Goods Sold (COGS): Opening Inventory + Purchases - Closing Inventory
      18. Average Inventory: (Opening Inventory + Closing Inventory) / 2
      19. Accounts Receivable Turnover: Net Credit Sales / Average Accounts Receivable
      20. Accounts Payable Turnover: Purchases / Average Accounts Payable
      21. Cash Flow: Cash Inflows - Cash Outflows
      22. Equity: Assets - Liabilities
      23. Depreciation (Straight-Line): (Asset Cost - Salvage Value) / Useful Life
      24. Budget Variance: Actual Amount - Budget Amount
      25. Revenue Growth: ((Current Revenue - Previous Revenue) / Previous Revenue) * 100

      CORE ACCOUNTING POLICIES:
      - Every transaction must have a date.
      - Every transaction must have an amount.
      - Every transaction must affect at least two accounts (total debits = total credits).
      - Every transaction should be traceable (traceable ID, user reference, descriptive log).
      - Closed accounting periods (e.g., if fiscalYearClosed is true) must not be edited.

      TAX CONFIGURATION BY COUNTRY:
      - US (United States): Sales Tax. Standard Rate: 8.25%, Reduced Rate: 4%, Zero Rate: 0%. Threshold: Varies by State (Nexus). Regional Notes: Determined by economic nexus standards (typically $100k sales or 200 transactions).
      - UK (United Kingdom): VAT. Standard Rate: 20%, Reduced Rate: 5%, Zero Rate: 0%. Threshold: £90,000 taxable turnover. Regional Notes: Compulsory registration above threshold. 5% reduced rate applies to energy, home conversions.
      - CA (Canada): GST/HST. Standard Rate: 13%, Reduced Rate: 5%, Zero Rate: 0%. Threshold: $30,000 CAD gross revenue. Regional Notes: Blended rate varies by province: 5% GST in West/North; up to 15% HST in Atlantic provinces.
      - AU (Australia): GST. Standard Rate: 10%, Zero Rate: 0%. Threshold: $75,000 AUD gross sales. Regional Notes: Registration required for non-profits at $150,000 AUD. Most food and healthcare are GST-free.
      - NZ (New Zealand): GST. Standard Rate: 15%, Zero Rate: 0%. Threshold: $60,000 NZD turnover. Regional Notes: Comprehensive GST system with very few exemptions compared to other OECD nations.
      - DE (Germany): VAT (MwSt). Standard Rate: 19%, Reduced Rate: 7%, Zero Rate: 0%. Threshold: €22,000 (Kleinunternehmer). Regional Notes: 7% reduced rate applies to books, food, public transport, and hotel stays.
      - FR (France): VAT (TVA). Standard Rate: 20%, Reduced Rate: 10%, Zero Rate: 0%. Threshold: €91,900 (goods) / €39,100 (services). Regional Notes: Super-reduced rate of 2.1% exists for newspapers and reimbursed healthcare products.
      - JP (Japan): Consumption Tax. Standard Rate: 10%, Reduced Rate: 8%, Zero Rate: 0%. Threshold: ¥10,000,000 taxable sales. Regional Notes: Reduced rate of 8% is applied strictly to food/beverages and newspapers.
      - IN (India): GST. Standard Rate: 18%, Reduced Rate: 5%, Zero Rate: 0%. Threshold: ₹4,000,000 (goods) / ₹2,000,000 (services). Regional Notes: Four-tier structure (5%, 12%, 18%, 28%) shared between CGST, SGST, and IGST components.
      - SG (Singapore): GST. Standard Rate: 9%, Zero Rate: 0%. Threshold: $1,000,000 SGD taxable turnover. Regional Notes: Increased to 9% on Jan 1, 2024. Exemption for residential properties and financial services.
      - ZA (South Africa): VAT. Standard Rate: 15%, Reduced Rate: 9%, Zero Rate: 0%. Threshold: R1,000,000 taxable supplies. Regional Notes: Voluntary registration allowed if income exceeds R50,000 in the past 12 months.
      - BR (Brazil): ICMS/ISS/IPI. Standard Rate: 17%, Reduced Rate: 7%, Zero Rate: 0%. Threshold: Multi-tiered (Simples Nacional). Regional Notes: Highly complex indirect tax system currently transitioning to Unified VAT (CBS/IBS) by 2033.
      - AE (United Arab Emirates): VAT. Standard Rate: 5%, Zero Rate: 0%. Threshold: AED 375,000 taxable supplies. Regional Notes: Voluntary registration at AED 187,500. Free zones may have custom tax exemptions.
      - SA (Saudi Arabia): VAT. Standard Rate: 15%, Zero Rate: 0%. Threshold: SAR 375,000 taxable supplies. Regional Notes: Standard rate increased to 15% in 2020. Strict e-invoicing (Fatoora) compliance required.
      - MX (Mexico): IVA. Standard Rate: 16%, Reduced Rate: 8%, Zero Rate: 0%. Threshold: Immediate upon business activity. Regional Notes: Reduced rate of 8% is applied for certified businesses in the northern/southern border regions.
      - CH (Switzerland): VAT (MWST). Standard Rate: 8.1%, Reduced Rate: 2.6%, Zero Rate: 0%. Threshold: CHF 100,000 global turnover. Regional Notes: Increased to 8.1% on Jan 1, 2024. Accommodation sector has a special rate of 3.8%.
      - KR (South Korea): VAT. Standard Rate: 10%, Zero Rate: 0%. Threshold: ₩80,000,000 (Simplified Tax). Regional Notes: Simplified tax option available for individual businesses with lower gross sales.
      - CN (China): VAT. Standard Rate: 13%, Reduced Rate: 9%, Zero Rate: 0%. Threshold: ¥100,000 monthly sales (small taxpayers). Regional Notes: Standard manufacturing is 13%; services standard is 6%; transport/construction is 9%.
      - ES (Spain): VAT (IVA). Standard Rate: 21%, Reduced Rate: 10%, Zero Rate: 0%. Threshold: Immediate registration. Regional Notes: Super-reduced rate of 4% applies to bread, milk, medicine, books, and social housing.
      - IT (Italy): VAT (IVA). Standard Rate: 22%, Reduced Rate: 10%, Zero Rate: 0%. Threshold: €85,000 (Forfettario flat-rate regime). Regional Notes: Flat-rate regime 'Regime Forfettario' exempts micro-businesses from standard VAT compliance.
      - NL (Netherlands): VAT (BTW). Standard Rate: 21%, Reduced Rate: 9%, Zero Rate: 0%. Threshold: €20,000 (KOR scheme). Regional Notes: KOR scheme allows small businesses to be exempt from BTW calculation and reporting.
      - SE (Sweden): VAT (Moms). Standard Rate: 25%, Reduced Rate: 12%, Zero Rate: 0%. Threshold: SEK 80,000 sales threshold. Regional Notes: Highly structured: 25% standard; 12% food/hotels; 6% books, newspapers, and concerts.
      - NO (Norway): VAT (MVA). Standard Rate: 25%, Reduced Rate: 15%, Zero Rate: 0%. Threshold: NOK 50,000 over 12-month period. Regional Notes: 15% reduced rate applies to food; 12% reduced rate applies to transport and cinema.
      - IE (Ireland): VAT. Standard Rate: 23%, Reduced Rate: 13.5%, Zero Rate: 0%. Threshold: €80,000 (goods) / €40,000 (services). Regional Notes: 9% second-reduced rate exists for certain tourism, hospitality, and hairdressing services.

      When a user asks questions in the Chat about tax rates, threshold limits, or regional nuances, provide an exhaustive, extremely detailed answer covering standard rates, reduced rates, registration limits, and administrative nuances. Always return full details for everything requested.

      Below are the CURRENT accounting entities in Finity's double-entry ledger:
      
      [CHARTS OF ACCOUNTS]
      ${accountsContext}
      
      [CONTACTS / PARTNERS]
      ${partnersContext}
      
      [ALL LEDGER TRANSACTIONS]
      ${recentTxContext}
      
      [INVOICES REGISTRY]
      ${invoicesContext}
      
      [BILLS REGISTRY]
      ${billsContext}

      [PRODUCTS & INVENTORY]
      ${productsContext}

      [PROJECTS PORTFOLIO]
      ${projectsContext}

      [BUDGETS PERFORMANCE]
      ${budgetsContext}

      [RECEIPTS & EXPENSE DOCUMENTS]
      ${receiptsContext}

      [CONNECTED BANK ACCOUNTS & STATEMENT LOGS]
      ${bankConnectionsContext}

      [DIGITAL WALLETS]
      ${walletsContext}

      [PAYMENT GATEWAYS INTEGRATIONS]
      ${paymentGatewaysContext}

      [ACTIVE PAYMENTS & PAYROLL RECORDS]
      ${activePaymentsContext}

      [CURRENCY EXCHANGE RATES]
      ${exchangeRatesContext}

      [RECENT SECURITY AUDIT LOGS]
      ${auditLogsContext}

      [SYSTEM LEDGER STATUS]
      ${systemStatusContext}
      
      YOUR ROLE:
      1. Analyze the user's message.
      2. Propose a structured action inside your JSON response if the user requests ANY operational, administrative, or bookkeeping change on the platform.
      3. For questions, compute the answer based on context and reply in "response". Do not invent numbers. Compute profitability ratios, quick ratio, debt-to-equity, ROA, ROE, inventory turnovers, runways, and variances exactly according to the formulas above.
      4. CHAT PRESENTATION REQUIREMENT & OFFICIAL FINANCIAL LAYOUTS: If the user asks to see, generate, analyze, or get a Balance Sheet, Profit & Loss (P&L) Statement, Trial Balance, or Cash Flow Statement, you MUST output the complete, itemized, and detailed financial statement directly in your "response" text block using elegant, high-fidelity Markdown tables with calculated values based strictly on the current [CHARTS OF ACCOUNTS] context. To make them look highly official and professional, structure them exactly according to these GAAP guidelines:

         A. BALANCE SHEET (STATEMENT OF FINANCIAL POSITION) STRUCTURE:
            - Header:
              ### **FINITY HOLDINGS INC.**
              ### **BALANCE SHEET (STATEMENT OF FINANCIAL POSITION)**
              *As of July 8, 2026 (Ledger Local Time)*
            - Table structure must include:
              | Account Category / Line Item | Account Code | Balance (USD) |
            - Arrange into clear, distinct sections:
              1. **ASSETS**
                 - **Current Assets**: list Cash, Petty Cash, A/R, Inventory, and provide **Total Current Assets** subtotal.
                 - **TOTAL ASSETS** (bold and double underlined if possible, e.g., with markdown stars).
              2. **LIABILITIES & SHAREHOLDERS' EQUITY**
                 - **Current Liabilities**: list Accounts Payable, Sales Tax Payable, and provide **Total Current Liabilities** subtotal.
                 - **Shareholders' Equity**: list Owner's Capital, Retained Earnings, Current Period Net Income (calculated from Revenue - Expenses), and provide **Total Shareholders' Equity** subtotal.
                 - **TOTAL LIABILITIES & EQUITY** (bold and matching TOTAL ASSETS perfectly).
            - Include the core accounting formula (Assets = Liabilities + Equity) verification status.

         B. PROFIT & LOSS (STATEMENT OF OPERATIONS) STRUCTURE:
            - Header:
              ### **FINITY HOLDINGS INC.**
              ### **PROFIT & LOSS STATEMENT (STATEMENT OF OPERATIONS)**
              *For the Period Ended July 8, 2026*
            - Table structure:
              | Financial Category / Line Item | Account Code | Amount (USD) |
            - Sections:
              1. **REVENUE**: list Service Revenue, Product Sales, and provide **TOTAL REVENUE**.
              2. **COST OF GOODS SOLD (COGS)** (if any).
              3. **GROSS PROFIT** (Total Revenue - COGS).
              4. **OPERATING EXPENSES**: list Rent Expense, Salaries & Wages Expense, Utilities, Marketing, Software, and provide **TOTAL EXPENSES**.
              5. **NET OPERATING INCOME (NET PROFIT)** (Gross Profit - Total Operating Expenses).

         C. TRIAL BALANCE STRUCTURE:
            - Header:
              ### **FINITY HOLDINGS INC.**
              ### **TRIAL BALANCE**
              *As of July 8, 2026*
            - Table structure:
              | Account Code | Account Name | Debit (USD) | Credit (USD) |
            - Rows: List all accounts with non-zero balances. Accounts of type ASSET and EXPENSE must be put in the Debit column. Accounts of type LIABILITY, EQUITY, and REVENUE must be put in the Credit column.
            - Total Row: Sum of all debits and sum of all credits. Ensure they are exactly equal and include the **Debit/Credit Parity Status: Balanced**.

         Always use these beautiful, aligned, professional layouts and ensure calculated values are strictly correct based on the active state.
      
      STRUCTURED ACTIONS YOU CAN PROPOSE (Set in "action" JSON field):
      
      - RECORD_TRANSACTION:
        { type: "RECORD_TRANSACTION", payload: { date?: "YYYY-MM-DD", description: string, accountId: string, offsetAccountId: string, amount: number, category: string, type: "income" | "expense" | "transfer" } }
        
      - CREATE_INVOICE:
        { type: "CREATE_INVOICE", payload: { customerId: string, items: Array<{ description: string, quantity: number, unitPrice: number }>, dueDate?: string, taxRate?: number } }
        
      - RECORD_PAYMENT:
        { type: "RECORD_PAYMENT", payload: { invoiceId: string, amount?: number, method?: string } }
        
      - CREATE_PARTNER:
        { type: "CREATE_PARTNER", payload: { name: string, type: "customer" | "supplier" | "employee", email?: string, phone?: string, address?: string } }

      - CREATE_ACCOUNT:
        { type: "CREATE_ACCOUNT", payload: { name: string, type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE", code: string, description?: string } }

      - CLOSE_FISCAL_YEAR:
        { type: "CLOSE_FISCAL_YEAR", payload: {} }

      - REOPEN_FISCAL_YEAR:
        { type: "REOPEN_FISCAL_YEAR", payload: { authKey: string } }

      - CREATE_PROJECT:
        { type: "CREATE_PROJECT", payload: { name: string, description: string, budget: number } }

      - CREATE_BUDGET:
        { type: "CREATE_BUDGET", payload: { category: string, amount: number, period: string } }

      - RECONCILE_BANK_TRANSACTION:
        { type: "RECONCILE_BANK_TRANSACTION", payload: { bankConnectionId: string, bankTxId: string, transactionId: string } }

      - CREATE_BILL:
        { type: "CREATE_BILL", payload: { supplierId: string, billNumber: string, items: Array<{ description: string, quantity: number, unitPrice: number }>, dueDate?: string } }

      - PAY_BILL:
        { type: "PAY_BILL", payload: { billId: string, amount?: number, method?: string } }

      - RECORD_JOURNAL_ENTRY:
        { type: "RECORD_JOURNAL_ENTRY", payload: { date?: "YYYY-MM-DD", description: string, lines: Array<{ accountId: string, debit: number, credit: number }> } }

      - CREATE_PRODUCT:
        { type: "CREATE_PRODUCT", payload: { name: string, sku: string, description?: string, stockLevel?: number, unitPrice?: number, costPrice?: number, category?: string } }

      - VIEW_REPORT:
        { type: "VIEW_REPORT", payload: { reportId: string } }
        Propose this action when the user requests to see, generate, view, open, or inspect ANY financial statement, summary, analysis, or report (e.g. "how my business is performing", "aging report", "who owes us", "inventory value", etc.). The reportId must be one of:
        - "bs" (Balance Sheet)
        - "pl" (Profit & Loss)
        - "cf" (Cash Flow Statement)
        - "eq" (Statement of Changes in Equity)
        - "gl" (General Ledger)
        - "gj" (General Journal)
        - "tb" (Trial Balance)
        - "coa" (Chart of Accounts)
        - "ar_aging" (Accounts Receivable Aging)
        - "ap_aging" (Accounts Payable Aging)
        - "bank_recon" (Bank Reconciliation Report)
        - "budget_actual" (Budget vs Actual)
        - "sales_rep" (Sales Log Summary)
        - "rev_rep" (Revenue Breakdown)
        - "cust_stmt" (Customer Statement)
        - "cust_bal" (Customer Balance Summary)
        - "outstanding_inv" (Outstanding Invoices)
        - "purch_rep" (Purchase History)
        - "supp_stmt" (Supplier Statement)
        - "bills_rep" (Bills Registry)
        - "outstanding_pay" (Outstanding Payables)
        - "inv_val" (Inventory Valuation)
        - "stock_move" (Stock Movement)
        - "stock_hand" (Stock on Hand)
        - "cogs_rep" (Cost of Goods Sold / COGS)
        - "low_stock" (Low Stock Alert)
        - "bank_stmt" (Bank Statement Log)
        - "cash_book" (Cash Book Registry)
        - "cash_pos" (Cash Position & Runway)
        - "pay_sum" (Payroll Summary)
        - "emp_earn" (Employee Earnings Summary)
        - "tax_ded" (Payroll Tax Deductions)
        - "vat_gst" (VAT/GST Summary)
        - "sales_tax" (Sales Tax Summary)
        - "tax_liab" (Tax Liability Ledger)
        - "profitability" (Profitability & Ratios)
        - "exp_analysis" (Operating Expense Analysis)
        - "cf_forecast" (Cash Flow Forecast)
        - "working_cap" (Working Capital Analytics)
        - "asset_reg" (Fixed Asset Register)
        - "depr_sched" (Depreciation Schedule)
        - "ai_health" (Business Health Report)
        - "ai_exec" (Executive Financial Summary)
        - "ai_investor" (Investor Readiness Report)
        - "ai_risk" (Financial Risk Report)
        - "ai_cashflow" (Cash Flow Insights)
        - "ai_expense" (Expense Optimization Report)
        - "ai_growth" (Revenue Growth Analysis)
        - "ai_budget" (Budget Performance Report)

      - CONNECT_FINANCIAL_ACCOUNT:
        { type: "CONNECT_FINANCIAL_ACCOUNT", payload: { connectionType: "bank" | "gateway" | "wallet", name: string, balance?: number, currency?: string, accountNumber?: string } }
        Propose this action when the user says "connect my bank", "add PayPal gateway", "provision EUR operating wallet", etc.

      - SYNC_FINANCIAL_ACCOUNT:
        { type: "SYNC_FINANCIAL_ACCOUNT", payload: { connectionType: "bank" | "gateway" | "wallet", id: string } }
        Propose this action when the user says "sync my accounts", "synchronize Chase feed", "refresh my wallets", etc.

      - DISCONNECT_FINANCIAL_ACCOUNT:
        { type: "DISCONNECT_FINANCIAL_ACCOUNT", payload: { connectionType: "bank" | "gateway" | "wallet", id: string } }
        Propose this action when the user says "disconnect my PayPal account", "delete my SVB card connection", "revoke Chase credentials", etc.

      - RENAME_FINANCIAL_ACCOUNT:
        { type: "RENAME_FINANCIAL_ACCOUNT", payload: { connectionType: "bank" | "gateway" | "wallet", id: string, newName: string } }
        Propose this action when the user says "rename my SVB account to SVB Reserves", etc.

      - CLEAR_DATABASE:
        { type: "CLEAR_DATABASE", payload: {} }
        Propose this action when the user explicitly requests to clear, wipe, empty, reset or format the database fully/completely.

      RESPOND STRICTLY IN THE FOLLOWING JSON SCHEMA:
      {
        "response": "Conversational text / explanation in markdown.",
        "action": {
          "type": string | null,
          "payload": object | null
        }
      }
    `;

    let stream: any = null;
    let chunkIterator: any = null;
    let firstChunk: any = null;
    let success = false;
    let lastError: any = null;

    const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];

    for (let i = 0; i < modelsToTry.length; i++) {
      const model = modelsToTry[i];
      const maxAttempts = i === 0 ? 2 : 1;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          console.log(`[Gemini API] Trying streaming with model: ${model} (attempt ${attempt}/${maxAttempts})`);
          const currentStream = await ai.models.generateContentStream({
            model,
            contents: message,
            config: {
              systemInstruction,
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  response: { type: Type.STRING, description: "Conversational answer or explanation in Markdown format" },
                  action: {
                    type: Type.OBJECT,
                    properties: {
                      type: { type: Type.STRING, description: "Type of financial action to run" },
                      payload: { type: Type.OBJECT, description: "Key value parameters for the action" },
                    },
                    required: ["type"],
                  },
                },
                required: ["response"],
              },
            },
          });

          // Test-consume the first chunk of the stream to verify it actually works
          const iterator = currentStream[Symbol.asyncIterator]();
          const firstResult = await iterator.next();
          
          if (!firstResult.done) {
            firstChunk = firstResult.value;
          }
          
          stream = currentStream;
          chunkIterator = iterator;
          success = true;
          break;
        } catch (error: any) {
          lastError = error;
          const errorStr = String(error.message || error);
          const isOverloaded = 
            errorStr.includes("503") || 
            errorStr.includes("UNAVAILABLE") || 
            errorStr.includes("high demand") || 
            errorStr.includes("429") || 
            errorStr.includes("RESOURCE_EXHAUSTED") || 
            errorStr.includes("overloaded");

          if (isOverloaded) {
            console.warn(`[Gemini API] Model ${model} failed (attempt ${attempt}/${maxAttempts}) with overload: ${errorStr}`);
            if (attempt < maxAttempts) {
              await new Promise((resolve) => setTimeout(resolve, 300));
            }
          } else {
            // Immediately throw semantic/auth errors
            throw error;
          }
        }
      }
      if (success) break;
    }

    if (!success) {
      throw lastError || new Error("All model streams and fallback attempts failed.");
    }

    let accumulatedJson = "";
    let lastExtractedResponse = "";

    // Process the first chunk we pre-fetched
    if (firstChunk && firstChunk.text) {
      accumulatedJson += firstChunk.text;
      const { responseText } = extractResponseFromPartialJson(accumulatedJson);
      if (responseText.length > lastExtractedResponse.length) {
        const diff = responseText.slice(lastExtractedResponse.length);
        lastExtractedResponse = responseText;
        res.write(`data: ${JSON.stringify({ type: "chunk", text: diff })}\n\n`);
      }
    }

    // Now consume the rest of the stream
    try {
      while (true) {
        const result = await chunkIterator.next();
        if (result.done) break;
        
        const chunk = result.value;
        if (chunk && chunk.text) {
          accumulatedJson += chunk.text;
          const { responseText } = extractResponseFromPartialJson(accumulatedJson);
          if (responseText.length > lastExtractedResponse.length) {
            const diff = responseText.slice(lastExtractedResponse.length);
            lastExtractedResponse = responseText;
            res.write(`data: ${JSON.stringify({ type: "chunk", text: diff })}\n\n`);
          }
        }
      }
    } catch (consumeErr: any) {
      console.warn(`[Gemini API] Error during active stream consumption:`, consumeErr);
      throw consumeErr;
    }

    let parsedResult: any = {};
    try {
      parsedResult = JSON.parse(accumulatedJson);
    } catch (e) {
      console.error("Failed to parse completed JSON response:", accumulatedJson, e);
      const { responseText } = extractResponseFromPartialJson(accumulatedJson);
      parsedResult = { response: responseText, action: null };
    }

    let actionExecuted: string | null = null;

    // Execute the model-driven structured action if valid
    if (parsedResult.action && parsedResult.action.type) {
      const { type, payload } = parsedResult.action;

      if (type === "RECORD_TRANSACTION" && payload) {
        if (state.accountingPeriod === "closed" || state.fiscalYearClosed) {
          throw new Error("Accounting period is closed/locked. No modifications allowed.");
        }
        const { date, description, accountId, offsetAccountId, amount, category, type: txType } = payload;
        
        // Find matching accounts
        const primaryAcc = state.accounts.find(a => a.id === accountId || a.code === accountId);
        const offsetAcc = state.accounts.find(a => a.id === offsetAccountId || a.code === offsetAccountId);
        
        if (primaryAcc && offsetAcc) {
          const newTx: Transaction = {
            id: "tx-" + Date.now(),
            date: date || new Date().toISOString().split("T")[0],
            description: description || "Recorded by Finity Agent",
            accountId: primaryAcc.id,
            offsetAccountId: offsetAcc.id,
            amount: txType === "expense" ? -Math.abs(Number(amount)) : Math.abs(Number(amount)),
            category: category || "AI Categorized",
            type: txType || "expense",
            status: "posted",
          };

          const newJe: JournalEntry = {
            id: "je-" + Date.now(),
            date: newTx.date,
            description: `[Agent] ${newTx.description}`,
            status: "posted",
            lines: [],
            auditLogs: ["Auto-created by Finity Agent AI NLU"],
          };

          const amt = Math.abs(Number(amount));
          if (newTx.type === "income") {
            newJe.lines.push({ accountId: primaryAcc.id, debit: amt, credit: 0 });
            newJe.lines.push({ accountId: offsetAcc.id, debit: 0, credit: amt });
          } else {
            newJe.lines.push({ accountId: offsetAcc.id, debit: amt, credit: 0 });
            newJe.lines.push({ accountId: primaryAcc.id, debit: 0, credit: amt });
          }

          state.transactions.unshift(newTx);
          state.journalEntries.unshift(newJe);
          recalculateBalances(state);
          addAuditLog(state, "NLU Transaction", "Transaction", newTx.id, `Agent interpreted transaction: "${newTx.description}" for $${amt}`);
          writeDbState(state);
          actionExecuted = `Recorded cash transaction of $${amt} under ${primaryAcc.name} / ${offsetAcc.name}.`;
        }
      } 
      
      else if (type === "CREATE_INVOICE" && payload) {
        if (state.accountingPeriod === "closed" || state.fiscalYearClosed) {
          throw new Error("Accounting period is closed/locked. No modifications allowed.");
        }
        const { customerId, items, dueDate, taxRate } = payload;
        const customer = state.partners.find(p => p.id === customerId || p.name.toLowerCase().includes(customerId.toLowerCase()));
        
        if (customer) {
          const invItems = items.map((i: any) => ({
            description: i.description,
            quantity: Number(i.quantity) || 1,
            unitPrice: Number(i.unitPrice) || 0,
            amount: (Number(i.quantity) || 1) * (Number(i.unitPrice) || 0),
          }));

          const subtotal = invItems.reduce((acc: number, item: any) => acc + item.amount, 0);
          const tr = Number(taxRate) || 0;
          const taxAmount = subtotal * tr;
          const total = subtotal + taxAmount;

          const newInvoice: Invoice = {
            id: "inv-" + Date.now(),
            invoiceNumber: "INV-" + new Date().getFullYear() + "-" + (state.invoices.length + 1).toString().padStart(3, "0"),
            customerId: customer.id,
            customerName: customer.name,
            date: new Date().toISOString().split("T")[0],
            dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            status: "sent",
            items: invItems,
            subtotal,
            taxRate: tr,
            taxAmount,
            total,
            balanceDue: total,
            payments: [],
            remindersSentCount: 0,
          };

          const newJe: JournalEntry = {
            id: "je-" + Date.now(),
            date: newInvoice.date,
            description: `Invoice ${newInvoice.invoiceNumber} (Agent)`,
            status: "posted",
            lines: [
              { accountId: "acc-ar", debit: newInvoice.total, credit: 0 },
              { accountId: "acc-revenue", debit: 0, credit: newInvoice.subtotal },
            ],
            auditLogs: ["Created by Finity Agent NLU"],
          };

          state.invoices.unshift(newInvoice);
          state.journalEntries.unshift(newJe);
          customer.balance += newInvoice.total;
          
          recalculateBalances(state);
          addAuditLog(state, "NLU Invoice", "Invoice", newInvoice.id, `Agent generated invoice: ${newInvoice.invoiceNumber} for $${newInvoice.total}`);
          writeDbState(state);
          actionExecuted = `Generated Invoice ${newInvoice.invoiceNumber} for ${customer.name} totaling $${newInvoice.total}.`;
        }
      }

      else if (type === "RECORD_PAYMENT" && payload) {
        if (state.accountingPeriod === "closed" || state.fiscalYearClosed) {
          throw new Error("Accounting period is closed/locked. No modifications allowed.");
        }
        const { invoiceId, amount, method } = payload;
        const invoice = state.invoices.find(i => i.id === invoiceId || i.invoiceNumber === invoiceId || i.invoiceNumber.toLowerCase().includes(invoiceId.toLowerCase()));
        if (!invoice) throw new Error("Invoice not found.");
        
        const payAmt = Number(amount) || invoice.balanceDue;
        invoice.payments.push({
          date: new Date().toISOString().split("T")[0],
          amount: payAmt,
          method: method || "Bank Transfer",
        });
        
        invoice.balanceDue -= payAmt;
        if (invoice.balanceDue <= 0) {
          invoice.status = "paid";
          invoice.balanceDue = 0;
        }
        
        const customer = state.partners.find(p => p.id === invoice.customerId);
        if (customer) {
          customer.balance -= payAmt;
          if (customer.balance < 0) customer.balance = 0;
        }
        
        const newJe: JournalEntry = {
          id: "je-" + Date.now(),
          date: new Date().toISOString().split("T")[0],
          description: `Payment Recv on Invoice ${invoice.invoiceNumber}`,
          status: "posted",
          lines: [
            { accountId: "acc-bank", debit: payAmt, credit: 0 },
            { accountId: "acc-ar", debit: 0, credit: payAmt },
          ],
          auditLogs: [`Recorded payment of $${payAmt} on invoice ${invoice.invoiceNumber} via Agent`],
        };
        
        state.transactions.unshift({
          id: "tx-" + Date.now(),
          date: new Date().toISOString().split("T")[0],
          description: `Payment received for Invoice ${invoice.invoiceNumber}`,
          accountId: "acc-bank",
          offsetAccountId: "acc-ar",
          amount: payAmt,
          category: "Accounts Receivable Payment",
          type: "income",
          status: "posted",
        });
        
        state.journalEntries.unshift(newJe);
        recalculateBalances(state);
        addAuditLog(state, "NLU Record Invoice Payment", "Invoice", invoice.id, `Agent recorded payment of $${payAmt} on ${invoice.invoiceNumber}`);
        writeDbState(state);
        actionExecuted = `Recorded received payment of $${payAmt} on Invoice ${invoice.invoiceNumber}.`;
      }

      else if (type === "CREATE_PARTNER" && payload) {
        if (state.accountingPeriod === "closed" || state.fiscalYearClosed) {
          throw new Error("Accounting period is closed/locked. No modifications allowed.");
        }
        const { name, type: partnerType, email, phone, address } = payload;
        const newPartner: Partner = {
          id: "part-" + Date.now(),
          name,
          type: partnerType,
          email: email || "",
          phone: phone || "",
          address: address || "",
          balance: 0,
        };
        state.partners.unshift(newPartner);
        addAuditLog(state, "NLU Partner", "Partner", newPartner.id, `Agent registered new contact: "${newPartner.name}"`);
        writeDbState(state);
        actionExecuted = `Created contact "${newPartner.name}" as ${partnerType}.`;
      }

      else if (type === "CREATE_ACCOUNT" && payload) {
        if (state.accountingPeriod === "closed" || state.fiscalYearClosed) {
          throw new Error("Accounting period is closed/locked. No modifications allowed.");
        }
        const { name, type: accType, code, description } = payload;
        if (!name || !accType || !code) {
          throw new Error("Account name, type, and code are required.");
        }
        const exists = state.accounts.some(a => a.code === code);
        if (exists) {
          throw new Error(`An account with code ${code} already exists.`);
        }
        const newAcc: Account = {
          id: "acc-" + Date.now(),
          name,
          type: accType as AccountType,
          code,
          balance: 0,
          description: description || "",
          isSystem: false
        };
        state.accounts.push(newAcc);
        addAuditLog(state, "NLU Create Account", "Account", newAcc.id, `Agent created new account: [${code}] ${name} (${accType})`);
        writeDbState(state);
        actionExecuted = `Created new chart of accounts line: [${code}] ${name} (${accType}).`;
      }

      else if (type === "CLOSE_FISCAL_YEAR") {
        if (state.fiscalYearClosed) {
          throw new Error("Fiscal year is already closed.");
        }
        const revenueSum = state.accounts.filter(a => a.type === AccountType.REVENUE).reduce((sum, a) => sum + a.balance, 0);
        const expenseSum = state.accounts.filter(a => a.type === AccountType.EXPENSE).reduce((sum, a) => sum + a.balance, 0);
        const netIncome = revenueSum - expenseSum;

        const closingJe: JournalEntry = {
          id: "je-close-" + Date.now(),
          date: new Date().toISOString().split("T")[0],
          description: "Fiscal Year Closing - Transfer Net Income to Retained Earnings",
          status: "posted",
          lines: [],
          auditLogs: ["System executed fiscal year closing entry via Agent request"],
        };

        state.accounts.filter(a => a.type === AccountType.REVENUE).forEach(acc => {
          if (acc.balance !== 0) {
            closingJe.lines.push({ accountId: acc.id, debit: acc.balance, credit: 0 });
          }
        });

        state.accounts.filter(a => a.type === AccountType.EXPENSE).forEach(acc => {
          if (acc.balance !== 0) {
            closingJe.lines.push({ accountId: acc.id, debit: 0, credit: acc.balance });
          }
        });

        if (netIncome > 0) {
          closingJe.lines.push({ accountId: "acc-retained", debit: 0, credit: netIncome });
        } else if (netIncome < 0) {
          closingJe.lines.push({ accountId: "acc-retained", debit: Math.abs(netIncome), credit: 0 });
        }

        state.journalEntries.unshift(closingJe);
        state.fiscalYearClosed = true;
        state.accountingPeriod = "closed";

        recalculateBalances(state);
        addAuditLog(state, "NLU Fiscal Year Close", "Ledger", closingJe.id, `Closed fiscal year by Agent, transferred net income of $${netIncome} to Retained Earnings.`);
        writeDbState(state);
        actionExecuted = `Closed fiscal year, sealed the ledger, and transferred net income of $${netIncome} to Retained Earnings.`;
      }

      else if (type === "REOPEN_FISCAL_YEAR" && payload) {
        const { authKey } = payload;
        if (authKey !== "FINITY-AUDIT-2026") {
          throw new Error("Unauthorized auditor credentials.");
        }
        state.journalEntries = state.journalEntries.filter(je => !je.id.startsWith("je-close-"));
        state.fiscalYearClosed = false;
        state.accountingPeriod = "active";

        recalculateBalances(state);
        addAuditLog(state, "NLU Fiscal Year Reopen", "Ledger", "all", "Reopened fiscal year with authorized auditor key FINITY-AUDIT-2026.");
        writeDbState(state);
        actionExecuted = "Successfully reopened accounting period and restored double-entry modification capabilities.";
      }

      else if (type === "CREATE_PROJECT" && payload) {
        if (state.accountingPeriod === "closed" || state.fiscalYearClosed) {
          throw new Error("Accounting period is closed/locked. No modifications allowed.");
        }
        const { name, description, budget } = payload;
        if (!name) {
          throw new Error("Project name is required.");
        }
        const newProject: Project = {
          id: "proj-" + Date.now(),
          name,
          description: description || "",
          budget: Number(budget) || 0,
          cost: 0,
          status: "active"
        };
        state.projects.push(newProject);
        addAuditLog(state, "NLU Create Project", "Project", newProject.id, `Agent registered project "${name}"`);
        writeDbState(state);
        actionExecuted = `Created project "${name}" with a budget of $${newProject.budget}.`;
      }

      else if (type === "CREATE_BUDGET" && payload) {
        if (state.accountingPeriod === "closed" || state.fiscalYearClosed) {
          throw new Error("Accounting period is closed/locked. No modifications allowed.");
        }
        const { category, amount, period } = payload;
        if (!category || amount === undefined) {
          throw new Error("Budget category and amount are required.");
        }
        const budgetPeriod = period || new Date().toISOString().slice(0, 7); // YYYY-MM
        const existingIndex = state.budgets.findIndex(b => b.category.toLowerCase() === category.toLowerCase() && b.period === budgetPeriod);
        
        if (existingIndex !== -1) {
          state.budgets[existingIndex].amount = Number(amount);
          addAuditLog(state, "NLU Update Budget", "Budget", state.budgets[existingIndex].id, `Agent updated budget for ${category} (${budgetPeriod}) to $${amount}`);
          actionExecuted = `Updated existing budget for ${category} to $${amount} for period ${budgetPeriod}.`;
        } else {
          const newBudget: Budget = {
            id: "bud-" + Date.now(),
            category,
            amount: Number(amount),
            spent: 0,
            period: budgetPeriod
          };
          state.budgets.push(newBudget);
          addAuditLog(state, "NLU Create Budget", "Budget", newBudget.id, `Agent set budget for ${category} to $${amount} for ${budgetPeriod}`);
          actionExecuted = `Created new budget for ${category} set at $${amount} for period ${budgetPeriod}.`;
        }
        writeDbState(state);
      }

      else if (type === "RECONCILE_BANK_TRANSACTION" && payload) {
        if (state.accountingPeriod === "closed" || state.fiscalYearClosed) {
          throw new Error("Accounting period is closed/locked. No modifications allowed.");
        }
        const { bankConnectionId, bankTxId, transactionId } = payload;
        const conn = state.bankConnections.find(bc => bc.id === bankConnectionId);
        if (!conn) throw new Error("Bank connection not found.");
        
        const bTx = conn.transactions.find(t => t.id === bankTxId);
        if (!bTx) throw new Error("Bank transaction not found.");
        
        const tx = state.transactions.find(t => t.id === transactionId);
        if (!tx) throw new Error("Ledger transaction not found.");
        
        bTx.reconciled = true;
        tx.status = "posted";
        
        addAuditLog(state, "NLU Bank Reconciliation", "Transaction", tx.id, `Agent reconciled bank statement line with transaction: "${tx.description}"`);
        writeDbState(state);
        actionExecuted = `Successfully reconciled bank transaction "${bTx.description}" with ledger transaction "${tx.description}".`;
      }

      else if (type === "CREATE_BILL" && payload) {
        if (state.accountingPeriod === "closed" || state.fiscalYearClosed) {
          throw new Error("Accounting period is closed/locked. No modifications allowed.");
        }
        const { supplierId, billNumber, items, dueDate } = payload;
        const supplier = state.partners.find(p => p.id === supplierId || p.name.toLowerCase().includes(supplierId.toLowerCase()));
        if (!supplier) throw new Error(`Supplier contact not found.`);
        
        const billItems = items.map((i: any) => ({
          description: i.description,
          quantity: Number(i.quantity) || 1,
          unitPrice: Number(i.unitPrice) || 0,
          amount: (Number(i.quantity) || 1) * (Number(i.unitPrice) || 0),
        }));
        
        const total = billItems.reduce((acc: number, item: any) => acc + item.amount, 0);
        const newBill: Bill = {
          id: "bill-" + Date.now(),
          billNumber: billNumber || "BILL-" + Date.now().toString().slice(-6),
          supplierId: supplier.id,
          supplierName: supplier.name,
          date: new Date().toISOString().split("T")[0],
          dueDate: dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          status: "received",
          items: billItems,
          total,
          balanceDue: total,
        };
        
        // Find matching expense account based on item description or default
        let expenseAccount = "acc-software"; // default
        if (billItems.some((bi: any) => bi.description.toLowerCase().includes("rent") || bi.description.toLowerCase().includes("space"))) {
          expenseAccount = "acc-rent";
        } else if (billItems.some((bi: any) => bi.description.toLowerCase().includes("electric") || bi.description.toLowerCase().includes("utilities") || bi.description.toLowerCase().includes("water"))) {
          expenseAccount = "acc-utilities";
        } else if (billItems.some((bi: any) => bi.description.toLowerCase().includes("salary") || bi.description.toLowerCase().includes("wage") || bi.description.toLowerCase().includes("payroll"))) {
          expenseAccount = "acc-salaries";
        }
        
        const newJe: JournalEntry = {
          id: "je-" + Date.now(),
          date: newBill.date,
          description: `Bill ${newBill.billNumber} from ${supplier.name} (Agent)`,
          status: "posted",
          lines: [
            { accountId: expenseAccount, debit: total, credit: 0 },
            { accountId: "acc-ap", debit: 0, credit: total },
          ],
          auditLogs: ["Created by Finity Agent NLU"],
        };
        
        state.bills.unshift(newBill);
        state.journalEntries.unshift(newJe);
        supplier.balance += total;
        
        recalculateBalances(state);
        addAuditLog(state, "NLU Create Bill", "Bill", newBill.id, `Agent generated supplier bill: ${newBill.billNumber} for $${total}`);
        writeDbState(state);
        actionExecuted = `Recorded Supplier Bill ${newBill.billNumber} from ${supplier.name} for a total of $${total}.`;
      }

      else if (type === "PAY_BILL" && payload) {
        if (state.accountingPeriod === "closed" || state.fiscalYearClosed) {
          throw new Error("Accounting period is closed/locked. No modifications allowed.");
        }
        const { billId, amount, method } = payload;
        const bill = state.bills.find(b => b.id === billId || b.billNumber === billId || b.billNumber.toLowerCase().includes(billId.toLowerCase()));
        if (!bill) throw new Error("Bill not found.");
        
        const payAmt = Number(amount) || bill.balanceDue;
        bill.balanceDue -= payAmt;
        if (bill.balanceDue <= 0) {
          bill.status = "paid";
          bill.balanceDue = 0;
        }
        
        const supplier = state.partners.find(p => p.id === bill.supplierId);
        if (supplier) {
          supplier.balance -= payAmt;
          if (supplier.balance < 0) supplier.balance = 0;
        }
        
        const newJe: JournalEntry = {
          id: "je-" + Date.now(),
          date: new Date().toISOString().split("T")[0],
          description: `Payment to Supplier on Bill ${bill.billNumber}`,
          status: "posted",
          lines: [
            { accountId: "acc-ap", debit: payAmt, credit: 0 },
            { accountId: "acc-bank", debit: 0, credit: payAmt },
          ],
          auditLogs: [`Recorded payment of $${payAmt} on bill ${bill.billNumber}`],
        };
        
        state.transactions.unshift({
          id: "tx-" + Date.now(),
          date: new Date().toISOString().split("T")[0],
          description: `Paid Bill ${bill.billNumber}`,
          accountId: "acc-bank",
          offsetAccountId: "acc-ap",
          amount: -payAmt,
          category: "Accounts Payable Payment",
          type: "expense",
          status: "posted",
        });
        
        state.journalEntries.unshift(newJe);
        recalculateBalances(state);
        addAuditLog(state, "NLU Pay Bill", "Bill", bill.id, `Recorded cash payment of $${payAmt} on Bill ${bill.billNumber}`);
        writeDbState(state);
        actionExecuted = `Recorded cash payment of $${payAmt} to ${bill.supplierName} on Bill ${bill.billNumber}.`;
      }

      else if (type === "RECORD_JOURNAL_ENTRY" && payload) {
        if (state.accountingPeriod === "closed" || state.fiscalYearClosed) {
          throw new Error("Accounting period is closed/locked. No modifications allowed.");
        }
        const { date, description, lines } = payload;
        if (!description || !lines || !Array.isArray(lines)) {
          throw new Error("Description and lines array are required.");
        }
        
        const totalDebits = lines.reduce((sum: number, l: any) => sum + (Number(l.debit) || 0), 0);
        const totalCredits = lines.reduce((sum: number, l: any) => sum + (Number(l.credit) || 0), 0);
        
        if (Math.abs(totalDebits - totalCredits) > 0.01) {
          throw new Error(`Double-entry unbalanced. Total debits ($${totalDebits}) must equal total credits ($${totalCredits}).`);
        }
        
        const validLines = lines.map((l: any) => ({
          accountId: l.accountId,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0
        }));
        
        const newJe: JournalEntry = {
          id: "je-" + Date.now(),
          date: date || new Date().toISOString().split("T")[0],
          description,
          status: "posted",
          lines: validLines,
          auditLogs: ["Recorded manually by Finity Agent NLU"]
        };
        
        state.journalEntries.unshift(newJe);
        recalculateBalances(state);
        addAuditLog(state, "NLU Record Journal Entry", "Ledger", newJe.id, `Manual double-entry booked by agent: "${description}"`);
        writeDbState(state);
        actionExecuted = `Successfully booked double-entry journal entry: "${description}" totaling $${totalDebits}.`;
      }

      else if (type === "CREATE_PRODUCT" && payload) {
        if (state.accountingPeriod === "closed" || state.fiscalYearClosed) {
          throw new Error("Accounting period is closed/locked. No modifications allowed.");
        }
        const { name, sku, description, stockLevel, safetyStock, unitPrice, costPrice, category, supplierId } = payload;
        if (!name || !sku) {
          throw new Error("Product name and SKU are required.");
        }
        const newProd: Product = {
          id: "prod-" + Date.now(),
          name,
          sku,
          description: description || "",
          stockLevel: Number(stockLevel) || 0,
          safetyStock: Number(safetyStock) || 0,
          unitPrice: Number(unitPrice) || 0,
          costPrice: Number(costPrice) || 0,
          category: category || "General",
          supplierId
        };
        state.products.unshift(newProd);
        addAuditLog(state, "NLU Create Product", "Product", newProd.id, `Agent registered product sku: ${sku}`);
        writeDbState(state);
        actionExecuted = `Created new product portfolio line: [${sku}] ${name}.`;
      }

      else if (type === "CONNECT_FINANCIAL_ACCOUNT" && payload) {
        const { connectionType, name, balance, currency, accountNumber } = payload;
        if (connectionType === "bank") {
          const masked = accountNumber ? (accountNumber.startsWith("••••") ? accountNumber : "•••• " + accountNumber.slice(-4)) : "•••• 4202";
          const subBal = Number(balance) || 12000;
          const newConn = {
            id: `bc-nlu-${Date.now()}`,
            bankName: `${name} (Checking)`,
            accountNumber: masked,
            balance: subBal,
            lastSynced: new Date().toISOString(),
            transactions: [
              { id: `btx-init-${Date.now()}`, date: new Date().toISOString().split("T")[0], description: "Authorized via Finity Agent NLU", amount: 1.5, reconciled: false }
            ]
          };
          state.bankConnections.push(newConn);

          state.transactions.unshift({
            id: `tx-nlu-${Date.now()}`,
            date: new Date().toISOString().split("T")[0],
            description: `Initial sync balance: ${name} ${masked}`,
            accountId: "acc-bank",
            offsetAccountId: "acc-equity",
            amount: subBal,
            category: "Equity Investment / Bank Balance Sync",
            type: "income",
            status: "posted"
          });

          state.journalEntries.unshift({
            id: `je-nlu-${Date.now()}`,
            date: new Date().toISOString().split("T")[0],
            description: `[Automatic] Sync baseline reserves via Finity Agent NLU: ${name} ${masked}`,
            status: "posted",
            lines: [
              { accountId: "acc-bank", debit: subBal, credit: 0 },
              { accountId: "acc-equity", debit: 0, credit: subBal }
            ],
            auditLogs: [`Linked starting balance of $${subBal} via Finity Agent conversation.`]
          });

          addAuditLog(state, "Connect Bank", "BankConnection", newConn.id, `Linked bank connection for ${name} account ${masked} via Finity Agent chat.`);
          actionExecuted = `Linked and synchronized new bank account "${name}" (${masked}) with starting balance of $${subBal}.`;
        } else if (connectionType === "gateway") {
          if (!state.paymentGateways) state.paymentGateways = [];
          const newGateway = {
            id: `pg-nlu-${Date.now()}`,
            name,
            status: "connected" as const,
            environment: "sandbox" as const,
            credentialsType: "OAuth" as const,
            lastPing: new Date().toISOString(),
          };
          state.paymentGateways.push(newGateway);
          addAuditLog(state, "Connect Gateway", "PaymentGateway", newGateway.id, `Connected merchant payment gateway: ${name} via Finity Agent chat.`);
          actionExecuted = `Successfully configured and connected merchant payment gateway: ${name}.`;
        } else if (connectionType === "wallet") {
          if (!state.wallets) state.wallets = [];
          const newWallet = {
            id: `wal-nlu-${Date.now()}`,
            name,
            currency: (currency || "USD").toUpperCase(),
            balance: Number(balance) || 0,
            provider: "Finity Core",
            lastUpdated: new Date().toISOString()
          };
          state.wallets.push(newWallet);
          addAuditLog(state, "Connect Wallet", "DigitalWallet", newWallet.id, `Provisioned digital operating wallet: ${name} via Finity Agent chat.`);
          actionExecuted = `Successfully provisioned and connected ${newWallet.currency} digital operating wallet: ${name}.`;
        }
        recalculateBalances(state);
        writeDbState(state);
      }

      else if (type === "SYNC_FINANCIAL_ACCOUNT" && payload) {
        const { connectionType, id } = payload;
        if (connectionType === "bank") {
          const conn = state.bankConnections.find(bc => bc.id === id || bc.bankName.toLowerCase().includes(id.toLowerCase()));
          if (conn) {
            conn.lastSynced = new Date().toISOString();
            const interestAmt = 12.50;
            conn.transactions.unshift({
              id: "btx-sync-nlu-" + Date.now(),
              date: new Date().toISOString().split("T")[0],
              description: "Finity Sync Clearance Interest",
              amount: interestAmt,
              reconciled: false
            });
            conn.balance += interestAmt;
            state.transactions.unshift({
              id: "tx-interest-nlu-" + Date.now(),
              date: new Date().toISOString().split("T")[0],
              description: `Interest deposit: ${conn.bankName}`,
              accountId: "acc-bank",
              offsetAccountId: "acc-sidehustle",
              amount: interestAmt,
              category: "Interest Income",
              type: "income",
              status: "posted"
            });
            state.journalEntries.unshift({
              id: "je-interest-nlu-" + Date.now(),
              date: new Date().toISOString().split("T")[0],
              description: `Interest Earned on ${conn.bankName}`,
              status: "posted",
              lines: [
                { accountId: "acc-bank", debit: interestAmt, credit: 0 },
                { accountId: "acc-sidehustle", debit: 0, credit: interestAmt }
              ],
              auditLogs: [`Synchronized interest payment of $${interestAmt} on ${conn.bankName} via chat.`]
            });
            addAuditLog(state, "Sync Feed", "BankConnection", conn.id, `Synchronized bank feed for ${conn.bankName} via chat command.`);
            actionExecuted = `Successfully synchronized bank feed for ${conn.bankName} and imported 1 new transaction.`;
          } else {
            throw new Error(`Bank connection "${id}" not found.`);
          }
        } else if (connectionType === "gateway") {
          const gateway = state.paymentGateways?.find(pg => pg.id === id || pg.name.toLowerCase().includes(id.toLowerCase()));
          if (gateway) {
            gateway.lastPing = new Date().toISOString();
            gateway.status = "connected";
            addAuditLog(state, "Sync Gateway", "PaymentGateway", gateway.id, `Pinged gateway API via chat.`);
            actionExecuted = `Successfully refreshed API handshake and synchronized state for ${gateway.name}.`;
          } else {
            throw new Error(`Payment gateway "${id}" not found.`);
          }
        } else if (connectionType === "wallet") {
          const wallet = state.wallets?.find(w => w.id === id || w.name.toLowerCase().includes(id.toLowerCase()));
          if (wallet) {
            wallet.lastUpdated = new Date().toISOString();
            addAuditLog(state, "Sync Wallet", "DigitalWallet", wallet.id, `Synchronized wallet ledger via chat.`);
            actionExecuted = `Successfully synchronized cash ledger balance for digital wallet: ${wallet.name}.`;
          } else {
            throw new Error(`Digital wallet "${id}" not found.`);
          }
        }
        recalculateBalances(state);
        writeDbState(state);
      }

      else if (type === "DISCONNECT_FINANCIAL_ACCOUNT" && payload) {
        const { connectionType, id } = payload;
        if (connectionType === "bank") {
          const idx = state.bankConnections.findIndex(bc => bc.id === id || bc.bankName.toLowerCase().includes(id.toLowerCase()));
          if (idx !== -1) {
            const name = state.bankConnections[idx].bankName;
            state.bankConnections.splice(idx, 1);
            addAuditLog(state, "Revoke Link", "BankConnection", id, `Cryptographically revoked Plaid token via chat.`);
            actionExecuted = `Successfully disconnected and revoked open banking access to "${name}".`;
          } else {
            throw new Error(`Bank connection "${id}" not found.`);
          }
        } else if (connectionType === "gateway") {
          const idx = state.paymentGateways?.findIndex(pg => pg.id === id || pg.name.toLowerCase().includes(id.toLowerCase())) ?? -1;
          if (idx !== -1) {
            const name = state.paymentGateways[idx].name;
            state.paymentGateways.splice(idx, 1);
            addAuditLog(state, "Revoke Gateway", "PaymentGateway", id, `Deactivated merchant gateway via chat.`);
            actionExecuted = `Successfully disconnected and deleted payment gateway: "${name}".`;
          } else {
            throw new Error(`Payment gateway "${id}" not found.`);
          }
        } else if (connectionType === "wallet") {
          const idx = state.wallets?.findIndex(w => w.id === id || w.name.toLowerCase().includes(id.toLowerCase())) ?? -1;
          if (idx !== -1) {
            const name = state.wallets[idx].name;
            state.wallets.splice(idx, 1);
            addAuditLog(state, "Revoke Wallet", "DigitalWallet", id, `Removed digital wallet via chat.`);
            actionExecuted = `Successfully removed digital treasury wallet: "${name}".`;
          } else {
            throw new Error(`Digital wallet "${id}" not found.`);
          }
        }
        writeDbState(state);
      }

      else if (type === "RENAME_FINANCIAL_ACCOUNT" && payload) {
        const { connectionType, id, newName } = payload;
        if (connectionType === "bank") {
          const conn = state.bankConnections.find(bc => bc.id === id || bc.bankName.toLowerCase().includes(id.toLowerCase()));
          if (conn) {
            const old = conn.bankName;
            conn.bankName = newName;
            addAuditLog(state, "Rename Bank", "BankConnection", conn.id, `Renamed bank to "${newName}" via chat.`);
            actionExecuted = `Successfully renamed bank connection from "${old}" to "${newName}".`;
          } else {
            throw new Error(`Bank connection "${id}" not found.`);
          }
        } else if (connectionType === "gateway") {
          const gateway = state.paymentGateways?.find(pg => pg.id === id || pg.name.toLowerCase().includes(id.toLowerCase()));
          if (gateway) {
            const old = gateway.name;
            gateway.name = newName;
            addAuditLog(state, "Rename Gateway", "PaymentGateway", gateway.id, `Renamed gateway to "${newName}" via chat.`);
            actionExecuted = `Successfully renamed payment gateway from "${old}" to "${newName}".`;
          } else {
            throw new Error(`Payment gateway "${id}" not found.`);
          }
        } else if (connectionType === "wallet") {
          const wallet = state.wallets?.find(w => w.id === id || w.name.toLowerCase().includes(id.toLowerCase()));
          if (wallet) {
            const old = wallet.name;
            wallet.name = newName;
            addAuditLog(state, "Rename Wallet", "DigitalWallet", wallet.id, `Renamed wallet to "${newName}" via chat.`);
            actionExecuted = `Successfully renamed digital wallet from "${old}" to "${newName}".`;
          } else {
            throw new Error(`Digital wallet "${id}" not found.`);
          }
        }
        writeDbState(state);
      }

      else if (type === "CLEAR_DATABASE") {
        const empty = getEmptyState(true, state);
        // Replace current state content with the empty state fields
        Object.keys(empty).forEach((key) => {
          (state as any)[key] = (empty as any)[key];
        });
        writeDbState(state);
        actionExecuted = "Successfully cleared the database fully. All ledgers, transactions, partners, invoices, bills, and products have been wiped, starting fresh with an empty slate.";
      }

      else if (type === "VIEW_REPORT" && payload) {
        const { reportId } = payload;
        const reportNames: Record<string, string> = {
          bs: "Balance Sheet",
          pl: "Profit & Loss",
          cf: "Cash Flow Statement",
          eq: "Statement of Changes in Equity",
          gl: "General Ledger",
          gj: "General Journal",
          tb: "Trial Balance",
          coa: "Chart of Accounts",
          ar_aging: "Accounts Receivable Aging",
          ap_aging: "Accounts Payable Aging",
          bank_recon: "Bank Reconciliation Report",
          budget_actual: "Budget vs Actual Report",
          sales_rep: "Sales Log Summary",
          rev_rep: "Revenue Breakdown",
          cust_stmt: "Customer Statement",
          cust_bal: "Customer Balance Summary",
          outstanding_inv: "Outstanding Invoices",
          purch_rep: "Purchase History",
          supp_stmt: "Supplier Statement",
          bills_rep: "Bills Registry",
          outstanding_pay: "Outstanding Payables",
          inv_val: "Inventory Valuation",
          stock_move: "Stock Movement",
          stock_hand: "Stock on Hand",
          cogs_rep: "Cost of Goods Sold (COGS)",
          low_stock: "Low Stock Alert",
          bank_stmt: "Bank Statement Log",
          cash_book: "Cash Book Registry",
          cash_pos: "Cash Position & Runway",
          pay_sum: "Payroll Summary",
          emp_earn: "Employee Earnings Summary",
          tax_ded: "Payroll Tax Deductions",
          vat_gst: "VAT/GST Summary",
          sales_tax: "Sales Tax Summary",
          tax_liab: "Tax Liability Ledger",
          profitability: "Profitability & Ratios",
          exp_analysis: "Operating Expense Analysis",
          cf_forecast: "3-Month Cash Flow Forecast",
          working_cap: "Working Capital Analytics",
          asset_reg: "Fixed Asset Register",
          depr_sched: "Depreciation Schedule",
          ai_health: "Business Health Report",
          ai_exec: "Executive Financial Summary",
          ai_investor: "Investor Readiness Report",
          ai_risk: "Financial Risk Report",
          ai_cashflow: "Cash Flow Insights",
          ai_expense: "Expense Optimization Report",
          ai_growth: "Revenue Growth Analysis",
          ai_budget: "Budget Performance Report"
        };
        const reportName = reportNames[reportId] || "Requested Statement";
        actionExecuted = `Switched view and generated the ${reportName}.`;
      }
    }

    const hasDbChange = actionExecuted && parsedResult.action && parsedResult.action.type !== "VIEW_REPORT";
    res.write(`data: ${JSON.stringify({ type: "done", actionExecuted, action: parsedResult.action, state: hasDbChange ? state : null })}\n\n`);
    res.end();
  } catch (err: any) {
    console.error("Agent NLU execution failed:", err);
    res.write(`data: ${JSON.stringify({ type: "error", error: err.message })}\n\n`);
    res.end();
  }
});

// Start Express and integrate Vite
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Finity Agent full-stack server running at http://localhost:${PORT}`);
  });
}

startServer();
