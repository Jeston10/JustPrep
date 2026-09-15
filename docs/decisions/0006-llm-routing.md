# 0006. LLM routing through Vercel AI SDK: Gemini primary, Groq fallback

- **Status:** Accepted
- **Date:** 2026-09-15
- **Deciders:** Jeston Singh

## Context
Server actions call Gemini directly with inline prompts and parse free text with `JSON.parse`. Free-only requires rationing and fallback; product quality requires versioned prompts and evals.

## Decision
All model calls go through `server/llm` (`LLMProvider` interface, router, prompt registry). Providers: Gemini (AI Studio free tier) primary for every task; Groq free tier as the fast fallback; Ollama for local development. Structured outputs are validated with zod. Generation results are cached by input hash. Prompt versions are stored on produced documents and regression-tested in `tests/evals`.

## Consequences
- Provider or model changes are configuration, not code changes.
- Feedback quality is measurable; prompt changes are reviewable.
- Free quotas are shared across users, so per-user daily caps and global caps are mandatory.

## Alternatives considered
- Direct SDK calls per feature: unmaintainable — rejected.
- OpenAI / Anthropic APIs: paid — rejected under ADR-0002; can be added as optional providers behind the same interface if the constraint changes.
- Self-hosted open models: hosting latency and cost — rejected for now.
