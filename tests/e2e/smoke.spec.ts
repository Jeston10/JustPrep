import { expect, test } from "@playwright/test";

// Seed spec for docs/RESPONSIVE.md §5 step 3: public pages render and never overflow horizontally.
// Extended per phase as screens are rebuilt (dashboard, form, session, feedback).
const publicPages = ["/sign-in", "/sign-up"];

for (const path of publicPages) {
  test(`${path} renders and has no horizontal overflow`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);

    await expect(page.getByRole("button", { name: /sign in|create an account/i })).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow, "page body must not scroll horizontally").toBe(false);
  });
}

test("protected routes redirect anonymous visitors to sign-in", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/sign-in$/);
});

// docs/SECURITY.md §2.9 — headers are present on real responses and the nonce reaches Next's scripts.
test.describe("security headers", () => {
  test("pages carry the static headers and a nonce'd CSP", async ({ page }) => {
    const response = await page.goto("/sign-in");
    expect(response).not.toBeNull();
    const headers = response?.headers() ?? {};

    expect(headers["strict-transport-security"]).toMatch(/max-age=\d+/);
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"]).toContain("microphone=(self)");

    const csp =
      headers["content-security-policy-report-only"] ?? headers["content-security-policy"];
    expect(csp, "a CSP header must be present").toBeTruthy();
    const nonce = /'nonce-([^']+)'/.exec(csp ?? "")?.[1];
    expect(nonce, "CSP must carry a nonce").toBeTruthy();

    // Next applies the nonce from the request-side CSP to its own inline scripts.
    const html = (await response?.text()) ?? "";
    expect(html).toContain(`nonce="${nonce}"`);
  });

  test("API routes also carry the static headers", async ({ request }) => {
    const response = await request.get("/api/news");
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
    expect(response.headers()["strict-transport-security"]).toMatch(/max-age=\d+/);
  });
});
