import { describe, expect, it, vi } from "vitest";

// Vitest resolves the client build of `server-only`, which throws on import by design.
vi.mock("server-only", () => ({}));
vi.mock("@/firebase/admin", () => ({
  getDb: () => {
    throw new Error("tests must pass an explicit db");
  },
}));

const { getFeedbackByInterviewId, getInterviewById, getInterviewsByUserId } =
  await import("./interview.service");

type Doc = Record<string, unknown>;

/** Minimal in-memory Firestore: equality filters, ordering ignored, `limit` honoured. */
const fakeDb = (data: Record<string, Record<string, Doc>>) => {
  const makeQuery = (
    name: string,
    filters: { field: string; value: unknown }[] = [],
    cap?: number,
  ) => ({
    where: (field: string, _op: string, value: unknown) =>
      makeQuery(name, [...filters, { field, value }], cap),
    orderBy: () => makeQuery(name, filters, cap),
    limit: (n: number) => makeQuery(name, filters, n),
    get: () => {
      const entries = Object.entries(data[name] ?? {}).filter(([, doc]) =>
        filters.every((f) => doc[f.field] === f.value),
      );
      const limited = cap === undefined ? entries : entries.slice(0, cap);
      return Promise.resolve({
        docs: limited.map(([id, doc]) => ({ id, data: () => doc })),
      });
    },
  });

  return {
    collection: (name: string) => ({
      ...makeQuery(name),
      doc: (id: string) => ({
        get: () => {
          const doc = data[name]?.[id];
          return Promise.resolve({
            exists: doc !== undefined,
            id,
            data: () => doc,
          });
        },
      }),
    }),
  };
};

const store = {
  interviews: {
    "owned-1": { userId: "alice", role: "Engineer", finalized: true },
    "owned-2": { userId: "bob", role: "Designer", finalized: true },
  },
  feedback: {
    "fb-alice": { userId: "alice", interviewId: "owned-1", totalScore: 80 },
    "fb-bob": { userId: "bob", interviewId: "owned-1", totalScore: 40 },
  },
};

describe("interview reads (SECURITY §3)", () => {
  it("returns only the viewer's own feedback for a shared interview", async () => {
    const db = fakeDb(structuredClone(store));

    const mine = await getFeedbackByInterviewId(
      { interviewId: "owned-1", userId: "alice" },
      db as never,
    );
    expect(mine?.id).toBe("fb-alice");

    // Bob took the same interview. Alice's id must not reach his feedback, and vice versa.
    const theirs = await getFeedbackByInterviewId(
      { interviewId: "owned-1", userId: "bob" },
      db as never,
    );
    expect(theirs?.id).toBe("fb-bob");

    const stranger = await getFeedbackByInterviewId(
      { interviewId: "owned-1", userId: "mallory" },
      db as never,
    );
    expect(stranger).toBeNull();
  });

  it("lists only the given user's interviews", async () => {
    const db = fakeDb(structuredClone(store));

    const alice = await getInterviewsByUserId("alice", db as never);
    expect(alice.map((i) => i.id)).toEqual(["owned-1"]);
    expect(await getInterviewsByUserId("mallory", db as never)).toEqual([]);
  });

  it("returns null for an interview that does not exist", async () => {
    const db = fakeDb(structuredClone(store));

    expect(await getInterviewById("missing", db as never)).toBeNull();
    expect((await getInterviewById("owned-2", db as never))?.id).toBe("owned-2");
  });
});
