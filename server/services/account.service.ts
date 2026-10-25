// Account export and deletion (docs/SECURITY.md §2.11). Both are "right to access" / "right to
// erasure" operations, so they are exhaustive by construction: USER_COLLECTIONS is the single
// list of everything the app stores per user, and both functions walk it. A new collection that
// holds user data is added there in the same PR that creates it — nothing else needs to change.
//
// Deletion order matters. Firestore documents go first, then the Auth user, then the side state
// (rate-limit windows, analytics person). If a later step fails, the user's data is already gone
// and the account cannot sign in; a partial failure is logged and surfaced, never silently
// swallowed, but it never leaves data behind.

import { type LimitName } from "@/config/limits";

import { requestAnalyticsDeletion } from "@/server/observability/analytics";
import { opLogger } from "@/server/observability/logger";
import { uidKey } from "@/server/ratelimit/keys";
import { type RateLimiter, getRateLimiter } from "@/server/ratelimit/ratelimit";

import { getAdminAuth, getDb } from "@/firebase/admin";

import type { Firestore, Query } from "firebase-admin/firestore";

/** Every collection holding documents that belong to a user, and the field that says so. */
const USER_COLLECTIONS = [
  { collection: "interviews", ownerField: "userId" },
  { collection: "feedback", ownerField: "userId" },
] as const;

/** Rate-limit windows keyed by uid; cleared on deletion so a recycled uid starts fresh. */
const UID_LIMITS: LimitName[] = [
  "interview.create",
  "feedback.create",
  "profile.update",
  "account.export",
  "account.delete",
];

/** Firestore allows 500 writes per batch; stay under it. */
const BATCH_SIZE = 400;

export interface AccountExport {
  exportedAt: string;
  userId: string;
  user: Record<string, unknown> | null;
  collections: Record<string, { id: string; [field: string]: unknown }[]>;
}

export interface DeletionSummary {
  /** Documents removed per collection, including the user document. */
  deleted: Record<string, number>;
}

const ownedQuery = (db: Firestore, collection: string, ownerField: string, userId: string): Query =>
  db.collection(collection).where(ownerField, "==", userId);

/**
 * Everything the app stores about a user, as plain JSON. Read-only; safe to call repeatedly.
 * Documents are returned verbatim (minus nothing) because it is the user's own data.
 */
export async function exportUserData(userId: string, db = getDb()): Promise<AccountExport> {
  const userSnapshot = await db.collection("users").doc(userId).get();
  const collections: AccountExport["collections"] = {};

  for (const { collection, ownerField } of USER_COLLECTIONS) {
    const snapshot = await ownedQuery(db, collection, ownerField, userId).get();
    collections[collection] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  return {
    exportedAt: new Date().toISOString(),
    userId,
    user: userSnapshot.exists ? (userSnapshot.data() ?? {}) : null,
    collections,
  };
}

/** Deletes every document a query matches, in batches. Returns how many were removed. */
const deleteQueryInBatches = async (db: Firestore, query: Query): Promise<number> => {
  let removed = 0;
  for (;;) {
    const snapshot = await query.limit(BATCH_SIZE).get();
    if (snapshot.empty) return removed;
    const batch = db.batch();
    for (const doc of snapshot.docs) batch.delete(doc.ref);
    await batch.commit();
    removed += snapshot.size;
    if (snapshot.size < BATCH_SIZE) return removed;
  }
};

/**
 * Irreversibly deletes the account: owned documents, the user document, the Auth user (which also
 * invalidates every session cookie), the uid's rate-limit windows, and the analytics person.
 * Callers must have re-authenticated the user (features/account/actions.ts).
 */
export async function deleteUserAccount(
  userId: string,
  deps: { db?: Firestore; limiter?: RateLimiter } = {},
): Promise<DeletionSummary> {
  const db = deps.db ?? getDb();
  const log = opLogger("account.delete", { userId });
  const deleted: Record<string, number> = {};

  for (const { collection, ownerField } of USER_COLLECTIONS) {
    deleted[collection] = await deleteQueryInBatches(
      db,
      ownedQuery(db, collection, ownerField, userId),
    );
  }

  await db.collection("users").doc(userId).delete();
  deleted.users = 1;

  // Removes the identity and revokes every outstanding session cookie and refresh token.
  await getAdminAuth().deleteUser(userId);

  // Side state: best-effort, because the account is already gone and retrying is the user's
  // problem to never have. Failures are logged with the uid so they can be cleaned up manually.
  const limiter = deps.limiter ?? getRateLimiter();
  await Promise.all(
    UID_LIMITS.map((name) =>
      limiter.reset(name, uidKey(userId)).catch((error: unknown) => {
        log.warn({ err: error, limit: name }, "failed to clear rate-limit window");
      }),
    ),
  );
  await requestAnalyticsDeletion(userId);

  log.info({ deleted }, "account deleted");
  return { deleted };
}
