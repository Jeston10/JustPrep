"use server";

import { createSession, destroySession } from "@/server/auth/session";
import { opLogger } from "@/server/observability/logger";
import { recordDailyLogin } from "@/server/services/streak.service";

import { getAdminAuth, getDb } from "@/firebase/admin";

import { SignInActionSchema, SignUpActionSchema, type ActionResult } from "./schema";

// Both actions authenticate by verifying the Firebase ID token the client obtained from the
// Firebase Auth SDK. The token — not the client — is the source of uid and email.

export async function signUp(input: unknown): Promise<ActionResult> {
  const parsed = SignUpActionSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Invalid sign-up details." };

  try {
    const claims = await getAdminAuth().verifyIdToken(parsed.data.idToken);
    const users = getDb().collection("users").doc(claims.uid);
    if ((await users.get()).exists) {
      return { success: false, message: "User already exists. Please sign in." };
    }
    await users.set({ name: parsed.data.name, email: claims.email ?? "" });
    return { success: true, message: "Account created successfully. Please sign in." };
  } catch (error) {
    opLogger("auth.signUp").warn({ err: error }, "sign-up failed");
    return { success: false, message: "Failed to create account. Please try again." };
  }
}

export async function signIn(input: unknown): Promise<ActionResult> {
  const parsed = SignInActionSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "Invalid sign-in details." };

  try {
    const claims = await getAdminAuth().verifyIdToken(parsed.data.idToken);
    await createSession(parsed.data.idToken);
    await recordDailyLogin(claims.uid);
    return { success: true, message: "Signed in." };
  } catch (error) {
    opLogger("auth.signIn").warn({ err: error }, "sign-in failed");
    return { success: false, message: "Failed to log into account. Please try again." };
  }
}

export async function signOut(): Promise<ActionResult> {
  await destroySession();
  return { success: true, message: "Signed out." };
}
