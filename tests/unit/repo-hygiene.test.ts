import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

// RISKS R20: .env.example must stay tracked while every other .env* file stays ignored.
describe("repository hygiene", () => {
  it("keeps .env.example in the repo and ignores local env files", () => {
    expect(existsSync(".env.example")).toBe(true);

    const ignored = execFileSync("git", ["check-ignore", ".env.local", ".env.production.local"], {
      encoding: "utf8",
    })
      .trim()
      .split(/\r?\n/);
    expect(ignored).toEqual([".env.local", ".env.production.local"]);

    let exampleIsIgnored = true;
    try {
      execFileSync("git", ["check-ignore", "-q", ".env.example"]);
    } catch {
      exampleIsIgnored = false;
    }
    expect(exampleIsIgnored).toBe(false);
  });

  it("never sets Next build-error suppressions (GUARDRAILS B10)", () => {
    const config = readFileSync("next.config.ts", "utf8");
    expect(config).not.toMatch(/ignoreBuildErrors|ignoreDuringBuilds/);
  });
});
