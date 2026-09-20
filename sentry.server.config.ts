// Node runtime Sentry entry (loaded by instrumentation.ts). Options live in the adapter.
import { initSentry } from "@/server/observability/sentry";

initSentry();
