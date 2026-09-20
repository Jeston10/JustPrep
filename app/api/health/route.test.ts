import { describe, expect, it, vi } from "vitest";

import { AppError } from "@/server/errors";

const state = { limited: false, ok: true };
vi.mock("@/server/ratelimit/keys", () => ({ clientIpKey: () => Promise.resolve("ip:x") }));
vi.mock("@/server/ratelimit/ratelimit", () => ({
  enforceLimit: () =>
    state.limited ? Promise.reject(new AppError("RATE_LIMITED")) : Promise.resolve(),
}));
vi.mock("@/server/observability/health", () => ({
  checkHealth: () => Promise.resolve({ ok: state.ok, checks: { redis: state.ok ? "ok" : "fail" } }),
}));

const { GET } = await import("./route");

describe("GET /api/health (SECURITY §2.8)", () => {
  it("returns { ok: true } only, uncached", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.json()).toEqual({ ok: true });
  });

  it("returns 503 when a dependency is down, without details", async () => {
    state.ok = false;
    const res = await GET();
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ ok: false });
    state.ok = true;
  });

  it("returns 429 when the caller is over the limit", async () => {
    state.limited = true;
    const res = await GET();
    expect(res.status).toBe(429);
    state.limited = false;
  });
});
