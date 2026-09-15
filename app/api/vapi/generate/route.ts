import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

import { env } from "@/config/env";

import { db } from "@/firebase/admin";

import { getRandomInterviewCover } from "@/lib/utils";

// Provider factory moves to server/llm in P2.3.
const google = createGoogleGenerativeAI({ apiKey: env.GEMINI_API_KEY });

export function GET() {
  return Response.json({ success: true, data: "Thank You!" }, { status: 200 });
}

// Minimal shape check until P1.4 replaces this with zod validation + session auth (RISKS R2).
interface GenerateBody {
  type: string;
  role: string;
  level: string;
  techstack: string;
  amount?: unknown;
  userid: string;
}

const isGenerateBody = (value: unknown): value is GenerateBody =>
  typeof value === "object" &&
  value !== null &&
  ["type", "role", "level", "techstack", "userid"].every(
    (key) => typeof (value as Record<string, unknown>)[key] === "string",
  );

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

export async function POST(request: Request) {
  const body: unknown = await request.json();
  if (!isGenerateBody(body)) {
    return Response.json({ success: false }, { status: 400 });
  }
  const { type, role, level, techstack, userid } = body;
  const amount =
    typeof body.amount === "number" || typeof body.amount === "string" ? body.amount : 5;

  try {
    const { text: questionsText } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: `Prepare questions for a job interview.
        The job role is ${role}.
        The job experience level is ${level}.
        The tech stack used in the job is: ${techstack}.
        The focus between behavioural and technical questions should lean towards: ${type}.
        The amount of questions required is: ${amount}.
        Please return only the questions, without any additional text.
        The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
        Return the questions formatted like this:
        ["Question 1", "Question 2", "Question 3"]
        
        Thank you! <3
    `,
    });

    const questions: unknown = JSON.parse(questionsText);
    if (!isStringArray(questions)) {
      return Response.json({ success: false }, { status: 502 });
    }

    const interview = {
      role,
      type,
      level,
      techstack: techstack.split(","),
      questions,
      userId: userid,
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    };

    await db.collection("interviews").add(interview);

    return Response.json({ success: true }, { status: 200 });
  } catch {
    return Response.json({ success: false }, { status: 500 });
  }
}
