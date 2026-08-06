"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/utils/formatCurrency";
import { MonthlyProfitChartSkeleton } from "./SkeletonLoaders";

interface Transaction {
  _id: string;
  amount: number;
  type: "income" | "expense";
  cogs?: number;
  platformFee?: number;
  adSpend?: number;
  createdAt: string;
}

interface MonthlyProfitChartProps {
  transactions: Transaction[];
  loading?: boolean;
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export default function MonthlyProfitChart({ transactions, loading = false }: MonthlyProfitChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (loading) {
    return <MonthlyProfitChartSkeleton />;
  }

  // Group transactions by month (last 12 months)
  const monthlyData = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      return {
        year: d.getFullYear(),
        monthIndex: d.getMonth(),
        label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`,
        fullLabel: `${d.toLocaleString("default", { month: "long" })} ${d.getFullYear()}`,
        sales: 0,
        expenses: 0,
        cogs: 0,
        fees: 0,
        adSpend: 0,
      };
    });

    transactions.forEach((t) => {
      const d = new Date(t.createdAt);
      const idx = months.findIndex(
        (m) => m.year === d.getFullYear() && m.monthIndex === d.getMonth()
      );
      if (idx === -1) return;

      if (t.type === "income") {
        months[idx].sales += t.amount;
        months[idx].cogs += t.cogs || 0;
        months[idx].fees += t.platformFee || 0;
        months[idx].adSpend += t.adSpend || 0;
      } else {
        months[idx].expenses += t.amount;
      }
    });

    return months.map((m) => {
      const totalDeductions = m.cogs + m.fees + m.adSpend;
      const netProfit = m.sales - m.expenses - totalDeductions;
      const marginPct = m.sales > 0 ? (netProfit / m.sales) * 100 : 0;
      return {
        ...m,
        totalDeductions,
        netProfit,
        marginPct,
      };
    });
  }, [transactions]);

  // Overall statistics
  const totalSales = monthlyData.reduce((acc, m) => acc + m.sales, 0);
  const totalNetProfit = monthlyData.reduce((acc, m) => acc + m.netProfit, 0);
  const avgMargin = totalSales > 0 ? (totalNetProfit / totalSales) * 100 : 0;
  const bestMonth = [...monthlyData].sort((a, b) => b.netProfit - a.netProfit)[0];

  // SVG Chart dimensions
  const W = 600;
  const H = 220;
  const PAD = { top: 30, right: 20, bottom: 40, left: 15 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  // Scale calculations
  const maxVal = Math.max(
    ...monthlyData.map((d) => Math.max(d.sales, d.expenses, Math.abs(d.netProfit))),
    100
  );

  const toX = (i: number) => PAD.left + (i / (monthlyData.length - 1)) * chartW;
  const toY = (v: number) => PAD.top + (1 - Math.max(0, v) / maxVal) * chartH;

  // Build curved line path and glowing area fill for Net Profit
  const profitPoints = monthlyData.map((d, i) => [toX(i), toY(d.netProfit)] as [number, number]);
  let profitLineD = "";
  let profitAreaD = "";
  if (profitPoints.length > 1) {
    profitLineD = `M ${profitPoints[0][0]} ${profitPoints[0][1]}`;
    for (let i = 0; i < profitPoints.length - 1; i++) {
      const cp1x = profitPoints[i][0] + (profitPoints[i + 1][0] - profitPoints[i][0]) * 0.4;
      const cp2x = profitPoints[i + 1][0] - (profitPoints[i + 1][0] - profitPoints[i][0]) * 0.4;
      profitLineD += ` C ${cp1x} ${profitPoints[i][1]} ${cp2x} ${profitPoints[i + 1][1]} ${profitPoints[i + 1][0]} ${profitPoints[i + 1][1]}`;
    }
    const lastPt = profitPoints[profitPoints.length - 1];
    const firstPt = profitPoints[0];
    profitAreaD = `${profitLineD} L ${lastPt[0]} ${PAD.top + chartH} L ${firstPt[0]} ${PAD.top + chartH} Z`;
  }

  const formatK = (n: number) =>
    n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : `₹${Math.round(n)}`;

  const activeItem = hoveredIndex !== null ? monthlyData[hoveredIndex] : null;

  return (
    <div className="space-y-6">
      {/* ── KPI Metrics Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Total Sales (12M)
          </p>
          <p className="text-lg font-bold text-slate-900 dark:text-white">
            {formatCurrency(totalSales)}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Total Net Profit
          </p>
          <p className={`text-lg font-bold ${totalNetProfit >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
            {totalNetProfit >= 0 ? "+" : ""}{formatCurrency(totalNetProfit)}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Avg Profit Margin
          </p>
          <p className="text-lg font-bold text-violet-500">
            {avgMargin.toFixed(1)}%
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Best Month
          </p>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
            {bestMonth ? `${bestMonth.label} (${formatK(bestMonth.netProfit)})` : "N/A"}
          </p>
        </div>
      </div>

      {/* ── Interactive Chart Box ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-white font-bold text-base flex items-center gap-2">
              <span>📈</span>
              <span>Month-Wise Sales & Profit Trend</span>
            </h3>
            <p className="text-slate-400 text-xs">Last 12 months performance breakdown</p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-3 h-3 rounded-sm bg-emerald-500/40 border border-emerald-400" />
              Sales Revenue
            </span>
            <span className="flex items-center gap-1.5 text-rose-400 font-medium">
              <span className="w-3 h-3 rounded-sm bg-rose-500/40 border border-rose-400" />
              Expenses
            </span>
            <span className="flex items-center gap-1.5 text-violet-400 font-bold">
              <span className="w-3 h-1 rounded-full bg-violet-400" />
              Net Profit
            </span>
          </div>
        </div>

        {/* Hover Information Banner */}
        <div className="min-h-[44px] flex items-center justify-center">
          {activeItem ? (
            <div className="inline-flex flex-wrap items-center gap-3 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-2 text-xs shadow-lg animate-in fade-in duration-150">
              <span className="text-white font-bold">{activeItem.fullLabel}</span>
              <span className="text-emerald-400">Sales: {formatCurrency(activeItem.sales)}</span>
              <span className="text-rose-400">Expenses: {formatCurrency(activeItem.expenses)}</span>
              <span className={`font-bold ${activeItem.netProfit >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                Net Profit: {activeItem.netProfit >= 0 ? "+" : ""}{formatCurrency(activeItem.netProfit)}
              </span>
              <span className="text-violet-300 font-medium">
                Margin: {activeItem.marginPct.toFixed(1)}%
              </span>
            </div>
          ) : (
            <p className="text-slate-500 text-xs">Hover over bars or dots to view monthly breakdown details</p>
          )}
        </div>

        {/* SVG Graphic */}
        <div className="relative">
          <svg
            width="100%"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMidYMid meet"
            className="overflow-visible"
          >
            <defs>
              <linearGradient id="profitGlowGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
              const y = PAD.top + pct * chartH;
              return (
                <line
                  key={pct}
                  x1={PAD.left}
                  y1={y}
                  x2={W - PAD.right}
                  y2={y}
                  stroke="#1e293b"
                  strokeWidth="1"
                />
              );
            })}

            {/* Bars for Sales and Expenses */}
            {monthlyData.map((d, i) => {
              const cx = toX(i);
              const barW = Math.max(6, chartW / (monthlyData.length * 3));
              const salesH = (d.sales / maxVal) * chartH;
              const expH = (d.expenses / maxVal) * chartH;
              const isHovered = hoveredIndex === i;

              return (
                <g key={i}>
                  {/* Sales Bar */}
                  <rect
                    x={cx - barW - 1}
                    y={PAD.top + chartH - salesH}
                    width={barW}
                    height={Math.max(2, salesH)}
                    rx="2"
                    className={`transition-all duration-200 ${
                      isHovered ? "fill-emerald-400" : "fill-emerald-500/50"
                    }`}
                  />

                  {/* Expense Bar */}
                  <rect
                    x={cx + 1}
                    y={PAD.top + chartH - expH}
                    width={barW}
                    height={Math.max(2, expH)}
                    rx="2"
                    className={`transition-all duration-200 ${
                      isHovered ? "fill-rose-400" : "fill-rose-500/50"
                    }`}
                  />
                </g>
              );
            })}

            {/* Net Profit Area Fill */}
            {profitAreaD && (
              <path
                d={profitAreaD}
                fill="url(#profitGlowGrad)"
                stroke="none"
              />
            )}

            {/* Net Profit Line */}
            {profitLineD && (
              <path
                d={profitLineD}
                fill="none"
                stroke="#a855f7"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Net Profit Dots & Hover Target */}
            {monthlyData.map((d, i) => {
              const x = toX(i);
              const py = toY(d.netProfit);
              const isHovered = hoveredIndex === i;

              return (
                <g key={i}>
                  {/* Vertical hover guide */}
                  {isHovered && (
                    <line
                      x1={x}
                      y1={PAD.top}
                      x2={x}
                      y2={PAD.top + chartH}
                      stroke="#64748b"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                  )}

                  {/* Profit Dot */}
                  <circle
                    cx={x}
                    cy={py}
                    r={isHovered ? 6 : 4}
                    className={`transition-all duration-200 ${
                      d.netProfit >= 0 ? "fill-violet-400 stroke-slate-900" : "fill-rose-500 stroke-slate-900"
                    }`}
                    strokeWidth="2"
                  />

                  {/* Invisible Hover Rect */}
                  <rect
                    x={x - chartW / (monthlyData.length * 2)}
                    y={PAD.top}
                    width={chartW / monthlyData.length}
                    height={chartH + 20}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />

                  {/* X Axis Label */}
                  <text
                    x={x}
                    y={H - 10}
                    textAnchor="middle"
                    fontSize="9"
                    className={`font-semibold transition-colors ${
                      isHovered ? "fill-white" : "fill-slate-500"
                    }`}
                  >
                    {d.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* ── Month-Wise Detailed Data Table ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-4">
          Month-by-Month Financial Summary
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-semibold">
                <th className="pb-3 px-2">Month</th>
                <th className="pb-3 px-2 text-right">Gross Sales</th>
                <th className="pb-3 px-2 text-right">Expenses</th>
                <th className="pb-3 px-2 text-right">COGS & Fees</th>
                <th className="pb-3 px-2 text-right">Net Profit</th>
                <th className="pb-3 px-2 text-right">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {[...monthlyData].reverse().map((m) => (
                <tr
                  key={m.label}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 px-2 font-semibold text-slate-800 dark:text-slate-200">
                    {m.fullLabel}
                  </td>
                  <td className="py-3 px-2 text-right font-medium text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(m.sales)}
                  </td>
                  <td className="py-3 px-2 text-right font-medium text-rose-500 dark:text-rose-400">
                    {formatCurrency(m.expenses)}
                  </td>
                  <td className="py-3 px-2 text-right text-slate-500 dark:text-slate-400">
                    {formatCurrency(m.totalDeductions)}
                  </td>
                  <td
                    className={`py-3 px-2 text-right font-bold ${
                      m.netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"
                    }`}
                  >
                    {m.netProfit >= 0 ? "+" : ""}{formatCurrency(m.netProfit)}
                  </td>
                  <td className="py-3 px-2 text-right font-semibold">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] ${
                        m.marginPct > 15
                          ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                          : m.marginPct > 0
                          ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                          : "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300"
                      }`}
                    >
                      {m.marginPct.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
