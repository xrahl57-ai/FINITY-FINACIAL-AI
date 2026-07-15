import React, { useState, useEffect } from "react";
import {
  User,
  Building,
  MapPin,
  DollarSign,
  Layers,
  Users,
  CreditCard,
  Settings,
  Sparkles,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Shield,
  Lock,
  Plus,
  Trash,
  Globe,
  Upload,
  Info,
  ArrowRight,
  Database,
  Briefcase,
  Sliders,
  Check,
  RefreshCw,
  Clock,
  ExternalLink,
  MessageSquare,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { FinityState } from "../types";

// Default mockup logos for Step 2
const LOGO_TEMPLATES = [
  { id: "logo-1", name: "Apex Gold Monogram", letters: "A", colors: "from-amber-500 to-yellow-600" },
  { id: "logo-2", name: "Finity Sovereign Blue", letters: "F", colors: "from-blue-600 to-cyan-500" },
  { id: "logo-3", name: "Vector Emerald Core", letters: "V", colors: "from-emerald-500 to-teal-600" },
  { id: "logo-4", name: "Symmetric Purple Edge", letters: "S", colors: "from-indigo-600 to-purple-600" },
];

interface OnboardingWizardProps {
  onOnboardingComplete: (state: FinityState, viewAction?: string) => void;
}

export default function OnboardingWizard({ onOnboardingComplete }: OnboardingWizardProps) {
  const [onboardingType, setOnboardingType] = useState<"choose" | "business" | "personal">(() => {
    const saved = localStorage.getItem("finity-onboarding-type");
    const val = (saved as "choose" | "business" | "personal") || "choose";
    console.log("DEBUG: Initial onboardingType:", val);
    return val;
  });

  // Steps tracking (0 to 9)
  const [currentStep, setCurrentStep] = useState<number>(() => {
    const saved = localStorage.getItem("finity-onboarding-step");
    const step = saved ? parseInt(saved, 10) : 0;
    console.log("DEBUG: Initial currentStep:", step);
    return step;
  });

  console.log("DEBUG: Rendering OnboardingWizard. currentStep:", currentStep, "onboardingType:", onboardingType);
  console.log("OnboardingWizard rendered, step:", currentStep);

  // State for all collected onboarding data
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem("finity-onboarding-data");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved onboarding data", e);
      }
    }
    return {
      // Step 1: Account Setup
      account: {
        fullName: "",
        workEmail: "",
        password: "",
        confirmPassword: "",
        mfaEnabled: false,
        mfaCode: "",
        verificationCode: "",
        isVerified: false,
      },
      // Step 2: Company Information
      companyInfo: {
        companyName: "",
        legalBusinessName: "",
        businessRegistrationNumber: "",
        businessType: "LLC",
        industry: "SaaS & Technology",
        companySize: "11-50",
        employees: "",
        logo: "logo-1", // default template ID
        website: "",
        businessDescription: "",
        businessEmail: "",
        businessPhone: "",
        businessContactInfo: "",
      },
      // Step 3: Location
      location: {
        country: "Kenya",
        state: "Nairobi",
        city: "Nairobi",
        address: "Kilimani",
        postalCode: "00100",
        timezone: "Africa/Nairobi",
        language: "English (KE)",
      },
      // Step 4: Financial Configuration
      financial: {
        currency: "KES",
        fiscalYearStart: "January",
        accountingMethod: "Accrual",
        taxRegistrationNumber: "",
        taxSettings: "VAT Standard (16%)",
        autoSettle: true,
        blockNegative: true,
        syncLedger: true,
      },
      // Step 5: Organization Structure
      structure: {
        departments: ["Engineering", "Sales", "Marketing", "Operations"],
        branches: ["Nairobi HQ", "Mombasa Branch"],
        costCenters: ["CC-101 Kilimani", "CC-102 Westlands"],
      },
      // Step 6: Invite Team Members
      team: [
        { name: "Sarah Jenkins", email: "sarah@finity-customer.com", role: "Accountant" },
        { name: "Michael Vance", email: "michael@finity-customer.com", role: "Finance Manager" },
      ],
      // Step 7: Connect Financial Accounts
      connected: {
        bankName: "Equity Bank Kenya",
        accountNumber: "•••• 4422",
        bankBalance: "5000000",
        gatewayConnected: "M-Pesa Safaricom",
        walletConnected: true,
      },
      // Personal Workspace path fields
      personal: {
        name: "",
        country: "Kenya",
        currency: "KES",
        timezone: "Africa/Nairobi",
        language: "English (KE)",
        goals: "Expense Tracking & Wealth Management",
      }
    };
  });

  // Interactive helper state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [emailVerifyCode, setEmailVerifyCode] = useState("");
  const [enteredVerifyCode, setEnteredVerifyCode] = useState("");
  const [emailVerifySuccess, setEmailVerifySuccess] = useState(false);
  const [emailVerifyUrl, setEmailVerifyUrl] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  // Custom tag builders
  const [newDept, setNewDept] = useState("");
  const [newBranch, setNewBranch] = useState("");
  const [newCostCenter, setNewCostCenter] = useState("");

  // Team builder state
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("Accountant");

  // Step 8 live logs state
  const [initializationProgress, setInitializationProgress] = useState(0);
  const [initializationLogs, setInitializationLogs] = useState<string[]>([]);

  // Auto-save form progress to localStorage
  useEffect(() => {
    localStorage.setItem("finity-onboarding-type", onboardingType);
    localStorage.setItem("finity-onboarding-step", currentStep.toString());
    localStorage.setItem("finity-onboarding-data", JSON.stringify(formData));
  }, [onboardingType, currentStep, formData]);

  // Send real SMTP verification email
  const sendEmailVerification = async () => {
    if (!formData.account.workEmail) {
      setValidationErrors(prev => ({ ...prev, workEmail: "Email is required to verify" }));
      return;
    }
    setIsSendingEmail(true);
    setValidationErrors(prev => {
      const copy = { ...prev };
      delete copy.emailVerification;
      return copy;
    });

    try {
      const response = await fetch("/api/onboarding/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.account.workEmail })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setIsVerifyingEmail(true);
        if (data.viewUrl) {
          setEmailVerifyUrl(data.viewUrl);
        }
      } else {
        setValidationErrors(prev => ({ ...prev, emailVerification: data.error || "Failed to dispatch verification email." }));
      }
    } catch (err) {
      setValidationErrors(prev => ({ ...prev, emailVerification: "Failed to connect to security mail server." }));
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Verify real verification code
  const handleVerifyCodeSubmit = async () => {
    if (!enteredVerifyCode.trim()) {
      setValidationErrors(prev => ({ ...prev, emailVerification: "Verification code is required." }));
      return;
    }

    try {
      const response = await fetch("/api/onboarding/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.account.workEmail,
          code: enteredVerifyCode
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setEmailVerifySuccess(true);
        setFormData(prev => ({
          ...prev,
          account: { ...prev.account, isVerified: true }
        }));
        setValidationErrors(prev => {
          const copy = { ...prev };
          delete copy.emailVerification;
          return copy;
        });
        setIsVerifyingEmail(false);
      } else {
        setValidationErrors(prev => ({ ...prev, emailVerification: data.error || "Incorrect verification code." }));
      }
    } catch (err) {
      setValidationErrors(prev => ({ ...prev, emailVerification: "Network error during code verification." }));
    }
  };

  // Live Password Strength Calculation
  const getPasswordStrength = () => {
    const pw = formData.account.password;
    if (!pw) return { text: "No Password", score: 0, color: "bg-border-subtle" };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    switch (score) {
      case 1: return { text: "Weak", score: 25, color: "bg-brand-red" };
      case 2: return { text: "Medium", score: 50, color: "bg-brand-amber" };
      case 3: return { text: "Strong", score: 75, color: "bg-brand-emerald" };
      case 4: return { text: "Bulletproof", score: 100, color: "bg-brand-gold" };
      default: return { text: "Too Short", score: 10, color: "bg-brand-red" };
    }
  };

  // Form step-specific validations
  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};
    
    if (onboardingType === "choose") {
      return true;
    }

    if (onboardingType === "personal") {
      // Personal Flow Steps: 0: Choose, 1: Details, 2: Initialization, 3: Success
      if (step === 1) {
        if (!formData.personal.name.trim()) errors.personalName = "Full Name is required";
        if (!formData.personal.country) errors.personalCountry = "Country is required";
        if (!formData.personal.currency) errors.personalCurrency = "Base Currency is required";
      }
      setValidationErrors(errors);
      return Object.keys(errors).length === 0;
    }

    // Business Flow Step validations
    switch (step) {
      case 1: // Create Account
        if (!formData.account.fullName.trim()) errors.fullName = "Full Name is required";
        if (!formData.account.workEmail.trim()) {
          errors.workEmail = "Work Email is required";
        } else if (!/\S+@\S+\.\S+/.test(formData.account.workEmail)) {
          errors.workEmail = "Invalid email formatting";
        }
        if (!formData.account.password) {
          errors.password = "Password is required";
        } else if (formData.account.password.length < 8) {
          errors.password = "Password must be at least 8 characters";
        }
        if (formData.account.password !== formData.account.confirmPassword) {
          errors.confirmPassword = "Passwords do not match";
        }
        break;

      case 2: // Company Info
        if (!formData.companyInfo.companyName.trim()) {
          errors.companyName = "Company Name is required to bind workspace metadata";
        }
        if (!formData.companyInfo.businessDescription.trim()) {
          errors.businessDescription = "A simple business description is required so Finity Agent can suggest possible outcomes";
        }
        if (!formData.companyInfo.businessEmail.trim()) {
          errors.businessEmail = "Business Email is required for contact records";
        } else if (!/\S+@\S+\.\S+/.test(formData.companyInfo.businessEmail)) {
          errors.businessEmail = "Invalid business email format";
        }
        if (!formData.companyInfo.businessPhone.trim()) {
          errors.businessPhone = "Business Phone is required for contact records";
        }
        if (formData.companyInfo.website && !formData.companyInfo.website.startsWith("http") && !formData.companyInfo.website.includes(".")) {
          errors.website = "Please enter a valid website domain";
        }
        break;

      case 3: // Location
        if (!formData.location.country.trim()) errors.country = "Country is required";
        if (!formData.location.city.trim()) errors.city = "City is required";
        if (!formData.location.address.trim()) errors.address = "Business Address is required";
        if (!formData.location.postalCode.trim()) errors.postalCode = "Postal Code is required";
        break;

      case 4: // Financial Config
        if (!formData.financial.currency) errors.currency = "Base currency is required";
        if (!formData.financial.fiscalYearStart) errors.fiscalYearStart = "Fiscal Year Start month is required";
        if (!formData.financial.accountingMethod) errors.accountingMethod = "Accounting method is required";
        break;

      default:
        break;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (onboardingType === "personal") {
        if (currentStep === 1) {
          // Go to personal initialization
          setCurrentStep(8);
        } else {
          setCurrentStep(prev => prev + 1);
        }
      } else {
        setCurrentStep(prev => prev + 1);
      }
    }
  };

  const handleBack = () => {
    if (onboardingType === "personal" && currentStep === 8) {
      setCurrentStep(1);
    } else {
      setCurrentStep(prev => Math.max(1, prev - 1));
    }
  };

  // Run automatic initialization logs on Step 8
  useEffect(() => {
    if (currentStep === 8) {
      setInitializationProgress(1);
      setInitializationLogs(["[FINITY OS CORE] Initiating secure sandbox provisioning protocol..."]);
      
      const logTemplates = onboardingType === "business" ? [
        "Binding legal entity profile: " + formData.companyInfo.companyName,
        "Encrypting security credential keys (SHA-256 Multi-Factor Layer)",
        "Building tailored Chart of Accounts (GAAP Standard) in " + formData.financial.currency,
        "Initializing active General Ledger database arrays",
        "Binding country-specific accounting guidelines for " + formData.location.country,
        "Registering tax profile (Tax ID: " + (formData.financial.taxRegistrationNumber || "N/A") + ")",
        "Mapping custom organizational cost centers and branch hubs",
        "Injecting team member accounts: " + (formData.team.map(t => t.name).join(", ") || "Owner only"),
        "Syncing banking ledger feeds with " + (formData.connected.bankName || "Offline Feeds"),
        "Establishing webhook pipelines with Stripe API Checkout Gateway",
        "Configuring real-time reporting matrices (Income, Balance, Cash Flow)",
        "Activating Finity AI Copilot Core System Workspace",
        "Publishing locked system profile to local secure partition",
        "Generating initial compliance audit signatures..."
      ] : [
        "Binding personal finance profile: " + formData.personal.name,
        "Setting up custom individual wealth accounts ledger",
        "Creating Personal Checking, Savings, and Credit Card databases",
        "Configuring personal goals monitor: " + (formData.personal.goals || "N/A"),
        "Activating dual personal wallet pipelines in " + formData.personal.currency,
        "Connecting Finity Premium personal checking feed simulation",
        "Pre-loading personal budgeting and expense rules charts",
        "Activating Finity AI Copilot Core Companion",
        "Generating diagnostic ledger health report..."
      ];

      let logIndex = 0;
      const stepInterval = Math.max(350, Math.ceil(4800 / logTemplates.length));
      const interval = setInterval(() => {
        if (logIndex < logTemplates.length) {
          const newLog = `[✓] ${logTemplates[logIndex]}`;
          setInitializationLogs(prev => [...prev, newLog]);
          setInitializationProgress(prev => Math.min(100, Math.floor(((logIndex + 1) / logTemplates.length) * 100)));
          logIndex++;
        } else {
          clearInterval(interval);
          setInitializationProgress(100);
          setInitializationLogs(prev => [...prev, "✨ Finity Workspace successfully provisioned and secured! Locking configuration..."]);
          // Complete onboarding API call and advance to Step 9
          saveOnboardingToDatabase().finally(() => {
            setTimeout(() => {
              setCurrentStep(9);
            }, 1200);
          });
        }
      }, stepInterval);

      return () => clearInterval(interval);
    }
  }, [currentStep]);

  // Call server to write initial state
  const saveOnboardingToDatabase = async () => {
    try {
      const response = await fetch("/api/state/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          onboardingType,
          account: formData.account,
          companyInfo: formData.companyInfo,
          location: formData.location,
          financial: formData.financial,
          structure: formData.structure,
          team: formData.team,
          connected: formData.connected,
          personal: formData.personal,
        }),
      });
      const result = await response.json();
      if (result.status === "success") {
        console.log("Onboarding saved successfully server-side.");
      } else {
        console.error("Failed to save onboarding server-side:", result.error);
      }
    } catch (e) {
      console.error("Network error saving onboarding database:", e);
    }
  };

  // Final success action router
  const handleFinalRedirect = (viewAction?: string) => {
    console.log("DEBUG: handleFinalRedirect clicked with action:", viewAction);
    // We clear localStorage onboarding so they start fresh if they reset, 
    // but the actual onboarded state is written to the server's database file!
    localStorage.removeItem("finity-onboarding-step");
    localStorage.removeItem("finity-onboarding-type");
    localStorage.removeItem("finity-onboarding-data");

    // Fetch state again via callback
    fetch("/api/state")
      .then(res => res.json())
      .then(data => {
        console.log("DEBUG: /api/state fetched:", data);
        onOnboardingComplete(data.state || data, viewAction);
      })
      .catch(err => {
        console.error("DEBUG: /api/state fetch error:", err);
      });
  };

  // Quick helper to add organization department/branch/cost tags
  const addTag = (type: "departments" | "branches" | "costCenters", tag: string, setTagInput: React.Dispatch<React.SetStateAction<string>>) => {
    if (!tag.trim()) return;
    setFormData(prev => ({
      ...prev,
      structure: {
        ...prev.structure,
        [type]: [...(prev.structure[type] as string[]), tag.trim()]
      }
    }));
    setTagInput("");
  };

  const removeTag = (type: "departments" | "branches" | "costCenters", index: number) => {
    setFormData(prev => ({
      ...prev,
      structure: {
        ...prev.structure,
        [type]: (prev.structure[type] as string[]).filter((_, i) => i !== index)
      }
    }));
  };

  // Quick helper to add team member invites
  const addTeamMember = () => {
    if (!newMemberName.trim() || !newMemberEmail.trim()) {
      alert("Name and email are required to send an invitation slot");
      return;
    }
    setFormData(prev => ({
      ...prev,
      team: [...prev.team, { name: newMemberName.trim(), email: newMemberEmail.trim(), role: newMemberRole }]
    }));
    setNewMemberName("");
    setNewMemberEmail("");
  };

  const removeTeamMember = (index: number) => {
    setFormData(prev => ({
      ...prev,
      team: prev.team.filter((_, i) => i !== index)
    }));
  };

  // Step names for Business Flow
  const stepTitles = [
    "Workspace Selection",
    "Account Credentials",
    "Company Profile",
    "Location Defaults",
    "Financial Setup",
    "Organizational Units",
    "Team Permission Matrix",
    "Treasury Integration",
    "Secure Deployment",
    "Onboarding Complete"
  ];

  return (
    <div className="min-h-screen w-screen bg-app-bg text-text-main flex flex-col justify-between overflow-y-auto select-none font-sans" id="onboarding-wizard-container">
      {/* 1. Header Banner */}
      <header className="border-b border-border-subtle bg-sidebar-bg px-6 py-4 flex items-center justify-between shrink-0" id="onboarding-header">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-primary border border-brand-gold/30 flex items-center justify-center text-brand-gold font-mono font-extrabold text-base tracking-tighter">
            f.
          </div>
          <div className="flex flex-col">
            <span className="font-sans font-black text-text-main text-sm tracking-tight leading-none">Finity OS Onboarding</span>
            <span className="font-mono text-[8px] uppercase font-bold text-brand-gold tracking-widest mt-0.5">Guided Workspace Setup</span>
          </div>
        </div>
        
        {onboardingType !== "choose" && currentStep > 0 && currentStep < 8 && (
          <div className="flex items-center gap-2 text-xs font-mono text-brand-gold bg-brand-gold-light px-3 py-1.5 border border-brand-gold/25 rounded-xl">
            <Sliders size={12} className="animate-spin-slow" />
            <span className="hidden sm:inline">Progress:</span>
            <span>{onboardingType === "business" ? Math.floor((currentStep / 7) * 100) : Math.floor((currentStep / 1) * 100)}%</span>
          </div>
        )}
      </header>

      {/* 2. Main Stage Content */}
      <div className="flex-1 flex flex-col md:flex-row relative max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 gap-8 items-stretch h-full" id="onboarding-stage">
        
        {/* Left Indicator Sidebar (Desktop only) */}
        {onboardingType !== "choose" && currentStep < 8 && (
          <aside className="w-80 hidden md:flex flex-col gap-6 p-6 bg-sidebar-bg border border-border-subtle rounded-3xl shrink-0 h-fit" id="onboarding-aside-steps">
            <div className="space-y-1">
              <h3 className="font-sans font-black text-sm tracking-tight text-text-main">
                {onboardingType === "business" ? "Business Workspace Registration" : "Personal Workspace Onboarding"}
              </h3>
              <p className="text-[10px] text-text-muted font-mono uppercase tracking-wider">
                Finity Secure Sandbox v1.2
              </p>
            </div>

            {/* Steps Vertical Timeline */}
            <nav className="space-y-2">
              {onboardingType === "business" ? (
                // Business timeline 1 to 7
                [1, 2, 3, 4, 5, 6, 7].map((stepNum) => {
                  const isActive = currentStep === stepNum;
                  const isCompleted = currentStep > stepNum;
                  return (
                    <div
                      key={stepNum}
                      className={`flex items-center gap-3.5 p-2.5 rounded-2xl transition border ${
                        isActive
                          ? "bg-brand-gold-light/40 border-brand-gold/30 text-brand-gold font-bold shadow-sm"
                          : isCompleted
                          ? "bg-hover-bg/20 border-transparent text-brand-emerald"
                          : "border-transparent text-text-muted opacity-60"
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold ${
                        isActive
                          ? "bg-brand-gold text-brand-primary"
                          : isCompleted
                          ? "bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/30"
                          : "bg-hover-bg text-text-muted border border-border-subtle"
                      }`}>
                        {isCompleted ? <Check size={11} /> : stepNum}
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-xs tracking-tight leading-none">{stepTitles[stepNum]}</span>
                        <span className="text-[9px] text-text-muted font-sans mt-1">
                          {stepNum === 1 && "Security & Auth"}
                          {stepNum === 2 && "Corporate Vitals"}
                          {stepNum === 3 && "Jurisdiction default"}
                          {stepNum === 4 && "Ledger parameters"}
                          {stepNum === 5 && "Cost Centers"}
                          {stepNum === 6 && "User Matrix"}
                          {stepNum === 7 && "Treasury Sync"}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                // Personal timeline
                [1].map((stepNum) => {
                  const isActive = currentStep === stepNum;
                  return (
                    <div
                      key={stepNum}
                      className={`flex items-center gap-3.5 p-3 rounded-2xl transition border ${
                        isActive
                          ? "bg-brand-gold-light/40 border-brand-gold/30 text-brand-gold font-bold shadow-sm"
                          : "border-transparent text-text-muted opacity-60"
                      }`}
                    >
                      <div className="w-6 h-6 rounded-lg bg-brand-gold text-brand-primary flex items-center justify-center text-[10px] font-mono font-bold">
                        1
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-xs tracking-tight leading-none">Personal Parameters</span>
                        <span className="text-[9px] text-text-muted mt-1">Wealth core setup</span>
                      </div>
                    </div>
                  );
                })
              )}
            </nav>

            <div className="border-t border-border-subtle pt-5 space-y-2.5 font-mono text-[9px] text-text-muted">
              <div className="flex items-center gap-2 text-brand-emerald font-bold">
                <Shield size={11} />
                <span>AES-256 ENCRYPTION ON</span>
              </div>
              <p className="leading-relaxed">
                All workspace fields are encrypted client-side prior to server transaction syncing.
              </p>
            </div>
          </aside>
        )}

        {/* Right Active View Card Container */}
        <main className="flex-1 bg-card-bg border border-border-subtle rounded-3xl p-6 sm:p-8 md:p-10 flex flex-col justify-between shadow-xl relative overflow-hidden" id="onboarding-main-pane">
          {/* Subtle background glow refraction */}
          <div className="absolute w-[300px] h-[300px] rounded-full bg-brand-gold/2 blur-[100px] -top-10 -right-10 pointer-events-none" />
          <div className="absolute w-[300px] h-[300px] rounded-full bg-brand-primary-light/5 blur-[120px] -bottom-20 -left-20 pointer-events-none" />

          <div className="relative z-10 w-full flex-1 flex flex-col justify-center">
            
            {/* ========================================================= */}
            {/* STEP 0: WORKSPACE SELECTOR PATH SCREEN */}
            {/* ========================================================= */}
            {currentStep === 0 && onboardingType === "choose" && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8 py-4"
                id="step-choose-path"
              >
                <div className="space-y-3 text-center md:text-left">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-gold-light border border-brand-gold/20 text-brand-gold rounded-full font-mono text-[9px] font-extrabold uppercase tracking-widest">
                    <Sparkles size={11} className="animate-pulse" /> Finity Core Launchpad
                  </div>
                  <h2 className="font-sans font-extrabold text-2xl sm:text-3xl tracking-tight text-text-main">
                    Initialize Your Secure Ledger Core
                  </h2>
                  <p className="text-sm text-text-muted leading-relaxed max-w-2xl">
                    Every account on Finity is provisioned with a private, real-time double-entry accounting engine. Choose the core style that aligns with your financial trajectory.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {/* Business Workspace */}
                  <div
                    onClick={() => {
                      setOnboardingType("business");
                      setCurrentStep(1);
                    }}
                    className="p-6 rounded-2xl bg-hover-bg/30 border border-border-subtle hover:border-brand-gold/50 hover:bg-hover-bg/60 transition duration-300 cursor-pointer group text-left relative"
                    id="choose-path-business"
                  >
                    <div className="absolute top-4 right-4 text-text-muted group-hover:text-brand-gold transition duration-300">
                      <ArrowRight size={16} />
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center text-brand-gold mb-5">
                      <Building size={22} />
                    </div>
                    <h3 className="text-base font-bold text-text-main font-sans tracking-tight mb-2 flex items-center gap-2">
                      Finity Business Workspace
                    </h3>
                    <p className="text-xs text-text-muted leading-relaxed">
                      For registered enterprises, startups, and consulting firms. Collects company registration, cost structures, and supports multi-user team roles, business invoicing, and commercial tax compliance.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-1.5">
                      <span className="text-[9px] font-mono font-bold bg-brand-primary-light/40 border border-brand-primary-light text-text-main px-2 py-0.5 rounded-md">Multi-user RBAC</span>
                      <span className="text-[9px] font-mono font-bold bg-brand-primary-light/40 border border-brand-primary-light text-text-main px-2 py-0.5 rounded-md">General Ledger</span>
                      <span className="text-[9px] font-mono font-bold bg-brand-primary-light/40 border border-brand-primary-light text-text-main px-2 py-0.5 rounded-md">Tax Registries</span>
                    </div>
                  </div>

                  {/* Personal Workspace */}
                  <div
                    onClick={() => {
                      setOnboardingType("personal");
                      setCurrentStep(1);
                    }}
                    className="p-6 rounded-2xl bg-hover-bg/30 border border-border-subtle hover:border-brand-gold/50 hover:bg-hover-bg/60 transition duration-300 cursor-pointer group text-left relative"
                    id="choose-path-personal"
                  >
                    <div className="absolute top-4 right-4 text-text-muted group-hover:text-brand-gold transition duration-300">
                      <ArrowRight size={16} />
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center text-brand-gold mb-5">
                      <User size={22} />
                    </div>
                    <h3 className="text-base font-bold text-text-main font-sans tracking-tight mb-2 flex items-center gap-2">
                      Finity Personal Workspace
                    </h3>
                    <p className="text-xs text-text-muted leading-relaxed">
                      For sole operators, personal investors, and wealth trackers. Simplified single-screen workspace with currency defaults, personal income structures, and wealth-building targets without administrative complexity.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-1.5">
                      <span className="text-[9px] font-mono font-bold bg-brand-primary-light/40 border border-brand-primary-light text-text-main px-2 py-0.5 rounded-md">Wealth Monitor</span>
                      <span className="text-[9px] font-mono font-bold bg-brand-primary-light/40 border border-brand-primary-light text-text-main px-2 py-0.5 rounded-md">Simplified Taxes</span>
                      <span className="text-[9px] font-mono font-bold bg-brand-primary-light/40 border border-brand-primary-light text-text-main px-2 py-0.5 rounded-md">Individual goals</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ========================================================= */}
            {/* BUSINESS STEP 1: CREATE ACCOUNT */}
            {/* ========================================================= */}
            {onboardingType === "business" && currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
                id="business-step-1"
              >
                <div className="space-y-1 text-left">
                  <h3 className="text-lg font-black tracking-tight font-sans text-text-main">Create Your Executive Account</h3>
                  <p className="text-xs text-text-muted leading-normal">
                    Finity uses zero-knowledge server authentication. Establish your workspace owner credentials.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-muted">Full Name</label>
                    <input
                      type="text"
                      className="w-full bg-input-bg border border-border-subtle p-3 rounded-xl text-xs"
                      placeholder="e.g. John Doe"
                      value={formData.account.fullName}
                      onChange={(e) => setFormData(prev => ({ ...prev, account: { ...prev.account, fullName: e.target.value } }))}
                      id="account-full-name"
                    />
                    {validationErrors.fullName && <p className="text-[10px] text-brand-red font-medium">{validationErrors.fullName}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-muted">Work Email</label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        disabled={formData.account.isVerified}
                        className={`flex-1 bg-input-bg border border-border-subtle p-3 rounded-xl text-xs ${formData.account.isVerified ? "opacity-60 bg-hover-bg" : ""}`}
                        placeholder="john@corporation.com"
                        value={formData.account.workEmail}
                        onChange={(e) => setFormData(prev => ({ ...prev, account: { ...prev.account, workEmail: e.target.value, isVerified: false } }))}
                        id="account-work-email"
                      />
                      {!formData.account.isVerified && (
                        <button
                          type="button"
                          onClick={sendEmailVerification}
                          disabled={isSendingEmail}
                          className="bg-hover-bg hover:bg-border-subtle text-text-main border border-border-subtle px-3 rounded-xl text-xs font-bold transition whitespace-nowrap active:scale-95 disabled:opacity-50"
                          id="btn-verify-email-send"
                        >
                          {isSendingEmail ? "Sending..." : "Verify"}
                        </button>
                      )}
                    </div>
                    {validationErrors.workEmail && <p className="text-[10px] text-brand-red font-medium">{validationErrors.workEmail}</p>}
                    {formData.account.isVerified && (
                      <p className="text-[10px] text-brand-emerald font-semibold flex items-center gap-1">
                        <CheckCircle size={10} /> Work email verified securely!
                      </p>
                    )}
                  </div>
                </div>

                {/* Email Verification overlay code panel */}
                {isVerifyingEmail && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-hover-bg/30 border border-brand-gold/30 text-left space-y-3"
                    id="email-verification-subpanel"
                  >
                    <div className="flex items-start gap-2.5">
                      <Info size={14} className="text-brand-gold mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-xs font-bold text-text-main font-sans flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-ping" />
                          Secure Verification Dispatch
                        </h4>
                        <p className="text-[11px] text-text-muted mt-1 leading-normal">
                          Finity's SMTP server dispatched a 6-digit confirmation pin to <span className="text-brand-gold font-mono">{formData.account.workEmail}</span>. Enter the code below.
                        </p>
                        {emailVerifyUrl && (
                          <div className="mt-2.5 p-2 bg-brand-gold/10 border border-brand-gold/20 rounded-lg flex items-center justify-between gap-2">
                            <span className="text-[10px] text-text-muted">SMTP Sandbox Inbox Delivery:</span>
                            <a
                              href={emailVerifyUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-bold text-brand-gold hover:underline flex items-center gap-1"
                            >
                              <span>Inspect Sent Email ↗</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 max-w-[280px]">
                      <input
                        type="text"
                        maxLength={6}
                        className="bg-input-bg border border-border-subtle p-2.5 rounded-xl text-center font-mono text-sm tracking-widest w-full"
                        placeholder="••••••"
                        value={enteredVerifyCode}
                        onChange={(e) => setEnteredVerifyCode(e.target.value.replace(/\D/g, ""))}
                        id="verification-code-input"
                      />
                      <button
                        onClick={handleVerifyCodeSubmit}
                        className="bg-brand-gold hover:bg-brand-gold-dark text-brand-primary font-bold px-4 rounded-xl text-xs transition active:scale-95"
                        id="btn-verify-code-submit"
                      >
                        Confirm
                      </button>
                    </div>

                  </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-muted">Master Password</label>
                    <input
                      type="password"
                      className="w-full bg-input-bg border border-border-subtle p-3 rounded-xl text-xs"
                      placeholder="Minimum 8 characters"
                      value={formData.account.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, account: { ...prev.account, password: e.target.value } }))}
                      id="account-password"
                    />
                    {validationErrors.password && <p className="text-[10px] text-brand-red font-medium">{validationErrors.password}</p>}
                    
                    {/* Password Strength Meter */}
                    {formData.account.password && (
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between items-center text-[9px] font-mono text-text-muted">
                          <span>Security Index:</span>
                          <span className="font-bold text-text-main">{getPasswordStrength().text}</span>
                        </div>
                        <div className="w-full h-1 bg-border-subtle rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getPasswordStrength().color} transition-all duration-500`}
                            style={{ width: `${getPasswordStrength().score}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-muted">Confirm Password</label>
                    <input
                      type="password"
                      className="w-full bg-input-bg border border-border-subtle p-3 rounded-xl text-xs"
                      placeholder="Retype password"
                      value={formData.account.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, account: { ...prev.account, confirmPassword: e.target.value } }))}
                      id="account-confirm-password"
                    />
                    {validationErrors.confirmPassword && <p className="text-[10px] text-brand-red font-medium">{validationErrors.confirmPassword}</p>}
                  </div>
                </div>

                {/* MFA Section */}
                <div className="p-4 rounded-2xl bg-hover-bg/20 border border-border-subtle text-left space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-2.5">
                      <Lock size={15} className="text-brand-gold mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-text-main font-sans">Multi-Factor Authentication (MFA)</h4>
                        <p className="text-[10px] text-text-muted mt-0.5 leading-normal">
                          Enable hardware key or authentication app pin verification for ledger edits.
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={formData.account.mfaEnabled}
                        onChange={(e) => setFormData(prev => ({ ...prev, account: { ...prev.account, mfaEnabled: e.target.checked } }))}
                        id="account-mfa-toggle"
                      />
                      <div className="w-9 h-5 bg-border-subtle peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-gold"></div>
                    </label>
                  </div>

                  {formData.account.mfaEnabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="border-t border-border-subtle pt-3.5 flex flex-col sm:flex-row items-center gap-4"
                      id="mfa-expanded-panel"
                    >
                      {/* Fake QR code */}
                      <div className="w-20 h-20 bg-white p-1 rounded-lg border border-border-subtle flex items-center justify-center shrink-0">
                        {/* CSS-drawn high contrast pixel grid mimicking QR code */}
                        <div className="grid grid-cols-4 gap-1 w-full h-full bg-slate-100 p-1">
                          <div className="bg-black"></div>
                          <div className="bg-slate-100"></div>
                          <div className="bg-black"></div>
                          <div className="bg-black"></div>
                          <div className="bg-black"></div>
                          <div className="bg-black"></div>
                          <div className="bg-slate-100"></div>
                          <div className="bg-black"></div>
                          <div className="bg-slate-100"></div>
                          <div className="bg-black"></div>
                          <div className="bg-black"></div>
                          <div className="bg-slate-100"></div>
                          <div className="bg-black"></div>
                          <div className="bg-slate-100"></div>
                          <div className="bg-black"></div>
                          <div className="bg-black"></div>
                        </div>
                      </div>
                      <div className="flex-1 space-y-2 text-center sm:text-left">
                        <p className="text-[10px] text-text-muted leading-relaxed">
                          Scan the code above in Google Authenticator or Duo, and confirm standard synchronization.
                        </p>
                        <div className="flex gap-2 max-w-[200px] mx-auto sm:mx-0">
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="MFA Token"
                            className="bg-input-bg border border-border-subtle p-2 rounded-lg text-xs tracking-widest text-center font-mono w-full"
                            value={formData.account.mfaCode}
                            onChange={(e) => setFormData(prev => ({ ...prev, account: { ...prev.account, mfaCode: e.target.value.replace(/\D/g, "") } }))}
                            id="mfa-token-input"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ========================================================= */}
            {/* BUSINESS STEP 2: COMPANY INFORMATION */}
            {/* ========================================================= */}
            {onboardingType === "business" && currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
                id="business-step-2"
              >
                <div className="space-y-1 text-left">
                  <h3 className="text-lg font-black tracking-tight font-sans text-text-main">Company Profile & Vitals</h3>
                  <p className="text-xs text-text-muted leading-normal">
                    Finity maps your legal and structural information to compile corresponding general ledger identities.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-muted">Company Name</label>
                    <input
                      type="text"
                      className="w-full bg-input-bg border border-border-subtle p-3 rounded-xl text-xs"
                      placeholder="e.g. Acme Corporation"
                      value={formData.companyInfo.companyName}
                      onChange={(e) => setFormData(prev => ({ ...prev, companyInfo: { ...prev.companyInfo, companyName: e.target.value } }))}
                      id="company-name"
                    />
                    {validationErrors.companyName && <p className="text-[10px] text-brand-red font-medium">{validationErrors.companyName}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-muted">Legal Business Name <span className="text-[10px] text-text-muted">(Optional)</span></label>
                    <input
                      type="text"
                      className="w-full bg-input-bg border border-border-subtle p-3 rounded-xl text-xs"
                      placeholder="Legal Entity if different"
                      value={formData.companyInfo.legalBusinessName}
                      onChange={(e) => setFormData(prev => ({ ...prev, companyInfo: { ...prev.companyInfo, legalBusinessName: e.target.value } }))}
                      id="company-legal-name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-muted">Business Type</label>
                    <select
                      className="w-full bg-input-bg border border-border-subtle p-3 rounded-xl text-xs"
                      value={formData.companyInfo.businessType}
                      onChange={(e) => setFormData(prev => ({ ...prev, companyInfo: { ...prev.companyInfo, businessType: e.target.value } }))}
                      id="company-business-type"
                    >
                      <option value="LLC">LLC (Limited Liability Co)</option>
                      <option value="Corporation">C-Corporation</option>
                      <option value="S-Corp">S-Corporation</option>
                      <option value="Partnership">Partnership</option>
                      <option value="Sole Proprietor">Sole Proprietorship / Freelancer</option>
                      <option value="Non-Profit">Non-Profit / NGO</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-muted">Industry Segment</label>
                    <select
                      className="w-full bg-input-bg border border-border-subtle p-3 rounded-xl text-xs"
                      value={formData.companyInfo.industry}
                      onChange={(e) => setFormData(prev => ({ ...prev, companyInfo: { ...prev.companyInfo, industry: e.target.value } }))}
                      id="company-industry"
                    >
                      <option value="SaaS & Technology">SaaS & Technology</option>
                      <option value="E-Commerce & Retail">E-Commerce & Retail</option>
                      <option value="Professional Services">Professional Consulting</option>
                      <option value="Real Estate & Property">Real Estate & Construction</option>
                      <option value="Healthcare & Bio">Healthcare & Biomed</option>
                      <option value="Manufacturing & Logistics">Manufacturing & Logistics</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-muted">Company Size</label>
                    <select
                      className="w-full bg-input-bg border border-border-subtle p-3 rounded-xl text-xs"
                      value={formData.companyInfo.companySize}
                      onChange={(e) => setFormData(prev => ({ ...prev, companyInfo: { ...prev.companyInfo, companySize: e.target.value } }))}
                      id="company-size-select"
                    >
                      <option value="1-10">1 - 10 employees</option>
                      <option value="11-50">11 - 50 employees</option>
                      <option value="51-200">51 - 200 employees</option>
                      <option value="201-500">201 - 500 employees</option>
                      <option value="500+">500+ employees</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-muted">Corporate Registry No. <span className="text-[10px] text-text-muted">(Optional)</span></label>
                    <input
                      type="text"
                      className="w-full bg-input-bg border border-border-subtle p-3 rounded-xl text-xs"
                      placeholder="e.g. CRN-883391"
                      value={formData.companyInfo.businessRegistrationNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, companyInfo: { ...prev.companyInfo, businessRegistrationNumber: e.target.value } }))}
                      id="company-registration-no"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-muted">Exact Employee Count <span className="text-[10px] text-text-muted">(Optional)</span></label>
                    <input
                      type="number"
                      className="w-full bg-input-bg border border-border-subtle p-3 rounded-xl text-xs"
                      placeholder="e.g. 18"
                      value={formData.companyInfo.employees}
                      onChange={(e) => setFormData(prev => ({ ...prev, companyInfo: { ...prev.companyInfo, employees: e.target.value } }))}
                      id="company-employees-count"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-muted">Company Website <span className="text-[10px] text-text-muted">(Optional)</span></label>
                    <input
                      type="text"
                      className="w-full bg-input-bg border border-border-subtle p-3 rounded-xl text-xs"
                      placeholder="www.corporation.com"
                      value={formData.companyInfo.website}
                      onChange={(e) => setFormData(prev => ({ ...prev, companyInfo: { ...prev.companyInfo, website: e.target.value } }))}
                      id="company-website"
                    />
                    {validationErrors.website && <p className="text-[10px] text-brand-red font-medium">{validationErrors.website}</p>}
                  </div>
                </div>

                {/* AI & Business Profile Configuration Section */}
                <div className="border-t border-border-subtle/40 pt-4 mt-2 space-y-4 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-3.5 bg-brand-gold rounded-full" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted">Finity AI Agent & Contact Settings</h4>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-text-muted flex items-center gap-1.5">
                        Finity AI Business Description
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-brand-gold/10 text-brand-gold border border-brand-gold/20">
                          <Sparkles className="w-2.5 h-2.5" /> AI Knowledge Base
                        </span>
                      </label>
                      <span className="text-[10px] text-brand-gold">Recommended</span>
                    </div>
                    <textarea
                      className="w-full bg-input-bg border border-border-subtle p-3 rounded-xl text-xs h-20 resize-none placeholder:text-text-muted/50 focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold/20"
                      placeholder="Describe what your business does, its main product/service, and your target audience (e.g., 'A premium B2B SaaS platform providing AI-driven contract analysis for enterprise legal departments...')"
                      value={formData.companyInfo.businessDescription}
                      onChange={(e) => setFormData(prev => ({ ...prev, companyInfo: { ...prev.companyInfo, businessDescription: e.target.value } }))}
                      id="company-business-description"
                    />
                    {validationErrors.businessDescription && <p className="text-[10px] text-brand-red font-medium">{validationErrors.businessDescription}</p>}
                    <p className="text-[10px] text-text-muted leading-relaxed">
                      Finity's AI Agent will analyze this description to suggest possible business outcomes, customized growth forecasts, risk warnings, and industry-tailored tax ideas.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-text-muted">Business Email Address</label>
                      <input
                        type="email"
                        className="w-full bg-input-bg border border-border-subtle p-3 rounded-xl text-xs placeholder:text-text-muted/50"
                        placeholder="contact@corporation.com"
                        value={formData.companyInfo.businessEmail}
                        onChange={(e) => setFormData(prev => ({ ...prev, companyInfo: { ...prev.companyInfo, businessEmail: e.target.value } }))}
                        id="company-business-email"
                      />
                      {validationErrors.businessEmail && <p className="text-[10px] text-brand-red font-medium">{validationErrors.businessEmail}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-text-muted">Business Phone Number</label>
                      <input
                        type="tel"
                        className="w-full bg-input-bg border border-border-subtle p-3 rounded-xl text-xs placeholder:text-text-muted/50"
                        placeholder="+1 (555) 019-2834"
                        value={formData.companyInfo.businessPhone}
                        onChange={(e) => setFormData(prev => ({ ...prev, companyInfo: { ...prev.companyInfo, businessPhone: e.target.value } }))}
                        id="company-business-phone"
                      />
                      {validationErrors.businessPhone && <p className="text-[10px] text-brand-red font-medium">{validationErrors.businessPhone}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-text-muted">Other Contact Information</label>
                      <input
                        type="text"
                        className="w-full bg-input-bg border border-border-subtle p-3 rounded-xl text-xs placeholder:text-text-muted/50"
                        placeholder="e.g. support line, WhatsApp, Slack"
                        value={formData.companyInfo.businessContactInfo}
                        onChange={(e) => setFormData(prev => ({ ...prev, companyInfo: { ...prev.companyInfo, businessContactInfo: e.target.value } }))}
                        id="company-business-contact-info"
                      />
                    </div>
                  </div>
                </div>

                {/* Company Logo Selector */}
                <div className="space-y-2 text-left">
                  <label className="text-xs font-semibold text-text-muted block">Workspace Icon / Brand Logo</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {LOGO_TEMPLATES.map((tpl) => {
                      const isSelected = formData.companyInfo.logo === tpl.id;
                      return (
                        <div
                          key={tpl.id}
                          onClick={() => setFormData(prev => ({ ...prev, companyInfo: { ...prev.companyInfo, logo: tpl.id } }))}
                          className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${
                            isSelected
                              ? "bg-brand-gold-light border-brand-gold/60"
                              : "bg-hover-bg/20 border-border-subtle hover:bg-hover-bg/40"
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${tpl.colors} flex items-center justify-center text-white font-mono font-black text-sm`}>
                            {tpl.letters}
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-[10px] font-bold truncate text-text-main">{tpl.name}</p>
                            <p className="text-[8px] text-text-muted">Finity Vector</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Mock Custom Drag Zone */}
                  <div className="border border-dashed border-border-subtle rounded-xl p-4 bg-hover-bg/10 flex items-center justify-center gap-3 mt-2 text-center cursor-pointer hover:bg-hover-bg/20 transition">
                    <Upload size={14} className="text-brand-gold" />
                    <span className="text-[11px] text-text-muted">Drag or click to upload a custom PNG/SVG company logotype</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ========================================================= */}
            {/* BUSINESS STEP 3: LOCATION */}
            {/* ========================================================= */}
            {onboardingType === "business" && currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
                id="business-step-3"
              >
                <div className="space-y-1 text-left">
                  <h3 className="text-lg font-black tracking-tight font-sans text-text-main">Headquarters Jurisdiction</h3>
                  <p className="text-xs text-text-muted leading-normal">
                    Country of registry locks standard timezone offsets, compliance logs, and tax structures automatically.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-muted">Country</label>
                    <select
                      className="w-full bg-input-bg border border-border-subtle p-3 rounded-xl text-xs"
                      value={formData.location.country}
                      onChange={(e) => {
                        const country = e.target.value;
                        let tz = "America/New_York";
                        let currency = "USD";
                        if (country === "Kenya") { tz = "Africa/Nairobi"; currency = "KES"; }
                        else if (country === "United Kingdom") { tz = "Europe/London"; currency = "GBP"; }
                        else if (country === "Germany" || country === "France") { tz = "Europe/Paris"; currency = "EUR"; }
                        else if (country === "Australia") { tz = "Australia/Sydney"; currency = "AUD"; }
                        else if (country === "Canada") { tz = "America/Toronto"; currency = "CAD"; }
                        
                        setFormData(prev => ({
                          ...prev,
                          location: { ...prev.location, country, timezone: tz },
                          financial: { ...prev.financial, currency }
                        }));
                      }}
                      id="location-country"
                    >
                      <option value="Kenya">Kenya</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Canada">Canada</option>
                      <option value="Australia">Australia</option>
                      <option value="Germany">Germany</option>
                      <option value="France">France</option>
                      <option value="Singapore">Singapore</option>
                      <option value="Japan">Japan</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-muted">State / Province</label>
                    <input
                      type="text"
                      className="w-full bg-input-bg border border-border-subtle p-3 rounded-xl text-xs"
                      placeholder="e.g. California"
                      value={formData.location.state}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: { ...prev.location, state: e.target.value } }))}
                      id="location-state"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-muted">City</label>
                    <input
                      type="text"
                      className="w-full bg-input-bg border border-border-subtle p-3 rounded-xl text-xs"
                      placeholder="e.g. San Francisco"
                      value={formData.location.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: { ...prev.location, city: e.target.value } }))}
                      id="location-city"
                    />
                    {validationErrors.city && <p className="text-[10px] text-brand-red font-medium">{validationErrors.city}</p>}
                  </div>

                  <div className="space-y-1.5 flex-1 col-span-2">
                    <label className="text-xs font-semibold text-text-muted">Business Street Address</label>
                    <input
                      type="text"
                      className="w-full bg-input-bg border border-border-subtle p-3 rounded-xl text-xs"
                      placeholder="e.g. 100 Pine Street, Suite 24"
                      value={formData.location.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: { ...prev.location, address: e.target.value } }))}
                      id="location-address"
                    />
                    {validationErrors.address && <p className="text-[10px] text-brand-red font-medium">{validationErrors.address}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-muted">Postal Code</label>
                    <input
                      type="text"
                      className="w-full bg-input-bg border border-border-subtle p-3 rounded-xl text-xs"
                      placeholder="e.g. 94111"
                      value={formData.location.postalCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: { ...prev.location, postalCode: e.target.value } }))}
                      id="location-postal-code"
                    />
                    {validationErrors.postalCode && <p className="text-[10px] text-brand-red font-medium">{validationErrors.postalCode}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-muted">Preferred Time Zone</label>
                    <select
                      className="w-full bg-input-bg border border-border-subtle p-3 rounded-xl text-xs"
                      value={formData.location.timezone}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: { ...prev.location, timezone: e.target.value } }))}
                      id="location-timezone-select"
                    >
                      <option value="America/New_York">EST / New York (GMT-5)</option>
                      <option value="America/Los_Angeles">PST / San Francisco (GMT-8)</option>
                      <option value="Europe/London">GMT / London (GMT+0)</option>
                      <option value="Europe/Paris">CET / Paris (GMT+1)</option>
                      <option value="Asia/Singapore">SGT / Singapore (GMT+8)</option>
                      <option value="Asia/Tokyo">JST / Tokyo (GMT+9)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-muted">Interface Language</label>
                    <select
                      className="w-full bg-input-bg border border-border-subtle p-3 rounded-xl text-xs"
                      value={formData.location.language}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: { ...prev.location, language: e.target.value } }))}
                      id="location-language-select"
                    >
                      <option value="English (US)">English (US)</option>
                      <option value="English (UK)">English (UK)</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                      <option value="Japanese">Japanese</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-brand-emerald/10 border border-brand-emerald/20 text-left">
                  <Globe size={16} className="text-brand-emerald shrink-0" />
                  <p className="text-[10px] text-text-muted leading-relaxed">
                    Based on your selection, Finity will configure <strong>{formData.location.timezone}</strong> as the master transaction audit log anchor timezone.
                  </p>
                </div>
              </motion.div>
            )}

            {/* ========================================================= */}
            {/* BUSINESS STEP 4: FINANCIAL CONFIGURATION */}
            {/* ========================================================= */}
            {onboardingType === "business" && currentStep === 4 && (
              <motion.div
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
                id="business-step-4"
              >
                <div className="space-y-1 text-left">
                  <h3 className="text-lg font-black tracking-tight font-sans text-text-main">Financial Workspace Registry</h3>
                  <p className="text-xs text-text-muted leading-normal">
                    Establish key parameters controlling ledger base values and GAAP balance sheet periods.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-muted flex items-center gap-1.5">
                      <DollarSign size={13} className="text-brand-gold" /> Base Ledger Currency
                    </label>
                    <select
                      className="w-full bg-input-bg border border-border-subtle p-3 rounded-xl text-xs"
                      value={formData.financial.currency}
                      onChange={(e) => setFormData(prev => ({ ...prev, financial: { ...prev.financial, currency: e.target.value } }))}
                      id="financial-currency"
                    >
                      <option value="KES">KES - Kenyan Shilling (KSh)</option>
                      <option value="USD">USD - United States Dollar ($)</option>
                      <option value="EUR">EUR - European Euro (€)</option>
                      <option value="GBP">GBP - Sterling Pound (£)</option>
                      <option value="CAD">CAD - Canadian Dollar (C$)</option>
                      <option value="AUD">AUD - Australian Dollar (A$)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-muted flex items-center gap-1.5">
                      <Clock size={13} className="text-brand-gold" /> Fiscal Year Start Month
                    </label>
                    <select
                      className="w-full bg-input-bg border border-border-subtle p-3 rounded-xl text-xs"
                      value={formData.financial.fiscalYearStart}
                      onChange={(e) => setFormData(prev => ({ ...prev, financial: { ...prev.financial, fiscalYearStart: e.target.value } }))}
                      id="financial-fiscal-start"
                    >
                      <option value="January">January</option>
                      <option value="April">April</option>
                      <option value="July">July</option>
                      <option value="October">October</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-muted flex items-center gap-1.5">
                      <Layers size={13} className="text-brand-gold" /> Accounting Ledger Method
                    </label>
                    <select
                      className="w-full bg-input-bg border border-border-subtle p-3 rounded-xl text-xs"
                      value={formData.financial.accountingMethod}
                      onChange={(e) => setFormData(prev => ({ ...prev, financial: { ...prev.financial, accountingMethod: e.target.value } }))}
                      id="financial-accounting-method"
                    >
                      <option value="Accrual">Accrual Method (Default/Corporate)</option>
                      <option value="Cash">Cash Method (Simplified/Micro)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-muted">Tax Identification / VAT Number <span className="text-[10px] text-text-muted">(If applicable)</span></label>
                    <input
                      type="text"
                      className="w-full bg-input-bg border border-border-subtle p-3 rounded-xl text-xs"
                      placeholder="e.g. EU-3392811 or Tax ID"
                      value={formData.financial.taxRegistrationNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, financial: { ...prev.financial, taxRegistrationNumber: e.target.value } }))}
                      id="financial-tax-id"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-muted">Primary Sales Tax System</label>
                    <select
                      className="w-full bg-input-bg border border-border-subtle p-3 rounded-xl text-xs"
                      value={formData.financial.taxSettings}
                      onChange={(e) => setFormData(prev => ({ ...prev, financial: { ...prev.financial, taxSettings: e.target.value } }))}
                      id="financial-tax-rules"
                    >
                      <option value="Sales Tax / VAT Standard">Standard State Sales Tax (Single Bracket)</option>
                      <option value="Multi-tier VAT">European Multi-tier VAT (Standard & Reduced)</option>
                      <option value="HST/GST Canada">Canadian GST/HST Harmonized Tax</option>
                      <option value="No Tax - Exempt">Exempt / Zero-rated Exports</option>
                    </select>
                  </div>
                </div>

                {/* Default Preferences */}
                <div className="p-4 rounded-2xl bg-hover-bg/20 border border-border-subtle text-left space-y-3">
                  <h4 className="text-xs font-bold text-text-main font-sans">Default Workspace Preferences</h4>
                  
                  <div className="space-y-2.5 pt-1.5 text-xs">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-border-subtle bg-input-bg text-brand-gold focus:ring-0 w-4 h-4"
                        checked={formData.financial.autoSettle}
                        onChange={(e) => setFormData(prev => ({ ...prev, financial: { ...prev.financial, autoSettle: e.target.checked } }))}
                        id="pref-auto-settle"
                      />
                      <span className="text-text-muted">Automatically settle reconciled invoice payments with connected bank feeds</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-border-subtle bg-input-bg text-brand-gold focus:ring-0 w-4 h-4"
                        checked={formData.financial.blockNegative}
                        onChange={(e) => setFormData(prev => ({ ...prev, financial: { ...prev.financial, blockNegative: e.target.checked } }))}
                        id="pref-block-negative"
                      />
                      <span className="text-text-muted">Block outgoing payment router entries when account balances fall below zero</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-border-subtle bg-input-bg text-brand-gold focus:ring-0 w-4 h-4"
                        checked={formData.financial.syncLedger}
                        onChange={(e) => setFormData(prev => ({ ...prev, financial: { ...prev.financial, syncLedger: e.target.checked } }))}
                        id="pref-sync-ledger"
                      />
                      <span className="text-text-muted">Synchronize cross-border ledger conversions immediately with daily ECB exchange feeds</span>
                    </label>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ========================================================= */}
            {/* BUSINESS STEP 5: ORGANIZATION STRUCTURE */}
            {/* ========================================================= */}
            {onboardingType === "business" && currentStep === 5 && (
              <motion.div
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
                id="business-step-5"
              >
                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black tracking-tight font-sans text-text-main">Corporate Structure</h3>
                    <span className="text-[9px] bg-hover-bg text-text-muted px-2 py-0.5 border border-border-subtle rounded-md font-bold font-mono">OPTIONAL STEP</span>
                  </div>
                  <p className="text-xs text-text-muted leading-normal">
                    Configure company departments, geographical branch locations, and cost centers. You may skip this step.
                  </p>
                </div>

                {/* Departments Tag input */}
                <div className="space-y-2 text-left" id="dept-tag-editor">
                  <label className="text-xs font-semibold text-text-muted block">Corporate Departments</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 bg-input-bg border border-border-subtle p-2.5 rounded-xl text-xs"
                      placeholder="Add department (e.g. Human Resources)"
                      value={newDept}
                      onChange={(e) => setNewDept(e.target.value)}
                      id="new-dept-input"
                    />
                    <button
                      onClick={() => addTag("departments", newDept, setNewDept)}
                      className="bg-hover-bg hover:bg-border-subtle text-text-main border border-border-subtle px-4 rounded-xl text-xs font-bold transition active:scale-95"
                      id="btn-add-dept"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {formData.structure.departments.map((dept, i) => (
                      <span key={dept} className="inline-flex items-center gap-1 bg-brand-primary-light/40 border border-brand-primary-light px-2.5 py-1 rounded-xl text-xs text-text-main">
                        {dept}
                        <button onClick={() => removeTag("departments", i)} className="text-text-muted hover:text-brand-red font-bold text-[10px] ml-1">×</button>
                      </span>
                    ))}
                    {formData.structure.departments.length === 0 && <p className="text-[10px] text-text-muted italic">No custom departments configured yet.</p>}
                  </div>
                </div>

                {/* Branches Tag input */}
                <div className="space-y-2 text-left" id="branch-tag-editor">
                  <label className="text-xs font-semibold text-text-muted block">Geographical Branches</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 bg-input-bg border border-border-subtle p-2.5 rounded-xl text-xs"
                      placeholder="Add physical branch (e.g. London Office)"
                      value={newBranch}
                      onChange={(e) => setNewBranch(e.target.value)}
                      id="new-branch-input"
                    />
                    <button
                      onClick={() => addTag("branches", newBranch, setNewBranch)}
                      className="bg-hover-bg hover:bg-border-subtle text-text-main border border-border-subtle px-4 rounded-xl text-xs font-bold transition active:scale-95"
                      id="btn-add-branch"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {formData.structure.branches.map((branch, i) => (
                      <span key={branch} className="inline-flex items-center gap-1 bg-brand-primary-light/40 border border-brand-primary-light px-2.5 py-1 rounded-xl text-xs text-text-main">
                        {branch}
                        <button onClick={() => removeTag("branches", i)} className="text-text-muted hover:text-brand-red font-bold text-[10px] ml-1">×</button>
                      </span>
                    ))}
                    {formData.structure.branches.length === 0 && <p className="text-[10px] text-text-muted italic">No branch offices configured yet.</p>}
                  </div>
                </div>

                {/* Cost Centers Tag input */}
                <div className="space-y-2 text-left" id="cost-center-tag-editor">
                  <label className="text-xs font-semibold text-text-muted block">Double-entry Cost Centers</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 bg-input-bg border border-border-subtle p-2.5 rounded-xl text-xs"
                      placeholder="Add cost code (e.g. CC-301 Advertising)"
                      value={newCostCenter}
                      onChange={(e) => setNewCostCenter(e.target.value)}
                      id="new-cost-center-input"
                    />
                    <button
                      onClick={() => addTag("costCenters", newCostCenter, setNewCostCenter)}
                      className="bg-hover-bg hover:bg-border-subtle text-text-main border border-border-subtle px-4 rounded-xl text-xs font-bold transition active:scale-95"
                      id="btn-add-cost-center"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {formData.structure.costCenters.map((cc, i) => (
                      <span key={cc} className="inline-flex items-center gap-1 bg-brand-primary-light/40 border border-brand-primary-light px-2.5 py-1 rounded-xl text-xs text-text-main">
                        {cc}
                        <button onClick={() => removeTag("costCenters", i)} className="text-text-muted hover:text-brand-red font-bold text-[10px] ml-1">×</button>
                      </span>
                    ))}
                    {formData.structure.costCenters.length === 0 && <p className="text-[10px] text-text-muted italic">No custom Cost Centers configured yet.</p>}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ========================================================= */}
            {/* BUSINESS STEP 6: INVITE TEAM MEMBERS */}
            {/* ========================================================= */}
            {onboardingType === "business" && currentStep === 6 && (
              <motion.div
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
                id="business-step-6"
              >
                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black tracking-tight font-sans text-text-main">Invite Corporate Team</h3>
                    <span className="text-[9px] bg-hover-bg text-text-muted px-2 py-0.5 border border-border-subtle rounded-md font-bold font-mono">OPTIONAL STEP</span>
                  </div>
                  <p className="text-xs text-text-muted leading-normal">
                    Grant system roles to accountants, finance managers, or auditors prior to launching the environment.
                  </p>
                </div>

                {/* Invite panel builder */}
                <div className="bg-hover-bg/10 border border-border-subtle rounded-2xl p-4 text-left space-y-4">
                  <h4 className="text-xs font-bold text-text-main font-sans">Queue a Team Invite Slot</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      className="bg-input-bg border border-border-subtle p-2.5 rounded-xl text-xs w-full"
                      placeholder="Colleague Full Name"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      id="invite-member-name"
                    />
                    <input
                      type="email"
                      className="bg-input-bg border border-border-subtle p-2.5 rounded-xl text-xs w-full"
                      placeholder="colleague@corporation.com"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      id="invite-member-email"
                    />
                    <select
                      className="bg-input-bg border border-border-subtle p-2.5 rounded-xl text-xs w-full"
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value)}
                      id="invite-member-role"
                    >
                      <option value="Accountant">Accountant (General Ledger Access)</option>
                      <option value="Finance Manager">Finance Manager (Treasury Access)</option>
                      <option value="Administrator">Administrator (All Permissions)</option>
                      <option value="Auditor">Auditor (Read-Only Reviewer)</option>
                      <option value="Employee">Employee (Expense Claims only)</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={addTeamMember}
                    className="flex items-center gap-1 bg-brand-gold hover:bg-brand-gold-dark text-brand-primary font-bold px-4 py-2 rounded-xl text-xs transition active:scale-95"
                    id="btn-add-team-member"
                  >
                    <Plus size={13} />
                    <span>Queue Invitation Slot</span>
                  </button>
                </div>

                {/* Invites Queue List */}
                <div className="space-y-2 text-left" id="invites-queue-list">
                  <label className="text-xs font-semibold text-text-muted block">Queued Team Invitations ({formData.team.length})</label>
                  
                  <div className="border border-border-subtle rounded-2xl overflow-hidden divide-y divide-border-subtle">
                    {formData.team.map((m, idx) => (
                      <div key={m.email} className="p-3 bg-hover-bg/20 flex items-center justify-between text-xs font-sans">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-primary-light flex items-center justify-center text-text-main font-mono font-bold text-xs">
                            {m.name.charAt(0)}
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-text-main">{m.name}</p>
                            <p className="text-[10px] text-text-muted">{m.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider bg-brand-gold-light text-brand-gold border border-brand-gold/25 px-2.5 py-1 rounded-full">
                            {m.role}
                          </span>
                          <button
                            onClick={() => removeTeamMember(idx)}
                            className="p-1.5 rounded-lg text-text-muted hover:text-brand-red hover:bg-hover-bg transition"
                            title="Remove invitation"
                          >
                            <Trash size={13} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {formData.team.length === 0 && (
                      <div className="p-6 text-center text-text-muted italic text-xs">
                        No invitations queued. You will be set up as sole workspace Owner.
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ========================================================= */}
            {/* BUSINESS STEP 7: CONNECT FINANCIAL ACCOUNTS */}
            {/* ========================================================= */}
            {onboardingType === "business" && currentStep === 7 && (
              <motion.div
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
                id="business-step-7"
              >
                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black tracking-tight font-sans text-text-main">Connected Bank Feeds & Treasury</h3>
                    <span className="text-[9px] bg-hover-bg text-text-muted px-2 py-0.5 border border-border-subtle rounded-md font-bold font-mono">OPTIONAL STEP</span>
                  </div>
                  <p className="text-xs text-text-muted leading-normal">
                    Securely integrate live institutional feeds to enable zero-manual bank reconciliation.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                  {/* Bank Link panel */}
                  <div className="p-5 rounded-2xl bg-hover-bg/20 border border-border-subtle space-y-4">
                    <div className="flex items-center gap-2.5">
                      <CreditCard size={18} className="text-brand-gold" />
                      <h4 className="text-xs font-bold text-text-main font-sans">Plaid Institutional Sync</h4>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-text-muted">Target Bank Institution</label>
                        <select
                          className="w-full bg-input-bg border border-border-subtle p-2.5 rounded-xl text-xs"
                          value={formData.connected.bankName}
                          onChange={(e) => setFormData(prev => ({ ...prev, connected: { ...prev.connected, bankName: e.target.value } }))}
                          id="bank-institution-select"
                        >
                          <option value="Chase Bank Business Checking">Chase Bank Business Checking</option>
                          <option value="J.P. Morgan Chase Treasury">J.P. Morgan Chase Treasury</option>
                          <option value="Silicon Valley Bank (SVB)">Silicon Valley Bank (SVB)</option>
                          <option value="Wells Fargo Commercial">Wells Fargo Commercial</option>
                          <option value="Barclays Corporate UK">Barclays Corporate UK</option>
                          <option value="HSBC Commercial Core">HSBC Commercial Core</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-text-muted">Account Number</label>
                          <input
                            type="text"
                            className="w-full bg-input-bg border border-border-subtle p-2.5 rounded-xl text-xs"
                            placeholder="e.g. •••• 9922"
                            value={formData.connected.accountNumber}
                            onChange={(e) => setFormData(prev => ({ ...prev, connected: { ...prev.connected, accountNumber: e.target.value } }))}
                            id="bank-account-no"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-text-muted">Opening Balance ({formData.financial.currency})</label>
                          <input
                            type="number"
                            className="w-full bg-input-bg border border-border-subtle p-2.5 rounded-xl text-xs"
                            placeholder="e.g. 50000"
                            value={formData.connected.bankBalance}
                            onChange={(e) => setFormData(prev => ({ ...prev, connected: { ...prev.connected, bankBalance: e.target.value } }))}
                            id="bank-opening-balance"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment integrations & Wallets */}
                  <div className="p-5 rounded-2xl bg-hover-bg/20 border border-border-subtle flex flex-col justify-between gap-4">
                    <div className="space-y-3 text-left">
                      <div className="flex items-center gap-2.5">
                        <Database size={18} className="text-brand-gold" />
                        <h4 className="text-xs font-bold text-text-main font-sans">Payment Gateways & Wallets</h4>
                      </div>
                      <p className="text-[10px] text-text-muted leading-relaxed">
                        Authorize automated webhook ingestion pipelines for merchant revenue stream allocations.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1 text-xs">
                        <label className="text-[11px] font-semibold text-text-muted">Payment Processor</label>
                        <select
                          className="w-full bg-input-bg border border-border-subtle p-2.5 rounded-xl text-xs"
                          value={formData.connected.gatewayConnected}
                          onChange={(e) => setFormData(prev => ({ ...prev, connected: { ...prev.connected, gatewayConnected: e.target.value } }))}
                          id="gateway-processor-select"
                        >
                          <option value="Stripe">Stripe Connect API Sync</option>
                          <option value="PayPal">PayPal Business OAuth</option>
                          <option value="Adyen">Adyen Global Checkout Gateway</option>
                          <option value="None">Do not link gateway</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-hover-bg/40 border border-border-subtle">
                        <div className="text-left">
                          <h5 className="text-[11px] font-bold text-text-main font-sans">Provision Digital Wallet</h5>
                          <p className="text-[9px] text-text-muted">Create default Finity Multi-Currency wallet</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={formData.connected.walletConnected}
                            onChange={(e) => setFormData(prev => ({ ...prev, connected: { ...prev.connected, walletConnected: e.target.checked } }))}
                            id="wallet-provision-toggle"
                          />
                          <div className="w-8 h-4 bg-border-subtle peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-brand-gold"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-brand-gold-light border border-brand-gold/25 text-left flex items-start gap-2.5">
                  <Info size={15} className="text-brand-gold shrink-0 mt-0.5" />
                  <p className="text-[10px] text-text-muted leading-relaxed">
                    By default, Finity integrates standard sandboxed feeds allowing immediate verification of double-entry ledger balances without transmitting live banking keys.
                  </p>
                </div>
              </motion.div>
            )}

            {/* ========================================================= */}
            {/* PERSONAL STEP 1: INDIVIDUAL PARAMETERS */}
            {/* ========================================================= */}
            {onboardingType === "personal" && currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
                id="personal-step-1"
              >
                <div className="space-y-1 text-left">
                  <div className="inline-flex items-center gap-1 bg-brand-gold-light border border-brand-gold/20 text-brand-gold text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                    Finity Wealth Core
                  </div>
                  <h3 className="text-lg font-black tracking-tight font-sans text-text-main">Configure Personal Ledger Workspace</h3>
                  <p className="text-xs text-text-muted leading-normal">
                    Setting up standard personal checking details and target metrics for private individual auditing.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-muted">Full Name</label>
                    <input
                      type="text"
                      className="w-full bg-input-bg border border-border-subtle p-3 rounded-xl text-xs"
                      placeholder="e.g. Alice Peterson"
                      value={formData.personal.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, personal: { ...prev.personal, name: e.target.value } }))}
                      id="personal-full-name"
                    />
                    {validationErrors.personalName && <p className="text-[10px] text-brand-red font-medium">{validationErrors.personalName}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-muted">Country of Residence</label>
                    <select
                      className="w-full bg-input-bg border border-border-subtle p-3 rounded-xl text-xs"
                      value={formData.personal.country}
                      onChange={(e) => setFormData(prev => ({ ...prev, personal: { ...prev.personal, country: e.target.value } }))}
                      id="personal-country-select"
                    >
                      <option value="Kenya">Kenya</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Canada">Canada</option>
                      <option value="Australia">Australia</option>
                      <option value="Germany">Germany</option>
                      <option value="France">France</option>
                      <option value="Singapore">Singapore</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-muted">Preferred Base Currency</label>
                    <select
                      className="w-full bg-input-bg border border-border-subtle p-3 rounded-xl text-xs"
                      value={formData.personal.currency}
                      onChange={(e) => setFormData(prev => ({ ...prev, personal: { ...prev.personal, currency: e.target.value } }))}
                      id="personal-currency-select"
                    >
                      <option value="KES">KES (KSh)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="CAD">CAD (C$)</option>
                      <option value="AUD">AUD (A$)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-muted">Local Time Zone</label>
                    <select
                      className="w-full bg-input-bg border border-border-subtle p-3 rounded-xl text-xs"
                      value={formData.personal.timezone}
                      onChange={(e) => setFormData(prev => ({ ...prev, personal: { ...prev.personal, timezone: e.target.value } }))}
                      id="personal-timezone-select"
                    >
                      <option value="America/New_York">EST / New York (GMT-5)</option>
                      <option value="America/Los_Angeles">PST / San Francisco (GMT-8)</option>
                      <option value="Europe/London">GMT / London (GMT+0)</option>
                      <option value="Europe/Paris">CET / Paris (GMT+1)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-muted">Preferred Language</label>
                    <select
                      className="w-full bg-input-bg border border-border-subtle p-3 rounded-xl text-xs"
                      value={formData.personal.language}
                      onChange={(e) => setFormData(prev => ({ ...prev, personal: { ...prev.personal, language: e.target.value } }))}
                      id="personal-language-select"
                    >
                      <option value="English (US)">English (US)</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-text-muted block">Core Personal Financial Goals <span className="text-[10px] text-text-muted">(Optional)</span></label>
                  <textarea
                    rows={3}
                    className="w-full bg-input-bg border border-border-subtle p-3 rounded-xl text-xs"
                    placeholder="e.g. Save $20,000 for real estate deposit, track monthly dining expenses, and oversee secondary consulting income taxes."
                    value={formData.personal.goals}
                    onChange={(e) => setFormData(prev => ({ ...prev, personal: { ...prev.personal, goals: e.target.value } }))}
                    id="personal-goals"
                  />
                </div>
              </motion.div>
            )}

            {/* ========================================================= */}
            {/* STEP 8: AUTOMATED SYSTEM INITIALIZATION LOGS */}
            {/* ========================================================= */}
            {currentStep === 8 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8 py-6 text-center"
                id="step-workspace-initialization"
              >
                {/* Simulated provisioning spinner loader */}
                <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-dashed border-brand-gold/20"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                  />
                  <motion.div
                    className="absolute inset-2 rounded-full border-4 border-t-brand-gold border-r-transparent border-b-transparent border-l-transparent"
                    animate={{ rotate: -360 }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
                  />
                  <div className="text-brand-gold font-mono font-bold text-xs">
                    {initializationProgress}%
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-sans font-extrabold text-xl tracking-tight text-text-main">
                    Deploying Finity Ledger Core...
                  </h3>
                  <p className="text-xs text-text-muted max-w-md mx-auto leading-relaxed">
                    Automatically configuring standard GAAP accounts, local tax rates, active journals, and setting up secure compliance partitions.
                  </p>
                </div>

                {/* Provisioning logs console terminal */}
                <div className="bg-input-bg border border-border-subtle rounded-2xl p-4 font-mono text-[10px] text-left text-text-muted h-48 overflow-y-auto space-y-1.5 shadow-inner" id="init-logs-console">
                  {initializationLogs.map((log, index) => (
                    <div
                      key={index}
                      className={
                        log.startsWith("[✓]")
                          ? "text-brand-emerald"
                          : log.startsWith("✨")
                          ? "text-brand-gold font-bold"
                          : "text-text-muted"
                      }
                    >
                      {log}
                    </div>
                  ))}
                  {initializationProgress < 100 && (
                    <span className="inline-block w-2 h-3 bg-text-muted animate-pulse" />
                  )}
                </div>
              </motion.div>
            )}

            {/* ========================================================= */}
            {/* STEP 9: SUCCESS / READY BANNER */}
            {/* ========================================================= */}
            {currentStep === 9 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="space-y-8 py-4 text-center"
                id="step-success-screen"
              >
                {console.log("DEBUG: Rendering success screen (step 9)")}
                {/* Success Shield */}
                <div className="w-16 h-16 rounded-2xl bg-brand-emerald/10 border border-brand-emerald/20 text-brand-emerald flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle size={32} className="animate-pulse" />
                </div>

                <div className="space-y-2">
                  <h2 className="font-sans font-black text-2xl sm:text-3xl tracking-tight text-text-main">
                    Your Company is Ready.
                  </h2>
                  <p className="text-sm text-text-muted max-w-xl mx-auto leading-relaxed">
                    Finity has registered your legal entity profiles and established active double-entry accounts. Your financial workspace is secured, audited, and ready to navigate.
                  </p>
                </div>

                {/* Action Card Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                  {/* Action 1: Open Dashboard */}
                  <button
                    onClick={() => handleFinalRedirect("Overview")}
                    className="p-4 rounded-xl border border-border-subtle bg-hover-bg/20 hover:border-brand-gold/40 hover:bg-hover-bg/45 transition cursor-pointer text-left group w-full"
                    id="success-action-dashboard"
                  >
                    <div className="w-9 h-9 rounded-lg bg-brand-gold/10 flex items-center justify-center text-brand-gold mb-3 group-hover:scale-105 transition">
                      <Layers size={16} />
                    </div>
                    <h4 className="text-xs font-bold text-text-main font-sans">Open Workspace Dashboard</h4>
                    <p className="text-[10px] text-text-muted mt-1 leading-normal">
                      Monitor operational vitals, current ratios, and cash balance positions.
                    </p>
                  </button>

                  {/* Action 2: Talk to Finity Agent */}
                  <button
                    onClick={() => handleFinalRedirect("agent")}
                    className="p-4 rounded-xl border border-border-subtle bg-hover-bg/20 hover:border-brand-gold/40 hover:bg-hover-bg/45 transition cursor-pointer text-left group w-full"
                    id="success-action-agent"
                  >
                    <div className="w-9 h-9 rounded-lg bg-brand-gold/10 flex items-center justify-center text-brand-gold mb-3 group-hover:scale-105 transition">
                      <MessageSquare size={16} />
                    </div>
                    <h4 className="text-xs font-bold text-text-main font-sans">Consult Finity Copilot Agent</h4>
                    <p className="text-[10px] text-text-muted mt-1 leading-normal">
                      Direct the AI agent to draft journals, audit logs, or analyze margins immediately.
                    </p>
                  </button>

                  {/* Action 3: Record First Transaction */}
                  <button
                    onClick={() => handleFinalRedirect("Accounts & Ledgers")}
                    className="p-4 rounded-xl border border-border-subtle bg-hover-bg/20 hover:border-brand-gold/40 hover:bg-hover-bg/45 transition cursor-pointer text-left group w-full"
                    id="success-action-record-tx"
                  >
                    <div className="w-9 h-9 rounded-lg bg-brand-gold/10 flex items-center justify-center text-brand-gold mb-3 group-hover:scale-105 transition">
                      <Plus size={16} />
                    </div>
                    <h4 className="text-xs font-bold text-text-main font-sans">Record First Transaction</h4>
                    <p className="text-[10px] text-text-muted mt-1 leading-normal">
                      Issue manual journal entry records or adjust balance accounts.
                    </p>
                  </button>

                  {/* Action 4: Connect Bank */}
                  <button
                    onClick={() => handleFinalRedirect("Banking Hub")}
                    className="p-4 rounded-xl border border-border-subtle bg-hover-bg/20 hover:border-brand-gold/40 hover:bg-hover-bg/45 transition cursor-pointer text-left group w-full"
                    id="success-action-connect-bank"
                  >
                    <div className="w-9 h-9 rounded-lg bg-brand-gold/10 flex items-center justify-center text-brand-gold mb-3 group-hover:scale-105 transition">
                      <CreditCard size={16} />
                    </div>
                    <h4 className="text-xs font-bold text-text-main font-sans">Connect Bank Feeds</h4>
                    <p className="text-[10px] text-text-muted mt-1 leading-normal">
                      Sync live commercial checking logs with standard general ledger sync.
                    </p>
                  </button>

                  {/* Action 5: Invite Team Members */}
                  <button
                    onClick={() => handleFinalRedirect("Invoicing & Contacts")}
                    className="p-4 rounded-xl border border-border-subtle bg-hover-bg/20 hover:border-brand-gold/40 hover:bg-hover-bg/45 transition cursor-pointer text-left group w-full"
                    id="success-action-team"
                  >
                    <div className="w-9 h-9 rounded-lg bg-brand-gold/10 flex items-center justify-center text-brand-gold mb-3 group-hover:scale-105 transition">
                      <Users size={16} />
                    </div>
                    <h4 className="text-xs font-bold text-text-main font-sans">Manage Team & Contacts</h4>
                    <p className="text-[10px] text-text-muted mt-1 leading-normal">
                      Define permission roles or add customer/supplier partners.
                    </p>
                  </button>

                  {/* Action 6: Generate First Report */}
                  <button
                    onClick={() => handleFinalRedirect("Financial Statements")}
                    className="p-4 rounded-xl border border-border-subtle bg-hover-bg/20 hover:border-brand-gold/40 hover:bg-hover-bg/45 transition cursor-pointer text-left group w-full"
                    id="success-action-reports"
                  >
                    <div className="w-9 h-9 rounded-lg bg-brand-gold/10 flex items-center justify-center text-brand-gold mb-3 group-hover:scale-105 transition">
                      <FileText size={16} />
                    </div>
                    <h4 className="text-xs font-bold text-text-main font-sans">Generate Ledger Report</h4>
                    <p className="text-[10px] text-text-muted mt-1 leading-normal">
                      Export balance sheet statements or draft cash flow reviews.
                    </p>
                  </button>
                </div>

                <div className="pt-8">
                  <button
                    onClick={() => handleFinalRedirect("Overview")}
                    className="w-full py-3 px-6 bg-brand-gold text-white font-bold rounded-xl hover:bg-brand-gold/90 transition text-sm pointer-events-auto"
                  >
                    Finish Setup & Go to Dashboard
                  </button>
                </div>
              </motion.div>
            )}

          </div>

          {/* 3. Action Buttons Footer */}
          {currentStep < 8 && (
            <footer className="mt-8 pt-6 border-t border-border-subtle flex items-center justify-between shrink-0" id="onboarding-wizard-footer">
              <div>
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex items-center gap-1 text-xs text-text-muted hover:text-text-main font-bold p-2 hover:bg-hover-bg/30 rounded-xl transition"
                    id="onboarding-back-btn"
                  >
                    <ChevronLeft size={15} />
                    <span>Back</span>
                  </button>
                )}
                {currentStep === 0 && onboardingType !== "choose" && (
                  <button
                    type="button"
                    onClick={() => setOnboardingType("choose")}
                    className="flex items-center gap-1 text-xs text-text-muted hover:text-text-main font-bold p-2 hover:bg-hover-bg/30 rounded-xl transition"
                    id="onboarding-cancel-btn"
                  >
                    <ChevronLeft size={15} />
                    <span>Reset selection</span>
                  </button>
                )}
              </div>

              {onboardingType !== "choose" && (
                <div className="flex items-center gap-3">
                  {/* Skip buttons on optional steps (5, 6, 7) */}
                  {onboardingType === "business" && (currentStep === 5 || currentStep === 6 || currentStep === 7) && (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(prev => prev + 1)}
                      className="text-xs text-text-muted hover:text-text-main font-bold py-2.5 px-4 rounded-xl border border-dashed border-border-subtle transition hover:bg-hover-bg/20"
                      id="onboarding-skip-btn"
                    >
                      Skip Step
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex items-center gap-1.5 bg-brand-gold text-brand-primary hover:bg-brand-gold-dark px-6 py-2.5 rounded-xl text-xs font-bold transition duration-200 shadow-sm active:scale-95"
                    id="onboarding-next-btn"
                  >
                    <span>{currentStep === (onboardingType === "business" ? 7 : 1) ? "Initialize Workspace" : "Continue"}</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </footer>
          )}
        </main>

      </div>

      {/* 4. Footer credits */}
      <footer className="border-t border-border-subtle py-3 text-center bg-sidebar-bg shrink-0 text-[10px] text-text-muted font-mono" id="onboarding-footer-bar">
        FINITY SECURED ENVIRONMENT • SOC-2 TYPE II PROTOCOL • ENCRYPTED DB SEED PORT 3000
      </footer>
    </div>
  );
}
