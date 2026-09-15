# Quality — testing, performance, accessibility

## 1. Test pyramid and gates

| Layer | Tool | Runs | Gate |
|---|---|---|---|
| Static | `tsc`, ESLint, Prettier, `knip`, `gitleaks` | pre-commit (changed files), CI | zero errors |
| Unit | Vitest (+ Testing Library for components with logic) | pre-push, CI | 100 % pass; coverage ≥ 80 % on `lib/`, `server/services`, `server/llm/prompts` |
| Contract | Vitest suites per provider interface | CI | every adapter passes |
| Integration | Vitest + Firebase emulator | CI | repositories + rules |
| E2E | Playwright (Chromium, WebKit, mobile Chrome profile) | CI on PR, nightly full | critical flows green |
| Evals | Vitest over `tests/evals/feedback/*.json` | on prompt change, weekly | scores within tolerance |
| Visual/responsive | Playwright screenshots at 375/768/1280 + overflow assertion | CI | no horizontal overflow; screenshot diffs reviewed |
| A11y | `@axe-core/playwright` on dashboard, form, session, feedback | CI | zero serious/critical |
| Security | `pnpm audit --audit-level=high`, `gitleaks`, header check test | CI | clean |

## 2. Performance budgets

| Metric | Budget | Where measured |
|---|---|---|
| LCP (dashboard, 4G, mid-tier mobile) | < 2.5 s | Lighthouse CI (free) in GitHub Actions |
| INP | < 200 ms | Lighthouse CI + PostHog web vitals |
| CLS | < 0.05 | same |
| JS per route (gzipped, initial) | marketing < 90 kB · app shell < 150 kB · session < 200 kB (+ lazy voice chunks) | `size-limit` in CI |
| Server action p95 (non-LLM) | < 300 ms | logger `durationMs` → PostHog |
| Time-to-first-token (LLM turn) | < 1.2 s (Gemini) / < 0.8 s (Groq) | logged per call |
| Voice round-trip (Tier 1) | < 1.0 s end-of-speech → first audio | logged client-side |
| Firestore reads per dashboard render | ≤ 6 | integration test counts reads |

Techniques: server components, `React.cache`, cursor pagination, `next/dynamic` for Monaco/tldraw/charts/Kokoro, `next/font` self-hosting, `next/image` with `sizes`, streaming UI with Suspense boundaries, denormalised stats.

## 3. Accessibility (WCAG 2.2 AA)

- Semantic landmarks (`header`, `nav`, `main`, `aside`); one `h1` per page; heading order.
- Colour contrast ≥ 4.5:1; focus ring always visible; no colour-only meaning (score bars also show the number).
- Keyboard: all flows completable; dialogs trap focus and restore it; `Esc` closes; skip-to-content link.
- Voice session: live captions region (`aria-live="polite"`), text alternative for every audio cue, mic state announced, visible timer.
- Forms: labels bound, errors announced (`aria-describedby`), `autocomplete` attributes.
- Motion: `prefers-reduced-motion` honoured globally.
- Touch: ≥ 44 px targets on mobile; no hover-only affordances.
- Screen-reader smoke test (VoiceOver on iOS, NVDA on Windows) on the four key pages before each milestone release.

## 4. Reliability

- Error boundaries per route group; session page has an inline recovery ("Reconnect" / "Switch to text").
- All LLM calls: timeout 30 s, one retry on 429/5xx with provider fallback, structured-output validation.
- Health endpoint checks Firestore and Redis reachability (cached 30 s).
- Uptime monitor (free tier) on `/api/health`.

## 5. Release checklist (per milestone)

- [ ] CI green on `main`; `pnpm audit` clean.
- [ ] Lighthouse CI report attached; budgets met.
- [ ] Device matrix pass recorded in the PR/milestone issue.
- [ ] A11y scan clean; manual screen-reader smoke done.
- [ ] Evals within tolerance if prompts changed.
- [ ] `CHANGELOG.md` updated; version tag created.
- [ ] Feature flags for new capabilities default off in production until verified.
- [ ] `docs/RISKS.md`: all rows tagged for this phase are closed or explicitly deferred; standing rows re-checked.
