import { NextResponse } from "next/server";

// Stub. The news widget and this route are removed in P3.5 (GUARDRAILS D3); the previous
// implementation served fabricated example.com articles because the API key was never wired.
export function GET() {
  return NextResponse.json({ articles: [] });
}
