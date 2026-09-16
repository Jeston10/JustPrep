// Seeds the local Firebase emulators with a demo account and sample data so `pnpm dev:emulators`
// and the e2e suite have something to sign in to. Idempotent. Never run against a real project:
// it refuses unless the emulator host variables are set.
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST;
const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
if (!firestoreHost || !authHost) {
  throw new Error(
    "Refusing to seed: FIRESTORE_EMULATOR_HOST and FIREBASE_AUTH_EMULATOR_HOST must point at emulators.",
  );
}

const projectId = process.env.FIREBASE_PROJECT_ID ?? "demo-justprep";
const app = getApps()[0] ?? initializeApp({ projectId }); // emulators need no credentials

export const DEMO_USER = {
  uid: "demo-user",
  email: "demo@justprep.test",
  password: "demo-password-123",
  name: "Demo Candidate",
} as const;

const auth = getAuth(app);
const db = getFirestore(app);

const ensureUser = async () => {
  try {
    await auth.getUser(DEMO_USER.uid);
  } catch {
    await auth.createUser({
      uid: DEMO_USER.uid,
      email: DEMO_USER.email,
      password: DEMO_USER.password,
      displayName: DEMO_USER.name,
      emailVerified: true,
    });
  }
  await db
    .collection("users")
    .doc(DEMO_USER.uid)
    .set({ name: DEMO_USER.name, email: DEMO_USER.email }, { merge: true });
};

const ensureInterview = async () => {
  const id = "demo-interview";
  await db
    .collection("interviews")
    .doc(id)
    .set({
      role: "Frontend Engineer",
      type: "Mixed",
      level: "Mid",
      techstack: ["React", "TypeScript", "Next.js"],
      questions: [
        "Walk me through how you would structure a data-fetching layer in Next.js.",
        "Tell me about a time you disagreed with a design decision.",
        "How do you decide what to memoize in a React component?",
      ],
      userId: DEMO_USER.uid,
      finalized: true,
      coverImage: "/covers/adobe.png",
      createdAt: new Date().toISOString(),
    });
  return id;
};

// Scripts are compiled as CommonJS by tsx (no "type": "module"), so no top-level await.
const main = async () => {
  await ensureUser();
  const interviewId = await ensureInterview();
  process.stdout.write(`seeded ${projectId}: user ${DEMO_USER.email}, interview ${interviewId}\n`);
};

main().catch((error: unknown) => {
  process.stderr.write(`seed failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
