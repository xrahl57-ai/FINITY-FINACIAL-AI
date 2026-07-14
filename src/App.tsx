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
  FolderOpen,
  AlertCircle,
  WifiOff,
  Server
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { FinityState, AccountType } from "./types";

// Import modular components
import FinityAgentConsole from "./components/FinityAgentConsole";
import NeonHealthRail from "./components/NeonHealthRail";
import CommandPalette from "./components/CommandPalette";
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
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [serverUrl, setServerUrl] = useState(() => {
    return localStorage.getItem("finity-api-url") || "https://ais-pre-ukieqcyvafzk2w56lzifwb-230947666768.europe-west2.run.app";
  });
  const [showConfig, setShowConfig] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [customUrlInput, setCustomUrlInput] = useState("");
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
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

  // Setup a fallback seed state for offline mode
  const setupOfflineSeed = () => {
    console.log("[Finity OS] Seeding complete offline state locally...");
    const seed: FinityState = {
      accounts: [
        { id: "acc-bank", name: "Operating Bank (Checking)", type: AccountType.ASSET, code: "1010", balance: 45000, description: "Primary operating checking account", isSystem: true },
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
      ],
      transactions: [
        { id: "tx-ob-1", date: "2026-07-01", description: "Initial Equity Contribution", accountId: "acc-bank", offsetAccountId: "acc-equity", amount: 45000, category: "Equity", type: "income", status: "posted" },
        { id: "tx-ob-2", date: "2026-07-02", description: "Office Space Lease Payment", accountId: "acc-bank", offsetAccountId: "acc-rent", amount: -2500, category: "Rent", type: "expense", status: "posted" },
        { id: "tx-ob-3", date: "2026-07-03", description: "Stripe Sales Payout Batch", accountId: "acc-bank", offsetAccountId: "acc-revenue", amount: 8400, category: "Sales", type: "income", status: "posted" },
        { id: "tx-ob-4", date: "2026-07-04", description: "Employee Payroll Allocation", accountId: "acc-bank", offsetAccountId: "acc-payroll", amount: -6000, category: "Payroll", type: "expense", status: "posted" },
      ],
      journalEntries: [],
      invoices: [],
      bills: [],
      products: [],
      partners: [
        { id: "partner-ob-owner", name: "Business Owner", type: "employee", email: "admin@finity.io", phone: "", address: "", balance: 0 }
      ],
      projects: [],
      budgets: [],
      receipts: [],
      bankConnections: [
        {
          id: "bc-ob-1",
          bankName: "Finity Operating Checking",
          accountNumber: "•••• 4422",
          balance: 45000,
          lastSynced: new Date().toISOString(),
          transactions: [
            { id: "btx-ob-1", date: "2026-07-05", description: "Customer Wire Settlement", amount: 4500, reconciled: false },
            { id: "btx-ob-2", date: "2026-07-06", description: "Office Utility Payment", amount: -350, reconciled: false },
            { id: "btx-ob-3", date: "2026-07-07", description: "Adobe CC Software Sub", amount: -85, reconciled: true },
          ],
        }
      ],
      wallets: [
        { id: "wal-ob-usd", name: "Operating USD Wallet", currency: "USD", balance: 10000, provider: "Finity Core", lastUpdated: new Date().toISOString() }
      ],
      paymentGateways: [
        { id: "pg-ob-stripe", name: "Stripe Connect Portal", status: "connected", environment: "sandbox", credentialsType: "API Key", lastPing: new Date().toISOString() }
      ],
      activePayments: [],
      exchangeRates: { "USD": 1.0, "EUR": 1.08, "GBP": 1.28, "CAD": 1.38, "AUD": 1.51 },
      isOnboarded: false, // Default to false so user gets to experience onboarding
      companyProfile: {
        name: "Finity Offline Workspace",
        legalName: "Finity Local Systems Ltd",
        businessType: "Corporation",
        industry: "Technology",
        companySize: "1-10",
        country: "United States",
        timezone: "UTC",
        language: "English",
        onboardedAt: new Date().toISOString(),
      },
      auditLogs: [
        { id: "log-local-seed-1", timestamp: new Date().toISOString(), action: "Local Workspace Init", entityType: "Database", entityId: "local", details: "Finity local offline ledger initialized successfully.", user: "Local System OS" }
      ],
    };
    localStorage.setItem("finity-local-state", JSON.stringify(seed));
    setState(seed);
    setIsOfflineMode(true);
  };

  // Fetch the financial state from the server with timeout and local fallbacks
  const fetchState = async (customUrl?: string) => {
    setIsLoading(true);
    setConnectionError(null);
    setIsTestingConnection(true);

    const targetUrl = customUrl !== undefined ? customUrl : serverUrl;
    console.log(`[Finity OS] Resilient Startup: Connecting to server at: ${targetUrl || "Relative origin"}`);

    if (customUrl !== undefined) {
      localStorage.setItem("finity-api-url", customUrl.trim());
      setServerUrl(customUrl.trim());
    }

    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 15000); // 15s connection timeout

    try {
      const response = await fetch("/api/state", { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server response error: HTTP ${response.status}`);
      }

      const data = await response.json();
      const serverState = data.state || data;

      if (!serverState || typeof serverState !== "object") {
        throw new Error("Invalid schema structure returned from server.");
      }

      // Sync and backup to local storage
      localStorage.setItem("finity-local-state", JSON.stringify(serverState));
      
      setState(serverState);
      setIsOfflineMode(false);
      console.log("[Finity OS] Connection successful. Financial ledger state synced.");
    } catch (err: any) {
      clearTimeout(timeoutId);
      const errMsg = err.name === "AbortError" ? "Connection timeout (15000ms exceeded)" : String(err.message || err);
      console.warn(`[Finity OS] API Connection unsuccessful: ${errMsg}. Initiating offline session restoration...`);
      setConnectionError(errMsg);

      // Restore session from localStorage backup
      const localBackup = localStorage.getItem("finity-local-state");
      if (localBackup) {
        try {
          const parsed = JSON.parse(localBackup);
          setState(parsed);
          setIsOfflineMode(true);
          console.log("[Finity OS] Resilient Startup: Restored previous financial state from Local Storage.");
        } catch (parseErr) {
          console.error("[Finity OS] Local Storage backup is corrupted:", parseErr);
          setupOfflineSeed();
        }
      } else {
        // No backup exists. Load standard seed locally.
        setupOfflineSeed();
      }
    } finally {
      setIsTestingConnection(false);
      const elapsed = Date.now() - startTime;
      const minLoadingMs = 800; // Visual buffer
      if (elapsed < minLoadingMs) {
        await new Promise((resolve) => setTimeout(resolve, minLoadingMs - elapsed));
      }
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleStateUpdate = (newState: FinityState) => {
    setState(newState);
    // Persist to local storage for offline support
    localStorage.setItem("finity-local-state", JSON.stringify(newState));

    // If online, perform background sync to server database
    if (!isOfflineMode) {
      console.log("[Finity OS] Background Sync: Syncing state update to server...");
      fetch("/api/state/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: newState })
      }).then(res => {
        if (!res.ok) {
          console.warn("[Finity OS] Background Sync server responded with an error");
        }
      }).catch(err => {
        console.warn("[Finity OS] Background Sync failed (will retry next save):", err);
      });
    }
  };

  const handleResetOnboarding = async () => {
    if (!window.confirm("Are you sure you want to reset your Finity workspace registration and restart the onboarding wizard? This will clear current cost-centers and settings.")) {
      return;
    }
    
    // Clear local storage backup
    localStorage.removeItem("finity-local-state");

    if (isOfflineMode) {
      const freshSeed: FinityState = {
        ...state,
        isOnboarded: false,
        companyProfile: undefined,
        personalProfile: undefined,
        userCredentials: undefined
      };
      setState(freshSeed);
      localStorage.setItem("finity-local-state", JSON.stringify(freshSeed));
      setIsOnboardingWizardActive(true);
      setActiveTab("Overview");
    } else {
      try {
        const response = await fetch("/api/state/reset-onboard", { method: "POST" });
        const data = await response.json();
        const serverState = data.state || data;
        localStorage.setItem("finity-local-state", JSON.stringify(serverState));
        setState(serverState);
        setIsOnboardingWizardActive(true);
        setActiveTab("Overview");
      } catch (err) {
        console.error("Error resetting onboarding:", err);
        const freshSeed: FinityState = {
          ...state,
          isOnboarded: false,
          companyProfile: undefined,
          personalProfile: undefined,
          userCredentials: undefined
        };
        setState(freshSeed);
        localStorage.setItem("finity-local-state", JSON.stringify(freshSeed));
        setIsOnboardingWizardActive(true);
        setActiveTab("Overview");
      }
    }
  };

  if (isLoading || !state) {
    const isOfflineAvailable = !!localStorage.getItem("finity-local-state");

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

          {connectionError ? (
            // Connection Error / Config UI
            <div className="w-full flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-brand-gold/10 border border-brand-gold/30 flex items-center justify-center mb-6">
                <WifiOff size={28} className="text-brand-gold animate-bounce" />
              </div>
              
              <h3 className="font-sans font-extrabold text-text-main text-lg mb-2 tracking-tight uppercase">HANDSHAKE FAILED</h3>
              <p className="font-mono text-[10px] text-brand-gold font-bold uppercase tracking-widest bg-brand-gold/10 border border-brand-gold/20 px-3 py-1 rounded-full mb-4">
                SECURE NETWORK TIMEOUT
              </p>

              <div className="bg-hover-bg/40 border border-border-subtle rounded-2xl p-4 w-full mb-6 text-left max-h-32 overflow-y-auto">
                <span className="font-mono text-[9px] uppercase font-bold text-text-muted block mb-1">Error Diagnostics:</span>
                <p className="font-mono text-xs text-brand-red font-medium leading-relaxed break-all">
                  {connectionError}
                </p>
              </div>

              {/* Server URL Config Form */}
              <div className="w-full text-left space-y-2 mb-6">
                <label className="font-mono text-[9px] uppercase font-bold text-text-muted flex items-center gap-1.5">
                  <Server size={10} className="text-brand-gold" />
                  API Server Node Address
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="https://your-finity-server.run.app"
                    className="flex-1 px-3.5 py-2 rounded-xl bg-hover-bg/60 border border-border-subtle focus:outline-none focus:border-brand-gold/50 text-xs text-text-main font-mono placeholder:text-text-muted/50"
                  />
                  <button
                    onClick={() => {
                      setCustomUrlInput("https://ais-pre-ukieqcyvafzk2w56lzifwb-230947666768.europe-west2.run.app");
                    }}
                    className="px-2.5 py-2 rounded-xl bg-hover-bg border border-border-subtle text-[10px] font-mono text-text-muted hover:text-text-main transition"
                    title="Reset to Default"
                  >
                    Default
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full space-y-2.5">
                <button
                  onClick={() => fetchState(customUrlInput)}
                  disabled={isTestingConnection}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-primary text-brand-gold hover:bg-brand-primary-light border border-brand-gold/30 font-semibold text-xs transition uppercase tracking-wider font-sans active:scale-98 disabled:opacity-50"
                >
                  {isTestingConnection ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-brand-gold" />
                      Authenticating Node...
                    </>
                  ) : (
                    <>
                      <RefreshCcw size={14} className="text-brand-gold" />
                      Retry Secure Handshake
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    if (isOfflineAvailable) {
                      const localBackup = localStorage.getItem("finity-local-state");
                      if (localBackup) {
                        setState(JSON.parse(localBackup));
                        setIsOfflineMode(true);
                        setIsLoading(false);
                      }
                    } else {
                      setupOfflineSeed();
                      setIsLoading(false);
                    }
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-hover-bg/80 hover:bg-hover-bg text-text-main border border-border-subtle font-semibold text-xs transition uppercase tracking-wider font-sans active:scale-98"
                >
                  {isOfflineAvailable ? "Continue Offline (Local Storage)" : "Generate Local Offline Database"}
                </button>
              </div>
            </div>
          ) : (
            // Standard loading spinner layout
            <>
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
            </>
          )}
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
            {isOfflineMode ? (
              <button 
                onClick={() => {
                  setCustomUrlInput(serverUrl);
                  setConnectionError(null);
                  setShowConfig(true);
                }}
                className="hidden lg:flex items-center gap-2 font-mono text-[9px] font-bold text-brand-gold bg-brand-gold/10 border border-brand-gold/20 px-3 py-1.5 rounded-xl hover:bg-brand-gold/15 transition animate-pulse text-left cursor-pointer" 
                id="offline-status-badge"
                title="Running in Local Offline Mode. Click to configure connection settings."
              >
                <WifiOff size={11} className="text-brand-gold shrink-0" />
                <span>OFFLINE MODE (LOCAL)</span>
              </button>
            ) : (
              <button 
                onClick={() => {
                  setCustomUrlInput(serverUrl);
                  setConnectionError(null);
                  setShowConfig(true);
                }}
                className="hidden lg:flex items-center gap-2 font-mono text-[9px] font-bold text-brand-emerald bg-brand-emerald/8 border border-brand-emerald/15 px-3 py-1.5 rounded-xl hover:bg-brand-emerald/12 transition text-left cursor-pointer" 
                id="db-status-badge"
                title="Connected to Finity Cloud Server. Click to view configuration."
              >
                <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald animate-pulse shrink-0" />
                <span>ONLINE CLOUD SECURE</span>
              </button>
            )}

            {/* Simple Light/Dark Switch inside Header for mobile/compact viewport */}
            <button
              onClick={handleToggleTheme}
              className="md:hidden p-2.5 rounded-xl bg-hover-bg hover:bg-border-subtle text-brand-gold border border-border-subtle transition"
            >
              {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Command Palette Trigger Button */}
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="flex items-center gap-2 bg-hover-bg hover:bg-border-subtle hover:scale-[1.01] px-3.5 py-2 rounded-xl text-xs font-semibold text-text-muted hover:text-text-main border border-border-subtle/80 transition active:scale-95 shadow-sm"
              title="Open Command Palette (Ctrl+K)"
              id="cmd-palette-trigger-btn"
            >
              <Command size={14} className="text-brand-gold shrink-0" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden md:inline-flex h-4 items-center gap-0.5 rounded border border-border-subtle/80 bg-sidebar-bg px-1 font-mono text-[9px] font-bold text-text-muted">
                <span className="text-[10px]">⌘</span>K
              </kbd>
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
                  <div className="flex flex-col h-[calc(100vh-10rem)] min-h-[500px] rounded-2xl border border-border-subtle bg-sidebar-bg overflow-hidden relative shadow-2xl" id="finity-agent-main-stage">
                    {/* Glowing Business Health Neon Circles built directly into the agent page */}
                    <NeonHealthRail 
                      state={state} 
                      onTabChange={setActiveTab} 
                      onSelectReport={setActiveReportId} 
                    />
                    <div className="flex-1 flex flex-col h-full relative border-t border-border-subtle/40 overflow-hidden bg-sidebar-bg">
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
              <div className="fixed inset-y-0 right-0 z-40 xl:relative xl:inset-auto xl:z-20 w-full max-w-[495px] sm:w-[460px] xl:w-[495px] shrink-0 border-l border-border-subtle flex flex-col h-full bg-sidebar-bg animate-fade shadow-2xl xl:shadow-none" id="right-aside-console">
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
                <div className="flex-1 flex flex-col h-full relative border-t border-border-subtle/40 overflow-hidden">
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

      {/* Command Palette Keyboard Shortcut Overlay */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isConsoleOpen={isConsoleOpen}
        onToggleConsole={setIsConsoleOpen}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={setIsSidebarCollapsed}
      />

      {/* Dynamic Server Connection Config Modal */}
      {showConfig && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fade-in" id="server-config-modal">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card-bg border border-border-subtle rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
          >
            <button 
              onClick={() => setShowConfig(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-text-muted hover:text-text-main hover:bg-hover-bg transition cursor-pointer"
              id="close-config-modal-btn"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-gold/20 flex items-center justify-center text-brand-gold">
                <Server size={18} />
              </div>
              <div>
                <h3 className="font-sans font-black text-text-main text-sm md:text-base tracking-tight leading-none">Connection Settings</h3>
                <span className="font-mono text-[8px] uppercase font-bold text-brand-gold mt-1 tracking-widest block">Finity Ledger Node</span>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {/* Current Status */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-hover-bg/40 border border-border-subtle">
                <span className="font-sans text-xs text-text-muted font-medium">Core Node Status:</span>
                {isOfflineMode ? (
                  <div className="flex items-center gap-1.5 text-brand-gold font-mono text-[10px] font-bold uppercase bg-brand-gold/10 px-2.5 py-1 rounded-lg">
                    <WifiOff size={11} />
                    Offline (Local)
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-brand-emerald font-mono text-[10px] font-bold uppercase bg-brand-emerald/10 px-2.5 py-1 rounded-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald animate-pulse" />
                    Online Cloud
                  </div>
                )}
              </div>

              {/* Endpoint Input */}
              <div className="space-y-2">
                <label className="font-mono text-[9px] uppercase font-bold text-text-muted flex items-center gap-1.5">
                  Server Endpoint Address
                </label>
                <input
                  type="text"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  placeholder="https://your-server-domain.run.app"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-hover-bg border border-border-subtle focus:outline-none focus:border-brand-gold/50 text-xs text-text-main font-mono placeholder:text-text-muted/40"
                />
                <span className="text-[10px] text-text-muted font-sans leading-normal block">
                  Relative API calls are proxied through this server. Mobile applications must use fully qualified domains to resolve server-side endpoints.
                </span>
              </div>

              {/* Test diagnostics */}
              {connectionError && (
                <div className="p-3.5 rounded-2xl bg-brand-red/5 border border-brand-red/10 text-left max-h-24 overflow-y-auto">
                  <span className="font-mono text-[9px] font-bold text-brand-red uppercase block mb-0.5">Handshake Error:</span>
                  <p className="font-mono text-[10px] text-brand-red leading-normal break-all">{connectionError}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setCustomUrlInput("https://ais-pre-ukieqcyvafzk2w56lzifwb-230947666768.europe-west2.run.app");
                  setConnectionError(null);
                }}
                className="py-2.5 px-4 rounded-xl bg-hover-bg hover:bg-border-subtle text-xs font-semibold text-text-main border border-border-subtle transition active:scale-95 text-center cursor-pointer"
              >
                Reset Default
              </button>

              <button
                onClick={async () => {
                  setIsTestingConnection(true);
                  setConnectionError(null);
                  try {
                    // Temporarily write the custom URL to localStorage
                    const normalizedUrl = customUrlInput.trim().replace(/\/$/, "");
                    localStorage.setItem("finity-api-url", normalizedUrl);
                    
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 3500);
                    
                    const testUrl = `${normalizedUrl}/api/state`;
                    const res = await fetch(testUrl, { signal: controller.signal });
                    clearTimeout(timeoutId);

                    if (!res.ok) {
                      throw new Error(`Server returned HTTP ${res.status}`);
                    }

                    const data = await res.json();
                    if (data && typeof data === "object") {
                      setServerUrl(normalizedUrl);
                      setIsOfflineMode(false);
                      setState(data.state || data);
                      localStorage.setItem("finity-local-state", JSON.stringify(data.state || data));
                      setShowConfig(false);
                      console.log("[Finity OS] Tested and configured server URL successfully.");
                    } else {
                      throw new Error("Invalid structure returned from connection test");
                    }
                  } catch (err: any) {
                    console.error("[Finity OS] Tested URL handshake failed:", err);
                    setConnectionError(err.message || String(err));
                    // Revert to original server URL
                    localStorage.setItem("finity-api-url", serverUrl);
                  } finally {
                    setIsTestingConnection(false);
                  }
                }}
                disabled={isTestingConnection}
                className="py-2.5 px-4 rounded-xl bg-brand-primary text-brand-gold hover:bg-brand-primary-light border border-brand-gold/30 text-xs font-semibold transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isTestingConnection ? (
                  <>
                    <Loader2 size={12} className="animate-spin text-brand-gold" />
                    Testing...
                  </>
                ) : (
                  "Apply & Sync"
                )}
              </button>

              {isOfflineMode && (
                <button
                  onClick={() => setShowConfig(false)}
                  className="col-span-2 py-2.5 px-4 rounded-xl bg-hover-bg/60 hover:bg-hover-bg text-xs font-semibold text-text-muted border border-border-subtle/80 transition active:scale-95 text-center cursor-pointer"
                >
                  Continue Running Offline
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

