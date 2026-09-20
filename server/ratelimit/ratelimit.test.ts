import { describe, expect, it, vi } from "vitest";

import { LIMITS } from "@/config/limits";

import { AppError } from "@/server/errors";

vi.mock("@/server/db/redis", () => ({ getRedis: () => null }));
vi.mock("@/server/observability/logger", () => ({ logger: { warn: vi.fn() } }));

const { MemoryRateLimiter, enforceLimit } = await import("./ratelimit");

describe("MemoryRateLimiter (sliding window)", () => {
  it("allows up to the configured requests, then denies until the window slides", async () => {
    let now = 1_000_000;
    const limiter = new MemoryRateLimiter(() => now);
    const rule = LIMITS["auth.signIn"]; // 10 per 10 m by IP

    for (let i = 0; i < rule.requests; i += 1) {
      const decision = await limiter.limit("auth.signIn", "ip:a");
      expect(decision.success).toBe(true);
    }
    const denied = await limiter.limit("auth.signIn", "ip:a");
    expect(denied.success).toBe(false);
    expect(denied.remaining).toBe(0);
    expect(denied.reset).toBeGreaterThan(now);

    // A different identifier is independent.
    expect((await limiter.limit("auth.signIn", "ip:b")).success).toBe(true);

    // After the window slides past the oldest hit, capacity returns.
    now += 10 * 60 * 1000 + 1;
    expect((await limiter.limit("auth.signIn", "ip:a")).success).toBe(true);
  });

  it("keys each limit name separately", async () => {
    const limiter = new MemoryRateLimiter(() => 0);
    for (let i = 0; i < LIMITS["interview.create"].requests; i += 1) {
      await limiter.limit("interview.create", "uid:u");
    }
    expect((await limiter.limit("interview.create", "uid:u")).success).toBe(false);
    expect((await limiter.limit("feedback.create", "uid:u")).success).toBe(true);
  });
});

describe("enforceLimit", () => {
  it("throws AppError('RATE_LIMITED') with a reset time when denied", async () => {
    const limiter = {
      limit: () => Promise.resolve({ success: false, remaining: 0, reset: Date.now() + 90_000 }),
    };
    await expect(enforceLimit("profile.update", "uid:u", limiter)).rejects.toMatchObject({
      code: "RATE_LIMITED",
      meta: expect.objectContaining({ limit: "profile.update" }) as unknown,
    });
    try {
      await enforceLimit("profile.update", "uid:u", limiter);
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).message).toMatch(/Try again in \d+ min/);
    }
  });

  it("resolves silently when allowed", async () => {
    const limiter = { limit: () => Promise.resolve({ success: true, remaining: 3, reset: 0 }) };
    await expect(enforceLimit("profile.update", "uid:u", limiter)).resolves.toBeUndefined();
  });
});
