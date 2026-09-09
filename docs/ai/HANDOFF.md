# Frigo AI Handoff

## T05 preflight checkpoint — 2026-09-09

T05 is authorized and IN PROGRESS on dedicated branch `hoplite/datala-8b986478`.
Clean baseline: `ebd538b4a57c2af85ad28a34c54f762093bc2403`, whose parent is the
latest T04 hardening `d7dff8f5b986c141ddddb464e86524a3a367392a`. All dependency
statuses agree; the T04 handoff below is current historical evidence, not stale
implementation. Current configured repository is `ars-vn/Frigo`; user-supplied
`tun-vn/Frigo` redirects there. No remote or dependency history changed.

Next: implement T05 after auditing legacy shopping/price/package infrastructure.
Use per-slot T04 deficits exactly once; never replan, mutate inventory or cut over
legacy runtime. The older packet's feedback loop is superseded by this task's
explicit no-replanning authorization. New checks/results will replace this checkpoint.

## Current Task
T04 — Weekly Meal Planner

## Task Status
**T04 COMPLETE — T05 READY**. T05 has not started; separate authorization required.

T04 is temporarily stacked on `hoplite/stagiros-728cc726` because Hoplite could not
allocate a dependent branch. The user authorized new commits strictly after immutable
T03 `3592de9832a55a06d4af6fa31491c8f3c0321262`; pre-edit HEAD matched and the tree
was clean. No T01–T03 amendment, squash, rebase, rewrite or merge to main occurred.
The topology limitation changes neither architecture nor scope. Keep these commits
separable for any later authorized cherry-pick.

## Dependency Baseline
Immutable T03 checkpoint: `3592de9832a55a06d4af6fa31491c8f3c0321262`.

## T04 Commits
- `c28838cf22ee05c6b7eacef0a89091c95846e4ae` — allocation compatibility extension.
- `a687a63817fc153849c255562bbf62c1da475e9a` — bounded sequential planner.
- `7d76cdfd9efe4cded3af4b7eb102f7ba57c3b624` — original verified T04 handoff.
- `d7dff8f5b986c141ddddb464e86524a3a367392a` — conclusion/metadata and nutrition
  explanation hardening, eight regressions and clarified contract/ADR.

## Last Verified Commit
`d7dff8f5b986c141ddddb464e86524a3a367392a`
(`fix(meal-planner): harden T04 result semantics`), verified 2026-09-09.

Verified implementation range: `3592de9..d7dff8f5b986c141ddddb464e86524a3a367392a`.
First-party push confirmed that exact implementation head on the existing branch
in user-confirmed `ganghienteck-droid/Frigo`. No remote was changed, PR created,
merge performed or deployment attempted. This following documentation-only checkpoint
cannot name its own hash; `git log --reverse --format='%H %s' 3592de9..HEAD` enumerates
all T04 commits including this handoff. Historical T03 evidence remains at the base.

Hardening preflight found a clean tree at `7d76cdf`, all required dependency commits
and no architecture drift. Finding A was **ALREADY_SAFE**: all three state documents
already agreed on T04 complete/T05 ready. B (false search-limit wording) and C
(neutral nutrition producing positive explanation) were **CONFIRMED** and fixed.

## Implemented
- Mandatory preflight/specification/implementation review and **850-test baseline**.
- Pure T02 regeneration → unchanged T03 eligibility/ranking → bounded sequential
  search → exact projected consumption for each selected future slot.
- Opaque scoped context and copy-on-write exact inventory; native lot witnesses,
  date-aware availability, conservation and nonnegative branch isolation.
- Isolated minimal T02 opt-in expiry ordering; default ID ordering and T03 unchanged.
- Fixed-offset temporal reference, ordered configurable slots/servings, exact locks,
  deterministic replay for swaps, future-only variety and period nutrition rules.
- Explicit cook-now/shopping modes, shortages without hypothetical purchases,
  no fallback on hard exclusions and no false infeasibility proof on truncated search.
- Versioned generated-only output with selected facts, deltas, initial versions/final
  stock, shortage aggregates, nutrition, signed utility and scoped diagnostics for T05.
- Corrected unproven conclusions, source-tagged incomplete reasons and data-only
  incomplete status, without changing eligibility, proof scope or search bounds.
- Evidence-backed nutrition support reasons; neutral utility and hard gates unchanged.
- `WEEKLY_PLANNER.md`, ADR-014, architecture/domain/task updates, 74 added regressions
  and all final local gates passing. Verified implementation published.

## In Progress
None in T04 implementation. This documentation checkpoint follows its verified push.

## Remaining
- Review T04. Create/link a PR only if requested, subscribing to auto-fix if created.
- T05 optimization and T06 authenticated shadow/canary integration remain separate
  work. Do not start T05, merge, deploy or change production under this handoff.

## Files Changed
- Compatibility: `packages/domain/src/availability.ts`, `packages/recipes/src/candidates.ts`,
  `tests/unit/recipe-candidates.test.ts`, `docs/ai/RECIPE_ENGINE.md`.
- Planner: `packages/recipes/src/{planner-context,planner-inventory,planner-nutrition,
  planner-policy,planner-request,planner-types,planner-utility,weekly-planner}.ts`
  and recipe barrel exports.
- Tests: `tests/helpers/planner-fixtures.ts`, `tests/unit/{weekly-planner,planner-contract,
  planner-inventory,planner-nutrition}.test.ts`, `tests/integration/weekly-planner.test.ts`.
- Docs: `WEEKLY_PLANNER`, `ARCHITECTURE`, `DOMAIN_MODEL`, `DECISIONS`, `CURRENT_STATE`,
  `TASK_BOARD`, `HANDOFF`, and `tasks/T04-weekly-meal-planner.md`.

## Database / Migration Changes
None. Migrations 0001–0021 and DB repositories are byte-unchanged from T03. The
existing local D1 read-only schema gate passes; no T04 migration application needed.
No remote D1 commands, data import, catalog publication or deployment.

## Real Inventory
**NOT mutated by planning.**

Planning performs no database calls after trusted preload and never mutates real
stock/events/Week. No new persistence/acceptance writer or real reservation exists.
Source snapshot versions/fingerprint support comparison but are not authorization
or sufficient concurrency locks. Future acceptance must reauthorize/revalidate the
whole inventory, catalog/reviews and preferences, then use existing transactional,
versioned/idempotent commands and Week compatibility rules.

## Architecture Decisions
ADR-014 and `WEEKLY_PLANNER.md` define:
- Trusted server-owned snapshot, not raw caller safety/preferences/inventory JSON.
  The callback boundary is not authentication; review providers must be immutable,
  deterministic in-memory server code. No I/O in beam expansion.
- Each branch regenerates T02 and invokes T03. No duplicate ingredient conversion,
  substitution validation, hard safety logic or historical ranking implementation.
- Exact Quantity native-unit witness consumption; kind-prioritized usable expiry
  order: use-by, best-before, estimated, unknown, then date/ID. No shelf-life inference.
- Beam alternatives, deterministic path ties, explicit recipe/planner completeness;
  best-found feasible results are not global optima, bounded failure is not proof.
- One fixed-offset instant/date reference, chronological slots, household-total
  period nutrition and T02 scaling/fractional counts, without invented portions.
- Only plan-local repetition/continuity/period nutrition supplement T03. Historical
  tastes are not duplicated and generated meals never become actual cooked events.
- Leftovers disabled: legacy tags/titles do not provide trusted prepared-food expiry.
- Generated-only library coexistence with a documented future T06 read-only shadow
  path. No Week cutover or T05 purchasing/budget/waste optimizer.

## Planner Search
Conclusions: `feasible`, `proven_infeasible`, `no_plan_found_without_proof`.
Proof remains limited to supplied input/hard policy and fixed allocation; hard
unknowns still fail closed. `partial` preserves a valid nonempty prefix. With no
selected meals, `incomplete` identifies data/evaluation uncertainty without a cap;
`search_limited` requires actual truncation. Sorted, deduplicated `{source, code}`
pairs in `search.incompleteReasons` retain multiple causes. Existing limit reasons,
completeness flags, counters, family metadata and rejection diagnostics are preserved.

Default bounds: beam 6, candidates/slot 8, states 1024, recipes 80, families 4,
variants/family 16, family traversal states 128. Maxima: 16 / 32 / 4096 / 500 / 16 /
64 / 1024. Horizon 1–14 days, 1–42 slots; trusted snapshots bounded to 1000 lots,
500 recipes, 16 families and 2000 history events. Limits are returned explicitly.

## Tests

### Passed
Final source/test content, before documentation-only completion edits:
- `pnpm test` — **924 tests / 61 files**. T04 adds **74 tests**: weekly planner 25,
  contract 22, projection 10, nutrition 14, SQLite integration 2, T02 compatibility 1.
  Five new test files contain 73; one regression extends the existing T02 suite.
- `pnpm lint` — PASS.
- `pnpm typecheck` — PASS, application/packages/tests and Worker.
- `pnpm build` — PASS, Vite client and Worker TypeScript.
- `pnpm check:migrations` — PASS, `migration-smoke=ok`.
- `pnpm schema:check:local` — PASS, existing schema/ledger/foreign keys.
- `git diff --check`, `git diff --cached --check` — PASS.
- Protected/dependency-path diff against `3592de9` — empty for `src`, migrations,
  scripts, DB, Week, all T03 ranking/personalization, package/lock/config files.
- No clock/random/network/DB calls found in planner search modules; integration
  hooks prove zero database calls during search and unchanged stock/events/Week.
- Original T04 preflight `pnpm test` — **850 / 56** before implementation (historical).
- Hardening focused run — **208 tests / 8 files**, all T04 plus relevant T02/T03:
  `pnpm exec vitest run tests/unit/ingredient-availability.test.ts tests/unit/recipe-candidates.test.ts tests/unit/recipe-ranking.test.ts tests/unit/planner-inventory.test.ts tests/unit/planner-nutrition.test.ts tests/unit/planner-contract.test.ts tests/unit/weekly-planner.test.ts tests/integration/weekly-planner.test.ts`.

Final logs: ignored `.hoplite/artifacts/t04-hardening/final/`; focused/red logs in
`.hoplite/artifacts/t04-hardening/`. Original T04 logs remain historical evidence
under `.hoplite/artifacts/t04-{preflight,checks,final-checks}/`.

Key regressions: sequential depletion, branch isolation, native mixed-unit and exact
fractional conservation, substitutions/optional demand, future expiry, unknown/hard
safety and nutrition, slot time/type, locks/version changes/replays, shortage handoff,
greedy failure avoided by bounded lookahead, future repetition, deterministic ties,
chosen-prefix diagnostics and tenant/stale-snapshot boundaries.

Eight new hardening cases cover catalog incompleteness without a search cap, T02
family caps, simultaneous data/catalog/planner limits, substitution/numeric data
failures, zero/partial/positive qualified nutrition and empty future periods.
Existing feasible, exhaustive-infeasible and state-limit assertions were strengthened.
Independent full-T04 review found no blockers; only two runtime result/explanation
modules changed, not inventory, allocation, ranking, nutrition arithmetic or policy.

Stress: 21 requested slots, 100 recipes, two identical runs. Test policy explores
exactly 200 states, frontier ≤6, considered choices ≤8, generated recipes ≤80;
truncation is explicit and remaining stock nonnegative. No latency guarantee claimed.

### Failed / Corrected
- Hardening pre-fix run:
  `pnpm exec vitest run tests/unit/planner-contract.test.ts tests/unit/weekly-planner.test.ts`
  — **9 failed / 38 passed / 2 files**, reproducing confirmed semantics and missing
  metadata. All cases pass in focused and final full runs after the surgical fix.
- Initial weekly suite: **1 failed / 19 passed** because projection rejected all
  shopping shortages. Fixed to consume the existing witness only; later slots see
  depleted stock and missing requirements remain explicit.
- Intermediate typecheck exposed the in-progress projection date signature,
  provenance version access and loose fixture types. Corrected before final gates.
- Review fixed rejected-branch failures leaking into chosen-plan diagnostics, reused
  T02's exact quantity schema, hardened opaque projection construction and numeric
  boundaries. Greedy/minimum-nutrition fixtures now defeat accidental ID-order passes.
- Hoplite dependent-branch allocation failed; reported and user explicitly authorized
  append-only stacking after T03. No unauthorized alternate branch was created.
- Removed one temporary untracked editor artifact; no unexpected final files found.

### Not Run
- UI/browser/preview — no UI/API change.
- Hosted CI/PR checks — no PR requested or created, no hosted success claimed.
- T04 migration apply — no schema changes; existing local schema gate executed.
- Remote D1, deployment, production integrations — not authorized.

## Known Limitations
- Bounded catalog/beam search may miss better/feasible plans; completeness is explicit.
- Fixed offsets are not IANA timezone/DST rules. Targets sum requested meals only,
  not assumed full-day diets or per-person consumption.
- Hard safety/nutrition needs trusted exact-dish review evidence. Unknown data stays
  unknown; no comprehensive review catalog or primary-protein taxonomy invented.
- Leftovers disabled pending reviewed prepared-food storage/expiry policy.
- Generated-only API, no Week runtime cutover. Future acceptance must revalidate;
  the display fingerprint is not a collision-proof optimistic-lock token.
- T04's deterministic, safety-aware expiry allocation is not globally waste-optimal.
  No T05 shopping/budget/waste optimizer is implemented. Purchase aggregation,
  prices/budgets, package decisions, final lists and purchase-vs-inventory tradeoffs
  belong to T05; this hardening does not change allocation order.

## Protected Areas
PayOS/payment/billing/checkout/callback/webhook code and all existing migrations;
unrelated authentication and production infrastructure; household isolation,
inventory command/idempotency/revision semantics, scan confirmation and Week
compatibility. All protected implementation paths remain untouched.

## Next Task
T05 — Budget / Shopping / Waste Optimizer (**READY**, not started).

## Next Exact Action
1. Review published T04 commits and `WEEKLY_PLANNER.md`; do not merge/deploy implicitly.
2. Only with separate T05 authorization, verify the hardened checkpoint, read
   AGENT_RULES, required documents and `tasks/T05-budget-shopping-waste.md`, then
   audit existing shopping/price/package helpers against T01 unit semantics and
   T04 selected meals, servings, demands, shortages, final stock, nutrition and
   incomplete-reason metadata. Do not subtract original inventory twice or assume
   T04 expiry allocation is the final waste optimum; alternatives require full replay.
3. If a review PR is requested, create/link it and subscribe to auto-fix updates.
