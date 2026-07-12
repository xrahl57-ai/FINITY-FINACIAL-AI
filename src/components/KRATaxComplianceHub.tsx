/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Sparkles, 
  FileText, 
  Building, 
  TrendingUp, 
  Check, 
  Calculator,
  Search,
  Scale
} from "lucide-react";
import { FinityState } from "../types";
import { KRATaxEngine } from "../rulesEngine";

interface KRATaxComplianceHubProps {
  state: FinityState;
  onStateUpdate?: (newState: FinityState) => void;
  embedded?: boolean; // If rendered inside another component card
}

export default function KRATaxComplianceHub({ state, onStateUpdate, embedded = false }: KRATaxComplianceHubProps) {
  // Exchange rates
  const USD_TO_KES = 128; // Exchange rate multiplier
  const KES_TO_USD = 1 / USD_TO_KES;

  // Determine current currency mode
  const isKesModule = state.personalProfile?.currency === "KES" || state.companyProfile?.currency === "KES";
  
  // Real ledger metrics
  const ledgerRevenueUSD = useMemo(() => {
    return state.invoices.reduce((sum, inv) => sum + (inv.total || inv.balanceDue || 0), 0);
  }, [state.invoices]);

  const ledgerExpensesUSD = useMemo(() => {
    return state.bills.reduce((sum, b) => sum + (b.total || b.balanceDue || 0), 0);
  }, [state.bills]);

  const ledgerProfitUSD = ledgerRevenueUSD - ledgerExpensesUSD;

  // Convert USD ledger amounts to KES for KRA evaluation
  const defaultTurnoverKES = ledgerRevenueUSD * USD_TO_KES;
  const defaultProfitKES = ledgerProfitUSD > 0 ? ledgerProfitUSD * USD_TO_KES : 0;

  // KRA Pin State
  const [kraPin, setKraPin] = useState(state.companyProfile?.taxNumber || "P051234567Z");
  const [pinFeedback, setPinFeedback] = useState<{ isValid: boolean; message: string } | null>(null);

  // Selector States
  const [businessType, setBusinessType] = useState<string>(
    state.companyProfile?.businessType || "Private Limited Company"
  );
  const [isResident, setIsResident] = useState<boolean>(true);
  const [serviceType, setServiceType] = useState<
    "professional" | "contractual" | "royalties" | "rent" | "digital" | "standard_goods"
  >("professional");

  // Custom simulation slider states
  const [customTurnoverKES, setCustomTurnoverKES] = useState<number>(defaultTurnoverKES || 1200000);
  const [customProfitKES, setCustomProfitKES] = useState<number>(defaultProfitKES || 450000);
  const [useRealLedger, setUseRealLedger] = useState<boolean>(true);

  // Active volumes for math
  const activeTurnoverKES = useRealLedger ? defaultTurnoverKES : customTurnoverKES;
  const activeProfitKES = useRealLedger ? defaultProfitKES : customProfitKES;

  const activeTurnoverUSD = activeTurnoverKES * KES_TO_USD;
  const activeProfitUSD = activeProfitKES * KES_TO_USD;

  // Run Calculations
  const kraObligations = useMemo(() => {
    return KRATaxEngine.calculateObligations(
      businessType,
      isResident,
      serviceType,
      activeTurnoverKES,
      activeProfitKES
    );
  }, [businessType, isResident, serviceType, activeTurnoverKES, activeProfitKES]);

  // Validate PIN Handler
  const handleValidatePin = (val: string) => {
    setKraPin(val);
    if (!val.trim()) {
      setPinFeedback(null);
      return;
    }
    const ok = KRATaxEngine.validatePIN(val);
    if (ok) {
      setPinFeedback({
        isValid: true,
        message: "Valid KRA iTax PIN format (Type: Resident Individual or Corporation)."
      });
    } else {
      setPinFeedback({
        isValid: false,
        message: "Invalid KRA PIN. Must start with A/P/C, followed by 9 digits, ending with a letter."
      });
    }
  };

  const formattedKES = (val: number) => {
    return "KSh " + val.toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const formattedUSD = (val: number) => {
    return "$" + val.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  // KRA Calendar/Tax Tips
  const taxTips = [
    { title: "VAT (Value Added Tax) filing deadline", desc: "Must be filed on or before the 20th day of the following month via iTax. Late filing attracts a penalty of KSh 10,000 or 5% of tax due, whichever is higher." },
    { title: "WHT (Withholding Tax) payment", desc: "Must be remitted to KRA on or before the 20th day of the month following the month in which the deduction was made. Late payments accrue a 5% penalty and 1% interest per month." },
    { title: "Annual Corporate/Individual Income Tax", desc: "The due date for filing annual income tax returns is June 30th of the following year. Failure to file attracts a penalty of KSh 20,000 for companies." },
  ];

  return (
    <div className={`space-y-6 ${embedded ? "" : "p-1"}`} id="kra-obligations-hub-viewport">
      {/* Upper Brand Jumbotron */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 relative overflow-hidden" id="kra-jumbotron">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="bg-brand-gold text-brand-primary font-mono font-bold text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1">
                <Scale size={11} />
                <span>KRA TAX MODULE</span>
              </span>
              <span className="text-slate-400 font-mono text-[10px]">• KENYA REVENUE AUTHORITY iTax COMPLIANCE ENGINE</span>
            </div>
            <h2 className="font-sans text-xl font-black text-white tracking-tight">
              KRA-Specific Tax & Compliance Inspector
            </h2>
            <p className="text-xs text-slate-400 font-sans max-w-xl">
              Automate VAT (16%) registration threshold tracking, Withholding Tax (WHT) resident/non-resident deductions, and estimated Income Tax obligations directly calculated from active double-entry journals.
            </p>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 text-center min-w-[160px]" id="current-ex-rate-card">
            <span className="text-[10px] font-mono text-slate-500 uppercase block">KRA FX Benchmark</span>
            <span className="font-mono font-black text-brand-gold text-sm mt-1 block">1 USD = 128 KES</span>
            <span className="text-[9px] font-mono text-slate-400 mt-0.5 block">Central Bank / iTax Feed</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="kra-body-grid">
        {/* Left Hand: Controls & Parameter Settings */}
        <div className="lg:col-span-5 space-y-6" id="kra-controls-column">
          <div className="bg-card-bg border border-border-subtle rounded-3xl p-5 space-y-5 shadow-xl">
            <div className="flex items-center gap-2 border-b border-border-subtle/50 pb-3">
              <Calculator size={15} className="text-brand-gold" />
              <h3 className="font-sans font-bold text-text-main text-xs uppercase tracking-wider">iTax Entity Parameters</h3>
            </div>

            {/* KRA Pin Validation */}
            <div className="space-y-2">
              <label className="block text-[10px] font-mono font-bold text-text-muted uppercase">Kenya Revenue Authority PIN</label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={11}
                  placeholder="e.g. A011234567Z"
                  value={kraPin}
                  onChange={(e) => handleValidatePin(e.target.value.toUpperCase())}
                  className="w-full bg-app-bg border border-border-subtle rounded-xl p-3 pr-10 text-xs text-text-main focus:border-brand-gold/60 outline-none font-mono font-bold"
                  id="kra-pin-checker-input"
                />
                <div className="absolute right-3 top-3.5">
                  {pinFeedback?.isValid ? (
                    <CheckCircle2 size={15} className="text-brand-emerald" />
                  ) : pinFeedback === null ? (
                    <Info size={15} className="text-text-muted" />
                  ) : (
                    <AlertCircle size={15} className="text-brand-red" />
                  )}
                </div>
              </div>
              {pinFeedback && (
                <p className={`text-[10px] font-mono ${pinFeedback.isValid ? "text-brand-emerald" : "text-brand-red"}`}>
                  {pinFeedback.message}
                </p>
              )}
            </div>

            {/* Business Entity Selection */}
            <div className="space-y-2">
              <label className="block text-[10px] font-mono font-bold text-text-muted uppercase">Legal Business Type</label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full bg-app-bg border border-border-subtle rounded-xl p-3 text-xs text-text-main focus:border-brand-gold/60 outline-none font-mono"
                id="kra-entity-type-selector"
              >
                <option value="Private Limited Company">Private Limited Company (LTD - 30% Tax)</option>
                <option value="Sole Proprietorship">Sole Proprietorship (Graduated Income Tax)</option>
                <option value="Partnership">Partnership (Individual Rates)</option>
                <option value="NGO / Exempt">NGO / Exempt Status (0% Corporate Tax)</option>
              </select>
            </div>

            {/* Category / Service Type Selection */}
            <div className="space-y-2">
              <label className="block text-[10px] font-mono font-bold text-text-muted uppercase">Principal Service / Supply Type</label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value as any)}
                className="w-full bg-app-bg border border-border-subtle rounded-xl p-3 text-xs text-text-main focus:border-brand-gold/60 outline-none font-mono"
                id="kra-service-type-selector"
              >
                <option value="professional">Management / Professional / Consultancy (5% WHT)</option>
                <option value="contractual">Contractual Services & Building works (3% WHT)</option>
                <option value="royalties">Royalties (5% WHT)</option>
                <option value="rent">Commercial Rent of non-residential buildings (10% WHT)</option>
                <option value="digital">Digital / Electronic Market services (1.5% DST)</option>
                <option value="standard_goods">Standard Goods & Supplies (0% WHT, 16% VAT)</option>
              </select>
            </div>

            {/* Residency Toggle */}
            <div className="space-y-2">
              <label className="block text-[10px] font-mono font-bold text-text-muted uppercase">Filing Residence Status</label>
              <div className="grid grid-cols-2 gap-2" id="kra-residency-toggles">
                <button
                  type="button"
                  onClick={() => setIsResident(true)}
                  className={`p-2.5 rounded-xl text-xs font-mono font-bold border transition ${
                    isResident 
                      ? "bg-brand-primary text-brand-gold border-brand-gold/30" 
                      : "bg-app-bg text-text-muted border-border-subtle hover:text-text-main"
                  }`}
                >
                  Kenyan Resident
                </button>
                <button
                  type="button"
                  onClick={() => setIsResident(false)}
                  className={`p-2.5 rounded-xl text-xs font-mono font-bold border transition ${
                    !isResident 
                      ? "bg-brand-primary text-brand-gold border-brand-gold/30" 
                      : "bg-app-bg text-text-muted border-border-subtle hover:text-text-main"
                  }`}
                >
                  Non-Resident / Foreign
                </button>
              </div>
            </div>

            {/* Ledger Mode Choice */}
            <div className="space-y-2 border-t border-border-subtle/50 pt-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono font-bold text-text-muted uppercase">Finity Ledger Source Mode</label>
                <span className="text-[9px] bg-brand-gold/10 text-brand-gold font-bold px-2 py-0.5 rounded">Active</span>
              </div>
              <div className="grid grid-cols-2 gap-2" id="kra-source-toggles">
                <button
                  type="button"
                  onClick={() => setUseRealLedger(true)}
                  className={`p-2.5 rounded-xl text-[10px] font-mono font-bold border transition text-center ${
                    useRealLedger 
                      ? "bg-brand-emerald/10 text-brand-emerald border-brand-emerald/20" 
                      : "bg-app-bg text-text-muted border-border-subtle"
                  }`}
                >
                  Synchronized Ledger
                </button>
                <button
                  type="button"
                  onClick={() => setUseRealLedger(false)}
                  className={`p-2.5 rounded-xl text-[10px] font-mono font-bold border transition text-center ${
                    !useRealLedger 
                      ? "bg-brand-amber/10 text-brand-amber border-brand-amber/20" 
                      : "bg-app-bg text-text-muted border-border-subtle"
                  }`}
                >
                  Interactive Simulation
                </button>
              </div>
            </div>

            {/* Custom Simulations Sliders */}
            {!useRealLedger && (
              <div className="space-y-4 pt-2 border-t border-border-subtle/30 animate-fade">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-text-muted font-bold">ANNUAL SALES VOLUME:</span>
                    <span className="text-text-main font-bold">{formattedKES(customTurnoverKES)}</span>
                  </div>
                  <input
                    type="range"
                    min="100000"
                    max="12000000"
                    step="50000"
                    value={customTurnoverKES}
                    onChange={(e) => setCustomTurnoverKES(Number(e.target.value))}
                    className="w-full accent-brand-gold bg-app-bg"
                  />
                  <div className="flex justify-between text-[8px] text-text-muted font-mono">
                    <span>KSh 100k</span>
                    <span>VAT THRESHOLD (KSh 5M)</span>
                    <span>KSh 12M</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-text-muted font-bold">NET ESTIMATED PROFIT:</span>
                    <span className="text-text-main font-bold">{formattedKES(customProfitKES)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5000000"
                    step="25000"
                    value={customProfitKES}
                    onChange={(e) => setCustomProfitKES(Number(e.target.value))}
                    className="w-full accent-brand-gold bg-app-bg"
                  />
                  <div className="flex justify-between text-[8px] text-text-muted font-mono">
                    <span>KSh 0</span>
                    <span>KSh 5M max</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Hand: Compliance Audits & dynamic results */}
        <div className="lg:col-span-7 space-y-6" id="kra-results-column">
          
          {/* Threshold alert */}
          {kraObligations.vatThresholdAlert ? (
            <div className="bg-brand-red/10 border border-brand-red/20 rounded-2xl p-4 flex gap-3 text-xs text-brand-red animate-pulse" id="vat-threshold-alert">
              <ShieldAlert className="shrink-0 mt-0.5" size={16} />
              <div className="space-y-1 font-sans">
                <strong className="block font-bold">KRA MANDATORY VAT REGISTRATION REQUIRED</strong>
                <p className="text-text-main/80 text-[11px]">
                  Your business transaction volume of <strong className="font-bold text-brand-red">{formattedKES(activeTurnoverKES)}</strong> exceeds the statutory KRA turnover threshold limit of <strong className="font-bold">{formattedKES(kraObligations.vatThresholdLimit)}</strong>. You must legally register for VAT on iTax and charge standard 16% on taxable goods/services.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-brand-emerald/10 border border-brand-emerald/20 rounded-2xl p-4 flex gap-3 text-xs text-brand-emerald" id="vat-threshold-safe">
              <CheckCircle2 className="shrink-0 mt-0.5" size={16} />
              <div className="space-y-1 font-sans">
                <strong className="block font-bold">BELOW KRA MANDATORY VAT THRESHOLD</strong>
                <p className="text-text-main/80 text-[11px]">
                  Your turnover volume of <strong className="font-bold">{formattedKES(activeTurnoverKES)}</strong> is below the statutory limit of <strong className="font-bold">{formattedKES(kraObligations.vatThresholdLimit)}</strong>. VAT registration remains voluntary.
                </p>
              </div>
            </div>
          )}

          {/* Dynamic iTax obligations Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="kra-kpi-summary">
            {/* VAT */}
            <div className="bg-card-bg border border-border-subtle rounded-2xl p-4 space-y-1">
              <span className="text-[9px] font-mono text-text-muted uppercase tracking-widest block font-bold">Estimated VAT (16%)</span>
              <p className="text-base font-black text-text-main font-mono">
                {formattedKES(kraObligations.vatObligation)}
              </p>
              <div className="text-[9px] text-text-muted font-mono">
                {isKesModule ? "" : `~${formattedUSD(kraObligations.vatObligation * KES_TO_USD)}`}
              </div>
            </div>

            {/* WHT */}
            <div className="bg-card-bg border border-border-subtle rounded-2xl p-4 space-y-1">
              <span className="text-[9px] font-mono text-text-muted uppercase tracking-widest block font-bold">
                WHT Due ({isResident ? "Resident" : "Non-Res"})
              </span>
              <p className="text-base font-black text-brand-gold font-mono">
                {formattedKES(isResident ? kraObligations.whtResident : kraObligations.whtNonResident)}
              </p>
              <div className="text-[9px] text-text-muted font-mono">
                Rate applied: {(kraObligations.whtRateUsed * 100).toFixed(1)}%
              </div>
            </div>

            {/* Corp Tax */}
            <div className="bg-card-bg border border-border-subtle rounded-2xl p-4 space-y-1">
              <span className="text-[9px] font-mono text-text-muted uppercase tracking-widest block font-bold">Income/Corp Tax</span>
              <p className="text-base font-black text-text-main font-mono">
                {formattedKES(kraObligations.corporateTax)}
              </p>
              <div className="text-[9px] text-text-muted font-mono">
                Calculated on net profits
              </div>
            </div>
          </div>

          {/* Detailed Calculations Table */}
          <div className="bg-card-bg border border-border-subtle rounded-3xl overflow-hidden shadow-2xl" id="kra-ledger-table-box">
            <div className="p-5 border-b border-border-subtle/50 flex justify-between items-center bg-sidebar-bg/20">
              <div className="flex items-center gap-2">
                <FileText size={15} className="text-brand-gold" />
                <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-text-main">Kenya Tax Compliance Breakdown</h3>
              </div>
              <span className="font-mono text-[9px] text-text-muted">
                {useRealLedger ? "REAL-TIME SYNC" : "SIMULATED DECK"}
              </span>
            </div>

            <div className="divide-y divide-border-subtle/40 font-mono text-xs">
              {/* Row 1: Turnover */}
              <div className="flex items-center justify-between p-4 hover:bg-hover-bg/20 transition-colors">
                <div>
                  <span className="text-text-main font-bold block">Assessed Sales Volume</span>
                  <span className="text-[10px] text-text-muted block font-sans">Turnover from sales invoices / receipts</span>
                </div>
                <div className="text-right">
                  <span className="text-text-main font-bold font-mono block">{formattedKES(activeTurnoverKES)}</span>
                  <span className="text-[10px] text-text-muted font-mono block">({formattedUSD(activeTurnoverUSD)})</span>
                </div>
              </div>

              {/* Row 2: Profit */}
              <div className="flex items-center justify-between p-4 hover:bg-hover-bg/20 transition-colors">
                <div>
                  <span className="text-text-main font-bold block">Assessed Net Income</span>
                  <span className="text-[10px] text-text-muted block font-sans">Business profitability ledger scale</span>
                </div>
                <div className="text-right">
                  <span className="text-brand-emerald font-bold font-mono block">+{formattedKES(activeProfitKES)}</span>
                  <span className="text-[10px] text-text-muted font-mono block">({formattedUSD(activeProfitUSD)})</span>
                </div>
              </div>

              {/* Row 3: VAT */}
              <div className="flex items-center justify-between p-4 hover:bg-hover-bg/20 transition-colors">
                <div>
                  <span className="text-text-main font-bold block">Value Added Tax (VAT) obligation</span>
                  <span className="text-[10px] text-text-muted block font-sans">16% of taxable turnover supplies</span>
                </div>
                <div className="text-right">
                  <span className="text-text-main font-black font-mono block">{formattedKES(kraObligations.vatObligation)}</span>
                  <span className="text-[10px] text-text-muted font-mono block">Filing form: VAT3</span>
                </div>
              </div>

              {/* Row 4: Withholding Tax */}
              <div className="flex items-center justify-between p-4 hover:bg-hover-bg/20 transition-colors">
                <div>
                  <span className="text-text-main font-bold block">Withholding Tax (WHT)</span>
                  <span className="text-[10px] text-text-muted block font-sans">Retained rate based on selection</span>
                </div>
                <div className="text-right font-mono text-right">
                  <span className="text-brand-gold font-bold block">
                    {formattedKES(isResident ? kraObligations.whtResident : kraObligations.whtNonResident)}
                  </span>
                  <span className="text-[10px] text-text-muted block">({(kraObligations.whtRateUsed * 100).toFixed(0)}% Rate applied)</span>
                </div>
              </div>

              {/* Row 5: Income Tax */}
              <div className="flex items-center justify-between p-4 hover:bg-hover-bg/20 transition-colors">
                <div>
                  <span className="text-text-main font-bold block">Income / Corporation Tax</span>
                  <span className="text-[10px] text-text-muted block font-sans">
                    {businessType.includes("Proprietorship") || businessType.includes("Partnership") ? "Individual progressive index" : "Standard corporate flat rate"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-text-main font-bold font-mono block">{formattedKES(kraObligations.corporateTax)}</span>
                  <span className="text-[10px] text-text-muted font-mono block">Form: IT2C / IT1Ind</span>
                </div>
              </div>

              {/* Row 6: DST (if digital) */}
              {serviceType === "digital" && (
                <div className="flex items-center justify-between p-4 hover:bg-hover-bg/20 transition-colors">
                  <div>
                    <span className="text-text-main font-bold block">Digital Service Tax (DST)</span>
                    <span className="text-[10px] text-text-muted block font-sans">1.5% non-resident electronic gross value</span>
                  </div>
                  <div className="text-right">
                    <span className="text-brand-gold font-bold font-mono block">{formattedKES(kraObligations.dstObligation)}</span>
                    <span className="text-[10px] text-text-muted font-mono block">Non-Resident filing only</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* filing calendar / advice card */}
          <div className="bg-sidebar-bg/30 border border-border-subtle rounded-3xl p-5 space-y-4" id="kra-tax-tips-card">
            <span className="text-[10px] uppercase font-mono text-brand-gold tracking-wider font-bold block flex items-center gap-1">
              <Sparkles size={11} className="animate-spin text-brand-gold" />
              <span>KRA iTax Filing Guidance Deck</span>
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="tax-tips-box">
              {taxTips.map((tip, idx) => (
                <div key={idx} className="bg-card-bg/40 border border-border-subtle/50 rounded-xl p-3.5 space-y-1.5" id={`tax-tip-${idx}`}>
                  <h4 className="font-sans font-bold text-text-main text-[11px] leading-tight flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-gold" />
                    <span>{tip.title}</span>
                  </h4>
                  <p className="text-[10px] text-text-muted font-sans leading-normal">
                    {tip.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
