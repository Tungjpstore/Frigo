# Frigo task board

## Completed release work

- T01-T07: COMPLETE.
- T01 ✅
- T02 ✅
- T03 ✅
- T04 ✅
- T05 ✅
- T06A ✅
- T06B ✅
- T07 ✅
- Release Integration ✅
- Release Publication ✅
- Main Integration ✅
- Main CI ✅

| Task | Status | Evidence |
| --- | --- | --- |
| T01 Domain/data foundation | COMPLETE | Preserved foundation and hardening lineage |
| T02 Recipe engine | COMPLETE | `0051276` / `ef13acd` in the merged release |
| T03 Ranking/personalization | COMPLETE | `01f9d87` / `3592de9` |
| T04 Weekly planner | COMPLETE | `ebd538b` |
| T05 Shopping/budget/waste | COMPLETE | `4f3f539` / `899b6d7` |
| T06A Backend/API/trust/persistence | COMPLETE | `9f420c0` / `ca60ced` / `c46330c` |
| T06B Frontend/UX/AI presentation/E2E | COMPLETE | `0fc78a4` / `6d4e873` |
| T07 Final hardening | COMPLETE | Final application SHA `0b20061e` |
| Release Integration | ✅ COMPLETE | Application integration in main at `23ef51d` |
| Release Publication | ✅ COMPLETE | Release docs published |
| Main Integration | ✅ COMPLETE | Main merge SHA `23ef51d6ec12a5a3e319a2d941dca39d2775cb9d` |
| Main CI | ✅ PASS | Run `34396319671` |

## Next authorized work

- Production Reconciliation ✅ COMPLETE - post-cutover verified
- Production DB Migration ✅ COMPLETE - `frigo-db` ledger `0001`-`0022`
- Controlled Production Deployment ✅ COMPLETE - Worker SHA `d1b06732`
- Planner Rollout ⏳

Do not invent T08. Planner rollout remains separately authorized work.

GitHub source of truth: main.
Current main head: `89eeb52a56f06d766d4ecbe3c4abf9993bbebcb6` (docs-only merge).
Deployed application SHA: `d1b06732f8a80db4e77986df31ff28d9f04641fa`.
Release Integration: COMPLETE.
Main Integration: COMPLETE.
PRE_CLEANUP_MAIN_HEAD: `41d2de6bc76331322cc63e8038432b0b02f60da1`.
APPLICATION INTEGRATION: complete in main at `23ef51d6ec12a5a3e319a2d941dca39d2775cb9d`.
Production reconciliation: COMPLETE - schema/code/health/traffic verified.
Production DB migration: COMPLETE - exact ledger `0001` through `0022`.
Production deployment: COMPLETE - version `48e0c366-3c8a-4f2b-a2d5-965785995431`.
Planner rollout: NOT STARTED.
Next task: POST-DEPLOY MONITORING / FUTURE GUARDED WORKFLOW SETUP.

## Frozen release evidence

- PRODUCTION_APPLICATION_BASE_SHA:
  `23ef51d6ec12a5a3e319a2d941dca39d2775cb9d`.
- Verified application SHA: `0b20061e7dc7405df68b18a18da4166e09494ecd`.
- Verified release head: `0420807968538f61b669569d064c404f67032174`.
- Previous final-head CI: `34405307196 SUCCESS`.
- Previous release deploy workflow: `34396457582 SUCCESS`.
- Full: **1,487 tests / 87 files PASS**; focused: **819 tests / 40 files PASS**.
- D1: **22 / 22 migrations PASS**; upgrade **0020 -> 0022 PASS**.
- Existing rows preserved: **776 rows / 58 tables**.
- Browser: **264 assertions / 36 phases PASS**.
- Payment-adjacent: **82 tests / 7 files PASS**.
- Previous docs-cleanup deploy workflow `34405457796`: packaging completed; staging was not
  provisioned and no staging deploy occurred. The current production cutover was
  completed directly with Wrangler OAuth because GitHub production configuration
  is not provisioned.

## PR #8 metadata and archival branches

PR #8 METADATA: `MERGED`, `isDraft=false`, merged and closed at
`2026-09-09T19:38:59Z`, merge commit `23ef51d6ec12a5a3e319a2d941dca39d2775cb9d`.
Application integration is complete in main at `23ef51d`; do not merge PR #8 or
kirrha again. Kirrha remains archival documentation-only divergence.

## Protected areas

PayOS/payment code untouched.

No real payment performed.

Local production source checkout is untouched; the production D1 schema was
updated only through the approved additive migrations.

## Production cutover receipt (2026-09-10)

- Worker readiness: `status=degraded`, `environment=production`, full commit
  `d1b06732f8a80db4e77986df31ff28d9f04641fa`; active version
  `48e0c366-3c8a-4f2b-a2d5-965785995431` at 100%.
- Landing/liveness/readiness smoke passed; readiness database/queue/AI/email are
  healthy/configured and only `CONFIG_PLUS_GRANT_SECRET_MISSING` remains as a
  warning.
- Remote D1 exact ledger is `0001`-`0022`; schema gate passes and FK violations are `0`.
- Strict Week reconciliation passes 2/2 plans with 0 orphans and 0 mismatches.
- Preserved counts: users 28, households 28, inventory items 13, recipes 59,
  meal plans 2, scan queue jobs 15, sessions 2 and auth OTPs 0.
- Backup export is retained at
  `.artifacts/frigo-db-pre-main-d1b0673-20260910T205627Z.sql` with
  SHA-256 `000c9cb88d6045afb19cca6ce3e1caa308b20ffa214dbb2cddfca0cb78d722eb`.
- CORS allows the exact trusted origin and emits no ACAO for path-bearing,
  localhost or arbitrary origins. No planner flag, PayOS/payment path or secret
  value was changed. The separate T08 `xanthos` branch contains
  application/migration changes and is not part of authoritative `main`.
