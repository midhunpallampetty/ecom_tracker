"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/utils/formatCurrency";
import { BalanceSummaryCardSkeleton } from "./SkeletonLoaders";

interface BalanceSummaryCardProps {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  upcomingCount?: number;
  upcomingIncomeTotal?: number;
  upcomingExpenseTotal?: number;
  totalCogs?: number;
  totalFees?: number;
  totalAdSpend?: number;
  loading?: boolean;
}

export default function BalanceSummaryCard({
  totalIncome,
  totalExpense,
  balance,
  upcomingCount = 0,
  upcomingIncomeTotal = 0,
  upcomingExpenseTotal = 0,
  totalCogs = 0,
  totalFees = 0,
  totalAdSpend = 0,
  loading = false,
}: BalanceSummaryCardProps) {
  const isProfit = balance >= 0;
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <BalanceSummaryCardSkeleton />;
  }

  const projectedIncome = totalIncome + upcomingIncomeTotal;
  const projectedExpense = totalExpense + upcomingExpenseTotal;
  const projectedNet = projectedIncome - projectedExpense;
  const isProjectedProfit = projectedNet >= 0;
  const totalDeductions = totalCogs + totalFees + totalAdSpend;
  const netEcomProfit = totalIncome - totalDeductions - totalExpense;
  const hasEcomData = totalDeductions > 0;

  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-6 transition-all duration-700 glass glow-${
        isProfit ? "emerald" : "rose"
      } ${
        animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
      style={{
        borderColor: isProfit ? "rgba(16, 232, 155, 0.3)" : "rgba(244, 63, 94, 0.3)",
      }}
    >
      {/* Ambient background glow effect */}
      <div
        className={`absolute -top-16 -right-16 w-44 h-44 rounded-full blur-3xl opacity-20 pointer-events-none ${
          isProfit ? "bg-emerald-400" : "bg-rose-500"
        }`}
      />
      <div
        className={`absolute -bottom-16 -left-16 w-44 h-44 rounded-full blur-3xl opacity-20 pointer-events-none ${
          isProfit ? "bg-cyan-400" : "bg-orange-500"
        }`}
      />

      {/* Top row: status badge + upcoming count pill */}
      <div className="flex items-center justify-between mb-4 gap-2 relative z-10">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase flex items-center gap-1.5 ${
              isProfit ? "pill-emerald" : "pill-rose"
            }`}
          >
            <span className="text-xs">{isProfit ? "▲" : "▼"}</span>
            <span>{isProfit ? "Net Profit" : "Net Deficit"}</span>
          </div>
        </div>

        {upcomingCount > 0 && (
          <div className="flex items-center gap-1.5 pill-violet text-xs font-bold px-3 py-1 rounded-full">
            <span>📅</span>
            <span>{upcomingCount} Pending</span>
          </div>
        )}
      </div>

      {/* Main Net Balance Display */}
      <div className="mb-5 relative z-10">
        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">
          Realized Net Profit
        </p>
        <h2
          className={`text-4xl font-extrabold tracking-tight ${
            isProfit ? "gradient-text-profit glow-text-emerald" : "gradient-text-loss glow-text-rose"
          }`}
        >
          {isProfit ? "+" : "−"} {formatCurrency(Math.abs(balance))}
        </h2>
      </div>

      {/* Projected Net Profit Card */}
      {(upcomingIncomeTotal > 0 || upcomingExpenseTotal > 0) && (
        <div className="mb-4 glass-cyan rounded-2xl p-3.5 border border-cyan-500/30 relative z-10">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-cyan-400 text-[10px] uppercase font-bold tracking-wider">
                Projected Net (Inc. Pending)
              </p>
              <p className="text-slate-300 text-[11px]">
                Sales + Pending In (₹{formatCurrency(projectedIncome)})
              </p>
            </div>
            <p className={`font-extrabold text-lg shrink-0 ${isProjectedProfit ? "text-cyan-400" : "text-rose-400"}`}>
              {isProjectedProfit ? "+" : "−"}{formatCurrency(Math.abs(projectedNet))}
            </p>
          </div>
        </div>
      )}

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-2 gap-2.5 mb-3 relative z-10">
        <div className="glass-emerald rounded-2xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-emerald-400 text-xs">↑</span>
            <span className="text-slate-300 text-xs font-medium">Income / Sales</span>
          </div>
          <p className="text-emerald-400 font-bold text-base truncate">
            {formatCurrency(totalIncome)}
          </p>
        </div>

        <div className="glass-rose rounded-2xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-rose-400 text-xs">↓</span>
            <span className="text-slate-300 text-xs font-medium">Expenses</span>
          </div>
          <p className="text-rose-400 font-bold text-base truncate">
            {formatCurrency(totalExpense)}
          </p>
        </div>
      </div>

      {/* Upcoming In & Out Payments Row */}
      {(upcomingIncomeTotal > 0 || upcomingExpenseTotal > 0 || upcomingCount > 0) && (
        <div className="grid grid-cols-2 gap-2.5 mb-3 relative z-10">
          <div className="glass rounded-2xl p-2.5 border-emerald-500/20">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-emerald-400 text-xs">⏳ ↑</span>
              <span className="text-slate-400 text-[11px] font-medium">Upcoming IN</span>
            </div>
            <p className="text-slate-200 font-bold text-sm truncate">
              {formatCurrency(upcomingIncomeTotal)}
            </p>
          </div>

          <div className="glass rounded-2xl p-2.5 border-rose-500/20">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-rose-400 text-xs">⏳ ↓</span>
              <span className="text-slate-400 text-[11px] font-medium">Upcoming OUT</span>
            </div>
            <p className="text-slate-200 font-bold text-sm truncate">
              {formatCurrency(upcomingExpenseTotal)}
            </p>
          </div>
        </div>
      )}

      {/* eCommerce COGS & Ad Fee breakdown */}
      {hasEcomData && (
        <div className="glass rounded-2xl p-3 mt-3 space-y-1.5 text-xs relative z-10 border-violet-500/20">
          <div className="flex justify-between text-slate-400">
            <span>COGS + Platform + Ads:</span>
            <span className="font-semibold text-slate-200">{formatCurrency(totalDeductions)}</span>
          </div>
          <div className="flex justify-between text-slate-100 font-bold border-t border-slate-700/50 pt-1.5">
            <span>Est. eCommerce Margin:</span>
            <span className="text-cyan-400">{formatCurrency(netEcomProfit)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
