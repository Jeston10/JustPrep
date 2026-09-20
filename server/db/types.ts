// Domain types shared across server/ and features/ (ARCHITECTURE §2). Zod schemas double as the
// runtime validators at the action boundary; features compose them, never the other way round.

import { z } from "zod";

export const FirestoreIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/, "Invalid id");

// Transcript bounds (SECURITY §2.3): a 60-minute interview is well under these.
export const TRANSCRIPT_MAX_TURNS = 500;
export const TURN_MAX_CHARS = 4_000;

export const TranscriptTurnSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().trim().min(1).max(TURN_MAX_CHARS),
});
export type TranscriptTurn = z.infer<typeof TranscriptTurnSchema>;

export const TranscriptSchema = z.array(TranscriptTurnSchema).min(1).max(TRANSCRIPT_MAX_TURNS);
