// Application error type shared by server/ and features/ (ARCHITECTURE §3 contracts).
// `message` is safe to show to users; `cause` and `meta` never leave the server.
// P2.1 adds the Result<T, AppError> helpers and the next-safe-action error mapping.

/** @public used by the Result/error-mapping helpers in P2.1 */
export const ERROR_CODES = [
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "VALIDATION",
  "RATE_LIMITED",
  "QUOTA_EXCEEDED",
  "LLM_INVALID_OUTPUT",
  "INTERNAL",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

const DEFAULT_MESSAGES: Record<ErrorCode, string> = {
  UNAUTHENTICATED: "Please sign in to continue.",
  FORBIDDEN: "You do not have access to this resource.",
  NOT_FOUND: "That resource could not be found.",
  VALIDATION: "Some of the provided values are invalid.",
  RATE_LIMITED: "Too many requests. Please wait a moment and try again.",
  QUOTA_EXCEEDED: "You have reached the limit for this feature.",
  LLM_INVALID_OUTPUT: "The AI returned an unusable response. Please try again.",
  INTERNAL: "Something went wrong on our side.",
};

export class AppError extends Error {
  override readonly name = "AppError";

  constructor(
    readonly code: ErrorCode,
    message?: string,
    options?: { cause?: unknown; meta?: Record<string, unknown> },
  ) {
    super(message ?? DEFAULT_MESSAGES[code], { cause: options?.cause });
    this.meta = options?.meta;
  }

  readonly meta: Record<string, unknown> | undefined;
}

export const isAppError = (value: unknown): value is AppError => value instanceof AppError;
