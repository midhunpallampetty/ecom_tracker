"use client";

import { BackupResult } from "@/lib/backupService";

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: BackupResult | null;
}

export default function BackupModal({ isOpen, onClose, result }: BackupModalProps) {
  if (!isOpen || !result) return null;

  const isUpToDate = result.isUpToDate || result.status === "already_up_to_date";
  const isSuccess = result.success && result.status !== "failed";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg glass-dark border border-violet-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden text-slate-100">
        {/* Subtle background glow */}
        <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-30 ${isUpToDate ? "bg-cyan-500" : isSuccess ? "bg-emerald-500" : "bg-rose-500"}`} />

        {/* Modal Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-violet-500/20">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg ${
              isUpToDate
                ? "glass-cyan text-cyan-400 border-cyan-500/40 glow-cyan"
                : isSuccess
                ? "glass-emerald text-emerald-400 border-emerald-500/40 glow-emerald"
                : "glass-rose text-rose-400 border-rose-500/40 glow-rose"
            }`}>
              {isUpToDate ? "⚡" : isSuccess ? "☁️" : "⚠️"}
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">
                {isUpToDate
                  ? "Data Already Up To Date!"
                  : isSuccess
                  ? "Backup Completed Successfully"
                  : "Backup Sync Failed"}
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Secondary MongoDB Atlas Cluster 0
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl glass flex items-center justify-center text-slate-400 hover:text-white transition-all"
          >
            ✕
          </button>
        </div>

        {/* Notification Status Banner */}
        <div className={`p-4 rounded-2xl mb-6 border ${
          isUpToDate
            ? "bg-cyan-950/40 border-cyan-500/30 text-cyan-200"
            : isSuccess
            ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-200"
            : "bg-rose-950/40 border-rose-500/30 text-rose-200"
        }`}>
          <div className="flex items-start gap-3">
            <span className="text-lg">{isUpToDate ? "ℹ️" : isSuccess ? "✅" : "❌"}</span>
            <div className="text-xs space-y-1">
              <p className="font-bold text-sm">
                {isUpToDate
                  ? "No Changes Detected"
                  : isSuccess
                  ? `Synced ${result.totalDocumentsCopied} records across ${result.totalCollections} collections.`
                  : result.error || "An error occurred while backing up data."}
              </p>
              <p className="opacity-80">
                {isUpToDate
                  ? "Your secondary MongoDB backup database is perfectly synchronized with your primary database."
                  : isSuccess
                  ? "All latest transactions, budgets, sessions, and upcoming items were copied to secondary Atlas DB."
                  : "Please check your database network connection and Atlas permissions."}
              </p>
            </div>
          </div>
        </div>

        {/* Sync Summary Table */}
        {result.collectionDetails && result.collectionDetails.length > 0 && (
          <div className="mb-6 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
              <span>Collection</span>
              <span>Total / Synced</span>
              <span>Status</span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {result.collectionDetails.map((col) => (
                <div
                  key={col.name}
                  className="flex items-center justify-between p-3 rounded-xl glass border border-violet-500/10 text-xs"
                >
                  <div className="flex items-center gap-2 font-mono font-medium text-slate-200">
                    <span className="text-violet-400">📁</span>
                    <span>{col.name}</span>
                  </div>

                  <div className="font-semibold text-slate-300">
                    {col.count} docs
                  </div>

                  <div>
                    {col.status === "synced" ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Updated (+{col.syncedCount})
                      </span>
                    ) : col.status === "up_to_date" ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                        Up to date
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        Failed
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer info & close button */}
        <div className="pt-4 border-t border-violet-500/20 flex items-center justify-between text-xs text-slate-400">
          <div className="space-y-0.5">
            <p>⏱️ Execution: <span className="text-slate-200 font-semibold">{result.durationMs} ms</span></p>
            <p>⏰ Auto-Cron: <span className="text-cyan-400 font-medium">Daily 12 PM & 12 AM</span></p>
          </div>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl pill-violet font-bold text-white shadow-lg hover:scale-105 transition-all duration-200"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
