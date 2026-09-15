# JustPrep — Codebase Analysis & World-Class Roadmap

_Analysis date: 2026-09-15. Scope: full scan of the repo as it stands (20 commits, last touched ~Sep 2025). No code changed._

> **Status note.** The findings (§1–§4) remain the authoritative audit. The decisions in §5 have been made — free-only stack (ADR-0002), keep Firebase (ADR-0003), no Vapi (ADR-0005), Gemini + Groq via AI SDK (ADR-0006), no monetisation — and the milestones in §6 are superseded by the phase-by-phase sequence in `docs/IMPLEMENTATION_PLAN.md`.

---

## 1. What the project is today

**Product:** AI voice mock-interviewer. A user signs up, generates an interview (role / level / tech stack / type) by talking to a Vapi voice workflow, takes the interview by voice with an AI interviewer, and receives an LLM-graded scorecard (5 categories, 0–100).

**Stack**

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 15.3 (App Router, Turbopack), React 19, TypeScript 5.8 | `ignoreBuildErrors` + `ignoreDuringBuilds` are ON — build hides 6 TS errors |
| Styling | Tailwind v4 (`@theme` tokens in `globals.css`), shadcn (button/input/label/form/sonner only), `tw-animate-css` | Dark mode hard-coded via `<html class="dark">`; `next-themes` installed but no provider |
| Auth | Firebase client Auth (email/password) → ID token → `firebase-admin` session cookie (httpOnly, 7d) | No OAuth; no middleware; auth enforced in route-group layouts only |
| Data | Firestore via `firebase-admin` (collections: `users`, `interviews`, `feedback`) | No `firestore.rules` / `firestore.indexes.json` in repo |
| Voice | `@vapi-ai/web` 2.3 — "generate" mode uses a hosted Vapi **workflow**; "interview" mode uses an inline assistant (Deepgram nova-2 STT → OpenAI `gpt-4` → ElevenLabs "sarah") | Vapi is a hard dependency: no voice = no interview creation, no interviews |
| LLM | Vercel AI SDK 4.3 + `@ai-sdk/google` 1.2, model `gemini-2.0-flash-001` | Used for question generation (`generateText` + `JSON.parse`) and feedback (`generateObject` + zod) |
| Widgets | recharts (7-day score chart), Remotive jobs API (client-side), GNews (server route), rule-based "AI" chatbot, login streak star, rotating quotes, live clock | |

**Request flow**

```
Sign-up  → firebase/auth createUser (client) → signUp() action writes users/{uid}
Sign-in  → firebase/auth signIn (client) → idToken → signIn() action → session cookie + recordDailyLogin
Generate → Agent(type=generate) → vapi.start(WORKFLOW_ID) → (Vapi calls POST /api/vapi/generate) → Gemini → interviews.add
Take     → Agent(type=interview) → vapi.start(interviewer, {questions}) → transcript in React state
Finish   → createFeedback() server action → Gemini generateObject → feedback.set → /interview/[id]/feedback
```

**Data model (as-is)**

```
users/{uid}        { name, email, description?, photoURL? (base64 data-URL!), dailyLogins{date:true}, lastLoginDate, loginStreak }
interviews/{id}    { role, type, level, techstack[], questions[], userId, finalized, coverImage, createdAt(ISO) }
feedback/{id}      { interviewId, userId, totalScore, categoryScores[5], strengths[], areasForImprovement[], finalAssessment, createdAt }
```

---

## 2. Findings — bugs, security, and correctness (fix before anything else)

### 2.1 Confirmed bugs (P0)

| # | Where | Problem |
|---|---|---|
| B1 | `app/api/profile/update/route.ts:8` | `cookies()` is not awaited (Next 15 made it async). `cookieStore.get` throws → **profile save always returns 500**. Confirmed by `tsc`. |
| B2 | `app/api/news/route.ts:7` vs `.env.local` | Route reads `GNEWS_API_KEY`; env defines `NEXT_PUBLIC_GNEWS_API_KEY`. News is **always the hard-coded mock list with `example.com` links**. |
| B3 | `firebase/client.ts:18` | `!getApps.length` checks the *function's arity* (always `0`), so `initializeApp` runs on every module evaluation. Should be `getApps().length`. |
| B4 | `components/DisplayTechIcons.tsx:53` | Duplicate object key `'basic flight'` (TS1117). |
| B5 | `components/Agent.tsx:111-141` | Feedback-generation effect depends on `messages`; once status is `FINISHED` any late transcript event re-fires `createFeedback` → duplicate LLM calls / double writes. No "already submitted" guard. |
| B6 | `components/Agent.tsx:83-91` | Any Vapi error containing "400" is reported as **"Your card has expired"** and redirects to `/billing`, which does not exist. |
| B7 | `lib/actions/general.action.ts` `getInterviewById` | Returns `doc.data()` without `id` and without an `exists` check → `undefined` cast to `Interview`. |
| B8 | `lib/actions/general.action.ts` `getLatestInterviews` | `orderBy("createdAt")` + `where("userId","!=",…)`: Firestore requires the first `orderBy` to be on the `!=` field. Needs verification + composite index committed to repo. |
| B9 | `app/(root)/page.tsx` + `AnalyticsChart.tsx` | Fetches feedback for **5** days, chart renders **7** days → two points are always 0. Days with no interview render as score 0 (looks like a fail). Only the first feedback of each day is used. |
| B10 | `app/(root)/layout.tsx:19` | Reads header `x-next-url`, which Next.js never sets → `currentPath` is always `/`. The `PUBLIC_ROUTES` branch is dead code. |
| B11 | `components/InterviewCard.tsx:154` / `interview/[id]/page.tsx` | `getRandomInterviewCover()` on every render → cover image changes on every refresh; the persisted `coverImage` field is never read. |
| B12 | `components/InterviewCard.tsx:126` | `/mix/gi.test(type)` — regex with `g` flag is stateful (`lastIndex`), alternates results across calls. |
| B13 | `lib/actions/auth.action.ts` `signIn` | Success path returns `undefined`; caller never checks the result. |
| B14 | `app/(root)/interview/[id]/feedback` "Retake" | Reuses the same `feedbackId` → **retaking overwrites the previous feedback**. No attempt history. |
| B15 | `components/ProfileClient.tsx` | Profile photo stored as a **base64 data-URL inside the Firestore user doc** — hits the 1 MB document limit with any real photo; should be Firebase Storage. |
| B16 | `types/index.d.ts` vs `components/Agent.tsx` | Two conflicting `AgentProps` definitions (global ambient vs local); pages pass `profileImage` which exists in neither. |

### 2.2 Security (P0)

| # | Issue |
|---|---|
| S1 | `getCurrentUser` **logs the raw session cookie and decoded claims** (`console.log("Session Cookie:", …)`) — credential leakage into server logs. 20 `console.log`s ship to prod. |
| S2 | `POST /api/vapi/generate` — **no auth, no input validation**. Anyone can burn Gemini quota and write arbitrary `interviews` docs with any `userId`. |
| S3 | `createFeedback` server action trusts client-supplied `userId`/`interviewId` — any user can write feedback into another user's account. |
| S4 | `GET /api/daily-login/check?userId=` and `/streak?userId=` — unauthenticated, enumerate any user's activity. |
| S5 | `verifySessionCookie(cookie, true)` (checkRevoked) performs a network round-trip to Firebase **every call**, and `getCurrentUser()` is called 3–4× per page (layout + page + cards) with no `React.cache` → latency + cost multiplier. |
| S6 | No `firestore.rules` in the repo. Client SDK Firestore is initialised and exported (`firebase/client.ts`) — if rules are open in the console, the whole DB is readable from the browser. |
| S7 | No rate limiting anywhere (auth, generation, feedback). |
| S8 | Every user's interviews (role, questions) are shown to every other user on the home page ("All Interviews" merges `userInterviews` + `getLatestInterviews` of others). No visibility model. |

### 2.3 Dead weight / hygiene

- `pdfjs-dist` + `@types/pdfjs-dist` installed, **never imported** (the abandoned "resume" feature — commit `50ccfd3` only touched `Agent.tsx`). This is a hint the resume-upload idea was already on the roadmap.
- `lib/utils.ts` `getTechLogos` (does HEAD requests to devicon CDN) — unused.
- `constants/dummyInterviews` — unused. `tailwind.config.js` — ignored by Tailwind v4 (`@theme` in CSS is the source of truth).
- `next-themes` only used inside `ui/sonner.tsx`; no `ThemeProvider`.
- README is `create-next-app` boilerplate + one paragraph about the login star.
- `AIChatbot` is keyword matching (`if input.includes('interview')`) branded as "AI assistant".
- Footer links to a personal Instagram handle that is not brand-safe for a product.
- No tests, no CI, no `middleware.ts`, no `error.tsx`/`loading.tsx`/`not-found.tsx`, no per-page `metadata`, no `robots`/`sitemap`, no env validation, no logging/monitoring.
- Git history: commit messages like `ehdhdrh`, `asdda`, `hs` — no conventions, no branches/PRs.

### 2.4 Dependency health

`npm audit`: **27 vulnerabilities (5 critical, 7 high)**, mostly transitive via `firebase-admin@13` / `websocket-driver`. Majors behind latest:

| Package | Installed | Latest | Impact |
|---|---|---|---|
| `next` | 15.3.3 | 16.x | Async request APIs, caching model changes, Turbopack default |
| `ai` / `@ai-sdk/google` | 4.3 / 1.2 | 7.x / 4.x | Breaking API (structured output, provider options) |
| `zod` | 3.25 | 4.x | Breaking |
| `firebase` / `firebase-admin` | 11 / 13 | 12 / 14 | Fixes audit findings |
| `@vapi-ai/web` | 2.3 | 2.7 | Minor |
| `gemini-2.0-flash-001` | — | — | Model is ~18 months old; pin to a current Flash/Pro or route through a provider abstraction |

---

## 3. Product gap analysis — what "world-class" means here

Think of the user as someone with an interview at Google/Meta/Stripe in 10 days. Today JustPrep gives them: one generic 5-category score per attempt, no history, no personalisation, voice-only. The bar (what winning products in this space do, and what an elite team would build):

### 3.1 Personalisation (the moat)
- **Resume + job-description ingestion** → questions tailored to *their* experience gaps and *that* JD. (`pdfjs-dist` is already installed — this was the original intent.)
- **Company packs**: Google (GCA/leadership), Amazon (16 LPs), Meta (impact/ownership), startups. Question style, rubric, and interviewer persona change per pack.
- **Role archetypes** beyond software: PM, data, design, sales, consulting (case), medical, MBA — each with its own rubric.
- **Target + deadline**: "Interview at Stripe on Oct 3" → readiness score + daily plan counting down.

### 3.2 Interview modalities
- **Text/chat mode** (streamed via AI SDK) — cheaper, accessible, works without mic, and removes Vapi as a single point of failure.
- **Form-based interview creation** — voice workflow should be optional, not the only way to create an interview.
- **Coding interview**: Monaco editor + sandboxed execution (Judge0/Piston) + AI reviewing approach, complexity, edge cases in real time.
- **System design**: whiteboard canvas (tldraw/Excalidraw embed) + AI probing on trade-offs.
- **Behavioural (STAR) coach** with structured prompting and per-story scoring.
- **Video mode** (camera on): eye contact, filler words, WPM, pauses — delivery coaching, not just content.

### 3.3 Feedback that changes behaviour
- **Per-question scoring** with the transcript inline-annotated (highlight the weak sentence, say why).
- **Model answers**: "here is what a strong answer to Q3 looks like, using *your* background".
- **Delivery metrics**: talk-time ratio, WPM, filler count, hesitation before answering.
- **Attempt history + trend**: attempts are first-class; retake never overwrites; diff vs last attempt.
- **Audio playback** of the session with the transcript synced.
- **Next-steps plan**: 3 concrete drills, links to *specific* resources (not the static list on the feedback page today).

### 3.4 Learning loop
- Skill graph (communication / DSA / system design / behavioural / domain) with mastery levels.
- Spaced repetition of weak questions; "daily 10-minute drill".
- Study plan generator tied to target date.
- Question bank: searchable, tagged by company/role/difficulty, community-contributed with moderation, "recently asked at X".

### 3.5 Growth, trust, and business
- **Public landing page** with SEO (today the whole site is behind auth — zero organic acquisition).
- OAuth (Google, GitHub, LinkedIn) + LinkedIn profile import.
- Shareable feedback report / "readiness badge" cards; referrals.
- **Monetisation**: Vapi minutes + LLM tokens cost real money per session. Free tier (N text interviews + M voice minutes/month) → Pro subscription (Stripe) with usage metering and a real billing page.
- Privacy & compliance: recording consent, transcript retention policy, data export, working account deletion (currently a stub), GDPR/DPDP-ready.
- Mobile: PWA, responsive fix for hard-coded widths (`w-[360px]` cards, 520 px hero image).
- Accessibility: keyboard-reachable tooltips, ARIA on live transcript, captions in voice mode, colour contrast.
- Internationalisation (interviews in the user's language).

---

## 4. Engineering foundation gaps (what an elite team would insist on)

| Area | Today | Target |
|---|---|---|
| Type safety | `ignoreBuildErrors: true`, `any`, non-null `!` everywhere, ambient global types | Strict TS, build fails on errors, exported types, zod at every boundary |
| Structure | Flat `components/`, `lib/actions/*` with mixed concerns | Feature-based modules (`features/interview`, `features/feedback`, `features/auth`) + `server/` repositories + `services/` (llm, voice, storage) |
| Auth boundary | Layout checks only; API routes open | `middleware.ts` for route protection + `requireUser()` helper used by every action/route; `React.cache`d `getCurrentUser` |
| Data | Ad-hoc Firestore calls in actions, N+1 loops (profile average) | Repository layer, aggregated stats stored on write, indexes + rules versioned in repo, emulator for local dev |
| LLM | Direct `google()` calls, prompt strings inline, `JSON.parse` on free text | `services/llm` with provider abstraction (AI SDK ≥5), versioned prompts, structured outputs, eval set for feedback quality, cost logging |
| Validation | None on API inputs | zod schemas for every route/action, env validated at boot (`t3-env`-style) |
| Errors | `console.log` with emojis | Structured logger (pino), Sentry, `error.tsx` boundaries, user-facing error states |
| Observability | None | Sentry + PostHog (product analytics) + cost dashboard (Vapi minutes, LLM tokens per user) |
| Testing | None | Vitest (units: streak calc, prompt builders, schemas), Playwright (auth → create → take (text mode) → feedback), Firestore emulator tests |
| CI/CD | None | GitHub Actions: lint, typecheck, test, build, audit; preview deploys; Husky + lint-staged; conventional commits |
| Performance | 3–4 auth round-trips/page; client-side pagination of full dataset; 3rd-party fetches on every load | Cached `getCurrentUser`, cursor pagination, `unstable_cache`/ISR for jobs+news, image optimisation, Lighthouse budget |
| Docs | Boilerplate README | Real README, architecture doc, ADRs, `.env.example`, contribution guide |

---

## 5. Proposed target architecture

```
app/
  (marketing)/          landing, pricing, blog        ← public, SEO
  (auth)/               sign-in, sign-up, oauth callbacks
  (app)/                dashboard, interviews, attempts, feedback, profile, settings, billing
  api/                  webhooks (vapi, stripe), cron, health
features/
  auth/  interview/  attempt/  feedback/  question-bank/  study-plan/  billing/  profile/
    ├─ components/  ├─ actions.ts (server, validated)  ├─ schema.ts (zod)  ├─ queries.ts
server/
  db/                   firestore repositories + converters, indexes, rules
  llm/                  provider abstraction, prompt registry (versioned), evals
  voice/                vapi client + webhook verification
  storage/              firebase storage (photos, resumes, audio)
  auth/                 requireUser(), session helpers (React.cache)
  observability/        logger, sentry, analytics
lib/                    pure utils
config/                 env.ts (validated), feature flags, plans/quotas
tests/                  unit, integration (emulator), e2e (playwright)
```

**Data model v2**

```
users/{uid}            profile, targetRole, targetCompanies[], targetDate, level, plan, credits,
                       stats{attempts, avgScore, bestScore, streak, lastActive}  (denormalised, updated on write)
users/{uid}/logins/{date}
interviews/{id}        owner, visibility(private|public), role, level, type, company?, techstack[],
                       source(voice|form|resume|jd), questions[{id,text,category,difficulty,idealPoints[]}]
attempts/{id}          interviewId, userId, mode(voice|text|coding|video), status, startedAt, endedAt,
                       transcript[], audioUrl?, metrics{wpm,fillerWords,talkRatio,pauses}, feedbackId
feedback/{id}          attemptId, userId, overall, categories[], perQuestion[{qId,score,comment,modelAnswer}],
                       strengths[], improvements[], nextSteps[], promptVersion
questionBank/{id}      text, tags[], company?, role, difficulty, source, upvotes, moderation
studyPlans/{uid}       generated plan, progress
usage/{uid}/{month}    voiceSeconds, llmTokens, attempts  (for quotas + billing)
```

**Key decisions to make (need your call)**

1. **Database**: stay on Firestore (fast to ship, already works) vs move to Postgres (Supabase/Neon + Drizzle) for leaderboards, analytics, question-bank search. _Recommendation: stay on Firestore through M2; revisit at M3 when question-bank search and cohort analytics need relational queries._
2. **Voice**: keep Vapi (fast, good quality, per-minute cost) vs own pipeline (OpenAI Realtime / Gemini Live / LiveKit + Deepgram + ElevenLabs). _Recommendation: keep Vapi, make it one of several modes, add text mode first._
3. **LLM**: consolidate through AI SDK with a provider switch (a cheap Flash-class model for generation, a stronger model for feedback grading). Build a small eval set so grading quality is measurable.
4. **Monetisation**: yes/no and when — it dictates the usage-metering work in M1.

---

## 6. Milestones

Each milestone is shippable on its own. Order is deliberate: you cannot build personalisation on top of unauthenticated endpoints and overwritten feedback.

### M0 — Stabilise & secure (≈1 week)
- Fix B1–B16; remove `ignoreBuildErrors`/`ignoreDuringBuilds`; `tsc` and `eslint` clean.
- Strip all `console.log`; add logger. Remove the session-cookie log immediately.
- `requireUser()` helper; protect `/api/vapi/generate`, `createFeedback`, daily-login routes; verify Vapi webhook signature.
- `React.cache(getCurrentUser)`; drop `checkRevoked` to once-per-session or on sensitive ops.
- Commit `firestore.rules` (deny-all for client SDK) + `firestore.indexes.json`.
- `.env.example`, env validation, fix the GNews key mismatch.
- Upgrade deps (Next 16, AI SDK, zod 4, firebase, firebase-admin) → `npm audit` clean.
- Move profile photos to Firebase Storage.
- Working account deletion (Auth + Firestore + Storage).
- Real README.

### M1 — Foundation (≈1–2 weeks)
- Feature-based restructure; repository layer; zod at boundaries.
- `middleware.ts` route protection; `error.tsx`, `loading.tsx`, `not-found.tsx`; per-page metadata.
- CI (lint/typecheck/test/build/audit), Husky, conventional commits.
- Vitest + first Playwright flow; Firestore emulator for local dev.
- Sentry + PostHog; cost logging per LLM/Vapi call.
- Usage metering table (needed for quotas later).
- Cursor pagination; ISR/cache for jobs + news; responsive fixes.

### M2 — Core product v2 (≈3 weeks)
- **Attempts model**: retake creates a new attempt; history + trend per interview.
- **Form-based interview creation** (voice optional).
- **Text/chat interview mode** with streaming; captions for voice mode.
- **Feedback v2**: per-question scoring, annotated transcript, model answers, next steps, delivery metrics (WPM, fillers, talk ratio) from the transcript.
- **Resume + JD upload** → tailored question generation (pdfjs already present).
- Interview visibility (private by default; explicit "publish to community").
- Real AI assistant (replace keyword bot) grounded in the user's own data.
- Dashboard redesign: readiness score, skill radar, recent attempts, plan for today.

### M3 — Differentiators (≈4–6 weeks)
- Company packs + interviewer personas.
- Coding interview mode (Monaco + sandboxed runner + AI reviewer).
- System-design mode (canvas + AI probing).
- Video mode with delivery analysis.
- Question bank (search, tags, community + moderation), spaced-repetition drills, study-plan generator.
- Audio recording + synced playback.

### M4 — Growth & business (≈2–3 weeks)
- Public landing + pricing + SEO (sitemap, OG images, blog).
- OAuth (Google/GitHub/LinkedIn), LinkedIn import.
- Stripe subscriptions + credits + real `/billing`; free-tier quotas enforced via usage metering.
- Shareable reports, referral programme, transactional email (Resend), PWA.

### M5 — Scale & polish (ongoing)
- i18n, full a11y audit, Lighthouse ≥ 90, feature flags, A/B tests, admin console (users, costs, moderation), abuse controls, data export/retention jobs.

---

## 7. Immediate next step

Confirm the four decisions in §5, then start **M0**. Every item in M0 is a concrete, verifiable fix; nothing in M1+ should be built on the current unauthenticated/overwriting foundation.
