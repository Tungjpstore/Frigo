# Current State — Recipe / Meal Planning Program

Verified 2026-09-08. **T04 COMPLETE — T05 READY**. T05 has not started and requires
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

First-party publication confirmed the branch at `a687a63817fc153849c255562bbf62c1da475e9a`.
Verified implementation range: `3592de9832a55a06d4af6fa31491c8f3c0321262..a687a63817fc153849c255562bbf62c1da475e9a`.
This following documentation-only checkpoint records that confirmed push; it cannot
contain its own hash. Read `git log --reverse --format='%H %s' 3592de9..HEAD` for
all T04 commits, including the handoff. No PR, merge or deployment was requested.
Historical T03 evidence remains at `3592de9:docs/ai/{CURRENT_STATE,HANDOFF}.md`.

Preflight read required specifications, protocols, T01–T04 packets and T02/T03
contracts; inspected domain, inventory, catalog, preferences/history, nutrition,
legacy Week persistence/routes, shopping and tests. The T03 baseline matched its
checkpoint and all **850 tests / 56 files** passed before T04 implementation.
Legacy Week's independent matching/leftover heuristics are not this new planner.

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

All final source/test edits, including strengthened greedy-vs-beam/nutrition
assertions and the isolated allocation regression, preceded these checks. Only
handoff documentation changed afterward. Ignored logs: `.hoplite/artifacts/t04-final-checks/`.

| Exact command | Result |
| --- | --- |
| `pnpm test` | PASS — **916 tests / 61 files** |
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS — application/packages/tests and Worker |
| `pnpm build` | PASS — Vite client and Worker TypeScript |
| `pnpm check:migrations` | PASS — `migration-smoke=ok` |
| `pnpm schema:check:local` | PASS — local required ledger/schema/foreign keys |
| `git diff --check`, `git diff --cached --check` | PASS |
| Protected/dependency path diff against `3592de9` | Empty for `src`, migrations, scripts, DB, Week, T03 ranking/personalization, package/config/lock files |

T04 adds **66 tests**: 25 weekly planner, 14 request/context contract, 10 projection,
14 period nutrition, 2 SQLite integration, and 1 standalone T02 compatibility test.
The first 65 occupy five new test files; the compatibility test extends the existing
candidate suite. All 850 baseline tests remain covered.

Regressions cover sequential depletion/branch isolation/conservation, mixed units,
substitutions, optional demand, fractional counts, safety/time exclusions, unknown
nutrition, future expiry, empty inventory, shopping shortages, fixed-offset dates,
locks/version drift/replanning, deterministic ties, future repetition, greedy dead
ends avoided by bounded search, hard period minima/maxima and no cross-branch
failure leakage. SQLite tests prove household isolation, zero DB calls during
search, unchanged stock/events/Week, and stale-snapshot revalidation metadata.

Stress regression: **21 slots / 100 recipes**, executed twice with identical output;
exactly **200 explored states** under its test policy, frontier ≤6, considered
candidates ≤8 and generated candidates ≤80, explicit truncation and nonnegative
stock. This verifies computational bounds, not a production latency guarantee.
Defaults: beam 6, candidates/slot 8, states 1024, recipes 80, families 4, variants/family
16, family traversal states 128. Maxima: 16 / 32 / 4096 / 500 / 16 / 64 / 1024.

## Failures investigated and resolved

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
- Generated-only library, not production Week integration. No UI changes; browser
  and preview checks **NOT RUN**. Hosted CI/PR checks **NOT RUN**; no PR created.
- Remote D1, migrations, deployment and production integrations **NOT RUN / not authorized**.
- No T05 optimizer, prices/package purchasing, AI/LLM planning or frontend redesign.
  PayOS/payment/billing/checkout/webhooks, auth and production infrastructure untouched.

## Next exact action

Review the published T04 range and `WEEKLY_PLANNER.md`. T05 is **READY, not started**;
read its packet and the T04 shortage/final-projection contract only when separately
authorized. Do not subtract original inventory again in T05. A PR, merge, deployment
or production cutover needs a separate request; subscribe to auto-fix if creating a PR.
