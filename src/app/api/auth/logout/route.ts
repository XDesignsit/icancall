import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { endSession } from "@/lib/userSessions";

export async function POST() {
  try {
    // Drop this device's row from the active-sessions list as well as the
    // cookie, so it does not linger on the account page after signing out.
    try {
      const sessionToken = (await cookies()).get("session")?.value;
      const payload = sessionToken ? await verifySession(sessionToken) : null;
      if (payload?.userId && payload.sid) await endSession(payload.userId, payload.sid);
    } catch (err) {
      console.error("Failed to end session row on logout:", err);
    }

    const response = NextResponse.json({ success: true });

    // Clear the HTTP-only cookie by setting its maxAge to 0 and an expired date
    const isProd = process.env.NODE_ENV === "production";
    response.cookies.set("session", "", {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 0,
      expires: new Date(0),
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Logout API Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
