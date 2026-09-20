// One-off (RISKS R1): revoke refresh tokens for every user so session cookies issued before the
// logging fix cannot be reused. Users simply sign in again. Run against production once after the
// Phase 1 release: `pnpm exec tsx scripts/revoke-all-sessions.ts --confirm`
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const main = async () => {
  if (!process.argv.includes("--confirm")) {
    throw new Error("Refusing to run without --confirm (this signs out every user).");
  }
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) throw new Error("Service account env is missing.");

  const app =
    getApps()[0] ?? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  const auth = getAuth(app);

  let revoked = 0;
  let pageToken: string | undefined;
  do {
    const page = await auth.listUsers(1000, pageToken);
    await Promise.all(page.users.map((user) => auth.revokeRefreshTokens(user.uid)));
    revoked += page.users.length;
    pageToken = page.pageToken;
  } while (pageToken);

  process.stdout.write(`revoked refresh tokens for ${revoked} users in ${projectId}\n`);
};

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
