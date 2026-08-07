"use client";

import { useState } from "react";
import BackupModal from "./BackupModal";
import { BackupResult } from "@/lib/backupService";

interface BackupButtonProps {
  compact?: boolean;
}

export default function BackupButton({ compact = false }: BackupButtonProps) {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [backupResult, setBackupResult] = useState<BackupResult | null>(null);

  const handleBackup = async () => {
    if (isBackingUp) return;

    setIsBackingUp(true);

    try {
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();

      if (json.success && json.data) {
        setBackupResult(json.data);
      } else {
        setBackupResult({
          success: false,
          status: "failed",
          isUpToDate: false,
          totalCollections: 0,
          totalDocumentsCopied: 0,
          collectionDetails: [],
          backupType: "manual",
          durationMs: 0,
          error: json.error || "Failed to trigger backup",
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      setBackupResult({
        success: false,
        status: "failed",
        isUpToDate: false,
        totalCollections: 0,
        totalDocumentsCopied: 0,
        collectionDetails: [],
        backupType: "manual",
        durationMs: 0,
        error: err?.message || "Network connection error",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsBackingUp(false);
      setModalOpen(true);
    }
  };

  return (
    <>
      {compact ? (
        <button
          onClick={handleBackup}
          disabled={isBackingUp}
          title={isBackingUp ? "Backing up data to Secondary DB..." : "Backup Data to Secondary DB"}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 relative overflow-hidden ${
            isBackingUp
              ? "glass-cyan text-cyan-300 border-cyan-500/50 glow-cyan animate-pulse cursor-wait"
              : "pill-cyan text-cyan-300 hover:scale-105 active:scale-95"
          }`}
        >
          {isBackingUp ? (
            <svg
              className="w-4 h-4 animate-spin text-cyan-300"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <span className="text-sm">☁️</span>
          )}
        </button>
      ) : (
        <button
          onClick={handleBackup}
          disabled={isBackingUp}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 relative overflow-hidden ${
            isBackingUp
              ? "glass-cyan text-cyan-300 border-cyan-500/50 glow-cyan animate-pulse cursor-wait shadow-lg"
              : "pill-cyan text-cyan-300 hover:scale-105 active:scale-95 shadow-md hover:shadow-cyan-500/20"
          }`}
        >
          {isBackingUp ? (
            <>
              <svg
                className="w-4 h-4 animate-spin text-cyan-300 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="tracking-wide animate-pulse">Backing up...</span>
            </>
          ) : (
            <>
              <span className="text-base leading-none">☁️</span>
              <span>Backup</span>
            </>
          )}
        </button>
      )}

      {/* Modal Result Alert */}
      <BackupModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        result={backupResult}
      />
    </>
  );
}
