# Contributing

Thanks for working on JustPrep. Start with `AGENTS.md`, then the documents it links. This page covers the mechanics.

## Setup

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local       # fill in values (see comments)
pnpm dlx firebase-tools emulators:start --only auth,firestore   # in a second terminal
pnpm dev
```

`lefthook install` runs automatically on `pnpm install` and enables the git hooks.

Optional but recommended: install the [gitleaks](https://github.com/gitleaks/gitleaks) binary (`winget install gitleaks` / `scoop install gitleaks` / `brew install gitleaks`) so secrets are caught at commit time; CI runs it on every push either way.

If a globally installed older `pnpm` shadows the pinned version, run commands through `corepack pnpm …` or upgrade the global install.

## Branches and commits

- Branch from `main`: `feat/…`, `fix/…`, `refactor/…`, `docs/…`, `chore/…`, `security/…`.
- Conventional Commits. Examples:
  - `feat(attempt): stream interviewer turns in text mode`
  - `fix(auth): await cookies() in profile update`
  - `security(api): require session on /api/voice/session`
- Keep PRs small (≈ ≤ 400 changed lines). Split UI and server changes when practical.

## Pull requests

1. Fill in every section of the PR template. Empty sections block review.
2. CI must be green: lint, typecheck, unit, integration (emulator), e2e (critical), build, audit, gitleaks.
3. UI changes: attach screenshots at 375 px and 1440 px; confirm the device matrix in `docs/RESPONSIVE.md`; tick the anti-AI-look checklist from `docs/DESIGN_SYSTEM.md` §7.
4. Server changes: tick the checklist in `docs/SECURITY.md` §3.
5. Architecture, vendor, data-model, or token changes: include an ADR in `docs/decisions/`.
6. Update docs in the same PR. Add a `CHANGELOG.md` entry under *Unreleased*.
7. Squash-merge once approved.

## Code review standards

Reviewers check, in order: security → correctness → tests → design-system conformance → responsiveness → readability. Style nits are handled by tooling, not comments.

## Reporting bugs and proposing features

Use the issue templates in `.github/ISSUE_TEMPLATE/`. Security issues: see `SECURITY.md` (do not open a public issue).
