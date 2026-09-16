import { describe, expect, it } from "vitest";

import {
  CSP_HEADER_NAME,
  CSP_MODE,
  STATIC_SECURITY_HEADERS,
  buildCsp,
  generateNonce,
} from "./headers";

describe("buildCsp (SECURITY §2.9)", () => {
  const nonce = "dGVzdA==";

  it("binds scripts to the per-request nonce and keeps styles same-origin", () => {
    const csp = buildCsp({ nonce, isDev: false });
    expect(csp).toContain(`script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`);
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
    expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
  });

  it("never allows eval in production, only in development", () => {
    expect(buildCsp({ nonce, isDev: false })).not.toContain("unsafe-eval");
    expect(buildCsp({ nonce, isDev: true })).toContain("'unsafe-eval'");
  });

  it("locks down framing, plugins, base URI, and form targets", () => {
    const csp = buildCsp({ nonce, isDev: false, mode: "enforce" });
    for (const directive of [
      "default-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ]) {
      expect(csp).toContain(directive);
    }
    // Browsers ignore upgrade-insecure-requests in report-only mode; do not emit it there.
    expect(buildCsp({ nonce, isDev: false, mode: "report-only" })).not.toContain(
      "upgrade-insecure-requests",
    );
  });

  it("allows only the vendors the app currently talks to", () => {
    const csp = buildCsp({ nonce, isDev: false });
    const connect = csp.split("; ").find((d) => d.startsWith("connect-src")) ?? "";
    expect(connect).toContain("https://*.googleapis.com");
    expect(connect).toContain("https://api.vapi.ai");
    expect(connect.split(" ")).not.toContain("*"); // no bare wildcard origin
    expect(connect).not.toContain("http://");
  });

  it("starts in report-only mode (RISKS R9)", () => {
    expect(CSP_MODE).toBe("report-only");
    expect(CSP_HEADER_NAME[CSP_MODE]).toBe("Content-Security-Policy-Report-Only");
  });
});

describe("STATIC_SECURITY_HEADERS", () => {
  it("includes every header required by the security doc", () => {
    const keys = STATIC_SECURITY_HEADERS.map((h) => h.key);
    for (const required of [
      "Strict-Transport-Security",
      "X-Content-Type-Options",
      "X-Frame-Options",
      "Referrer-Policy",
      "Permissions-Policy",
    ]) {
      expect(keys).toContain(required);
    }
    const hsts = STATIC_SECURITY_HEADERS.find((h) => h.key === "Strict-Transport-Security");
    expect(hsts?.value).toMatch(/max-age=\d{8,}; includeSubDomains; preload/);
  });
});

describe("generateNonce", () => {
  it("returns unpredictable base64 values", () => {
    const a = generateNonce();
    const b = generateNonce();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9+/]+=*$/);
    expect(a.length).toBeGreaterThanOrEqual(24);
  });
});
