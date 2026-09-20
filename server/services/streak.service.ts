// Daily-login streak (docs/ARCHITECTURE.md §5 `users.stats.streak`). Pure computation is separated
// from persistence so the date logic is unit-tested without Firestore. Recorded once per day on the
// first authenticated request (called from the (root) layout), never from an unauthenticated route.

import { getDb } from "@/firebase/admin";

export interface StreakState {
  dailyLogins: Record<string, boolean>;
  lastLoginDate: string | undefined;
  loginStreak: number;
}

/** Calendar date (YYYY-MM-DD) for `at` in the given IANA time zone. Defaults to UTC until
 *  user preferences carry a zone (P2.5). */
export const calendarDate = (at: Date, timeZone = "UTC"): string => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(at);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
};

const previousDay = (isoDate: string): string => {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
};

/** Consecutive logged-in days ending at `today` (inclusive). */
export const computeStreak = (dailyLogins: Record<string, boolean>, today: string): number => {
  let streak = 0;
  let cursor = today;
  while (dailyLogins[cursor]) {
    streak += 1;
    cursor = previousDay(cursor);
  }
  return streak;
};

/**
 * Returns the state after recording a login on `today`, or null when today is already recorded
 * (nothing to write). Pure.
 */
export const applyLogin = (state: StreakState, today: string): StreakState | null => {
  if (state.lastLoginDate === today) return null;
  const dailyLogins = { ...state.dailyLogins, [today]: true };
  return { dailyLogins, lastLoginDate: today, loginStreak: computeStreak(dailyLogins, today) };
};

const asRecord = (value: unknown): Record<string, boolean> =>
  typeof value === "object" && value !== null ? (value as Record<string, boolean>) : {};

/** Record today's login for `userId` if not already recorded. Best-effort: never throws. */
export async function recordDailyLogin(
  userId: string,
  options: { timeZone?: string; now?: Date } = {},
): Promise<void> {
  try {
    const ref = getDb().collection("users").doc(userId);
    const snapshot = await ref.get();
    const data = snapshot.data() ?? {};
    const next = applyLogin(
      {
        dailyLogins: asRecord(data.dailyLogins),
        lastLoginDate: typeof data.lastLoginDate === "string" ? data.lastLoginDate : undefined,
        loginStreak: typeof data.loginStreak === "number" ? data.loginStreak : 0,
      },
      calendarDate(options.now ?? new Date(), options.timeZone),
    );
    if (next) await ref.update(next);
  } catch {
    // Streak tracking must never block a page render.
  }
}
