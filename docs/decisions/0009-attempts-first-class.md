# 0009. Attempts as first-class records

- **Status:** Accepted
- **Date:** 2026-09-15
- **Deciders:** Jeston Singh

## Context
Feedback is keyed by (interviewId, userId) and retaking overwrites it. Progress tracking, trends, and playback are impossible without history.

## Decision
Introduce `attempts/{id}` (interviewId, userId, mode, tier, transcript, metrics, status) and key `feedback` by `attemptId`. A retake always creates a new attempt. `users.stats` is denormalised on completion. A one-off migration creates an attempt for each existing feedback document.

## Consequences
- Enables history, trends, per-attempt playback, and evals.
- Slightly more writes per session; mitigated by idempotent `appendTurn`.

## Alternatives considered
- Versioned feedback array on the interview document: unbounded growth — rejected.
