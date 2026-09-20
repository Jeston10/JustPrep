"use server";

import { requireUserChecked } from "@/server/auth/session";
import { isAppError } from "@/server/errors";
import { opLogger } from "@/server/observability/logger";
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
    return { success: true, message: "Profile updated." };
  } catch (error) {
    if (isAppError(error)) return { success: false, message: error.message };
    opLogger("profile.update").error({ err: error }, "profile update failed");
    return { success: false, message: "Could not update your profile. Please try again." };
  }
}
