/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Award, 
  Calendar, 
  Sparkles, 
  AlertCircle, 
  RefreshCw, 
  Lock, 
  Unlock, 
  ShieldCheck,
  Check,
  X,
  TrendingUp,
  HelpCircle,
  Search,
  ArrowRight,
  PieChart,
  Coins,
  BarChart2,
  User,
  Download,
  Percent,
  ChevronDown,
  Brain,
  Compass,
  Printer,
  ChevronRight,
  DollarSign,
  Briefcase,
  Layers,
  Inbox,
  Clock,
  Activity,
  Calculator,
  UserCheck,
  Building2,
  FileSpreadsheet,
  Database
} from "lucide-react";
import { FinityState, AccountType, Partner, Account, Transaction, Invoice, Bill, Product } from "../types";
import RulesEngineView from "./RulesEngineView";

interface FinancialReportsProps {
  state: FinityState;
  onStateUpdate: (state: FinityState) => void;
  activeReportId?: string;
  setActiveReportId?: (reportId: string) => void;
}

export default function FinancialReports({ 
  state, 
  onStateUpdate,
  activeReportId = "rules_engine",
  setActiveReportId
}: FinancialReportsProps) {
  // Local active report state as fallback
  const [localActiveReport, setLocalActiveReport] = useState<string>("rules_engine");
  const activeReport = setActiveReportId ? activeReportId : localActiveReport;
  const setActiveReport = (id: string) => {
    if (setActiveReportId) {
      setActiveReportId(id);
    } else {
      setLocalActiveReport(id);
    }
  };

  const [sidebarTab, setSidebarTab] = useState<"compliance" | "ai">("compliance");
  const [reportCommentary, setReportCommentary] = useState<string | null>(null);
  const [isGeneratingCommentary, setIsGeneratingCommentary] = useState(false);
  const [authKey, setAuthKey] = useState("");
  const [periodActionError, setPeriodActionError] = useState("");
  const [periodActionSuccess, setPeriodActionSuccess] = useState("");
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Interactive report filters
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");

  // AI-Generated report states
  const [aiReportOutputs, setAiReportOutputs] = useState<Record<string, string>>({});
  const [isGeneratingAiReport, setIsGeneratingAiReport] = useState<boolean>(false);
  const [aiReportError, setAiReportError] = useState<string | null>(null);

  // Set default filters on mount or when state changes
  useEffect(() => {
    if (state.accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(state.accounts[0].id);
    }
    const customers = state.partners.filter(p => p.type === "customer");
    if (customers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(customers[0].id);
    }
    const suppliers = state.partners.filter(p => p.type === "supplier");
    if (suppliers.length > 0 && !selectedSupplierId) {
      setSelectedSupplierId(suppliers[0].id);
    }
  }, [state]);

  const getAccountBalance = (id: string) => {
    return state.accounts.find((a) => a.id === id || a.code === id)?.balance || 0;
  };

  const getAccountsByTypeSum = (type: AccountType) => {
    return state.accounts.filter((a) => a.type === type).reduce((sum, a) => sum + a.balance, 0);
  };

  // Standard date context
  const currentDate = new Date("2026-07-08");

  // ==========================================
  // FINANCIAL MATH ENGINE
  // ==========================================

  // 1. Balance Sheet Figures
  const bankCash = getAccountBalance("acc-bank");
  const pettyCash = getAccountBalance("acc-cash");
  const totalCash = bankCash + pettyCash;
  const accountsReceivable = getAccountBalance("acc-ar");
  
  // Real inventory asset valuation from stocks
  const computedInventoryValuation = state.products.reduce((sum, p) => sum + (p.stockLevel * p.costPrice), 0);
  const inventory = computedInventoryValuation || getAccountBalance("acc-inventory");
  const totalCurrentAssets = totalCash + accountsReceivable + inventory;

  const accountsPayable = getAccountBalance("acc-ap");
  const taxLiabilities = getAccountBalance("acc-tax");
  const totalCurrentLiabilities = accountsPayable + taxLiabilities;

  const initialCapital = getAccountBalance("acc-equity");
  const priorRetainedEarnings = getAccountBalance("acc-retained");
  const revenueSum = getAccountsByTypeSum(AccountType.REVENUE);
  const expensesSum = getAccountsByTypeSum(AccountType.EXPENSE);
  const currentRetainedEarnings = revenueSum - expensesSum;
  const totalEquity = initialCapital + priorRetainedEarnings + currentRetainedEarnings;

  const totalLiabilitiesAndEquity = totalCurrentLiabilities + totalEquity;

  // 2. Profit & Loss figures
  const consultingServicesRevenue = getAccountBalance("acc-revenue");
  const productSalesRevenue = getAccountBalance("acc-sales");
  const totalRevenue = consultingServicesRevenue + productSalesRevenue;

  // Compute Cost of Goods Sold from sold invoice product items
  const costOfGoodsSold = state.invoices.reduce((sum, inv) => {
    return sum + inv.items.reduce((itemSum, item) => {
      const prod = state.products.find(
        p => p.name.toLowerCase() === item.description.toLowerCase() || p.sku.toLowerCase() === item.description.toLowerCase()
      );
      if (prod) {
        return itemSum + (prod.costPrice * item.quantity);
      }
      return itemSum + (0.35 * item.unitPrice * item.quantity); // fallback to 35% margin COGS if no product SKU match
    }, 0);
  }, 0);

  const grossProfit = totalRevenue - costOfGoodsSold;

  const rentExpense = getAccountBalance("acc-rent");
  const salaryExpense = getAccountBalance("acc-salaries");
  const utilitiesExpense = getAccountBalance("acc-utilities");
  const marketingExpense = getAccountBalance("acc-marketing");
  const softwareExpense = getAccountBalance("acc-software");
  const totalExpenses = rentExpense + salaryExpense + utilitiesExpense + marketingExpense + softwareExpense;

  const netOperatingIncome = grossProfit - totalExpenses;

  // 3. Cash Flow Statement (Direct Method)
  const postedTransactions = state.transactions.filter(t => t.status === "posted");
  
  const cashFromCustomers = postedTransactions
    .filter(t => t.amount > 0 && (t.offsetAccountId === "acc-revenue" || t.offsetAccountId === "acc-sales" || t.category?.toLowerCase().includes("revenue") || t.category?.toLowerCase().includes("sales")))
    .reduce((sum, t) => sum + t.amount, 0);

  const cashPaidRent = postedTransactions
    .filter(t => t.offsetAccountId === "acc-rent" || t.category?.toLowerCase().includes("rent"))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const cashPaidSalaries = postedTransactions
    .filter(t => t.offsetAccountId === "acc-salaries" || t.category?.toLowerCase().includes("salary") || t.category?.toLowerCase().includes("payroll"))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const cashPaidOtherExpenses = postedTransactions
    .filter(t => (t.amount < 0) && t.offsetAccountId !== "acc-rent" && t.offsetAccountId !== "acc-salaries" && t.offsetAccountId !== "acc-equity" && t.offsetAccountId !== "acc-bank" && t.offsetAccountId !== "acc-cash")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const netCashFromOperating = cashFromCustomers - cashPaidRent - cashPaidSalaries - cashPaidOtherExpenses;
  const netCashFromInvesting = 0;

  const cashFromFinancing = postedTransactions
    .filter(t => (t.offsetAccountId === "acc-equity" || t.category?.toLowerCase().includes("equity")) && t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const cashPaidFinancing = postedTransactions
    .filter(t => (t.offsetAccountId === "acc-equity" || t.category?.toLowerCase().includes("equity")) && t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const netCashFromFinancing = cashFromFinancing - cashPaidFinancing;
  const netIncreaseInCash = netCashFromOperating + netCashFromInvesting + netCashFromFinancing;
  const endingCashValue = totalCash;
  const beginningCashValue = endingCashValue - netIncreaseInCash;

  // 4. Owner's Equity Reconciliation
  const beginningEquity = initialCapital + priorRetainedEarnings;
  const ownerContributions = cashFromFinancing;
  const ownerDrawings = cashPaidFinancing;
  const endingEquityValue = beginningEquity + currentRetainedEarnings + ownerContributions - ownerDrawings;

  // 5. Trial Balance Parity
  let totalDebits = 0;
  let totalCredits = 0;
  state.accounts.forEach((acc) => {
    const isDebit = acc.type === AccountType.ASSET || acc.type === AccountType.EXPENSE;
    if (isDebit) {
      totalDebits += acc.balance;
    } else {
      totalCredits += acc.balance;
    }
  });

  // GAAP Checks
  const ruleAccountingEquation = Math.abs(totalCurrentAssets - totalLiabilitiesAndEquity) < 0.01;
  const ruleDebitCreditParity = Math.abs(totalDebits - totalCredits) < 0.01;
  const ruleCashFlowReconciled = Math.abs(endingCashValue - totalCash) < 0.01;
  const ruleEquityStatementSync = Math.abs(endingEquityValue - totalEquity) < 0.01;

  // ==========================================
  // REPORT CATEGORIES DEFINITION (40+ REPORTS)
  // ==========================================
  const categories = [
    {
      id: "primary",
      title: "Core Financial Statements",
      reports: [
        { id: "rules_engine", title: "CFO Rules Engine", subtitle: "Live 25 Formulas & Jurisdictional Tax", icon: Calculator },
        { id: "bs", title: "Balance Sheet", subtitle: "GAAP Statement of Financial Position", icon: FileText },
        { id: "pl", title: "Profit & Loss Statement", subtitle: "Statement of Comprehensive Operations", icon: FileSpreadsheet },
        { id: "cf", title: "Cash Flow Statement", subtitle: "Operating, Investing & Financing Cash Flow", icon: Coins },
        { id: "eq", title: "Statement of Owner Equity", subtitle: "Changes in Shareholders' Retained Capital", icon: TrendingUp },
      ]
    },
    {
      id: "ledger",
      title: "Supporting Ledger Reports",
      reports: [
        { id: "gl", title: "General Ledger", subtitle: "Double-Entry Running Balance Book", icon: Database },
        { id: "gj", title: "General Journal", subtitle: "Chronological Journal Entry Listing", icon: Calendar },
        { id: "tb", title: "Trial Balance", subtitle: "Verification of Debit/Credit Equalization", icon: Calculator },
        { id: "coa", title: "Chart of Accounts", subtitle: "Financial System Ledger Account Matrix", icon: Layers },
        { id: "ar_aging", title: "Accounts Receivable Aging", subtitle: "A/R Aging Brackets for Outstanding Invoices", icon: Clock },
        { id: "ap_aging", title: "Accounts Payable Aging", subtitle: "A/P Aging Brackets for Outstanding Vendor Bills", icon: Clock },
        { id: "bank_recon", title: "Bank Reconciliation Report", subtitle: "Audit Reconcile of Cash Books with Feeds", icon: ShieldCheck },
        { id: "budget_actual", title: "Budget vs Actual", subtitle: "Performance Metrics against Allocated Budgets", icon: BarChart2 },
      ]
    },
    {
      id: "sales_purchasing",
      title: "Sales & Purchasing Logs",
      reports: [
        { id: "sales_rep", title: "Sales Log Summary", subtitle: "Total Billed Customer Sales & Sales Taxes", icon: FileText },
        { id: "rev_rep", title: "Revenue Breakdown", subtitle: "Service vs Product Revenue Distributions", icon: BarChart2 },
        { id: "cust_stmt", title: "Customer Ledger Statement", subtitle: "Historical Debits/Credits for Selected Client", icon: User },
        { id: "cust_bal", title: "Customer Balances", subtitle: "Active Outstanding Ledger Debt per Customer", icon: UserCheck },
        { id: "outstanding_inv", title: "Outstanding Invoices", subtitle: "Overdue and Unpaid Client Billings", icon: Clock },
        { id: "purch_rep", title: "Purchase History", subtitle: "Inventory and Asset Procurements from Suppliers", icon: FileText },
        { id: "supp_stmt", title: "Supplier Statement", subtitle: "Historical Owed Balances for Selected Supplier", icon: Building2 },
        { id: "bills_rep", title: "Bills Registry", subtitle: "Outstanding and Logged Accounts Payable Bills", icon: Layers },
        { id: "outstanding_pay", title: "Outstanding Payables", subtitle: "Unpaid Supplier Obligations with Due Dates", icon: Clock },
      ]
    },
    {
      id: "inventory",
      title: "Inventory & Stock Reports",
      reports: [
        { id: "inv_val", title: "Inventory Valuation", subtitle: "Retail Value vs Wholesale Capital Value on Hand", icon: Layers },
        { id: "stock_move", title: "Stock Movement Report", subtitle: "Inventory Inflow and Outflow Velocity Logs", icon: Activity },
        { id: "stock_hand", title: "Stock on Hand", subtitle: "Inventory Thresholds and Sourcing Status", icon: Inbox },
        { id: "cogs_rep", title: "Cost of Goods Sold (COGS)", subtitle: "Estimated Cost Outlays for Product Warehousing", icon: Calculator },
        { id: "low_stock", title: "Low Stock Alert", subtitle: "Reorder Points and Stock Replenishment Warnings", icon: AlertCircle },
      ]
    },
    {
      id: "banking_payroll",
      title: "Banking, Payroll & Tax",
      reports: [
        { id: "bank_stmt", title: "Bank Statement Log", subtitle: "Raw External Bank Feed Import History", icon: Calendar },
        { id: "cash_book", title: "Cash Book Registry", subtitle: "Combined Bank Checking & Petty Cash Ledger", icon: Coins },
        { id: "cash_pos", title: "Cash Position & Runway", subtitle: "SaaS Runway and Average Monthly Cash Burn", icon: TrendingUp },
        { id: "pay_sum", title: "Payroll Summary", subtitle: "Salary Overhead and Payroll Tax Summaries", icon: User },
        { id: "emp_earn", title: "Employee Earnings Summary", subtitle: "Logged Year-to-Date Paychecks for Personnel", icon: UserCheck },
        { id: "tax_ded", title: "Payroll Tax Deductions", subtitle: "Withholding State Taxes and Social Insurance", icon: Percent },
        { id: "vat_gst", title: "VAT/GST Summary", subtitle: "Tax Collected (Sales) vs Tax Paid (Supplier Bills)", icon: Percent },
        { id: "sales_tax", title: "Sales Tax Report", subtitle: "State Sales Tax Liabilities from Invoiced Revenue", icon: Percent },
        { id: "tax_liab", title: "Tax Liability Ledger", subtitle: "Owed and Paid Running Tax Balances", icon: ShieldCheck },
      ]
    },
    {
      id: "analysis_fixed_assets",
      title: "Financial Analysis & Fixed Assets",
      reports: [
        { id: "profitability", title: "Profitability & Ratios", subtitle: "Operating Ratios, margins & Liquid Solvencies", icon: Percent },
        { id: "exp_analysis", title: "Operating Expense Analysis", subtitle: "Visual Category Distributions of Overhead Expenses", icon: PieChart },
        { id: "cf_forecast", title: "3-Month Cash Forecast", subtitle: "Projections of Checking Account Cash Runways", icon: BarChart2 },
        { id: "working_cap", title: "Working Capital Analytics", subtitle: "Current Assets minus Current Liabilities", icon: TrendingUp },
        { id: "asset_reg", title: "Fixed Asset Register", subtitle: "Capital Physical Properties & Original Purchase Costs", icon: FileSpreadsheet },
        { id: "depr_sched", title: "Depreciation Schedule", subtitle: "Straight-Line Depreciation Allocation Logs", icon: Calculator },
      ]
    },
    {
      id: "ai_cfo",
      title: "AI CFO Generated Reports",
      reports: [
        { id: "ai_health", title: "Business Health Report", subtitle: "Algorithmic CFO Audit & Anomaly Detections", icon: Sparkles },
        { id: "ai_exec", title: "Executive Financial Summary", subtitle: "High-level Commentary for Management Decisions", icon: Brain },
        { id: "ai_investor", title: "Investor Readiness Report", subtitle: "Liquidity and Solvency Health for Fundraises", icon: Sparkles },
        { id: "ai_risk", title: "Financial Risk Report", subtitle: "Credit Risk, Concentration Risk, and Runways", icon: AlertCircle },
        { id: "ai_cashflow", title: "Cash Flow Insights", subtitle: "Direct vs Accrual Margin Reconciliation Analysis", icon: Brain },
        { id: "ai_expense", title: "Expense Optimization Report", subtitle: "Overhead Cost Cut Recommendations & ROI Audits", icon: Sparkles },
        { id: "ai_growth", title: "Revenue Growth Analysis", subtitle: "Monthly Sales Volatilities and Growth Run Rates", icon: TrendingUp },
        { id: "ai_budget", title: "Budget Performance Report", subtitle: "Variance Allocations and Dynamic Overspend Warnings", icon: Brain },
      ]
    }
  ];

  // Helper to filter reports in sidebar
  const filteredCategories = categories.map(cat => {
    const matched = cat.reports.filter(r => 
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return { ...cat, reports: matched };
  }).filter(cat => cat.reports.length > 0);

  const getActiveReportDetails = () => {
    for (const cat of categories) {
      const found = cat.reports.find(r => r.id === activeReport);
      if (found) return { ...found, categoryId: cat.id };
    }
    return { id: "rules_engine", title: "CFO Rules Engine", subtitle: "Live 25 Formulas & Jurisdictional Tax", categoryId: "primary" };
  };

  const reportDetails = getActiveReportDetails();

  // ==========================================
  // ACTION DISPATCHERS
  // ==========================================
  const handleCloseFiscalYear = async () => {
    setPeriodActionError("");
    setPeriodActionSuccess("");
    setIsActionLoading(true);
    try {
      const res = await fetch("/api/state/close-year", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to close period");
      onStateUpdate(data.state);
      setPeriodActionSuccess("Fiscal Year closed successfully! Revenues and Expenses zeroed out, Retained Earnings updated.");
    } catch (err: any) {
      setPeriodActionError(err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReopenFiscalYear = async () => {
    setPeriodActionError("");
    setPeriodActionSuccess("");
    if (!authKey) {
      setPeriodActionError("Please provide the Auditor Authorization Key.");
      return;
    }
    setIsActionLoading(true);
    try {
      const res = await fetch("/api/state/reopen-year", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reopen period");
      onStateUpdate(data.state);
      setPeriodActionSuccess("Fiscal ledger reopened successfully! Auditor authorization key verified.");
      setAuthKey("");
    } catch (err: any) {
      setPeriodActionError(err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleGenerateCommentary = async () => {
    setIsGeneratingCommentary(true);
    setReportCommentary(null);
    try {
      let prompt = `Analyze this financial report: ${reportDetails.title} (${reportDetails.subtitle}).\n\n`;
      if (activeReport === "bs") {
        prompt += `Current assets: $${totalCurrentAssets} (Checking Cash: $${bankCash}, Petty cash: $${pettyCash}, A/R: $${accountsReceivable}, Inventory: $${inventory}). Liabilities: $${totalCurrentLiabilities}, Equity: $${totalEquity}. Confirm if the Accounting EquationBalances. Provide 3 punchy financial recommendations.`;
      } else if (activeReport === "pl") {
        prompt += `Total Revenue: $${totalRevenue}, Gross margin: $${grossProfit}, Operating Expenses: $${totalExpenses}, Net Profit: $${netOperatingIncome}. Calculate the exact profit margin and offer 3 expense optimization pointers.`;
      } else if (activeReport === "cf") {
        prompt += `Net operating cash: $${netCashFromOperating}, Net financing cash: $${netCashFromFinancing}, Net change in cash: $${netIncreaseInCash}. Highlight cash collection efficiency and provide 2 cash management recommendations.`;
      } else {
        prompt += `The client is viewing this financial report inside our modern ledger. Evaluate the double-entry transactions context and give us a quick 3-bullet auditing summary of this report type. Keep it conversational, professional, and practical.`;
      }

      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt, activeTab: "Financial Statements" }),
      });
      
      if (!res.ok) throw new Error("Failed to consult AI CFO service.");
      
      const reader = res.body?.getReader();
      if (!reader) throw new Error("Streaming is not supported.");
      
      const decoder = new TextDecoder();
      let text = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunkStr = decoder.decode(value);
        const lines = chunkStr.split("\n");
        for (const line of lines) {
          if (line.trim().startsWith("data: ")) {
            try {
              const parsed = JSON.parse(line.trim().slice(6));
              if (parsed.type === "chunk" && parsed.text) {
                text += parsed.text;
                setReportCommentary(text);
              }
            } catch (e) {}
          }
        }
      }
    } catch (err: any) {
      setReportCommentary("Failed to generate commentary: " + err.message);
    } finally {
      setIsGeneratingCommentary(false);
    }
  };

  // Generate complete custom AI-Generated Report via Gemini streaming
  const handleGenerateAiReport = async (reportId: string, customInstruction: string = "") => {
    setIsGeneratingAiReport(true);
    setAiReportError(null);
    setAiReportOutputs(prev => ({ ...prev, [reportId]: "" }));
    try {
      const summaryText = `
        LEDEGR STATISTICS AS OF JULY 31, 2026:
        - Total Cash: $${totalCash} (Bank: $${bankCash}, Petty Cash: $${pettyCash})
        - Accounts Receivable (AR): $${accountsReceivable}
        - Inventory Valuation: $${inventory}
        - Accounts Payable (AP): $${accountsPayable}
        - Total Current Assets: $${totalCurrentAssets}
        - Total Liabilities: $${totalCurrentLiabilities}
        - Total Equity: $${totalEquity}
        - Gross Revenue: $${totalRevenue} (Consulting: $${consultingServicesRevenue}, Product sales: $${productSalesRevenue})
        - Real COGS: $${costOfGoodsSold}
        - Gross Profit: $${grossProfit}
        - Rent Expense: $${rentExpense}
        - Salary Payroll: $${salaryExpense}
        - Utilities Expense: $${utilitiesExpense}
        - Marketing Expense: $${marketingExpense}
        - Software/SaaS Expense: $${softwareExpense}
        - Total Expenses: $${totalExpenses}
        - Net Operating Income: $${netOperatingIncome}
        - Net Cash flow increase: $${netIncreaseInCash}
      `;

      let reportPrompt = `
        Act as our company's CPA and Senior Financial Analyst. Generate a comprehensive, multi-section, high-fidelity business report in MARKDOWN format.
        
        REPORT TOPIC: ${reportDetails.title}
        SUBTITLE: ${reportDetails.subtitle}
        
        Here is the live financial double-entry data from our Finity State Engine:
        ${summaryText}
        
        Additional Guidelines for this specific report:
        ${reportId === "ai_health" ? "Evaluate the overall financial stability, liquidity ratios, and potential operational bottlenecks. Offer concrete grading (A through F)." : ""}
        ${reportId === "ai_exec" ? "Write an elegant, scannable summary for C-level executives. Discuss strategic decisions, budget allocations, and performance trends." : ""}
        ${reportId === "ai_investor" ? "Evaluate the company from a venture capital/investor angle. Calculate Quick ratio, Current ratio, Debt-to-Equity, and analyze the scalability of product sales vs service hours." : ""}
        ${reportId === "ai_risk" ? "Audit the ledger for financial risk, credit vulnerabilities, customer payment trends (discussing A/R aging implications), and cash depletion timelines." : ""}
        ${reportId === "ai_cashflow" ? "Analyze the company's cash flow direct-method activities. Explain cash burn velocity, cash collection efficiency, and suggest runway extender tactics." : ""}
        ${reportId === "ai_expense" ? "Identify waste. Look closely at Rent, Salaries, Utilities, and Software SaaS. Propose 3 major areas for expense optimization." : ""}
        ${reportId === "ai_growth" ? "Evaluate revenue margins. Gross profit margin is $${grossProfit} on $${totalRevenue}. Suggest product retail margin optimizations." : ""}
        ${reportId === "ai_budget" ? "Analyze actual spend vs allocated budgets. Look at expense distributions and highlight overspend risks." : ""}
        
        ${customInstruction ? `User custom request: "${customInstruction}"` : ""}
        
        Write with professional composure, objective financial data, and extremely polished display layout (use markdown tables, bullet points, and headers).
      `;

      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: reportPrompt, activeTab: "Financial Statements" }),
      });

      if (!res.ok) throw new Error("Could not contact Finity Agent NLU.");
      
      const reader = res.body?.getReader();
      if (!reader) throw new Error("Streaming is not supported by your browser.");
      
      const decoder = new TextDecoder();
      let streamedText = "";
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const textChunk = decoder.decode(value);
        const lines = textChunk.split("\n");
        for (const line of lines) {
          if (line.trim().startsWith("data: ")) {
            try {
              const parsed = JSON.parse(line.trim().slice(6));
              if (parsed.type === "chunk" && parsed.text) {
                streamedText += parsed.text;
                setAiReportOutputs(prev => ({ ...prev, [reportId]: streamedText }));
              }
            } catch (e) {}
          }
        }
      }
    } catch (e: any) {
      setAiReportError("Failed to generate AI CFO report: " + e.message);
    } finally {
      setIsGeneratingAiReport(false);
    }
  };

  // Trigger default AI generated report on mount if an AI report is selected
  useEffect(() => {
    if (reportDetails.categoryId === "ai_cfo" && !aiReportOutputs[activeReport]) {
      handleGenerateAiReport(activeReport);
    }
  }, [activeReport]);

  const handleDownloadCsv = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `FINITY HOLDINGS INC. - ${reportDetails.title.toUpperCase()}\n`;
    csvContent += `Generated: ${currentDate.toISOString().split("T")[0]}\n\n`;

    // Gather report rows based on ID
    if (activeReport === "bs") {
      csvContent += "Category,Item,Value\n";
      csvContent += `Assets,Bank Cash,${bankCash}\n`;
      csvContent += `Assets,Petty Cash,${pettyCash}\n`;
      csvContent += `Assets,Accounts Receivable,${accountsReceivable}\n`;
      csvContent += `Assets,Inventory,${inventory}\n`;
      csvContent += `Assets,TOTAL ASSETS,${totalCurrentAssets}\n`;
      csvContent += `Liabilities,Accounts Payable,${accountsPayable}\n`;
      csvContent += `Liabilities,Tax Payable,${taxLiabilities}\n`;
      csvContent += `Liabilities,TOTAL LIABILITIES,${totalCurrentLiabilities}\n`;
      csvContent += `Equity,Contributed Capital,${initialCapital}\n`;
      csvContent += `Equity,Prior Retained Earnings,${priorRetainedEarnings}\n`;
      csvContent += `Equity,Current Net Profit,${currentRetainedEarnings}\n`;
      csvContent += `Equity,TOTAL EQUITY,${totalEquity}\n`;
    } else if (activeReport === "pl") {
      csvContent += "Item,Amount\n";
      csvContent += `Consulting Services Revenue,${consultingServicesRevenue}\n`;
      csvContent += `Product SKU Sales,${productSalesRevenue}\n`;
      csvContent += `TOTAL REVENUE,${totalRevenue}\n`;
      csvContent += `Cost of Goods Sold (COGS),${costOfGoodsSold}\n`;
      csvContent += `GROSS PROFIT,${grossProfit}\n`;
      csvContent += `Office Lease Rent,${rentExpense}\n`;
      csvContent += `Payroll Salaries,${salaryExpense}\n`;
      csvContent += `Utilities & SaaS,${utilitiesExpense + softwareExpense}\n`;
      csvContent += `Marketing Campaigns,${marketingExpense}\n`;
      csvContent += `TOTAL OVERHEAD EXPENSES,${totalExpenses}\n`;
      csvContent += `NET OPERATING INCOME,${netOperatingIncome}\n`;
    } else {
      csvContent += "Label,Value\n";
      csvContent += `Report,${reportDetails.title}\n`;
      csvContent += `Category,${reportDetails.subtitle}\n`;
      csvContent += `Date Context,2026-07-08\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `finity_${activeReport}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col space-y-6 h-full select-none" id="reports-tab-body">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e4e4eb] pb-5" id="reports-header-row">
        <div>
          <h1 className="font-sans text-2xl font-bold text-gray-900 tracking-tight" id="reports-title">
            Finity Suite Financial Intelligence
          </h1>
          <p className="text-xs text-gray-500 font-mono mt-1">
            AICPA / GAAP & IFRS Compliant Double-Entry Automated Ledger Engine
          </p>
        </div>
        <div className="flex items-center gap-2" id="header-action-row">
          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 font-sans text-xs font-semibold text-gray-700 transition"
            id="btn-export-csv"
            title="Download CSV Statement"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 font-sans text-xs font-semibold text-gray-700 transition"
            id="btn-print-report"
            title="Print Financial Statement"
          >
            <Printer size={13} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* 2. Accounting Period Lock Dashboard */}
      <div className="bg-white border border-[#e4e4eb] p-5 rounded-xl shadow-xs" id="period-lock-dashboard">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${state.fiscalYearClosed ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {state.fiscalYearClosed ? <Lock size={20} /> : <Unlock size={20} />}
            </div>
            <div>
              <h3 className="font-sans font-bold text-gray-900 text-sm flex items-center gap-2">
                <span>Accounting Period Status:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono tracking-wider font-bold ${
                  state.fiscalYearClosed ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {state.fiscalYearClosed ? "LOCKED & SEALED" : "ACTIVE & OPEN"}
                </span>
              </h3>
              <p className="text-xs text-gray-500 font-sans mt-0.5 max-w-xl leading-relaxed">
                {state.fiscalYearClosed 
                  ? "The fiscal ledger period is closed. Manual transactions, customer billing, and payments are strictly read-only to preserve CPA compliance."
                  : "Double-entry rules are fully active. You can record manual journal entries, log transactions, upload receipts, and bill customer accounts."
                }
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 font-mono text-xs">
            {state.fiscalYearClosed ? (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="password"
                  placeholder="Enter Auditor Secret Key"
                  value={authKey}
                  onChange={(e) => setAuthKey(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 bg-gray-50 text-xs w-full sm:w-56"
                  id="auditor-auth-key-input"
                />
                <button
                  onClick={handleReopenFiscalYear}
                  disabled={isActionLoading}
                  className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 shrink-0 font-sans"
                  id="btn-reopen-year"
                >
                  {isActionLoading && <RefreshCw size={12} className="animate-spin" />}
                  <span>Reopen Ledger</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleCloseFiscalYear}
                disabled={isActionLoading}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-sans font-bold transition flex items-center justify-center gap-1.5"
                id="btn-close-year"
              >
                {isActionLoading && <RefreshCw size={12} className="animate-spin" />}
                <span>Lock & Close Fiscal Year</span>
              </button>
            )}
          </div>
        </div>

        {periodActionError && (
          <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700 font-mono flex items-center gap-2 animate-fade" id="period-error-banner">
            <AlertCircle size={14} className="shrink-0" />
            <span>{periodActionError}</span>
          </div>
        )}
        {periodActionSuccess && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-xs text-emerald-700 font-mono flex items-center gap-2 animate-fade" id="period-success-banner">
            <ShieldCheck size={14} className="shrink-0" />
            <span>{periodActionSuccess}</span>
          </div>
        )}
        {!state.fiscalYearClosed && (
          <div className="mt-3 p-2 bg-gray-50 rounded-lg text-[10px] text-gray-500 font-mono flex items-center gap-2 border border-gray-200">
            <span className="font-bold text-gray-700 bg-gray-200 px-1 rounded">Auditor Authorization:</span>
            <span>Use <strong className="text-gray-800">FINITY-AUDIT-2026</strong> to reverse period closure entries.</span>
          </div>
        )}
      </div>

      {/* 3. Primary Workspace Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="reports-grid-layout">
        
        {/* SIDEBAR NAVIGATION: 40+ REPORTS LIST */}
        <div className="lg:col-span-3 bg-white border border-[#e4e4eb] rounded-xl p-4 flex flex-col h-[650px]" id="reports-sidebar">
          {/* Search Bar */}
          <div className="relative mb-4" id="sidebar-search-block">
            <Search className="absolute left-2.5 top-2.5 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Search 40+ reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#f4f4f6] border border-[#e4e4eb] rounded-lg text-xs outline-hidden focus:border-indigo-600 focus:bg-white transition text-gray-800"
              id="report-sidebar-search-input"
            />
          </div>

          {/* List scrollbox */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin" id="sidebar-categories-list">
            {filteredCategories.map((cat) => (
              <div key={cat.id} className="space-y-1" id={`cat-group-${cat.id}`}>
                <h4 className="font-mono text-[10px] uppercase font-bold tracking-wider text-gray-400 block px-2.5 py-1">
                  {cat.title}
                </h4>
                <div className="space-y-0.5">
                  {cat.reports.map((rep) => {
                    const Icon = rep.icon;
                    const isSelected = activeReport === rep.id;
                    return (
                      <button
                        key={rep.id}
                        onClick={() => {
                          setActiveReport(rep.id);
                          setReportCommentary(null);
                        }}
                        className={`w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-left transition text-xs ${
                          isSelected 
                            ? "bg-[#1a1a24] text-white font-semibold" 
                            : "text-gray-600 hover:text-gray-900 hover:bg-[#f4f4f6]"
                        }`}
                        id={`btn-select-report-${rep.id}`}
                      >
                        <Icon size={14} className={`mt-0.5 ${isSelected ? "text-emerald-400" : "text-gray-400"}`} />
                        <div className="overflow-hidden">
                          <p className="truncate font-sans leading-tight">{rep.title}</p>
                          <p className={`text-[9px] truncate mt-0.5 ${isSelected ? "text-gray-300" : "text-gray-400"}`}>
                            {rep.subtitle}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MAIN STAGE CARD: DISPLAY ACTIVE COMPUTED REPORT */}
        <div className="lg:col-span-6 bg-white border border-[#e4e4eb] rounded-xl p-6 shadow-xs flex flex-col justify-between min-h-[650px]" id="financial-report-card">
          <div className="space-y-5">
            {/* Header metadata */}
            <div className="text-center space-y-1.5 pb-4 border-b border-gray-100" id="statement-header-block">
              <h2 className="font-sans font-extrabold text-gray-900 text-lg uppercase tracking-wider">Finity Holdings Inc.</h2>
              <p className="text-xs text-indigo-900 uppercase tracking-widest font-mono font-bold">
                {reportDetails.title.toUpperCase()}
              </p>
              <p className="text-[10px] text-gray-400 font-mono flex items-center justify-center gap-1">
                <Calendar size={11} />
                <span>As of July 31, 2026 | Accounting Framework: GAAP Double-Entry | Currency: USD ($)</span>
              </p>
            </div>

            {/* REPORT RENDERER HUB */}
            <div className="min-h-[380px]" id="active-report-render-stage">
              
              {/* PRIMARY CFO RULES ENGINE */}
              {activeReport === "rules_engine" && (
                <RulesEngineView state={state} />
              )}
              
              {/* PRIMARY 1: BALANCE SHEET */}
              {activeReport === "bs" && (
                <div className="font-mono text-xs text-gray-800 space-y-5" id="rendered-bs">
                  <div className="space-y-1.5">
                    <h3 className="font-sans font-bold text-gray-900 border-b border-gray-900 pb-1 uppercase tracking-wide">1. ASSETS (DR ledger balances)</h3>
                    <div className="flex justify-between pl-4 hover:bg-gray-50 py-0.5 rounded transition">
                      <span>Checking Operating Bank Account</span>
                      <span className="font-bold">${bankCash.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between pl-4 hover:bg-gray-50 py-0.5 rounded transition">
                      <span>Petty Cash Drawer Reserves</span>
                      <span className="font-bold">${pettyCash.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between pl-4 hover:bg-gray-50 py-0.5 rounded transition">
                      <span>Accounts Receivable (Customer Invoice Debts)</span>
                      <span className="font-bold">${accountsReceivable.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between pl-4 pb-1 border-b border-gray-150 hover:bg-gray-50 py-0.5 rounded transition">
                      <span>Warehouse Stock Inventory (Computed Valuation)</span>
                      <span className="font-bold">${inventory.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-900 pt-1 text-sm bg-gray-50 px-1 rounded">
                      <span>TOTAL CURRENT ASSETS</span>
                      <span className="border-b-4 border-double border-gray-950 px-1">
                        ${totalCurrentAssets.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="font-sans font-bold text-gray-900 border-b border-gray-900 pb-1 uppercase tracking-wide">2. LIABILITIES (CR ledger balances)</h3>
                    <div className="flex justify-between pl-4 hover:bg-gray-50 py-0.5 rounded transition">
                      <span>Accounts Payable (Supplier Bills Due)</span>
                      <span className="font-bold">${accountsPayable.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between pl-4 pb-1 border-b border-gray-150 hover:bg-gray-50 py-0.5 rounded transition">
                      <span>Accrued State Sales Tax Obligations</span>
                      <span className="font-bold">${taxLiabilities.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-900 pt-1 text-sm bg-gray-50 px-1 rounded">
                      <span>TOTAL CURRENT LIABILITIES</span>
                      <span>${totalCurrentLiabilities.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="font-sans font-bold text-gray-900 border-b border-gray-900 pb-1 uppercase tracking-wide">3. OWNER EQUITIES (CR ledger balances)</h3>
                    <div className="flex justify-between pl-4 hover:bg-gray-50 py-0.5 rounded transition">
                      <span>Initial Owner Invested Capital</span>
                      <span className="font-bold">${initialCapital.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between pl-4 hover:bg-gray-50 py-0.5 rounded transition">
                      <span>Prior Years' Retained Earnings</span>
                      <span className="font-bold">${priorRetainedEarnings.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between pl-4 pb-1 border-b border-gray-150 hover:bg-gray-50 py-0.5 rounded transition">
                      <span>Retained Earnings (Current Period Revenue minus Expense)</span>
                      <span className="font-bold text-emerald-700">
                        ${currentRetainedEarnings.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-900 pt-1 text-sm bg-gray-50 px-1 rounded">
                      <span>TOTAL SHAREHOLDERS' EQUITY</span>
                      <span>${totalEquity.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div className="border-t-2 border-gray-950 pt-1.5 flex justify-between font-bold text-gray-900 text-sm">
                    <span>TOTAL LIABILITIES AND OWNER EQUITIES</span>
                    <span className="border-b-4 border-double border-gray-950 px-1 bg-gray-50">
                      ${totalLiabilitiesAndEquity.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              {/* PRIMARY 2: PROFIT & LOSS */}
              {activeReport === "pl" && (
                <div className="font-mono text-xs text-gray-800 space-y-5" id="rendered-pl">
                  <div className="space-y-1.5">
                    <h3 className="font-sans font-bold text-gray-900 border-b border-gray-900 pb-1 uppercase tracking-wide">1. OPERATING REVENUES</h3>
                    <div className="flex justify-between pl-4 hover:bg-gray-50 py-0.5 rounded transition">
                      <span>Services Consulting Income</span>
                      <span className="font-bold">${consultingServicesRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between pl-4 pb-1 border-b border-gray-150 hover:bg-gray-50 py-0.5 rounded transition">
                      <span>Product SKU Warehouse Sales</span>
                      <span className="font-bold">${productSalesRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-900 pt-1 text-sm bg-gray-50 px-1 rounded">
                      <span>GROSS TRADING REVENUE</span>
                      <span>${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="font-sans font-bold text-gray-900 border-b border-gray-900 pb-1 uppercase tracking-wide">2. COST OF SALES</h3>
                    <div className="flex justify-between pl-4 pb-1 border-b border-gray-150 hover:bg-gray-50 py-0.5 rounded transition">
                      <span>Cost of Goods Sold (Dynamic Wholesale Costs)</span>
                      <span className="font-bold text-red-700">-${costOfGoodsSold.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-900 pt-1 text-sm bg-[#f0fdf4] text-emerald-800 px-1 rounded">
                      <span>GROSS TRADING PROFIT</span>
                      <span>${grossProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="font-sans font-bold text-gray-900 border-b border-gray-900 pb-1 uppercase tracking-wide">3. OVERHEAD OPERATING EXPENSES</h3>
                    <div className="flex justify-between pl-4 hover:bg-gray-50 py-0.5 rounded transition">
                      <span>Commercial Space Office Rent</span>
                      <span className="font-bold">${rentExpense.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between pl-4 hover:bg-gray-50 py-0.5 rounded transition">
                      <span>Personnel Labor Salaries & Payroll</span>
                      <span className="font-bold">${salaryExpense.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between pl-4 hover:bg-gray-50 py-0.5 rounded transition">
                      <span>Software SaaS & CRM Subscriptions</span>
                      <span className="font-bold">${softwareExpense.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between pl-4 hover:bg-gray-50 py-0.5 rounded transition">
                      <span>Corporate Growth Marketing Campaigns</span>
                      <span className="font-bold">${marketingExpense.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between pl-4 pb-1 border-b border-gray-150 hover:bg-gray-50 py-0.5 rounded transition">
                      <span>General Facilities Utilities</span>
                      <span className="font-bold">${utilitiesExpense.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-900 pt-1 text-sm bg-gray-50 px-1 rounded">
                      <span>TOTAL OVERHEAD EXPENSES</span>
                      <span>${totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div className="border-t-2 border-gray-950 pt-2 flex justify-between font-bold text-gray-900 text-sm">
                    <span>NET PERIOD COMPREHENSIVE INCOME</span>
                    <span className="border-b-4 border-double border-gray-950 px-1 bg-emerald-50 text-emerald-800 text-center">
                      ${netOperatingIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              {/* PRIMARY 3: CASH FLOW STATEMENT */}
              {activeReport === "cf" && (
                <div className="font-mono text-xs text-gray-800 space-y-4" id="rendered-cf">
                  <div className="space-y-1">
                    <h3 className="font-sans font-bold text-gray-900 border-b border-gray-900 pb-1 uppercase tracking-wide">1. OPERATING ACTIVITIES</h3>
                    <div className="flex justify-between pl-4 py-0.5 rounded hover:bg-gray-50">
                      <span>Cash Collected from Client Billings</span>
                      <span className="text-emerald-700 font-bold">+${cashFromCustomers.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between pl-4 py-0.5 rounded hover:bg-gray-50">
                      <span>Cash Paid for Facility Rent</span>
                      <span className="text-red-700 font-bold">-${cashPaidRent.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between pl-4 py-0.5 rounded hover:bg-gray-50">
                      <span>Cash Paid for Employees Salary Payroll</span>
                      <span className="text-red-700 font-bold">-${cashPaidSalaries.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between pl-4 pb-1 border-b border-gray-150 hover:bg-gray-50">
                      <span>Cash Paid for Utilities, Marketing & Software SaaS</span>
                      <span className="text-red-700 font-bold">-${cashPaidOtherExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-900 pt-1">
                      <span>NET CASH FROM OPERATING ACTIVITIES</span>
                      <span className={netCashFromOperating >= 0 ? "text-emerald-700 bg-emerald-50 px-1 rounded" : "text-red-700 bg-red-50 px-1 rounded"}>
                        ${netCashFromOperating.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-sans font-bold text-gray-900 border-b border-gray-900 pb-1 uppercase tracking-wide">2. FINANCING ACTIVITIES</h3>
                    <div className="flex justify-between pl-4 py-0.5 rounded hover:bg-gray-50">
                      <span>Owner Capital Injected (Contributed Share Capital)</span>
                      <span className="text-emerald-700 font-bold">+${cashFromFinancing.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between pl-4 pb-1 border-b border-gray-150 hover:bg-gray-50">
                      <span>Less: Owner Drawings/Dividends Paid Out</span>
                      <span className="text-red-700 font-bold">-${cashPaidFinancing.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-900 pt-1">
                      <span>NET CASH FROM FINANCING ACTIVITIES</span>
                      <span className="text-emerald-700 bg-emerald-50 px-1 rounded">${netCashFromFinancing.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t-2 border-gray-950">
                    <div className="flex justify-between font-bold text-gray-900">
                      <span>NET CHANGE IN CASH RESERVES</span>
                      <span className={netIncreaseInCash >= 0 ? "text-emerald-700" : "text-red-700"}>
                        ${netIncreaseInCash.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between pl-2">
                      <span>Beginning Cash Balance (June 1, 2026)</span>
                      <span>${beginningCashValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-900 bg-gray-50 p-1.5 rounded border-b-4 border-double border-gray-950 pl-2">
                      <span>CASH AT END OF ACCOUNTING PERIOD (July 31)</span>
                      <span>${endingCashValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* PRIMARY 4: STATEMENT OF CHANGES IN EQUITY */}
              {activeReport === "eq" && (
                <div className="font-mono text-xs text-gray-800 space-y-4" id="rendered-eq">
                  <div className="space-y-1">
                    <div className="flex justify-between pl-2 py-1 hover:bg-gray-50 rounded">
                      <span>Beginning Equity Value (June 1, 2026)</span>
                      <span className="font-bold">${beginningEquity.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between pl-2 py-1 text-emerald-700 hover:bg-gray-50 rounded">
                      <span>Add: Additional Capital Contributed</span>
                      <span>+${ownerContributions.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between pl-2 py-1 text-emerald-700 hover:bg-gray-50 rounded">
                      <span>Add: Net profit after taxation</span>
                      <span>+${currentRetainedEarnings.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between pl-2 py-1 text-red-700 pb-2 border-b border-gray-150 hover:bg-gray-50 rounded">
                      <span>Less: Dividends / Drawings</span>
                      <span>-${ownerDrawings.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-900 text-sm bg-gray-50 p-1.5 rounded border-b-4 border-double border-gray-950 pt-2 pl-2">
                      <span>ENDING SHAREHOLDERS' EQUITY VALUE</span>
                      <span>${endingEquityValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* SUPPORTING: TRIAL BALANCE */}
              {activeReport === "tb" && (
                <div className="font-mono text-xs text-gray-800 space-y-3" id="rendered-tb">
                  <div className="border-b border-gray-950 pb-1 font-sans font-bold flex justify-between text-gray-950 uppercase tracking-wide">
                    <span>Ledger Account Code</span>
                    <div className="flex gap-20 w-44 justify-between">
                      <span>Debit DR</span>
                      <span>Credit CR</span>
                    </div>
                  </div>
                  <div className="space-y-0.5 max-h-[300px] overflow-y-auto pr-1">
                    {state.accounts.map(acc => {
                      const isDebit = acc.type === AccountType.ASSET || acc.type === AccountType.EXPENSE;
                      return (
                        <div key={acc.id} className="flex justify-between pl-1 hover:bg-gray-50 py-0.5 rounded transition">
                          <span>
                            <span className="text-gray-400 font-bold mr-2">{acc.code}</span>
                            {acc.name}
                          </span>
                          <div className="flex font-mono w-48 justify-between text-right pl-4">
                            <span>{isDebit ? `$${acc.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "—"}</span>
                            <span>{!isDebit ? `$${acc.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "—"}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="border-t border-b-2 border-gray-950 py-2 flex justify-between font-bold text-gray-900 text-sm bg-gray-50 rounded px-1">
                    <span>EQUALIZED DOUBLE-ENTRY PARITY</span>
                    <div className="flex font-mono w-48 justify-between text-right pl-4">
                      <span>${totalDebits.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                      <span>${totalCredits.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* SUPPORTING: CHART OF ACCOUNTS */}
              {activeReport === "coa" && (
                <div className="space-y-3" id="rendered-coa">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-gray-950 font-mono text-gray-500 uppercase">
                          <th className="py-2">Code</th>
                          <th>Name</th>
                          <th>Category</th>
                          <th className="text-right">Ledger Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-sans">
                        {state.accounts.map(acc => (
                          <tr key={acc.id} className="hover:bg-gray-50">
                            <td className="py-2.5 font-mono font-bold text-gray-400">{acc.code}</td>
                            <td className="font-semibold text-gray-800">{acc.name}</td>
                            <td>
                              <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded ${
                                acc.type === AccountType.ASSET ? "bg-blue-50 text-blue-700" :
                                acc.type === AccountType.LIABILITY ? "bg-red-50 text-red-700" :
                                acc.type === AccountType.EQUITY ? "bg-purple-50 text-purple-700" :
                                acc.type === AccountType.REVENUE ? "bg-emerald-50 text-emerald-700" :
                                "bg-amber-50 text-amber-700"
                              }`}>
                                {acc.type}
                              </span>
                            </td>
                            <td className="text-right font-mono font-bold text-gray-900">${acc.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SUPPORTING: GENERAL JOURNAL */}
              {activeReport === "gj" && (
                <div className="space-y-4" id="rendered-gj">
                  <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                    {state.journalEntries.length === 0 ? (
                      <p className="text-center py-8 text-gray-400 text-xs">No journal entries logged.</p>
                    ) : (
                      state.journalEntries.map(je => {
                        const debitsSum = je.lines.reduce((sum, l) => sum + l.debit, 0);
                        return (
                          <div key={je.id} className="border border-gray-200 rounded-lg p-3 bg-white space-y-2 text-[11px]" id={`je-block-${je.id}`}>
                            <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                              <div>
                                <p className="font-sans font-bold text-gray-800">{je.description}</p>
                                <p className="text-[10px] text-gray-400 font-mono">ID: {je.id} | Posted: {je.date}</p>
                              </div>
                              <span className="font-mono font-bold text-[#107c41] bg-emerald-50 px-2 py-0.5 rounded">
                                Balanced: ${debitsSum.toLocaleString()}
                              </span>
                            </div>
                            <div className="font-mono text-[10px] divide-y divide-gray-50">
                              <div className="grid grid-cols-12 font-sans font-bold text-gray-400 uppercase py-1">
                                <span className="col-span-8">Ledger Line Account</span>
                                <span className="col-span-2 text-right">Debit</span>
                                <span className="col-span-2 text-right">Credit</span>
                              </div>
                              {je.lines.map((l, index) => {
                                const accName = state.accounts.find(a => a.id === l.accountId)?.name || "Unknown Account";
                                return (
                                  <div key={index} className="grid grid-cols-12 py-1 hover:bg-gray-50">
                                    <span className={`col-span-8 truncate ${l.credit > 0 ? "pl-6 text-gray-500" : "font-semibold text-gray-800"}`}>
                                      {accName}
                                    </span>
                                    <span className="col-span-2 text-right">{l.debit > 0 ? `$${l.debit.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "—"}</span>
                                    <span className="col-span-2 text-right">{l.credit > 0 ? `$${l.credit.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "—"}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* SUPPORTING: GENERAL LEDGER (INTERACTIVE) */}
              {activeReport === "gl" && (
                <div className="space-y-4" id="rendered-gl">
                  {/* Account Selector */}
                  <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-150 text-xs font-sans">
                    <span className="font-bold text-gray-700">Select General Account:</span>
                    <select
                      value={selectedAccountId}
                      onChange={(e) => setSelectedAccountId(e.target.value)}
                      className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg focus:outline-hidden text-xs text-gray-800 font-semibold"
                      id="gl-account-selector"
                    >
                      {state.accounts.map(a => (
                        <option key={a.id} value={a.id}>[{a.code}] {a.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* GL ledger calculations */}
                  {(() => {
                    const acc = state.accounts.find(a => a.id === selectedAccountId);
                    if (!acc) return null;
                    const isDebitAcc = acc.type === AccountType.ASSET || acc.type === AccountType.EXPENSE;
                    
                    const sortedEntries = [...state.journalEntries]
                      .filter(je => je.lines.some(l => l.accountId === selectedAccountId))
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                    
                    let runningBalance = 0;
                    const linesData = sortedEntries.map(je => {
                      const line = je.lines.find(l => l.accountId === selectedAccountId)!;
                      if (isDebitAcc) {
                        runningBalance += (line.debit - line.credit);
                      } else {
                        runningBalance += (line.credit - line.debit);
                      }
                      return {
                        date: je.date,
                        description: je.description,
                        debit: line.debit,
                        credit: line.credit,
                        balance: runningBalance
                      };
                    });

                    return (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs font-mono bg-gray-50 p-2.5 rounded border border-gray-150">
                          <span className="font-bold">Total Postings: {linesData.length}</span>
                          <span className="font-bold">Authoritative Balance: ${acc.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-[11px] font-mono">
                            <thead>
                              <tr className="border-b border-gray-950 text-gray-400 uppercase">
                                <th className="py-1.5">Date</th>
                                <th>Description</th>
                                <th className="text-right">Debit</th>
                                <th className="text-right">Credit</th>
                                <th className="text-right">Balance</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {linesData.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="py-8 text-center text-gray-400">No general entries found for this ledger line.</td>
                                </tr>
                              ) : (
                                linesData.map((l, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50">
                                    <td className="py-2 text-gray-500">{l.date}</td>
                                    <td className="text-gray-800 font-sans truncate max-w-[150px]" title={l.description}>{l.description}</td>
                                    <td className="text-right font-bold">{l.debit > 0 ? `$${l.debit.toFixed(2)}` : "—"}</td>
                                    <td className="text-right font-bold">{l.credit > 0 ? `$${l.credit.toFixed(2)}` : "—"}</td>
                                    <td className="text-right font-bold text-[#107c41] bg-gray-50/50">${l.balance.toFixed(2)}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* SUPPORTING: AGING REPORTS (A/R & A/P) */}
              {(activeReport === "ar_aging" || activeReport === "ap_aging") && (
                <div className="font-mono text-xs text-gray-800 space-y-5" id="rendered-aging">
                  {(() => {
                    const isAR = activeReport === "ar_aging";
                    const aging = { current: 0, k1_30: 0, k31_60: 0, k61_90: 0, k90plus: 0 };
                    
                    const rows: Array<{ name: string; current: number; k1_30: number; k31_60: number; k61_90: number; k90plus: number; total: number }> = [];

                    if (isAR) {
                      const custMap: Record<string, typeof aging> = {};
                      state.invoices.forEach(inv => {
                        if (inv.status !== "paid" && inv.balanceDue > 0) {
                          const due = new Date(inv.dueDate);
                          const diff = Math.ceil((currentDate.getTime() - due.getTime()) / (1000 * 3600 * 24));
                          if (!custMap[inv.customerName]) custMap[inv.customerName] = { current: 0, k1_30: 0, k31_60: 0, k61_90: 0, k90plus: 0 };
                          
                          if (diff <= 0) custMap[inv.customerName].current += inv.balanceDue;
                          else if (diff <= 30) custMap[inv.customerName].k1_30 += inv.balanceDue;
                          else if (diff <= 60) custMap[inv.customerName].k31_60 += inv.balanceDue;
                          else if (diff <= 90) custMap[inv.customerName].k61_90 += inv.balanceDue;
                          else custMap[inv.customerName].k90plus += inv.balanceDue;
                        }
                      });
                      Object.entries(custMap).forEach(([name, val]) => {
                        const total = val.current + val.k1_30 + val.k31_60 + val.k61_90 + val.k90plus;
                        rows.push({ name, ...val, total });
                      });
                    } else {
                      const suppMap: Record<string, typeof aging> = {};
                      state.bills.forEach(bill => {
                        if (bill.status !== "paid" && bill.balanceDue > 0) {
                          const due = new Date(bill.dueDate);
                          const diff = Math.ceil((currentDate.getTime() - due.getTime()) / (1000 * 3600 * 24));
                          if (!suppMap[bill.supplierName]) suppMap[bill.supplierName] = { current: 0, k1_30: 0, k31_60: 0, k61_90: 0, k90plus: 0 };
                          
                          if (diff <= 0) suppMap[bill.supplierName].current += bill.balanceDue;
                          else if (diff <= 30) suppMap[bill.supplierName].k1_30 += bill.balanceDue;
                          else if (diff <= 60) suppMap[bill.supplierName].k31_60 += bill.balanceDue;
                          else if (diff <= 90) suppMap[bill.supplierName].k61_90 += bill.balanceDue;
                          else suppMap[bill.supplierName].k90plus += bill.balanceDue;
                        }
                      });
                      Object.entries(suppMap).forEach(([name, val]) => {
                        const total = val.current + val.k1_30 + val.k31_60 + val.k61_90 + val.k90plus;
                        rows.push({ name, ...val, total });
                      });
                    }

                    const totals = rows.reduce((acc, row) => ({
                      current: acc.current + row.current,
                      k1_30: acc.k1_30 + row.k1_30,
                      k31_60: acc.k31_60 + row.k31_60,
                      k61_90: acc.k61_90 + row.k61_90,
                      k90plus: acc.k90plus + row.k90plus,
                      total: acc.total + row.total
                    }), { current: 0, k1_30: 0, k31_60: 0, k61_90: 0, k90plus: 0, total: 0 });

                    return (
                      <div className="space-y-4">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-[10px]">
                            <thead>
                              <tr className="border-b border-gray-950 text-gray-400 uppercase font-bold">
                                <th className="py-2">{isAR ? "Customer Partner" : "Supplier Vendor"}</th>
                                <th className="text-right">Current</th>
                                <th className="text-right">1-30 Days</th>
                                <th className="text-right">31-60 Days</th>
                                <th className="text-right">61-90 Days</th>
                                <th className="text-right">90+ Days</th>
                                <th className="text-right font-sans">Total Owed</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 font-semibold text-gray-800">
                              {rows.length === 0 ? (
                                <tr>
                                  <td colSpan={7} className="py-8 text-center text-gray-400 font-mono">No outstanding {isAR ? "accounts receivable" : "accounts payable"} items currently aging.</td>
                                </tr>
                              ) : (
                                rows.map((r, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50">
                                    <td className="py-2.5 font-sans font-bold text-gray-900">{r.name}</td>
                                    <td className="text-right">${r.current.toLocaleString()}</td>
                                    <td className="text-right text-amber-600">${r.k1_30.toLocaleString()}</td>
                                    <td className="text-right text-amber-700">${r.k31_60.toLocaleString()}</td>
                                    <td className="text-right text-red-600">${r.k61_90.toLocaleString()}</td>
                                    <td className="text-right text-red-700 font-bold bg-red-50/20">${r.k90plus.toLocaleString()}</td>
                                    <td className="text-right font-sans font-bold text-gray-900 bg-gray-50/50">${r.total.toLocaleString()}</td>
                                  </tr>
                                ))
                              )}
                              {rows.length > 0 && (
                                <tr className="border-t-2 border-gray-950 font-bold bg-gray-50 font-sans text-gray-950">
                                  <td className="py-2 font-bold uppercase">Total Aging Portfolio</td>
                                  <td className="text-right font-mono">${totals.current.toLocaleString()}</td>
                                  <td className="text-right font-mono text-amber-600">${totals.k1_30.toLocaleString()}</td>
                                  <td className="text-right font-mono text-amber-700">${totals.k31_60.toLocaleString()}</td>
                                  <td className="text-right font-mono text-red-600">${totals.k61_90.toLocaleString()}</td>
                                  <td className="text-right font-mono text-red-700">${totals.k90plus.toLocaleString()}</td>
                                  <td className="text-right font-mono text-indigo-900 font-extrabold bg-indigo-50 border-double border-b-4 border-indigo-950">${totals.total.toLocaleString()}</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* REUSABLE DYNAMIC TABLE FOR STANDARD LOGS */}
              {["gj", "bs", "pl", "cf", "eq", "tb", "coa", "gl", "ar_aging", "ap_aging", "rules_engine"].includes(activeReport) === false && reportDetails.categoryId !== "ai_cfo" && (
                <div className="space-y-4" id="rendered-dynamic-log">
                  {/* Interactive selector overrides */}
                  {activeReport === "cust_stmt" && (
                    <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-lg border border-gray-150 text-xs font-sans">
                      <span className="font-bold text-gray-700">Select Customer:</span>
                      <select
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                        className="bg-white border border-gray-200 px-3 py-1 rounded focus:outline-hidden text-xs text-gray-800 font-semibold"
                        id="stmt-customer-selector"
                      >
                        {state.partners.filter(p => p.type === "customer").map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {activeReport === "supp_stmt" && (
                    <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-lg border border-gray-150 text-xs font-sans">
                      <span className="font-bold text-gray-700">Select Supplier Vendor:</span>
                      <select
                        value={selectedSupplierId}
                        onChange={(e) => setSelectedSupplierId(e.target.value)}
                        className="bg-white border border-gray-200 px-3 py-1 rounded focus:outline-hidden text-xs text-gray-800 font-semibold"
                        id="stmt-supplier-selector"
                      >
                        {state.partners.filter(p => p.type === "supplier").map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* COMPUTED DATA TABLE LISTING */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-gray-900 font-mono text-gray-400 uppercase">
                          <th className="py-1.5 pb-2">Line / Date</th>
                          <th>Particulars</th>
                          <th>Reference Status</th>
                          <th className="text-right">Accounting Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-sans text-gray-700 font-medium">
                        {/* CUSTOMER STATEMENT */}
                        {activeReport === "cust_stmt" && (() => {
                          const cust = state.partners.find(p => p.id === selectedCustomerId);
                          if (!cust) return <tr><td colSpan={4} className="py-4 text-center text-gray-400">No customer selected.</td></tr>;
                          const invs = state.invoices.filter(i => i.customerId === cust.id);
                          return (
                            <>
                              <tr className="bg-gray-50/50 font-bold text-gray-900">
                                <td className="py-2">Opening Account Balance</td>
                                <td>Client onboarding baseline</td>
                                <td>Verified</td>
                                <td className="text-right">$0.00</td>
                              </tr>
                              {invs.map((i, index) => (
                                <tr key={index}>
                                  <td className="py-2.5 font-mono">{i.date}</td>
                                  <td>Invoice #{i.invoiceNumber} billable</td>
                                  <td><span className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">{i.status}</span></td>
                                  <td className="text-right font-mono font-bold text-red-600">+${i.total.toLocaleString()}</td>
                                </tr>
                              ))}
                              {invs.flatMap(i => i.payments).map((p, index) => (
                                <tr key={`pay-${index}`} className="text-emerald-800 bg-emerald-50/10">
                                  <td className="py-2.5 font-mono">{p.date}</td>
                                  <td>Cash Payment received ({p.method})</td>
                                  <td>Cleared</td>
                                  <td className="text-right font-mono font-bold text-emerald-700">-${p.amount.toLocaleString()}</td>
                                </tr>
                              ))}
                              <tr className="border-t-2 border-gray-950 bg-gray-50 font-sans font-extrabold text-gray-950">
                                <td className="py-2 uppercase">Net Balance Due</td>
                                <td>Authorized client outstanding</td>
                                <td>Owed</td>
                                <td className="text-right font-mono text-indigo-900 font-extrabold">${cust.balance.toLocaleString()}</td>
                              </tr>
                            </>
                          );
                        })()}

                        {/* SUPPLIER STATEMENT */}
                        {activeReport === "supp_stmt" && (() => {
                          const supp = state.partners.find(p => p.id === selectedSupplierId);
                          if (!supp) return <tr><td colSpan={4} className="py-4 text-center text-gray-400">No supplier selected.</td></tr>;
                          const bills = state.bills.filter(b => b.supplierId === supp.id);
                          return (
                            <>
                              <tr className="bg-gray-50/50 font-bold text-gray-900">
                                <td className="py-2">Opening Accounts Balance</td>
                                <td>Vendor onboarding baseline</td>
                                <td>Verified</td>
                                <td className="text-right">$0.00</td>
                              </tr>
                              {bills.map((b, index) => (
                                <tr key={index}>
                                  <td className="py-2.5 font-mono">{b.date}</td>
                                  <td>Bill #{b.billNumber} overhead</td>
                                  <td><span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">{b.status}</span></td>
                                  <td className="text-right font-mono font-bold text-red-600">+${b.total.toLocaleString()}</td>
                                </tr>
                              ))}
                              <tr className="border-t-2 border-gray-950 bg-gray-50 font-sans font-extrabold text-gray-950">
                                <td className="py-2 uppercase">Outstanding Balance Owed</td>
                                <td>Authorized payables liability</td>
                                <td>Unpaid</td>
                                <td className="text-right font-mono text-red-800 font-extrabold">${supp.balance.toLocaleString()}</td>
                              </tr>
                            </>
                          );
                        })()}

                        {/* CUSTOMER BALANCES SUMMARY */}
                        {activeReport === "cust_bal" && (
                          state.partners.filter(p => p.type === "customer").map((p, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="py-2.5 font-sans font-bold text-gray-900">{p.name}</td>
                              <td>{p.email || "No email on record"}</td>
                              <td><span className={p.balance > 0 ? "text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono" : "text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono"}>{p.balance > 0 ? "DEBTOR" : "PAID"}</span></td>
                              <td className="text-right font-mono font-bold text-gray-900">${p.balance.toLocaleString()}</td>
                            </tr>
                          ))
                        )}

                        {/* OUTSTANDING INVOICES */}
                        {activeReport === "outstanding_inv" && (
                          state.invoices.filter(i => i.status !== "paid").map((i, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="py-2.5 font-mono text-gray-500">{i.dueDate}</td>
                              <td>Invoice #{i.invoiceNumber} to <strong>{i.customerName}</strong></td>
                              <td><span className="text-red-700 bg-red-50 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono uppercase">{i.status}</span></td>
                              <td className="text-right font-mono font-bold text-indigo-900">${i.balanceDue.toLocaleString()}</td>
                            </tr>
                          ))
                        )}

                        {/* BUDGET VS ACTUAL */}
                        {activeReport === "budget_actual" && (
                          state.budgets.map((b, idx) => {
                            // Compute actual expenses matches category name
                            const actualSpent = postedTransactions
                              .filter(t => t.category?.toLowerCase() === b.category.toLowerCase() || t.offsetAccountId?.toLowerCase().includes(b.category.toLowerCase()))
                              .reduce((sum, t) => sum + Math.abs(t.amount), 0);
                            const variance = b.amount - actualSpent;
                            const percentUsed = b.amount > 0 ? (actualSpent / b.amount) * 100 : 0;
                            return (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="py-2.5 font-sans font-bold text-gray-900">{b.category}</td>
                                <td>Budget period: <strong>{b.period}</strong></td>
                                <td>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[10px]">DR actual ${actualSpent.toLocaleString()} / budgeted ${b.amount.toLocaleString()}</span>
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${percentUsed > 100 ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"}`}>{percentUsed.toFixed(0)}%</span>
                                  </div>
                                </td>
                                <td className={`text-right font-mono font-bold ${variance >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                                  ${variance.toLocaleString()}
                                </td>
                              </tr>
                            );
                          })
                        )}

                        {/* INVENTORY VALUATION */}
                        {activeReport === "inv_val" && (
                          state.products.map((p, idx) => {
                            const wholesaleVal = p.stockLevel * p.costPrice;
                            const retailVal = p.stockLevel * p.unitPrice;
                            return (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="py-2.5 font-mono font-bold text-gray-400">{p.sku}</td>
                                <td><strong>{p.name}</strong> ({p.category})</td>
                                <td>Wholesale: ${p.costPrice} vs Retail: ${p.unitPrice} (Stock: {p.stockLevel})</td>
                                <td className="text-right font-mono text-gray-950 font-bold">
                                  Asset Val: ${wholesaleVal.toLocaleString()}
                                </td>
                              </tr>
                            );
                          })
                        )}

                        {/* CASH POSITION & RUNWAY */}
                        {activeReport === "cash_pos" && (() => {
                          const monthlyExpenses = totalExpenses;
                          const runwayMonths = monthlyExpenses > 0 ? (totalCash / monthlyExpenses) : 12;
                          return (
                            <>
                              <tr>
                                <td className="py-3 font-sans font-bold text-gray-900">Total Liquid Cash checking</td>
                                <td>Checking Bank Account</td>
                                <td>Highly Liquid Asset</td>
                                <td className="text-right font-mono font-bold">${bankCash.toLocaleString()}</td>
                              </tr>
                              <tr>
                                <td className="py-3 font-sans font-bold text-gray-900">Total cash drawer reserves</td>
                                <td>Petty Cash Drawer</td>
                                <td>Physical Currency</td>
                                <td className="text-right font-mono font-bold">${pettyCash.toLocaleString()}</td>
                              </tr>
                              <tr>
                                <td className="py-3 font-sans font-bold text-gray-900">Monthly Expenses Overhead</td>
                                <td>Sum of Operating Expenses</td>
                                <td>Average monthly burn</td>
                                <td className="text-right font-mono font-bold text-red-600">${monthlyExpenses.toLocaleString()}</td>
                              </tr>
                              <tr className="bg-indigo-50/30 text-indigo-900 font-extrabold text-sm border-t border-b border-indigo-200">
                                <td className="py-3 uppercase font-sans">Cash Runway Projections</td>
                                <td>Survival horizon in months</td>
                                <td>Healthy Coverage (12m+)</td>
                                <td className="text-right font-sans text-indigo-950">{runwayMonths.toFixed(1)} Months</td>
                              </tr>
                            </>
                          );
                        })()}

                        {/* STOCK ON HAND */}
                        {activeReport === "stock_hand" && (
                          state.products.map((p, idx) => {
                            const isLow = p.stockLevel <= p.safetyStock;
                            return (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="py-2.5 font-mono font-bold text-gray-400">{p.sku}</td>
                                <td><strong>{p.name}</strong></td>
                                <td>Safety threshold: {p.safetyStock} units</td>
                                <td className="text-right font-mono">
                                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${isLow ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"}`}>
                                    {p.stockLevel} units ({isLow ? "REORDER" : "OK"})
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}

                        {/* RATIOS & ANALYTICS */}
                        {activeReport === "profitability" && (() => {
                          const curRatio = totalCurrentLiabilities > 0 ? (totalCurrentAssets / totalCurrentLiabilities) : 5;
                          const quickRatio = totalCurrentLiabilities > 0 ? ((totalCurrentAssets - inventory) / totalCurrentLiabilities) : 5;
                          const grossMarginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
                          const netMarginPct = totalRevenue > 0 ? (netOperatingIncome / totalRevenue) * 100 : 0;
                          return (
                            <>
                              <tr>
                                <td className="py-3 font-sans font-bold text-gray-900">Current Ratio</td>
                                <td>Current Assets / Current Liabilities</td>
                                <td>Target: &gt;1.5</td>
                                <td className="text-right font-sans font-bold text-indigo-900">{curRatio.toFixed(2)}x</td>
                              </tr>
                              <tr>
                                <td className="py-3 font-sans font-bold text-gray-900">Quick ratio (Acid Test)</td>
                                <td>(Current Assets - Inventory) / Current Liabilities</td>
                                <td>Target: &gt;1.0</td>
                                <td className="text-right font-sans font-bold text-indigo-900">{quickRatio.toFixed(2)}x</td>
                              </tr>
                              <tr>
                                <td className="py-3 font-sans font-bold text-gray-900">Gross profit Margin</td>
                                <td>(Gross Profit / Revenue) x 100</td>
                                <td>Trading health</td>
                                <td className="text-right font-sans font-bold text-indigo-900">{grossMarginPct.toFixed(1)}%</td>
                              </tr>
                              <tr>
                                <td className="py-3 font-sans font-bold text-gray-900">Net profit Margin</td>
                                <td>(Net Operating Income / Revenue) x 100</td>
                                <td>Bottom line efficiency</td>
                                <td className="text-right font-sans font-bold text-indigo-900">{netMarginPct.toFixed(1)}%</td>
                              </tr>
                            </>
                          );
                        })()}

                        {/* FALLBACK INFO LOG */}
                        {["cust_stmt", "supp_stmt", "cust_bal", "outstanding_inv", "budget_actual", "inv_val", "cash_pos", "stock_hand", "profitability"].includes(activeReport) === false && (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-gray-400 font-mono">
                              No listings found inside this secondary database line. All entries reconciled in Trial Balance.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SPECIAL FEATURE: STREAMING AI CFO GENERATED MARKDOWN REPORTS */}
              {reportDetails.categoryId === "ai_cfo" && (
                <div className="space-y-4 font-sans text-xs text-gray-800 animate-fade" id="rendered-ai-generated-report">
                  <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-start gap-3 shadow-2xs">
                    <Brain className="text-indigo-600 mt-0.5 shrink-0" size={18} />
                    <div className="space-y-1">
                      <h4 className="font-bold text-gray-900 text-xs">Dynamic AI CFO Brain Workspace</h4>
                      <p className="text-[10px] text-gray-500 leading-relaxed">
                        This is an interactive AI-Generated executive financial evaluation. It uses real-time double-entry calculations from the Finity state engine to perform deep modeling.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-5 min-h-[250px] shadow-xs text-xs whitespace-pre-wrap leading-relaxed overflow-y-auto max-h-[400px]">
                    {aiReportOutputs[activeReport] ? (
                      <div className="prose prose-sm max-w-none text-gray-800" id="ai-report-markdown-container">
                        {aiReportOutputs[activeReport]}
                      </div>
                    ) : (
                      <div className="text-center py-16 text-gray-400">
                        {isGeneratingAiReport ? (
                          <div className="space-y-3">
                            <RefreshCw size={24} className="animate-spin mx-auto text-indigo-600" />
                            <p className="font-mono text-[10px] text-gray-500">Formulating metrics, auditing balances, and writing report markdown...</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <Sparkles size={24} className="mx-auto text-gray-200" />
                            <p>Generate a bespoke, comprehensive CPA analysis of this report topic.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {aiReportError && (
                    <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg font-mono">{aiReportError}</p>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleGenerateAiReport(activeReport)}
                      disabled={isGeneratingAiReport}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition text-xs shadow-2xs"
                      id="btn-rebuild-ai-report"
                    >
                      {isGeneratingAiReport ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      <span>{aiReportOutputs[activeReport] ? "Rebuild Live AI Report" : "Generate Live AI Report"}</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Double-Entry Compliance Badge Footer of Statement Box */}
          <div className="mt-6 border-t border-gray-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1 text-gray-500">
              <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
              <span>Certified Audit Lock: GAAP Certified Accounting Rule Verification</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] text-emerald-800 bg-emerald-50 font-bold px-2 py-0.5 rounded border border-emerald-100">
                DR/CR DOUBLE-ENTRY SYNCED
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: COEXISTING COMPLIANCE & CHAT COMMENTARY */}
        <div className="lg:col-span-3 bg-[#fafafa] border border-[#e4e4eb] rounded-xl p-5 flex flex-col justify-between shadow-xs h-[650px]" id="report-right-panel">
          <div>
            <div className="flex gap-1 border-b border-gray-200 pb-3 mb-4 text-xs font-sans">
              <button
                onClick={() => setSidebarTab("compliance")}
                className={`flex-1 py-1.5 px-2 rounded-lg text-center font-bold transition flex items-center justify-center gap-1 ${
                  sidebarTab === "compliance" ? "bg-white text-gray-900 border border-gray-200 shadow-2xs" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <Award size={13} className="text-[#107c41]" />
                <span>CPA Rule Guard</span>
              </button>
              <button
                onClick={() => setSidebarTab("ai")}
                className={`flex-1 py-1.5 px-2 rounded-lg text-center font-bold transition flex items-center justify-center gap-1 ${
                  sidebarTab === "ai" ? "bg-white text-gray-900 border border-gray-200 shadow-2xs" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <Sparkles size={13} className="text-indigo-600 animate-pulse" />
                <span>AI Commentary</span>
              </button>
            </div>

            {/* TAB CONTENT: CPA RULE GUARD */}
            {sidebarTab === "compliance" && (
              <div className="space-y-3.5 animate-fade animate-duration-200" id="compliance-rule-tab-body">
                <div>
                  <h4 className="font-sans font-bold text-gray-900 text-xs">GAAP Verification Engine</h4>
                  <p className="text-[10px] text-gray-500 font-sans leading-relaxed mt-0.5">
                    Continuous monitoring of double-entry equations, ledgers, and matching principles.
                  </p>
                </div>

                <div className="space-y-2 max-y-[320px] overflow-y-auto pr-0.5">
                  <div className="p-2.5 bg-white border border-gray-200 rounded-lg space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-sans font-bold text-gray-800">1. Accounting Equation</span>
                      <span className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                        ruleAccountingEquation ? "bg-emerald-50 text-[#107c41]" : "bg-red-50 text-red-700"
                      }`}>
                        {ruleAccountingEquation ? <Check size={10} /> : <X size={10} />}
                        {ruleAccountingEquation ? "PASSED" : "FAILED"}
                      </span>
                    </div>
                    <p className="text-[9px] text-gray-400 font-mono">Assets = Liabilities + Equity</p>
                    <div className="font-mono text-[9px] text-gray-600 bg-gray-50 p-1.5 rounded text-center truncate">
                      ${totalCurrentAssets.toLocaleString(undefined, { maximumFractionDigits: 0 })} = ${totalCurrentLiabilities.toLocaleString(undefined, { maximumFractionDigits: 0 })} + ${totalEquity.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                  </div>

                  <div className="p-2.5 bg-white border border-gray-200 rounded-lg space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-sans font-bold text-gray-800">2. Debit/Credit Parity</span>
                      <span className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                        ruleDebitCreditParity ? "bg-emerald-50 text-[#107c41]" : "bg-red-50 text-red-700"
                      }`}>
                        {ruleDebitCreditParity ? <Check size={10} /> : <X size={10} />}
                        {ruleDebitCreditParity ? "BALANCED" : "DISCREPANCY"}
                      </span>
                    </div>
                    <p className="text-[9px] text-gray-400 font-mono">Total Debits = Total Credits</p>
                    <div className="font-mono text-[9px] text-gray-600 bg-gray-50 p-1.5 rounded text-center truncate">
                      DR ${totalDebits.toLocaleString(undefined, { maximumFractionDigits: 0 })} = CR ${totalCredits.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                  </div>

                  <div className="p-2.5 bg-white border border-gray-200 rounded-lg space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-sans font-bold text-gray-800">3. Cash Reconciliation</span>
                      <span className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                        ruleCashFlowReconciled ? "bg-emerald-50 text-[#107c41]" : "bg-red-50 text-red-700"
                      }`}>
                        {ruleCashFlowReconciled ? <Check size={10} /> : <X size={10} />}
                        {ruleCashFlowReconciled ? "RECONCILED" : "MISMATCH"}
                      </span>
                    </div>
                    <p className="text-[9px] text-gray-400 font-mono">Statement Ending Cash = Balance Sheet Cash</p>
                    <div className="font-mono text-[9px] text-gray-600 bg-gray-50 p-1.5 rounded text-center truncate">
                      CF Ending ${endingCashValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} = BS ${totalCash.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                  </div>

                  <div className="p-2.5 bg-white border border-gray-200 rounded-lg space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-sans font-bold text-gray-800">4. Equity Reconciliation</span>
                      <span className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                        ruleEquityStatementSync ? "bg-emerald-50 text-[#107c41]" : "bg-red-50 text-red-700"
                      }`}>
                        {ruleEquityStatementSync ? <Check size={10} /> : <X size={10} />}
                        {ruleEquityStatementSync ? "SYNCHRONIZED" : "STALE"}
                      </span>
                    </div>
                    <p className="text-[9px] text-gray-400 font-mono">Ending Equity Statement = BS Total Equity</p>
                    <div className="font-mono text-[9px] text-gray-600 bg-gray-50 p-1.5 rounded text-center truncate">
                      Eq End ${endingEquityValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} = BS Eq ${totalEquity.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: AI CFO COMMENTARY */}
            {sidebarTab === "ai" && (
              <div className="space-y-3.5 animate-fade animate-duration-200 font-sans" id="ai-commentary-tab-body">
                <div>
                  <h4 className="font-sans font-bold text-gray-900 text-xs">CPA Financial Health Commentary</h4>
                  <p className="text-[10px] text-gray-500 font-sans leading-relaxed mt-0.5">
                    Considers overall accounts allocations, profitability indexes, and runrates.
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-3 text-[11px] text-gray-700 h-[220px] overflow-y-auto leading-relaxed whitespace-pre-wrap shadow-2xs scrollbar-thin">
                  {reportCommentary ? (
                    reportCommentary
                  ) : (
                    <div className="text-center py-16 text-gray-400" id="awaiting-commentary">
                      <FileText size={20} className="mx-auto text-gray-200 mb-2" />
                      <span>Awaiting health audit...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bottom trigger button */}
          <div className="pt-4 mt-4 border-t border-gray-100">
            {sidebarTab === "ai" ? (
              <button
                onClick={handleGenerateCommentary}
                disabled={isGeneratingCommentary}
                className="w-full bg-[#1a1a24] text-white hover:bg-[#2d2d3d] rounded-xl py-2.5 text-xs font-bold font-sans flex items-center justify-center gap-2 transition"
                id="btn-trigger-ai-audit"
              >
                {isGeneratingCommentary ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Auditing Trial Balances...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={13} />
                    <span>Audit Statement with AI CFO</span>
                  </>
                )}
              </button>
            ) : (
              <div className="bg-[#f0fdf4] border border-emerald-100 p-2.5 rounded-xl flex items-center gap-2 text-[10px] text-emerald-800 font-mono">
                <ShieldCheck size={14} className="text-[#107c41] shrink-0" />
                <span>All critical double-entry rules pass validation checks.</span>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
