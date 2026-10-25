// Rate limits and quotas (docs/SECURITY.md §2.5, GUARDRAILS A3/B7). Every value here is the
// authoritative number; docs quote this file.
//
// Upstash Redis free tier (verified on the pricing page, 2026-09-20 — RISKS R3):
//   500,000 commands / month · 256 MB · 10 GB bandwidth · no credit card.
// A sliding-window check costs ~2-3 commands, so only expensive or abusable operations are
// limited — never plain page views.

export type LimitName =
  | "auth.signIn"
  | "auth.signUp"
  | "interview.create"
  | "feedback.create"
  | "profile.update"
  | "health";

export interface LimitRule {
  /** Maximum requests allowed within `window`. */
  requests: number;
  /** Sliding window, e.g. "10 m", "1 h", "1 d". */
  window: `${number} ${"s" | "m" | "h" | "d"}`;
  /** What identifies the caller. */
  keyBy: "ip" | "uid";
}

export const LIMITS: Record<LimitName, LimitRule> = {
  "auth.signIn": { requests: 10, window: "10 m", keyBy: "ip" },
  "auth.signUp": { requests: 10, window: "10 m", keyBy: "ip" },
  "interview.create": { requests: 5, window: "1 h", keyBy: "uid" },
  "feedback.create": { requests: 10, window: "1 d", keyBy: "uid" },
  "profile.update": { requests: 20, window: "1 h", keyBy: "uid" },
  // Uptime monitors poll every 1–5 min; anything faster is a scan or a misconfiguration.
  health: { requests: 30, window: "1 m", keyBy: "ip" },
};
