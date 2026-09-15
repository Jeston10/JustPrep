# 0007. Design language: edged, monochrome + single accent

- **Status:** Accepted
- **Date:** 2026-09-15
- **Deciders:** Jeston Singh

## Context
The current UI reads as a generic AI-generated template: purple gradients, rounded glass cards, emoji, filler widgets, robot imagery. The product needs a distinctive, professional identity.

## Decision
Adopt the system in `docs/DESIGN_SYSTEM.md`: zero border radius on surfaces, near-black/off-white palette with one acid-lime accent, serif display + Geist text/mono, hairline borders, dense layouts, purposeful motion only, specific copy, no filler widgets. The anti-AI-look checklist (§7) is a merge gate.

## Consequences
- Every existing screen is rebuilt (Phase 3).
- Imported components must be de-rounded and re-tokened (`docs/COMPONENT_LIBRARY.md` §2).
- Strong, recognisable identity; lower decoration cost.

## Alternatives considered
- Keep current styling and iterate: cannot escape the template look — rejected.
- Rounded "friendly" style: indistinguishable from competitors — rejected.
