// One call for "something unexpected happened in an operation": structured log (redacted) plus a
// Sentry event tagged with the operation. Use in catch-all branches after known AppErrors have
// been handled; expected failures (bad input, rate limits) are not incidents and stay log-only.

import { opLogger } from "./logger";
import { captureException } from "./sentry";

export const reportFailure = (op: string, error: unknown, message: string): void => {
  opLogger(op).error({ err: error }, message);
  captureException(error, { op });
};
