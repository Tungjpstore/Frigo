# T05 — Deterministic shopping, budget and waste projection

T05 evaluates one **unchanged** T04 plan. It never calls T04/T03 to choose another
meal, reduces servings, consumes real stock or orders groceries. T06 owns future
authenticated integration. No runtime route/UI, database migration or payment
integration is part of this library.

## Pipeline and trust

```text
authorized server preload: T04 plan + reviewed purchase catalog + scoped budget
  -> createShoppingContext(serverProvider): validate, copy, freeze, opaque handle
  -> aggregateShoppingDemand: authoritative per-slot T04 deficits only
  -> normalize physically comparable packages / retain price qualifications
  -> bounded per-requirement package traversal
  -> independent cost minima + bounded-premium surplus choices under budget
  -> audited package lines, budget evidence, stock remainder and surplus risk
```

Modules are `packages/recipes/src/shopping-{catalog,demand,policy,packages,waste,
optimizer}.ts`, exported through the existing recipe package. Pure arithmetic and
search take no DB/network binding. No new package/dependency or retail platform.

`createShoppingContext(() => source)` is **not an authorization service or request
parser**. A trusted server loader must authorize current membership, load the
server-generated T04 plan and budget, and supply reviewed catalog data. Never wrap
request/LLM prices in that callback. The process-local WeakMap rejects raw/copied/
serialized handles. Input changes after capture cannot change a run. Household,
user, budget currency, inventory/delta scopes and household-specific offers must
match. Catalog IDs/references, quantities, timestamps and prices are validated.

The plan is trusted T04 output, not a persisted/client JSON DTO to be reconstructed
by casting. Product offers must already be suitable for this household and chosen
dish: canonical identity alone does not prove brand allergen/cross-contamination
safety. T05 does not authorize a new ingredient substitution or certify food safety.

## Demand: subtraction exactly once

The only deficit input is `plan.slots[].shortages[].missingQuantity`, after T04's
sequential projected inventory allocation. Neither initial stock, final stock nor
the plan's aggregate shortage list is subtracted/added again. Substitution coverage
has already been applied by T02/T04. Actual selected meal requirements are retained
unchanged in the upstream plan.

Aggregate by canonical ingredient, base unit and optionality: 200 + 300 + 100 g
becomes 600 g; .5 kg + 200 g becomes 700 g. `Quantity`/`convertQuantity` perform
exact rational arithmetic on the supplied decimal values, with finite Number
outputs as in T02. Demand, purchased quantity and surplus output boundaries also
require an **exact decimal round trip**; a lossy Number representation throws
`QuantityRangeError` rather than rounding away a deficit. For example, 1 g +
5e-17 g cannot silently become 1 g. Overflow/underflow also throws. Utilization
is an approximate display ratio, never an operand in quantity or money authority.
Provenance retains each slot/date, candidate ID, source line indices, original
shortage type, amount and unit. A known subtotal does not resolve unknown demand.

`pack`, `bunch` and `slice` requirements remain separate, unresolved contextual
requirements: T04 has no package-context identity to justify equivalence. Physical
g/kg and ml/l normalize; canonical `piece` retains fractional mathematical demand.
Optional requirements are exposed separately and **not purchased or budgeted**.
There is no additional pantry-staple exemption: T04 alone determines stock coverage.

## Purchase options and existing infrastructure

The audit found legacy `ingredient_prices` and `ingredient_package_sizes` in 0003,
static `week/pricing.ts` VND benchmark ranges, and `week/packages.ts` unitless size
lists. There is no retail SKU/barcode/store/bundle catalog, no reliable package-to-
price join, and no price provenance/availability. Receipt merchant/OCR price fields
are household draft observations, not reviewed current offers.

Those legacy defaults are **not** promoted into trusted T05 data. In particular,
unknown-ingredient price fallbacks and quantity-insensitive package heuristics are
inappropriate for authoritative budgets. Existing canonical ingredient identity,
explicit package concepts and exact unit utilities are reused instead.

Each `PurchaseOption` has a stable snapshot ID, canonical ingredient ID, optional
product/retailer/household identity, explicit availability, nullable sourced package
content, nullable price observation and nullable sourced expiry evidence.
Package content is **net contents per purchasable package**, not the package label.
A 300 g pack can cover physical grams; `1 pack` without trusted contents cannot.
A 10-piece carton can cover eggs; 1.5 required pieces stays 1.5 while buying six
leaves 4.5 surplus. No inferred density or automatic package-to-gram conversion.

Identical IDs deduplicate; conflicting IDs reject. Semantically identical snapshot
rows (all fields except ID equal) retain the lowest binary ID. No duplicate row
increases availability. There is no finite store stock/minimum order/multipack/bundle
model in existing data; this release does not invent one. Generic offers are valid;
retailer IDs are audit fields only, with any supplied eligible retailer allowed.

## Money, temporal snapshot and uncertainty

The legacy product uses **VND**, not an inferred Japan-only currency. Currency is
mandatory: VND/JPY use zero fractional digits, USD/EUR use two. Each trusted price
and budget is a nonnegative safe-integer **minor-unit** input. Internal multiplication,
addition, comparisons and premium ratios use BigInt. All authoritative calculated
money outputs are base-10 integer **strings**, allowing exact totals beyond
Number.MAX_SAFE_INTEGER and JSON serialization without BigInt. UI formatting is
future work; never parse these totals into unsafe Number arithmetic.

Negative/nonfinite/fractional/unsafe prices and nonpositive package contents reject.
Zero requires an explicit trusted `zeroPriceReason`; unknown price is null, not free
or infinity. Price provenance includes currency, amount, source type, source reference
and observation `asOf`. Manual/retailer/imported/cached/catalog are source labels,
not permission to ingest unreviewed client values.

The amount is the catalog's payable per-package quote. Unmodeled tax, delivery fees,
coupons or cross-product promotions are not invented or optimized. Purchase cost
claims are conditional on that supplied quote, not a live checkout guarantee.

Catalog `asOf` must be at/after the T04 capture and at/before every selected meal.
Prices after that instant, older than policy `maxPriceAgeDays` (default 30), estimated
prices and foreign-currency prices remain visible observations but are **unpriced
for authoritative calculation**, with diagnostics. No FX, fetching or implicit
conversion. One coherent catalog snapshot can contain differently aged observations;
their exact timestamps survive. Missing price is an unknown-cost item, never an exact
zero-cost total. The policy's freshness window is validity policy, not a guarantee
that an offer will remain available.

## Search, objective and proof

Independent single-ingredient packages imply additive costs; no global Cartesian
product is necessary. Search each required ingredient/unit group, then sum costs.
Sorted option IDs and sorted requirement IDs are binary-stable, independent of DB
order. Search seeds each homogeneous sufficient purchase with an exact bounded
binary-search ceiling, then uses an **iterative nondecreasing-option traversal**.
Every attempted seed/extension consumes the shared work budget. Stop a path as soon
as it satisfies demand: with nonnegative costs, positive contents and count/surplus
tie-breaks, adding more packages cannot improve it. All irreducible combinations
are represented when traversal is exhaustive. No unbounded recursion or post-hoc
Cartesian slicing.

Default `cost_first` objective:
1. Cover the fixed known deficit.
2. Prefer fully priced combinations over unpriced ones (explicit confidence policy).
3. Minimize exact known cost, then surplus, then package count, then binary IDs.

When no fully priced combination exists, compare surplus, total package count,
unknown-price package count, known subtotal and binary IDs. Unknown prices are not
assigned synthetic scores of zero or infinity.

Optional `bounded_surplus` starts with the best-known fully priced combination and
minimizes surplus within `surplusPremiumBps` above that cost (default 1000 = 10%,
maximum 2500). The dimensionless premium is compared with exact integer products;
no grams/yen/count mixture. A 500-cost option with 500 g excess beats 550/50 g under
the default; bounded-surplus may choose 550/50 g. A tiny surplus reduction cannot
justify an unlimited premium. Surplus is a resource-efficiency proxy, **not certain
waste**. No estimated shelf-life penalty masquerades as expected discarded mass.

Hard budgets admit surplus-reducing upgrades in stable requirement order only when
the entire fully priced shopping result stays within budget. Unknown-cost plans do
not receive hard-budget premiums. Choose the best affordable candidate from all
enumerated premium choices, not just the unconstrained favorite. This deterministic admission policy is not global
knapsack/waste optimality. Soft targets report overruns but allow bounded premiums.

| Limit | Default | Maximum |
| --- | ---: | ---: |
| Options per ingredient/unit requirement | 12 | 32 |
| States per requirement | 2048 | 16384 |
| States across the whole optimization | 16384 | 65536 |
| Packages per requirement | 128 | 1024 |
| Trusted catalog options | 2000 | 2000 |
| Per-slot shortages across input plan | 2000 | 2000 |

Caps apply during traversal, including seeds and failed branches. Metadata exposes
actual states, available/considered options, cap reasons, exhaustive/truncated status
and limits per requirement and globally. A returned best-known choice after truncation
is not a minimum. `minimumCostMinor` exists only when all required quantities are
resolved/fulfilled, every comparable option is priced and all searches are exhaustive.
Proof scope is the supplied comparable catalog, not every product or future price.
Missing content/out-of-stock/already-past-use-by offers are not valid purchase choices.
An offer usable for early meals but not the last one is not allocated by this
single-window solver. `PARTIAL_HORIZON_PURCHASE_UNSUPPORTED` suppresses the affected
minimum and lower-bound proofs; it does not prove that offer unusable for the plan.
Pending best-before/estimated expiry review similarly prevents exhaustive proof.
`searchExhaustive` covers computational traversal only; `incompleteReasons` also
records these evaluation limitations and unresolved quantities. Incomplete evaluation
is not a cap hit: `exhaustive: false, truncated: false` is valid.

## Budget evidence and feasibility

Separate T04 meal feasibility, shopping fulfillability, shopping completeness and
budget status. Quantity coverage with unknown retailer availability gives shopping
status `unknown`; no valid purchase option gives `unfulfillable`. Search-limited
failure is `NO_PURCHASE_FOUND_WITHOUT_PROOF`, not proven absence of an option.

- `knownCostMinor`: exact selected known subtotal, even when incomplete.
- `totalCostMinor`: null whenever a mandatory cost/requirement is unknown.
- `unknownCostItemCount`: unpriced purchase lines plus unresolved requirements.
- `bestKnownCompleteCostMinor`: cheapest fully priced combination found for each
  requirement, summed; null if some requirement lacks such a witness.
- `minimumCostMinor`: only under the exhaustive/data conditions above.
- `provenKnownCostLowerBoundMinor`: sum exhaustive minima for fully priced
  requirements. A requirement with **any unpriced comparable alternative** contributes
  zero to this conservative bound, not its expensive known choice. Unresolved/capped
  requirements also contribute zero. This is a proof bound, never a fabricated price.

`within_budget` requires a complete underlying T04 plan, all required costs known,
and a selected cost at/below the budget; search need not be exhaustive to prove a
feasible witness. A bound already above budget proves `over_budget` even if other
items are unknown. A truncated over-budget best-known choice does not prove hard
infeasibility: status is `unknown`, with `BEST_KNOWN_OVER_BUDGET`. Soft selected
overruns get `SOFT_BUDGET_TARGET_EXCEEDED`, not hard infeasibility.

Unknown price/completeness otherwise gives `unknown`; no budget gives
`not_configured`. Known remaining amount is only arithmetic headroom before unknown
costs, not spendable guaranteed savings. Selected known gap and proven gap are
separate. Hard infeasibility includes cost drivers, requirements without cheaper
known options, unknown-price requirement IDs and `PLAN_REGENERATION_RECOMMENDED`.
That code does **not** execute replanning.

## Existing stock, purchase surplus and waste risk

Return T04's final positive inventory lots unchanged, with versions/storage/opening/
expiry evidence. **T04 projected allocation != globally optimal waste allocation.**
T05 neither reallocates existing lots nor implicitly rewrites the meal sequence.

Purchased contents minus the aggregate requirement produces purchase surplus.
For per-option audit, consume purchased contents in earliest-expiry/ID order; all
selected dated offers must remain eligible through that requirement's last meal.
This purchase-only bookkeeping never touches T04's inventory witness. One purchase
can support several meals; no extra meals are scheduled for its surplus.

Existing remainder and purchase surplus are separate lists. Dated expiry at/before
horizon end is `at_risk`, later evidence is `no_dated_risk_in_horizon`, absent/unknown
evidence is `unknown`. Estimates retain `estimated` confidence. Past-horizon use-by
marks `unusableAtHorizon`; best-before never implies unsafe/certain waste. Every
`certainWasteQuantity` remains null: these inputs do not prove actual disposal.
Coverage counts evidence-bearing items, not mixed-unit mass or probabilities.
No inferred shelf life, sealed state, storage safety or LLM waste prediction.

## T06 output and compatibility

`OptimizedShoppingPlan` is schema version 1, generated-only: household/user/meal-plan
identity, explicit currency/minor digits, requirements and slot provenance, optional
and unresolved demand, selected product/package IDs/content/counts/price provenance,
required/purchased/surplus quantities, utilization, exact known/unknown costs, budget
evidence/feedback, existing remainder, purchase surplus/risk and structured reasons.

Upstream status/conclusion, unplanned slots, T04 planner/recipe search metadata,
catalog diagnostics and source revisions remain separate from T05 search metadata.
`shoppingCompleteness: partial` prevents presenting a prefix as a full-week list.
Snapshot identity/as-of/fingerprint and revalidation flags support stale detection;
fingerprints are display identifiers, not authentication or collision-proof locks.
Future acceptance must reauthorize and reload inventory additions/deletions/revisions,
plan/preferences and reviewed catalog/prices before using existing commands.

No persistence is needed yet. Never insert optimizer search states or serialize this
contract into legacy Week as if compatible. Existing standalone lists, Week shopping,
VND heuristics, dual writes/reconciliation and purchase-confirmation commands continue
unchanged. T06 can generate on demand and needs no package arithmetic of its own.
No AI authority, frontend/API integration, payment/order or PayOS change.
