import { NextRequest, NextResponse } from "next/server";
import { hasLoggedInToday } from "@/lib/actions/auth.action";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    const hasLoggedIn = await hasLoggedInToday(userId);
    
    return NextResponse.json({
      success: true,
      hasLoggedInToday: hasLoggedIn
    });
  } catch (error) {
    console.error("Error checking daily login:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
} 