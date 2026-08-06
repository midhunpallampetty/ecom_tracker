"use client";

import { useState, useEffect, useCallback } from "react";
import LoadingSpinner from "./LoadingSpinner";

interface BudgetData {
  month: string;
  incomeTarget: number;
  expenseLimit: number;
}

interface BudgetPanelProps {
  totalIncome: number;
  totalExpense: number;
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: "emerald" | "rose" }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const barColor =
    pct >= 100 ? "bg-rose-500" :
    pct >= 80  ? "bg-amber-400" :
    color === "emerald" ? "bg-emerald-500" : "bg-rose-500";

  return (
    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function BudgetPanel({ totalIncome, totalExpense }: BudgetPanelProps) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [budget, setBudget] = useState<BudgetData>({ month: currentMonth, incomeTarget: 0, expenseLimit: 0 });
  const [editing, setEditing] = useState(false);
  const [incomeInput, setIncomeInput] = useState("");
  const [expenseInput, setExpenseInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showNetView, setShowNetView] = useState(false);

  const fetchBudget = useCallback(async () => {
    try {
      const res = await fetch(`/api/budget?month=${currentMonth}`);
      const data = await res.json();
      if (data.success) {
        setBudget(data.data);
        setIncomeInput(data.data.incomeTarget ? String(data.data.incomeTarget) : "");
        setExpenseInput(data.data.expenseLimit ? String(data.data.expenseLimit) : "");
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [currentMonth]);

  useEffect(() => { fetchBudget(); }, [fetchBudget]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: currentMonth,
          incomeTarget: parseFloat(incomeInput) || 0,
          expenseLimit: parseFloat(expenseInput) || 0,
        }),
      });
      const data = await res.json();
      if (data.success) { setBudget(data.data); setEditing(false); }
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  const monthLabel = new Date(currentMonth + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  // ── Original expense tracking (unchanged) ──
  const incomeLeft  = budget.incomeTarget > 0 ? budget.incomeTarget - totalIncome   : 0;
  const expenseLeft = budget.expenseLimit > 0 ? budget.expenseLimit - totalExpense  : 0;

  // ── Net Spend view: Expenses − Income vs same expenseLimit ──
  // Examples (limit = 5000):
  //   Spent 2800, Income 700  → Net = 2100 → can spend 2900 more
  //   Spent 6000, Income 1000 → Net = 5000 → at limit, ₹0 headroom
  //   Spent 6000, Income 1100 → Net = 4900 → can spend ₹100 more
  const netSpend  = Math.max(0, totalExpense - totalIncome);
  const netLeft   = Math.max(0, budget.expenseLimit - netSpend);
  const netOverBy = Math.max(0, netSpend - budget.expenseLimit);
  const netIsOver = budget.expenseLimit > 0 && netSpend >= budget.expenseLimit;

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 flex items-center justify-center h-28">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">🎯</span>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Budget · {monthLabel}</p>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className="text-[10px] font-bold text-violet-500 hover:text-violet-600 bg-violet-50 dark:bg-violet-950/50 px-2.5 py-1 rounded-lg border border-violet-200 dark:border-violet-800 transition-colors"
        >
          {editing ? "Cancel" : "Set Targets"}
        </button>
      </div>

      {editing ? (
        /* ── Edit form (unchanged) ── */
        <div className="space-y-2 animate-in fade-in duration-200">
          <div>
            <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-1">Income Target (₹)</label>
            <input type="number" min="0" step="any" value={incomeInput} onChange={(e) => setIncomeInput(e.target.value)} placeholder="e.g. 100000"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs focus:outline-none" />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-1">Expense Limit (₹)</label>
            <input type="number" min="0" step="any" value={expenseInput} onChange={(e) => setExpenseInput(e.target.value)} placeholder="e.g. 30000"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs focus:outline-none" />
          </div>
          <button onClick={handleSave} disabled={saving}
            className="w-full py-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white text-xs font-bold disabled:opacity-60 flex items-center justify-center gap-1.5">
            {saving ? <LoadingSpinner size="sm" color="white" /> : "Save Budget Targets"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* ── Income progress (unchanged) ── */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Income</span>
              {budget.incomeTarget > 0
                ? <span className={`font-bold ${incomeLeft >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                    ₹{Math.abs(incomeLeft).toLocaleString("en-IN")} {incomeLeft >= 0 ? "remaining" : "over target"}
                  </span>
                : <span className="text-slate-400">No target set</span>}
            </div>
            <ProgressBar value={totalIncome} max={budget.incomeTarget || totalIncome || 1} color="emerald" />
            {budget.incomeTarget > 0 && (
              <div className="flex justify-between text-[9px] text-slate-400">
                <span>₹{totalIncome.toLocaleString("en-IN")} earned</span>
                <span>₹{budget.incomeTarget.toLocaleString("en-IN")} target</span>
              </div>
            )}
          </div>

          {/* ── Expenses progress (original, unchanged) ── */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Expenses</span>
              {budget.expenseLimit > 0
                ? <span className={`font-bold ${expenseLeft >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                    ₹{Math.abs(expenseLeft).toLocaleString("en-IN")} {expenseLeft >= 0 ? "left" : "over limit!"}
                  </span>
                : <span className="text-slate-400">No limit set</span>}
            </div>
            <ProgressBar value={totalExpense} max={budget.expenseLimit || totalExpense || 1} color="rose" />
            {budget.expenseLimit > 0 && (
              <div className="flex justify-between text-[9px] text-slate-400">
                <span>₹{totalExpense.toLocaleString("en-IN")} spent</span>
                <span>₹{budget.expenseLimit.toLocaleString("en-IN")} limit</span>
              </div>
            )}
          </div>

          {/* ── Net Spend View — collapsible toggle ── */}
          {budget.expenseLimit > 0 && (
            <div className="border-t border-slate-100 dark:border-slate-800 pt-2.5">
              <button
                onClick={() => setShowNetView(!showNetView)}
                className="flex items-center justify-between w-full text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <span>💡</span>
                  <span>Net Spend View <span className="font-normal text-slate-400">(spend − income)</span></span>
                </span>
                <span>{showNetView ? "▲" : "▼"}</span>
              </button>

              {showNetView && (
                <div className="mt-2.5 space-y-2 animate-in fade-in duration-200">
                  {/* Explanation */}
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-relaxed">
                    Income offsets your spending. Limit of ₹{budget.expenseLimit.toLocaleString("en-IN")} applies to
                    {" "}<strong className="text-slate-500 dark:text-slate-400">Expenses − Income</strong>.
                  </p>

                  {/* Net progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-semibold text-slate-600 dark:text-slate-400">Net Spend</span>
                      <span className={`font-bold ${netIsOver ? "text-rose-500" : "text-emerald-500"}`}>
                        {netIsOver
                          ? `₹${netOverBy.toLocaleString("en-IN")} over`
                          : `₹${netLeft.toLocaleString("en-IN")} headroom`}
                      </span>
                    </div>
                    <ProgressBar value={netSpend} max={budget.expenseLimit} color="rose" />
                    <div className="text-[9px] text-slate-400 dark:text-slate-500">
                      ₹{totalExpense.toLocaleString("en-IN")} − ₹{totalIncome.toLocaleString("en-IN")} ={" "}
                      <span className="font-semibold text-slate-500 dark:text-slate-300">
                        ₹{netSpend.toLocaleString("en-IN")} net
                      </span>
                      {" "}/ ₹{budget.expenseLimit.toLocaleString("en-IN")} limit
                    </div>
                  </div>

                  {/* Over-limit banner */}
                  {netIsOver && (
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60">
                      <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400">🚫 Net limit reached</p>
                      <p className="text-[9px] text-rose-500 mt-0.5">
                        Earn ₹{netOverBy.toLocaleString("en-IN")} more income to unlock spending again.
                      </p>
                    </div>
                  )}

                  {/* Healthy */}
                  {!netIsOver && netLeft > 0 && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40">
                      <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        ✅ ₹{netLeft.toLocaleString("en-IN")} net headroom remaining
                      </p>
                      <p className="text-[9px] text-emerald-500 mt-0.5">
                        You can spend ₹{netLeft.toLocaleString("en-IN")} more before hitting the net limit.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {budget.incomeTarget === 0 && budget.expenseLimit === 0 && (
            <p className="text-center text-[10px] text-slate-400 py-1">Click &quot;Set Targets&quot; to track your goals</p>
          )}
        </div>
      )}
    </div>
  );
}
