import Vapi from "@vapi-ai/web";

import { env } from "@/config/env";

// Legacy voice pipeline; removed in P4.6 (RISKS R12).
export const vapi = new Vapi(env.NEXT_PUBLIC_VAPI_WEB_TOKEN);
