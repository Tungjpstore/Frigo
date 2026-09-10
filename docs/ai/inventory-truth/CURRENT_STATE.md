# Inventory Truth current state

Updated: 2026-09-10 UTC, user-authorized publication
Current Task: T08
Current Phase: T08F Verification/Handoff — authorized publication and final gate rerun
Status: READY_FOR_VERIFICATION
Canonical Branch: hoplite/xanthos-7d942897 (user-approved handoff/publication branch; DEC-006)
Original Local Branch: feature/t08-inventory-truth-foundation
Base Main SHA: d1b06732f8a80db4e77986df31ff28d9f04641fa
Current HEAD: 4cc290f8ea2be4000bc1368abd780ef25204b3a5 (before this docs-only authorization checkpoint; resolve final tip with git rev-parse HEAD)
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

Publication on the explicitly authorized Hoplite branch and fresh local gate rerun.

## Not Started

T09–T12; deliberately not implemented. T08 final COMPLETE report withheld until
canonical publication and clean-tree completion gate are satisfied.

## Known Problems

Historical blocker, superseded by DEC-006: original canonical push was blocked by
the trusted broker. It permits the original
thread branch/stack or linked open PR head, not the user-required canonical branch.
No linked PR exists; no alternate branch was pushed. Platform feedback filed.
2026-09-10: user reconfirmed vn-2c/Frigo; all attached packets are identical to
the original T08 scope. Remote canonical branch/open PR still absent. Publishing
the complete b5577ea checkpoint through the broker was again denied by the same
branch authority rule. Repository identity is resolved; publication authority is not.
Shell fetch is blocked; explicit main fetch via broker succeeds.
No unresolved local test failures. No main divergence or numbering conflict seen.
No code changed since Last Verified SHA. Full/focused checks are being rerun for
the publication session; the preceding publication-only session did not rerun tests.

Foundation limitations: sub-milli/overflow/invalid quantities block backfill without
rounding; unsupported legacy data needs explicit reconciliation. Raw invalid/unknown
expiry remains unpromoted. Snapshots are not live dual-write: legacy mutation and
guest household transfers produce parity drift, never automatic lot changes.

## Exact Next Action

Publish the docs-inclusive tip to `hoplite/xanthos-7d942897` using the trusted
broker and exact remote-head lease. Finish local verification and record the final
T08 report only after confirmed publication and clean tree. Do not force-push,
merge/rebase main, deploy or touch remote D1. T09 must not start automatically.
