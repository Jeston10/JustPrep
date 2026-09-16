import { STATIC_SECURITY_HEADERS } from "./server/security/headers";

import type { NextConfig } from "next";

// Build-time type and lint errors fail the build (GUARDRAILS B10).
// Static security headers apply to every response; the per-request CSP + nonce is set in proxy.ts.
// Server Actions keep Next's default same-origin check (no allowedOrigins widening).
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  headers: () => Promise.resolve([{ source: "/(.*)", headers: [...STATIC_SECURITY_HEADERS] }]),
  // pino (and its pretty transport) spawn workers; keep them out of the server bundle.
  serverExternalPackages: ["pino", "pino-pretty"],
};

export default nextConfig;
