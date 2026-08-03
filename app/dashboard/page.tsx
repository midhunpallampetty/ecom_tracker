"use client";

import { useState, useEffect, useCallback } from "react";
import BalanceSummaryCard from "@/components/BalanceSummaryCard";
import AddTransactionForm from "@/components/AddTransactionForm";
import TransactionList from "@/components/TransactionList";
import ThemeToggle from "@/components/ThemeToggle";
import LoadingSpinner from "@/components/LoadingSpinner";

interface Transaction {
  _id: string;
  amount: number;
  type: "income" | "expense";
  description: string;
  createdAt: string;
}

type TabType = "history" | "add-income" | "add-expense";

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("history");

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

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleTransactionAdded = () => {
    setLoading(true);
    fetchTransactions();
    setActiveTab("history");
  };

  const handleDelete = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t._id !== id));
  };

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: "history", label: "History", icon: "📋" },
    { id: "add-income", label: "Add In", icon: "💚" },
    { id: "add-expense", label: "Add Out", icon: "🔴" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Mobile-first max width container */}
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
          <ThemeToggle />
        </header>

        {/* Balance Summary Card */}
        <div className="px-5 mb-5">
          <BalanceSummaryCard
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            balance={balance}
          />
        </div>

        {/* Tab Navigation */}
        <div className="px-5 mb-4">
          <div className="flex gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm border dark:border-slate-800">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab.id
                    ? tab.id === "add-income"
                      ? "bg-emerald-500 text-white shadow-sm"
                      : tab.id === "add-expense"
                      ? "bg-rose-500 text-white shadow-sm"
                      : "bg-slate-800 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                <span className="text-base leading-none">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 px-5 pb-8">
          {/* Transaction History Tab */}
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
                <TransactionList
                  transactions={transactions}
                  onDelete={handleDelete}
                />
              )}
            </div>
          )}

          {/* Add Income Tab */}
          {activeTab === "add-income" && (
            <AddTransactionForm
              type="income"
              onSuccess={handleTransactionAdded}
            />
          )}

          {/* Add Expense Tab */}
          {activeTab === "add-expense" && (
            <AddTransactionForm
              type="expense"
              onSuccess={handleTransactionAdded}
            />
          )}
        </div>
      </div>
    </div>
  );
}
