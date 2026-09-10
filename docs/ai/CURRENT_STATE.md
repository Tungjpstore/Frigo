# Frigo current state - final PR metadata reconciled

## Release status

- T01-T07: COMPLETE.
- T01: **COMPLETE**
- T02: **COMPLETE**
- T03: **COMPLETE**
- T04: **COMPLETE**
- T05: **COMPLETE**
- T06A: **COMPLETE**
- T06B: **COMPLETE**
- T07: **COMPLETE**
- Release Integration: **COMPLETE**
- Release Publication: **COMPLETE**
- Main Integration: **COMPLETE**
- Main CI: **PASS**
- Production reconciliation: **COMPLETE - SCHEMA AND WORKER CUTOVER VERIFIED** (2026-09-10).

## Authoritative source

- GitHub source of truth: main.
- Deployed application SHA: `d1b06732f8a80db4e77986df31ff28d9f04641fa`.
- Commits after the deployed application are documentation-only receipt merges;
  verify the current `main` head from GitHub when preparing a later release.
- PRODUCTION_APPLICATION_BASE_SHA:
  `23ef51d6ec12a5a3e319a2d941dca39d2775cb9d`.
- PRE_CLEANUP_MAIN_HEAD: `41d2de6bc76331322cc63e8038432b0b02f60da1`.
- APPLICATION INTEGRATION: complete in main at `23ef51d6ec12a5a3e319a2d941dca39d2775cb9d`.
- Verified application SHA: `0b20061e7dc7405df68b18a18da4166e09494ecd`.
- Verified release head: `0420807968538f61b669569d064c404f67032174`.
- Main head before this correction: `41d2de6bc76331322cc63e8038432b0b02f60da1`.
- The main merge tree is source-equivalent to the verified release head.
- Every change after the application base is documentation-only.

## Verification snapshot

| Gate | Result |
| --- | --- |
| Full suite | 1,487 tests / 87 files PASS |
| Focused T02-T07 | 819 tests / 40 files PASS |
| Clean D1 | 22 / 22 migrations PASS |
| Upgrade sanity | 0020 -> 0022 PASS |
| Existing data | 776 rows / 58 tables preserved |
| Browser | 264 assertions / 36 phases PASS |
| Payment-adjacent | 82 tests / 7 files PASS |
| Main CI | 34396319671 SUCCESS |
| Previous final-head CI | 34405307196 SUCCESS |

These are the preserved release gates; the post-cutover local gates and remote
schema/Week checks are recorded in the receipt below.

## Deployment and production boundary

- Previous release deploy workflow `34396457582`: **SUCCESS**.
- Previous docs-cleanup deploy workflow `34405457796`: **SUCCESS**.
- Release packaging completed.
- Staging was not provisioned; no staging deployment occurred.
- Production DB migration: **COMPLETE** - D1 `frigo-db` ledger contains exactly `0001` through `0022`; `0019` -> `0022` were applied in order before the Worker cutover.
- Production deployment: **COMPLETE** - Worker deployed directly with Wrangler OAuth from clean SHA `d1b06732f8a80db4e77986df31ff28d9f04641fa` because the GitHub production environment/secrets are not provisioned.
- Production reconciliation: **COMPLETE** - post-cutover source, schema, health and traffic checks passed.
- Active deployment: Cloudflare version `48e0c366-3c8a-4f2b-a2d5-965785995431`, 100% traffic, deployed 2026-09-10T21:08:00Z.
- Planner rollout: NOT STARTED.
- No production secrets were changed; existing secret names include `JWT_SECRET`, `OTP_HASH_SECRET`, `TURNSTILE_SECRET_KEY` and `GROQ_API_KEY`.

## Production cutover receipt (2026-09-10)

Verified against `https://frigo.tungjpstore.net` after the cutover:

- Worker readiness: HTTP 200, `status=degraded`, `environment=production`, and
  full `commit=d1b06732f8a80db4e77986df31ff28d9f04641fa`; database/queue/AI/email
  are `ok`/`configured`, rate limiting is `kv-best-effort`, and the only issue is
  the non-blocking warning `CONFIG_PLUS_GRANT_SECRET_MISSING`.
- Liveness and landing smoke: `GET /` and `GET /api/v1/health` returned HTTP 200;
  readiness smoke passed with database `ok` and no fatal configuration issue.
- Exact remote schema gate: PASS; migration ledger is exactly 22 entries
  (`0001`-`0022`), foreign-key violations are `0`, and the Week strict
  reconciliation is 2/2 plans with 0 orphan rows and 0 mismatches.
- Key preserved row counts: users 28, households 28, inventory items 13,
  recipes 59, meal plans 2, scan queue jobs 15, sessions 2, auth OTPs 0.
- CORS verification: the exact trusted origin receives its own ACAO header;
  path-bearing, localhost and arbitrary origins receive no ACAO header.
- Backup retained at `.artifacts/frigo-db-pre-main-d1b0673-20260910T205627Z.sql`,
  mode 600, 521095 bytes, SHA-256
  `000c9cb88d6045afb19cca6ce3e1caa308b20ffa214dbb2cddfca0cb78d722eb`.
- Deployment used a clean detached checkout at the approved main SHA and
  `GIT_COMMIT` injection only; no planner flag, PayOS/payment path or secret
  value was changed.

## Verification commands

- `pnpm lint`: PASS.
- `pnpm typecheck`: PASS.
- `pnpm check:migrations`: PASS (`migration-smoke=ok`).
- `pnpm build`: PASS.
- `pnpm test`: 1,427/1,487 passed; 60 failures are confined to the two known
  shell/jsdom UI suites (`localStorage`/`container` unavailable). Hosted exact-SHA
  CI run `34413458369` remains the authoritative 1,487/87 PASS gate.
- `pnpm schema:check:remote`: PASS; `pnpm week:reconcile:remote -- --strict --json`: PASS.
- `pnpm audit --prod`: 2 moderate `react-router` advisories via
  `react-router-dom` (patched upstream at 7.18.0; major upgrade not included in
  this cutover). Full dependency audit reports 21 findings, with the remainder
  confined to development/tooling paths (`wrangler`/`miniflare`/`jsdom`).

## PR #8 metadata

PR #8 METADATA:

Authoritative GitHub state: `MERGED`, `isDraft=false`,
`mergedAt=2026-09-09T19:38:59Z`, `closedAt=2026-09-09T19:38:59Z`,
`mergeCommit=23ef51d6ec12a5a3e319a2d941dca39d2775cb9d`, base `main`, head
`hoplite/kirrha-5f4057f0` at `0420807968538f61b669569d064c404f67032174`.

Application integration and PR metadata are separate facts: application
integration is complete in main at `23ef51d`; PR #8 was already merged and was
not reopened, re-merged or modified.

## Kirrha archival state

Kirrha is two commits ahead of current main and differs in four `docs/ai/` files
only. There are no application differences on that historical branch that are
absent from main. Do not merge or revert kirrha.

## Protected areas

PayOS/payment code untouched.

No real payment performed.

## Next task

Next task: MONITORING / OPTIONAL GITHUB PRODUCTION ENVIRONMENT SETUP

The schema/code cutover is complete and verified. Keep planner flags at their
safe defaults, do not touch PayOS/payment, and do not use a down-migration.
Monitor the Worker and queue for the normal post-deploy window. For future
releases, configure the GitHub `production` environment, `PRODUCTION_URL`, and
Cloudflare secrets so the guarded workflow can produce its own receipt; the
current deployment receipt is the direct Wrangler deployment above. Rollback is
code-only to a schema-compatible SHA, with D1 restore/export reserved for an
incident.

The deployed receipt is anchored to main SHA
`d1b06732f8a80db4e77986df31ff28d9f04641fa`; the pre-cleanup main head is
`41d2de6bc76331322cc63e8038432b0b02f60da1`.
