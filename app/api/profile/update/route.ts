import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

import { getAdminAuth, getDb } from "@/firebase/admin";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    }

    const decodedClaims = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    const uid = decodedClaims.uid;

    const { description, photoURL } = (await req.json()) as {
      description?: unknown;
      photoURL?: unknown;
    };

    if (typeof description !== "string" || typeof photoURL !== "string") {
      return NextResponse.json(
        { success: false, message: "Invalid data provided" },
        { status: 400 },
      );
    }

    await getDb().collection("users").doc(uid).update({
      description,
      photoURL,
    });

    return NextResponse.json({ success: true, message: "Profile updated successfully" });
  } catch {
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}
