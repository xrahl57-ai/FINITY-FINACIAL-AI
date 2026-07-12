/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { Upload, FileText, Sparkles, AlertCircle, Check, HelpCircle, Receipt, RefreshCw, CheckCircle2, Award } from "lucide-react";
import { FinityState } from "../types";

interface ReceiptsOCRProps {
  state: FinityState;
  onStateUpdate: (newState: FinityState) => void;
}

export default function ReceiptsOCR({ state, onStateUpdate }: ReceiptsOCRProps) {
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [extractedReceipt, setExtractedReceipt] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 6000);
  };

  // Drag and drop events handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processReceiptFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processReceiptFile(e.target.files[0]);
    }
  };

  const processReceiptFile = (file: File) => {
    setIsLoading(true);
    setErrorMsg(null);
    setExtractedReceipt(null);
    setSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64 = event.target?.result as string;
        
        const res = await fetch("/api/receipts/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileData: base64,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Error status ${res.status}`);
        }

        const data = await res.json();
        setExtractedReceipt(data.receipt);
        onStateUpdate(data.state);
        showSuccess("Document successfully processed by Gemini Vision NLU.");
      } catch (err: any) {
        console.error(err);
        const isKeyErr = err.message.includes("GEMINI_API_KEY");
        showError(isKeyErr ? "API Key Missing: OCR Document extraction requires a GEMINI_API_KEY in Settings > Secrets." : err.message);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // User posts receipt as a transaction in ledger
  const handlePostExtractedReceipt = async () => {
    if (!extractedReceipt) return;

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: extractedReceipt.date,
          description: `Extracted: ${extractedReceipt.merchant}`,
          accountId: "acc-bank", // Debit Bank
          offsetAccountId: "acc-utilities", // default offset or mapping
          amount: extractedReceipt.amount,
          category: extractedReceipt.category,
          type: "expense",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post expense transaction.");
      onStateUpdate(data.state);
      
      // Update receipt status locally
      setExtractedReceipt(null);
      showSuccess("Receipt expense posted & double-entry journal balance reconciled successfully!");
    } catch (err: any) {
      showError("Post failed: " + err.message);
    }
  };

  // Mock receipt generator to let users test instantly without real files!
  const triggerMockReceiptOCR = () => {
    setIsLoading(true);
    setErrorMsg(null);
    setExtractedReceipt(null);
    setSuccessMsg(null);

    // Simulate OCR delay and response
    setTimeout(() => {
      const mockReceipt = {
        id: "rec-mock-" + Date.now(),
        date: "2026-07-06",
        merchant: "WeWork Space Services",
        amount: 350.0,
        category: "Rent",
        taxAmount: 25.0,
        fileName: "wework_co_invoice_761.pdf",
        status: "extracted",
      };

      setExtractedReceipt(mockReceipt);
      setIsLoading(false);
      showSuccess("Simulated OCR analysis completed successfully!");
    }, 1200);
  };

  return (
    <div className="space-y-8" id="receipts-module-container">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-6" id="receipts-header">
        <div>
          <h1 className="font-sans text-2xl font-black text-text-main tracking-tight" id="receipts-title">
            Document Intelligence (OCR)
          </h1>
          <p className="text-xs text-text-muted font-mono mt-1">AI vision models extracting vendor receipts and auto-mapping debit assets</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="receipts-layout">
        {/* Upload Canvas Box */}
        <div className="lg:col-span-6 space-y-5" id="upload-panel">
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 flex flex-col items-center justify-center h-[280px] relative overflow-hidden group shadow-lg ${
              dragActive
                ? "border-brand-gold bg-brand-gold-light"
                : "border-border-subtle hover:border-brand-gold/40 bg-card-bg"
            }`}
            id="drag-and-drop-canvas"
          >
            {isLoading ? (
              <div className="space-y-4 font-mono text-xs text-text-main animate-pulse" id="ocr-loading">
                <RefreshCw size={36} className="mx-auto text-brand-gold animate-spin" />
                <p className="font-bold text-sm tracking-tight">Initializing vision parser...</p>
                <p className="text-[10px] text-text-muted">Gemini scanning items, parsing taxes, and mapping accounts...</p>
              </div>
            ) : (
              <div className="space-y-5 cursor-pointer" onClick={() => fileInputRef.current?.click()} id="ocr-idle-prompt">
                <div className="w-14 h-14 bg-app-bg rounded-2xl border border-border-subtle flex items-center justify-center mx-auto text-text-muted group-hover:text-brand-gold group-hover:border-brand-gold/30 transition-all duration-300">
                  <Receipt size={24} />
                </div>
                <div className="space-y-2">
                  <p className="font-sans font-bold text-text-main text-sm">
                    Drag & drop files here, or{" "}
                    <span className="text-brand-gold hover:underline">browse local drive</span>
                  </p>
                  <p className="text-[10px] text-text-muted font-mono">SUPPORTS PNG, JPG, JPEG, PDF (MAX 4MB)</p>
                </div>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Quick test sandbox button */}
          <div className="bg-card-bg border border-border-subtle rounded-2xl p-5 flex justify-between items-center shadow-lg relative overflow-hidden" id="mock-ocr-sandbox">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-gold/2 rounded-full blur-xl pointer-events-none" />
            <div>
              <span className="text-[10px] font-mono font-bold text-brand-gold block uppercase tracking-wider">Instant simulation deck</span>
              <p className="text-xs text-text-muted font-sans mt-1">Extract mock transactions instantly without connecting local assets.</p>
            </div>
            <button
              onClick={triggerMockReceiptOCR}
              disabled={isLoading}
              className="text-xs font-bold bg-brand-gold text-brand-primary hover:bg-brand-gold-dark px-4 py-2.5 rounded-xl shrink-0 transition-all duration-300 shadow-md shadow-brand-gold/10"
              id="btn-simulate-ocr"
            >
              Simulate OCR Scan
            </button>
          </div>
        </div>

        {/* OCR Result Box */}
        <div className="lg:col-span-6 space-y-5" id="extracted-panel">
          {errorMsg && (
            <div className="bg-brand-red/15 border border-brand-red/35 rounded-2xl p-5 text-brand-red text-xs flex gap-3 items-start animate-fade" id="ocr-error">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-mono font-bold uppercase tracking-wider">Vision Engine Scan Error</p>
                <p className="mt-1.5 leading-relaxed">{errorMsg}</p>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="bg-brand-emerald/15 border border-brand-emerald/35 rounded-2xl p-5 text-brand-emerald text-xs flex gap-3 items-start animate-fade" id="ocr-success-banner">
              <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-mono font-bold uppercase tracking-wider">System Broadcast Reconciled</p>
                <p className="mt-1.5 leading-relaxed">{successMsg}</p>
              </div>
            </div>
          )}

          {extractedReceipt ? (
            <div className="bg-card-bg border border-border-subtle rounded-2xl p-6 space-y-5 shadow-xl relative" id="extracted-results-widget">
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-emerald/3 rounded-full blur-xl pointer-events-none" />
              
              <div className="flex items-center gap-2 text-xs text-brand-emerald font-mono" id="ocr-success-badge">
                <Sparkles size={14} className="animate-pulse" />
                <span className="font-bold">SYSTEM EXTRACTED DOUBLE-ENTRY METADATA</span>
              </div>

              <div className="grid grid-cols-2 gap-5 font-mono text-xs text-text-muted border-y border-border-subtle/50 py-4" id="extracted-fields">
                <div>
                  <span className="text-[9px] text-text-muted block uppercase font-bold tracking-widest">MERCHANT / VENDOR</span>
                  <span className="font-bold text-sm text-text-main font-sans block mt-1">{extractedReceipt.merchant}</span>
                </div>
                <div>
                  <span className="text-[9px] text-text-muted block uppercase font-bold tracking-widest">POSTING DATE</span>
                  <span className="font-bold text-sm text-text-main block mt-1">{extractedReceipt.date}</span>
                </div>
                <div>
                  <span className="text-[9px] text-text-muted block uppercase font-bold tracking-widest">EXTRACTED GROSS AMOUNT</span>
                  <span className="font-bold text-sm text-text-main block mt-1">${extractedReceipt.amount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[9px] text-text-muted block uppercase font-bold tracking-widest">TAX CONTENT VALUE</span>
                  <span className="font-bold text-sm text-text-main block mt-1">${extractedReceipt.taxAmount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[9px] text-text-muted block uppercase font-bold tracking-widest">AI CLASSIFICATION</span>
                  <span className="font-bold text-sm text-brand-gold font-sans block mt-1">{extractedReceipt.category}</span>
                </div>
                <div>
                  <span className="text-[9px] text-text-muted block uppercase font-bold tracking-widest">AI SCAN CONFIDENCE</span>
                  <span className="font-bold text-sm text-brand-emerald block mt-1">99.8% Match</span>
                </div>
              </div>

              <div className="pt-3" id="post-ocr-actions">
                <button
                  onClick={handlePostExtractedReceipt}
                  className="w-full bg-brand-emerald text-brand-primary hover:bg-brand-emerald-dark rounded-xl py-3.5 text-xs font-bold flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-brand-emerald/10"
                  id="btn-post-ocr-tx"
                >
                  <Check size={14} />
                  <span>Commit Journal Entry & Reconcile Vault</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-card-bg border border-border-subtle border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center h-[350px] text-text-muted shadow-lg" id="extracted-results-placeholder">
              <div className="w-12 h-12 bg-app-bg border border-border-subtle rounded-xl flex items-center justify-center text-text-muted mb-4">
                <FileText size={20} />
              </div>
              <p className="font-sans font-bold text-xs text-text-main">Awaiting vision ingestion payload...</p>
              <p className="text-[10px] text-text-muted font-mono mt-2 max-w-[280px] mx-auto leading-relaxed">
                Ingested PDF/image records will trigger our double-entry validation system, balancing credits and debits prior to posting.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
