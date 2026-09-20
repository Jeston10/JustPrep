import { z } from "zod";

import { FirestoreIdSchema, TranscriptSchema } from "@/server/db/types";

export const CreateFeedbackSchema = z.object({
  interviewId: FirestoreIdSchema,
  transcript: TranscriptSchema,
});
