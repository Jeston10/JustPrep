// Validated environment — the ONLY module allowed to read `process.env` (GUARDRAILS B4; lint-enforced).
// Server keys never reach the browser; NEXT_PUBLIC_* keys are safe to ship. Missing or malformed
// values fail at boot with a readable message. Set SKIP_ENV_VALIDATION=1 only in CI build steps
// that have no secrets (see .github/workflows/ci.yml).
//
// Variables for services that arrive in later phases (Groq, Upstash, R2, Sentry, PostHog, Resend,
// CRON_SECRET) are added here by the PR that introduces the service — never ahead of time.

import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const nonEmpty = z.string().trim().min(1);

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

    // Firebase Admin (service account). Private key is stored single-line with \n escapes.
    FIREBASE_PROJECT_ID: nonEmpty,
    FIREBASE_CLIENT_EMAIL: z.email().trim(),
    FIREBASE_PRIVATE_KEY: nonEmpty.transform((key) => key.replace(/\\n/g, "\n")),

    // LLM (Google AI Studio free tier). Read explicitly and passed to the provider — the SDK's
    // implicit GOOGLE_GENERATIVE_AI_API_KEY lookup is not used.
    GEMINI_API_KEY: nonEmpty,
  },

  client: {
    // Firebase web config is public by design; access is governed by Firestore rules + Auth domains.
    NEXT_PUBLIC_FIREBASE_API_KEY: nonEmpty,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: nonEmpty,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: nonEmpty,
    NEXT_PUBLIC_FIREBASE_APP_ID: nonEmpty,

    // Vapi (legacy voice pipeline). Removed with Vapi in P4.6 (RISKS R12).
    NEXT_PUBLIC_VAPI_WEB_TOKEN: nonEmpty,
    NEXT_PUBLIC_VAPI_WORKFLOW_ID: nonEmpty,

    NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  },

  // Next.js inlines NEXT_PUBLIC_* at build time only when referenced literally, so each client
  // key must be listed here explicitly.
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_VAPI_WEB_TOKEN: process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN,
    NEXT_PUBLIC_VAPI_WORKFLOW_ID: process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },

  skipValidation: process.env.SKIP_ENV_VALIDATION === "1",
  emptyStringAsUndefined: true,
});
