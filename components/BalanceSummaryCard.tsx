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
      className={`relative overflow-hidden rounded-3xl p-5 shadow-2xl transition-all duration-700 ${
        animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      } ${
        isProfit
          ? "bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600"
          : "bg-gradient-to-br from-rose-500 via-red-500 to-pink-600"
      }`}
    >
      {/* Background decoration */}
      <div
        className={`absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-20 ${
          isProfit ? "bg-emerald-300" : "bg-rose-300"
        }`}
      />
      <div
        className={`absolute -bottom-10 -left-10 w-32 h-32 rounded-full opacity-15 ${
          isProfit ? "bg-teal-300" : "bg-pink-300"
        }`}
      />

      {/* Top row: status + upcoming count pill */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg shrink-0 ${
              isProfit ? "bg-emerald-700/50" : "bg-rose-700/50"
            }`}
          >
            {isProfit ? "↑" : "↓"}
          </div>
          <span className="text-white/90 font-semibold text-xs tracking-wide uppercase truncate">
            {isProfit ? "In Profit" : "In Loss"}
          </span>
        </div>

        {upcomingCount > 0 && (
          <div className="flex items-center gap-1.5 bg-white/25 backdrop-blur-sm rounded-lg px-2.5 py-1 shrink-0">
            <span className="text-white text-xs">📅</span>
            <span className="text-white font-bold text-xs">
              {upcomingCount} Upcoming
            </span>
          </div>
        )}
      </div>

      {/* Main Net Balance & Projected Net Side-by-Side or Stacked */}
      <div className="mb-4 space-y-2">
        <div>
          <p className="text-white/70 text-xs mb-0.5">Realized Net Profit</p>
          <p className="text-white font-bold text-3xl tracking-tight leading-none">
            {isProfit ? "+" : "−"} {formatCurrency(Math.abs(balance))}
          </p>
        </div>

        {/* Dedicated Projected Net Profit card (Income + Upcoming IN) */}
        {(upcomingIncomeTotal > 0 || upcomingExpenseTotal > 0) && (
          <div className="bg-white/20 backdrop-blur-md rounded-2xl p-3 border border-white/25">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-white/80 text-[10px] uppercase font-bold tracking-wider">
                  Projected Net (Inc. Upcoming IN)
                </p>
                <p className="text-white text-[11px] opacity-90">
                  Sales + Upcoming IN (₹{formatCurrency(projectedIncome)})
                </p>
              </div>
              <p className="text-white font-extrabold text-lg shrink-0">
                {isProjectedProfit ? "+" : "−"}{formatCurrency(Math.abs(projectedNet))}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Primary Stats grid: Income & Expense */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2.5">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-white/80 text-xs">↑</span>
            <span className="text-white/80 text-xs font-medium">Sales / Income</span>
          </div>
          <p className="text-white font-bold text-sm truncate">
            {formatCurrency(totalIncome)}
          </p>
        </div>

        <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2.5">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-white/80 text-xs">↓</span>
            <span className="text-white/80 text-xs font-medium">Expenses</span>
          </div>
          <p className="text-white font-bold text-sm truncate">
            {formatCurrency(totalExpense)}
          </p>
        </div>
      </div>

      {/* Upcoming In & Out Payments Row */}
      {(upcomingIncomeTotal > 0 || upcomingExpenseTotal > 0 || upcomingCount > 0) && (
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="bg-emerald-950/30 border border-emerald-300/20 backdrop-blur-sm rounded-xl p-2.5">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-emerald-200 text-xs">⏳ ↑</span>
              <span className="text-emerald-100 text-xs font-medium">
                Upcoming IN
              </span>
            </div>
            <p className="text-white font-bold text-sm truncate">
              {formatCurrency(upcomingIncomeTotal)}
            </p>
          </div>

          <div className="bg-rose-950/30 border border-rose-300/20 backdrop-blur-sm rounded-xl p-2.5">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-rose-200 text-xs">⏳ ↓</span>
              <span className="text-rose-100 text-xs font-medium">
                Upcoming OUT
              </span>
            </div>
            <p className="text-white font-bold text-sm truncate">
              {formatCurrency(upcomingExpenseTotal)}
            </p>
          </div>
        </div>
      )}

      {/* Optional eCommerce COGS & Ad Fee breakdown */}
      {hasEcomData && (
        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-2.5 mt-2 space-y-1 text-xs">
          <div className="flex justify-between text-white/80">
            <span>COGS + Platform + Ads:</span>
            <span className="font-semibold">{formatCurrency(totalDeductions)}</span>
          </div>
          <div className="flex justify-between text-white font-bold border-t border-white/10 pt-1">
            <span>Estimated Net eCommerce Margin:</span>
            <span>{formatCurrency(netEcomProfit)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
