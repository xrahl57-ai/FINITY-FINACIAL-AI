/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Briefcase,
  Layers,
  FileText,
  UserCheck,
  CreditCard,
  Receipt,
  Sparkles,
  Database,
  RefreshCcw,
  CheckCircle,
  Menu,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  HelpCircle,
  Settings,
  Bell,
  Sliders,
  Globe,
  Command,
  TrendingUp,
  FolderOpen
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { FinityState, AccountType } from "./types";

// Import modular components
import FinityAgentConsole from "./components/FinityAgentConsole";
import NeonHealthRail from "./components/NeonHealthRail";
import DashboardOverview from "./components/DashboardOverview";
import LedgerTable from "./components/LedgerTable";
import Invoicing from "./components/Invoicing";
import Banking from "./components/Banking";
import ReceiptsOCR from "./components/ReceiptsOCR";
import InventoryOperations from "./components/InventoryOperations";
import FinancialReports from "./components/FinancialReports";
import OnboardingWizard from "./components/OnboardingWizard";
import LandingPage from "./components/LandingPage";

export default function App() {
  const [state, setState] = useState<FinityState | null>(null);
  const [activeTab, setActiveTab] = useState("Finity Agent");
  const [activeReportId, setActiveReportId] = useState("bs");
  const [isLoading, setIsLoading] = useState(true);
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("finity-theme");
    return saved ? saved === "dark" : true;
  });
  const [isOnboardingWizardActive, setIsOnboardingWizardActive] = useState(() => {
    const savedType = localStorage.getItem("finity-onboarding-type");
    const savedStep = localStorage.getItem("finity-onboarding-step");
    if (savedType && savedType !== "choose") return true;
    if (savedStep && parseInt(savedStep, 10) > 0) return true;
    return false;
  });
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingMessages = [
    "Decrypting Secure Double-Entry Accounts...",
    "Validating Inter-ledger Journal Symmetries...",
    "Authenticating Finity API Safe Gateway...",
    "Generating Real-Time AI Financial Forecasts...",
    "Establishing Ultra-low Latency Banking Channels..."
  ];

  useEffect(() => {
    localStorage.setItem("finity-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading || !state) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingMessages.length);
      }, 1200);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading, state]);

  // Fetch the financial state from the server on mount
  const fetchState = async () => {
    setIsLoading(true);
    const startTime = Date.now();
    try {
      const response = await fetch("/api/state");
      const data = await response.json();
      setState(data.state || data);
    } catch (err) {
      console.error("Error loading financial ledger state:", err);
    } finally {
      const elapsed = Date.now() - startTime;
      const minLoadingMs = 200; // Instant loading
      if (elapsed < minLoadingMs) {
        await new Promise(resolve => setTimeout(resolve, minLoadingMs - elapsed));
      }
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  const handleStateUpdate = (newState: FinityState) => {
    setState(newState);
  };

  const handleResetOnboarding = async () => {
    if (!window.confirm("Are you sure you want to reset your Finity workspace registration and restart the onboarding wizard? This will clear current cost-centers and settings.")) {
      return;
    }
    try {
      const response = await fetch("/api/state/reset-onboard", { method: "POST" });
      const data = await response.json();
      setState(data.state || data);
      setIsOnboardingWizardActive(true);
      setActiveTab("Overview");
    } catch (err) {
      console.error("Error resetting onboarding:", err);
    }
  };

  if (isLoading || !state) {
    return (
      <div className={`min-h-screen ${isDarkMode ? "" : "light-theme"} bg-app-bg text-text-main flex flex-col items-center justify-center p-6 relative overflow-hidden select-none transition-colors duration-500`} id="app-loading-screen">
        {/* Dynamic ambient radial gradients */}
        <div className="absolute w-[500px] h-[500px] rounded-full bg-brand-gold/5 blur-[120px] -top-40 -left-40 pointer-events-none animate-pulse" />
        <div className="absolute w-[500px] h-[500px] rounded-full bg-brand-primary-light/10 blur-[150px] -bottom-40 -right-40 pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-card-bg border border-border-subtle rounded-3xl shadow-2xl p-10 max-w-md w-full flex flex-col items-center text-center relative z-10"
        >
          {/* Logo Brand Icon */}
          <div className="w-12 h-12 rounded-2xl bg-brand-primary border border-brand-gold/35 flex items-center justify-center text-brand-gold font-mono font-extrabold text-xl tracking-tighter shadow-lg mb-8 relative group" id="loader-brand-logo">
            <div className="absolute inset-0 bg-brand-gold/10 blur-md rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            f.
          </div>

          {/* Concentric Dual-Ring Gold Spinner */}
          <div className="relative w-24 h-24 flex items-center justify-center mb-8">
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-dashed border-brand-gold/40"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-2.5 rounded-full border-2 border-t-brand-gold border-r-transparent border-b-transparent border-l-transparent"
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            />
            <motion.div
              className="w-10 h-10 rounded-full bg-brand-gold-light border border-brand-gold/25 flex items-center justify-center"
              animate={{ scale: [0.92, 1.08, 0.92] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            >
              <Sparkles size={16} className="text-brand-gold animate-pulse" />
            </motion.div>
          </div>

          <h3 className="font-sans font-extrabold text-text-main text-lg mb-1.5 tracking-tight uppercase">Finity OS</h3>
          <span className="font-mono text-[9px] text-brand-gold font-bold uppercase tracking-widest bg-brand-gold-light border border-brand-gold/20 px-3 py-1 rounded-full mb-6">
            SECURE INTEL CORE v1.0
          </span>
          
          <div className="h-8 overflow-hidden relative w-full mb-6 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={loadingStep}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="font-mono text-xs text-text-muted font-medium"
              >
                {loadingMessages[loadingStep]}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Premium Slick Progress Bar */}
          <div className="w-full bg-border-subtle rounded-full h-1 overflow-hidden mb-6">
            <motion.div 
              className="bg-brand-gold h-full rounded-full"
              initial={{ width: "3%" }}
              animate={{ 
                width: ["8%", "33%", "61%", "88%", "97%"],
              }}
              transition={{
                duration: 8,
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
          </div>

          <div className="flex items-center gap-2 justify-center font-mono text-[9px] text-brand-emerald bg-brand-emerald/10 border border-brand-emerald/20 px-3 py-1.5 rounded-xl">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald animate-pulse" />
            SOC-2 TYPE II ENCRYPTION PROTOCOL
          </div>
        </motion.div>
      </div>
    );
  }

  if (!state.isOnboarded) {
    if (isOnboardingWizardActive) {
      return (
        <div className={isDarkMode ? "" : "light-theme"}>
          <OnboardingWizard
            onOnboardingComplete={(newState, viewAction) => {
              setState(newState);
              setIsOnboardingWizardActive(false);
              if (viewAction) {
                if (viewAction === "agent") {
                  setIsConsoleOpen(true);
                  setActiveTab("Finity Agent");
                } else {
                  setActiveTab(viewAction);
                }
              }
            }}
          />
        </div>
      );
    } else {
      return (
        <LandingPage
          onGetStarted={() => setIsOnboardingWizardActive(true)}
          onLoginSuccess={(newState) => {
            setState(newState);
            setIsOnboardingWizardActive(false);
          }}
        />
      );
    }
  }

  // Derived financial profitability for sidebar display
  const getSidebarBalanceSum = (types: AccountType[]) => {
    if (!state) return 0;
    return state.accounts
      .filter((acc) => types.includes(acc.type))
      .reduce((sum, acc) => sum + acc.balance, 0);
  };
  const sidebarRevenue = getSidebarBalanceSum([AccountType.REVENUE]);
  const sidebarExpenses = getSidebarBalanceSum([AccountType.EXPENSE]);
  const sidebarNetProfit = sidebarRevenue - sidebarExpenses;
  const sidebarProfitMargin = sidebarRevenue > 0 ? (sidebarNetProfit / sidebarRevenue) * 100 : 0;
  const currencySymbol = state?.personalProfile?.currency === "KES" || state?.companyProfile?.currency === "KES" ? "KSh " : "$";

  // Unified navigation categorized sections (Linear / Revolut style)
  const navigationCategories = [
    {
      group: "Finity AI Core",
      items: [
        { name: "Finity Agent", icon: Sparkles, subtitle: "Real-time financial partner & business cockpit" },
      ]
    },
    {
      group: "Core Workspace",
      items: [
        { name: "Overview", icon: Layers, subtitle: "Monitor real-time company vitals and double-entry health" },
        { name: "Accounts & Ledgers", icon: Database, subtitle: "Configure chart of accounts and audit double-entry journals" },
        { name: "Financial Statements", icon: FileText, subtitle: "Generate income statement, balance sheet, and lock fiscal periods" },
      ]
    },
    {
      group: "Operations & Treasury",
      items: [
        { name: "Invoicing & Contacts", icon: UserCheck, subtitle: "Issue customer invoices, log payments, and manage contacts" },
        { name: "Banking Hub", icon: CreditCard, subtitle: "Review bank feed transactions and reconcile general ledger" },
        { name: "Receipt Box & OCR", icon: Receipt, subtitle: "Upload expenses and parse receipt data via Gemini AI" },
        { name: "Products & Projects", icon: Briefcase, subtitle: "Track project costs, set budgets, and oversee portfolio items" },
      ]
    }
  ];

  const handleToggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`h-screen w-screen overflow-hidden ${isDarkMode ? "" : "light-theme"} bg-app-bg text-text-main flex font-sans transition-colors duration-300`} id="app-root-container">
      
      {/* 1. Mobile Sidebar Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex" id="mobile-nav-overlay">
          {/* Backdrop glassmorphism overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />
          
          {/* Drawer Panel */}
          <motion.nav
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="relative w-80 max-w-[85vw] bg-sidebar-bg h-full flex flex-col p-6 shadow-2xl justify-between border-r border-border-subtle"
            id="mobile-drawer-nav"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-primary border border-brand-gold/30 flex items-center justify-center text-brand-gold font-mono font-extrabold text-base tracking-tighter">
                    f.
                  </div>
                  <div className="flex flex-col">
                    <span className="font-sans font-black text-text-main text-sm tracking-tight leading-none">Finity</span>
                    <span className="font-mono text-[8px] uppercase text-brand-gold font-bold tracking-wider mt-0.5">FINANCIAL OS</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-xl bg-hover-bg text-text-muted hover:text-text-main transition"
                  id="mobile-menu-close-btn"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Theme Selector for Mobile */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-hover-bg border border-border-subtle">
                <span className="text-xs font-semibold text-text-muted font-sans">Visual Experience</span>
                <button 
                  onClick={handleToggleTheme}
                  className="p-1.5 rounded-lg bg-card-bg border border-border-subtle text-brand-gold transition active:scale-95"
                >
                  {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
                </button>
              </div>

              {/* Real-time Profitability Meter Widget (Mobile) */}
              <div className="bg-hover-bg/30 border border-border-subtle/60 rounded-2xl p-4 space-y-2 relative overflow-hidden" id="mobile-sidebar-profitability">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-text-muted flex items-center gap-1.5">
                    <TrendingUp size={11} className="text-brand-emerald" />
                    Net Profitability
                  </span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold font-mono ${
                    sidebarNetProfit >= 0 ? "bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20" : "bg-brand-red/10 text-brand-red border border-brand-red/20"
                  }`}>
                    {sidebarProfitMargin.toFixed(0)}% Margin
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-extrabold text-text-main tracking-tight font-mono">
                    {currencySymbol}{sidebarNetProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Navigation Category Groups for Mobile */}
              <div className="space-y-6">
                {navigationCategories.map((group) => (
                  <div key={group.group} className="space-y-1.5">
                    <span className="text-[9px] uppercase font-mono tracking-widest font-bold text-text-muted block px-2">
                      {group.group}
                    </span>
                    <div className="space-y-1">
                      {group.items.map((tab) => {
                        const Icon = tab.icon;
                        const isSelected = activeTab === tab.name;
                        return (
                          <button
                            key={tab.name}
                            onClick={() => {
                              setActiveTab(tab.name);
                              setIsMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition ${
                              isSelected
                                ? "bg-brand-gold-light text-brand-gold border-l-2 border-brand-gold shadow-sm"
                                : "text-text-muted hover:text-text-main hover:bg-hover-bg"
                            }`}
                          >
                            <Icon size={15} className={isSelected ? "text-brand-gold" : "text-text-muted"} />
                            <span>{tab.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border-subtle pt-5 space-y-2">
              <div className="flex items-center gap-2 text-[9px] text-brand-emerald font-mono font-bold bg-brand-emerald/10 px-2 py-1 rounded-md w-fit">
                <Database size={11} />
                <span>LEDGER LOCKED</span>
              </div>
              <p className="text-[10px] text-text-muted leading-relaxed font-sans">
                Continuous double-entry ledger audits running flawlessly server-side.
              </p>
            </div>
          </motion.nav>
        </div>
      )}

      {/* 2. Desktop Floating-Effect Collapsible Sidebar */}
      <nav
        className={`bg-sidebar-bg border-r border-border-subtle shrink-0 hidden md:flex flex-col h-full justify-between transition-all duration-300 ease-in-out relative z-30 ${
          isSidebarCollapsed ? "w-20 p-4" : "w-72 p-6"
        }`}
        id="navigation-sidebar"
      >
        <div className="space-y-7">
          {/* Brand header */}
          <div className={`flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-3 px-1"}`} id="sidebar-brand-container">
            <div className="w-9 h-9 rounded-xl bg-brand-primary border border-brand-gold/30 flex items-center justify-center text-brand-gold font-mono font-extrabold text-base tracking-tighter shadow-md shrink-0 relative group">
              <div className="absolute inset-0 bg-brand-gold/5 blur-xs rounded-xl opacity-100" />
              f.
            </div>
            {!isSidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col overflow-hidden whitespace-nowrap"
              >
                <span className="font-sans font-black text-text-main text-sm tracking-tight leading-none">Finity OS</span>
                <span className="font-mono text-[8px] uppercase font-bold text-brand-gold mt-1 tracking-widest">
                  AI FINANCIAL CORE
                </span>
              </motion.div>
            )}
          </div>

          {/* Real-time Profitability Meter Widget */}
          {!isSidebarCollapsed ? (
            <div className="bg-hover-bg/30 border border-border-subtle/60 rounded-2xl p-4 space-y-3 relative overflow-hidden" id="sidebar-profitability-widget">
              <div className="absolute top-0 right-0 w-16 h-16 bg-brand-emerald/4 blur-lg rounded-full animate-pulse" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-text-muted flex items-center gap-1.5">
                  <TrendingUp size={11} className="text-brand-emerald animate-pulse" />
                  Net Profitability
                </span>
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold font-mono ${
                  sidebarNetProfit >= 0 ? "bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20" : "bg-brand-red/10 text-brand-red border border-brand-red/20"
                }`}>
                  {sidebarProfitMargin.toFixed(0)}% Margin
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-base font-extrabold text-text-main tracking-tight font-mono">
                    {currencySymbol}{sidebarNetProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[9px] font-mono text-text-muted">
                    Goal: Profit-Heavy
                  </span>
                </div>
                {/* Visual margin thermometer bar */}
                <div className="w-full bg-border-subtle/50 h-1.5 rounded-full overflow-hidden relative">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      sidebarNetProfit >= 0 ? "bg-brand-emerald shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-brand-red"
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, sidebarProfitMargin))}%` }}
                  />
                </div>
              </div>
              <p className="text-[9px] text-text-muted leading-relaxed font-medium">
                {sidebarNetProfit >= 0 
                  ? "✓ Finity core confirms high-margin asset growth trajectory."
                  : "⚠ Revenue optimization recommended for better margins."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center pt-1.5 relative h-8" title={`Net Margin: ${sidebarProfitMargin.toFixed(0)}%`}>
              <div className={`w-3.5 h-3.5 rounded-full animate-ping absolute ${sidebarNetProfit >= 0 ? "bg-brand-emerald/20" : "bg-brand-red/20"}`} />
              <div className={`w-2 h-2 rounded-full relative z-10 ${sidebarNetProfit >= 0 ? "bg-brand-emerald" : "bg-brand-red"}`} />
            </div>
          )}

          {/* Navigation Category Groups */}
          <div className="space-y-6">
            {navigationCategories.map((group) => (
              <div key={group.group} className="space-y-2">
                {!isSidebarCollapsed && (
                  <span className="text-[9px] uppercase font-mono tracking-widest font-bold text-text-muted block px-3">
                    {group.group}
                  </span>
                )}
                <div className="space-y-1">
                  {group.items.map((tab) => {
                    const Icon = tab.icon;
                    const isSelected = activeTab === tab.name;
                    return (
                      <button
                        key={tab.name}
                        onClick={() => setActiveTab(tab.name)}
                        className={`w-full flex items-center rounded-xl text-xs font-semibold text-left transition-all-300 relative group/btn ${
                          isSidebarCollapsed ? "justify-center p-3" : "gap-3 px-3.5 py-2.5"
                        } ${
                          isSelected
                            ? "bg-brand-gold-light text-brand-gold font-bold"
                            : "text-text-muted hover:text-text-main hover:bg-hover-bg"
                        }`}
                        title={isSidebarCollapsed ? tab.name : undefined}
                        id={`nav-link-${tab.name.toLowerCase().replace(/ /g, "-")}`}
                      >
                        {/* Selected Indicator Pill */}
                        {isSelected && (
                          <motion.div 
                            layoutId="selected-tab-indicator"
                            className="absolute left-0 w-1 h-1/2 bg-brand-gold rounded-r-lg"
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}
                        <Icon size={16} className={isSelected ? "text-brand-gold" : "text-text-muted group-hover/btn:text-text-main transition-colors"} />
                        {!isSidebarCollapsed && (
                          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="truncate">
                            {tab.name}
                          </motion.span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Collapse Toggle & Status */}
        <div className="space-y-5 pt-5 border-t border-border-subtle" id="sidebar-footer">
          {!isSidebarCollapsed && (
            <div className="px-3 space-y-2.5 bg-hover-bg/30 p-3 rounded-2xl border border-border-subtle/50" id="nav-footer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[9px] text-brand-emerald font-mono font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald animate-pulse" />
                  <span>LEDGER SECURED</span>
                </div>
                <button
                  onClick={handleResetOnboarding}
                  className="text-[9px] font-mono font-bold text-brand-gold hover:text-brand-gold-dark transition flex items-center gap-1 bg-brand-gold-light/20 px-2 py-0.5 rounded border border-brand-gold/20"
                  id="btn-re-onboard"
                  title="Run the Onboarding Setup Wizard again to register another profile"
                >
                  <RefreshCcw size={8} />
                  <span>RE-ONBOARD</span>
                </button>
              </div>
              <p className="text-[10px] text-text-muted leading-relaxed font-sans font-medium">
                Real-time zero-error validation engine operating normally.
              </p>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            {/* Collapse Toggle */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="flex-1 flex items-center justify-center p-2.5 rounded-xl text-text-muted hover:text-text-main hover:bg-hover-bg transition border border-dashed border-border-subtle"
              id="sidebar-collapse-toggle"
            >
              {isSidebarCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            </button>

            {/* Theme Toggle Button */}
            {!isSidebarCollapsed && (
              <button
                onClick={handleToggleTheme}
                className="p-2.5 rounded-xl bg-hover-bg hover:bg-border-subtle text-brand-gold border border-border-subtle transition hover:scale-105 active:scale-95"
                title="Switch Theme"
              >
                {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* 3. Main Stage Content Area (Header + Scroll View + Agent Chat) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden" id="main-stage-wrapper">
        {/* Unified Top luxury header */}
        <header className="bg-sidebar-bg border-b border-border-subtle h-16 px-6 shrink-0 flex items-center justify-between sticky top-0 z-20" id="main-brand-header">
          {/* Left portion: Mobile hamburger or Active Page details */}
          <div className="flex items-center gap-4">
            {/* Mobile hamburger menu trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl text-text-muted hover:bg-hover-bg hover:text-text-main transition mr-1"
              id="mobile-nav-trigger"
            >
              <Menu size={18} />
            </button>

            {/* Title / Description */}
            <div className="flex flex-col">
              <h1 className="font-sans font-black text-text-main text-sm md:text-base tracking-tight leading-none flex items-center gap-2.5">
                <span>{activeTab}</span>
              </h1>
              <span className="hidden sm:inline text-[10px] text-text-muted font-sans font-semibold mt-1">
                {navigationCategories.flatMap(c => c.items).find((t) => t.name === activeTab)?.subtitle || "Finity Operational Subsystem"}
              </span>
            </div>
          </div>

          {/* Right portion: Server connection status + Theme + Agent console toggle */}
          <div className="flex items-center gap-3">
            {/* Quick stats indicator */}
            <div className="hidden lg:flex items-center gap-2 font-mono text-[9px] font-bold text-brand-emerald bg-brand-emerald/8 border border-brand-emerald/15 px-3 py-1.5 rounded-xl" id="db-status-badge">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald animate-pulse" />
              <span>CONNECTED: FINITY OS PORT 3000</span>
            </div>

            {/* Simple Light/Dark Switch inside Header for mobile/compact viewport */}
            <button
              onClick={handleToggleTheme}
              className="md:hidden p-2.5 rounded-xl bg-hover-bg hover:bg-border-subtle text-brand-gold border border-border-subtle transition"
            >
              {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* AI Toggle Button */}
            <button
              onClick={() => setIsConsoleOpen(!isConsoleOpen)}
              className="flex items-center gap-2 bg-brand-gold text-brand-primary hover:bg-brand-gold-dark hover:shadow-md hover:scale-[1.02] px-4 py-2 rounded-xl text-xs font-bold transition active:scale-95 shadow-sm"
              id="toggle-console-btn"
            >
              <Sparkles size={14} className="text-brand-primary" />
              <span className="hidden sm:inline">{isConsoleOpen ? "Hide AI Copilot" : "Interact with AI"}</span>
            </button>
          </div>
        </header>

        {/* Content stage + agent console */}
        <div className="flex-1 flex overflow-hidden relative" id="layout-body">
          {/* Main scroll pane for actual dashboard view cards */}
          <main className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6 bg-app-bg text-text-main transition-colors duration-300" id="main-scroll-pane">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                {activeTab === "Finity Agent" && (
                  <div className="flex flex-col lg:flex-row h-[calc(100vh-10rem)] min-h-[500px] rounded-2xl border border-border-subtle bg-sidebar-bg overflow-hidden relative shadow-2xl" id="finity-agent-main-stage">
                    {/* Glowing Business Health Neon Circles built directly into the agent page */}
                    <NeonHealthRail 
                      state={state} 
                      onTabChange={setActiveTab} 
                      onSelectReport={setActiveReportId} 
                    />
                    <div className="flex-1 flex flex-col h-full relative border-l border-border-subtle/40 overflow-hidden bg-sidebar-bg">
                      <div className="absolute w-[200px] h-[200px] rounded-full bg-brand-gold/3 blur-[80px] top-1/4 right-0 pointer-events-none" />
                      <FinityAgentConsole
                        state={state}
                        onStateUpdate={handleStateUpdate}
                        onRefresh={fetchState}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        onSelectReport={(reportId) => {
                          setActiveTab("Financial Statements");
                          setActiveReportId(reportId);
                        }}
                      />
                    </div>
                  </div>
                )}

                {activeTab === "Overview" && (
                  <DashboardOverview state={state} onNavigate={(tab) => setActiveTab(tab)} isConsoleOpen={isConsoleOpen} />
                )}

                {activeTab === "Accounts & Ledgers" && (
                  <LedgerTable state={state} onRefresh={fetchState} isConsoleOpen={isConsoleOpen} />
                )}

                {activeTab === "Invoicing & Contacts" && (
                  <Invoicing state={state} onStateUpdate={handleStateUpdate} />
                )}

                {activeTab === "Banking Hub" && (
                  <Banking state={state} onStateUpdate={handleStateUpdate} />
                )}

                {activeTab === "Receipt Box & OCR" && (
                  <ReceiptsOCR state={state} onStateUpdate={handleStateUpdate} />
                )}

                {activeTab === "Products & Projects" && (
                  <InventoryOperations state={state} onStateUpdate={handleStateUpdate} />
                )}

                {activeTab === "Financial Statements" && (
                  <FinancialReports
                    state={state}
                    onStateUpdate={handleStateUpdate}
                    activeReportId={activeReportId}
                    setActiveReportId={setActiveReportId}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Right Collapsible AI Finity Agent chat Panel & Business Health Vitals */}
          {isConsoleOpen && activeTab !== "Finity Agent" && (
            <>
              {/* Mobile/Tablet Backdrop overlay */}
              <div 
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-30 xl:hidden transition-opacity"
                onClick={() => setIsConsoleOpen(false)}
                id="console-backdrop"
              />
              <div className="fixed inset-y-0 right-0 z-40 xl:relative xl:inset-auto xl:z-20 w-full max-w-[495px] sm:w-[460px] xl:w-[495px] shrink-0 border-l border-border-subtle flex flex-row h-full bg-sidebar-bg animate-fade shadow-2xl xl:shadow-none" id="right-aside-console">
                {/* Floating Close Button for Mobile/Tablet overlay mode */}
                <button
                  onClick={() => setIsConsoleOpen(false)}
                  className="xl:hidden absolute top-4 right-4 z-50 w-8 h-8 rounded-full bg-hover-bg hover:bg-border-subtle border border-border-subtle flex items-center justify-center text-text-muted hover:text-text-main transition shadow-md"
                  title="Close AI Copilot"
                  id="close-console-overlay"
                >
                  <X size={15} />
                </button>

                {/* Glowing Business Health Neon Circles */}
                <NeonHealthRail 
                  state={state} 
                  onTabChange={setActiveTab} 
                  onSelectReport={setActiveReportId} 
                />

                {/* Main Agent Chat Workspace */}
                <div className="flex-1 flex flex-col h-full relative border-l border-border-subtle/40 overflow-hidden">
                  {/* Decorative side accent blur */}
                  <div className="absolute w-[200px] h-[200px] rounded-full bg-brand-gold/3 blur-[80px] top-1/4 right-0 pointer-events-none" />
                  <FinityAgentConsole
                    state={state}
                    onStateUpdate={handleStateUpdate}
                    onRefresh={fetchState}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    onSelectReport={(reportId) => {
                      setActiveTab("Financial Statements");
                      setActiveReportId(reportId);
                    }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

