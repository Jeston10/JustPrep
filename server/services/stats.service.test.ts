import { describe, expect, it, vi } from "vitest";

vi.mock("@/firebase/admin", () => ({
  getDb: () => {
    throw new Error("tests must pass an explicit db");
  },
}));

const { averageFeedbackScore } = await import("./stats.service");

const dbWith = (docs: Record<string, unknown>[]) => {
  const where = vi.fn(() => ({
    get: () =>
      Promise.resolve({
        docs: docs.map((doc) => ({ get: (field: string) => doc[field] })),
      }),
  }));
  return { db: { collection: () => ({ where }) }, where };
};

describe("averageFeedbackScore (no N+1)", () => {
  it("averages totalScore with a single query", async () => {
    const { db, where } = dbWith([{ totalScore: 80 }, { totalScore: 60 }, { totalScore: 70 }]);
    expect(await averageFeedbackScore("u1", db as never)).toBe(70);
    expect(where).toHaveBeenCalledTimes(1);
    expect(where).toHaveBeenCalledWith("userId", "==", "u1");
  });

  it("returns null when there is no usable score", async () => {
    expect(await averageFeedbackScore("u1", dbWith([]).db as never)).toBeNull();
    const malformed = dbWith([{ totalScore: "80" }, { totalScore: Number.NaN }, {}]);
    expect(await averageFeedbackScore("u1", malformed.db as never)).toBeNull();
  });

  it("ignores malformed scores but keeps valid ones", async () => {
    const { db } = dbWith([{ totalScore: 90 }, { totalScore: null }, { totalScore: 70 }]);
    expect(await averageFeedbackScore("u1", db as never)).toBe(80);
  });
});
