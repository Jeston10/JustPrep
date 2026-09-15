# 0002. Free-only infrastructure

- **Status:** Accepted
- **Date:** 2026-09-15
- **Deciders:** Jeston Singh

## Context
The original build depended on per-minute (Vapi, ElevenLabs, Deepgram) and per-token (OpenAI GPT-4) services. The owner has decided the product must run entirely on free tiers, with no card on file, while remaining fast and smooth.

## Decision
Only services with a genuine free tier (no card required for the features we use) are permitted. Every vendor sits behind an interface with usage logging and quota guards, and every quota exhaustion degrades gracefully to a cheaper mode. Approved list and limits: `docs/TECH_STACK.md`. Payments and paid tiers are out of scope until this ADR is superseded.

## Consequences
- Voice must be re-architected (ADR-0005). LLM calls must be cached and rationed (ADR-0006).
- Product design must treat quota as a first-class state (clear messaging, reset times).
- Some capabilities (very high concurrency, long audio retention) are deferred.
- Positive: zero run cost; forced discipline on efficiency and caching.

## Alternatives considered
- Pay-as-you-go with free credits: rejected (card requirement, unpredictable cost).
- Self-hosting open models on a free VPS: rejected for latency and maintenance; may be revisited for TTS if browser-side quality is insufficient.
