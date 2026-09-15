import { defineConfig, devices } from "@playwright/test";

// E2E against a production build (docs/QUALITY.md §1). CI runs this inside `firebase emulators:exec`
// with demo env values; locally, `pnpm test:e2e` reuses a running `next start` or starts one.
// Set PLAYWRIGHT_CHANNEL=chrome to use an installed Chrome when the browser download is unavailable.
const port = Number(process.env.PLAYWRIGHT_PORT ?? 3000);
const baseURL = `http://localhost:${port}`;
const channel = process.env.PLAYWRIGHT_CHANNEL;
const base = { ...devices["Desktop Chrome"], ...(channel ? { channel } : {}) };

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    // The three widths every screen must pass (docs/RESPONSIVE.md §5), emulated in Chromium.
    // WebKit/iOS Safari and Firefox are covered by the manual device-matrix pass.
    {
      name: "mobile-375",
      use: { ...base, viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true },
    },
    {
      name: "tablet-768",
      use: { ...base, viewport: { width: 768, height: 1024 }, hasTouch: true },
    },
    {
      name: "desktop-1280",
      use: { ...base, viewport: { width: 1280, height: 720 } },
    },
  ],
  webServer: {
    command: `pnpm exec next start -p ${port}`,
    url: `${baseURL}/sign-in`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
