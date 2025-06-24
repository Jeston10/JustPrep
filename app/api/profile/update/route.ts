import { NextRequest, NextResponse } from "next/server";
import { db, auth } from "@/firebase/admin";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    
    if (!sessionCookie) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    }

    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    const uid = decodedClaims.uid;

    const { description, photoURL } = await req.json();

    if (typeof description !== 'string' || typeof photoURL !== 'string') {
        return NextResponse.json({ success: false, message: "Invalid data provided" }, { status: 400 });
    }

    await db.collection("users").doc(uid).update({
      description,
      photoURL,
    });

    return NextResponse.json({ success: true, message: "Profile updated successfully" });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ success: false, message: "An unexpected error occurred." }, { status: 500 });
  }
} 