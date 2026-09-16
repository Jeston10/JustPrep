// Session logic with no Next.js or vendor imports (docs/SECURITY.md §2.1). The Next adapter in
// ./session.ts supplies the cookie store and firebase-admin; tests supply fakes.
//
// Invariants:
// - The session cookie is httpOnly, secure in production, sameSite=lax, path=/, 7-day lifetime.
// - In production the cookie is `__Host-` prefixed (browser-enforced: secure, path=/, no domain).
// - `readSession` never checks revocation (one cheap verification per request); sensitive
//   operations call `readSessionChecked`, which does (RISKS R22).

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export const sessionCookieName = (isProduction: boolean): string =>
  isProduction ? "__Host-session" : "session";

export interface SessionClaims {
  uid: string;
}

/** Minimal surface of firebase-admin Auth that session logic depends on. */
export interface SessionAuth {
  createSessionCookie(idToken: string, options: { expiresIn: number }): Promise<string>;
  verifySessionCookie(cookie: string, checkRevoked: boolean): Promise<SessionClaims>;
  revokeRefreshTokens(uid: string): Promise<void>;
}

export interface CookieOptions {
  maxAge: number;
  httpOnly: true;
  secure: boolean;
  path: "/";
  sameSite: "lax";
}

export interface SessionCookieStore {
  get(name: string): string | undefined;
  set(name: string, value: string, options: CookieOptions): void;
  delete(name: string): void;
}

export interface SessionDeps {
  auth: SessionAuth;
  cookies: SessionCookieStore;
  isProduction: boolean;
}

export const cookieOptions = (isProduction: boolean): CookieOptions => ({
  maxAge: SESSION_TTL_SECONDS,
  httpOnly: true,
  secure: isProduction,
  path: "/",
  sameSite: "lax",
});

/** Exchange a Firebase ID token for a session cookie and store it. */
export async function createSession(deps: SessionDeps, idToken: string): Promise<void> {
  const cookie = await deps.auth.createSessionCookie(idToken, {
    expiresIn: SESSION_TTL_SECONDS * 1000,
  });
  deps.cookies.set(sessionCookieName(deps.isProduction), cookie, cookieOptions(deps.isProduction));
}

/** Verify the stored session cookie. Returns null when absent, invalid, or expired. */
export async function readSession(
  deps: SessionDeps,
  options: { checkRevoked?: boolean } = {},
): Promise<SessionClaims | null> {
  const cookie = deps.cookies.get(sessionCookieName(deps.isProduction));
  if (!cookie) return null;
  try {
    return await deps.auth.verifySessionCookie(cookie, options.checkRevoked ?? false);
  } catch {
    return null;
  }
}

/** Verification that also consults Firebase for revocation. For sensitive operations only. */
export const readSessionChecked = (deps: SessionDeps): Promise<SessionClaims | null> =>
  readSession(deps, { checkRevoked: true });

/**
 * Clear the cookie and revoke the user's refresh tokens so the session cannot be resumed.
 * Revocation is best-effort: an already-invalid cookie still results in a cleared cookie.
 */
export async function destroySession(deps: SessionDeps): Promise<void> {
  const claims = await readSession(deps);
  deps.cookies.delete(sessionCookieName(deps.isProduction));
  if (claims) {
    try {
      await deps.auth.revokeRefreshTokens(claims.uid);
    } catch {
      // The cookie is already gone; revocation failure must not block sign-out.
    }
  }
}
