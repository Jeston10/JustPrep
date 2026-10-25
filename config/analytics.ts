// Product analytics vocabulary (ARCHITECTURE §7). Every event the app can emit — from the browser
// or the server — is named here so dashboards never break on a typo and a diff shows exactly
// what we measure. Properties are plain scalars; anything personal (email, transcript text, free
// text answers) is forbidden by type and dropped at runtime (`server/observability/analytics.ts`).

export const ANALYTICS_EVENTS = [
  "user.signed_up",
  "user.signed_in",
  "user.signed_out",
  "interview.created",
  "feedback.created",
  "profile.updated",
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

export type AnalyticsProperties = Record<string, string | number | boolean>;

/** Property keys that must never be sent to analytics, whatever the value. */
export const FORBIDDEN_PROPERTY_KEYS = new Set([
  "email",
  "name",
  "transcript",
  "content",
  "answer",
  "resumetext",
  "token",
  "idtoken",
  "cookie",
  "password",
  "ip",
]);

/** Drops forbidden keys (case-insensitive). Pure; shared by the browser and server adapters. */
export const safeProperties = (properties: AnalyticsProperties = {}): AnalyticsProperties =>
  Object.fromEntries(
    Object.entries(properties).filter(([key]) => !FORBIDDEN_PROPERTY_KEYS.has(key.toLowerCase())),
  );
