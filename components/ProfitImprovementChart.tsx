"use client";

import { useMemo } from "react";
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

interface ProfitImprovementChartProps {
  transactions: Transaction[];
}

export default function ProfitImprovementChart({ transactions }: ProfitImprovementChartProps) {
  const analysis = useMemo(() => {
    let sales = 0;
    let cogs = 0;
    let fees = 0;
    let adSpend = 0;
    let expenses = 0;

    const channelMap: Record<string, number> = {};

    transactions.forEach((t) => {
      if (t.type === "income") {
        sales += t.amount;
        cogs += t.cogs || 0;
        fees += t.platformFee || 0;
        adSpend += t.adSpend || 0;

        const ch = t.channel || "Direct";
        channelMap[ch] = (channelMap[ch] || 0) + t.amount;
      } else {
        expenses += t.amount;
      }
    });

    const totalDeductions = cogs + fees + adSpend + expenses;
    const netProfit = sales - totalDeductions;
    const marginPct = sales > 0 ? (netProfit / sales) * 100 : 0;
    const feeRatio = sales > 0 ? (fees / sales) * 100 : 0;
    const adRatio = sales > 0 ? (adSpend / sales) * 100 : 0;
    const roas = adSpend > 0 ? sales / adSpend : 0;

    // Calculate Health Score (0 - 100)
    let marginScore = Math.min(35, Math.max(0, marginPct * 1.5)); // up to 35 pts
    let feeScore = Math.max(0, 25 - feeRatio * 1.2); // up to 25 pts
    let adScore = adSpend > 0 ? Math.min(20, Math.max(0, roas * 5)) : 15; // up to 20 pts
    let channelScore = Math.min(20, Object.keys(channelMap).length * 7); // up to 20 pts

    if (sales === 0) {
      marginScore = 0;
      feeScore = 10;
      adScore = 10;
      channelScore = 0;
    }

    const healthScore = Math.min(100, Math.max(0, Math.round(marginScore + feeScore + adScore + channelScore)));

    let grade = "C";
    let gradeColor = "#f59e0b";
    if (healthScore >= 85) { grade = "A+"; gradeColor = "#10b981"; }
    else if (healthScore >= 70) { grade = "A"; gradeColor = "#34d399"; }
    else if (healthScore >= 55) { grade = "B"; gradeColor = "#60a5fa"; }
    else if (healthScore >= 40) { grade = "C"; gradeColor = "#f59e0b"; }
    else { grade = "D"; gradeColor = "#ef4444"; }

    // Generate actionable improvement tips
    const recommendations: { priority: "high" | "medium" | "low"; title: string; action: string; impact: string }[] = [];

    if (feeRatio > 12) {
      recommendations.push({
        priority: "high",
        title: "Renegotiate Channel & Gateway Fees",
        action: `Platform fees equal ${feeRatio.toFixed(1)}% of your income. Request high-volume commission tier discounts or switch payment processors.`,
        impact: `Potential gain: +${formatCurrency(fees * 0.25)} net profit`,
      });
    }

    if (adSpend > 0 && roas < 3) {
      recommendations.push({
        priority: "high",
        title: "Optimize Ad Campaign Efficiency",
        action: `Current ROAS is ${roas.toFixed(1)}x. Pause underperforming ad keywords and focus ad spend exclusively on high-margin products.`,
        impact: `Potential gain: +${formatCurrency(adSpend * 0.3)} saved waste`,
      });
    }

    if (cogs > 0 && (cogs / sales) > 0.4) {
      recommendations.push({
        priority: "medium",
        title: "Supplier COGS Reduction",
        action: `Manufacturing/COGS cost accounts for ${((cogs / sales) * 100).toFixed(1)}% of revenue. Place bulk orders or audit inventory waste.`,
        impact: `Potential gain: +${formatCurrency(cogs * 0.1)} margin boost`,
      });
    }

    if (Object.keys(channelMap).length <= 1 && sales > 0) {
      recommendations.push({
        priority: "medium",
        title: "Expand Sales Channels",
        action: "Revenue is heavily dependent on a single sales channel. Expand to additional marketplaces (Amazon, Flipkart, Shopify) to reduce risk.",
        impact: "Diversifies cash flow & increases reach",
      });
    }

    if (marginPct < 15 && sales > 0) {
      recommendations.push({
        priority: "high",
        title: "Product Pricing Strategy Adjustments",
        action: `Overall net margin is ${marginPct.toFixed(1)}%. Consider a 5-8% price optimization on top-selling SKUs to immediately raise profit margins.`,
        impact: `Potential gain: +${formatCurrency(sales * 0.05)} direct profit`,
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        priority: "low",
        title: "Maintain Strong Execution",
        action: "Your profit margins, fee ratios, and return metrics are well optimized. Focus on scaling inventory and expanding marketing budgets.",
        impact: "Sustained business compounding",
      });
    }

    return {
      sales,
      netProfit,
      marginPct,
      feeRatio,
      roas,
      healthScore,
      grade,
      gradeColor,
      recommendations,
    };
  }, [transactions]);

  // SVG Gauge calculations
  const G_SIZE = 220;
  const G_STROKE = 20;
  const G_R = (G_SIZE - G_STROKE) / 2;
  const G_CIRC = Math.PI * G_R; // Semi-circle circumference
  const strokeDashoffset = G_CIRC - (analysis.healthScore / 100) * G_CIRC;

  return (
    <div className="space-y-6">
      {/* Top Health Gauge & Diagnostics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Radial Gauge Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-between text-center space-y-4">
          <div className="w-full text-left">
            <h3 className="text-white font-bold text-base flex items-center gap-2">
              <span>🎯</span>
              <span>Profit Health Score</span>
            </h3>
            <p className="text-slate-400 text-xs">Overall financial performance index</p>
          </div>

          {/* Semi-circle Gauge SVG */}
          <div className="relative flex flex-col items-center justify-center pt-2">
            <svg width={G_SIZE} height={G_SIZE / 2 + 20} className="overflow-visible">
              <defs>
                <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
              {/* Background Arc */}
              <path
                d={`M ${G_STROKE / 2} ${G_SIZE / 2} A ${G_R} ${G_R} 0 0 1 ${G_SIZE - G_STROKE / 2} ${G_SIZE / 2}`}
                fill="none"
                stroke="#1e293b"
                strokeWidth={G_STROKE}
                strokeLinecap="round"
              />
              {/* Active Progress Arc */}
              <path
                d={`M ${G_STROKE / 2} ${G_SIZE / 2} A ${G_R} ${G_R} 0 0 1 ${G_SIZE - G_STROKE / 2} ${G_SIZE / 2}`}
                fill="none"
                stroke="url(#gaugeGrad)"
                strokeWidth={G_STROKE}
                strokeDasharray={G_CIRC}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* Centered Score */}
            <div className="absolute bottom-2 flex flex-col items-center">
              <span className="text-4xl font-extrabold text-white">{analysis.healthScore}</span>
              <span className="text-xs uppercase font-bold tracking-widest text-slate-400">Out of 100</span>
            </div>
          </div>

          {/* Grade Badge */}
          <div className="w-full flex items-center justify-between pt-3 border-t border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Business Rating</span>
            <span
              className="px-3 py-1 rounded-full text-xs font-extrabold shadow-lg"
              style={{ backgroundColor: `${analysis.gradeColor}20`, color: analysis.gradeColor, borderColor: `${analysis.gradeColor}40` }}
            >
              Grade {analysis.grade}
            </span>
          </div>
        </div>

        {/* ── Efficiency Metrics Radar Meters (Middle & Right Columns) ── */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-white font-bold text-base flex items-center gap-2 mb-1">
              <span>📊</span>
              <span>Efficiency & Margin Diagnostics</span>
            </h3>
            <p className="text-slate-400 text-xs mb-5">Key profitability levers analysis</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Metric 1 */}
              <div className="bg-slate-800/50 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Net Profit Margin</span>
                  <span className="text-emerald-400 font-bold">{analysis.marginPct.toFixed(1)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, analysis.marginPct * 2))}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500">Benchmark: &gt; 20% healthy target</p>
              </div>

              {/* Metric 2 */}
              <div className="bg-slate-800/50 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Platform Fee Overhead</span>
                  <span className="text-rose-400 font-bold">{analysis.feeRatio.toFixed(1)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, analysis.feeRatio * 3))}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500">Benchmark: &lt; 10% ideal fee ratio</p>
              </div>

              {/* Metric 3 */}
              <div className="bg-slate-800/50 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Ad Spend Return (ROAS)</span>
                  <span className="text-violet-400 font-bold">{analysis.roas > 0 ? `${analysis.roas.toFixed(1)}x` : "N/A"}</span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, analysis.roas * 20))}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500">Benchmark: &gt; 3.0x sustainable ROAS</p>
              </div>

              {/* Metric 4 */}
              <div className="bg-slate-800/50 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Net Income Status</span>
                  <span className={analysis.netProfit >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                    {formatCurrency(analysis.netProfit)}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${analysis.netProfit >= 0 ? "bg-emerald-400" : "bg-rose-400"}`}
                    style={{ width: "100%" }}
                  />
                </div>
                <p className="text-[10px] text-slate-500">Positive net cash flow operational state</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Actionable "Where to Improve" Recommendations Section ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
              <span>🚀</span>
              <span>Where to Improve — Actionable AI Recommendations</span>
            </h3>
            <p className="text-slate-400 text-xs">Tailored steps to maximize profitability and reduce loss</p>
          </div>
          <span className="text-xs bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-300 font-bold px-3 py-1 rounded-full border border-violet-200 dark:border-violet-800">
            {analysis.recommendations.length} Suggestions
          </span>
        </div>

        <div className="space-y-3">
          {analysis.recommendations.map((rec, i) => (
            <div
              key={i}
              className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-violet-300 dark:hover:border-violet-700 transition-colors"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      rec.priority === "high"
                        ? "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300"
                        : rec.priority === "medium"
                        ? "bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300"
                        : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300"
                    }`}
                  >
                    {rec.priority} Priority
                  </span>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">{rec.title}</h4>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">{rec.action}</p>
              </div>

              <div className="shrink-0 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                <p className="text-[10px] uppercase font-bold text-slate-400">Impact</p>
                <p className="text-xs font-bold text-emerald-500">{rec.impact}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
