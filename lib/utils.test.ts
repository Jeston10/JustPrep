import { describe, expect, it } from "vitest";

import { interviewCovers } from "@/constants";

import { cn, getRandomInterviewCover } from "./utils";

describe("cn", () => {
  it("merges conditional classes and resolves Tailwind conflicts", () => {
    const isHidden: boolean = [].length > 0;
    expect(cn("p-2", isHidden && "hidden", "p-4")).toBe("p-4");
    expect(cn("text-sm", undefined, ["font-bold", null])).toBe("text-sm font-bold");
  });
});

describe("getRandomInterviewCover", () => {
  it("returns a path under /covers from the configured list", () => {
    const cover = getRandomInterviewCover();
    expect(cover.startsWith("/covers/")).toBe(true);
    expect(interviewCovers.map((c) => `/covers${c}`)).toContain(cover);
  });
});
