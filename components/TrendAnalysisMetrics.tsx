"use client";

import { useState } from "react";
import { HorizonSummary, TrendAnalysisResult } from "@/lib/projectionEngine";

interface TrendAnalysisMetricsProps {
  data: TrendAnalysisResult;
  selectedHorizon: "1m" | "3m" | "6m" | "12m";
  onSelectHorizon: (horizon: "1m" | "3m" | "6m" | "12m") => void;
}

export default function TrendAnalysisMetrics({
  data,
  selectedHorizon,
  onSelectHorizon,
}: TrendAnalysisMetricsProps) {
  const [activeRecHorizon, setActiveRecHorizon] = useState<string | null>(null);
  const { trendMetrics, horizons, aiInsights } = data;

  const horizonList: ("1m" | "3m" | "6m" | "12m")[] = ["1m", "3m", "6m", "12m"];

  return (
    <div className="space-y-6">
      {/* ── 1. Top Executive Trend KPI Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Annual Run Rate (ARR) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm relative overflow-hidden group hover:border-violet-500/50 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl group-hover:bg-violet-500/20 transition-all" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Annual Run Rate</span>
            <span className="p-2 rounded-2xl bg-violet-500/10 text-violet-400 text-sm font-bold">🚀</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            ₹{trendMetrics.annualRunRate.toLocaleString("en-IN")}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs font-semibold">
            <span className="text-emerald-500 flex items-center gap-1">
              <span>↑</span>
              <span>{trendMetrics.momIncomeGrowthRate >= 0 ? `+${trendMetrics.momIncomeGrowthRate}%` : `${trendMetrics.momIncomeGrowthRate}%`} MoM</span>
            </span>
            <span className="text-slate-400">Run-rate ARR</span>
          </div>
        </div>

        {/* KPI 2: Net Profit Margin */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm relative overflow-hidden group hover:border-emerald-500/50 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Profit Margin</span>
            <span className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-400 text-sm font-bold">💎</span>
          </div>
          <div className="text-2xl font-black text-emerald-500 dark:text-emerald-400 tracking-tight">
            {trendMetrics.profitMarginPercent}%
          </div>
          <div className="mt-2 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-400">COGS: {trendMetrics.cogsRatioPercent}%</span>
            <span className="text-slate-400">Ads: {trendMetrics.adSpendRatioPercent}%</span>
          </div>
        </div>

        {/* KPI 3: Ad Spend ROAS */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm relative overflow-hidden group hover:border-cyan-500/50 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Marketing ROAS</span>
            <span className="p-2 rounded-2xl bg-cyan-500/10 text-cyan-400 text-sm font-bold">🎯</span>
          </div>
          <div className="text-2xl font-black text-cyan-500 dark:text-cyan-400 tracking-tight">
            {trendMetrics.roas}x
          </div>
          <div className="mt-2 flex items-center justify-between text-xs font-semibold">
            <span className="text-cyan-400 font-bold">High Efficiency</span>
            <span className="text-slate-400">Return Multiplier</span>
          </div>
        </div>

        {/* KPI 4: AI Model Confidence */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm relative overflow-hidden group hover:border-amber-500/50 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">AI Model Accuracy</span>
            <span className="p-2 rounded-2xl bg-amber-500/10 text-amber-400 text-sm font-bold">🧠</span>
          </div>
          <div className="text-2xl font-black text-amber-500 dark:text-amber-400 tracking-tight">
            {trendMetrics.confidenceScore}%
          </div>
          <div className="mt-2 flex items-center justify-between text-xs font-semibold">
            <span className="text-amber-400 font-bold">High Reliability</span>
            <span className="text-slate-400">Trend Fit</span>
          </div>
        </div>
      </div>

      {/* ── 2. Growth Projections Horizon Cards (1M, 3M, 6M, 12M) ── */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-slate-900 dark:text-white font-extrabold text-lg flex items-center gap-2">
            <span>🔮</span>
            <span>Forecast Horizons (1M · 3M · 6M · 12M)</span>
          </h3>
          <span className="text-xs text-slate-400 font-medium">Select a horizon to filter chart timeline</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {horizonList.map((key) => {
            const h: HorizonSummary = horizons[key];
            const isSelected = selectedHorizon === key;
            const isRiskHigh = h.riskLevel === "High";
            const isRiskMod = h.riskLevel === "Moderate";

            return (
              <div
                key={key}
                onClick={() => onSelectHorizon(key)}
                className={`cursor-pointer rounded-3xl p-5 border transition-all duration-300 relative flex flex-col justify-between ${
                  isSelected
                    ? "bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 dark:from-slate-900 dark:to-slate-950 text-white border-violet-500/80 shadow-lg shadow-violet-500/10 ring-2 ring-violet-500/30"
                    : "bg-white dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800 hover:border-violet-400/40"
                }`}
              >
                {/* Header Tag */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${
                      isSelected
                        ? "bg-violet-500 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {h.title}
                  </span>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      isRiskHigh
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                        : isRiskMod
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    }`}
                  >
                    {h.riskLevel} Risk
                  </span>
                </div>

                {/* Main Projected Net Profit */}
                <div className="space-y-1 my-2">
                  <p className="text-xs text-slate-400 font-semibold">Projected Net Profit</p>
                  <p
                    className={`text-2xl font-black tracking-tight ${
                      h.projectedProfit >= 0
                        ? isSelected
                          ? "text-emerald-400"
                          : "text-emerald-500 dark:text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    {h.projectedProfit >= 0 ? "+" : "−"}₹
                    {Math.abs(h.projectedProfit).toLocaleString("en-IN")}
                  </p>
                </div>

                {/* Sub Stats */}
                <div className="space-y-1.5 pt-3 border-t border-slate-200 dark:border-slate-800/80 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Projected Sales:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      ₹{h.projectedIncome.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Projected Costs:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      ₹{h.projectedExpense.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Target Growth:</span>
                    <span className="font-extrabold text-cyan-500 dark:text-cyan-400">
                      +{h.cagrGrowthRate}%
                    </span>
                  </div>
                </div>

                {/* Recommendation trigger button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveRecHorizon(activeRecHorizon === key ? null : key);
                  }}
                  className={`mt-4 w-full py-2 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    isSelected
                      ? "bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/40"
                      : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                  }`}
                >
                  <span>💡 AI Advice</span>
                  <span>{activeRecHorizon === key ? "▲" : "▼"}</span>
                </button>

                {/* Expandable Recommendation Card */}
                {activeRecHorizon === key && (
                  <div className="mt-3 p-3 rounded-2xl bg-slate-950 text-slate-200 text-xs border border-violet-500/30 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="font-bold text-violet-400 mb-1 flex items-center gap-1">
                      <span>🤖 Action Strategy</span>
                    </p>
                    <p className="leading-relaxed text-[11px] text-slate-300">{h.recommendation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 3. Strategic AI Insights & Recommendations Banner ── */}
      {aiInsights.length > 0 && (
        <div className="bg-gradient-to-r from-violet-950/80 via-slate-900 to-indigo-950/80 border border-violet-500/30 rounded-3xl p-6 shadow-xl text-white space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">⚡</span>
              <h4 className="font-extrabold text-base gradient-text-violet">
                AI Growth Drivers & Tactical Insights
              </h4>
            </div>
            <span className="px-3 py-1 rounded-full text-[10px] font-black bg-violet-500/20 text-violet-300 border border-violet-500/40 uppercase">
              Auto-Generated
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {aiInsights.map((insight, idx) => {
              const borderColors: Record<string, string> = {
                positive: "border-emerald-500/40 bg-emerald-950/20",
                warning: "border-amber-500/40 bg-amber-950/20",
                opportunity: "border-cyan-500/40 bg-cyan-950/20",
                info: "border-violet-500/40 bg-violet-950/20",
              };
              const icons: Record<string, string> = {
                positive: "🟢",
                warning: "🟡",
                opportunity: "🚀",
                info: "ℹ️",
              };

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border backdrop-blur-md space-y-2 ${
                    borderColors[insight.type] || "border-slate-800 bg-slate-900/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs flex items-center gap-1.5">
                      <span>{icons[insight.type]}</span>
                      <span>{insight.title}</span>
                    </span>
                    {insight.metric && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/10 text-white">
                        {insight.metric}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
