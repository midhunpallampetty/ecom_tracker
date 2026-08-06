"use client";

import { useState, useEffect, useCallback } from "react";

interface NetSpendWarningBannerProps {
  totalIncome: number;
  totalExpense: number;
}

export default function NetSpendWarningBanner({ totalIncome, totalExpense }: NetSpendWarningBannerProps) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [expenseLimit, setExpenseLimit] = useState(0);
  const [dismissed, setDismissed]       = useState(false);

  const fetchBudget = useCallback(async () => {
    try {
      const res  = await fetch(`/api/budget?month=${currentMonth}`);
      const data = await res.json();
      if (data.success && data.data.expenseLimit > 0) {
        setExpenseLimit(data.data.expenseLimit);
      }
    } catch { /* silent */ }
  }, [currentMonth]);

  useEffect(() => { fetchBudget(); }, [fetchBudget]);

  // Re-show banner whenever numbers change (e.g. new transaction added)
  useEffect(() => { setDismissed(false); }, [totalIncome, totalExpense, expenseLimit]);

  if (expenseLimit === 0) return null;

  // Net Spend = Expenses − Income (income offsets spending headroom)
  const netSpend = Math.max(0, totalExpense - totalIncome);
  const overBy   = Math.max(0, netSpend - expenseLimit);
  const isOver   = netSpend >= expenseLimit;

  if (!isOver || dismissed) return null;

  return (
    <div className="sticky top-0 z-50 w-full animate-in slide-in-from-bottom duration-300">
      <div className="bg-rose-600 dark:bg-rose-700 text-white px-4 py-2.5 flex items-center justify-between gap-3 shadow-lg shadow-rose-900/30">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-lg shrink-0">🚫</span>
          <div className="min-w-0">
            <p className="text-xs font-bold leading-tight">
              Net spend limit reached!
              {overBy > 0 && (
                <span className="ml-1.5 bg-rose-500/60 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  ₹{overBy.toLocaleString("en-IN")} over
                </span>
              )}
            </p>
            <p className="text-[10px] text-rose-100 truncate">
              Net spend ₹{netSpend.toLocaleString("en-IN")} (₹{totalExpense.toLocaleString("en-IN")} − ₹{totalIncome.toLocaleString("en-IN")}) exceeded limit of ₹{expenseLimit.toLocaleString("en-IN")}.
              {" "}Earn ₹{overBy.toLocaleString("en-IN")} more to unlock spending.
            </p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss warning"
          className="shrink-0 w-7 h-7 rounded-lg bg-rose-500/50 hover:bg-rose-500/80 flex items-center justify-center text-white text-xs transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
