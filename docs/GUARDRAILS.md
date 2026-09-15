# Guardrails

Hard rules. A change that violates any of these is not mergeable, regardless of how useful it is. If a rule blocks a task, raise it in the PR or an ADR — do not work around it.

## A. Cost

| # | Rule |
|---|---|
| A1 | Only services listed as **Approved** in `docs/TECH_STACK.md` may be used. Each has a documented free tier and a quota guard. |
| A2 | No service that requires a card on file to reach the features we use. |
| A3 | Every external call (LLM, STT, TTS, email, storage) goes through a `server/` adapter that records usage to `usage/{uid}/{yyyy-mm}` and enforces the per-user quota in `config/plans.ts`. Direct SDK calls from features or components are forbidden. |
| A4 | Provider fallback order is configuration (`config/providers.ts`), never hard-coded. When a free quota is exhausted the app degrades (e.g. voice → text mode) rather than failing. |
| A5 | New dependencies: check licence (MIT/Apache/BSD/ISC only), gzip size (< 30 kB for client code unless justified in an ADR), maintenance (commit in last 6 months). |

## B. Security

| # | Rule |
|---|---|
| B1 | Every server action and route handler starts with `const user = await requireUser()` (or `requireWebhookSignature()` for webhooks). Anonymous endpoints are enumerated in `docs/SECURITY.md` §4 and nowhere else. |
| B2 | All input crosses the boundary through a zod schema. `request.json()` and `formData` are never used raw. |
| B3 | Ownership is checked server-side on every read/write of user data (`doc.userId === user.id`). Client-supplied `userId` is never trusted. |
| B4 | Secrets are read only via `config/env.ts`. `process.env` is not referenced anywhere else. `NEXT_PUBLIC_` is used only for values that are safe to ship to the browser. |
| B5 | Logging: never log cookies, tokens, emails, transcripts, resumes, or full request bodies. Use the structured logger with explicit fields. |
| B6 | Firestore client SDK is not used for data access. `firestore.rules` is deny-all for clients and is versioned in the repo. |
| B7 | Rate limits on: auth, interview creation, attempt start, feedback generation, uploads, chat. Limits live in `config/limits.ts`. |
| B8 | Security headers (CSP, HSTS, frame-ancestors, referrer-policy, permissions-policy) are set in `next.config.ts` and tested. |
| B9 | Uploads: whitelist MIME + magic bytes, size cap, virus-safe parsing (PDF text extraction only, no rendering of user files server-side without sandboxing). |
| B10 | `next.config.ts` never sets `ignoreBuildErrors` or `ignoreDuringBuilds`. `npm audit --audit-level=high` must be clean. |

## C. Architecture and code

| # | Rule |
|---|---|
| C1 | Layers: `app` → `features` → `server` → vendors. Imports only flow downward. `server/` never imports React. `components/ui` never imports from `features` or `server`. |
| C2 | Business logic lives in `server/services` and `server/db` repositories. Route handlers and server actions are ≤ 30 lines: auth → validate → call service → map result. |
| C3 | Vendor SDKs are wrapped behind an interface (`LLMProvider`, `SpeechToText`, `TextToSpeech`, `ObjectStorage`, `Mailer`). Features depend on the interface. |
| C4 | Server actions return `Result<T, AppError>`; they never throw to the client and never return raw vendor errors. |
| C5 | No duplicated fetch/query logic. If two call sites need the same data, it becomes a repository method. |
| C6 | Global ambient types (`.d.ts` without exports) are forbidden. Types are exported from the feature or `server/db/types.ts`. |
| C7 | `any` and non-null assertions (`!`) are lint errors. Narrow explicitly. |
| C8 | Components: presentational primitives in `components/ui`, composed feature components in `features/*/components`. Server components by default; `"use client"` only at the leaf that needs interactivity. |
| C9 | No `useEffect` for data fetching. Data comes from server components, server actions, or route handlers with explicit caching. |
| C10 | Tests accompany: every `lib/` function, every repository method (emulator), every service with branching logic, and every critical user flow (e2e). |

## D. Design and UX

| # | Rule |
|---|---|
| D1 | Border radius is `0` on cards, panels, inputs, buttons, tables, and dialogs. Only avatars and status dots may be round. Token: `--radius: 0`. |
| D2 | Palette: the tokens in `docs/DESIGN_SYSTEM.md` §3 only. No purple/blue gradients, no gradient text, no glow shadows, no glassmorphism blur panels. |
| D3 | No emoji in UI text. No decorative stock "robot"/"AI" imagery. No rotating quotes, live clocks, or other filler widgets. |
| D4 | Copy is specific and short. Banned phrases list in `docs/DESIGN_SYSTEM.md` §7. |
| D5 | Motion is purposeful (enter/exit, layout shift, value change), 120–300 ms, and respects `prefers-reduced-motion`. No infinite bounce/pulse/ping on static elements. |
| D6 | Every screen ships with real empty, loading (layout-matching skeleton), and error states. |
| D7 | Every interactive element is keyboard reachable, has a visible focus ring, and a ≥ 44 × 44 px touch target on mobile. |
| D8 | Every screen is verified on the device matrix in `docs/RESPONSIVE.md`. No fixed pixel widths on layout containers. |

## E. Process

| # | Rule |
|---|---|
| E1 | `main` is protected; changes land via PR with green CI and the PR template completed. |
| E2 | Conventional Commits. No `wip`, `asdf`, `fix stuff` messages. |
| E3 | Any change to architecture, vendor, data model, or design tokens gets an ADR in `docs/decisions/` in the same PR. |
| E4 | Documentation is part of the change. Stale docs are bugs. |
| E5 | No feature ships without its analytics event(s) and an error boundary. |
