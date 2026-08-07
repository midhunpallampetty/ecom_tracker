"use client";

import { useMemo, useState, useEffect, useRef } from "react";

interface Transaction {
  _id: string;
  amount: number;
  type: "income" | "expense";
  createdAt: string;
}

interface BloodFlowVisualizerProps {
  transactions: Transaction[];
  hoveredMonthIndex?: number | null;
  onHoverMonth?: (idx: number | null) => void;
  compact?: boolean;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface Particle {
  x: number;
  y: number;
  progress: number;
  speed: number;
  radius: number;
  type: "income" | "expense" | "plasma";
  opacity: number;
  laneOffset: number;
}

export default function BloodFlowVisualizer({
  transactions,
  hoveredMonthIndex = null,
  onHoverMonth,
  compact = false,
}: BloodFlowVisualizerProps) {
  const [activeViewMode, setActiveViewMode] = useState<"flow" | "ekg" | "diagnostics">("flow");
  const [internalHoverIdx, setInternalHoverIdx] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const effectiveHoverIdx = hoveredMonthIndex !== null ? hoveredMonthIndex : internalHoverIdx;

  // Build monthly data for last 6 months
  const monthlyData = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return { year: d.getFullYear(), month: d.getMonth(), income: 0, expense: 0, count: 0 };
    });

    transactions.forEach((t) => {
      const d = new Date(t.createdAt);
      const idx = months.findIndex(
        (m) => m.year === d.getFullYear() && m.month === d.getMonth()
      );
      if (idx === -1) return;
      if (t.type === "income") months[idx].income += t.amount;
      else months[idx].expense += t.amount;
      months[idx].count += 1;
    });

    return months.map((m) => ({
      label: MONTHS[m.month],
      income: m.income,
      expense: m.expense,
      net: m.income - m.expense,
      count: m.count,
    }));
  }, [transactions]);

  // Overall & Hovered Health Metrics
  const metrics = useMemo(() => {
    const activeSet = effectiveHoverIdx !== null ? [monthlyData[effectiveHoverIdx]] : monthlyData;
    const totalInc = activeSet.reduce((s, m) => s + m.income, 0);
    const totalExp = activeSet.reduce((s, m) => s + m.expense, 0);
    const netFlow = totalInc - totalExp;
    const turnover = totalInc + totalExp;

    // SpO2 Oxygenation level (0 - 100%)
    const oxygenation = turnover > 0 ? Math.min(100, Math.max(5, Math.round((totalInc / turnover) * 100))) : 50;

    // BPM calculation based on net flow ratio & transaction frequency
    const ratio = turnover > 0 ? totalInc / turnover : 0.5;
    let bpm = 72; // baseline
    if (ratio > 0.65) bpm = Math.min(115, Math.round(72 + (ratio - 0.5) * 65));
    else if (ratio < 0.45) bpm = Math.max(45, Math.round(72 - (0.5 - ratio) * 55));
    else bpm = Math.round(68 + (ratio - 0.5) * 20);

    // Peak values for mmHg vascular pressure proxy
    const maxInc = Math.max(...monthlyData.map((m) => m.income), 1);
    const maxExp = Math.max(...monthlyData.map((m) => m.expense), 1);
    const systolic = Math.min(180, Math.max(90, Math.round(110 + (totalInc / maxInc) * 30)));
    const diastolic = Math.min(120, Math.max(60, Math.round(70 + (totalExp / maxExp) * 25)));

    // Vitality score (0 - 100)
    let vitalityScore = Math.round(oxygenation * 0.7 + (netFlow >= 0 ? 30 : Math.max(0, 30 - Math.abs(netFlow / maxInc) * 30)));
    vitalityScore = Math.min(100, Math.max(10, vitalityScore));

    // Health Category & Colors
    let statusText = "Healthy Circulation";
    let badgeBg = "bg-emerald-500/20 border-emerald-500/40 text-emerald-400";
    let glowColor = "#10b981";

    if (vitalityScore >= 85) {
      statusText = "Hyper-Oxygenated Flow";
      badgeBg = "bg-cyan-500/20 border-cyan-500/40 text-cyan-300";
      glowColor = "#06b6d4";
    } else if (vitalityScore >= 65) {
      statusText = "Healthy Circulation";
      badgeBg = "bg-emerald-500/20 border-emerald-500/40 text-emerald-400";
      glowColor = "#10b981";
    } else if (vitalityScore >= 45) {
      statusText = "Constricted Flow";
      badgeBg = "bg-amber-500/20 border-amber-500/40 text-amber-400";
      glowColor = "#f59e0b";
    } else {
      statusText = "Anemic Cash Burn";
      badgeBg = "bg-rose-500/20 border-rose-500/40 text-rose-400";
      glowColor = "#f43f5e";
    }

    return {
      totalInc,
      totalExp,
      netFlow,
      turnover,
      oxygenation,
      bpm,
      systolic,
      diastolic,
      vitalityScore,
      statusText,
      badgeBg,
      glowColor,
    };
  }, [monthlyData, effectiveHoverIdx]);

  // Canvas particle engine animation effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    // Resize for high DPI crisp rendering
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || (compact ? 340 : 440);
    const height = compact ? 170 : 210;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Initialize particles
    const particleCount = compact ? 26 : 38;
    const particles: Particle[] = Array.from({ length: particleCount }, (_, i) => ({
      x: 0,
      y: 0,
      progress: Math.random(),
      speed: (0.003 + Math.random() * 0.004) * (metrics.bpm / 72),
      radius: 2.5 + Math.random() * 2.5,
      type: i % 2 === 0 ? "income" : "expense",
      opacity: 0.5 + Math.random() * 0.5,
      laneOffset: (Math.random() - 0.5) * 12,
    }));

    // Vascular control points
    const cX = width / 2;
    const cY = height / 2 + 10;

    // Bezier path generators
    const getArterialPoint = (p: number, laneOffset: number) => {
      // Inflow from Top-Left (0, 20) -> Core Pump (cX, cY)
      const p0 = { x: 20, y: 25 };
      const p1 = { x: cX * 0.4, y: 30 };
      const p2 = { x: cX * 0.7, y: cY - 10 };
      const p3 = { x: cX, y: cY };

      const u = 1 - p;
      const x = u * u * u * p0.x + 3 * u * u * p * p1.x + 3 * u * p * p * p2.x + p * p * p * p3.x;
      const y = u * u * u * p0.y + 3 * u * u * p * p1.y + 3 * u * p * p * p2.y + p * p * p * p3.y;

      return { x: x + laneOffset * (1 - p), y: y + laneOffset * (1 - p) };
    };

    const getVenousPoint = (p: number, laneOffset: number) => {
      // Outflow from Core Pump (cX, cY) -> Bottom-Right (width - 20, height - 25)
      const p0 = { x: cX, y: cY };
      const p1 = { x: cX + (width - cX) * 0.3, y: cY + 15 };
      const p2 = { x: cX + (width - cX) * 0.7, y: height - 25 };
      const p3 = { x: width - 20, y: height - 25 };

      const u = 1 - p;
      const x = u * u * u * p0.x + 3 * u * u * p * p1.x + 3 * u * p * p * p2.x + p * p * p * p3.x;
      const y = u * u * u * p0.y + 3 * u * u * p * p1.y + 3 * u * p * p * p2.y + p * p * p * p3.y;

      return { x: x + laneOffset * p, y: y + laneOffset * p };
    };

    const render = () => {
      time += 0.016;
      ctx.clearRect(0, 0, width, height);

      // Pulse expansion scale factor based on BPM
      const pulseSpeed = (metrics.bpm / 60) * Math.PI * 2;
      const pulseFactor = 1 + Math.sin(time * pulseSpeed) * 0.08;
      const heartPulse = Math.pow(Math.abs(Math.sin(time * (pulseSpeed / 2))), 8);

      // ── 1. Draw EKG Waveform Line at top ──
      ctx.beginPath();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = metrics.glowColor;
      ctx.globalAlpha = 0.4;
      const scanX = (time * 120) % width;

      for (let x = 0; x < width; x += 3) {
        let ekgY = 18;
        const dx = Math.abs(x - scanX);
        if (dx < 35) {
          const norm = (35 - dx) / 35;
          if (dx > 20 && dx < 28) ekgY -= 12 * norm;
          else if (dx >= 12 && dx <= 20) ekgY += 18 * norm;
          else if (dx < 12) ekgY -= 6 * norm;
        }
        if (x === 0) ctx.moveTo(x, ekgY);
        else ctx.lineTo(x, ekgY);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;

      // ── 2. Draw Vascular Tubes (Arterial Inflow & Venous Outflow) ──
      // Inflow Vessel (Artery) - Green/Cyan
      ctx.save();
      ctx.beginPath();
      ctx.lineWidth = (compact ? 16 : 22) * pulseFactor;
      ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(16, 185, 129, 0.15)";
      const inP0 = getArterialPoint(0, 0);
      ctx.moveTo(inP0.x, inP0.y);
      for (let p = 0.05; p <= 1; p += 0.05) {
        const pt = getArterialPoint(p, 0);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();

      // Inflow Vessel Inner Glow Line
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(16, 185, 129, 0.6)";
      ctx.stroke();

      // Outflow Vessel (Vein) - Red/Rose
      ctx.beginPath();
      ctx.lineWidth = (compact ? 16 : 22) * pulseFactor;
      ctx.strokeStyle = "rgba(244, 63, 94, 0.15)";
      const outP0 = getVenousPoint(0, 0);
      ctx.moveTo(outP0.x, outP0.y);
      for (let p = 0.05; p <= 1; p += 0.05) {
        const pt = getVenousPoint(p, 0);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();

      // Outflow Vessel Inner Glow Line
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(244, 63, 94, 0.6)";
      ctx.stroke();
      ctx.restore();

      // ── 3. Central Cardiac Cash Node (Heart Pump) ──
      const heartRadius = (compact ? 22 : 28) * (1 + heartPulse * 0.18);

      // Soundwave Outer Glow Rings
      for (let r = 1; r <= 3; r++) {
        ctx.beginPath();
        ctx.arc(cX, cY, heartRadius + r * 8 * (1 + heartPulse * 0.5), 0, Math.PI * 2);
        ctx.strokeStyle = metrics.glowColor;
        ctx.globalAlpha = 0.15 / r;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Core Heart Chamber Gradient
      ctx.globalAlpha = 1;
      const heartGrad = ctx.createRadialGradient(cX, cY, 2, cX, cY, heartRadius);
      if (metrics.vitalityScore >= 65) {
        heartGrad.addColorStop(0, "#34d399");
        heartGrad.addColorStop(0.6, "#059669");
        heartGrad.addColorStop(1, "#064e3b");
      } else if (metrics.vitalityScore >= 45) {
        heartGrad.addColorStop(0, "#fbbf24");
        heartGrad.addColorStop(0.6, "#d97706");
        heartGrad.addColorStop(1, "#78350f");
      } else {
        heartGrad.addColorStop(0, "#fb7185");
        heartGrad.addColorStop(0.6, "#e11d48");
        heartGrad.addColorStop(1, "#4c0519");
      }

      ctx.beginPath();
      ctx.arc(cX, cY, heartRadius, 0, Math.PI * 2);
      ctx.fillStyle = heartGrad;
      ctx.shadowColor = metrics.glowColor;
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Heart Chamber Pulse Icon / Symbol
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${metrics.bpm} BPM`, cX, cY);

      // ── 4. Render Flowing Blood Cell Particles ──
      particles.forEach((pt) => {
        // Speed scaling based on income/expense momentum
        const speedMult = pt.type === "income"
          ? (metrics.totalInc > 0 ? 1.2 : 0.6)
          : (metrics.totalExp > 0 ? 1.2 : 0.6);

        pt.progress += pt.speed * speedMult * (metrics.bpm / 72);
        if (pt.progress > 1) pt.progress = 0;

        let pos = { x: 0, y: 0 };
        if (pt.type === "income") {
          pos = getArterialPoint(pt.progress, pt.laneOffset);
        } else {
          pos = getVenousPoint(pt.progress, pt.laneOffset);
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, pt.radius * pulseFactor, 0, Math.PI * 2);

        if (pt.type === "income") {
          ctx.fillStyle = "#34d399";
          ctx.shadowColor = "#10b981";
          ctx.shadowBlur = 8;
        } else {
          ctx.fillStyle = "#f43f5e";
          ctx.shadowColor = "#fb7185";
          ctx.shadowBlur = 8;
        }

        ctx.globalAlpha = pt.opacity;
        ctx.fill();
        ctx.restore();
      });

      // ── 5. Vessel Labels ──
      ctx.font = "bold 9px sans-serif";
      ctx.fillStyle = "#34d399";
      ctx.fillText("ARTERIAL INFLOW (INCOME)", 15, 12);

      ctx.fillStyle = "#f43f5e";
      ctx.textAlign = "right";
      ctx.fillText("VENOUS OUTFLOW (EXPENSE)", width - 15, height - 8);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [metrics, compact]);

  const handleSetHover = (idx: number | null) => {
    setInternalHoverIdx(idx);
    if (onHoverMonth) onHoverMonth(idx);
  };

  const formatK = (v: number) => (v >= 1000 ? `₹${(v / 1000).toFixed(1)}k` : `₹${v.toFixed(0)}`);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl w-full relative overflow-hidden flex flex-col justify-between">
      {/* Dynamic Background Glow */}
      <div
        className="absolute -right-16 -top-16 w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-20 transition-all duration-500"
        style={{ backgroundColor: metrics.glowColor }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-2 z-10 gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider truncate">
              Cashflow Circulation
            </p>
          </div>
          <p className="text-white font-extrabold text-xs flex items-center gap-1 mt-0.5 flex-wrap">
            <span>Financial Blood Flow</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${metrics.badgeBg} font-bold whitespace-nowrap`}>
              {metrics.vitalityScore}% SpO₂
            </span>
          </p>
        </div>

        {/* View Mode — compact select dropdown */}
        <select
          value={activeViewMode}
          onChange={(e) => setActiveViewMode(e.target.value as "flow" | "ekg" | "diagnostics")}
          className="shrink-0 bg-slate-950 border border-slate-700 text-slate-300 text-[11px] font-semibold rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
          aria-label="Select blood flow view mode"
        >
          <option value="flow" className="bg-slate-900">🩸 Circulation</option>
          <option value="ekg" className="bg-slate-900">💓 Vitals</option>
          <option value="diagnostics" className="bg-slate-900">📋 Diagnostics</option>
        </select>
      </div>

      {/* Main Interactive Visual Content Area */}
      <div className="relative z-10 flex flex-col justify-center">
        {activeViewMode === "flow" && (
          <div className="relative w-full flex flex-col items-center">
            {/* Canvas Blood Flow */}
            <canvas
              ref={canvasRef}
              className="w-full rounded-2xl bg-slate-950/80 border border-slate-800/80 cursor-crosshair shadow-inner"
              style={{ height: compact ? "170px" : "200px" }}
            />

            {/* Month Hover Sync Bar */}
            <div className="flex items-center justify-between w-full mt-2 gap-1 px-1">
              {monthlyData.map((m, idx) => {
                const isSelected = effectiveHoverIdx === idx;
                return (
                  <button
                    key={idx}
                    onMouseEnter={() => handleSetHover(idx)}
                    onMouseLeave={() => handleSetHover(null)}
                    onClick={() => handleSetHover(isSelected ? null : idx)}
                    className={`flex-1 py-1 px-1 rounded-lg text-[10px] font-bold transition-all duration-150 text-center border ${
                      isSelected
                        ? "bg-violet-600 text-white border-violet-400 shadow-md shadow-violet-500/20 scale-105"
                        : "bg-slate-950/50 text-slate-400 border-slate-800 hover:bg-slate-800/50 hover:text-slate-200"
                    }`}
                  >
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeViewMode === "ekg" && (
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cash Velocity (BPM)</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-extrabold text-emerald-400">{metrics.bpm}</span>
                  <span className="text-[10px] text-slate-400">PULSE / MIN</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {metrics.bpm > 95 ? "⚡ High Transaction Velocity" : metrics.bpm < 60 ? "🐢 Sluggish Liquidity" : "Steady Flow Rate"}
                </p>
              </div>

              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Oxygenation (SpO₂)</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-extrabold text-cyan-400">{metrics.oxygenation}%</span>
                  <span className="text-[10px] text-slate-400">INFLOW RATIO</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${metrics.oxygenation}%`, backgroundColor: metrics.glowColor }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vascular Pressure</p>
                <p className="text-sm font-extrabold text-white mt-0.5">
                  {metrics.systolic} / {metrics.diastolic} <span className="text-xs font-normal text-slate-400">mmHg eq.</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stamina Score</p>
                <p className="text-sm font-extrabold text-violet-400">{metrics.vitalityScore} / 100</p>
              </div>
            </div>
          </div>
        )}

        {activeViewMode === "diagnostics" && (
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Circulation Status</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-bold ${metrics.badgeBg}`}>
                {metrics.statusText}
              </span>
            </div>

            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800/80 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Arterial Inflow (Income):</span>
                <span className="text-emerald-400 font-bold">{formatK(metrics.totalInc)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Venous Outflow (Expense):</span>
                <span className="text-rose-400 font-bold">{formatK(metrics.totalExp)}</span>
              </div>
              <div className="flex justify-between text-xs pt-1 border-t border-slate-800">
                <span className="text-slate-300 font-bold">Net Balance Pulse:</span>
                <span className={`font-extrabold ${metrics.netFlow >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                  {metrics.netFlow >= 0 ? "+" : ""}{formatK(metrics.netFlow)}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 italic">
              {metrics.vitalityScore >= 80
                ? "💡 Optimal cash oxygenation! Income comfortably exceeds operating outflow."
                : metrics.vitalityScore >= 50
                ? "⚡ Moderate cash flow velocity. Monitor operating expense spikes to maintain stamina."
                : "⚠️ Cash flow restriction detected! Venous outflow exceeds arterial inflow."}
            </p>
          </div>
        )}
      </div>

      {/* Footer Diagnostic Bar */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/80 text-[11px] z-10">
        <span className="text-slate-400 font-medium">
          {effectiveHoverIdx !== null ? `Inspecting ${monthlyData[effectiveHoverIdx].label}` : "Live 6-Month Circulation"}
        </span>
        <span className="font-bold text-emerald-400">
          Pulse: {metrics.bpm} BPM
        </span>
      </div>
    </div>
  );
}
