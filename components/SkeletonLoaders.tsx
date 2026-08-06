import React from "react";
import Skeleton from "./Skeleton";

/**
 * Skeleton loader for Transaction List (History tab)
 */
export function TransactionListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Icon circle */}
            <Skeleton variant="circular" className="w-10 h-10 shrink-0" />
            <div className="space-y-2 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Skeleton variant="text" className="w-32 h-4" />
                <Skeleton variant="rounded" className="w-16 h-4 rounded-full" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton variant="text" className="w-20 h-3" />
                <Skeleton variant="text" className="w-14 h-3" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Skeleton variant="text" className="w-20 h-5" />
            <Skeleton variant="circular" className="w-8 h-8" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton loader for Upcoming Payments list
 */
export function UpcomingListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Skeleton variant="circular" className="w-9 h-9 shrink-0" />
            <div className="space-y-2 min-w-0 flex-1">
              <Skeleton variant="text" className="w-36 h-4" />
              <div className="flex items-center gap-2">
                <Skeleton variant="rounded" className="w-24 h-4 rounded-md" />
                <Skeleton variant="text" className="w-16 h-3" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Skeleton variant="text" className="w-16 h-5" />
            <Skeleton variant="circular" className="w-7 h-7" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton loader for BalanceSummaryCard
 */
export function BalanceSummaryCardSkeleton() {
  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 shadow-xl border border-slate-800/80 space-y-6">
      {/* Top section: Balance summary header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton variant="text" className="w-24 h-3 bg-slate-800" />
          <Skeleton variant="text" className="w-40 h-8 bg-slate-800" />
        </div>
        <Skeleton variant="rounded" className="w-24 h-7 bg-slate-800 rounded-xl" />
      </div>

      {/* 2-column stats (Income / Expense) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-800/40 rounded-2xl p-3.5 border border-slate-800 space-y-2">
          <div className="flex items-center gap-1.5">
            <Skeleton variant="circular" className="w-4 h-4 bg-slate-700" />
            <Skeleton variant="text" className="w-16 h-3 bg-slate-700" />
          </div>
          <Skeleton variant="text" className="w-24 h-6 bg-slate-700" />
        </div>

        <div className="bg-slate-800/40 rounded-2xl p-3.5 border border-slate-800 space-y-2">
          <div className="flex items-center gap-1.5">
            <Skeleton variant="circular" className="w-4 h-4 bg-slate-700" />
            <Skeleton variant="text" className="w-16 h-3 bg-slate-700" />
          </div>
          <Skeleton variant="text" className="w-24 h-6 bg-slate-700" />
        </div>
      </div>

      {/* E-commerce Breakdown pills */}
      <div className="space-y-2.5 pt-1 border-t border-slate-800/60">
        <Skeleton variant="text" className="w-32 h-3 bg-slate-800" />
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-slate-800/30 rounded-xl p-2.5 space-y-1.5 border border-slate-800/40">
              <Skeleton variant="text" className="w-12 h-2.5 bg-slate-700" />
              <Skeleton variant="text" className="w-16 h-4 bg-slate-700" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton loader for Cashflow Graph
 */
export function CashflowGraphSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton variant="text" className="w-32 h-4" />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Skeleton variant="circular" className="w-2.5 h-2.5" />
            <Skeleton variant="text" className="w-12 h-3" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton variant="circular" className="w-2.5 h-2.5" />
            <Skeleton variant="text" className="w-12 h-3" />
          </div>
        </div>
      </div>

      {/* Chart Bars Area */}
      <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 px-2 border-b border-slate-100 dark:border-slate-800/60">
        {[40, 75, 55, 90, 60, 80].map((h, idx) => (
          <div key={idx} className="flex-1 flex items-end justify-center gap-1 h-full">
            <Skeleton
              variant="rounded"
              className="w-1/2 rounded-t-lg"
              style={{ height: `${h}%` }}
            />
            <Skeleton
              variant="rounded"
              className="w-1/2 rounded-t-lg"
              style={{ height: `${Math.max(20, h - 25)}%` }}
            />
          </div>
        ))}
      </div>

      {/* X-axis Month labels */}
      <div className="flex items-center justify-between px-2">
        {["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((m, i) => (
          <Skeleton key={i} variant="text" className="w-7 h-3" />
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton loader for Monthly Profit Analytics Chart & Stats
 */
export function MonthlyProfitChartSkeleton() {
  return (
    <div className="space-y-6">
      {/* Top 6 KPI summary cards grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 space-y-2 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <Skeleton variant="text" className="w-20 h-3" />
              <Skeleton variant="circular" className="w-6 h-6" />
            </div>
            <Skeleton variant="text" className="w-28 h-6" />
            <Skeleton variant="text" className="w-16 h-2.5" />
          </div>
        ))}
      </div>

      {/* Chart container skeleton */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <Skeleton variant="text" className="w-44 h-5" />
          <Skeleton variant="rounded" className="w-32 h-8 rounded-xl" />
        </div>

        <div className="h-64 flex items-end justify-between gap-3 pt-8 pb-3 px-2 border-b border-slate-100 dark:border-slate-800">
          {[50, 80, 45, 95, 70, 85].map((heightPct, idx) => (
            <div key={idx} className="flex-1 flex flex-col justify-end items-center h-full gap-2">
              <Skeleton
                variant="rounded"
                className="w-full max-w-[48px] rounded-t-xl"
                style={{ height: `${heightPct}%` }}
              />
            </div>
          ))}
        </div>

        <div className="flex justify-between px-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="text" className="w-10 h-3" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton loader for Desktop Top Header Quick Stats
 */
export function HeaderStatsSkeleton() {
  return (
    <div className="flex items-center gap-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <React.Fragment key={i}>
          {i > 0 && <div className="w-px h-8 bg-slate-800" />}
          <div className="text-center space-y-1.5">
            <Skeleton variant="text" className="w-16 h-2.5 bg-slate-800 mx-auto" />
            <Skeleton variant="text" className="w-20 h-5 bg-slate-800 mx-auto" />
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

/**
 * Skeleton loader for Desktop Sidebar Mini Upcoming Items
 */
export function SidebarUpcomingSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
      <Skeleton variant="text" className="w-20 h-3 bg-slate-800" />
      <div className="space-y-2.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1">
              <Skeleton variant="circular" className="w-2 h-2 bg-slate-700" />
              <Skeleton variant="text" className="w-24 h-3 bg-slate-800" />
            </div>
            <Skeleton variant="text" className="w-10 h-3 bg-slate-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
