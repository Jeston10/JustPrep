import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppError } from "@/server/errors";

const requireUserChecked = vi.fn<() => Promise<{ id: string }>>();
const verifyIdToken =
  vi.fn<(token: string, checkRevoked?: boolean) => Promise<{ uid: string; auth_time: number }>>();
const deleteUserAccount = vi.fn<() => Promise<{ deleted: Record<string, number> }>>();
const exportUserData = vi.fn<() => Promise<{ exportedAt: string }>>();
const enforceLimit = vi.fn<() => Promise<void>>();

vi.mock("@/server/auth/session", () => ({ requireUserChecked: () => requireUserChecked() }));
vi.mock("@/firebase/admin", () => ({ getAdminAuth: () => ({ verifyIdToken }) }));
vi.mock("@/server/services/account.service", () => ({
  deleteUserAccount: () => deleteUserAccount(),
  exportUserData: () => exportUserData(),
}));
vi.mock("@/server/observability/report", () => ({ reportFailure: vi.fn() }));
vi.mock("@/server/ratelimit/ratelimit", () => ({ enforceLimit: () => enforceLimit() }));
vi.mock("@/server/ratelimit/keys", () => ({ uidKey: (uid: string) => `uid:${uid}` }));

const { deleteAccount, exportData } = await import("./actions");

const freshToken = () => {
  verifyIdToken.mockResolvedValue({ uid: "u1", auth_time: Math.floor(Date.now() / 1000) - 5 });
};
const input = { idToken: "a".repeat(32), confirmation: "DELETE" };

beforeEach(() => {
  vi.clearAllMocks();
  enforceLimit.mockResolvedValue(undefined);
  requireUserChecked.mockResolvedValue({ id: "u1" });
  deleteUserAccount.mockResolvedValue({ deleted: { users: 1 } });
  exportUserData.mockResolvedValue({ exportedAt: "2026-01-01T00:00:00.000Z" });
});

describe("deleteAccount (SECURITY §2.11, RISKS R22)", () => {
  it("deletes when the session is live and the password was just re-entered", async () => {
    freshToken();
    await expect(deleteAccount(input)).resolves.toMatchObject({ success: true });
    expect(verifyIdToken).toHaveBeenCalledWith(input.idToken, true);
    expect(deleteUserAccount).toHaveBeenCalledOnce();
  });

  it("refuses a stale re-authentication", async () => {
    verifyIdToken.mockResolvedValue({
      uid: "u1",
      auth_time: Math.floor(Date.now() / 1000) - 3600,
    });
    await expect(deleteAccount(input)).resolves.toEqual({
      success: false,
      message: "Please confirm your password again.",
    });
    expect(deleteUserAccount).not.toHaveBeenCalled();
  });

  it("refuses a token belonging to somebody else", async () => {
    verifyIdToken.mockResolvedValue({
      uid: "attacker",
      auth_time: Math.floor(Date.now() / 1000),
    });
    await expect(deleteAccount(input)).resolves.toMatchObject({ success: false });
    expect(deleteUserAccount).not.toHaveBeenCalled();
  });

  it("refuses without the typed confirmation or a token", async () => {
    freshToken();
    await expect(deleteAccount({ ...input, confirmation: "delete" })).resolves.toMatchObject({
      success: false,
    });
    await expect(deleteAccount({ confirmation: "DELETE" })).resolves.toMatchObject({
      success: false,
    });
    expect(deleteUserAccount).not.toHaveBeenCalled();
  });

  it("refuses when the session is revoked or absent", async () => {
    requireUserChecked.mockRejectedValue(new AppError("UNAUTHENTICATED"));
    await expect(deleteAccount(input)).resolves.toMatchObject({ success: false });
    expect(verifyIdToken).not.toHaveBeenCalled();
    expect(deleteUserAccount).not.toHaveBeenCalled();
  });

  it("is rate-limited", async () => {
    enforceLimit.mockRejectedValue(new AppError("RATE_LIMITED", "Too many requests."));
    await expect(deleteAccount(input)).resolves.toEqual({
      success: false,
      message: "Too many requests.",
    });
    expect(deleteUserAccount).not.toHaveBeenCalled();
  });
});

describe("exportData (right of access)", () => {
  it("returns the caller's own export", async () => {
    await expect(exportData()).resolves.toEqual({
      success: true,
      data: { exportedAt: "2026-01-01T00:00:00.000Z" },
    });
  });

  it("requires a live session and respects the limit", async () => {
    requireUserChecked.mockRejectedValue(new AppError("UNAUTHENTICATED"));
    await expect(exportData()).resolves.toMatchObject({ success: false });

    requireUserChecked.mockResolvedValue({ id: "u1" });
    enforceLimit.mockRejectedValue(new AppError("RATE_LIMITED", "Too many requests."));
    await expect(exportData()).resolves.toMatchObject({ success: false });
    expect(exportUserData).not.toHaveBeenCalled();
  });
});
