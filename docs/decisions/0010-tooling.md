# 0010. pnpm + lefthook + Conventional Commits

- **Status:** Accepted
- **Date:** 2026-09-15
- **Deciders:** Jeston Singh

## Context
The repo uses npm, has no git hooks, no CI, and commit messages such as `asdda`.

## Decision
pnpm (strict, fast), lefthook for git hooks (pre-commit: lint/format/gitleaks on staged files; commit-msg: commitlint; pre-push: typecheck + unit tests), Conventional Commits, squash-merge to a protected `main`, GitHub Actions CI. This mirrors the conventions of the GitLab repository itself (lefthook, process docs at the root, ADR-style decision records under `docs/`).

## Consequences
- Slightly slower commits; far higher signal in history; automated changelog becomes possible.

## Alternatives considered
- Husky + lint-staged: works, but lefthook is faster and a single binary — rejected.
