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
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const today = new Date();
  const diff = Math.ceil((d.getTime() - today.setHours(0, 0, 0, 0)) / 86400000);
  const label =
    diff === 0 ? "Today" :
    diff === 1 ? "Tomorrow" :
    diff < 0   ? `${Math.abs(diff)}d overdue` :
    diff <= 7  ? `In ${diff} days` :
    d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const urgency = diff < 0 ? "overdue" : diff === 0 ? "today" : diff <= 3 ? "soon" : "normal";
  return { label, urgency };
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
        <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-3xl">📅</div>
        <p className="text-slate-400 font-medium text-sm">No upcoming payments</p>
        <p className="text-slate-600 text-xs">Add one using the form below</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {items.map((item) => {
        const { label, urgency } = formatDate(item.expectedDate);
        const isIncome = item.type === "income";
        return (
          <div
            key={item._id}
            className={`
              relative flex items-center gap-3 p-3.5 rounded-2xl border transition-all duration-200
              ${urgency === "overdue"
                ? "bg-rose-500/5 border-rose-500/20"
                : urgency === "today"
                ? "bg-amber-500/5 border-amber-500/20"
                : urgency === "soon"
                ? "bg-violet-500/5 border-violet-500/20"
                : "bg-slate-800/50 border-slate-700/50"
              }
            `}
          >
            {/* Icon */}
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-base font-bold ${
                isIncome
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-rose-500/15 text-rose-400"
              }`}
            >
              {isIncome ? "↑" : "↓"}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">
                {item.description || (isIncome ? "Income" : "Expense")}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    urgency === "overdue"
                      ? "bg-rose-500/20 text-rose-300"
                      : urgency === "today"
                      ? "bg-amber-500/20 text-amber-300"
                      : urgency === "soon"
                      ? "bg-violet-500/20 text-violet-300"
                      : "bg-slate-700 text-slate-400"
                  }`}
                >
                  {label}
                </span>
              </div>
            </div>

            {/* Amount */}
            <div className="text-right shrink-0">
              <p
                className={`font-bold text-sm ${
                  isIncome ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {isIncome ? "+" : "−"}{formatCurrency(item.amount)}
              </p>
            </div>

            {/* Delete */}
            <button
              onClick={() => handleDelete(item._id)}
              disabled={deletingId === item._id}
              className="ml-1 w-7 h-7 rounded-lg bg-slate-700/50 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 flex items-center justify-center transition-all duration-200 shrink-0"
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
