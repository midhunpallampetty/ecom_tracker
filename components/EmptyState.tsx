export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      {/* Animated wallet icon */}
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center shadow-inner">
          <span className="text-4xl select-none">💰</span>
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
          <span className="text-white text-sm font-bold">+</span>
        </div>
      </div>

      <h3 className="font-bold text-slate-700 dark:text-slate-300 text-xl mb-2 text-center">
        No Transactions Yet
      </h3>
      <p className="text-slate-400 dark:text-slate-500 text-sm text-center max-w-xs leading-relaxed">
        Start tracking your money by adding your first income or expense above.
      </p>

      {/* Animated dots */}
      <div className="flex gap-1.5 mt-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
