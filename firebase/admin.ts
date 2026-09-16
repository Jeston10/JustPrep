import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

import { env, usesFirebaseEmulators } from "@/config/env";

// Lazy singletons: nothing touches credentials at import time, so builds in secret-less
// environments (CI with SKIP_ENV_VALIDATION=1) can collect page data without a service account.
// Moves to server/db/firestore.ts in P2.2.
let app: App | undefined;

const createApp = (): App => {
  // Emulators need no credentials; the SDK routes to FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST.
  if (usesFirebaseEmulators()) return initializeApp({ projectId: env.FIREBASE_PROJECT_ID });
  if (!env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
    throw new Error("Firebase Admin credentials are not configured (see config/env.ts).");
  }
  return initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY,
    }),
  });
};

const getApp = (): App => {
  app ??= getApps()[0] ?? createApp();
  return app;
};

export const getAdminAuth = (): Auth => getAuth(getApp());
export const getDb = (): Firestore => getFirestore(getApp());
