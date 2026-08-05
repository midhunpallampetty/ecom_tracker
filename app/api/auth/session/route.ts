import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// POST /api/auth/session — create session (called after biometric success or register)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    const cookieStore = await cookies();

    if (action === "create") {
      // Set a simple session cookie valid for 30 days
      cookieStore.set("auth_session", "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });

      return NextResponse.json({ success: true });
    }

    if (action === "destroy") {
      cookieStore.delete("auth_session");
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// GET /api/auth/session — check session status
export async function GET() {
  const cookieStore = await cookies();
  const hasSession = cookieStore.has("auth_session");
  return NextResponse.json({ authenticated: hasSession });
}
