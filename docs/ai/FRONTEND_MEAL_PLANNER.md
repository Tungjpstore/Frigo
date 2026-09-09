# T06B frontend meal planner

## Scope and evidence

This guide describes the opt-in implementation under `src/web/features/planner/`
and its existing T06A/T06B HTTP contract. It continues the preserved backend
`1f7802f`, frontend `08d90fa` and interruption handoff `c5f8623`; it is not a new
planner architecture. `T06B_WIP_HANDOFF.md` remains historical recovery evidence.

Use [T06B_VERIFICATION.md](T06B_VERIFICATION.md) for the coordinating task's final
verified SHA, commands, counts, browser evidence and unresolved gates. Source
descriptions and the acceptance checklist below are not independent PASS claims.
Read [API_INTEGRATION.md](API_INTEGRATION.md), [AI_LAYER.md](AI_LAYER.md) and ADR-018
in [DECISIONS.md](DECISIONS.md) for the authoritative integration decisions.

## Routes, rollout and legacy coexistence

`src/web/App.tsx` lazy-loads `PlannerPage` inside the existing authenticated app
shell and session boundary:

| Route | Purpose |
| --- | --- |
| `/planner` | Discover the current private plan; replace navigation with its detail URL, or show the empty/generation entry state |
| `/planner/new` | Explicit date, horizon, servings, meal-slot and ingredient-mode setup |
| `/planner/:planId` | Grouped meal cards, unplanned slots, diagnostics and regenerate confirmation |
| `/planner/:planId/meal/:slotId` | Selected meal detail, swap choices, feedback and optional explanation |
| `/planner/:planId/shopping` | Explicit revision-bound shopping request, budget and local checklist |

The feature gates are independent and require the literal string `true`:

- `VITE_MEAL_PLANNER_ENABLED`: build-time UI gate in `feature.ts`. With it off,
  every planner route redirects to `/week`. With it on, the existing bottom-nav
  Week entry points to `/planner`.
- `MEAL_PLANNER_ENABLED`: server API gate. An authenticated registered request
  with this flag off receives 404 `MEAL_PLANNER_DISABLED`; enabling the frontend
  cannot bypass it.
- `MEAL_PLANNER_AI_ENABLED`: server-only, optional explanation ordering. The
  planner works without this flag or an AI provider.

Legacy `/week`, `/recipes`, `/shopping`, cooking commands and Week persistence/
dual-write behavior remain separate. New DTOs are not cast into legacy Week
objects. The planner shell links to legacy Week, and `AppLayout` hides the normal
bottom navigation on planner routes. This is not a production default cutover;
the release operator must apply the existing schema through migration 0022 before
enabling the backend. No deployment or remote migration is implied.

## Component and data architecture

```text
explicit frontend scheduling/action intent
  -> mealPlanningApi -> existing cookie/owner-fenced HTTP transport
  -> authorized T06A service -> server-owned T02–T05 contexts/results
  -> strict safe DTO -> scoped TanStack Query/local presentation state
  -> React components -> optional server-grounded reason ordering
```

| Module | Responsibility |
| --- | --- |
| `pages/PlannerPage.tsx` | Route dispatch, current-plan redirect, loading/empty/error states, freshness banner and revision-keyed detail/shopping mounts |
| `features/planner/PlannerShell.tsx` | Existing visual tokens, vi/en selector, plan navigation, safe errors and freshness notices |
| `PlannerSetup.tsx`, `intent.ts` | Form state and schema-validated scheduling intent; no candidate generation |
| `PlannerWeek.tsx` | Day/meal presentation, incomplete results, diagnostic disclosure and explicit full regeneration |
| `PlannerMeal.tsx` | DTO-backed detail, native swap dialog, feedback receipts and explanation presentation |
| `PlannerShopping.tsx` | Currency/budget intent and revision-bound result presentation; `ShoppingResult` renders returned facts |
| `usePlanner.ts` | Plan reads, one in-flight action gate, retry-key retention, session acceptance guard, authoritative cache replacement and conflict recovery |
| `services/meal-planning.ts` | One typed, request/response-validating planner API client |
| `copy.ts`, `presentation.ts` | Localized UI/reason/status/error copy, exact money/quantity display and budget-input parsing |

Reuse React Router, TanStack Query, existing `Card`, `Button`, `ConfirmDialog`,
Tailwind classes and Frigo typography/colors. There is no browser optimizer,
inventory allocator, recipe-feasibility evaluator or AI mutation tool.

## API client and trust boundary

The client imports frontend-safe Zod leaves
`packages/domain/src/meal-planning-api.ts`, `meal-shopping-api.ts` and
`meal-planning-presentation.ts`, not T04/T05 execution state. It validates inputs
before sending and validates every response from `fetchJson<unknown>` before use.
Requests use `cache: 'no-store'`; server responses also use `Cache-Control:
no-store`. The HTTP prefix is `/api/v1/meal-planning/plans`.

| Client action | HTTP suffix / payload |
| --- | --- |
| `generate` | POST root; scheduling intent and `Idempotency-Key` |
| `current` | GET `/current`; returns `{plan: MealPlanDto | null}` |
| `get` | GET `/:id` |
| `alternatives` | GET `/:id/alternatives?revision=N` |
| `regenerate` | POST `/:id/regenerate`; `{revision,intent?}` |
| `swap` | POST `/:id/swap`; `{revision,slotId,replacement}` |
| `shopping` | POST `/:id/shopping`; `{revision,currency,budget?}` |
| `feedback` | POST `/:id/feedback`; `{revision,slotId,type}` and `Idempotency-Key` |
| `explanation` | POST `/:id/explanation`; `{revision,slotId,locale}` |

ID reads validate the response plan ID. Swap/regenerate require the same ID and a
strictly newer response revision; the server advances it by one. Shopping,
alternatives and explanations must match the requested revision; feedback also
matches slot and action type. A response is not accepted merely because it is JSON.

Existing `http.ts` supplies `credentials: 'include'` and owner-expectation headers,
which callers cannot override. It fences responses before/after decoding against
the captured private-session generation, user, household and guest mode. Local
identity is an expectation, never server authorization. Registered membership,
creator-private ownership, CSRF, limits and strict request schemas remain enforced
by the Worker. URL knowledge does not confer access. No request carries trusted
prices, inventory, shortages, meal contents, reviewer evidence or AI-authored facts.

## Current-plan restoration and session isolation

`/planner` queries `/current`, not localStorage or a user-entered UUID. The server
selects the authenticated creator's most recently saved plan in the current
household, ordered by `updated_at DESC, id DESC`. Regenerating an older plan can
therefore make it current. Other household members' private plans are excluded.
An empty result is `{plan:null}`; revocation remains an access error, not emptiness.

The current lookup returns the same safe plan/freshness projection used by detail
reads. `PlannerPage` redirects to `/planner/:id`; a direct URL or refresh fetches
that plan. Missing/foreign plans fail closed with an unavailable message and a
route back to discovery. There is no persisted local active-plan reference to
repair, no plan-list UI and no revision archive.

All planner query keys include current user and household. The existing global
query client clears on private-session reset; app routes remount when owner identity
changes, and `SessionBoundary` verifies the identity before showing private routes.
`usePlanner.perform` additionally rejects late action results if its captured
session changed or its owner component unmounted. The locale preference is the
only planner-specific localStorage value, not plan content.

The hook resets busy/error/recovery state and retained retry keys on owner change
or private-session reset. Each action owns a unique gate token, so completion of an
obsolete session's request cannot unlock a newer session's active action.

## Revisions, in-flight work and retries

Plan reads use `retry:false` and `staleTime:0`; generating, swapping, regenerating,
shopping, feedback and explaining require explicit user actions. `perform` uses a
synchronous ref gate as well as visible busy state, preventing rapid duplicate
actions before React renders the disabled controls. Exact generation/feedback
intent retains an idempotency key for retry during that hook's lifetime. Confirmed
creation retires its key so another deliberate new plan with identical settings
is not a replay of the earlier plan. Failed/ambiguous creation retains its key.
Keys are not a persisted offline command queue or a cross-reload deduplication promise.

On a successful plan mutation, `replacePlan` cancels in-flight detail/current
queries before inserting the complete authoritative response into both caches.
It removes that plan's shopping and alternative cache families. This is full-plan
replacement, never an optimistic edit of one meal card. Query cancellation protects
cache delivery; the client does not promise that an already-started fetch is
physically aborted. Regression evidence must cover an old GET resolving later.

Meal-detail mounts are keyed by plan/revision/slot; shopping mounts by plan/revision.
Alternative keys include slot and revision. Shopping keys also include revision,
currency, budget text and hard/soft mode. A returned shopping result is only shown
for its own revision while the plan is fresh and no action/error is active. Changing
revision discards view-local receipts, explanations, budget form and checklist
state; preparing shopping for the new revision is an explicit action, not an
automatic optimization loop.

On a 409 action failure, the hook removes shopping/alternatives and refetches the
selected plan; it does not blindly retry the mutation. A successful refresh uses
the same full-plan cache replacement and shows recovery copy. Failed refetches do
not claim success merely because old cached data exists. `PLAN_REVALIDATION_REQUIRED`
and `PLAN_REVISION_CONFLICT` have localized
messages, not raw `409 Conflict`. Failed/infeasible swaps and ordinary network
failures do not replace the old plan. A lost mutation response can still mean the
server committed: refresh authoritative state before retrying, rather than treating
the displayed old revision as proof of server rollback.

## Weekly plan and meal detail

Setup defaults to tomorrow, seven days, two servings, dinner and shopping allowed.
The UI offers 1–14 days, 1–20 servings, breakfast/lunch/dinner selection, inventory-
only versus shopping-allowed mode and an optional hard cooking-time limit. It
expands dates/slots only and submits the device's current UTC offset as scheduling
intent. The server checks the horizon and preserves its stored hard policies.
No timezone/DST inference, safety-policy editor or budget-driven replanning is
implemented in this form.

The week groups the requested dates into mobile-first lists. Cards show returned
meal title, slot/time, servings, known cook time, projected ingredient state and a
deterministic reason. Unresolved required quantities are quantity-review states,
not invented shopping amounts. Optional shortages do not turn a meal into failure.
Raw score/search-state internals are not the primary UI.

`status` and `conclusion` remain separate: a valid partial prefix can coexist with
an inability to complete. Complete, partial, proven-infeasible, search-limited and
data-incomplete results have localized labels. `no_plan_found_without_proof` never
becomes a claim that no valid plan exists. Unplanned slots stay visible; truncation
is disclosed without saying the result is globally optimal. Rejected-alternative
diagnostics are explicitly not failures of selected meals.

Detail uses the selected meal DTO, not legacy static recipe demand. It shows exact
required/projected-covered/missing quantities, optionality, unresolved quantities,
stored instructions and reasons. Absent instructions remain absent. The current
safe DTO does not expose nutrient values or full substitution traces: nutrition
is explicitly unavailable for display, and no macros or replacement quantities
are inferred. `safetyAssessment` is not a blanket allergy certificate.

### Swap and regenerate

Opening swap reads at most 50 catalog recipe IDs/titles. The current recipe is
excluded from the displayed choices; a bounded catalog is disclosed. These are
choices to try, **not prevalidated feasible/allergy-safe alternatives**. Selecting
one posts recipe intent with the current revision and slot. The server resolves
the source version, validates a lock and replans the entire sequence against fresh
trusted context; other unlocked meals can change. `SWAP_NOT_FEASIBLE` leaves the
persisted revision unchanged and displays a useful error.

An alternatives-read 409 has an explicit recovery action that refreshes the full
authoritative plan, rather than repeating an old-revision alternatives query.
The revision-keyed detail remount closes obsolete choices; reopening requests the
latest revision. Native dialog focus wraps at the first/last enabled action,
Escape closes it when idle, and dismissal returns focus to the trigger.

Regenerate uses the shared confirmation dialog and posts the current revision
without new intent. The server preserves scheduling intent and existing swap locks,
reloads trusted inputs and returns a complete new revision, including valid partial
or incomplete outcomes. The UI does not silently relax constraints or remove costly
meals. For `planning_time_elapsed`, swap and same-horizon regeneration are disabled:
the user creates an explicit future plan while the historical plan remains stored.
There is no separate “regenerate remaining meals” or “regenerate within budget” UI.

## Freshness, errors and rate limits

Freshness is a server as-of inspection, not a stock reservation or a guarantee that
later cooking remains safe. Inventory, preferences, catalog, history and elapsed
planning time have distinct localized reasons. Stale plans remain inspectable;
shopping is disabled/hidden until an authoritative fresh revision is available.
The banner links to new-plan setup; an unelapsed plan can also be regenerated from
its week screen. Historical plans explain why a new future horizon is needed.

`plannerErrorMessage` maps known envelope codes, auth/access/not-found/conflict,
validation, offline, 429 and generic server failures. SQL, stack traces, provider
exceptions and arbitrary response text never become UI copy. Read/alternative
errors offer manual retry; mutations are explicitly retried by the user. There is
no infinite automatic 429/planning retry and no offline mutation replay.

The existing backend limiter is per account and route path: expensive planning,
shopping and explanation actions use 10/minute; reads and feedback use 60/minute.
The UI shows retry-later wording rather than an exact `Retry-After` countdown.
These best-effort KV/isolate limits are not an aggregate cross-plan quota; final
abuse/performance review remains T07.

## Shopping, budget and exact display

The shopping form defaults to VND and offers JPY/USD/EUR, optional budget and
hard/soft policy. It posts intent to the server with the current plan revision.
Blank budget means not configured; an explicit zero is valid. No authoritative
shopping totals, deficits, unit conversions, budget gaps or purchase surplus are
recomputed in React.

- `formatMoney` validates `{currency,minorAmount}`, uses BigInt for whole/fractional
  display parts and uses `Intl.NumberFormat` for locale symbols/grouping. JPY/VND
  have zero minor digits; USD/EUR have two. Large output strings remain exact, even
  above `Number.MAX_SAFE_INTEGER`; invalid/null money displays unknown, not zero.
- Budget parsing accepts unsigned ungrouped decimal intent, with dot in English
  and dot/comma in Vietnamese. It rejects excess decimals, negative/grouped values,
  overflow and implicit rounding; budgets must fit the existing safe-integer minor
  input bound. This parsing is not pricing or budget-feasibility calculation.
- `formatQuantity` preserves the exact returned decimal/scientific-notation string
  and localizes the unit name only. It performs no unit conversion or rounding.

The cost panel says **Total with complete pricing** only when cost status is known,
`totalCost` is non-null and shopping completeness is complete. Otherwise known
money is labeled **Known cost** with the count of requirements lacking complete
prices. An entirely unknown result shows price/option-unavailable copy, not a
misleading zero total. For example, known ¥4,820 plus two unknown requirements
must remain a known subtotal with two unknowns, never an exact final total.

Budget labels preserve `within_budget`, `over_budget`, `unknown` and
`not_configured`. An over-budget amount comes from `selectedKnownGap`, not a local
subtraction. Unknown prices do not automatically override a server-proven over-
budget lower bound, nor can a best-known expensive option prove infeasibility.
**Largest known costs** compares only the returned known-price contributors.

Lines display required quantities, optional/unresolved state, returned package
counts/contents/costs, projected surplus and source meal dates. Missing suitable
purchase options use their returned unresolved reason rather than becoming free.
Optional items explicitly say they are excluded from suggested purchases/budget,
not that an optional missing price makes required shopping fail. The default backend has no
reviewed retail catalog; the UI states that final cost cannot be confirmed rather
than importing legacy benchmark or OCR prices. Shopping completeness and optimizer
incompleteness/truncation are disclosed independently from meal-plan feasibility.

Waste presentation distinguishes dated risk, no dated risk within the horizon and
unknown coverage. Purchase surplus is a projected remainder, not certain waste;
the frontend does not infer disposal or shelf life. Nonexhaustive shopping says
**Best option Frigo found**, not “cheapest possible.” Local checkboxes are reminders
for the current view only: no purchase, payment, inventory import or persisted
shopping command is issued.

## Feedback

Like, dislike, cooked and skipped are explicit revision/slot-bound API actions.
`swapped` feedback is offered after a successful local swap through route state
bound to that revision/slot; the backend validates its actual last-swap metadata.
The client does not send arbitrary household/user or recipe feedback identities.

Successful receipts disable that action for the current detail view and trigger a
plan freshness read. Failed requests do not create a success receipt. Feedback
history can make the plan stale; cooked annotation is not actual cooked history.
The response guarantees `inventoryMutated:false`, and the UI explicitly says no
ingredients were deducted and no like was implied. Receipts are not reloaded from
an annotation-list endpoint; persistent feedback-history UX is deferred.

## Optional AI explanation and safe rendering

Deterministic localized reasons are already visible before any AI request. Only
the detail explanation action contacts the explanation endpoint. The server takes
reason IDs from the persisted selected meal; the provider receives only locale and
the allowed IDs, not recipe/user text, identities, quantities, prices or stock.

The existing native Workers AI transport may reorder the **entire** deduplicated
reason set. Strict validation rejects invented/dropped/duplicate facts, extra
fields, prose, HTML and malformed/oversized output. It cannot choose meals,
calculate values, rewrite instructions, alter shopping or call mutation tools.
Membership and revision are rechecked after provider latency.

One call has a 256-output-token cap and 2500 ms response deadline, with no retries
or fan-out. Disabled AI, no facts, mock mode, missing provider, provider failure,
timeout and invalid/ungrounded output return deterministic reasons. Late output
is ignored; cancellation of native provider computation is not guaranteed.
An HTTP failure likewise leaves the detail's deterministic explanation usable.
AI/fallback provenance is visible but never replaces authoritative cost/quantity
or freshness UI. React renders local templates and recipe text as escaped text;
there is no `dangerouslySetInnerHTML` model-output path.

**AI-generated recipes and instruction rewriting are deferred beyond T06B.**

## Localization, mobile and accessibility

The planner supports Vietnamese and English through `usePlannerLocale` and the
existing localized-field/table conventions, without a new i18n dependency. The
default is Vietnamese; `frigo_planner_locale` stores this optional presentation
preference. `copy.ts` owns component copy and `presentation.ts` owns reason/status/
error labels and exact-value helpers. The root has `lang={locale}`; explanation
requests use the selected locale. Static canonical names are display labels only;
unknown ingredient IDs use a fallback name rather than inventing a translation.
Recipe titles/instructions remain the server-supplied catalog language.

The app shell is phone-first with wider tablet/desktop bounds. Week/ingredient/
shopping content is a card/list, not a forced horizontal calendar. Controls have
labels, touch-friendly minimum heights and text states rather than color alone.
Loading/success/freshness use status semantics and errors use alerts. Swap uses a
labeled native modal with Escape/cancel handling and focus return; dismissal is
blocked during a mutation. Regenerate reuses the labeled, keyboard-handled shared
confirmation dialog. These implementation choices do not replace browser checks:
375px/390px, vi/en, long text, focus entry/return, keyboard actions and overflow
evidence belong in `T06B_VERIFICATION.md`.

## Intentional limitations and follow-up boundaries

- No plan history browser, revision archive, annotation-list restoration or durable
  checklist; current discovery is private latest-saved lookup, not shared history.
- No real cooking/stock acceptance, purchase execution, payment, catalog authoring
  or reviewed-price provisioning. Hard safety policies without reviewed evidence
  fail closed. Legacy free-form Week settings are not silently imported into T03.
- Fixed-offset scheduling has no IANA/DST adjustment, per-day slot editor, remaining-
  horizon regeneration, budget-driven meal replacement or safe leftover scheduler.
- Alternatives are a capped unranked recipe catalog, not eligibility results or a
  family-variant browser. Server validation is mandatory after selection.
- The DTO omits nutrient values and detailed substitution traces; the detail shows
  unknown nutrition instead of borrowing legacy values. It currently shows cook
  time rather than a synthesized prep-plus-cook total.
- Locale covers the planner, not a whole-app translation rollout. The language
  selector identifies itself as “Language”; shared auth/session chrome and catalog
  content may remain Vietnamese. No Japanese planner UI is claimed.
- Source freshness is as-of, idempotency keys are view-lifetime, and AI timeout is
  not provider cancellation. Aggregate quotas, advanced package preselection,
  temporal package splitting and broader production security/performance are T07,
  not permission to change T02–T05 during frontend completion.

## Acceptance checklist and verification handoff

The detailed source of acceptance is
[tasks/T06B-frontend-user-packet.md](tasks/T06B-frontend-user-packet.md), section 92,
plus the continuation mandate. The coordinating task must close these evidence
groups in `T06B_VERIFICATION.md` before changing readiness in state/board/handoff:

- [ ] Safe DTO/client contracts, current-plan/no-plan/foreign-plan restoration,
  refresh/new-session behavior and no prior-owner cache leakage.
- [ ] Weekly loading/complete/partial/proven-infeasible/no-proof/truncated states,
  selected meal open/close, meaningful reason labels, optional/missing/unresolved
  quantities and unknown nutrition; no raw important enums.
- [ ] Swap success/infeasibility/network failure/close, full revision replacement,
  regenerate success/loading/duplicate protection, old plan preserved on failure.
- [ ] Revision/source conflicts and helpful recovery; old in-flight GET cannot
  overwrite mutation success; old shopping cannot become authoritative for a new
  revision; prior alternatives/shopping are invalidated after mutations.
- [ ] Known and unknown cost, JPY/zero/large exact money, all four budget states,
  no purchase option, surplus/unknown waste, partial/truncated optimizer and
  “Largest known costs” semantics in rendered UI.
- [ ] Like/dislike/cooked/skipped/swapped and API failure; cooked never claims a
  stock mutation and shopping checkmarks never perform purchases.
- [ ] Grounded AI success, disabled/provider failure/timeout/malformed fallback,
  safe rendering, deterministic usability and explicit generated-recipe deferral.
- [ ] Repeatable authenticated browser happy/uncertainty/stale flows, reload
  restoration, 375px/390px vi/en views and keyboard/dialog/accessibility basics.
- [ ] Both feature states preserve legacy coexistence; 429 has useful wording and
  no automatic expensive retry loop; protected payment and trust boundaries hold.
- [ ] Meaningful client/presentation/component/reason/cache tests, separate real
  Worker/API tests and browser evidence; record exact counts without double-counting
  overlapping focused runs. `tests/e2e/planner-preview.test.mjs` is HTTP integration,
  not browser-rendering proof. See [T06B_E2E.md](T06B_E2E.md) for isolated fixtures.
- [ ] Final-tree `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build` and
  `pnpm check:migrations`; any applicable local schema/Worker/frontend/browser gates,
  actual failures/corrections and exact final verified SHA are recorded.
- [ ] Required files tracked, coherent checkpoints pushed, working tree clean;
  guide, CURRENT_STATE, TASK_BOARD and HANDOFF agree. Only then mark T06B complete
  and T07 ready. Do not reuse historical T06A/WIP PASS counts.

Architecture review invariants: frontend sends intent and formats server facts;
server alone computes shortages, totals, feasibility, safety and optimizer proof;
AI is non-authoritative presentation; planned consumption is not actual stock
mutation; shopping is not checkout. No T02–T05 core reimplementation, T06A trust
relaxation or PayOS/payment change belongs in this continuation.
