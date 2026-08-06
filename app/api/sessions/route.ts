import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import UserSession from "@/models/UserSession";

// GET /api/sessions — fetch logged user history, active sessions, device breakdown, and heatmap coordinates
export async function GET() {
  try {
    const cookieStore = await cookies();
    const hasSession = cookieStore.has("auth_session");

    if (!hasSession) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const currentSessionId = cookieStore.get("auth_session_token")?.value || "";

    await connectDB();

    // Fetch all user session history (up to last 200 records)
    const sessions = await UserSession.find().sort({ loginAt: -1 }).limit(200).lean();

    // If database is empty, return empty sets
    if (!sessions || sessions.length === 0) {
      return NextResponse.json({
        success: true,
        currentSessionId,
        activeSessions: [],
        history: [],
        deviceStats: {
          desktop: 0,
          phone: 0,
          tablet: 0,
          other: 0,
          desktopPercent: 0,
          phonePercent: 0,
          tabletPercent: 0,
          total: 0,
        },
        locationHeatmap: [],
      });
    }

    // 1. Separate Active Sessions vs History
    const activeSessions = sessions.filter((s) => s.status === "active");

    // 2. Compute Device Breakdown Statistics
    let desktop = 0;
    let phone = 0;
    let tablet = 0;
    let other = 0;

    sessions.forEach((s) => {
      const dType = s.deviceInfo?.deviceType;
      if (dType === "desktop") desktop++;
      else if (dType === "phone") phone++;
      else if (dType === "tablet") tablet++;
      else other++;
    });

    const totalCount = sessions.length;
    const deviceStats = {
      desktop,
      phone,
      tablet,
      other,
      total: totalCount,
      desktopPercent: totalCount > 0 ? Math.round((desktop / totalCount) * 100) : 0,
      phonePercent: totalCount > 0 ? Math.round((phone / totalCount) * 100) : 0,
      tabletPercent: totalCount > 0 ? Math.round((tablet / totalCount) * 100) : 0,
    };

    // 3. Compute Location Heatmap Aggregation
    const locationMap: Record<
      string,
      {
        city: string;
        region: string;
        country: string;
        countryCode: string;
        latitude: number;
        longitude: number;
        count: number;
        lastLogin: Date;
        devices: Record<string, number>;
      }
    > = {};

    let maxCount = 1;

    sessions.forEach((s) => {
      const loc = s.userLocation;
      if (!loc || !loc.latitude || !loc.longitude) return;

      const key = `${loc.city}, ${loc.country}`;

      if (!locationMap[key]) {
        locationMap[key] = {
          city: loc.city || "Unknown",
          region: loc.region || "",
          country: loc.country || "Unknown",
          countryCode: loc.countryCode || "XX",
          latitude: loc.latitude,
          longitude: loc.longitude,
          count: 0,
          lastLogin: s.loginAt,
          devices: {},
        };
      }

      const entry = locationMap[key];
      entry.count += 1;
      if (entry.count > maxCount) maxCount = entry.count;

      const dev = s.deviceInfo?.deviceType || "desktop";
      entry.devices[dev] = (entry.devices[dev] || 0) + 1;

      if (new Date(s.loginAt) > new Date(entry.lastLogin)) {
        entry.lastLogin = s.loginAt;
      }
    });

    const locationHeatmap = Object.values(locationMap).map((loc) => ({
      ...loc,
      intensity: Number((loc.count / maxCount).toFixed(2)),
      topDevice: Object.entries(loc.devices).sort((a, b) => b[1] - a[1])[0]?.[0] || "desktop",
    }));

    return NextResponse.json({
      success: true,
      currentSessionId,
      activeSessions,
      history: sessions,
      deviceStats,
      locationHeatmap,
    });
  } catch (err) {
    console.error("GET /api/sessions error:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch session history" }, { status: 500 });
  }
}

// DELETE /api/sessions — revoke session(s)
export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const hasSession = cookieStore.has("auth_session");
    if (!hasSession) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const currentSessionId = cookieStore.get("auth_session_token")?.value || "";

    const { sessionId, revokeAllOthers } = await request.json();

    await connectDB();

    if (revokeAllOthers) {
      // Revoke all active sessions except current
      await UserSession.updateMany(
        { sessionId: { $ne: currentSessionId }, status: "active" },
        { status: "revoked", lastActiveAt: new Date() }
      );
      return NextResponse.json({ success: true, message: "All other sessions revoked" });
    }

    if (sessionId) {
      await UserSession.findOneAndUpdate(
        { sessionId },
        { status: "revoked", lastActiveAt: new Date() }
      );

      // If user revoked current session, destroy cookies too
      if (sessionId === currentSessionId) {
        cookieStore.delete("auth_session");
        cookieStore.delete("auth_session_token");
      }

      return NextResponse.json({ success: true, message: "Session revoked" });
    }

    return NextResponse.json({ success: false, error: "Invalid request params" }, { status: 400 });
  } catch (err) {
    console.error("DELETE /api/sessions error:", err);
    return NextResponse.json({ success: false, error: "Failed to revoke session" }, { status: 500 });
  }
}
