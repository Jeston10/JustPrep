import { NextResponse } from "next/server";

import { destroySession } from "@/server/auth/session";

export async function POST() {
  try {
    // Clear the session cookie
    await destroySession();

    return NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to sign out",
      },
      { status: 500 },
    );
  }
}
