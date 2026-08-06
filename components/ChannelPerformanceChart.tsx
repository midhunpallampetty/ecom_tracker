"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/utils/formatCurrency";

interface Transaction {
  _id: string;
  amount: number;
  type: "income" | "expense";
  description?: string;
  channel?: string;
  sku?: string;
  cogs?: number;
  platformFee?: number;
  adSpend?: number;
  createdAt: string;
}

interface ChannelPerformanceChartProps {
  transactions: Transaction[];
}

export default function ChannelPerformanceChart({ transactions }: ChannelPerformanceChartProps) {
  const [hoveredChannel, setHoveredChannel] = useState<string | null>(null);

  const channelStats = useMemo(() => {
    const map: Record<
      string,
      { channelName: string; sales: number; cogs: number; fees: number; adSpend: number; expenses: number; count: number }
    > = {};

    transactions.forEach((t) => {
      const chName = t.channel && t.channel.trim() !== "" ? t.channel.trim() : "Direct / General";
      if (!map[chName]) {
        map[chName] = { channelName: chName, sales: 0, cogs: 0, fees: 0, adSpend: 0, expenses: 0, count: 0 };
      }

      map[chName].count += 1;

      if (t.type === "income") {
        map[chName].sales += t.amount;
        map[chName].cogs += t.cogs || 0;
        map[chName].fees += t.platformFee || 0;
        map[chName].adSpend += t.adSpend || 0;
      } else {
        map[chName].expenses += t.amount;
      }
    });

    const list = Object.values(map).map((ch) => {
      const totalDeductions = ch.cogs + ch.fees + ch.adSpend + ch.expenses;
      const netProfit = ch.sales - totalDeductions;
      const marginPct = ch.sales > 0 ? (netProfit / ch.sales) * 100 : 0;
      const roas = ch.adSpend > 0 ? ch.sales / ch.adSpend : ch.sales > 0 ? 99 : 0;
      return {
        ...ch,
        totalDeductions,
        netProfit,
        marginPct,
        roas,
      };
    });

    list.sort((a, b) => b.sales - a.sales);

    const topChannel = list.length > 0 ? [...list].sort((a, b) => b.netProfit - a.netProfit)[0] : null;
    const weakestChannel = list.length > 1 ? [...list].sort((a, b) => a.netProfit - b.netProfit)[0] : null;

    return { list, topChannel, weakestChannel };
  }, [transactions]);

  // SVG dimensions
  const W = 600;
  const H = 220;
  const PAD = { top: 30, right: 20, bottom: 45, left: 15 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const maxVal = Math.max(
    ...channelStats.list.map((c) => Math.max(c.sales, Math.abs(c.netProfit))),
    100
  );

  const formatK = (n: number) =>
    n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(1)}k` : `₹${Math.round(n)}`;

  const activeItem = hoveredChannel ? channelStats.list.find((c) => c.channelName === hoveredChannel) : null;

  return (
    <div className="space-y-6">
      {/* Top Channel Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Active Sales Channels
          </p>
          <p className="text-lg font-bold text-slate-900 dark:text-white">
            {channelStats.list.length} Channels
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Top Profit Driver
          </p>
          <p className="text-sm font-bold text-emerald-500 truncate">
            {channelStats.topChannel ? `${channelStats.topChannel.channelName}` : "N/A"}
          </p>
          <p className="text-[11px] text-slate-400">
            {channelStats.topChannel ? formatCurrency(channelStats.topChannel.netProfit) : ""}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Lowest Margin / Risk
          </p>
          <p className="text-sm font-bold text-amber-500 truncate">
            {channelStats.weakestChannel ? channelStats.weakestChannel.channelName : "N/A"}
          </p>
          <p className="text-[11px] text-slate-400">
            {channelStats.weakestChannel ? `${channelStats.weakestChannel.marginPct.toFixed(1)}% margin` : ""}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Avg ROAS / Ad Return
          </p>
          <p className="text-lg font-bold text-violet-500">
            {channelStats.list.some((c) => c.adSpend > 0)
              ? `${(
                  channelStats.list.reduce((acc, c) => acc + c.sales, 0) /
                  Math.max(1, channelStats.list.reduce((acc, c) => acc + c.adSpend, 0))
                ).toFixed(1)}x`
              : "Direct Sales"}
          </p>
        </div>
      </div>

      {/* SVG Bar Visualizer Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-white font-bold text-base flex items-center gap-2">
              <span>🏬</span>
              <span>Channel Profitability & Sales Comparison</span>
            </h3>
            <p className="text-slate-400 text-xs">Revenue vs Net Profit grouped by selling channel</p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-3 h-3 rounded-sm bg-emerald-500/40 border border-emerald-400" />
              Gross Sales
            </span>
            <span className="flex items-center gap-1.5 text-violet-400 font-medium">
              <span className="w-3 h-3 rounded-sm bg-violet-500/40 border border-violet-400" />
              Net Profit
            </span>
          </div>
        </div>

        {/* Hover Information Banner */}
        <div className="min-h-[44px] flex items-center justify-center">
          {activeItem ? (
            <div className="inline-flex flex-wrap items-center gap-3 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-2 text-xs shadow-lg animate-in fade-in duration-150">
              <span className="text-white font-bold">{activeItem.channelName}</span>
              <span className="text-emerald-400">Sales: {formatCurrency(activeItem.sales)}</span>
              <span className="text-rose-400">Fees & COGS: {formatCurrency(activeItem.totalDeductions)}</span>
              <span className={`font-bold ${activeItem.netProfit >= 0 ? "text-violet-300" : "text-rose-300"}`}>
                Net Profit: {activeItem.netProfit >= 0 ? "+" : ""}{formatCurrency(activeItem.netProfit)}
              </span>
              <span className="text-amber-300 font-medium">
                Margin: {activeItem.marginPct.toFixed(1)}%
              </span>
            </div>
          ) : (
            <p className="text-slate-500 text-xs">Hover bars to compare sales & net profit per channel</p>
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
            {/* Grid lines */}
            {[0, 0.33, 0.66, 1].map((pct) => {
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

            {/* Bars for Channels */}
            {channelStats.list.map((c, i) => {
              const count = channelStats.list.length;
              const groupW = chartW / count;
              const cx = PAD.left + i * groupW + groupW / 2;
              const barW = Math.min(24, Math.max(8, groupW * 0.3));

              const salesH = (c.sales / maxVal) * chartH;
              const profitH = (Math.max(0, c.netProfit) / maxVal) * chartH;
              const isHovered = hoveredChannel === c.channelName;

              return (
                <g
                  key={c.channelName}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredChannel(c.channelName)}
                  onMouseLeave={() => setHoveredChannel(null)}
                >
                  {/* Sales Bar */}
                  <rect
                    x={cx - barW - 2}
                    y={PAD.top + chartH - salesH}
                    width={barW}
                    height={Math.max(2, salesH)}
                    rx="3"
                    className={`transition-all duration-200 ${
                      isHovered ? "fill-emerald-400" : "fill-emerald-500/60"
                    }`}
                  />

                  {/* Net Profit Bar */}
                  <rect
                    x={cx + 2}
                    y={PAD.top + chartH - profitH}
                    width={barW}
                    height={Math.max(2, profitH)}
                    rx="3"
                    className={`transition-all duration-200 ${
                      isHovered ? "fill-violet-400" : "fill-violet-500/60"
                    }`}
                  />

                  {/* Channel Name Label */}
                  <text
                    x={cx}
                    y={H - 12}
                    textAnchor="middle"
                    fontSize="10"
                    className={`font-semibold transition-colors ${
                      isHovered ? "fill-white" : "fill-slate-400"
                    }`}
                  >
                    {c.channelName.length > 12 ? `${c.channelName.slice(0, 10)}..` : c.channelName}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Detailed Channel Breakdown Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-4">
          Channel Matrix Detailed Performance
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-semibold">
                <th className="pb-3 px-2">Channel Name</th>
                <th className="pb-3 px-2 text-right">Gross Sales</th>
                <th className="pb-3 px-2 text-right">Fees & Ads</th>
                <th className="pb-3 px-2 text-right">Net Profit</th>
                <th className="pb-3 px-2 text-right">Margin %</th>
                <th className="pb-3 px-2 text-right">ROAS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {channelStats.list.map((c) => (
                <tr
                  key={c.channelName}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 px-2 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <span>📦</span>
                    <span>{c.channelName}</span>
                  </td>
                  <td className="py-3 px-2 text-right font-medium text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(c.sales)}
                  </td>
                  <td className="py-3 px-2 text-right font-medium text-rose-500 dark:text-rose-400">
                    {formatCurrency(c.fees + c.adSpend)}
                  </td>
                  <td
                    className={`py-3 px-2 text-right font-bold ${
                      c.netProfit >= 0 ? "text-violet-600 dark:text-violet-400" : "text-rose-500 dark:text-rose-400"
                    }`}
                  >
                    {c.netProfit >= 0 ? "+" : ""}{formatCurrency(c.netProfit)}
                  </td>
                  <td className="py-3 px-2 text-right font-semibold">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] ${
                        c.marginPct > 20
                          ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                          : c.marginPct > 0
                          ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                          : "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300"
                      }`}
                    >
                      {c.marginPct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right font-mono text-slate-500 dark:text-slate-400">
                    {c.adSpend > 0 ? `${c.roas.toFixed(1)}x` : "—"}
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
