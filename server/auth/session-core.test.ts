import { describe, expect, it, vi } from "vitest";

import {
  SESSION_TTL_SECONDS,
  createSession,
  destroySession,
  readSession,
  readSessionChecked,
  sessionCookieName,
  type SessionAuth,
  type SessionCookieStore,
  type SessionDeps,
} from "./session-core";

// Typed fakes: each method is a named mock so assertions never read a method off an object.
const makeCookies = (initial: Record<string, string> = {}) => {
  const jar = new Map(Object.entries(initial));
  const get = vi.fn<SessionCookieStore["get"]>((name) => jar.get(name));
  const set = vi.fn<SessionCookieStore["set"]>((name, value) => {
    jar.set(name, value);
  });
  const remove = vi.fn<SessionCookieStore["delete"]>((name) => {
    jar.delete(name);
  });
  const store: SessionCookieStore = { get, set, delete: remove };
  return { store, jar, set, remove };
};

const makeAuth = (overrides: Partial<SessionAuth> = {}) => {
  const createSessionCookie = vi.fn<SessionAuth["createSessionCookie"]>((idToken) =>
    Promise.resolve(`cookie-for:${idToken}`),
  );
  const verifySessionCookie = vi.fn<SessionAuth["verifySessionCookie"]>((cookie) =>
    cookie.startsWith("cookie-for:")
      ? Promise.resolve({ uid: `uid-of:${cookie.slice("cookie-for:".length)}` })
      : Promise.reject(new Error("invalid")),
  );
  const revokeRefreshTokens = vi.fn<SessionAuth["revokeRefreshTokens"]>(() => Promise.resolve());
  const auth: SessionAuth = {
    createSessionCookie,
    verifySessionCookie,
    revokeRefreshTokens,
    ...overrides,
  };
  return { auth, createSessionCookie, verifySessionCookie, revokeRefreshTokens };
};

const deps = (
  auth: SessionAuth,
  cookies: SessionCookieStore,
  isProduction = false,
): SessionDeps => ({
  auth,
  cookies,
  isProduction,
});

describe("sessionCookieName", () => {
  it("uses the __Host- prefix only in production", () => {
    expect(sessionCookieName(true)).toBe("__Host-session");
    expect(sessionCookieName(false)).toBe("session");
  });
});

describe("createSession", () => {
  it("mints a session cookie with hardened attributes", async () => {
    const { auth, createSessionCookie } = makeAuth();
    const { store, set } = makeCookies();
    await createSession(deps(auth, store, true), "id-token");

    expect(createSessionCookie).toHaveBeenCalledWith("id-token", {
      expiresIn: SESSION_TTL_SECONDS * 1000,
    });
    expect(set).toHaveBeenCalledWith("__Host-session", "cookie-for:id-token", {
      maxAge: SESSION_TTL_SECONDS,
      httpOnly: true,
      secure: true,
      path: "/",
      sameSite: "lax",
    });
  });

  it("does not set the secure flag outside production so local http works", async () => {
    const { store, set } = makeCookies();
    await createSession(deps(makeAuth().auth, store, false), "t");
    expect(set).toHaveBeenCalledWith(
      "session",
      expect.any(String),
      expect.objectContaining({ secure: false }),
    );
  });
});

describe("readSession", () => {
  it("returns null when no cookie is present", async () => {
    const { auth, verifySessionCookie } = makeAuth();
    await expect(readSession(deps(auth, makeCookies().store))).resolves.toBeNull();
    expect(verifySessionCookie).not.toHaveBeenCalled();
  });

  it("returns claims for a valid cookie without checking revocation", async () => {
    const { auth, verifySessionCookie } = makeAuth();
    const { store } = makeCookies({ session: "cookie-for:abc" });
    await expect(readSession(deps(auth, store))).resolves.toEqual({ uid: "uid-of:abc" });
    expect(verifySessionCookie).toHaveBeenCalledWith("cookie-for:abc", false);
  });

  it("returns null instead of throwing for an invalid cookie", async () => {
    const { store } = makeCookies({ session: "tampered" });
    await expect(readSession(deps(makeAuth().auth, store))).resolves.toBeNull();
  });

  it("readSessionChecked asks Firebase to check revocation", async () => {
    const { auth, verifySessionCookie } = makeAuth();
    const { store } = makeCookies({ session: "cookie-for:abc" });
    await readSessionChecked(deps(auth, store));
    expect(verifySessionCookie).toHaveBeenCalledWith("cookie-for:abc", true);
  });
});

describe("destroySession", () => {
  it("deletes the cookie and revokes refresh tokens for a valid session", async () => {
    const { auth, revokeRefreshTokens } = makeAuth();
    const { store, jar, remove } = makeCookies({ session: "cookie-for:abc" });
    await destroySession(deps(auth, store));
    expect(remove).toHaveBeenCalledWith("session");
    expect(jar.has("session")).toBe(false);
    expect(revokeRefreshTokens).toHaveBeenCalledWith("uid-of:abc");
  });

  it("still clears the cookie when revocation fails", async () => {
    const { auth } = makeAuth({
      revokeRefreshTokens: () => Promise.reject(new Error("network")),
    });
    const { store, remove } = makeCookies({ session: "cookie-for:abc" });
    await expect(destroySession(deps(auth, store))).resolves.toBeUndefined();
    expect(remove).toHaveBeenCalledWith("session");
  });

  it("still clears the cookie when it is invalid", async () => {
    const { store, remove } = makeCookies({ session: "garbage" });
    await destroySession(deps(makeAuth().auth, store));
    expect(remove).toHaveBeenCalledWith("session");
  });
});
