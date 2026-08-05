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
  createdAt: string;
}

interface UpcomingItem {
  _id: string;
  amount: number;
  type: "income" | "expense";
  description: string;
  expectedDate: string;
}

interface ExportDataPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  upcomingItems: UpcomingItem[];
}

export default function ExportDataPromptModal({
  isOpen,
  onClose,
  transactions,
  upcomingItems,
}: ExportDataPromptModalProps) {
  const [copied, setCopied] = useState(false);
  const [promptFocus, setPromptFocus] = useState<"general" | "ecom" | "cashflow">("general");

  // Overall Financial Calculations
  const totalIncome = useMemo(
    () => transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
    [transactions]
  );

  const totalExpense = useMemo(
    () => transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    [transactions]
  );

  const balance = totalIncome - totalExpense;

  const upcomingIncomeTotal = useMemo(
    () => upcomingItems.filter((u) => u.type === "income").reduce((s, u) => s + u.amount, 0),
    [upcomingItems]
  );

  const upcomingExpenseTotal = useMemo(
    () => upcomingItems.filter((u) => u.type === "expense").reduce((s, u) => s + u.amount, 0),
    [upcomingItems]
  );

  const projectedNet = balance + upcomingIncomeTotal - upcomingExpenseTotal;

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

  const totalDeductions = totalCogs + totalFees + totalAdSpend;
  const netEcomProfit = totalIncome - totalDeductions - totalExpense;

  // Generate Prompt Text
  const generatedPrompt = useMemo(() => {
    const currentDate = new Date().toLocaleString("en-IN", {
      dateStyle: "full",
      timeStyle: "short",
    });

    let focusInstructions = "";
    if (promptFocus === "general") {
      focusInstructions = `1. Conduct a complete financial audit evaluating revenue, expense ratio, and profit margins.
2. Highlight key risk factors or opportunities for financial optimization.
3. Suggest 3 concrete action items to improve net cashflow balance.`;
    } else if (promptFocus === "ecom") {
      focusInstructions = `1. Analyze eCommerce product profitability, COGS ratio, platform fee impact, and Ad Spend ROAS.
2. Identify high-cost channels or SKUs requiring price adjustment or expense reduction.
3. Recommend strategies to boost net profit margin % while scaling sales.`;
    } else {
      focusInstructions = `1. Evaluate short-term cashflow health based on upcoming IN vs OUT scheduled payments.
2. Highlight potential cash crunches or liquidity shortfalls due in upcoming dates.
3. Suggest cashflow management strategies to prepare for upcoming due payments.`;
    }

    const upcomingLines =
      upcomingItems.length === 0
        ? "No scheduled upcoming payments."
        : upcomingItems
            .map(
              (item, i) =>
                `${i + 1}. [${item.type.toUpperCase()}] ${item.description || "N/A"} - Amount: ${formatCurrency(
                  item.amount
                )} | Due/Expected Date: ${new Date(item.expectedDate).toLocaleDateString("en-IN")}`
            )
            .join("\n");

    const transactionLines =
      transactions.length === 0
        ? "No recorded transactions."
        : transactions
            .map((t, i) => {
              const dateStr = new Date(t.createdAt).toLocaleDateString("en-IN");
              const typeStr = t.type.toUpperCase();
              const channelStr = t.channel ? ` | Channel: ${t.channel}` : "";
              const skuStr = t.sku ? ` | SKU: ${t.sku}` : "";
              const cogsStr = t.cogs ? ` | COGS: ${formatCurrency(t.cogs)}` : "";
              const feesStr = t.platformFee ? ` | Fee: ${formatCurrency(t.platformFee)}` : "";
              const adStr = t.adSpend ? ` | Ads: ${formatCurrency(t.adSpend)}` : "";
              return `${i + 1}. [${dateStr}] [${typeStr}] ${t.description || "Transaction"} - Amount: ${formatCurrency(
                t.amount
              )}${channelStr}${skuStr}${cogsStr}${feesStr}${adStr}`;
            })
            .join("\n");

    return `# 🤖 FINANCIAL & ECOMMERCE BUSINESS DATA SUMMARY PROMPT

**Generated On:** ${currentDate}
**Currency:** INR (₹)

---

## 1. 📊 FINANCIAL OVERVIEW & KPIS
- **Gross Sales / Income:** ${formatCurrency(totalIncome)}
- **Total Expenses:** ${formatCurrency(totalExpense)}
- **Realized Net Balance:** ${formatCurrency(balance)} (${balance >= 0 ? "PROFIT" : "LOSS"})
- **Upcoming IN (Expected Income):** ${formatCurrency(upcomingIncomeTotal)}
- **Upcoming OUT (Due Expenses):** ${formatCurrency(upcomingExpenseTotal)}
- **Projected Net Cashflow (Inc. Upcoming):** ${formatCurrency(projectedNet)}

### 🛒 eCommerce Cost Breakdown:
- **Cost of Goods Sold (COGS):** ${formatCurrency(totalCogs)}
- **Platform & Gateway Fees:** ${formatCurrency(totalFees)}
- **Ad Spend (Marketing):** ${formatCurrency(totalAdSpend)}
- **Total eCommerce Direct Deductions:** ${formatCurrency(totalDeductions)}
- **Estimated Net eCommerce Margin:** ${formatCurrency(netEcomProfit)}

---

## 2. 📅 SCHEDULED UPCOMING PAYMENTS (${upcomingItems.length} Items)
${upcomingLines}

---

## 3. 📋 RECENT TRANSACTIONS LOG (${transactions.length} Records)
${transactionLines}

---

## 🤖 INSTRUCTIONS FOR AI ANALYST:
You are an expert eCommerce CFO and Financial Analyst. Based on the comprehensive business data above:
${focusInstructions}
4. Provide a summary assessment in bullet points with clear, actionable advice.
`;
  }, [
    transactions,
    upcomingItems,
    totalIncome,
    totalExpense,
    balance,
    upcomingIncomeTotal,
    upcomingExpenseTotal,
    projectedNet,
    totalCogs,
    totalFees,
    totalAdSpend,
    totalDeductions,
    netEcomProfit,
    promptFocus,
  ]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback copy
      const textArea = document.createElement("textarea");
      textArea.value = generatedPrompt;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([generatedPrompt], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `eCom_Financial_Prompt_${new Date().toISOString().slice(0, 10)}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-xl">
              🤖
            </div>
            <div>
              <h2 className="text-white font-bold text-base leading-tight">
                Export Data as AI Prompt
              </h2>
              <p className="text-slate-400 text-xs">
                Generated from live sales, expenses, and upcoming payments
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

        {/* Prompt Focus Selectors */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-800/80 bg-slate-950/50 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Analysis Objective:
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPromptFocus("general")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                promptFocus === "general"
                  ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              📊 General Audit
            </button>
            <button
              onClick={() => setPromptFocus("ecom")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                promptFocus === "ecom"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              🛒 eCommerce Profit
            </button>
            <button
              onClick={() => setPromptFocus("cashflow")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                promptFocus === "cashflow"
                  ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              ⏳ Cashflow Risk
            </button>
          </div>
        </div>

        {/* Scrollable Textarea Preview */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-950">
          <textarea
            readOnly
            value={generatedPrompt}
            className="w-full h-80 bg-slate-900 text-slate-200 font-mono text-xs p-4 rounded-2xl border border-slate-800 focus:outline-none focus:border-violet-500/50 resize-none leading-relaxed"
          />
        </div>

        {/* Action Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-slate-400">
            Include {transactions.length} transactions & {upcomingItems.length} upcoming items
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
            >
              <span>📥</span>
              <span>Download .MD</span>
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 transition-all active:scale-95"
            >
              {copied ? (
                <>
                  <span>✓</span>
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <span>📋</span>
                  <span>Copy Prompt</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
