// Read paths for interviews and their feedback (ARCHITECTURE §4; P2.2 moves the queries behind
// repositories and P2.4 gives this module its services shape).
//
// These functions used to live in `lib/actions/general.action.ts` under a file-level
// `"use server"`, which turned every one of them into a callable server action: no session, no
// zod, and the owner id taken from the caller's own argument. Nothing here is an action any
// more — they are plain server-side reads, called by server components that have already
// resolved the session. `server-only` makes the boundary a build error rather than a convention.

import "server-only";

import { getDb } from "@/firebase/admin";

import type { Firestore } from "firebase-admin/firestore";

/** Interviews are a shared pool: the dashboard offers other people's finalized ones to take. */
export async function getInterviewById(
  id: string,
  db: Firestore = getDb(),
): Promise<Interview | null> {
  const interview = await db.collection("interviews").doc(id).get();
  if (!interview.exists) return null;

  return { id: interview.id, ...interview.data() } as Interview;
}

/**
 * Feedback is private. `userId` is the viewer's own uid, resolved from the session by the caller,
 * and it is part of the query — a viewer never sees another person's feedback for an interview
 * they both took.
 */
export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams,
  db: Firestore = getDb(),
): Promise<Feedback | null> {
  const { interviewId, userId } = params;

  const querySnapshot = await db
    .collection("feedback")
    .where("interviewId", "==", interviewId)
    .where("userId", "==", userId)
    .limit(1)
    .get();

  const feedbackDoc = querySnapshot.docs[0];
  if (!feedbackDoc) return null;

  return { id: feedbackDoc.id, ...feedbackDoc.data() } as Feedback;
}

/** The take-someone-else's-interview feed: finalized interviews that are not the viewer's own. */
export async function getLatestInterviews(
  params: GetLatestInterviewsParams,
  db: Firestore = getDb(),
): Promise<Interview[]> {
  const { userId, limit = 20 } = params;

  const interviews = await db
    .collection("interviews")
    .orderBy("createdAt", "desc")
    .where("finalized", "==", true)
    .where("userId", "!=", userId)
    .limit(limit)
    .get();

  return interviews.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Interview[];
}

/** The viewer's own interviews, newest first. */
export async function getInterviewsByUserId(
  userId: string,
  db: Firestore = getDb(),
): Promise<Interview[]> {
  const interviews = await db
    .collection("interviews")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .get();

  return interviews.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Interview[];
}

/** Feedback from the last five calendar days (today included) for the dashboard trend. */
export async function getUserFeedbackForPast5Days(
  userId: string,
  db: Firestore = getDb(),
): Promise<Feedback[]> {
  const now = new Date();
  const fiveDaysAgo = new Date(now);
  fiveDaysAgo.setDate(now.getDate() - 4);

  const feedbacks = await db
    .collection("feedback")
    .where("userId", "==", userId)
    .where("createdAt", ">=", fiveDaysAgo.toISOString())
    .orderBy("createdAt", "asc")
    .get();

  return feedbacks.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Feedback[];
}
