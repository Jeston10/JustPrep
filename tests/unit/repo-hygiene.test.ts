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

  // A file-level "use server" turns every export into a publicly callable endpoint. The legacy
  // lib/actions/general.action.ts did exactly that to five unauthenticated Firestore reads
  // (RISKS R30). Server actions may only live where they are written to be entry points.
  it("declares server actions only in features/*/actions.ts, each behind requireUser", () => {
    const tracked = execFileSync("git", ["ls-files", "*.ts", "*.tsx"], { encoding: "utf8" })
      .trim()
      .split(/\r?\n/);

    const actionFiles = tracked.filter((file) => {
      // git lists files that are tracked but deleted in the working tree.
      if (file.startsWith("tests/") || !existsSync(file)) return false;
      const source = readFileSync(file, "utf8");
      return /^\s*["']use server["']/m.test(source);
    });

    const misplaced = actionFiles.filter((file) => !/^features\/[^/]+\/actions\.ts$/.test(file));
    expect(misplaced, "server actions outside features/*/actions.ts").toEqual([]);
    expect(actionFiles.length, "the action modules must still be found").toBeGreaterThan(0);

    // An action either authenticates, or it is one of the bootstrap actions SECURITY §4 lists as
    // intentionally anonymous — and those are rate limited by IP instead.
    for (const file of actionFiles) {
      const source = readFileSync(file, "utf8");
      expect(source, `${file} must use the session helpers`).toMatch(/@\/server\/auth\/session/);
      expect(source, `${file} must authenticate or rate limit every entry point`).toMatch(
        /requireUser(Checked)?\(|enforceLimit\(/,
      );
    }
  });

  it("never sets Next build-error suppressions (GUARDRAILS B10)", () => {
    const config = readFileSync("next.config.ts", "utf8");
    expect(config).not.toMatch(/ignoreBuildErrors|ignoreDuringBuilds/);
  });
});
