// Identifiers for rate-limit keys. IPs come from the platform's forwarding headers; the value is
// hashed before it becomes a Redis key so raw addresses are not stored (SECURITY §2.11).

import { createHash } from "node:crypto";

import { headers } from "next/headers";

export const hashIdentifier = (value: string): string =>
  createHash("sha256").update(value).digest("base64url").slice(0, 32);

/** Best-effort client IP from proxy headers; "unknown" groups requests that carry none. */
export async function clientIpKey(): Promise<string> {
  const h = await headers();
  const candidates = [h.get("x-forwarded-for")?.split(",")[0], h.get("x-real-ip")];
  const ip =
    candidates.map((value) => value?.trim() ?? "").find((value) => value !== "") ?? "unknown";
  return `ip:${hashIdentifier(ip)}`;
}

export const uidKey = (uid: string): string => `uid:${uid}`;
