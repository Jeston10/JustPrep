import { expect, test, type APIRequestContext } from "@playwright/test";

// MILESTONES P1.7 exit criterion: create a user, give them data, delete the account, then prove
// the documents are gone and the credentials no longer work. Runs against the emulators, which
// `firebase emulators:exec` exposes on the hosts below (same values as the CI job).

const PROJECT = process.env.FIREBASE_PROJECT_ID ?? "demo-justprep";
const AUTH_HOST = `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST ?? "127.0.0.1:9099"}`;
const FIRESTORE_HOST = `http://${process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8080"}`;
const DOCUMENTS = `${FIRESTORE_HOST}/v1/projects/${PROJECT}/databases/(default)/documents`;
// The emulators accept this fixed bearer token as full admin; no real credentials exist here.
const ADMIN = { Authorization: "Bearer owner" };

const PASSWORD = "delete-me-password-123";

/** Signs in through the Auth emulator's REST API. Returns the uid, or null when rejected. */
const restSignIn = async (request: APIRequestContext, email: string): Promise<string | null> => {
  const response = await request.post(
    `${AUTH_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-api-key`,
    { data: { email, password: PASSWORD, returnSecureToken: true } },
  );
  if (!response.ok()) return null;
  const body = (await response.json()) as { localId?: string };
  return body.localId ?? null;
};

const documentExists = async (request: APIRequestContext, path: string): Promise<boolean> =>
  (await request.get(`${DOCUMENTS}/${path}`, { headers: ADMIN })).ok();

test("a user can delete their account, and their data goes with it", async ({
  page,
  request,
}, testInfo) => {
  // One account per project (the suite runs at three widths in parallel).
  const email = `delete-${testInfo.project.name}-${Date.now()}@justprep.test`;

  // 1. Sign up through the UI, which creates the Auth user and the user document.
  await page.goto("/sign-up");
  await page.getByLabel("Name").fill("Temporary Candidate");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: /create an account/i }).click();
  await expect(page).toHaveURL(/\/sign-in$/);

  const uid = await restSignIn(request, email);
  expect(uid, "the account must exist after sign-up").toBeTruthy();

  // 2. Give the account owned documents, so deletion has something to remove.
  const interviewId = `interview-${uid ?? ""}`;
  const feedbackId = `feedback-${uid ?? ""}`;
  await request.patch(`${DOCUMENTS}/interviews/${interviewId}`, {
    headers: ADMIN,
    data: {
      fields: { userId: { stringValue: uid ?? "" }, role: { stringValue: "Engineer" } },
    },
  });
  await request.patch(`${DOCUMENTS}/feedback/${feedbackId}`, {
    headers: ADMIN,
    data: {
      fields: {
        userId: { stringValue: uid ?? "" },
        interviewId: { stringValue: interviewId },
        totalScore: { integerValue: "80" },
      },
    },
  });
  expect(await documentExists(request, `users/${uid ?? ""}`)).toBe(true);

  // 3. Sign in through the UI so the session cookie is real.
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/$/);

  // 4. Delete: Settings → Delete Account → type DELETE and re-enter the password.
  await page.getByRole("button", { name: /settings/i }).click();
  await page.getByRole("button", { name: /delete account/i }).click();
  // The menu item that opened the dialog stays mounted behind it, so scope to the dialog.
  const dialog = page.getByRole("dialog", { name: /delete your account/i });
  await dialog.getByLabel(/type DELETE to confirm/i).fill("DELETE");
  await dialog.getByLabel(/confirm your password/i).fill(PASSWORD);
  await dialog.getByRole("button", { name: /^delete account$/i }).click();

  // 5. Signed out, and nothing is left behind.
  await expect(page).toHaveURL(/\/sign-in$/, { timeout: 20_000 });
  await expect
    .poll(async () => documentExists(request, `users/${uid ?? ""}`), { timeout: 15_000 })
    .toBe(false);
  expect(await documentExists(request, `interviews/${interviewId}`)).toBe(false);
  expect(await documentExists(request, `feedback/${feedbackId}`)).toBe(false);
  expect(await restSignIn(request, email), "the credentials must stop working").toBeNull();
});
