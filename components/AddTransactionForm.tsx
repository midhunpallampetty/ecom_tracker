"use client";

import { useState } from "react";
import QuickAmountButtons from "./QuickAmountButtons";
import LoadingSpinner from "./LoadingSpinner";

interface AddTransactionFormProps {
  type: "income" | "expense";
  onSuccess: () => void;
}

export default function AddTransactionForm({
  type,
  onSuccess,
}: AddTransactionFormProps) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isIncome = type === "income";
  const accentColor = isIncome ? "emerald" : "rose";

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
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parsedAmount, type, description }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Something went wrong");
        return;
      }

      setAmount("");
      setDescription("");
      onSuccess();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-3xl shadow-sm border dark:border-slate-800 p-5`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
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
            {isIncome ? "Add Money In" : "Add Money Out"}
          </h3>
          <p className="text-slate-400 dark:text-slate-500 text-xs">
            {isIncome ? "Record income received" : "Record expense paid"}
          </p>
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
                  : `border-transparent focus:border-${accentColor}-400`
              }`}
            />
          </div>
          {error && (
            <p className="text-red-500 text-xs mt-1.5 ml-1">{error}</p>
          )}
        </div>

        {/* Description input */}
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">
            Description (optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={isIncome ? "e.g. Salary, Freelance" : "e.g. Groceries, Rent"}
            maxLength={200}
            className="w-full px-4 py-3 rounded-2xl border-2 border-transparent bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 text-sm transition-colors focus:outline-none focus:border-slate-300 dark:focus:border-slate-600"
          />
        </div>

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
