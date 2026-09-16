// Structured logger (docs/SECURITY.md §2.11). The only sanctioned way to log on the server.
// Redaction is by key path, so a stray cookie, token, email, or transcript logged inside any
// object is masked before it reaches stdout. Never log a raw request body.

import pino, { type Logger, type LoggerOptions } from "pino";

import { env } from "@/config/env";

/** Key paths that are always redacted, wherever they appear in a logged object. */
export const REDACTED_PATHS = [
  "req.headers.cookie",
  "req.headers.authorization",
  "*.cookie",
  "*.cookies",
  "*.sessionCookie",
  "*.idToken",
  "*.token",
  "*.accessToken",
  "*.refreshToken",
  "*.apiKey",
  "*.privateKey",
  "*.password",
  "*.email",
  "*.transcript",
  "*.resumeText",
  "*.authorization",
] as const;

export const buildLoggerOptions = (level: string): LoggerOptions => ({
  level,
  redact: { paths: [...REDACTED_PATHS], censor: "[redacted]" },
  base: null, // no pid/hostname noise
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
});

const isDev = env.NODE_ENV === "development";

export const logger: Logger = pino({
  ...buildLoggerOptions(isDev ? "debug" : "info"),
  ...(isDev ? { transport: { target: "pino-pretty", options: { colorize: true } } } : {}),
});

/**
 * Child logger carrying a stable operation name; add per-call fields at the call site.
 * @public consumed by services from P1.4
 */
export const opLogger = (op: string, fields: Record<string, unknown> = {}): Logger =>
  logger.child({ op, ...fields });
