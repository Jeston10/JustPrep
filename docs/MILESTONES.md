# Milestones — execution plan

This is the work breakdown for `docs/IMPLEMENTATION_PLAN.md`: which file changes happen in which phase, sliced into PR-sized units, with the procedure and verification for each. `ARCHITECTURE.md` is the target; this document is the route. If the two disagree, fix this document.

Conventions: **P0…P8** = phases, each on its own integration branch `milestone/p<N>-<name>` cut from `dev` (P0 `milestone/p0-toolchain`, P1 `milestone/p1-security`, P2 `milestone/p2-architecture`, P3 `milestone/p3-ui-revamp`, P4 `milestone/p4-core-product`, P5 `milestone/p5-voice`, P6 `milestone/p6-personalisation`, P7 `milestone/p7-learning-loop`, P8 `milestone/p8-growth`). **PR n.m** = a branch/PR inside a phase targeting the milestone branch, merged in order unless marked *parallel*. Phase exit = milestone branch merged into `dev` with green CI, then `dev` promoted to `main` and tagged. Effort is calendar days for one engineer plus an agent. Tags at phase exit: `v0.2.0` (P0) … `v1.0.0` (P5), `v1.x` after.

---

## 0. Legacy → target migration map

Every file in the repo today, where it ends up, and when. "Delete" means removed in that phase after its replacement is merged.

### 0.1 `app/`

| Legacy | Target | Phase | Action |
|---|---|---|---|
| `app/layout.tsx` | `app/layout.tsx` | P3.1 | Rewrite: `next/font` (serif + Geist), token CSS import, Sentry/PostHog providers, `lang`, metadata defaults from `config/site.ts` |
| `app/globals.css` | `styles/globals.css` | P3.1 | Replace: `@theme` tokens per DESIGN_SYSTEM §3, `--radius: 0`, remove purple/shadcn neutral palette and `.pattern` |
| `app/(auth)/layout.tsx` | `app/(auth)/layout.tsx` | P1.1 → P3.4 | P1: use `server/auth` redirect helper. P3: centred single-column edged layout |
| `app/(auth)/sign-in/page.tsx`, `sign-up/page.tsx` | `app/(auth)/sign-in`, `sign-up`, `reset-password`, `verify-email` | P3.4 | Rebuild on `features/auth/components` |
| `app/(root)/layout.tsx` | `app/(app)/layout.tsx` | P1.1 → P3.3 | P1: remove `x-next-url` dead code, `requireUser()`, drop streak/quote/clock/chatbot. P3: `AppShell` |
| `app/(root)/page.tsx` | `app/(app)/dashboard/page.tsx` + `app/(marketing)/page.tsx` | P3.5 / P3.6 → P4.5 | Split: authenticated dashboard vs public landing. P4: dashboard v2 data |
| `app/(root)/interview/page.tsx` | `app/(app)/interviews/new/page.tsx` | P4.1 | Replace voice-workflow generation with `InterviewForm` |
| `app/(root)/interview/[id]/page.tsx` | `app/(app)/interviews/[id]/page.tsx` (detail) + `app/(app)/interviews/[id]/attempts/[attemptId]/page.tsx` (session) | P4.2 / P4.3 | Split: detail (questions, attempts list, start button) vs session |
| `app/(root)/interview/[id]/feedback/page.tsx` | `app/(app)/interviews/[id]/attempts/[attemptId]/feedback/page.tsx` | P4.4 | Move + rebuild on feedback v2 |
| `app/(root)/profile/page.tsx` | `app/(app)/profile/page.tsx`, `app/(app)/settings/page.tsx` | P1.7 → P3.5 | P1: remove N+1 (read `users.stats`), add danger zone. P3: rebuild |
| `app/api/auth/signout/route.ts` | `features/auth/actions.ts#signOut` | P1.4 | Delete route; action revokes refresh tokens |
| `app/api/daily-login/check`, `streak` | `server/services/streak.service.ts` (called from `requireUser` flow once per day) | P1.4 | Delete routes |
| `app/api/news/route.ts` | — | P3.5 | Delete (filler widget) |
| `app/api/profile/update/route.ts` | `features/profile/actions.ts#updateProfile` | P1.4 | Delete route; action with zod; photo via storage in P2.6 |
| `app/api/vapi/generate/route.ts` | P1: auth + zod; P4.6: delete | P1.4 / P4.6 | Interim hardening, then removal with Vapi |
| — | `app/api/health/route.ts` | P1.6 | New |
| — | `app/api/voice/session/route.ts` | P5.1 | New |
| — | `app/api/cron/[job]/route.ts` | P5.7 | New (signed) |
| — | `app/error.tsx`, `not-found.tsx`, `(app)/error.tsx`, `loading.tsx` per route | P3.3 | New |
| — | `app/robots.ts`, `sitemap.ts`, `manifest.ts`, `opengraph-image.tsx` | P3.6 / P8.4 | New |
| — | `app/(dev)/ui/page.tsx` (component gallery, excluded from prod) | P3.2 | New |
| — | `proxy.ts` | P1.2 | New |

### 0.2 `components/`

| Legacy | Target | Phase | Action |
|---|---|---|---|
| `Agent.tsx` | `features/attempt/components/{SessionShell,TextSession,VoiceSession,Captions,SessionControls,PermissionPrompt}.tsx` | P4.3 (text) → P5.2–5.4 (voice); delete P4.6 | Replaced; not refactored |
| `AIChatbot.tsx` | `features/assistant/components/AssistantPanel.tsx` | delete P3.5; new P6.5 | Keyword bot removed; real assistant later |
| `AllInterviewsSection.tsx` | `features/interview/components/InterviewList.tsx` | P4.1 | Rebuild with `nuqs` filters + cursor pagination |
| `AnalyticsChart.tsx`, `HomeAnalyticsSection.tsx` | `components/charts/ScoreTrend.tsx` + `features/feedback/components/Trend.tsx` | P4.4 | Rebuild on attempts data |
| `AuthForm.tsx`, `FormField.tsx` | `features/auth/components/{SignInForm,SignUpForm,ResetPasswordForm}.tsx`, `components/ui/field.tsx` | P3.4 | Rebuild |
| `DailyLoginStar.tsx`, `DynamicCareerQuote.tsx`, `LiveDateTime.tsx`, `NewsSection.tsx`, `HighPayingJobsSection.tsx` | — | P3.5 | Delete (GUARDRAILS D3) |
| `DisplayTechIcons.tsx` | `components/ui/tech-chip.tsx` (monochrome `simple-icons`) | P3.2 | Rebuild; fix duplicate key in P0.2 meanwhile |
| `InterviewCard.tsx` | `features/interview/components/InterviewCard.tsx` | P4.1 | Rebuild: no random cover, shows best score from `users.stats`/attempt |
| `PaginationControls.tsx` | `components/ui/pagination.tsx` (cursor-based) | P3.2 → P4.1 | Rebuild |
| `ProfileClient.tsx` | `features/profile/components/ProfileForm.tsx` | P3.5 | Rebuild; avatar via presigned upload (P2.6) |
| `SettingsMenu.tsx` | `components/layout/UserMenu.tsx` + `features/profile/components/DangerZone.tsx` | P1.7 (delete account works) → P3.3 | Split |
| `ui/button, input, label, form, sonner` | `components/ui/*` | P3.2 | Re-import from shadcn, adapt (radius 0, tokens) |
| — | `components/ui/{card,dialog,sheet,tabs,table,skeleton,badge,separator,scroll-area,popover,dropdown-menu,tooltip,command,progress,avatar,kbd,select,combobox,checkbox,radio-group,switch,slider,textarea,icon-button,pagination,field}.tsx` | P3.2 | New (shadcn + 21st.dev) |
| — | `components/ui/motion/{Presence,FadeIn,SlideUp,Stagger}.tsx` | P3.2 | New |
| — | `components/layout/{AppShell,Sidebar,Topbar,BottomTabs,PageHeader,Section,Panel,EmptyState,ErrorState,Stat,UserMenu}.tsx` | P3.3 | New (21st.dev shells adapted) |
| — | `components/charts/{ScoreTrend,CategoryRadar,UsageBars}.tsx` | P4.4 / P8.6 | New |

### 0.3 `lib/`, `constants/`, `firebase/`, `types/`

| Legacy | Target | Phase | Action |
|---|---|---|---|
| `lib/actions/auth.action.ts` | `server/auth/session.ts` (get/require user, cookies), `features/auth/actions.ts` (signIn/signUp/signOut), `server/services/streak.service.ts` | P1.1 / P1.4 → P2.4 | Split; logging removed in P1.1 |
| `lib/actions/general.action.ts` | `server/db/repositories/{interviews,feedback,attempts,users,usage}.repo.ts`, `server/services/{interview,attempt,feedback,quota}.service.ts`, `features/{interview,feedback}/actions.ts` | P2.2 / P2.4 | Split; `createFeedback` hardened in P1.4 first |
| `lib/utils.ts` | `lib/cn.ts`; `getTechLogos`/`getRandomInterviewCover` deleted | P2.4 | Split/delete |
| `lib/vapi.sdk.ts` | — | P4.6 | Delete |
| `constants/index.ts` | `server/llm/prompts/{questions.v1,turn.v1,feedback.v1}.ts` (ported verbatim, then v2 in P4), `server/llm/schemas/feedback.ts`, `lib/tech.ts` (mappings), `dummyInterviews` deleted | P2.3 | Split |
| `firebase/admin.ts` | `server/db/firestore.ts` | P2.2 | Move; env via `config/env.ts` (P0.3) |
| `firebase/client.ts` | `lib/firebase-client.ts` (Auth only; Firestore export removed) | P0.3 (bug fix + env) → P2.4 (move) | Fix `getApps().length`; config from `NEXT_PUBLIC_FIREBASE_*` |
| `types/index.d.ts`, `types/vapi.d.ts` | `server/db/types.ts`, `features/*/schema.ts` (zod-inferred) | P2.2; delete P2.4 | Ambient globals removed (GUARDRAILS C6) |
| — | `firebase/{firebase.json,firestore.rules,firestore.indexes.json}`, `scripts/seed-emulator.ts` | P1.3 | New |
| — | `scripts/migrate-v1-to-v2.ts` | P2.5 | New, one-off |

### 0.4 `server/`, `config/`, `hooks/`, `tests/` (all new)

| Target | Phase |
|---|---|
| `config/env.ts` | P0.3 |
| `config/{site,limits}.ts` | P1.5 |
| `config/{providers,plans,flags}.ts` | P2.3 / P2.4 / P1.6 |
| `server/observability/{logger,sentry,analytics,usage}.ts` | P1.1 / P1.6 / P2.3 |
| `server/auth/{session,cookies}.ts` | P1.1 |
| `server/ratelimit/{ratelimit,keys}.ts` | P1.5 |
| `server/errors.ts`, `server/safe-action.ts` | P2.1 |
| `server/db/{firestore,types}.ts`, `converters/`, `repositories/` | P2.2 |
| `server/llm/{provider,router}.ts`, `providers/{gemini,groq,ollama}.ts`, `prompts/`, `schemas/`, `packs/` (P6) | P2.3 |
| `server/services/{interview,attempt,feedback,quota,streak,account}.service.ts` | P2.4 (+ streak P1.4, account P1.7) |
| `server/storage/{storage,r2,supabase}.ts` | P2.6 |
| `server/voice/{selectTier,geminiLive,metrics}.ts` | P4.2 (metrics) / P5.1 |
| `server/mail/{mailer,resend}.ts`, `templates/` | P3.4 (verify email) |
| `hooks/{use-media-query,use-reduced-motion}.ts` | P3.2 |
| `hooks/{use-speech-recognition,use-speech-synthesis,use-wake-lock,use-audio-level}.ts` | P5.2 / P5.4 |
| `tests/unit`, `tests/unit/contracts`, `tests/integration`, `tests/e2e`, `tests/evals`, `tests/fixtures` | P0.5 (scaffold) then per phase |

### 0.5 Root and assets

| Legacy | Target | Phase | Action |
|---|---|---|---|
| `package.json` (npm) | pnpm, scripts, `engines`, `packageManager`, `prepare: lefthook install` | P0.1 | Rewrite scripts |
| `package-lock.json` | `pnpm-lock.yaml` | P0.1 | Replace |
| `next.config.ts` | strict; headers (P1.2); `images.remotePatterns` for storage (P2.6); `serverActions.allowedOrigins` | P0.2 / P1.2 | Rewrite |
| `tsconfig.json` | strict flags | P0.2 | Edit |
| `eslint.config.mjs` | flat config per CODING_STANDARDS §1 | P0.1 | Rewrite |
| `tailwind.config.js` | — | P0.1 | Delete (v4 ignores it) |
| `components.json` | update aliases (`ui`, `hooks`, `lib`) | P3.2 | Edit |
| `.env.local` | keys renamed to match `.env.example` | P0.3 | Edit locally (not committed) |
| `public/covers/*`, `public/*.png|svg` (tech logos, robot, pattern, avatars) | delete; keep `logo.svg`, `favicon.ico`; add `icons/` for PWA | P3.5 / P8.4 | Delete |
| `.vscode/` | `settings.json` (format on save, eslint), `extensions.json` | P0.1 | Add |
| `README.md`, `AGENTS.md`, `docs/**`, `.github/**`, `lefthook.yml`, `.env.example` | already present | — | Maintain |

---

## 1. Phase P0 — Toolchain and repo hygiene (2 days) → `v0.2.0`

**Aligns with:** ARCHITECTURE §1 (principles enforced by tooling), CODING_STANDARDS §1, QUALITY §1 static gates. **Prereq:** none.

| PR | Branch | Scope | Procedure | Verify |
|---|---|---|---|---|
| 0.1 | `chore/pnpm-toolchain` | pnpm, `.nvmrc`, `engines`, scripts (`dev typecheck lint format test test:integration test:e2e build audit`), `prepare: lefthook install`, `commitlint.config.mjs`, `prettier.config.mjs` (+tailwind plugin), ESLint flat config (strict TS, a11y, import order, `no-console`, layer `no-restricted-imports`), `.vscode/`, delete `tailwind.config.js` and `package-lock.json` | 1. `corepack enable && pnpm import` 2. write configs 3. `pnpm lint --fix` then fix remaining by hand 4. `pnpm dlx lefthook install` | `pnpm lint` 0 errors; hooks fire on a test commit |
| 0.2 | `chore/strict-typescript` | `tsconfig` strict flags; remove `ignoreBuildErrors`/`ignoreDuringBuilds`; fix B1 (`await cookies()`), B4 (dup key), B16 (`AgentProps` unify, remove `profileImage`), B12 (regex `g` flag), B13 (`signIn` return) | Fix errors file by file; no `any`/`!` introduced | `pnpm typecheck` clean; `pnpm build` clean |
| 0.3 | `chore/env-validation` | `config/env.ts` (`@t3-oss/env-nextjs`), replace every `process.env`, `lib/firebase-client.ts` from `NEXT_PUBLIC_FIREBASE_*` and fix B3 (`getApps().length`), delete GNews key usage (news route removed later; stub returns empty until P3.5) | Rename keys in `.env.local` per `.env.example` | App boots; missing env fails build with a clear message |
| 0.4 | `chore/deps-upgrade` | Upgrade Next/React/AI SDK/`@ai-sdk/google`/zod/firebase/firebase-admin; remove `pdfjs-dist`, `@types/pdfjs-dist`, `tailwindcss-animate`; `pnpm audit` to zero high/critical; run `knip` and delete unused exports (`getTechLogos`, `dummyInterviews`) | One dep family per commit; run app after each | `pnpm audit --audit-level=high` clean; `pnpm build` clean |
| 0.5 | `ci/pipeline` | Activate `.github/workflows/ci.yml` (scripts exist now), `vitest.config.ts`, `playwright.config.ts`, `size-limit` config, `knip.json`, first unit test (`lib/cn.test.ts`), `tests/` skeleton, branch protection on `main` | Push; fix CI until green | CI green on `main` |

**Exit criteria:** CI green; `pnpm build`, `typecheck`, `lint`, `audit` clean; hooks enforce commits; tag `v0.2.0`. ADR-0002, 0003, 0010 marked Accepted (already).

**Risks:** Next major upgrade may change async request APIs or caching defaults → do 0.4 last and keep each upgrade in its own commit for bisecting.

---

## 2. Phase P1 — Security hardening (3 days) → `v0.3.0`

**Aligns with:** ARCHITECTURE §7 cross-cutting (auth, errors, observability), SECURITY §2 controls. Works on the legacy UI; no visual changes. **Prereq:** P0.

| PR | Branch | Scope | Procedure | Verify |
|---|---|---|---|---|
| 1.1 | `security/session-and-logger` | `server/auth/session.ts` (`React.cache(getCurrentUser)`, `requireUser`, `__Host-` cookie in prod, `checkRevoked` only for sensitive ops), `server/observability/logger.ts` (pino + redaction), delete all `console.log`, sign-out revokes refresh tokens, `(auth)`/`(root)` layouts use the helper | Grep `console.` → 0; grep `process.env` → only `config/env.ts` | Unit tests for session helpers with a fake admin auth; no cookie in logs (test asserts redaction) |
| 1.2 | `security/headers-proxy` | `proxy.ts` (cookie-presence gate for `(root)` now, `(app)` later; CSP nonce), security headers in `next.config.ts`, `serverActions.allowedOrigins` | Start with `Content-Security-Policy-Report-Only`, fix violations, then enforce | `tests/unit/headers.test.ts` asserts every header; manual check in DevTools |
| 1.3 | `security/firestore-rules-indexes` | `firebase/firebase.json` (emulators), `firestore.rules` deny-all, `firestore.indexes.json` for every current query (verify B8), `scripts/seed-emulator.ts`, `pnpm dev` uses emulators when `FIREBASE_EMULATOR=1` | Export prod indexes with `firebase firestore:indexes` as baseline | Rules test: client read/write denied; queries run on emulator without index errors |
| 1.4 | `security/protect-endpoints` | Delete `api/auth/signout`, `api/daily-login/*`, `api/profile/update`; add `features/auth/actions.ts` (`signOut`), `features/profile/actions.ts` (`updateProfile` zod), `server/services/streak.service.ts` (record on first authenticated request per day, user-timezone aware); `createFeedback` derives `userId` from session, checks interview exists, idempotent per (interviewId,userId) until attempts land; `/api/vapi/generate` requires session + zod + validates `userid === session.uid` | One endpoint per commit | Tests: unauthenticated → 401/`UNAUTHENTICATED`; wrong owner → `FORBIDDEN`; invalid body → 400 |
| 1.5 | `security/rate-limiting` | `server/ratelimit/`, `config/limits.ts`, applied to sign-in/up actions, `createFeedback`, `updateProfile`, `/api/vapi/generate` | Upstash free DB; keys `rl:{name}:{uid|ip}` | Unit test with in-memory limiter fake; manual burst test returns `RATE_LIMITED` |
| 1.6 | `security/observability` | `@sentry/nextjs` (PII off, `beforeSend` scrub), `posthog-js`/`posthog-node` (identify by uid, mask inputs), `config/flags.ts`, `app/api/health/route.ts`, `server/observability/analytics.ts` with typed event names | Sentry + PostHog free projects | Health returns `{ok:true}`; a test error appears in Sentry without cookies; one event in PostHog |
| 1.7 | `feat/account-deletion-export` | `server/services/account.service.ts` (`deleteAccount` with re-auth token, batched Firestore delete, storage later, analytics deletion request; `exportData` JSON), `DangerZone` wired into `SettingsMenu`; profile page reads no N+1 (temporary: single aggregate query; permanent in P2.5) | Re-auth via fresh ID token from client | E2E: create user → delete → sign-in fails, docs gone (emulator) |

**Exit criteria:** SECURITY §3 checklist true for every server entry point; SECURITY §4 table matches reality; `v0.3.0`.

---

## 3. Phase P2 — Architecture restructure and data model v2 (4 days) → `v0.4.0`

**Aligns with:** ARCHITECTURE §2 (folders), §3 (contracts), §4 (SOLID), §5 (data model v2), §6 (flows). Behaviour unchanged for users. **Prereq:** P1.

| PR | Branch | Scope | Procedure | Verify |
|---|---|---|---|---|
| 2.1 | `refactor/errors-and-safe-action` | `server/errors.ts` (`AppError`, `ErrorCode`, `Result`), `server/safe-action.ts` (`authAction` = next-safe-action client with `requireUser`, rate-limit middleware from metadata, error mapping) | Convert `signOut`/`updateProfile` first as the pattern | Unit: error mapping; action returns `Result` shape |
| 2.2 | `refactor/repositories` | `server/db/firestore.ts` (from `firebase/admin.ts`), `types.ts`, `converters/`, `repositories/{users,interviews,feedback}.repo.ts` with ownership-scoped methods; replace all direct `db.collection` calls | Move one collection at a time; ESLint rule forbids `firebase-admin` outside `server/db` | Integration tests on emulator for each repo method incl. wrong-owner returns `null` |
| 2.3 | `refactor/llm-layer` | `server/llm/provider.ts` (`TextGenerator`, `StructuredGenerator`, `StreamGenerator`), `providers/{gemini,groq,ollama}.ts`, `router.ts` (order from `config/providers.ts`, 429/5xx fallback, timeout), `prompts/{questions,feedback}.v1.ts` (verbatim port), `schemas/`, `observability/usage.ts`, `tests/unit/contracts/llm.contract.ts`; replace calls in `createFeedback` and `/api/vapi/generate` | Gemini free key + Groq free key | Contract tests pass for each adapter (recorded fixtures); usage row written per call |
| 2.4 | `refactor/services-and-features` | `server/services/{interview,feedback,quota}.service.ts`; `features/{auth,interview,feedback,profile}/{actions,schema}.ts`; move `lib/firebase-client.ts`; split `lib/utils.ts`; delete `lib/actions/*`, `types/*.d.ts`, `constants/index.ts` remnants; `config/{plans,providers}.ts` | Feature by feature; layer lint rule enabled at the end | `pnpm lint` layer rules pass; all P1 tests still green |
| 2.5 | `feat/data-model-v2-migration` | `attempts.repo.ts`, `usage.repo.ts`; `feedback.attemptId`; `users.stats`; `users/{uid}/logins`; `interviews.visibility/source/updatedAt`; `scripts/migrate-v1-to-v2.ts` (idempotent, dry-run flag); update `firestore.indexes.json`; profile average now from `users.stats` | Run on emulator with prod export, then on prod once; keep legacy fields for one release | Migration test on fixture export; dashboard/profile numbers unchanged before/after |
| 2.6 | `feat/object-storage` | `server/storage/{storage,r2}.ts` (+`supabase.ts` if needed), `features/profile/actions.ts#getAvatarUploadUrl/confirmAvatar`, `sharp` re-encode, `next.config` `images.remotePatterns`, CSP update, migrate base64 avatars (script) and drop the field; ADR-0004 → Accepted | R2 bucket + CORS; presigned PUT | Integration test with a local S3-compatible fake (or R2 dev bucket); avatar upload works at 375 px |

**Exit criteria:** no feature imports a vendor SDK; every query has an index; attempts exist for all historical feedback; `v0.4.0`.

**Risk:** migration on prod data → snapshot export first (`firebase firestore:export` requires Blaze; on Spark, export via admin script to JSON before running).

---

## 4. Phase P3 — UI revamp: tokens, primitives, shell, existing screens (5 days) → `v0.5.0`

**Aligns with:** DESIGN_SYSTEM (all), COMPONENT_LIBRARY §2–3, RESPONSIVE (all), ARCHITECTURE §2 `components/`, `app/(marketing)`, `app/(app)`. **Prereq:** P2 (features/actions exist so new UI binds to stable contracts).

| PR | Branch | Scope | Procedure | Verify |
|---|---|---|---|---|
| 3.1 | `ui/tokens-and-fonts` | `styles/globals.css` (tokens §3, `--radius:0`, typography scale), `styles/fonts.ts` (`next/font`: Instrument Serif or Fraunces, Geist Sans/Mono), `app/layout.tsx` rewrite, `components.json` update | Keep legacy pages rendering (they will look wrong until 3.5) | Contrast checks on token pairs (AA); fonts self-hosted (no external requests) |
| 3.2 | `ui/primitives` | Import shadcn primitives listed in map §0.2; adapt (procedure COMPONENT_LIBRARY §2); `tech-chip`, `pagination`, `field`; `components/ui/motion/*`; `hooks/use-media-query`, `use-reduced-motion`; `app/(dev)/ui` gallery | Two commits per component: raw import, then adaptation | Gallery renders all states; axe on gallery; `rounded-` grep returns only `rounded-full` on avatar/dot |
| 3.3 | `ui/app-shell` | `components/layout/*` (sidebar `lg+`, bottom tabs `<lg`, topbar, `UserMenu`, `PageHeader`, `Panel`, `EmptyState`, `ErrorState`, `Stat`); `app/(app)/layout.tsx` (rename from `(root)`), `error.tsx`, `not-found.tsx`, `loading.tsx`; `nuqs` adapter; `middleware` matcher updated | Source shell from 21st.dev, adapt | Device matrix pass for the shell; keyboard nav through sidebar/tabs; focus ring visible |
| 3.4 | `ui/auth-pages` | `features/auth/components/*`, `(auth)` pages incl. reset + verify email (`server/mail` + Resend), password ≥ 8 rule client+server, `verified` gate before first interview | — | E2E: sign-up → verify (emulator link) → sign-in; 375/1440 screenshots |
| 3.5 | `ui/dashboard-profile-settings` | Rebuild dashboard (stats row incl. streak, interviews list on current data, no filler), profile (`ProfileForm` + avatar upload), settings (`DangerZone`); delete filler components, `api/news`, unused `public/` assets; interview detail/feedback pages get the new shell and primitives with **current** data (full rebuild in P4) | Copy per DESIGN_SYSTEM §8 | Anti-AI-look checklist §7 all clear; matrix pass; Lighthouse a11y ≥ 95 |
| 3.6 | `ui/marketing` | `app/(marketing)/{page,how-it-works,free}`, `robots.ts`, `sitemap.ts`, `opengraph-image.tsx`, `config/site.ts` metadata; landing shows real product screens (from 3.5), not illustrations | Static rendering; no auth calls | Lighthouse perf ≥ 90 mobile; SEO checks (title/desc/OG) |
| 3.7 | `test/responsive-a11y` | `tests/e2e/responsive.spec.ts` (375/768/1280 overflow assertion on dashboard, auth, profile, marketing), `tests/e2e/a11y.spec.ts` (axe), screenshot baselines | — | CI e2e job green |

**Exit criteria:** every existing screen is on the new system; no legacy component files remain except `Agent.tsx` (until P4); `v0.5.0`.

---

## 5. Phase P4 — Core product v2: interviews, attempts, text mode, feedback v2 (7 days) → `v0.6.0`

**Aligns with:** ARCHITECTURE §5 (attempts, feedback v2), §6 flows (create, take, feedback), ADR-0005 (Vapi removal), ADR-0009. **Prereq:** P3.

| PR | Branch | Scope | Procedure | Verify |
|---|---|---|---|---|
| 4.1 | `feat/interview-form` | `features/interview/components/{InterviewForm (3 steps + review),InterviewCard,InterviewList,QuestionList}`, `schema.ts`, `actions.ts#createInterview` (quota → `questions.v2` structured → cache by input hash → insert), `interviews/new` and `interviews/[id]` pages, visibility toggle, `nuqs` filters + cursor pagination | Prompt `questions.v2` adds category/difficulty/idealPoints per question | Unit: schema limits; integration: cache hit avoids LLM; e2e: create via form; matrix pass on the 3-step form (mobile stepper) |
| 4.2 | `feat/attempts-core` | `features/attempt/{actions,schema}.ts` (`startAttempt`, `appendTurn` idempotent by `turnId`, `completeAttempt`, `abandonAttempt`), `server/services/attempt.service.ts`, `server/voice/metrics.ts` (WPM, filler rate, talk ratio, response latency from transcript timestamps), `lib/text/fillers.ts`, `users.stats` transactional update | — | Unit: metrics on fixture transcripts; integration: replayed `appendTurn` is a no-op |
| 4.3 | `feat/text-session` | `SessionShell`, `TextSession` (AI SDK streaming via `features/attempt/actions.ts#streamTurn` or route), `QuestionStepper`, `SessionControls`, timer, resume-on-reload from server state, `turn.v2` prompt (persona-neutral) | Streaming through `server/llm/router.stream` | E2E: full text attempt; session fits 375×667 and 852×393 without scroll |
| 4.4 | `feat/feedback-v2` | `prompts/feedback.v2.ts` (per-question, evidence spans, model answers, next steps), `schemas/feedback.ts` v2, `server/services/feedback.service.ts` (idempotent per attempt), `features/feedback/components/{OverallScore,CategoryBars,PerQuestionAccordion,AnnotatedTranscript,NextSteps,Trend}`, `components/charts/ScoreTrend`, feedback page; `tests/evals/feedback/*.json` (10 transcripts, expected ranges) | Evals run before merge and recorded in PR | Evals within tolerance; screenshots; number-flow respects reduced motion |
| 4.5 | `feat/dashboard-v2` | Stats row from `users.stats`, `ScoreTrend` across attempts, recent attempts list, "next drill" panel from weakest category, quota panel (`UsageBars`) | — | Firestore reads per dashboard ≤ 6 (integration counts) |
| 4.6 | `chore/remove-vapi` | Delete `components/Agent.tsx`, `lib/vapi.sdk.ts`, `app/api/vapi`, `@vapi-ai/web`, `NEXT_PUBLIC_VAPI_*` from env schema/example, `interviewer` constant; interview detail "Start" offers Text now (Voice arrives in P5 behind a flag) | — | `knip` clean; build clean |
| 4.7 | `test/e2e-core-loop` | `tests/e2e/core-loop.spec.ts`: sign-up → verify → create → text attempt → feedback → retake creates second attempt → trend shows two points | Uses fake LLM provider via env `LLM_PROVIDER=fake` | CI green |

**Exit criteria:** complete loop without a microphone; attempts history and trend visible; Vapi gone; `v0.6.0`.

---

## 6. Phase P5 — Voice v2 on free tiers (7 days) → `v1.0.0`

**Aligns with:** TECH_STACK §2 voice architecture, ADR-0005, ARCHITECTURE `server/voice`, `hooks/`. **Prereq:** P4 (transcript pipeline exists; voice only produces turns).

| PR | Branch | Scope | Procedure | Verify |
|---|---|---|---|---|
| 5.1 | `feat/voice-session-api` | `server/voice/selectTier.ts`, `app/api/voice/session/route.ts` (requireUser, rate limit, quota, global concurrency in Redis, capability payload from client, returns `{tier, token?, expiresAt}`), `config/limits.ts` voice entries, `usage.liveSeconds` accounting on `completeAttempt` | — | Unit: tier selection matrix; integration: concurrency cap |
| 5.2 | `feat/voice-session-shell` | `VoiceSession` client shell: `PermissionPrompt`, AudioWorklet capture, `use-audio-level` (2 px meter), `Captions` (`aria-live`), `use-wake-lock`, barge-in state machine, landscape layout, tier badge, inline recovery ("Reconnect" / "Switch to text") | Build against a fake tier provider first | Matrix incl. 852×393; a11y: captions announced, mic state announced |
| 5.3 | `feat/voice-tier1-gemini-live` | `server/voice/geminiLive.ts` (ephemeral token), client WebSocket adapter, audio out via `AudioContext`, partial/final transcript → `appendTurn`, session end → `completeAttempt` | Feature flag `voice_tier1` | Manual on Chrome desktop, Android Chrome, iOS Safari; TTFA logged < 1 s p50 |
| 5.4 | `feat/voice-tier2-browser` | `hooks/use-speech-recognition` (Web Speech API), `hooks/use-speech-synthesis`, turn loop reusing `streamTurn`, voice selection UI | Flag `voice_tier2` | Works on Chrome/Edge/Safari; Firefox → whisper fallback or text (5.5) |
| 5.5 | `feat/voice-hd-and-whisper` | `kokoro-js` HD voice opt-in (lazy chunk, cached model, WebGPU detection), `@huggingface/transformers` Whisper-tiny worker STT fallback | Flag `voice_hd` | Session JS budget respected (lazy chunks excluded); reduced-motion unaffected |
| 5.6 | `feat/voice-downgrade-ux` | Quota exhausted / unsupported / mid-session failure → next tier with an inline explanation and reset time; prefs `voiceTier` in settings | — | E2E with forced failures at each tier |
| 5.7 | `feat/recording-optin-and-cron` | Opt-in chunked recording upload to storage, playback synced to transcript on feedback page, `app/api/cron/cleanup-recordings` (30-day) + `.github/workflows/cron.yml` (GitHub Actions schedule, `CRON_SECRET`) | Consent copy in session start | Integration: cleanup deletes only expired; signed cron rejects bad secret |
| 5.8 | `test/voice-contracts-latency` | `tests/unit/contracts/{stt,tts}.contract.ts`, e2e with fake providers, PostHog latency events (`voice_first_audio_ms`, `voice_turn_roundtrip_ms`) | — | CI green; dashboard in PostHog |

**Exit criteria:** voice on Chrome desktop, Android Chrome, iOS Safari (tier 1 or 2), clean degradation, quotas enforced; `v1.0.0`.

---

## 7. Phase P6 — Personalisation (6 days) → `v1.1.0`

**Aligns with:** ANALYSIS §3.1, ARCHITECTURE `features/resume`, `server/llm/packs`, `features/assistant`. **Prereq:** P4 (P5 optional).

| PR | Branch | Scope | Verify |
|---|---|---|---|
| 6.1 | `feat/resume-upload` | `features/resume/{components/ResumeDropzone,ResumeSummary,actions,schema}`, presigned upload (5 MB, PDF magic bytes), `unpdf` extraction, `prompts/resume.v1` → `ResumeProfile` schema, `users/{uid}/resumes` | Injection test: resume containing instructions does not alter prompts; 375 px dropzone usable |
| 6.2 | `feat/jd-and-question-gen-v3` | JD paste field in `InterviewForm`, `prompts/questions.v3` consuming resume + JD + pack, `server/llm/packs/{generic,google,amazon,meta,startup}.ts` (data only), `interviews.source` values | Evals: relevance rubric on 10 (resume, JD) pairs |
| 6.3 | `feat/interviewer-personas` | Pack persona in `turn.v3` (tone, follow-up depth), persona chip in session | Manual review of 3 packs |
| 6.4 | `feat/targets-and-readiness` | Profile fields (targetRole/companies/date), `server/services/readiness.service.ts`, dashboard countdown + readiness score | Unit: readiness formula |
| 6.5 | `feat/assistant` | `features/assistant/AssistantPanel` (sheet on mobile), streamed, read-only tools scoped to the user (`listAttempts`, `getFeedback`), rate-limited | Security test: tool cannot read another user; matrix pass |
| 6.6 | `test/personalisation-evals` | Eval suites for 6.1/6.2, prompt-injection corpus | CI green |

---

## 8. Phase P7 — Learning loop and new modes (8 days) → `v1.2.0`

**Prereq:** P6.

| PR | Branch | Scope |
|---|---|---|
| 7.1 | `feat/skills-and-drills` | Skill model per category, SRS queue of weak questions, `app/(app)/plan/drill` (10-minute drill, text or voice) |
| 7.2 | `feat/study-plan` | `studyPlans/{uid}` generator tied to target date, progress UI |
| 7.3 | `feat/question-bank` | `questionBank` seed + tags, `minisearch`, contribute flow, moderation queue (admin claim) |
| 7.4 | `feat/coding-mode` | `@monaco-editor/react` (lazy), Piston runner adapter (`server/code/piston.ts`, rate-limited), AI review of approach/complexity, `attempts.mode = coding` |
| 7.5 | `feat/system-design-mode` | tldraw/Excalidraw canvas (lazy), AI probing prompts, canvas PNG export to storage |
| 7.6 | `feat/video-mode-flag` | Camera preview + on-device delivery metrics only (no upload), behind `video_mode` flag |

Each PR: schema + repo + service + feature components + tests + docs, same procedure as P4.

---

## 9. Phase P8 — Growth and polish (ongoing) → `v1.3+`

| PR | Branch | Scope |
|---|---|---|
| 8.1 | `feat/google-oauth` | Firebase Google provider, account linking, allow-listed redirects |
| 8.2 | `feat/share-report` | Signed, expiring read-only feedback page; OG image per report |
| 8.3 | `feat/weekly-digest` | Opt-in Resend digest via `cron.yml` |
| 8.4 | `feat/pwa` | `manifest.ts`, icons, offline shell, install prompt |
| 8.5 | `feat/light-theme-i18n` | Light tokens (DESIGN_SYSTEM §3.2), `next-intl` scaffold, one extra locale |
| 8.6 | `feat/admin-console` | `role=admin` claim, usage vs quota (`UsageBars`), moderation, flags |
| 8.7 | `chore/lighthouse-ci-budgets` | Lighthouse CI in workflow with QUALITY §2 budgets enforced |

---

## 10. Dependency graph

```
P0 ─► P1 ─► P2 ─► P3 ─► P4 ─► P5 ─► P7
                          │      └──► P6 ─► P7
                          └──► P8 (8.1, 8.4, 8.5, 8.7 can start after P3; 8.2, 8.3, 8.6 after P4)
```

Parallelism inside a phase: P3.6 ∥ P3.5; P4.1 ∥ P4.2; P5.4 ∥ P5.3; P6.4 ∥ P6.5.

Indicative timeline: P0–P2 ≈ 2 weeks · P3 ≈ 1 week · P4 ≈ 1.5 weeks · P5 ≈ 1.5 weeks · P6 ≈ 1 week · P7 ≈ 2 weeks. **≈ 9–10 weeks to v1.2** with one engineer + agent.

---

## 11. Architecture alignment matrix

| ARCHITECTURE.md section | Satisfied by |
|---|---|
| §1 Principles (thin edges, inward deps, interfaces, server-first, canonical transcript) | P2.1–2.4 (layers), P2.3 (interfaces), P4.2 (transcript) |
| §2 Folder layout | P2 (server/, features/, config/), P3 (components/, app groups), P5 (hooks/voice) |
| §3 Contracts (`Result`, intent-named repos, DI factories) | P2.1, P2.2, P2.3 |
| §4 SOLID rules | Enforced from P2.4 by lint layer rules; contract tests P2.3/P5.8 |
| §5 Data model v2 | P2.5 (attempts, stats, logins, usage), P4.1 (questions v2 fields), P6.1 (resumes), P7 (bank, plans) |
| §6 Flows | Create: P4.1 · Take: P4.2–4.3 (text), P5 (voice) · Feedback: P4.4 |
| §7 Cross-cutting (proxy, caching, errors, observability, flags) | P1.1, P1.2, P1.6, P2.1, P3.3, P4.1 (generation cache) |

---

## 12. Procedure for every PR (unchanged, restated)

1. Branch from `main`; name per the table.
2. Read the linked docs sections **and the `docs/RISKS.md` rows for this phase (§13)**; write/adjust tests first where practical.
3. Implement; run `pnpm typecheck && pnpm lint && pnpm test` (+ integration/e2e when touched).
4. UI: verify device matrix, attach 375/1440 screenshots, tick DESIGN_SYSTEM §7. Server: tick SECURITY §3.
5. Update docs + `CHANGELOG.md`; add ADR if GUARDRAILS E3 applies.
6. Open PR with template; squash-merge on green CI.
7. At phase exit: run QUALITY §5 release checklist; tag.

---

## 13. Watch-list cross-reference (`docs/RISKS.md`)

Read these rows before starting the phase; link them in the PR that closes them.

| Phase / PR | Rows |
|---|---|
| First commit | R25 (stray edits), R20 (`.env.example` ignore) |
| P0.1 | R19 (line endings), R6 (CI/hooks red until P0.5) |
| P0.4 | R7 (major upgrades last, one family per commit), R12 (keep Vapi) |
| P0.5 | R6 (branch protection only after green) |
| P1.1 | **R1 (cookie leak — urgent; revoke all sessions after deploy)**, R22 |
| P1.2 | R9 (CSP report-only first) |
| P1.3 | R17 (`!=` + `orderBy` query) |
| P1.4 | **R2 (open endpoints)**, R12 |
| P1.5 | R3 (verify Upstash limits) |
| P2.3 | R3 (Gemini/Groq limits), R24 (global daily caps), **R27 (model-availability contract test, 429 fallback)** |
| P2.5 | **R8 (prod migration procedure)** |
| P2.6 | R4 (R2 card check → Supabase fallback), R5 (never Firebase Storage), R9 (CSP domains) |
| P3 start | **R10 (do not start before P2 exit)** |
| Every P3+ UI PR | R18 (de-round/de-gradient gate) |
| P4.1 | R24 (generation cache) |
| P4.5 | R21 (quota reset time visible) |
| P4.6 | R12 (Vapi removal only now) |
| P5 start | **R11 (text mode e2e green first)** |
| P5.1 → P5.3 | **R13 (global cap before Tier 1 flag)** |
| P5.2, P5.4 | R14 (iOS Safari, Firefox early) |
| P5.3 | R9 (WebSocket in CSP) |
| P5.5 | R15 (HD voice opt-in only) |
| P6.1, P6.2 | **R16 (prompt injection tests)** |
| Every phase exit | Standing rows R5, R10, R11, R18, R23 |
