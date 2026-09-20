// Vapi workflow webhook (legacy; removed with Vapi in P4.6 — RISKS R12).
// Called server-to-server by Vapi's hosted workflow, so there is no browser session. Access is
// gated by a shared secret sent as `x-vapi-secret` (configure the same value in the Vapi API
// Request node). Without VAPI_WEBHOOK_SECRET configured the route is disabled (SECURITY §2.10).

import { timingSafeEqual } from "node:crypto";

import { createGoogle } from "@ai-sdk/google";
import { generateText } from "ai";
import { z } from "zod";

import { env } from "@/config/env";
import { GEMINI_FLASH_MODEL } from "@/config/llm";

import { opLogger } from "@/server/observability/logger";

import { getDb } from "@/firebase/admin";

import { getRandomInterviewCover } from "@/lib/utils";

const google = createGoogle({ apiKey: env.GEMINI_API_KEY });

const GenerateBodySchema = z.object({
  type: z.string().trim().min(1).max(40),
  role: z.string().trim().min(1).max(80),
  level: z.string().trim().min(1).max(40),
  techstack: z.string().trim().min(1).max(300),
  amount: z.coerce.number().int().min(1).max(15).default(5),
  userid: z.string().regex(/^[A-Za-z0-9_-]{1,128}$/),
});

const secretMatches = (provided: string | null, expected: string): boolean => {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
};

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

export async function POST(request: Request) {
  const log = opLogger("vapi.generate");
  const secret = env.VAPI_WEBHOOK_SECRET;
  if (!secret) return Response.json({ success: false }, { status: 503 });
  if (!secretMatches(request.headers.get("x-vapi-secret"), secret)) {
    return Response.json({ success: false }, { status: 401 });
  }

  const parsed = GenerateBodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ success: false }, { status: 400 });
  const { type, role, level, techstack, amount, userid } = parsed.data;

  const db = getDb();
  if (!(await db.collection("users").doc(userid).get()).exists) {
    return Response.json({ success: false }, { status: 404 });
  }

  try {
    const { text } = await generateText({
      model: google(GEMINI_FLASH_MODEL),
      prompt: `Prepare questions for a job interview.
        The job role is ${role}.
        The job experience level is ${level}.
        The tech stack used in the job is: ${techstack}.
        The focus between behavioural and technical questions should lean towards: ${type}.
        The amount of questions required is: ${amount}.
        Please return only the questions, without any additional text.
        The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
        Return the questions formatted like this:
        ["Question 1", "Question 2", "Question 3"]`,
    });

    const questions: unknown = JSON.parse(text);
    if (!isStringArray(questions)) return Response.json({ success: false }, { status: 502 });

    await db.collection("interviews").add({
      role,
      type,
      level,
      techstack: techstack.split(",").map((item) => item.trim()),
      questions,
      userId: userid,
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    });

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    log.error({ err: error }, "interview generation failed");
    return Response.json({ success: false }, { status: 500 });
  }
}
