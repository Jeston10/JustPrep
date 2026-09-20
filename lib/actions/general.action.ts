"use server";

import { getDb } from "@/firebase/admin";

export async function getInterviewById(id: string): Promise<Interview | null> {
  const interview = await getDb().collection("interviews").doc(id).get();

  return interview.data() as Interview | null;
}

export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams,
): Promise<Feedback | null> {
  const { interviewId, userId } = params;

  const querySnapshot = await getDb()
    .collection("feedback")
    .where("interviewId", "==", interviewId)
    .where("userId", "==", userId)
    .limit(1)
    .get();

  const feedbackDoc = querySnapshot.docs[0];
  if (!feedbackDoc) return null;

  return { id: feedbackDoc.id, ...feedbackDoc.data() } as Feedback;
}

export async function getLatestInterviews(
  params: GetLatestInterviewsParams,
): Promise<Interview[] | null> {
  const { userId, limit = 20 } = params;

  const interviews = await getDb()
    .collection("interviews")
    .orderBy("createdAt", "desc")
    .where("finalized", "==", true)
    .where("userId", "!=", userId)
    .limit(limit)
    .get();

  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}

export async function getInterviewsByUserId(userId: string): Promise<Interview[] | null> {
  const interviews = await getDb()
    .collection("interviews")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .get();

  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}

// Get feedback for the user for the past 5 days (for analytics graph)
export async function getUserFeedbackForPast5Days(userId: string) {
  const now = new Date();
  const fiveDaysAgo = new Date(now);
  fiveDaysAgo.setDate(now.getDate() - 4); // includes today

  const feedbacks = await getDb()
    .collection("feedback")
    .where("userId", "==", userId)
    .where("createdAt", ">=", fiveDaysAgo.toISOString())
    .orderBy("createdAt", "asc")
    .get();

  return feedbacks.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Feedback[];
}
