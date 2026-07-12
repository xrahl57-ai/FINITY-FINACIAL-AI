/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Plus, User, FileText, Send, DollarSign, Mail, Sparkles, Check, CheckCircle2, ChevronRight, Briefcase, AlertCircle, Trash2 } from "lucide-react";
import { FinityState, Partner, Invoice } from "../types";
import KRATaxComplianceHub from "./KRATaxComplianceHub";

interface InvoicingProps {
  state: FinityState;
  onStateUpdate: (newState: FinityState) => void;
}

export default function Invoicing({ state, onStateUpdate }: InvoicingProps) {
  const [activeSubTab, setActiveSubTab] = useState<"invoices" | "contacts" | "kra-tax">("invoices");

  // Notification status
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; message: string } | null>(null);

  // Invoice creation form states
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [taxRate, setTaxRate] = useState("0");
  const [invoiceLines, setInvoiceLines] = useState<{ description: string; quantity: number; unitPrice: number }[]>([
    { description: "", quantity: 1, unitPrice: 0 },
  ]);

  // Partner creation form states
  const [isCreatingPartner, setIsCreatingPartner] = useState(false);
  const [partnerName, setPartnerName] = useState("");
  const [partnerType, setPartnerType] = useState<"customer" | "supplier">("customer");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [partnerPhone, setPartnerPhone] = useState("");
  const [partnerAddress, setPartnerAddress] = useState("");

  // Invoice payment form states
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");

  const customers = state.partners.filter((p) => p.type === "customer");
  const suppliers = state.partners.filter((p) => p.type === "supplier");

  const showFeedback = (type: "error" | "success", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 6000);
  };

  // Handle invoice creation line changes
  const handleLineChange = (index: number, field: string, value: any) => {
    const updated = [...invoiceLines];
    updated[index] = { ...updated[index], [field]: value };
    setInvoiceLines(updated);
  };

  const handleAddLine = () => {
    setInvoiceLines([...invoiceLines, { description: "", quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveLine = (index: number) => {
    if (invoiceLines.length === 1) return;
    setInvoiceLines(invoiceLines.filter((_, i) => i !== index));
  };

  // Submit invoice to API
  const handleCreateInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      showFeedback("error", "Please select a customer.");
      return;
    }

    const validLines = invoiceLines.filter((l) => l.description.trim() && l.quantity > 0);
    if (validLines.length === 0) {
      showFeedback("error", "Please add at least one line item.");
      return;
    }

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          items: validLines,
          dueDate,
          taxRate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invoicing action failed.");
      onStateUpdate(data.state);
      setIsCreatingInvoice(false);
      setSelectedCustomerId("");
      setInvoiceLines([{ description: "", quantity: 1, unitPrice: 0 }]);
      showFeedback("success", "Premium Invoice generated & recorded successfully.");
    } catch (err: any) {
      showFeedback("error", "Invoicing failed: " + err.message);
    }
  };

  // Submit contact partner to API
  const handleCreatePartnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerName.trim()) {
      showFeedback("error", "Contact name is required.");
      return;
    }

    try {
      const res = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: partnerName,
          type: partnerType,
          email: partnerEmail,
          phone: partnerPhone,
          address: partnerAddress,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add partner.");
      onStateUpdate(data.state);
      setIsCreatingPartner(false);
      setPartnerName("");
      setPartnerEmail("");
      setPartnerPhone("");
      setPartnerAddress("");
      showFeedback("success", "New partner registry logged in the CRM database.");
    } catch (err: any) {
      showFeedback("error", "Partner CRM error: " + err.message);
    }
  };

  // Register Invoice Payment
  const handlePayInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoiceId) return;

    try {
      const res = await fetch(`/api/invoices/${payingInvoiceId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(paymentAmount),
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process ledger payment.");
      onStateUpdate(data.state);
      setPayingInvoiceId(null);
      setPaymentAmount("");
      showFeedback("success", "Invoice payment registered & double-entry assets reconciled.");
    } catch (err: any) {
      showFeedback("error", "Reconciliation error: " + err.message);
    }
  };

  return (
    <div className="space-y-8" id="invoicing-module-container">
      {/* Header Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-6" id="invoicing-header-row">
        <div>
          <h1 className="font-sans text-2xl font-black text-text-main tracking-tight" id="invoicing-title">
            Billing & Accounts Receivable
          </h1>
          <p className="text-xs text-text-muted font-mono mt-1">Automated invoice proposals, client pipelines, & crm registries</p>
        </div>
        
        <div className="flex items-center gap-1 bg-app-bg p-1 rounded-xl border border-border-subtle text-xs font-mono" id="subtab-toggles">
          <button
            onClick={() => {
              setActiveSubTab("invoices");
              setFeedback(null);
            }}
            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
              activeSubTab === "invoices" 
                ? "bg-card-bg text-text-main shadow-md border border-border-subtle/50" 
                : "text-text-muted hover:text-text-main"
            }`}
            id="tab-toggle-invoices"
          >
            Customer Invoices
          </button>
          <button
            onClick={() => {
              setActiveSubTab("contacts");
              setFeedback(null);
            }}
            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
              activeSubTab === "contacts" 
                ? "bg-card-bg text-text-main shadow-md border border-border-subtle/50" 
                : "text-text-muted hover:text-text-main"
            }`}
            id="tab-toggle-contacts"
          >
            Accounts CRM / Partners
          </button>
          <button
            onClick={() => {
              setActiveSubTab("kra-tax");
              setFeedback(null);
            }}
            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-1.5 ${
              activeSubTab === "kra-tax" 
                ? "bg-card-bg text-text-main shadow-md border border-border-subtle/50" 
                : "text-text-muted hover:text-text-main"
            }`}
            id="tab-toggle-kra-tax"
          >
            <span>🇰🇪</span>
            <span>KRA iTax obligations</span>
          </button>
        </div>
      </div>

      {/* Persistent Feedback Box */}
      {feedback && (
        <div 
          className={`p-4 rounded-xl text-xs font-sans flex items-center gap-3 border ${
            feedback.type === "success" 
              ? "bg-brand-emerald/10 border-brand-emerald/25 text-brand-emerald" 
              : "bg-brand-red/10 border-brand-red/25 text-brand-red"
          }`} 
          id="invoicing-feedback-box"
        >
          {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {activeSubTab === "invoices" && (
        <div className="space-y-6" id="invoices-subtab-body">
          {/* Action Row */}
          <div className="flex justify-between items-center" id="invoice-actions-row">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-gold" />
              <h2 className="text-xs uppercase font-mono tracking-widest font-bold text-text-muted">Invoicing Register Ledger</h2>
            </div>
            
            {!isCreatingInvoice && (
              <button
                onClick={() => setIsCreatingInvoice(true)}
                className="bg-brand-gold text-brand-primary hover:bg-brand-gold-dark rounded-xl px-4 py-2.5 text-xs font-bold font-sans flex items-center gap-2 transition-all duration-300 shadow-lg shadow-brand-gold/10"
                id="btn-create-invoice-trigger"
              >
                <Plus size={15} />
                <span>Issue Premium Invoice</span>
              </button>
            )}
          </div>

          {/* Form Box: Create Invoice */}
          {isCreatingInvoice && (
            <form onSubmit={handleCreateInvoiceSubmit} className="bg-card-bg border border-brand-gold/25 rounded-2xl p-6 space-y-6 shadow-2xl relative" id="create-invoice-form">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/2 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center justify-between border-b border-border-subtle/50 pb-4" id="create-invoice-form-header">
                <div className="flex items-center gap-2 text-xs text-text-main font-mono">
                  <Sparkles size={14} className="text-brand-gold animate-pulse" />
                  <span className="font-bold">INVOICE SPECIFICATION FORM DECK</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreatingInvoice(false)}
                  className="text-text-muted hover:text-text-main text-xs font-mono border border-border-subtle/60 px-3 py-1 rounded-lg hover:bg-app-bg transition"
                  id="btn-cancel-create-invoice"
                >
                  Close Form
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5" id="create-invoice-inputs">
                <div>
                  <label className="block text-[10px] font-mono font-bold tracking-wider text-text-muted mb-2 uppercase">BILL-TO CUSTOMER CONTACT</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    required
                    className="w-full bg-app-bg border border-border-subtle rounded-xl p-3 text-sm focus:border-brand-gold/50 outline-none transition text-text-main"
                    id="select-invoice-customer"
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold tracking-wider text-text-muted mb-2 uppercase">INVOICE DUE DATE</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    className="w-full bg-app-bg border border-border-subtle rounded-xl p-3 text-sm focus:border-brand-gold/50 outline-none transition text-text-main font-mono"
                    id="input-invoice-due-date"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold tracking-wider text-text-muted mb-2 uppercase">SALES TAX COMPLIANCE RATE</label>
                  <select
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className="w-full bg-app-bg border border-border-subtle rounded-xl p-3 text-sm focus:border-brand-gold/50 outline-none transition text-text-main font-mono"
                    id="select-invoice-tax-rate"
                  >
                    <option value="0">0% (Tax Exempt / KRA Zero-Rated)</option>
                    <option value="0.16">16% KRA Standard VAT</option>
                    <option value="0.08">8% KRA Reduced rate (Fuel & Oils)</option>
                    <option value="0.05">5% State Corporate Tax (US)</option>
                    <option value="0.10">10% Standard Goods Tax</option>
                    <option value="0.20">20% European Union VAT</option>
                  </select>
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-4" id="invoice-line-items-section">
                <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-text-muted block border-b border-border-subtle/30 pb-2">Itemized Services & Goods</span>
                
                <div className="space-y-3">
                  {invoiceLines.map((line, idx) => (
                    <div key={idx} className="flex flex-col md:flex-row gap-4 items-end bg-app-bg/30 p-3 rounded-xl border border-border-subtle/50" id={`invoice-line-${idx}`}>
                      <div className="flex-1 w-full">
                        <label className="block text-[9px] font-mono font-bold text-text-muted uppercase mb-1.5">Description / Line Item Details</label>
                        <input
                          type="text"
                          placeholder="Strategic Enterprise integration consulting hours..."
                          value={line.description}
                          onChange={(e) => handleLineChange(idx, "description", e.target.value)}
                          required
                          className="w-full bg-app-bg border border-border-subtle rounded-lg p-2.5 text-xs focus:border-brand-gold/40 outline-none transition text-text-main"
                          id={`input-line-desc-${idx}`}
                        />
                      </div>
                      <div className="w-24">
                        <label className="block text-[9px] font-mono font-bold text-text-muted uppercase mb-1.5">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={(e) => handleLineChange(idx, "quantity", Number(e.target.value))}
                          required
                          className="w-full bg-app-bg border border-border-subtle rounded-lg p-2.5 text-xs focus:border-brand-gold/40 outline-none transition text-text-main font-mono"
                          id={`input-line-qty-${idx}`}
                        />
                      </div>
                      <div className="w-32">
                        <label className="block text-[9px] font-mono font-bold text-text-muted uppercase mb-1.5">Unit Price ($)</label>
                        <input
                          type="number"
                          min="0"
                          value={line.unitPrice}
                          onChange={(e) => handleLineChange(idx, "unitPrice", Number(e.target.value))}
                          required
                          className="w-full bg-app-bg border border-border-subtle rounded-lg p-2.5 text-xs focus:border-brand-gold/40 outline-none transition text-text-main font-mono"
                          id={`input-line-price-${idx}`}
                        />
                      </div>
                      {invoiceLines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className="p-3.5 bg-brand-red/10 text-brand-red hover:bg-brand-red/20 rounded-lg transition"
                          title="Remove item"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-3">
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="text-xs font-bold text-brand-gold hover:text-brand-gold/80 flex items-center gap-1"
                    id="btn-add-line-item"
                  >
                    <Plus size={14} />
                    <span>Append Ledger Row</span>
                  </button>

                  <button
                    type="submit"
                    className="bg-brand-gold text-brand-primary hover:bg-brand-gold-dark px-5 py-3 rounded-xl text-xs font-bold font-sans transition shadow-lg shadow-brand-gold/10"
                    id="btn-submit-invoice"
                  >
                    Broadcast & Record Journal
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Table / Invoices List */}
          <div className="bg-card-bg border border-border-subtle rounded-2xl shadow-xl overflow-hidden" id="invoices-table-container">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[750px]" id="tbl-invoices">
                <thead>
                  <tr className="bg-sidebar-bg/50 border-b border-border-subtle font-mono text-[9px] text-text-muted uppercase tracking-wider">
                    <th className="px-5 py-4 font-bold">Invoice Ref</th>
                    <th className="px-5 py-4 font-bold">Customer Client</th>
                    <th className="px-5 py-4 font-bold">Posting Date</th>
                    <th className="px-5 py-4 font-bold">Due Date</th>
                    <th className="px-5 py-4 font-bold">Tax Rate</th>
                    <th className="px-5 py-4 font-bold">Status Badge</th>
                    <th className="px-5 py-4 text-right font-bold">Balance Due</th>
                    <th className="px-5 py-4 text-center font-bold">Post Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/40 font-mono text-xs text-text-main" id="tbl-body-invoices">
                  {state.invoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-text-muted font-sans">
                        No invoices logged in current double-entry active session.
                      </td>
                    </tr>
                  ) : (
                    state.invoices.map((inv) => {
                      const customer = state.partners.find((p) => p.id === inv.customerId);
                      return (
                        <tr key={inv.id} className="hover:bg-hover-bg/30 transition-colors" id={`invoice-row-${inv.id}`}>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5">
                              <FileText size={14} className="text-brand-gold" />
                              <span className="font-bold text-text-main">{inv.id}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-sans font-bold text-text-main">{customer?.name || "Unlisted account"}</div>
                            <div className="text-[10px] text-text-muted mt-0.5">{customer?.email || "No email"}</div>
                          </td>
                          <td className="px-5 py-4 text-text-muted">{inv.date}</td>
                          <td className="px-5 py-4 text-text-muted">{inv.dueDate}</td>
                          <td className="px-5 py-4 text-text-muted">{(Number(inv.taxRate) * 100).toFixed(0)}%</td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                                inv.status === "paid"
                                  ? "bg-brand-emerald/10 border border-brand-emerald/20 text-brand-emerald"
                                  : inv.status === "overdue"
                                  ? "bg-brand-red/10 border border-brand-red/20 text-brand-red animate-pulse"
                                  : "bg-brand-amber/10 border border-brand-amber/20 text-brand-amber"
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                inv.status === "paid" ? "bg-brand-emerald" : inv.status === "overdue" ? "bg-brand-red" : "bg-brand-amber"
                              }`} />
                              {inv.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right font-bold text-text-main">
                            ${inv.balanceDue.toLocaleString()}
                          </td>
                          <td className="px-5 py-4 text-center">
                            {inv.status !== "paid" ? (
                              <button
                                onClick={() => {
                                  setPayingInvoiceId(inv.id);
                                  setPaymentAmount(inv.balanceDue.toString());
                                }}
                                className="bg-brand-gold-light text-brand-gold border border-brand-gold/20 hover:bg-brand-gold hover:text-brand-primary px-3 py-1.5 rounded-lg text-[10px] font-bold font-sans transition active:scale-95"
                                id={`btn-pay-trigger-${inv.id}`}
                              >
                                Reconcile Payment
                              </button>
                            ) : (
                              <span className="text-[10px] text-brand-emerald font-sans font-semibold inline-flex items-center gap-1">
                                <Check size={12} />
                                Reconciled
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "contacts" && (
        <div className="space-y-6" id="contacts-subtab-body">
          {/* Contacts Action Row */}
          <div className="flex justify-between items-center" id="contacts-actions-row">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-gold" />
              <h2 className="text-xs uppercase font-mono tracking-widest font-bold text-text-muted">Accounts Registry Index</h2>
            </div>
            {!isCreatingPartner && (
              <button
                onClick={() => setIsCreatingPartner(true)}
                className="bg-brand-gold text-brand-primary hover:bg-brand-gold-dark rounded-xl px-4 py-2.5 text-xs font-bold font-sans flex items-center gap-2 transition"
                id="btn-create-partner-trigger"
              >
                <Plus size={15} />
                <span>Log Corporate Contact</span>
              </button>
            )}
          </div>

          {/* Create Partner Form Modal */}
          {isCreatingPartner && (
            <form onSubmit={handleCreatePartnerSubmit} className="bg-card-bg border border-brand-gold/25 rounded-2xl p-6 space-y-5 shadow-2xl relative" id="create-partner-form">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/2 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center justify-between border-b border-border-subtle/50 pb-4" id="create-partner-form-header">
                <div className="flex items-center gap-2 text-xs text-text-main font-mono">
                  <Sparkles size={14} className="text-brand-gold animate-pulse" />
                  <span className="font-bold">CRM PARTNER DATABASE PROVISIONING</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreatingPartner(false)}
                  className="text-text-muted hover:text-text-main text-xs font-mono border border-border-subtle/60 px-3 py-1 rounded-lg hover:bg-app-bg transition"
                  id="btn-cancel-create-partner"
                >
                  Close Form
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="create-partner-inputs">
                <div>
                  <label className="block text-[10px] font-mono font-bold tracking-wider text-text-muted mb-2 uppercase">CONTACT FULL NAME</label>
                  <input
                    type="text"
                    placeholder="E.g., Stark Industries"
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    required
                    className="w-full bg-app-bg border border-border-subtle rounded-xl p-3 text-sm focus:border-brand-gold/50 outline-none transition text-text-main"
                    id="input-partner-name"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold tracking-wider text-text-muted mb-2 uppercase">PARTNER ENTITY TYPE</label>
                  <select
                    value={partnerType}
                    onChange={(e) => setPartnerType(e.target.value as "customer" | "supplier")}
                    className="w-full bg-app-bg border border-border-subtle rounded-xl p-3 text-sm focus:border-brand-gold/50 outline-none transition text-text-main font-mono"
                    id="select-partner-type"
                  >
                    <option value="customer">Customer Portfolio (AR)</option>
                    <option value="supplier">Supplier Portfolio (AP)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold tracking-wider text-text-muted mb-2 uppercase">EMAIL ADDRESS</label>
                  <input
                    type="email"
                    placeholder="billing@stark.com"
                    value={partnerEmail}
                    onChange={(e) => setPartnerEmail(e.target.value)}
                    className="w-full bg-app-bg border border-border-subtle rounded-xl p-3 text-sm focus:border-brand-gold/50 outline-none transition text-text-main font-mono"
                    id="input-partner-email"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold tracking-wider text-text-muted mb-2 uppercase">TELEPHONE NUMBER</label>
                  <input
                    type="text"
                    placeholder="+1 800-IRONMAN"
                    value={partnerPhone}
                    onChange={(e) => setPartnerPhone(e.target.value)}
                    className="w-full bg-app-bg border border-border-subtle rounded-xl p-3 text-sm focus:border-brand-gold/50 outline-none transition text-text-main font-mono"
                    id="input-partner-phone"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold tracking-wider text-text-muted mb-2 uppercase">REGISTERED PHYSICAL ADDRESS</label>
                <input
                  type="text"
                  placeholder="10880 Malibu Point, Malibu, CA 90265"
                  value={partnerAddress}
                  onChange={(e) => setPartnerAddress(e.target.value)}
                  className="w-full bg-app-bg border border-border-subtle rounded-xl p-3 text-sm focus:border-brand-gold/50 outline-none transition text-text-main"
                  id="input-partner-address"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="bg-brand-gold text-brand-primary hover:bg-brand-gold-dark px-5 py-3 rounded-xl text-xs font-bold font-sans transition"
                  id="btn-submit-partner"
                >
                  Authorize CRM Record
                </button>
              </div>
            </form>
          )}

          {/* Partners Table / Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="partners-grid-box">
            {state.partners.map((partner) => {
              const invoicesCount = state.invoices.filter((i) => i.customerId === partner.id).length;
              return (
                <div
                  key={partner.id}
                  className="bg-card-bg border border-border-subtle rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-brand-gold/30 transition-all duration-300"
                  id={`partner-card-${partner.id}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-app-bg border border-border-subtle flex items-center justify-center text-brand-gold group-hover:bg-brand-gold-light transition-colors">
                        <User size={18} />
                      </div>
                      <div>
                        <h4 className="font-sans font-bold text-text-main text-sm">{partner.name}</h4>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[8px] font-mono font-bold mt-1 uppercase ${
                            partner.type === "customer"
                              ? "bg-brand-emerald/10 border border-brand-emerald/20 text-brand-emerald"
                              : "bg-brand-amber/10 border border-brand-amber/20 text-brand-amber"
                          }`}
                        >
                          {partner.type}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-border-subtle/50 pt-3 text-[11px] font-mono text-text-muted">
                    <div className="flex justify-between">
                      <span>ID REF:</span>
                      <span className="text-text-main font-bold">{partner.id}</span>
                    </div>
                    {partner.email && (
                      <div className="flex justify-between">
                        <span>EMAIL:</span>
                        <span className="text-text-main truncate max-w-[160px]">{partner.email}</span>
                      </div>
                    )}
                    {partner.phone && (
                      <div className="flex justify-between">
                        <span>PHONE:</span>
                        <span className="text-text-main">{partner.phone}</span>
                      </div>
                    )}
                    {partner.type === "customer" && (
                      <div className="flex justify-between">
                        <span>LEDGER INVOICES:</span>
                        <span className="text-brand-gold font-bold">{invoicesCount}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeSubTab === "kra-tax" && (
        <KRATaxComplianceHub state={state} onStateUpdate={onStateUpdate} />
      )}

      {/* Invoice Pay Drawer Backdrop / Modal Overlay */}
      {payingInvoiceId && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade" id="invoice-payment-modal">
          <form onSubmit={handlePayInvoiceSubmit} className="bg-card-bg border border-brand-gold/30 rounded-2xl p-6 max-w-md w-full space-y-5 shadow-2xl relative" id="payment-form">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-gold/2 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex justify-between items-center border-b border-border-subtle/50 pb-3" id="payment-modal-header">
              <h3 className="font-sans font-black text-sm text-text-main tracking-tight flex items-center gap-2">
                <DollarSign size={16} className="text-brand-gold" />
                <span>REGISTER JOURNAL TRANSACTION</span>
              </h3>
              <button
                type="button"
                onClick={() => setPayingInvoiceId(null)}
                className="text-text-muted hover:text-text-main font-mono text-xs"
                id="btn-close-payment-modal"
              >
                Close
              </button>
            </div>

            <div className="space-y-4" id="payment-inputs">
              <div className="bg-app-bg p-3.5 rounded-xl border border-border-subtle/50 text-[11px] font-mono text-text-muted">
                <span>POSTING TO JOURNAL ENTRY:</span>
                <div className="text-text-main font-bold text-xs mt-1">{payingInvoiceId}</div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold tracking-wider text-text-muted mb-2 uppercase">RECONCILIATION AMOUNT ($)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  required
                  className="w-full bg-app-bg border border-border-subtle rounded-xl p-3 text-sm focus:border-brand-gold/50 outline-none transition text-text-main font-mono font-bold"
                  id="input-payment-amount"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold tracking-wider text-text-muted mb-2 uppercase">POSTING TRANSACTION METHOD</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-app-bg border border-border-subtle rounded-xl p-3 text-sm focus:border-brand-gold/50 outline-none transition text-text-main font-mono"
                  id="select-payment-method"
                >
                  <option value="Bank Transfer">Bank Clearing Transfer</option>
                  <option value="Credit Card">Merchant Settlement Gateway</option>
                  <option value="Cash">Petty Cash Deposit</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 gap-3" id="payment-modal-actions">
              <button
                type="button"
                onClick={() => setPayingInvoiceId(null)}
                className="w-1/2 bg-app-bg border border-border-subtle hover:bg-hover-bg text-text-main font-sans font-bold text-xs py-3 rounded-xl transition"
                id="btn-cancel-pay"
              >
                Cancel Entry
              </button>
              <button
                type="submit"
                className="w-1/2 bg-brand-gold text-brand-primary hover:bg-brand-gold-dark font-sans font-bold text-xs py-3 rounded-xl transition shadow-lg shadow-brand-gold/10"
                id="btn-submit-pay"
              >
                Reconcile Ledger
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
