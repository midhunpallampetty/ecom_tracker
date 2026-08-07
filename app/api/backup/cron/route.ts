import { NextResponse } from "next/server";
import { performBackup } from "@/lib/backupService";

export async function GET() {
  try {
    const result = await performBackup("cron");
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Cron backup error" },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
