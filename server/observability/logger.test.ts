import pino from "pino";
import { describe, expect, it } from "vitest";

import { REDACTED_PATHS, buildLoggerOptions } from "./logger";

// Captures pino output synchronously so assertions can inspect the emitted JSON.
const capture = () => {
  const lines: string[] = [];
  const stream = { write: (chunk: string) => void lines.push(chunk) };
  const log = pino(buildLoggerOptions("debug"), stream as pino.DestinationStream);
  return { log, lines };
};

describe("logger redaction (SECURITY §2.11)", () => {
  it("masks cookies, tokens, emails, and transcripts wherever they appear", () => {
    const { log, lines } = capture();
    log.info(
      {
        req: { headers: { cookie: "session=abc", authorization: "Bearer x" } },
        user: { email: "person@example.com", token: "tok" },
        session: { sessionCookie: "abc", idToken: "id" },
        attempt: { transcript: [{ role: "user", text: "secret answer" }] },
        safe: "visible",
      },
      "request",
    );
    const output = lines.join("");
    expect(output).not.toContain("session=abc");
    expect(output).not.toContain("Bearer x");
    expect(output).not.toContain("person@example.com");
    expect(output).not.toContain("secret answer");
    expect(output).not.toContain('"tok"');
    expect(output).toContain("[redacted]");
    expect(output).toContain('"safe":"visible"');
  });

  it("emits ISO timestamps and string levels without pid/hostname noise", () => {
    const { log, lines } = capture();
    log.warn({ op: "test" }, "hello");
    const entry = JSON.parse(lines[0] ?? "{}") as Record<string, unknown>;
    expect(entry.level).toBe("warn");
    expect(entry.op).toBe("test");
    expect(typeof entry.time).toBe("string");
    expect(entry.pid).toBeUndefined();
    expect(entry.hostname).toBeUndefined();
  });

  it("keeps the redaction list covering the fields named in the security doc", () => {
    for (const path of ["*.cookie", "*.token", "*.email", "*.transcript", "*.resumeText"]) {
      expect(REDACTED_PATHS).toContain(path);
    }
  });
});
