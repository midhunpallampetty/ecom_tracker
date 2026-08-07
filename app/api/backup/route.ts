import { NextResponse } from "next/server";
import { performBackup } from "@/lib/backupService";
import { initBackupCron } from "@/lib/backupCron";
import connectDB from "@/lib/mongodb";
import BackupLog from "@/models/BackupLog";

// Ensure cron is registered
initBackupCron();

export async function POST() {
  try {
    const result = await performBackup("manual");
    return NextResponse.json({
      success: result.success,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to execute manual backup",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();
    const recentLogs = await BackupLog.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        lastBackup: recentLogs[0] || null,
        recentLogs,
        cronActive: true,
        cronSchedule: "12:00 AM & 12:00 PM Daily (0 0,12 * * *)",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch backup status",
      },
      { status: 500 }
    );
  }
}
