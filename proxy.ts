// Next.js 16 proxy (formerly middleware). Two jobs, both cheap and per-request (docs/SECURITY.md):
//   1. Per-request CSP nonce + policy (§2.9). Next reads the CSP from the request headers to
//      attach the nonce to its own scripts; the response carries the policy in the mode set by
//      CSP_MODE (report-only until violations are reviewed — RISKS R9).
//   2. Cookie-presence gate for authenticated routes (§2.1): defence in depth only. The real gate
//      is requireUser()/getCurrentUser(), which verifies the cookie with Firebase.
// Static security headers live in next.config.ts so they also cover API routes and assets.

import { type NextRequest, NextResponse } from "next/server";

import { env } from "@/config/env";

import { sessionCookieName } from "@/server/auth/session-core";
import { CSP_HEADER_NAME, CSP_MODE, buildCsp, generateNonce } from "@/server/security/headers";

const isDev = env.NODE_ENV === "development";
const isProduction = env.NODE_ENV === "production";

const PUBLIC_PATHS = new Set(["/sign-in", "/sign-up"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!PUBLIC_PATHS.has(pathname) && !request.cookies.has(sessionCookieName(isProduction))) {
    const signIn = new URL("/sign-in", request.url);
    return NextResponse.redirect(signIn);
  }

  const nonce = generateNonce();
  const csp = buildCsp({ nonce, isDev });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  // Next extracts the nonce from either CSP header name on the request.
  requestHeaders.set(CSP_HEADER_NAME[CSP_MODE], csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set(CSP_HEADER_NAME[CSP_MODE], csp);
  return response;
}

export const config = {
  matcher: [
    // Every page except API routes, Next internals, and static assets; skip prefetches.
    {
      source:
        "/((?!api|_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
