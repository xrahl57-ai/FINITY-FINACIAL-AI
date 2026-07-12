/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Package, Plus, DollarSign, TrendingUp, Sparkles, FolderKanban, Check, AlertTriangle } from "lucide-react";
import { FinityState, Product } from "../types";

interface InventoryOperationsProps {
  state: FinityState;
  onStateUpdate: (newState: FinityState) => void;
}

export default function InventoryOperations({ state, onStateUpdate }: InventoryOperationsProps) {
  const [activeTab, setActiveTab] = useState<"inventory" | "projects">("inventory");

  // New product form states
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [pName, setPName] = useState("");
  const [pSku, setPSku] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pStock, setPStock] = useState("0");
  const [pSafety, setPSafety] = useState("5");
  const [pPrice, setPPrice] = useState("0");
  const [pCost, setPCost] = useState("0");
  const [pCategory, setPCategory] = useState("SaaS Licensing");

  const products = state.products;
  const projects = state.projects;

  const handleCreateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName.trim() || !pSku.trim()) return alert("Name and SKU are required");

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: pName,
          sku: pSku,
          description: pDesc,
          stockLevel: pStock,
          safetyStock: pSafety,
          unitPrice: pPrice,
          costPrice: pCost,
          category: pCategory,
        }),
      });
      const data = await res.json();
      onStateUpdate(data.state);
      setIsCreatingProduct(false);
      setPName("");
      setPSku("");
      setPDesc("");
    } catch (err: any) {
      alert("Product creation failed: " + err.message);
    }
  };

  return (
    <div className="space-y-6" id="inventory-module-container">
      {/* Tab Selectors */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e4e4eb] pb-5" id="ops-header-row">
        <div>
          <h1 className="font-sans text-2xl font-bold text-gray-900 tracking-tight" id="ops-title">Operations & Products</h1>
          <p className="text-xs text-gray-500 font-mono mt-1">Item SKU Warehouses & Client Project Budgeting Cost controls</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg border border-gray-200 text-xs font-mono" id="ops-subtoggles">
          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === "inventory" ? "bg-white text-gray-900 shadow-xs font-bold" : "text-gray-500 hover:text-gray-900"
            }`}
            id="btn-subtab-inventory"
          >
            Product SKU Inventory
          </button>
          <button
            onClick={() => setActiveTab("projects")}
            className={`px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === "projects" ? "bg-white text-gray-900 shadow-xs font-bold" : "text-gray-500 hover:text-gray-900"
            }`}
            id="btn-subtab-projects"
          >
            Operational Client Projects
          </button>
        </div>
      </div>

      {activeTab === "inventory" ? (
        <div className="space-y-6" id="inventory-pane">
          {/* Action Row */}
          <div className="flex justify-between items-center" id="inventory-actions">
            <h2 className="text-sm uppercase font-mono tracking-wider font-bold text-gray-400 font-sans">Active Product SKUs</h2>
            <button
              onClick={() => setIsCreatingProduct(true)}
              className="bg-[#1a1a24] text-white hover:bg-[#2d2d3d] rounded-xl px-4 py-2 text-xs font-bold font-sans flex items-center gap-1.5 transition active:scale-98"
              id="btn-trigger-product-creation"
            >
              <Plus size={14} />
              <span>Register New Product SKU</span>
            </button>
          </div>

          {/* Form Modal: Create Product */}
          {isCreatingProduct && (
            <form onSubmit={handleCreateProductSubmit} className="bg-white border border-[#e4e4eb] rounded-xl p-5 space-y-4" id="create-product-form">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3" id="create-product-header">
                <span className="font-mono text-xs text-gray-400">REGISTER NEW INVENTORY SKU STOCK ITEM</span>
                <button
                  type="button"
                  onClick={() => setIsCreatingProduct(false)}
                  className="text-gray-400 hover:text-gray-800 text-xs font-mono"
                  id="btn-cancel-create-product"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="create-product-row-1">
                <div>
                  <label className="block text-xs font-mono text-gray-500 mb-1.5">SKU NAME</label>
                  <input
                    type="text"
                    required
                    placeholder="Premium software support package..."
                    value={pName}
                    onChange={(e) => setPName(e.target.value)}
                    className="w-full bg-[#f4f4f6] border border-[#e4e4eb] rounded-xl p-2.5 text-sm outline-hidden focus:border-gray-900 focus:bg-white transition text-gray-800"
                    id="input-product-name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-gray-500 mb-1.5">SKU UNIQUE CODE</label>
                  <input
                    type="text"
                    required
                    placeholder="FIN-SaaS-PREM..."
                    value={pSku}
                    onChange={(e) => setPSku(e.target.value)}
                    className="w-full bg-[#f4f4f6] border border-[#e4e4eb] rounded-xl p-2.5 text-sm outline-hidden focus:border-gray-900 focus:bg-white transition text-gray-800 font-mono"
                    id="input-product-sku"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-gray-500 mb-1.5">PRODUCT CATEGORY</label>
                  <select
                    value={pCategory}
                    onChange={(e) => setPCategory(e.target.value)}
                    className="w-full bg-[#f4f4f6] border border-[#e4e4eb] rounded-xl p-2.5 text-sm outline-hidden focus:border-gray-900 focus:bg-white transition text-gray-800 font-sans"
                    id="select-product-category"
                  >
                    <option value="SaaS Licensing">Enterprise Software SaaS Licensing</option>
                    <option value="Consulting Services">Fintech Hourly Consulting Services</option>
                    <option value="Hardware POS Terminal">Hardware POS Terminals</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="create-product-row-2">
                <div>
                  <label className="block text-xs font-mono text-gray-500 mb-1.5">STOCK COUNT (QTY)</label>
                  <input
                    type="number"
                    min="0"
                    value={pStock}
                    onChange={(e) => setPStock(e.target.value)}
                    className="w-full bg-[#f4f4f6] border border-[#e4e4eb] rounded-xl p-2.5 text-sm outline-hidden focus:border-gray-900 focus:bg-white transition text-gray-800 font-mono"
                    id="input-product-stock"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-gray-500 mb-1.5">SAFETY MIN STOCK</label>
                  <input
                    type="number"
                    min="0"
                    value={pSafety}
                    onChange={(e) => setPSafety(e.target.value)}
                    className="w-full bg-[#f4f4f6] border border-[#e4e4eb] rounded-xl p-2.5 text-sm outline-hidden focus:border-gray-900 focus:bg-white transition text-gray-800 font-mono"
                    id="input-product-safety"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-gray-500 mb-1.5">RETAIL PRICE ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={pPrice}
                    onChange={(e) => setPPrice(e.target.value)}
                    className="w-full bg-[#f4f4f6] border border-[#e4e4eb] rounded-xl p-2.5 text-sm outline-hidden focus:border-gray-900 focus:bg-white transition text-gray-800 font-mono"
                    id="input-product-price"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-gray-500 mb-1.5">COGS / COST PRICE ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={pCost}
                    onChange={(e) => setPCost(e.target.value)}
                    className="w-full bg-[#f4f4f6] border border-[#e4e4eb] rounded-xl p-2.5 text-sm outline-hidden focus:border-gray-900 focus:bg-white transition text-gray-800 font-mono"
                    id="input-product-cost"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-500 mb-1.5">PRODUCT SKU DESCRIPTION</label>
                <input
                  type="text"
                  placeholder="Comprehensive description of the service levels or shipping details..."
                  value={pDesc}
                  onChange={(e) => setPDesc(e.target.value)}
                  className="w-full bg-[#f4f4f6] border border-[#e4e4eb] rounded-xl p-2.5 text-sm outline-hidden focus:border-gray-900 focus:bg-white transition text-gray-800"
                  id="input-product-desc"
                />
              </div>

              <div className="flex justify-end pt-3 border-t border-gray-100" id="create-product-submit-row">
                <button
                  type="submit"
                  className="bg-[#1a1a24] text-white hover:bg-[#2d2d3d] rounded-xl px-5 py-2.5 text-xs font-bold transition flex items-center gap-1.5"
                  id="btn-submit-post-product"
                >
                  Post Product SKU
                </button>
              </div>
            </form>
          )}

          {/* SKU Directory Listing */}
          <div className="bg-white border border-[#e4e4eb] rounded-xl overflow-hidden" id="sku-directory-container">
            <table className="w-full text-left border-collapse" id="tbl-products">
              <thead>
                <tr className="bg-[#fafafa] border-b border-[#e4e4eb] font-mono text-[10px] text-gray-400">
                  <th className="px-4 py-2.5">SKU Code</th>
                  <th className="px-4 py-2.5">Product Name</th>
                  <th className="px-4 py-2.5">Stock Level</th>
                  <th className="px-4 py-2.5">Category Type</th>
                  <th className="px-4 py-2.5 text-right">Cost COGS</th>
                  <th className="px-4 py-2.5 text-right">Retail Unit Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono text-xs text-gray-700" id="tbl-body-products">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50" id={`product-row-${p.id}`}>
                    <td className="px-4 py-3 font-bold text-gray-500">{p.sku}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Package size={14} className="text-gray-400 shrink-0" />
                        <div>
                          <p className="font-sans font-medium text-gray-900">{p.name}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{p.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {p.stockLevel === 0 ? (
                        <span className="text-gray-400">N/A (Unlimited / Virtual)</span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-gray-900">{p.stockLevel} units</span>
                          {p.stockLevel <= p.safetyStock && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-red-600 bg-red-50 px-1 py-0.5 rounded">
                              <AlertTriangle size={10} />
                              <span>Low Stock</span>
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{p.category}</td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      ${p.costPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      ${p.unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-6" id="projects-pane">
          <div className="flex justify-between items-center" id="projects-pane-header">
            <h2 className="text-sm uppercase font-mono tracking-wider font-bold text-gray-400 font-sans">Active Enterprise Projects</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="projects-grid">
            {projects.map((proj) => {
              const complianceRate = proj.budget > 0 ? (proj.cost / proj.budget) * 100 : 0;
              return (
                <div key={proj.id} className="bg-white border border-[#e4e4eb] rounded-xl p-5 space-y-4" id={`project-card-${proj.id}`}>
                  <div className="flex justify-between items-start" id="project-header-row">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-mono uppercase font-bold">
                        <FolderKanban size={13} />
                        <span>Project Tracker</span>
                      </div>
                      <h3 className="font-sans font-bold text-gray-900 text-sm mt-1">{proj.name}</h3>
                      <p className="text-xs text-gray-500 font-sans">{proj.description}</p>
                    </div>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#eafaf1] text-[#107c41] uppercase">
                      {proj.status}
                    </span>
                  </div>

                  {/* Progress Meter */}
                  <div className="space-y-1.5" id="project-progress">
                    <div className="flex justify-between text-xs font-mono text-gray-600">
                      <span>Ledger Cost Accrued</span>
                      <span className="font-bold">
                        ${proj.cost.toLocaleString()} / ${proj.budget.toLocaleString()} Budget
                      </span>
                    </div>
                    <div className="w-full bg-[#f4f4f6] h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${complianceRate > 100 ? "bg-red-600" : "bg-indigo-600"}`}
                        style={{ width: `${Math.min(complianceRate, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400 font-mono mt-0.5">
                      <span>{complianceRate.toFixed(1)}% consumed</span>
                      <span>Safe Budget Margin</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
