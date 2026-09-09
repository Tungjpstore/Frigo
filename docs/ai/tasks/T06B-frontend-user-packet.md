# Preserved T06B user task packet

Historical task instructions preserved verbatim below for a fresh agent without
chat history. Implementation was stopped on 2026-09-09; this packet is not an
instruction to resume during the preservation-only checkpoint. Read
`../T06B_WIP_HANDOFF.md` and the latest user mandate first. The authorized repository
is `arsvn-vn/Frigo`; the original repository URL below is historical, not authority
to change remotes or source-control scope. T06B remains incomplete; T07 is blocked.

---

FRIGO — T06B FRONTEND / PRODUCT UX / AI PRESENTATION / E2E

Repository:
https://github.com/tun-vn/Frigo

Task:
T06B — Frontend + Product UX + AI Presentation + End-to-End Integration

Dependency:

T01 — COMPLETE
T02 — COMPLETE
T03 — COMPLETE
T04 — COMPLETE
T05 — COMPLETE
T06A — COMPLETE

Known verified T06A checkpoint:

Branch:
hoplite/leukas-32474504

Final verified T06A code checkpoint:
c46330c

T06A established:

- trusted backend application orchestration
- household authorization
- plan generation
- plan retrieval
- regenerate
- swap
- shopping optimization
- feedback
- plan revisions
- stale/revalidation semantics
- exact Money DTO
- exact Quantity DTO
- HTTP/API trust boundaries
- server-owned authoritative snapshots

T06B must now turn this backend into a polished Frigo user experience.

T06B owns:

1. Weekly Planner frontend
2. Meal/recipe interaction UX
3. Swap/regenerate UX
4. Shopping + budget UX
5. Feedback actions
6. Partial/incomplete/stale states
7. Mobile/responsive experience
8. AI presentation/explanation layer
9. Deterministic AI fallback
10. Frontend/integration/E2E tests
11. Final T07-ready handoff

T06B does NOT own:

- redesigning T02 Recipe Engine
- redesigning T03 Ranking
- redesigning T04 Planner
- redesigning T05 Shopping Optimizer
- redesigning T06A trust architecture
- creating new authoritative client-side business logic
- payment
- checkout
- PayOS
- final T07 security/performance hardening

The user-facing architecture must remain:

UNTRUSTED FRONTEND INTENT
        ↓
T06A TRUSTED API
        ↓
AUTHORITATIVE T02–T05 RESULT
        ↓
SAFE DTO
        ↓
FRONTEND PRESENTATION
        ↓
OPTIONAL GROUNDED AI EXPLANATION

Never invert this flow.


==================================================
0. MANDATORY PRE-FLIGHT
==================================================

Before changing anything, read:

docs/ai/MASTER_SPEC.md
docs/ai/AGENT_RULES.md
docs/ai/ARCHITECTURE.md
docs/ai/DOMAIN_MODEL.md
docs/ai/DECISIONS.md
docs/ai/CURRENT_STATE.md
docs/ai/TASK_BOARD.md
docs/ai/HANDOFF.md

Read task packets:

docs/ai/tasks/T01-domain-data-foundation.md
docs/ai/tasks/T02-recipe-engine.md
docs/ai/tasks/T03-ranking-personalization.md
docs/ai/tasks/T04-weekly-meal-planner.md
docs/ai/tasks/T05-budget-shopping-waste.md
docs/ai/tasks/T06-ai-api-frontend.md

Also read current subsystem documentation including equivalents of:

docs/ai/RECIPE_ENGINE.md
docs/ai/RANKING_ENGINE.md
docs/ai/WEEKLY_PLANNER.md
docs/ai/SHOPPING_OPTIMIZER.md
docs/ai/API_INTEGRATION.md
docs/ai/T06A_BACKEND.md

or whatever files currently contain the final T06A API contract.

Inspect Git:

git status
git branch --show-current
git log --oneline -25
git diff

Verify:

- c46330c exists
- c46330c is in current ancestry
- repository is clean before T06B
- T06A is marked COMPLETE
- T06B is READY
- backend tests/build are green according to repository state
- no missing/untracked required T06A source files remain

If repository/docs disagree:

resolve documentation/repository state first.

Do not rely on previous chat history.


==================================================
1. INSPECT EXISTING FRONTEND BEFORE DESIGNING
==================================================

Inspect:

frontend app structure
routing
navigation
layout
design system
colors
typography
cards
buttons
modals/drawers
forms
loading components
empty states
toast/error handling
mobile breakpoints
state management
data fetching
API client
shared schemas/DTOs
i18n/localization
current Week screen
existing inventory screen
existing shopping list UI
recipe detail UI
onboarding/preferences UI
partial T06 frontend files recovered from the interrupted previous attempt

Do NOT build a second visual system.

Use the existing Frigo design language.

Where partial T06 frontend work already exists:
audit it,
reuse good work,
fix incomplete wiring,
do not rewrite it just because another model wrote it.


==================================================
2. HARD SCOPE
==================================================

T06B owns:

- frontend API client integration
- current/recent plan UX
- weekly planner page
- meal cards
- recipe detail integration
- swap meal experience
- regenerate experience
- stale/revalidation experience
- shopping list
- budget presentation
- unknown-price presentation
- optimizer/truncation presentation
- feedback UI
- loading states
- empty states
- partial/incomplete states
- errors
- mobile UX
- deterministic reason-code presentation
- optional AI explanations
- deterministic AI fallback
- frontend tests
- HTTP integration tests where required
- E2E/browser flows
- documentation
- T07 handoff

T06B does NOT own:

- changing meal feasibility algorithms
- ranking weights
- planner search strategy
- optimizer package-selection algorithm
- backend household authorization redesign
- trusted price architecture redesign
- actual inventory consumption architecture
- actual shopping purchase execution
- PayOS
- checkout


==================================================
3. T06A IS AUTHORITATIVE
==================================================

Frontend must consume T06A APIs.

Do not reimplement backend domain logic in the browser.

Frontend must NOT independently calculate:

recipe feasibility
inventory shortages
unit conversions
shopping deficits
package optimization
budget proof
allergy safety
planner feasibility

Frontend may format/display authoritative values.

Example:

WRONG:

const total = shoppingLines.reduce(
  (sum, x) => sum + Number(x.price),
  0
)

RIGHT:

render authoritative exact Money DTO returned by T06A.


==================================================
4. CLIENT MUST NEVER CREATE TRUSTED DOMAIN OBJECTS
==================================================

Do not construct frontend objects and send them as:

WeeklyMealPlan
ShoppingContext
RankingContext
RankingEvidence
trusted inventory
trusted price catalog
reviewed substitutions

Frontend sends intent.

Examples:

generate:
planning options

swap:
planId
revision
slotId
replacement intent/candidate ID

shopping:
planId
revision
budget/options

feedback:
planId
revision
slotId
feedback type

Backend remains authoritative.


==================================================
5. PRIMARY PRODUCT FLOW
==================================================

The primary Frigo experience should conceptually be:

Home / Planner
    ↓
Generate weekly plan
    ↓
See week
    ↓
Inspect meals
    ↓
Swap/regenerate if desired
    ↓
See shopping needs
    ↓
See budget
    ↓
Use shopping list
    ↓
Give feedback

The UX should answer quickly:

"What am I eating?"

"What do I already have?"

"What do I need to buy?"

"How much is known to cost?"

"What information is still uncertain?"


==================================================
6. WEEKLY PLANNER SCREEN
==================================================

Build or complete the main Weekly Planner screen.

Support:

planning date range
day grouping
meal slots
recipe name
servings
cook time if known
important reason labels
shopping state
nutrition state where useful

Primary mobile presentation should be card/list oriented.

Avoid an unusable desktop spreadsheet as the only view.

If existing UI already has a weekly calendar concept:
extend it.


==================================================
7. PLAN CARD INFORMATION HIERARCHY
==================================================

Do not overload every meal card.

Primary information:

recipe name
meal type
servings
cook time
availability/shopping indicator

Secondary information:

uses expiring food
matches preferences
requires shopping
nutrition incomplete
substitution used

Advanced diagnostics belong in progressive disclosure.


==================================================
8. STRUCTURED REASON CODES
==================================================

Map backend reason codes to deterministic localized presentation.

Examples:

USES_SOON_EXPIRING_STOCK
→ "Ưu tiên dùng thực phẩm sắp đến hạn"

MATCHES_PREFERRED_CUISINE
→ "Phù hợp khẩu vị của bạn"

LOW_SHOPPING_BURDEN
→ "Cần mua thêm ít nguyên liệu"

NUTRITION_DATA_INCOMPLETE
→ "Chưa đủ dữ liệu dinh dưỡng"

USES_SUBSTITUTION
→ "Có sử dụng nguyên liệu thay thế"

Do not expose raw enum names to users.


==================================================
9. UNKNOWN != ZERO
==================================================

Frontend must preserve backend uncertainty.

Examples:

nutrition unknown
→ do NOT display 0 kcal

price unknown
→ do NOT display ¥0

quantity unresolved
→ do NOT display "0g missing"

shopping total incomplete
→ do NOT present known subtotal as final exact total

Unknown information should have explicit UI.


==================================================
10. MONEY PRESENTATION
==================================================

Consume exact T06A Money DTO.

Do not perform authoritative math using floating-point numbers.

Use locale-aware formatting only for display.

Example:

{
  currency: "JPY",
  minorAmount: "4820"
}

→

¥4,820

But keep the authoritative source unchanged.

Test very large values if DTO allows them.


==================================================
11. SHOPPING TOTAL SEMANTICS
==================================================

If T05 returns:

knownCost = ¥4,820
unknownPriceItems = 2

UI should say something like:

Known total: ¥4,820
2 items do not have price data yet

Do NOT say:

Total: ¥4,820

unless T05 says the total is complete/proven.


==================================================
12. BUDGET STATES
==================================================

Display distinct states.

WITHIN BUDGET

Example:
"Within your ¥6,000 budget"

OVER BUDGET

Example:
"Known cost exceeds budget by ¥420"

UNKNOWN

Example:
"Budget status cannot be confirmed because 2 items have no price data"

NOT CONFIGURED

Example:
"No weekly budget set"

Do not reduce all of these to red/green.


==================================================
13. LARGEST KNOWN COST DRIVERS
==================================================

T05 review noted potential naming ambiguity around:

largestCostDrivers

If the T06A contract still represents only known-price components:

UI wording must be:

"Largest known costs"

not:

"Most expensive ingredients"

unless all relevant prices are complete.

Do not misrepresent partial information.


==================================================
14. SHOPPING LIST
==================================================

Build/complete shopping UI.

Each line may show:

ingredient
required amount
selected packages
package count
known cost
surplus
price unavailable state
source meals if useful

Example:

Chicken breast

Need:
520g

Suggested:
2 × 300g

Known cost:
¥796

Projected surplus:
80g

Used for:
Mon dinner, Thu lunch


==================================================
15. PURCHASE SURPLUS != WASTE
==================================================

Do NOT present:

80g surplus
→ "80g wasted"

T05 intentionally distinguishes:

purchase surplus
from
certain waste.

Correct UI:

"80g estimated remaining after the current plan"

If waste risk is:

unknown

say so.


==================================================
16. WASTE PRESENTATION
==================================================

Possible user-facing states:

AT RISK

"Some food may remain near its expiry date"

NO DATED RISK IN HORIZON

"No dated waste risk detected for this plan"

UNKNOWN

"Not enough shelf-life data to estimate waste"

Never fabricate certainty.


==================================================
17. T05 OPTIMIZER TRUNCATION
==================================================

If T05 returns best-known rather than proven optimal:

Do not say:

"Cheapest possible combination"

Prefer:

"Best option Frigo found"

or equivalent subtle wording.

Normal users do not need:

statesExplored = 2048

unless diagnostic/developer UI.


==================================================
18. T04 PLANNER TRUNCATION
==================================================

Likewise, a truncated T04 search must not be marketed as mathematically optimal.

If a valid plan exists but search was incomplete:

UI may say:

"Frigo generated a strong plan from the options evaluated."

Do not scare normal users unnecessarily.

Preserve detail for diagnostics/logging.


==================================================
19. PROVEN INFEASIBLE VS NOT PROVEN
==================================================

Maintain T04 semantics.

PROVEN INFEASIBLE:

"Frigo cannot build a complete plan under the current hard constraints."

NO PLAN FOUND WITHOUT PROOF:

"Frigo couldn't complete the plan with the current options/data."

These are not identical.

Provide useful actions:

change meal slots
relax cooking time
allow shopping
regenerate


==================================================
20. CURRENT / RECENT PLAN UX
==================================================

T06A review found a UX gap:

there may not currently be a dedicated:

GET /plans/current

or recent-plan discovery endpoint.

Inspect the final API.

The user experience should support:

open Frigo
→ return to existing current/most recent weekly plan

without requiring the user to manually know a plan UUID.

Use the safest minimal solution.

Preferred options:

A. If backend now exposes a current/recent endpoint:
use it.

B. If plan ID is intentionally retained in existing frontend/app state:
implement reliable persisted client reference plus graceful missing-state behavior.

C. If no practical way exists to rediscover current plan on a new device/session:
a very small T06A compatibility backend addition such as current-plan lookup is allowed ONLY if necessary.

If adding such endpoint:

- maintain authenticated creator/household scope
- follow T06A authorization rules
- add HTTP tests
- do not redesign backend architecture

Document the decision.

This is one of the most important UX requirements of T06B.


==================================================
21. STALE / REVALIDATION UX
==================================================

T06A may return:

409
PLAN_REVALIDATION_REQUIRED

or freshness metadata requiring regeneration.

Do not show raw:

"409 Conflict"

to the user.

Provide UX such as:

"Your inventory or plan has changed since this plan was created."

Action:

Update remaining plan

or:

Regenerate from today

Preserve the reason if backend exposes it.


==================================================
22. MID-WEEK PLAN EXPERIENCE
==================================================

A weekly plan can become partially historical.

Example:

Monday/Tuesday are past.

Wednesday–Sunday remain.

Do not force users into a confusing full-week restart if backend supports future-horizon regeneration.

If backend only safely supports full regeneration:
explain the action clearly.

Do not fake local edits.


==================================================
23. SWAP MEAL UX
==================================================

Swap should be an explicit flow.

User selects:

meal
→ swap
→ valid alternatives
→ select replacement
→ submit with plan revision
→ server replans downstream state
→ receive new revision
→ update UI atomically

Do not:

optimistically replace one card
and leave downstream state stale.

If optimistic UI is used:
rollback correctly on conflict/failure.


==================================================
24. SWAP REVISION CONFLICT
==================================================

If backend returns stale revision:

refresh authoritative plan.

User-facing message:

"This plan changed since you opened it. Frigo refreshed the latest version."

Do not silently overwrite newer state.


==================================================
25. REGENERATE UX
==================================================

Provide clear actions such as:

Regenerate week
Regenerate remaining meals

only where backend supports them safely.

Display loading/progress without implying AI is deciding the plan.

Planning is deterministic backend computation.


==================================================
26. REGENERATE WITH BUDGET
==================================================

If T05 indicates hard budget infeasible:

UI may offer:

"Regenerate within budget"

This must issue an explicit new planning request.

Do NOT locally delete expensive meals.

Do NOT let frontend modify T04 plan to fake budget compliance.


==================================================
27. RECIPE DETAIL
==================================================

Recipe detail should display structured authoritative data:

ingredients
required quantities
servings
prep/cook time
steps
nutrition where known
missing ingredients
substitutions actually used
reason for recommendation

Do not invent missing data.


==================================================
28. OPTIONAL INGREDIENT UX
==================================================

Optional missing ingredient should not look like recipe failure.

Example:

"Coriander — optional, not in your fridge"

rather than:

"Missing required ingredient"


==================================================
29. UNRESOLVED QUANTITY UX
==================================================

Example backend:

inventory:
1 pack chicken

recipe:
300g chicken

status:
unresolved

UI:

"Frigo can't determine the exact amount in this package."

Possible action:

enter package quantity

Do not show:

"Missing 300g"

unless backend says missing.


==================================================
30. FEEDBACK UX
==================================================

Integrate T03/T06A feedback.

At minimum where appropriate:

like
dislike
cooked
skipped
swapped

Do not imply:

cooked = liked

Use API actions.

Do not mutate personalization only in local state.


==================================================
31. MARK COOKED
==================================================

T06A deliberately does not automatically mutate real inventory just because a meal is marked cooked.

Frontend must not claim:

"Inventory updated"

unless an actual inventory mutation endpoint confirms it.

If current endpoint only records feedback:

present it as:

"Marked as cooked"

not:

"Ingredients removed from fridge."


==================================================
32. SHOPPING CHECKBOXES
==================================================

Checking an item in the shopping UI is not necessarily an authoritative purchase.

Inspect current shopping-list behavior.

Do not automatically:

add item to inventory
change plan
mark purchased in DB

unless explicit backend support exists.

Local checklist state may be presentation-only if documented.


==================================================
33. FRONTEND STATE MODEL
==================================================

Model explicit states.

At minimum:

idle
loading
success
partial
incomplete
stale
error

Do not use only:

loading | data | error

because T04/T05 intentionally have valid incomplete results.


==================================================
34. ERROR MAPPING
==================================================

Map API outcomes.

401
→ login/session state

403
→ access denied

404
→ plan unavailable

409 revision conflict
→ refresh latest plan

409 revalidation
→ regeneration UX

422
→ validation feedback

429
→ "Too many planning requests. Try again shortly."

500
→ generic safe error

Do not show stack traces/internal messages.


==================================================
35. LOADING UX
==================================================

Planning and shopping optimization may take longer than ordinary CRUD.

Use proper loading state.

Do not spam duplicate requests from repeated clicks.

Disable or debounce actions appropriately.


==================================================
36. REQUEST DEDUPLICATION
==================================================

Avoid accidental:

double plan generation
double regenerate
double feedback

from rapid taps.

Use existing frontend request/state conventions and T06A idempotency/revision contracts.


==================================================
37. MOBILE-FIRST
==================================================

Frigo should work well on mobile.

Verify at realistic small viewport.

Requirements:

cards readable
buttons reachable
shopping list usable
swap flow usable
budget summary not overflowing
dialogs/drawers responsive
no forced horizontal table for core flow


==================================================
38. ACCESSIBILITY
==================================================

Use semantic controls.

Ensure:

buttons have labels
icon-only actions have accessible names
dialogs have focus behavior
form inputs have labels
status is not communicated by color alone
keyboard interaction works where relevant

Follow existing frontend framework conventions.


==================================================
39. EXISTING DESIGN SYSTEM
==================================================

Reuse existing:

Button
Card
Badge
Dialog
Drawer
Skeleton
Toast
Input
Tabs
Typography

where available.

Do not introduce a parallel component library without strong reason.


==================================================
40. VISUAL PRIORITY
==================================================

Product should feel like a food/meal app, not an optimization dashboard.

Primary:

meals
food
day
actions

Secondary:

scores
diagnostics
optimizer internals

Avoid dumping:

0.873 ranking score
1024 search states
candidate frontier

on ordinary UI.


==================================================
41. LOCALIZATION
==================================================

Use existing i18n architecture.

Do not scatter hard-coded strings.

At minimum new deterministic reason/status labels should support existing locale conventions.

AI explanations should use the current user/app locale.


==================================================
42. DETERMINISTIC EXPLANATION FIRST
==================================================

Before AI:

implement deterministic explanation from structured reason codes.

Example:

Reasons:
USES_SOON_EXPIRING_STOCK
MATCHES_PREFERRED_CUISINE
REQUIRES_SHOPPING

Deterministic Vietnamese presentation:

"Ưu tiên dùng thực phẩm sắp đến hạn."
"Phù hợp với khẩu vị của bạn."
"Cần mua thêm nguyên liệu."

Core UX must be complete with AI disabled.


==================================================
43. AI PRESENTATION LAYER
==================================================

AI may optionally turn structured facts into a natural explanation.

Architecture:

AUTHORITATIVE FACTS
      ↓
SAFE PRESENTATION FACTS
      ↓
AI
      ↓
OPTIONAL NATURAL LANGUAGE

AI output is presentation only.


==================================================
44. AI EXPLANATION INPUT
==================================================

Create a deliberately narrow input.

Conceptually:

{
  locale,
  recipeName,
  reasonCodes,
  knownInventoryFacts,
  knownShoppingFacts,
  knownBudgetFacts,
  nutritionCoverage,
  substitutionFacts
}

Do NOT send authority to change results.


==================================================
45. AI MUST NOT INVENT
==================================================

AI must not invent:

ingredients
shortages
prices
nutrition values
allergen safety
expiry
budget total
package sizes
shopping recommendations outside authoritative result

Prompt/contract must explicitly restrict it.

The UI must continue rendering authoritative structured values separately.


==================================================
46. AI FAILURE FALLBACK
==================================================

AI must be optional.

If:

timeout
provider failure
rate limit
malformed output

then:

show deterministic reason-code explanation.

AI outage must NOT break:

weekly planner
shopping list
budget
recipe detail


==================================================
47. AI OUTPUT VALIDATION
==================================================

If AI returns structured output:

validate schema.

Do not:

JSON.parse(...)
as SomeType

without validation.

If AI returns plain text:
treat it purely as untrusted presentation text.


==================================================
48. AI PROMPT INJECTION
==================================================

Recipe names/user content may be untrusted.

AI prompt should clearly separate:

system instructions
structured facts
untrusted text

Do not allow recipe/user text to grant AI tools/authority.

T06B AI should not have mutation tools.


==================================================
49. AI SIDE EFFECTS — FORBIDDEN
==================================================

AI must not directly:

swap meal
regenerate
update preference
mark cooked
change shopping list
update inventory
make payment

AI only produces presentation content in T06B.


==================================================
50. AI-GENERATED RECIPES
==================================================

AI-generated long-tail recipes are NOT required for T06B completion.

Treat them as OPTIONAL / DEFERRED unless:

- infrastructure already exists cleanly
- implementing it does not jeopardize core T06B scope
- there is sufficient budget/time

If implemented:
must obey T01 provenance/verification architecture.

If not implemented:
document:

AI-generated recipes deferred.

T06B can still be COMPLETE.


==================================================
51. AI COOKING WORDING
==================================================

Optional:

AI may improve wording of existing structured cooking instructions.

Do not let it change authoritative quantities or introduce unvalidated ingredients.

Deterministic original steps must remain available.


==================================================
52. AI COST CONTROL
==================================================

Do not call AI for every meal card render.

Prefer:

on-demand explanation
cached explanation
selected recipe detail

No AI call should occur during basic weekly list rendering unless explicitly justified.


==================================================
53. AI FEATURE DISABLE
==================================================

If current config supports it:

AI presentation should be disable-able.

Deterministic UI must still work.


==================================================
54. API CLIENT
==================================================

Create/extend one coherent frontend API client.

Do not scatter raw fetch calls through dozens of components.

Centralize:

request schemas
response validation if existing architecture uses it
error mapping
auth handling
revision handling


==================================================
55. SAFE SHARED TYPES
==================================================

Use T06A DTO/shared schemas where appropriate.

Do not import internal:

T04 beam state
T05 optimizer state
trusted context types

into frontend.


==================================================
56. FRONTEND MUST NOT CALCULATE AUTHORITATIVE TOTALS
==================================================

It may derive pure presentation values when safe.

But:

shopping total
budget gap
surplus
missing amount

must come from authoritative API if they affect product truth.

No hidden parallel optimizer in React.


==================================================
57. CURRENT PLAN RESTORATION TEST
==================================================

Add test:

generate plan
reload/open planner
→ user can return to current/recent plan according to chosen persistence strategy

If using client plan-ID persistence:
test invalid/missing/stale local reference.

If adding current-plan endpoint:
test authorization and newest/current semantics.


==================================================
58. WEEKLY PLAN TESTS
==================================================

At minimum:

A. render complete plan

B. partial plan

C. no-plan-without-proof

D. proven infeasible

E. planner truncated

F. meal details

G. reason labels

H. unresolved ingredient

I. nutrition unknown

J. loading/error


==================================================
59. SWAP TESTS
==================================================

At minimum:

valid swap
→ new revision shown

stale revision
→ refresh/recovery

swap infeasible
→ useful message
→ old plan retained

early-slot swap
→ response replaces authoritative downstream plan state


==================================================
60. REGENERATE TESTS
==================================================

Test:

regenerate success
new revision

revalidation-required
→ regenerate UX

duplicate click does not create uncontrolled duplicate requests


==================================================
61. SHOPPING TESTS
==================================================

At minimum:

known total

unknown-price items

over budget

budget unknown

no purchase option

purchase surplus

unknown waste risk

optimizer truncated

largest known cost drivers wording


==================================================
62. MONEY TEST
==================================================

Ensure formatting preserves:

exact minorAmount

Examples:

JPY large integer
USD if supported
zero
very large safe string value

Do not parse to unsafe Number unnecessarily.


==================================================
63. FEEDBACK TESTS
==================================================

Test:

like
dislike
cooked
skipped

API failure rolls back/reflects UI state correctly.

Cross-household security is backend responsibility but frontend must not attempt arbitrary household override.


==================================================
64. STALE UX TESTS
==================================================

Test T06A freshness behavior.

If plan requires revalidation:

frontend offers coherent action.

Do not leave raw 409.


==================================================
65. RATE LIMIT UX
==================================================

If 429:

show appropriate retry message.

Do not immediately automatically retry expensive generation in a loop.


==================================================
66. AI FALLBACK TESTS
==================================================

At minimum:

AI success
→ enhanced explanation

AI failure
→ deterministic explanation

AI malformed output
→ fallback

AI disabled
→ deterministic UI works

AI must not affect authoritative shopping/money display.


==================================================
67. AI HALLUCINATION IS NON-AUTHORITATIVE
==================================================

Test conceptually:

backend known total = ¥1000
2 unknown items

AI says:
"Your total is ¥1200"

UI authoritative budget area must still show:

Known total ¥1000
2 unknown-price items

Never copy AI prose into authoritative totals.


==================================================
68. E2E HAPPY PATH
==================================================

If browser E2E infrastructure exists, implement at least one end-to-end flow:

1. authenticated user
2. open planner
3. generate week
4. inspect meal
5. swap meal
6. receive new revision
7. open shopping
8. view budget state
9. give feedback
10. reload
11. recover current plan

Use mock/test backend according to repository conventions.


==================================================
69. E2E UNCERTAINTY PATH
==================================================

Add another E2E/integration scenario if practical:

plan has unknown-price shopping item

verify UI does not show false exact total.


==================================================
70. FRONTEND PERFORMANCE
==================================================

Avoid unnecessary full weekly-plan regeneration from render/effect loops.

Plan generation should happen only on explicit action or intentional orchestration.

Do not fire API repeatedly because of unstable dependencies.


==================================================
71. DATA FETCHING
==================================================

Follow current caching/query library conventions.

Invalidate/update:

plan
shopping
feedback

correctly after mutations.

Swap/regenerate should replace relevant cached revision atomically.


==================================================
72. SHOPPING AFTER PLAN CHANGE
==================================================

After swap/regenerate:

old shopping optimization may be stale.

Do not continue showing it as authoritative.

Invalidate/reload T05 result for new plan revision.


==================================================
73. PLAN REVISION IN UI
==================================================

Frontend should track plan revision.

Mutations must use current revision.

Do not hide revision semantics behind stale local assumptions.


==================================================
74. FEATURE FLAG
==================================================

T06A currently keeps new planner behind existing configuration/feature behavior.

Inspect it.

Do not accidentally make partially integrated planner the production default if rollout policy says otherwise.

T06B should obey current flag.


==================================================
75. LEGACY COEXISTENCE
==================================================

Legacy Week remains if T06A says so.

Do not delete legacy UI blindly.

If new planner is behind feature flag:

new flag OFF
→ legacy experience still works

new flag ON
→ new planner experience

Test/build both relevant states where practical.


==================================================
76. FRONTEND RECOVERY FROM PARTIAL T06
==================================================

A previous interrupted T06 attempt contained partial frontend work.

Audit any existing:

/planner
shopping UI
presentation mapping
frontend tests

Do not duplicate screens/routes.

Classify:

usable
incomplete
obsolete
conflicting

Repair rather than wholesale recreate when sensible.

Document what was reused.


==================================================
77. BACKEND CHANGE RULE
==================================================

T06B should primarily be frontend.

Small backend compatibility changes are allowed ONLY if absolutely necessary for product integration.

Examples potentially acceptable:

current-plan lookup endpoint
minor DTO field needed by UI
small compatible status exposure

If backend change is necessary:

- explain why T06A contract is insufficient
- keep it minimal
- preserve trust boundaries
- add backend tests
- isolate it in its own commit

Do NOT redesign T06A.


==================================================
78. T05/T06A FINDINGS NOT TO REWRITE NOW
==================================================

Known non-blocking backend concerns such as:

T05 option cap preselection quality
aggregate meal-planning rate-limit policy
advanced temporal package splitting
feedback concurrency refinements already deferred

belong to T07 unless they directly block T06B.

Do not turn T06B into backend hardening.


==================================================
79. SECURITY
==================================================

Frontend security expectations:

do not store secrets
do not expose server env
escape/safely render AI text
avoid dangerouslySetInnerHTML for AI output
do not trust URL plan ID without server authorization
do not send authoritative prices/snapshots
do not expose internal diagnostic objects unnecessarily

T07 will perform final review.


==================================================
80. AI TEXT RENDERING
==================================================

Treat AI text as untrusted text.

No raw HTML execution.

No Markdown HTML injection unless sanitized by existing trusted library/config.


==================================================
81. ERROR PRIVACY
==================================================

Do not display raw server:

SQL
stack
internal path
provider exception

Use safe mapped errors.


==================================================
82. OBSERVABILITY
==================================================

Use existing frontend telemetry/logging if available.

Useful events:

plan_generate_started/completed
swap
regenerate
shopping_opened
feedback
AI explanation fallback

Do not create a new analytics platform.


==================================================
83. CHECKPOINT DISCIPLINE
==================================================

T06B is still substantial.

Do NOT wait until the end to commit everything.

Recommended checkpoints:

B1:
frontend API client + planner base UI
→ COMMIT + PUSH

B2:
swap/regenerate/current-plan/stale UX
→ COMMIT + PUSH

B3:
shopping/budget UI + feedback
→ COMMIT + PUSH

B4:
AI presentation + fallback
→ COMMIT + PUSH

B5:
tests/E2E/docs
→ COMMIT + PUSH

Exact grouping may vary.

But do not leave hours of work uncommitted.


==================================================
84. UNTRACKED FILE RULE
==================================================

Before each checkpoint:

git status --short

Inspect all:

?? files

Commit every required:

component
hook
schema
test
style
route
translation
AI presentation source

Do not repeat the interrupted T06 failure where required new files existed only in an ephemeral workspace.


==================================================
85. VALIDATION
==================================================

Run repository-required validation.

At minimum:

pnpm test
pnpm lint
pnpm typecheck
pnpm build
pnpm check:migrations

Run frontend-specific:

tests
typecheck
build

If repository has browser E2E:
run relevant suite.

Also rerun focused T06A HTTP tests if backend compatibility changes occur.

Never claim PASS without running.


==================================================
86. BOTH FEATURE STATES
==================================================

If feature flag controls legacy/new planner and practical test infrastructure exists:

verify frontend build/critical flow with new planner enabled.

Ensure legacy code still compiles.


==================================================
87. FINAL SELF-REVIEW
==================================================

Before completion:

git diff c46330c...HEAD
git status --short
git log --oneline -20

Ask:

Does frontend recalculate authoritative shortages?

Does frontend calculate authoritative money totals?

Can frontend send fake prices?

Can frontend send fake meal plans?

Does swap leave stale shopping data visible?

Does swap/regenerate use revision?

Does 409 show raw technical error?

Can user recover existing plan after reload?

Does unknown price ever show as zero?

Does unknown nutrition show as zero?

Does truncated optimizer say "cheapest"?

Does purchase surplus say "waste" without evidence?

Can AI text alter authoritative facts?

Can AI failure break planner?

Does AI have side effects?

Did I build AI-generated recipes unnecessarily?

Did I modify T02–T05 algorithms?

Did I redesign T06A?

Did I touch PayOS?

Are required files untracked?

Fix violations before completion.


==================================================
88. PAYOS — STRICTLY PROTECTED
==================================================

Do NOT modify:

PayOS
billing
checkout
payment callbacks
payment webhooks
subscriptions
payment authorization

Shopping List is NOT checkout.

There must be no payment execution.


==================================================
89. DOCUMENTATION
==================================================

Update:

docs/ai/CURRENT_STATE.md
docs/ai/TASK_BOARD.md
docs/ai/HANDOFF.md

Create/update if useful:

docs/ai/FRONTEND_MEAL_PLANNER.md
docs/ai/AI_LAYER.md

Document:

frontend routes/screens
API usage
current-plan restoration
revision/stale behavior
shopping semantics
money display
unknown states
AI explanation
deterministic fallback
feature flags
legacy coexistence
E2E coverage
known limitations
T07 handoff


==================================================
90. TASK BOARD
==================================================

Successful final state:

T01 COMPLETE
T02 COMPLETE
T03 COMPLETE
T04 COMPLETE
T05 COMPLETE
T06A COMPLETE
T06B COMPLETE
T07 READY

Do not mark T07 READY unless T06B genuinely satisfies its acceptance criteria.


==================================================
91. T07 HANDOFF
==================================================

T07 must receive a precise map of the full system.

Include:

backend routes
frontend routes
feature flags
plan persistence
revision semantics
shopping integration
AI provider/interface
AI fallback
trusted boundaries
rate limits
legacy/new coexistence
known security concerns
known performance concerns
known backend limitations
test counts
E2E coverage
latest verified commit


==================================================
92. COMPLETION CRITERIA
==================================================

T06B is COMPLETE only when:

- frontend consumes T06A safe DTOs
- no authoritative backend logic is duplicated in frontend
- weekly planner screen works
- current/recent plan can be restored appropriately
- recipe detail works
- swap works
- regenerate works
- revision conflict is handled
- stale/revalidation UX is implemented
- downstream shopping is invalidated after plan mutation
- shopping UI works
- exact Money display is preserved
- unknown-price state is truthful
- budget within/over/unknown/not-configured states are distinct
- optimizer truncation is presented truthfully
- purchase surplus is not mislabeled as certain waste
- planner incomplete/truncation states are presented truthfully
- feedback actions work
- mark-cooked does not falsely claim inventory mutation
- mobile layout works
- accessibility basics are present
- loading/error/partial/stale states are implemented
- deterministic explanations work without AI
- AI explanation is optional
- AI output cannot alter authoritative facts
- AI failure has deterministic fallback
- AI text is safely rendered
- AI-generated recipes are either safely implemented or explicitly deferred
- legacy/new planner coexistence follows rollout policy
- no payment/PayOS behavior is added
- meaningful frontend tests pass
- E2E/integration path passes where infrastructure exists
- backend tests remain green
- lint passes
- typecheck passes
- build passes
- no required source files remain untracked
- coherent checkpoints are pushed
- docs match reality
- T06B is marked COMPLETE
- T07 is marked READY


==================================================
93. FINAL RESPONSE FORMAT
==================================================

Return exactly these sections:

## Repository assessment

Describe verified T06A baseline and existing partial frontend work.

## Frontend architecture

Describe:
routes
API client
state/data flow
shared DTO usage

## Weekly planner

Describe main plan experience.

## Current plan restoration

Explain how reload/new session retrieves or restores the current/recent plan.

## Swap / regenerate

Explain:
revision handling
stale conflicts
shopping invalidation

## Shopping / budget

Explain:
known money
unknown prices
budget states
purchase surplus
waste uncertainty
optimizer truncation

## Feedback

Describe user feedback actions and cooked semantics.

## Incomplete / stale UX

Describe T04/T05 uncertainty and revalidation presentation.

## AI presentation

Describe:
deterministic fallback
AI grounding
allowed responsibilities
forbidden responsibilities
failure behavior
safe rendering

## AI-generated recipes

State:
implemented safely
or
deferred

## Mobile / accessibility

Describe relevant UX work.

## Legacy compatibility

Describe feature flag and old/new planner coexistence.

## Backend compatibility changes

List any T06A changes made during T06B and justify each one.

If none:
state none.

## Tests

Report:
frontend tests
integration tests
E2E tests
AI fallback tests
stale/revision tests

## Verification

Report exact results for:

pnpm test
pnpm lint
pnpm typecheck
pnpm build
pnpm check:migrations

plus frontend/E2E commands.

## Scope check

Explicitly state:

No T02–T05 core algorithm was reimplemented.
No T06A trust boundary was weakened.
Frontend does not calculate authoritative money/shortage results.
AI is not authoritative.
Plan generation does not mutate real inventory.
Shopping UI does not perform an actual purchase.

## Protected areas

Explicitly state:

PayOS/payment code untouched.

## Git

Report:

branch
T06A base SHA
T06B commit SHA(s)
push status
working tree status
untracked file status

## Remaining limitations

List genuine non-blocking limitations for T07.

## T07 handoff

Give the exact first recommended T07 action.

## Final readiness

State exactly one:

T06B COMPLETE — T07 READY

or:

T06B NOT READY

If not ready, state exact blockers.


==================================================
FINAL DIRECTIVE
==================================================

T06B is where users finally experience the value created by T01–T06A.

But presentation must never corrupt truth.

The core principle is:

BACKEND KNOWS
what is authoritative.

FRONTEND SHOWS
what the backend knows.

AI EXPLAINS
what the backend already knows.

Maintain these distinctions:

known
!=
unknown

best known
!=
proven optimal

purchase surplus
!=
waste

planned consumption
!=
actual consumption

AI explanation
!=
domain fact

UI intent
!=
trusted backend state

Optimize for:

mobile usability
+ truthful presentation
+ safe API consumption
+ responsive interaction
+ deterministic fallback
+ grounded AI
+ exact money/quantity handling
+ graceful uncertainty
+ strong test coverage
+ recoverable checkpoints

Do not optimize for amount of code.

Do not redesign the backend.

Do not let AI become authoritative.

Do not touch PayOS.

Do not start T07.