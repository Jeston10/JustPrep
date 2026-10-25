import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/db/redis", () => ({ getRedis: () => null }));
vi.mock("./logger", () => ({ logger: { warn: vi.fn() } }));

const { HEALTH_CACHE_MS, checkHealth, probeRedis, resetHealthCache } = await import("./health");

const redisReplying = (reply: string | Error) => ({
  ping: vi.fn(() => (reply instanceof Error ? Promise.reject(reply) : Promise.resolve(reply))),
});

afterEach(() => {
  resetHealthCache();
});

describe("probeRedis", () => {
  it("is skipped without Redis, ok on PONG, fail otherwise", async () => {
    expect(await probeRedis(null)).toBe("skipped");
    expect(await probeRedis(redisReplying("PONG"))).toBe("ok");
    expect(await probeRedis(redisReplying("NOPE"))).toBe("fail");
    expect(await probeRedis(redisReplying(new Error("ECONNRESET")))).toBe("fail");
  });
});

describe("checkHealth", () => {
  it("reports ok without Redis and not ok when Redis fails", async () => {
    expect(await checkHealth(0, null)).toEqual({ ok: true, checks: { redis: "skipped" } });
    resetHealthCache();
    expect(await checkHealth(0, redisReplying(new Error("down")))).toEqual({
      ok: false,
      checks: { redis: "fail" },
    });
  });

  it("caches the verdict for HEALTH_CACHE_MS so monitors do not spend Redis commands", async () => {
    const redis = redisReplying("PONG");
    await checkHealth(1_000, redis);
    await checkHealth(1_000 + HEALTH_CACHE_MS - 1, redis);
    expect(redis.ping).toHaveBeenCalledTimes(1);
    await checkHealth(1_000 + HEALTH_CACHE_MS, redis);
    expect(redis.ping).toHaveBeenCalledTimes(2);
  });
});
