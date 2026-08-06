"use client";

import { useState } from "react";
import QuickAmountButtons from "./QuickAmountButtons";
import LoadingSpinner from "./LoadingSpinner";

interface AddTransactionFormProps {
  type: "income" | "expense";
  onSuccess: () => void;
}

const ECOM_CHANNELS = ["Shopify", "Amazon", "Etsy", "WooCommerce", "Meta Ads", "Google Ads", "Direct / Offline", "Other"];

const CURRENCIES = [
  { code: "INR", symbol: "₹" },
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "GBP", symbol: "£" },
  { code: "AED", symbol: "د.إ" },
  { code: "SGD", symbol: "S$" },
];

export default function AddTransactionForm({ type, onSuccess }: AddTransactionFormProps) {
  const [amount,      setAmount]      = useState("");
  const [description, setDescription] = useState("");
  const [channel,     setChannel]     = useState("");
  const [sku,         setSku]         = useState("");
  const [cogs,        setCogs]        = useState("");
  const [platformFee, setPlatformFee] = useState("");
  const [adSpend,     setAdSpend]     = useState("");
  const [orderId,     setOrderId]     = useState("");
  const [currency,    setCurrency]    = useState("INR");
  const [currencyRate, setCurrencyRate] = useState("1");
  const [isRecurring,  setIsRecurring]  = useState(false);
  const [recurringPeriod, setRecurringPeriod] = useState("monthly");
  const [showEcom,    setShowEcom]    = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  const isIncome = type === "income";
  const currSymbol = CURRENCIES.find(c => c.code === currency)?.symbol || "₹";

  const handleQuickSelect = (val: number) => { setAmount(String(val)); setError(""); };
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "" || /^\d*\.?\d{0,2}$/.test(val)) { setAmount(val); setError(""); }
  };

  const resetForm = () => {
    setAmount(""); setDescription(""); setChannel(""); setSku(""); setCogs("");
    setPlatformFee(""); setAdSpend(""); setOrderId(""); setCurrency("INR");
    setCurrencyRate("1"); setIsRecurring(false); setRecurringPeriod("monthly"); setShowEcom(false);
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
        currency,
        currencyRate: parseFloat(currencyRate) || 1,
        isRecurring,
        recurringPeriod: isRecurring ? recurringPeriod : "",
      };

      if (channel)     payload.channel     = channel;
      if (sku)         payload.sku         = sku;
      if (orderId)     payload.orderId     = orderId;
      if (cogs        && !isNaN(parseFloat(cogs)))        payload.cogs        = parseFloat(cogs);
      if (platformFee && !isNaN(parseFloat(platformFee))) payload.platformFee = parseFloat(platformFee);
      if (adSpend     && !isNaN(parseFloat(adSpend)))     payload.adSpend     = parseFloat(adSpend);

      const res  = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || "Something went wrong"); return; }

      resetForm();
      onSuccess();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-3xl p-5 border-violet-500/20 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-lg ${
            isIncome ? "glass-emerald text-emerald-400 glow-emerald" : "glass-rose text-rose-400 glow-rose"
          }`}>
            {isIncome ? "+" : "−"}
          </div>
          <div>
            <h3 className={`font-bold text-base ${isIncome ? "text-emerald-400 glow-text-emerald" : "text-rose-400 glow-text-rose"}`}>
              {isIncome ? "Add Sales / Income" : "Add Expense"}
            </h3>
            <p className="text-slate-400 text-xs">
              {isIncome ? "Record eCommerce sale or revenue" : "Record business expense"}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Quick amount */}
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">Quick Select</label>
          <QuickAmountButtons onSelect={handleQuickSelect} selectedAmount={amount} type={type} />
        </div>

        {/* Currency + Amount */}
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">Amount</label>
          <div className="flex gap-2">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="px-3 py-3.5 rounded-2xl border-2 border-transparent bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm focus:outline-none"
            >
              {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
            </select>
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-lg">{currSymbol}</span>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={handleAmountChange}
                placeholder="Enter amount"
                className={`w-full pl-9 pr-4 py-3.5 rounded-2xl border-2 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 font-semibold text-lg transition-colors focus:outline-none ${
                  error ? "border-red-400" : isIncome ? "border-transparent focus:border-emerald-400" : "border-transparent focus:border-rose-400"
                }`}
              />
            </div>
          </div>
          {currency !== "INR" && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-slate-500">1 {currency} =</span>
              <input
                type="number" min="0" step="any" value={currencyRate}
                onChange={(e) => setCurrencyRate(e.target.value)}
                placeholder="Rate in INR"
                className="w-28 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none"
              />
              <span className="text-xs text-slate-500">INR</span>
              {amount && (
                <span className="text-xs text-violet-500 font-semibold">
                  ≈ ₹{(parseFloat(amount || "0") * (parseFloat(currencyRate) || 1)).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </span>
              )}
            </div>
          )}
          {error && <p className="text-red-500 text-xs mt-1.5 ml-1">{error}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">Description / Item Name</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={isIncome ? "e.g. Wireless Headphones Order #104" : "e.g. Meta Ads Invoice #99"}
            maxLength={200}
            className="w-full px-4 py-3 rounded-2xl border-2 border-transparent bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 text-sm transition-colors focus:outline-none focus:border-slate-300 dark:focus:border-slate-600"
          />
        </div>

        {/* Recurring toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-900/50">
          <div className="flex items-center gap-2">
            <span className="text-base">🔁</span>
            <div>
              <p className="text-xs font-bold text-violet-700 dark:text-violet-300">Recurring</p>
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
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${isRecurring ? "bg-violet-500" : "bg-slate-300 dark:bg-slate-600"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${isRecurring ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>
        </div>

        {/* Toggle eCommerce fields */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowEcom(!showEcom)}
            className="flex items-center gap-2 text-xs font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 bg-violet-50 dark:bg-violet-950/40 px-3 py-2 rounded-xl transition-all w-full justify-between border border-violet-200 dark:border-violet-900/50"
          >
            <span className="flex items-center gap-1.5"><span>🛒</span><span>{showEcom ? "Hide eCommerce Details" : "+ Add eCommerce Breakdown"}</span></span>
            <span>{showEcom ? "▲" : "▼"}</span>
          </button>
        </div>

        {showEcom && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3 animate-in fade-in duration-200">
            {/* Order ID */}
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 block">Order ID / Invoice #</label>
              <input
                type="text" value={orderId} onChange={(e) => setOrderId(e.target.value)}
                placeholder="e.g. ORD-2024-1045"
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs focus:outline-none font-mono"
              />
            </div>
            {/* Channel */}
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 block">Sales / Ad Channel</label>
              <select value={channel} onChange={(e) => setChannel(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs focus:outline-none">
                <option value="">-- Select Channel --</option>
                {ECOM_CHANNELS.map((ch) => <option key={ch} value={ch}>{ch}</option>)}
              </select>
            </div>
            {/* SKU */}
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 block">Product SKU / Code</label>
              <input type="text" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="e.g. SKU-HEADPHONE-BLK"
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs focus:outline-none" />
            </div>
            {/* COGS / Fee / Ads */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "COGS (₹)", val: cogs, set: setCogs, ph: "Cost price" },
                { label: "Platform Fee (₹)", val: platformFee, set: setPlatformFee, ph: "Stripe/Fee" },
                { label: "Ad Cost (₹)", val: adSpend, set: setAdSpend, ph: "Meta/Google" },
              ].map(({ label, val, set, ph }) => (
                <div key={label}>
                  <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 block truncate">{label}</label>
                  <input type="number" min="0" step="any" value={val} onChange={(e) => set(e.target.value)} placeholder={ph}
                    className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs focus:outline-none" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !amount}
          className={`w-full py-4 rounded-2xl font-bold text-white text-base transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
            isIncome
              ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/40"
              : "bg-gradient-to-r from-rose-500 to-pink-500 shadow-lg shadow-rose-200 dark:shadow-rose-900/40"
          }`}
        >
          {loading ? <LoadingSpinner size="sm" color="white" /> : (
            <><span>{isIncome ? "+" : "−"}</span><span>{isIncome ? "Add Income" : "Add Expense"}{amount && ` — ${CURRENCIES.find(c => c.code === currency)?.symbol || "₹"}${parseFloat(amount) || ""}`}</span></>
          )}
        </button>
      </form>
    </div>
  );
}
