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
      <div className="glass-rose backdrop-blur-xl border-b border-rose-500/50 text-white px-4 py-2.5 flex items-center justify-between gap-3 shadow-[0_4px_30px_rgba(244,63,94,0.35)] glow-rose">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-lg shrink-0 animate-bounce">🚫</span>
          <div className="min-w-0">
            <p className="text-xs font-bold leading-tight flex items-center gap-2 text-rose-300 glow-text-rose">
              <span>Net Spend Limit Exceeded!</span>
              {overBy > 0 && (
                <span className="pill-rose text-[10px] font-bold">
                  ₹{overBy.toLocaleString("en-IN")} over
                </span>
              )}
            </p>
            <p className="text-[10px] text-slate-300 truncate">
              Net spend ₹{netSpend.toLocaleString("en-IN")} (₹{totalExpense.toLocaleString("en-IN")} − ₹{totalIncome.toLocaleString("en-IN")}) hit limit ₹{expenseLimit.toLocaleString("en-IN")}.
              {" "}Earn ₹{overBy.toLocaleString("en-IN")} to unlock.
            </p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss warning"
          className="shrink-0 w-7 h-7 rounded-lg glass-rose hover:bg-rose-500/30 flex items-center justify-center text-rose-300 text-xs transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
