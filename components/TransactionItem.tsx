"use client";

import { useState } from "react";
import { formatCurrency, formatDate, formatTime } from "@/utils/formatCurrency";
import EditTransactionModal from "./EditTransactionModal";

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

interface TransactionItemProps {
  transaction: Transaction;
  onDelete: (id: string) => void;
  onUpdate: (updated: Transaction) => void;
  style?: React.CSSProperties;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹", USD: "$", EUR: "€", GBP: "£", AED: "د.إ", SGD: "S$",
};

export default function TransactionItem({ transaction, onDelete, onUpdate, style }: TransactionItemProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const [showEdit, setShowEdit]       = useState(false);

  const isIncome = transaction.type === "income";
  const totalDeductions = (transaction.cogs || 0) + (transaction.platformFee || 0) + (transaction.adSpend || 0);
  const netOrderProfit  = isIncome ? transaction.amount - totalDeductions : 0;
  const currSymbol = CURRENCY_SYMBOLS[transaction.currency || "INR"] || "₹";
  const isForeign  = transaction.currency && transaction.currency !== "INR";
  const inrValue   = isForeign ? transaction.amount * (transaction.currencyRate || 1) : transaction.amount;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res  = await fetch(`/api/transactions/${transaction._id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) onDelete(transaction._id);
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <div
        style={style}
        className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-all duration-300 hover:shadow-md group"
      >
        {/* Icon */}
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-bold text-xl ${
          isIncome ? "bg-gradient-to-br from-emerald-400 to-emerald-600" : "bg-gradient-to-br from-rose-400 to-rose-600"
        }`}>
          {isIncome ? "↑" : "↓"}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">
              {transaction.description || (isIncome ? "Income" : "Expense")}
            </p>
            {transaction.isRecurring && (
              <span title={`Recurring: ${transaction.recurringPeriod || "periodic"}`}
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 shrink-0">
                🔁 {transaction.recurringPeriod || "recurring"}
              </span>
            )}
            {transaction.channel && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 shrink-0">
                {transaction.channel}
              </span>
            )}
            {transaction.sku && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                SKU: {transaction.sku}
              </span>
            )}
            {transaction.orderId && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 shrink-0 border border-teal-200 dark:border-teal-800/40">
                #{transaction.orderId}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              isIncome
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400"
            }`}>
              {isIncome ? "Income" : "Expense"}
            </span>
            {isForeign && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40 font-semibold">
                {transaction.currency} {currSymbol}{transaction.amount.toLocaleString("en-IN")} → ₹{inrValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </span>
            )}
            <span className="text-slate-400 dark:text-slate-500 text-xs">
              {formatDate(transaction.createdAt)} · {formatTime(transaction.createdAt)}
            </span>
          </div>

          {/* eCommerce breakdown */}
          {isIncome && totalDeductions > 0 && (
            <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/60">
              {transaction.cogs      ? <span>COGS: ₹{transaction.cogs}</span>        : null}
              {transaction.platformFee ? <span>Fee: ₹{transaction.platformFee}</span> : null}
              {transaction.adSpend   ? <span>Ads: ₹{transaction.adSpend}</span>      : null}
              <span className="font-bold text-emerald-600 dark:text-emerald-400">Net: ₹{netOrderProfit}</span>
            </div>
          )}
        </div>

        {/* Amount + actions */}
        <div className="text-right flex-shrink-0">
          <p className={`font-bold text-base ${isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"}`}>
            {isIncome ? "+" : "−"}{formatCurrency(isForeign ? inrValue : transaction.amount)}
          </p>
          <div className="flex items-center gap-2 mt-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setShowEdit(true)}
              className="text-slate-300 dark:text-slate-600 hover:text-violet-400 dark:hover:text-violet-400 text-xs transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              className="text-slate-300 dark:text-slate-600 hover:text-red-400 dark:hover:text-red-400 text-xs transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {showEdit && (
        <EditTransactionModal
          transaction={transaction}
          onClose={() => setShowEdit(false)}
          onUpdate={(updated) => { onUpdate(updated); setShowEdit(false); }}
        />
      )}

      {/* Delete confirmation */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-5"
          onClick={() => !deleting && setShowConfirm(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-100 dark:border-slate-800 animate-in scale-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <span className="text-red-500 text-2xl">🗑</span>
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-center text-lg mb-2">Delete Transaction?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-center text-sm mb-6">
              This will permanently remove{" "}
              <span className={isIncome ? "text-emerald-600 font-semibold" : "text-rose-500 font-semibold"}>
                {isIncome ? "+" : "−"}{formatCurrency(transaction.amount)}
              </span>
              {" "}from your records.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={deleting}
                className="flex-1 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3.5 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors disabled:opacity-70 flex items-center justify-center gap-1.5 shadow-lg shadow-red-500/30"
              >
                {deleting ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /><span>Deleting…</span></>
                ) : (
                  <><span>🗑</span><span>Delete</span></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
