# Changelog

All notable changes to this project are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [SemVer](https://semver.org/).

## [Unreleased]

### Added
- Engineering handbook: `AGENTS.md`, `CONTRIBUTING.md`, `PROCESS.md`, `SECURITY.md`, and `docs/` (guardrails, architecture, tech stack, security, design system, component library, responsive rules, coding standards, quality, implementation plan, milestones execution plan with legacy → target migration map, risk register/watch-list, ADRs 0001–0010).
- GitHub templates (issues, PR), `CODEOWNERS`, CI workflow, `lefthook.yml`, `.env.example`.

- Toolchain (PR 0.1): pnpm 10, strict type-aware ESLint with layer rules, Prettier, lefthook hooks, commitlint, `.gitattributes`, `.nvmrc`, VS Code settings.

### Changed
- README rewritten to describe the product, stack, and how to work in the repo.
- Legacy code brought to lint-clean under the strict config (356 violations → 0).

### Fixed
- Profile update always returned 500 (`cookies()` not awaited).
- Duplicate object keys in `DisplayTechIcons`; stateful `/g` regex in `InterviewCard`; `signIn` returned nothing on success; conflicting `AgentProps` definitions.

### Security
- Removed the server log that printed the raw session cookie and decoded claims (RISKS R1).
- `/api/vapi/generate` no longer echoes internal errors to the client and rejects malformed bodies (full auth + zod lands in P1.4).

## [0.1.0] — 2025-09

Initial prototype: Firebase auth, Vapi voice interviews, Gemini feedback, dashboard widgets. Superseded by the plan in `docs/IMPLEMENTATION_PLAN.md`.
