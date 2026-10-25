import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppError } from "@/server/errors";

const requireUserChecked = vi.fn<() => Promise<{ id: string }>>();
const update = vi.fn<(data: unknown) => Promise<void>>();

vi.mock("@/server/auth/session", () => ({ requireUserChecked: () => requireUserChecked() }));
vi.mock("@/firebase/admin", () => ({
  getDb: () => ({ collection: () => ({ doc: () => ({ update }) }) }),
}));
vi.mock("@/server/observability/analytics", () => ({ captureServerEvent: vi.fn() }));
vi.mock("@/server/observability/report", () => ({ reportFailure: vi.fn() }));
vi.mock("@/server/observability/logger", () => ({
  opLogger: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn() }),
}));
const enforceLimit = vi.fn<() => Promise<void>>(() => Promise.resolve());
vi.mock("@/server/ratelimit/ratelimit", () => ({ enforceLimit: () => enforceLimit() }));
vi.mock("@/server/ratelimit/keys", () => ({ uidKey: (uid: string) => `uid:${uid}` }));

const { updateProfile } = await import("./actions");

beforeEach(() => {
  requireUserChecked.mockReset();
  update.mockReset();
  enforceLimit.mockReset();
  enforceLimit.mockResolvedValue(undefined);
});

describe("updateProfile", () => {
  it("requires a revocation-checked session", async () => {
    requireUserChecked.mockRejectedValue(new AppError("UNAUTHENTICATED"));
    const result = await updateProfile({ description: "hi", photoURL: "/profile.svg" });
    expect(result.success).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  it("writes only validated fields to the caller's own document", async () => {
    requireUserChecked.mockResolvedValue({ id: "me" });
    update.mockResolvedValue(undefined);
    const result = await updateProfile({
      description: "  Frontend engineer  ",
      photoURL: "/profile.svg",
      role: "admin",
    });
    expect(result.success).toBe(true);
    expect(update).toHaveBeenCalledWith({
      description: "Frontend engineer",
      photoURL: "/profile.svg",
    });
  });

  it("does not write when the caller is rate limited", async () => {
    requireUserChecked.mockResolvedValue({ id: "me" });
    enforceLimit.mockRejectedValue(new AppError("RATE_LIMITED"));
    const result = await updateProfile({ description: "x", photoURL: "/profile.svg" });
    expect(result.success).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects oversized descriptions and unsupported images", async () => {
    requireUserChecked.mockResolvedValue({ id: "me" });
    const tooLong = await updateProfile({ description: "x".repeat(501), photoURL: "/profile.svg" });
    const script = await updateProfile({ description: "", photoURL: "javascript:alert(1)" });
    const insecure = await updateProfile({
      description: "",
      photoURL: "http://insecure.example/a.png",
    });
    expect([tooLong.success, script.success, insecure.success]).toEqual([false, false, false]);
    expect(update).not.toHaveBeenCalled();
  });
});
