# Hoplite Handoff

Cross-thread integration notes for parallel Frigo work. Read this before
rebasing or touching a system you do not own.

# Final Hardening

This section and `FINAL_HARDENING_REPORT.md` supersede the historical operational
claims below. Starting head: `4fe18d28aa25f900a459b17932832d9c3d36852e`, PR #2,
`codex/security-hardening-sync`. Repository tools resolve `vna-sex/Frigo`.

- **Forgot-password privacy:** known/unknown accounts return identical HTTP 200
  and generic Vietnamese JSON, including resend and delivery failures. Unknown
  accounts perform random/HMAC work without persistence/mail. Reset delivery is
  registered with Worker `waitUntil`, removing email-provider latency from the
  public response. No constant-time-network claim. Replacement/reset-resend
  invalidation and challenge insertion share a D1 batch; older codes cannot
  revive after the replacement is consumed.
- **Turnstile:** both production keys are mandatory/fatal in config/readiness.
  Login/register/forgot-password/resend fail closed without verification.
  Explicit development/staging may disable it. Client resend sends a token,
  loader names its onload callback, and consumed tokens get fresh widgets on retry.
- **Quota:** `src/worker/config/scan-quota-policy.ts` owns Free 5 / Plus 999999.
  Entitlements ignore legacy mutable limit/usage projections. UTC month rollover;
  reserved and consumed rows count, released rows do not. Enforcement retains its
  atomic acquisition/reclaim/fencing. `/me` reads the same entitlement and current
  ledger count without creating billing/quota rows, returns `plan/limit/used/
  remaining/resetAt` plus old aliases, and returns 503 on DB failures. Offline
  clients report unavailable quota, not invented usage. Profile joins are scoped
  to the session household, including its name, avoiding false identity resets.
- **Origins:** validated HTTPS `APP_URL` supplies CORS and CSRF's exact production
  origin. Only explicit development adds documented localhost/127.0.0.1 origins.
  No wildcard, prefix match or arbitrary non-production reflection.
- **OTP:** new HMAC v2 binds JSON-encoded normalized email/purpose/code. Existing
  v1 verification continues until expiry; no schema migration or secret rotation.
  D1 attempts/lockout, expiry and conditional one-winner consume remain authoritative.
- **Logging:** auth/email/Turnstile failures use static event codes and safe
  provider names; no full email, provider bodies, raw exceptions, OTP/digest,
  password, cookie or token. The global error log omits raw exception text.
  Unrelated domain logging has not undergone a broad rewrite.
- **Sessions:** D1 validity is still read each request; last-seen is touched only
  after 15 minutes (new sessions use creation time initially). A conditional SQL
  predicate fences simultaneous touches. No KV validity cache/sliding expiry/jobs.
- **CSP:** no script unsafe-inline. Style unsafe-inline remains for three dynamic
  progress widths and Google GSI-generated styles observed in the browser.
  Removing it requires widget-compatible styling work; nonces do not authorize
  style attributes. Worker/static policies remain synchronized.
- **Cleanup:** expired sessions_v2 30d, expired OTP 7d, ready jobs 30d and failed
  jobs 90d, centralized in retention config. Jobs need a matching terminal scan,
  no reserved quota and sufficiently old update time before deletion. Active
  sessions/OTPs/jobs and all quota history/reservations are retained. Real current
  SQLite tests cover repeat cleanup and mixed timestamp formats.
- **Release:** use a merge commit retaining exact hardened ancestry, green PR-head
  CI, green main release-SHA CI, then an approved immutable SHA/tag. Workflow
  artifacts record SHA/ancestry/CI/schema checksums/observed ledger/readiness SHA.
  See `DEPLOYMENT.md` for production/main reconciliation and 0017+ rollback limits.

The browser smoke covers login, `/me`, inventory read, logout/reload, A→B,
failed logout/reload/retry, generic reset copy and synthetic Turnstile-token
refresh. Real-SQLite client tests cover household switching and owned offline
replay. The isolated preview does not certify live mail, AI or Turnstile services.
The platform initially ignored repository scripts and started Vite's old
production proxy: two synthetic register requests were rejected by Turnstile
before account creation. The server was stopped, Vite made local-by-default, and
the existing isolated script configured explicitly as the managed run override.

**Deferred — PayOS / Payment Owner Action:** all provider/webhook/signature,
payment schema/UI/intent/settlement/configuration and manual Plus activation
remain untouched and uncertified. No production deploy, remote D1/KV/R2 mutation,
queue send, migration, secret rotation, DNS or GitHub Environment change.

# Production Platform Hardening

Thread 5 (baseline `e6d4788a`). Scope: CI/CD, production config validation,
scheduled cleanup, health/readiness, rate-limit failure behavior, CSP,
rollback, deployment traceability. Files introduced or changed:

- `.github/workflows/ci.yml` — validation pipeline (least privilege, adds `pnpm check:migrations`)
- `.github/workflows/deploy.yml` — staging auto-deploy + gated production deploy
- `src/worker/config/validation.ts` — `validateEnvironment(env)` (production fail-closed)
- `src/worker/middleware/config-gate.ts` — request-time 503 gate for fatal production config
- `src/worker/config/retention.ts` — cleanup retention defaults/overrides
- `src/worker/config/csp.ts` — CSP builders (script-src hardened)
- `src/worker/services/cleanup.ts` — cron cleanup (OTPs, sessions, terminal scan jobs)
- `src/worker/middleware/rate-limit.ts` — explicit degraded + fail-closed semantics
- `src/worker/routes/health.ts` — liveness + sanitized readiness
- `src/worker/index.ts` — structured logging, config gate, cron `scheduled()` wiring
- `src/worker/types.ts` — new optional env fields (`GIT_COMMIT`, `RATE_LIMIT_ENFORCEMENT`, `CLEANUP_*`)
- `wrangler.jsonc` — daily `0 3 * * *` cron trigger
- `wrangler.staging.jsonc.example` — staging template (real IDs must be supplied manually)
- `scripts/post-deploy-smoke.sh` — read-only smoke for staging/production
- `public/_headers` — CSP synced with `spaCsp()`
- `package.json` — `dev:worker` now forces `ENVIRONMENT: development`
- `tests/unit/{config-validation,health,cleanup,rate-limit,csp}.test.ts`
- `DEPLOYMENT.md` — operational runbook

## CI flow

`ci.yml` runs on PR + push to main: frozen-lockfile install, lint, typecheck,
vitest, `check:migrations` (in-memory SQLite replay of all migrations with
FK/integrity assertions), build. Job has `contents: read` only.

## Staging flow

Push to main → CI passes → `deploy.yml` staging job (workflow_run filtered to
main success + main repository) → `wrangler deploy --config wrangler.staging.jsonc`
→ read-only smoke. Staging requires the operator-created `wrangler.staging.jsonc`
(see `DEPLOYMENT.md`); without it the job skips with a notice rather than
inheriting production bindings.

## Production gate

Manual `workflow_dispatch` with `environment: production` (required reviewers
must be configured in GitHub) + explicit `confirm_production` input. The job
re-runs all local gates, runs the **read-only** remote schema gate
(`scripts/d1-schema-gate.sh remote`), deploys with `GIT_COMMIT` stamped, then
smokes. Concurrency group `frigo-deploy-*`, `cancel-in-progress: false`.
Migrations are never applied by the pipeline — operators apply them between
gate and deploy (documented).

## Required GitHub environments/secrets
(manual steps, cannot be done from repo code — see `DEPLOYMENT.md`)

1. GitHub Environment `staging` and `production` (required reviewers on production).
2. Secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` (staging env + production env).
3. Repository variable `STAGING_URL`; optional `PRODUCTION_URL`.
4. Cloudflare staging resources: D1, KV, R2 (no production identifiers).

## Config validation

`validateEnvironment(env)`; production-only gate. Fatal → `503 CONFIG_INVALID`
with sanitized codes; warnings surface in `/health/ready` and logs. Feature-aware:
disabled features do not require secrets. See `DEPLOYMENT.md` for the full list.

## Health/readiness

`/api/v1/health` (minimal liveness), `/api/v1/health/ready` (sanitized
service states, `ok|degraded|unhealthy` with `503` when unhealthy, commit
traceability), `/api/v1/config` (Turnstile site key). Health routes are
mounted OUTSIDE the auth-protected router (they must stay public; do not move
them back behind `authMiddleware`).

## Cron cleanup

Daily 03:00 UTC (`scheduled()` → `runScheduledCleanup`). Retention defaults
and overrides in `src/worker/config/retention.ts`. Replay-safe; production
skips cleanup while the config gate is fatal. Timestamps normalized with
`datetime()` (app writes ISO strings; D1 defaults write `YYYY-MM-DD HH:MM:SS`).

**Current integration:** `cleanupExpiredSessions` deletes expired rows from
`sessions_v2` using normalized timestamps. D1 `revoked_at` is authoritative;
legacy KV `revoked_*` records are not used for web authentication. Cleanup
preserves active sessions, pending/processing jobs, and all quota-ledger rows.

## Rate-limit behavior

See `DEPLOYMENT.md`. Default best-effort with explicit
`X-RateLimit-Mode: degraded-isolate-local` + one-time log on KV failure;
`enforcement: 'fail-closed'` (or `RATE_LIMIT_ENFORCEMENT=fail-closed` var)
yields `503 RATE_LIMIT_UNAVAILABLE` in production. Existing call sites
(`routes/auth.ts`, `routes/scans.ts`, etc.) are unchanged and remain
best-effort.

## CSP

`script-src 'unsafe-inline'` removed (verified: production bundle emits no
inline scripts; Google GSI/Turnstile are external). `style-src 'unsafe-inline'`
retained — three components bind dynamic width style attributes
(`CookingModePage.tsx:351`, `WeekSetupPage.tsx:112`,
`WeekShoppingPage.tsx:180`). Removing it needs a per-page nonce/hash or
refactor of those attributes; defer to a security review thread. Keep
`public/_headers` in sync with `spaCsp()`.

## Rollback

Documented in `DEPLOYMENT.md`: code rollback requires a hardened,
migrated-schema-compatible ref. Migration 0017 removes the plaintext OTP column;
pre-hardening main is not a safe rollback target. Preserve queue claim fencing
and keep Week dual-write `dual`; migration recovery needs explicit operator approval.

## Remaining manual infrastructure steps

1. Provision staging Cloudflare resources + `wrangler.staging.jsonc`.
2. Configure GitHub environments/secrets as above.
3. (Recommended) set `RATE_LIMIT_ENFORCEMENT=fail-closed` in production after
   observing KV health, and have Thread 2 pin auth/OTP limiters to
   `enforcement: 'fail-closed'` explicitly.

## Known local-dev limitation (pre-existing)

`pnpm dev:worker` (wrangler 3.x/Miniflare 3) fails to boot with
`No such module "cloudflare-internal:email"` because `send_email` + the
`cloudflare:email` module are not emulatable locally in this stack. Verified
pre-existing at baseline `e6d4788a` (same failure with all Thread 5 changes
stashed). Workarounds for local worker testing: temporarily drop the
`send_email` binding, or upgrade wrangler (4.x) — out of scope here. The
`--var ENVIRONMENT:development` flag on `dev:worker` is required by the new
production config gate so local runs are never gated.

## REBASE NOTES FOR THREAD 2

Both threads may touch these files (Thread 5 changes are additive and kept
out of auth logic):

| File | Thread 5 change | Thread 2 overlap risk |
| --- | --- | --- |
| `src/worker/index.ts` | logging/config-gate/cron wiring; healthRoutes moved out of the api router | import lines and `api` router body — merge conflicts possible; keep Thread 2's auth wiring |
| `src/worker/types.ts` | added optional env fields | AuthContext/session fields — resolve by keeping both additions |
| `src/worker/middleware/auth.ts` | NOT modified | Thread 2 owns it; PUBLIC_PATHS entries for `/health`/`/config` are now redundant (health mounted outside the api router) but harmless — clean them up in Thread 2 |
| `src/worker/routes/auth.ts` | NOT modified (rate-limit call sites untouched) | Thread 2 owns it |
| `src/worker/utils/otp.ts` | NOT modified | untouched |
| session migrations | NOT modified | Thread 2 adds new migrations; after they land, update `cleanupExpiredSessions` in `src/worker/services/cleanup.ts` to the new table/column |
| `tests/unit/auth.test.ts` | NOT modified | untouched |

Conflict policy: prefer preserving Thread 2's auth/session changes. Thread 5
work does not depend on the auth redesign (session cleanup degrades
gracefully until the schema lands).

Test baseline: 126 (pre-Thread-5) → 163 (with Thread 5 platform tests),
lint/typecheck/build/migration-smoke all green. Production deployment:
**NOT PERFORMED**.

# PR #2 Stabilization

Starting head was fetched and confirmed as
`26a98b9064145d80f93e4dc799e3ff4fc2564192` on
`codex/security-hardening-sync`. Main was
`3f33d11e4cbf438e2bc3fa35ccb1de2f9856c071`.
`BASELINE_AUDIT.md` is absent from the fetched repository/history; the existing
handoff, PR description, changed files and migrations 0014–0018 were inspected.

- **CI root cause:** the outbox registration test omitted `sessionStorage` after
  guest credentials moved there. Header initialization threw before mocked
  `fetch`, and the broad network catch mislabeled it offline. Browser mocks now
  model the cookie/legacy-guest contract, without weakening authentication.
- **CSRF:** compare parsed origins exactly. Cookie mutations fail closed without
  a valid Origin or trusted Referer. Malformed/prefix-lookalike/null origins fail.
  Production session-bootstrap endpoints require a trusted signal even without
  a cookie. Development loopback origins are explicit; development bearer-only
  protected API requests remain separate from cookie CSRF.
- **OTP:** registration consume and final password-reset consume both require
  `meta.changes === 1`, `used = 0`, unexpired D1 time, attempts below five and no
  active lock. Attempt increments are bounded in D1, independent of KV. Reset
  verification remains preliminary; final reset consumes and revokes old
  `sessions_v2` in the password-change batch. HMAC v1 is unchanged: outstanding
  digests remain compatible. No new migration or OTP invalidation was introduced.
- **Sessions/logout:** opaque HttpOnly/Secure/Path=/SameSite=Lax cookies and
  token hashes remain. Logout is awaitable and deduplicated. It immediately
  blocks replay, removes private storage, resets all private stores/queries,
  then awaits server revocation and cookie expiry. Failure displays an explicit
  unconfirmed-revocation warning and a retry action; a durable marker blocks
  private access after reload. Only confirmed success navigates anonymously.
- **Client ownership:** inventory, shopping and Week persistence use user plus
  household keys; unverifiable legacy keys are deleted. Session generations
  reject stale responses/continuations. `/me` verifies ownership before private
  replay; logout/account/household changes cannot replay another owner's outbox.
  Expected-owner headers are checked against the session on each private request,
  closing cookie-switch races between `/me` and replay/read. Receipt history
  contains only a scan ID; legacy receipt payloads are ignored and reauthorized.
  File reads capture ownership before starting and cancel on unmount/replacement.
  New guests use cookies, offline-only guests cannot attach an unrelated cookie,
  and guest migration requires explicit D1-backed server ownership proof.
- **Quota:** the unique D1 ledger is the authority. One serialized batch performs
  conditional ledger acquisition/reclaim and derives `used_count` from active
  rows. Duplicate/released races cannot double charge or double refund.
  Reservation IDs rotate on reclaim, fencing late finalizers. Entitlement is
  read from existing server subscription state; expired Plus does not bypass quota.
  Released historical commands reclaim only against the current month's allowance;
  active historical commands remain idempotent without a new charge.
- **Scan requests:** a UUID is created before the UI's first upload and reused
  by its retry action. The server scopes the key to user/household and recovers
  the same scan. An ambiguous queue send retains its reservation; retry resends
  the same job rather than refunding an operation that may already be processing.
- **Queue:** claim/reclaim is conditional in a D1 batch. Completion/failure first
  rotates a valid, unexpired claim to a unique transaction-only token; every
  result mutation requires that token. Zero-row ownership acquisition therefore
  produces zero side effects, not a late failure after unguarded writes.
  Exhausted attempts and terminal-scan replay are fenced as well.
- **Cleanup/schema:** real SQLite tests replay all 18 migrations and verify
  session/OTP retention and active job/quota preservation. Migration smoke used
  to stop at 0012; it now includes 0013–0018. The auth/quota schema gate checks
  0014–0017. Existing migration files are unchanged.
- **Release configuration:** production readiness now rejects missing/blank
  `OTP_HASH_SECRET` and missing/malformed trusted `APP_URL`. The existing
  production origin is versioned in `wrangler.jsonc`; staging requires its own
  origin and independent runtime secret. `DEPLOYMENT.md` documents ledger-aware
  cutover, deliberate legacy-session invalidation and compatible rollback.

Verification: initial CI/local baseline **162 pass / 1 fail**; final full local
suite **309 pass / 0 fail** in 32 files. `pnpm lint`, `pnpm typecheck`, `pnpm test`,
`pnpm build`, `pnpm check:migrations`, all local Wrangler migrations and
`pnpm schema:check:local` passed. Latest hosted CI must be checked at the
published head, not inferred from this local result.
Hosted CI passed 297 tests at `7611ae7`; the subsequent readiness correction adds
12 regression cases, so its new head needs its own hosted validation.

`scripts/security-preview.mjs` runs the real Vite app and worker routes against
fresh in-memory SQLite, stubs only the unsupported local email runtime module,
uses mock AI, and disables outbound backend fetches. It never loads production
bindings/secrets. Use `node scripts/security-preview.mjs` (Node 22+); the server
port follows `PORT`, default 3000, and `PREVIEW_APP_URL` can name the exact trusted
preview origin. The project Preview override selects this isolated runner rather
than Vite's production API proxy. Browser verification is not yet complete:
the sandbox repeatedly killed browser/Vite processes and rejected resize/setup
with an active-lifecycle error. This is not a passing UI result.

**PayOS/payment explicitly deferred:** no provider, webhook, payment migration,
payment UI, settlement, secrets or amount/status logic was changed. The existing
`PLUS_GRANT_SECRET` activation route also remains owner work. See
`PR2_STABILIZATION_REPORT.md` for the audit and merge conditions. No production
deployment, remote D1 command, remote migration or remote data mutation ran.
