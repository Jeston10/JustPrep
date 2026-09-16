import { readFileSync } from "node:fs";

import {
  assertFails,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// SECURITY §2.7: the client SDK may read or write nothing; all data access is via firebase-admin.
// Runs inside `firebase emulators:exec` (CI "test" job / `pnpm emulators` locally).
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8080";
const [host, port] = emulatorHost.split(":");

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-justprep",
    firestore: {
      rules: readFileSync("firebase/firestore.rules", "utf8"),
      host: host ?? "127.0.0.1",
      port: Number(port ?? 8080),
    },
  });
  // Seed a document as admin (rules bypassed) so reads have something to be denied on.
  await env.withSecurityRulesDisabled(async (ctx) => {
    await ctx.firestore().doc("users/alice").set({ name: "Alice", email: "alice@example.com" });
    await ctx.firestore().doc("interviews/i1").set({ userId: "alice", finalized: true });
  });
});

afterAll(async () => {
  await env.cleanup();
});

describe("firestore.rules — deny-all for clients", () => {
  it("denies anonymous reads and writes", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(db.doc("users/alice").get());
    await assertFails(db.collection("interviews").get());
    await assertFails(db.doc("users/anyone").set({ name: "x" }));
  });

  it("denies reads and writes even for the signed-in owner of the document", async () => {
    const db = env.authenticatedContext("alice").firestore();
    await assertFails(db.doc("users/alice").get());
    await assertFails(db.doc("users/alice").update({ name: "Mallory" }));
    await assertFails(db.doc("interviews/i1").get());
    await assertFails(db.collection("feedback").add({ userId: "alice", totalScore: 100 }));
  });

  it("denies collection-group and wildcard paths", async () => {
    const db = env.authenticatedContext("alice").firestore();
    await assertFails(db.collectionGroup("logins").get());
    await assertFails(db.doc("secrets/anything").get());
    expect(true).toBe(true);
  });
});
