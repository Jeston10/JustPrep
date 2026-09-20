// Sentry adapter (docs/SECURITY.md §2.11, ARCHITECTURE §7). The only server module that imports
// the SDK. Both server runtimes (Node, edge) initialise through `initSentry()` from the
// `sentry.*.config.ts` entry files that `instrumentation.ts` loads; the browser has its own
// entry (`instrumentation-client.ts`) because the SDK ships separate builds per runtime.
//
// Privacy posture, identical everywhere:
//   - dormant without a DSN (dev, CI, forks): `enabled: false`, nothing leaves the process
//   - `sendDefaultPii: false`: no IPs, cookies, or request bodies from the SDK itself
//   - `beforeSend: scrubEvent`: strips what our code or a framework integration might attach
//   - users are identified by uid only (`setUser({ id })`), never by email

import * as Sentry from "@sentry/nextjs";

import { deploymentEnvironment, env } from "@/config/env";

import { scrubEvent } from "@/lib/observability/scrub";

export const initSentry = (): void => {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    enabled: Boolean(env.SENTRY_DSN),
    environment: deploymentEnvironment(),
    sendDefaultPii: false,
    // Errors only (no tracesSampleRate): tracing is compiled out in next.config.ts.
    beforeSend: (event) => scrubEvent(event),
  });
};

/** Attaches the signed-in user's id (and nothing else) to subsequent events on this request. */
export const setSentryUser = (userId: string | null): void => {
  Sentry.setUser(userId ? { id: userId } : null);
};

/** Reports an exception with optional non-PII tags; safe to call when the SDK is disabled. */
export const captureException = (error: unknown, tags?: Record<string, string>): void => {
  Sentry.captureException(error, tags ? { tags } : undefined);
};

/** Next.js `onRequestError` hook: reports errors thrown during rendering, actions, and routes. */
export const captureRequestError = Sentry.captureRequestError;
