# Security

Threat model, controls, and the checklist every PR touching the server must satisfy. Vulnerability reporting policy is in the root `SECURITY.md`.

## 1. Assets and threats

| Asset | Threats |
|---|---|
| Session cookies / ID tokens | Theft (XSS, log leakage), fixation, replay after logout |
| User data (transcripts, resumes, feedback, email) | IDOR via client-supplied ids, over-broad listing, leaks through logs/analytics |
| Free-tier quotas (LLM, Live, storage, email) | Abuse by unauthenticated or scripted callers → service outage for everyone |
| Uploaded files | Malicious PDFs, oversized files, MIME spoofing, path traversal on keys |
| Webhook / cron endpoints | Forged calls, replay |
| Supply chain | Vulnerable transitive deps, typosquatting, leaked secrets in git |
| Availability | Brute-force auth, request floods on expensive endpoints |

## 2. Controls (mandatory)

### 2.1 Authentication and sessions
- Firebase Auth on the client → ID token → server mints a **session cookie** (`httpOnly`, `secure`, `sameSite=lax`, `path=/`, 7-day expiry). Cookie name is prefixed `__Host-` in production.
- `server/auth/session.ts`: `getCurrentUser()` wrapped in `React.cache` (one verification per request). `checkRevoked` is true only on sensitive operations (delete account, change email) — otherwise false, with a 7-day lifetime bound.
- `requireUser()` throws `AppError('UNAUTHENTICATED')`; every action/route calls it first. `middleware.ts` redirects unauthenticated `(app)` traffic by cookie presence only (defence in depth, not the gate).
- Sign-out revokes refresh tokens (`auth.revokeRefreshTokens(uid)`) and clears the cookie.
- Password policy: ≥ 8 chars enforced client and server (Firebase min is 6; we require 8). Email verification required before first interview.
- OAuth (M4): Google via Firebase; state/nonce handled by SDK; redirect URLs allow-listed.

### 2.2 Authorisation
- Ownership check in the **repository layer**: `attempts.repo.findForUser(id, userId)` returns `null` if `userId` mismatches. Services never accept a bare `userId` from the client.
- `visibility: public` interviews expose `title, role, level, type, techstack, questions` only; never owner email or attempts.
- Admin functions (M5) require a custom claim `role=admin` checked server-side.

### 2.3 Input validation
- Every action uses `next-safe-action` with a zod schema; every route handler parses via `schema.safeParse(await req.json())` and returns 400 on failure.
- String limits everywhere (role ≤ 80, techstack ≤ 15 items, transcript turn ≤ 4 000 chars). Arrays bounded. Enums for `type`, `level`, `mode`.
- IDs validated as Firestore-safe (`/^[A-Za-z0-9_-]{1,64}$/`).
- LLM outputs are validated with zod before persistence; failures retry once with the fallback provider, then return `AppError('LLM_INVALID_OUTPUT')`.

### 2.4 Prompt-injection and LLM safety
- User content (answers, resume text, JD) is placed in a delimited `<user_content>` block; system prompts instruct the model to treat it as data. Never concatenate user text into instructions.
- Feedback prompts receive the transcript only; no tool access. Assistant chat tools are read-only and scoped to the current user.
- Model output shown to users is rendered as text (no HTML/Markdown-to-HTML without sanitising).

### 2.5 Rate limiting and quotas
- `server/ratelimit` (Upstash, sliding window). Keys: `ip` for anonymous, `uid` for authenticated. Defaults in `config/limits.ts`:
  - sign-in / sign-up / reset: 10 per 10 min per IP
  - interview create: 5 per hour per user
  - attempt start: 10 per hour per user
  - feedback generate: 1 per attempt (idempotent), 10 per day per user
  - upload: 5 per hour per user
  - assistant chat: 30 per 10 min per user
  - `/api/voice/session`: 5 per 10 min per user + global concurrency cap
- Quotas (`server/services/quota.service.ts`) decrement `usage/{uid}/months/{m}` transactionally and refuse with `AppError('QUOTA_EXCEEDED')` and a UI that explains the reset time.

### 2.6 Secrets and configuration
- `config/env.ts` (`@t3-oss/env-nextjs`): server schema (`FIREBASE_*`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `UPSTASH_*`, `R2_*`, `RESEND_API_KEY`, `SENTRY_DSN`, `CRON_SECRET`, `SESSION_COOKIE_SECRET`) and client schema (`NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_FIREBASE_*`). Build fails on missing/invalid values.
- `.env.example` documents every variable with a comment; `.env*` is git-ignored; `gitleaks` runs in CI and in the pre-commit hook.
- Firebase service-account private key stored as a single-line env with `\n` escapes; never in files.
- The Firebase **client** config is public by design but is served from env, not hard-coded.

### 2.7 Data access
- Firestore client SDK is **not** used for reads/writes. `firebase/firestore.rules`:
  ```
  rules_version = '2';
  service cloud.firestore { match /databases/{db}/documents { match /{document=**} { allow read, write: if false; } } }
  ```
- All access via `firebase-admin` in `server/db`. Converters strip unknown fields on write.
- PII minimisation: store email only in `users`; transcripts and resumes are referenced by user id, never by email.

### 2.8 Uploads and storage
- Client → `getUploadUrl` action (validates type/size, rate-limited) → presigned PUT to R2 with content-type and length constraints → `confirmUpload` action verifies object exists, checks magic bytes server-side (`file-type`), records metadata.
- Keys are `users/{uid}/{kind}/{uuid}.{ext}`; user input never forms part of the key.
- PDFs: text extraction only (`unpdf`) with a size and page cap; no image rendering.
- Avatars: re-encoded server-side to WebP ≤ 256 px (`sharp`), stripping metadata.
- Audio recordings are opt-in, encrypted at rest by the provider, deleted after 30 days by cron.

### 2.9 HTTP hardening (`next.config.ts` headers)
- `Content-Security-Policy`: `default-src 'self'; script-src 'self' 'nonce-…' https://*.posthog.com; connect-src 'self' https://*.googleapis.com wss://*.googleapis.com https://*.posthog.com https://*.sentry.io https://<r2-bucket>; img-src 'self' data: blob: https://<r2-bucket>; media-src 'self' blob: https://<r2-bucket>; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`. Nonce generated in `middleware.ts`.
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: microphone=(self), camera=(self), geolocation=()`, `X-Frame-Options: DENY`.
- Server actions: Next.js origin check enabled (`experimental.serverActions.allowedOrigins` limited to our domains).

### 2.10 Webhooks and cron
- `/api/cron/*` requires `Authorization: Bearer ${CRON_SECRET}` compared with `timingSafeEqual`; called from GitHub Actions.
- Any future vendor webhook verifies the vendor signature and rejects timestamps older than 5 minutes.

### 2.11 Logging and privacy
- `pino` with `redact: ['req.headers.cookie', 'req.headers.authorization', '*.email', '*.token', '*.transcript', '*.resumeText']`.
- Sentry `beforeSend` strips request bodies and cookies; `sendDefaultPii: false`.
- PostHog: identify by `uid` only; no email as a property; session replay masks all text inputs.
- Account deletion (`deleteAccount` action, re-auth required): deletes Auth user, all Firestore docs (batched), storage objects, Upstash keys, and requests PostHog/Sentry deletion. Data export produces a JSON zip of the same set.

### 2.12 Supply chain and CI
- `pnpm audit --audit-level=high` and `gitleaks` in CI; Dependabot/Renovate weekly.
- Lockfile committed; `pnpm install --frozen-lockfile` in CI.
- No postinstall scripts from untrusted packages (`pnpm` `onlyBuiltDependencies` allow-list).
- `knip` to remove unused deps (each is attack surface).

## 3. Server PR checklist

- [ ] `requireUser()` (or signature check) is the first statement.
- [ ] Input parsed by zod; limits on every string/array.
- [ ] Ownership enforced in the repository call.
- [ ] Rate limit and/or quota applied.
- [ ] No `process.env` outside `config/env.ts`.
- [ ] No sensitive fields in logs, analytics, or error messages.
- [ ] Vendor call goes through a `server/*` adapter with usage logging.
- [ ] Test covers the unauthenticated and the wrong-owner cases.

## 4. Intentionally anonymous endpoints

| Endpoint | Reason | Protection |
|---|---|---|
| `GET /api/health` | Uptime checks | Returns `{ ok: true }` only; rate-limited by IP |
| `(marketing)` pages, `robots.ts`, `sitemap.ts` | Public | Static |
| `POST` sign-in / sign-up actions | Bootstrap | IP rate limit, zod, Firebase brute-force protection |

Anything not in this table must authenticate.
