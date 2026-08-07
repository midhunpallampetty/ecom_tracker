"use client";

import { useState } from "react";
import { TrendAnalysisResult, ProjectedMonth } from "@/lib/projectionEngine";

interface AiGrowthProjectionChartProps {
  data: TrendAnalysisResult;
  selectedHorizon: "1m" | "3m" | "6m" | "12m";
  growthMultiplier: number;
  adScaling: number;
  onUpdateParams: (growthMult: number, adScale: number) => void;
}

type ScenarioType = "baseline" | "optimistic" | "conservative";

export default function AiGrowthProjectionChart({
  data,
  selectedHorizon,
  growthMultiplier,
  adScaling,
  onUpdateParams,
}: AiGrowthProjectionChartProps) {
  const [scenario, setScenario] = useState<ScenarioType>("baseline");
  const [showControls, setShowControls] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    monthLabel: string;
    income: number;
    expense: number;
    netProfit: number;
    cumulativeProfit: number;
    isProjected: boolean;
  } | null>(null);
  const [showDataTable, setShowDataTable] = useState(false);

  const { monthlyHistory, projections } = data;

  // Filter projected months based on selected horizon
  const horizonMonthsCount = {
    "1m": 1,
    "3m": 3,
    "6m": 6,
    "12m": 12,
  }[selectedHorizon];

  const visibleProjections = projections.slice(0, horizonMonthsCount);

  // Build unified dataset for chart (Historical + Projected)
  const combinedPoints: {
    monthLabel: string;
    monthKey: string;
    isProjected: boolean;
    income: number;
    expense: number;
    netProfit: number;
    cumulativeProfit: number;
  }[] = [];

  let cumulative = 0;

  // Historical points
  monthlyHistory.forEach((m) => {
    cumulative += m.netProfit;
    combinedPoints.push({
      monthLabel: m.monthLabel,
      monthKey: m.monthKey,
      isProjected: false,
      income: m.income,
      expense: m.expense,
      netProfit: m.netProfit,
      cumulativeProfit: cumulative,
    });
  });

  // Future projected points
  visibleProjections.forEach((p) => {
    const sc = p[scenario];
    combinedPoints.push({
      monthLabel: p.monthLabel,
      monthKey: p.monthKey,
      isProjected: true,
      income: sc.income,
      expense: sc.expense,
      netProfit: sc.netProfit,
      cumulativeProfit: sc.cumulativeProfit + cumulative,
    });
  });

  // Calculate SVG Dimensions & Scales
  const svgWidth = 800;
  const svgHeight = 320;
  const paddingX = 50;
  const paddingY = 40;

  const maxVal = Math.max(
    ...combinedPoints.map((pt) => Math.max(pt.income, pt.expense)),
    100000
  );
  const minVal = 0;

  const pointsCount = Math.max(combinedPoints.length, 2);
  const stepX = (svgWidth - paddingX * 2) / (pointsCount - 1);

  const getY = (val: number) => {
    const ratio = (val - minVal) / (maxVal - minVal || 1);
    return svgHeight - paddingY - ratio * (svgHeight - paddingY * 2);
  };

  const getX = (index: number) => paddingX + index * stepX;

  // Split historical vs projected points
  const historyCount = monthlyHistory.length;
  const historySvgPoints = combinedPoints.slice(0, historyCount);
  const projectionSvgPoints = combinedPoints.slice(Math.max(0, historyCount - 1));

  // Build Path d strings
  const buildPathD = (pts: typeof combinedPoints, valKey: "income" | "expense" | "netProfit", startIndexOffset = 0) => {
    return pts
      .map((pt, idx) => {
        const x = getX(idx + startIndexOffset);
        const y = getY(pt[valKey]);
        return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  };

  const incomeHistoryPath = buildPathD(historySvgPoints, "income", 0);
  const incomeProjPath = buildPathD(projectionSvgPoints, "income", Math.max(0, historyCount - 1));

  const expenseHistoryPath = buildPathD(historySvgPoints, "expense", 0);
  const expenseProjPath = buildPathD(projectionSvgPoints, "expense", Math.max(0, historyCount - 1));

  // Area Fill Path for projected revenue
  const buildAreaD = (pts: typeof combinedPoints, valKey: "income", startIndexOffset = 0) => {
    if (pts.length === 0) return "";
    const firstX = getX(startIndexOffset);
    const lastX = getX(pts.length - 1 + startIndexOffset);
    const bottomY = svgHeight - paddingY;

    const linePart = pts
      .map((pt, idx) => `${idx === 0 ? "M" : "L"} ${getX(idx + startIndexOffset)} ${getY(pt[valKey])}`)
      .join(" ");

    return `${linePart} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  const incomeProjArea = buildAreaD(projectionSvgPoints, "income", Math.max(0, historyCount - 1));

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6 animate-in fade-in duration-300">
      {/* ── Top Header Controls ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
              AI Growth Projection Engine
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-violet-500/20 text-violet-400 border border-violet-500/30">
              1M · 3M · 6M · 12M
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Solid line = Historical actuals | Dashed glowing path = AI projected forecast
          </p>
        </div>

        {/* Scenario Buttons & Param Slider Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setScenario("baseline")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                scenario === "baseline"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Baseline
            </button>
            <button
              onClick={() => setScenario("optimistic")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                scenario === "optimistic"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Optimistic (+15%)
            </button>
            <button
              onClick={() => setScenario("conservative")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                scenario === "conservative"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Conservative (-10%)
            </button>
          </div>

          <button
            onClick={() => setShowControls(!showControls)}
            className={`px-3 py-2 rounded-2xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              showControls
                ? "bg-violet-500/20 text-violet-300 border-violet-500/50"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
            }`}
          >
            <span>⚙️ Parameters</span>
            <span>{showControls ? "▲" : "▼"}</span>
          </button>
        </div>
      </div>

      {/* ── Parametric Sensitivity Drawer ── */}
      {showControls && (
        <div className="bg-slate-950 text-slate-100 border border-violet-500/30 rounded-2xl p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
              <span>🧪 Sensitivity Controls & Stress Testing</span>
            </span>
            <button
              onClick={() => onUpdateParams(1, 1)}
              className="text-[11px] text-cyan-400 font-bold hover:underline"
            >
              Reset to Defaults
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            {/* Slider 1: Organic Growth Multiplier */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-300">Revenue Growth Multiplier</span>
                <span className="font-bold text-emerald-400">{growthMultiplier}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={growthMultiplier}
                onChange={(e) => onUpdateParams(parseFloat(e.target.value), adScaling)}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                <span>0.5x Slowdown</span>
                <span>1.0x Current</span>
                <span>2.5x Hyper-growth</span>
              </div>
            </div>

            {/* Slider 2: Marketing & Ad Spend Scaling */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-300">Ad Spend & Expenses Scaling</span>
                <span className="font-bold text-cyan-400">{adScaling}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={adScaling}
                onChange={(e) => onUpdateParams(growthMultiplier, parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                <span>0.5x Cost Cut</span>
                <span>1.0x Normal</span>
                <span>2.0x Aggressive Marketing</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── High-Graphics Web3 SVG Chart ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4 border border-violet-500/20 shadow-inner">
        {/* Legend Overlay */}
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2 px-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_#10e89b]" />
              <span>Projected Revenue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-400 shadow-[0_0_8px_#f43f5e]" />
              <span>Projected Expenses</span>
            </div>
          </div>
          <div className="text-[11px] text-violet-400 font-mono">
            {selectedHorizon.toUpperCase()} FORECAST
          </div>
        </div>

        {/* SVG Container */}
        <div className="relative w-full overflow-x-auto scrollbar-none">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto min-w-[600px] overflow-visible"
          >
            <defs>
              {/* Gradient for projected revenue area */}
              <linearGradient id="revenueProjGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10e89b" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#10e89b" stopOpacity="0.0" />
              </linearGradient>
              {/* Glow filters */}
              <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glowRose" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const y = paddingY + pct * (svgHeight - paddingY * 2);
              const gridVal = Math.round(maxVal * (1 - pct));
              return (
                <g key={i}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={svgWidth - paddingX}
                    y2={y}
                    stroke="#334155"
                    strokeDasharray="4 4"
                    strokeOpacity="0.4"
                  />
                  <text
                    x={paddingX - 10}
                    y={y + 4}
                    fill="#64748b"
                    fontSize="10"
                    textAnchor="end"
                    className="font-mono"
                  >
                    ₹{gridVal >= 1000 ? `${Math.round(gridVal / 1000)}k` : gridVal}
                  </text>
                </g>
              );
            })}

            {/* Area Fill for Projected Income */}
            {incomeProjArea && <path d={incomeProjArea} fill="url(#revenueProjGrad)" />}

            {/* Historical Paths (Solid Lines) */}
            {incomeHistoryPath && (
              <path
                d={incomeHistoryPath}
                fill="none"
                stroke="#10e89b"
                strokeWidth="3"
                strokeLinecap="round"
                filter="url(#glowGreen)"
              />
            )}
            {expenseHistoryPath && (
              <path
                d={expenseHistoryPath}
                fill="none"
                stroke="#f43f5e"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeOpacity="0.9"
              />
            )}

            {/* Projected Paths (Dashed Glowing Lines) */}
            {incomeProjPath && (
              <path
                d={incomeProjPath}
                fill="none"
                stroke="#10e89b"
                strokeWidth="3.5"
                strokeDasharray="6 6"
                strokeLinecap="round"
                filter="url(#glowGreen)"
              />
            )}
            {expenseProjPath && (
              <path
                d={expenseProjPath}
                fill="none"
                stroke="#f43f5e"
                strokeWidth="2.5"
                strokeDasharray="5 5"
                strokeLinecap="round"
                strokeOpacity="0.8"
              />
            )}

            {/* Vertical Separator Line between Historical & Projected */}
            {historyCount > 0 && historyCount < combinedPoints.length && (
              <g>
                <line
                  x1={getX(historyCount - 1)}
                  y1={paddingY}
                  x2={getX(historyCount - 1)}
                  y2={svgHeight - paddingY}
                  stroke="#8b5cf6"
                  strokeDasharray="3 3"
                  strokeWidth="2"
                />
                <text
                  x={getX(historyCount - 1) + 6}
                  y={paddingY + 14}
                  fill="#c084fc"
                  fontSize="10"
                  fontWeight="bold"
                >
                  NOW → FORECAST
                </text>
              </g>
            )}

            {/* Data Point Circles & Milestone Nodes */}
            {combinedPoints.map((pt, idx) => {
              const x = getX(idx);
              const yInc = getY(pt.income);
              const yExp = getY(pt.expense);

              // Milestone markers (1M, 3M, 6M, 12M)
              const projIndex = idx - historyCount + 1;
              const isMilestone = pt.isProjected && [1, 3, 6, 12].includes(projIndex);

              return (
                <g key={idx} className="cursor-pointer">
                  {/* Income Circle */}
                  <circle
                    cx={x}
                    cy={yInc}
                    r={isMilestone ? 7 : pt.isProjected ? 5 : 4}
                    fill={pt.isProjected ? "#10e89b" : "#059669"}
                    stroke="#ffffff"
                    strokeWidth={isMilestone ? 3 : 1.5}
                    className="transition-transform duration-200 hover:scale-150"
                    onMouseEnter={() =>
                      setHoveredPoint({
                        x,
                        y: yInc,
                        monthLabel: pt.monthLabel,
                        income: pt.income,
                        expense: pt.expense,
                        netProfit: pt.netProfit,
                        cumulativeProfit: pt.cumulativeProfit,
                        isProjected: pt.isProjected,
                      })
                    }
                    onMouseLeave={() => setHoveredPoint(null)}
                  />

                  {/* Milestone Badge Text */}
                  {isMilestone && (
                    <g>
                      <rect
                        x={x - 14}
                        y={yInc - 24}
                        width="28"
                        height="16"
                        rx="6"
                        fill="#8b5cf6"
                      />
                      <text
                        x={x}
                        y={yInc - 13}
                        fill="#ffffff"
                        fontSize="9"
                        fontWeight="black"
                        textAnchor="middle"
                      >
                        {projIndex}M
                      </text>
                    </g>
                  )}

                  {/* Expense Circle */}
                  <circle
                    cx={x}
                    cy={yExp}
                    r={pt.isProjected ? 4 : 3}
                    fill="#f43f5e"
                    stroke="#ffffff"
                    strokeWidth="1"
                    onMouseEnter={() =>
                      setHoveredPoint({
                        x,
                        y: yExp,
                        monthLabel: pt.monthLabel,
                        income: pt.income,
                        expense: pt.expense,
                        netProfit: pt.netProfit,
                        cumulativeProfit: pt.cumulativeProfit,
                        isProjected: pt.isProjected,
                      })
                    }
                    onMouseLeave={() => setHoveredPoint(null)}
                  />

                  {/* X-Axis Month Label */}
                  <text
                    x={x}
                    y={svgHeight - paddingY + 20}
                    fill={pt.isProjected ? "#a7f3d0" : "#94a3b8"}
                    fontSize="10"
                    fontWeight={pt.isProjected ? "bold" : "normal"}
                    textAnchor="middle"
                  >
                    {pt.monthLabel}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Interactive Hover Tooltip */}
          {hoveredPoint && (
            <div
              className="absolute z-30 p-3 rounded-2xl bg-slate-950 text-white text-xs border border-violet-500/40 shadow-2xl space-y-1 backdrop-blur-xl animate-in fade-in duration-150 pointer-events-none"
              style={{
                left: `${(hoveredPoint.x / svgWidth) * 100}%`,
                top: `${(hoveredPoint.y / svgHeight) * 100 - 15}%`,
                transform: "translate(-50%, -100%)",
              }}
            >
              <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1">
                <span className="font-extrabold text-violet-300">{hoveredPoint.monthLabel}</span>
                <span
                  className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase ${
                    hoveredPoint.isProjected
                      ? "bg-violet-500/30 text-violet-300 border border-violet-500/40"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {hoveredPoint.isProjected ? "AI Projected" : "Actual"}
                </span>
              </div>
              <div className="text-[11px] space-y-0.5">
                <p className="text-emerald-400 font-bold">
                  Sales: ₹{hoveredPoint.income.toLocaleString("en-IN")}
                </p>
                <p className="text-rose-400 font-bold">
                  Expenses: ₹{hoveredPoint.expense.toLocaleString("en-IN")}
                </p>
                <p
                  className={`font-black ${
                    hoveredPoint.netProfit >= 0 ? "text-cyan-400" : "text-amber-400"
                  }`}
                >
                  Net Profit: ₹{hoveredPoint.netProfit.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Numerical Table View Toggle ── */}
      <div>
        <button
          onClick={() => setShowDataTable(!showDataTable)}
          className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
        >
          <span>📊 {showDataTable ? "Hide Detailed Data Table" : "Show Full Monthly Projections Breakdown Table"}</span>
        </button>

        {showDataTable && (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase font-black tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Month</th>
                  <th className="p-3">Type</th>
                  <th className="p-3 text-right">Projected Income</th>
                  <th className="p-3 text-right">Projected Expenses</th>
                  <th className="p-3 text-right">Net Profit</th>
                  <th className="p-3 text-right">Cumulative Reserves</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {combinedPoints.map((pt, i) => (
                  <tr
                    key={i}
                    className={
                      pt.isProjected
                        ? "bg-violet-50/50 dark:bg-violet-950/20 text-slate-900 dark:text-slate-100"
                        : "text-slate-600 dark:text-slate-400"
                    }
                  >
                    <td className="p-3 font-bold">{pt.monthLabel}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          pt.isProjected
                            ? "bg-violet-500/20 text-violet-600 dark:text-violet-300"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {pt.isProjected ? "AI Forecast" : "Historical"}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{pt.income.toLocaleString("en-IN")}
                    </td>
                    <td className="p-3 text-right font-bold text-rose-600 dark:text-rose-400">
                      ₹{pt.expense.toLocaleString("en-IN")}
                    </td>
                    <td
                      className={`p-3 text-right font-extrabold ${
                        pt.netProfit >= 0
                          ? "text-cyan-600 dark:text-cyan-400"
                          : "text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {pt.netProfit >= 0 ? "+" : ""}₹{pt.netProfit.toLocaleString("en-IN")}
                    </td>
                    <td className="p-3 text-right font-bold text-slate-800 dark:text-slate-200">
                      ₹{pt.cumulativeProfit.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
