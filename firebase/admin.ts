import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

import { env } from "@/config/env";

// Moves to server/db/firestore.ts in P2.2.
const createApp = (): App =>
  initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY,
    }),
  });

const app: App = getApps()[0] ?? createApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
