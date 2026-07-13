/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Sparkles,
  Layers,
  Database,
  FileText,
  UserCheck,
  CreditCard,
  Receipt,
  Briefcase,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Command,
  CornerDownLeft,
  HelpCircle
} from "lucide-react";

interface CommandItem {
  id: string;
  name: string;
  subtitle: string;
  category: string;
  icon: React.ComponentType<any>;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  isConsoleOpen: boolean;
  onToggleConsole: (open: boolean) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: (collapsed: boolean) => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  isConsoleOpen,
  onToggleConsole,
  isDarkMode,
  onToggleTheme,
  isSidebarCollapsed,
  onToggleSidebar,
}: CommandPaletteProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setSelectedIndex(0);
      // Short timeout to let the entrance transition begin before focusing
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle outside click
  const overlayRef = useRef<HTMLDivElement>(null);
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  // Define commands list
  const commands: CommandItem[] = [
    // Navigation items
    {
      id: "nav-agent",
      name: "Finity Agent",
      subtitle: "Ask questions, generate reports, audit ledger",
      category: "Navigate to Section",
      icon: Sparkles,
      action: () => {
        onTabChange("Finity Agent");
        onClose();
      }
    },
    {
      id: "nav-overview",
      name: "Overview",
      subtitle: "View financial health indicators & dashboard",
      category: "Navigate to Section",
      icon: Layers,
      action: () => {
        onTabChange("Overview");
        onClose();
      }
    },
    {
      id: "nav-accounts",
      name: "Accounts & Ledgers",
      subtitle: "Chart of Accounts & double-entry journal logs",
      category: "Navigate to Section",
      icon: Database,
      action: () => {
        onTabChange("Accounts & Ledgers");
        onClose();
      }
    },
    {
      id: "nav-statements",
      name: "Financial Statements",
      subtitle: "Profit & Loss, Balance Sheet generator",
      category: "Navigate to Section",
      icon: FileText,
      action: () => {
        onTabChange("Financial Statements");
        onClose();
      }
    },
    {
      id: "nav-invoices",
      name: "Invoicing & Contacts",
      subtitle: "Issue invoices, manage payments, log clients",
      category: "Navigate to Section",
      icon: UserCheck,
      action: () => {
        onTabChange("Invoicing & Contacts");
        onClose();
      }
    },
    {
      id: "nav-banking",
      name: "Banking Hub",
      subtitle: "Review feeds, reconcile bank ledger entries",
      category: "Navigate to Section",
      icon: CreditCard,
      action: () => {
        onTabChange("Banking Hub");
        onClose();
      }
    },
    {
      id: "nav-receipts",
      name: "Receipt Box & OCR",
      subtitle: "Upload expenses and parse with Gemini OCR",
      category: "Navigate to Section",
      icon: Receipt,
      action: () => {
        onTabChange("Receipt Box & OCR");
        onClose();
      }
    },
    {
      id: "nav-products",
      name: "Products & Projects",
      subtitle: "Manage inventory, portfolio costs, and budgets",
      category: "Navigate to Section",
      icon: Briefcase,
      action: () => {
        onTabChange("Products & Projects");
        onClose();
      }
    },
    // AI Copilot Actions
    {
      id: "ai-toggle-open",
      name: isConsoleOpen ? "Hide AI Copilot Panel" : "Open AI Copilot Panel",
      subtitle: "Toggle the interactive side panel chat view",
      category: "AI Copilot Control",
      icon: Sparkles,
      action: () => {
        onToggleConsole(!isConsoleOpen);
        onClose();
      }
    },
    // System Actions
    {
      id: "action-theme",
      name: isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode",
      subtitle: "Toggle between high-contrast Navy dark and light experiences",
      category: "System Utilities",
      icon: isDarkMode ? Sun : Moon,
      action: () => {
        onToggleTheme();
        onClose();
      }
    },
    {
      id: "action-sidebar",
      name: isSidebarCollapsed ? "Expand Sidebar Navigation" : "Collapse Sidebar Navigation",
      subtitle: "Maximize workspace screen area or restore drawer",
      category: "System Utilities",
      icon: isSidebarCollapsed ? ChevronRight : ChevronLeft,
      action: () => {
        onToggleSidebar(!isSidebarCollapsed);
        onClose();
      }
    }
  ];

  // Filter commands
  const filteredCommands = commands.filter((cmd) => {
    const search = searchQuery.toLowerCase();
    return (
      cmd.name.toLowerCase().includes(search) ||
      cmd.subtitle.toLowerCase().includes(search) ||
      cmd.category.toLowerCase().includes(search)
    );
  });

  // Handle keyboard interaction inside Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands]);

  // Keep selected item visible in scroll container
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          ref={overlayRef}
          onClick={handleOverlayClick}
          className="fixed inset-0 z-100 bg-slate-950/70 backdrop-blur-md flex items-start justify-center pt-[12vh] px-4"
          id="command-palette-backdrop"
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="w-full max-w-xl bg-card-bg border border-brand-gold/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col relative"
            id="command-palette-window"
            style={{
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(212, 175, 55, 0.08)"
            }}
          >
            {/* Elegant Golden Gradient Accent Border */}
            <div className="h-[2px] w-full bg-gradient-to-r from-brand-gold/20 via-brand-gold to-brand-gold/20" />

            {/* Header: Input search */}
            <div className="p-4 border-b border-border-subtle/50 flex items-center gap-3 bg-sidebar-bg/50">
              <Search className="text-brand-gold shrink-0" size={18} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search command palette or navigation sections..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                className="w-full bg-transparent border-none text-text-main placeholder-text-muted font-sans text-sm outline-none focus:ring-0 focus:border-none focus:shadow-none p-0"
              />
              <div className="flex items-center gap-1.5 shrink-0 px-2 py-1 rounded bg-hover-bg border border-border-subtle font-mono text-[9px] text-text-muted select-none">
                <span>ESC</span>
              </div>
            </div>

            {/* Content list */}
            <div 
              ref={listRef}
              className="max-h-[360px] overflow-y-auto p-2 space-y-1 scrollbar-thin text-left"
              id="command-palette-results"
            >
              {filteredCommands.length > 0 ? (
                // Group by category for cleaner display
                Object.entries(
                  filteredCommands.reduce((groups, item) => {
                    if (!groups[item.category]) {
                      groups[item.category] = [];
                    }
                    groups[item.category].push(item);
                    return groups;
                  }, {} as Record<string, CommandItem[]>)
                ).map(([category, items]) => (
                  <div key={category} className="space-y-1">
                    <div className="px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider text-brand-gold font-bold">
                      {category}
                    </div>
                    {items.map((cmd) => {
                      // Find real index in flat list for selection matching
                      const flatIndex = filteredCommands.findIndex((c) => c.id === cmd.id);
                      const isSelected = flatIndex === selectedIndex;
                      const Icon = cmd.icon;

                      return (
                        <div
                          key={cmd.id}
                          data-active={isSelected}
                          onClick={() => cmd.action()}
                          className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
                            isSelected
                              ? "bg-brand-gold text-slate-950 font-medium shadow-md"
                              : "text-text-main hover:bg-hover-bg/80"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`p-2 rounded-lg transition-colors ${
                              isSelected 
                                ? "bg-slate-950/10 text-slate-950" 
                                : "bg-sidebar-bg border border-border-subtle/50 text-text-muted group-hover:text-brand-gold"
                            }`}>
                              <Icon size={15} />
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-bold font-sans block leading-none">
                                {cmd.name}
                              </span>
                              <span className={`text-[10px] mt-1 font-sans block truncate ${
                                isSelected ? "text-slate-900" : "text-text-muted"
                              }`}>
                                {cmd.subtitle}
                              </span>
                            </div>
                          </div>

                          {/* Quick enter button preview */}
                          {isSelected && (
                            <motion.div 
                              initial={{ opacity: 0, x: -5 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex items-center gap-1 font-mono text-[9px] bg-slate-950/15 px-1.5 py-0.5 rounded text-slate-950"
                            >
                              <span>Enter</span>
                              <CornerDownLeft size={8} />
                            </motion.div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))
              ) : (
                <div className="py-8 px-4 text-center flex flex-col items-center justify-center">
                  <HelpCircle size={24} className="text-text-muted mb-2 animate-bounce" />
                  <span className="font-sans text-xs font-bold text-text-muted">No commands found</span>
                  <span className="font-sans text-[10px] text-text-muted/60 mt-1">Try modifying your search query</span>
                </div>
              )}
            </div>

            {/* Footer with hint keys */}
            <div className="p-3 border-t border-border-subtle/50 bg-sidebar-bg/30 flex justify-between items-center font-mono text-[9px] text-text-muted">
              <div className="flex gap-4">
                <span className="flex items-center gap-1">
                  <span className="px-1 py-0.5 rounded bg-hover-bg border border-border-subtle">↑↓</span> Move
                </span>
                <span className="flex items-center gap-1">
                  <span className="px-1 py-0.5 rounded bg-hover-bg border border-border-subtle">Enter</span> Select
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Command size={10} className="text-brand-gold" />
                <span>FINITY OS SHELL</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
