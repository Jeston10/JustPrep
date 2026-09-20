import { withSentryConfig } from "@sentry/nextjs/config";

import { STATIC_SECURITY_HEADERS } from "./server/security/headers";

import type { NextConfig } from "next";

// Build-time type and lint errors fail the build (GUARDRAILS B10).
// Static security headers apply to every response; the per-request CSP + nonce is set in proxy.ts.
// Server Actions keep Next's default same-origin check (no allowedOrigins widening).
//
// Observability traffic stays same-origin (CSP connect-src 'self', ad-blocker resistant):
//   /api/monitoring  → Sentry tunnel (added by withSentryConfig)
//   /api/ingest/*    → PostHog ingest + static assets (rewrites below)
// Both live under /api so proxy.ts (cookie gate) never sees them.

/** Ingest host of the PostHog region; its asset host follows the same naming. */
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
const posthogAssetsHost = posthogHost.replace(".i.posthog.com", "-assets.i.posthog.com");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  headers: () => Promise.resolve([{ source: "/(.*)", headers: [...STATIC_SECURITY_HEADERS] }]),
  rewrites: () =>
    Promise.resolve([
      { source: "/api/ingest/static/:path*", destination: `${posthogAssetsHost}/static/:path*` },
      { source: "/api/ingest/:path*", destination: `${posthogHost}/:path*` },
    ]),
  // PostHog's API paths end with a slash; Next must not redirect them.
  skipTrailingSlashRedirect: true,
  // pino (and its pretty transport) spawn workers; keep them out of the server bundle.
  serverExternalPackages: ["pino", "pino-pretty"],
};

// Source maps upload only when a CI token is present (SENTRY_AUTH_TOKEN is never in .env.local);
// without it the wrapper still injects the runtime SDK and the tunnel. No telemetry to Sentry.
const sourceMapsEnabled = Boolean(process.env.SENTRY_AUTH_TOKEN);

export default withSentryConfig(nextConfig, {
  ...(process.env.SENTRY_ORG ? { org: process.env.SENTRY_ORG } : {}),
  ...(process.env.SENTRY_PROJECT ? { project: process.env.SENTRY_PROJECT } : {}),
  ...(process.env.SENTRY_AUTH_TOKEN ? { authToken: process.env.SENTRY_AUTH_TOKEN } : {}),
  silent: !process.env.CI,
  telemetry: false,
  tunnelRoute: "/api/monitoring",
  sourcemaps: { disable: !sourceMapsEnabled },
  // Errors only: no tracing, no replay (QUALITY §2 performance data comes from PostHog).
  // Measured under Turbopack: the SDK's tree-shaking flags have no effect, so the browser SDK
  // costs ~64 kB gzip eager; PostHog (~96 kB) is deferred to idle in lib/observability/client.ts.
});
