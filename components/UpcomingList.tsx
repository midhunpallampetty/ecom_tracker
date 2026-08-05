"use client";

import { useState } from "react";

interface Upcoming {
  _id: string;
  amount: number;
  type: "income" | "expense";
  description: string;
  expectedDate: string;
}

interface UpcomingListProps {
  items: Upcoming[];
  onDelete: (id: string) => void;
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

const getDateInfo = (dateStr: string) => {
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((d.getTime() - today.getTime()) / 86400000);

  const label =
    diff === 0  ? "Today" :
    diff === 1  ? "Tomorrow" :
    diff < 0    ? `${Math.abs(diff)}d overdue` :
    diff <= 7   ? `In ${diff} days` :
    d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const urgency = diff < 0 ? "overdue" : diff === 0 ? "today" : diff <= 3 ? "soon" : "normal";
  return { label, urgency, diff };
};

export default function UpcomingList({ items, onDelete }: UpcomingListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/upcoming/${id}`, { method: "DELETE" });
      onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 gap-3">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-3xl">
          📅
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">No upcoming payments</p>
        <p className="text-slate-400 dark:text-slate-600 text-xs">Add one using the form below</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const { label, urgency } = getDateInfo(item.expectedDate);
        const isIncome = item.type === "income";

        /* ── urgency-based palette ── */
        const cardBg =
          urgency === "overdue" ? "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/25" :
          urgency === "today"   ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/25" :
          urgency === "soon"    ? "bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/25" :
                                  "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60";

        const pillBg =
          urgency === "overdue" ? "bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300" :
          urgency === "today"   ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300" :
          urgency === "soon"    ? "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300" :
                                  "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400";

        return (
          <div
            key={item._id}
            className={`flex items-center gap-3 p-4 rounded-2xl border transition-all duration-200 shadow-sm ${cardBg}`}
          >
            {/* Type icon */}
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-base font-bold ${
                isIncome
                  ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400"
              }`}
            >
              {isIncome ? "↑" : "↓"}
            </div>

            {/* Description + date */}
            <div className="flex-1 min-w-0">
              <p className="text-slate-800 dark:text-slate-100 text-sm font-semibold truncate">
                {item.description || (isIncome ? "Income" : "Expense")}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pillBg}`}>
                  {label}
                </span>
                <span className="text-slate-400 dark:text-slate-500 text-xs">
                  {isIncome ? "Expected income" : "Due payment"}
                </span>
              </div>
            </div>

            {/* Amount */}
            <div className="text-right shrink-0">
              <p
                className={`font-bold text-sm ${
                  isIncome
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {isIncome ? "+" : "−"}{formatCurrency(item.amount)}
              </p>
            </div>

            {/* Delete button */}
            <button
              onClick={() => handleDelete(item._id)}
              disabled={deletingId === item._id}
              className="ml-1 w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700/60 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 flex items-center justify-center transition-all duration-200 shrink-0"
            >
              {deletingId === item._id ? (
                <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
