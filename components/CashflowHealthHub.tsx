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

type ViewLayout = "split" | "chart" | "bloodflow";

const VIEW_OPTIONS: { value: ViewLayout; label: string }[] = [
  { value: "bloodflow", label: "🩸 Blood Flow" },
  { value: "chart",     label: "📈 Chart Only" },
  { value: "split",     label: "↔ Both Views"  },
];

export default function CashflowHealthHub({
  transactions,
  loading = false,
  compact = false,
}: CashflowHealthHubProps) {
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(null);
  const [viewLayout, setViewLayout] = useState<ViewLayout>("bloodflow");

  if (loading) {
    return <CashflowGraphSkeleton />;
  }

  return (
    <div className="w-full space-y-2">
      {/* ── Header: label + dropdown ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981] shrink-0" />
          <span className="text-white font-bold text-xs truncate">
            Cashflow &amp; Circulation
          </span>
        </div>

        <select
          value={viewLayout}
          onChange={(e) => setViewLayout(e.target.value as ViewLayout)}
          className="shrink-0 bg-slate-950 border border-slate-700 text-slate-300 text-[11px] font-semibold rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 transition-all"
          aria-label="Select view layout"
        >
          {VIEW_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-slate-900">
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* ── Main content ── */}
      <div className="flex flex-col gap-3">
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
