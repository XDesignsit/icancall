import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });

    // Clear the HTTP-only cookie by setting its maxAge to 0 and an expired date
    // Use the exact same SameSite=None and Secure attributes to ensure deletion across all browsers
    response.cookies.set("session", "", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
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
