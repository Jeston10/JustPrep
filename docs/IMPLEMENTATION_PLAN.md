# Implementation Plan — step by step

Supersedes the milestone list in `docs/ANALYSIS_AND_ROADMAP.md` §6 for sequencing. The file-level breakdown of each phase into PRs — with the legacy → target migration map, procedures, verification, and exit criteria — is in `docs/MILESTONES.md`; use that as the working checklist. Constraints: free-only stack (`docs/TECH_STACK.md`), full UI revamp (`docs/DESIGN_SYSTEM.md`), security-first (`docs/SECURITY.md`). Each phase ends with a tagged release and a green CI. Work top-down; do not start a phase until the previous phase's exit criteria are met.

Legend: **[S]** security · **[UI]** design/responsive · **[T]** tests · **[D]** docs/ADR

---

## Phase 0 — Toolchain and repo hygiene (1–2 days)

Goal: a clean, enforced baseline before any feature work.

1. Switch to `pnpm`; add `.nvmrc`, `engines`, `packageManager` field. Remove `package-lock.json`.
2. Add `lefthook.yml` (pre-commit: lint-staged prettier + eslint + gitleaks; commit-msg: commitlint; pre-push: typecheck + unit tests).
3. ESLint flat config per `docs/CODING_STANDARDS.md` §1 (strict TS, a11y, import order, layer restrictions). Prettier + Tailwind plugin.
4. `tsconfig` strict flags; remove `ignoreBuildErrors` / `ignoreDuringBuilds` from `next.config.ts`. Fix the six existing TS errors.
5. `.env.example` with every variable; `config/env.ts` via `@t3-oss/env-nextjs`; replace all `process.env` usages.
6. `.github/workflows/ci.yml`: install → lint → typecheck → test → build → audit → gitleaks. Branch protection on `main`.
7. Remove dead deps (`@vapi-ai/web` stays until Phase 4 step 6 removes it; remove `pdfjs-dist`, `@types/pdfjs-dist`, `tailwindcss-animate` now; `react-icons` and `dayjs` go in Phase 3 as their usages are migrated). Run `knip`.
8. Upgrade: Next (latest stable major), React, AI SDK + `@ai-sdk/google`, zod 4, firebase, firebase-admin. Resolve `pnpm audit` to zero high/critical. **[D]** ADR-0002 (free-only), ADR-0003 (keep Firebase).
9. Replace README with the real one (already drafted); ensure `AGENTS.md`, `CONTRIBUTING.md`, `PROCESS.md`, `SECURITY.md` are in place.

Exit: CI green on `main`, `pnpm build` clean, audit clean.

## Phase 1 — Security hardening of the existing app (2–3 days) **[S]**

Do this on the current UI; the revamp comes after the foundation is safe.

1. `server/auth/session.ts`: `React.cache`d `getCurrentUser`, `requireUser`, `__Host-` cookie in prod, `checkRevoked` only on sensitive ops; sign-out revokes refresh tokens.
2. Remove every `console.log`; add `server/observability/logger.ts` (pino + redaction).
3. `proxy.ts`: cookie-presence gate for `(app)` routes + CSP nonce + security headers (or headers in `next.config.ts`).
4. `firebase/firestore.rules` deny-all; `firestore.indexes.json` for every query; `firebase.json` emulators; `pnpm dev` runs against emulators with seed data.
5. Protect and validate: `/api/vapi/generate` (auth + zod, until removed), `createFeedback` (derive `userId` from session, ownership check), daily-login routes (delete; derive from session in layout), profile update (fix `await cookies()`, zod, move to action).
6. `server/ratelimit` (Upstash) + `config/limits.ts`; apply to auth, generate, feedback, profile.
7. Sentry + PostHog wired with PII settings from `docs/SECURITY.md` §2.11.
8. Account deletion action (re-auth, delete Auth + Firestore + storage + analytics request). Data export action.
9. **[T]** Tests: unauthenticated and wrong-owner cases for each action; header test; rules test on emulator.

Exit: `docs/SECURITY.md` §3 checklist passes for every server entry point; no anonymous endpoints beyond §4.

## Phase 2 — Architecture restructure and data model v2 (3–4 days)

1. Create `server/`, `features/`, `config/`, `components/{ui,layout,charts}`, `hooks/`, `tests/` per `docs/ARCHITECTURE.md` §2. Move code; keep behaviour.
2. `server/errors.ts` (`AppError`, `Result`), `next-safe-action` client with auth + rate-limit middleware.
3. Repositories with converters for `users`, `interviews`, `attempts`, `feedback`, `usage`. Migration script (one-off, `scripts/migrate-v1-to-v2.ts`) that: creates an `attempt` for each existing `feedback`, moves `dailyLogins` into `users/{uid}/logins`, sets `visibility: private`, computes `users.stats`.
4. `server/llm`: `LLMProvider` interface, Gemini + Groq + Ollama adapters, router with fallback + usage logging, prompt registry with versions, contract tests.
5. `server/services`: interview, attempt, feedback, quota. Actions become thin.
6. `server/storage`: `ObjectStorage` interface + R2 adapter (or Supabase). **[D]** ADR-0004.
7. **[T]** Repository integration tests; service unit tests with fakes; eval harness scaffold.

Exit: existing features work through the new layers; no feature imports a vendor SDK.

## Phase 3 — UI revamp: design system and shell (4–5 days) **[UI]**

1. Tokens in `styles/globals.css` (`docs/DESIGN_SYSTEM.md` §3); `--radius: 0`; fonts via `next/font` (Instrument Serif/Fraunces, Geist Sans, Geist Mono).
2. Import primitives from shadcn; adapt per `docs/COMPONENT_LIBRARY.md` §2. Internal `/dev/ui` gallery route.
3. Pull layout composites from 21st.dev (sidebar/app shell, page header, stats, data table, empty state, upload zone); adapt. **[D]** note sources in file headers.
4. `components/layout/AppShell` with sidebar (`lg+`) and bottom tabs (`< lg`); `PageHeader`; `EmptyState`/`ErrorState`; skeletons.
5. Motion helpers; reduced-motion support.
6. Remove filler widgets (quotes, clock, news, jobs, streak star, keyword chatbot). Streak becomes a number on the dashboard stat row.
7. Marketing route group: landing, how-it-works, free plan page — real copy per §7/§8 of the design doc; `robots.ts`, `sitemap.ts`, OG image route.
8. Auth pages rebuilt on the new primitives; password rules; email verification step.
9. **[T]** Responsive Playwright spec with overflow assertion at 375/768/1280; axe scan.

Exit: every existing screen rebuilt on the new system; anti-AI-look checklist passes; device matrix pass recorded.

## Phase 4 — Core product v2: interviews, attempts, text mode (5–7 days)

1. `features/interview`: multi-step `InterviewForm` (role/level → type/stack → company/source → review); `createInterview` with cached structured generation; list with `nuqs` filters and cursor pagination; visibility toggle.
2. `features/attempt`: `startAttempt`, `appendTurn` (idempotent), `completeAttempt` (computes metrics from transcript: WPM, filler rate, talk ratio, response latency).
3. **Text mode** (`TextSession`): streamed interviewer turns via AI SDK, question stepper, timer, end/abandon, resume on reload (attempt state from server).
4. `features/feedback`: `feedback.v2` prompt with per-question scoring, evidence spans, model answers, next steps; `OverallScore` (number-flow), `CategoryBars`, `PerQuestionAccordion`, `AnnotatedTranscript`, `Trend` across attempts.
5. Dashboard: stats row (attempts, avg, best, streak), score trend, recent attempts, "next drill" panel driven by weakest category.
6. Remove Vapi entirely (`@vapi-ai/web`, workflow env, `/api/vapi/generate`). **[D]** ADR-0005 (voice pipeline).
7. **[T]** E2E: sign-up → create → text attempt → feedback. Evals: 10 transcripts with expected ranges.

Exit: a user can do the full loop without a microphone; retakes create new attempts; history visible.

## Phase 5 — Voice v2 (free tiers) (5–7 days)

1. `server/voice/selectTier.ts` + `/api/voice/session` (quota check, ephemeral Gemini Live token). **[S]** rate limit + concurrency cap.
2. `VoiceSession` client: AudioWorklet capture, level meter, barge-in, captions from partial transcripts, wake lock, permission prompt UI, mobile landscape layout.
3. Tier 1: Gemini Live WebSocket client; transcript events → `appendTurn`.
4. Tier 2: `useSpeechRecognition` (Web Speech API) + `useSpeechSynthesis`; `kokoro-js` HD voice opt-in behind a flag, lazy-loaded; Whisper-tiny worker fallback for Firefox.
5. Graceful downgrade: quota exhausted / unsupported → Tier 2 → text, with a clear inline message.
6. Optional recording (opt-in): chunked upload to storage; playback synced to transcript on the feedback page; 30-day cron cleanup.
7. **[T]** Contract tests for STT/TTS interfaces; e2e with a fake provider; latency logging dashboards in PostHog.

Exit: voice works on Chrome desktop, Android Chrome, iOS Safari (Tier 1 or 2), degrades cleanly, stays within free quotas.

## Phase 6 — Personalisation (4–6 days)

1. `features/resume`: presigned upload → `unpdf` extraction → `ResumeProfile` structured extraction → stored per user; JD paste field.
2. Question generation v3 uses resume + JD + company pack (start with Google/Amazon/Meta/generic startup packs as data files in `server/llm/packs/`).
3. Interviewer persona per pack (tone, follow-up style) in turn prompts.
4. Target role/company/date on profile → readiness score + countdown on dashboard.
5. Assistant panel (real LLM, tool calls scoped to the user's attempts/feedback), streamed.
6. **[T]** Evals for tailored question relevance; security tests for prompt-injection via resume text.

Exit: two users with different resumes get materially different interviews for the same role.

## Phase 7 — Learning loop (M3 scope, 6–8 days)

1. Skill model and mastery per category; spaced-repetition queue of weak questions; daily 10-minute drill.
2. Study-plan generator tied to target date; progress tracking.
3. Question bank: seed data, tags, `minisearch`, contribute + moderation (flag → admin claim).
4. Coding mode: Monaco + Piston runner + AI review of approach/complexity (lazy chunk).
5. System-design mode: tldraw/Excalidraw canvas + AI probing; export canvas PNG to storage.
6. Video mode (optional, flag): camera preview + on-device delivery metrics only (no video upload).

## Phase 8 — Growth and polish (ongoing)

1. Google OAuth; LinkedIn import (manual paste if API is unavailable).
2. Shareable read-only feedback page (signed link, expiring); OG image per report.
3. Weekly digest email (opt-in) via Resend; GitHub Actions cron.
4. PWA manifest + offline shell; install prompt on mobile.
5. Light theme; i18n scaffold (`next-intl`) with English + one more locale.
6. Admin console (custom claim): usage, costs vs quotas, moderation queue, flags.
7. Lighthouse CI budgets enforced; a11y manual pass; release notes.

---

## Working agreement per task

1. Read the phase item and the linked docs.
2. Write or update the test first where practical.
3. Implement behind the smallest possible interface.
4. Run `pnpm typecheck && pnpm lint && pnpm test`; for UI, verify 375 / 1440 px and attach screenshots.
5. Update docs/ADR in the same PR.
6. PR with the template; squash-merge when green.
