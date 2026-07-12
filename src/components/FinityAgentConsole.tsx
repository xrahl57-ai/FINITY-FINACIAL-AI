/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, RefreshCw, FileText, ArrowUpRight, DollarSign, AlertCircle, RefreshCcw, Download, Upload } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { FinityState } from "../types";

function parseInlineMarkdown(inlineText: string): React.ReactNode[] {
  const parts = inlineText.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index} className="font-bold text-text-main">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function parseMarkdownMessage(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let currentTable: string[][] = [];
  let inTable = false;

  const flushTable = (key: string) => {
    if (currentTable.length === 0) return;

    // Filter out separator rows
    const filteredRows = currentTable.filter(row => {
      const joint = row.join("").trim();
      if (!joint) return false;
      return !joint.split("").every(char => char === "-" || char === ":" || char === "|" || char === " ");
    });

    if (filteredRows.length > 0) {
      const headers = filteredRows[0];
      const dataRows = filteredRows.slice(1);

      elements.push(
        <div key={`table-${key}`} className="my-3 overflow-x-auto border border-border-subtle rounded-xl bg-card-bg font-sans max-w-full">
          <table className="min-w-full divide-y divide-border-subtle text-[11px] leading-normal">
            <thead className="bg-hover-bg">
              <tr>
                {headers.map((h, i) => (
                  <th key={`th-${i}`} className="px-3 py-2 text-left font-sans font-bold text-brand-gold uppercase tracking-wider border-b border-border-subtle">
                    {parseInlineMarkdown(h.trim())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle bg-card-bg">
              {dataRows.map((row, rowIndex) => {
                const rowStr = row.join(" ");
                const isTotalRow = rowStr.toLowerCase().includes("total") || rowStr.toLowerCase().includes("sum") || rowStr.toLowerCase().includes("balance") || rowStr.includes("TOTAL") || rowStr.includes("Verification");
                const isSectionHeader = row.some(cell => cell.trim().startsWith("**") && cell.trim().endsWith("**") && row.filter(c => c.trim()).length === 1);
                
                return (
                  <tr key={`tr-${rowIndex}`} className={`${isTotalRow ? "bg-brand-gold-light font-bold border-t border-brand-gold/30" : isSectionHeader ? "bg-hover-bg font-semibold" : "hover:bg-hover-bg"}`}>
                    {row.map((cell, cellIndex) => {
                      const trimmedCell = cell.trim();
                      const isNumber = trimmedCell.startsWith("$") || !isNaN(Number(trimmedCell.replace(/[$,%]/g, ""))) && trimmedCell !== "";
                      return (
                        <td key={`td-${cellIndex}`} className={`px-3 py-2 text-text-main ${isTotalRow ? "text-brand-gold font-bold" : ""} ${isNumber ? "font-mono text-right" : "text-left"}`}>
                          {parseInlineMarkdown(trimmedCell)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }
    currentTable = [];
    inTable = false;
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      inTable = true;
      const cells = line.split("|").slice(1, -1);
      currentTable.push(cells);
    } else {
      if (inTable) {
        flushTable(`idx-${index}`);
      }

      if (trimmed.startsWith("### ")) {
        elements.push(<h4 key={`h3-${index}`} className="text-sm font-bold text-brand-gold mt-4 mb-1.5 flex items-center gap-1">{parseInlineMarkdown(trimmed.slice(4))}</h4>);
      } else if (trimmed.startsWith("## ")) {
        elements.push(<h3 key={`h2-${index}`} className="text-base font-bold text-brand-gold mt-5 mb-2 border-b border-border-subtle pb-1">{parseInlineMarkdown(trimmed.slice(3))}</h3>);
      } else if (trimmed.startsWith("# ")) {
        elements.push(<h2 key={`h1-${index}`} className="text-lg font-bold text-brand-gold mt-6 mb-2.5">{parseInlineMarkdown(trimmed.slice(2))}</h2>);
      } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        elements.push(
          <div key={`li-${index}`} className="flex items-start gap-1.5 ml-3 my-1">
            <span className="text-brand-gold mt-1.5 w-1 h-1 rounded-full bg-brand-gold shrink-0" />
            <span className="text-text-main text-xs font-sans">{parseInlineMarkdown(trimmed.slice(2))}</span>
          </div>
        );
      } else if (/^\d+\.\s/.test(trimmed)) {
        const dotIndex = trimmed.indexOf(".");
        elements.push(
          <div key={`ol-${index}`} className="flex items-start gap-1.5 ml-3 my-1">
            <span className="text-brand-gold font-mono text-[10px] font-bold mt-0.5 w-4 shrink-0">{trimmed.slice(0, dotIndex + 1)}</span>
            <span className="text-text-main text-xs font-sans">{parseInlineMarkdown(trimmed.slice(dotIndex + 1).trim())}</span>
          </div>
        );
      } else if (trimmed === "") {
        elements.push(<div key={`empty-${index}`} className="h-1.5" />);
      } else {
        elements.push(<p key={`p-${index}`} className="text-text-main my-1 leading-relaxed text-xs font-sans">{parseInlineMarkdown(line)}</p>);
      }
    }
  });

  if (inTable) {
    flushTable("final");
  }

  return elements;
}

interface Message {
  id: string;
  sender: "user" | "agent";
  text: string;
  timestamp: Date;
  actionExecuted?: string | null;
}

interface FinityAgentConsoleProps {
  state: FinityState;
  onStateUpdate: (newState: FinityState) => void;
  onRefresh: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSelectReport?: (reportId: string) => void;
}

export default function FinityAgentConsole({
  state,
  onStateUpdate,
  onRefresh,
  activeTab,
  onTabChange,
  onSelectReport,
}: FinityAgentConsoleProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "agent",
      text: "Welcome to **Finity Agent**! I am your AI-powered financial operations partner. \n\nYou can speak to me in plain human language to perform real bookkeeping, generate reports, send invoices, or analyze your company's health.\n\n**Try typing something like:**\n- *\"Paid office rent of $2000 from Bank Account\"*\n- *\"Invoice Stark Industries $3000 for consulting\"*\n- *\"How much money do we have left in the bank?\"*\n- *\"Analyze our business performance and profits\"*",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [systemMessage, setSystemMessage] = useState<string | null>(null);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    
    const userMsgId = "msg-" + Date.now();
    const newUserMessage: Message = {
      id: userMsgId,
      sender: "user",
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInputValue("");
    setIsLoading(true);
    setSystemMessage(null);
    setApiKeyError(null);

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend, activeTab }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Streaming is not supported by your browser.");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      const agentMsgId = "msg-agent-" + Date.now();

      // Insert an empty agent message to stream into
      setMessages((prev) => [
        ...prev,
        {
          id: agentMsgId,
          sender: "agent",
          text: "",
          timestamp: new Date(),
        },
      ]);

      const processLine = (lineStr: string) => {
        const cleanedLine = lineStr.trim();
        if (!cleanedLine || !cleanedLine.startsWith("data: ")) return;
        
        const jsonStr = cleanedLine.slice(6).trim();
        if (!jsonStr) return;

        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed.type === "chunk" && parsed.text) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === agentMsgId
                  ? { ...msg, text: msg.text + parsed.text }
                  : msg
              )
            );
          } else if (parsed.type === "done") {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === agentMsgId
                  ? { ...msg, actionExecuted: parsed.actionExecuted }
                  : msg
              )
            );
            if (parsed.action && parsed.action.type === "VIEW_REPORT" && onSelectReport) {
              onSelectReport(parsed.action.payload?.reportId);
            }
            if (parsed.state) {
              onStateUpdate(parsed.state);
              // Show success action banner
              setSystemMessage(parsed.actionExecuted || "Database state updated.");
            }
          } else if (parsed.type === "error") {
            throw new Error(parsed.error || "Unknown stream error");
          }
        } catch (e: any) {
          console.error("Stream line process error:", e);
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          processLine(line);
        }
      }

      // Handle residual buffer
      if (buffer.trim()) {
        processLine(buffer);
      }

    } catch (err: any) {
      console.error(err);
      const isKeyErr = err.message.includes("GEMINI_API_KEY");
      setApiKeyError(isKeyErr ? "API Key Missing: Please provide your GEMINI_API_KEY inside Settings > Secrets." : err.message);
      
      setMessages((prev) => [
        ...prev,
        {
          id: "err-" + Date.now(),
          sender: "agent",
          text: `⚠️ **Operation Error:** ${err.message}\n\nPlease check your server setup or try again.`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetDb = async () => {
    if (!window.confirm("Are you sure you want to reset the database? This will clear all changes and restore seed financial records.")) return;
    try {
      const res = await fetch("/api/state/reset", { method: "POST" });
      const data = await res.json();
      onStateUpdate(data.state);
      setSystemMessage("Finity double-entry ledger database reset to original seed state.");
      setMessages((prev) => [
        ...prev,
        {
          id: "reset-" + Date.now(),
          sender: "agent",
          text: "🔄 I have successfully reset the financial database to our standard starting chart of accounts and baseline ledger histories.",
          timestamp: new Date(),
        },
      ]);
    } catch (err: any) {
      alert("Reset failed: " + err.message);
    }
  };

  const handleExport = () => {
    window.open("/api/state/export", "_blank");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const res = await fetch("/api/state/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(json),
        });
        if (!res.ok) throw new Error("Invalid import payload");
        const data = await res.json();
        onStateUpdate(data.state);
        setSystemMessage("Custom financial database backup successfully restored.");
        setMessages((prev) => [
          ...prev,
          {
            id: "import-" + Date.now(),
            sender: "agent",
            text: "📥 Custom financial database backup successfully restored and posted to the ledger.",
            timestamp: new Date(),
          },
        ]);
      } catch (err: any) {
        alert("Import failed: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  const quickPrompts = [
    { label: "Analyze Business Health", value: "Act as my AI CFO and perform a comprehensive business health, revenue, and expense audit." },
    { label: "Draft Wayne Corp Invoice", value: "Create an invoice for Wayne Enterprises totaling $4500 for consulting services." },
    { label: "Query Cash Reserves", value: "How much cash do we currently have across checking and petty cash?" },
  ];

  const isWelcomeState = messages.length === 1 && messages[0].id === "welcome";

  return (
    <div className="flex flex-col h-full bg-sidebar-bg border-l border-border-subtle text-text-main" id="agent-console-panel">
      {/* Console Header */}
      <div className="flex items-center justify-between px-4 py-3.5 bg-card-bg text-text-main border-b border-border-subtle" id="console-header">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="font-mono text-[10px] tracking-wider uppercase font-extrabold text-brand-gold">Finity AI Assistant</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="p-1.5 hover:bg-hover-bg rounded-lg text-text-muted hover:text-text-main transition"
            title="Refresh Ledger"
            id="btn-console-refresh"
          >
            <RefreshCcw size={13} />
          </button>
          <button
            onClick={handleExport}
            className="p-1.5 hover:bg-hover-bg rounded-lg text-text-muted hover:text-text-main transition"
            title="Export Backup"
            id="btn-console-export"
          >
            <Download size={13} />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 hover:bg-hover-bg rounded-lg text-text-muted hover:text-text-main transition"
            title="Import Backup"
            id="btn-console-import"
          >
            <Upload size={13} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={handleResetDb}
            className="p-1.5 hover:bg-hover-bg rounded-lg text-red-500 hover:text-red-400 transition text-xs font-mono"
            title="Reset Database"
            id="btn-console-reset"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Warning Panel */}
      {apiKeyError && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2.5 text-red-400 text-xs flex gap-2 items-start" id="api-key-error">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">{apiKeyError}</p>
          </div>
        </div>
      )}

      {/* Action Notification Banner */}
      {systemMessage && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2 text-emerald-400 text-xs font-mono flex items-center gap-2 justify-between" id="system-banner">
          <div className="flex items-center gap-1.5">
            <Sparkles size={12} className="text-[#D4AF37]" />
            <span>{systemMessage}</span>
          </div>
          <button onClick={() => setSystemMessage(null)} className="text-emerald-400 font-bold hover:underline">Dismiss</button>
        </div>
      )}

      {/* Main Container Switch */}
      <AnimatePresence mode="wait">
        {isWelcomeState ? (
          <motion.div
            key="welcome-state"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4 }}
            className="flex-1 flex flex-col justify-between p-6 bg-gradient-to-b from-sidebar-bg via-card-bg to-app-bg relative overflow-hidden"
            id="agent-welcome-screen"
          >
            {/* Animated Ambient background lights */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
              <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-[#D4AF37]/5 blur-[60px] animate-pulse" />
              <div className="absolute bottom-10 -right-10 w-64 h-64 rounded-full bg-purple-500/5 blur-[80px] animate-pulse" />
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:30px_30px] opacity-30" />
            </div>

            <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center space-y-8 max-w-sm mx-auto">
              {/* Logo and Sparkling AI Orb */}
              <div className="space-y-4 flex flex-col items-center">
                {/* Outer rotating dashed ring with central pulsing sparkle */}
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border border-dashed border-[#D4AF37]/20"
                  />
                  
                  <motion.div
                    animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-2 rounded-full bg-[#D4AF37]/10 filter blur-sm"
                  />

                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="w-14 h-14 rounded-full bg-gradient-to-br from-sidebar-bg to-card-bg border border-[#D4AF37]/30 shadow-lg flex items-center justify-center relative"
                  >
                    <Sparkles size={22} className="text-[#D4AF37] animate-pulse" />
                  </motion.div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-[10px] font-mono font-bold text-[#D4AF37] tracking-[0.25em] uppercase">
                    Finity Sovereign AI
                  </h3>
                  <p className="text-[8px] text-text-muted font-mono tracking-wider">
                    SECURE LEDGER CO-PILOT
                  </p>
                </div>
              </div>

              {/* Welcome Greeting */}
              <div className="space-y-2.5">
                <h1 className="text-xl font-extrabold font-sans tracking-tight text-text-main leading-tight">
                  Welcome to Finity Agent
                </h1>
                <p className="text-xs text-text-muted leading-relaxed max-w-[280px] mx-auto font-medium">
                  Your intelligent financial partner is ready to help you manage, understand, and grow your financial world.
                </p>
                <div className="pt-2">
                  <span className="inline-block px-3 py-1 rounded-full bg-hover-bg border border-border-subtle text-[10px] font-mono font-bold text-[#D4AF37] tracking-wide animate-pulse">
                    How can I help you today?
                  </span>
                </div>
              </div>

              {/* Premium Center Chat Input Area */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(inputValue);
                }}
                className="w-full space-y-5"
                id="welcome-input-form"
              >
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/10 to-purple-500/10 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition duration-500" />
                  
                  <div className="relative flex items-center bg-input-bg border border-border-subtle rounded-xl p-1.5 focus-within:border-[#D4AF37]/40 focus-within:bg-hover-bg transition duration-300">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Type a message or select a shortcut..."
                      disabled={isLoading}
                      className="flex-1 bg-transparent border-none text-xs text-text-main placeholder-text-muted px-3.5 py-2.5 outline-none focus:ring-0 w-full font-sans"
                      id="welcome-input-field"
                    />
                    <button
                      type="submit"
                      disabled={!inputValue.trim() || isLoading}
                      className="bg-gradient-to-r from-[#E5C158] to-[#B89742] text-slate-950 p-2.5 rounded-lg hover:shadow-lg hover:shadow-amber-500/20 active:scale-95 transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                      id="welcome-btn-submit"
                    >
                      <Send size={12} />
                    </button>
                  </div>
                </div>

                {/* Minimal suggestions as beautiful pills */}
                <div className="space-y-2 pt-1">
                  <span className="text-[9px] uppercase font-mono tracking-wider font-bold text-text-muted block">
                    Quick Operations
                  </span>
                  <div className="flex flex-col gap-1.5 max-w-[280px] mx-auto">
                    {quickPrompts.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(p.value)}
                        disabled={isLoading}
                        className="text-left text-[11px] bg-card-bg border border-border-subtle hover:border-[#D4AF37]/30 hover:bg-hover-bg text-text-muted rounded-lg px-3 py-2 transition active:scale-98 disabled:opacity-50 flex items-center justify-between group cursor-pointer"
                        id={`welcome-prompt-${idx}`}
                      >
                        <span className="truncate pr-2 font-medium text-text-muted group-hover:text-text-main transition">{p.label}</span>
                        <ArrowUpRight size={11} className="text-text-muted group-hover:text-[#D4AF37] transition shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            </div>

            {/* Micro system telemetry footer line */}
            <div className="text-center text-[9px] text-text-muted/60 font-mono tracking-wider relative z-10 pt-4 uppercase">
              Finity OS v2.5 • Ephemeral Secure Vault
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="chat-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col justify-between overflow-hidden"
          >
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-app-bg text-text-main" id="chat-messages-container">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-[85%] ${
                    msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
                  }`}
                  id={`chat-msg-${msg.id}`}
                >
                  {/* Timestamp & Sender */}
                  <span className="text-[9px] text-text-muted font-mono mb-1">
                    {msg.sender === "user" ? "User" : "Finity Co-Pilot"} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  
                  {/* Bubble */}
                  <div
                    className={`p-3.5 rounded-2xl shadow-lg text-xs leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-[#D4AF37] text-slate-950 font-semibold rounded-tr-none whitespace-pre-wrap"
                        : "bg-card-bg text-text-main border border-border-subtle rounded-tl-none"
                    }`}
                  >
                    {msg.sender === "user" ? (
                      msg.text
                    ) : (
                      <div className="prose-chat-style text-text-main">
                        {parseMarkdownMessage(msg.text)}
                      </div>
                    )}

                    {/* Action Indicator */}
                    {msg.actionExecuted && (
                      <div className="mt-2.5 pt-2 border-t border-border-subtle flex items-center gap-1.5 text-[10px] text-brand-gold font-mono uppercase tracking-wider">
                        <ArrowUpRight size={12} className="shrink-0 text-brand-gold" />
                        <span>{msg.actionExecuted}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 mr-auto bg-card-bg border border-border-subtle p-3 rounded-2xl rounded-tl-none shadow-md text-[10px] text-text-muted font-mono" id="chat-loading-indicator">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-[#818CF8] rounded-full animate-bounce delay-100"></div>
                    <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-bounce delay-200"></div>
                  </div>
                  <span>Recalculating ledger weights...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Prompts Deck */}
            <div className="px-3 py-2 border-t border-border-subtle bg-card-bg space-y-1.5" id="prompts-deck">
              <span className="text-[9px] uppercase font-mono tracking-wider font-extrabold text-text-muted block px-1">Quick Actions</span>
              <div className="flex flex-wrap gap-1.5">
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(p.value)}
                    disabled={isLoading}
                    className="text-left text-[10px] bg-hover-bg text-text-muted hover:bg-hover-bg hover:border-[#D4AF37]/30 rounded-lg px-2.5 py-1.5 border border-border-subtle transition shrink-0 active:scale-98 disabled:opacity-50 font-sans cursor-pointer"
                    id={`quick-prompt-${idx}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputValue);
              }}
              className="p-3 border-t border-border-subtle bg-card-bg flex items-center gap-2"
              id="console-input-form"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask Finity co-pilot..."
                disabled={isLoading}
                className="flex-1 bg-input-bg border border-border-subtle rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#D4AF37]/40 text-text-main placeholder-text-muted transition font-sans"
                id="console-input-field"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="bg-gradient-to-r from-[#E5C158] to-[#B89742] text-slate-950 p-2.5 rounded-xl hover:shadow-lg hover:shadow-amber-500/20 transition active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                id="btn-console-submit"
              >
                <Send size={14} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
