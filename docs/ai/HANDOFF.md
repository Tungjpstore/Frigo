# Frigo AI Handoff - GitHub release finalized

## Authoritative release

AUTHORITATIVE REPOSITORY: `vn-2c/Frigo`

AUTHORITATIVE BRANCH: `main`

MAIN_RELEASE_SHA: `23ef51d6ec12a5a3e319a2d941dca39d2775cb9d`

VERIFIED APPLICATION SHA: `0b20061e7dc7405df68b18a18da4166e09494ecd`

VERIFIED RELEASE HEAD: `0420807968538f61b669569d064c404f67032174`

MAIN CI: `34396319671 SUCCESS`

DEPLOY WORKFLOW: `34396457582`

PRODUCTION: **NOT DEPLOYED**

T01-T07 and the release integration/publication are complete. The main merge
tree is source-equivalent to the verified release head. The only changes in this
final cleanup are the four `docs/ai/` release protocol documents.

## Verification receipt

- Full: 1,487 tests / 87 files PASS.
- Focused: 819 tests / 40 files PASS.
- D1 clean: 22 / 22 migrations PASS.
- Upgrade sanity: 0020 -> 0022 PASS.
- Existing rows preserved: 776 rows / 58 tables.
- Browser: 264 assertions / 36 phases PASS.
- Payment-adjacent: 82 tests / 7 files PASS.
- Final release CI: PASS.

The application gates above are preserved evidence; they were not rerun during
this docs-only cleanup. Deploy packaging completed, staging was not provisioned
and no staging deployment occurred, and production deployment was not performed.

## Production boundary

PRODUCTION LOCAL RECONCILIATION NOT STARTED

PRODUCTION DATABASE MIGRATION NOT PERFORMED

PRODUCTION DEPLOYMENT NOT PERFORMED

Checked-in planner/UI/AI safe defaults remain under the existing rollout policy.
Live production values and secrets were not inspected. PayOS/payment code is
untouched and no real payment was performed.

## Historical PR state

PR #8 is historical/obsolete as an integration vehicle. GitHub already shows it
closed and merged into `main` at `23ef51d6ec12a5a3e319a2d941dca39d2775cb9d` before
this cleanup, so no close-without-merge action can be taken. Later `kirrha`
commits are stale release documentation only and must not be merged or reverted.

## Next task

Reconcile currently running production-local source against MAIN_RELEASE_SHA
before any production update.

**Do NOT git pull/reset directly inside running production.**

Production-local source must first be snapshotted and compared. Do not SSH for
changes, deploy frontend/Worker, apply remote D1 migrations, enable planner
flags, restart production, or alter production configuration as part of this
bookkeeping task.

The next task may use the eventual post-cleanup GitHub `main` head as its source
of truth, with application lineage anchored at
`23ef51d6ec12a5a3e319a2d941dca39d2775cb9d`.
