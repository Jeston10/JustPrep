# 0003. Keep Firebase Auth and Firestore

- **Status:** Accepted
- **Date:** 2026-09-15
- **Deciders:** Jeston Singh

## Context
The app already uses Firebase Auth (session cookies via firebase-admin) and Firestore. Alternatives (Supabase/Postgres) offer relational queries but would require a data migration and a second auth system at the same time as a full UI revamp.

## Decision
Keep Firebase Auth and Firestore (Spark plan, free) through Phase 7. Access only via `firebase-admin` in `server/db` repositories; the client Firestore SDK is blocked by deny-all rules. Data model v2 (`docs/ARCHITECTURE.md` §5) uses denormalised stats and cursor pagination to stay within free quotas and avoid unbounded reads.

## Consequences
- Fast path to a secure baseline; no migration risk now.
- Firebase Storage requires the Blaze plan for new projects, so object storage moves to another vendor (ADR-0004).
- Relational analytics (leaderboards, cohorts) are limited; revisit at Phase 7 if the question bank or analytics demand it. Supabase is the documented migration target.

## Alternatives considered
- Supabase (Postgres + Auth + Storage, free tier): strong single-vendor option; rejected for now to avoid rewriting auth and data access concurrently with the UI revamp.
- Neon + Drizzle + Auth.js: more moving parts; rejected.
