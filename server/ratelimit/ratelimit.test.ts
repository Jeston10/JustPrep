import { describe, expect, it, vi } from "vitest";

import { LIMITS } from "@/config/limits";

import { AppError } from "@/server/errors";

vi.mock("@/server/db/redis", () => ({ getRedis: () => null }));
vi.mock("@/server/observability/logger", () => ({ logger: { warn: vi.fn() } }));
const reportFailure = vi.fn<() => void>();
vi.mock("@/server/observability/report", () => ({
  reportFailure: () => {
    reportFailure();
  },
}));

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

describe("MemoryRateLimiter.reset", () => {
  it("forgets an identifier's window (used when its account is deleted)", async () => {
    const limiter = new MemoryRateLimiter(() => 1_000);
    for (let i = 0; i < LIMITS["account.delete"].requests; i += 1) {
      await limiter.limit("account.delete", "uid:gone");
    }
    expect((await limiter.limit("account.delete", "uid:gone")).success).toBe(false);
    await limiter.reset("account.delete", "uid:gone");
    expect((await limiter.limit("account.delete", "uid:gone")).success).toBe(true);
  });
});

describe("enforceLimit", () => {
  it("throws AppError('RATE_LIMITED') with a reset time when denied", async () => {
    const limiter = {
      limit: () => Promise.resolve({ success: false, remaining: 0, reset: Date.now() + 90_000 }),
      reset: () => Promise.resolve(),
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

  // RISKS R28: a limiter outage must not take sign-in down, but it must not silently lift the cap.
  it("degrades to a per-instance limit when the shared limiter is unreachable", async () => {
    const broken = {
      limit: () => Promise.reject(new Error("getaddrinfo ENOTFOUND upstash")),
      reset: () => Promise.resolve(),
    };
    const identifier = `uid:degraded-${String(Math.random())}`;

    // Still allowed, so the app keeps working...
    await expect(enforceLimit("profile.update", identifier, broken)).resolves.toBeUndefined();
    expect(reportFailure).toHaveBeenCalled();

    // ...but the fallback still counts, so a flood is still stopped.
    for (let i = 1; i < LIMITS["profile.update"].requests; i += 1) {
      await enforceLimit("profile.update", identifier, broken);
    }
    await expect(enforceLimit("profile.update", identifier, broken)).rejects.toMatchObject({
      code: "RATE_LIMITED",
    });
  });

  it("resolves silently when allowed", async () => {
    const limiter = {
      limit: () => Promise.resolve({ success: true, remaining: 3, reset: 0 }),
      reset: () => Promise.resolve(),
    };
    await expect(enforceLimit("profile.update", "uid:u", limiter)).resolves.toBeUndefined();
  });
});
