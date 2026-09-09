# Current State — Recipe / Meal Planning Program

Verified 2026-09-09. **T04 COMPLETE — T05 READY**. T05 has not started and requires
separate authorization. Local verification is not deployment or hosted CI evidence.

## Repository assessment and checkpoints

User-confirmed repository: `ganghienteck-droid/Frigo`; configured origin was not
changed. Branch: `hoplite/stagiros-728cc726`.

T04 is temporarily stacked on the existing T03 branch because Hoplite could not
allocate a dependent branch. The user explicitly authorized this topology. Before
T04 edits, Git showed a clean tree and exact immutable T03 HEAD:
`3592de9832a55a06d4af6fa31491c8f3c0321262`. No T01–T03 commit was amended,
squashed, rebased or rewritten; no merge to main occurred. This is a source-control
limitation only, not an architecture change.

New, isolated T04 commits:
- `c28838cf22ee05c6b7eacef0a89091c95846e4ae` — minimal T02 allocation-policy
  compatibility extension, its standalone regression and dependency documentation.
- `a687a63817fc153849c255562bbf62c1da475e9a` — sequential planner, contracts,
  tests, ADR-014 and subsystem documentation.
- `7d76cdfd9efe4cded3af4b7eb102f7ba57c3b624` — original verified T04 handoff.
- `d7dff8f5b986c141ddddb464e86524a3a367392a` — surgical conclusion/metadata and
  nutrition-explanation hardening, eight regressions and contract clarification.

First-party publication confirmed the branch at `d7dff8f5b986c141ddddb464e86524a3a367392a`.
Verified implementation range: `3592de9832a55a06d4af6fa31491c8f3c0321262..d7dff8f5b986c141ddddb464e86524a3a367392a`.
This following documentation-only checkpoint records that confirmed push; it cannot
contain its own hash. Read `git log --reverse --format='%H %s' 3592de9..HEAD` for
all T04 commits, including the handoff. No PR, merge or deployment was requested.
Historical T03 evidence remains at `3592de9:docs/ai/{CURRENT_STATE,HANDOFF}.md`.

Preflight read required specifications, protocols, T01–T04 packets and T02/T03
contracts; inspected domain, inventory, catalog, preferences/history, nutrition,
legacy Week persistence/routes, shopping and tests. The T03 baseline matched its
checkpoint and all **850 tests / 56 files** passed before T04 implementation.
Legacy Week's independent matching/leftover heuristics are not this new planner.

Hardening preflight verified clean HEAD `7d76cdf`, the three required dependency
commits and no intervening architecture changes. Finding A (state-document drift)
was **ALREADY_SAFE**: that handoff already agreed with CURRENT_STATE/TASK_BOARD.
Findings B (non-limit incompleteness labeled as a limit) and C (neutral nutrition
utility producing positive support) were **CONFIRMED**, reproduced and corrected.
The published core is unchanged apart from those result/explanation semantics.

## Implemented T04

- Pure `planWeeklyMeals` composes fresh T02 candidates and unchanged T03 hard
  eligibility/ranking for every explored slot against that branch's remaining stock.
- Opaque server-owned context copies/freezes scoped inventory, catalog, preferences,
  feedback and reviewed rules. Mixed scopes, forged contexts and malformed snapshots
  reject. Server membership authorization remains mandatory before preload; a
  callback wrapper is not authentication. Exact-dish evidence providers must be
  synchronous, deterministic and in-memory, with immutable server-owned review data.
- One offset-bearing reference instant determines local date and every slot instant.
  Fixed-offset planning supports 1–14 days and 1–42 explicitly requested slots, with
  seven days the default; actual future feedback is not mixed into planning history.
- Copy-on-write exact `Quantity` balances reuse actual T02 native-unit allocations.
  Each branch conserves initial = consumed + remaining, never double-spends or
  mutates real inventory. Expiry is reevaluated at each future date. Numeric boundary
  failures remain explicit rather than clamping or fabricating stock.
- Minimal additive T02 `allocationPolicy: 'expiry_first'` orders usable lots by dated
  use-by, best-before, estimated, then unknown evidence, with date/ID ties. Default
  lot-ID behavior remains intact. No T03 source refactor or hardening is included.
- Bounded deterministic beam search retains alternatives, stable path tie-breaks,
  complete/partial results and separate recipe/planner search completeness. Truncated
  failure is not proof of infeasibility; feasible output is best-found, not globally
  optimal. The proof scope is the supplied catalog and fixed allocation policy.
- Unproven results use `no_plan_found_without_proof`. With no selected meals,
  `incomplete` distinguishes data/evaluation uncertainty from actual `search_limited`
  truncation. Sorted `{source, code}` pairs in `search.incompleteReasons` preserve
  simultaneous causes; existing limit reasons, counters, family metadata and hard
  eligibility/proof criteria remain unchanged.
- Exact source/version/variant locks survive breadth limits; conflicts are explicit.
  Swaps/replans replay from the original snapshot, never from already-deducted stock.
- T03 scores are used once. Plan-only terms add strongest-class future repetition,
  allocated ingredient continuity and period nutrition. Historical preferences are
  not duplicated; future selected meals never become actual cooked events.
- T02 serving scaling preserves fractional counts without rounding. No extra
  servings, prepared-food quantities or implicit safe leftovers are invented.
- Reviewed daily/horizon household-total nutrition supports hard/soft min/max rules,
  explicit estimate permission, known totals and unknown coverage. Hard maxima prune
  early; minima wait until the relevant period closes. Unknown is never zero/safe.
- Nutrition support explanations require positive utility change, above-neutral
  aggregate fit and an above-neutral fully qualified soft target covering the new
  meal. Neither unknown data nor an empty future period supplies positive evidence;
  neutral scores and all nutrition calculations remain unchanged.
- `cook_now` requires proven required stock. `shopping_allowed` consumes only real
  projected stock and preserves shortages, without introducing hypothetical purchases.
- Versioned `WeeklyMealPlan` exposes selected T02/T03 facts, per-lot deltas, initial
  versions/final inventory, raw and aggregated shortage facts, nutrition, utility,
  chosen-prefix diagnostics and separate rejected-branch/search-limit metadata for T05.

See `WEEKLY_PLANNER.md` for exact API, formulas, output, trust boundaries and limits.

## Database, persistence and compatibility

Generated-only in-memory state; no table, migration, inventory command, acceptance
writer or new route. Migrations 0001–0021, DB repositories, legacy Week domain/API,
`WEEK_SCHEMA_MODE`, dual writes, snapshots/reconciliation and shopping remain unchanged.
The local D1 schema gate passed against the existing schema; no T04 migration apply
was necessary. No remote database, catalog publication or deployment was touched.

The documented T06 shadow path authorizes/preloads, runs T04 read-only alongside
legacy Week and compares without cutover. Any future acceptance must revalidate
membership, whole inventory including added/deleted lots, catalog/review versions
and preferences. Snapshot fingerprints are display identifiers, not authorization
or collision-proof concurrency tokens. Actual cooking keeps existing versioned,
idempotent commands. The result explicitly requires revalidation before acceptance.

## Final executed verification

All final source/test edits, including the eight hardening regressions, preceded
these checks. Only handoff documentation changed afterward. Ignored final logs:
`.hoplite/artifacts/t04-hardening/final/`; the original 916-test checkpoint logs
remain historical evidence in `.hoplite/artifacts/t04-final-checks/`.

| Exact command | Result |
| --- | --- |
| `pnpm test` | PASS — **924 tests / 61 files** |
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS — application/packages/tests and Worker |
| `pnpm build` | PASS — Vite client and Worker TypeScript |
| `pnpm check:migrations` | PASS — `migration-smoke=ok` |
| `pnpm schema:check:local` | PASS — local required ledger/schema/foreign keys |
| `git diff --check`, `git diff --cached --check` | PASS |
| Protected/dependency path diff against `3592de9` | Empty for `src`, migrations, scripts, DB, Week, T03 ranking/personalization, package/config/lock files |

T04 adds **74 tests**: 25 weekly planner, 22 request/context contract, 10 projection,
14 period nutrition, 2 SQLite integration, and 1 standalone T02 compatibility test.
The first 73 occupy five new test files; the compatibility test extends the existing
candidate suite. All 850 baseline tests remain covered.

Focused command also passed **208 tests / 8 files**:
`pnpm exec vitest run tests/unit/ingredient-availability.test.ts tests/unit/recipe-candidates.test.ts tests/unit/recipe-ranking.test.ts tests/unit/planner-inventory.test.ts tests/unit/planner-nutrition.test.ts tests/unit/planner-contract.test.ts tests/unit/weekly-planner.test.ts tests/integration/weekly-planner.test.ts`.
This covers relevant T02/T03 suites and every T04 planner test.

Regressions cover sequential depletion/branch isolation/conservation, mixed units,
substitutions, optional demand, fractional counts, safety/time exclusions, unknown
nutrition, future expiry, empty inventory, shopping shortages, fixed-offset dates,
locks/version drift/replanning, deterministic ties, future repetition, greedy dead
ends avoided by bounded search, hard period minima/maxima and no cross-branch
failure leakage. SQLite tests prove household isolation, zero DB calls during
search, unchanged stock/events/Week, and stale-snapshot revalidation metadata.

Hardening regressions cover feasible/exhaustive/state-limited outcomes, catalog
data incompleteness without a cap, family traversal limits, simultaneous catalog
data/catalog-cap/planner-cap causes, substitution/numeric incompleteness, and
zero/partial/qualified-positive nutrition fit (including empty future periods).
Independent full-T04 review found no blockers; no scoring/allocation/search redesign.

Stress regression: **21 slots / 100 recipes**, executed twice with identical output;
exactly **200 explored states** under its test policy, frontier ≤6, considered
candidates ≤8 and generated candidates ≤80, explicit truncation and nonnegative
stock. This verifies computational bounds, not a production latency guarantee.
Defaults: beam 6, candidates/slot 8, states 1024, recipes 80, families 4, variants/family
16, family traversal states 128. Maxima: 16 / 32 / 4096 / 500 / 16 / 64 / 1024.

## Failures investigated and resolved

- Hardening red run, before implementation changes:
  `pnpm exec vitest run tests/unit/planner-contract.test.ts tests/unit/weekly-planner.test.ts`
  — **9 failed / 38 passed / 2 files**. It reproduced both confirmed semantic defects
  and missing new metadata; all cases pass after the targeted fix. Log:
  `.hoplite/artifacts/t04-hardening/regressions-before.log`.
- Initial weekly suite: **1 failed / 19 passed**. Projection wrongly rejected every
  shopping candidate with shortages. Corrected to consume only its proven witness
  and retain missing demand; the regression now passes.
- Intermediate typecheck caught the in-progress projection date signature, incorrect
  direct version access instead of provenance.version, and loose test fixture types.
  Fixed before the final green gates.
- Independent review tightened opaque projection construction, exact quantity schema
  compatibility, numeric-boundary handling and chosen-prefix diagnostic isolation.
  Lookahead fixtures were strengthened so alphabetical ordering cannot fake success.
- Hoplite dependent-branch allocation failed; reported the platform limitation and
  continued only after explicit user authorization. No arbitrary branch workaround,
  remote change or dependency-history rewrite was used.
- An untracked temporary editor artifact was removed; final diff/untracked checks
  found no unexpected files. Nonfatal existing failure-injection/KV and pinned
  Wrangler notices do not imply application or gate failures.

## Genuine remaining limitations / Not run

- Leftovers explicitly disabled: no reviewed prepared-food expiry/storage policy
  exists. Legacy title/tag heuristics do not authorize safe future reuse.
- Fixed offsets, not IANA timezone/DST scheduling; only listed meals contribute to
  household-total nutrition, with no invented per-person consumption split.
- Bounded catalog/beam search can miss a feasible or better plan; all limits and
  unknown data remain visible. No comprehensive trusted safety/nutrition catalog
  or primary-protein taxonomy was fabricated.
- T04 expiry allocation is deterministic, planning-oriented and safety-aware, not
  globally waste-optimal. T05 owns purchase/package/budget/waste tradeoffs.
- Generated-only library, not production Week integration. No UI changes; browser
  and preview checks **NOT RUN**. Hosted CI/PR checks **NOT RUN**; no PR created.
- Remote D1, migrations, deployment and production integrations **NOT RUN / not authorized**.
- No T05 optimizer, prices/package purchasing, AI/LLM planning or frontend redesign.
  PayOS/payment/billing/checkout/webhooks, auth and production infrastructure untouched.

## Next exact action

Review the published T04 range and `WEEKLY_PLANNER.md`. T05 is **READY, not started**.
On separate authorization, verify the hardened checkpoint, read AGENT_RULES, required
documents and `tasks/T05-budget-shopping-waste.md`, then audit existing shopping/
price/package helpers against T01 units and T04 selected demands, shortages, final
projection and incomplete-reason metadata. Do not subtract original stock again or
assume expiry allocation is the final waste optimum. A PR, merge, deployment
or production cutover needs a separate request; subscribe to auto-fix if creating a PR.
