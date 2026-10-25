// Feature flags (ARCHITECTURE §7): new capabilities ship dark and are switched on per user or
// per cohort in PostHog. This file is the complete list with the value used when PostHog is not
// configured, unreachable, or has no definition for the flag — so the app behaves identically
// without the vendor. Read server-side through `isFlagEnabled()` in server/observability/analytics.ts.

export const FLAGS = {
  // P4: chat-style interview mode (text tier). Off until P4.7 e2e is green (RISKS R11).
  "text-interview-mode": false,
  // P5: realtime voice tiers. Off until the voice pipeline lands.
  "voice-interview": false,
} as const satisfies Record<string, boolean>;

export type FlagName = keyof typeof FLAGS;

export const flagDefault = (name: FlagName): boolean => FLAGS[name];
