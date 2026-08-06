"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import LoadingSpinner from "./LoadingSpinner";

interface Transaction {
  _id: string;
  amount: number;
  type: "income" | "expense";
  description: string;
  channel?: string;
  sku?: string;
  cogs?: number;
  platformFee?: number;
  adSpend?: number;
  gstRate?: number;
  gstAmount?: number;
  orderId?: string;
  currency?: string;
  currencyRate?: number;
  isRecurring?: boolean;
  recurringPeriod?: string;
  createdAt: string;
}

interface EditTransactionModalProps {
  transaction: Transaction;
  onClose: () => void;
  onUpdate: (updated: Transaction) => void;
}

const ECOM_CHANNELS = [
  "Meesho",
  "Flipkart",
  "Amazon",
  "Own Site / Website",
  "Shopify",
  "WooCommerce",
  "Etsy",
  "Meta Ads",
  "Google Ads",
  "Direct / Offline",
  "Other",
];

const CURRENCIES = [
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
];

export default function EditTransactionModal({
  transaction,
  onClose,
  onUpdate,
}: EditTransactionModalProps) {
  const isIncome = transaction.type === "income";

  const [amount, setAmount] = useState(String(transaction.amount));
  const [description, setDescription] = useState(transaction.description || "");
  const [channel, setChannel] = useState(transaction.channel || "");
  const [sku, setSku] = useState(transaction.sku || "");
  const [cogs, setCogs] = useState(transaction.cogs ? String(transaction.cogs) : "");
  const [platformFee, setPlatformFee] = useState(transaction.platformFee ? String(transaction.platformFee) : "");
  const [adSpend, setAdSpend] = useState(transaction.adSpend ? String(transaction.adSpend) : "");
  const [orderId, setOrderId] = useState(transaction.orderId || "");
  const [currency, setCurrency] = useState(transaction.currency || "INR");
  const [currencyRate, setCurrencyRate] = useState(transaction.currencyRate ? String(transaction.currencyRate) : "1");
  const [isRecurring, setIsRecurring] = useState(transaction.isRecurring || false);
  const [recurringPeriod, setRecurringPeriod] = useState(transaction.recurringPeriod || "monthly");
  const [showEcom, setShowEcom] = useState(
    !!(transaction.channel || transaction.sku || transaction.cogs || transaction.platformFee || transaction.adSpend || transaction.orderId)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        amount: parsedAmount,
        description,
        channel,
        sku,
        orderId,
        currency,
        currencyRate: parseFloat(currencyRate) || 1,
        cogs: parseFloat(cogs) || 0,
        platformFee: parseFloat(platformFee) || 0,
        adSpend: parseFloat(adSpend) || 0,
        isRecurring,
        recurringPeriod: isRecurring ? recurringPeriod : "",
      };

      const res = await fetch(`/api/transactions/${transaction._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Something went wrong");
        return;
      }

      onUpdate(data.data as Transaction);
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const accentColor = isIncome ? "emerald" : "rose";
  const accentGradient = isIncome
    ? "from-emerald-500 to-teal-500"
    : "from-rose-500 to-pink-500";

  if (!mounted) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 dark:border-slate-800 animate-in slide-in-from-bottom duration-300 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${accentGradient} flex items-center justify-center text-white font-bold text-lg`}>
              ✏️
            </div>
            <div>
              <h3 className={`font-bold text-base text-${accentColor}-600 dark:text-${accentColor}-400`}>
                Edit {isIncome ? "Income" : "Expense"}
              </h3>
              <p className="text-slate-400 text-xs">Update transaction details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Scrollable form body */}
        <div className="overflow-y-auto flex-1 p-5">
          <form id="edit-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Amount */}
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">
                Amount
              </label>
              <div className="flex gap-2">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="px-3 py-3 rounded-2xl border-2 border-transparent bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:border-slate-300 dark:focus:border-slate-600"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.code}</option>
                  ))}
                </select>
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-lg">
                    {CURRENCIES.find(c => c.code === currency)?.symbol || "₹"}
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => { setAmount(e.target.value); setError(""); }}
                    className={`w-full pl-9 pr-4 py-3 rounded-2xl border-2 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-semibold text-lg transition-colors focus:outline-none ${
                      error ? "border-red-400" : isIncome ? "border-transparent focus:border-emerald-400" : "border-transparent focus:border-rose-400"
                    }`}
                  />
                </div>
              </div>
              {currency !== "INR" && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-slate-500">1 {currency} =</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={currencyRate}
                    onChange={(e) => setCurrencyRate(e.target.value)}
                    placeholder="Rate in INR"
                    className="w-28 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs focus:outline-none"
                  />
                  <span className="text-xs text-slate-500">INR</span>
                  <span className="text-xs text-violet-500 font-semibold">
                    ≈ ₹{(parseFloat(amount || "0") * (parseFloat(currencyRate) || 1)).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              {error && <p className="text-red-500 text-xs mt-1.5 ml-1">{error}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">
                Description / Item Name
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={200}
                className="w-full px-4 py-3 rounded-2xl border-2 border-transparent bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:border-slate-300 dark:focus:border-slate-600"
              />
            </div>

            {/* Recurring toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-900/50">
              <div className="flex items-center gap-2">
                <span className="text-base">🔁</span>
                <div>
                  <p className="text-xs font-bold text-violet-700 dark:text-violet-300">Recurring Transaction</p>
                  <p className="text-[10px] text-violet-500">Mark if this repeats regularly</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isRecurring && (
                  <select
                    value={recurringPeriod}
                    onChange={(e) => setRecurringPeriod(e.target.value)}
                    className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-violet-200 dark:border-violet-700 text-xs text-violet-700 dark:text-violet-300 focus:outline-none"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                )}
                <button
                  type="button"
                  onClick={() => setIsRecurring(!isRecurring)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${isRecurring ? "bg-violet-500" : "bg-slate-300 dark:bg-slate-600"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${isRecurring ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
            </div>

            {/* eCommerce details toggle */}
            <div>
              <button
                type="button"
                onClick={() => setShowEcom(!showEcom)}
                className="flex items-center gap-2 text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 px-3 py-2 rounded-xl w-full justify-between border border-violet-200 dark:border-violet-900/50 transition-all"
              >
                <span className="flex items-center gap-1.5"><span>🛒</span><span>{showEcom ? "Hide eCommerce Details" : "+ eCommerce Details"}</span></span>
                <span>{showEcom ? "▲" : "▼"}</span>
              </button>
            </div>

            {showEcom && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3 animate-in fade-in duration-200">
                {/* Order ID */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 block">Order ID / Invoice #</label>
                  <input
                    type="text"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder="e.g. ORD-2024-1045"
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs focus:outline-none font-mono"
                  />
                </div>
                {/* Channel */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 block">Sales / Ad Channel</label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs focus:outline-none"
                  >
                    <option value="">-- Select Channel --</option>
                    {ECOM_CHANNELS.map((ch) => <option key={ch} value={ch}>{ch}</option>)}
                  </select>
                </div>
                {/* SKU */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 block">Product SKU</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. SKU-HEADPHONE-BLK"
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs focus:outline-none"
                  />
                </div>
                {/* COGS / Fee / Ad */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "COGS (₹)", val: cogs, set: setCogs, ph: "Cost" },
                    { label: "Platform Fee (₹)", val: platformFee, set: setPlatformFee, ph: "Fee" },
                    { label: "Ad Spend (₹)", val: adSpend, set: setAdSpend, ph: "Ads" },
                  ].map(({ label, val, set, ph }) => (
                    <div key={label}>
                      <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 block truncate">{label}</label>
                      <input
                        type="number" min="0" step="any"
                        value={val}
                        onChange={(e) => set(e.target.value)}
                        placeholder={ph}
                        className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            form="edit-form"
            type="submit"
            disabled={loading}
            className={`flex-1 py-3 rounded-2xl bg-gradient-to-r ${accentGradient} text-white font-bold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2`}
          >
            {loading ? <LoadingSpinner size="sm" color="white" /> : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
