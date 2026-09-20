"use server";

import { requireUser } from "@/server/auth/session";
import { isAppError } from "@/server/errors";
import { captureServerEvent } from "@/server/observability/analytics";
import { reportFailure } from "@/server/observability/report";
import { uidKey } from "@/server/ratelimit/keys";
import { enforceLimit } from "@/server/ratelimit/ratelimit";
import { generateAndStoreFeedback } from "@/server/services/feedback.service";

import { CreateFeedbackSchema } from "./schema";

export type CreateFeedbackResult =
  { success: true; feedbackId: string } | { success: false; message: string };

export async function createFeedback(input: unknown): Promise<CreateFeedbackResult> {
  try {
    const user = await requireUser();
    const parsed = CreateFeedbackSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: "Invalid transcript." };
    await enforceLimit("feedback.create", uidKey(user.id));

    const { feedbackId } = await generateAndStoreFeedback({
      interviewId: parsed.data.interviewId,
      userId: user.id,
      transcript: parsed.data.transcript,
    });
    captureServerEvent("feedback.created", user.id, { turns: parsed.data.transcript.length });
    return { success: true, feedbackId };
  } catch (error) {
    if (isAppError(error)) return { success: false, message: error.message };
    reportFailure("feedback.create", error, "feedback generation failed");
    return { success: false, message: "Could not generate feedback. Please try again." };
  }
}
