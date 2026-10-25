import { describe, expect, it } from "vitest";

import { redactDeep, scrubEvent } from "./scrub";

describe("scrubEvent", () => {
  it("removes request body, cookies, query string, and credential headers", () => {
    const event = {
      request: {
        url: "https://justprep.app/interview/1",
        method: "POST",
        cookies: { __Host_session: "abc" },
        data: { idToken: "secret" },
        query_string: "token=abc",
        headers: { Cookie: "__Host-session=abc", Authorization: "Bearer x", "User-Agent": "ua" },
      },
    };
    const out = scrubEvent(event);
    expect(out.request).toEqual({
      url: "https://justprep.app/interview/1",
      method: "POST",
      headers: { "User-Agent": "ua" },
    });
    // Input is not mutated.
    expect(event.request.cookies).toEqual({ __Host_session: "abc" });
  });

  it("keeps only the user id", () => {
    expect(
      scrubEvent({ user: { id: "uid1", email: "a@b.c", ip_address: "1.2.3.4", username: "a" } })
        .user,
    ).toEqual({ id: "uid1" });
    expect(scrubEvent({ user: { email: "a@b.c" } }).user).toEqual({});
  });

  it("redacts sensitive keys anywhere in extra, contexts, and breadcrumbs", () => {
    const out = scrubEvent({
      extra: { transcript: [{ role: "user", content: "hi" }], attempt: 2 },
      contexts: { session: { cookie: "x", nested: { Email: "a@b.c", ok: true } } },
      breadcrumbs: [{ category: "fetch", data: { token: "t", status: 200 } }, { message: "m" }],
    });
    expect(out.extra).toEqual({ transcript: "[Redacted]", attempt: 2 });
    expect(out.contexts).toEqual({
      session: { cookie: "[Redacted]", nested: { Email: "[Redacted]", ok: true } },
    });
    expect(out.breadcrumbs).toEqual([
      { category: "fetch", data: { token: "[Redacted]", status: 200 } },
      { message: "m" },
    ]);
  });

  it("passes unknown top-level fields through", () => {
    const event = { message: "boom", level: "error", tags: { op: "x" }, extra: { attempt: 1 } };
    expect(scrubEvent(event)).toEqual(event);
  });
});

describe("redactDeep", () => {
  it("handles arrays and depth limits without throwing", () => {
    expect(redactDeep([{ password: "p" }, 1, "s"])).toEqual([{ password: "[Redacted]" }, 1, "s"]);
    let deep: Record<string, unknown> = { leaf: true };
    for (let i = 0; i < 12; i += 1) deep = { child: deep };
    expect(JSON.stringify(redactDeep(deep))).toContain("[Redacted]");
  });
});
