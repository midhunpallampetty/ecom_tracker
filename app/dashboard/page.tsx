"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import BalanceSummaryCard from "@/components/BalanceSummaryCard";
import AddTransactionForm from "@/components/AddTransactionForm";
import TransactionList from "@/components/TransactionList";
import ThemeToggle from "@/components/ThemeToggle";
import LoadingSpinner from "@/components/LoadingSpinner";
import CashflowGraph from "@/components/CashflowGraph";
import AddUpcomingForm from "@/components/AddUpcomingForm";
import UpcomingList from "@/components/UpcomingList";
import {
  TransactionListSkeleton,
  UpcomingListSkeleton,
  HeaderStatsSkeleton,
  SidebarUpcomingSkeleton,
} from "@/components/SkeletonLoaders";

import MonthlyProfitChart from "@/components/MonthlyProfitChart";
import ExportDataPromptModal from "@/components/ExportDataPromptModal";
import GstFilingModal from "@/components/GstFilingModal";

interface Transaction {
  _id: string;
  amount: number;
  type: "income" | "expense";
  description: string;
  channel?: string;
  sku?: string;
  cogs?: number;
  platformFee?: number;
  adSpend?: number;
  createdAt: string;
}

interface UpcomingItem {
  _id: string;
  amount: number;
  type: "income" | "expense";
  description: string;
  expectedDate: string;
}

type TabType = "history" | "analytics" | "add-income" | "add-expense" | "upcoming";

const NAV_ITEMS: { id: TabType; label: string; icon: string; color: string }[] = [
  { id: "history",     label: "History",       icon: "📋", color: "slate"  },
  { id: "analytics",   label: "Monthly Profit",icon: "📈", color: "violet" },
  { id: "add-income",  label: "Add Income",    icon: "💚", color: "emerald"},
  { id: "add-expense", label: "Add Expense",   icon: "🔴", color: "rose"   },
  { id: "upcoming",    label: "Upcoming",      icon: "📅", color: "violet" },
];

/* ─────────────────────────────────────────────── */

export default function DashboardPage() {
  const router = useRouter();
  const [transactions, setTransactions]   = useState<Transaction[]>([]);
  const [upcomingItems, setUpcomingItems] = useState<UpcomingItem[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [upcomingLoading, setUpcomingLoading] = useState(true);
  const [error,    setError]    = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("history");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isGstModalOpen, setIsGstModalOpen]       = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      const res  = await fetch("/api/transactions");
      const data = await res.json();
      if (data.success) { setTransactions(data.data); setError(""); }
      else setError("Failed to load transactions");
    } catch { setError("Network error. Check your connection."); }
    finally  { setLoading(false); }
  }, []);

  const fetchUpcoming = useCallback(async () => {
    setUpcomingLoading(true);
    try {
      const res  = await fetch("/api/upcoming");
      const data = await res.json();
      if (data.success) setUpcomingItems(data.data);
    } catch { /* silent */ }
    finally { setUpcomingLoading(false); }
  }, []);

  useEffect(() => { fetchTransactions(); fetchUpcoming(); }, [fetchTransactions, fetchUpcoming]);

  const handleTransactionAdded = () => { setLoading(true); fetchTransactions(); setActiveTab("history"); };
  const handleDelete            = (id: string) => setTransactions(p => p.filter(t => t._id !== id));
  const handleUpcomingAdded    = () => { fetchUpcoming(); setActiveTab("upcoming"); };
  const handleUpcomingDelete   = (id: string) => setUpcomingItems(p => p.filter(u => u._id !== id));

  const totalIncome   = transactions.filter(t => t.type === "income") .reduce((s,t) => s + t.amount, 0);
  const totalExpense  = transactions.filter(t => t.type === "expense").reduce((s,t) => s + t.amount, 0);
  const balance       = totalIncome - totalExpense;

  const upcomingIncomeTotal  = upcomingItems.filter(u => u.type === "income").reduce((s,u) => s + u.amount, 0);
  const upcomingExpenseTotal = upcomingItems.filter(u => u.type === "expense").reduce((s,u) => s + u.amount, 0);

  const totalCogs     = transactions.reduce((s,t) => s + (t.cogs || 0), 0);
  const totalFees     = transactions.reduce((s,t) => s + (t.platformFee || 0), 0);
  const totalAdSpend  = transactions.reduce((s,t) => s + (t.adSpend || 0), 0);

  const handleLogout = async () => {
    await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "destroy" }),
    });
    router.push("/login");
  };

  /* ─────────── MAIN CONTENT PANEL (shared by both layouts) ─────────── */
  const MainContent = () => (
    <>
      {activeTab === "history" && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-slate-700 dark:text-slate-200 font-bold text-lg">
              All Transactions
            </h2>
            {!loading && transactions.length > 0 && (
              <span className="text-slate-400 text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                {transactions.length} records
              </span>
            )}
          </div>
          {loading ? (
            <TransactionListSkeleton count={5} />
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
              <p className="text-red-500 font-medium text-sm mb-3">{error}</p>
              <button onClick={fetchTransactions} className="text-sm text-red-600 font-semibold underline">
                Try again
              </button>
            </div>
          ) : (
            <TransactionList transactions={transactions} onDelete={handleDelete} />
          )}
        </div>
      )}

      {activeTab === "analytics" && (
        <MonthlyProfitChart transactions={transactions} loading={loading} />
      )}

      {activeTab === "add-income" && (
        <AddTransactionForm type="income" onSuccess={handleTransactionAdded} />
      )}

      {activeTab === "add-expense" && (
        <AddTransactionForm type="expense" onSuccess={handleTransactionAdded} />
      )}

      {activeTab === "upcoming" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-slate-700 dark:text-slate-200 font-bold text-lg">
              Upcoming Payments
            </h2>
            {!upcomingLoading && upcomingItems.length > 0 && (
              <span className="text-violet-500 text-xs bg-violet-100 dark:bg-violet-900/30 px-3 py-1 rounded-full font-medium">
                {upcomingItems.length} scheduled
              </span>
            )}
          </div>
          {upcomingLoading ? (
            <UpcomingListSkeleton count={4} />
          ) : (
            <UpcomingList items={upcomingItems} onDelete={handleUpcomingDelete} />
          )}
          <AddUpcomingForm onSuccess={handleUpcomingAdded} />
        </div>
      )}
    </>
  );

  /* ══════════════════════════════════════════════════════════════════
     MOBILE LAYOUT  (< lg)
  ══════════════════════════════════════════════════════════════════ */
  const MobileLayout = () => (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="max-w-md mx-auto min-h-screen flex flex-col">
        {/* Header */}
        <header className="px-5 pt-12 pb-4 flex items-center justify-between">
          <div>
            <p className="text-slate-400 dark:text-slate-500 text-xs font-medium uppercase tracking-widest mb-0.5">
              Personal Finance
            </p>
            <h1 className="text-slate-800 dark:text-white font-bold text-2xl tracking-tight">
              My Wallet 💼
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsGstModalOpen(true)}
              title="GST Filing & Tax Calculator"
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs font-bold border border-amber-500/30 flex items-center gap-1.5 transition-all"
            >
              <span>🏛️</span>
              <span>GST</span>
            </button>
            <button
              onClick={() => setIsExportModalOpen(true)}
              title="Export Data as AI Prompt"
              className="px-3 py-1.5 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 text-xs font-bold border border-violet-500/30 flex items-center gap-1.5 transition-all"
            >
              <span>🤖</span>
              <span>Prompt</span>
            </button>
            <ThemeToggle />
            <button
              id="logout-btn"
              onClick={handleLogout}
              title="Logout"
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 flex items-center justify-center transition-all duration-200"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </header>

        <div className="px-5 mb-4">
          <BalanceSummaryCard
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            balance={balance}
            upcomingCount={upcomingItems.length}
            upcomingIncomeTotal={upcomingIncomeTotal}
            upcomingExpenseTotal={upcomingExpenseTotal}
            totalCogs={totalCogs}
            totalFees={totalFees}
            totalAdSpend={totalAdSpend}
            loading={loading}
          />
        </div>

        <div className="px-5 mb-4">
          <CashflowGraph transactions={transactions} loading={loading} />
        </div>

        {/* Mobile tabs */}
        <div className="px-5 mb-4">
          <div className="flex gap-1.5 bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm border dark:border-slate-800">
            {NAV_ITEMS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 whitespace-nowrap relative ${
                  activeTab === tab.id
                    ? tab.id === "add-income"  ? "bg-emerald-500 text-white shadow-sm"
                    : tab.id === "add-expense" ? "bg-rose-500 text-white shadow-sm"
                    : tab.id === "upcoming"    ? "bg-violet-500 text-white shadow-sm"
                    : "bg-slate-800 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                <span className="text-sm leading-none">{tab.icon}</span>
                <span>{tab.id === "add-income" ? "Add In" : tab.id === "add-expense" ? "Add Out" : tab.label}</span>
                {tab.id === "upcoming" && upcomingItems.length > 0 && activeTab !== "upcoming" && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {upcomingItems.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 px-5 pb-8">
          <MainContent />
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════
     DESKTOP LAYOUT  (≥ lg)
  ══════════════════════════════════════════════════════════════════ */
  const DesktopLayout = () => (
    <div className="min-h-screen bg-slate-950 flex flex-col">

      {/* ── Top header bar ── */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-slate-800 bg-slate-950 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-lg shadow-lg shadow-emerald-500/20">
            💼
          </div>
          <div>
            <h1 className="text-white font-bold text-lg tracking-tight leading-none">eCom Tracker</h1>
            <p className="text-slate-500 text-xs">Sales & Cashflow</p>
          </div>
        </div>

        {/* Center: quick stats */}
        {loading || upcomingLoading ? (
          <HeaderStatsSkeleton />
        ) : (
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-slate-500 text-xs uppercase tracking-wider">Balance</p>
              <p className={`font-bold text-lg ${balance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {balance >= 0 ? "+" : "−"}₹{Math.abs(balance).toLocaleString("en-IN")}
              </p>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="text-center">
              <p className="text-slate-500 text-xs uppercase tracking-wider">Sales / Income</p>
              <p className="font-bold text-lg text-emerald-400">₹{totalIncome.toLocaleString("en-IN")}</p>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="text-center">
              <p className="text-slate-500 text-xs uppercase tracking-wider">Expenses</p>
              <p className="font-bold text-lg text-rose-400">₹{totalExpense.toLocaleString("en-IN")}</p>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="text-center">
              <p className="text-slate-500 text-xs uppercase tracking-wider">Upcoming In</p>
              <p className="font-bold text-lg text-emerald-400">₹{upcomingIncomeTotal.toLocaleString("en-IN")}</p>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="text-center">
              <p className="text-slate-500 text-xs uppercase tracking-wider">Upcoming Out</p>
              <p className="font-bold text-lg text-rose-400">₹{upcomingExpenseTotal.toLocaleString("en-IN")}</p>
            </div>
            {(upcomingIncomeTotal > 0 || upcomingExpenseTotal > 0) && (
              <>
                <div className="w-px h-8 bg-slate-800" />
                <div className="text-center">
                  <p className="text-violet-400 text-xs uppercase font-bold tracking-wider">Projected Net</p>
                  <p className={`font-bold text-lg ${ (balance + upcomingIncomeTotal - upcomingExpenseTotal) >= 0 ? "text-emerald-400" : "text-rose-400" }`}>
                    {(balance + upcomingIncomeTotal - upcomingExpenseTotal) >= 0 ? "+" : "−"}₹{Math.abs(balance + upcomingIncomeTotal - upcomingExpenseTotal).toLocaleString("en-IN")}
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsGstModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-sm font-bold transition-all duration-200 border border-amber-500/30 shadow-lg shadow-amber-500/10"
          >
            <span>🏛️</span>
            <span>GST Filing Vault</span>
          </button>
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 text-sm font-bold transition-all duration-200 border border-violet-500/30 shadow-lg shadow-violet-600/10"
          >
            <span>🤖</span>
            <span>Export AI Prompt Data</span>
          </button>
          <ThemeToggle />
          <button
            id="logout-btn-desktop"
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-900/30 text-slate-400 hover:text-rose-400 text-sm font-medium transition-all duration-200 border border-slate-700 hover:border-rose-500/30"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Logout
          </button>
        </div>
      </header>

      {/* ── 3-column body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ──────── LEFT SIDEBAR ──────── */}
        <aside className="w-72 shrink-0 border-r border-slate-800 bg-slate-950 flex flex-col overflow-y-auto">
          <div className="p-5 space-y-4">
            {/* Balance card */}
            <BalanceSummaryCard
              totalIncome={totalIncome}
              totalExpense={totalExpense}
              balance={balance}
              upcomingCount={upcomingItems.length}
              upcomingIncomeTotal={upcomingIncomeTotal}
              upcomingExpenseTotal={upcomingExpenseTotal}
              totalCogs={totalCogs}
              totalFees={totalFees}
              totalAdSpend={totalAdSpend}
              loading={loading}
            />

            {/* Quick Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => setIsGstModalOpen(true)}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold text-amber-300 bg-amber-950/50 hover:bg-amber-900/60 border border-amber-800/50 transition-all duration-200 shadow-md shadow-amber-950/40"
              >
                <span className="text-base">🏛️</span>
                <span>GST & Tax Filing Vault</span>
              </button>
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold text-violet-300 bg-violet-950/50 hover:bg-violet-900/60 border border-violet-800/50 transition-all duration-200 shadow-md shadow-violet-950/40"
              >
                <span className="text-base">🤖</span>
                <span>Generate AI Prompt Export</span>
              </button>
            </div>

            {/* Navigation */}
            <nav className="space-y-1">
              <p className="text-slate-600 text-xs font-semibold uppercase tracking-widest px-3 mb-3">
                Navigation
              </p>
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 text-left relative ${
                    activeTab === item.id
                      ? item.id === "add-income"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                        : item.id === "add-expense"
                        ? "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                        : item.id === "upcoming" || item.id === "analytics"
                        ? "bg-violet-500/15 text-violet-400 border border-violet-500/20"
                        : "bg-slate-700/50 text-white border border-slate-600/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
                  }`}
                >
                  <span className="text-lg leading-none">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.id === "upcoming" && upcomingItems.length > 0 && (
                    <span className="ml-auto bg-violet-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                      {upcomingItems.length}
                    </span>
                  )}
                  {activeTab === item.id && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                  )}
                </button>
              ))}
            </nav>

            {/* Mini upcoming summary in sidebar */}
            {upcomingLoading ? (
              <SidebarUpcomingSkeleton />
            ) : upcomingItems.length > 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3">
                  Next Due
                </p>
                <div className="space-y-2">
                  {upcomingItems.slice(0, 3).map((u) => {
                    const d = new Date(u.expectedDate);
                    const diff = Math.ceil((d.getTime() - new Date().setHours(0,0,0,0)) / 86400000);
                    const urgency = diff < 0 ? "text-rose-400" : diff === 0 ? "text-amber-400" : diff <= 3 ? "text-violet-400" : "text-slate-400";
                    return (
                      <div key={u._id} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${u.type === "income" ? "bg-emerald-400" : "bg-rose-400"}`} />
                          <p className="text-slate-300 text-xs truncate">{u.description || u.type}</p>
                        </div>
                        <p className={`text-xs font-bold shrink-0 ${urgency}`}>
                          {diff < 0 ? `${Math.abs(diff)}d ago` : diff === 0 ? "Today" : `${diff}d`}
                        </p>
                      </div>
                    );
                  })}
                  {upcomingItems.length > 3 && (
                    <button onClick={() => setActiveTab("upcoming")} className="text-violet-400 text-xs font-medium hover:underline">
                      +{upcomingItems.length - 3} more →
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </aside>

        {/* ──────── MAIN CONTENT ──────── */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          <div className="p-8 max-w-4xl">
            {/* Page title */}
            <div className="mb-6">
              {(() => {
                const item = NAV_ITEMS.find(n => n.id === activeTab)!;
                const colors: Record<string, string> = {
                  history:     "text-slate-200",
                  "add-income":  "text-emerald-400",
                  "add-expense": "text-rose-400",
                  upcoming:    "text-violet-400",
                };
                return (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <h2 className={`font-bold text-2xl ${colors[activeTab]}`}>{item.label}</h2>
                  </div>
                );
              })()}
              <div className="h-px bg-slate-800 mt-4" />
            </div>

            <MainContent />
          </div>
        </main>

        {/* ──────── RIGHT PANEL ──────── */}
        <aside className="w-80 shrink-0 border-l border-slate-800 bg-slate-950 overflow-y-auto">
          <div className="p-5 space-y-5">
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-3">
                Cashflow · 6 Months
              </p>
              <CashflowGraph transactions={transactions} loading={loading} />
            </div>

            {/* Quick add upcoming — right panel shortcut */}
            <div>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest mb-3">
                Schedule Payment
              </p>
              <AddUpcomingForm onSuccess={handleUpcomingAdded} />
            </div>
          </div>
        </aside>

      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════
     RENDER — responsive switch
  ══════════════════════════════════════════════════════════════════ */
  return (
    <>
      {/* Mobile: shown below lg */}
      <div className="lg:hidden">
        <MobileLayout />
      </div>
      {/* Desktop: shown at lg+ */}
      <div className="hidden lg:flex lg:flex-col lg:h-screen lg:overflow-hidden">
        <DesktopLayout />
      </div>

      {/* AI Data Export Prompt Modal */}
      <ExportDataPromptModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        transactions={transactions}
        upcomingItems={upcomingItems}
      />

      {/* GST Filing & Tax Calculator Modal */}
      <GstFilingModal
        isOpen={isGstModalOpen}
        onClose={() => setIsGstModalOpen(false)}
        transactions={transactions}
      />
    </>
  );
}
