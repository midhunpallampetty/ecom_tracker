import cron from "node-cron";
import { performBackup } from "./backupService";

declare global {
  // eslint-disable-next-line no-var
  var isBackupCronInitialized: boolean;
}

/**
 * Initializes the background cron task for database backups.
 * Scheduled to run twice daily at 12:00 AM (00:00) and 12:00 PM (12:00).
 * Cron pattern: `0 0,12 * * *`
 */
export function initBackupCron() {
  if (global.isBackupCronInitialized) {
    return;
  }

  global.isBackupCronInitialized = true;

  console.log("[Backup Cron] Initializing scheduled backups (12:00 AM and 12:00 PM daily)...");

  // Cron schedule: minute 0, hour 0 and 12, every day, month, day of week
  cron.schedule("0 0,12 * * *", async () => {
    console.log("[Backup Cron] Starting scheduled backup at", new Date().toISOString());
    try {
      const result = await performBackup("cron");
      console.log("[Backup Cron] Scheduled backup finished with status:", result.status);
    } catch (err) {
      console.error("[Backup Cron] Scheduled backup error:", err);
    }
  });
}

// Auto-initialize cron when module loaded
initBackupCron();
