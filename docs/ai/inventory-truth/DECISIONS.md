# T08 architecture decisions

## DEC-001 — Isolated foundation authority

Context: T01–T07 release reconciliation proceeds independently on main.
Decision: Only canonical T08 branch; current legacy readers/writers remain intact.
Reason: Foundation must not change existing production inventory behavior.
Alternatives: Immediate cutover/dual-write rejected as T09+ scope.
Consequences: Lots are an explicit point-in-time foundation snapshot, not live truth.
Related files: MASTER_CONTEXT.md; future T08 leaf domain/repository modules.
Related commit: Initial T08 documentation checkpoint (see git log).

## DEC-002 — Exact bounded milli-quantity adapter, no runtime rewrite

Context: Legacy REAL accepts quantities not representable at a fixed scale; T02
already has exact Quantity arithmetic. SQLite text casts may lose number precision.
Decision: Persist safe-integer milli-units of g/ml/piece/pack/bunch/slice; adapt
kg/l exactly through Quantity. Reject negative, nonfinite, overflow or sub-milli
quantities before writes, with source row diagnostics. Never round them silently.
Reason: Small deterministic foundation without rewriting existing quantity paths.
Alternatives: REAL lots rejected for drift; arbitrary precision SQL decimal/rational
engine deferred. Runtime REAL and Quantity implementation are unchanged.
Consequences: Backfill is an explicit internal TypeScript operation, not an automatic
data SQL migration. Unsupported legacy data blocks the household batch unchanged;
operator reconciliation or a separately reviewed representation extension is needed.
Related files: inventory-truth leaf modules and 0023 schema.
Related commit: T08 implementation checkpoint (see git log).

## DEC-003 — Preserve unknown legacy identity and expiry evidence

Context: Ingredient FK may be NULL; legacy expiry can exist without kind/source.
Decision: Nullable ingredient plus raw name; raw legacy expiry/kind/source are retained
separately. Only explicit best_before/use_by with non-unknown, non-estimated source
maps to dated label evidence. Estimated source OR kind remains ESTIMATED; otherwise
UNKNOWN. KNOWN means a supplied dated fact, never independent verification/safety.
Reason: No fabricated ingredient, purchase time, receipt, price or date authority.
Alternatives: Infer from freshness/added_date/data_source/default shelf life rejected.
Consequences: Malformed dates are retained raw but not projected as trusted dates.
Money/purchasedAt stay NULL; openedAt accepted only if an existing valid instant.
Related files: lot adapter/domain contracts; legacy fields remain untouched.
Related commit: T08 implementation checkpoint (see git log).

## DEC-004 — Point-in-time explicit backfill; no parallel live inventory

Context: Old writers continue changing/deleting inventory_items after T08.
Decision: Deterministic lot/location IDs, unique LEGACY_BACKFILL source identity,
insert-only retries. Preflight validates all supplied rows before atomic D1 batch;
source row snapshot guards reject stale insertion. No source FK to inventory_items,
triggers on old writers, mutation endpoint, live sync or event changes.
Reason: Preserve legacy commands and history; dual-write/event authority is T09.
Alternatives: SQL rounding, update-on-retry, automatic dual-write rejected.
Consequences: Parity proves an explicit snapshot, not perpetual equivalence; later
legacy edits/deletes/new rows are surfaced as drift, never overwritten on rerun.
Household-scoped repository helpers require an already authorized server caller.
Related files: repository backfill, projection/parity, persistence tests.
Related commit: T08 implementation checkpoint (see git log).

## DEC-005 — Source revision and safe publication boundaries

Context: Guest transfer can change legacy household without a revision bump; the
platform denies publishing this user-required canonical branch from this thread.
Decision: Preserve legacyVersion separately from initial lot version=1, and guard
all backfilled source fields in the atomic insert. No FK to mutable legacy identity.
Keep IN_PROGRESS while publication is blocked; do not substitute a hoplite branch.
Reason: Preserve old commands, diagnose source drift and respect both authorization
and the user's explicit only-canonical-push requirement.
Alternatives: Modify auth or silently change branch rejected. T09 owns transition policy.
Consequences: Local verification is not cross-account Git availability or completion.
Related files: packages/db/src/inventory-truth.ts; CURRENT_STATE.md; VERIFICATION.md.
Related commit: dd2ecc6f7066250dfdc5214a3d6c356e1479b61e (code); following docs checkpoint.

## DEC-006 — User-approved publication branch substitution

Context: Trusted publication rejected the requested feature branch; the user
explicitly approved `hoplite/xanthos-7d942897` instead on 2026-09-10.
Decision: That exact branch is the canonical cross-account handoff/publication
branch. Fast-forward it to the existing T08 lineage without rewriting any commit.
Reason: Satisfy durable Git handoff within both user and platform authorization.
Alternatives: Credential/policy bypass, force push or main publication remain forbidden.
Consequences: Supersedes only canonical-name clauses in DEC-001/005 and the original
task packet. All no-main/no-deploy/no-remote-D1/no-PayOS boundaries are unchanged.
The original feature branch remains a local historical alias, not the published source.
Related files: MASTER_CONTEXT.md; CURRENT_STATE.md; T08 task packet and final report.
Related commit: docs-only authorization checkpoint after 4cc290f (see Git log).
