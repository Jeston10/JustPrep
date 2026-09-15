# Process

How work flows through this repository, modelled on GitLab's engineering process at small scale.

## Branching and promotion

```
chore/… feat/… fix/… security/…      one PR each
        │  PR (CI green, template complete)
        ▼
milestone/p<N>-<name>                 one per phase in docs/MILESTONES.md; created from dev
        │  PR when the phase exit criteria are met (CI green on the milestone branch)
        ▼
dev                                   integration; deployed to the preview environment; soak-tested
        │  PR only from dev (promotion guard) with CI green; squash or merge commit, tagged
        ▼
main                                  production; protected; never receives direct pushes
```

Rules:
- `main` and `dev` are protected: PRs only, required checks (`CI` jobs + `Promotion guard`), no force-push, linear history on `main`.
- Milestone branches are `milestone/p0-toolchain`, `milestone/p1-security`, … (names in `docs/MILESTONES.md`). They are deleted after their PR into `dev` merges; the next milestone branch is cut from the updated `dev`.
- Work branches are cut from the current milestone branch and merged back into it by PR. They never target `dev` or `main`.
- `hotfix/*` may target `dev` directly (and is then promoted to `main` through `dev`); it is the only exception.
- Every push to `dev`, `milestone/**`, and `main` runs the full pipeline; PRs run it against the merge result.
- A phase is "achieved" when its milestone branch has merged into `dev`, CI is green on `dev`, and the manual soak (release checklist in `docs/QUALITY.md` §5) passes; promotion to `main` then tags the release.

## Cadence

- **Milestones** = phases in `docs/IMPLEMENTATION_PLAN.md`. Each has a GitHub milestone and a tracking issue with the exit criteria as a checklist.
- **Iterations** are weekly. Monday: pick issues for the week from the active phase; Friday: release if the exit criteria for the phase are met, otherwise tag a pre-release.
- **Releases**: SemVer tags (`v0.x.y` until Phase 5 completes, then `v1.0.0`) applied on `main` when `dev` is promoted. `CHANGELOG.md` is updated per release from Conventional Commits.

## Issue lifecycle

`triage` → `ready` → `in progress` → `in review` → `done`. Labels: `phase:N`, `type:{feat,fix,security,ui,docs,chore}`, `priority:{p0,p1,p2}`, `area:{auth,interview,attempt,feedback,voice,llm,storage,infra}`.

P0 = security or data-loss; fix before any other work.

## Definition of ready

- Linked to a phase item.
- Acceptance criteria written (user-observable).
- Dependencies identified; design/ADR needs flagged.

## Definition of done

See `AGENTS.md` §4. Additionally: analytics event added if user-facing; feature flag if the capability is new; docs updated.

## Change control

| Change | Requires |
|---|---|
| New vendor / library | ADR + `docs/TECH_STACK.md` update |
| Data model | ADR + migration script + repository tests |
| Design tokens | ADR + `docs/DESIGN_SYSTEM.md` update + `/dev/ui` gallery check |
| Security control | `docs/SECURITY.md` update + test |
| Prompt | new version file + eval run recorded in PR |

## Incident handling

1. Disable the affected capability via feature flag or revert.
2. Open a `priority:p0` issue with timeline.
3. Fix with a test that reproduces the issue.
4. Post-incident note in `docs/incidents/YYYY-MM-DD-title.md` (what, why, prevention).

## Ownership

`CODEOWNERS` routes reviews. Solo phases still require the PR template and self-review to be completed honestly; the checklist is the reviewer.
