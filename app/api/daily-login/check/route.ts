import { NextRequest, NextResponse } from "next/server";
import { hasLoggedInToday } from "@/lib/actions/auth.action";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    console.log("🔍 [Daily Login Check] User ID:", userId);
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    const hasLoggedIn = await hasLoggedInToday(userId);
    console.log("✅ [Daily Login Check] Has logged in today:", hasLoggedIn);
    
    return NextResponse.json({
      success: true,
      hasLoggedInToday: hasLoggedIn
    });
  } catch (error) {
    console.error("❌ [Daily Login Check] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
} 