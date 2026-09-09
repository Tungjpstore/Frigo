# T07 H4 Domain Integrity and H2 Pure Compute Bounds

**Status: focused H4/H2 audit checkpoint — not final T07 verification.**

## Continuation topology

- Original T07 branch: `hoplite/lipara-d81160ee`
- Continuation checkpoint: `006742bc179d58aae53106c88aff8a2667dbd1ca`
- Writable continuation branch: `hoplite/prokonnesos-74e71894`

This intentional topology is required by the Hoplite publisher binding; it is not an
application architecture issue. This checkpoint does not switch, commit, or publish
that shared branch.

## Scope and method

This focused pass traced the pure deterministic path from T02 candidate quantities,
through T03 ranking and T04 projected planning, into T05 demand/package/money output,
the T06 DTO mapper, and frontend presentation. It also reviewed the deterministic
input/search caps. It did not modify legacy Week, persistence/concurrency, routes,
authentication, deployment, or PayOS/payment code.

The audit followed reproduce → regression → smallest correction. Existing focused
coverage was first run unchanged; the new regression initially exposed one actual
public-contract defect. Two other initial assertions were corrected because they
misread existing documented behavior: T05 retains contextual demand as an unresolved
requirement (rather than omitting it), and shopping price inputs belong to the T05
catalog schema rather than the public response DTO package.

## Confirmed correction

**Low — a public shopping DTO could declare a currency scale contradictory to its
currency.** `ShoppingResultDtoSchema` previously accepted, for example, a JPY result
with `currencyMinorDigits: 2`. The server mapper emitted correct values and the
current frontend derives digits from the money currency, but another schema consumer
could interpret the advertised result scale incorrectly.

`packages/domain/src/meal-shopping-api.ts` now rejects a result unless its declared
scale is VND/JPY `0` or USD/EUR `2`. It is intentionally a refined Zod schema because
the validation depends on two fields; the sole shape-introspection test now reads the
unchanged underlying object through `innerType().shape`. The new regression builds a
real JPY shopping result, changes only `currencyMinorDigits` to `2`, and proves
parsing fails. No money calculation or rounding policy changed.

## Domain and temporal results

- The new end-to-end regression sends a one-piece/two-serving recipe at three
  servings through T02 → T03 → T04 → T05. It preserves the exact `1.5 piece`
  requirement, buys one two-piece package, retains `0.5` surplus, serializes the
  quantity as `{ value: "1.5", unit: "piece" }`, and presents it unchanged.
  Relevant boundaries: `requirements.ts`, `weekly-planner.ts`,
  `shopping-demand.ts`, `shopping-optimizer.ts`, `meal-shopping-dto.ts`, and
  `src/web/features/planner/presentation.ts`.
- The regression checks JPY known zero, a normal USD two-decimal input, the exact
  `Number.MAX_SAFE_INTEGER` input boundary, rejection at `+1`, and a 100-digit
  BigInt-formatted public money value. Input price/budget fields remain safe
  integers; computed/output money remains decimal-string/BigInt based.
- A `1 + 5e-17` exact quantity is rejected at the T05 Number output boundary rather
  than rounded down. Physical g/kg conversion, contextual unit separation, and
  fractional pieces retain their T02/T05 contracts.
- Contextual `pack` demand stays unresolved in T05 even when a matching `pack`
  offer exists. A separate unknown-price/unknown-expiry case retains
  `totalCostMinor: null`, unknown cost status, null price facts, unknown risk, and
  `certainWasteQuantity: null`; it is not converted to free cost or no risk.
- The reviewed time model is fixed-offset, not an IANA/DST model:
  `planningReference` accepts only UTC or explicit offsets within ±14:00 and
  `slotInstant` reuses that offset. T02/T04 retain same-calendar-day use-by stock,
  reject past use-by and past estimated expiry without sufficient review, and retain
  past best-before evidence without calling it safe. T05 only uses a dated purchase
  through the last planned use and reports mid-horizon risk conservatively.

Existing ranking/planner regressions in the focused command cover unknown hard
allergy/dietary/nutrition evidence failing closed, rather than treating absent review
or nutrition as safe/zero. This checkpoint does not represent an H1 authorization
sign-off.

## H2 pure compute bounds

Reviewed enforced caps include:

- T02 family traversal: at most 64 emitted variants and 1,024 traversal states per
  family (`families.ts`); candidate-generation overrides are validated before work.
- T04 request/context/search: 14-day horizon, 42 slots, 20 servings, 1,000 lots,
  500 recipes, 16 families, beam width 16, 32 candidates/slot, and 4,096 planner
  states (`planner-policy.ts`, `planner-request.ts`, `planner-context.ts`).
- T05: 2,000 catalog options and requirements, 32 options/requirement, 16,384
  states/requirement, 65,536 total states, and 1,024 packages/requirement
  (`shopping-policy.ts`, `shopping-catalog.ts`, `shopping-packages.ts`). Limits
  are carried into output metadata; truncation is not an optimality or infeasibility
  proof.

The new regression verifies that planner and T05 state overrides above their hard
caps are rejected before search. The initial unchanged focused suite already covers
family state/candidate caps, package/state/total-state caps, deterministic repeated
runs, and explicit no-proof semantics.

## Deferred/observed limitations (not defects fixed here)

1. T05 deliberately takes the first `maxOptionsPerRequirement` options in binary ID
   order before package search. Therefore a clipped result is only a bounded
   best-known result and reports `OPTION_LIMIT`; it is not a claim of global
   package-choice quality. This behavior is documented in ADR-016/017 and requires
   product/optimization scope to change safely, so no redesign was made.
2. T02 is an explicitly invoked server-snapshot library and does not impose a global
   concrete-recipe count itself. T04's production composition limits input catalog
   sizes before planning and then limits selected recipes/families. No direct
   untrusted T02 route, route-level exploit, benchmark, or performance conclusion
   was established in this phase; retain this boundary for H6 capacity review.
3. Fixed-offset planning intentionally has no DST/IANA adapter. It must not be
   advertised as DST-aware without a separately defined temporal contract.

## Verification

Executed from repository root after the existing recovery baseline:

```sh
pnpm exec vitest run tests/unit/quantity.test.ts tests/unit/ingredient-availability.test.ts tests/unit/recipe-candidates.test.ts tests/unit/recipe-families.test.ts tests/unit/recipe-ranking.test.ts tests/unit/planner-contract.test.ts tests/unit/planner-inventory.test.ts tests/unit/planner-nutrition.test.ts tests/unit/weekly-planner.test.ts tests/unit/shopping-catalog.test.ts tests/unit/shopping-hardening.test.ts tests/unit/shopping-optimizer.test.ts tests/unit/shopping-plan-snapshot.test.ts tests/unit/shopping-search.test.ts tests/unit/meal-shopping-dto.test.ts
# PASS: 387 tests / 15 files

pnpm exec vitest run tests/unit/t07-domain-integrity.test.ts tests/unit/meal-shopping-dto.test.ts tests/unit/planner-presentation.test.ts
# PASS: 65 tests / 3 files

pnpm exec vitest run tests/unit/t07-domain-integrity.test.ts tests/unit/meal-shopping-dto.test.ts tests/unit/planner-presentation.test.ts tests/unit/planner-reason-coverage.test.ts
# PASS: 71 tests / 4 files

pnpm exec vitest run tests/unit/t07-domain-integrity.test.ts tests/unit/quantity.test.ts tests/unit/ingredient-availability.test.ts tests/unit/recipe-candidates.test.ts tests/unit/recipe-families.test.ts tests/unit/recipe-ranking.test.ts tests/unit/planner-contract.test.ts tests/unit/planner-inventory.test.ts tests/unit/planner-nutrition.test.ts tests/unit/weekly-planner.test.ts tests/unit/shopping-catalog.test.ts tests/unit/shopping-hardening.test.ts tests/unit/shopping-optimizer.test.ts tests/unit/shopping-plan-snapshot.test.ts tests/unit/shopping-search.test.ts tests/unit/meal-shopping-dto.test.ts tests/unit/planner-presentation.test.ts
# PASS: 449 tests / 17 files, 23.46 s

pnpm exec eslint packages/domain/src/meal-shopping-api.ts tests/unit/t07-domain-integrity.test.ts
# PASS: exit 0
```

An intermediate `pnpm typecheck` after the refined-schema update exited 2 because
of an implicitly typed H2 fixture `index` in `tests/integration/t07-rate-limit.test.ts`
(line 72). The parent added an explicit fixture type and reran **pnpm typecheck:
PASS** on the assembled worktree.
The final DTO/schema and unchanged status-shape assertions are covered by the 71
passing targeted tests above. Typecheck must be rerun on the assembled shared
checkpoint by the parent before recording a T07 gate result. No full suite,
migration, browser, benchmark, query-plan, hosted CI, deployment, or production
claim is made here.

**PayOS/payment touched: no.**
