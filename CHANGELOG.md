# Changelog

All notable changes to this project are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [SemVer](https://semver.org/).

## [Unreleased]

### Added
- Engineering handbook: `AGENTS.md`, `CONTRIBUTING.md`, `PROCESS.md`, `SECURITY.md`, and `docs/` (guardrails, architecture, tech stack, security, design system, component library, responsive rules, coding standards, quality, implementation plan, milestones execution plan with legacy → target migration map, risk register/watch-list, ADRs 0001–0010).
- GitHub templates (issues, PR), `CODEOWNERS`, CI workflow, `lefthook.yml`, `.env.example`.

- Toolchain (PR 0.1): pnpm 10, strict type-aware ESLint with layer rules, Prettier, lefthook hooks, commitlint, `.gitattributes`, `.nvmrc`, VS Code settings.
- Strict TypeScript flags; production build fails on type or lint errors (PR 0.2).
- `config/env.ts` — validated environment, the only `process.env` reader, lint-enforced (PR 0.3).
- Test pipeline (PR 0.5): vitest with coverage thresholds, Playwright at 375/768/1280 on a production build with horizontal-overflow assertions, size-limit ratchet, Firebase emulator config, first unit/e2e tests. CI fully green.
- Branching model: `milestone/* → dev → main` with a promotion-guard workflow and branch protection (`scripts/github/protect-branches.sh`).

### Changed
- README rewritten to describe the product, stack, and how to work in the repo.
- Legacy code brought to lint-clean under the strict config (356 violations → 0).
- Dependencies (PR 0.4): Next 15.3 → 16.3 (Turbopack default, native flat ESLint config), React 19.3, AI SDK 4 → 7 with `@ai-sdk/google` 4 (`generateText` + `Output.object`, `createGoogle`), zod 3 → 4, firebase 12, firebase-admin 14. `pnpm audit`: 27 findings → 0. ESLint 10 and TypeScript 7 deferred until plugin peer ranges allow.
- Dead dependencies and files removed (`pdfjs-dist`, `next-themes`, `lucide-react`, `@radix-ui/react-label`, `tailwindcss-animate`, unused shadcn primitives) — `knip` is clean.
- Firebase Admin initialised lazily so secret-less CI builds succeed.
- `/api/news` reduced to an empty stub (it only ever served fabricated articles); widget removed in P3.5.

### Fixed
- Profile update always returned 500 (`cookies()` not awaited).
- Duplicate object keys in `DisplayTechIcons`; stateful `/g` regex in `InterviewCard`; `signIn` returned nothing on success; conflicting `AgentProps` definitions.

### Security
- Removed the server log that printed the raw session cookie and decoded claims (RISKS R1).
- `/api/vapi/generate` no longer echoes internal errors to the client and rejects malformed bodies (full auth + zod lands in P1.4).

## [0.1.0] — 2025-09

Initial prototype: Firebase auth, Vapi voice interviews, Gemini feedback, dashboard widgets. Superseded by the plan in `docs/IMPLEMENTATION_PLAN.md`.
