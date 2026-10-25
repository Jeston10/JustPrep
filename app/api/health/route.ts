// GET /api/health — uptime probe (docs/SECURITY.md §2.8, QUALITY §4). Body is `{ ok }` only:
// dependency details stay in the server log so the endpoint reveals nothing about the stack.
// Rate-limited by IP because the probe touches Redis.

import { NextResponse } from "next/server";

import { isAppError } from "@/server/errors";
import { checkHealth } from "@/server/observability/health";
import { clientIpKey } from "@/server/ratelimit/keys";
import { enforceLimit } from "@/server/ratelimit/ratelimit";

export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "no-store" };

export async function GET(): Promise<NextResponse> {
  try {
    await enforceLimit("health", await clientIpKey());
  } catch (error) {
    if (isAppError(error) && error.code === "RATE_LIMITED") {
      return NextResponse.json({ ok: false }, { status: 429, headers: NO_STORE });
    }
    throw error;
  }

  const { ok } = await checkHealth();
  return NextResponse.json({ ok }, { status: ok ? 200 : 503, headers: NO_STORE });
}
