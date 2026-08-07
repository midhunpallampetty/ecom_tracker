"use client";

import { useMemo, useState } from "react";
import { CashflowGraphSkeleton } from "./SkeletonLoaders";

interface Transaction {
  _id: string;
  amount: number;
  type: "income" | "expense";
  createdAt: string;
}

interface CashflowGraphProps {
  transactions: Transaction[];
  loading?: boolean;
  hoveredMonthIndex?: number | null;
  onHoverMonth?: (idx: number | null) => void;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                 "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function CashflowGraph({
  transactions,
  loading = false,
  hoveredMonthIndex = null,
  onHoverMonth,
}: CashflowGraphProps) {
  const [internalHoverIdx, setInternalHoverIdx] = useState<number | null>(null);

  const activeHoverIdx = hoveredMonthIndex !== null ? hoveredMonthIndex : internalHoverIdx;

  const handleHoverChange = (idx: number | null) => {
    setInternalHoverIdx(idx);
    if (onHoverMonth) onHoverMonth(idx);
  };

  if (loading) {
    return <CashflowGraphSkeleton />;
  }

  const data = useMemo(() => {
    const now = new Date();
    // Build last 6 months
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return { year: d.getFullYear(), month: d.getMonth(), income: 0, expense: 0 };
    });

    transactions.forEach((t) => {
      const d = new Date(t.createdAt);
      const idx = months.findIndex(
        (m) => m.year === d.getFullYear() && m.month === d.getMonth()
      );
      if (idx === -1) return;
      if (t.type === "income") months[idx].income += t.amount;
      else months[idx].expense += t.amount;
    });

    return months.map((m) => ({
      label: MONTHS[m.month],
      income: m.income,
      expense: m.expense,
      net: m.income - m.expense,
    }));
  }, [transactions]);

  const W = 420;
  const H = 180;
  const PAD = { top: 20, right: 12, bottom: 28, left: 8 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const allValues = data.flatMap((d) => [d.income, d.expense]);
  const maxVal = Math.max(...allValues, 1);
  const minVal = 0;
  const range = maxVal - minVal || 1;

  const toX = (i: number) => PAD.left + (i / (data.length - 1)) * chartW;
  const toY = (v: number) => PAD.top + (1 - (v - minVal) / range) * chartH;

  const buildPath = (values: number[]) => {
    if (values.length < 2) return "";
    const pts = values.map((v, i) => [toX(i), toY(v)] as [number, number]);
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const cp1x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * 0.4;
      const cp2x = pts[i + 1][0] - (pts[i + 1][0] - pts[i][0]) * 0.4;
      d += ` C ${cp1x} ${pts[i][1]} ${cp2x} ${pts[i + 1][1]} ${pts[i + 1][0]} ${pts[i + 1][1]}`;
    }
    return d;
  };

  const buildArea = (values: number[], pathD: string) => {
    if (!pathD) return "";
    const lastX = toX(values.length - 1);
    const baseline = PAD.top + chartH;
    return `${pathD} L ${lastX} ${baseline} L ${PAD.left} ${baseline} Z`;
  };

  const incomeValues = data.map((d) => d.income);
  const expenseValues = data.map((d) => d.expense);
  const incomePath = buildPath(incomeValues);
  const expensePath = buildPath(expenseValues);
  const incomeArea = buildArea(incomeValues, incomePath);
  const expenseArea = buildArea(expenseValues, expensePath);

  const formatK = (v: number) =>
    v >= 1000 ? `₹${(v / 1000).toFixed(1)}k` : `₹${v.toFixed(0)}`;

  const hovered = activeHoverIdx !== null ? data[activeHoverIdx] : null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Cashflow</p>
          <p className="text-white font-bold text-sm">Last 6 Months</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-3 h-0.5 rounded-full bg-emerald-400 inline-block" />
            Income
          </span>
          <span className="flex items-center gap-1 text-rose-400">
            <span className="w-3 h-0.5 rounded-full bg-rose-400 inline-block" />
            Expense
          </span>
        </div>
      </div>

      {/* Tooltip */}
      <div
        className={`transition-all duration-200 mb-2 text-center ${
          hovered ? "opacity-100" : "opacity-0"
        }`}
        style={{ minHeight: "36px" }}
      >
        {hovered && (
          <div className="inline-flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5">
            <span className="text-white text-xs font-semibold">{hovered.label}</span>
            <span className="text-emerald-400 text-xs">↑ {formatK(hovered.income)}</span>
            <span className="text-rose-400 text-xs">↓ {formatK(hovered.expense)}</span>
            <span
              className={`text-xs font-bold ${hovered.net >= 0 ? "text-emerald-300" : "text-rose-300"}`}
            >
              {hovered.net >= 0 ? "+" : ""}
              {formatK(hovered.net)}
            </span>
          </div>
        )}
      </div>

      {/* SVG Chart */}
      <div className="relative">
        <svg
          width="100%"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ display: "block", overflow: "visible" }}
        >
          <defs>
            {/* Income gradient */}
            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
            </linearGradient>
            {/* Expense gradient */}
            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.02" />
            </linearGradient>
            {/* Glow filters */}
            <filter id="incomeGlow">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="expenseGlow">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Horizontal grid lines */}
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

          {/* Area fills */}
          {incomeArea && (
            <path d={incomeArea} fill="url(#incomeGrad)" />
          )}
          {expenseArea && (
            <path d={expenseArea} fill="url(#expenseGrad)" />
          )}

          {/* Expense line */}
          {expensePath && (
            <path
              d={expensePath}
              fill="none"
              stroke="#f43f5e"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#expenseGlow)"
            />
          )}

          {/* Income line */}
          {incomePath && (
            <path
              d={incomePath}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#incomeGlow)"
            />
          )}

          {/* Data points + hover zones */}
          {data.map((d, i) => {
            const x = toX(i);
            const iy = toY(d.income);
            const ey = toY(d.expense);
            const isHovered = activeHoverIdx === i;
            return (
              <g key={i}>
                {/* Hover vertical line */}
                {isHovered && (
                  <line
                    x1={x} y1={PAD.top}
                    x2={x} y2={PAD.top + chartH}
                    stroke="#475569"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                )}

                {/* Income dot */}
                <circle
                  cx={x} cy={iy} r={isHovered ? 5 : 3}
                  fill={isHovered ? "#10b981" : "#064e3b"}
                  stroke="#10b981"
                  strokeWidth={isHovered ? 2 : 1.5}
                  style={{ transition: "r 0.15s" }}
                />

                {/* Expense dot */}
                <circle
                  cx={x} cy={ey} r={isHovered ? 5 : 3}
                  fill={isHovered ? "#f43f5e" : "#4c0519"}
                  stroke="#f43f5e"
                  strokeWidth={isHovered ? 2 : 1.5}
                  style={{ transition: "r 0.15s" }}
                />

                {/* Invisible hover target */}
                <rect
                  x={x - chartW / (data.length * 2)}
                  y={PAD.top}
                  width={chartW / data.length}
                  height={chartH}
                  fill="transparent"
                  style={{ cursor: "crosshair" }}
                  onMouseEnter={() => handleHoverChange(i)}
                  onMouseLeave={() => handleHoverChange(null)}
                  onTouchStart={() => handleHoverChange(i)}
                  onTouchEnd={() => handleHoverChange(null)}
                />

                {/* Month label */}
                <text
                  x={x}
                  y={H - 4}
                  textAnchor="middle"
                  fontSize="9"
                  fill={isHovered ? "#e2e8f0" : "#64748b"}
                  fontFamily="inherit"
                  style={{ transition: "fill 0.15s" }}
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Bottom summary */}
      <div className="flex justify-between mt-2 pt-2 border-t border-slate-800">
        {data.slice(-3).map((d, i) => (
          <div key={i} className="text-center">
            <p className="text-slate-500 text-xs">{d.label}</p>
            <p
              className={`text-xs font-bold ${
                d.net >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {d.net >= 0 ? "+" : ""}{formatK(d.net)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
