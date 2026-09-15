# Security Policy

## Reporting a vulnerability

Please do **not** open a public issue. Email **sjestonsingh@gmail.com** with:

- a description of the issue and its impact,
- steps to reproduce or a proof of concept,
- the affected commit/URL.

You will receive an acknowledgement within 72 hours and a resolution plan within 7 days for confirmed issues. Credit is given in the changelog unless you prefer otherwise.

## Scope

The production deployment of JustPrep and this repository. Third-party services we depend on (Firebase, Google AI, Groq, Cloudflare, Upstash, Vercel, Sentry, PostHog, Resend) have their own programmes.

## Supported versions

Only the latest release on `main` receives fixes.

## Engineering controls

The full threat model and mandatory controls are documented in `docs/SECURITY.md`. Every server-side change must satisfy the checklist in that document before merge.
