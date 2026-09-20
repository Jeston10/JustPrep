// HTTP hardening (docs/SECURITY.md §2.9). Pure builders — no Next imports — so the policy is
// unit-testable and the proxy/config are thin.
//
// CSP rollout (RISKS R9): CSP_MODE starts as "report-only". Violations are reviewed in the browser
// console / e2e logs, directives are corrected, and only then is the mode flipped to "enforce" in
// its own PR. Every vendor added later must extend the directives here in the same PR.

export type CspMode = "report-only" | "enforce";

export const CSP_MODE: CspMode = "report-only";

export const CSP_HEADER_NAME: Record<CspMode, string> = {
  "report-only": "Content-Security-Policy-Report-Only",
  enforce: "Content-Security-Policy",
};

export interface CspInput {
  nonce: string;
  isDev: boolean;
  mode?: CspMode;
  /** Where browsers POST violation reports (Sentry, derived from the DSN). Omitted when unset. */
  reportUri?: string | undefined;
}

/**
 * Sentry accepts CSP violation reports at
 * `https://o<org>.ingest.<region>.sentry.io/api/<project>/security/?sentry_key=<key>`; every part
 * comes from the public DSN `https://<key>@o<org>.ingest.<region>.sentry.io/<project>`.
 * Returns undefined for anything that is not a well-formed DSN so a typo never breaks the CSP.
 */
export const cspReportUriFromDsn = (dsn: string | undefined): string | undefined => {
  if (!dsn) return undefined;
  try {
    const url = new URL(dsn);
    const projectId = url.pathname.replace(/^\/+/, "");
    if (url.protocol !== "https:" || !url.username || !/^\d+$/.test(projectId)) return undefined;
    return `https://${url.host}/api/${projectId}/security/?sentry_key=${url.username}`;
  } catch {
    return undefined;
  }
};

/**
 * Origins per vendor, kept explicit so a diff shows exactly which service gained network access.
 * Legacy entries are removed with the code that needs them.
 */
const ORIGINS = {
  firebaseAuth: ["https://*.googleapis.com", "wss://*.googleapis.com"],
  // Sentry and PostHog talk to same-origin paths (/api/monitoring tunnel, /api/ingest rewrite —
  // next.config.ts), so neither needs an entry here.
  // Vapi + its WebRTC transport (Daily). Removed in P4.6 (RISKS R12).
  vapi: ["https://api.vapi.ai", "wss://*.vapi.ai", "https://*.daily.co", "wss://*.daily.co"],
  // Remotive jobs widget, fetched from the browser. Removed in P3.5.
  remotive: ["https://remotive.com"],
} as const;

const connectSrc = ["'self'", ...ORIGINS.firebaseAuth, ...ORIGINS.vapi, ...ORIGINS.remotive];

export const buildCsp = ({ nonce, isDev, mode = CSP_MODE, reportUri }: CspInput): string => {
  const directives = [
    "default-src 'self'",
    // 'strict-dynamic' lets nonce'd scripts load their own chunks; 'unsafe-eval' only for React's
    // dev-time stack reconstruction (never in production). The report-only review showed one eval
    // probe in production — @firebase/util's `new Function("return this")` global detection — which
    // is try/catch-guarded with a fallback, so eval stays blocked.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Styles: React `style={}` attributes (charts, session UI) cannot carry a nonce, and a nonce in
    // style-src makes browsers ignore 'unsafe-inline'. Scripts are the XSS vector that matters;
    // inline styles are accepted, external stylesheets stay same-origin.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src ${connectSrc.join(" ")}`,
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    // Ignored by browsers in report-only mode (and noisy in the console), so only when enforcing.
    ...(!isDev && mode === "enforce" ? ["upgrade-insecure-requests"] : []),
    // Violations reach Sentry (RISKS R9): the review before flipping to enforce reads them there.
    // `report-uri` is deprecated but universally supported; `report-to` needs a separate header.
    ...(reportUri ? [`report-uri ${reportUri}`] : []),
  ];
  return directives.join("; ");
};

/** Static headers applied to every response (pages, routes, static files) via next.config. */
export const STATIC_SECURITY_HEADERS: readonly { key: string; value: string }[] = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "microphone=(self), camera=(self), geolocation=()" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

/** A fresh, unpredictable nonce for one request. */
export const generateNonce = (): string => Buffer.from(crypto.randomUUID()).toString("base64");
