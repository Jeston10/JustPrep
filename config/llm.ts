// Model ids in one place. Google retires Gemini ids without notice (gemini-2.0-flash-001 was
// rejected on 2026-09-20 with a pointer to gemini-3.6-flash), so nothing hard-codes a model.
// P2.3 replaces this with config/providers.ts (per-task routing + Groq fallback) and a contract
// test that fails when a configured model stops being served.
//
// Newer Flash models spend output tokens on reasoning before the answer: do not set a small
// maxOutputTokens on structured-output calls or the JSON gets truncated.

export const GEMINI_FLASH_MODEL = "gemini-3.6-flash";
