## Summary

<!-- What changes and why. Link the plan item: docs/IMPLEMENTATION_PLAN.md Phase N step M, or an issue. -->

Closes #

## Type

- [ ] feat  - [ ] fix  - [ ] security  - [ ] refactor  - [ ] ui  - [ ] docs  - [ ] chore  - [ ] test

## Verification

<!-- Commands run and results. Devices checked. -->

- [ ] `pnpm typecheck` `pnpm lint` `pnpm test` pass locally
- [ ] Integration/e2e run (if touched): …
- [ ] Manual check: …

## Server checklist (delete if no server changes)

- [ ] `requireUser()` / signature check first
- [ ] zod validation with limits on every input
- [ ] Ownership enforced in repository call
- [ ] Rate limit / quota applied
- [ ] No `process.env` outside `config/env.ts`
- [ ] No PII in logs, analytics, or error messages
- [ ] Vendor call goes through a `server/*` adapter with usage logging
- [ ] Tests for unauthenticated and wrong-owner cases

## UI checklist (delete if no UI changes)

- [ ] Screenshots attached at **375 px** and **1440 px**
- [ ] Device matrix pass (`docs/RESPONSIVE.md` §2) — list devices checked
- [ ] Anti-AI-look checklist (`docs/DESIGN_SYSTEM.md` §7) passes
- [ ] Radius 0 on all surfaces; tokens only; no gradients/glow/emoji
- [ ] Empty / loading / error states present
- [ ] Keyboard reachable, focus visible, touch targets ≥ 44 px on mobile
- [ ] `prefers-reduced-motion` honoured

## Risk watch-list

<!-- docs/RISKS.md rows for this phase (see docs/MILESTONES.md §13). -->

- [ ] Rows checked: R__, R__
- [ ] Rows closed by this PR (status updated in docs/RISKS.md): …

## Docs

- [ ] Docs updated (which): …
- [ ] ADR added if architecture / vendor / data model / tokens changed
- [ ] `CHANGELOG.md` entry under Unreleased
