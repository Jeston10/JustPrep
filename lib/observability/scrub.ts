// PII scrubbing for error reports (docs/SECURITY.md §2.11). Pure and vendor-free so the same
// function runs in the browser, the Node runtime, and the edge runtime, and is unit-tested once.
// It is the `beforeSend` hook for every Sentry client; Sentry's own `sendDefaultPii: false`
// covers IPs and cookies at the SDK level, this covers what our code (or a framework
// integration) might attach on top.

/**
 * Structural subset of a Sentry event (compatible with the SDK's `ErrorEvent`); anything else on
 * the object passes through untouched.
 */
export interface ScrubbableEvent {
  request?:
    | {
        url?: string | undefined;
        method?: string | undefined;
        cookies?: unknown;
        headers?: Record<string, string> | undefined;
        data?: unknown;
        query_string?: unknown;
        env?: unknown;
      }
    | undefined;
  user?: { id?: string | number | undefined; [key: string]: unknown } | undefined;
  extra?: Record<string, unknown> | undefined;
  contexts?: Record<string, unknown> | undefined;
  breadcrumbs?: { data?: Record<string, unknown> | undefined }[] | undefined;
}

/** Request headers that carry credentials. Compared case-insensitively. */
const SENSITIVE_HEADERS = new Set(["cookie", "set-cookie", "authorization", "x-vapi-secret"]);

/** Object keys (any depth) whose values are never useful in an error report and may be secret. */
const SENSITIVE_KEYS = new Set([
  "cookie",
  "cookies",
  "sessioncookie",
  "idtoken",
  "token",
  "accesstoken",
  "refreshtoken",
  "apikey",
  "privatekey",
  "password",
  "email",
  "transcript",
  "resumetext",
  "authorization",
]);

const REDACTED = "[Redacted]";
const MAX_DEPTH = 8;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Replaces sensitive keys recursively; returns a new value, never mutates the input. */
export const redactDeep = (value: unknown, depth = 0): unknown => {
  if (depth > MAX_DEPTH) return REDACTED;
  if (Array.isArray(value)) return value.map((item) => redactDeep(item, depth + 1));
  if (!isPlainObject(value)) return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      SENSITIVE_KEYS.has(key.toLowerCase()) ? REDACTED : redactDeep(item, depth + 1),
    ]),
  );
};

/**
 * Sentry `beforeSend`: strips request bodies, cookies, credential headers, query strings, and
 * every user attribute except `id`; redacts sensitive keys anywhere in extra/contexts/breadcrumbs.
 */
export const scrubEvent = <T extends ScrubbableEvent>(event: T): T => {
  const scrubbed: ScrubbableEvent = { ...event };

  if (event.request) {
    const {
      cookies: _cookies,
      data: _data,
      query_string: _qs,
      env: _env,
      headers,
      ...rest
    } = event.request;
    scrubbed.request = {
      ...rest,
      ...(headers
        ? {
            headers: Object.fromEntries(
              Object.entries(headers).filter(
                ([name]) => !SENSITIVE_HEADERS.has(name.toLowerCase()),
              ),
            ),
          }
        : {}),
    };
  }

  if (event.user) {
    scrubbed.user = event.user.id === undefined ? {} : { id: event.user.id };
  }

  if (event.extra) scrubbed.extra = redactDeep(event.extra) as Record<string, unknown>;
  if (event.contexts) scrubbed.contexts = redactDeep(event.contexts) as Record<string, unknown>;
  if (event.breadcrumbs) {
    scrubbed.breadcrumbs = event.breadcrumbs.map((crumb) =>
      crumb.data ? { ...crumb, data: redactDeep(crumb.data) as Record<string, unknown> } : crumb,
    );
  }

  // Only known keys were rewritten, and each with a value of the same shape.
  return scrubbed as T;
};
