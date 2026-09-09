# T07 H5 — Frontend, AI, flags and legacy audit

**Status: completed scoped audit; T07 remains in progress.** This is H5 evidence,
not deployment authorization. The initial scoped contribution did not start a
browser; the parent's final frozen-source matrix is recorded below and in
`T07_VERIFICATION.md`.

## Continuation topology

- Original T07 branch: `hoplite/lipara-d81160ee`
- Continuation checkpoint: `006742bc179d58aae53106c88aff8a2667dbd1ca`
- Writable continuation branch: `hoplite/prokonnesos-74e71894`

This topology is intentional because of the Hoplite publisher binding, not a
repository architecture issue. This H5 contribution neither switches branches nor
commits/publishes changes.

## Scope and sources inspected

Read the mandatory protocol and T07 packet/WIP/baseline, plus
`FRONTEND_MEAL_PLANNER.md`, `AI_LAYER.md`, and `T06B_E2E.md`. Inspected
`App.tsx`, `feature.ts`, `usePlanner.ts`, planner page/components/copy/presentation,
the cookie/owner-fenced transport and private-session/query-key helpers; the
planner route/service and explanation transport; shared DTO schemas; and their
existing mounted/client/HTTP tests.

No PayOS, payment, billing, checkout, authentication, production infrastructure,
legacy Week persistence, database schema, migration, or core planner/optimizer
change was made.

## Reproduced findings and minimal fixes

### High, fixed — private plan could remain visible across an in-place session switch

The new mounted route test loaded account A's plan, called the same private-session
reset sequence used by logout/login, then installed account B. Before the fix, the
already-mounted `PlannerPage` continued to render `Dinner revision 1` for account
A after the switch. Its idle reset setters were no-ops, so the hook did not reliably
rerender and recompute its owner-scoped query key after the query cache cleared.

`usePlanner` now increments an internal session epoch on every private-session
reset. That forces the hook to evaluate the current owner key; query caches remain
owner+household scoped and reset clears their data. The regression proves account
A's meal does not flash before account B's plan loads.

### Medium, fixed — failed 409 recovery hid the last accepted plan; successful recovery retained a stale error

Mounted route reproduction: from a loaded plan, regenerate returned 409 and the
follow-up latest-plan read returned either 503 or malformed JSON. The previous
`query.refetch()` marked the route query as errored, causing `PlannerPage` to
replace its safe cached revision with the generic read-error page. It also left the
initial conflict error rendered after a successful latest-plan replacement.

Conflict recovery now performs one direct, validated `mealPlanningApi.get(planId)`
without changing the existing query's success state. It still removes
revision-derived shopping/alternatives first. A successful replacement clears the
obsolete conflict error and announces the fresh revision; an unavailable or
malformed recovery retains the conflict error and last accepted plan without an
automatic retry.

## Frontend and XSS audit

- `/planner` current-plan discovery is server-backed; no plan ID/content is restored
  from local storage. Direct IDs are Zod-validated before transport and returned
  plan IDs/revisions are validated before cache acceptance.
- The planner's TanStack keys embed user and household; `replacePlan` cancels detail
  and current reads, writes only the accepted full response, then removes
  revision-derived shopping/alternatives. New mounted tests cover late old GET,
  same-session navigation shopping → regenerate, session A → B, 409 success, and
  unavailable/malformed 409 recovery.
- No `dangerouslySetInnerHTML`, `innerHTML`, `insertAdjacentHTML`, DOM parser or
  document-write use appears in planner page/components/client/AI presentation
  paths. Planner content (catalog/imported titles and steps) is rendered through
  React text nodes. Existing `planner-ui.test.tsx` renders malicious title and
  instruction fixtures and verifies markup is escaped. AI replies contain template
  IDs only; the UI renders local reason labels, not provider prose.
- Static keyboard review: setup/shopping fields have associated labels; status/error
  states use `role=status`/`role=alert`; the native swap dialog opens modally,
  handles Escape, focus restoration and Tab/Shift+Tab wrap; regeneration's shared
  confirmation dialog has `alertdialog`, labelled/described-by controls and a focus
  trap. The parent should still verify assistive-technology/native-dialog semantics,
  visible focus, touch targets and overflow across the requested desktop/375/390
  locale matrix in the managed browser.

## AI trust and failure audit

- Only server-grounded reason IDs and locale reach the optional transport. The
  strict output object must contain every ID exactly once; missing/invented IDs are
  `ungrounded_output`, malformed/extra-field/duplicate output is `invalid_output`.
  No factual prose, HTML or trusted quantities/prices/inventory crosses the client
  boundary.
- New tests accept a three-ID reordering and reject missing, extra and duplicate IDs;
  also cover a simulated provider 429, network failure and malformed output. Each
  failure makes one attempt and returns local deterministic IDs without leaking
  provider error detail.
- The native path uses only the test-provided Workers AI binding and does not invoke
  global `fetch` or an external/provider fallback. Its 2,500 ms Promise race bounds
  the response. The binding interface carries no abort signal, so a timeout does
  **not** prove cancellation of already-started native computation; late output is
  ignored. This remains an accepted implementation limitation, not a request to add
  a speculative cancellation layer.

## Flags and legacy coexistence

- Frontend `VITE_MEAL_PLANNER_ENABLED` is enabled only by the literal string
`true`; new tests prove missing, empty, `false`, `TRUE`, and `enabled` values are
off. The missing case unsets the environment variable rather than treating it as
an empty string. Literal `true` enables planner routing. `App.tsx` retains all legacy `/week`
routes unconditionally and uses the flag only to select planner versus `/week` at
planner paths; the historical T07 baseline `pnpm typecheck` passed both route
surfaces together.
- Backend `MEAL_PLANNER_ENABLED` tests execute `GET /current` through the actual
route with missing/empty/`false`/invalid values (all 404
`MEAL_PLANNER_DISABLED`) and literal `true` (200 `{plan:null}`).
- Backend `MEAL_PLANNER_AI_ENABLED` tests generate a local synthetic plan and call
the actual explanation route: missing/empty/`false`/invalid values return the
no-call deterministic `disabled` result; literal `true` makes exactly one mock
ordering call. No provider/live network call or production flag change occurred.

## Verification

Initial new-test execution exposed **4 failures / 21 tests**:

```sh
pnpm exec vitest run tests/unit/t07-planner-ui.test.tsx tests/unit/t07-ai.test.ts
```

Three failures reproduced the two source findings above (one session leak and two
409 recovery variations). The fourth was a test expectation correction: duplicate
AI IDs are rejected by the strict selection schema as `invalid_output`, rather than
`ungrounded_output`; no production behavior changed for that classification.

After the fixes and completed flag matrix, executed:

```sh
pnpm exec vitest run tests/unit/t07-ai.test.ts tests/unit/t07-planner-ui.test.tsx tests/unit/planner-hook.test.tsx tests/unit/meal-planning-explanation.test.ts
pnpm exec eslint src/web/features/planner/usePlanner.ts tests/unit/t07-planner-ui.test.tsx tests/unit/t07-ai.test.ts
git diff --check -- src/web/features/planner/usePlanner.ts tests/unit/t07-planner-ui.test.tsx tests/unit/t07-ai.test.ts
```

At this H5 checkpoint, the final focused command passed
**93 tests / 4 files** (new H5: 27 tests / 2 files; existing mounted planner: 48;
existing explanation unit: 18; categories overlap only as listed). Targeted ESLint
and whitespace checks passed. Expected test-only `kv-unbound` rate-limiter warnings
appeared in literal-true route cases; all assertions passed. No full suite, browser
or final T07 gate was run here, per scope. The parent must rerun this focused command
after merging concurrent H1–H4/H6 changes.

## Parent browser verification and final closure

Parent pre-freeze browser verification: the existing `happy('en')` replay at
375×812 passed **30 named assertions** against real Worker/SQLite after the fixes,
including swap, shopping, budget uncertainty, all feedback, AI fallback,
regenerate and stale recovery. The replay viewport guard now also explicitly
allows 1280 for the requested desktop matrix; no behavior assertion was removed.
This initial check is not the final frozen-source browser matrix.

`tests/e2e/t07-planner-browser.commands.json` extends the existing replay to
en/vi at 375×812, 390×844 and 1280×900 (264 named assertions / 36 phase executions
when all pass). Both replay command files wait 61 real seconds before conflict
phases because happy-path actions now share the H2 account budget; they do not
disable or reset the limiter between those actions. Final execution on frozen
`f9d2ff871da155ba7f1aaedd3112a5ed6ea8d2c0` passed **264/264 assertions**, with
`browser_errors: []` after every combination. Exact commands and limitations are
in `T07_VERIFICATION.md`; mounted A→B is not a claimed real second-user browser login.

The native AI timeout-versus-cancellation limitation remains documented; no live
provider or production rollout evidence is claimed. Failed/malformed 409 recovery
and session A→B are mounted regressions; actual browser phases are listed exactly
in the final receipt rather than overstating their scope.
