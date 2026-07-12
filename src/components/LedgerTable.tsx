/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Search, Folder, BookOpen, ChevronRight, FileText, Plus, Check, ArrowRight, Layers } from "lucide-react";
import { FinityState, Account, AccountType, JournalEntry } from "../types";

interface LedgerTableProps {
  state: FinityState;
  onRefresh: () => void;
  isConsoleOpen?: boolean;
}

export default function LedgerTable({ state, onRefresh, isConsoleOpen = false }: LedgerTableProps) {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const accounts = state.accounts;
  const journalEntries = state.journalEntries;

  // Filter accounts by search
  const filteredAccounts = accounts.filter(
    (acc) =>
      acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.code.includes(searchQuery) ||
      acc.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAccountLedgerLines = (accountId: string) => {
    const lines: {
      jeId: string;
      date: string;
      description: string;
      debit: number;
      credit: number;
      runningBalance: number;
    }[] = [];

    const targetAccount = accounts.find((a) => a.id === accountId);
    if (!targetAccount) return [];

    let currentBalance = 0;

    // Journal lines affecting this account, sorted by date ascending
    const sortedJEs = [...journalEntries]
      .filter((je) => je.status === "posted")
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sortedJEs.forEach((je) => {
      je.lines.forEach((line) => {
        if (line.accountId === accountId) {
          if (targetAccount.type === AccountType.ASSET || targetAccount.type === AccountType.EXPENSE) {
            currentBalance += line.debit - line.credit;
          } else {
            currentBalance += line.credit - line.debit;
          }

          lines.push({
            jeId: je.id,
            date: je.date,
            description: je.description,
            debit: line.debit,
            credit: line.credit,
            runningBalance: currentBalance,
          });
        }
      });
    });

    // Return descending by date for display
    return lines.reverse();
  };

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const ledgerLines = selectedAccountId ? getAccountLedgerLines(selectedAccountId) : [];

  return (
    <div className="space-y-8" id="ledger-tab-container">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-6" id="ledger-header">
        <div>
          <h1 className="font-sans text-2xl font-black text-text-main tracking-tight" id="ledger-title">
            Chart of Accounts Explorer
          </h1>
          <p className="text-xs text-text-muted font-mono mt-1 font-semibold">CPA-compliant corporate chart directories & general ledger books</p>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${isConsoleOpen ? "xl:grid-cols-12" : "lg:grid-cols-12"} gap-6`} id="ledger-layout-row">
        {/* Chart of Accounts list */}
        <div className={`bg-card-bg border border-border-subtle rounded-2xl p-6 shadow-xl ${selectedAccountId ? (isConsoleOpen ? "xl:col-span-6" : "lg:col-span-6") : (isConsoleOpen ? "xl:col-span-12" : "lg:col-span-12")}`} id="accounts-directory-panel">
          <div className="flex items-center gap-3 mb-5" id="accounts-search-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-text-muted" size={14} />
              <input
                type="text"
                placeholder="Query chart of accounts by legal descriptor, code or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-app-bg border border-border-subtle rounded-xl text-xs outline-none focus:border-brand-gold/40 focus:bg-card-bg transition text-text-main font-sans"
                id="search-accounts-input"
              />
            </div>
          </div>

          <div className="border border-border-subtle rounded-xl overflow-hidden bg-app-bg/25" id="accounts-table-container">
            <table className="w-full text-left border-collapse min-w-[400px]" id="tbl-chart-of-accounts">
              <thead>
                <tr className="bg-sidebar-bg/50 border-b border-border-subtle font-mono text-[9px] text-text-muted uppercase tracking-wider">
                  <th className="px-4 py-3 font-bold">Posting Code</th>
                  <th className="px-4 py-3 font-bold">Descriptor Name</th>
                  <th className="px-4 py-3 font-bold">Sovereign Class</th>
                  <th className="px-4 py-3 text-right font-bold">Ledger Balance</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/40 font-mono text-xs text-text-main" id="tbl-body-chart-of-accounts">
                {filteredAccounts.map((acc) => (
                  <tr
                    key={acc.id}
                    onClick={() => setSelectedAccountId(acc.id)}
                    className={`cursor-pointer hover:bg-hover-bg/30 transition-all duration-200 ${
                      selectedAccountId === acc.id ? "bg-hover-bg/50 font-semibold border-l-2 border-brand-gold" : ""
                    }`}
                    id={`account-row-${acc.id}`}
                  >
                    <td className="px-4 py-3.5 font-bold text-brand-gold">{acc.code}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <Folder size={13} className="text-text-muted" />
                        <span className="font-sans text-text-main font-semibold">{acc.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-[8px] uppercase font-mono font-black px-2 py-0.5 rounded-md border ${
                          acc.type === AccountType.ASSET
                            ? "bg-brand-emerald/10 border-brand-emerald/20 text-brand-emerald"
                            : acc.type === AccountType.LIABILITY
                            ? "bg-brand-red/10 border-brand-red/20 text-brand-red"
                            : acc.type === AccountType.EQUITY
                            ? "bg-brand-primary-light/20 border-brand-primary-light/35 text-text-main"
                            : acc.type === AccountType.REVENUE
                            ? "bg-brand-gold-light/40 border border-brand-gold/20 text-brand-gold"
                            : "bg-hover-bg border-border-subtle text-text-muted"
                        }`}
                      >
                        {acc.type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-text-main">
                      ${acc.balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <ChevronRight size={13} className="text-text-muted inline" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ledger Detail Drawer */}
        {selectedAccountId && selectedAccount && (
          <div className={`${isConsoleOpen ? "xl:col-span-6" : "lg:col-span-6"} bg-card-bg border border-border-subtle rounded-2xl p-6 shadow-xl relative overflow-hidden`} id="ledger-detail-panel">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-gold/3 rounded-full blur-xl pointer-events-none animate-pulse" />
            
            <div className="flex items-start justify-between border-b border-border-subtle/50 pb-4 mb-5" id="ledger-detail-header">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-brand-gold font-bold">{selectedAccount.code}</span>
                  <span className="text-[8px] uppercase font-mono font-black bg-app-bg border border-border-subtle px-2 py-0.5 rounded-md text-text-main">
                    {selectedAccount.type}
                  </span>
                </div>
                <h2 className="font-sans text-base font-black text-text-main mt-1.5 tracking-tight">{selectedAccount.name}</h2>
                <p className="text-xs text-text-muted font-sans mt-1">{selectedAccount.description}</p>
              </div>
              <button
                onClick={() => setSelectedAccountId(null)}
                className="text-[10px] text-text-muted hover:text-text-main font-mono border border-border-subtle hover:bg-app-bg px-3 py-1.5 rounded-xl transition"
                id="btn-close-ledger"
              >
                Close GL
              </button>
            </div>

            {/* General Ledger Card */}
            <div className="space-y-5" id="ledger-card-body">
              <div className="flex justify-between items-center bg-app-bg/50 p-4 rounded-xl border border-border-subtle/50 font-mono text-xs" id="ledger-card-summary">
                <span className="text-text-muted font-bold">LEDGER NET BOOK POSITION:</span>
                <span className="font-black text-sm text-brand-gold">
                  ${selectedAccount.balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="space-y-3" id="ledger-entries-list">
                <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-text-muted block">Transaction Ledger Ledger Postings</span>
                
                <div className="space-y-3.5 max-h-[440px] overflow-y-auto pr-1 custom-scroll" id="ledger-entries-container">
                  {ledgerLines.length === 0 ? (
                    <div className="text-center py-12 bg-app-bg/30 rounded-xl border border-dashed border-border-subtle text-xs text-text-muted font-sans" id="no-ledger-entries">
                      <BookOpen size={24} className="mx-auto text-text-muted opacity-40 mb-3" />
                      <span>No debit or credit postings registered for current accounting period.</span>
                    </div>
                  ) : (
                    ledgerLines.map((line, idx) => (
                      <div
                        key={`${line.jeId}-${idx}`}
                        className="border border-border-subtle/60 rounded-xl p-3.5 bg-app-bg/25 hover:bg-hover-bg/30 transition-all duration-200 flex items-center justify-between gap-3 text-xs"
                        id={`ledger-line-${line.jeId}-${idx}`}
                      >
                        <div className="space-y-1.5">
                          <span className="font-mono text-[9px] text-text-muted font-bold">{line.date}</span>
                          <p className="font-sans font-bold text-text-main">{line.description}</p>
                          <p className="font-mono text-[9px] text-text-muted">Journal Ref ID: {line.jeId}</p>
                        </div>
                        <div className="text-right font-mono space-y-1 text-xs">
                          {line.debit > 0 && <span className="text-brand-emerald font-black">Debited: +${line.debit.toLocaleString()}</span>}
                          {line.credit > 0 && <span className="text-brand-red font-black">Credited: -${line.credit.toLocaleString()}</span>}
                          <span className="text-text-muted block text-[10px]">Position: ${line.runningBalance.toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
