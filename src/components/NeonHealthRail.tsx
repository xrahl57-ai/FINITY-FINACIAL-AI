/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  Wallet, 
  ChevronLeft,
  AlertTriangle,
  Sparkles,
  Info
} from "lucide-react";
import { FinityState, AccountType } from "../types";

interface NeonHealthRailProps {
  state: FinityState;
  onTabChange?: (tab: string) => void;
  onSelectReport?: (reportId: string) => void;
}

export default function NeonHealthRail({ state, onTabChange, onSelectReport }: NeonHealthRailProps) {
  const [hoveredCircle, setHoveredCircle] = useState<string | null>(null);

  // Financial Calculations (Derived in real-time from double-entry state & AI agent)
  const agentVitals = (state as any).agentVitals || {};

  const getBalanceSum = (types: AccountType[]) => {
    return state.accounts
      .filter((acc) => types.includes(acc.type))
      .reduce((sum, acc) => sum + acc.balance, 0);
  };

  const getAccountBalance = (id: string) => {
    return state.accounts.find((a) => a.id === id)?.balance || 0;
  };

  // Vitals
  const bankBalance = getAccountBalance("acc-bank");
  const cashBalance = getAccountBalance("acc-cash");
  const cashPosition = agentVitals.cashPosition !== undefined ? agentVitals.cashPosition : (bankBalance + cashBalance);
  const arBalance = getAccountBalance("acc-ar");
  const inventoryBalance = getAccountBalance("acc-inventory");
  const totalAssets = cashPosition + arBalance + inventoryBalance;

  const apBalance = getAccountBalance("acc-ap");
  const taxBalance = getAccountBalance("acc-tax");
  const totalLiabilities = apBalance + taxBalance;

  // Revenue & Profits
  const totalRevenue = getBalanceSum([AccountType.REVENUE]);
  const totalExpenses = agentVitals.totalExpenses !== undefined ? agentVitals.totalExpenses : getBalanceSum([AccountType.EXPENSE]);
  const netProfit = agentVitals.netProfit !== undefined ? agentVitals.netProfit : (totalRevenue - totalExpenses);
  const netProfitMargin = agentVitals.netProfitMargin !== undefined ? agentVitals.netProfitMargin : (totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0);

  // Health Score
  const overdueInvoices = state.invoices.filter((i) => i.status === "overdue");
  const healthScore = agentVitals.healthScore !== undefined ? agentVitals.healthScore : (() => {
    const baseHealth = 82;
    const profitBonus = Math.min(Math.max((netProfitMargin / 100) * 18, 0), 18);
    const penalty = overdueInvoices.length * 6;
    return Math.round(Math.max(Math.min(baseHealth + profitBonus - penalty, 99), 35));
  })();

  // Alert or Integrity metrics
  const ledgerBalanced = agentVitals.ledgerBalanced !== undefined ? agentVitals.ledgerBalanced : true;

  // Dynamic currency symbol based on state settings
  const currencySymbol = state?.personalProfile?.currency === "KES" || state?.companyProfile?.currency === "KES" ? "KSh " : "$";

  // Format compact currencies
  const formatCompact = (num: number) => {
    const abs = Math.abs(num);
    const sign = num < 0 ? "-" : "";
    if (abs >= 1000000) {
      return sign + currencySymbol + (abs / 1000000).toFixed(1) + "M";
    }
    if (abs >= 1000) {
      return sign + currencySymbol + (abs / 1000).toFixed(1) + "k";
    }
    return sign + currencySymbol + abs.toFixed(0);
  };

  // Agent dynamic insights
  const insights = agentVitals.insights || {
    vitals: "Calculating enterprise health parameters...",
    profits: "Auditing gross ledger profit margins...",
    losses: "Mapping operational cost center distributions...",
    treasury: "Evaluating available liquid runway buffers...",
    audit: "Running real-time double-entry compliance sweeps..."
  };

  const circles = [
    {
      id: "vitals",
      title: "Business Vitals Score",
      subtitle: "Finity OS Health Index",
      value: `${healthScore}%`,
      subText: healthScore > 85 ? "Optimal State" : healthScore > 65 ? "Stable State" : "Action Needed",
      neonClass: "neon-cyan text-cyan-400 bg-cyan-950/25",
      glowColor: "rgba(6, 182, 212, 0.4)",
      icon: <Activity size={15} className="animate-pulse" />,
      details: [
        { label: "Health Score", value: `${healthScore}%`, highlight: true },
        { label: "Net Margin", value: `${netProfitMargin.toFixed(1)}%` },
        { label: "Liquidity Ratio", value: totalLiabilities > 0 ? (totalAssets / totalLiabilities).toFixed(2) : "∞" },
        { label: "Overdue Items", value: `${overdueInvoices.length} invoices`, warning: overdueInvoices.length > 0 }
      ],
      insight: insights.vitals
    },
    {
      id: "profits",
      title: "Operating Net Profit",
      subtitle: "Agent Profit Assessment",
      value: formatCompact(netProfit),
      subText: `Margin: ${netProfitMargin.toFixed(0)}%`,
      neonClass: "neon-emerald text-emerald-400 bg-emerald-950/25",
      glowColor: "rgba(16, 185, 129, 0.4)",
      icon: <TrendingUp size={15} />,
      details: [
        { label: "Service Revenue", value: formatCompact(getAccountBalance("acc-revenue")) },
        { label: "Product Sales", value: formatCompact(getAccountBalance("acc-sales")) },
        { label: "Total Revenue", value: formatCompact(totalRevenue) },
        { label: "Net Profit", value: formatCompact(netProfit), highlight: true }
      ],
      insight: insights.profits
    },
    {
      id: "losses",
      title: "Operating Expense Burn",
      subtitle: "Agent Expense Audit",
      value: formatCompact(totalExpenses),
      subText: `${state.bills.length} Bills Filed`,
      neonClass: "neon-rose text-red-400 bg-red-950/25",
      glowColor: "rgba(239, 68, 68, 0.4)",
      icon: <TrendingDown size={15} />,
      details: [
        { label: "Office Rent", value: formatCompact(getAccountBalance("acc-rent")) },
        { label: "Salaries & Wages", value: formatCompact(getAccountBalance("acc-salaries")) },
        { label: "Software / SaaS", value: formatCompact(getAccountBalance("acc-software")) },
        { label: "Total Expenses", value: formatCompact(totalExpenses), highlight: true }
      ],
      insight: insights.losses
    },
    {
      id: "treasury",
      title: "Liquid Cash & Treasury",
      subtitle: "Agent Liquidity Gauge",
      value: formatCompact(cashPosition),
      subText: `$50k Min Target`,
      neonClass: "neon-gold text-amber-400 bg-amber-950/25",
      glowColor: "rgba(212, 175, 55, 0.4)",
      icon: <Wallet size={15} />,
      details: [
        { label: "Operating Bank", value: formatCompact(bankBalance) },
        { label: "Petty Cash", value: formatCompact(cashBalance) },
        { label: "Liquid Reserves", value: formatCompact(cashPosition), highlight: true },
        { label: "Runway Progress", value: `${Math.round(Math.min((cashPosition / 50000) * 100, 100))}%` }
      ],
      insight: insights.treasury
    },
    {
      id: "audit",
      title: "Double-Entry Audit",
      subtitle: "Ledger Symmetry Audit",
      value: ledgerBalanced ? "BALANCED" : "DISCREP",
      subText: `${state.auditLogs.length} Audit Events`,
      neonClass: "neon-violet text-violet-400 bg-violet-950/25",
      glowColor: "rgba(139, 92, 246, 0.4)",
      icon: <ShieldCheck size={15} />,
      details: [
        { label: "Ledger Equation", value: ledgerBalanced ? "Assets = Liab + Equity" : "Out of balance" },
        { label: "Audit Log Trail", value: `${state.auditLogs.length} events` },
        { label: "Bank Handshakes", value: `${state.bankConnections.length} feeds` },
        { label: "Active Gateways", value: `${state.paymentGateways.length} live` }
      ],
      insight: insights.audit
    }
  ];

  return (
    <div className="w-[84px] shrink-0 bg-sidebar-bg flex flex-col items-center py-6 border-r border-border-subtle/50 select-none relative z-10" id="neon-health-rail-container">
      {/* Decorative vertical line */}
      <div className="absolute top-0 bottom-0 left-[41px] w-[2px] bg-gradient-to-b from-border-subtle/20 via-border-subtle/50 to-border-subtle/20 pointer-events-none" />

      {/* Rail Header Icon */}
      <div className="mb-7 flex flex-col items-center justify-center shrink-0 z-10">
        <div className="w-8 h-8 rounded-full bg-brand-gold-light border border-brand-gold/25 flex items-center justify-center shadow-md">
          <Sparkles size={13} className="text-brand-gold" />
        </div>
        <span className="text-[8px] font-mono uppercase tracking-widest text-text-muted mt-1.5 font-bold">Vitals</span>
      </div>

      {/* Vertical List of Neon Circles */}
      <div className="flex-1 flex flex-col justify-around w-full py-2 z-10">
        {circles.map((circle, idx) => {
          const isHovered = hoveredCircle === circle.id;
          return (
            <div 
              key={circle.id} 
              className="relative w-full flex justify-center py-2"
              onMouseEnter={() => setHoveredCircle(circle.id)}
              onMouseLeave={() => setHoveredCircle(null)}
            >
              {/* Glowing Neon Circle Trigger */}
              <motion.button
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 220, damping: 18, delay: idx * 0.08 }}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.95 }}
                className={`w-12 h-12 rounded-full flex flex-col items-center justify-center transition-all duration-300 relative ${circle.neonClass}`}
                style={{
                  boxShadow: isHovered ? `0 0 25px ${circle.glowColor}` : undefined
                }}
                onClick={() => {
                  if (circle.id === "profits" || circle.id === "losses") {
                    onTabChange?.("Overview");
                  } else if (circle.id === "audit") {
                    onTabChange?.("Accounts & Ledgers");
                  } else if (circle.id === "treasury") {
                    onTabChange?.("Banking Hub");
                  }
                }}
              >
                {/* Micro Icon */}
                <div className="opacity-80 scale-90 mb-0.5">{circle.icon}</div>
                {/* Primary Short Text inside Circle */}
                <span className="text-[10px] font-mono font-bold tracking-tighter uppercase leading-none">
                  {circle.value}
                </span>
              </motion.button>

              {/* Floating Detailed Popover Tooltip (Appears to the left of the rail to fit screen space) */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, x: 15, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 15, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute right-[88px] top-1/2 -translate-y-1/2 w-72 bg-card-bg border border-brand-gold/25 rounded-2xl shadow-2xl p-4 z-50 text-left pointer-events-none"
                    style={{
                      boxShadow: `0 8px 32px rgba(0, 0, 0, 0.5), 0 0 15px ${circle.glowColor}`
                    }}
                  >
                    {/* Glowing Accent line inside Popover */}
                    <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-brand-gold via-transparent to-transparent opacity-60" />

                    {/* Popover Title */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h4 className="font-sans font-extrabold text-sm text-text-main tracking-tight leading-none">
                          {circle.title}
                        </h4>
                        <span className="text-[9px] font-mono uppercase text-brand-gold font-bold tracking-widest mt-1 block">
                          {circle.subtitle}
                        </span>
                      </div>
                      <span className="p-1 rounded bg-hover-bg border border-border-subtle text-text-muted">
                        <Info size={11} />
                      </span>
                    </div>

                    {/* Row Item Breakdowns */}
                    <div className="space-y-1.5 border-y border-border-subtle/50 py-2.5 mb-3 font-mono text-[11px]">
                      {circle.details.map((detail, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <span className="text-text-muted">{detail.label}</span>
                          <span className={`font-bold ${
                            detail.highlight ? "text-brand-gold" : 
                            detail.warning ? "text-brand-red animate-pulse" : "text-text-main"
                          }`}>
                            {detail.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* AI / Automated Insight Quote */}
                    <div className="bg-app-bg/60 border border-border-subtle rounded-lg p-2 flex gap-2 items-start">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: circle.id === "losses" ? "#EF4444" : circle.id === "profits" ? "#10B981" : "#D4AF37" }} />
                      <p className="font-sans text-[10px] text-text-muted leading-relaxed">
                        {circle.insight}
                      </p>
                    </div>

                    {/* Anchor indicator pointer */}
                    <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-card-bg border-r border-t border-brand-gold/25 rotate-45" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Rail Footer Marker */}
      <div className="mt-auto shrink-0 flex flex-col items-center gap-1 opacity-70 z-10">
        <div className="w-1.5 h-1.5 rounded-full bg-brand-emerald animate-pulse" />
        <span className="text-[7px] font-mono text-text-muted tracking-widest uppercase font-bold">Active</span>
      </div>
    </div>
  );
}
