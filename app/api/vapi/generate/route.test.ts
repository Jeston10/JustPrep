import { describe, expect, it, vi } from "vitest";

// The webhook must be unreachable without the shared secret (SECURITY §2.10, RISKS R2).
const envState: { VAPI_WEBHOOK_SECRET?: string; GEMINI_API_KEY: string } = {
  GEMINI_API_KEY: "test",
};
vi.mock("@/config/env", () => ({ env: envState }));
vi.mock("@/server/observability/logger", () => ({ opLogger: () => ({ error: vi.fn() }) }));
vi.mock("@/firebase/admin", () => ({
  getDb: () => ({
    collection: () => ({ doc: () => ({ get: () => Promise.resolve({ exists: false }) }) }),
  }),
}));
vi.mock("@ai-sdk/google", () => ({ createGoogle: () => () => ({}) }));
vi.mock("ai", () => ({ generateText: vi.fn() }));

const { POST } = await import("./route");

const post = (body: unknown, headers: Record<string, string> = {}) =>
  POST(
    new Request("http://localhost/api/vapi/generate", {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );

const body = {
  type: "Technical",
  role: "Engineer",
  level: "Mid",
  techstack: "React",
  amount: 3,
  userid: "u1",
};
const SECRET = "correct-horse-battery-staple";

describe("POST /api/vapi/generate", () => {
  it("is disabled (503) when no webhook secret is configured", async () => {
    delete envState.VAPI_WEBHOOK_SECRET;
    expect((await post(body, { "x-vapi-secret": "anything" })).status).toBe(503);
  });

  it("rejects missing or wrong secrets with 401", async () => {
    envState.VAPI_WEBHOOK_SECRET = SECRET;
    expect((await post(body)).status).toBe(401);
    expect((await post(body, { "x-vapi-secret": "wrong" })).status).toBe(401);
  });

  it("rejects malformed bodies with 400", async () => {
    envState.VAPI_WEBHOOK_SECRET = SECRET;
    const headers = { "x-vapi-secret": SECRET };
    expect((await post({ ...body, userid: "../x" }, headers)).status).toBe(400);
    expect((await post({ ...body, amount: 999 }, headers)).status).toBe(400);
    expect((await post("not json at all", headers)).status).toBe(400);
  });

  it("refuses to create interviews for unknown users (404)", async () => {
    envState.VAPI_WEBHOOK_SECRET = SECRET;
    expect((await post(body, { "x-vapi-secret": SECRET })).status).toBe(404);
  });
});
