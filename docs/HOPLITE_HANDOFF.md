# Hoplite Handoff

Cross-thread integration notes for parallel Frigo work. Read this before
rebasing or touching a system you do not own.

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

**Integration dependency:** `cleanupExpiredSessions` in
`src/worker/services/cleanup.ts` deletes from `sessions` by
`datetime(expires_at) < datetime('now', ?)`. Thread 2's session redesign may
rename/reshape the sessions table. The query is isolated in one function and
the cron degrades gracefully (per-task `error` result, nothing else affected)
until the schema is updated there. KV `revoked_*` revocation keys rely on KV
TTL; there is no scheduled KV sweep (KV namespaces cannot be enumerated here).

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

Documented in `DEPLOYMENT.md` (code rollback via workflow_dispatch ref,
additive-only data rollback, Week dual-write stays `dual`, queue re-claim safe).

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
