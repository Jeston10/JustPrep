import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";

import { env } from "@/config/env";

// Browser-side Firebase: Auth only. Firestore is never accessed from the client (SECURITY §2.7).
// Moves to lib/firebase-client.ts in P2.4.
const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Dev/CI only: point the browser SDK at the Auth emulator. Guarded so HMR does not reconnect.
if (env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST && !auth.emulatorConfig) {
  connectAuthEmulator(auth, `http://${env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST}`, {
    disableWarnings: true,
  });
}
