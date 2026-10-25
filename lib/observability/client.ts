// Browser observability adapter — the client-side counterpart of server/observability/*. The only
// module besides instrumentation-client.ts allowed to import the browser SDKs (eslint override).
// Both SDKs are dormant when their keys are unset, so every call here is safe in dev, CI, and
// forks. Privacy posture (docs/SECURITY.md §2.11): identify by uid only, no autocapture, no
// surveys, Do-Not-Track honoured, all inputs and text masked in session replay.
//
// Bundle discipline (QUALITY §2): Sentry loads with the page (errors during hydration matter);
// PostHog is imported after the page is idle, off the critical path, and calls made before it is
// ready are queued and replayed in order.

import * as Sentry from "@sentry/nextjs";

import { env } from "@/config/env";

import { scrubEvent } from "./scrub";

import type { PostHog } from "posthog-js";

/** Same-origin path that next.config.ts rewrites to PostHog (keeps the CSP at 'self'). */
export const POSTHOG_PROXY_PATH = "/api/ingest";

const analyticsEnabled = Boolean(env.NEXT_PUBLIC_POSTHOG_KEY);

let posthogClient: PostHog | undefined;
const pending: ((client: PostHog) => void)[] = [];

const withPostHog = (fn: (client: PostHog) => void): void => {
  if (!analyticsEnabled) return;
  if (posthogClient) fn(posthogClient);
  else pending.push(fn);
};

const loadPostHog = async (): Promise<void> => {
  const key = env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  const { default: posthog } = await import("posthog-js");
  posthog.init(key, {
    api_host: POSTHOG_PROXY_PATH,
    // The app UI (toolbar, links) lives on the region's product host, not the ingest host.
    ui_host: env.NEXT_PUBLIC_POSTHOG_HOST.replace(".i.posthog.com", ".posthog.com"),
    defaults: "2026-08-30",
    person_profiles: "identified_only",
    autocapture: false,
    capture_exceptions: false, // Sentry owns errors
    disable_surveys: true,
    respect_dnt: true,
    session_recording: { maskAllInputs: true, maskTextSelector: "*" },
  });
  posthogClient = posthog;
  for (const fn of pending.splice(0)) fn(posthog);
};

/** Defers to browser idle time; falls back to a short timeout where requestIdleCallback is absent. */
const whenIdle = (fn: () => void): void => {
  if ("requestIdleCallback" in window) window.requestIdleCallback(fn, { timeout: 3_000 });
  else setTimeout(fn, 1_500);
};

/** Called once from instrumentation-client.ts. */
export const initClientObservability = (): void => {
  Sentry.init({
    dsn: env.NEXT_PUBLIC_SENTRY_DSN,
    enabled: Boolean(env.NEXT_PUBLIC_SENTRY_DSN),
    // environment: the SDK reads NEXT_PUBLIC_VERCEL_ENV itself; server vars are not readable here.
    sendDefaultPii: false,
    // Session replay is deliberately off: the developer tier allows 50 per month.
    integrations: [],
    beforeSend: (event) => scrubEvent(event),
  });

  if (analyticsEnabled) {
    whenIdle(() => {
      loadPostHog().catch((error: unknown) => {
        Sentry.captureException(error, { tags: { op: "analytics.load" } });
      });
    });
  }
};

/** Ties the anonymous browser session to the signed-in user. Uid only — never email or name. */
export const identifyUser = (userId: string): void => {
  Sentry.setUser({ id: userId });
  withPostHog((client) => {
    client.identify(userId);
  });
};

/** Forgets the user on sign-out so the next visitor on this device starts anonymous. */
export const resetUser = (): void => {
  Sentry.setUser(null);
  withPostHog((client) => {
    client.reset();
  });
};

/** Reports a caught exception (error boundaries, failed actions) with optional non-PII tags. */
export const reportError = (error: unknown, tags?: Record<string, string>): void => {
  Sentry.captureException(error, tags ? { tags } : undefined);
};
