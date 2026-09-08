# T07 — Hardening / Tests / Final Architecture Review

## Task ID

T07

## Title

Hardening / Tests / Final Architecture Review

## Objective

Perform a final evidence-based hardening pass over the Recipe and Weekly Meal Planning subsystem. Correct justified defects in integrity, authorization, performance, concurrency, migration safety, and frontend/backend contracts without expanding product scope.

## Dependencies

T01 through T06 complete.

## Context

The subsystem spans static legacy catalogues, D1 raw-SQL persistence, Hono APIs, domain packages, Worker middleware, React client state, and AI augmentation. Existing Frigo also has sensitive tenant/auth, scan, Week dual-write/reconciliation, and PayOS surfaces. Treat code, migrations, tests, and `docs/ai` as the source of truth; audit actual behavior, not design intent.

## In Scope

- Review all task outputs and trace inventory → candidate → eligibility/ranking → sequential plan → shopping/waste → API/UI/AI flows.
- Test database constraints, foreign keys, uniqueness, indexes/query plans, migration replay, additive upgrade safety, and reconciliation where relevant.
- Audit household authorization, mass assignment, ID handling, transaction boundaries, idempotency/version conflicts, stale inventory/plan updates, retries, and concurrency.
- Audit quantity precision/rounding, compatible-unit behavior, package contexts, nutrition bases/provenance, allergy/unknown-data refusal, date/timezone, storage/opened/expiry, empty inventory, no recipes, and impossible budget/plan cases.
- Identify and fix real N+1/query performance issues, unsafe fallbacks, contract mismatches, regression defects, and documented legacy bridges that can now be safely retired.
- Exercise duplicate ingredients across recipe stages, repeated planner swaps, stale snapshots and bounded-search exhaustion; prove no planner loop, double allocation or stale nutrition/price reuse can bypass constraints.
- Run comprehensive automated checks plus focused integration/browser verification and update all protocol documents with final reality.

## Out of Scope

- New recommendation, planning, shopping, AI, or frontend product features; broad rewrites; payment/checkout changes; unapproved auth/deployment changes; speculative refactors.

## Required Deliverables

- A written final review with findings, fixes, explicit accepted limitations, and migration/rollback implications.
- High-value regression/integration tests for every corrected defect and critical boundary.
- Query/index evidence for any performance change; no unused speculative indexes.
- Final `CURRENT_STATE.md`, `TASK_BOARD.md`, `HANDOFF.md`, and ADR updates containing exact verification results and deployment/recovery guidance.

## Acceptance Criteria

- Critical deterministic paths reject or explicitly report allergy conflicts, unknown safety data, incompatible units, empty candidate sets, exhausted lots, impossible constraints, and impossible budgets.
- Mutations preserve household isolation, transaction/idempotency/version invariants, and do not create double consumption or double shopping subtraction under retry/concurrency tests.
- Planner state, shopping requirements, and UI/API payloads agree on quantities, units, provenance, and infeasibility representation.
- Migration replay passes on a clean D1-compatible SQLite database with foreign keys enabled; no destructive rollback prescription is required for additive migrations.
- Full requested checks pass or every non-passing/unavailable command has a specific, reproducible reason and remediation path.
- No unreviewed PayOS, unrelated auth, or deployment change is introduced.

## Verification

At minimum run and record:

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm check:migrations
pnpm build
```

Run focused D1 integration tests through `tests/helpers/sqlite-d1.ts` (Node 22.13+; working development runtime is Node 24), affected Worker/API tests, and browser/UI checks with fresh inspected evidence. Run only safe local schema/reconciliation commands unless production authorization is explicit.

## Known Risks

- Legacy static/D1 catalogue coexistence can remain a planned limitation; do not conceal divergence as a pass.
- Data migrations are durable; roll forward with additive repairs rather than deleting applied migrations.
- Optimization/search performance may depend on household/catalogue size; measure representative bounds before adding indexes or changing behavior.

## Protected Areas

PayOS/payment/billing/webhooks, unrelated auth/session/CSRF behavior, deployment production infrastructure, and unrelated application areas. Preserve existing Week dual-write/reconciliation protections unless a tested, documented cutover is explicitly authorized.

## Expected Handoff

Close the task only with an auditable final handoff: commit/Git state, feature inventory, schema/migration state, exact command results, regression coverage, screenshots/interaction evidence where UI changed, accepted limitations, and precise follow-up actions. Mark the task board complete only when evidence supports it.
