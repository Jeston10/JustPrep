import { NextRequest, NextResponse } from "next/server";
import { getUserLoginStreak } from "@/lib/actions/auth.action";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    console.log("🔍 [Daily Login Streak] User ID:", userId);
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    const streak = await getUserLoginStreak(userId);
    console.log("✅ [Daily Login Streak] Current streak:", streak);
    
    return NextResponse.json({
      success: true,
      streak: streak
    });
  } catch (error) {
    console.error("❌ [Daily Login Streak] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
} 