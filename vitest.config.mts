import path from "node:path";

import { defineConfig } from "vitest/config";

// Two projects (docs/QUALITY.md §1):
//   unit        — pure code, colocated *.test.ts and tests/unit/**; no network, no emulator
//   integration — tests/integration/**; runs inside `firebase emulators:exec` (CI "test" job)
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname) },
  },
  test: {
    passWithNoTests: true,
    // Unit tests never hold secrets; config/env.ts is exercised by every build instead.
    env: { SKIP_ENV_VALIDATION: "1" },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: [
            "lib/**/*.test.ts",
            "server/**/*.test.ts",
            "config/**/*.test.ts",
            "features/**/*.test.ts",
            "app/**/*.test.ts",
            "tests/unit/**/*.test.ts",
          ],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          environment: "node",
          include: ["tests/integration/**/*.test.ts"],
          testTimeout: 20_000,
        },
      },
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "coverage",
      // Budget from docs/QUALITY.md §1 applies to pure code; UI and legacy route files are covered by e2e.
      include: ["lib/**/*.ts", "server/**/*.ts", "config/**/*.ts"],
      exclude: [
        "**/*.test.ts",
        "lib/vapi.sdk.ts", // legacy voice SDK wrapper, removed in P4.6 (RISKS R12)
        "lib/actions/**", // legacy server actions; replaced by server/* with emulator tests in P2.2–P2.4
        "config/env.ts", // validated at boot; exercised by every build
      ],
      thresholds: { lines: 80, functions: 80, branches: 70, statements: 80 },
    },
  },
});
