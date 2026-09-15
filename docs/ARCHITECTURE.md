# Architecture

## 1. Principles

1. **Thin edges, thick core.** Route handlers, server actions, and components are adapters. Logic lives in `server/services` and is unit-testable without Next.js.
2. **Dependencies point inward.** `app → features → server → vendor`. Nothing imports upward. Enforced by `eslint-plugin-import` `no-restricted-paths` rules.
3. **Interfaces at every vendor boundary.** LLM, speech, storage, mail, rate limiting, analytics are interfaces with one adapter per vendor and a fake for tests.
4. **Server-first rendering.** Server components by default; client components at the leaves (forms, live voice session, charts).
5. **Canonical artefacts.** The interview *transcript* is the single source for grading, playback, and metrics, whatever mode produced it.

## 2. Folder layout

```
app/
  (marketing)/               public: /, /pricing (free), /how-it-works, /blog/*   — SEO, no auth
  (auth)/                    /sign-in, /sign-up, /reset-password, /oauth/callback
  (app)/                     authenticated shell (sidebar + topbar)
    dashboard/
    interviews/              list · new · [id] · [id]/attempts/[attemptId] · [id]/attempts/[attemptId]/feedback
    library/                 question bank (M3)
    plan/                    study plan (M3)
    profile/  settings/
  api/
    health/route.ts
    webhooks/                (signed) — none until a vendor needs one
    voice/session/route.ts   mints ephemeral Gemini Live token after quota check
    cron/[job]/route.ts      signed by CRON_SECRET, triggered by GitHub Actions
  layout.tsx  error.tsx  not-found.tsx  robots.ts  sitemap.ts  manifest.ts

features/
  auth/          components/ (SignInForm…)  actions.ts  schema.ts
  interview/     components/ (InterviewForm, InterviewCard, InterviewList)  actions.ts  schema.ts  queries.ts
  attempt/       components/ (VoiceSession, TextSession, Captions, SessionControls)  actions.ts  hooks/
  feedback/      components/ (ScoreCard, PerQuestion, AnnotatedTranscript, Trend)  actions.ts
  profile/       components/  actions.ts  schema.ts
  resume/        components/ (ResumeUpload)  actions.ts  schema.ts
  study-plan/    (M3)
  question-bank/ (M3)
  assistant/     components/ (AssistantPanel)  actions.ts

components/
  ui/            primitives: button, input, card, dialog, sheet, tabs, table, skeleton, badge, toast…
  layout/        AppShell, Sidebar, Topbar, PageHeader, EmptyState, ErrorState
  charts/        themed recharts wrappers

server/
  auth/          session.ts (React.cache getCurrentUser, requireUser), cookies.ts
  db/            firestore.ts (admin init), converters/, repositories/ (users, interviews, attempts, feedback, usage), types.ts
  services/      interview.service.ts, attempt.service.ts, feedback.service.ts, resume.service.ts, quota.service.ts
  llm/           provider.ts (interface), providers/{gemini,groq,ollama}.ts, router.ts, prompts/{questions,turn,feedback,resume}.vN.ts, schemas/
  voice/         selectTier.ts, geminiLive.ts (token minting), metrics.ts (wpm, fillers, talk ratio from transcript)
  storage/       storage.ts (interface), r2.ts, supabase.ts
  mail/          mailer.ts (interface), resend.ts, templates/
  ratelimit/     ratelimit.ts (Upstash), keys.ts
  observability/ logger.ts (pino, redaction), sentry.ts, analytics.ts (posthog-node), usage.ts
  errors.ts      AppError, Result<T,E>, error codes

config/
  env.ts         validated env (server + client schemas)
  providers.ts   LLM/voice fallback order
  limits.ts      rate limits and quotas
  plans.ts       free plan definition
  site.ts        name, urls, metadata defaults
  flags.ts       feature flag keys

lib/             pure utils: cn, dates, text (filler-word detection), scoring, pagination
hooks/           useMediaQuery, useReducedMotion, useSpeechRecognition, useSpeechSynthesis, useWakeLock
styles/          globals.css (tokens), fonts.ts
tests/
  unit/  integration/ (firebase emulator)  e2e/ (playwright)  evals/ (feedback prompt regression set)  fixtures/
firebase/        firestore.rules  firestore.indexes.json  storage.rules (unused if R2)  firebase.json (emulators)
docs/            handbook + decisions/
.github/         workflows/ ISSUE_TEMPLATE/ PULL_REQUEST_TEMPLATE.md CODEOWNERS
```

## 3. Layers and contracts

```
┌──────────────────────────────────────────────────────────────────────┐
│ app/  (routes, layouts) — composition only                            │
├──────────────────────────────────────────────────────────────────────┤
│ features/*  — UI + server actions for one capability                  │
│   actions.ts:  requireUser → zod → service → Result                    │
│   components:  compose components/ui, receive plain props              │
├──────────────────────────────────────────────────────────────────────┤
│ server/services — use-cases; orchestrate repositories + providers     │
│ server/db/repositories — Firestore access, typed converters           │
│ server/{llm,voice,storage,mail,ratelimit} — interfaces + adapters     │
├──────────────────────────────────────────────────────────────────────┤
│ vendors: firebase-admin, @ai-sdk/*, Gemini Live, R2, Upstash, Resend  │
└──────────────────────────────────────────────────────────────────────┘
```

Contracts:
- `Result<T, AppError>` from every service and action. `AppError` has `code` (enum), `message` (safe for UI), `cause` (never sent to client).
- Repositories expose intent-named methods (`findAttemptsForUser(userId, cursor)`), not generic CRUD.
- Providers are constructed by factories reading `config/providers.ts`; services receive them as parameters (dependency injection) so tests pass fakes.

## 4. SOLID mapping (how it applies here)

| Principle | Concrete rule in this repo |
|---|---|
| **S**ingle responsibility | One component renders one thing; one service owns one use-case; one repository owns one collection. A file over ~200 lines is a smell. |
| **O**pen/closed | Add behaviour via new provider adapters, new `cva` variants, new prompt versions — not by editing call sites with `if (vendor === …)`. |
| **L**iskov substitution | Every `LLMProvider`/`SpeechToText`/`ObjectStorage` adapter passes the same contract test suite (`tests/unit/contracts/*`). Swapping Gemini for Groq changes no feature code. |
| **I**nterface segregation | Small interfaces: `TextGenerator`, `StructuredGenerator`, `StreamGenerator` rather than one fat `LLM`. Read repositories separate from write repositories where it clarifies. |
| **D**ependency inversion | Features import interfaces from `server/*/interface.ts`; concrete adapters are wired in `server/*/index.ts` factories. |

Reuse rules: a second copy of any logic is refactored into `lib/` or a repository in the same PR. UI variants come from `cva` props on the primitive, never a forked component.

## 5. Data model v2

```
users/{uid}
  name, email, avatarUrl?, headline?, level, targetRole?, targetCompanies[], targetDate?
  stats { attempts, avgScore, bestScore, streak, lastActiveAt }     ← denormalised on write
  prefs { voiceTier: auto|tier2|text, hdVoice: bool, reducedMotion: bool, locale }
  createdAt, updatedAt
users/{uid}/logins/{yyyy-mm-dd}      { at }
users/{uid}/resumes/{id}             { fileKey, extracted: ResumeProfile, createdAt }

interviews/{id}
  ownerId, visibility: private|public, title, role, level, type: technical|behavioral|mixed,
  company?, techstack[], source: form|voice|resume|jd, language,
  questions[{ id, text, category, difficulty, idealPoints[] }],
  createdAt, updatedAt

attempts/{id}
  interviewId, userId, mode: live|assisted|text, status: created|active|completed|abandoned,
  startedAt, endedAt, durationSec, tier,
  transcript[{ id, role, text, at, questionId? }],
  audioKey?, metrics { wpm, fillerCount, fillerRate, talkRatio, avgResponseLatencyMs },
  feedbackId?, promptVersions { turn, feedback }

feedback/{id}
  attemptId, interviewId, userId, overall,
  categories[{ key, score, comment }],
  perQuestion[{ questionId, score, comment, evidence[{transcriptId, note}], modelAnswer }],
  strengths[], improvements[], nextSteps[{ title, why, resourceUrl? }],
  promptVersion, model, createdAt

usage/{uid}/months/{yyyy-mm}
  llmCalls{task:count}, llmTokens, liveSeconds, uploads, emails

questionBank/{id}   (M3)  text, tags[], company?, role?, difficulty, source, upvotes, status
studyPlans/{uid}    (M3)
```

Indexes and rules are committed under `firebase/`. Every query used by a repository has a matching entry in `firestore.indexes.json`.

## 6. Key flows

**Create interview (form):** `InterviewForm` → `createInterview` action → `requireUser` → zod → `quota.check(user, 'generate')` → `interview.service.create` → `llm.router.structured('questions.v2', …)` → `interviews.repo.insert` → revalidate → redirect.

**Take interview (any tier):** `startAttempt` action creates `attempts/{id}` (status `created`) → client `VoiceSession`/`TextSession` requests `/api/voice/session` → server selects tier, mints token or returns `text` → each finalised turn is appended via `appendTurn` action (idempotent by `turnId`) → `completeAttempt` computes metrics, sets status → triggers `feedback.service.generate` → redirect to feedback.

**Feedback:** `feedback.service.generate(attemptId)` loads attempt + interview → builds prompt `feedback.vN` → structured output → stores `feedback/{id}` → updates `users.stats` transactionally → emits analytics event.

## 7. Cross-cutting

- **Auth:** `proxy.ts` (Next 16 name for middleware; Node runtime only) gates `(app)` routes by cookie presence (cheap); `requireUser()` verifies the cookie (cached per request via `React.cache`) and is the real gate.
- **Caching:** public pages static; dashboard `dynamic`; lists use cursor pagination via `nuqs` `?cursor=`; provider responses for question generation cached in Firestore by input hash.
- **Errors:** `error.tsx` per route group; `AppError` → toast/inline; Sentry captures with user id only.
- **Observability:** every service call logs `{ traceId, userId, op, durationMs, provider?, model?, tokens? }`.
- **Feature flags:** PostHog flags read server-side in `config/flags.ts`; new capabilities ship dark.
