# 0005. Voice pipeline: Gemini Live, browser APIs, text — no Vapi

- **Status:** Accepted
- **Date:** 2026-09-15
- **Deciders:** Jeston Singh

## Context
Vapi (with Deepgram, OpenAI GPT-4, ElevenLabs) is paid per minute and is currently the only way to create or take an interview. Free-only is now a constraint (ADR-0002). Latency and smoothness must not regress.

## Decision
Three-tier voice architecture, selected server-side per session (`docs/TECH_STACK.md` §2):

1. **Gemini Live API** — native audio in/out over WebSocket, using short-lived tokens minted after a quota check. Lowest-latency free option.
2. **Browser pipeline** — Web Speech API for STT → streamed LLM text → `speechSynthesis` by default, `kokoro-js` (on-device neural TTS) as an opt-in "HD voice"; Whisper-tiny in a worker for browsers without `SpeechRecognition`.
3. **Text mode** — always available; default on unsupported devices or exhausted quotas.

The transcript is the canonical artefact for all tiers. Vapi and its hosted workflow are removed in Phase 4; interview creation moves to a form.

## Consequences
- No per-minute cost; works on more devices; text mode improves accessibility.
- Tier 2 voice quality varies by OS; HD voice needs a one-time model download.
- Gemini Live free quotas are limited; per-user minutes and a global concurrency cap are enforced with automatic downgrade.

## Alternatives considered
- Keep Vapi: paid — rejected.
- OpenAI Realtime API: paid — rejected.
- LiveKit + Deepgram + ElevenLabs: multiple paid components — rejected.
- Fully on-device (Whisper + Kokoro + local LLM): the LLM part is too slow on phones — adopted only for STT/TTS.
