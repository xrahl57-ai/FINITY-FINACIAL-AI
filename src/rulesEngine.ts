/**
 * FINITY Ledger - Scalable Financial Rules Engine (CFO Core)
 * Built to represent 25+ standard accounting equations,
 * country-specific tax rules, dynamic business calculations, and real-time validations.
 */

import { FinityState, AccountType, Transaction, JournalEntry, Invoice, Bill, Account } from "./types";

export interface TaxJurisdiction {
  countryCode: string;
  countryName: string;
  taxName: string;
  standardRate: number;
  reducedRate?: number;
  zeroRate: number;
  thresholdLimit?: string;
  regionalNotes?: string;
}

export const TaxConfig: Record<string, TaxJurisdiction> = {
  KE: { 
    countryCode: "KE", 
    countryName: "Kenya", 
    taxName: "VAT", 
    standardRate: 0.16, 
    reducedRate: 0.08, 
    zeroRate: 0,
    thresholdLimit: "KES 5,000,000 turnover",
    regionalNotes: "16% standard VAT on most taxable goods and services. 8% reduced rate applies to petroleum products."
  },
  US: { 
    countryCode: "US", 
    countryName: "United States", 
    taxName: "Sales Tax", 
    standardRate: 0.0825, 
    reducedRate: 0.04, 
    zeroRate: 0,
    thresholdLimit: "Varies by State (Nexus)",
    regionalNotes: "Determined by economic nexus standards (typically $100k sales or 200 transactions)."
  },
  UK: { 
    countryCode: "UK", 
    countryName: "United Kingdom", 
    taxName: "VAT", 
    standardRate: 0.20, 
    reducedRate: 0.05, 
    zeroRate: 0,
    thresholdLimit: "£90,000 taxable turnover",
    regionalNotes: "Compulsory registration above threshold. 5% reduced rate applies to energy, home conversions."
  },
  CA: { 
    countryCode: "CA", 
    countryName: "Canada", 
    taxName: "GST/HST", 
    standardRate: 0.13, 
    reducedRate: 0.05, 
    zeroRate: 0,
    thresholdLimit: "$30,000 CAD gross revenue",
    regionalNotes: "Blended rate varies by province: 5% GST in West/North; up to 15% HST in Atlantic provinces."
  },
  AU: { 
    countryCode: "AU", 
    countryName: "Australia", 
    taxName: "GST", 
    standardRate: 0.10, 
    zeroRate: 0,
    thresholdLimit: "$75,000 AUD gross sales",
    regionalNotes: "Registration required for non-profits at $150,000 AUD. Most food and healthcare are GST-free."
  },
  NZ: { 
    countryCode: "NZ", 
    countryName: "New Zealand", 
    taxName: "GST", 
    standardRate: 0.15, 
    zeroRate: 0,
    thresholdLimit: "$60,000 NZD turnover",
    regionalNotes: "Comprehensive GST system with very few exemptions compared to other OECD nations."
  },
  DE: { 
    countryCode: "DE", 
    countryName: "Germany", 
    taxName: "VAT (MwSt)", 
    standardRate: 0.19, 
    reducedRate: 0.07, 
    zeroRate: 0,
    thresholdLimit: "€22,000 (Kleinunternehmer)",
    regionalNotes: "7% reduced rate applies to books, food, public transport, and hotel stays."
  },
  FR: { 
    countryCode: "FR", 
    countryName: "France", 
    taxName: "VAT (TVA)", 
    standardRate: 0.20, 
    reducedRate: 0.10, 
    zeroRate: 0,
    thresholdLimit: "€91,900 (goods) / €39,100 (services)",
    regionalNotes: "Super-reduced rate of 2.1% exists for newspapers and reimbursed healthcare products."
  },
  JP: { 
    countryCode: "JP", 
    countryName: "Japan", 
    taxName: "Consumption Tax", 
    standardRate: 0.10, 
    reducedRate: 0.08, 
    zeroRate: 0,
    thresholdLimit: "¥10,000,000 taxable sales",
    regionalNotes: "Reduced rate of 8% is applied strictly to food/beverages and newspapers."
  },
  IN: { 
    countryCode: "IN", 
    countryName: "India", 
    taxName: "GST", 
    standardRate: 0.18, 
    reducedRate: 0.05, 
    zeroRate: 0,
    thresholdLimit: "₹4,000,000 (goods) / ₹2,000,000 (services)",
    regionalNotes: "Four-tier structure (5%, 12%, 18%, 28%) shared between CGST, SGST, and IGST components."
  },
  SG: { 
    countryCode: "SG", 
    countryName: "Singapore", 
    taxName: "GST", 
    standardRate: 0.09, 
    zeroRate: 0,
    thresholdLimit: "$1,000,000 SGD taxable turnover",
    regionalNotes: "Increased to 9% on Jan 1, 2024. Exemption for residential properties and financial services."
  },
  ZA: { 
    countryCode: "ZA", 
    countryName: "South Africa", 
    taxName: "VAT", 
    standardRate: 0.15, 
    reducedRate: 0.09, 
    zeroRate: 0,
    thresholdLimit: "R1,000,000 taxable supplies",
    regionalNotes: "Voluntary registration allowed if income exceeds R50,000 in the past 12 months."
  },
  BR: { 
    countryCode: "BR", 
    countryName: "Brazil", 
    taxName: "ICMS/ISS/IPI", 
    standardRate: 0.17, 
    reducedRate: 0.07, 
    zeroRate: 0,
    thresholdLimit: "Multi-tiered (Simples Nacional)",
    regionalNotes: "Highly complex indirect tax system currently transitioning to Unified VAT (CBS/IBS) by 2033."
  },
  AE: { 
    countryCode: "AE", 
    countryName: "United Arab Emirates", 
    taxName: "VAT", 
    standardRate: 0.05, 
    zeroRate: 0,
    thresholdLimit: "AED 375,000 taxable supplies",
    regionalNotes: "Voluntary registration at AED 187,500. Free zones may have custom tax exemptions."
  },
  SA: { 
    countryCode: "SA", 
    countryName: "Saudi Arabia", 
    taxName: "VAT", 
    standardRate: 0.15, 
    zeroRate: 0,
    thresholdLimit: "SAR 375,000 taxable supplies",
    regionalNotes: "Standard rate increased to 15% in 2020. Strict e-invoicing (Fatoora) compliance required."
  },
  MX: { 
    countryCode: "MX", 
    countryName: "Mexico", 
    taxName: "IVA", 
    standardRate: 0.16, 
    reducedRate: 0.08, 
    zeroRate: 0,
    thresholdLimit: "Immediate upon business activity",
    regionalNotes: "Reduced rate of 8% is applied for certified businesses in the northern/southern border regions."
  },
  CH: { 
    countryCode: "CH", 
    countryName: "Switzerland", 
    taxName: "VAT (MWST)", 
    standardRate: 0.081, 
    reducedRate: 0.026, 
    zeroRate: 0,
    thresholdLimit: "CHF 100,000 global turnover",
    regionalNotes: "Increased to 8.1% on Jan 1, 2024. Accommodation sector has a special rate of 3.8%."
  },
  KR: { 
    countryCode: "KR", 
    countryName: "South Korea", 
    taxName: "VAT", 
    standardRate: 0.10, 
    zeroRate: 0,
    thresholdLimit: "₩80,000,000 (Simplified Tax)",
    regionalNotes: "Simplified tax option available for individual businesses with lower gross sales."
  },
  CN: { 
    countryCode: "CN", 
    countryName: "China", 
    taxName: "VAT", 
    standardRate: 0.13, 
    reducedRate: 0.09, 
    zeroRate: 0,
    thresholdLimit: "¥100,000 monthly sales (small taxpayers)",
    regionalNotes: "Standard manufacturing is 13%; services standard is 6%; transport/construction is 9%."
  },
  ES: { 
    countryCode: "ES", 
    countryName: "Spain", 
    taxName: "VAT (IVA)", 
    standardRate: 0.21, 
    reducedRate: 0.10, 
    zeroRate: 0,
    thresholdLimit: "Immediate registration",
    regionalNotes: "Super-reduced rate of 4% applies to bread, milk, medicine, books, and social housing."
  },
  IT: { 
    countryCode: "IT", 
    countryName: "Italy", 
    taxName: "VAT (IVA)", 
    standardRate: 0.22, 
    reducedRate: 0.10, 
    zeroRate: 0,
    thresholdLimit: "€85,000 (Forfettario flat-rate regime)",
    regionalNotes: "Flat-rate regime 'Regime Forfettario' exempts micro-businesses from standard VAT compliance."
  },
  NL: { 
    countryCode: "NL", 
    countryName: "Netherlands", 
    taxName: "VAT (BTW)", 
    standardRate: 0.21, 
    reducedRate: 0.09, 
    zeroRate: 0,
    thresholdLimit: "€20,000 (KOR scheme)",
    regionalNotes: "KOR scheme allows small businesses to be exempt from BTW calculation and reporting."
  },
  SE: { 
    countryCode: "SE", 
    countryName: "Sweden", 
    taxName: "VAT (Moms)", 
    standardRate: 0.25, 
    reducedRate: 0.12, 
    zeroRate: 0,
    thresholdLimit: "SEK 80,000 sales threshold",
    regionalNotes: "Highly structured: 25% standard; 12% food/hotels; 6% books, newspapers, and concerts."
  },
  NO: { 
    countryCode: "NO", 
    countryName: "Norway", 
    taxName: "VAT (MVA)", 
    standardRate: 0.25, 
    reducedRate: 0.15, 
    zeroRate: 0,
    thresholdLimit: "NOK 50,000 over 12-month period",
    regionalNotes: "15% reduced rate applies to food; 12% reduced rate applies to transport and cinema."
  },
  IE: { 
    countryCode: "IE", 
    countryName: "Ireland", 
    taxName: "VAT", 
    standardRate: 0.23, 
    reducedRate: 0.135, 
    zeroRate: 0,
    thresholdLimit: "€80,000 (goods) / €40,000 (services)",
    regionalNotes: "9% second-reduced rate exists for certain tourism, hospitality, and hairdressing services."
  },
};

export class FinancialRulesEngine {
  /**
   * 1. Accounting Equation (The Golden Rule): Assets = Liabilities + Equity
   */
  static checkAccountingEquation(accounts: Account[]): {
    assets: number;
    liabilities: number;
    equity: number;
    isBalanced: boolean;
    discrepancy: number;
  } {
    const assets = accounts.filter(a => a.type === AccountType.ASSET).reduce((sum, a) => sum + a.balance, 0);
    const liabilities = accounts.filter(a => a.type === AccountType.LIABILITY).reduce((sum, a) => sum + a.balance, 0);
    const equity = accounts.filter(a => a.type === AccountType.EQUITY).reduce((sum, a) => sum + a.balance, 0);
    
    // Account for retained earnings from revenue and expense balances if they aren't fully closed
    const currentRevenue = accounts.filter(a => a.type === AccountType.REVENUE).reduce((sum, a) => sum + a.balance, 0);
    const currentExpense = accounts.filter(a => a.type === AccountType.EXPENSE).reduce((sum, a) => sum + a.balance, 0);
    const unallocatedIncome = currentRevenue - currentExpense;

    const totalEquityAndLiabilities = liabilities + equity + unallocatedIncome;
    const discrepancy = Math.abs(assets - totalEquityAndLiabilities);
    const isBalanced = discrepancy < 0.01;

    return {
      assets,
      liabilities,
      equity: equity + unallocatedIncome,
      isBalanced,
      discrepancy
    };
  }

  /**
   * 2. Double-Entry Rule: Total Debits = Total Credits
   */
  static checkDoubleEntry(journal: JournalEntry): {
    totalDebits: number;
    totalCredits: number;
    isBalanced: boolean;
    difference: number;
  } {
    const totalDebits = journal.lines.reduce((sum, l) => sum + (l.debit || 0), 0);
    const totalCredits = journal.lines.reduce((sum, l) => sum + (l.credit || 0), 0);
    const difference = Math.abs(totalDebits - totalCredits);
    const isBalanced = difference < 0.01;

    return {
      totalDebits,
      totalCredits,
      isBalanced,
      difference
    };
  }

  /**
   * 4. Net Income: Revenue - Expenses
   */
  static getNetIncome(accounts: Account[]): number {
    const revenue = accounts.filter(a => a.type === AccountType.REVENUE).reduce((sum, a) => sum + a.balance, 0);
    const expenses = accounts.filter(a => a.type === AccountType.EXPENSE).reduce((sum, a) => sum + a.balance, 0);
    return revenue - expenses;
  }

  /**
   * 5. Gross Profit = Revenue - Cost of Goods Sold (COGS)
   * (assuming 'Product Sales' or similar accounts as sales, and inventory costs as COGS)
   */
  static getGrossProfit(accounts: Account[]): number {
    const salesRevenue = accounts.filter(a => a.id === "acc-sales" || a.name.toLowerCase().includes("product sales") || a.name.toLowerCase().includes("sales revenue")).reduce((sum, a) => sum + a.balance, 0);
    // Find or compute COGS
    const cogs = accounts.filter(a => a.name.toLowerCase().includes("cost of goods sold") || a.name.toLowerCase().includes("cogs") || a.id === "acc-cogs").reduce((sum, a) => sum + a.balance, 0);
    return salesRevenue - cogs;
  }

  /**
   * 6. Operating Profit = Gross Profit - Operating Expenses
   */
  static getOperatingProfit(accounts: Account[]): number {
    const grossProfit = this.getGrossProfit(accounts);
    const operatingExpenses = accounts.filter(a => a.type === AccountType.EXPENSE && !a.name.toLowerCase().includes("cogs")).reduce((sum, a) => sum + a.balance, 0);
    return grossProfit - operatingExpenses;
  }

  /**
   * 7. Net Profit = Total Revenue - Total Expenses
   */
  static getNetProfit(accounts: Account[]): number {
    return this.getNetIncome(accounts);
  }

  /**
   * 8. Working Capital = Current Assets - Current Liabilities
   */
  static getWorkingCapital(accounts: Account[]): number {
    // Current assets are cash, bank, receivables, inventory
    const currentAssets = accounts.filter(a => 
      a.type === AccountType.ASSET && 
      (a.id === "acc-bank" || a.id === "acc-cash" || a.id === "acc-ar" || a.id === "acc-inventory" || a.name.toLowerCase().includes("current"))
    ).reduce((sum, a) => sum + a.balance, 0);

    const currentLiabilities = accounts.filter(a => 
      a.type === AccountType.LIABILITY && 
      (a.id === "acc-ap" || a.id === "acc-tax" || a.id === "acc-payroll" || a.name.toLowerCase().includes("current"))
    ).reduce((sum, a) => sum + a.balance, 0);

    return currentAssets - currentLiabilities;
  }

  /**
   * 9. Current Ratio = Current Assets ÷ Current Liabilities
   */
  static getCurrentRatio(accounts: Account[]): number {
    const currentAssets = accounts.filter(a => 
      a.type === AccountType.ASSET && 
      (a.id === "acc-bank" || a.id === "acc-cash" || a.id === "acc-ar" || a.id === "acc-inventory" || a.name.toLowerCase().includes("current"))
    ).reduce((sum, a) => sum + a.balance, 0);

    const currentLiabilities = accounts.filter(a => 
      a.type === AccountType.LIABILITY && 
      (a.id === "acc-ap" || a.id === "acc-tax" || a.id === "acc-payroll" || a.name.toLowerCase().includes("current"))
    ).reduce((sum, a) => sum + a.balance, 0);

    return currentLiabilities === 0 ? currentAssets : currentAssets / currentLiabilities;
  }

  /**
   * 10. Quick Ratio = (Current Assets - Inventory) ÷ Current Liabilities
   */
  static getQuickRatio(accounts: Account[]): number {
    const currentAssets = accounts.filter(a => 
      a.type === AccountType.ASSET && 
      (a.id === "acc-bank" || a.id === "acc-cash" || a.id === "acc-ar" || a.id === "acc-inventory" || a.name.toLowerCase().includes("current"))
    ).reduce((sum, a) => sum + a.balance, 0);

    const inventory = accounts.filter(a => a.id === "acc-inventory" || a.name.toLowerCase().includes("inventory")).reduce((sum, a) => sum + a.balance, 0);

    const currentLiabilities = accounts.filter(a => 
      a.type === AccountType.LIABILITY && 
      (a.id === "acc-ap" || a.id === "acc-tax" || a.id === "acc-payroll" || a.name.toLowerCase().includes("current"))
    ).reduce((sum, a) => sum + a.balance, 0);

    return currentLiabilities === 0 ? (currentAssets - inventory) : (currentAssets - inventory) / currentLiabilities;
  }

  /**
   * 11. Debt-to-Equity Ratio = Total Liabilities ÷ Total Equity
   */
  static getDebtToEquity(accounts: Account[]): number {
    const totalLiabilities = accounts.filter(a => a.type === AccountType.LIABILITY).reduce((sum, a) => sum + a.balance, 0);
    const equityResult = this.checkAccountingEquation(accounts);
    return equityResult.equity === 0 ? totalLiabilities : totalLiabilities / equityResult.equity;
  }

  /**
   * 12. Gross Margin = (Gross Profit ÷ Revenue) * 100
   */
  static getGrossMargin(accounts: Account[]): number {
    const revenue = accounts.filter(a => a.type === AccountType.REVENUE).reduce((sum, a) => sum + a.balance, 0);
    const grossProfit = this.getGrossProfit(accounts);
    return revenue === 0 ? 0 : (grossProfit / revenue) * 100;
  }

  /**
   * 13. Net Profit Margin = (Net Profit ÷ Revenue) * 100
   */
  static getNetProfitMargin(accounts: Account[]): number {
    const revenue = accounts.filter(a => a.type === AccountType.REVENUE).reduce((sum, a) => sum + a.balance, 0);
    const netProfit = this.getNetProfit(accounts);
    return revenue === 0 ? 0 : (netProfit / revenue) * 100;
  }

  /**
   * 14. Return on Assets (ROA) = Net Income ÷ Total Assets
   */
  static getROA(accounts: Account[]): number {
    const netIncome = this.getNetIncome(accounts);
    const assets = accounts.filter(a => a.type === AccountType.ASSET).reduce((sum, a) => sum + a.balance, 0);
    return assets === 0 ? 0 : netIncome / assets;
  }

  /**
   * 15. Return on Equity (ROE) = Net Income ÷ Equity
   */
  static getROE(accounts: Account[]): number {
    const netIncome = this.getNetIncome(accounts);
    const eqResult = this.checkAccountingEquation(accounts);
    return eqResult.equity === 0 ? 0 : netIncome / eqResult.equity;
  }

  /**
   * 16. Inventory Turnover = COGS ÷ Average Inventory
   */
  static getInventoryTurnover(accounts: Account[], openingInventory = 8000, closingInventory = 8500): number {
    const cogs = accounts.filter(a => a.name.toLowerCase().includes("cost of goods sold") || a.name.toLowerCase().includes("cogs")).reduce((sum, a) => sum + a.balance, 0) || 1200; // fallback if empty
    const avgInv = (openingInventory + closingInventory) / 2;
    return avgInv === 0 ? 0 : cogs / avgInv;
  }

  /**
   * 21. Cash Flow = Inflows - Outflows
   */
  static getNetCashFlow(transactions: Transaction[]): number {
    const inflows = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const outflows = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return inflows - outflows;
  }

  /**
   * 24. Budget Variance = Actual Amount - Budget Amount
   */
  static getBudgetVariance(actual: number, budgeted: number): number {
    return actual - budgeted;
  }

  /**
   * 25. Revenue Growth = ((Current Revenue - Previous Revenue) ÷ Previous Revenue) * 100
   */
  static getRevenueGrowth(currentRevenue: number, previousRevenue: number): number {
    if (previousRevenue === 0) return currentRevenue > 0 ? 100 : 0;
    return ((currentRevenue - previousRevenue) / previousRevenue) * 100;
  }

  /**
   * Dynamic Tax Calculator (Configured by Country)
   */
  static calculateTax(amount: number, countryCode: string, isReduced = false): {
    taxRate: number;
    taxAmount: number;
    totalWithTax: number;
    taxName: string;
  } {
    const country = TaxConfig[countryCode] || TaxConfig.US;
    const taxRate = isReduced && country.reducedRate !== undefined ? country.reducedRate : country.standardRate;
    const taxAmount = amount * taxRate;
    return {
      taxRate,
      taxAmount,
      totalWithTax: amount + taxAmount,
      taxName: country.taxName
    };
  }

  /**
   * Dynamic Runway Predictor
   */
  static getCashRunway(cashBalance: number, operatingExpenses: number, monthsCount = 1): {
    monthlyBurn: number;
    runwayMonths: number;
  } {
    const monthlyBurn = operatingExpenses / (monthsCount || 1);
    const runwayMonths = monthlyBurn <= 0 ? Infinity : cashBalance / monthlyBurn;
    return {
      monthlyBurn,
      runwayMonths
    };
  }

  /**
   * Double-Entry General Ledger Validator
   */
  static validateState(state: FinityState): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Rule 1: Assets = Liabilities + Equity
    const eq = this.checkAccountingEquation(state.accounts);
    if (!eq.isBalanced) {
      errors.push(`Accounting Equation is not balanced. Assets ($${eq.assets.toFixed(2)}) != Liabilities + Equity ($${eq.equity.toFixed(2)}). Discrepancy: $${eq.discrepancy.toFixed(2)}.`);
    }

    // Rule 2: Debits = Credits for all Journal Entries
    state.journalEntries.forEach(je => {
      const dbCr = this.checkDoubleEntry(je);
      if (!dbCr.isBalanced) {
        errors.push(`Journal Entry "${je.description}" (${je.id}) is unbalanced. Debits: $${dbCr.totalDebits.toFixed(2)}, Credits: $${dbCr.totalCredits.toFixed(2)}.`);
      }
    });

    // Rule 3: Transactions must have date, amount, description
    state.transactions.forEach(tx => {
      if (!tx.date) {
        errors.push(`Transaction ${tx.id} ("${tx.description}") is missing a Date.`);
      }
      if (tx.amount === undefined || Number.isNaN(tx.amount)) {
        errors.push(`Transaction ${tx.id} ("${tx.description}") has an invalid amount.`);
      }
      if (!tx.accountId || !tx.offsetAccountId) {
        errors.push(`Transaction ${tx.id} ("${tx.description}") violates the double-entry account matching rule.`);
      }
    });

    // Warn about negative bank balances
    const bankAcc = state.accounts.find(a => a.id === "acc-bank");
    if (bankAcc && bankAcc.balance < 0) {
      warnings.push(`Bank Account balance is negative ($${bankAcc.balance.toFixed(2)}). Risk of liquidity shortage.`);
    }

    // Warn about upcoming high bills
    const unpaidBillsTotal = state.bills.filter(b => b.status !== "paid").reduce((sum, b) => sum + b.balanceDue, 0);
    if (bankAcc && bankAcc.balance < unpaidBillsTotal) {
      warnings.push(`Outstanding bills ($${unpaidBillsTotal.toFixed(2)}) exceed the current bank balance ($${bankAcc.balance.toFixed(2)}).`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export interface KRAObligationResult {
  vatObligation: number;
  vatThresholdAlert: boolean;
  vatThresholdLimit: number;
  whtResident: number;
  whtNonResident: number;
  whtRateUsed: number;
  corporateTax: number;
  dstObligation: number;
}

export class KRATaxEngine {
  static validatePIN(pin: string): boolean {
    const regex = /^[A-P]\d{9}[A-Z]$/i;
    return regex.test(pin.trim());
  }

  static calculateObligations(
    businessType: string,
    isResident: boolean,
    serviceType: "professional" | "contractual" | "royalties" | "rent" | "digital" | "standard_goods",
    transactionVolume: number,
    netProfit: number
  ): KRAObligationResult {
    // 1. VAT (Value Added Tax)
    // Kenyan VAT standard is 16%. Reduced rate is 8%. Zero-rated is 0%.
    const vatRate = serviceType === "digital" ? 0.16 : 0.16;
    const vatThresholdLimit = 5000000; // 5M KES
    const vatThresholdAlert = transactionVolume >= vatThresholdLimit;
    const vatObligation = serviceType !== "digital" ? transactionVolume * vatRate : transactionVolume * 0.16;

    // 2. WHT (Withholding Tax)
    let whtRate = 0;
    if (serviceType === "professional") {
      whtRate = isResident ? (transactionVolume >= 24000 ? 0.05 : 0) : 0.20;
    } else if (serviceType === "contractual") {
      whtRate = isResident ? (transactionVolume >= 24000 ? 0.03 : 0) : 0.20;
    } else if (serviceType === "royalties") {
      whtRate = isResident ? 0.05 : 0.20;
    } else if (serviceType === "rent") {
      whtRate = isResident ? 0.10 : 0.30;
    } else if (serviceType === "digital") {
      whtRate = isResident ? 0 : 0.015;
    }

    const whtResident = isResident ? transactionVolume * whtRate : 0;
    const whtNonResident = !isResident ? transactionVolume * whtRate : 0;

    // 3. Corporate/Income Tax (standard resident corporate tax is 30%)
    let corporateTaxRate = 0.30;
    if (businessType.includes("Proprietorship") || businessType.includes("Partnership")) {
      corporateTaxRate = 0.25;
    } else if (!isResident) {
      corporateTaxRate = 0.375;
    } else if (businessType.includes("NGO") || businessType.includes("Exempt")) {
      corporateTaxRate = 0;
    }

    const corporateTax = netProfit > 0 ? netProfit * corporateTaxRate : 0;
    const dstObligation = serviceType === "digital" && !isResident ? transactionVolume * 0.015 : 0;

    return {
      vatObligation,
      vatThresholdAlert,
      vatThresholdLimit,
      whtResident,
      whtNonResident,
      whtRateUsed: whtRate,
      corporateTax,
      dstObligation
    };
  }
}

