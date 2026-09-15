# Tech Stack — free-only, latency-first

Every paid component of the original build is replaced here with a free alternative chosen for (1) no card required, (2) lowest latency, (3) smoothest degradation when a quota runs out. Free-tier limits change; the numbers below are the ones to check at sign-up time and to encode in `config/limits.ts`. If a limit in this table is wrong, fix the table in the same PR that fixes the config.

## 1. Summary of replacements

| Concern | Before (paid / at risk) | Now (free) | Why |
|---|---|---|---|
| Voice interview pipeline | Vapi (per-minute) → Deepgram + OpenAI GPT-4 + ElevenLabs | **Tier 1:** Gemini Live API (native audio-in/audio-out, free tier via ephemeral tokens). **Tier 2:** Browser Web Speech API (STT) + LLM text + browser `speechSynthesis` / Kokoro-js (TTS). **Tier 3:** text mode. | Gemini Live is the lowest-latency free realtime option; browser APIs cost nothing and work offline-ish; text mode always works. |
| LLM (generation + grading) | Gemini 2.0 Flash (old model) via paid key | **Primary:** Gemini Flash-class model on AI Studio free tier. **Fallback:** Groq free tier (fast open-weights models). **Dev:** Ollama local. All via Vercel AI SDK provider abstraction. | Free, fast, and swappable through `config/providers.ts`. |
| Database | Firestore (Spark) | **Keep Firestore Spark** (free quota, no card). | Already integrated; sufficient through M3. ADR-0003. |
| Auth | Firebase Auth email/password | **Keep Firebase Auth** + Google OAuth provider (free). | Free, battle-tested; add OAuth in M4. |
| File storage (photos, resumes, audio) | Firebase Storage (requires Blaze/card for new projects) | **Cloudflare R2** (10 GB free, S3-compatible) or **Supabase Storage** (1 GB free). Behind `ObjectStorage` interface. | Avoids card requirement. ADR-0004. |
| Hosting | Vercel | **Vercel Hobby** (free, non-commercial). | Best Next.js DX; free. |
| Rate limiting | none | **Upstash Redis** free tier + `@upstash/ratelimit`. | Serverless-safe; free tier ample for launch. |
| Error monitoring | none | **Sentry** developer (free) tier. | Free for solo projects. |
| Product analytics + feature flags | none | **PostHog** free tier (events + flags + session replay quota). | One vendor covers three needs. |
| Logs | `console.log` | `pino` → Vercel runtime logs (free) ; optional **Axiom** free tier for retention. | Structured, redactable. |
| Email | none | **Resend** free tier (transactional only). | Simple API, free. |
| News widget | GNews (key mismatch, mock data) | **Remove** the widget (filler). If kept: GNews free 100 req/day, cached with ISR 1 h. | Not core; see DESIGN_SYSTEM §7. |
| Jobs widget | Remotive (client-side fetch each load) | **Remove** or move server-side with ISR 6 h. | Same. |
| Code execution (M3) | — | **Piston** public API (free, rate-limited) via server adapter. | Free sandboxed runner. |
| Whiteboard (M3) | — | **tldraw** (free with watermark licence) or **Excalidraw** (MIT). | Both free. |
| Resume parsing | `pdfjs-dist` unused | `unpdf` (serverless-friendly pdf.js wrapper) for text extraction. | Free, tiny. |
| Search (question bank, M3) | — | `minisearch` client-side over paginated JSON; Firestore prefix queries. Upgrade to self-hosted Meilisearch only if needed. | Free. |
| Cron | — | **GitHub Actions** `schedule:` hitting a signed `/api/cron/*` route (Vercel Hobby cron is limited to daily). | Free, flexible. |
| Payments | Stripe | **Out of scope** while free-only. Quotas are enforced; no paid tier. Revisit with an ADR. | Constraint. |
| Git hooks | Husky | **lefthook** (what GitLab uses; single binary, parallel). | Faster, simpler. |
| Package manager | npm | **pnpm** (strict, fast, disk-efficient). | Standard for modern Next repos. |

## 2. Voice architecture (the important one)

```
                      ┌──────────────────────────────────────────────────────┐
  Browser             │ VoiceSession (client)                                 │
                      │  - mic capture (AudioWorklet), VAD, barge-in           │
                      │  - captions from partial transcripts                   │
                      │  - provider chosen by /api/voice/session response      │
                      └───────────┬──────────────────────┬────────────────────┘
                                  │ Tier 1               │ Tier 2
                      ┌───────────▼───────────┐  ┌───────▼─────────────────────┐
                      │ Gemini Live API        │  │ Web Speech API (STT)        │
                      │ (WebSocket, ephemeral  │  │  → POST /api/interview/turn │
                      │  token minted server-  │  │  → LLM text (streamed)      │
                      │  side, quota-checked)  │  │  → speechSynthesis / Kokoro │
                      └────────────────────────┘  └─────────────────────────────┘
                                  │ quota exhausted / unsupported browser
                                  ▼
                      Tier 3: Text mode (chat UI, streamed) — always available
```

Rules:
- The server decides the tier (`server/voice/selectTier.ts`) from: remaining quota, browser capabilities reported by the client, user preference. The client never holds long-lived provider keys.
- Transcript is the canonical artefact for all tiers, so feedback grading is identical regardless of tier.
- Tier 2 TTS: default to `speechSynthesis` (instant, zero download). Offer "HD voice" (Kokoro-js, WebGPU/WASM, ~80 MB one-time download) as an opt-in that is cached in the browser.
- Firefox lacks `SpeechRecognition`: Tier 2 STT falls back to `@huggingface/transformers` Whisper-tiny in a worker, or straight to Tier 3.

## 3. LLM routing

| Task | Model class | Provider order | Notes |
|---|---|---|---|
| Question generation | Flash-class | Gemini → Groq | Structured output (zod). Cache by (role, level, stack, company, type) hash for 24 h to save quota. |
| Live interview turns | Flash-class, streaming | Gemini → Groq | Short system prompt; sliding context window of the transcript. |
| Feedback grading | Strongest available on free tier | Gemini (Pro-class if quota allows, else Flash) → Groq large model | Structured output; prompt versioned in `server/llm/prompts/feedback.vN.ts`; evaluated against `tests/evals/feedback/`. |
| Resume/JD extraction | Flash-class | Gemini → Groq | Structured output to `ResumeProfile` schema. |
| Assistant chat | Flash-class, streaming | Gemini → Groq | Grounded on the user's own data via tool calls. |

All routing is data in `config/providers.ts`; adapters implement `LLMProvider` in `server/llm/providers/`. Usage (tokens, latency, provider, model, promptVersion) is logged per call.

## 4. Approved client libraries

| Purpose | Library | Notes |
|---|---|---|
| UI primitives | `shadcn/ui` (Radix) + selected **21st.dev** registry components | Adapted to our tokens; see `docs/COMPONENT_LIBRARY.md`. |
| Motion | `motion` (Framer Motion, `motion/react`) | Layout animations, presence, number transitions. |
| Icons | `lucide-react` | Single icon set; no `react-icons`. |
| Forms | `react-hook-form` + `zod` + `@hookform/resolvers` | Shared schemas with server. |
| Server actions | `next-safe-action` | Typed, validated, middleware for auth + rate limit. |
| Env | `@t3-oss/env-nextjs` | Validated env; the only `process.env` consumer. |
| URL state | `nuqs` | Pagination, filters, tabs. |
| Charts | `recharts` (keep) | Themed via tokens; see `docs/DESIGN_SYSTEM.md` §6. |
| Numbers | `@number-flow/react` | Animated score changes. |
| Toasts | `sonner` (keep) | Edged theme. |
| Dates | `date-fns` | Tree-shakeable; replaces `dayjs`. |
| Command palette | `cmdk` | Global search / actions. |
| Drawers (mobile) | `vaul` | Bottom sheets. |
| Code editor (M3) | `@monaco-editor/react` | Lazy-loaded. |
| PDF text | `unpdf` | Server-side. |
| Client STT fallback | `@huggingface/transformers` | Worker + WASM. |
| Client TTS HD | `kokoro-js` | Opt-in. |

Removed: `@vapi-ai/web`, `react-icons`, `dayjs`, `pdfjs-dist`, `@types/pdfjs-dist`, `next-themes` (unless we ship a light theme), `tailwindcss-animate` (Tailwind v4 + `tw-animate-css` suffice).

## 5. Approved server / tooling libraries

`firebase-admin`, `ai` (Vercel AI SDK) + `@ai-sdk/google` + `@ai-sdk/groq`, `@upstash/redis` + `@upstash/ratelimit`, `pino` + `pino-pretty` (dev), `@sentry/nextjs`, `posthog-js` + `posthog-node`, `resend`, `@aws-sdk/client-s3` (R2), `zod`, `vitest` + `@testing-library/react` + `@testing-library/jest-dom`, `@playwright/test`, `eslint` (flat config) + `@typescript-eslint` + `eslint-plugin-jsx-a11y` + `eslint-plugin-import` + `prettier` + `prettier-plugin-tailwindcss`, `lefthook`, `@commitlint/cli` + `@commitlint/config-conventional`, `firebase-tools` (emulators), `knip` (dead code), `size-limit`.

## 6. Quota guards (encode in `config/limits.ts`)

| Resource | Guard |
|---|---|
| LLM calls | Per-user daily cap by task type; global daily cap tracked in Redis; provider fallback on 429. |
| Gemini Live sessions | Per-user minutes/day; global concurrent-session cap; auto-downgrade to Tier 2. |
| Uploads | 5 MB per file, 3 resumes per user, 1 avatar (re-encoded to WebP ≤ 256 px). |
| Storage | Audio recordings opt-in, 30-day retention, cron cleanup. |
| Email | Only auth + weekly digest (opt-in). |
| Firestore | Denormalised stats on write; cursor pagination; no unbounded reads; composite indexes committed. |

## 7. Adding a vendor

1. Confirm: free tier without card, ToS allows our use, data-processing terms acceptable.
2. Write ADR (`docs/decisions/NNNN-*.md`) with limits and exit strategy.
3. Implement behind an interface in `server/`, with usage logging and a quota guard.
4. Add to this document.
