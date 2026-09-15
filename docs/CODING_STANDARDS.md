# Coding Standards

## 1. Language and tooling

- TypeScript `strict` plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noFallthroughCasesInSwitch`. Target ES2022.
- ESLint flat config: `next/core-web-vitals`, `@typescript-eslint/strict-type-checked`, `jsx-a11y/strict`, `import/order` (alphabetised groups: builtin → external → `@/config` → `@/server` → `@/features` → `@/components` → relative), `no-restricted-imports` to enforce layer direction, `no-console` (error; use logger), `@typescript-eslint/no-explicit-any` (error), `@typescript-eslint/no-non-null-assertion` (error).
- Prettier with `prettier-plugin-tailwindcss` (class sorting). 2-space indent, semicolons, double quotes, trailing commas, print width 100.
- `pnpm` with `--frozen-lockfile` in CI. Node LTS pinned in `.nvmrc` / `package.json#engines`.
- Path alias `@/*` only; no `../../..`.

## 2. Naming

| Thing | Convention | Example |
|---|---|---|
| Files: components | `PascalCase.tsx` | `InterviewCard.tsx` |
| Files: everything else | `kebab-case.ts` | `attempt.service.ts`, `use-speech-recognition.ts` |
| Server actions | verb-first, in `actions.ts` | `createInterview`, `appendTurn` |
| Repositories | `<collection>.repo.ts`, intent-named methods | `attempts.repo.findForUser` |
| Zod schemas | `<Thing>Schema`, inferred type `<Thing>` | `CreateInterviewSchema`, `CreateInterview` |
| Hooks | `use<Thing>` | `useWakeLock` |
| Booleans | `is/has/can/should` | `isSpeaking` |
| Constants | `UPPER_SNAKE` in `config/`, `camelCase` elsewhere | `MAX_TECHSTACK_ITEMS` |
| Events (analytics) | `object_verb` snake | `attempt_completed` |
| Error codes | `UPPER_SNAKE` enum | `QUOTA_EXCEEDED` |

## 3. Components

- Server component by default. Add `"use client"` only to the leaf that needs state/effects/browser APIs. Never mark a page or layout as client.
- Props: explicit interface named `<Component>Props`, exported. No spreading unknown props onto DOM elements except in `components/ui` primitives (which forward `...props` intentionally).
- Composition over configuration: `<Panel><Panel.Header/><Panel.Body/></Panel>` rather than `<Panel title body footer/>`.
- Variants with `cva`; class merging with `cn()`; no inline `style` except for values computed at runtime (mic level).
- No data fetching in `useEffect`. Server components fetch; client components receive data or call server actions via `next-safe-action`'s `useAction`.
- Derive state; do not mirror props into state. Keep component state local; lift only when shared. No global state library unless an ADR justifies it.
- Every list has a stable `key` (document id), never the index.
- Accessibility: semantic elements first; `aria-*` only when semantics are insufficient; every icon-only button has `aria-label`; focus management on dialog open/close and route change.

## 4. Server code

- **Action skeleton** (via `next-safe-action` client with auth + rate-limit middleware):
  ```ts
  export const createInterview = authAction
    .metadata({ name: "createInterview", rateLimit: "interview.create" })
    .schema(CreateInterviewSchema)
    .action(async ({ parsedInput, ctx }) => interviewService.create(ctx.user, parsedInput));
  ```
- **Service**: pure orchestration, receives dependencies (repos, providers) via a factory or parameters; returns `Result`. No Next.js imports.
- **Repository**: the only place `firebase-admin` Firestore is touched. Uses typed converters; validates on read with zod in dev/test (`parse`) and `safeParse` + log in prod.
- **Errors**: `AppError` with `code`, `message` (user-safe), `cause`, `meta`. Map vendor errors to `AppError` at the adapter boundary. Never `throw` strings.
- **Idempotency**: mutating actions that can be retried (append turn, generate feedback, confirm upload) accept an idempotency key or derive one and are safe to replay.
- **Transactions** for denormalised counters (`users.stats`, `usage`).
- **Time**: store ISO strings in UTC; compute "today" in the user's timezone (stored in prefs) for streaks.
- **Logging**: `logger.info({ op, userId, durationMs, ...safeFields }, "message")`. No string interpolation of objects; no PII.

## 5. Reuse rules

- Before writing a helper, search `lib/` and `hooks/`. Before writing a query, search `server/db/repositories`.
- A pattern used twice becomes a primitive or a helper in the same PR (rule of two, not three — the codebase is small enough to keep clean).
- Shared zod schemas live once in `features/<x>/schema.ts` and are imported by both client forms and server actions.
- Prompt text lives in `server/llm/prompts/*.vN.ts` with a `version` export; changing a prompt creates a new version file, and the version is stored on the produced document.

## 6. Testing (see `docs/QUALITY.md` for budgets)

- Unit (`vitest`): `lib/`, `server/services` with fakes, `server/llm/prompts` builders, schema edge cases. Co-located `*.test.ts`.
- Integration: repositories against the Firestore emulator (`tests/integration`).
- Contract tests: every provider adapter passes `tests/unit/contracts/<interface>.contract.ts`.
- E2E (`playwright`): sign-up → create interview (form) → text-mode attempt → feedback; responsive overflow checks; a11y scan (`@axe-core/playwright`) on key pages.
- Evals: `tests/evals/feedback/` holds transcripts with expected score ranges; run on prompt changes.

## 7. Git

- Branch `type/scope-description`. Rebase on `main` before PR; squash-merge.
- Conventional Commits; scope is the feature (`feat(attempt): add barge-in`). Breaking changes flagged with `!`.
- PR ≤ ~400 lines of diff where possible; split otherwise. One reviewer minimum (self-review checklist counts for solo work but must be filled honestly).

## 8. Documentation

- Every `server/*` module has a 3–5 line header comment: purpose, invariants, links to ADR.
- Public functions have JSDoc when the name and types do not fully explain behaviour (especially quotas, idempotency, side effects).
- `docs/` is updated in the same PR as the behaviour change. ADR for anything in `docs/GUARDRAILS.md` E3.
