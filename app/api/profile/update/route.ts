import { type NextRequest, NextResponse } from "next/server";

import { requireUserChecked } from "@/server/auth/session";
import { isAppError } from "@/server/errors";

import { getDb } from "@/firebase/admin";

export async function POST(req: NextRequest) {
  try {
    // Profile edits are a sensitive operation: revocation is checked (RISKS R22).
    const { id: uid } = await requireUserChecked();

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
  } catch (error) {
    if (isAppError(error) && error.code === "UNAUTHENTICATED") {
      return NextResponse.json({ success: false, message: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}
