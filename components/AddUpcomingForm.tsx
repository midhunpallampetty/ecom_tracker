"use client";

import { useState } from "react";
import LoadingSpinner from "./LoadingSpinner";

interface AddUpcomingFormProps {
  onSuccess: () => void;
}

export default function AddUpcomingForm({ onSuccess }: AddUpcomingFormProps) {
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [description, setDescription] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Min date: today
  const todayStr = new Date().toISOString().split("T")[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setError("Enter a valid amount greater than 0.");
      return;
    }
    if (!expectedDate) {
      setError("Please pick an expected date.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/upcoming", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parsed, type, description, expectedDate }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Something went wrong.");
        return;
      }
      setAmount("");
      setDescription("");
      setExpectedDate("");
      setType("expense");
      onSuccess();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isIncome = type === "income";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border dark:border-slate-800 p-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-lg">
          📅
        </div>
        <div>
          <h3 className="font-bold text-base text-violet-600 dark:text-violet-400">
            Upcoming Payment
          </h3>
          <p className="text-slate-400 dark:text-slate-500 text-xs">
            Schedule a future income or expense
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type toggle */}
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">
            Type
          </label>
          <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
            {(["expense", "income"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  type === t
                    ? t === "income"
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "bg-rose-500 text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {t === "income" ? "↑ Income" : "↓ Expense"}
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
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
              onChange={(e) => {
                const v = e.target.value;
                if (v === "" || /^\d*\.?\d{0,2}$/.test(v)) {
                  setAmount(v);
                  setError("");
                }
              }}
              placeholder="0.00"
              className={`w-full pl-9 pr-4 py-3.5 rounded-2xl border-2 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 font-semibold text-lg transition-colors focus:outline-none ${
                error && !expectedDate
                  ? "border-red-400"
                  : isIncome
                  ? "border-transparent focus:border-emerald-400"
                  : "border-transparent focus:border-rose-400"
              }`}
            />
          </div>
        </div>

        {/* Expected Date */}
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">
            Expected Date
          </label>
          <input
            type="date"
            value={expectedDate}
            min={todayStr}
            onChange={(e) => { setExpectedDate(e.target.value); setError(""); }}
            className={`w-full px-4 py-3.5 rounded-2xl border-2 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm transition-colors focus:outline-none ${
              error && !expectedDate
                ? "border-red-400"
                : "border-transparent focus:border-violet-400"
            } dark:[color-scheme:dark]`}
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">
            Description (optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={isIncome ? "e.g. Freelance payment" : "e.g. Rent, EMI, Bill"}
            maxLength={200}
            className="w-full px-4 py-3 rounded-2xl border-2 border-transparent bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 text-sm transition-colors focus:outline-none focus:border-slate-300 dark:focus:border-slate-600"
          />
        </div>

        {error && (
          <p className="text-red-500 text-xs ml-1">⚠ {error}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !amount || !expectedDate}
          className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-gradient-to-r from-violet-500 to-indigo-500 shadow-lg shadow-violet-200 dark:shadow-violet-900/30"
        >
          {loading ? (
            <LoadingSpinner size="sm" color="white" />
          ) : (
            <>
              <span>📅</span>
              <span>
                Schedule Payment
                {amount && ` — ₹${parseFloat(amount) || ""}`}
              </span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
