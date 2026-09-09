# T03 — Deterministic recipe ranking

T02 determines quantity feasibility. T03 returns candidate utility, **not a meal
plan**. T04 may reuse components when evaluating a future sequence; it must not
repeatedly schedule rank #1 without its own sequential checks. The library is
explicitly invoked. Legacy rankers, API/cooking/Week and frontend remain unchanged.

## Pipeline and trusted inputs

`rankRecipeCandidates({ generation, context, referenceDate, referenceTime,
profile?, evidence? })` validates context/profile/clock/T02 scope; indexes history
and evidence once; evaluates hard eligibility; extracts features; computes bounded
components and weighted contributions; then sorts score DESC, inventory fit DESC,
canonical source ID ASC, full candidate ID ASC (binary comparison, not locale).

`generation` must be the **unmodified server-side T02 result in the same process**.
T02 registers a private WeakMap scope/fingerprint; serialized, fabricated or mutated
results fail. Ranking requires an explicit matching household and calendar as-of
date. This is defensive provenance, not user authentication: the server still
must authorize inventory/catalog reads. T02 additionally retains existing family
and prep-time metadata; ranking recalculates no availability, shortages, aggregation,
conversion, serving scaling, substitution selection or family traversal.

Ranking accepts only opaque same-process `RankingEvidenceSnapshot`, created by
`createRankingEvidenceSnapshot(generation, serverProvider)` and privately bound to
that exact T02 result. Raw/serialized evidence is rejected. The provider must be a
trusted server-owned function, not request JSON. Evidence validation proves structure,
**not author authority**: never install a provider forwarding client/LLM `safe` or
`reviewed` claims. `CandidateRankingEvidenceSchema` is not a request DTO. No review
endpoint exists. T02 substitution
rules and approvals must likewise be server-owned; T03 consumes only actual uses,
not rules/approvals from a client, and never treats approval as whole-dish safety.

`candidateEvidenceKey` binds the complete candidate, including source/version,
classifications, servings, time, demands, replacement rules/quantities and lot facts.
Candidate ID alone is insufficient because T02 IDs do not change on substitution.
Stale, duplicate or unrelated evidence throws. Reviews must cover that exact dish,
including intended optional ingredients and relevant product/cross-contamination
or preparation constraints. Do not transplant base-recipe evidence onto variants.

## Hard constraints versus soft signals

- Active allergen/dietary constraint: explicit matching safe review passes;
  conflict excludes; unknown excludes. Conflicting reviews beat safe reviews.
- Catalog allergen assertions conservatively block the matching allergen. Generic
  dietary tags, `allergen_review_state`, source labels or empty tags never prove
  suitability/absence. No meat tag is not vegetarian.
- Forbidden canonical ingredients block before scoring. Conservatively inspect
  original and optional ingredients plus replacements, even if fully replaced or
  optional stock is missing. Omission-specific adaptations need a future contract.
- `neverRecommendRecipeIds` is hard; dislike is only a strong soft penalty.
- Hard total time requires known prep + cook within the limit; unknown blocks.
- Hard meal nutrition needs reviewed serving-basis values inside every range;
  unknown/unreviewed/estimated blocks unless the exact target permits estimates.
  Accepted reviewed estimates remain explicitly qualified.
- Personal soft preference cannot override any household or personal hard policy.
- No requested safety policy yields `safetyAssessment: not_requested`, **not safe**.
  Output describes requested constraints only, never comprehensive food safety.

## Default profile and exact component semantics

All components are finite **[0,1]**. Default profile is `balanced-v1`:

| Component | Weight | Raw meaning |
| --- | ---: | --- |
| inventoryFit | 30 | Mean T02 coveredQuantity / requiredQuantity for required groups; known partial coverage counts proportionally, unresolved receives 0. No required demands => 0. |
| expiryPriority | 12 | Mean urgency-weighted allocated fraction of each required demand; see below. |
| preferenceFit | 30 | Latest explicit like = 1, dislike = 0; otherwise clamp(.5 + .25*cuisineSignal + .25*ingredientSignal - weakFeedback). |
| nutritionFit | 8 | Known requested dimension mean, shrunk to .5 by coverage; no data/targets => .5. |
| cookingTimeFit | 8 | Within preferred time => 1, otherwise preferred/observed; shrink to .5 by time coverage. No preference/data => .5. |
| variety | 3 | 1 - max(.5*familyRecency, .25*cuisineRecency); no related history => 1. |
| recentMealPenalty | 6 | Greatest decaying exact recipe/family-identity cooked recurrence, not summed frequency. |
| shoppingBurden | 2 | Distinct required ingredients with known missing/partial status / distinct required ingredients; unresolved is not an invented shortage. |
| substitutionPenalty | 1 | Fraction of all requirement groups with actual substitutions. |

Cuisine signal is -1 avoided, +1 preferred, otherwise 0. Ingredient signal is the
mean over distinct intended/replacement IDs (-1 disliked, +1 liked, otherwise 0).
Negative intent wins contradictory lists. Exact recipe feedback precedes family
feedback; explicit tastes override weak skips/swaps. Cooking never implies liking.

Weights must be finite 0..1000, at least one positive; no sum-to-one requirement.
Contributions = `weight / totalWeight * utility`: positive components use raw value,
penalty components use `1 - rawValue`. Final score is clamped sum **[0,1]**. This is
an affine shift of signed weighting, not probabilistic confidence. Scores across
profiles are not directly comparable. All policy weights/windows live in one file.

Inventory/shopping intentionally overlap slightly: coverage is dominant, while the
small shopping term distinguishes known errands from uncertainty. There is no price
inference. Optional shortages do not reduce inventory fit/create required shopping;
optional replacements still appear in the small transparent substitution term.

## Expiry: witness approximation, not consumption planning

Only T02's independent ID-ordered allocation witness is used. For known date **and
kind**, urgency is `max(0, 1 - daysUntilExpiry / 7)` for nonpast dates. Unknown
kind/date and past dates receive zero. Original best-before/use-by/estimated kinds
remain visible; equal ranking horizon does not imply equal safety. T02 excludes
past use-by. Past best-before can remain usable but gets no automatic rescue boost.
Nothing is inferred from freshness flags or presumed sealed/opened state. Allocated
requirement shares by expiry kind are exposed separately, so estimates are not
presented as use-by evidence; coverage is data presence, not date reliability.

A direct allocation contributes T02 `contributedQuantity / requiredQuantity` times
urgency in already matching units. Replacement contribution is
`coveredOriginalQuantity / requiredQuantity * contributedQuantity / use.quantity`
times urgency. Clamp shares, sum per required demand, average over required groups.
No conversions/lot availability are recomputed. Repeated lot IDs represent disjoint
T02 reservations, not repeated whole-lot amounts; urgent lot IDs are deduplicated.
Optional ingredients create no rescue utility.

For 200 g demand with 100 g expiring tomorrow + 900 g later, the 100+100 g witness
scores `.5 * 6/7`, not urgency for 1000 g. An unallocated urgent lot gets no credit.
This conservative approximation can miss FEFO opportunities; T03 never reallocates
or claims actual consumption. T04/T05 own cross-meal and waste decisions.

## Preferences, feedback, ownership and persistence

Existing `user_preferences`/`favorites` are global per user; Week preferences are
planning-specific. They are not silently imported into household ranking (including
default cuisines/free-form dietary strings). Explicit reviewed import is future work.

Ranking context contains household defaults and at most one current-user snapshot.
A personal snapshot replaces household **soft** defaults as a whole. Household and
personal hard restrictions accumulate. These are current records: `updated_at` is
audit data, not a historical preference timeline, and `referenceTime` filters only
feedback/cooked history. No automatic aggregation of members' private tastes occurs.
Household defaults are owner-managed; personal records require live membership.
Context validation rejects duplicate scopes, foreign-household data and other users'
non-cooked feedback. Cooked history is intentionally household-shared.

Feedback events are the source of explicit recipe/family tastes: latest like/dislike
wins by absolute timestamp, then binary event ID. Explicit tastes do not expire with
the recency window. Skipped/swapped apply max weak penalties (.1/.15), decaying over
seven days. Swapping infers neither liking the replacement nor cooking either dish.
No duplicate taste aggregate or ML system exists.

Existing `cooked_meals` stays actual-cooking authority, projected as typed cooked
feedback. The new feedback writer cannot fabricate cooking or mutate inventory.
There is no automatic Week skip/swap capture. Migration
`0021_recipe_personalization.sql` adds `household_ranking_preferences`,
`member_ranking_preferences` and `recipe_feedback_events`. Preference values use a
validated version-1 JSON envelope; member preferences/events have composite
membership FKs with ON DELETE CASCADE. Household defaults cascade on household
deletion. Event recipe/family targets and swap replacements have canonical FKs
(ON DELETE CASCADE); deleting a referenced target removes those events. Existing
global preferences, favorites, cooked meals and Week tables are not replaced.
`saveRankingPreferences` uses atomic membership/owner-guarded INSERT SELECT;
`recordRecipeFeedback` is append-only with exact idempotent replay and rejects ID
conflicts, spoofed ownership and cooked writes. `loadRankingContext` uses one
six-SELECT coherent batch including live membership. `readRankingNutrition` uses
one bulk read; its rows must pass through a server evidence provider before ranking.
Indexes support scoped preference, latest taste, recent feedback and cooked reads.
Global
static-only targets require reviewed D1 registration before durable feedback; they
are not inserted automatically or assigned fake FKs.

## Recency and time

Cooked recency = `max(0, 1 - ageInDays / 14)`; future events ignored. Exact identity
has the strongest separate penalty. Family/cuisine affect weak novelty; common
ingredients/proteins are not penalized. Maxima avoid duplicated-history accumulation.
Family-identity cooking denotes an unspecified variant; the legacy cooked table
cannot represent an exact generated variant.

There is no `Date.now()`/randomness. `referenceTime` is an explicit offset timestamp
for absolute durations; `referenceDate` is caller-chosen and must match T02. No
household timezone exists; the caller supplies a coherent snapshot. SQLite legacy
cooked timestamps are interpreted explicitly as UTC by the repository adapter.

Total time requires both prep/cook. One unknown => observed lower bound, coverage .5;
both unknown => coverage 0. Hard total-time limits fail closed. Legacy missing prep
is never filled with zero. Actual zero metadata is known, not absent.

## Nutrition and completeness

Targets are explicitly **per meal serving**, never allocated daily targets. Reuse
T01 `NutritionProfileSchema` (kcal, grams, sodium mg). Divide only by an explicit
serving basis. Mass/volume/piece profiles cannot become serving facts without data.
Absent nutrients stay absent. Overflow/underflow normalization throws, not infinity
or fabricated zero. The bulk D1 reader exposes current-version, unambiguous
serving profiles as **unverified**: provenance alone cannot satisfy hard constraints.
It does not attach base-recipe profiles to static candidates, substitutions or
families, choose arbitrary conflicting profiles, or infer missing values.

Range [min,max] known fit: 1 inside, value/min below, max/value above. Average only
known requested dimensions, then `nutritionFit = .5 + coverage*(knownFit-.5)`.
Coverage = known/requested; no targets => null. One perfect dimension of two yields
knownFit 1, coverage .5 and component .75. Known zero is distinct from unknown.
All original profile/provenance and qualifications remain visible.

`dataCoverage` reports availability, expiry, time, preferences and nutrition—not ML
probabilities. Availability = 1 minus unresolved required fraction; known shortage
is known availability, not cookability. Preference coverage means explicit policy
or taste exists, not certainty of enjoyment. Cold start requires neither history
nor preferences and returns useful deterministic ranking.

## Output, performance and T04 handoff

`RankedRecipeCandidate` retains original T02 candidate, rank, final score, raw
components, contributions, profile ID, eligibility, reason codes, nutrition facts,
explicit preference evidence, expiry witness, history/variety and completeness.
`generation` preserves T02 exclusions/diagnostics; `familySearches` and `truncated`
survive. `searchExhaustive` describes **family searches only**, not complete catalog
coverage. Empty truncated output means search-incomplete, not no possible meal.

The pure loop performs no I/O. Repositories fetch coherent authorized context and
bulk nutrition once, history is indexed before scoring, then rank in memory. Use a
history load horizon covering both profile.historyWindowDays and
profile.feedbackWindowDays. Durable explicit tastes are loaded independently of
that horizon. Sorting is O(C log C); T02 fingerprint verification is linear in
snapshot size. Database errors never become empty preferences/stock.

T06 must wire these libraries into authenticated routes with trusted catalog,
substitution and review inputs. T04 may reuse component utility but owns sequential
inventory and future constraints. No weekly schedule, shopping list, budget/waste
optimizer, AI/LLM ranking, API cutover or frontend redesign is implemented here.

### Server-side composition example

```ts
const profile = BALANCED_RANKING_PROFILE;
const generation = generateRecipeCandidates({
  catalog: trustedCatalog, inventory: authorizedStock, householdId: scope.householdId,
  asOfDate: referenceDate, requestedServings: 2, mode: 'shopping_allowed',
});
const context = await loadRankingContext(db, scope, referenceTime, profile);
const nutrition = await readRankingNutrition(db, generation);
const evidence = createRankingEvidenceSnapshot(generation, () => nutrition.evidence);
const result = rankRecipeCandidates({ generation, context, referenceDate, referenceTime, profile, evidence });
// Preserve nutrition.diagnostics alongside result; D1 observations are not safety reviews.
```

The example has no trusted safety-review provider, so active hard allergy/dietary
constraints correctly remain blocked. Household/member preferences are current
snapshots; `updated_at` is audit data, not historical preference versioning.
