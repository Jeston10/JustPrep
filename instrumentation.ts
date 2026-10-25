// Next.js instrumentation hook (runs once per server runtime at boot). Loads the Sentry entry for
// the runtime in use and forwards framework-caught errors. Names are fixed by Next.js/Sentry.

import { env } from "@/config/env";

import { captureRequestError } from "@/server/observability/sentry";

export async function register(): Promise<void> {
  if (env.NEXT_RUNTIME === "nodejs") await import("./sentry.server.config");
  if (env.NEXT_RUNTIME === "edge") await import("./sentry.edge.config");
}

export const onRequestError = captureRequestError;
