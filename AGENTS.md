<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — Operating manual for JustPrep

This file is the single entry point for any engineer or AI agent working in this repository. Read it fully before touching code. It is intentionally short; it links to the authoritative documents in `docs/`.

## 1. What this project is

JustPrep is an AI mock-interview platform: users create an interview (role, level, stack, company), take it in **text or voice**, and receive detailed, per-question feedback that changes how they perform. The bar is "world-class product built entirely on free-tier infrastructure". Both halves of that sentence are hard constraints.

Current state and the full audit: `docs/ANALYSIS_AND_ROADMAP.md`. Step-by-step build order: `docs/IMPLEMENTATION_PLAN.md`; PR-level execution plan and file migration map: `docs/MILESTONES.md`.

## 2. Non-negotiables (read `docs/GUARDRAILS.md` for the full list)

1. **Free-only stack.** No service that requires a paid plan or a card on file for the features we use. Approved services and their limits: `docs/TECH_STACK.md`. Adding a new vendor requires an ADR in `docs/decisions/`.
2. **Security is a feature, not a phase.** Every server action and route handler authenticates via `requireUser()` and validates input with zod. No exceptions, no "temporary" endpoints. Details: `docs/SECURITY.md`.
3. **Type-safe, lint-clean, tested.** `next.config` must never set `ignoreBuildErrors` or `ignoreDuringBuilds`. CI must be green to merge.
4. **Design language is fixed.** Edged (0-radius) surfaces, monochrome + one accent, real copy, purposeful motion. The "does this look AI-generated?" checklist in `docs/DESIGN_SYSTEM.md` §7 is a merge gate.
5. **Responsive on every device.** Mobile-first; every screen is verified against the device matrix in `docs/RESPONSIVE.md` before merge.
6. **SOLID + reuse.** Business logic lives in `server/` services and repositories, never in components or route handlers. Components compose primitives from `components/ui/`; never fork a primitive. `docs/CODING_STANDARDS.md`.
7. **No secrets in code or logs.** Never log tokens, cookies, emails, transcripts. Env access only via `config/env.ts`.

## 3. Repository map (target — see `docs/ARCHITECTURE.md`)

```
app/            Next.js App Router: (marketing) public · (auth) · (app) authenticated · api/ webhooks+health
features/       One folder per product capability (interview, attempt, feedback, auth, profile, study-plan…)
components/ui/  Design-system primitives (shadcn + 21st.dev, adapted to our tokens). Presentational only.
server/         auth/ · db/ (repositories) · llm/ · voice/ · storage/ · observability/ — no React here
config/         env.ts (validated), plans/quotas, feature flags, site metadata
lib/            Pure, framework-free utilities with unit tests
hooks/          Reusable client hooks
tests/          unit · integration (Firestore emulator) · e2e (Playwright)
docs/           Handbook: architecture, standards, security, design, decisions (ADRs)
.github/        CI workflows, issue and PR templates, CODEOWNERS
```

## 4. How to work

- **Before starting a task**: read the relevant `docs/` page and the ADRs it references. Check `docs/MILESTONES.md` for where the task sits and what it depends on, and **read the `docs/RISKS.md` rows tagged for that phase** (MILESTONES §13). A PR that closes a risk row says so (`Closes R7`) and updates the row's status.
- **Branching**: `main` and `dev` are protected. Cut work branches from the current `milestone/p<N>-<name>` branch as `type/short-description` (`feat/text-interview-mode`, `fix/profile-cookie-await`) and PR back into it. Promotion is `milestone/* → dev → main`, each by PR with green CI (`PROCESS.md`). One concern per branch.
- **Commits**: Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `perf:`, `security:`). Imperative mood, ≤ 72 chars subject, body explains *why*.
- **Pull requests**: use the template. Include screenshots for UI at 375 px and 1440 px minimum. Link the plan item or issue. Self-review the diff before requesting review.
- **Definition of done** (all required):
  - `pnpm typecheck && pnpm lint && pnpm test` pass locally.
  - New server code has auth + validation + a test.
  - New UI passes the responsive matrix and the anti-AI-look checklist.
  - Docs updated if behaviour, config, or architecture changed.
  - No new `console.log`; use the logger.
  - No new dependency without checking `docs/TECH_STACK.md` (licence, bundle size, free tier).

## 5. Commands (once Phase 0 of `docs/MILESTONES.md` is merged)

```
pnpm dev            # local dev with Firebase emulators
pnpm typecheck      # tsc --noEmit
pnpm lint           # eslint + prettier check
pnpm test           # vitest
pnpm test:e2e       # playwright
pnpm build          # production build (must be clean)
pnpm audit          # dependency vulnerabilities (must be clean of high/critical)
```

## 6. For AI agents specifically

- Do not invent APIs, model names, or free-tier limits — check `docs/TECH_STACK.md` or the vendor docs, and say when something is unverified.
- Prefer editing an existing module over creating a parallel one. Search first (`features/`, `server/`, `components/ui/`).
- When a task conflicts with a guardrail, stop and surface the conflict; do not work around it.
- Never disable a lint rule, a type check, a test, or a security control to make a task pass.
- Never commit `.env*`, service-account keys, or generated secrets. `.env.example` is the only env file in git.
- When finished, report what was verified (commands run, devices checked), not just what was written.

## 7. Where to look

| Need | Document |
|---|---|
| Current bugs, security findings, product gaps | `docs/ANALYSIS_AND_ROADMAP.md` |
| What to build next, in order | `docs/IMPLEMENTATION_PLAN.md` |
| Per-phase PR breakdown, legacy → target file map, exit criteria | `docs/MILESTONES.md` |
| Known warnings, per-phase watch-list, mitigation procedures | `docs/RISKS.md` |
| Hard rules | `docs/GUARDRAILS.md` |
| Folder layout, layers, SOLID mapping | `docs/ARCHITECTURE.md` |
| Code style, patterns, naming | `docs/CODING_STANDARDS.md` |
| Approved services, free-tier limits, replacements for paid tools | `docs/TECH_STACK.md` |
| Threat model and controls | `docs/SECURITY.md` |
| Visual language, tokens, motion, anti-AI-look checklist | `docs/DESIGN_SYSTEM.md` |
| Component sourcing (shadcn, 21st.dev, Motion) | `docs/COMPONENT_LIBRARY.md` |
| Device matrix and responsive rules | `docs/RESPONSIVE.md` |
| Testing, performance, accessibility budgets | `docs/QUALITY.md` |
| Why we chose X | `docs/decisions/` |
| How to contribute, review, release | `CONTRIBUTING.md`, `PROCESS.md` |
