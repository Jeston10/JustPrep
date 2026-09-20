import { describe, expect, it } from "vitest";

import { applyLogin, calendarDate, computeStreak } from "./streak.service";

describe("calendarDate", () => {
  const at = new Date("2026-09-20T23:30:00Z");
  it("uses UTC by default", () => {
    expect(calendarDate(at)).toBe("2026-09-20");
  });
  it("respects the user's time zone across the date line", () => {
    expect(calendarDate(at, "Asia/Kolkata")).toBe("2026-09-21");
    expect(calendarDate(at, "America/Los_Angeles")).toBe("2026-09-20");
  });
});

describe("computeStreak", () => {
  it("counts consecutive days ending today", () => {
    const logins = { "2026-09-18": true, "2026-09-19": true, "2026-09-20": true };
    expect(computeStreak(logins, "2026-09-20")).toBe(3);
  });
  it("breaks on a gap", () => {
    const logins = { "2026-09-17": true, "2026-09-19": true, "2026-09-20": true };
    expect(computeStreak(logins, "2026-09-20")).toBe(2);
  });
  it("is zero when today is not logged", () => {
    expect(computeStreak({ "2026-09-19": true }, "2026-09-20")).toBe(0);
  });
  it("handles month boundaries", () => {
    const logins = { "2026-08-31": true, "2026-09-01": true };
    expect(computeStreak(logins, "2026-09-01")).toBe(2);
  });
});

describe("applyLogin", () => {
  it("returns null when today is already recorded (no write)", () => {
    const state = {
      dailyLogins: { "2026-09-20": true },
      lastLoginDate: "2026-09-20",
      loginStreak: 1,
    };
    expect(applyLogin(state, "2026-09-20")).toBeNull();
  });
  it("records a new day and recomputes the streak without mutating input", () => {
    const state = {
      dailyLogins: { "2026-09-19": true },
      lastLoginDate: "2026-09-19",
      loginStreak: 1,
    };
    const next = applyLogin(state, "2026-09-20");
    expect(next).toEqual({
      dailyLogins: { "2026-09-19": true, "2026-09-20": true },
      lastLoginDate: "2026-09-20",
      loginStreak: 2,
    });
    expect(state.dailyLogins).toEqual({ "2026-09-19": true });
  });
});
