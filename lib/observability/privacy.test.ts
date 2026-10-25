import { describe, expect, it } from "vitest";

import { NO_PII_DATA_COLLECTION } from "./privacy";

// Sentry's `dataCollection` fields all default to true, so a field that goes missing here starts
// sending that category silently. This test fails if the policy is ever loosened by accident.
describe("NO_PII_DATA_COLLECTION (SECURITY §2.11)", () => {
  it("opts out of every category that can carry personal data or secrets", () => {
    expect(NO_PII_DATA_COLLECTION).toEqual({
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
    });
  });

  it("leaves no category merely undefined (undefined means 'collect' in Sentry v11)", () => {
    for (const [key, value] of Object.entries(NO_PII_DATA_COLLECTION)) {
      expect(value, `${key} must be set explicitly`).toBeDefined();
    }
  });
});
