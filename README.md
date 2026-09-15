# JustPrep

AI mock-interview practice that actually changes how you perform. Create an interview for a specific role, level, stack, and company; take it in text or voice; get per-question feedback with evidence from your own transcript, model answers, and a concrete next drill. Every attempt is kept, so progress is visible.

Built to a world-class standard on a **free-only** infrastructure budget.

## Status

Rebuild in progress. The engineering handbook is complete; implementation follows `docs/IMPLEMENTATION_PLAN.md` phase by phase. The legacy prototype (v0.1) still lives in `app/`, `components/`, and `lib/` until each phase replaces it.

## Read first

| | |
|---|---|
| `AGENTS.md` | Operating manual for engineers and AI agents — start here |
| `docs/IMPLEMENTATION_PLAN.md` · `docs/MILESTONES.md` | What to build, in order — phases, then PR-level breakdown with file migration map |
| `docs/GUARDRAILS.md` | Hard rules (cost, security, architecture, design, process) |
| `docs/RISKS.md` | Risk register and per-phase watch-list |
| `docs/ARCHITECTURE.md` | Layers, folder layout, SOLID mapping, data model v2 |
| `docs/TECH_STACK.md` | Approved free services and libraries; voice and LLM routing |
| `docs/SECURITY.md` | Threat model and mandatory controls |
| `docs/DESIGN_SYSTEM.md` | Tokens, components, motion, anti-AI-look checklist |
| `docs/COMPONENT_LIBRARY.md` | shadcn + 21st.dev + motion sourcing and adaptation |
| `docs/RESPONSIVE.md` | Device matrix and responsive rules |
| `docs/CODING_STANDARDS.md` · `docs/QUALITY.md` | Code style, tests, budgets |
| `docs/decisions/` | ADRs |
| `docs/ANALYSIS_AND_ROADMAP.md` | The audit of the legacy codebase |

## Stack (target)

Next.js (App Router) · React · TypeScript strict · Tailwind v4 · shadcn/ui + 21st.dev · motion · Firebase Auth + Firestore (free) · Vercel AI SDK with Gemini (primary) and Groq (fallback) · Gemini Live + Web Speech API + on-device TTS for voice · Cloudflare R2 · Upstash · Sentry · PostHog · Resend · Vitest · Playwright · pnpm · lefthook · GitHub Actions.

## Local development (after Phase 0)

```bash
pnpm install
cp .env.example .env.local
pnpm dlx firebase-tools emulators:start --only auth,firestore
pnpm dev
```

See `CONTRIBUTING.md` for branching, commits, and the PR checklist. Security reports: `SECURITY.md`.

## Licence

Private. All rights reserved.
