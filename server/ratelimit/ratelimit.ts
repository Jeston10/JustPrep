// Rate limiting behind a small interface (ARCHITECTURE §3): the Upstash adapter in production,
// an in-memory limiter for dev/CI/tests. Callers never touch the vendor SDK.

import { Ratelimit } from "@upstash/ratelimit";
import { type Redis } from "@upstash/redis";

import { LIMITS, type LimitName, type LimitRule } from "@/config/limits";

import { getRedis } from "@/server/db/redis";
import { AppError } from "@/server/errors";
import { logger } from "@/server/observability/logger";
import { reportFailure } from "@/server/observability/report";

export interface LimitDecision {
  success: boolean;
  remaining: number;
  /** Unix epoch ms at which the window resets. */
  reset: number;
}

export interface RateLimiter {
  limit(name: LimitName, identifier: string): Promise<LimitDecision>;
  /** Forgets an identifier's window. Used when the account behind it is deleted (SECURITY §2.11). */
  reset(name: LimitName, identifier: string): Promise<void>;
}

const windowMs = (window: LimitRule["window"]): number => {
  const [amount, unit] = window.split(" ") as [string, "s" | "m" | "h" | "d"];
  const multiplier = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit];
  return Number(amount) * multiplier;
};

/** Sliding-window limiter kept in process memory. Not shared across instances; dev/CI/tests only. */
export class MemoryRateLimiter implements RateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(private readonly now: () => number = () => Date.now()) {}

  limit(name: LimitName, identifier: string): Promise<LimitDecision> {
    const rule = LIMITS[name];
    const size = windowMs(rule.window);
    const current = this.now();
    const key = `${name}:${identifier}`;
    const recent = (this.hits.get(key) ?? []).filter((at) => current - at < size);
    const success = recent.length < rule.requests;
    if (success) recent.push(current);
    this.hits.set(key, recent);
    const oldest = recent[0] ?? current;
    return Promise.resolve({
      success,
      remaining: Math.max(0, rule.requests - recent.length),
      reset: oldest + size,
    });
  }

  reset(name: LimitName, identifier: string): Promise<void> {
    this.hits.delete(`${name}:${identifier}`);
    return Promise.resolve();
  }
}

class UpstashRateLimiter implements RateLimiter {
  private readonly limiters = new Map<LimitName, Ratelimit>();

  constructor(private readonly redis: Redis) {}

  private limiterFor(name: LimitName): Ratelimit {
    let limiter = this.limiters.get(name);
    if (!limiter) {
      const rule = LIMITS[name];
      limiter = new Ratelimit({
        redis: this.redis,
        limiter: Ratelimit.slidingWindow(rule.requests, rule.window),
        prefix: `rl:${name}`,
        analytics: false,
      });
      this.limiters.set(name, limiter);
    }
    return limiter;
  }

  async limit(name: LimitName, identifier: string): Promise<LimitDecision> {
    const { success, remaining, reset } = await this.limiterFor(name).limit(identifier);
    return { success, remaining, reset };
  }

  async reset(name: LimitName, identifier: string): Promise<void> {
    await this.limiterFor(name).resetUsedTokens(identifier);
  }
}

let instance: RateLimiter | undefined;

/** Upstash when configured; otherwise in-memory (never in production — env.ts enforces that). */
export const getRateLimiter = (): RateLimiter => {
  if (instance) return instance;
  const redis = getRedis();
  if (redis) {
    instance = new UpstashRateLimiter(redis);
  } else {
    logger.warn({ op: "ratelimit.init" }, "Upstash not configured; using in-memory rate limiter");
    instance = new MemoryRateLimiter();
  }
  return instance;
};

/**
 * Process-local limiter used when the shared one cannot be reached. One instance for the whole
 * process so the degraded limit is still a limit (RISKS R28).
 */
let fallback: MemoryRateLimiter | undefined;

/**
 * Asks the configured limiter, degrading to the in-memory limiter if it throws (Upstash down,
 * DNS failure, network blip). Rate limiting protects quota; it must not become the thing that
 * takes sign-in down. The degradation is loud: logged and reported to Sentry every time.
 */
const decide = async (
  name: LimitName,
  identifier: string,
  limiter: RateLimiter,
): Promise<LimitDecision> => {
  try {
    return await limiter.limit(name, identifier);
  } catch (error) {
    reportFailure(
      "ratelimit.unavailable",
      error,
      "rate limiter unreachable; limiting per-instance",
    );
    fallback ??= new MemoryRateLimiter();
    return fallback.limit(name, identifier);
  }
};

/** Throws AppError('RATE_LIMITED') carrying `resetAt` when the caller is over the limit. */
export async function enforceLimit(
  name: LimitName,
  identifier: string,
  limiter: RateLimiter = getRateLimiter(),
): Promise<void> {
  const decision = await decide(name, identifier, limiter);
  if (decision.success) return;
  const resetAt = new Date(decision.reset);
  const seconds = Math.max(1, Math.ceil((decision.reset - Date.now()) / 1000));
  throw new AppError(
    "RATE_LIMITED",
    `Too many requests. Try again in ${seconds >= 60 ? `${Math.ceil(seconds / 60)} min` : `${seconds} s`}.`,
    { meta: { limit: name, resetAt: resetAt.toISOString() } },
  );
}
