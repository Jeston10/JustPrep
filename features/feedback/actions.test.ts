import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppError } from "@/server/errors";

const requireUser = vi.fn<() => Promise<{ id: string }>>();
const generateAndStoreFeedback = vi.fn<(params: unknown) => Promise<{ feedbackId: string }>>();

vi.mock("@/server/auth/session", () => ({ requireUser: () => requireUser() }));
vi.mock("@/server/services/feedback.service", () => ({
  generateAndStoreFeedback: (params: unknown) => generateAndStoreFeedback(params),
}));
vi.mock("@/server/observability/analytics", () => ({ captureServerEvent: vi.fn() }));
vi.mock("@/server/observability/report", () => ({ reportFailure: vi.fn() }));
vi.mock("@/server/observability/logger", () => ({
  opLogger: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn() }),
}));
const enforceLimit = vi.fn<() => Promise<void>>(() => Promise.resolve());
vi.mock("@/server/ratelimit/ratelimit", () => ({ enforceLimit: () => enforceLimit() }));
vi.mock("@/server/ratelimit/keys", () => ({ uidKey: (uid: string) => `uid:${uid}` }));

const { createFeedback } = await import("./actions");

const validInput = {
  interviewId: "abc123",
  transcript: [{ role: "assistant", content: "Tell me about yourself." }],
};

beforeEach(() => {
  requireUser.mockReset();
  generateAndStoreFeedback.mockReset();
  enforceLimit.mockReset();
  enforceLimit.mockResolvedValue(undefined);
});

describe("createFeedback (SECURITY §3 checklist)", () => {
  it("rejects anonymous callers before touching the service", async () => {
    requireUser.mockRejectedValue(new AppError("UNAUTHENTICATED"));
    const result = await createFeedback(validInput);
    expect(result).toEqual({ success: false, message: "Please sign in to continue." });
    expect(generateAndStoreFeedback).not.toHaveBeenCalled();
  });

  it("derives the user from the session, never from the input", async () => {
    requireUser.mockResolvedValue({ id: "session-uid" });
    generateAndStoreFeedback.mockResolvedValue({ feedbackId: "f1" });
    const result = await createFeedback({ ...validInput, userId: "attacker" });
    expect(result).toEqual({ success: true, feedbackId: "f1" });
    expect(generateAndStoreFeedback).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "session-uid", interviewId: "abc123" }),
    );
  });

  it("rejects malformed input (bad id, empty or oversized transcript)", async () => {
    requireUser.mockResolvedValue({ id: "u" });
    const badInputs = [
      { interviewId: "../etc", transcript: validInput.transcript },
      { interviewId: "abc", transcript: [] },
      { interviewId: "abc", transcript: [{ role: "hacker", content: "x" }] },
      { interviewId: "abc", transcript: [{ role: "user", content: "x".repeat(4001) }] },
    ];
    for (const bad of badInputs) {
      const result = await createFeedback(bad);
      expect(result.success).toBe(false);
    }
    expect(generateAndStoreFeedback).not.toHaveBeenCalled();
  });

  it("maps a missing interview to a safe message", async () => {
    requireUser.mockResolvedValue({ id: "u" });
    generateAndStoreFeedback.mockRejectedValue(
      new AppError("NOT_FOUND", "That interview no longer exists."),
    );
    expect(await createFeedback(validInput)).toEqual({
      success: false,
      message: "That interview no longer exists.",
    });
  });

  it("returns the rate-limit message and skips generation when over the limit", async () => {
    requireUser.mockResolvedValue({ id: "u" });
    enforceLimit.mockRejectedValue(
      new AppError("RATE_LIMITED", "Too many requests. Try again in 2 min."),
    );
    const result = await createFeedback(validInput);
    expect(result).toEqual({ success: false, message: "Too many requests. Try again in 2 min." });
    expect(generateAndStoreFeedback).not.toHaveBeenCalled();
  });

  it("never leaks internal errors", async () => {
    requireUser.mockResolvedValue({ id: "u" });
    generateAndStoreFeedback.mockRejectedValue(new Error("gemini: quota exceeded for key AIza-x"));
    const result = await createFeedback(validInput);
    expect(result.success).toBe(false);
    expect(JSON.stringify(result)).not.toContain("AIza");
  });
});
