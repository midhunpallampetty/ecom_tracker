"use client";

import { useState } from "react";
import TransactionItem from "./TransactionItem";
import EmptyState from "./EmptyState";
import CsvExportButton from "./CsvExportButton";

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
  orderId?: string;
  currency?: string;
  currencyRate?: number;
  isRecurring?: boolean;
  recurringPeriod?: string;
  createdAt: string;
}

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onUpdate: (updated: Transaction) => void;
}

export default function TransactionList({ transactions, onDelete, onUpdate }: TransactionListProps) {
  const [selectedChannel, setSelectedChannel] = useState<string>("ALL");
  const [selectedType, setSelectedType]       = useState<"ALL" | "income" | "expense">("ALL");
  const [searchQuery, setSearchQuery]          = useState<string>("");
  const [dateFrom, setDateFrom]                = useState<string>("");
  const [dateTo, setDateTo]                    = useState<string>("");

  if (transactions.length === 0) return <EmptyState />;

  // Unique channels
  const channels = Array.from(
    new Set(transactions.map((t) => t.channel).filter((c): c is string => Boolean(c && c.trim() !== "")))
  );

  const filteredTransactions = transactions.filter((t) => {
    const matchesChannel =
      selectedChannel === "ALL" ||
      (selectedChannel === "UNSPECIFIED" && !t.channel) ||
      t.channel === selectedChannel;

    const matchesType =
      selectedType === "ALL" || t.type === selectedType;

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      t.description.toLowerCase().includes(query) ||
      (t.sku && t.sku.toLowerCase().includes(query)) ||
      (t.channel && t.channel.toLowerCase().includes(query)) ||
      (t.orderId && t.orderId.toLowerCase().includes(query));

    const txDate = new Date(t.createdAt);
    const fromOk = !dateFrom || txDate >= new Date(dateFrom);
    const toOk   = !dateTo   || txDate <= new Date(dateTo + "T23:59:59");

    return matchesChannel && matchesType && matchesSearch && fromOk && toOk;
  });

  const hasDateFilter = dateFrom || dateTo;
  const clearDates = () => { setDateFrom(""); setDateTo(""); };

  return (
    <div className="space-y-4">
      {/* Search row */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search orders, SKU, description, order ID..."
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs hover:text-slate-600">✕</button>
          )}
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-1">
          {(["ALL", "income", "expense"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedType === t
                  ? t === "income"  ? "bg-emerald-500 text-white"
                  : t === "expense" ? "bg-rose-500 text-white"
                  : "bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              {t === "ALL" ? "All" : t === "income" ? "Income" : "Expense"}
            </button>
          ))}
        </div>

        <CsvExportButton />
      </div>

      {/* Date range filter */}
      <div className="flex flex-col sm:flex-row gap-2 items-center">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">📅 From</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
          />
          <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">To</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
          />
        </div>
        {hasDateFilter && (
          <button onClick={clearDates} className="text-[10px] font-bold text-slate-400 hover:text-rose-400 transition-colors px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 whitespace-nowrap">
            Clear dates ✕
          </button>
        )}
      </div>

      {/* Channel filters */}
      {channels.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedChannel("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedChannel === "ALL"
                ? "bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            All Channels
          </button>
          {channels.map((ch) => (
            <button
              key={ch}
              onClick={() => setSelectedChannel(ch)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedChannel === ch
                  ? "bg-violet-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              {ch}
            </button>
          ))}
        </div>
      )}

      {/* Results summary */}
      {(filteredTransactions.length !== transactions.length) && (
        <div className="text-[10px] text-slate-400 dark:text-slate-500 text-right">
          Showing {filteredTransactions.length} of {transactions.length} records
        </div>
      )}

      {/* List */}
      {filteredTransactions.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
          <p className="text-slate-400 text-xs">No matching transactions found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((transaction, index) => (
            <div
              key={transaction._id}
              className="animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: `${index * 40}ms`, animationFillMode: "both" }}
            >
              <TransactionItem
                transaction={transaction}
                onDelete={onDelete}
                onUpdate={onUpdate}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
