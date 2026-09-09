# Inventory Truth current state

Updated: 2026-09-09 UTC, after final local verification
Current Task: T08
Current Phase: T08F Verification/Handoff — local gates passed; canonical publication blocked
Status: IN_PROGRESS
Canonical Branch: feature/t08-inventory-truth-foundation
Base Main SHA: d1b06732f8a80db4e77986df31ff28d9f04641fa
Current HEAD: dd2ecc6f7066250dfdc5214a3d6c356e1479b61e (code checkpoint before this docs-only handoff; resolve final tip with git rev-parse HEAD)
Last Verified SHA: dd2ecc6f7066250dfdc5214a3d6c356e1479b61e
origin/main SHA: d1b06732f8a80db4e77986df31ff28d9f04641fa
Main Has Diverged Since Base: NO (last fetch)
Do Not Merge To Main: YES
Production Deployment Allowed: NO
Remote D1 Migration Allowed: NO

## Completed

T08A–E implemented: audited dependency map; strict location/lot/quantity/money/
expiry/provenance contracts; additive 0023 schema; explicit insert-only guarded
backfill; compatibility projection; diagnostic parity. Existing runtime unchanged.
130 focused tests and full 1,617 tests / 89 files PASS. Lint/typecheck/build,
23-migration clean replay, populated 0022 upgrade, local D1 apply/schema gate and
diff checks PASS. Three implementation commits plus initial docs checkpoint exist.
See VERIFICATION.md for exact commands, failures corrected and limits.

## In Progress

Canonical branch publication/unblocking; this checkpoint records the final local handoff.

## Not Started

T09–T12; deliberately not implemented. T08 final COMPLETE report withheld until
canonical publication and clean-tree completion gate are satisfied.

## Known Problems

Canonical push is CONFIRMED BLOCKED by the trusted broker. It permits the original
thread branch/stack or linked open PR head, not the user-required canonical branch.
No linked PR exists; no alternate branch was pushed. Platform feedback filed.
Shell fetch is blocked; explicit main fetch via broker succeeds.
No unresolved local test failures. No main divergence or numbering conflict seen.

Foundation limitations: sub-milli/overflow/invalid quantities block backfill without
rounding; unsupported legacy data needs explicit reconciliation. Raw invalid/unknown
expiry remains unpromoted. Snapshots are not live dual-write: legacy mutation and
guest household transfers produce parity drift, never automatic lot changes.

## Exact Next Action

Obtain a platform-authorized publication path for ONLY
feature/t08-inventory-truth-foundation (e.g. authorized canonical head binding).
Then inspect status, canonical remote head and Last Verified SHA..HEAD; publish
the docs-inclusive tip with the trusted broker and its exact remote-head lease.
Do not use hoplite/* instead, force-push, merge/rebase main, deploy or touch remote
D1. Only after confirmed push and clean tree, record the final T08 report and
completion receipt. T09 must not start automatically.
