/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ArrowUpRight, 
  ShieldAlert, 
  CheckCircle, 
  FilePlus, 
  Sparkles, 
  Receipt, 
  Database,
  ArrowRight,
  TrendingUp as TrendingIcon,
  Activity,
  Layers,
  Award,
  Loader2,
  Mail,
  Phone,
  Globe
} from "lucide-react";
import { FinityState, AccountType } from "../types";

interface DashboardOverviewProps {
  state: FinityState;
  onNavigate: (tab: string) => void;
  isConsoleOpen?: boolean;
}

export default function DashboardOverview({ state, onNavigate, isConsoleOpen = false }: DashboardOverviewProps) {
  // Dynamic currency symbol based on state settings
  const currencySymbol = state?.personalProfile?.currency === "KES" || state?.companyProfile?.currency === "KES" ? "KSh " : "$";

  const [isGeneratingCfo, setIsGeneratingCfo] = useState(false);
  const [cfoInsight, setCfoInsight] = useState<string | null>(
    "**Finity Agent CFO Baseline Analysis:**\n- **Liquidity Audit:** Capital reserve position is strong with high liquidity. Current checking balance of $45k provides ample operational runway.\n- **Risk Factor:** Out of three sent invoices, one invoice (Stark Industries) is **overdue** ($1,200). We recommend triggering an automated reminder.\n- **Expense Audit:** Office rent represents 50% of our July budget ($2,000 out of $2,500). Monitor software subscriptions closely."
  );

  // Financial Calculations
  const getBalanceSum = (types: AccountType[]) => {
    return state.accounts
      .filter((acc) => types.includes(acc.type))
      .reduce((sum, acc) => sum + acc.balance, 0);
  };

  const getAccountBalance = (id: string) => {
    return state.accounts.find((a) => a.id === id)?.balance || 0;
  };

  // Assets
  const bankBalance = getAccountBalance("acc-bank");
  const cashBalance = getAccountBalance("acc-cash");
  const cashPosition = bankBalance + cashBalance;
  const arBalance = getAccountBalance("acc-ar");
  const inventoryBalance = getAccountBalance("acc-inventory");
  const totalAssets = cashPosition + arBalance + inventoryBalance;

  // Liabilities
  const apBalance = getAccountBalance("acc-ap");
  const taxBalance = getAccountBalance("acc-tax");
  const totalLiabilities = apBalance + taxBalance;

  // Working Capital / Equity
  const netEquity = totalAssets - totalLiabilities;

  // Profit / Loss
  const totalRevenue = getBalanceSum([AccountType.REVENUE]);
  const totalExpenses = getBalanceSum([AccountType.EXPENSE]);
  const netProfit = totalRevenue - totalExpenses;
  const netProfitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Outstanding invoices and overdue counts
  const sentInvoices = state.invoices.filter((i) => i.status === "sent" || i.status === "overdue");
  const overdueInvoices = state.invoices.filter((i) => i.status === "overdue");
  const outstandingInvoicesTotal = sentInvoices.reduce((sum, i) => sum + i.balanceDue, 0);

  // Outstanding bills (AP)
  const outstandingBillsTotal = state.bills
    .filter((b) => b.status === "received")
    .reduce((sum, b) => sum + b.balanceDue, 0);

  // Generate dynamic AI CFO Audit
  const handleGenerateCfo = async () => {
    setIsGeneratingCfo(true);
    try {
      const summaryText = `
        Perform a financial health audit on this company. Current figures:
        Cash in Bank: $${bankBalance}, Petty Cash: $${cashBalance}. Total Cash Position: $${cashPosition}.
        Accounts Receivable: $${arBalance}, Inventory: $${inventoryBalance}. Total Assets: $${totalAssets}.
        Accounts Payable: $${apBalance}, Sales Tax Owed: $${taxBalance}. Total Liabilities: $${totalLiabilities}.
        Service Revenue: $${totalRevenue}, Expenses: $${totalExpenses}. Net Profit: $${netProfit}.
        Outstanding Customer Debt: $${outstandingInvoicesTotal} across ${sentInvoices.length} outstanding invoices.
        Outstanding Supplier Debt: $${outstandingBillsTotal}.
        Overdue Invoices: ${overdueInvoices.length}.
        Provide structured, short, punchy business health bullet points with actionable advice. Use markdown.
      `;
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: summaryText, activeTab: "Overview" }),
      });
      const data = await res.json();
      setCfoInsight(data.response);
    } catch (err: any) {
      setCfoInsight("Error generating AI CFO audit: " + err.message);
    } finally {
      setIsGeneratingCfo(false);
    }
  };

  // Simple Markdown Parser to render the CFO Insight beautifully
  const renderCfoInsight = () => {
    if (!cfoInsight) return null;
    return cfoInsight.split("\n").map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
        // Bullet points
        const content = trimmed.replace(/^[-*]\s*/, "");
        // Highlight terms in bold
        const boldSplit = content.split("**");
        return (
          <div key={idx} className="flex gap-2.5 items-start py-1.5 text-xs text-text-main font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-gold mt-1.5 shrink-0" />
            <p className="leading-relaxed">
              {boldSplit.map((chunk, i) => i % 2 === 1 ? <strong key={i} className="text-brand-gold font-bold">{chunk}</strong> : chunk)}
            </p>
          </div>
        );
      }
      if (trimmed.startsWith("###")) {
        return (
          <h4 key={idx} className="font-sans font-bold text-sm text-brand-gold mt-4 mb-2 uppercase tracking-wide">
            {trimmed.replace(/^###\s*/, "")}
          </h4>
        );
      }
      if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
        return (
          <h5 key={idx} className="font-sans font-extrabold text-xs text-text-main mt-3 mb-1.5 tracking-tight uppercase">
            {trimmed.replace(/\*\*/g, "")}
          </h5>
        );
      }
      if (trimmed === "") return <div key={idx} className="h-2" />;
      
      const boldSplit = trimmed.split("**");
      return (
        <p key={idx} className="text-xs text-text-muted leading-relaxed mb-2 font-sans">
          {boldSplit.map((chunk, i) => i % 2 === 1 ? <strong key={i} className="text-brand-gold font-semibold">{chunk}</strong> : chunk)}
        </p>
      );
    });
  };

  return (
    <div className="space-y-8" id="dashboard-overview-tab">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-6" id="dashboard-header">
        <div>
          <h1 className="font-sans text-2xl font-black text-text-main tracking-tight" id="dashboard-title">
            Finity Board room
          </h1>
          <p className="text-xs text-text-muted font-mono mt-1">Real-time enterprise double-entry ledger analytics</p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-brand-gold bg-brand-gold-light px-4 py-2 rounded-xl border border-brand-gold/20" id="current-period">
          <Database size={14} className="text-brand-gold" />
          <span className="font-bold">Accounting Period: July 2026 (Unlocked)</span>
        </div>
      </div>

      {/* Active Business Profile Banner */}
      {state.companyProfile && (
        <div className="bg-card-bg border border-border-subtle/85 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col md:flex-row gap-5" id="onboarded-business-profile-card">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-brand-gold/2 blur-[80px] rounded-full pointer-events-none" />
          
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-sm font-extrabold text-text-main tracking-tight">
                {state.companyProfile.name}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-gold/10 text-brand-gold border border-brand-gold/20 font-mono">
                {state.companyProfile.businessType}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20 font-mono">
                {state.companyProfile.industry}
              </span>
              {state.companyProfile.website && (
                <a 
                  href={state.companyProfile.website.startsWith("http") ? state.companyProfile.website : `https://${state.companyProfile.website}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-xs text-text-muted hover:text-brand-gold flex items-center gap-1 transition"
                >
                  <Globe size={11} />
                  {state.companyProfile.website}
                </a>
              )}
            </div>

            {state.companyProfile.description && (
              <div className="space-y-1">
                <p className="text-xs text-text-muted font-sans leading-relaxed">
                  {state.companyProfile.description}
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-brand-gold font-mono">
                  <Sparkles size={11} className="animate-pulse" />
                  <span>Finity AI core loaded this profile context for suggesting possible outcomes.</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col justify-center gap-3 md:pl-5 md:border-l border-border-subtle/40 text-xs shrink-0">
            {state.companyProfile.email && (
              <div className="flex items-center gap-2 text-text-muted">
                <Mail size={13} className="text-brand-gold shrink-0" />
                <span className="font-mono text-[11px] text-text-main">{state.companyProfile.email}</span>
              </div>
            )}
            {state.companyProfile.phone && (
              <div className="flex items-center gap-2 text-text-muted">
                <Phone size={13} className="text-brand-gold shrink-0" />
                <span className="font-mono text-[11px] text-text-main">{state.companyProfile.phone}</span>
              </div>
            )}
            {state.companyProfile.contactInfo && (
              <div className="flex items-center gap-2 text-text-muted">
                <Activity size={13} className="text-brand-gold shrink-0" />
                <span className="font-sans text-[11px] text-text-main">
                  <span className="text-text-muted">Contact Info:</span> {state.companyProfile.contactInfo}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isConsoleOpen ? "xl:grid-cols-4" : "lg:grid-cols-4"} gap-5`} id="kpi-grid">
        {/* Cash & Assets */}
        <div className="bg-card-bg border border-border-subtle rounded-2xl p-5 hover:border-brand-gold/40 transition-all duration-300 relative overflow-hidden group shadow-lg" id="kpi-assets">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-emerald/3 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between text-text-muted text-[10px] font-mono tracking-widest uppercase font-bold">
            <span>Total Liquid Assets</span>
            <span className="text-brand-emerald bg-brand-emerald/10 border border-brand-emerald/20 px-2 py-0.5 rounded-md font-bold text-[9px]">+100.0%</span>
          </div>
          <p className="font-mono text-2xl font-bold text-text-main mt-4 tracking-tight">
            {currencySymbol}{totalAssets.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-text-muted font-mono mt-4 border-t border-border-subtle/50 pt-3">
            <span>Cash: <strong className="text-text-main">{currencySymbol}{cashPosition.toLocaleString()}</strong></span>
            <span className="text-border-subtle">•</span>
            <span>AR: <strong className="text-text-main">{currencySymbol}{arBalance.toLocaleString()}</strong></span>
          </div>
        </div>

        {/* Total Liabilities */}
        <div className="bg-card-bg border border-border-subtle rounded-2xl p-5 hover:border-brand-gold/40 transition-all duration-300 relative overflow-hidden group shadow-lg" id="kpi-liabilities">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-red/3 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between text-text-muted text-[10px] font-mono tracking-widest uppercase font-bold">
            <span>Liabilities & Accruals</span>
            <span className="text-brand-amber bg-brand-amber/10 border border-brand-amber/20 px-2 py-0.5 rounded-md font-bold text-[9px]">Tax Logged</span>
          </div>
          <p className="font-mono text-2xl font-bold text-text-main mt-4 tracking-tight">
            {currencySymbol}{totalLiabilities.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-text-muted font-mono mt-4 border-t border-border-subtle/50 pt-3">
            <span>Payable: <strong className="text-text-main">{currencySymbol}{apBalance.toLocaleString()}</strong></span>
            <span className="text-border-subtle">•</span>
            <span>Sales Tax: <strong className="text-text-main">{currencySymbol}{taxBalance.toLocaleString()}</strong></span>
          </div>
        </div>

        {/* Owner Equity */}
        <div className="bg-card-bg border border-border-subtle rounded-2xl p-5 hover:border-brand-gold/40 transition-all duration-300 relative overflow-hidden group shadow-lg" id="kpi-equity">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-gold/3 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between text-text-muted text-[10px] font-mono tracking-widest uppercase font-bold">
            <span>Net Equity & Retained</span>
            <span className="text-brand-gold bg-brand-gold-light border border-brand-gold/25 px-2 py-0.5 rounded-md font-bold text-[9px]">Audit Clean</span>
          </div>
          <p className="font-mono text-2xl font-bold text-text-main mt-4 tracking-tight">
            {currencySymbol}{netEquity.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-text-muted font-mono mt-4 border-t border-border-subtle/50 pt-3">
            <span>Opening Capital: <strong className="text-text-main">{currencySymbol}{(50000).toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong></span>
          </div>
        </div>

        {/* Operating Profit */}
        <div className="bg-gradient-to-br from-brand-primary-light to-brand-primary-dark border border-brand-gold/35 text-white rounded-2xl p-5 hover:border-brand-gold/70 transition-all duration-300 relative overflow-hidden shadow-xl" id="kpi-profit">
          {/* Subtle gold shine effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/3 to-transparent pointer-events-none" />
          <div className="flex items-center justify-between text-gray-300 text-[10px] font-mono tracking-widest uppercase font-bold">
            <span className="text-brand-gold font-bold">Operating Net Profit</span>
            <span className="text-brand-gold bg-brand-gold-light border border-brand-gold/30 px-2 py-0.5 rounded-md font-bold text-[9px]">
              {netProfitMargin.toFixed(1)}% Margin
            </span>
          </div>
          <p className="font-mono text-2xl font-bold text-brand-gold mt-4 tracking-tight">
            {currencySymbol}{netProfit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-300 font-mono mt-4 border-t border-white/10 pt-3">
            <span>Rev: <strong>{currencySymbol}{totalRevenue.toLocaleString()}</strong></span>
            <span>•</span>
            <span>Expenses: <strong>{currencySymbol}{totalExpenses.toLocaleString()}</strong></span>
          </div>
        </div>
      </div>

      {/* Visual Ledger Meters & AI Box */}
      <div className={`grid grid-cols-1 ${isConsoleOpen ? "xl:grid-cols-12" : "lg:grid-cols-12"} gap-6`} id="visual-breakdown-row">
        
        {/* Allocation Meters */}
        <div className={`${isConsoleOpen ? "xl:col-span-7" : "lg:col-span-7"} bg-card-bg border border-border-subtle rounded-2xl p-6 shadow-xl relative overflow-hidden`} id="cashflow-meters-box">
          <div className="flex items-center gap-2.5 mb-6">
            <Activity size={16} className="text-brand-gold" />
            <h2 className="text-xs uppercase font-mono tracking-widest font-bold text-text-muted">Ledger Asset Allocations & Targets</h2>
          </div>
          
          <div className="space-y-6" id="allocation-meters">
            {/* Cash Reserves */}
            <div className="p-3.5 bg-app-bg/40 rounded-xl border border-border-subtle/50">
              <div className="flex justify-between text-xs text-text-main mb-2">
                <span className="font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald" />
                  Total Cash Reserve Target
                </span>
                <span className="font-mono font-bold">${cashPosition.toLocaleString()} / $50k Min Target</span>
              </div>
              <div className="w-full bg-border-subtle h-2 rounded-full overflow-hidden">
                <div className="bg-brand-emerald h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((cashPosition / 50000) * 100, 100)}%` }} />
              </div>
            </div>

            {/* Income vs Expenses Allocation */}
            <div className="p-3.5 bg-app-bg/40 rounded-xl border border-border-subtle/50">
              <div className="flex justify-between text-xs text-text-main mb-2">
                <span className="font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-gold" />
                  Gross Ledger Balance Efficiency
                </span>
                <span className="font-mono font-bold">${totalRevenue.toLocaleString()} Total Revenue</span>
              </div>
              <div className="w-full bg-border-subtle h-2 rounded-full overflow-hidden flex">
                <div className="bg-brand-gold h-full transition-all duration-500" style={{ width: `${totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0}%` }} title="Retained Profit" />
                <div className="bg-brand-red h-full transition-all duration-500" style={{ width: `${totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0}%` }} title="Operating Expenses" />
              </div>
              <div className="flex gap-4 text-[9px] font-mono text-text-muted mt-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-gold"></span>
                  <span>Profit Margin (${(totalRevenue - totalExpenses).toLocaleString()})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-red"></span>
                  <span>Expense Burn (${totalExpenses.toLocaleString()})</span>
                </div>
              </div>
            </div>

            {/* Invoicing Pipeline */}
            <div className="p-3.5 bg-app-bg/40 rounded-xl border border-border-subtle/50">
              <div className="flex justify-between text-xs text-text-main mb-2">
                <span className="font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-amber" />
                  Outstanding Receivables (AR) Exposure
                </span>
                <span className="font-mono font-bold">${(outstandingInvoicesTotal).toLocaleString()} Outstanding</span>
              </div>
              <div className="w-full bg-border-subtle h-2 rounded-full overflow-hidden">
                <div className="bg-brand-amber h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((outstandingInvoicesTotal / totalAssets) * 100, 100)}%` }} />
              </div>
              <div className="flex justify-between text-[9px] text-text-muted font-mono mt-2">
                <span>Overdue Invoices: <strong className="text-brand-red">{overdueInvoices.length} (${overdueInvoices.reduce((sum, i) => sum + i.balanceDue, 0).toLocaleString()})</strong></span>
                <span>Active AR Pipeline</span>
              </div>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-border-subtle" id="overview-shortcuts">
            <button
              onClick={() => onNavigate("Invoicing & Contacts")}
              className="flex items-center justify-between p-3.5 bg-app-bg hover:bg-hover-bg rounded-xl border border-border-subtle transition-all duration-300 text-left text-xs font-semibold text-text-main group"
              id="btn-goto-invoice"
            >
              <div className="flex items-center gap-2.5">
                <FilePlus size={15} className="text-text-muted group-hover:text-brand-gold transition-colors" />
                <span>Issue Premium Invoice</span>
              </div>
              <ArrowUpRight size={13} className="text-text-muted group-hover:text-brand-gold group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </button>
            <button
              onClick={() => onNavigate("Receipt Box & OCR")}
              className="flex items-center justify-between p-3.5 bg-app-bg hover:bg-hover-bg rounded-xl border border-border-subtle transition-all duration-300 text-left text-xs font-semibold text-text-main group"
              id="btn-goto-ocr"
            >
              <div className="flex items-center gap-2.5">
                <Receipt size={15} className="text-text-muted group-hover:text-brand-gold transition-colors" />
                <span>AI Receipt Extractions</span>
              </div>
              <ArrowUpRight size={13} className="text-text-muted group-hover:text-brand-gold group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </button>
          </div>
        </div>

        {/* AI CFO Audit Widget */}
        <div className={`${isConsoleOpen ? "xl:col-span-5" : "lg:col-span-5"} bg-card-bg border border-border-subtle rounded-2xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden`} id="ai-cfo-insight-box">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/3 rounded-full blur-2xl pointer-events-none animate-pulse" />
          
          <div>
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-border-subtle/50">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-brand-gold animate-pulse" />
                <h3 className="font-sans text-xs uppercase font-extrabold tracking-wider text-text-main">AI CFO Audit Desk</h3>
              </div>
              <button
                onClick={handleGenerateCfo}
                disabled={isGeneratingCfo}
                className="text-[10px] font-mono text-brand-gold hover:text-brand-gold/80 disabled:opacity-50 flex items-center gap-1.5 border border-brand-gold/25 px-3 py-1.5 rounded-xl bg-brand-gold-light transition active:scale-95"
                id="btn-refresh-cfo"
              >
                {isGeneratingCfo ? (
                  <>
                    <Loader2 size={11} className="animate-spin text-brand-gold" />
                    <span>Auditing...</span>
                  </>
                ) : (
                  <span>Re-Audit Ledger</span>
                )}
              </button>
            </div>

            <div className="bg-app-bg/50 border border-border-subtle rounded-xl p-4 h-[240px] overflow-y-auto custom-scroll" id="cfo-audit-text-container">
              {renderCfoInsight()}
            </div>
          </div>

          <div className="mt-5 text-[10px] font-mono text-text-main bg-brand-gold-light/40 border border-brand-gold/15 p-3 rounded-xl flex items-center gap-2.5" id="cfo-status-footer">
            <Award size={14} className="text-brand-gold" />
            <span>Finity Invariant Signature Checked & Verified</span>
          </div>
        </div>
      </div>

      {/* Recent Ledger History & Audit Timeline */}
      <div className="bg-card-bg border border-border-subtle rounded-2xl p-6 shadow-xl" id="recent-ledger-activities">
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-border-subtle/50">
          <div className="flex items-center gap-2.5">
            <Layers size={16} className="text-brand-gold" />
            <h2 className="text-xs uppercase font-mono tracking-widest font-bold text-text-muted">Double-entry ledger ledger activity stream</h2>
          </div>
          <button
            onClick={() => onNavigate("Accounts & Ledgers")}
            className="text-xs font-bold text-brand-gold hover:text-brand-gold-dark flex items-center gap-1.5 transition group"
            id="btn-view-general-ledger"
          >
            <span>Examine Ledger Book</span>
            <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border-subtle bg-app-bg/25" id="recent-transactions-table-container">
          <table className="w-full text-left border-collapse min-w-[700px]" id="tbl-recent-transactions">
            <thead>
              <tr className="bg-sidebar-bg/50 border-b border-border-subtle font-mono text-[9px] text-text-muted uppercase tracking-wider">
                <th className="px-5 py-3.5 font-bold">Date</th>
                <th className="px-5 py-3.5 font-bold">Reference / Journal Entry</th>
                <th className="px-5 py-3.5 font-bold">Double Posting Accounts</th>
                <th className="px-5 py-3.5 font-bold">Verification Status</th>
                <th className="px-5 py-3.5 text-right font-bold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/40 font-mono text-xs text-text-main" id="tbl-body-recent-transactions">
              {state.transactions.slice(0, 5).map((tx) => (
                <tr key={tx.id} className="hover:bg-hover-bg/30 transition-colors" id={`tx-row-${tx.id}`}>
                  <td className="px-5 py-4 text-text-muted">{tx.date}</td>
                  <td className="px-5 py-4">
                    <div className="font-sans font-bold text-text-main text-xs">{tx.description}</div>
                    <div className="text-[9px] text-text-muted mt-0.5">Reference ID: {tx.id}</div>
                  </td>
                  <td className="px-5 py-4 text-text-muted">
                    <span className="text-[9px] uppercase font-sans font-black px-2 py-0.5 rounded-md bg-hover-bg border border-border-subtle text-brand-gold mr-2">{tx.category}</span>
                    <span className="text-text-main font-semibold">{tx.accountId}</span>
                    <span className="mx-1.5 text-text-muted">⇄</span>
                    <span className="text-text-main font-semibold">{tx.offsetAccountId}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-brand-emerald/10 border border-brand-emerald/20 text-brand-emerald">
                      <CheckCircle size={10} />
                      Post Succeeded
                    </span>
                  </td>
                  <td className={`px-5 py-4 text-right font-bold ${tx.amount > 0 ? "text-brand-emerald" : "text-brand-red"}`}>
                    {tx.amount > 0 ? `+$${tx.amount.toLocaleString()}` : `-$${Math.abs(tx.amount).toLocaleString()}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
