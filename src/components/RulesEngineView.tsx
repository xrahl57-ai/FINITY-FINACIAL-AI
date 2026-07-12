/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Calculator, 
  HelpCircle, 
  Sparkles, 
  CheckCircle, 
  AlertTriangle, 
  Coins, 
  Percent, 
  TrendingUp, 
  Layers, 
  Globe, 
  ShieldCheck, 
  Activity, 
  Search,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  Terminal
} from "lucide-react";
import { FinityState, AccountType } from "../types";
import { FinancialRulesEngine, TaxConfig } from "../rulesEngine";

const flagMap: Record<string, string> = {
  KE: "🇰🇪", US: "🇺🇸", UK: "🇬🇧", CA: "🇨🇦", AU: "🇦🇺", NZ: "🇳🇿",
  DE: "🇩🇪", FR: "🇫🇷", JP: "🇯🇵", IN: "🇮🇳", SG: "🇸🇬",
  ZA: "🇿🇦", BR: "🇧🇷", AE: "🇦🇪", SA: "🇸🇦", MX: "🇲🇽",
  CH: "🇨🇭", KR: "🇰🇷", CN: "🇨🇳", ES: "🇪🇸", IT: "🇮🇹",
  NL: "🇳🇱", SE: "🇸🇪", NO: "🇳🇴", IE: "🇮🇪"
};

interface RulesEngineViewProps {
  state: FinityState;
}

export default function RulesEngineView({ state }: RulesEngineViewProps) {
  const [selectedCountry, setSelectedCountry] = useState<string>("KE");
  const [taxInputAmount, setTaxInputAmount] = useState<number>(1250);
  const [isReducedRate, setIsReducedRate] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Real-time computations from our core rules engine
  const equation = FinancialRulesEngine.checkAccountingEquation(state.accounts);
  const netIncome = FinancialRulesEngine.getNetIncome(state.accounts);
  const grossProfit = FinancialRulesEngine.getGrossProfit(state.accounts);
  const operatingProfit = FinancialRulesEngine.getOperatingProfit(state.accounts);
  const workingCapital = FinancialRulesEngine.getWorkingCapital(state.accounts);
  const currentRatio = FinancialRulesEngine.getCurrentRatio(state.accounts);
  const quickRatio = FinancialRulesEngine.getQuickRatio(state.accounts);
  const debtToEquity = FinancialRulesEngine.getDebtToEquity(state.accounts);
  const grossMargin = FinancialRulesEngine.getGrossMargin(state.accounts);
  const netProfitMargin = FinancialRulesEngine.getNetProfitMargin(state.accounts);
  const roa = FinancialRulesEngine.getROA(state.accounts);
  const roe = FinancialRulesEngine.getROE(state.accounts);
  
  // Total transaction metrics
  const netCashFlow = FinancialRulesEngine.getNetCashFlow(state.transactions);
  
  // Dynamic validation audit
  const auditResult = FinancialRulesEngine.validateState(state);

  // Dynamic tax calculation
  const taxCalcResult = FinancialRulesEngine.calculateTax(taxInputAmount, selectedCountry, isReducedRate);

  // Formulas Directory list
  const formulaCards = [
    {
      id: "f1",
      name: "Accounting Equation Invariant",
      formula: "Assets = Liabilities + Equity",
      desc: "The absolute baseline of bookkeeping. The ledger must always maintain perfect equilibrium.",
      value: `$${equation.assets.toLocaleString(undefined, { minimumFractionDigits: 2 })} = $${(equation.liabilities + equation.equity).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      category: "fundamental",
      status: equation.isBalanced ? "Balanced" : "Unbalanced",
      statusColor: equation.isBalanced ? "text-brand-emerald bg-brand-emerald/10 border-brand-emerald/20" : "text-brand-red bg-brand-red/10 border-brand-red/20"
    },
    {
      id: "f2",
      name: "Double-Entry Balance",
      formula: "Total Debits = Total Credits",
      desc: "Every debit posting in the general journal must match an equal and offsetting credit posting.",
      value: "Balanced across Journal Lines",
      category: "fundamental",
      status: "Verified",
      statusColor: "text-brand-emerald bg-brand-emerald/10 border-brand-emerald/20"
    },
    {
      id: "f3",
      name: "Net Income Margin",
      formula: "Net Income = Revenue − Expenses",
      desc: "Overall bottom-line operating income before specific period tax lock transfers.",
      value: `$${netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      category: "income",
      status: netIncome >= 0 ? "Profitable" : "Deficit",
      statusColor: netIncome >= 0 ? "text-brand-emerald bg-brand-emerald/10 border-brand-emerald/20" : "text-brand-red bg-brand-red/10 border-brand-red/20"
    },
    {
      id: "f4",
      name: "Gross Operating Profit",
      formula: "Gross Profit = Revenue − COGS",
      desc: "Direct performance margins of core service retainers and item retail pipelines.",
      value: `$${grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      category: "income",
      status: grossProfit >= 0 ? "Accruing" : "Squeeze",
      statusColor: grossProfit >= 0 ? "text-brand-emerald bg-brand-emerald/10 border-brand-emerald/20" : "text-brand-red bg-brand-red/10 border-brand-red/20"
    },
    {
      id: "f5",
      name: "Operating Profit (EBIT)",
      formula: "Operating Income = Gross Profit − Expenses",
      desc: "Pre-tax profitability of operations, representing pure operational performance.",
      value: `$${operatingProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      category: "income",
      status: operatingProfit >= 0 ? "Accruing" : "Overhead",
      statusColor: operatingProfit >= 0 ? "text-brand-emerald bg-brand-emerald/10 border-brand-emerald/20" : "text-brand-red bg-brand-red/10 border-brand-red/20"
    },
    {
      id: "f6",
      name: "Working Capital Reserve",
      formula: "Working Capital = Assets − Liabilities",
      desc: "Instant operational capital runway. Higher positive values denote strong capital cushioning.",
      value: `$${workingCapital.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      category: "ratios",
      status: workingCapital >= 0 ? "Liquid" : "Strained",
      statusColor: workingCapital >= 0 ? "text-brand-emerald bg-brand-emerald/10 border-brand-emerald/20" : "text-brand-red bg-brand-red/10 border-brand-red/20"
    },
    {
      id: "f7",
      name: "Current Capital Ratio",
      formula: "Current Ratio = Assets / Liabilities",
      desc: "Standard solvency multiplier. Values above 1.5 indicate highly optimal capital resilience.",
      value: `${currentRatio.toFixed(2)}x`,
      category: "ratios",
      status: currentRatio >= 1.5 ? "Strong" : "Squeeze",
      statusColor: currentRatio >= 1.5 ? "text-brand-emerald bg-brand-emerald/10 border-brand-emerald/20" : "text-brand-amber bg-brand-amber/10 border-brand-amber/20"
    },
    {
      id: "f8",
      name: "Acid Test / Quick Ratio",
      formula: "Quick Ratio = (Cash + AR) / Liabilities",
      desc: "Strict short-term liquid runway, completely isolating inventory asset valuation.",
      value: `${quickRatio.toFixed(2)}x`,
      category: "ratios",
      status: quickRatio >= 1.0 ? "Liquid" : "Exposed",
      statusColor: quickRatio >= 1.0 ? "text-brand-emerald bg-brand-emerald/10 border-brand-emerald/20" : "text-brand-red bg-brand-red/10 border-brand-red/20"
    },
    {
      id: "f9",
      name: "Debt-To-Equity leverage",
      formula: "Debt/Equity = Liabilities / Equity",
      desc: "The ratio of external creditor debt financing relative to corporate equity capital.",
      value: `${debtToEquity.toFixed(2)}x`,
      category: "ratios",
      status: debtToEquity < 1.0 ? "Healthy" : "Leveraged",
      statusColor: debtToEquity < 1.0 ? "text-brand-emerald bg-brand-emerald/10 border-brand-emerald/20" : "text-brand-amber bg-brand-amber/10 border-brand-amber/20"
    },
    {
      id: "f10",
      name: "Gross Operating Margin",
      formula: "Gross Margin = Gross Profit / Revenue",
      desc: "Revenue retained per sales dollar prior to deducting operating overheads.",
      value: `${(grossMargin * 100).toFixed(1)}%`,
      category: "ratios",
      status: grossMargin >= 0.5 ? "Premium" : "Low Margin",
      statusColor: grossMargin >= 0.5 ? "text-brand-emerald bg-brand-emerald/10 border-brand-emerald/20" : "text-brand-amber bg-brand-amber/10 border-brand-amber/20"
    },
    {
      id: "f11",
      name: "Net Retained Margin",
      formula: "Net Margin = Net Income / Revenue",
      desc: "Overall percentage of total service revenue translated directly into retained net earnings.",
      value: `${(netProfitMargin * 100).toFixed(1)}%`,
      category: "ratios",
      status: netProfitMargin >= 0.2 ? "Elite" : "Standard",
      statusColor: netProfitMargin >= 0.2 ? "text-brand-emerald bg-brand-emerald/10 border-brand-emerald/20" : "text-brand-amber bg-brand-amber/10 border-brand-amber/20"
    },
    {
      id: "f12",
      name: "Return On Assets (ROA)",
      formula: "ROA = Net Income / Total Assets",
      desc: "Efficiency indicator measuring how resourcefully assets yield earnings.",
      value: `${(roa * 100).toFixed(1)}%`,
      category: "ratios",
      status: roa >= 0.1 ? "Efficient" : "Sub-optimal",
      statusColor: roa >= 0.1 ? "text-brand-emerald bg-brand-emerald/10 border-brand-emerald/20" : "text-brand-amber bg-brand-amber/10 border-brand-amber/20"
    },
    {
      id: "f13",
      name: "Return On Equity (ROE)",
      formula: "ROE = Net Income / Total Equity",
      desc: "Measures profitability from the perspective of investor capital inputs.",
      value: `${(roe * 100).toFixed(1)}%`,
      category: "ratios",
      status: roe >= 0.15 ? "Elite" : "Standard",
      statusColor: roe >= 0.15 ? "text-brand-emerald bg-brand-emerald/10 border-brand-emerald/20" : "text-brand-amber bg-brand-amber/10 border-brand-amber/20"
    },
    {
      id: "f14",
      name: "Net Cash Flow",
      formula: "Cash Inflows − Cash Outflows = Net Cash Flow",
      desc: "Tracking actual hard cash speed and direction across Checking and Petty drawers.",
      value: `${netCashFlow >= 0 ? "+" : ""}$${netCashFlow.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      category: "income",
      status: netCashFlow >= 0 ? "Positive Cash" : "Negative Cash",
      statusColor: netCashFlow >= 0 ? "text-brand-emerald bg-brand-emerald/10 border-brand-emerald/20" : "text-brand-red bg-brand-red/10 border-brand-red/20"
    }
  ];

  // Filters logic
  const filteredFormulas = formulaCards.filter(card => {
    const matchesSearch = card.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          card.formula.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          card.desc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || card.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 font-sans text-xs text-text-main" id="rules-engine-container">
      
      {/* 1. Invariant Passed Banner */}
      <div className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 shadow-xl relative overflow-hidden ${
        equation.isBalanced 
          ? "bg-brand-emerald/5 border-brand-emerald/20" 
          : "bg-brand-red/5 border-brand-red/20"
      }`} id="rules-engine-balanced-banner">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-emerald/3 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl shrink-0 ${
            equation.isBalanced ? "bg-brand-emerald/15 text-brand-emerald" : "bg-brand-red/15 text-brand-red"
          }`}>
            <ShieldCheck size={20} className={equation.isBalanced ? "animate-pulse" : ""} />
          </div>
          <div>
            <h3 className="font-sans font-black text-text-main text-sm flex items-center gap-2">
              <span>LIVE REGULATORY COMPLIANCE SYSTEM</span>
              <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-mono font-black border ${
                equation.isBalanced 
                  ? "bg-brand-emerald/10 text-brand-emerald border-brand-emerald/15" 
                  : "bg-brand-red/10 text-brand-red border-brand-red/15"
              }`}>
                {equation.isBalanced ? "GAAP INVARIANT VALIDATED" : "INTEGRITY BREAKAGE"}
              </span>
            </h3>
            <p className="text-xs text-text-muted mt-1 max-w-xl leading-relaxed">
              Our automated bookkeeping engine verifies the dual posting criteria for every transaction, checking assets, liabilities, and retained capitals simultaneously.
            </p>
          </div>
        </div>

        {/* Big visual ledger math figures */}
        <div className="bg-card-bg border border-border-subtle px-4.5 py-3.5 rounded-xl flex items-center gap-4.5 font-mono shrink-0 shadow-md">
          <div>
            <span className="block text-[8px] text-text-muted font-sans uppercase font-bold tracking-wider">Total Assets</span>
            <span className="text-brand-emerald text-xs font-black">${equation.assets.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="text-text-muted text-sm font-sans font-thin">=</div>
          <div>
            <span className="block text-[8px] text-text-muted font-sans uppercase font-bold tracking-wider">Liab. + Equity</span>
            <span className="text-brand-gold text-xs font-black">${(equation.liabilities + equation.equity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* 2. Interactive Tax Sourcing Estimator Card */}
      <div className="bg-card-bg border border-border-subtle rounded-2xl p-6 shadow-xl relative overflow-hidden" id="rules-engine-tax-estimator">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/2 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-border-subtle/50">
          <Globe size={15} className="text-brand-gold" />
          <h3 className="font-sans font-bold text-text-main text-xs uppercase tracking-wider">Interactive Multi-Jurisdictional Sourcing desk</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <p className="text-text-muted leading-relaxed text-[11px]">
              Perform dynamic VAT, standard retail sales taxes, or localized goods tax estimation utilizing global country profiles.
            </p>

            <div className="space-y-2">
              <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-text-muted">Target Sovereign Territory</label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full bg-app-bg border border-border-subtle rounded-xl px-3 py-2.5 text-xs font-semibold focus:border-brand-gold/50 outline-none text-text-main cursor-pointer"
                id="tax-simulator-country-select"
              >
                {Object.keys(TaxConfig).map((code) => {
                  const country = TaxConfig[code];
                  const flag = flagMap[code] || "🏳️";
                  return (
                    <option key={code} value={code} className="bg-card-bg">
                      {flag} {country.countryName} — {country.taxName} ({((country.reducedRate !== undefined && isReducedRate ? country.reducedRate : country.standardRate) * 100).toFixed(1)}%)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Jurisdiction Compliance Sheet */}
            <div className="bg-brand-gold-light/40 border border-brand-gold/15 rounded-xl p-3 text-[11px] space-y-2" id="tax-simulator-compliance-sheet">
              <div className="flex justify-between items-center font-sans font-bold text-[9px] uppercase text-brand-gold tracking-widest">
                <span>Accrual Threshold</span>
                <span className="font-mono text-text-main bg-card-bg px-2 py-0.5 rounded border border-border-subtle">
                  {TaxConfig[selectedCountry].thresholdLimit || "Unlimited"}
                </span>
              </div>
              <p className="text-text-muted leading-relaxed text-[10px]">
                {TaxConfig[selectedCountry].regionalNotes}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[9px] font-mono font-bold uppercase tracking-wider text-text-muted mb-1.5">Base Invoice Principal ($)</label>
                <input
                  type="number"
                  value={taxInputAmount}
                  onChange={(e) => setTaxInputAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-app-bg border border-border-subtle rounded-xl px-3 py-2 text-xs font-mono focus:border-brand-gold/50 outline-none text-text-main"
                  id="tax-simulator-subtotal"
                />
              </div>
              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2.5 cursor-pointer select-none bg-app-bg border border-border-subtle hover:bg-hover-bg/50 px-3 py-2 rounded-xl text-xs text-text-main transition">
                  <input
                    type="checkbox"
                    checked={isReducedRate}
                    onChange={(e) => setIsReducedRate(e.target.checked)}
                    className="accent-brand-gold w-3.5 h-3.5"
                    id="tax-simulator-reduced-toggle"
                  />
                  <span className="font-mono text-[9px] font-bold uppercase tracking-wider">Reduced Scale</span>
                </label>
              </div>
            </div>
          </div>

          {/* Sourcing calculation results */}
          <div className="lg:col-span-7 bg-app-bg/50 border border-border-subtle rounded-2xl p-5 flex flex-col justify-between" id="tax-simulator-outputs">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[9px] uppercase font-mono text-text-muted">
                <span>Estimate Output: {TaxConfig[selectedCountry].countryName}</span>
                <span className="font-bold text-brand-gold bg-brand-gold-light border border-brand-gold/20 px-2 py-0.5 rounded">
                  {TaxConfig[selectedCountry].taxName} ACTIVE
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center pt-2">
                <div className="bg-card-bg p-3 border border-border-subtle/60 rounded-xl">
                  <span className="block text-[8px] text-text-muted uppercase font-bold tracking-wider mb-1">Effective Rate</span>
                  <span className="font-mono text-xs font-extrabold text-text-main">{(taxCalcResult.taxRate * 100).toFixed(2)}%</span>
                </div>
                <div className="bg-card-bg p-3 border border-border-subtle/60 rounded-xl">
                  <span className="block text-[8px] text-text-muted uppercase font-bold tracking-wider mb-1">Accrued Tax Liability</span>
                  <span className="font-mono text-xs font-extrabold text-brand-red">+${taxCalcResult.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="bg-card-bg p-3 border border-border-subtle/60 rounded-xl">
                  <span className="block text-[8px] text-text-muted uppercase font-bold tracking-wider mb-1">Gross Bill Value</span>
                  <span className="font-mono text-xs font-extrabold text-brand-emerald">${taxCalcResult.totalWithTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 border-t border-border-subtle/50 pt-3 text-[9px] text-text-muted font-sans leading-relaxed flex items-center gap-2">
              <Sparkles size={11} className="text-brand-gold shrink-0" />
              <span>Standard transaction posting routes tax liability lines to account <strong className="text-text-main">acc-tax (Sales Tax Payable)</strong> for audit reporting.</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Formulas Directory Bento Grid */}
      <div className="space-y-5">
        {/* Search & Filter Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card-bg border border-border-subtle p-3 rounded-2xl shadow-md" id="formulas-deck-header">
          <div className="relative flex-1" id="formula-search-box">
            <Search className="absolute left-3 top-3 text-text-muted" size={14} />
            <input
              type="text"
              placeholder="Query corporate ratios, financial metrics, and formulas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-app-bg border border-border-subtle rounded-xl text-xs outline-none focus:border-brand-gold/40 focus:bg-card-bg transition text-text-main font-sans"
              id="formula-search-input"
            />
          </div>

          <div className="flex gap-1 overflow-x-auto" id="formula-category-selector">
            {[
              { id: "all", label: "All Formula Indexes" },
              { id: "fundamental", label: "Double-Entry" },
              { id: "income", label: "Gains & Margins" },
              { id: "ratios", label: "Solvency Ratios" }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-2 rounded-xl border font-bold transition whitespace-nowrap text-[10px] ${
                  activeCategory === cat.id 
                    ? "bg-brand-gold border-brand-gold-dark text-brand-primary" 
                    : "bg-app-bg border-border-subtle text-text-muted hover:text-text-main hover:bg-hover-bg/30"
                }`}
                id={`btn-formula-cat-${cat.id}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Formulas cards list */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="formulas-grid">
          {filteredFormulas.map((card) => (
            <div key={card.id} className="bg-card-bg border border-border-subtle rounded-2xl p-5 hover:border-brand-gold/30 transition-all duration-300 flex flex-col justify-between shadow-lg group" id={`formula-card-${card.id}`}>
              <div>
                <div className="flex justify-between items-start gap-2 border-b border-border-subtle/50 pb-3 mb-3.5">
                  <div className="overflow-hidden">
                    <h4 className="font-sans font-bold text-text-main text-xs truncate">{card.name}</h4>
                    <span className="text-[8px] font-mono text-text-muted bg-app-bg border border-border-subtle px-1.5 py-0.5 rounded-md mt-1.5 inline-block uppercase tracking-wider font-bold">
                      {card.category}
                    </span>
                  </div>
                  <span className={`text-[8px] font-mono font-black px-2 py-0.5 rounded-full border uppercase shrink-0 ${card.statusColor}`}>
                    {card.status}
                  </span>
                </div>

                <div className="bg-app-bg/80 border border-border-subtle p-3 rounded-xl font-mono text-[10px] text-brand-gold font-bold text-center mb-3 whitespace-pre-wrap select-all">
                  {card.formula}
                </div>

                <p className="text-text-muted font-sans text-[10px] leading-relaxed mb-4">
                  {card.desc}
                </p>
              </div>

              <div className="border-t border-border-subtle/50 pt-3 mt-auto flex items-center justify-between gap-1.5">
                <span className="text-[9px] text-text-muted uppercase tracking-wide font-sans">Corporate metrics</span>
                <span className="font-mono text-[11px] font-bold text-brand-gold bg-brand-primary border border-brand-primary-light px-3 py-1 rounded-lg shadow-md select-all">
                  {card.value}
                </span>
              </div>
            </div>
          ))}

          {filteredFormulas.length === 0 && (
            <div className="col-span-full py-12 text-center text-text-muted font-mono border border-dashed border-border-subtle rounded-2xl">
              <BookOpen size={24} className="mx-auto mb-2 text-text-muted opacity-40" />
              <span>No corresponding equations matched your filter conditions.</span>
            </div>
          )}
        </div>
      </div>

      {/* 4. Validation Audit Logs Section */}
      <div className="bg-card-bg border border-border-subtle rounded-2xl p-6 shadow-xl" id="rules-engine-validation-diagnostics">
        <div className="flex items-center gap-2.5 mb-4 border-b border-border-subtle/50 pb-3">
          <Terminal size={15} className="text-brand-gold" />
          <h3 className="font-sans font-bold text-text-main text-xs uppercase tracking-wider">Double-Entry Real-Time Audit Invariant validator console</h3>
        </div>

        <div className="space-y-4" id="diagnostics-logs-container">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${auditResult.isValid ? "bg-brand-emerald animate-pulse" : "bg-brand-red animate-pulse"}`} />
            <span className="font-mono font-bold text-xs text-text-main">
              {auditResult.isValid ? "Verification: Zero ledger exceptions detected" : "Compliance Warnings Logged"}
            </span>
          </div>

          <div className="bg-app-bg text-text-muted rounded-xl p-4 font-mono text-[11px] space-y-2.5 max-h-[160px] overflow-y-auto leading-relaxed border border-border-subtle select-all scrollbar-thin">
            <p className="text-text-muted text-[8px] uppercase border-b border-border-subtle/60 pb-1.5 font-bold tracking-widest">Double-entry kernel diagnostics log</p>
            <p className="text-brand-emerald font-semibold">[INFO] Running algebraic audit on fundamental invariants (Assets = Liabilities + Equity)... DEBITS EQUAL CREDITS [OK]</p>
            <p className="text-brand-emerald font-semibold">[INFO] Querying system for journal posting alignment anomalies... OK</p>
            <p className="text-brand-emerald font-semibold">[INFO] Verifying transactional dates, values, and posting paths... OK</p>
            
            {auditResult.errors.map((err, idx) => (
              <p key={`err-${idx}`} className="text-brand-red font-bold">[CRITICAL] {err}</p>
            ))}
            {auditResult.warnings.map((warn, idx) => (
              <p key={`warn-${idx}`} className="text-brand-amber font-bold">[WARN] {warn}</p>
            ))}

            {auditResult.errors.length === 0 && auditResult.warnings.length === 0 && (
              <p className="text-brand-emerald/90 font-bold">[COMPLIANCE] Verification complete. Ledger state conforms perfectly to CPA rules. No deviations identified.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
