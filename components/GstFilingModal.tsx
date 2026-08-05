"use client";

import { useState, useMemo } from "react";
import { formatCurrency } from "@/utils/formatCurrency";

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
  gstRate?: number;
  gstAmount?: number;
  createdAt: string;
}

interface GstFilingModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
}

export default function GstFilingModal({ isOpen, onClose, transactions }: GstFilingModalProps) {
  const [selectedGstRate, setSelectedGstRate] = useState<number>(18);
  const [isGstInclusive, setIsGstInclusive] = useState<boolean>(true);
  const [copied, setCopied] = useState(false);

  // Sales (Outward Supplies) Calculations
  const salesTransactions = useMemo(
    () => transactions.filter((t) => t.type === "income"),
    [transactions]
  );

  const expenseTransactions = useMemo(
    () => transactions.filter((t) => t.type === "expense"),
    [transactions]
  );

  const totalGrossSales = useMemo(
    () => salesTransactions.reduce((s, t) => s + t.amount, 0),
    [salesTransactions]
  );

  const totalCogs = useMemo(
    () => transactions.reduce((s, t) => s + (t.cogs || 0), 0),
    [transactions]
  );

  const totalFees = useMemo(
    () => transactions.reduce((s, t) => s + (t.platformFee || 0), 0),
    [transactions]
  );

  const totalAdSpend = useMemo(
    () => transactions.reduce((s, t) => s + (t.adSpend || 0), 0),
    [transactions]
  );

  const totalGeneralExpenses = useMemo(
    () => expenseTransactions.reduce((s, t) => s + t.amount, 0),
    [expenseTransactions]
  );

  // GST Output & Input Tax Credit (ITC) Calculations
  const gstMath = useMemo(() => {
    let taxableSales = 0;
    let outputGst = 0;

    if (isGstInclusive) {
      taxableSales = totalGrossSales / (1 + selectedGstRate / 100);
      outputGst = totalGrossSales - taxableSales;
    } else {
      taxableSales = totalGrossSales;
      outputGst = totalGrossSales * (selectedGstRate / 100);
    }

    // Input Tax Credit (ITC) Breakdown
    // COGS GST (Purchases)
    const cogsItc = totalCogs * (selectedGstRate / 100);
    // Ad Spend GST (Meta/Google Ads standard 18% GST)
    const adSpendItc = totalAdSpend * 0.18;
    // Platform Fee GST (Shopify/Amazon/Gateway 18% GST)
    const platformFeeItc = totalFees * 0.18;
    // Other Business Expenses GST
    const expenseItc = totalGeneralExpenses * (selectedGstRate / 100);

    const totalItc = cogsItc + adSpendItc + platformFeeItc + expenseItc;
    const netGstPayable = outputGst - totalItc;

    return {
      taxableSales,
      outputGst,
      cogsItc,
      adSpendItc,
      platformFeeItc,
      expenseItc,
      totalItc,
      netGstPayable,
    };
  }, [totalGrossSales, selectedGstRate, isGstInclusive, totalCogs, totalAdSpend, totalFees, totalGeneralExpenses]);

  // Channel-wise Sales GST Breakdown
  const channelGstBreakdown = useMemo(() => {
    const map: Record<string, { gross: number; outputGst: number }> = {};
    salesTransactions.forEach((t) => {
      const channelName = t.channel?.trim() || "Direct / Store";
      if (!map[channelName]) map[channelName] = { gross: 0, outputGst: 0 };
      map[channelName].gross += t.amount;
      const gstVal = isGstInclusive
        ? t.amount - t.amount / (1 + selectedGstRate / 100)
        : t.amount * (selectedGstRate / 100);
      map[channelName].outputGst += gstVal;
    });
    return Object.entries(map).map(([channel, data]) => ({ channel, ...data }));
  }, [salesTransactions, isGstInclusive, selectedGstRate]);

  // CSV Report Generator
  const generateCsvReport = () => {
    let csv = "GST & TAX FILING REPORT (GSTR-1 & GSTR-3B READY)\n";
    csv += `Generated Date,${new Date().toLocaleDateString("en-IN")}\n`;
    csv += `GST Slab Rate,${selectedGstRate}%\n`;
    csv += `Price Type,${isGstInclusive ? "GST Inclusive" : "GST Exclusive"}\n\n`;

    csv += "OUTWARD SUPPLIES (SALES OUTPUT TAX)\n";
    csv += `Gross Sales Revenue,${totalGrossSales.toFixed(2)}\n`;
    csv += `Taxable Sales Value,${gstMath.taxableSales.toFixed(2)}\n`;
    csv += `Output GST Liability,${gstMath.outputGst.toFixed(2)}\n\n`;

    csv += "INPUT TAX CREDIT (ELIGIBLE ITC)\n";
    csv += `ITC on Inventory COGS,${gstMath.cogsItc.toFixed(2)}\n`;
    csv += `ITC on Ad Spend (Meta/Google 18%),${gstMath.adSpendItc.toFixed(2)}\n`;
    csv += `ITC on Platform Fees (18%),${gstMath.platformFeeItc.toFixed(2)}\n`;
    csv += `ITC on Operating Expenses,${gstMath.expenseItc.toFixed(2)}\n`;
    csv += `Total Eligible ITC,${gstMath.totalItc.toFixed(2)}\n\n`;

    csv += "NET GST LIABILITY\n";
    csv += `Net GST Payable / Refund,${gstMath.netGstPayable.toFixed(2)}\n\n`;

    csv += "CHANNEL-WISE SALES GST BREAKDOWN\n";
    csv += "Channel,Gross Sales,Output GST\n";
    channelGstBreakdown.forEach((c) => {
      csv += `"${c.channel}",${c.gross.toFixed(2)},${c.outputGst.toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `GST_Filing_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopySummary = async () => {
    const text = `🏛️ GST & TAX FILING SUMMARY REPORT
Date: ${new Date().toLocaleDateString("en-IN")}
GST Rate: ${selectedGstRate}% (${isGstInclusive ? "Inclusive" : "Exclusive"})

📊 OUTWARD SALES TAX (OUTPUT GST)
- Gross Sales: ${formatCurrency(totalGrossSales)}
- Taxable Value: ${formatCurrency(gstMath.taxableSales)}
- Output GST Liability: ${formatCurrency(gstMath.outputGst)}

💳 INPUT TAX CREDIT (ELIGIBLE ITC)
- Inventory COGS ITC: ${formatCurrency(gstMath.cogsItc)}
- Meta/Google Ads ITC (18%): ${formatCurrency(gstMath.adSpendItc)}
- Platform & Gateway ITC (18%): ${formatCurrency(gstMath.platformFeeItc)}
- General Expenses ITC: ${formatCurrency(gstMath.expenseItc)}
- Total Eligible ITC: ${formatCurrency(gstMath.totalItc)}

💵 NET GST CASH PAYABLE: ${formatCurrency(gstMath.netGstPayable)}
(${gstMath.netGstPayable >= 0 ? "Amount to Pay in Tax Vault" : "GST Refund Claimable"})
`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* silent */
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xl">
              🏛️
            </div>
            <div>
              <h2 className="text-white font-bold text-base leading-tight">
                GST & Tax Filing Assistant
              </h2>
              <p className="text-slate-400 text-xs">
                GSTR-1 & GSTR-3B Tax Liability & Input Tax Credit (ITC) Calculator
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* GST Configuration Bar */}
        <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              GST Slab Rate:
            </span>
            <div className="flex gap-1.5">
              {[5, 12, 18, 28].map((rate) => (
                <button
                  key={rate}
                  onClick={() => setSelectedGstRate(rate)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    selectedGstRate === rate
                      ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {rate}%
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Pricing Mode:</span>
            <button
              onClick={() => setIsGstInclusive(!isGstInclusive)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all border ${
                isGstInclusive
                  ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-400"
                  : "bg-slate-800 border-slate-700 text-slate-300"
              }`}
            >
              {isGstInclusive ? "GST Inclusive" : "GST Exclusive"}
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 bg-slate-950 flex-1">
          {/* Net GST Payable Highlight Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/20 via-slate-900 to-slate-900 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                Net GST Payable / Reserve Vault
              </p>
              <h3 className="text-3xl font-extrabold text-white">
                {gstMath.netGstPayable >= 0 ? "+" : "−"} {formatCurrency(Math.abs(gstMath.netGstPayable))}
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                {gstMath.netGstPayable >= 0
                  ? "Set aside this amount in your bank for GSTR-3B tax payment."
                  : "You have excess Input Tax Credit (ITC) claimable as a refund."}
              </p>
            </div>

            <div className="shrink-0 bg-black/40 p-3 rounded-xl border border-white/10 space-y-1 text-xs">
              <div className="flex justify-between gap-4 text-emerald-400 font-medium">
                <span>Output GST (Sales):</span>
                <span>+{formatCurrency(gstMath.outputGst)}</span>
              </div>
              <div className="flex justify-between gap-4 text-rose-400 font-medium">
                <span>Total Eligible ITC:</span>
                <span>−{formatCurrency(gstMath.totalItc)}</span>
              </div>
            </div>
          </div>

          {/* Outward vs Input Tax Credit Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Outward Sales Tax */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                <span>📤</span>
                <span>Outward Supplies (Sales GST)</span>
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Gross Sales Revenue:</span>
                  <span className="text-white font-semibold">{formatCurrency(totalGrossSales)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Taxable Base Value:</span>
                  <span className="text-white font-semibold">{formatCurrency(gstMath.taxableSales)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-800 text-emerald-400 font-bold">
                  <span>Output GST Collected ({selectedGstRate}%):</span>
                  <span>{formatCurrency(gstMath.outputGst)}</span>
                </div>
              </div>
            </div>

            {/* Input Tax Credit (ITC) */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                <span>📥</span>
                <span>Input Tax Credit (ITC Purchases & Fees)</span>
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>ITC on Inventory Purchases (COGS):</span>
                  <span className="text-white font-semibold">{formatCurrency(gstMath.cogsItc)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>ITC on Meta & Google Ads (18%):</span>
                  <span className="text-white font-semibold">{formatCurrency(gstMath.adSpendItc)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>ITC on Platform Fees (18%):</span>
                  <span className="text-white font-semibold">{formatCurrency(gstMath.platformFeeItc)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>ITC on General Expenses:</span>
                  <span className="text-white font-semibold">{formatCurrency(gstMath.expenseItc)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-800 text-amber-400 font-bold">
                  <span>Total Eligible ITC Credit:</span>
                  <span>{formatCurrency(gstMath.totalItc)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Channel-Wise GST Table */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center justify-between">
              <span>🛒 Channel-Wise Sales GST Breakdown</span>
              <span className="text-slate-500 font-normal">{channelGstBreakdown.length} channels</span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                    <th className="pb-2 px-2">Channel</th>
                    <th className="pb-2 px-2 text-right">Gross Sales</th>
                    <th className="pb-2 px-2 text-right">Output GST ({selectedGstRate}%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {channelGstBreakdown.map((row) => (
                    <tr key={row.channel} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-2 font-medium text-slate-200">{row.channel}</td>
                      <td className="py-2.5 px-2 text-right text-emerald-400 font-semibold">
                        {formatCurrency(row.gross)}
                      </td>
                      <td className="py-2.5 px-2 text-right text-white font-semibold">
                        {formatCurrency(row.outputGst)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-slate-400">
            Calculated from {transactions.length} sales & expense records
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopySummary}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
            >
              {copied ? "✓ Copied!" : "📋 Copy GST Summary"}
            </button>

            <button
              onClick={generateCsvReport}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all active:scale-95"
            >
              <span>📥</span>
              <span>Download GSTR Report (.CSV)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
