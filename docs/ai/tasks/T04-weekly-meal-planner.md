# T04 — Weekly Meal Planner

## Task ID

T04

## Title

Weekly Meal Planner

## Objective

Create a deterministic seven-day planner that selects meals sequentially against a projected, lot-aware inventory state. It must honor hard constraints, preserve locks, model consumption/leftovers, and return explicit infeasibility rather than independently selecting meals or silently falling back.

## Dependencies

T02 and T03 complete.

## Context

Frigo already has a Week planner/persistence flow, including dual-write/reconciliation safeguards. Current implementation is not the new planner contract: it has first-lot matching and unsafe fallback behavior. This task must integrate incrementally, preserve reconciliation and existing users, and make state projection deterministic.

## In Scope

- Define planner request/result contracts for start date, seven days, meal slots/day, household servings, hard dietary/allergy/nutrition/time constraints, variety rules, locks, leftovers, and stated planning policy.
- Simulate ordered meal selection: allocate compatible inventory lots for Monday before assessing Tuesday, and continue through every slot/day.
- Reuse T02 availability/allocation and T03 eligibility/ranking; avoid independent per-slot selection.
- Track projected consumption, remaining inventory, lot expiry priority, leftovers and their safe reuse/expiry constraints, generated missing requirements, and explanation-safe decision traces.
- Support locked/user-selected meals and deterministic swaps/replanning without silently violating locks.
- Return a typed feasible plan, partial plan with explicit unmet constraints, or infeasible result with causes and relaxable constraints. No arbitrary fallback recipe.
- Integrate persistence carefully with current Week schema/dual-write/reconciliation strategy; use transactions/optimistic concurrency/tenancy conventions already present.
- Test sequential depletion, same ingredient used twice, lot expiry ordering, locked slots, leftovers, no candidate case, hard allergy/nutrition/time constraints, empty inventory, and deterministic repeatability.

## Out of Scope

- Full budget/package optimization and shopping checkout, AI plan generation/explanation, visual redesign, payment, or unrelated Week schema replacement.

## Required Deliverables

- A planner module with explicit simulation state and failure model.
- Safe persistence bridge or documented shadow/canary path compatible with Week dual-write/reconciliation.
- Regression and integration tests that prove sequential state is used rather than per-meal independent matching.
- Protocol/ADR updates for planner semantics, leftovers, concurrency, and legacy migration when applicable.

## Acceptance Criteria

- If Monday consumes 300 g from 500 g chicken, later slots observe only the remaining compatible quantity; they cannot each claim the original 500 g.
- Planner never selects a recipe disallowed by T03 eligibility and never bypasses unresolved hard safety constraints.
- Locked meals survive regeneration; a conflict yields a documented infeasible/needs-user-choice state.
- Expired/unavailable lots are not allocated. Near-expiry lots are prioritized only when this does not violate hard safety/constraint rules.
- An empty eligible candidate set or impossible constraints returns an explicit result with machine-readable reasons, not a generic fallback meal.
- Existing Week reconciliation and ownership/idempotency/version rules remain intact and tested for affected routes.

## Verification

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm check:migrations
pnpm build
```

Run targeted Week integration tests using `tests/helpers/sqlite-d1.ts`, including transaction/concurrent-update cases where persistence changes. Record exact results and manually inspect serialization/API contracts if touched.

## Known Risks

- Sequential simulation can become computationally expensive; start with bounded deterministic search and document limits rather than silently timing out.
- Date/timezone and best-before versus use-by semantics affect allocation safety.
- Existing Week dual-write schema is a protected compatibility concern; no one-way cutover without parity/reconciliation evidence.

## Protected Areas

PayOS/billing, unrelated auth/cookies, deployment, scan-confirm, and unapproved changes to Week dual-write/reconciliation. Do not introduce budget optimization beyond surfacing requirements.

## Expected Handoff

Update state with the planner algorithm, state model, bounded-search policy, persistence mode, compatibility/reconciliation evidence, and all test results. T05 begins from one persisted/projected plan state and its aggregated requirements; it must not recalculate each meal independently.
