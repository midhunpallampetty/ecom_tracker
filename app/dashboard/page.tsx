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

interface Transaction {
  _id: string;
  amount: number;
  type: "income" | "expense";
  description: string;
  createdAt: string;
}

interface UpcomingItem {
  _id: string;
  amount: number;
  type: "income" | "expense";
  description: string;
  expectedDate: string;
}

type TabType = "history" | "add-income" | "add-expense" | "upcoming";

export default function DashboardPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [upcomingItems, setUpcomingItems] = useState<UpcomingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [upcomingLoading, setUpcomingLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("history");

  /* ── Fetch transactions ── */
  const fetchTransactions = useCallback(async () => {
    try {
      const res = await fetch("/api/transactions");
      const data = await res.json();
      if (data.success) {
        setTransactions(data.data);
        setError("");
      } else {
        setError("Failed to load transactions");
      }
    } catch {
      setError("Network error. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── Fetch upcoming ── */
  const fetchUpcoming = useCallback(async () => {
    setUpcomingLoading(true);
    try {
      const res = await fetch("/api/upcoming");
      const data = await res.json();
      if (data.success) setUpcomingItems(data.data);
    } catch {
      /* silent */
    } finally {
      setUpcomingLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
    fetchUpcoming();
  }, [fetchTransactions, fetchUpcoming]);

  const handleTransactionAdded = () => {
    setLoading(true);
    fetchTransactions();
    setActiveTab("history");
  };

  const handleDelete = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t._id !== id));
  };

  const handleUpcomingAdded = () => {
    fetchUpcoming();
    setActiveTab("upcoming");
  };

  const handleUpcomingDelete = (id: string) => {
    setUpcomingItems((prev) => prev.filter((u) => u._id !== id));
  };

  /* ── Computed values ── */
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  const balance = totalIncome - totalExpense;

  const upcomingExpenseTotal = upcomingItems
    .filter((u) => u.type === "expense")
    .reduce((s, u) => s + u.amount, 0);

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: "history",     label: "History",  icon: "📋" },
    { id: "add-income",  label: "Add In",   icon: "💚" },
    { id: "add-expense", label: "Add Out",  icon: "🔴" },
    { id: "upcoming",    label: "Upcoming", icon: "📅" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="max-w-md mx-auto min-h-screen flex flex-col">

        {/* ── Header ── */}
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
            <ThemeToggle />
            <button
              id="logout-btn"
              onClick={async () => {
                await fetch("/api/auth/session", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "destroy" }),
                });
                router.push("/login");
              }}
              title="Logout"
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 flex items-center justify-center transition-all duration-200"
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </header>

        {/* ── Balance Card ── */}
        <div className="px-5 mb-4">
          <BalanceSummaryCard
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            balance={balance}
            upcomingCount={upcomingItems.length}
            upcomingExpenseTotal={upcomingExpenseTotal}
          />
        </div>

        {/* ── Cashflow Graph ── */}
        <div className="px-5 mb-4">
          <CashflowGraph transactions={transactions} />
        </div>

        {/* ── Tab Navigation ── */}
        <div className="px-5 mb-4">
          <div className="flex gap-1.5 bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm border dark:border-slate-800 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 whitespace-nowrap min-w-0 relative ${
                  activeTab === tab.id
                    ? tab.id === "add-income"
                      ? "bg-emerald-500 text-white shadow-sm"
                      : tab.id === "add-expense"
                      ? "bg-rose-500 text-white shadow-sm"
                      : tab.id === "upcoming"
                      ? "bg-violet-500 text-white shadow-sm"
                      : "bg-slate-800 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                <span className="text-sm leading-none">{tab.icon}</span>
                <span>{tab.label}</span>
                {/* Upcoming badge */}
                {tab.id === "upcoming" && upcomingItems.length > 0 && activeTab !== "upcoming" && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {upcomingItems.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab Content ── */}
        <div className="flex-1 px-5 pb-8">

          {/* History Tab */}
          {activeTab === "history" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-slate-700 dark:text-slate-200 font-bold text-base">
                  All Transactions
                </h2>
                {transactions.length > 0 && (
                  <span className="text-slate-400 dark:text-slate-500 text-xs bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                    {transactions.length} records
                  </span>
                )}
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <LoadingSpinner size="lg" color="slate" />
                  <p className="text-slate-400 text-sm">Loading transactions…</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-5 text-center">
                  <p className="text-red-500 dark:text-red-400 font-medium text-sm mb-3">{error}</p>
                  <button
                    onClick={fetchTransactions}
                    className="text-sm text-red-600 dark:text-red-400 font-semibold underline"
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <TransactionList transactions={transactions} onDelete={handleDelete} />
              )}
            </div>
          )}

          {/* Add Income Tab */}
          {activeTab === "add-income" && (
            <AddTransactionForm type="income" onSuccess={handleTransactionAdded} />
          )}

          {/* Add Expense Tab */}
          {activeTab === "add-expense" && (
            <AddTransactionForm type="expense" onSuccess={handleTransactionAdded} />
          )}

          {/* Upcoming Tab */}
          {activeTab === "upcoming" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-slate-700 dark:text-slate-200 font-bold text-base">
                  Upcoming Payments
                </h2>
                {upcomingItems.length > 0 && (
                  <span className="text-violet-500 dark:text-violet-400 text-xs bg-violet-100 dark:bg-violet-900/30 px-2.5 py-1 rounded-full font-medium">
                    {upcomingItems.length} scheduled
                  </span>
                )}
              </div>

              {upcomingLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <LoadingSpinner size="lg" color="slate" />
                  <p className="text-slate-400 text-sm">Loading upcoming…</p>
                </div>
              ) : (
                <UpcomingList items={upcomingItems} onDelete={handleUpcomingDelete} />
              )}

              {/* Add upcoming form */}
              <div className="pt-2">
                <AddUpcomingForm onSuccess={handleUpcomingAdded} />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
