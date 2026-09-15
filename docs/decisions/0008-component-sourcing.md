# 0008. Component sourcing: shadcn/ui + 21st.dev + motion

- **Status:** Accepted
- **Date:** 2026-09-15
- **Deciders:** Jeston Singh

## Context
Hand-building every component is slow; importing a full UI kit brings a foreign token system and bundle weight.

## Decision
Primitives from shadcn/ui (copied into the repo, Radix-based); composed patterns from the 21st.dev registry via the shadcn CLI; animation with `motion` (`motion/react`) and `@number-flow/react`. Every import follows the adaptation procedure in `docs/COMPONENT_LIBRARY.md` §2 and is committed raw first, then adapted, so provenance and our changes are both visible.

## Consequences
- Fast assembly of professional UI; components are owned code with no runtime dependency on a kit.
- Discipline required to strip decoration and align tokens.
- No second UI kit is ever installed.

## Alternatives considered
- MUI / Chakra / Mantine: heavy, own theming — rejected.
- Fully custom: too slow — rejected.
