import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import UserSession from "@/models/UserSession";
import { getClientIp, parseUserAgent, getIpGeolocation } from "@/lib/ipGeoHelper";

// POST /api/auth/session — create or destroy session
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, authMethod = "master_password" } = body;

    const cookieStore = await cookies();

    if (action === "create") {
      const sessionId = crypto.randomUUID();

      // Set auth cookies
      cookieStore.set("auth_session", "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });

      cookieStore.set("auth_session_token", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });

      // Gather audit metadata
      const ip = getClientIp(request);
      const userAgent = request.headers.get("user-agent") || "";
      const parsedUa = parseUserAgent(userAgent);
      const geo = await getIpGeolocation(ip);

      try {
        await connectDB();
        await UserSession.create({
          sessionId,
          ipAddress: ip,
          userLocation: geo,
          deviceInfo: {
            deviceType: parsedUa.deviceType,
            os: parsedUa.os,
            browser: parsedUa.browser,
            rawUserAgent: userAgent,
          },
          authMethod: authMethod,
          status: "active",
          loginAt: new Date(),
          lastActiveAt: new Date(),
        });
      } catch (dbError) {
        console.error("Failed to record user session in DB:", dbError);
      }

      return NextResponse.json({ success: true, sessionId });
    }

    if (action === "destroy") {
      const sessionToken = cookieStore.get("auth_session_token")?.value;

      if (sessionToken) {
        try {
          await connectDB();
          await UserSession.findOneAndUpdate(
            { sessionId: sessionToken },
            { status: "revoked", lastActiveAt: new Date() }
          );
        } catch (dbError) {
          console.error("Failed to update session status on logout:", dbError);
        }
      }

      cookieStore.delete("auth_session");
      cookieStore.delete("auth_session_token");

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Session route error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// GET /api/auth/session — check session status
export async function GET() {
  const cookieStore = await cookies();
  const hasSession = cookieStore.has("auth_session");
  const sessionToken = cookieStore.get("auth_session_token")?.value || null;

  return NextResponse.json({ authenticated: hasSession, sessionToken });
}
