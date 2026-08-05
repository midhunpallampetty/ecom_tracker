"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/utils/formatCurrency";

interface BalanceSummaryCardProps {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  upcomingCount?: number;
  upcomingExpenseTotal?: number;
}

export default function BalanceSummaryCard({
  totalIncome,
  totalExpense,
  balance,
  upcomingCount = 0,
  upcomingExpenseTotal = 0,
}: BalanceSummaryCardProps) {
  const isProfit = balance >= 0;
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

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
      <div className={`absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-20 ${isProfit ? "bg-emerald-300" : "bg-rose-300"}`} />
      <div className={`absolute -bottom-10 -left-10 w-32 h-32 rounded-full opacity-15 ${isProfit ? "bg-teal-300" : "bg-pink-300"}`} />

      {/* Top row: status + upcoming pill */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg shrink-0 ${isProfit ? "bg-emerald-700/50" : "bg-rose-700/50"}`}>
            {isProfit ? "↑" : "↓"}
          </div>
          <span className="text-white/90 font-semibold text-xs tracking-wide uppercase truncate">
            {isProfit ? "In Profit" : "In Loss"}
          </span>
        </div>

        {upcomingCount > 0 && (
          <div className="flex items-center gap-1 bg-white/25 backdrop-blur-sm rounded-lg px-2 py-1 shrink-0">
            <span className="text-white text-xs">📅</span>
            <span className="text-white font-bold text-xs">{upcomingCount}</span>
            <span className="text-white/70 text-[9px]">due</span>
          </div>
        )}
      </div>

      {/* Balance */}
      <div className="mb-4">
        <p className="text-white/70 text-xs mb-1">Net Balance</p>
        <p className="text-white font-bold text-3xl tracking-tight leading-none">
          {isProfit ? "+" : "−"} {formatCurrency(Math.abs(balance))}
        </p>
      </div>

      {/* Stats grid — 2 cols always, upcoming on new row if present */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2.5">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-white/80 text-xs">↑</span>
            <span className="text-white/80 text-xs font-medium">Income</span>
          </div>
          <p className="text-white font-bold text-sm truncate">{formatCurrency(totalIncome)}</p>
        </div>

        <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2.5">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-white/80 text-xs">↓</span>
            <span className="text-white/80 text-xs font-medium">Expense</span>
          </div>
          <p className="text-white font-bold text-sm truncate">{formatCurrency(totalExpense)}</p>
        </div>

        {upcomingCount > 0 && (
          <div className="col-span-2 bg-white/15 backdrop-blur-sm rounded-xl p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-white/80 text-xs">⏳</span>
              <span className="text-white/80 text-xs font-medium">
                {upcomingCount} Upcoming Payment{upcomingCount > 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-white font-bold text-sm">{formatCurrency(upcomingExpenseTotal)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
