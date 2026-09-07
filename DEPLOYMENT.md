# Frigo Deployment Guide

Operational runbook for CI/CD, environments, migrations, health, cleanup,
rate limiting, and rollback. All automated deploy steps live in
`.github/workflows/ci.yml` (validation) and `.github/workflows/deploy.yml`
(deployment). Nothing in this repository deploys automatically to production.

## Pipeline

```text
Pull request
     ↓
CI (ci.yml: lint, typecheck, tests, migration smoke, build)
     ↓
merge to main → CI runs again on main
     ↓
staging deploy (deploy.yml, after CI succeeds on main)   [requires wrangler.staging.jsonc]
     ↓
staging post-deploy smoke (read-only)
     ↓
production: manual workflow_dispatch + confirm input + GitHub Environment approval
     ↓
pre-deploy schema gate (read-only) → production deploy → production smoke
```

## CI (`.github/workflows/ci.yml`)

Runs on every pull request and every push to `main`. Permissions are limited
to `contents: read`; fork PRs receive no secrets. Steps:

1. `pnpm install --frozen-lockfile`
2. `pnpm lint`
3. `pnpm typecheck`
4. `pnpm test`
5. `pnpm check:migrations` — replays every migration into in-memory SQLite
   with foreign-key/integrity assertions (`scripts/migration-smoke.sh`)
6. `pnpm build`

## Staging

Staging is a separate Cloudflare deployment and must never share production
D1/KV/R2/queues. Configuration lives in `wrangler.staging.jsonc`
(git-committed), created from `wrangler.staging.jsonc.example`.

Manual setup (operator, once):

1. Provision in the Cloudflare account: D1 database (`frigo-db-staging`),
   KV namespace, R2 bucket. Do not reuse production identifiers.
2. Copy `wrangler.staging.jsonc.example` → `wrangler.staging.jsonc` and fill
   in the real staging IDs. The template already sets safe staging vars
   (`ENVIRONMENT: staging`, `AI_MOCK_MODE: true`, `SCAN_QUEUE_MODE: sync`,
   Turnstile **test** keys, `workers_dev: true`).
3. `wrangler d1 migrations apply frigo-db-staging --remote --config wrangler.staging.jsonc`
4. GitHub: create a `staging` environment; add secrets
   `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`; add the repository
   variable `STAGING_URL` (the workers.dev URL, e.g.
   `https://frigo-staging.<account>.workers.dev`).

Behavior:

- Deploys automatically after CI succeeds on a push to `main`.
- If `wrangler.staging.jsonc` does not exist, the job emits a notice and
  skips — staging is never half-configured, and it can never inherit
  production bindings from `wrangler.jsonc`.
- Staging smoke runs `scripts/post-deploy-smoke.sh "$STAGING_URL"`.

## Production gate

Production deploys are dispatched manually: **Actions → Deploy → Run
workflow**, `environment: production`, `confirm_production: true`, and the
`ref` to deploy. The `production` job additionally runs under the GitHub
`production` environment.

Required GitHub configuration (manual, cannot be done in code):

1. Create a GitHub **Environment** named `production` with **required
   reviewers** (approval gate). Until configured, the confirm input is the
   only gate — configure reviewers before relying on this pipeline.
2. Add environment secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
   Scope the API token to this account/zone with Workers Scripts:Edit,
   D1:Edit, and Queue permissions. Never put credentials in YAML.
3. Optional repository variable `PRODUCTION_URL` (defaults to
   `https://frigo.tungjpstore.net`).

The production job re-runs lint/typecheck/tests/migration-smoke/build, then:

1. **Pre-deploy schema gate (read-only):** `scripts/d1-schema-gate.sh remote`
   SELECTs the expected schema from remote D1. It does not mutate anything.
2. **Deploy:** `wrangler deploy --var GIT_COMMIT:<sha>`.
3. **Smoke:** `scripts/post-deploy-smoke.sh` — landing page, liveness, and
   readiness (must not be `unhealthy`, database must answer).

## Migrations

- Migrations are additive and replay-safe (`IF NOT EXISTS`); the smoke test
  proves replay idempotency locally.
- The pipeline **never applies remote migrations automatically**. If the
  schema gate fails because a new migration is missing, an operator applies
  it explicitly and re-dispatches:

  ```bash
  pnpm wrangler d1 migrations apply frigo-db --remote
  ```

- Order is validate → migration approval → deploy, so application code is
  never shipped onto an absent schema. New migrations are added to
  `scripts/migration-smoke.sh` (and `scripts/d1-schema-gate.sql`) as part of
  the same PR.

## Configuration safety (config gate)

`validateEnvironment(env)` (`src/worker/config/validation.ts`) runs on every
request in production (wired as `productionConfigGate`). Fatal issues reject
the request with `503 CONFIG_INVALID` plus sanitized issue **codes** —
messages never embed secret values or binding IDs. Non-production is never
gated; development runs via `pnpm dev:worker`, which forces
`--var ENVIRONMENT:development`.

Fatal in production: invalid `APP_URL` (loopback), `AI_MOCK_MODE=true`,
`WEEK_SCHEMA_MODE != dual`, `SCAN_QUEUE_MODE != async`, missing `DB`,
`CACHE`, `JWT_SECRET`, missing `AI` binding while mock off, missing
`SCAN_QUEUE` while async.

Warnings (reported, non-blocking): Turnstile key pair half-configured, no
email provider (`SEND_EMAIL` binding or `RESEND_API_KEY`), missing
`PLUS_GRANT_SECRET`. Feature-disabled features never require their secrets.

## Health / readiness

- `GET /api/v1/health` — public liveness, minimal payload (`status`, `app`,
  `timestamp`). No environment or feature-flag disclosure.
- `GET /api/v1/health/ready` — sanitized readiness for load balancers and
  operators: `status` ∈ `ok | degraded | unhealthy` (HTTP 200 / 200 / 503),
  per-service states (`database`, `queue`, `ai`, `email`, `rateLimiting`),
  config issue codes, and deployment traceability (`version`, `commit` from
  the `GIT_COMMIT` var). Unauthenticated but sanitized by construction — no
  secrets, tokens, or binding IDs.
- `GET /api/v1/config` — public Turnstile site key (unchanged).

## Scheduled cleanup

`wrangler.jsonc` sets a daily `0 3 * * *` UTC cron. `src/worker/services/cleanup.ts`
deletes, per retention window (env-overridable, days):

| Task | Target | Default |
| --- | --- | --- |
| expired OTPs | `auth_otps` past `expires_at` | `CLEANUP_OTP_RETENTION_DAYS=7` |
| expired sessions | `sessions` past `expires_at` | `CLEANUP_SESSION_RETENTION_DAYS=30` |
| terminal ready jobs | `scan_queue_jobs` status `ready` | `CLEANUP_READY_JOB_RETENTION_DAYS=30` |
| terminal failed jobs | `scan_queue_jobs` status `failed` | `CLEANUP_FAILED_JOB_RETENTION_DAYS=90` |

Properties: replay-safe (plain DELETEs, safe to run twice), never touches
`pending`/`processing` jobs or live rows, timestamps normalized through
`datetime(column)` because the app writes ISO strings while D1 defaults write
`YYYY-MM-DD HH:MM:SS`, production skips all cleanup when the config gate is
fatal, and per-task failures are reported (not thrown) so one bad table never
cancels the rest. KV `revoked_*` revocation entries are not enumerable and
rely on KV TTL — see docs/HOPLITE_HANDOFF.md.

## Rate limiting

`src/worker/middleware/rate-limit.ts`:

- **Primary:** Cloudflare KV — the only globally coherent limiter available.
- **Degraded (best-effort, default):** on KV failure or unbound namespace the
  limiter falls back to isolate-local counters, sets
  `X-RateLimit-Mode: degraded-isolate-local`, and logs a one-time warning.
  Isolate-local counters are NOT globally atomic (many isolates per worker)
  — this is abuse control, not enforcement.
- **Fail-closed:** `enforcement: 'fail-closed'` on a limiter (or the
  `RATE_LIMIT_ENFORCEMENT=fail-closed` var production-wide) rejects requests
  with `503 RATE_LIMIT_UNAVAILABLE` when KV fails in production. Recommended
  for security-critical limiters (auth/OTP — owned by Thread 2, not yet
  applied here to avoid touching auth routes). Do not use rate limiting for
  quota/financial enforcement.

## Rollback

- **Code rollback:** redeploy a known-good SHA — *Actions → Deploy → Run
  workflow*, `environment: production`, `confirm_production: true`,
  `ref: <previous-good-sha>`. Same gates run. Concurrency is serialized
  (`cancel-in-progress: false`), so an in-flight deploy must finish first.
- **Data rollback:** migrations are additive; going back a Worker version is
  safe against a schema that is a superset. Do NOT revert D1 migrations in
  production (no down-migrations exist). If a migration must be undone,
  restore from a D1 time-travel restore / export and treat it as an incident.
- **Week dual-write:** shadow writes keep legacy and canonical tables in sync
  during rollbacks; never flip `WEEK_SCHEMA_MODE` away from `dual` as part of
  a rollback (the config gate fails closed if you do).
- **Queue consumer:** the scan ledger (`scan_queue_jobs`) is additive and
  idempotent; after a rollback, in-flight jobs are re-claimed safely and
  poison messages still land in `frigo-scan-dlq`.
- **Config rollback:** if a config mistake shipped, fix the var/secrets and
  redeploy; the config gate blocks any request until configuration is valid
  (fail closed, loud).

## Traceability

Every deploy stamps `GIT_COMMIT` (Wrangler var). `/api/v1/health/ready`
exposes `commit` + `version` + `environment`; workflow logs show the exact
SHA deployed. Structured production request logs include `requestId`,
`method`, `path`, `status`, `durationMs` (response header `X-Request-Id`).
