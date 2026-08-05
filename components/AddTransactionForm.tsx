"use client";

import { useState } from "react";
import QuickAmountButtons from "./QuickAmountButtons";
import LoadingSpinner from "./LoadingSpinner";

interface AddTransactionFormProps {
  type: "income" | "expense";
  onSuccess: () => void;
}

const ECOM_CHANNELS = [
  "Shopify",
  "Amazon",
  "Etsy",
  "WooCommerce",
  "Meta Ads",
  "Google Ads",
  "Direct / Offline",
  "Other",
];

export default function AddTransactionForm({
  type,
  onSuccess,
}: AddTransactionFormProps) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [channel, setChannel] = useState("");
  const [sku, setSku] = useState("");
  const [cogs, setCogs] = useState("");
  const [platformFee, setPlatformFee] = useState("");
  const [adSpend, setAdSpend] = useState("");
  const [showEcom, setShowEcom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isIncome = type === "income";

  const handleQuickSelect = (val: number) => {
    setAmount(String(val));
    setError("");
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "" || /^\d*\.?\d{0,2}$/.test(val)) {
      setAmount(val);
      setError("");
    }
  };

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
        type,
        description,
      };

      if (channel) payload.channel = channel;
      if (sku) payload.sku = sku;
      if (cogs && !isNaN(parseFloat(cogs))) payload.cogs = parseFloat(cogs);
      if (platformFee && !isNaN(parseFloat(platformFee)))
        payload.platformFee = parseFloat(platformFee);
      if (adSpend && !isNaN(parseFloat(adSpend)))
        payload.adSpend = parseFloat(adSpend);

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Something went wrong");
        return;
      }

      setAmount("");
      setDescription("");
      setChannel("");
      setSku("");
      setCogs("");
      setPlatformFee("");
      setAdSpend("");
      setShowEcom(false);
      onSuccess();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border dark:border-slate-800 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-lg ${
              isIncome
                ? "bg-gradient-to-br from-emerald-400 to-emerald-600"
                : "bg-gradient-to-br from-rose-400 to-rose-600"
            }`}
          >
            {isIncome ? "+" : "−"}
          </div>
          <div>
            <h3
              className={`font-bold text-base ${
                isIncome
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {isIncome ? "Add Sales / Income" : "Add Expense"}
            </h3>
            <p className="text-slate-400 dark:text-slate-500 text-xs">
              {isIncome ? "Record eCommerce sale or revenue" : "Record business expense"}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Quick amount buttons */}
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">
            Quick Select
          </label>
          <QuickAmountButtons
            onSelect={handleQuickSelect}
            selectedAmount={amount}
            type={type}
          />
        </div>

        {/* Custom amount input */}
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">
            Amount (₹)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-lg">
              ₹
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={handleAmountChange}
              placeholder="Enter amount"
              className={`w-full pl-9 pr-4 py-3.5 rounded-2xl border-2 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 font-semibold text-lg transition-colors focus:outline-none ${
                error
                  ? "border-red-400 focus:border-red-500"
                  : isIncome
                  ? "border-transparent focus:border-emerald-400"
                  : "border-transparent focus:border-rose-400"
              }`}
            />
          </div>
          {error && <p className="text-red-500 text-xs mt-1.5 ml-1">{error}</p>}
        </div>

        {/* Description input */}
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">
            Description / Item Name
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={isIncome ? "e.g. Wireless Headphones Order #104" : "e.g. Meta Ads Invoice #99"}
            maxLength={200}
            className="w-full px-4 py-3 rounded-2xl border-2 border-transparent bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 text-sm transition-colors focus:outline-none focus:border-slate-300 dark:focus:border-slate-600"
          />
        </div>

        {/* Toggle eCommerce Fields */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowEcom(!showEcom)}
            className="flex items-center gap-2 text-xs font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 bg-violet-50 dark:bg-violet-950/40 px-3 py-2 rounded-xl transition-all w-full justify-between border border-violet-200 dark:border-violet-900/50"
          >
            <span className="flex items-center gap-1.5">
              <span>🛒</span>
              <span>{showEcom ? "Hide eCommerce Details" : "+ Add eCommerce Breakdown (Channel, COGS, Fees)"}</span>
            </span>
            <span>{showEcom ? "▲" : "▼"}</span>
          </button>
        </div>

        {/* eCommerce Details Fields */}
        {showEcom && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3 animate-in fade-in duration-200">
            {/* Channel Select */}
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 block">
                Sales / Ad Channel
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-medium focus:outline-none"
              >
                <option value="">-- Select Channel --</option>
                {ECOM_CHANNELS.map((ch) => (
                  <option key={ch} value={ch}>
                    {ch}
                  </option>
                ))}
              </select>
            </div>

            {/* SKU / Product ID */}
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 block">
                Product SKU / Code
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. SKU-HEADPHONE-BLK"
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs focus:outline-none"
              />
            </div>

            {/* Grid for COGS, Fees, Ad Spend */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 block truncate">
                  COGS (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={cogs}
                  onChange={(e) => setCogs(e.target.value)}
                  placeholder="Cost price"
                  className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 block truncate">
                  Platform Fee (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={platformFee}
                  onChange={(e) => setPlatformFee(e.target.value)}
                  placeholder="Stripe/Fee"
                  className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 block truncate">
                  Ad Cost (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={adSpend}
                  onChange={(e) => setAdSpend(e.target.value)}
                  placeholder="Meta/Google"
                  className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading || !amount}
          className={`w-full py-4 rounded-2xl font-bold text-white text-base transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
            isIncome
              ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/40 hover:shadow-emerald-300 dark:hover:shadow-emerald-800/50"
              : "bg-gradient-to-r from-rose-500 to-pink-500 shadow-lg shadow-rose-200 dark:shadow-rose-900/40 hover:shadow-rose-300 dark:hover:shadow-rose-800/50"
          }`}
        >
          {loading ? (
            <LoadingSpinner size="sm" color="white" />
          ) : (
            <>
              <span>{isIncome ? "+" : "−"}</span>
              <span>
                {isIncome ? "Add Income" : "Add Expense"}
                {amount && ` — ₹${parseFloat(amount) || ""}`}
              </span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
