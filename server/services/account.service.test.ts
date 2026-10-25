import { describe, expect, it, vi } from "vitest";

const adminState = { deletedUsers: [] as string[] };
vi.mock("@/firebase/admin", () => ({
  getDb: () => {
    throw new Error("tests must pass an explicit db");
  },
  getAdminAuth: () => ({
    deleteUser: (uid: string) => {
      adminState.deletedUsers.push(uid);
      return Promise.resolve();
    },
  }),
}));
const erasure = vi.fn(() => Promise.resolve("skipped" as const));
vi.mock("@/server/observability/analytics", () => ({ requestAnalyticsDeletion: erasure }));
vi.mock("@/server/observability/logger", () => ({
  opLogger: () => ({ info: vi.fn(), warn: vi.fn() }),
}));

const { deleteUserAccount, exportUserData } = await import("./account.service");

/** Minimal in-memory Firestore: collections of documents, `where` equality, batched deletes. */
/** Removes a document from the fake store (Map keeps the lint rule about dynamic delete happy). */
const drop = (
  data: Record<string, Record<string, Record<string, unknown>>>,
  collection: string,
  id: string,
): void => {
  const docs = data[collection];
  if (docs)
    data[collection] = Object.fromEntries(Object.entries(docs).filter(([key]) => key !== id));
};

const fakeDb = (data: Record<string, Record<string, Record<string, unknown>>>) => {
  const commits: string[][] = [];
  const makeQuery = (name: string, filter?: { field: string; value: unknown }, cap?: number) => ({
    where: (field: string, _op: string, value: unknown) => makeQuery(name, { field, value }),
    limit: (n: number) => makeQuery(name, filter, n),
    get: () => {
      const entries = Object.entries(data[name] ?? {}).filter(
        ([, doc]) => !filter || doc[filter.field] === filter.value,
      );
      const limited = cap === undefined ? entries : entries.slice(0, cap);
      return Promise.resolve({
        empty: limited.length === 0,
        size: limited.length,
        docs: limited.map(([id, doc]) => ({
          id,
          ref: { collection: name, id },
          data: () => doc,
          get: (field: string) => doc[field],
        })),
      });
    },
  });

  return {
    commits,
    db: {
      collection: (name: string) => ({
        ...makeQuery(name),
        doc: (id: string) => ({
          get: () =>
            Promise.resolve({
              exists: Boolean(data[name]?.[id]),
              data: () => data[name]?.[id],
            }),
          delete: () => {
            drop(data, name, id);
            return Promise.resolve();
          },
        }),
      }),
      batch: () => {
        const deletes: { collection: string; id: string }[] = [];
        return {
          delete: (ref: { collection: string; id: string }) => deletes.push(ref),
          commit: () => {
            commits.push(deletes.map((ref) => `${ref.collection}/${ref.id}`));
            for (const ref of deletes) drop(data, ref.collection, ref.id);
            return Promise.resolve();
          },
        };
      },
    },
  };
};

const seed = () => ({
  users: { u1: { name: "Ada", email: "ada@example.test" }, u2: { name: "Other" } },
  interviews: {
    i1: { userId: "u1", role: "Engineer" },
    i2: { userId: "u1", role: "Lead" },
    i3: { userId: "u2", role: "Designer" },
  },
  feedback: {
    f1: { userId: "u1", interviewId: "i1", totalScore: 80 },
    f2: { userId: "u2", interviewId: "i3", totalScore: 50 },
  },
});

const fakeLimiter = () => {
  const reset: string[] = [];
  return {
    reset,
    limiter: {
      limit: () => Promise.resolve({ success: true, remaining: 1, reset: 0 }),
      reset: (name: string, identifier: string) => {
        reset.push(`${name}:${identifier}`);
        return Promise.resolve();
      },
    },
  };
};

describe("exportUserData (right of access)", () => {
  it("returns the user document and every owned document, and nobody else's", async () => {
    const { db } = fakeDb(seed());
    const result = await exportUserData("u1", db as never);

    expect(result.user).toEqual({ name: "Ada", email: "ada@example.test" });
    expect(result.collections.interviews?.map((doc) => doc.id).sort()).toEqual(["i1", "i2"]);
    expect(result.collections.feedback?.map((doc) => doc.id)).toEqual(["f1"]);
    expect(JSON.stringify(result)).not.toContain("u2");
    expect(Date.parse(result.exportedAt)).not.toBeNaN();
  });

  it("reports a null user document for an unknown id", async () => {
    const { db } = fakeDb(seed());
    const result = await exportUserData("nobody", db as never);
    expect(result.user).toBeNull();
    expect(result.collections.interviews).toEqual([]);
  });
});

describe("deleteUserAccount (right of erasure)", () => {
  it("deletes owned documents, the user document, and the Auth user — and nothing else", async () => {
    const data = seed();
    const { db } = fakeDb(data);
    const { limiter, reset } = fakeLimiter();
    adminState.deletedUsers = [];

    const summary = await deleteUserAccount("u1", { db: db as never, limiter });

    expect(summary.deleted).toEqual({ interviews: 2, feedback: 1, users: 1 });
    expect(Object.keys(data.interviews)).toEqual(["i3"]);
    expect(Object.keys(data.feedback)).toEqual(["f2"]);
    expect(Object.keys(data.users)).toEqual(["u2"]);
    expect(adminState.deletedUsers).toEqual(["u1"]);
    expect(reset).toContain("account.delete:uid:u1");
    expect(erasure).toHaveBeenCalledWith("u1");
  });

  it("survives a rate-limiter failure: the data is already gone", async () => {
    const data = seed();
    const { db } = fakeDb(data);
    adminState.deletedUsers = [];
    const limiter = {
      limit: () => Promise.resolve({ success: true, remaining: 1, reset: 0 }),
      reset: () => Promise.reject(new Error("redis down")),
    };

    await expect(deleteUserAccount("u1", { db: db as never, limiter })).resolves.toMatchObject({
      deleted: { users: 1 },
    });
    expect(Object.keys(data.users)).toEqual(["u2"]);
  });
});
