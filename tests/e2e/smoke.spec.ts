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
