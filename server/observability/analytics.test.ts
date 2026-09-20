import { describe, expect, it, vi } from "vitest";

import { FLAGS } from "@/config/flags";

import { type AnalyticsClient, captureServerEvent, isFlagEnabled } from "./analytics";

vi.mock("./logger", () => ({ logger: { info: vi.fn(), warn: vi.fn() } }));
// `after()` is only available inside a request; the adapter falls back to an inline flush.
vi.mock("next/server", () => ({
  after: () => {
    throw new Error("outside request scope");
  },
}));

const fakeClient = (flag?: boolean | Promise<never>) => {
  const captured: { distinctId: string; event: string; properties?: Record<string, unknown> }[] =
    [];
  const flush = vi.fn(() => Promise.resolve());
  const client: AnalyticsClient = {
    capture: (m) => {
      captured.push(m);
    },
    isFeatureEnabled: () => (flag instanceof Promise ? flag : Promise.resolve(flag)),
    flush,
  };
  return { client, captured, flush };
};

describe("captureServerEvent (SECURITY §2.11)", () => {
  it("identifies by uid, drops personal property keys, and flushes", async () => {
    const { client, captured, flush } = fakeClient();
    captureServerEvent(
      "feedback.created",
      "uid1",
      { email: "a@b.c", transcript: "…", Name: "x", totalScore: 88, mode: "text" },
      client,
    );
    expect(captured).toEqual([
      {
        distinctId: "uid1",
        event: "feedback.created",
        properties: { totalScore: 88, mode: "text", environment: "test" },
      },
    ]);
    await Promise.resolve();
    expect(flush).toHaveBeenCalledOnce();
  });

  it("is a no-op without a client and never throws on vendor errors", () => {
    expect(() => {
      captureServerEvent("user.signed_in", "uid1", undefined, null);
    }).not.toThrow();
    const broken: AnalyticsClient = {
      capture: () => {
        throw new Error("network");
      },
      isFeatureEnabled: () => Promise.resolve(undefined),
      flush: () => Promise.resolve(),
    };
    expect(() => {
      captureServerEvent("user.signed_in", "uid1", undefined, broken);
    }).not.toThrow();
  });
});

describe("isFlagEnabled (config/flags.ts fallbacks)", () => {
  it("uses the PostHog value when defined", async () => {
    expect(await isFlagEnabled("text-interview-mode", "uid1", fakeClient(true).client)).toBe(true);
  });

  it("falls back to the config default when unconfigured, undefined, or failing", async () => {
    const expected = FLAGS["text-interview-mode"];
    expect(await isFlagEnabled("text-interview-mode", "uid1", null)).toBe(expected);
    expect(await isFlagEnabled("text-interview-mode", "uid1", fakeClient(undefined).client)).toBe(
      expected,
    );
    const failing = fakeClient(Promise.reject(new Error("timeout")));
    expect(await isFlagEnabled("text-interview-mode", "uid1", failing.client)).toBe(expected);
  });

  it("gives up on a slow lookup and returns the default", async () => {
    vi.useFakeTimers();
    try {
      const never = fakeClient(new Promise<never>(() => undefined));
      const pending = isFlagEnabled("voice-interview", "uid1", never.client);
      await vi.advanceTimersByTimeAsync(1_000);
      expect(await pending).toBe(FLAGS["voice-interview"]);
    } finally {
      vi.useRealTimers();
    }
  });
});
