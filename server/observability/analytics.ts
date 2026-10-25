// Server-side product analytics and feature flags (ARCHITECTURE §7, SECURITY §2.11). The only
// module that imports `posthog-node`. Users are identified by uid only; property keys that could
// carry personal data are dropped before they leave the process (`safeProperties`).
//
// Serverless-friendly delivery: PostHog batches in memory, and a Vercel function may freeze
// right after the response. Each capture therefore schedules a flush with Next's `after()`
// (runs once the response is sent, keeps the function alive) and falls back to a plain flush
// outside a request scope (scripts, tests).

import { after } from "next/server";
import { PostHog } from "posthog-node";

import { type AnalyticsEvent, type AnalyticsProperties, safeProperties } from "@/config/analytics";
import { deploymentEnvironment, env } from "@/config/env";
import { type FlagName, flagDefault } from "@/config/flags";

import { logger } from "./logger";

/** The subset of the vendor client the app depends on; tests pass a fake. */
export interface AnalyticsClient {
  capture(message: {
    distinctId: string;
    event: string;
    properties?: Record<string, unknown>;
  }): void;
  isFeatureEnabled(key: string, distinctId: string): Promise<boolean | undefined>;
  flush(): Promise<void>;
}

/** Flag lookups must never hold a request hostage; PostHog is a nice-to-have, not a dependency. */
const FLAG_TIMEOUT_MS = 800;

let instance: AnalyticsClient | null | undefined;

/** PostHog when configured, otherwise null (events are dropped, flags use their defaults). */
export const getAnalyticsClient = (): AnalyticsClient | null => {
  if (instance !== undefined) return instance;
  if (!env.NEXT_PUBLIC_POSTHOG_KEY) {
    logger.info({ op: "analytics.init" }, "PostHog not configured; analytics disabled");
    instance = null;
    return instance;
  }
  instance = new PostHog(env.NEXT_PUBLIC_POSTHOG_KEY, {
    host: env.NEXT_PUBLIC_POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0,
    requestTimeout: 3_000,
    featureFlagsRequestTimeoutMs: FLAG_TIMEOUT_MS,
    disableGeoip: true,
  });
  return instance;
};

const scheduleFlush = (client: AnalyticsClient): void => {
  const flush = () => client.flush().catch(() => undefined);
  try {
    after(flush);
  } catch {
    // Outside a request scope (scripts, tests): flush inline instead.
    void flush();
  }
};

/** Records a typed event for a user. Never throws; never blocks the caller. */
export const captureServerEvent = (
  event: AnalyticsEvent,
  userId: string,
  properties?: AnalyticsProperties,
  client: AnalyticsClient | null = getAnalyticsClient(),
): void => {
  if (!client) return;
  try {
    client.capture({
      distinctId: userId,
      event,
      properties: { ...safeProperties(properties), environment: deploymentEnvironment() },
    });
    scheduleFlush(client);
  } catch (error) {
    logger.warn({ op: "analytics.capture", err: error, event }, "analytics capture failed");
  }
};

/**
 * Evaluates a feature flag for a user, falling back to the value in config/flags.ts when PostHog
 * is unconfigured, unreachable, slow, or has no such flag.
 */
export const isFlagEnabled = async (
  name: FlagName,
  userId: string,
  client: AnalyticsClient | null = getAnalyticsClient(),
): Promise<boolean> => {
  const fallback = flagDefault(name);
  if (!client) return fallback;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      client.isFeatureEnabled(name, userId),
      new Promise<undefined>((resolve) => {
        timer = setTimeout(() => {
          resolve(undefined);
        }, FLAG_TIMEOUT_MS);
      }),
    ]);
    return result ?? fallback;
  } catch (error) {
    logger.warn({ op: "analytics.flag", err: error, flag: name }, "flag lookup failed");
    return fallback;
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Right-to-erasure for analytics (SECURITY §2.11). PostHog's Persons API needs a personal API key
 * and the project id — optional config — so this degrades to a log line that names the uid when
 * they are absent. Never throws: the account is already deleted by the time it runs.
 *
 * Two calls: resolve the person by distinct_id (our uid), then delete it with its events.
 */
export const requestAnalyticsDeletion = async (
  userId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<"deleted" | "not-found" | "skipped" | "failed"> => {
  const apiKey = env.POSTHOG_PERSONAL_API_KEY;
  const projectId = env.POSTHOG_PROJECT_ID;
  if (!apiKey || !projectId) {
    logger.warn(
      { op: "analytics.erasure", userId },
      "PostHog erasure not configured; delete this person manually",
    );
    return "skipped";
  }

  const base = `${env.NEXT_PUBLIC_POSTHOG_HOST.replace(".i.posthog.com", ".posthog.com")}/api/projects/${projectId}/persons`;
  const headers = { Authorization: `Bearer ${apiKey}` };
  try {
    const lookup = await fetchImpl(`${base}/?distinct_id=${encodeURIComponent(userId)}`, {
      headers,
    });
    if (!lookup.ok) throw new Error(`person lookup failed (${lookup.status})`);
    const body = (await lookup.json()) as { results?: { id?: number | string }[] };
    const personId = body.results?.[0]?.id;
    if (personId === undefined) return "not-found";

    const removal = await fetchImpl(
      `${base}/${String(personId)}/?delete_events=true&delete_recordings=true`,
      { method: "DELETE", headers },
    );
    if (!removal.ok) throw new Error(`person delete failed (${removal.status})`);
    return "deleted";
  } catch (error) {
    // Logged with the uid so it can be erased by hand; the uid is not PII on its own.
    logger.error({ op: "analytics.erasure", err: error, userId }, "PostHog erasure failed");
    return "failed";
  }
};
