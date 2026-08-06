"use client";

import { useState } from "react";
import LoadingSpinner from "./LoadingSpinner";

export default function CsvExportButton() {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/transactions/export");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV export error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      id="csv-export-btn"
      onClick={handleExport}
      disabled={loading}
      title="Download all transactions as CSV"
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-600 dark:text-teal-400 text-xs font-bold border border-teal-200 dark:border-teal-800/60 transition-all duration-200 disabled:opacity-60"
    >
      {loading ? (
        <LoadingSpinner size="sm" />
      ) : (
        <>
          <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span>CSV</span>
        </>
      )}
    </button>
  );
}
