// Liveness/readiness probe backing GET /api/health (docs/QUALITY.md §4). Checks the dependencies
// that are cheap to probe — Redis (one PING) — and caches the verdict so an aggressive uptime
// monitor cannot burn the Upstash command budget. Firestore is not probed: a document read per
// probe would spend the Spark daily read quota on monitoring.

import { getRedis } from "@/server/db/redis";

/** What the probe needs from Redis; tests pass a stub. */
interface Pingable {
  ping: () => Promise<string>;
}

import { logger } from "./logger";

export interface HealthReport {
  ok: boolean;
  checks: { redis: "ok" | "fail" | "skipped" };
}

export const HEALTH_CACHE_MS = 30_000;
const PROBE_TIMEOUT_MS = 2_000;

interface Cached {
  report: HealthReport;
  at: number;
}

let cached: Cached | undefined;

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("probe timeout"));
    }, ms);
    promise.then(resolve, reject).finally(() => {
      clearTimeout(timer);
    });
  });

/** Pings Redis when configured. Exported for tests; the route uses `checkHealth`. */
export const probeRedis = async (
  redis: Pingable | null,
): Promise<HealthReport["checks"]["redis"]> => {
  if (!redis) return "skipped";
  try {
    const reply = await withTimeout(redis.ping(), PROBE_TIMEOUT_MS);
    return reply === "PONG" ? "ok" : "fail";
  } catch (error) {
    logger.warn({ op: "health.redis", err: error }, "redis probe failed");
    return "fail";
  }
};

export const checkHealth = async (
  now = Date.now(),
  redis: Pingable | null = getRedis(),
): Promise<HealthReport> => {
  if (cached && now - cached.at < HEALTH_CACHE_MS) return cached.report;
  const redisStatus = await probeRedis(redis);
  const report: HealthReport = { ok: redisStatus !== "fail", checks: { redis: redisStatus } };
  cached = { report, at: now };
  return report;
};

/** Test hook: forget the cached verdict. */
export const resetHealthCache = (): void => {
  cached = undefined;
};
