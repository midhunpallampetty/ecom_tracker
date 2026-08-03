"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/utils/formatCurrency";

interface BalanceSummaryCardProps {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export default function BalanceSummaryCard({
  totalIncome,
  totalExpense,
  balance,
}: BalanceSummaryCardProps) {
  const isProfit = balance >= 0;
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-6 shadow-2xl transition-all duration-700 ${
        animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      } ${
        isProfit
          ? "bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600"
          : "bg-gradient-to-br from-rose-500 via-red-500 to-pink-600"
      }`}
    >
      {/* Background decoration circles */}
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

      {/* Status badge */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ${
              isProfit ? "bg-emerald-700/50" : "bg-rose-700/50"
            }`}
          >
            {isProfit ? "↑" : "↓"}
          </div>
          <span className="text-white/90 font-semibold text-sm tracking-wide uppercase">
            {isProfit ? "You are in Profit" : "You are in Loss"}
          </span>
        </div>
        <span className="text-white/70 text-xs">Balance</span>
      </div>

      {/* Main balance */}
      <div className="mb-6">
        <p className="text-white/70 text-sm mb-1">Net Balance</p>
        <p className="text-white font-bold text-4xl tracking-tight">
          {isProfit ? "+" : "−"} {formatCurrency(balance)}
        </p>
      </div>

      {/* Income / Expense row */}
      <div className="flex gap-4">
        <div className="flex-1 bg-white/15 backdrop-blur-sm rounded-2xl p-3">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-white/80 text-xs">↑</span>
            <span className="text-white/80 text-xs font-medium">Income</span>
          </div>
          <p className="text-white font-bold text-lg">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="flex-1 bg-white/15 backdrop-blur-sm rounded-2xl p-3">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-white/80 text-xs">↓</span>
            <span className="text-white/80 text-xs font-medium">Expense</span>
          </div>
          <p className="text-white font-bold text-lg">{formatCurrency(totalExpense)}</p>
        </div>
      </div>
    </div>
  );
}
