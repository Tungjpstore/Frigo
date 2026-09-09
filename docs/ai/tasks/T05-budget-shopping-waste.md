# T05 — Budget / Shopping / Waste Optimizer

## Task ID

T05

## Title

Budget / Shopping / Waste Optimizer

## Objective

Optimize a completed projected plan into a transparent household shopping and waste result: subtract inventory once, respect package/contextual units, apply valid price data/currency, and report feasible or impossible budgets without fabricated purchases.

## Dependencies

T04 complete.

## Context

Frigo has legacy shopping aggregation and price/package tables. Its existing domain utilities must be audited against T01 strict unit semantics and T04 sequential allocations before reuse. A shopping calculation is plan-level, not a sum of independently re-evaluated meals.

## In Scope

- Aggregate all unallocated plan requirements by canonical ingredient and compatible normalized unit after T04 simulation, subtracting eligible inventory exactly once.
- Preserve source meals, allocated lots, shortages, unit compatibility, rounding policy, optional items, pantry-staple policy, and unresolved requirements.
- Model optional/package-specific purchase recommendations only where an explicit package size and compatible physical unit exist. Keep `pack`, piece, bunch, slice and retailer contexts non-convertible unless explicit metadata supports it.
- Add/extend price observations with amount, currency, unit/basis, source, timestamp, quality, locality/retailer optionality, and provenance as needed. Do not treat missing or stale prices as factual.
- Produce budget totals/ranges, currency-consistent comparisons, waste/leftover projections, reuse opportunities, and a typed infeasible result for impossible budgets or unpriceable mandatory requirements.
- Optimize purchase packages against the unchanged T04 plan with bounded deterministic search. Emit structured budget/replanning feedback only; the detailed T05 authorization explicitly prohibits invoking T04/T03, replacing meals or reducing servings. Any future regeneration is caller-owned.
- Account for opened-package remaining contents and leftover reuse only with explicit lot/package quantities and safety evidence. Distinguish purchased excess from edible leftovers and report unresolved context instead of inventing a weight.
- Test shared ingredients, prior lot consumption, unit incompatibility, package rounding, absent/stale/mixed-currency pricing, pantry rules, zero inventory, expiry/waste priority, and impossible budgets.

## Out of Scope

- Checkout, retailer ordering, payment, scrape-based live pricing, AI cost guessing, independent recipe selection, or frontend planner UI beyond minimally necessary existing contracts.

## Required Deliverables

- Deterministic plan-level shopping/waste calculation contracts and persistence/API bridge where appropriate.
- Explicit price/package provenance and validation, plus safe rounding/uncertainty reporting.
- Tests demonstrating one-time inventory subtraction and refusal/uncertainty paths.
- Documentation of cost and waste objective policy, price freshness/currency limitations, and migration impacts.

## Acceptance Criteria

- Inventory allocated to one earlier plan requirement cannot offset the same quantity a second time.
- A 500 g package can cover a compatible 300 g mass shortage only when explicit package metadata exists; a `pack` cannot be converted to grams by assumption.
- Budget calculations compare amounts only in a known common currency and disclose estimate/freshness/provenance.
- If mandatory items cannot fit the budget, outputs explicitly state infeasibility, cost gap, and affected requirements; no invalid zero-cost plan is returned.
- Waste optimization cannot choose expired or unsafe items and cannot override T03/T04 hard eligibility/locks.
- Package alternatives demonstrate documented cost/surplus trade-offs while selected meals, locks and servings remain unchanged. An impossible budget produces structured diagnostics, never a hidden meal feedback loop.
- Outputs retain enough source allocation data for user review and future audit.

## Verification

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm check:migrations
pnpm build
```

Use targeted domain and D1 integration tests with `tests/helpers/sqlite-d1.ts`; replay migrations after any additive schema change. Record exact command outcomes.

## Known Risks

- Price data is incomplete and location-dependent; unknown must remain unknown, not zero.
- Package leftovers may increase short-term cost while reducing waste; disclose objective trade-offs.
- Double subtraction is likely if legacy aggregation and projected allocations are mixed; use one authoritative plan allocation input.

## Protected Areas

PayOS/payment/checkout, unrelated authentication, deployment, and any live retailer integration. Do not alter planner selection semantics outside an explicit feedback contract.

## Expected Handoff

Document shopping inputs/outputs, price policy, package/unit policy, infeasibility behavior, schema changes, test results, and unresolved external price limitations. T06 must consume this deterministic plan/shopping result rather than ask an LLM to calculate totals.
