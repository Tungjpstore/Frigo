# T07 production-readiness review

## Status

**T07 COMPLETE WITH NON-BLOCKING FOLLOW-UPS.** Frozen source
`f9d2ff871da155ba7f1aaedd3112a5ed6ea8d2c0` passed all local gates: **1,487/87 full**,
**819/40 focused**, lint/types/build/migration/clean local D1/schema and **264 browser
assertions**. Exact final receipt: `T07_VERIFICATION.md`.
This document is not deployment authorization. No production flags were enabled,
no remote migrations ran, and no deployment was requested.

Original T07 branch: `hoplite/lipara-d81160ee`.
Continuation checkpoint: `006742bc179d58aae53106c88aff8a2667dbd1ca`.
Writable continuation: `hoplite/prokonnesos-74e71894`.
This is intentional Hoplite publisher topology, not an architecture issue.
Exact `f391804` and all earlier checkpoints are preserved ancestors.

## Findings

| Severity | Finding | Disposition / evidence |
| --- | --- | --- |
| Critical | None reproduced in audited planner/integration scope | Not an application-wide or live-production certification |
| High | Mounted private plan could persist across in-place A→B session reset | Fixed: force query-owner reevaluation; mounted regression and H5 receipt |
| Medium | Raw-path limit permitted multi-plan/action compute fan-out | Fixed: planner-only aggregate account budget, preserving per-path policies; H2 |
| Medium | CAS success could reread and return a later writer's revision | Fixed: return own conditional UPDATE RETURNING row; controlled race; H3 |
| Medium | Failed 409 refresh hid last accepted plan; success retained obsolete conflict | Fixed: validated independent refresh, preserve failure state and clear success error; H5 |
| Low | Shopping DTO accepted currency/scale contradiction | Fixed cross-field schema check; current money formatting/calculation never relied on contradictory scale; H4 |
| Informational | Original branch was this thread's protected base | Resolved by user-authorized continuation; exact checkpoint published |

No speculative algorithm, schema, authentication or production infrastructure fix.
No T02–T05 scoring/allocation/optimality semantics changed.

## Explicitly retained limitations

- **Medium, abuse/capacity:** KV is eventually consistent/non-atomic; a controlled
  twelve-request race admits all twelve and stores count one. New account key fixes
  path fan-out, not exact global quotas. Hard per-request bounds remain; staged
  rollout must monitor load. No atomic reservation platform was introduced.
- **Medium, capacity:** simultaneous initial same-key requests can compute twice
  before the single durable scoped unique-key winner. Exactly one plan persists;
  different intents conflict. Avoiding duplicate CPU requires recovery-safe
  reservations, deferred rather than risking permanently stuck requests.
- **Low, cost:** native AI response deadline cannot cancel already-started binding
  computation; results arriving late are ignored. AI stays separately opt-in.
- **Low, quality:** T05 option clipping uses binary ID order; result remains bounded
  best-known with OPTION_LIMIT, not globally optimal. Alternative titles are catalog
  suggestions, not eligibility guarantees; actual swap rechecks all hard constraints.
- **Low, time:** explicit fixed-offset planning is not DST/IANA timezone support;
  expiry unknown/estimated/use-by/best-before and mid-horizon freshness remain
  conservative and visible rather than invented certainty.
- **Low, capacity:** inventory/recent-feedback/catalog sorts and snapshot-wide
  reads should be remeasured on larger local fixtures before adding indexes. No N+1
  inside search; measured current queries already use ownership indexes.
- **Low, UX:** browser transport has no custom global deadline; no automatic
  expensive retry/offline queue. Reload/current-plan discovery is the existing
  recovery path for a stalled browser network request.

These do not change food-safety authority, tenant isolation, durable idempotency or
stock integrity. They constrain rollout claims and are not hidden as completed
optimizations. Production reviewed-catalog/safety coverage, remote schema readiness,
provider capacity and release authorization were not assessed against live data.

## Evidence map

- `T07_H1_SECURITY.md`: actual-cookie authorization/creator-private/spoofing matrix.
- `T07_H2_ABUSE.md`: failing fan-out reproduction, fixed budget and exact KV limits.
- `T07_H3_PERSISTENCE.md`: controlled races, composite constraints, queries and local D1.
- `T07_H4_DOMAIN.md`: money/quantity/unknown/proof/temporal/cap audits and regressions.
- `T07_H5_FRONTEND.md`: mounted session/routing/recovery, grounded AI and flags.
- `T07_H6_OPERATIONS.md`: actual endpoint latency/query/payload observations,
  failure privacy, staged rollout and nondestructive rollback.
- `T07_VERIFICATION.md` records the exact source freeze, command receipts and fresh
  browser results; historical `T07_BASELINE.md` is not final verification.

## Release gate

A successful local final audit can establish a **release candidate**, not permission
to deploy. Require exact-head hosted CI, operator remote schema gate, reviewed
production data policy and existing release approval before any rollout. Existing
CI does not trigger on this continuation's configured PR base and has no manual
entrypoint: **hosted CI not verified** unless separately observed. Do not modify
unrelated production infrastructure to force it.

**PayOS/payment code untouched.** Inventory commands, household isolation and
legacy Week compatibility remain protected. No remote/production data or private
recordings are used as audit proof.
