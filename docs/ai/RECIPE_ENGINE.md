# T02 Recipe Engine contract

The new engine is an explicitly invoked, deterministic library. It does not replace
legacy `evaluateRecipeMatch`, `rankRecipes`, `ALL_RECIPES`, cooking commands or Week.
No LLM, clock, database write, preference score or multi-day simulation is involved.

## Entry points and sources

- `@frigo/domain`: `buildInventoryAvailability`, `evaluateIngredientAvailability`,
  `createAvailabilitySession`; leaf `availability.ts` is reusable by later Week work.
- `@frigo/recipes`: `createRecipeCatalog`, `adaptStaticRecipeCatalog`,
  `auditRecipeCatalogs`, `scaleRecipeRequirements`, `SubstitutionRuleSchema`,
  `expandRecipeFamily`, `generateRecipeCandidates`.
- `@frigo/db`: `readRecipeCatalog(db)` explicitly maps SQL rows into validated
  contracts. Its eight SELECTs run in one read-only D1 batch, not independently
  sampled parent/ingredient versions. Read failure throws, never becomes empty stock.

```ts
const catalog = adaptStaticRecipeCatalog(CANONICAL_INGREDIENTS, ALL_RECIPES);
const result = generateRecipeCandidates({
  catalog,
  inventory: authorizedHouseholdInventory,
  householdId: authorizedHouseholdId,
  asOfDate: '2026-09-08',
  requestedServings: 2,
  mode: 'shopping_allowed', // or 'cook_now'
});
```

The caller chooses exactly one `static`, `d1` or explicitly `provided` catalog and
must supply an authorized inventory snapshot, an explicit local calendar as-of date,
and positive safe-integer requested servings. No household lookup/authentication is
performed here. If `householdId` is supplied, mismatching/unscoped rows are excluded
with diagnostics; unscoped mixed-household input is rejected outright.

Adapters reject malformed/unknown references and conflicting identities, preserve
legacy/unverified provenance, and never infer safety classifications from free-form
tags. Audit output reports ID, recipe-definition, requirement/unit and legacy-alias
drift. Alias normalization/collision reports are review proposals only: no automatic
promotion/import, replacement INSERT or runtime publication occurs. Ingredient
names, nutrition, retail products and full safety taxonomy are not invented.

## Availability and conservation

Index valid lots once by canonical ingredient; sort eligible lots by ID. Each
candidate gets a fresh reservation session. Compatible repeated required lines are
aggregated before scaling; source line indices survive. Required and optional
requirements remain separate. Every direct required requirement reserves stock
before substitutes or optional ingredients can borrow it. Stock is not shared
between independent candidate evaluations.

| Requirement status | Meaning | `missingQuantity` |
| --- | --- | --- |
| `satisfied` | Known compatible stock/reviewed allowed replacements prove enough | 0 |
| `partial` | Some proven coverage; remaining shortage is numerically known | Positive number in required unit |
| `missing` | No eligible compatible stock, no relevant unresolved evidence | Full required quantity |
| `unresolved` | Relevant stock/conversion/evidence cannot prove sufficiency or shortage | `null`, not a guessed full shortage |

200 g + 0.15 kg provides 350 g against 300 g. A 1-pack lot cannot supply grams,
nor can two `pack`/`bunch`/`slice` labels prove equivalent contents. T01 has no
product-context evidence, so contextual stock stays unresolved even for same-unit
requirements. Canonical `piece` quantities have identity but no physical weight.
Known physical stock that already covers the demand may prove `satisfied` despite
additional unusable/uncertain lots; `direct.availabilityComplete` stays false.

Identical repeated lot IDs count once; conflicting/malformed duplicate rows are
quarantined, not first/last-wins. Invalid related stock creates uncertainty; unrelated
bad/unmapped rows only add diagnostics. Zero/out-of-stock and past `use_by` are
unavailable. Past `best_before` is not automatically unsafe; past unknown/estimated
dates require review. A use-by date equal to as-of remains within that calendar day.
No timezone inference, expiry extension or safety certificate is implied.

`lotsUsed`/`lotAllocations` are ID-ordered quantity-feasibility witnesses with native
lot quantities, contributed units and expiry/freshness metadata. They are **not**
FEFO, persisted consumption commands or cross-meal plans. `rescueLotIds` identifies
witness lots already marked `use_soon`/`expiring`; there are no expiry weights.

## Numeric and serving rules

`Quantity` uses reduced BigInt rational intermediates based on supplied decimal
Number values. Shared strict unit factors perform physical conversion. Scaling
preserves the original unit; mixed compatible recipe lines use the physical base.
Finite Number conversion is explicit at scaled-demand/output boundaries. Unsupported
numeric range/underflow/overflow is reported rather than yielding NaN, Infinity,
negative availability or fabricated zero requirements.

T01 allows fractional positive pieces. T02 preserves mathematical fractions and
reports `countPolicy: 'preserve_fraction'` plus `fractionalCount`: one egg at two
servings becomes **1.5 pieces** at three servings. No concealed ceiling/floor,
package-size inference or purchase rounding occurs. T05 owns purchase/package
rounding; existing Week portion rounding remains unchanged.

## Substitutions

No rule is invented from aliases, ingredient groups or an LLM. A rule must be
reviewed, source-referenced, scoped to an exact recipe/family ID and version, and
specify original/replacement units, a positive replacement-per-original-unit ratio
and reason. Contextual units are not accepted in rules. Per-invocation approval is
mandatory; every active constraint needs explicit `compatibleWith` evidence.
Missing evidence denies that replacement. Approval/provenance is not a whole-dish
allergy or dietary assessment: candidates explicitly say `eligibilityScope: 'quantity_only'`.

After all direct required demands reserve stock, approved one-hop rules run in
binary rule-ID order against remaining stock. Partial replacements are explicit,
with quantities, ratio, source/reason, decisions and donor lot traces. No transitive
chain or global substitute-assignment optimization is claimed. Competing approved
replacements use this conservative deterministic policy, not preference ranking.

## Family variants and bounded search

T01 family definitions retain their version/provenance. Lazy DFS canonicalizes
slot keys/options and aggregates semantic demands, suppressing duplicate permutations
and equivalent measurable demand combinations across slots. Contextual demands
retain slot identity and separate lines; matching `pack` labels do not prove
semantic equivalence. Slot `minSelections`/`maxSelections`
are validated. Empty optional slots remain explicit in selection traces but create
no requirement; selected options are required in that concrete variant. A zero-demand
variant is never emitted. Missing family instructions/times/cuisine remain absent.

- `MAX_VARIANT_CANDIDATES_PER_FAMILY = 64`.
- `MAX_VARIANT_SEARCH_STATES_PER_FAMILY = 1024`.
- Callers may lower either positive-integer budget, never exceed the upper bound.
- Every attempted partial/rejected/pruned state counts; a filled slot advances
  immediately. No Cartesian product/combination array is materialized first.
- Candidate budget stops before an additional acceptance callback.
- ID order is deterministic traversal, not recipe preference ranking.

`familySearches` exposes attempted states, accepted/rejected/invalid variant counts,
truncation reason and `exhaustive`. If stopped by budget, zero candidates means
**search incomplete**, not “no valid recipe exists.” Invalid numeric variants also
prevent an exhaustive-feasibility claim. Family callbacks share the same candidate
arithmetic/session implementation as concrete recipes.

## T03 consumption and remaining boundaries

Candidate output includes stable source/version/serving identity, requirements,
direct evidence, replacement traces, required/optional status counts, raw catalog
classification facts, independent allocation witnesses and family search metadata.
`cook_now` excludes unsatisfied required demands; `shopping_allowed` retains valid
recipes with exact shortages or explicit uncertainty. Optional shortage alone does
not invalidate a recipe. No score is present; output is sorted only by identity.

T03 must add separate full-dish eligibility/ranking and reuse these facts, not
rebuild inventory arithmetic. Unknown allergen/nutrition data remains unknown;
source labels/classifications alone cannot establish safety. T04 owns sequential
consumption; T05 owns package context, global shopping/waste optimization; T06 owns
reviewed API/UI/static-to-D1 integration. Old first/last-lot runtime paths are still
legacy paths, not secretly fixed by adding this library.

T03 implementation now exists in `RANKING_ENGINE.md`. Candidate generation retains
existing family/prep-time metadata and registers private same-process scope and
fingerprint provenance for `getCandidateSnapshotContext`. Ranking requires the
original unmodified server-generated result with explicit matching household/date;
serialized/client results must be regenerated from authorized server inputs. This
is an integration guard, not authentication or permission to accept client-owned
substitution rules claiming review. T02 quantity/search behavior remains unchanged.

D1 batch semantics: [Cloudflare D1 Database API](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch).
