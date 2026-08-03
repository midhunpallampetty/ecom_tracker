"use client";

import TransactionItem from "./TransactionItem";
import EmptyState from "./EmptyState";

interface Transaction {
  _id: string;
  amount: number;
  type: "income" | "expense";
  description: string;
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
  if (transactions.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction, index) => (
        <div
          key={transaction._id}
          className="animate-in fade-in slide-in-from-bottom-2"
          style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
        >
          <TransactionItem
            transaction={transaction}
            onDelete={onDelete}
          />
        </div>
      ))}
    </div>
  );
}
