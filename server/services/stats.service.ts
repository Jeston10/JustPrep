// Aggregate reads for the profile screen. One query per statistic — never a query per interview
// (the N+1 the profile page used to do). Temporary home: in P2.5 these numbers are denormalised
// onto `users.stats` on write and this module disappears (MILESTONES P2.5).

import { getDb } from "@/firebase/admin";

import type { Firestore } from "firebase-admin/firestore";

/**
 * Mean `totalScore` across the user's feedback, or null when they have none yet.
 * Reads the feedback collection once; the `userId` index already exists.
 */
export async function averageFeedbackScore(
  userId: string,
  db: Firestore = getDb(),
): Promise<number | null> {
  const snapshot = await db.collection("feedback").where("userId", "==", userId).get();

  let total = 0;
  let count = 0;
  for (const doc of snapshot.docs) {
    const score: unknown = doc.get("totalScore");
    if (typeof score === "number" && Number.isFinite(score)) {
      total += score;
      count += 1;
    }
  }
  return count === 0 ? null : total / count;
}
