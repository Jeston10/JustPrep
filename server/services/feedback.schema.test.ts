import { zodSchema } from "ai";
import { describe, expect, it } from "vitest";

import { FEEDBACK_CATEGORIES, feedbackSchema } from "@/constants";

// Regression guard: Google's structured-output API rejects JSON Schema tuples (`items` as an
// array). The schema must compile to plain object/array shapes.
describe("feedbackSchema JSON Schema compatibility", () => {
  it("compiles categoryScores to an array with an object `items`", () => {
    const json = zodSchema(feedbackSchema).jsonSchema as {
      properties: { categoryScores: { type: string; items: unknown; minItems?: number } };
    };
    const categoryScores = json.properties.categoryScores;
    expect(categoryScores.type).toBe("array");
    expect(Array.isArray(categoryScores.items)).toBe(false);
    expect(typeof categoryScores.items).toBe("object");
    expect(categoryScores.minItems).toBe(FEEDBACK_CATEGORIES.length);
  });

  it("accepts a well-formed model response and rejects unknown categories", () => {
    const valid = {
      totalScore: 72,
      categoryScores: FEEDBACK_CATEGORIES.map((name) => ({ name, score: 70, comment: "ok" })),
      strengths: ["clear"],
      areasForImprovement: ["depth"],
      finalAssessment: "Solid.",
    };
    expect(feedbackSchema.safeParse(valid).success).toBe(true);
    expect(
      feedbackSchema.safeParse({
        ...valid,
        categoryScores: [{ name: "Vibes", score: 1, comment: "" }],
      }).success,
    ).toBe(false);
  });
});
