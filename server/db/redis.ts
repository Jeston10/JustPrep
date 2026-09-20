// Upstash Redis singleton (rate limiting now; quotas and caches in P2). Null when unconfigured so
// callers choose their own fallback; production requires it (config/env.ts cross-field check).

import { Redis } from "@upstash/redis";

import { env } from "@/config/env";

let instance: Redis | null | undefined;

export const getRedis = (): Redis | null => {
  if (instance !== undefined) return instance;
  instance =
    env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
      ? new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN })
      : null;
  return instance;
};
