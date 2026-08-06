"use client";

import { useMemo, useState } from "react";
import { formatCurrency, formatDate } from "@/utils/formatCurrency";

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

interface ChannelOrderTrackerProps {
  transactions: Transaction[];
}

const PLATFORM_CONFIGS: Record<
  string,
  { name: string; icon: string; badgeClass: string; color: string; border: string }
> = {
  meesho: {
    name: "Meesho",
    icon: "🛍️",
    badgeClass: "bg-pink-500/20 text-pink-300 border-pink-500/30",
    color: "#ec4899",
    border: "border-pink-500/30",
  },
  flipkart: {
    name: "Flipkart",
    icon: "🛒",
    badgeClass: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    color: "#eab308",
    border: "border-yellow-500/30",
  },
  amazon: {
    name: "Amazon",
    icon: "📦",
    badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    color: "#f59e0b",
    border: "border-amber-500/30",
  },
  "own site": {
    name: "Own Site / Website",
    icon: "🌐",
    badgeClass: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    color: "#06b6d4",
    border: "border-cyan-500/30",
  },
  website: {
    name: "Own Site / Website",
    icon: "🌐",
    badgeClass: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    color: "#06b6d4",
    border: "border-cyan-500/30",
  },
  shopify: {
    name: "Shopify",
    icon: "🛍️",
    badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    color: "#10b981",
    border: "border-emerald-500/30",
  },
  woocommerce: {
    name: "WooCommerce",
    icon: "🏪",
    badgeClass: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    color: "#a855f7",
    border: "border-purple-500/30",
  },
  direct: {
    name: "Direct / Offline",
    icon: "🏬",
    badgeClass: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    color: "#64748b",
    border: "border-slate-500/30",
  },
};

const getPlatformConfig = (channelName?: string) => {
  if (!channelName) {
    return {
      name: "Unassigned",
      icon: "❓",
      badgeClass: "bg-slate-500/20 text-slate-400 border-slate-700",
      color: "#64748b",
      border: "border-slate-700",
    };
  }
  const lower = channelName.toLowerCase();
  for (const key of Object.keys(PLATFORM_CONFIGS)) {
    if (lower.includes(key)) return PLATFORM_CONFIGS[key];
  }
  return {
    name: channelName,
    icon: "🏷️",
    badgeClass: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    color: "#8b5cf6",
    border: "border-violet-500/30",
  };
};

export default function ChannelOrderTracker({ transactions }: ChannelOrderTrackerProps) {
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState<string>("ALL");
  const [auditMode, setAuditMode] = useState<"ALL" | "WITH_ID" | "MISSING_ID">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Income transactions are consider order-based sales
  const incomeTransactions = useMemo(() => {
    return transactions.filter((t) => t.type === "income");
  }, [transactions]);

  // Channel summary calculation
  const channelStats = useMemo(() => {
    const map: Record<
      string,
      {
        channelKey: string;
        channelName: string;
        orderCount: number;
        grossSales: number;
        totalCogs: number;
        totalFees: number;
        totalAdSpend: number;
        netProfit: number;
        ordersWithId: number;
      }
    > = {};

    incomeTransactions.forEach((t) => {
      const chName = t.channel && t.channel.trim() !== "" ? t.channel.trim() : "Direct / General";
      if (!map[chName]) {
        map[chName] = {
          channelKey: chName,
          channelName: chName,
          orderCount: 0,
          grossSales: 0,
          totalCogs: 0,
          totalFees: 0,
          totalAdSpend: 0,
          netProfit: 0,
          ordersWithId: 0,
        };
      }

      map[chName].orderCount += 1;
      map[chName].grossSales += t.amount;
      map[chName].totalCogs += t.cogs || 0;
      map[chName].totalFees += t.platformFee || 0;
      map[chName].totalAdSpend += t.adSpend || 0;

      const deductions = (t.cogs || 0) + (t.platformFee || 0) + (t.adSpend || 0);
      map[chName].netProfit += t.amount - deductions;

      if (t.orderId && t.orderId.trim() !== "") {
        map[chName].ordersWithId += 1;
      }
    });

    const list = Object.values(map).map((ch) => {
      const aov = ch.orderCount > 0 ? ch.grossSales / ch.orderCount : 0;
      const marginPct = ch.grossSales > 0 ? (ch.netProfit / ch.grossSales) * 100 : 0;
      return { ...ch, aov, marginPct };
    });

    list.sort((a, b) => b.grossSales - a.grossSales);
    return list;
  }, [incomeTransactions]);

  // Overall totals
  const overallStats = useMemo(() => {
    const totalOrders = incomeTransactions.length;
    const totalRevenue = incomeTransactions.reduce((acc, t) => acc + t.amount, 0);
    const totalNetProfit = incomeTransactions.reduce((acc, t) => {
      const ded = (t.cogs || 0) + (t.platformFee || 0) + (t.adSpend || 0);
      return acc + (t.amount - ded);
    }, 0);
    const ordersWithId = incomeTransactions.filter((t) => t.orderId && t.orderId.trim() !== "").length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return { totalOrders, totalRevenue, totalNetProfit, ordersWithId, avgOrderValue };
  }, [incomeTransactions]);

  // Filtered order list for table
  const filteredOrders = useMemo(() => {
    return incomeTransactions.filter((t) => {
      // Platform filter
      const chName = t.channel && t.channel.trim() !== "" ? t.channel.trim() : "Direct / General";
      if (selectedPlatformFilter !== "ALL" && chName !== selectedPlatformFilter) {
        return false;
      }

      // Audit Mode filter
      const hasId = Boolean(t.orderId && t.orderId.trim() !== "");
      if (auditMode === "WITH_ID" && !hasId) return false;
      if (auditMode === "MISSING_ID" && hasId) return false;

      // Search query
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = t.orderId ? t.orderId.toLowerCase().includes(q) : false;
        const matchesSku = t.sku ? t.sku.toLowerCase().includes(q) : false;
        const matchesDesc = t.description ? t.description.toLowerCase().includes(q) : false;
        const matchesCh = chName.toLowerCase().includes(q);
        if (!matchesId && !matchesSku && !matchesDesc && !matchesCh) return false;
      }

      return true;
    });
  }, [incomeTransactions, selectedPlatformFilter, auditMode, searchQuery]);

  const handleCopyOrderId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Channel names for filter pills
  const availableChannels = useMemo(() => {
    return Array.from(
      new Set(
        incomeTransactions
          .map((t) => (t.channel && t.channel.trim() !== "" ? t.channel.trim() : "Direct / General"))
      )
    );
  }, [incomeTransactions]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── Top Header Metrics Banner ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl glass border border-violet-500/20 shadow-lg relative overflow-hidden">
          <div className="absolute -right-2 -bottom-2 opacity-10 text-5xl">📦</div>
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
            Total Orders Tracked
          </p>
          <p className="text-2xl font-black text-white glow-text-violet">
            {overallStats.totalOrders} <span className="text-xs font-semibold text-slate-400">Orders</span>
          </p>
          <p className="text-[11px] text-cyan-400 mt-1 font-medium">
            {overallStats.ordersWithId} assigned Order IDs
          </p>
        </div>

        <div className="p-4 rounded-2xl glass border border-violet-500/20 shadow-lg relative overflow-hidden">
          <div className="absolute -right-2 -bottom-2 opacity-10 text-5xl">💰</div>
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
            Gross Sales Volume
          </p>
          <p className="text-2xl font-black text-emerald-400 glow-text-emerald">
            {formatCurrency(overallStats.totalRevenue)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Across all platforms</p>
        </div>

        <div className="p-4 rounded-2xl glass border border-violet-500/20 shadow-lg relative overflow-hidden">
          <div className="absolute -right-2 -bottom-2 opacity-10 text-5xl">📈</div>
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
            Average Order Value (AOV)
          </p>
          <p className="text-2xl font-black text-cyan-300 glow-text-cyan">
            {formatCurrency(overallStats.avgOrderValue)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Revenue / Order count</p>
        </div>

        <div className="p-4 rounded-2xl glass border border-violet-500/20 shadow-lg relative overflow-hidden">
          <div className="absolute -right-2 -bottom-2 opacity-10 text-5xl">🎯</div>
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
            Net Profit After Deductions
          </p>
          <p className="text-2xl font-black text-violet-400 glow-text-violet">
            {formatCurrency(overallStats.totalNetProfit)}
          </p>
          <p className="text-[11px] text-emerald-400 mt-1 font-semibold">
            {overallStats.totalRevenue > 0
              ? `${((overallStats.totalNetProfit / overallStats.totalRevenue) * 100).toFixed(1)}% net margin`
              : "0% margin"}
          </p>
        </div>
      </div>

      {/* ── Platform Specific Breakdown Cards (Meesho, Flipkart, Amazon, Own Site, etc.) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <span>🛍️</span>
            <span>Platform Order Matrix (Meesho, Flipkart, Amazon, Own Site)</span>
          </h3>
          <span className="text-xs text-slate-400">Click card to filter orders</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {channelStats.length === 0 ? (
            <div className="col-span-full p-6 text-center glass rounded-2xl border border-slate-800">
              <p className="text-slate-400 text-xs">No channel order data recorded yet.</p>
            </div>
          ) : (
            channelStats.map((ch) => {
              const cfg = getPlatformConfig(ch.channelName);
              const isSelected = selectedPlatformFilter === ch.channelName;
              return (
                <div
                  key={ch.channelKey}
                  onClick={() =>
                    setSelectedPlatformFilter(isSelected ? "ALL" : ch.channelName)
                  }
                  className={`p-4 rounded-2xl glass cursor-pointer transition-all duration-200 relative overflow-hidden border ${
                    isSelected
                      ? `${cfg.border} ring-2 ring-violet-500/50 bg-slate-800/80 scale-[1.02]`
                      : "hover:border-violet-500/40 hover:scale-[1.01]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{cfg.icon}</span>
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${cfg.badgeClass}`}
                    >
                      {ch.orderCount} {ch.orderCount === 1 ? "Order" : "Orders"}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-sm text-white truncate mb-1">
                    {ch.channelName}
                  </h4>

                  <div className="space-y-1 text-xs mt-2">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Gross Revenue:</span>
                      <span className="font-bold text-emerald-400">
                        {formatCurrency(ch.grossSales)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span>Net Profit:</span>
                      <span
                        className={`font-bold ${
                          ch.netProfit >= 0 ? "text-violet-300" : "text-rose-400"
                        }`}
                      >
                        {formatCurrency(ch.netProfit)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800">
                      <span>AOV:</span>
                      <span className="font-semibold text-cyan-300">
                        {formatCurrency(ch.aov)}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="mt-2 text-[10px] font-bold text-violet-400 text-center uppercase tracking-wider bg-violet-500/10 py-1 rounded-lg">
                      ✓ Filter Applied
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Order Volume & Revenue Visualizer Graphic ── */}
      {channelStats.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold text-sm flex items-center gap-2">
                <span>📊</span>
                <span>Platform Order Volume Distribution</span>
              </h3>
              <p className="text-slate-400 text-xs">Visual order ratio across platforms</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {overallStats.totalOrders} total sales
            </span>
          </div>

          <div className="space-y-3">
            {channelStats.map((ch) => {
              const cfg = getPlatformConfig(ch.channelName);
              const pct = overallStats.totalOrders > 0
                ? (ch.orderCount / overallStats.totalOrders) * 100
                : 0;

              return (
                <div key={ch.channelKey} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-2 text-slate-200">
                      <span>{cfg.icon}</span>
                      <span>{ch.channelName}</span>
                    </span>
                    <span className="text-slate-400 font-mono">
                      {ch.orderCount} orders ({pct.toFixed(1)}%) · {formatCurrency(ch.grossSales)}
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(pct, 2)}%`,
                        backgroundColor: cfg.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Detailed Order Number Matrix & Audit Table ── */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-white font-bold text-base flex items-center gap-2">
              <span>🧾</span>
              <span>Order-Wise Master Audit Table</span>
            </h3>
            <p className="text-slate-400 text-xs">
              Search by Order No. (#orderId), SKU, platform, or view unassigned orders
            </p>
          </div>

          {/* Audit mode toggle button group */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setAuditMode("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                auditMode === "ALL"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All ({incomeTransactions.length})
            </button>
            <button
              onClick={() => setAuditMode("WITH_ID")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                auditMode === "WITH_ID"
                  ? "bg-cyan-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              With Order ID ({overallStats.ordersWithId})
            </button>
            <button
              onClick={() => setAuditMode("MISSING_ID")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                auditMode === "MISSING_ID"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Missing Order ID ({incomeTransactions.length - overallStats.ordersWithId})
            </button>
          </div>
        </div>

        {/* Search & Channel Pills */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Order No. (e.g. ORD-104), SKU, Meesho, Flipkart..."
              className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Platform filter */}
          {availableChannels.length > 0 && (
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setSelectedPlatformFilter("ALL")}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                  selectedPlatformFilter === "ALL"
                    ? "bg-slate-100 text-slate-900"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                All Channels
              </button>
              {availableChannels.map((ch) => {
                const cfg = getPlatformConfig(ch);
                const isSel = selectedPlatformFilter === ch;
                return (
                  <button
                    key={ch}
                    onClick={() => setSelectedPlatformFilter(isSel ? "ALL" : ch)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      isSel
                        ? "bg-violet-600 text-white"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    <span>{cfg.icon}</span>
                    <span>{ch}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Table view */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                <th className="pb-3 px-3">Order No. / ID</th>
                <th className="pb-3 px-3">Platform Channel</th>
                <th className="pb-3 px-3">Description / SKU</th>
                <th className="pb-3 px-3">Date</th>
                <th className="pb-3 px-3 text-right">Gross Amount</th>
                <th className="pb-3 px-3 text-right">Deductions</th>
                <th className="pb-3 px-3 text-right">Net Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                    No orders found matching your search or filters.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const cfg = getPlatformConfig(ord.channel);
                  const deductions = (ord.cogs || 0) + (ord.platformFee || 0) + (ord.adSpend || 0);
                  const net = ord.amount - deductions;
                  const hasOrderId = Boolean(ord.orderId && ord.orderId.trim() !== "");

                  return (
                    <tr
                      key={ord._id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Order No */}
                      <td className="py-3 px-3">
                        {hasOrderId ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-cyan-300 font-bold bg-cyan-950/60 border border-cyan-800 px-2 py-0.5 rounded-lg text-[11px]">
                              #{ord.orderId}
                            </span>
                            <button
                              onClick={() => handleCopyOrderId(ord.orderId!)}
                              title="Copy Order ID"
                              className="text-slate-400 hover:text-cyan-400 text-xs transition-colors"
                            >
                              {copiedId === ord.orderId ? "✓" : "📋"}
                            </button>
                          </div>
                        ) : (
                          <span className="text-amber-400 text-[10px] font-semibold bg-amber-950/40 border border-amber-800/60 px-2 py-0.5 rounded-lg">
                            ⚠️ No Order ID
                          </span>
                        )}
                      </td>

                      {/* Platform */}
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${cfg.badgeClass}`}>
                          <span>{cfg.icon}</span>
                          <span>{ord.channel || "Direct / General"}</span>
                        </span>
                      </td>

                      {/* Description / SKU */}
                      <td className="py-3 px-3">
                        <p className="font-semibold text-slate-200 truncate max-w-[200px]">
                          {ord.description || "Sale"}
                        </p>
                        {ord.sku && (
                          <p className="text-[10px] font-mono text-slate-400">
                            SKU: {ord.sku}
                          </p>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                        {formatDate(ord.createdAt)}
                      </td>

                      {/* Gross Amount */}
                      <td className="py-3 px-3 text-right font-bold text-emerald-400">
                        {formatCurrency(ord.amount)}
                      </td>

                      {/* Deductions */}
                      <td className="py-3 px-3 text-right text-rose-400 font-medium">
                        {deductions > 0 ? `−${formatCurrency(deductions)}` : "₹0"}
                      </td>

                      {/* Net Profit */}
                      <td className={`py-3 px-3 text-right font-black ${net >= 0 ? "text-violet-300" : "text-rose-400"}`}>
                        {formatCurrency(net)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
