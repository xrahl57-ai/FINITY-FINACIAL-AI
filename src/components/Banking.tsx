/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import { 
  Link2, 
  Shield, 
  ShieldCheck,
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  ArrowRight, 
  Wallet, 
  Check, 
  Plus, 
  Send, 
  Globe, 
  Sliders, 
  Building, 
  CreditCard,
  History,
  TrendingUp,
  Cpu,
  Layers,
  ArrowUpRight,
  Lock,
  Key,
  Users,
  Search,
  Filter,
  Calendar,
  Paperclip,
  ChevronRight,
  Info,
  Sparkles,
  ArrowLeftRight,
  Activity,
  CheckSquare,
  HelpCircle,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar, 
  Legend 
} from "recharts";
import { FinityState, BankTransaction, BankConnection, DigitalWallet, PaymentGateway, ActivePayment, Transaction } from "../types";
import KRATaxComplianceHub from "./KRATaxComplianceHub";

interface CountryData {
  id: string;
  name: string;
  emoji: string;
  currency: string;
  symbol: string;
  banks: string[];
}

const COUNTRIES: CountryData[] = [
  {
    id: "ke",
    name: "Kenya",
    emoji: "🇰🇪",
    currency: "KES",
    symbol: "KSh",
    banks: [
      "Equity Bank Kenya",
      "Kenya Commercial Bank (KCB)",
      "Co-operative Bank of Kenya",
      "NCBA Bank Kenya",
      "Safaricom M-Pesa Till / Paybill",
      "Absa Bank Kenya",
      "Stanbic Bank Kenya",
      "Standard Chartered Kenya",
      "I&M Bank Kenya",
      "Family Bank Kenya"
    ]
  },
  {
    id: "us",
    name: "United States",
    emoji: "🇺🇸",
    currency: "USD",
    symbol: "$",
    banks: [
      "JP Morgan Chase",
      "Bank of America",
      "Wells Fargo",
      "Citibank",
      "Goldman Sachs",
      "Morgan Stanley",
      "U.S. Bank",
      "PNC Bank",
      "Truist Bank",
      "Capital One",
      "Silicon Valley Bank",
      "First Republic Bank"
    ]
  },
  {
    id: "uk",
    name: "United Kingdom",
    emoji: "🇬🇧",
    currency: "GBP",
    symbol: "£",
    banks: [
      "Barclays Business",
      "HSBC UK Commercial",
      "Lloyds Banking Group",
      "NatWest Group",
      "Royal Bank of Scotland",
      "Standard Chartered",
      "Santander UK",
      "Monzo Business",
      "Starling Bank",
      "Tide Business Bank"
    ]
  },
  {
    id: "ca",
    name: "Canada",
    emoji: "🇨🇦",
    currency: "CAD",
    symbol: "$",
    banks: [
      "Royal Bank of Canada (RBC)",
      "Toronto-Dominion Bank (TD)",
      "Bank of Nova Scotia (Scotiabank)",
      "Bank of Montreal (BMO)",
      "Canadian Imperial Bank of Commerce (CIBC)",
      "National Bank of Canada",
      "Desjardins Group",
      "Laurentian Bank"
    ]
  },
  {
    id: "au",
    name: "Australia",
    emoji: "🇦🇺",
    currency: "AUD",
    symbol: "$",
    banks: [
      "Commonwealth Bank of Australia (CBA)",
      "Westpac Banking Corporation",
      "National Australia Bank (NAB)",
      "Australia and New Zealand Banking Group (ANZ)",
      "Macquarie Group",
      "Bendigo Bank",
      "Bank of Queensland",
      "Suncorp Bank"
    ]
  },
  {
    id: "de",
    name: "Germany",
    emoji: "🇩🇪",
    currency: "EUR",
    symbol: "€",
    banks: [
      "Deutsche Bank",
      "Commerzbank",
      "KfW Bankengruppe",
      "DZ Bank",
      "Landesbank Baden-Württemberg (LBBW)",
      "Sparkasse Business",
      "N26 Business",
      "Postbank"
    ]
  },
  {
    id: "fr",
    name: "France",
    emoji: "🇫🇷",
    currency: "EUR",
    symbol: "€",
    banks: [
      "BNP Paribas",
      "Crédit Agricole",
      "Société Générale",
      "Groupe BPCE",
      "Crédit Mutuel",
      "La Banque Postale",
      "CIC (Crédit Industriel et Commercial)",
      "Qonto Business"
    ]
  },
  {
    id: "jp",
    name: "Japan",
    emoji: "🇯🇵",
    currency: "JPY",
    symbol: "¥",
    banks: [
      "Mitsubishi UFJ Financial Group (MUFG)",
      "Sumitomo Mitsui Financial Group (SMFG)",
      "Mizuho Financial Group",
      "Japan Post Bank",
      "Resona Holdings",
      "Norinchukin Bank",
      "Nomura Holdings",
      "SBI Sumishin Net Bank"
    ]
  },
  {
    id: "sg",
    name: "Singapore",
    emoji: "🇸🇬",
    currency: "SGD",
    symbol: "S$",
    banks: [
      "DBS Bank",
      "Overseas-Chinese Banking Corporation (OCBC)",
      "United Overseas Bank (UOB)",
      "Standard Chartered Singapore",
      "Maybank Singapore",
      "Aspire Business",
      "Wise Singapore"
    ]
  },
  {
    id: "ch",
    name: "Switzerland",
    emoji: "🇨🇭",
    currency: "CHF",
    symbol: "CHF",
    banks: [
      "UBS Group",
      "Julius Baer Group",
      "Swisscanton Bank",
      "Zurich Cantonal Bank (ZKB)",
      "PostFinance",
      "Pictet Group",
      "Lombard Odier",
      "Swissquote"
    ]
  },
  {
    id: "in",
    name: "India",
    emoji: "🇮🇳",
    currency: "INR",
    symbol: "₹",
    banks: [
      "State Bank of India (SBI)",
      "HDFC Bank",
      "ICICI Bank",
      "Axis Bank",
      "Kotak Mahindra Bank",
      "IndusInd Bank",
      "Bank of Baroda",
      "RazorpayX Business"
    ]
  },
  {
    id: "br",
    name: "Brazil",
    emoji: "🇧🇷",
    currency: "BRL",
    symbol: "R$",
    banks: [
      "Itaú Unibanco",
      "Banco Bradesco",
      "Banco do Brasil",
      "Caixa Econômica Federal",
      "Santander Brasil",
      "Nubank Business",
      "Banco BTG Pactual"
    ]
  },
  {
    id: "nl",
    name: "Netherlands",
    emoji: "🇳🇱",
    currency: "EUR",
    symbol: "€",
    banks: [
      "ING Group",
      "Rabobank",
      "ABN AMRO",
      "de Volksbank",
      "Bunq Business",
      "Triodos Bank"
    ]
  }
];

interface BankingProps {
  state: FinityState;
  onStateUpdate: (newState: FinityState) => void;
}

export default function Banking({ state, onStateUpdate }: BankingProps) {
  // Main banking 10 tabs navigation
  const [activeTab, setActiveTab] = useState<
    "overview" | "connect" | "accounts" | "transactions" | "transfers" | "payments" | "reconciliation" | "cash" | "security" | "integrations" | "kra-compliance"
  >("overview");

  // ----------------------------------------------------
  // Local Interactive States
  // ----------------------------------------------------
  const [selectedBankId, setSelectedBankId] = useState<string>("bc-1");
  const [txSearch, setTxSearch] = useState("");
  const [txTypeFilter, setTxTypeFilter] = useState<"all" | "deposit" | "withdrawal">("all");
  const [txAccountFilter, setTxAccountFilter] = useState<string>("all");
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Connect Comprehensive Financial Account Wizard States
  const [connectStep, setConnectStep] = useState<number>(1);
  const [wizardType, setWizardType] = useState<"bank" | "gateway" | "wallet" | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>("plaid");
  const [searchBankQuery, setSearchBankQuery] = useState("");
  const [selectedBankName, setSelectedBankName] = useState("");
  const [newBankAccNum, setNewBankAccNum] = useState("");
  const [newBankBalance, setNewBankBalance] = useState("45000");
  const [isLinkingBank, setIsLinkingBank] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>("ke");

  // Secure Auth Credentials
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMfa, setAuthMfa] = useState("");
  const [showMfaChallenge, setShowMfaChallenge] = useState(false);

  // Permission Scope Consent Checklist
  const [permissionsConsent, setPermissionsConsent] = useState({
    balances: true,
    transactions: true,
    statements: true,
    payments: false,
  });

  // Account Discovery Selected Checks
  const [discoveredAccounts, setDiscoveredAccounts] = useState<Array<{ id: string; name: string; balance: number; selected: boolean }>>([]);

  // Synchronization Loader Logs
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [isSyncingWizard, setIsSyncingWizard] = useState(false);

  // Connected Accounts Actions Local States
  const [isSyncingMap, setIsSyncingMap] = useState<Record<string, boolean>>({});
  const [renamingAccount, setRenamingAccount] = useState<{ type: "bank" | "gateway" | "wallet"; id: string; name: string } | null>(null);
  const [renameInput, setRenameInput] = useState("");
  const [managingPermissionsAccount, setManagingPermissionsAccount] = useState<{ type: "bank" | "gateway" | "wallet"; id: string; name: string; permissions?: any } | null>(null);
  const [viewingDetailsAccount, setViewingDetailsAccount] = useState<{ type: "bank" | "gateway" | "wallet"; id: string; details: any } | null>(null);
  const [confirmingDisconnectAccount, setConfirmingDisconnectAccount] = useState<{ type: "bank" | "gateway" | "wallet"; id: string; name: string } | null>(null);

  // Multi-Currency Transfers States
  const [fromWalletId, setFromWalletId] = useState("wal-1");
  const [toWalletId, setToWalletId] = useState("wal-2");
  const [exchangeAmount, setExchangeAmount] = useState("");
  const [isConverting, setIsConverting] = useState(false);

  // Supplier Payments States
  const [paymentType, setPaymentType] = useState<"supplier" | "payroll" | "refund">("supplier");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentCurrency, setPaymentCurrency] = useState("USD");
  const [paymentRecipient, setPaymentRecipient] = useState("");
  const [paymentSourceType, setPaymentSourceType] = useState<"bank" | "wallet">("bank");
  const [paymentSourceId, setPaymentSourceId] = useState("bc-1");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Integrations States
  const [newGatewayName, setNewGatewayName] = useState("");
  const [newGatewayEnv, setNewGatewayEnv] = useState<"sandbox" | "live">("sandbox");
  const [newGatewayCreds, setNewGatewayCreds] = useState<"API Key" | "OAuth" | "Token">("API Key");
  const [isLinkingGateway, setIsLinkingGateway] = useState(false);

  // Security center states
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [approvalLimit, setApprovalLimit] = useState("10000");
  const [autoSettle, setAutoSettle] = useState(true);

  // Reconciliation interactive states
  const [matchedLedgerTxId, setMatchedLedgerTxId] = useState("");
  const [activeReconciliationTx, setActiveReconciliationTx] = useState<BankTransaction | null>(null);

  // Finity Assistant Context Widget States
  const [agentTyping, setAgentTyping] = useState(false);
  const [agentResponse, setAgentResponse] = useState<string | null>(null);
  const [agentQuery, setAgentQuery] = useState("");

  // Extract core state collections, fallback if undefined
  const bankConnections = state.bankConnections || [];
  const wallets = state.wallets || [];
  const gateways = state.paymentGateways || [];
  const activePayments = state.activePayments || [];
  const exchangeRates = state.exchangeRates || { "USD": 1.0, "EUR": 1.08, "GBP": 1.28 };
  const transactions = state.transactions || [];

  const hasNoFinancialConnections = bankConnections.length === 0 && wallets.length === 0 && gateways.length === 0;

  // Active bank object
  const activeBank = useMemo(() => {
    return bankConnections.find(b => b.id === selectedBankId) || bankConnections[0];
  }, [bankConnections, selectedBankId]);

  // Toast Helper
  const triggerToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ----------------------------------------------------
  // Unified Data Computations
  // ----------------------------------------------------
  const financialTotals = useMemo(() => {
    // Total cash in bank checking/savings
    const totalBankBalance = bankConnections.reduce((sum, b) => sum + b.balance, 0);
    // Total cash in multi-currency wallets converted to USD
    const totalWalletBalance = wallets.reduce((sum, w) => {
      const rate = exchangeRates[w.currency] || 1.0;
      return sum + (w.balance * rate);
    }, 0);
    const liquidCash = totalBankBalance + totalWalletBalance;

    // Unreconciled transactions across all active bank connections
    const totalUnreconciled = bankConnections.reduce((sum, b) => {
      return sum + b.transactions.filter(t => !t.reconciled).length;
    }, 0);

    // Compute Net Cashflow from Transaction History (Last 30 days)
    const incomeTotal = transactions.filter(t => t.type === "income" && t.status === "posted").reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const expenseTotal = transactions.filter(t => t.type === "expense" && t.status === "posted").reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const netCashflow = incomeTotal - expenseTotal;

    // Daily operational burn rate estimate (Rent + Salaries + Utilities)
    const rentExpenses = transactions.filter(t => t.category === "Rent").reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const salaryExpenses = transactions.filter(t => t.category === "Salaries").reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const softwareExpenses = transactions.filter(t => t.category === "Infrastructure" || t.category === "Software").reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const baseMonthlyBurn = rentExpenses + salaryExpenses + softwareExpenses || 9200;
    const dailyBurnRate = baseMonthlyBurn / 30;
    const cashRunwayDays = dailyBurnRate > 0 ? Math.round(liquidCash / dailyBurnRate) : 365;

    return {
      liquidCash,
      totalBankBalance,
      totalWalletBalance,
      totalUnreconciled,
      incomeTotal,
      expenseTotal,
      netCashflow,
      cashRunwayDays,
      monthlyBurn: baseMonthlyBurn
    };
  }, [bankConnections, wallets, exchangeRates, transactions]);

  // Combined Bank Feed Transactions for Unified Table
  const allBankTransactions = useMemo(() => {
    const list: { bankId: string; bankName: string; tx: BankTransaction }[] = [];
    bankConnections.forEach(b => {
      b.transactions.forEach(t => {
        list.push({
          bankId: b.id,
          bankName: b.bankName,
          tx: t
        });
      });
    });
    // Sort chronologically (newest first)
    return list.sort((a, b) => new Date(b.tx.date).getTime() - new Date(a.tx.date).getTime());
  }, [bankConnections]);

  // Filtered transaction list
  const filteredBankTransactions = useMemo(() => {
    return allBankTransactions.filter(item => {
      const matchSearch = item.tx.description.toLowerCase().includes(txSearch.toLowerCase()) ||
                          item.bankName.toLowerCase().includes(txSearch.toLowerCase());
      const matchType = txTypeFilter === "all" ||
                        (txTypeFilter === "deposit" && item.tx.amount > 0) ||
                        (txTypeFilter === "withdrawal" && item.tx.amount < 0);
      const matchAccount = txAccountFilter === "all" || item.bankId === txAccountFilter;

      return matchSearch && matchType && matchAccount;
    });
  }, [allBankTransactions, txSearch, txTypeFilter, txAccountFilter]);

  // Chart Data for Cash Trend
  const cashTrendChartData = useMemo(() => {
    // Generate simple cumulative data point timeline based on transaction seed history
    return [
      { date: "06-01", CashPosition: 40000, Inflow: 50000, Outflow: 0 },
      { date: "06-10", CashPosition: 38000, Inflow: 0, Outflow: 2000 },
      { date: "06-18", CashPosition: 53000, Inflow: 15000, Outflow: 0 },
      { date: "06-25", CashPosition: 63000, Inflow: 10000, Outflow: 0 },
      { date: "06-28", CashPosition: 57000, Inflow: 0, Outflow: 6000 },
      { date: "07-01", CashPosition: 55000, Inflow: 0, Outflow: 2000 },
      { date: "07-02", CashPosition: 53800, Inflow: 0, Outflow: 1200 },
      { date: "07-08", CashPosition: 195750, Inflow: 145000, Outflow: 3050 }, // incorporates SVB + checking seeds
    ];
  }, []);

  // Sync state defaults
  useEffect(() => {
    if (bankConnections.length > 0 && !selectedBankId) {
      setSelectedBankId(bankConnections[0].id);
    }
    if (wallets.length > 0 && !fromWalletId) {
      setFromWalletId(wallets[0].id);
      setToWalletId(wallets[1]?.id || wallets[0].id);
    }
  }, [bankConnections, wallets]);

  // ----------------------------------------------------
  // Handler Submissions
  // ----------------------------------------------------

  const handleSyncBankFeeds = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      triggerToast(`${activeBank?.bankName || "Chase"} feeds synchronized. Ledgers matches perfectly.`, "success");
    }, 1500);
  };

  const handleConnectBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBankName || !newBankAccNum) {
      triggerToast("Please provide bank name and account coordinates.", "error");
      return;
    }

    setIsLinkingBank(true);
    try {
      const res = await fetch("/api/payments/connect-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName: selectedBankName,
          accountNumber: newBankAccNum,
          balance: Number(newBankBalance),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onStateUpdate(data.state);
        triggerToast(`Secure open-banking token verified. Linked ${selectedBankName} successfully!`, "success");
        // Reset wizard
        setConnectStep(1);
        setSelectedBankName("");
        setNewBankAccNum("");
        setActiveTab("accounts");
      } else {
        triggerToast(data.error || "Failed to establish bank connection", "error");
      }
    } catch (err: any) {
      triggerToast("Plaid handshake error: " + err.message, "error");
    } finally {
      setIsLinkingBank(false);
    }
  };

  const handleWalletTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exchangeAmount || Number(exchangeAmount) <= 0) {
      triggerToast("Please input a valid transfer amount.", "error");
      return;
    }
    if (fromWalletId === toWalletId) {
      triggerToast("Source and target wallets must be distinct.", "error");
      return;
    }

    setIsConverting(true);
    try {
      const res = await fetch("/api/payments/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromWalletId,
          toWalletId,
          amount: Number(exchangeAmount),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onStateUpdate(data.state);
        triggerToast(`Converted & transferred ${exchangeAmount} successfully.`, "success");
        setExchangeAmount("");
        setActiveTab("accounts");
      } else {
        triggerToast(data.error || "Wallet transfer rejected.", "error");
      }
    } catch (err: any) {
      triggerToast("Conversion error: " + err.message, "error");
    } finally {
      setIsConverting(false);
    }
  };

  const handleDisbursementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentAmount || !paymentRecipient || !paymentSourceId) {
      triggerToast("Please fill out all disbursement parameters.", "error");
      return;
    }

    setIsSubmittingPayment(true);
    // Estimate a smart routing route
    const amountNum = Number(paymentAmount);
    const routingPath = paymentSourceType === "wallet" 
      ? "Direct Deposit via Stripe Treasury" 
      : amountNum > 5000 
        ? "FedWire High-Value Settlement" 
        : "Optimized NACHA Standard ACH";
    
    const settlementTime = paymentSourceType === "wallet" ? "Instant" : amountNum > 5000 ? "Same-Day Wire" : "1-2 Business Days";

    try {
      const res = await fetch("/api/payments/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: paymentType,
          amount: amountNum,
          currency: paymentCurrency,
          recipientName: paymentRecipient,
          sourceType: paymentSourceType,
          sourceId: paymentSourceId,
          routingPath,
          settlementTime
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onStateUpdate(data.state);
        triggerToast(`Disbursed ${paymentCurrency} ${amountNum.toLocaleString()} to ${paymentRecipient}. Ledger synchronized.`, "success");
        setPaymentAmount("");
        setPaymentRecipient("");
        setActiveTab("overview");
      } else {
        triggerToast(data.error || "Disbursement failed.", "error");
      }
    } catch (err: any) {
      triggerToast("Disbursement routing error: " + err.message, "error");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleIntegrateGatewaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGatewayName) {
      triggerToast("Please provide gateway provider name.", "error");
      return;
    }

    setIsLinkingGateway(true);
    try {
      const res = await fetch("/api/payments/gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGatewayName,
          environment: newGatewayEnv,
          credentialsType: newGatewayCreds,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onStateUpdate(data.state);
        triggerToast(`Gateway integration successfully active for ${newGatewayName}!`, "success");
        setNewGatewayName("");
        setActiveTab("integrations");
      } else {
        triggerToast(data.error || "Integration mapping failed.", "error");
      }
    } catch (err: any) {
      triggerToast("API Connector configuration error: " + err.message, "error");
    } finally {
      setIsLinkingGateway(false);
    }
  };

  const handleFinancialWizardSubmit = async (finalSubAccounts?: any[]) => {
    setIsLinkingBank(true);
    try {
      let body: any = { type: wizardType };
      if (wizardType === "bank") {
        body.name = selectedBankName;
        body.selectedSubAccounts = finalSubAccounts || discoveredAccounts.filter(a => a.selected).map(a => ({
          nickname: a.name,
          type: a.name.toLowerCase().includes("savings") ? "savings" : "checking",
          accountNumber: `•••• ${Math.floor(1000 + Math.random() * 9000)}`,
          balance: a.balance
        }));
      } else if (wizardType === "gateway") {
        body.name = selectedBankName;
        body.environment = "sandbox";
        body.credentialsType = "OAuth";
      } else if (wizardType === "wallet") {
        body.name = selectedBankName;
        body.currency = COUNTRIES.find(c => c.id === selectedCountry)?.currency || "USD";
        body.balance = Number(newBankBalance) || 5000;
        body.provider = "Finity Core";
      }

      const res = await fetch("/api/payments/connect-financial-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        onStateUpdate(data.state);
        triggerToast(`Successfully connected and registered ${selectedBankName}!`, "success");
        setConnectStep(7); // success step!
      } else {
        triggerToast(data.error || "Failed to register connection.", "error");
        setConnectStep(5); // back to parameter page
      }
    } catch (err: any) {
      triggerToast("Connection handshake error: " + err.message, "error");
      setConnectStep(5);
    } finally {
      setIsLinkingBank(false);
    }
  };

  const handleProceedToSync = () => {
    // Collect checked sub-accounts from Step 5
    const finalSubAccounts = discoveredAccounts.filter(a => a.selected).map(a => ({
      nickname: a.name,
      type: a.name.toLowerCase().includes("savings") ? "savings" : "checking",
      accountNumber: `•••• ${Math.floor(1000 + Math.random() * 9000)}`,
      balance: a.balance
    }));

    if (wizardType === "bank" && finalSubAccounts.length === 0) {
      triggerToast("Please select at least one sub-account to connect.", "error");
      return;
    }

    setConnectStep(6);
    setSyncProgress(0);
    setSyncLogs([]);
    setIsSyncingWizard(true);

    const logs = [
      `Establishing cryptographically secure TLS 1.3 session with ${selectedBankName} API...`,
      "Exchanging Open-Banking consumer tokens (OAuth Link Handshake)...",
      "Retrieving authorized permission scopes and account metadata...",
      "Fetching 30-day historical transaction ledger logs...",
      "Parsing transaction categorizations via Finity NLU engine...",
      "Injecting double-entry ledger journals into Chart of Accounts...",
      "Active real-time websocket feed sync stream established successfully!"
    ];

    let currentLogIndex = 0;
    const interval = setInterval(async () => {
      setSyncProgress((prev) => {
        const nextProgress = prev + 5;
        if (nextProgress >= 100) {
          clearInterval(interval);
          setIsSyncingWizard(false);
          // Now save the connections on the backend
          handleFinancialWizardSubmit(finalSubAccounts);
          return 100;
        }
        
        // Add logs progressively
        if (nextProgress % 15 === 0 && currentLogIndex < logs.length) {
          setSyncLogs((current) => [...current, logs[currentLogIndex]]);
          currentLogIndex++;
        }

        return nextProgress;
      });
    }, 150);
  };

  const handleSyncAccount = async (type: "bank" | "gateway" | "wallet", id: string, name: string) => {
    setIsSyncingMap(prev => ({ ...prev, [id]: true }));
    try {
      const res = await fetch("/api/payments/sync-financial-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id })
      });
      const data = await res.json();
      if (res.ok) {
        onStateUpdate(data.state);
        triggerToast(`Live sync completed for ${name}. Ledger balances updated.`, "success");
      } else {
        triggerToast(data.error || "Sync failed.", "error");
      }
    } catch (err: any) {
      triggerToast("Sync API error: " + err.message, "error");
    } finally {
      setIsSyncingMap(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleRenameAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingAccount || !renameInput.trim()) return;
    try {
      const res = await fetch("/api/payments/rename-financial-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: renamingAccount.type,
          id: renamingAccount.id,
          newName: renameInput
        })
      });
      const data = await res.json();
      if (res.ok) {
        onStateUpdate(data.state);
        triggerToast(`Nicknamed successfully to "${renameInput}"`, "success");
        setRenamingAccount(null);
        setRenameInput("");
      } else {
        triggerToast(data.error || "Rename failed.", "error");
      }
    } catch (err: any) {
      triggerToast("Rename API error: " + err.message, "error");
    }
  };

  const handleSavePermissions = async (id: string, updatedPerms: any) => {
    try {
      const res = await fetch("/api/payments/update-bank-permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          permissions: updatedPerms
        })
      });
      const data = await res.json();
      if (res.ok) {
        onStateUpdate(data.state);
        triggerToast(`Connection scopes saved successfully.`, "success");
        setManagingPermissionsAccount(null);
      } else {
        triggerToast(data.error || "Failed to update permissions.", "error");
      }
    } catch (err: any) {
      triggerToast("Permissions API error: " + err.message, "error");
    }
  };

  const handleDisconnectAccountSubmit = async () => {
    if (!confirmingDisconnectAccount) return;
    try {
      const res = await fetch("/api/payments/disconnect-financial-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: confirmingDisconnectAccount.type,
          id: confirmingDisconnectAccount.id
        })
      });
      const data = await res.json();
      if (res.ok) {
        onStateUpdate(data.state);
        triggerToast(`Disconnected "${confirmingDisconnectAccount.name}" successfully. Open banking links revoked.`, "success");
        setConfirmingDisconnectAccount(null);
      } else {
        triggerToast(data.error || "Failed to disconnect.", "error");
      }
    } catch (err: any) {
      triggerToast("Disconnection API error: " + err.message, "error");
    }
  };

  const handleClearAllConnections = async () => {
    if (!window.confirm("Are you sure you want to completely clear all financial connections to test the first-time onboarding empty state?")) {
      return;
    }
    try {
      const res = await fetch("/api/payments/clear-all-connections", {
        method: "POST"
      });
      const data = await res.json();
      if (res.ok) {
        onStateUpdate(data.state);
        triggerToast("Cleared all financial account connections successfully!", "success");
        setActiveTab("overview");
      } else {
        triggerToast(data.error || "Clear failed.", "error");
      }
    } catch (err: any) {
      triggerToast("Clear API error: " + err.message, "error");
    }
  };

  const handleApproveMatchReconciliation = (bankTxId: string, ledgerTxId: string) => {
    // Simulate real database reconciliation hook
    triggerToast("Finity AI successfully linked bank feed item to the general ledger!", "success");
    // Update internal reconciliation lists
    const updatedConnections = bankConnections.map(b => {
      return {
        ...b,
        transactions: b.transactions.map(t => {
          if (t.id === bankTxId) {
            return { ...t, reconciled: true };
          }
          return t;
        })
      };
    });
    onStateUpdate({
      ...state,
      bankConnections: updatedConnections
    });
    setActiveReconciliationTx(null);
    setMatchedLedgerTxId("");
  };

  // ----------------------------------------------------
  // Finity Agent Instant Advisor Simulations
  // ----------------------------------------------------
  const handleAskAgentPredefined = (question: string) => {
    setAgentTyping(true);
    setAgentResponse(null);
    setAgentQuery(question);

    setTimeout(() => {
      setAgentTyping(false);
      if (question.includes("runway") || question.includes("Runway")) {
        setAgentResponse(
          `### Finity AI Treasury Advisor — Cash Runway Report\n\n` +
          `Based on current consolidated cash balances of **$${financialTotals.liquidCash.toLocaleString(undefined, { maximumFractionDigits: 0 })}** and your monthly overhead burn rate of **$${financialTotals.monthlyBurn.toLocaleString()}**:\n\n` +
          `*   **Cash Runway**: Approximately **${financialTotals.cashRunwayDays} days** (~${Math.round(financialTotals.cashRunwayDays / 30)} months).\n` +
          `*   **Integrity Symmetries**: Your open-banking checking feed corresponds to the General Ledger Cash account with 100% precision.\n` +
          `*   **Strategic Advice**: You have a strong cushion. We recommend holding $15,000 of cash reserves in your high-yield multi-currency wallet to capture EUR FX advantages.`
        );
      } else if (question.includes("afford") || question.includes("purchase")) {
        setAgentResponse(
          `### Finity AI Advisory — Capital Affordability Analysis\n\n` +
          `You asked whether you can afford a **$25,000 capital purchase**:\n\n` +
          `*   **Liquidity Clearance**: YES. Cash position is **$${financialTotals.liquidCash.toLocaleString()}**, leaving **$${(financialTotals.liquidCash - 25000).toLocaleString()}** post-transaction.\n` +
          `*   **Runway Impact**: Your runway will decrease from **${financialTotals.cashRunwayDays} days** to **${Math.round((financialTotals.liquidCash - 25000) / (financialTotals.monthlyBurn / 30))} days**.\n` +
          `*   **Receivables Factor**: We have **$${(state.invoices?.filter(i => i.status === "sent" || i.status === "overdue").reduce((sum, i) => sum + i.balanceDue, 0) || 0).toLocaleString()}** in short-term receivables settling within 20 days. This cushions the purchase entirely.`
        );
      } else if (question.includes("matching") || question.includes("reconcile")) {
        setAgentResponse(
          `### Finity AI Auditor — Automated Reconciliation Matches\n\n` +
          `I have matched **3 bank feed transactions** to open general ledger journal entries:\n\n` +
          `1.  **AWS Billing ($1,200)** match proposed to **Bill #BILL-AWS-9021** (99% confidence score based on amount/date).\n` +
          `2.  **Rent Space ($2,000)** matched to General Ledger Rent Expense entry.\n` +
          `3.  **Card deposit ($2,500)** match proposed to **Invoice #INV-2026-001** (Paid state confirmed).\n\n` +
          `*Action recommended*: Go to the **Reconciliation** tab to bulk authorize with one click.`
        );
      } else {
        setAgentResponse(
          `### Finity Financial Assistant\n\n` +
          `Finity AI Banking Agent is fully operational. Verified with SOC-2 client credentials on port 3000.\n\n` +
          `*   **Consolidated Balance**: $${financialTotals.liquidCash.toLocaleString()}\n` +
          `*   **Connected Bank Feeds**: ${bankConnections.length} accounts\n` +
          `*   **Active Gateway Status**: 2 operational, 1 attention required (Adyen).`
        );
      }
    }, 1200);
  };

  return (
    <div className="space-y-6" id="finity-banking-root">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold ${
              toastMessage.type === "success" 
                ? "bg-emerald-950/90 border-emerald-800 text-emerald-300" 
                : "bg-rose-950/90 border-rose-800 text-rose-300"
            }`}
            id="banking-toast"
          >
            {toastMessage.type === "success" ? <CheckCircle2 size={14} className="text-emerald-400" /> : <AlertCircle size={14} className="text-rose-400" />}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Stat Ring & Sync */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden text-slate-100" id="banking-header-block">
        <div className="absolute w-[400px] h-[400px] bg-brand-gold/5 blur-[100px] -right-20 -top-20 pointer-events-none" />
        <div className="absolute w-[300px] h-[300px] bg-brand-primary-light/5 blur-[80px] -left-20 -bottom-20 pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1">
            <span className="font-mono text-[9px] font-bold text-brand-gold uppercase tracking-widest bg-brand-gold-light border border-brand-gold/10 px-3 py-1 rounded-full">
              Finity Multi-Ledger Treasury OS
            </span>
            <h2 className="text-2xl font-black font-sans tracking-tight text-white mt-1.5">Payments & Banking Engine</h2>
            <p className="text-xs text-slate-400 font-sans max-w-xl">
              Consolidated cash position management, multi-currency ledger conversions, smart routing B2B disbursements, and real-time open banking reconciliations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSyncBankFeeds}
              disabled={isSyncing}
              className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/50 text-slate-200 hover:bg-slate-800 text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50"
              id="sync-bank-feeds-btn"
            >
              <RefreshCw size={13} className={`text-brand-gold ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "Interrogating Bank Cores..." : "Sync Feeds Now"}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("connect");
                setConnectStep(1);
              }}
              className="px-4 py-2.5 rounded-xl bg-brand-gold text-slate-950 font-bold text-xs flex items-center gap-1.5 hover:bg-brand-gold-dark shadow-md active:scale-95 transition"
              id="header-connect-bank-btn"
            >
              <Plus size={14} className="stroke-[3px]" />
              <span>Connect Bank Feed</span>
            </button>
          </div>
        </div>

        {/* Core Financial Stat Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-6 border-t border-slate-800" id="banking-core-stats">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Total Liquid Position</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-white font-mono">
                ${financialTotals.liquidCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] font-mono font-bold text-brand-gold">USD</span>
            </div>
            <p className="text-[9px] text-slate-500 font-mono">Commercial Bank + Wallets</p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Unreconciled Feeds</span>
            <div className="flex items-center gap-1.5">
              <span className={`text-xl font-black font-mono ${financialTotals.totalUnreconciled > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                {financialTotals.totalUnreconciled}
              </span>
              {financialTotals.totalUnreconciled > 0 ? (
                <span className="text-[9px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded-sm font-mono font-bold">ATTENTION</span>
              ) : (
                <span className="text-[9px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-1.5 py-0.5 rounded-sm font-mono font-bold">BALANCED</span>
              )}
            </div>
            <p className="text-[9px] text-slate-500 font-mono">Requires double-entry link</p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Net Monthly Cashflow</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-xl font-black font-mono ${financialTotals.netCashflow >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {financialTotals.netCashflow >= 0 ? "+" : "-"}
                ${Math.abs(financialTotals.netCashflow).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[10px] text-slate-500 font-sans">inflow</span>
            </div>
            <p className="text-[9px] text-slate-500 font-mono">Deposits vs Withdrawals</p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Finity Cash Runway</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-brand-gold font-mono">{financialTotals.cashRunwayDays}</span>
              <span className="text-xs text-slate-400 font-sans font-medium">Days</span>
            </div>
            <p className="text-[9px] text-slate-500 font-mono">Overhead offset metrics</p>
          </div>
        </div>
      </div>

      {/* Internal Workspace Tabs Nav Bar (10 sub-sections) */}
      <div className="overflow-x-auto pb-1" id="banking-tabs-scroller">
        <div className="flex items-center gap-1.5 border-b border-border-subtle p-1 min-w-max bg-card-bg/60 rounded-2xl border">
          {[
            { id: "overview", label: "Overview", icon: Layers },
            { id: "connect", label: "Connect Bank", icon: Link2 },
            { id: "accounts", label: "Accounts & Wallets", icon: Building },
            { id: "transactions", label: "Bank Feeds", icon: History },
            { id: "transfers", label: "FX & Transfers", icon: ArrowLeftRight },
            { id: "payments", label: "Supplier Payments", icon: Send },
            { id: "reconciliation", label: "Reconciliation", icon: CheckCircle2 },
            { id: "cash", label: "Cash Management", icon: TrendingUp },
            { id: "security", label: "Security Center", icon: Shield },
            { id: "integrations", label: "Integrations & APIs", icon: Sliders },
            { id: "kra-compliance", label: "🇰🇪 KRA Tax", icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all relative shrink-0 ${
                  isSel 
                    ? "bg-brand-primary text-brand-gold shadow-sm" 
                    : "text-text-muted hover:text-text-main hover:bg-hover-bg"
                }`}
                id={`banking-tab-trigger-${tab.id}`}
              >
                <Icon size={14} className={isSel ? "text-brand-gold" : "text-text-muted"} />
                <span>{tab.label}</span>
                {tab.id === "reconciliation" && financialTotals.totalUnreconciled > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping absolute top-2 right-2" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ----------------------------------------------------
          TAB PANELS SWITCHER
         ---------------------------------------------------- */}
      <div className="space-y-6" id="banking-tab-viewport">
        
        {/* ==================== PAGE 1: BANKING OVERVIEW ==================== */}
        {activeTab === "overview" && hasNoFinancialConnections && (
          <div className="max-w-4xl mx-auto py-12 px-6 text-center space-y-12" id="empty-state-container">
            <div className="space-y-4 animate-fade-in">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-brand-gold/10 border border-brand-gold/20 text-brand-gold mb-2 shadow-xs">
                <Shield size={32} />
              </div>
              <h2 className="font-sans font-black text-white text-3xl tracking-tight">
                Connect Your Financial Accounts
              </h2>
              <p className="text-sm text-text-muted max-w-2xl mx-auto leading-relaxed">
                Securely connect your bank accounts, payment providers, and digital wallets to automatically sync your financial data with Finity.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              {/* Card 1: Bank Accounts */}
              <div className="bg-card-bg border border-border-subtle rounded-3xl p-6 flex flex-col justify-between hover:border-brand-gold/30 hover:shadow-lg transition duration-300 relative group overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-gold/2 rounded-bl-full pointer-events-none group-hover:bg-brand-gold/5 transition duration-300" />
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 border border-brand-gold/15 flex items-center justify-center text-brand-gold mb-6 shadow-xs">
                    <Building size={22} />
                  </div>
                  <h3 className="font-sans font-extrabold text-white text-lg tracking-tight mb-2">
                    Bank Accounts
                  </h3>
                  <p className="text-xs text-text-muted leading-relaxed mb-6">
                    Establish secure links with traditional banks like Chase, Wells Fargo, SVB, or Barclays to synchronize transaction statements and reserves automatically.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setWizardType("bank");
                    setConnectStep(2); // directly jump to search/institution
                    setSelectedBankName("");
                    setNewBankAccNum("");
                    setActiveTab("connect");
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-brand-gold hover:bg-brand-gold-dark text-slate-950 font-sans font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer"
                >
                  <span>Connect Bank</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              {/* Card 2: Payment Providers */}
              <div className="bg-card-bg border border-border-subtle rounded-3xl p-6 flex flex-col justify-between hover:border-brand-gold/30 hover:shadow-lg transition duration-300 relative group overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-gold/2 rounded-bl-full pointer-events-none group-hover:bg-brand-gold/5 transition duration-300" />
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 border border-brand-gold/15 flex items-center justify-center text-brand-gold mb-6 shadow-xs">
                    <CreditCard size={22} />
                  </div>
                  <h3 className="font-sans font-extrabold text-white text-lg tracking-tight mb-2">
                    Payment Providers
                  </h3>
                  <p className="text-xs text-text-muted leading-relaxed mb-6">
                    Connect merchant accounts like Stripe, PayPal, Square, or Adyen. Import raw processing fees, payout timelines, and consumer invoice logs.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setWizardType("gateway");
                    setConnectStep(2); // select gateway
                    setSelectedBankName("");
                    setActiveTab("connect");
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-brand-gold border border-brand-gold/30 hover:border-brand-gold font-sans font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer"
                >
                  <span>Connect Provider</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              {/* Card 3: Digital Wallets */}
              <div className="bg-card-bg border border-border-subtle rounded-3xl p-6 flex flex-col justify-between hover:border-brand-gold/30 hover:shadow-lg transition duration-300 relative group overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-gold/2 rounded-bl-full pointer-events-none group-hover:bg-brand-gold/5 transition duration-300" />
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 border border-brand-gold/15 flex items-center justify-center text-brand-gold mb-6 shadow-xs">
                    <Wallet size={22} />
                  </div>
                  <h3 className="font-sans font-extrabold text-white text-lg tracking-tight mb-2">
                    Digital Wallets
                  </h3>
                  <p className="text-xs text-text-muted leading-relaxed mb-6">
                    Provision native Finity Core or third-party digital operating wallets (USD, EUR, GBP) to handle rapid treasury allocations and global vendor disbursements.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setWizardType("wallet");
                    setConnectStep(2); // select wallet provider
                    setSelectedBankName("");
                    setActiveTab("connect");
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-brand-gold border border-brand-gold/30 hover:border-brand-gold font-sans font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer"
                >
                  <span>Connect Wallet</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>

            <div className="p-5 bg-hover-bg/30 border border-border-subtle rounded-2xl max-w-xl mx-auto flex items-center justify-center gap-3 text-xs text-text-muted">
              <ShieldCheck size={16} className="text-brand-emerald shrink-0" />
              <span>
                Finity employs enterprise-grade 256-bit AES encryption. We never request or store passwords.
              </span>
            </div>
          </div>
        )}

        {activeTab === "overview" && !hasNoFinancialConnections && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="page-banking-overview">
            
            {/* Cash Positions Trend Chart */}
            <div className="lg:col-span-8 bg-card-bg border border-border-subtle rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-sans font-bold text-text-main text-sm">Finity Cash Liquidity Trend</h3>
                  <p className="text-[11px] text-text-muted font-sans mt-0.5">Consolidated cash holdings over simulated reporting periods</p>
                </div>
                <span className="text-[10px] font-mono bg-hover-bg px-2.5 py-1 rounded-md text-text-muted">60-DAY WINDOW</span>
              </div>

              <div className="h-64 w-full" id="cash-trend-chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashTrendChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#1e293b", borderColor: "#475569", borderRadius: "12px" }} 
                      labelStyle={{ color: "#94a3b8", fontFamily: "monospace", fontSize: "10px" }}
                      itemStyle={{ color: "#ffffff", fontFamily: "sans-serif", fontSize: "12px" }}
                    />
                    <Area type="monotone" dataKey="CashPosition" name="Cash Asset Value ($)" stroke="#D4AF37" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCash)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Actions & Feed Status Panel */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Connected Feeds Quick Cards */}
              <div className="bg-card-bg border border-border-subtle rounded-3xl p-5 shadow-xs space-y-3.5">
                <h3 className="text-[10px] uppercase font-mono tracking-wider font-bold text-text-muted">
                  Feed Connection Health
                </h3>
                
                <div className="space-y-2.5" id="mini-feed-status-list">
                  {bankConnections.map((b) => (
                    <div 
                      key={b.id} 
                      onClick={() => {
                        setSelectedBankId(b.id);
                        setActiveTab("transactions");
                      }}
                      className="p-3 bg-hover-bg/40 border border-border-subtle/50 rounded-xl flex items-center justify-between hover:bg-hover-bg transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center shrink-0 border border-brand-primary/5">
                          <Building size={14} className="text-brand-primary" />
                        </div>
                        <div>
                          <h4 className="font-sans font-bold text-text-main text-xs">{b.bankName}</h4>
                          <span className="font-mono text-[9px] text-text-muted block">{b.accountNumber}</span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <span className="font-mono text-xs font-bold text-text-main block">${b.balance.toLocaleString()}</span>
                        <span className="text-[9px] font-mono text-brand-emerald flex items-center gap-0.5 justify-end">
                          <span className="w-1 h-1 rounded-full bg-brand-emerald animate-pulse" />
                          Live Sync
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Finity Intelligent Analyst Advisor Prompt */}
              <div className="bg-brand-primary-light border border-brand-gold/15 rounded-3xl p-5 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/5 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={16} className="text-brand-gold animate-pulse" />
                  <h4 className="font-sans font-bold text-brand-primary text-xs tracking-tight">Finity AI Cashflow Advisor</h4>
                </div>
                
                <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                  Instantly verify business liquidity health, calculate cash runway against upcoming payroll, or check for tax buffer adequacy.
                </p>

                <div className="grid grid-cols-1 gap-2 mt-4" id="overview-advisor-prompts">
                  <button 
                    onClick={() => {
                      setActiveTab("cash");
                      handleAskAgentPredefined("Analyze consolidated cash runway against monthly burn.");
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-white/75 hover:bg-white border border-brand-gold/15 text-[10px] font-bold text-slate-800 transition flex items-center justify-between"
                  >
                    <span>Analyze consolidated cash runway</span>
                    <ArrowRight size={11} className="text-brand-gold" />
                  </button>

                  <button 
                    onClick={() => {
                      setActiveTab("reconciliation");
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-white/75 hover:bg-white border border-brand-gold/15 text-[10px] font-bold text-slate-800 transition flex items-center justify-between"
                  >
                    <span>Reconcile pending feed items</span>
                    <ArrowRight size={11} className="text-brand-gold" />
                  </button>
                </div>
              </div>

            </div>

            {/* Quick Activity History & Transactions summary */}
            <div className="lg:col-span-12 bg-card-bg border border-border-subtle rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-sans font-bold text-text-main text-sm">Active Treasury Operations Status</h3>
                  <p className="text-[11px] text-text-muted font-sans mt-0.5">Real-time status of outgoing bank transfers and digital payouts</p>
                </div>
                <button onClick={() => setActiveTab("transactions")} className="text-xs text-brand-gold hover:underline font-semibold flex items-center gap-1">
                  <span>View all bank feeds</span>
                  <ArrowUpRight size={12} />
                </button>
              </div>

              <div className="overflow-x-auto" id="recent-payments-table-container">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border-subtle text-[10px] uppercase font-mono text-text-muted">
                      <th className="py-2.5 font-bold">Recipient</th>
                      <th className="py-2.5 font-bold">Type</th>
                      <th className="py-2.5 font-bold">Date Initiated</th>
                      <th className="py-2.5 font-bold">Smart Route</th>
                      <th className="py-2.5 font-bold">Latency Expected</th>
                      <th className="py-2.5 font-bold text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle/40">
                    {activePayments.map((p) => (
                      <tr key={p.id} className="hover:bg-hover-bg/30 transition text-text-main">
                        <td className="py-3 font-semibold">{p.recipientName}</td>
                        <td className="py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${
                            p.type === "payroll" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/15" :
                            p.type === "supplier" ? "bg-amber-500/10 text-amber-400 border border-amber-500/15" :
                            "bg-purple-500/10 text-purple-400 border border-purple-500/15"
                          }`}>
                            {p.type}
                          </span>
                        </td>
                        <td className="py-3 font-mono text-text-muted">{p.date}</td>
                        <td className="py-3 text-text-muted">{p.routingPath}</td>
                        <td className="py-3 font-semibold text-brand-emerald">{p.settlementTime}</td>
                        <td className="py-3 text-right font-mono font-bold">
                          {p.currency === "EUR" ? "€" : p.currency === "GBP" ? "£" : "$"}
                          {p.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {activePayments.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center font-mono text-text-muted">No outbound payments currently active.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

            {/* ==================== PAGE 2: CONNECT BANK ACCOUNT (WIZARD) ==================== */}
        {activeTab === "connect" && (
          <div className="bg-card-bg border border-border-subtle rounded-3xl p-8 max-w-2xl mx-auto shadow-md animate-fade-in" id="page-connect-bank">
            
            {/* Step Wizard Header */}
            <div className="flex items-center justify-between border-b border-border-subtle pb-6 mb-8">
              <div>
                <h3 className="font-sans font-black text-text-main text-base uppercase tracking-wider text-brand-gold">
                  {wizardType === "bank" ? "Link Banking Feed" : wizardType === "gateway" ? "Integrate Payment Provider" : wizardType === "wallet" ? "Provision Digital Wallet" : "Link Financial Account"}
                </h3>
                <p className="text-[11px] text-text-muted font-sans mt-0.5">Secure, 256-bit TLS encrypted OAuth sandboxed connection wizard</p>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-900 px-3.5 py-1.5 rounded-full border border-slate-800">
                <span className="font-mono text-[10px] text-brand-gold font-black uppercase mr-1">Step {connectStep} of 7</span>
                {[1, 2, 3, 4, 5, 6, 7].map((step) => (
                  <div 
                    key={step} 
                    className={`w-4 h-4 rounded-full flex items-center justify-center font-mono text-[8px] font-bold border transition duration-300 ${
                      connectStep === step 
                        ? "bg-brand-gold border-brand-gold text-slate-950 shadow-xs" 
                        : connectStep > step 
                          ? "bg-brand-emerald/10 border-brand-emerald text-brand-emerald" 
                          : "bg-hover-bg/50 border-border-subtle text-text-muted"
                    }`}
                  >
                    {connectStep > step ? "✓" : step}
                  </div>
                ))}
              </div>
            </div>

            {/* STEP 1: CHOOSE CONNECTION TYPE */}
            {connectStep === 1 && (
              <div className="space-y-6 animate-fade-in" id="connect-step-1">
                <span className="text-[10px] font-mono uppercase font-bold text-brand-gold block">Step 1: Choose Financial Asset Class</span>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: "bank", name: "Bank Account", desc: "Link corporate checking & savings accounts via secure, real-time Plaid protocol.", icon: Building, color: "text-brand-gold" },
                    { id: "gateway", name: "Payment Provider", desc: "Sync Stripe, PayPal, Braintree, or Adyen merchant processing balances.", icon: CreditCard, color: "text-brand-gold" },
                    { id: "wallet", name: "Digital Wallet", desc: "Provision multi-currency corporate digital vaults for rapid disbursements.", icon: Wallet, color: "text-brand-gold" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setWizardType(item.id as any)}
                      className={`p-5 rounded-2xl border text-left transition relative flex flex-col justify-between h-48 cursor-pointer ${
                        wizardType === item.id 
                          ? "bg-brand-gold/10 border-brand-gold text-white" 
                          : "bg-hover-bg/30 border-border-subtle hover:bg-hover-bg text-text-muted hover:text-text-main"
                      }`}
                    >
                      {wizardType === item.id && (
                        <span className="absolute top-3 right-3 font-mono text-[8px] font-extrabold uppercase bg-brand-gold text-slate-950 px-2 py-0.5 rounded-full">
                          SELECTED
                        </span>
                      )}
                      <item.icon size={24} className={wizardType === item.id ? "text-brand-gold" : "text-text-muted"} />
                      <div className="mt-4">
                        <h4 className="font-sans font-bold text-text-main text-sm">{item.name}</h4>
                        <p className="text-[11px] text-text-muted font-sans mt-1 leading-relaxed">{item.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex justify-end pt-4 border-t border-border-subtle">
                  <button 
                    onClick={() => {
                      if (!wizardType) {
                        triggerToast("Please select a financial asset class.", "error");
                        return;
                      }
                      setConnectStep(2);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-brand-gold text-slate-950 font-sans font-black text-xs flex items-center gap-1.5 hover:bg-brand-gold-dark shadow-md cursor-pointer"
                  >
                    <span>Proceed to Selection</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: SEARCH & SELECT BANK/GATEWAY/WALLET */}
            {connectStep === 2 && (
              <div className="space-y-6 animate-fade-in" id="connect-step-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase font-bold text-brand-gold">Step 2: Locate Financial Institution</span>
                  
                  {/* Country Select */}
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="bg-slate-900 border border-border-subtle rounded-lg text-[10px] font-mono text-text-main p-1.5 focus:border-brand-gold outline-hidden"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name.toUpperCase()} {c.emoji}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-3.5 top-3.5 text-text-muted" size={14} />
                  <input
                    type="text"
                    value={searchBankQuery}
                    onChange={(e) => setSearchBankQuery(e.target.value)}
                    placeholder={
                      wizardType === "bank" 
                        ? "Search for Equity Bank, KCB, Co-operative Bank, NCBA, Safaricom M-Pesa..." 
                        : wizardType === "gateway" 
                          ? "Search for Stripe, PayPal, Square, Adyen, Braintree..." 
                          : "Search for Finity Pay, Apple Pay, Coinbase, Wise, Revolut..."
                    }
                    className="w-full bg-[#fcfcfd] dark:bg-slate-900 border border-border-subtle rounded-xl py-3 pl-10 pr-4 text-xs text-text-main outline-hidden font-sans focus:border-brand-gold"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(wizardType === "bank" 
                    ? (COUNTRIES.find(c => c.id === selectedCountry)?.banks || [])
                    : wizardType === "gateway"
                    ? [
                        "Stripe Payments", "PayPal Business", "Adyen N.V.", "Braintree Merchant",
                        "Square Core", "Shopify Gateway", "Authorize.Net", "Worldpay"
                      ]
                    : [
                        "Finity Pay Vault", "Apple Pay Corporate", "Google Wallet Business", "Coinbase Treasury",
                        "Wise Operating Wallet", "Revolut Pro", "Payoneer Multi-Currency", "Skrill Enterprise"
                      ]
                  ).filter(b => b.toLowerCase().includes(searchBankQuery.toLowerCase())).map((inst) => (
                    <button
                      key={inst}
                      onClick={() => {
                        setSelectedBankName(inst);
                        setConnectStep(3);
                        // Setup default mock discovered accounts based on selection
                        if (wizardType === "bank") {
                          setDiscoveredAccounts([
                            { id: "sub-1", name: `${inst} Corporate Checking`, balance: 14500.00, selected: true },
                            { id: "sub-2", name: `${inst} Liquidity Savings`, balance: 48000.00, selected: true },
                            { id: "sub-3", name: `${inst} Operational Reserves`, balance: 92000.00, selected: false }
                          ]);
                        }
                      }}
                      className="p-4 rounded-xl border border-border-subtle bg-hover-bg/30 hover:bg-brand-gold/10 hover:border-brand-gold text-center font-sans font-extrabold text-xs text-text-main hover:text-white transition duration-200 cursor-pointer"
                    >
                      {inst}
                    </button>
                  ))}
                </div>

                <div className="flex justify-between pt-4 border-t border-border-subtle">
                  <button 
                    onClick={() => setConnectStep(1)}
                    className="px-4 py-2 rounded-xl bg-hover-bg hover:bg-border-subtle text-text-muted font-semibold text-xs cursor-pointer"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: ESTABLISH SECURE LINK (AUTH CHANNELS) */}
            {connectStep === 3 && (
              <div className="space-y-6 animate-fade-in" id="connect-step-3">
                <span className="text-[10px] font-mono uppercase font-bold text-brand-gold block">Step 3: Direct API Credentials Exchange</span>
                
                <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-start gap-4 text-left">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <Shield size={18} className="text-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-sans font-bold text-white text-xs">Finity Sandbox Link Protocol Active</h4>
                    <p className="text-[11px] text-text-muted leading-relaxed font-sans">
                      Authenticating directly with <strong>{selectedBankName}</strong>. We implement hardware-encrypted OAuth and never access or store credentials.
                    </p>
                  </div>
                </div>

                {!showMfaChallenge ? (
                  <form onSubmit={(e) => { e.preventDefault(); setShowMfaChallenge(true); }} className="space-y-4 text-left">
                    <div>
                      <label className="block text-[10px] font-mono text-text-muted uppercase mb-1">Corporate Username / Client ID</label>
                      <input
                        type="text"
                        required
                        placeholder="username_admin"
                        value={authUsername}
                        onChange={(e) => setAuthUsername(e.target.value)}
                        className="w-full bg-[#fcfcfd] dark:bg-slate-900 border border-border-subtle rounded-xl p-3 text-xs text-text-main focus:border-brand-gold font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-text-muted uppercase mb-1">Access Token / Password</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••••••••••"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="w-full bg-[#fcfcfd] dark:bg-slate-900 border border-border-subtle rounded-xl p-3 text-xs text-text-main focus:border-brand-gold font-sans"
                      />
                    </div>

                    <div className="flex justify-between pt-4 border-t border-border-subtle">
                      <button 
                        type="button"
                        onClick={() => setConnectStep(2)}
                        className="px-4 py-2 rounded-xl bg-hover-bg hover:bg-border-subtle text-text-muted font-semibold text-xs cursor-pointer"
                      >
                        Back
                      </button>
                      <button 
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-brand-gold text-slate-950 font-sans font-black text-xs flex items-center gap-1.5 hover:bg-brand-gold-dark shadow-md cursor-pointer"
                      >
                        <span>Authenticate API Link</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); setShowMfaChallenge(false); setConnectStep(4); }} className="space-y-4 text-left animate-fade-in">
                    <div className="p-4 bg-slate-900 border border-brand-gold/15 rounded-xl">
                      <label className="block text-[10px] font-mono text-brand-gold uppercase mb-2 font-black">Two-Factor Authentication (2FA) Required</label>
                      <p className="text-[10px] text-text-muted mb-4 font-sans">
                        A verification code has been dispatched to your corporate contact device on file.
                      </p>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="e.g. 123456"
                        value={authMfa}
                        onChange={(e) => setAuthMfa(e.target.value)}
                        className="w-full bg-[#fcfcfd] dark:bg-slate-950 border border-brand-gold/30 rounded-xl p-3 text-center tracking-[1em] text-sm font-mono text-white focus:border-brand-gold"
                      />
                    </div>

                    <div className="flex justify-between pt-4 border-t border-border-subtle">
                      <button 
                        type="button"
                        onClick={() => setShowMfaChallenge(false)}
                        className="px-4 py-2 rounded-xl bg-hover-bg hover:bg-border-subtle text-text-muted font-semibold text-xs cursor-pointer"
                      >
                        Back
                      </button>
                      <button 
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-brand-gold text-slate-950 font-sans font-black text-xs flex items-center gap-1.5 hover:bg-brand-gold-dark shadow-md cursor-pointer"
                      >
                        <span>Verify 2FA Token</span>
                        <Check size={13} />
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* STEP 4: PERMISSION REVIEW */}
            {connectStep === 4 && (
              <div className="space-y-6 animate-fade-in text-left" id="connect-step-4">
                <span className="text-[10px] font-mono uppercase font-bold text-brand-gold block">Step 4: Grant Data Access Rights</span>
                
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
                  <h4 className="font-sans font-extrabold text-white text-xs uppercase tracking-wider text-brand-gold">Access Scopes Dispatched</h4>
                  
                  <div className="space-y-3.5">
                    {[
                      { key: "balances", label: "Read account balances", desc: "Retrieve active checking, savings, and loan reserves in real time.", required: true },
                      { key: "transactions", label: "Read historical transactions", desc: "Continuous statements and debit ledger sync from last 30-day index.", required: true },
                      { key: "statements", label: "Import monthly statement sheets", desc: "Fetch PDF statement sheets directly for AI reconciliation matching.", required: true },
                      { key: "payments", label: "Initiate platform payments (Sandbox)", desc: "Enable bulk payment payouts routing. All disbursements require manual confirmation.", required: false },
                    ].map((scope) => (
                      <div key={scope.key} className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id={`scope-${scope.key}`}
                          disabled={scope.required}
                          checked={scope.required || (permissionsConsent as any)[scope.key]}
                          onChange={(e) => setPermissionsConsent(prev => ({ ...prev, [scope.key]: e.target.checked }))}
                          className="mt-1 accent-brand-gold"
                        />
                        <div>
                          <label htmlFor={`scope-${scope.key}`} className="font-sans font-bold text-text-main text-xs flex items-center gap-2">
                            <span>{scope.label}</span>
                            {scope.required && <span className="font-mono text-[8px] bg-slate-800 text-text-muted px-1.5 py-0.5 rounded-full uppercase">REQUIRED</span>}
                          </label>
                          <p className="text-[10px] text-text-muted font-sans mt-0.5 leading-relaxed">{scope.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-border-subtle">
                  <button 
                    onClick={() => setConnectStep(3)}
                    className="px-4 py-2 rounded-xl bg-hover-bg hover:bg-border-subtle text-text-muted font-semibold text-xs cursor-pointer"
                  >
                    Back
                  </button>
                  <button 
                    onClick={() => {
                      if (wizardType === "bank") {
                        setConnectStep(5);
                      } else {
                        // For gateways or wallets, skip step 5 directly to sync step 6!
                        handleProceedToSync();
                      }
                    }}
                    className="px-5 py-2.5 rounded-xl bg-brand-gold text-slate-950 font-sans font-black text-xs flex items-center gap-1.5 hover:bg-brand-gold-dark shadow-md cursor-pointer"
                  >
                    <span>Authorize Scopes</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: ACCOUNT DISCOVERY (ONLY FOR BANKS) */}
            {connectStep === 5 && (
              <div className="space-y-6 animate-fade-in text-left" id="connect-step-5">
                <span className="text-[10px] font-mono uppercase font-bold text-brand-gold block">Step 5: Select Discovered Sub-Accounts</span>
                
                <p className="text-[11px] text-text-muted font-sans leading-relaxed">
                  The following liquid accounts were discovered under credentials on <strong>{selectedBankName}</strong>. Check the boxes of the sub-accounts you wish to link.
                </p>

                <div className="space-y-2">
                  {discoveredAccounts.map((sub, idx) => (
                    <div 
                      key={sub.id} 
                      onClick={() => {
                        setDiscoveredAccounts(prev => prev.map(a => a.id === sub.id ? { ...a, selected: !a.selected } : a));
                      }}
                      className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                        sub.selected 
                          ? "bg-slate-900 border-brand-gold/40 text-white" 
                          : "bg-hover-bg/30 border-border-subtle text-text-muted"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={sub.selected}
                          onChange={() => {}} // handled by click
                          className="accent-brand-gold"
                        />
                        <div>
                          <h5 className="font-sans font-bold text-xs">{sub.name}</h5>
                          <span className="font-mono text-[9px] text-text-muted block">Masked ID: •••• {3342 + idx * 1102}</span>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-text-main">{COUNTRIES.find(c => c.id === selectedCountry)?.symbol || "$"}{sub.balance.toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between pt-4 border-t border-border-subtle">
                  <button 
                    onClick={() => setConnectStep(4)}
                    className="px-4 py-2 rounded-xl bg-hover-bg hover:bg-border-subtle text-text-muted font-semibold text-xs cursor-pointer"
                  >
                    Back
                  </button>
                  <button 
                    onClick={handleProceedToSync}
                    className="px-5 py-2.5 rounded-xl bg-brand-gold text-slate-950 font-sans font-black text-xs flex items-center gap-1.5 hover:bg-brand-gold-dark shadow-md cursor-pointer"
                  >
                    <span>Confirm Sub-Accounts</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 6: REAL-TIME SYNCHRONIZATION LOADER LOGS */}
            {connectStep === 6 && (
              <div className="space-y-6 animate-fade-in text-center py-6" id="connect-step-6">
                <span className="text-[10px] font-mono uppercase font-black text-brand-gold block">Step 6: Real-time Ledger Synchronization</span>
                
                {/* Loader Wheel */}
                <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-900" />
                  <div className="absolute inset-0 rounded-full border-4 border-brand-gold border-t-transparent animate-spin" />
                  <span className="font-mono text-lg font-black text-white">{syncProgress}%</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div className="bg-brand-gold h-full transition-all duration-300" style={{ width: `${syncProgress}%` }} />
                </div>

                {/* Scrolled log box */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 h-44 overflow-y-auto text-left font-mono text-[9px] leading-relaxed text-slate-400 space-y-1.5 scrollbar-thin">
                  <div>[TIMESTAMP: {new Date().toISOString()}] INITIALIZING INTEGRATOR...</div>
                  {syncLogs.map((log, idx) => (
                    <div key={idx} className="text-brand-gold animate-fade-in">
                      ● {log}
                    </div>
                  ))}
                  {isSyncingWizard && <div className="text-white animate-pulse">▋ Syncing active feeds...</div>}
                </div>
              </div>
            )}

            {/* STEP 7: SUCCESS CELEBRATION */}
            {connectStep === 7 && (
              <div className="space-y-6 animate-fade-in text-center py-8" id="connect-step-7">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-emerald/10 border border-brand-emerald/20 text-brand-emerald animate-pulse">
                  <Check size={36} />
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-sans font-black text-white text-2xl tracking-tight">Synchronization Succeeded!</h3>
                  <p className="text-xs text-text-muted font-sans max-w-md mx-auto leading-relaxed">
                    Corporate feeds from <strong>{selectedBankName}</strong> have been cryptographically linked to Finity's dual-entry ledger core.
                  </p>
                </div>

                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl max-w-md mx-auto text-left space-y-1">
                  <div className="text-[10px] font-mono text-slate-400">LEDGER SUMMARY REPORT:</div>
                  <div className="text-[11px] font-sans text-white font-bold">Institution: <span className="font-normal text-slate-300">{selectedBankName}</span></div>
                  <div className="text-[11px] font-sans text-white font-bold">Token ID: <span className="font-mono text-brand-gold font-normal">fit_tok_{Math.floor(100000 + Math.random() * 900000)}</span></div>
                  <div className="text-[11px] font-sans text-white font-bold">Sync Feed Status: <span className="text-brand-emerald">LIVE ACTIVE</span></div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={() => {
                      setConnectStep(1);
                      setWizardType(null);
                      setSelectedBankName("");
                      setNewBankAccNum("");
                      setActiveTab("overview");
                    }}
                    className="px-6 py-3 rounded-xl bg-brand-gold hover:bg-brand-gold-dark text-slate-950 font-sans font-black text-xs flex items-center justify-center gap-1.5 mx-auto shadow-md cursor-pointer active:scale-95 transition"
                  >
                    <span>Enter Financial Workspace</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ==================== PAGE 3: ACCOUNTS & WALLETS ==================== */}
        {activeTab === "accounts" && (
          <div className="space-y-6" id="page-accounts-grid">
            
            {/* Commercial Accounts Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-sans font-bold text-text-main text-sm">Corporate Bank Feed Connections</h3>
                  <p className="text-[11px] text-text-muted font-sans mt-0.5">Commercial banking accounts linking feeds directly to general ledger</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bankConnections.map((b) => (
                  <div key={b.id} className="bg-card-bg border border-border-subtle rounded-3xl p-6 shadow-xs relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/2 rounded-bl-full pointer-events-none" />
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary border border-brand-primary/10">
                          <Building size={18} />
                        </div>
                        <div>
                          <h4 className="font-sans font-bold text-text-main text-sm">{b.bankName}</h4>
                          <span className="font-mono text-[10px] text-text-muted block">CODE: GL-1010 • Account: {b.accountNumber}</span>
                        </div>
                      </div>
                      
                      <span className="font-mono text-sm font-black text-text-main">${b.balance.toLocaleString()}</span>
                    </div>

                    <div className="border-t border-border-subtle/50 mt-5 pt-4 flex items-center justify-between text-[10px] font-mono text-text-muted">
                      <span>SYNCED: {new Date(b.lastSynced).toLocaleString()}</span>
                      <span className="text-brand-emerald font-bold flex items-center gap-0.5">
                        <span className="w-1 h-1 rounded-full bg-brand-emerald animate-pulse" />
                        SECURE PLAID FEED
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Digital Wallets Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-sans font-bold text-text-main text-sm">Multi-Currency Digital Treasury Wallets</h3>
                  <p className="text-[11px] text-text-muted font-sans mt-0.5">Finity Treasury-managed international operating wallets</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="digital-wallets-grid">
                {wallets.map((w) => (
                  <div key={w.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-brand-gold/5 rounded-bl-full pointer-events-none" />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wallet size={15} className="text-brand-gold" />
                        <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">{w.provider}</span>
                      </div>
                      
                      <span className="font-mono text-[10px] font-bold text-brand-gold bg-brand-gold-light border border-brand-gold/15 px-2.5 py-0.5 rounded-full uppercase">
                        {w.currency}
                      </span>
                    </div>

                    <div className="mt-5">
                      <h4 className="font-sans font-bold text-white text-xs">{w.name}</h4>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-lg font-black font-mono">
                          {w.currency === "EUR" ? "€" : w.currency === "GBP" ? "£" : "$"}
                          {w.balance.toLocaleString()}
                        </span>
                        {w.currency !== "USD" && (
                          <span className="text-[9px] font-mono text-slate-400">
                            ≈ ${(w.balance * (exchangeRates[w.currency] || 1.0)).toLocaleString(undefined, { maximumFractionDigits: 0 })} USD
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-slate-800/80 mt-4 pt-3 flex justify-between text-[9px] font-mono text-slate-500">
                      <span>Refreshed: Just now</span>
                      <span className="text-slate-400">Finity Core Vault</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ==================== PAGE 4: TRANSACTIONS & BANK FEEDS ==================== */}
        {activeTab === "transactions" && (
          <div className="bg-card-bg border border-border-subtle rounded-3xl p-6 shadow-xs space-y-5" id="page-transactions">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-sans font-bold text-text-main text-sm">Live Open-Banking Feed Records</h3>
                <p className="text-[11px] text-text-muted font-sans mt-0.5">Aggregated ledger entries from connected commercial bank feeds</p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-text-muted" size={13} />
                  <input
                    type="text"
                    value={txSearch}
                    onChange={(e) => setTxSearch(e.target.value)}
                    placeholder="Search merchant/desc..."
                    className="bg-hover-bg/30 border border-border-subtle rounded-xl py-2 pl-8 pr-3 text-xs outline-hidden w-44 font-sans text-text-main"
                  />
                </div>

                <select
                  value={txTypeFilter}
                  onChange={(e) => setTxTypeFilter(e.target.value as any)}
                  className="bg-hover-bg/30 border border-border-subtle rounded-xl py-2 px-3 text-xs text-text-main font-sans"
                >
                  <option value="all">All Operations</option>
                  <option value="deposit">Deposits</option>
                  <option value="withdrawal">Withdrawals</option>
                </select>

                <select
                  value={txAccountFilter}
                  onChange={(e) => setTxAccountFilter(e.target.value)}
                  className="bg-hover-bg/30 border border-border-subtle rounded-xl py-2 px-3 text-xs text-text-main font-sans"
                >
                  <option value="all">All Accounts</option>
                  {bankConnections.map(b => (
                    <option key={b.id} value={b.id}>{b.bankName}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="overflow-x-auto" id="unified-transactions-table-wrapper">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border-subtle text-[10px] uppercase font-mono text-text-muted">
                    <th className="py-2.5 font-bold">Import Date</th>
                    <th className="py-2.5 font-bold">Institution Source</th>
                    <th className="py-2.5 font-bold">Transaction Description</th>
                    <th className="py-2.5 font-bold">Reconciled Link</th>
                    <th className="py-2.5 font-bold text-right">Amount</th>
                    <th className="py-2.5 font-bold text-right">Metadata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/40">
                  {filteredBankTransactions.map((item) => {
                    const isExpanded = expandedTxId === item.tx.id;
                    return (
                      <React.Fragment key={item.tx.id}>
                        <tr 
                          onClick={() => setExpandedTxId(isExpanded ? null : item.tx.id)}
                          className="hover:bg-hover-bg/30 transition text-text-main cursor-pointer"
                        >
                          <td className="py-3 font-mono text-text-muted">{item.tx.date}</td>
                          <td className="py-3 font-semibold text-text-main">{item.bankName}</td>
                          <td className="py-3 font-sans text-text-main">{item.tx.description}</td>
                          <td className="py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              item.tx.reconciled 
                                ? "bg-emerald-500/10 text-brand-emerald border border-emerald-500/15" 
                                : "bg-amber-500/10 text-amber-500 border border-amber-500/15 animate-pulse"
                            }`}>
                              <span className={`w-1 h-1 rounded-full ${item.tx.reconciled ? "bg-brand-emerald" : "bg-amber-500"}`} />
                              {item.tx.reconciled ? "Ledger Linked" : "Pending Match"}
                            </span>
                          </td>
                          <td className={`py-3 text-right font-mono font-bold ${item.tx.amount > 0 ? "text-brand-emerald" : "text-text-main"}`}>
                            {item.tx.amount > 0 ? "+" : ""}${item.tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 text-right text-[10px] text-text-muted font-mono">
                            {isExpanded ? "Hide Details" : "Inspect"}
                          </td>
                        </tr>

                        {/* Expanded details row */}
                        {isExpanded && (
                          <tr className="bg-hover-bg/20">
                            <td colSpan={6} className="py-4 px-6 border-l-2 border-brand-gold">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-sans text-text-muted" id={`tx-expanded-${item.tx.id}`}>
                                <div className="space-y-1.5">
                                  <span className="text-[10px] font-mono uppercase font-bold tracking-wider block">Security Credentials</span>
                                  <div>PLAID TRANSACTION TOKEN: <span className="font-mono text-text-main">pld_tx_{item.tx.id}</span></div>
                                  <div>ISO HANDSHAKE LATENCY: <span className="font-mono text-text-main">11ms</span></div>
                                  <div>ISO-8583 CODE: <span className="font-mono text-text-main">0200 (Core Msg)</span></div>
                                </div>

                                <div className="space-y-1.5">
                                  <span className="text-[10px] font-mono uppercase font-bold tracking-wider block">Double-Entry Audit Link</span>
                                  <div>DEBIT ELEMENT: <span className="font-mono text-text-main">GL-1010 (Checking Cash)</span></div>
                                  <div>CREDIT OFFSET ELEMENT: <span className="font-mono text-text-main">Pending selection...</span></div>
                                  <div>AUDIT VERDICT: <span className="text-brand-emerald font-semibold">100% Secure Cryptographic Hash</span></div>
                                </div>

                                <div className="space-y-2">
                                  <span className="text-[10px] font-mono uppercase font-bold tracking-wider block">Finity AI Auto-Categorization</span>
                                  <p className="text-[10px] leading-relaxed">
                                    I suggest categorizing this to <strong>{item.tx.amount > 0 ? "Product Income" : "Infrastructure Expenses"}</strong> based on merchant patterns.
                                  </p>
                                  {!item.tx.reconciled && (
                                    <button 
                                      onClick={() => {
                                        setActiveReconciliationTx(item.tx);
                                        setActiveTab("reconciliation");
                                      }}
                                      className="px-3 py-1.5 rounded-lg bg-brand-primary text-brand-gold text-[10px] font-bold flex items-center gap-1 hover:bg-brand-primary-dark"
                                    >
                                      <CheckCircle2 size={11} />
                                      <span>Reconcile Transaction</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {filteredBankTransactions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center font-mono text-text-muted">No transactions correspond to selected filter criteria.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== PAGE 5: FX & WALLET TRANSFERS ==================== */}
        {activeTab === "transfers" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="page-transfers">
            
            {/* Currency conversion form */}
            <div className="lg:col-span-6 bg-card-bg border border-border-subtle rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
                <ArrowLeftRight size={16} className="text-brand-gold" />
                <h3 className="font-sans font-bold text-text-main text-sm">Finity Multi-Currency FX Engine</h3>
              </div>

              <form onSubmit={handleWalletTransferSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-text-muted uppercase mb-1">Debiting Source Wallet</label>
                    <select
                      value={fromWalletId}
                      onChange={(e) => setFromWalletId(e.target.value)}
                      className="w-full bg-[#fcfcfd] dark:bg-slate-900 border border-border-subtle rounded-xl p-2.5 text-xs text-text-main"
                      id="fx-source-wallet"
                    >
                      {wallets.map(w => (
                        <option key={w.id} value={w.id}>{w.name} - Bal: {w.currency} {w.balance.toLocaleString()}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-text-muted uppercase mb-1">Crediting Target Wallet</label>
                    <select
                      value={toWalletId}
                      onChange={(e) => setToWalletId(e.target.value)}
                      className="w-full bg-[#fcfcfd] dark:bg-slate-900 border border-border-subtle rounded-xl p-2.5 text-xs text-text-main"
                      id="fx-target-wallet"
                    >
                      {wallets.map(w => (
                        <option key={w.id} value={w.id}>{w.name} - Bal: {w.currency} {w.balance.toLocaleString()}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-text-muted uppercase mb-1">Exchange amount (in source currency)</label>
                  <div className="relative rounded-xl shadow-xs">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-text-muted font-mono text-xs">
                        {wallets.find(w => w.id === fromWalletId)?.currency === "EUR" ? "€" : wallets.find(w => w.id === fromWalletId)?.currency === "GBP" ? "£" : "$"}
                      </span>
                    </div>
                    <input
                      type="number"
                      required
                      placeholder="0.00"
                      value={exchangeAmount}
                      onChange={(e) => setExchangeAmount(e.target.value)}
                      className="block w-full bg-[#fcfcfd] dark:bg-slate-900 rounded-xl border border-border-subtle py-2.5 pl-8 pr-3 text-xs text-text-main outline-hidden font-mono"
                      id="fx-exchange-amount"
                    />
                  </div>
                </div>

                {/* Live rate feedback calculations */}
                {exchangeAmount && Number(exchangeAmount) > 0 && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-border-subtle rounded-xl space-y-1.5 text-xs font-mono text-text-muted" id="fx-real-rate-box">
                    <div className="flex justify-between">
                      <span>Dynamic Cross-Rate:</span>
                      <span className="font-bold">
                        1 {wallets.find(w => w.id === fromWalletId)?.currency} = {((exchangeRates[wallets.find(w => w.id === fromWalletId)?.currency || "USD"] || 1.0) / (exchangeRates[wallets.find(w => w.id === toWalletId)?.currency || "USD"] || 1.0)).toFixed(4)} {wallets.find(w => w.id === toWalletId)?.currency}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Recipient Wallet Receives:</span>
                      <span className="font-bold text-brand-emerald">
                        {wallets.find(w => w.id === toWalletId)?.currency}{" "}
                        {((Number(exchangeAmount) * (exchangeRates[wallets.find(w => w.id === fromWalletId)?.currency || "USD"] || 1.0)) / (exchangeRates[wallets.find(w => w.id === toWalletId)?.currency || "USD"] || 1.0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimated Inter-ledger Fees:</span>
                      <span className="text-brand-emerald">0.00 USD (FREE via Finity Core Link)</span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isConverting}
                  className="w-full bg-brand-primary text-brand-gold hover:bg-brand-primary-dark font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition"
                >
                  <RefreshCw size={13} className={isConverting ? "animate-spin" : ""} />
                  <span>{isConverting ? "Initiating FX atomic ledger lock..." : "Authorize Wallet FX Exchange"}</span>
                </button>
              </form>
            </div>

            {/* Cross Currency Rates Monitor */}
            <div className="lg:col-span-6 bg-card-bg border border-border-subtle rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
                <Globe size={15} className="text-brand-gold" />
                <h3 className="font-sans font-bold text-text-main text-sm">Finity Live Cross-Currency Index</h3>
              </div>

              <div className="space-y-3.5" id="fx-rates-list">
                {[
                  { base: "EUR", target: "USD", rate: exchangeRates["EUR"], lastUpdated: "Just now" },
                  { base: "GBP", target: "USD", rate: exchangeRates["GBP"], lastUpdated: "Just now" },
                  { base: "CAD", target: "USD", rate: exchangeRates["CAD"] || 0.73, lastUpdated: "Just now" },
                  { base: "AUD", target: "USD", rate: exchangeRates["AUD"] || 0.67, lastUpdated: "Just now" },
                ].map((r) => (
                  <div key={r.base} className="p-3 bg-hover-bg/30 border border-border-subtle/50 rounded-xl flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="font-sans font-black text-text-main">{r.base} / {r.target}</span>
                      <span className="text-[9px] bg-emerald-500/10 text-brand-emerald px-1.5 rounded-sm">LIVE</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-text-main">{r.rate}</span>
                      <span className="block text-[8px] text-text-muted">{r.lastUpdated}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ==================== PAGE 6: SUPPLIER & DISBURSEMENT PAYMENTS ==================== */}
        {activeTab === "payments" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="page-payments">
            {/* Payment Initiation Form */}
            <div className="lg:col-span-7 bg-card-bg border border-border-subtle rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div className="flex items-center gap-2">
                  <Send size={15} className="text-brand-primary" />
                  <h3 className="font-sans font-bold text-text-main text-sm">Initiate Corporate Money Transfer</h3>
                </div>
                <span className="font-mono text-[9px] font-bold text-brand-gold bg-brand-gold-light px-2.5 py-0.5 rounded-full uppercase">
                  Real-time Double Entry Sync
                </span>
              </div>

              <form onSubmit={handleDisbursementSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-text-muted uppercase mb-1">Transfer category</label>
                    <select
                      value={paymentType}
                      onChange={(e) => setPaymentType(e.target.value as any)}
                      className="w-full bg-[#fcfcfd] dark:bg-slate-900 border border-border-subtle rounded-xl p-2.5 text-xs text-text-main focus:border-brand-primary font-sans"
                      id="payment-type-selector"
                    >
                      <option value="supplier">Supplier Settlement (GL AP Offset)</option>
                      <option value="payroll">Corporate Payroll Payment (GL Salaries Offset)</option>
                      <option value="refund">Dispute / Refund (GL Revenue Offset)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-text-muted uppercase mb-1">Deduction Currency</label>
                    <select
                      value={paymentCurrency}
                      onChange={(e) => setPaymentCurrency(e.target.value)}
                      className="w-full bg-[#fcfcfd] dark:bg-slate-900 border border-border-subtle rounded-xl p-2.5 text-xs text-text-main focus:border-brand-primary font-sans"
                    >
                      <option value="USD">USD (US Dollar)</option>
                      <option value="EUR">EUR (Euro)</option>
                      <option value="GBP">GBP (British Pound Sterling)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-text-muted uppercase mb-1">Recipient Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. AWS, Sarah Connor, Stark Corp"
                      value={paymentRecipient}
                      onChange={(e) => setPaymentRecipient(e.target.value)}
                      className="w-full bg-[#fcfcfd] dark:bg-slate-900 border border-border-subtle rounded-xl p-2.5 text-xs text-text-main focus:border-brand-primary font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-text-muted uppercase mb-1">Amount to Transfer</label>
                    <div className="relative rounded-xl shadow-xs">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="text-text-muted font-mono text-xs">
                          {paymentCurrency === "EUR" ? "€" : paymentCurrency === "GBP" ? "£" : "$"}
                        </span>
                      </div>
                      <input
                        type="number"
                        required
                        placeholder="0.00"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="block w-full bg-[#fcfcfd] dark:bg-slate-900 rounded-xl border border-border-subtle py-2.5 pl-8 pr-3 text-xs text-text-main outline-hidden font-mono"
                        id="payout-amount-input"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border-subtle/50 pt-4">
                  <div>
                    <label className="block text-[10px] font-mono text-text-muted uppercase mb-1">Treasury Account Class</label>
                    <select
                      value={paymentSourceType}
                      onChange={(e) => {
                        const val = e.target.value as "bank" | "wallet";
                        setPaymentSourceType(val);
                        if (val === "bank") {
                          setPaymentSourceId(bankConnections[0]?.id || "");
                        } else {
                          setPaymentSourceId(wallets[0]?.id || "");
                        }
                      }}
                      className="w-full bg-[#fcfcfd] dark:bg-slate-900 border border-border-subtle rounded-xl p-2.5 text-xs text-text-main focus:border-brand-primary font-sans"
                    >
                      <option value="bank">Commercial Bank Connection</option>
                      <option value="wallet">Digital Multi-Currency Wallet</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-text-muted uppercase mb-1">Specific Funding Source</label>
                    <select
                      value={paymentSourceId}
                      onChange={(e) => setPaymentSourceId(e.target.value)}
                      required
                      className="w-full bg-[#fcfcfd] dark:bg-slate-900 border border-border-subtle rounded-xl p-2.5 text-xs text-text-main focus:border-brand-primary font-sans font-medium"
                      id="payout-source-id"
                    >
                      {paymentSourceType === "bank" ? (
                        bankConnections.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.bankName} - Bal: ${b.balance.toLocaleString()}
                          </option>
                        ))
                      ) : (
                        wallets.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name} - Bal: {w.currency} {w.balance.toLocaleString()}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                {/* Estimate calculations */}
                {paymentAmount && Number(paymentAmount) > 0 && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-border-subtle rounded-xl space-y-1 text-xs font-mono text-text-muted" id="payout-routing-details">
                    <div className="flex items-center gap-1.5 font-sans font-bold text-brand-primary text-xs border-b border-border-subtle/50 pb-1.5 mb-1.5">
                      <Cpu size={12} className="text-brand-gold animate-pulse" />
                      <span>Finity Smart Payment Routing Decisions</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Deduction FX Amount:</span>
                      <span className="font-bold text-text-main">
                        {paymentCurrency} {Number(paymentAmount).toLocaleString()}
                      </span>
                    </div>
                    {paymentCurrency !== "USD" && (
                      <div className="flex justify-between">
                        <span>Ledger conversion rate:</span>
                        <span>1 {paymentCurrency} = {exchangeRates[paymentCurrency]} USD</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Ledger USD value (posted to general journal):</span>
                      <span className="font-bold text-text-main">
                        ${(Number(paymentAmount) * (exchangeRates[paymentCurrency] || 1.0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Smart Routing Protocol Path:</span>
                      <span className="text-indigo-500 font-bold">
                        {paymentSourceType === "wallet" ? "Stripe Treasury Core Link" : Number(paymentAmount) > 5000 ? "FedWire Real-time Settlement" : "Optimized Standard ACH"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimated Settlement Latency:</span>
                      <span className="text-brand-emerald font-bold font-sans">
                        {paymentSourceType === "wallet" ? "Instant" : Number(paymentAmount) > 5000 ? "Same-Day Wire Clearing" : "1-2 Business Days"}
                      </span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="w-full bg-brand-primary text-brand-gold hover:bg-brand-primary-dark font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition"
                  id="btn-execute-disbursement"
                >
                  <Send size={13} />
                  <span>{isSubmittingPayment ? "Authorizing security limits & signing..." : "Dispatch Secure Wire Payment"}</span>
                </button>
              </form>
            </div>

            {/* Inbound/Outbound Settlement History */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-card-bg border border-border-subtle rounded-3xl p-6 shadow-xs h-full flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="text-xs uppercase font-mono tracking-wider font-bold text-text-muted">
                    Outbound Settlement Log
                  </h3>

                  <div className="space-y-3" id="active-payout-list-panel">
                    {activePayments.map((p) => (
                      <div key={p.id} className="p-4 bg-hover-bg/30 rounded-2xl border border-border-subtle/50 text-xs space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-bold uppercase ${
                              p.type === "payroll" ? "bg-indigo-500/10 text-indigo-400" : p.type === "supplier" ? "bg-amber-500/10 text-amber-400" : "bg-purple-500/10 text-purple-400"
                            }`}>
                              {p.type}
                            </span>
                            <span className="font-mono text-[9px] text-text-muted">{p.date}</span>
                          </div>

                          <span className="font-mono font-bold text-xs text-text-main">
                            {p.currency === "EUR" ? "€" : p.currency === "GBP" ? "£" : "$"}
                            {p.amount.toLocaleString()}
                          </span>
                        </div>

                        <div className="font-sans text-xs text-text-main font-semibold">
                          Recipient: <span className="font-bold text-brand-primary">{p.recipientName}</span>
                        </div>

                        <div className="border-t border-border-subtle/40 pt-2 flex justify-between items-center text-[10px] text-text-muted font-mono">
                          <div>
                            <span>ROUTING VIA:</span>
                            <span className="text-text-main block">{p.routingPath}</span>
                          </div>
                          <div className="text-right">
                            <span>SETTLED:</span>
                            <span className="text-brand-emerald font-bold block">{p.settlementTime}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {activePayments.length === 0 && (
                      <p className="text-xs text-text-muted text-center py-12 font-mono">No outgoing settlement logs recorded.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ==================== PAGE 7: BANK RECONCILIATION ==================== */}
        {activeTab === "reconciliation" && (
          <div className="space-y-6" id="page-reconciliation">
            
            {/* Split Screen Reconciliation Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Pane: Bank Feed Imports */}
              <div className="lg:col-span-6 bg-card-bg border border-border-subtle rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <div className="flex items-center gap-2">
                    <Building size={15} className="text-brand-gold" />
                    <h3 className="font-sans font-bold text-text-main text-sm">Unreconciled Bank Feed</h3>
                  </div>
                  <span className="font-mono text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">
                    {financialTotals.totalUnreconciled} PENDING
                  </span>
                </div>

                <div className="space-y-3" id="reconciliation-bank-list">
                  {allBankTransactions.filter(item => !item.tx.reconciled).map((item) => {
                    const isSelected = activeReconciliationTx?.id === item.tx.id;
                    return (
                      <div 
                        key={item.tx.id} 
                        onClick={() => {
                          setActiveReconciliationTx(item.tx);
                          // Auto-suggest matched ledger transaction id if there are matching ones
                          if (item.tx.amount === -1200) {
                            setMatchedLedgerTxId("bill-2026-001");
                          } else if (item.tx.amount === 2500) {
                            setMatchedLedgerTxId("inv-2026-001");
                          } else {
                            setMatchedLedgerTxId("");
                          }
                        }}
                        className={`p-4 rounded-2xl border transition cursor-pointer text-xs space-y-2 ${
                          isSelected 
                            ? "bg-brand-primary-light border-brand-primary" 
                            : "bg-hover-bg/30 border-border-subtle hover:bg-hover-bg"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-mono text-[9px] text-text-muted">{item.tx.date}</span>
                            <h4 className="font-sans font-bold text-text-main mt-0.5">{item.tx.description}</h4>
                          </div>
                          <span className={`font-mono font-bold ${item.tx.amount > 0 ? "text-brand-emerald" : "text-text-main"}`}>
                            {item.tx.amount > 0 ? "+" : ""}${item.tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-text-muted font-mono pt-1 border-t border-border-subtle/40">
                          <span>SOURCE: {item.bankName}</span>
                          <span className="text-amber-500 flex items-center gap-0.5">
                            <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                            Unmatched
                          </span>
                        </div>
                      </div>
                    )})}
                  
                  {allBankTransactions.filter(item => !item.tx.reconciled).length === 0 && (
                    <div className="text-center py-16 space-y-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-brand-emerald">
                        <Check size={18} />
                      </div>
                      <p className="font-mono text-[11px] text-text-muted">Excellent work! All bank feeds reconciled 100% with the GL.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Pane: Double-Entry Reconciliation Ledger Matcher */}
              <div className="lg:col-span-6 bg-card-bg border border-border-subtle rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
                  <CheckSquare size={15} className="text-brand-gold" />
                  <h3 className="font-sans font-bold text-text-main text-sm">Integrity Matching Hub</h3>
                </div>

                {activeReconciliationTx ? (
                  <div className="space-y-4" id="matching-actions-workspace">
                    <div className="p-4 bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl space-y-1.5">
                      <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">Selected Import feed item</span>
                      <div className="flex justify-between items-baseline">
                        <h4 className="font-sans font-bold text-white text-xs">{activeReconciliationTx.description}</h4>
                        <span className="font-mono font-bold text-white">${activeReconciliationTx.amount.toLocaleString()}</span>
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono">DATE: {activeReconciliationTx.date}</div>
                    </div>

                    {/* Finity AI Match Suggestion Box */}
                    <div className="p-4 bg-brand-primary-light border border-brand-gold/15 rounded-2xl text-xs space-y-2">
                      <div className="flex items-center gap-1.5 font-sans font-bold text-brand-primary text-xs">
                        <Sparkles size={12} className="text-brand-gold animate-pulse" />
                        <span>Finity AI Core Reconciliation Symmetries</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                        {activeReconciliationTx.amount === -1200 ? (
                          <span>I identified an unpaid Supplier Bill matching this AWS transaction: <strong>BILL-AWS-9021 ($1,200)</strong> with <strong>99.4% precision score</strong>. Let's auto-link and update General Journal AP values.</span>
                        ) : activeReconciliationTx.amount === 2500 ? (
                          <span>I found an open invoice issued to Acme Corporation: <strong>INV-2026-001 ($2,500)</strong>. Linking this will mark the invoice as paid and settle accounts receivable instantly!</span>
                        ) : (
                          <span>No exact dollar-value recorded in general ledger found. Please create a new general journal entry to offset this <strong>{activeReconciliationTx.amount > 0 ? "Inflow" : "Outflow"}</strong>.</span>
                        )}
                      </p>
                    </div>

                    {/* Selector */}
                    <div>
                      <label className="block text-[10px] font-mono text-text-muted uppercase mb-1">Target GL Offset Entity</label>
                      <select
                        value={matchedLedgerTxId}
                        onChange={(e) => setMatchedLedgerTxId(e.target.value)}
                        className="w-full bg-[#fcfcfd] dark:bg-slate-900 border border-border-subtle rounded-xl p-2.5 text-xs text-text-main focus:border-brand-primary font-sans"
                        id="reconcile-gl-selector"
                      >
                        <option value="">-- Create custom offset journal entry --</option>
                        {state.bills?.map(b => (
                          <option key={b.id} value={b.id}>Supplier Bill: {b.supplierName} - {b.billNumber} (${b.total})</option>
                        ))}
                        {state.invoices?.map(i => (
                          <option key={i.id} value={i.id}>Client Invoice: {i.customerName} - {i.invoiceNumber} (${i.total})</option>
                        ))}
                      </select>
                    </div>

                    <div className="pt-3 border-t border-border-subtle/50 flex gap-3">
                      <button 
                        onClick={() => {
                          setActiveReconciliationTx(null);
                          setMatchedLedgerTxId("");
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-hover-bg text-text-muted text-xs font-semibold"
                      >
                        Skip
                      </button>

                      <button 
                        onClick={() => handleApproveMatchReconciliation(activeReconciliationTx.id, matchedLedgerTxId)}
                        className="flex-1 py-2.5 rounded-xl bg-brand-primary text-brand-gold text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-brand-primary-dark"
                      >
                        <Check size={13} />
                        <span>Confirm Match Link</span>
                      </button>
                    </div>

                  </div>
                ) : (
                  <div className="text-center py-24 text-text-muted space-y-2">
                    <Info size={24} className="text-text-muted mx-auto" />
                    <p className="font-mono text-xs">Select an unreconciled transaction from the left feed to activate the matching interface.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ==================== PAGE 8: CASH MANAGEMENT & FORECASTS ==================== */}
        {activeTab === "cash" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="page-cash-management">
            
            {/* Cash runway and forecast metrics */}
            <div className="lg:col-span-8 bg-card-bg border border-border-subtle rounded-3xl p-6 shadow-xs space-y-6">
              <div>
                <h3 className="font-sans font-bold text-text-main text-sm">Predictive Treasury & Forecasts</h3>
                <p className="text-[11px] text-text-muted font-sans mt-0.5">Automated cashflow forecast modeling and tax buffer clearance</p>
              </div>

              {/* Dynamic Bar chart showing receivables vs payables */}
              <div className="h-60 w-full" id="forecast-recharts-bar-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { category: "Cash on Hand", Amount: financialTotals.liquidCash },
                    { category: "Incoming Invoices", Amount: state.invoices?.filter(i => i.status !== "paid").reduce((sum, i) => sum + i.balanceDue, 0) || 12000 },
                    { category: "Upcoming Bills", Amount: state.bills?.filter(b => b.status !== "paid").reduce((sum, b) => sum + b.balanceDue, 0) || 3200 },
                  ]} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                    <XAxis dataKey="category" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#1e293b", borderColor: "#475569", borderRadius: "12px" }} 
                      itemStyle={{ color: "#ffffff", fontFamily: "sans-serif", fontSize: "12px" }}
                    />
                    <Bar dataKey="Amount" fill="#D4AF37" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Forecast Explainer Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-hover-bg/30 border border-border-subtle/50 rounded-2xl space-y-1.5">
                  <h4 className="font-sans font-bold text-text-main text-xs">Runway Stability Verdict</h4>
                  <p className="text-[11px] text-text-muted leading-relaxed font-sans">
                    With consolidated cash at <strong>${financialTotals.liquidCash.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>, you can sustain the current burn rate for over <strong>{financialTotals.cashRunwayDays} days</strong> without any additional capital injection.
                  </p>
                </div>

                <div className="p-4 bg-hover-bg/30 border border-border-subtle/50 rounded-2xl space-y-1.5">
                  <h4 className="font-sans font-bold text-text-main text-xs">Operational Safety Buffer</h4>
                  <p className="text-[11px] text-text-muted leading-relaxed font-sans">
                    Finity proposes setting aside <strong>$14,500</strong> for upcoming tax cycles and quarterly SaaS server renewals. This keeps net liquid reserves at <strong>${(financialTotals.liquidCash - 14500).toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Finity Live AI Assistant Dialog Box */}
            <div className="lg:col-span-4 bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                  <Sparkles size={15} className="text-brand-gold" />
                  <h3 className="font-sans font-bold text-white text-xs">Ask Finity AI Treasury Agent</h3>
                </div>

                <div className="space-y-3" id="advisor-questions-list">
                  {[
                    "Is our runway healthy against monthly expenses?",
                    "Can we afford a $25,000 corporate purchase?",
                    "Analyze matching feed items to bills",
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => handleAskAgentPredefined(q)}
                      className="w-full text-left p-3 rounded-2xl bg-slate-800 hover:bg-slate-800/80 border border-slate-800 text-[10px] font-bold text-slate-200 transition flex items-center justify-between"
                    >
                      <span>{q}</span>
                      <ArrowRight size={11} className="text-brand-gold shrink-0 ml-1" />
                    </button>
                  ))}
                </div>

                {/* Simulated typed response box */}
                <div className="mt-4 border-t border-slate-800/80 pt-4">
                  {agentTyping ? (
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                      <RefreshCw size={13} className="animate-spin text-brand-gold" />
                      <span>Finity Advisor is calculating ledger data...</span>
                    </div>
                  ) : agentResponse ? (
                    <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 font-mono text-[10px] text-slate-300 space-y-2 overflow-y-auto max-h-56">
                      <span className="text-[8px] bg-brand-gold-light text-brand-gold border border-brand-gold/20 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider block w-fit">
                        Treasury Insight
                      </span>
                      {agentResponse.split("\n\n").map((chunk, i) => (
                        <p key={i} className="leading-relaxed">{chunk}</p>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500 text-[10px] font-mono">
                      Click any of the predefined questions above to receive immediate cryptographic cash forecasts.
                    </div>
                  )}
                </div>
              </div>

              <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1 justify-center pt-2 border-t border-slate-800">
                <Shield size={12} className="text-brand-emerald" />
                <span>INTELLIGENT FORECAST ENGINE ACTIVE</span>
              </div>
            </div>

          </div>
        )}

        {/* ==================== PAGE 9: BANKING SECURITY CENTER ==================== */}
        {activeTab === "security" && (
          <div className="bg-card-bg border border-border-subtle rounded-3xl p-6 shadow-xs space-y-6" id="page-security-center">
            <div className="border-b border-border-subtle pb-4">
              <h3 className="font-sans font-bold text-text-main text-sm">Treasury Security Controls</h3>
              <p className="text-[11px] text-text-muted font-sans mt-0.5">Configure access parameters, multi-sig constraints, and cryptographically cycle gateway links</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Access Settings Controls */}
              <div className="bg-hover-bg/20 rounded-2xl p-5 border border-border-subtle/50 space-y-4">
                <h4 className="font-sans font-bold text-text-main text-xs flex items-center gap-2">
                  <Lock size={14} className="text-brand-gold" />
                  <span>Security Rules Settings</span>
                </h4>

                <div className="space-y-4 text-xs font-sans text-text-muted">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-text-main block">Multi-Factor Open Banking Link</span>
                      <span className="text-[10px]">Require mobile authorization code before linking any bank feeds</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={mfaEnabled}
                      onChange={(e) => setMfaEnabled(e.target.checked)}
                      className="w-4 h-4 rounded-md border-border-subtle focus:ring-brand-gold text-brand-primary cursor-pointer accent-amber-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-text-main block">Automatic Ledger Settlement Sync</span>
                      <span className="text-[10px]">Mark bank deposits as reconciled when matching invoices are identified</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={autoSettle}
                      onChange={(e) => setAutoSettle(e.target.checked)}
                      className="w-4 h-4 rounded-md border-border-subtle focus:ring-brand-gold text-brand-primary cursor-pointer accent-amber-500"
                    />
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-border-subtle/40">
                    <span className="font-bold text-text-main block">Multi-Sig Withdrawal Limit (USD)</span>
                    <span className="text-[10px] block mb-1">Require owner approval for payouts exceeding this threshold</span>
                    <div className="relative rounded-xl max-w-[200px]">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="text-text-muted font-mono text-xs">$</span>
                      </div>
                      <input 
                        type="number"
                        value={approvalLimit}
                        onChange={(e) => setApprovalLimit(e.target.value)}
                        className="w-full bg-[#fcfcfd] dark:bg-slate-900 border border-border-subtle rounded-xl py-1.5 pl-7 pr-3 text-xs text-text-main font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Cryptographic Session audits */}
              <div className="bg-hover-bg/20 rounded-2xl p-5 border border-border-subtle/50 space-y-4">
                <h4 className="font-sans font-bold text-text-main text-xs flex items-center gap-2">
                  <Users size={14} className="text-brand-gold" />
                  <span>Active Security Sessions</span>
                </h4>

                <div className="space-y-3.5 text-xs font-mono text-text-muted" id="active-sessions-log">
                  <div className="flex justify-between items-start border-b border-border-subtle/40 pb-2">
                    <div>
                      <span className="font-bold text-text-main block font-sans">Owner Session (Finity Web App)</span>
                      <span className="text-[10px]">IP: 198.51.100.42 • Chrome OS</span>
                    </div>
                    <span className="text-brand-emerald text-[9px] font-bold">ACTIVE NOW</span>
                  </div>

                  <div className="flex justify-between items-start border-b border-border-subtle/40 pb-2">
                    <div>
                      <span className="font-bold text-text-main block font-sans">Plaid Bank Core Token</span>
                      <span className="text-[10px]">Token Ref: tk_pld_8912 • Secure Server</span>
                    </div>
                    <span className="text-brand-emerald text-[9px] font-bold">VERIFIED</span>
                  </div>

                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-text-main block font-sans">Stripe Webhook Gateway</span>
                      <span className="text-[10px]">Signature: whsec_st_4091 • Webhook Sync</span>
                    </div>
                    <span className="text-brand-emerald text-[9px] font-bold">LISTENING</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border-subtle/40 flex justify-end">
                  <button 
                    onClick={() => triggerToast("All encryption handshake keys successfully rotated.", "success")}
                    className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-brand-gold font-bold text-xs hover:bg-slate-800"
                  >
                    Cycle API Tokens Now
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ==================== PAGE 10: INTEGRATIONS & GATEWAYS ==================== */}
        {activeTab === "integrations" && (
          <div className="space-y-6" id="page-integrations">
            
            {/* Active Payment Connectors Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-sans font-bold text-text-main text-sm">Configured Merchant Services & Gateways</h3>
                  <p className="text-[11px] text-text-muted font-sans mt-0.5">Third-party processors synchronizing checkouts and payouts with ledgers</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="integrations-gateway-grid">
                {gateways.map((g) => (
                  <div key={g.id} className="bg-card-bg border border-border-subtle rounded-3xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between h-44">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Sliders size={16} className="text-brand-gold" />
                        <h4 className="font-sans font-bold text-text-main text-xs">{g.name}</h4>
                      </div>

                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8px] font-extrabold uppercase ${
                        g.status === "connected" 
                          ? "bg-emerald-500/10 text-brand-emerald border border-emerald-500/15" 
                          : "bg-rose-500/10 text-rose-500 border border-rose-500/15"
                      }`}>
                        {g.status}
                      </span>
                    </div>

                    <div className="space-y-1 text-[10px] font-mono text-text-muted">
                      <div>ENVIRONMENT: <span className="font-bold text-text-main uppercase">{g.environment}</span></div>
                      <div>CREDENTIAL CLASSIFICATION: <span className="text-text-main">{g.credentialsType}</span></div>
                      <div>LAST RESPONDED: <span className="text-text-main">Just now</span></div>
                    </div>

                    <div className="border-t border-border-subtle/40 pt-3 flex items-center justify-between text-[9px] font-mono text-text-muted">
                      <span>Gateway delay: 12ms</span>
                      <span>Health Index: 100%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Connect New Gateway Integrator Form */}
            <div className="bg-card-bg border border-border-subtle rounded-3xl p-6 max-w-xl mx-auto shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
                <Sliders size={16} className="text-brand-gold" />
                <h3 className="font-sans font-bold text-text-main text-sm">Activate Merchant Payment Provider</h3>
              </div>

              <form onSubmit={handleIntegrateGatewaySubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-text-muted uppercase mb-1">Gateway Provider Brand Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Stripe Premium, Adyen Live, Shopify Pay, Twilio"
                    value={newGatewayName}
                    onChange={(e) => setNewGatewayName(e.target.value)}
                    className="w-full bg-[#fcfcfd] dark:bg-slate-900 border border-border-subtle rounded-xl p-2.5 text-xs text-text-main focus:border-brand-primary font-sans"
                    id="new-gw-name"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-text-muted uppercase mb-1">Environment Scope</label>
                    <select
                      value={newGatewayEnv}
                      onChange={(e) => setNewGatewayEnv(e.target.value as any)}
                      className="w-full bg-[#fcfcfd] dark:bg-slate-900 border border-border-subtle rounded-xl p-2.5 text-xs text-text-main focus:border-brand-primary"
                    >
                      <option value="sandbox">Sandbox (Ledger Safe Testing)</option>
                      <option value="live">Production (Real Bank Liquidation)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-text-muted uppercase mb-1">Authorization Mode</label>
                    <select
                      value={newGatewayCreds}
                      onChange={(e) => setNewGatewayCreds(e.target.value as any)}
                      className="w-full bg-[#fcfcfd] dark:bg-slate-900 border border-border-subtle rounded-xl p-2.5 text-xs text-text-main focus:border-brand-primary"
                    >
                      <option value="API Key">Encrypted Secret API Key</option>
                      <option value="OAuth">OAuth Token handshake</option>
                      <option value="Token">Bearer Token Authorization</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLinkingGateway}
                  className="w-full bg-brand-primary text-brand-gold hover:bg-brand-primary-dark font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition"
                  id="btn-link-gateway"
                >
                  <Plus size={13} />
                  <span>{isLinkingGateway ? "Verifying TLS link..." : "Configure & Link Payment Connector"}</span>
                </button>
              </form>
            </div>

          </div>
        )}

        {/* ==================== PAGE 11: KRA TAX OBLIGATIONS ==================== */}
        {activeTab === "kra-compliance" && (
          <div className="space-y-6" id="page-kra-compliance">
            <KRATaxComplianceHub state={state} onStateUpdate={onStateUpdate} />
          </div>
        )}

      </div>
    </div>
  );
}
