import { z } from "zod";

/** The word the user types to confirm an irreversible deletion. Compared case-sensitively. */
export const DELETE_CONFIRMATION = "DELETE";

/**
 * Deletion requires a *fresh* ID token: the client re-authenticates with the password
 * (`reauthenticateWithCredential`) and then calls `getIdToken(true)`, which updates `auth_time`.
 * The server checks that recency, so a stolen session cookie alone cannot delete an account.
 */
export const DeleteAccountSchema = z.object({
  idToken: z.string().min(20).max(4096),
  confirmation: z.literal(DELETE_CONFIRMATION, {
    error: `Type ${DELETE_CONFIRMATION} to confirm.`,
  }),
});
