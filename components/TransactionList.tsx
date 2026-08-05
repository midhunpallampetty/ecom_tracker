"use client";

import { useState } from "react";
import TransactionItem from "./TransactionItem";
import EmptyState from "./EmptyState";

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

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

export default function TransactionList({
  transactions,
  onDelete,
}: TransactionListProps) {
  const [selectedChannel, setSelectedChannel] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  if (transactions.length === 0) {
    return <EmptyState />;
  }

  // Collect unique channels
  const channels = Array.from(
    new Set(
      transactions
        .map((t) => t.channel)
        .filter((c): c is string => Boolean(c && c.trim() !== ""))
    )
  );

  const filteredTransactions = transactions.filter((t) => {
    const matchesChannel =
      selectedChannel === "ALL" ||
      (selectedChannel === "UNSPECIFIED" && !t.channel) ||
      t.channel === selectedChannel;

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      t.description.toLowerCase().includes(query) ||
      (t.sku && t.sku.toLowerCase().includes(query)) ||
      (t.channel && t.channel.toLowerCase().includes(query));

    return matchesChannel && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Search & Channel Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2 justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search orders, SKU, description..."
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Channels pill filter */}
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
              All
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
      </div>

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
              style={{
                animationDelay: `${index * 40}ms`,
                animationFillMode: "both",
              }}
            >
              <TransactionItem
                transaction={transaction}
                onDelete={onDelete}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
