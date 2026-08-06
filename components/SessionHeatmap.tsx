"use client";

import { useState } from "react";

export interface HeatmapLocation {
  city: string;
  region: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  count: number;
  intensity: number; // 0.0 to 1.0
  lastLogin: string;
  topDevice: string;
}

interface SessionHeatmapProps {
  locations: HeatmapLocation[];
  loading?: boolean;
}

export default function SessionHeatmap({ locations, loading }: SessionHeatmapProps) {
  const [hoveredLoc, setHoveredLoc] = useState<HeatmapLocation | null>(null);
  const [filterRegion, setFilterRegion] = useState<"all" | "india" | "global">("all");

  // Equirectangular projection coordinates (1000 x 500 viewBox)
  const getSvgCoordinates = (lat: number, lon: number) => {
    const x = ((lon + 180) / 360) * 1000;
    const y = ((90 - lat) / 180) * 500;
    return { x, y };
  };

  const filteredLocations = locations.filter((loc) => {
    if (filterRegion === "india") return loc.countryCode === "IN" || loc.country === "India";
    if (filterRegion === "global") return loc.countryCode !== "IN" && loc.country !== "India";
    return true;
  });

  const totalLogins = locations.reduce((sum, l) => sum + l.count, 0);

  const getIntensityColor = (intensity: number) => {
    if (intensity >= 0.75) return { fill: "#f59e0b", glow: "#f59e0b", label: "Very High" }; // Amber
    if (intensity >= 0.45) return { fill: "#8b5cf6", glow: "#8b5cf6", label: "High" };      // Violet
    if (intensity >= 0.20) return { fill: "#06b6d4", glow: "#06b6d4", label: "Moderate" };  // Cyan
    return { fill: "#10b981", glow: "#10b981", label: "Low" };                              // Emerald
  };

  return (
    <div className="bg-slate-900/90 border border-violet-500/20 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-6">
      {/* ── Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🌍</span>
            <h3 className="text-white font-extrabold text-lg tracking-tight">
              Login Geolocation Heatmap
            </h3>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Visualizing login frequency and access intensity across geographic locations
          </p>
        </div>

        {/* Region Filter Pills */}
        <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-xl p-1 gap-1 self-start sm:self-auto">
          <button
            onClick={() => setFilterRegion("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterRegion === "all"
                ? "bg-violet-500 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            All ({locations.length})
          </button>
          <button
            onClick={() => setFilterRegion("india")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterRegion === "india"
                ? "bg-cyan-500 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            🇮🇳 India
          </button>
          <button
            onClick={() => setFilterRegion("global")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterRegion === "global"
                ? "bg-amber-500 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            🌐 International
          </button>
        </div>
      </div>

      {/* ── Heatmap SVG Canvas Container ── */}
      <div className="relative w-full aspect-[2/1] bg-slate-950 rounded-2xl border border-slate-800/80 overflow-hidden shadow-inner flex items-center justify-center">
        {/* Subtle grid pattern background */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(#8b5cf6 1px, transparent 1px), radial-gradient(#06b6d4 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            backgroundPosition: "0 0, 12px 12px",
          }}
        />

        {/* World Map SVG Outline */}
        <svg
          viewBox="0 0 1000 500"
          className="w-full h-full object-cover opacity-80"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            {/* Pulsating Heat Map Marker Gradient */}
            <radialGradient id="heat-emerald" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="heat-cyan" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="heat-violet" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.95" />
              <stop offset="60%" stopColor="#8b5cf6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="heat-amber" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="1" />
              <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Continent / Globe SVG outlines representation */}
          <g stroke="#334155" strokeWidth="0.8" fill="#0f172a" opacity="0.6">
            {/* North America */}
            <path d="M 120,80 Q 180,60 250,90 T 300,180 Q 240,240 180,220 Q 110,180 120,80 Z" />
            {/* South America */}
            <path d="M 280,260 Q 340,270 350,340 T 300,450 Q 250,420 260,330 Z" />
            {/* Europe */}
            <path d="M 450,70 Q 530,60 560,110 T 520,160 Q 460,150 450,70 Z" />
            {/* Africa */}
            <path d="M 460,180 Q 560,170 580,250 T 530,380 Q 460,370 460,180 Z" />
            {/* Asia & India */}
            <path d="M 570,80 Q 750,50 850,120 T 780,260 Q 650,250 570,80 Z" />
            {/* India Subcontinent Focus */}
            <path d="M 670,180 Q 720,180 730,240 T 680,290 Q 660,250 670,180 Z" fill="#1e293b" stroke="#475569" strokeWidth="1" />
            {/* Australia */}
            <path d="M 800,320 Q 900,310 910,380 T 820,430 Q 780,390 800,320 Z" />
          </g>

          {/* Equator & Prime Meridian Grid Lines */}
          <line x1="0" y1="250" x2="1000" y2="250" stroke="#1e293b" strokeDasharray="4 4" strokeWidth="1" />
          <line x1="500" y1="0" x2="500" y2="500" stroke="#1e293b" strokeDasharray="4 4" strokeWidth="1" />

          {/* ── Render Heatmap Nodes ── */}
          {filteredLocations.map((loc, idx) => {
            const { x, y } = getSvgCoordinates(loc.latitude, loc.longitude);
            const color = getIntensityColor(loc.intensity);

            // Radius scales with count and intensity
            const radius = Math.max(16, Math.min(48, 16 + loc.intensity * 32));
            const innerRadius = Math.max(4, Math.min(10, 4 + loc.intensity * 6));

            let gradId = "heat-emerald";
            if (loc.intensity >= 0.75) gradId = "heat-amber";
            else if (loc.intensity >= 0.45) gradId = "heat-violet";
            else if (loc.intensity >= 0.20) gradId = "heat-cyan";

            return (
              <g
                key={`${loc.city}-${loc.country}-${idx}`}
                className="cursor-pointer transition-all duration-300"
                onMouseEnter={() => setHoveredLoc(loc)}
                onMouseLeave={() => setHoveredLoc(null)}
              >
                {/* Outer Heat Aura Halo */}
                <circle
                  cx={x}
                  cy={y}
                  r={radius}
                  fill={`url(#${gradId})`}
                  className="animate-pulse"
                  style={{ animationDuration: `${2 + (1 - loc.intensity) * 2}s` }}
                />

                {/* Ring Indicator */}
                <circle
                  cx={x}
                  cy={y}
                  r={radius * 0.5}
                  fill="none"
                  stroke={color.fill}
                  strokeWidth="1.5"
                  opacity="0.6"
                />

                {/* Core Center Pulse */}
                <circle
                  cx={x}
                  cy={y}
                  r={innerRadius}
                  fill={color.fill}
                  className="transition-transform hover:scale-150"
                  style={{ filter: `drop-shadow(0 0 8px ${color.glow})` }}
                />
              </g>
            );
          })}
        </svg>

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-slate-700 border-t-violet-400 rounded-full animate-spin" />
            <p className="text-slate-400 text-xs font-medium">Rendering Geolocation Heatmap…</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredLocations.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-slate-950/90">
            <div className="text-3xl mb-2">📍</div>
            <p className="text-slate-300 font-semibold text-sm">No Location Records Found</p>
            <p className="text-slate-500 text-xs mt-1">Log in to generate location activity heatmap points.</p>
          </div>
        )}

        {/* ── Floating Hover Tooltip Card ── */}
        {hoveredLoc && (
          <div className="absolute top-4 right-4 bg-slate-900/95 border border-violet-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl w-64 animate-in fade-in zoom-in-95 pointer-events-none z-20">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-slate-200 font-bold text-sm truncate">
                {hoveredLoc.city}, {hoveredLoc.country}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30 shrink-0">
                {getIntensityColor(hoveredLoc.intensity).label} Heat
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Total Logins:</span>
                <span className="text-white font-semibold">{hoveredLoc.count} times</span>
              </div>
              <div className="flex justify-between">
                <span>Top Device Used:</span>
                <span className="text-cyan-400 font-semibold capitalize">
                  {hoveredLoc.topDevice === "phone"
                    ? "📱 Mobile/Phone"
                    : hoveredLoc.topDevice === "tablet"
                    ? "📱 Tablet"
                    : "💻 Desktop"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Coordinates:</span>
                <span className="text-slate-300 font-mono text-[10px]">
                  {hoveredLoc.latitude.toFixed(2)}°, {hoveredLoc.longitude.toFixed(2)}°
                </span>
              </div>
            </div>

            {/* Intensity Progress Bar */}
            <div className="mt-3 pt-2 border-t border-slate-800">
              <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                <span>Activity Density</span>
                <span>{Math.round(hoveredLoc.intensity * 100)}%</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.max(5, hoveredLoc.intensity * 100)}%`,
                    backgroundColor: getIntensityColor(hoveredLoc.intensity).fill,
                    boxShadow: `0 0 8px ${getIntensityColor(hoveredLoc.intensity).glow}`,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Top Access Locations List Cards ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
            Frequent Access Locations ({filteredLocations.length})
          </p>
          <p className="text-slate-400 text-xs">Total Access Count: {totalLogins}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filteredLocations.slice(0, 6).map((loc, idx) => {
            const color = getIntensityColor(loc.intensity);
            const percentage = totalLogins > 0 ? Math.round((loc.count / totalLogins) * 100) : 0;

            return (
              <div
                key={`${loc.city}-${idx}`}
                className="bg-slate-950/80 border border-slate-800 hover:border-violet-500/40 rounded-2xl p-3.5 transition-all duration-200 flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-white font-bold text-sm leading-snug">{loc.city}</p>
                    <p className="text-slate-400 text-xs">{loc.region ? `${loc.region}, ` : ""}{loc.country}</p>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider shrink-0"
                    style={{
                      backgroundColor: `${color.fill}20`,
                      color: color.fill,
                      border: `1px solid ${color.fill}40`,
                    }}
                  >
                    {loc.count} Logins
                  </span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <span>
                      {loc.topDevice === "phone"
                        ? "📱"
                        : loc.topDevice === "tablet"
                        ? "📱"
                        : "💻"}
                    </span>
                    <span className="capitalize">{loc.topDevice}</span>
                  </span>

                  <span className="text-violet-400 font-semibold">{percentage}% of total</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
