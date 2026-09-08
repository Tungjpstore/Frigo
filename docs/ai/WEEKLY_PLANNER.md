# T04 — Sequential weekly meal planner

T04 is an explicitly invoked deterministic library, not the legacy Week runtime.
T03 dependency: `3592de9832a55a06d4af6fa31491c8f3c0321262`. The user authorized
new T04 commits on the existing T03 branch because Hoplite could not allocate a
dependent branch. This temporary topology changes neither architecture nor scope.

## Pipeline and modules

```text
authorized server preload -> createPlanningContext(provider)
  -> validated request / policy / chronologically ordered slots
  -> bounded beam of independent projected states
     -> regenerate T02 candidates on this state's remaining lots, at this slot date
     -> create exact-candidate T03 evidence snapshot from in-memory review provider
     -> T03 hard eligibility and utility at this slot instant
     -> slot / lock / repeat / unresolved-quantity gates
     -> apply the selected T02 lot witness -> period nutrition gates
     -> retain bounded best future states
  -> best complete plan, or explicit incomplete prefix / no-plan result
```

- `planner-context.ts`: opaque preloaded context, temporal snapshot, deterministic identities.
- `planner-request.ts`, `planner-policy.ts`, `planner-types.ts`: validated requests,
  one default profile, output and bounds.
- `planner-inventory.ts`: exact copy-on-write projection of native lot quantities.
- `planner-nutrition.ts`: daily/horizon totals, qualification and period constraints.
- `planner-utility.ts`: future-only repetition/continuity and shortage fact aggregation.
- `weekly-planner.ts`: T02/T03 composition and bounded deterministic beam search.

## Trusted context versus caller request

`createPlanningContext(() => serverSnapshot)` accepts only a server-owned provider.
It is **not** an HTTP parser or authorization service. The server must authorize
membership and preload authoritative data before installing the provider. Never
forward request/LLM objects as inventory, preferences, substitution approvals or
reviewed food/nutrition evidence. A function wrapper does not authorize its data.
The process-local frozen context is registered privately; raw JSON, copied handles
and fabricated objects are rejected by `planWeeklyMeals`.

The snapshot contains:
- Server `snapshotId` and one offset-bearing `referenceInstant`.
- Household/current-user `rankingContext`, parsed by T03 (hard policy union and
  private/shared feedback semantics remain T03's, not independently reimplemented).
- Explicit static/D1/provided T02 catalog and household-scoped inventory lots.
- T03 ranking profile, reviewed substitution rules/approvals and active constraints.
- Optional **synchronous, deterministic, in-memory** exact-candidate evidence provider.

Catalog/inventory/preferences/history/rules are copied and frozen; subsequent caller
mutation cannot affect them. Every lot requires a native quantity/unit, ID,
household, safe integer version, explicit freshness/null and expiry date/null/kind.
Mixed scopes, duplicates and malformed snapshots reject rather than silently drop
stock. Empty canonical identity preserves an unmapped lot; T02 cannot allocate it.
Optional storage/condition/source/timestamps survive projection without inferred
shelf life. The provider's captured review data must itself be immutable and
versioned by its server owner; a JavaScript closure cannot be made trustworthy by
validation or automatically snapshotted by this library.

T03 receives its original T02 result and original exact-evidence snapshot for every
state/slot. No result is serialized then reconstructed into a trusted candidate.
Safety reviews bind the complete candidate, including variants, substitutions and
lot witnesses. A base-recipe review cannot be transplanted blindly onto a future
dish. D1 nutrition is unverified unless a separate trusted reviewer supplies review
state. Never call `readRankingNutrition` inside the beam: preload applicable sources
and let a server-owned pure provider select exact valid facts in memory.

For substitutions, T04 unions explicit server constraints with household/personal
`allergen:<key>` and `dietary:<key>` tokens. A replacement needs T02 compatibility
for every token and then still passes T03 whole-dish safety. Rules without matching
compatibility are not used. T04 neither authors new rules nor interprets safety tags.

## Request and temporal invariant

```ts
const context = createPlanningContext(() => authorizedPreloadedSnapshot);
const result = planWeeklyMeals({
  context,
  request: {
    startDate: '2026-09-09', horizonDays: 7, defaultServings: 2,
    mode: 'cook_now',
    slots: [
      { date: '2026-09-09', mealType: 'dinner' },
      { date: '2026-09-10', mealType: 'lunch', servings: 4 },
    ],
  },
});
```

Only listed slots are planned; omit disabled/eating-out slots. Horizon is 1–14 days,
1–42 requested slots, primary default seven days. Servings are positive integers
up to 20 and use T02's existing scaling. No extra servings or count rounding.
Each slot has date, breakfast/lunch/dinner, sequence (default 0), optional local
HH:MM (defaults 08:00/12:00/18:00), optional servings/time rules/lock. Stable ID is
`date:mealType:sequence`; duplicates reject. Sort by derived instant, sequence, ID.

`referenceInstant` must carry Z or an explicit offset within ±14:00. Its absolute
instant, derived local date and fixed offset form one coherent reference. All slot
instants use that offset. Dates must lie within the requested horizon and no slot
may precede the snapshot. No clock or randomness is read during planning. This is
**fixed-offset** planning, not an IANA timezone/DST engine. A future DST-aware adapter
must establish a new explicit contract rather than silently changing offsets.
Actual feedback after the original reference instant is removed once; selected
future meals never become cooked events. T03 recency ages at each slot instant.

Slot preferred time overrides only soft intent. A slot hard time can tighten but
never loosen household/member hard restrictions; the merged policy is evaluated
by T03. Unknown prep/cook time remains unknown, not zero. Known meal-type tags
must contain the requested meal type. Default unknown meal type is allowed with
`MEAL_TYPE_UNKNOWN`; policy may exclude it. No cuisine-specific assumptions.

A lock is `{kind, id, version}` for a recipe or additionally exact `variantId` for
a family. Locks survive candidate breadth selection; all locked source IDs must
fit the configured catalog bound. Changed version, unavailable stock, excluded
safety/time, repeat/nutrition conflict or an unseen truncated variant cannot be
silently replaced. Replan/swap by changing requested locks and replaying **from the
original inventory snapshot**, not subtracting a prior plan again.

## Projected inventory and allocation

Each branch owns exact `Quantity` initial/consumed balances; sibling branches share
only immutable data. Apply the **actual T02** native-unit allocations, including
direct, substitution and optional demand. Repeated allocations to one lot are
summed exactly, with identity/unit/metadata/availability and nonnegative checks.
No alternate conversion, recipe matching or substitution allocation engine exists.
Numbers are explicit T02/output boundaries; unsupported representability is not
rounded into zero stock or silently clamped. Fractional pieces remain explicit.

T02's new opt-in `allocationPolicy: 'expiry_first'` sorts usable lots by:
1. Dated `use_by`, earliest date, then binary lot ID.
2. Dated `best_before`, earliest date, then ID.
3. Dated `estimated`, earliest date, then ID.
4. Unknown expiry evidence, stable ID.

This is kind-prioritized expiry ordering, not global earliest-date or waste
optimization. No inferred opening/acquisition priority. T02's default remains
`lot_id` with identical standalone T02/T03 behavior. Past use-by is unavailable;
past unknown/estimated needs review; past best-before is not automatically unsafe.
Nothing revives unusable lots, invents expiry or extends shelf life. Future slots
regenerate availability at their own date. Zero balances/expired lots remain visible
in final snapshots; visible does not mean usable.

Per-lot deltas retain previous/consumed/remaining native quantities and revision.
For each path, exact initial = consumed + remaining; real rows/revisions never change.
Projected quantities are not reservations or actual cooking deductions.

## Search, proof scope and bounds

A deterministic beam considers alternative future states, unlike repeatedly taking
T03 rank #1. It ranks state utility, then a binary ordered slot/candidate path.
The retained frontier is capped **during expansion**. State budget includes the
root and every attempted candidate transition (including nutrition-pruned trials).
Generation calls and candidate counts are separately reported. Each generation is
itself bounded by catalog limits and T02 family budgets; no inner-loop I/O exists.

| Policy | Default | Maximum |
| --- | ---: | ---: |
| beamWidth | 6 | 16 |
| candidateLimitPerSlot | 8 | 32 |
| maxSearchStates | 1024 | 4096 |
| recipeLimit | 80 | 500 |
| familyLimit | 4 | 16 |
| variantCandidatesPerFamily | 16 | 64 |
| variantSearchStatesPerFamily | 128 | 1024 |

Trusted input is bounded to 500 recipes, 16 families, 1000 lots and 2000 history
events; oversized inputs reject before search. Recipe catalog selection is stable
ID order, with locked sources retained first; truncation is explicit. T02 remains
the only family expander. Max generated candidates per call is bounded by
`recipeLimit + familyLimit * variantCandidatesPerFamily` (default 144).

No state deduplication is attempted: equivalent stock alone does not imply equivalent
future-repeat, lock, nutrition or history state. The small explicit beam/state caps
bound duplication without unsoundly merging different futures. The stress regression
uses 100 recipes and 21 slots, runs twice, and checks determinism/frontier/candidate/
state ceilings rather than asserting flaky wall-clock thresholds.

`recipeSearchExhaustive` includes T02 family/numeric/catalog completeness;
`plannerSearchExhaustive` covers candidate/beam/state truncation. `searchExhaustive`
requires both. Family metadata retains calls, cumulative/max traversal work,
candidates and truncation. A found feasible plan can still be truncated and is
only the **best found**, never advertised as globally optimal. Proof scope is the
supplied catalog, requested constraints and fixed T02 substitution/allocation policy,
not all possible dishes or all possible allocations.

## Utility and future variety

Total = sum(T03 finalScore) − future repetition penalties + allocated ingredient
continuity + period nutrition fit. Existing T03 inventory/expiry/preference/time/
single-meal nutrition/shopping signals are not added again.

For each meal, only the strongest matching future repetition class is charged:
exact dish .18, otherwise related family .06, otherwise cuisine .02. Exact identity
ignores serving count (a larger portion cannot evade repeats) and includes concrete
family variant/version. Broader penalties cannot exceed narrower penalties.
`maxExactRecipeRepeats` defaults to 42 and `minimumRepeatGap` to 0: soft diversity
is practical by default, hard restrictions are explicit. Ingredient continuity adds
up to .025 for proven allocated ingredients already consumed by earlier selections;
it never penalizes staple ingredients. No primary-protein taxonomy is fabricated.
Period nutrition adds up to .08, not a second per-meal nutrition score. The result
retains signed components/reasons per slot and whole plan; it makes no LLM explanation.

## Nutrition

Targets explicitly state `basis: 'household_total'`, nutrient, min/max, hard/soft,
allowEstimates and either dated `day` or `horizon`. Daily targets need a requested
slot on that date. Up to 28 unique period/nutrient targets; no invented daily meal
allocation or per-person consumption split. Sum qualified T03 per-serving values ×
actual selected servings with exact intermediate arithmetic. This does not compute
nutrition from ingredients or infer profiles for substitutions/family variants.

Known totals, unknown contributions, coverage, reviewed/estimated counts, daily and
horizon summaries remain separate. Missing values do not become zero. Hard targets
require complete reviewed evidence, including explicit estimate opt-in. Known hard
maxima and unqualified hard contributions prune immediately; minima are checked
only when the relevant requested period closes. Partial prefixes keep remaining
periods pending and never assert their targets satisfied. Soft fit is bounded and
shrunk to neutral for missing/unqualified data. Known zero is a real observation.

## Output and failure semantics

`WeeklyMealPlan` schema version 1 contains:
- Stable display ID, scope/reference, normalized request and source snapshot metadata.
- Ordered slots, exact T02 candidate/requirements/variant/substitutions, T03 score
  breakdown, serving count, per-lot consumption, raw shortages and reason codes.
- Initial versioned stock, projected final stock, daily/horizon nutrition,
  empty explicitly disabled leftover artifacts and structured diagnostics.
- Aggregated shortage facts grouped only by canonical ingredient, **existing unit**
  and optionality; preserve known subtotal and unresolved count/null total.
- Separate search completeness/work/limits and `persistence: 'generated_only'`.

`status` is `feasible`, `partial`, `infeasible`, or `search_limited`. `conclusion`
is independently `feasible`, `proven_infeasible`, or
`no_plan_found_within_search_limit`. `infeasible` is used only with exhaustive search;
a partial prefix may also have an exhaustive inability to complete. Partial output
is the longest/best valid prefix, not a schedule with silently skipped gaps. Later
unplanned slots are blocked by the first gap. `diagnostics` contains global limits
and chosen-prefix failure observations only. `search.rejections` separately
aggregates rejected alternatives across explored branches; their failures are not
attributed to selected meals. An unexpanded prefix gets an incomplete-search reason,
not a rejection borrowed from another branch.

Empty catalog/no candidates, shortage, unresolved quantity, T03 hard exclusions,
meal type, repeat, locks, period nutrition and computational limits are explicit.
No arbitrary recipe fallback or automatic constraint relaxation. Invalid requests,
forged contexts, inconsistent trusted data or unrepresentable output throw explicit
validation/projection/range errors rather than emitting fabricated feasible state.

## Shopping and T05 boundary

`cook_now` uses only proven satisfiable required demands. `shopping_allowed` may
select known shortages: consume only the existing proven stock, preserve remaining
shortages, and **do not add hypothetical purchases** to later inventory. Unresolved
required quantities cannot produce a coherent plan even in shopping mode; optional
uncertainty remains explicit. T05 gets all selected demands, shortages and final
projection and must not subtract the original stock a second time.

There are no prices, budgets, retailers, package choices, purchase rounding,
final shopping lists, purchase commands or waste optimizer. Leftovers are deliberately
disabled: legacy Week's title/tag heuristics and links do not provide reviewed
prepared-food storage/expiry rules. Each selected slot cooks and consumes its exact
requested servings; no excess or implied multi-day safe leftover is created.

## Persistence, concurrency and legacy coexistence

No new table/migration is necessary: T04 returns generated in-memory state. Do not
persist beam branches or write this result into legacy Week JSON as if compatible.
`sourceSnapshot` retains server ID/capture instant, inventory revisions, current
catalog versions and a deterministic fingerprint. The 64-bit fingerprint/display
ID is **not** an authorization or collision-proof optimistic-lock token. A future
accepting writer must reread membership, whole inventory (including added/deleted
lots), recipe/review versions and preferences and regenerate when changed; the
output explicitly requires revalidation before acceptance. Planning cannot reserve
stock indefinitely or declare a later cooking command safe.

Legacy `domain/src/week/*`, API `routes/week.ts`, shopping, existing meal tables,
`WEEK_SCHEMA_MODE`, dual writes, snapshots, reconciliation, ownership and idempotent
inventory/cooking commands remain unchanged. T06's safe shadow path is: authorize,
preload one coherent versioned context, run T04 read-only alongside legacy Week,
compare outcomes without overwriting either schema, then separately review a
canary/acceptance adapter using existing revision/transaction/reconciliation rules.
Actual consumption occurs only through existing authorized cooking commands.
No frontend, AI planning, payment, authentication or production cutover is included.
