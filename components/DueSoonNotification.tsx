"use client";

import { useState, useEffect } from "react";

interface UpcomingItem {
  _id: string;
  amount: number;
  type: "income" | "expense";
  description: string;
  expectedDate: string;
}

interface DueSoonNotificationProps {
  upcomingItems: UpcomingItem[];
}

export default function DueSoonNotification({ upcomingItems }: DueSoonNotificationProps) {
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueSoon = upcomingItems.filter((item) => {
    const d = new Date(item.expectedDate);
    const diff = Math.ceil((d.getTime() - today.getTime()) / 86400000);
    return diff >= 0 && diff <= 3;
  });

  const overdue = upcomingItems.filter((item) => {
    const d = new Date(item.expectedDate);
    const diff = Math.ceil((d.getTime() - today.getTime()) / 86400000);
    return diff < 0;
  });

  const total = dueSoon.length + overdue.length;

  useEffect(() => {
    if (total > 0 && !dismissed) {
      setVisible(true);
      const timer = setTimeout(() => setDismissed(true), 8000);
      return () => clearTimeout(timer);
    }
  }, [total, dismissed]);

  if (!visible || dismissed || total === 0) return null;

  const overdueAmount = overdue.filter(i => i.type === "expense").reduce((s, i) => s + i.amount, 0);

  return (
    <div className="animate-in slide-in-from-bottom duration-300 mx-5 mb-3 lg:mx-0 lg:mb-0">
      <div className={`flex items-start gap-3 px-4 py-3 rounded-2xl border shadow-lg ${
        overdue.length > 0
          ? "bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800/60"
          : "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/60"
      }`}>
        <span className="text-xl shrink-0">{overdue.length > 0 ? "🚨" : "⏰"}</span>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-bold ${overdue.length > 0 ? "text-rose-700 dark:text-rose-300" : "text-amber-700 dark:text-amber-300"}`}>
            {overdue.length > 0
              ? `${overdue.length} overdue payment${overdue.length > 1 ? "s" : ""} ${overdueAmount > 0 ? `— ₹${overdueAmount.toLocaleString("en-IN")} past due` : ""}`
              : `${dueSoon.length} payment${dueSoon.length > 1 ? "s" : ""} due in the next 3 days`}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            {[...overdue, ...dueSoon].slice(0, 2).map(i => i.description || i.type).join(", ")}
            {total > 2 ? ` +${total - 2} more` : ""}
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xs shrink-0 transition-colors"
          aria-label="Dismiss notification"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
