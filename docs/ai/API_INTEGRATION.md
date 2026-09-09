# T06A backend contract for T06B

## Entry points and ownership

Canonical prefix: **`/api/v1/meal-planning/plans`**. Set server
`MEAL_PLANNER_ENABLED=true` to opt in; otherwise authenticated requests return 404
`MEAL_PLANNER_DISABLED`. No new UI/default-route cutover is part of T06A.

Use the existing cookie HTTP transport, trusted Origin/CSRF rules and
`X-Frigo-Expected-User-Id` / `X-Frigo-Expected-Household-Id` owner fencing. Household
and user come only from the authenticated session. Guests are denied. The API does
not accept household/user IDs in its body. Current household membership is checked
in middleware, snapshot loading and guarded persistence. Plans are **creator-private
within that household**, not visible to every member: T03 uses private tastes.
Foreign/missing plan IDs return 404; loss of household access returns 403. All
responses are `Cache-Control: no-store`.

Import request/response schemas and inferred types from
`packages/domain/src/meal-planning-api.ts` and `meal-shopping-api.ts` (also re-exported
by `@frigo/domain`). These are frontend-safe Zod contracts, with **no T02–T05
implementation imports**. T06B should never deserialize opaque engine contexts.
T06B's additive current-plan, alternative and explanation contracts are in the
frontend-safe leaf `packages/domain/src/meal-planning-presentation.ts`.

## Actions

All successful actions return HTTP 200. All request objects are strict: unknown
fields are rejected with 422, including nested price/review/context claims.
Bodies are limited to 64 KiB. IDs are UUIDs; revisions are positive safe integers.

| Method / suffix | Request | Response |
| --- | --- | --- |
| POST `/` (no trailing slash required) | `MealPlanningIntentSchema`; `Idempotency-Key` required | `MealPlanDtoSchema` |
| GET `/current` | no body | `CurrentMealPlanDtoSchema`: `{plan:MealPlanDto|null}` |
| GET `/:id` | no body | `MealPlanDtoSchema` plus fresh source check |
| GET `/:id/alternatives?revision=N` | one positive safe-integer revision; no extra query fields | `PlanAlternativesDtoSchema` |
| POST `/:id/explanation` | `{revision,slotId,locale:'vi'|'en'}` | `PlanExplanationDtoSchema` |
| POST `/:id/regenerate` | `{revision, intent?}` | replacement `MealPlanDtoSchema`, revision + 1 |
| POST `/:id/swap` | `{revision, slotId, replacement:{kind,id,variantId?}}` | fully replanned `MealPlanDtoSchema`, revision + 1 |
| POST `/:id/shopping` | `{revision,currency,budget?}` | `PlanShoppingDtoSchema` |
| POST `/:id/feedback` | `{revision,slotId,type}`; `Idempotency-Key` required | `PlanFeedbackDtoSchema` |

`Idempotency-Key`: 8–100 ASCII letters/digits/underscore/hyphen. Keep the same key
for an exact retry. Creation deduplicates per household/user/key before planning;
different intent with the same key conflicts. Concurrent first requests can both
compute, but only one durable plan is created. A creation replay after later
mutations returns the **current** revision of that same plan, not revision history.
Mutations use revision fencing, not a distributed command ledger: after a lost
response, GET the plan; do not blindly overwrite it with an old revision.

### Generate

```json
{
  "startDate": "2030-01-02",
  "horizonDays": 7,
  "utcOffsetMinutes": 420,
  "defaultServings": 2,
  "mode": "shopping_allowed",
  "slots": [{"date":"2030-01-02","mealType":"dinner"}]
}
```

Dates must be real calendar dates. Horizon 1–14 days, 1–42 unique slots, servings
1–20, offset −840..840 minutes. `mode`: `cook_now` or `shopping_allowed`. Slots may
include `sequence` (default 0, max 42), local `time` (`HH:MM`), `servings`,
`preferredTimeMinutes`, `hardMaxTimeMinutes` (1–1440). Server time owns capture;
offset is user scheduling intent, not an authoritative client timestamp. No slot
may precede capture or lie outside the horizon. Fixed-offset semantics do not model
IANA timezone/DST changes. Slot defaults are 08:00/12:00/18:00.

Household and personal hard T03 policies always accumulate; slot limits only
tighten them. Request omissions cannot erase policy. T03 typed preference tables
are authoritative for this opt-in boundary. Legacy global preferences/free-form
Week dietary strings are **not silently imported**, per ADR-013. No preference
authoring endpoint is introduced here; reviewed data migration/settings integration
must remain explicit. Absent safety reviews fail closed under active restrictions.

### Plan response and recipe detail

`MealPlanDto`: `{schemaVersion:1,id,householdId,revision,createdAt,updatedAt,intent,
result,freshness}`. `result` contains:

- `status`: `feasible | partial | infeasible | search_limited | incomplete`.
- `conclusion`: `feasible | proven_infeasible | no_plan_found_without_proof`.
- `planningReference`: server instant, local date, fixed offset.
- `meals`: ordered `slotId/date/mealType/time/instant/servings`, candidate display ID,
  source `{kind,id,version,variantId}`, title/cuisine, nullable prep/cook time,
  instructions, exact requirements, projected consumption, reasons and safety scope.
- Each requirement: ingredient ID, optional flag, status
  `satisfied | partial | missing | unresolved`, required/covered/missing quantities,
  reason codes. `missing:null` is unresolved, never zero.
- `unplannedSlots`: slot identity/date/type/reasons. A partial prefix is not a week.
- `search`: exhaustive/plannerExhaustive/recipeExhaustive, truncated, limitReasons,
  source-tagged incompleteReasons, separate aggregate rejection diagnostics.
- `diagnostics`: chosen-prefix/global `{slotId,code,count}` observations. Search
  rejections concern explored alternatives, not failures of selected meals.

Examples of reasons: `REQUIRES_SHOPPING`, `MEAL_TYPE_UNKNOWN`, `LOCK_PRESERVED`,
`LIKED_RECIPE`, `DISLIKED_RECIPE`, `COOK_TIME_UNKNOWN`, `NUTRITION_DATA_UNKNOWN`;
rejection codes include `ALLERGEN_CONFLICT`, `SAFETY_UNKNOWN`,
`FORBIDDEN_INGREDIENT`, `NEVER_RECOMMEND`. Codes are structured, not AI prose; UI
must have a fallback for new codes. `safetyAssessment:not_requested` is **not safe**;
`requested_constraints_only` addresses only requested reviewed constraints.
Family instructions absent from D1 remain an empty list, not invented instructions.

Normal recipe-detail UI can render the selected meal directly from GET, without
calling an engine or mixing legacy static recipe data into its authoritative demands.
T06B supplies a narrow catalog-choice endpoint described below. It never accepts
candidate JSON or claims a catalog entry is eligible for a selected slot.

### T06B compatibility decision: discovery and replacement intent

T06A lacked cross-session plan discovery and a safe way to pick a replacement not
already selected. These two additive reads are needed for reload/new-device
restoration and a usable swap dialog; they do not redesign planning or ownership.

`GET /current` returns the authenticated creator's most recently saved plan in the
current household, ordered by `updated_at DESC, id DESC` (stable timestamp ties).
This deliberately includes a regenerated older plan rather than using creation
time alone. It reuses the existing owner/update index, membership join and normal
DTO freshness inspection. No plan is `{plan:null}`, not 404. Other members' private
plans never participate; membership loss remains 403. `/current` is registered
before `/:id`, and adds no client ID persistence, new table, history or migration.
An empty lookup rechecks membership so a concurrent revocation is not reported as
an ordinary empty plan.

`GET /:id/alternatives?revision=N` returns
`{planId,planRevision,alternatives:[{kind:'recipe',id,title}],truncated}`. At most 50
validated D1-catalog recipes are returned in binary ID order. No family enumeration,
ranking, eligibility, allergy, shortage or price claim is made; titles are display
data, not HTML. The catalog is loaded through T06A's existing authorized snapshot;
revision/membership are rechecked after loading. Old revisions return 409
`PLAN_REVISION_CONFLICT`. Malformed, duplicate or additional query fields return 422.
The UI must describe these as choices to **try**, not pre-approved safe swaps. The
existing POST swap still runs the full authoritative sequential validation, and a
forbidden/unavailable/infeasible replacement retains the prior plan unchanged.

### T06B on-demand explanation

`POST /:id/explanation` returns `{planId,planRevision,slotId,source,reasonCodes,
fallbackReason}`. `source` is `deterministic | ai`; `fallbackReason` is null only on
AI success, otherwise `disabled | no_facts | provider_unavailable | timeout |
invalid_output | ungrounded_output`. It is an explanation of that persisted plan
revision, **not a fresh inventory/safety assessment**. Existing GET freshness must
remain visible. Unknown/unselected slots return 422 `SLOT_NOT_FOUND`; revision and
membership are checked both before and after optional provider latency.

The client supplies only intent; the server derives the fact IDs from the selected
meal's persisted reasons. AI may reorder the complete deduplicated ID set, never
add a reason or omit uncertainty. It returns no factual prose; UI-owned localized
sentences remain the only explanation text. No names, household/user/plan IDs,
ingredients, quantities or other user text go to the provider. Details and budgets
continue to render independently from authoritative DTOs. The route performs no
mutation, feedback, purchase, stock command or planning/search call.

`MEAL_PLANNER_AI_ENABLED` remains off unless exactly `true`. An explicit request
uses the existing AIRouter/native Workers AI provider only, with one request,
256 output-token cap and 2500 ms response deadline. External chat paths are not
used because their current transports lack equivalent token/time bounds. Missing
native binding or mock mode falls back deterministically. The existing expensive
10/minute/account/path limiter applies; no automatic card-render calls or retries.
See `AI_LAYER.md` for grounding, timeout limitations, cost scope and verification.

### Exact values

Money: `{ "currency":"JPY", "minorAmount":"4820" }`. Currency is explicit:
VND/JPY minor digits 0; USD/EUR 2. Never parse totals to Number for authoritative
arithmetic. T05 totals may exceed `Number.MAX_SAFE_INTEGER`. Input budgets must
fit T05's existing safe-integer minor-unit bound and match the requested currency;
the checked integer conversion is lossless. No price/FX/formatting inference.

Quantity: `{ "value":"0.000001", "unit":"g" }`. The string is the canonical
decimal representation of the validated T02/T05 numeric boundary, including
scientific notation where applicable (`"5e-17"`). It preserves those values exactly;
it does not promise additional precision absent in the underlying engine output.
No new float quantity is exposed. Supported units: g/kg/ml/l/piece/pack/bunch/slice.
Matching package labels do not prove equivalent contents. Display formatting belongs
to T06B; these DTOs are never accepted back as inventory/shortage authority.

### Revision, freshness, regenerate and swap

Stale revision: **409 `PLAN_REVISION_CONFLICT`**. GET current state before retrying.
Regenerate uses current stock, typed preferences, history, catalog and evidence;
it does not clone old results. Omitting `intent` preserves scheduling intent and
server-established swap locks. Supplying a new intent drops only locks for removed
slots. Past slots require an updated future horizon rather than a false replay.

Swap replacement version is looked up server-side. Recipe replacements must not
have `variantId`; family replacements require their exact opaque variant ID.
The service adds a lock then replays **the entire plan from fresh real inventory**,
including every downstream slot; other unlocked meals may change. Existing swap
locks remain. An invalid/unsafe/unavailable replacement, or one for which the
bounded planner cannot produce a complete plan, returns 422 `SWAP_NOT_FEASIBLE`
without changing the stored revision. Shopping is not cached, so the next request
always uses the new revision's recomputed shortages. There is no local slot patch.

`freshness` has `status:fresh | requires_revalidation`, `checkedAt`, reasons
`stale_inventory | stale_preferences | stale_catalog | stale_history |
planning_time_elapsed`, and `requiresRevalidationBeforeConsumption:true`.
SHA-256 hashes compare actual validated source data, including added/deleted lots,
nutrition and instructions; no hash substitutes for auth or revision fencing.
Current T03 history windows can age out and intentionally require revalidation.
These are as-of checks, not reservations or guaranteed future freshness. A write
after the checked snapshot can make any returned plan stale. Actual cooking must
use a separate authorized consumption command with its own revalidation.

### Shopping and budget

```json
{"revision":2,"currency":"JPY","budget":{"mode":"hard","money":{"currency":"JPY","minorAmount":"4820"}}}
```

T05 reads only the stored, schema-validated server-generated plan projection and a
server-owned purchase provider; never client plans/shortages/prices/catalogs.
`PlanShoppingDto` binds `planId`, `planRevision`, `priceAsOf`, catalogStatus and
`requiresPriceRevalidation:true`. It is not persisted or a quote/purchase reservation.
Stale source/time returns 409 `PLAN_REVALIDATION_REQUIRED`; regenerate explicitly.

Default production provider has **no reviewed retail offers**:
`catalogStatus:reviewed_catalog_unavailable`. Missing contents/prices remain unknown
or unfulfillable, not cheap/free. Legacy benchmark prices, package tables and OCR
observations are not trusted offers. An internal reviewed provider can be installed
at server composition; no request or AI output can install it. Its options must
already be suitable for the household/dish, not merely canonical-ID matches.

`result` preserves requirements with source-slot provenance, optional/unresolved
requirements, selected packages/content/counts and known/unknown prices,
`shoppingStatus:fulfilled | unfulfillable | unknown`,
`shoppingCompleteness:complete | partial`, exact known/total/best-known/proven-minimum
costs and lower bounds, uncertainty, optimizer limits/incompleteness, stock remainder
and purchase-surplus risk. `budget.status`: `within_budget | over_budget | unknown |
not_configured`; `unknown` must never display as within budget. Known subtotal is
not necessarily a complete total; `totalCost:null` remains visibly unknown.
`largestKnownCostDrivers` compares known costs only (T05 internal name remains
compatible). Waste risk has unknown coverage and `certainWasteQuantity:null`.
Nothing is purchased, paid, marked bought or added to stock.

### Feedback

`type`: liked/disliked/skipped/swapped/cooked. The server derives recipe/family ID,
household/user, event ID and time from the authorized plan/clock. Like/dislike/skip
are T03 feedback; swapped refers to the previous and replacement identities of a
server-applied swap in the **current revision**. A client cannot fabricate a swap.
Record it before another regenerate/swap replaces that revision's last-swap metadata.
T03 event IDs are server-generated SHA-256 identities scoped by household/user/plan/
revision/slot and retry key, avoiding global client-ID collisions. The event INSERT
checks the plan revision and membership atomically, so a concurrent regeneration
cannot accept stale feedback. Exact concurrent retries reuse the first event
timestamp; conflicting event intent returns 409.

Cooked is a revision/slot-scoped **annotation only** with idempotent replay, not an
inventory command and not fabricated actual `cooked_meals` history. It never implies
liked. The feedback response states `inventoryMutated:false`. No annotation list
is included in GET; T06B should retain the returned action receipt and use the same
key when retrying. Long-term event/revision history UX is deferred.

## Errors, rate limiting and observability

401 unauthenticated; 403 membership/guest/owner-fence/CSRF denial; 404 private or
missing plan/disabled feature; 400 malformed JSON/missing retry key; 422 schema,
horizon, slot or replacement intent; 409 stale source/revision or retry-key conflict;
413 oversized body; 429 rate-limited; 500 unexpected failure. Existing auth/DB/
limiter unavailability may return 503. Error envelopes use `{code,error}` and never
include SQL, evidence tokens or stack traces, including in development.

Existing rateLimiter: expensive generate/regenerate/swap/shopping **10/minute per
account and route path**, reads/feedback **60/minute per account and route path**.
Respect `Retry-After`. Existing KV policy/fail-closed config remains; fallback is
explicitly isolate-local/best-effort, not globally atomic quota. Dynamic plan paths
have independent buckets. T07 should assess cross-plan aggregate abuse limits.
Existing request logs provide path/action/status/duration; structured engine events
include result status/search caps, not private ingredients/preferences/evidence.

## Persistence and legacy coexistence

Migration `0022_generated_meal_plans.sql` adds a current-final-result row and cooked
annotations. Membership/plan composite FKs cascade on membership/household/user
deletion. Creation retry identity is scoped; mutations are single-statement CAS.
Internal version-1 JSON envelopes hold validated intent/locks, safe result, minimal
T05 projection and source hashes, not beam frontiers, ranking contexts or reviews.
No historical plan revisions are archived. Migration and schema gate must be applied
by the release operator before enabling the flag; T06A applied **local D1 only**.

Legacy `/week`, `/recipes`, `/shopping`, Week tables/dual-write/reconciliation and
actual cooking commands remain the current default. Do not cast new DTOs to legacy
Week types. No AI interface/provider is required. T06B owns the UI, explicit settings
and reviewed-data integration, optional presentation and end-to-end browser flow.
Start with the schema-based cookie client and a read-only plan/detail view that
renders partial/search-limited/unknown states, then add revision-fenced actions.
