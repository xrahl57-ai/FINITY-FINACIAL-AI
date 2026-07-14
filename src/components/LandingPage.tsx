import React, { useState } from "react";
import {
  Sparkles,
  TrendingUp,
  Activity,
  FileText,
  Shield,
  ArrowRight,
  Mail,
  Lock,
  Smartphone,
  Coins,
  ChevronRight,
  Fingerprint,
  Wallet,
  Zap,
  Globe,
  Bell,
  Cpu,
  CheckCircle,
  HelpCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { FinityState } from "../types";

// ==========================================
// 1. REUSABLE LOGO COMPONENT
// ==========================================
export function Logo({ size = "md", animate = true }: { size?: "sm" | "md" | "lg"; animate?: boolean }) {
  const containerClasses = {
    sm: "gap-2",
    md: "gap-3",
    lg: "gap-4"
  }[size];

  const logoBoxClasses = {
    sm: "w-8 h-8 rounded-lg text-sm",
    md: "w-10 h-10 rounded-xl text-lg",
    lg: "w-14 h-14 rounded-2xl text-2xl"
  }[size];

  const titleClasses = {
    sm: "text-base tracking-wider",
    md: "text-xl tracking-widest",
    lg: "text-3xl tracking-[0.2em]"
  }[size];

  const subtitleClasses = {
    sm: "text-[7px]",
    md: "text-[9px]",
    lg: "text-[11px]"
  }[size];

  return (
    <div className={`flex items-center ${containerClasses} select-none`} id="finity-logo-component">
      {/* Elegant generated logo */}
      <motion.div
        animate={animate ? {
          boxShadow: [
            "0 0 12px rgba(212, 175, 55, 0.2)",
            "0 0 24px rgba(212, 175, 55, 0.4)",
            "0 0 12px rgba(212, 175, 55, 0.2)"
          ]
        } : {}}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className={`${logoBoxClasses} border border-amber-300/30 flex items-center justify-center font-sans font-black tracking-tighter relative shadow-lg shadow-amber-500/10 overflow-hidden`}
      >
        <img 
          src="/src/assets/images/finity_logo_1784015981020.jpg" 
          alt="Finity OS Logo" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </motion.div>

      <div className="flex flex-col text-left">
        <span className={`${titleClasses} font-sans font-black text-white leading-none tracking-widest`}>
          FINITY
        </span>
        <span className={`${subtitleClasses} font-mono font-bold text-[#D4AF37] tracking-[0.25em] uppercase mt-1 opacity-90`}>
          AI-POWERED FINANCE
        </span>
      </div>
    </div>
  );
}

// ==========================================
// 2. REUSABLE FEATURE CARD COMPONENT
// ==========================================
interface FeatureCardProps {
  title: string;
  description: string;
  icon: "analytics" | "sparkle" | "report" | "shield";
}

export function FeatureCard({ title, description, icon }: FeatureCardProps) {
  const getIcon = () => {
    switch (icon) {
      case "analytics":
        return <Activity className="text-[#D4AF37]" size={20} />;
      case "sparkle":
        return <Sparkles className="text-purple-400" size={20} />;
      case "report":
        return <FileText className="text-blue-400" size={20} />;
      case "shield":
        return <Shield className="text-emerald-400" size={20} />;
    }
  };

  const getBorderColor = () => {
    switch (icon) {
      case "analytics":
        return "group-hover:border-amber-500/40";
      case "sparkle":
        return "group-hover:border-purple-500/40";
      case "report":
        return "group-hover:border-blue-500/40";
      case "shield":
        return "group-hover:border-emerald-500/40";
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`p-5 rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/5 hover:bg-white/[0.06] transition-all duration-300 text-left group cursor-pointer ${getBorderColor()}`}
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-colors">
          {getIcon()}
        </div>
        <div className="flex-1 space-y-1">
          <h4 className="text-sm font-bold text-white tracking-tight group-hover:text-[#D4AF37] transition-colors">
            {title}
          </h4>
          <p className="text-xs text-slate-300/80 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ==========================================
// 3. REUSABLE PRIMARY BUTTON
// ==========================================
interface ButtonProps {
  children: React.ReactNode;
  loading?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  id?: string;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export function PrimaryButton({ children, loading = false, ...props }: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.03, boxShadow: "0 0 20px rgba(212, 175, 55, 0.4)" }}
      whileTap={{ scale: 0.98 }}
      className="relative px-8 py-4 rounded-xl bg-gradient-to-r from-[#E5C158] via-[#B89742] to-[#8C6D23] text-slate-950 font-sans font-extrabold text-sm tracking-wider uppercase shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 overflow-hidden group transition-all duration-300 cursor-pointer disabled:opacity-55 disabled:pointer-events-none"
      {...props}
    >
      {/* Light sheen sweeping animation */}
      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
      
      {loading ? (
        <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
      ) : (
        children
      )}
    </motion.button>
  );
}

// ==========================================
// 4. REUSABLE SECONDARY BUTTON
// ==========================================
export function SecondaryButton({ children, ...props }: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.03, backgroundColor: "rgba(255, 255, 255, 0.08)", borderColor: "rgba(212, 175, 55, 0.5)" }}
      whileTap={{ scale: 0.98 }}
      className="px-8 py-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-white font-sans font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer"
      {...props}
    >
      {children}
    </motion.button>
  );
}

// ==========================================
// 5. LANDING PAGE WRAPPER & ENTRY EXPERIENCE
// ==========================================
interface LandingPageProps {
  onGetStarted: () => void;
  onLoginSuccess: (state: FinityState) => void;
}

export default function LandingPage({ onGetStarted, onLoginSuccess }: LandingPageProps) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [startingOnboarding, setStartingOnboarding] = useState(false);

  // Background random particles configuration
  const particles = Array.from({ length: 15 });

  // Real login authentication protocol
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setLoginError("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);
    setLoginError("");

    try {
      const response = await fetch("/api/state/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        })
      });

      const data = await response.json();
      
      // Professional security verification latency
      setTimeout(() => {
        setIsSubmitting(false);
        if (response.ok && data.status === "success" && data.state) {
          onLoginSuccess(data.state);
        } else {
          setLoginError(data.error || "Authentication failed. Invalid email or password.");
        }
      }, 1000);

    } catch (err) {
      setIsSubmitting(false);
      setLoginError("Connection timed out. Please verify your sandbox environment.");
    }
  };

  // Google Sign-In secure login check
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setLoginError("");

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      console.log("Logged in user:", user.email);

      // Check existing state/onboarding via API
      const stateRes = await fetch("/api/state");
      const stateData = await stateRes.json();

      if (!stateData.state || !stateData.state.isOnboarded) {
        // Force onboarding if not onboarded
        setStartingOnboarding(true);
        setTimeout(() => {
          onGetStarted();
          setGoogleLoading(false);
        }, 1800);
        return;
      }

      // If onboarded, log in as verified user
      onLoginSuccess(stateData.state);
      setGoogleLoading(false);
    } catch (err: any) {
      setGoogleLoading(false);
      setLoginError(err.message || "Google Sign-In integration error. Please try again.");
    }
  };

  // Trigger high fidelity loading screen before wizard starts
  const handleGetStartedClick = () => {
    setStartingOnboarding(true);
    setTimeout(() => {
      onGetStarted();
    }, 1800);
  };

  return (
    <div className="min-h-screen w-screen bg-[#060413] text-white flex flex-col relative overflow-x-hidden font-sans select-none" id="finity-landing-root">
      
      {/* 1. PREMIUM AMBIENT BACKDROP GRADIETS & GLOWS */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Navy/Purple Radial Base */}
        <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] rounded-full bg-indigo-950/30 blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] rounded-full bg-purple-950/20 blur-[180px]" />
        <div className="absolute top-[30%] right-[20%] w-[50%] h-[50%] rounded-full bg-blue-950/20 blur-[120px]" />
        
        {/* Subtle CSS Grids */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] opacity-40" />

        {/* Floating background particle array */}
        {particles.map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -40, 0],
              x: [0, Math.sin(i) * 20, 0],
              opacity: [0.1, 0.4, 0.1]
            }}
            transition={{
              duration: 8 + (i % 5) * 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5
            }}
            className="absolute rounded-full bg-amber-400/20"
            style={{
              width: `${(i % 3) + 2}px`,
              height: `${(i % 3) + 2}px`,
              top: `${15 + (i * 5.3) % 75}%`,
              left: `${10 + (i * 6.7) % 80}%`
            }}
          />
        ))}
      </div>

      {/* 2. ONBOARDING LOADING TRANSTION SCREEN */}
      <AnimatePresence>
        {startingOnboarding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#060413] flex flex-col items-center justify-center p-6"
            id="finity-launching-panel"
          >
            <div className="space-y-6 max-w-sm text-center">
              <Logo size="lg" animate={true} />
              
              <div className="space-y-3 pt-6">
                <div className="w-48 h-1 bg-white/5 rounded-full mx-auto overflow-hidden relative">
                  <motion.div
                    initial={{ left: "-100%" }}
                    animate={{ left: "100%" }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-0 bottom-0 w-24 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"
                  />
                </div>
                <p className="text-xs font-mono text-[#D4AF37] uppercase tracking-[0.15em] animate-pulse">
                  Initializing Sandbox Node...
                </p>
                <p className="text-[10px] text-slate-400">
                  Provisioning double-entry ledgers & neural weights
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. LANDING PAGE NAVBAR */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10" id="landing-navbar">
        <Logo size="md" animate={true} />
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsLoginOpen(true)}
            className="text-sm font-bold text-slate-300 hover:text-[#D4AF37] transition cursor-pointer px-4 py-2 rounded-lg hover:bg-white/5"
            id="nav-signin-trigger"
          >
            Sign In
          </button>
          
          <button
            onClick={handleGetStartedClick}
            className="hidden sm:inline-flex items-center gap-1 px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#E5C158] to-[#B89742] hover:shadow-lg hover:shadow-amber-500/20 text-slate-950 font-bold text-xs tracking-wider uppercase transition cursor-pointer"
            id="nav-getstarted-trigger"
          >
            Get Started <ChevronRight size={14} />
          </button>
        </div>
      </header>

      {/* 4. MAIN CONTENT AREA */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-10 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10" id="landing-main-stage">
        
        {/* ==========================================
            LEFT COLUMN: COPY & CORE STATEMENTS
           ========================================== */}
        <div className="lg:col-span-6 space-y-10 text-left" id="landing-left-column">
          
          {/* Top subtle highlight banner */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/10"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono text-slate-300 tracking-wider uppercase">Finity Sandbox Node v2.5 Online</span>
          </motion.div>

          {/* Heading Blocks */}
          <div className="space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black font-sans tracking-tight text-white leading-tight"
            >
              Welcome to <span className="bg-gradient-to-r from-yellow-100 via-amber-200 to-[#D4AF37] bg-clip-text text-transparent">Finity</span>
            </motion.h1>

            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl sm:text-2xl font-sans font-bold text-slate-200 tracking-tight"
            >
              Your AI-Powered Financial Workspace.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-lg font-medium"
            >
              Manage your money, grow your business, and make smarter financial decisions with the power of AI. A unified, secure ledger platform engineered for institutional precision.
            </motion.p>
          </div>

          {/* Button Operations */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
            id="landing-cta-buttons"
          >
            <PrimaryButton onClick={handleGetStartedClick} id="btn-hero-getstarted">
              Get Started <ArrowRight size={16} />
            </PrimaryButton>
            
            <SecondaryButton onClick={() => setIsLoginOpen(true)} id="btn-hero-signin">
              Sign In
            </SecondaryButton>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4"
            id="landing-features-grid"
          >
            <FeatureCard
              title="Track Finances"
              description="Automated double-entry General Ledger balancing with direct multi-currency accounting assets."
              icon="analytics"
            />
            <FeatureCard
              title="AI Insights"
              description="Our LLM assistant analyzes receipts, maps rules, forecasts trends, and flags anomalies."
              icon="sparkle"
            />
            <FeatureCard
              title="Smart Reports"
              description="Instantly compile GAAP compliant Balance Sheets, Profit & Loss, and active Trial Balance feeds."
              icon="report"
            />
            <FeatureCard
              title="Secure & Private"
              description="End-to-end sandbox shielding. Zero-knowledge parameters with full client-side export."
              icon="shield"
            />
          </motion.div>
        </div>

        {/* ==========================================
            RIGHT COLUMN: 3D FLOATING DASHBOARD MOCKUP
           ========================================== */}
        <div className="lg:col-span-6 flex items-center justify-center relative min-h-[500px] lg:min-h-[600px]" id="landing-right-column">
          
          {/* Elegant ambient light flare directly behind phone */}
          <div className="absolute w-[350px] h-[350px] rounded-full bg-purple-500/10 blur-[100px] pointer-events-none z-0" />
          <div className="absolute w-[250px] h-[250px] rounded-full bg-amber-500/5 blur-[80px] pointer-events-none z-0" />

          <motion.div
            animate={{
              y: [0, -12, 0],
              rotateY: [15, 12, 15],
              rotateX: [6, 8, 6],
              rotateZ: [-2, 0, -2]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{ transformStyle: "preserve-3d", perspective: 1200 }}
            className="relative z-10 w-[280px] sm:w-[310px] aspect-[9/19] rounded-[48px] border-[6px] border-slate-800 bg-[#0c0a21] shadow-2xl shadow-purple-950/40 p-3 select-none flex flex-col justify-between overflow-hidden"
            id="mockup-smartphone-frame"
          >
            {/* Phone notch element */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-800 rounded-full z-30 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-900 mr-2" />
              <div className="w-10 h-1 bg-slate-900 rounded-full" />
            </div>

            {/* Inner Dashboard View */}
            <div className="flex-1 bg-[#090718] rounded-[38px] overflow-hidden p-3 pt-6 flex flex-col justify-between relative" id="mockup-phone-content">
              
              {/* Phone Header */}
              <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 pb-2 border-b border-white/5">
                <span className="font-bold text-white">finity_os</span>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>SECURE CONNECTED</span>
                </div>
              </div>

              {/* Total Balance Card */}
              <div className="mt-3 bg-gradient-to-br from-[#1c143d] via-[#110a26] to-[#0c051a] border border-white/10 rounded-2xl p-3.5 space-y-2 relative overflow-hidden shadow-lg">
                <div className="absolute top-2 right-2 text-amber-400">
                  <Fingerprint size={14} className="opacity-60" />
                </div>
                
                <span className="text-[8px] font-mono text-slate-400 tracking-wider uppercase block">
                  Aggregate Wallet Net Worth
                </span>
                
                <div className="space-y-0.5">
                  <span className="text-xl font-sans font-black text-white tracking-tight">
                    $1,429,804.30
                  </span>
                  <div className="flex items-center gap-1.5 text-[8px] text-emerald-400 font-mono">
                    <ArrowUpRight size={10} />
                    <span>+14.2% THIS FISCAL</span>
                  </div>
                </div>

                {/* Simulated Ledger distribution */}
                <div className="pt-2 flex justify-between gap-2 border-t border-white/5">
                  <div className="text-left">
                    <span className="text-[7px] text-slate-500 uppercase block">Liabilities</span>
                    <span className="text-[9px] font-mono font-bold text-white">$142,500.00</span>
                  </div>
                  <div className="text-left">
                    <span className="text-[7px] text-slate-500 uppercase block">Available Liquidity</span>
                    <span className="text-[9px] font-mono font-bold text-[#D4AF37]">$1,287,304.30</span>
                  </div>
                </div>
              </div>

              {/* Mini Income/Expense graph mockup */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 space-y-2 text-left">
                <div className="flex justify-between items-center text-[8px] font-mono">
                  <span className="text-slate-400">Ledger Indexing Stream</span>
                  <span className="text-[#D4AF37]">7d Active Matrix</span>
                </div>
                
                {/* SVG Line Graph */}
                <div className="h-16 w-full pt-1 relative">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40">
                    <defs>
                      <linearGradient id="chart-gold-glow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.4"/>
                        <stop offset="100%" stopColor="#D4AF37" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,35 Q15,15 30,28 T60,8 T90,2 T100,10"
                      fill="none"
                      stroke="#D4AF37"
                      strokeWidth="2"
                    />
                    <path
                      d="M0,35 Q15,15 30,28 T60,8 T90,2 T100,10 L100,40 L0,40 Z"
                      fill="url(#chart-gold-glow)"
                    />
                    <path
                      d="M0,32 C20,38 40,25 60,35 C80,45 90,30 100,28"
                      fill="none"
                      stroke="#818CF8"
                      strokeWidth="1.5"
                      strokeDasharray="2,2"
                      className="opacity-70"
                    />
                  </svg>
                  
                  {/* Glowing active pinpoint */}
                  <motion.div
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute top-[8px] right-[24px] w-2 h-2 rounded-full bg-[#D4AF37] shadow-lg shadow-amber-400"
                  />
                </div>
              </div>

              {/* Transactions list */}
              <div className="space-y-1.5 text-left">
                <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider block">
                  Finity Ledger Stream
                </span>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between p-1.5 bg-white/[0.02] border border-white/5 rounded-lg text-[9px]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <ArrowDownRight size={10} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-white">Stripe Inbound</span>
                        <span className="text-[7px] text-slate-500">Invoice #10922</span>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-emerald-400">+$24,500.00</span>
                  </div>

                  <div className="flex items-center justify-between p-1.5 bg-white/[0.02] border border-white/5 rounded-lg text-[9px]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded bg-amber-500/10 flex items-center justify-center text-amber-400">
                        <ArrowUpRight size={10} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-white">AWS Cloud Compute</span>
                        <span className="text-[7px] text-slate-500">Infrastructure Cost</span>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-slate-300">-$4,210.50</span>
                  </div>
                </div>
              </div>

              {/* Active AI Agent prompt box mockup */}
              <div className="bg-[#150e2a] border border-[#D4AF37]/20 rounded-2xl p-2.5 flex items-start gap-2 text-left relative overflow-hidden">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shrink-0">
                  <Sparkles size={11} className="animate-pulse" />
                </div>
                <div className="flex-1 space-y-0.5">
                  <span className="text-[8px] font-mono font-bold text-[#D4AF37]">Finity AI Copilot</span>
                  <p className="text-[8.5px] text-slate-300 leading-normal">
                    "Detected $3,450 tax saving option in SaaS registration. Apply ledger rule?"
                  </p>
                </div>
                {/* Micro neon pulse indicator */}
                <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
              </div>

            </div>
          </motion.div>

          {/* ==========================================
              FLOATING SATELLITE ITEMS (3D BENTO EFFECT)
             ========================================== */}
          
          {/* Floating Widget 1: AI Assistant Core Pulse */}
          <motion.div
            animate={{ y: [-15, 10, -15], rotate: [0, 5, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[8%] left-[2%] sm:left-[8%] z-20 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-3 shadow-lg shadow-purple-500/5 max-w-[170px]"
            id="floating-widget-ai"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Sparkles size={16} className="animate-pulse" />
            </div>
            <div className="text-left">
              <span className="text-[9px] font-mono font-bold text-purple-400 block uppercase">Finity AI Model</span>
              <span className="text-[11px] text-white font-bold leading-none">Smart Forecasting</span>
            </div>
          </motion.div>

          {/* Floating Widget 2: Security Shield Hardware token */}
          <motion.div
            animate={{ y: [15, -15, 15], rotate: [0, -5, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[10%] left-[0%] sm:left-[4%] z-20 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-3 shadow-lg shadow-emerald-500/5 max-w-[170px]"
            id="floating-widget-security"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-spin-slow">
              <Shield size={16} />
            </div>
            <div className="text-left">
              <span className="text-[9px] font-mono font-bold text-emerald-400 block uppercase">Sandbox Lock</span>
              <span className="text-[11px] text-white font-bold leading-none">AES-256 Vaulted</span>
            </div>
          </motion.div>

          {/* Floating Widget 3: Growth Metrics Trend Chart */}
          <motion.div
            animate={{ y: [-20, 20, -20], x: [10, -10, 10] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[25%] right-[0%] sm:right-[5%] z-20 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 space-y-1.5 shadow-lg shadow-amber-500/5 max-w-[160px]"
            id="floating-widget-growth"
          >
            <div className="flex items-center justify-between gap-3 text-left">
              <span className="text-[10px] text-slate-400 font-bold font-sans">Growth Scale</span>
              <span className="text-[10px] font-mono text-emerald-400 font-extrabold">+230.4%</span>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-amber-400 to-[#D4AF37] h-full w-[85%] rounded-full" />
            </div>
            <span className="text-[8px] font-mono text-slate-500 block uppercase text-left">Aggregated Ledger Pool</span>
          </motion.div>

          {/* Floating Gold Coins */}
          <motion.div
            animate={{
              y: [0, -40, 0],
              x: [0, 15, 0],
              rotate: [0, 180, 360]
            }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[5%] right-[15%] z-30 text-[#D4AF37] opacity-90 filter drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]"
            id="floating-gold-coin-1"
          >
            <Coins size={36} className="fill-[#D4AF37]" />
          </motion.div>

          <motion.div
            animate={{
              y: [0, 50, 0],
              x: [0, -25, 0],
              rotate: [360, 180, 0]
            }}
            transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[18%] right-[8%] z-30 text-amber-500 opacity-70 filter drop-shadow-[0_0_6px_rgba(245,158,11,0.3)]"
            id="floating-gold-coin-2"
          >
            <Coins size={24} className="fill-amber-500" />
          </motion.div>
        </div>

      </main>

      {/* ==========================================
          SIGN IN PREMIUM GLASSMORPHISM MODAL OVERLAY
         ========================================== */}
      <AnimatePresence>
        {isLoginOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#060413]/85 backdrop-blur-md flex items-center justify-center p-4"
            id="signin-modal-overlay"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-md bg-gradient-to-b from-[#161233] to-[#0c0821] border border-white/10 rounded-3xl p-8 relative shadow-2xl overflow-hidden"
              id="signin-modal-card"
            >
              {/* Premium Background Glimmer inside Modal */}
              <div className="absolute top-0 right-0 w-44 h-44 bg-[#D4AF37]/5 blur-[60px] pointer-events-none" />
              
              {/* Close Button */}
              <button
                onClick={() => {
                  setIsLoginOpen(false);
                  setLoginError("");
                }}
                className="absolute top-5 right-5 text-slate-400 hover:text-white transition w-8 h-8 rounded-full bg-white/5 flex items-center justify-center"
                id="btn-close-signin"
              >
                ✕
              </button>

              <div className="space-y-6 text-center">
                <div className="flex justify-center pb-2">
                  <Logo size="md" animate={false} />
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-xl font-black font-sans text-white tracking-tight">
                    Welcome Back Executive
                  </h3>
                  <p className="text-xs text-slate-400">
                    Authenticate to unlock your private sandbox environment.
                  </p>
                </div>

                {loginError && (
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 text-left font-medium">
                    {loginError}
                  </div>
                )}

                {/* Simulated Google Sign-In button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading || isSubmitting}
                  className="w-full p-3.5 rounded-xl bg-white text-slate-950 font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-3 hover:bg-slate-100 transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
                  id="btn-google-signin"
                >
                  {googleLoading ? (
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-.14 3-.8 4.3l3.3 2.56c1.93-1.78 3.55-4.4 3.55-8.71z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.3-2.56c-.9.6-2.06.96-3.23.96-3.11 0-5.74-2.1-6.68-4.96l-3.4 2.63C5.35 21.6 8.36 24 12 24z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.32 14.53a7.16 7.16 0 0 1 0-4.51L1.91 7.39a11.94 11.94 0 0 0 0 9.21l3.41-2.07z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.96 1.19 15.24 0 12 0 8.36 0 5.35 2.4 3.33 6.84l3.41 2.63c.94-2.86 3.57-4.96 6.68-4.96z"
                        />
                      </svg>
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-3 text-slate-600 my-4">
                  <div className="h-[1px] bg-white/10 flex-1" />
                  <span className="text-[10px] font-mono tracking-wider font-bold">OR EMAIL</span>
                  <div className="h-[1px] bg-white/10 flex-1" />
                </div>

                {/* Email Sign In Form */}
                <form onSubmit={handleEmailSignIn} className="space-y-4 text-left">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase font-bold text-slate-400">Work Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                      <input
                        type="email"
                        required
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 pl-11 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition"
                        placeholder="executive@corporation.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        id="signin-email-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-mono uppercase font-bold text-slate-400">Password</label>
                      <button
                        type="button"
                        onClick={() => alert("[FINITY SECURITY OS] Master recovery options must be accessed inside the local console dashboard.")}
                        className="text-[9px] font-mono text-purple-400 hover:text-purple-300 transition"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                      <input
                        type="password"
                        required
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 pl-11 text-xs text-white focus:outline-none focus:border-[#D4AF37] transition"
                        placeholder="••••••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        id="signin-password-input"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || googleLoading}
                    className="w-full p-4 rounded-xl bg-gradient-to-r from-[#E5C158] to-[#B89742] text-slate-950 font-black text-xs tracking-wider uppercase shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-6"
                    id="btn-submit-email-signin"
                  >
                    {isSubmitting ? (
                      <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Unlock Vault</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </form>

                <p className="text-[10px] text-slate-500 pt-3">
                  This sandbox platform validates logins on secure ephemeral client vectors.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. FOOTER */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-slate-500 text-xs gap-4 relative z-10" id="landing-footer">
        <span>© 2026 Finity Technologies Inc. All rights reserved.</span>
        
        <div className="flex items-center gap-6 font-mono text-[10px] tracking-wider uppercase font-semibold">
          <button
            onClick={() => alert("Privacy terms configured client-side. Complete sandbox privacy agreement is loaded.")}
            className="hover:text-slate-300 transition"
          >
            Privacy Shield
          </button>
          <span>•</span>
          <button
            onClick={() => alert("Standard dual ledger protocols compliant. GAAP & IFRS Sandbox specifications valid.")}
            className="hover:text-slate-300 transition"
          >
            Compliance Standard
          </button>
        </div>
      </footer>
    </div>
  );
}
