"use client";

import { useState, useMemo } from "react";
import ChannelOrderTracker from "./ChannelOrderTracker";
import MonthlyProfitChart from "./MonthlyProfitChart";
import ExpenseLeakageChart from "./ExpenseLeakageChart";
import ChannelPerformanceChart from "./ChannelPerformanceChart";
import ProfitImprovementChart from "./ProfitImprovementChart";
import AiGrowthProjectionChart from "./AiGrowthProjectionChart";
import TrendAnalysisMetrics from "./TrendAnalysisMetrics";
import { analyzeDataAndGenerateProjections } from "@/lib/projectionEngine";
import { MonthlyProfitChartSkeleton, AiProjectionSkeleton } from "./SkeletonLoaders";

import CashflowHealthHub from "./CashflowHealthHub";

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
  orderId?: string;
  createdAt: string;
}

interface AnalyticsHubProps {
  transactions: Transaction[];
  loading?: boolean;
}

type AnalyticsSubTab = "projections" | "circulation" | "orders" | "monthly" | "leakage" | "channels" | "improvement";

const SUB_TABS: { id: AnalyticsSubTab; label: string; icon: string; badge?: string }[] = [
  { id: "projections", label: "AI Growth Forecast", icon: "🤖", badge: "1M/3M/6M/12M" },
  { id: "circulation", label: "Cashflow Blood Flow", icon: "🩸", badge: "Vital Circulation" },
  { id: "orders", label: "Order & Platform Tracker", icon: "📦", badge: "Meesho/FK/Amazon" },
  { id: "monthly", label: "Profit Trend", icon: "📈" },
  { id: "leakage", label: "Loss Leakage", icon: "🥧", badge: "Diagnostic" },
  { id: "channels", label: "Channel Matrix", icon: "🏬" },
  { id: "improvement", label: "Where to Improve", icon: "🎯", badge: "AI Insights" },
];

export default function AnalyticsHub({ transactions, loading = false }: AnalyticsHubProps) {
  const [activeSubTab, setActiveSubTab] = useState<AnalyticsSubTab>("projections");
  const [selectedHorizon, setSelectedHorizon] = useState<"1m" | "3m" | "6m" | "12m">("6m");
  const [growthMultiplier, setGrowthMultiplier] = useState(1);
  const [adScaling, setAdScaling] = useState(1);

  // Compute projections & data analysis dynamically
  const projectionData = useMemo(() => {
    return analyzeDataAndGenerateProjections(transactions, growthMultiplier, adScaling);
  }, [transactions, growthMultiplier, adScaling]);

  if (loading) {
    return activeSubTab === "projections" ? <AiProjectionSkeleton /> : <MonthlyProfitChartSkeleton />;
  }

  const handleUpdateParams = (growthMult: number, adScale: number) => {
    setGrowthMultiplier(growthMult);
    setAdScaling(adScale);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── Sub-Tab Navigation Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-3xl shadow-sm">
        <div className="flex items-center gap-1 overflow-x-auto p-1 scrollbar-none">
          {SUB_TABS.map((tab) => {
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 whitespace-nowrap relative ${
                  isActive
                    ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md shadow-slate-900/10"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                <span className="text-sm">{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                      isActive
                        ? "bg-violet-500 text-white"
                        : "bg-violet-100 dark:bg-violet-950/80 text-violet-600 dark:text-violet-300"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="px-3 py-1 flex items-center gap-2 text-xs font-semibold text-slate-400 border-l border-slate-100 dark:border-slate-800 hidden md:flex">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>High Graphics AI Engine</span>
        </div>
      </div>

      {/* ── Active Chart View Content ── */}
      <div>
        {activeSubTab === "projections" && (
          <div className="space-y-6">
            <TrendAnalysisMetrics
              data={projectionData}
              selectedHorizon={selectedHorizon}
              onSelectHorizon={setSelectedHorizon}
            />
            <AiGrowthProjectionChart
              data={projectionData}
              selectedHorizon={selectedHorizon}
              growthMultiplier={growthMultiplier}
              adScaling={adScaling}
              onUpdateParams={handleUpdateParams}
            />
          </div>
        )}
        {activeSubTab === "circulation" && (
          <CashflowHealthHub transactions={transactions} loading={loading} compact={false} />
        )}
        {activeSubTab === "orders" && <ChannelOrderTracker transactions={transactions} />}
        {activeSubTab === "monthly" && <MonthlyProfitChart transactions={transactions} />}
        {activeSubTab === "leakage" && <ExpenseLeakageChart transactions={transactions} />}
        {activeSubTab === "channels" && <ChannelPerformanceChart transactions={transactions} />}
        {activeSubTab === "improvement" && <ProfitImprovementChart transactions={transactions} />}
      </div>
    </div>
  );
}
