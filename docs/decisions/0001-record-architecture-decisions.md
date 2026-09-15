# 0001. Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-09-15
- **Deciders:** Jeston Singh

## Context
The project is being rebuilt to a world-class standard by a small team assisted by AI agents. Decisions made in chat are lost; decisions made in code are implicit.

## Decision
Record every architecturally significant decision (vendor, data model, layer boundary, design token change) as a numbered ADR in `docs/decisions/`, in the same PR as the change. `docs/GUARDRAILS.md` E3 makes this mandatory.

## Consequences
Slight overhead per significant change; durable rationale for humans and agents; superseding is explicit.

## Alternatives considered
Wiki or issue comments — not versioned with code; easily stale.
