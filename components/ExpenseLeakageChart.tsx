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

interface ExpenseLeakageChartProps {
  transactions: Transaction[];
}

export default function ExpenseLeakageChart({ transactions }: ExpenseLeakageChartProps) {
  const [activeSegment, setActiveSegment] = useState<string | null>(null);

  const metrics = useMemo(() => {
    let sales = 0;
    let cogs = 0;
    let fees = 0;
    let adSpend = 0;
    let operatingExpenses = 0;

    transactions.forEach((t) => {
      if (t.type === "income") {
        sales += t.amount;
        cogs += t.cogs || 0;
        fees += t.platformFee || 0;
        adSpend += t.adSpend || 0;
      } else {
        operatingExpenses += t.amount;
      }
    });

    const totalDeductions = cogs + fees + adSpend + operatingExpenses;
    const netProfit = sales - totalDeductions;
    const netMarginPct = sales > 0 ? (netProfit / sales) * 100 : 0;

    const segments = [
      { id: "netProfit", label: "Net Profit", value: Math.max(0, netProfit), color: "#10b981", glow: "#059669", pct: sales > 0 ? (Math.max(0, netProfit) / sales) * 100 : 0 },
      { id: "cogs", label: "Cost of Goods (COGS)", value: cogs, color: "#f59e0b", glow: "#d97706", pct: sales > 0 ? (cogs / sales) * 100 : 0 },
      { id: "fees", label: "Platform & Shipping Fees", value: fees, color: "#ef4444", glow: "#dc2626", pct: sales > 0 ? (fees / sales) * 100 : 0 },
      { id: "adSpend", label: "Ad Spend / Marketing", value: adSpend, color: "#8b5cf6", glow: "#7c3aed", pct: sales > 0 ? (adSpend / sales) * 100 : 0 },
      { id: "operating", label: "Other Operating Expenses", value: operatingExpenses, color: "#ec4899", glow: "#db2777", pct: sales > 0 ? (operatingExpenses / sales) * 100 : 0 },
    ];

    // Leakage flags
    const alerts: { title: string; desc: string; type: "warning" | "danger" | "info" }[] = [];
    if (sales > 0) {
      if (fees / sales > 0.15) {
        alerts.push({
          title: "High Platform Fee Leakage",
          desc: `Platform & transaction fees eat up ${((fees / sales) * 100).toFixed(1)}% of total revenue. Consider optimizing payment gateways or channel tier plans.`,
          type: "danger",
        });
      }
      if (adSpend / sales > 0.25) {
        alerts.push({
          title: "Elevated Advertising Cost",
          desc: `Ad spend represents ${((adSpend / sales) * 100).toFixed(1)}% of turnover. Audit campaigns for negative ROI keyword spending.`,
          type: "warning",
        });
      }
      if (cogs / sales > 0.5) {
        alerts.push({
          title: "High COGS Ratio",
          desc: `Cost of goods sold takes up ${((cogs / sales) * 100).toFixed(1)}% of income. Bulk supplier negotiation could improve profit margin.`,
          type: "warning",
        });
      }
      if (netProfit < 0) {
        alerts.push({
          title: "Negative Net Profit Warning",
          desc: "Total expenses and deductions exceed total gross sales revenue! Immediate cost reduction is recommended.",
          type: "danger",
        });
      }
    }

    if (alerts.length === 0 && sales > 0) {
      alerts.push({
        title: "Healthy Expense Distribution",
        desc: "Cost deductions are balanced. Net profit margins are strong relative to operational spend.",
        type: "info",
      });
    }

    return { sales, cogs, fees, adSpend, operatingExpenses, totalDeductions, netProfit, netMarginPct, segments, alerts };
  }, [transactions]);

  // SVG Donut calculation
  const SVG_SIZE = 260;
  const strokeWidth = 32;
  const radius = (SVG_SIZE - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentAngleOffset = 0;
  const donutArcs = metrics.segments.map((seg) => {
    const strokeDasharray = `${(seg.pct / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -currentAngleOffset;
    currentAngleOffset += (seg.pct / 100) * circumference;
    return { ...seg, strokeDasharray, strokeDashoffset };
  });

  const activeData = activeSegment ? metrics.segments.find((s) => s.id === activeSegment) : null;

  return (
    <div className="space-y-6">
      {/* ── Summary & Waterfall Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Donut Visualization Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-between space-y-4">
          <div className="w-full flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <span>🥧</span>
                <span>Revenue Breakdown</span>
              </h3>
              <p className="text-slate-400 text-xs">Cost allocation & net profit split</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
              {metrics.netMarginPct.toFixed(1)}% Margin
            </span>
          </div>

          {/* SVG Donut Graphic */}
          <div className="relative my-2 flex items-center justify-center">
            <svg width={SVG_SIZE} height={SVG_SIZE} className="transform -rotate-90">
              <defs>
                {metrics.segments.map((seg) => (
                  <filter key={seg.id} id={`glow-${seg.id}`} x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={seg.glow} floodOpacity="0.6" />
                  </filter>
                ))}
              </defs>
              {/* Background ring */}
              <circle
                cx={SVG_SIZE / 2}
                cy={SVG_SIZE / 2}
                r={radius}
                fill="transparent"
                stroke="#1e293b"
                strokeWidth={strokeWidth}
              />
              {/* Segments */}
              {donutArcs.map((arc) => {
                const isHovered = activeSegment === arc.id;
                return (
                  <circle
                    key={arc.id}
                    cx={SVG_SIZE / 2}
                    cy={SVG_SIZE / 2}
                    r={radius}
                    fill="transparent"
                    stroke={arc.color}
                    strokeWidth={isHovered ? strokeWidth + 6 : strokeWidth}
                    strokeDasharray={arc.strokeDasharray}
                    strokeDashoffset={arc.strokeDashoffset}
                    strokeLinecap="round"
                    filter={isHovered ? `url(#glow-${arc.id})` : undefined}
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setActiveSegment(arc.id)}
                    onMouseLeave={() => setActiveSegment(null)}
                  />
                );
              })}
            </svg>

            {/* Inner Center Info */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
              {activeData ? (
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">{activeData.label}</p>
                  <p className="text-xl font-extrabold text-white">{formatCurrency(activeData.value)}</p>
                  <p className="text-xs font-semibold text-emerald-400">{activeData.pct.toFixed(1)}% of sales</p>
                </div>
              ) : (
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Total Sales</p>
                  <p className="text-xl font-extrabold text-white">{formatCurrency(metrics.sales)}</p>
                  <p className="text-[11px] text-slate-400">Hover ring to inspect</p>
                </div>
              )}
            </div>
          </div>

          {/* Segment Legend */}
          <div className="w-full grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
            {metrics.segments.map((seg) => (
              <div
                key={seg.id}
                onMouseEnter={() => setActiveSegment(seg.id)}
                onMouseLeave={() => setActiveSegment(null)}
                className={`flex items-center gap-2 p-1.5 rounded-xl cursor-pointer transition-colors ${
                  activeSegment === seg.id ? "bg-slate-800/80" : "hover:bg-slate-800/40"
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                <div className="min-w-0 flex-1">
                  <p className="text-slate-300 text-[11px] font-medium truncate">{seg.label}</p>
                  <p className="text-slate-400 text-[10px]">{seg.pct.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Profit Waterfall Flow (Middle & Right Columns) ── */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-white font-bold text-base flex items-center gap-2">
                  <span>🌊</span>
                  <span>Profit & Loss Waterfall Leakage Flow</span>
                </h3>
                <p className="text-slate-400 text-xs">Visualizing revenue deductions step-by-step</p>
              </div>
              <span className="text-slate-400 text-xs font-mono">
                Net: {formatCurrency(metrics.netProfit)}
              </span>
            </div>

            {/* Waterfall Graphic Bars */}
            <div className="space-y-3.5 pt-2">
              {/* Step 1: Gross Sales */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Gross Revenue (Income)
                  </span>
                  <span className="text-white font-bold">{formatCurrency(metrics.sales)}</span>
                </div>
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full w-full shadow-lg shadow-emerald-500/20" />
                </div>
              </div>

              {/* Deductions Steps */}
              {[
                { name: "Cost of Goods Sold (COGS)", val: metrics.cogs, color: "from-amber-500 to-yellow-400", bg: "text-amber-400" },
                { name: "Platform & Payment Fees", val: metrics.fees, color: "from-rose-500 to-pink-500", bg: "text-rose-400" },
                { name: "Ad Spend / Marketing", val: metrics.adSpend, color: "from-violet-500 to-purple-400", bg: "text-violet-400" },
                { name: "Other Expenses", val: metrics.operatingExpenses, color: "from-pink-500 to-rose-400", bg: "text-pink-400" },
              ].map((step, idx) => {
                const pctOfSales = metrics.sales > 0 ? Math.min(100, (step.val / metrics.sales) * 100) : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className={`${step.bg} flex items-center gap-1.5`}>
                        <span>−</span> {step.name}
                      </span>
                      <span className="text-slate-300 font-mono">
                        -{formatCurrency(step.val)} ({pctOfSales.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${step.color} rounded-full transition-all duration-500`}
                        style={{ width: `${pctOfSales}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              {/* Step Final: Net Profit */}
              <div className="space-y-1 pt-3 border-t border-slate-800">
                <div className="flex justify-between text-sm font-bold">
                  <span className={metrics.netProfit >= 0 ? "text-emerald-400 flex items-center gap-2" : "text-rose-400 flex items-center gap-2"}>
                    <span>{metrics.netProfit >= 0 ? "✨ Net Profit Retained" : "⚠️ Net Operating Loss"}</span>
                  </span>
                  <span className={`text-base font-extrabold ${metrics.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {metrics.netProfit >= 0 ? "+" : ""}{formatCurrency(metrics.netProfit)}
                  </span>
                </div>
                <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      metrics.netProfit >= 0
                        ? "bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 shadow-lg shadow-emerald-500/30"
                        : "bg-gradient-to-r from-rose-600 to-red-400 shadow-lg shadow-rose-500/30"
                    }`}
                    style={{ width: `${Math.max(0, Math.min(100, metrics.netMarginPct))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Data Loss & Leakage Diagnostic Cards ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
          <span>🔍</span>
          <span>Cost Leakage & Data Loss Diagnostics</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {metrics.alerts.map((a, i) => (
            <div
              key={i}
              className={`p-4 rounded-2xl border transition-all ${
                a.type === "danger"
                  ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60"
                  : a.type === "warning"
                  ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60"
                  : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">
                  {a.type === "danger" ? "🚨" : a.type === "warning" ? "⚡" : "✅"}
                </span>
                <div>
                  <h4
                    className={`font-bold text-xs mb-1 ${
                      a.type === "danger"
                        ? "text-rose-700 dark:text-rose-300"
                        : a.type === "warning"
                        ? "text-amber-700 dark:text-amber-300"
                        : "text-emerald-700 dark:text-emerald-300"
                    }`}
                  >
                    {a.title}
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">{a.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
