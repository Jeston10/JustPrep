"use server";

import { requireUserChecked } from "@/server/auth/session";
import { isAppError } from "@/server/errors";
import { captureServerEvent } from "@/server/observability/analytics";
import { reportFailure } from "@/server/observability/report";
import { uidKey } from "@/server/ratelimit/keys";
import { enforceLimit } from "@/server/ratelimit/ratelimit";

import { getDb } from "@/firebase/admin";

import { UpdateProfileSchema } from "./schema";

import type { ActionResult } from "@/features/auth/schema";

export async function updateProfile(input: unknown): Promise<ActionResult> {
  try {
    // Sensitive operation: revocation is checked (RISKS R22).
    const user = await requireUserChecked();
    const parsed = UpdateProfileSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid profile." };
    }
    await enforceLimit("profile.update", uidKey(user.id));
    await getDb().collection("users").doc(user.id).update(parsed.data);
    captureServerEvent("profile.updated", user.id);
    return { success: true, message: "Profile updated." };
  } catch (error) {
    if (isAppError(error)) return { success: false, message: error.message };
    reportFailure("profile.update", error, "profile update failed");
    return { success: false, message: "Could not update your profile. Please try again." };
  }
}
