import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

import { env } from "@/config/env";

// Lazy singletons: nothing touches credentials at import time, so builds in secret-less
// environments (CI with SKIP_ENV_VALIDATION=1) can collect page data without a service account.
// Moves to server/db/firestore.ts in P2.2.
let app: App | undefined;

const getApp = (): App => {
  app ??=
    getApps()[0] ??
    initializeApp({
      credential: cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY,
      }),
    });
  return app;
};

export const getAdminAuth = (): Auth => getAuth(getApp());
export const getDb = (): Firestore => getFirestore(getApp());
