# Process

How work flows through this repository, modelled on GitLab's engineering process at small scale.

## Cadence

- **Milestones** = phases in `docs/IMPLEMENTATION_PLAN.md`. Each has a GitHub milestone and a tracking issue with the exit criteria as a checklist.
- **Iterations** are weekly. Monday: pick issues for the week from the active phase; Friday: release if the exit criteria for the phase are met, otherwise tag a pre-release.
- **Releases**: SemVer tags (`v0.x.y` until Phase 5 completes, then `v1.0.0`). `CHANGELOG.md` is updated per release from Conventional Commits.

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
