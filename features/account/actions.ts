"use server";

import { requireUserChecked } from "@/server/auth/session";
import { AppError, isAppError } from "@/server/errors";
import { reportFailure } from "@/server/observability/report";
import { uidKey } from "@/server/ratelimit/keys";
import { enforceLimit } from "@/server/ratelimit/ratelimit";
import {
  type AccountExport,
  deleteUserAccount,
  exportUserData,
} from "@/server/services/account.service";

import { getAdminAuth } from "@/firebase/admin";

import { DeleteAccountSchema } from "./schema";

import type { ActionResult } from "@/features/auth/schema";

/**
 * How recently the user must have proved their password for deletion to proceed. The client
 * re-authenticates immediately before calling, so this is generous enough for a slow network
 * and short enough that an old token is useless.
 */
const REAUTH_MAX_AGE_SECONDS = 5 * 60;

/**
 * Verifies that `idToken` belongs to `userId` and was minted after a recent password
 * re-authentication. Throws AppError('UNAUTHENTICATED') otherwise (RISKS R22).
 */
const requireFreshReauth = async (idToken: string, userId: string, now = Date.now()) => {
  const claims = await getAdminAuth().verifyIdToken(idToken, true);
  if (claims.uid !== userId) throw new AppError("UNAUTHENTICATED");
  const ageSeconds = now / 1000 - claims.auth_time;
  if (ageSeconds > REAUTH_MAX_AGE_SECONDS) {
    throw new AppError("UNAUTHENTICATED", "Please confirm your password again.");
  }
};

export type ExportDataResult =
  { success: true; data: AccountExport } | { success: false; message: string };

/** The user's own data as JSON (right of access). Session must not be revoked. */
export async function exportData(): Promise<ExportDataResult> {
  try {
    const user = await requireUserChecked();
    await enforceLimit("account.export", uidKey(user.id));
    return { success: true, data: await exportUserData(user.id) };
  } catch (error) {
    if (isAppError(error)) return { success: false, message: error.message };
    reportFailure("account.export", error, "data export failed");
    return { success: false, message: "Could not export your data. Please try again." };
  }
}

/** Irreversibly deletes the signed-in account after a fresh password re-authentication. */
export async function deleteAccount(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireUserChecked();
    const parsed = DeleteAccountSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid request." };
    }
    await enforceLimit("account.delete", uidKey(user.id));
    await requireFreshReauth(parsed.data.idToken, user.id);
    await deleteUserAccount(user.id);
    return { success: true, message: "Your account and all of its data have been deleted." };
  } catch (error) {
    if (isAppError(error)) return { success: false, message: error.message };
    reportFailure("account.delete", error, "account deletion failed");
    return { success: false, message: "Could not delete your account. Please try again." };
  }
}
