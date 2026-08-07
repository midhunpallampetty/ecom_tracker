"use client";

import { useState } from "react";
import CashflowGraph from "./CashflowGraph";
import BloodFlowVisualizer from "./BloodFlowVisualizer";
import { CashflowGraphSkeleton } from "./SkeletonLoaders";

interface Transaction {
  _id: string;
  amount: number;
  type: "income" | "expense";
  createdAt: string;
}

interface CashflowHealthHubProps {
  transactions: Transaction[];
  loading?: boolean;
  compact?: boolean;
}

export default function CashflowHealthHub({
  transactions,
  loading = false,
  compact = false,
}: CashflowHealthHubProps) {
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(null);
  const [viewLayout, setViewLayout] = useState<"split" | "chart" | "bloodflow">("split");

  if (loading) {
    return <CashflowGraphSkeleton />;
  }

  return (
    <div className="space-y-3 w-full">
      {/* Top Controller Bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
          <h3 className="text-white font-extrabold text-sm tracking-tight gradient-text-violet">
            Cashflow & Vital Circulation Hub
          </h3>
        </div>

        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => setViewLayout("split")}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1 ${
              viewLayout === "split"
                ? "bg-violet-600 text-white shadow-md shadow-violet-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Side-by-side view"
          >
            <span>↔️</span>
            <span className="hidden sm:inline">Side-by-Side</span>
          </button>
          <button
            onClick={() => setViewLayout("chart")}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1 ${
              viewLayout === "chart"
                ? "bg-violet-600 text-white shadow-md shadow-violet-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Chart Only"
          >
            <span>📈</span>
            <span className="hidden sm:inline">Chart</span>
          </button>
          <button
            onClick={() => setViewLayout("bloodflow")}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1 ${
              viewLayout === "bloodflow"
                ? "bg-violet-600 text-white shadow-md shadow-violet-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Blood Flow Animation"
          >
            <span>🩸</span>
            <span className="hidden sm:inline">Blood Flow</span>
          </button>
        </div>
      </div>

      {/* Main Layout Container */}
      <div
        className={`grid gap-4 transition-all duration-300 ${
          viewLayout === "split"
            ? compact
              ? "grid-cols-1"
              : "grid-cols-1 lg:grid-cols-2"
            : "grid-cols-1"
        }`}
      >
        {(viewLayout === "split" || viewLayout === "chart") && (
          <div className="w-full">
            <CashflowGraph
              transactions={transactions}
              loading={loading}
              hoveredMonthIndex={hoveredMonthIdx}
              onHoverMonth={setHoveredMonthIdx}
            />
          </div>
        )}

        {(viewLayout === "split" || viewLayout === "bloodflow") && (
          <div className="w-full">
            <BloodFlowVisualizer
              transactions={transactions}
              hoveredMonthIndex={hoveredMonthIdx}
              onHoverMonth={setHoveredMonthIdx}
              compact={compact}
            />
          </div>
        )}
      </div>
    </div>
  );
}
