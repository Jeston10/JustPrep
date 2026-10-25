// Sentry data-collection policy (docs/SECURITY.md §2.11), shared by the server, edge, and browser
// SDKs so one file decides what may ever leave the process.
//
// This must be explicit. Sentry v10's `sendDefaultPii: false` was removed in v11 and replaced by
// `dataCollection`, whose every field defaults to **true** — an omitted config now collects user
// info, cookies, headers, bodies, query params and local variables. The upgrade therefore flips
// the privacy posture silently, so the baseline is spelled out here and asserted in a test.

import type { init } from "@sentry/nextjs";

/** The SDK does not re-export `DataCollection`, so take it from `init`'s own option type. */
type DataCollection = NonNullable<Parameters<typeof init>[0]["dataCollection"]>;

/**
 * Collect nothing that could identify a person or carry a secret. The only user data in an event
 * is the uid we attach ourselves (`setUser({ id })`); `scrubEvent` is the second line of defence.
 *
 * `stackFrameVariables` is off because locals routinely hold ID tokens, cookies, and transcript
 * text; `frameContextLines` (source lines, not data) keeps its default so traces stay readable.
 */
export const NO_PII_DATA_COLLECTION = {
  userInfo: false,
  cookies: false,
  httpHeaders: false,
  httpBodies: [],
  urlQueryParams: false,
  graphQL: { document: false, variables: false },
  genAI: { inputs: false, outputs: false },
  mcp: { inputs: false, outputs: false },
  databaseQueryData: false,
  queues: false,
  stackFrameVariables: false,
} as const satisfies DataCollection;
