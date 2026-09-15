import Vapi from "@vapi-ai/web";

// Public web token; validated centrally in config/env.ts from P0.3 onward. Removed in P4.6 (RISKS R12).
const webToken = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN ?? "";

export const vapi = new Vapi(webToken);
