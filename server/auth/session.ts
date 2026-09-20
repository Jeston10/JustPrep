// Next.js adapter for session-core (docs/SECURITY.md §2.1, ARCHITECTURE §7).
// `getCurrentUser` is wrapped in React.cache so a request verifies the cookie once, however many
// layouts, pages, and components ask. Server-only: importing this from a client component fails.

import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";

import { env } from "@/config/env";

import { AppError } from "@/server/errors";
import { logger } from "@/server/observability/logger";
import { setSentryUser } from "@/server/observability/sentry";

import { getAdminAuth, getDb } from "@/firebase/admin";

import {
  createSession as createSessionCore,
  destroySession as destroySessionCore,
  readSession,
  readSessionChecked,
  type SessionAuth,
  type SessionCookieStore,
  type SessionDeps,
} from "./session-core";

const isProduction = env.NODE_ENV === "production";

const nextCookieStore = async (): Promise<SessionCookieStore> => {
  const store = await cookies();
  return {
    get: (name) => store.get(name)?.value,
    set: (name, value, options) => {
      store.set(name, value, options);
    },
    delete: (name) => {
      store.delete(name);
    },
  };
};

// Vendor calls are resolved at call time, so the Admin SDK (and its credentials) is only touched
// when there is actually a cookie to verify or a session to create/revoke — never during a
// build-time prerender or an anonymous request.
const lazyAdminAuth: SessionAuth = {
  createSessionCookie: (idToken, options) => getAdminAuth().createSessionCookie(idToken, options),
  verifySessionCookie: (cookie, checkRevoked) =>
    getAdminAuth().verifySessionCookie(cookie, checkRevoked),
  revokeRefreshTokens: (uid) => getAdminAuth().revokeRefreshTokens(uid),
};

const deps = async (): Promise<SessionDeps> => ({
  auth: lazyAdminAuth,
  cookies: await nextCookieStore(),
  isProduction,
});

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  description?: string | undefined;
  photoURL?: string | undefined;
  lastLoginDate?: string | undefined;
  loginStreak?: number | undefined;
}

/** Firestore user document fields read by the session layer. Repository + converter arrive in P2.2. */
interface StoredUser {
  name?: unknown;
  email?: unknown;
  description?: unknown;
  photoURL?: unknown;
  lastLoginDate?: unknown;
  loginStreak?: unknown;
}

const asString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

const toSessionUser = (id: string, data: StoredUser): SessionUser => ({
  id,
  name: asString(data.name) ?? "",
  email: asString(data.email) ?? "",
  description: asString(data.description),
  photoURL: asString(data.photoURL),
  lastLoginDate: asString(data.lastLoginDate),
  loginStreak: typeof data.loginStreak === "number" ? data.loginStreak : undefined,
});

/** Exchange an ID token (from the Firebase client SDK) for the session cookie. */
export async function createSession(idToken: string): Promise<void> {
  await createSessionCore(await deps(), idToken);
}

/** Clear the cookie and revoke refresh tokens. */
export async function destroySession(): Promise<void> {
  await destroySessionCore(await deps());
}

/**
 * The signed-in user for this request, or null. Cached per request.
 * Does not check revocation (see readSessionChecked / requireUserChecked).
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const claims = await readSession(await deps());
  if (!claims) return null;
  setSentryUser(claims.uid);
  return loadUser(claims.uid);
});

/**
 * Like getCurrentUser but verifies revocation with Firebase. Use for sensitive operations only.
 * @public consumed by actions from P1.4
 */
export async function getCurrentUserChecked(): Promise<SessionUser | null> {
  const claims = await readSessionChecked(await deps());
  if (!claims) return null;
  return loadUser(claims.uid);
}

/**
 * Throws AppError('UNAUTHENTICATED') when there is no valid session. First line of every action.
 * @public consumed by actions from P1.4
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AppError("UNAUTHENTICATED");
  return user;
}

/** Sensitive-operation variant of requireUser (delete account, change email/password, export). */
export async function requireUserChecked(): Promise<SessionUser> {
  const user = await getCurrentUserChecked();
  if (!user) throw new AppError("UNAUTHENTICATED");
  return user;
}

async function loadUser(uid: string): Promise<SessionUser | null> {
  try {
    const snapshot = await getDb().collection("users").doc(uid).get();
    if (!snapshot.exists) return null;
    return toSessionUser(snapshot.id, snapshot.data() ?? {});
  } catch (error) {
    logger.error({ op: "session.loadUser", err: error }, "failed to load user document");
    return null;
  }
}
