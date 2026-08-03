"use client";

interface QuickAmountButtonsProps {
  onSelect: (amount: number) => void;
  selectedAmount: string;
  type: "income" | "expense";
}

const QUICK_AMOUNTS = [10, 20, 50, 100, 200, 500];

export default function QuickAmountButtons({
  onSelect,
  selectedAmount,
  type,
}: QuickAmountButtonsProps) {
  const activeColor =
    type === "income"
      ? "bg-emerald-500 text-white shadow-emerald-200 dark:shadow-emerald-900 shadow-md"
      : "bg-rose-500 text-white shadow-rose-200 dark:shadow-rose-900 shadow-md";

  const inactiveColor =
    "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700";

  return (
    <div className="flex flex-wrap gap-2">
      {QUICK_AMOUNTS.map((amount) => (
        <button
          key={amount}
          type="button"
          onClick={() => onSelect(amount)}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95 ${
            selectedAmount === String(amount) ? activeColor : inactiveColor
          }`}
        >
          ₹{amount}
        </button>
      ))}
    </div>
  );
}
