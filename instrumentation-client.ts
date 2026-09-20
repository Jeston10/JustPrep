// Browser instrumentation entry (Next.js runs this before hydration). Name fixed by Next.js.
import * as Sentry from "@sentry/nextjs";

import { initClientObservability } from "@/lib/observability/client";

initClientObservability();

// Lets Sentry attribute client-side errors and slow transitions to App Router navigations.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
