# T07 H3 — Persistence, concurrency and local D1 audit

**Status:** H3 evidence checkpoint complete; T07 remains in progress. This is not a
production-readiness decision or remote-D1 evidence.

## Continuation topology

- Original T07 branch: `hoplite/lipara-d81160ee`
- Continuation checkpoint: `006742bc179d58aae53106c88aff8a2667dbd1ca`
- Writable continuation branch: `hoplite/prokonnesos-74e71894`

This topology is intentional because of Hoplite publisher binding, not an
architectural repository issue. H3 began from preserved documentation checkpoint
`f39180421f12ff68751dba7898aa39535b2d3a95`; no reset, rebase, payment, billing,
PayOS, legacy Week, authentication, deployment, or remote-D1 action occurred.

## Confirmed and corrected finding

### Medium — a successful CAS could return a later writer's revision

`updateGeneratedMealPlan` previously issued a separate scoped read after its
conditional update. A later successful writer at the next revision could commit
between those two statements, causing the first mutation to return the later
writer's opaque result and revision. This violates the action contract that a
successful mutation returns the response from its own `revision + 1` write.

The controlled reproducer first paused after a revision-1 -> revision-2 update,
committed another update at revision 2, then resumed the first caller. Before the
fix, the first caller received revision 3 with the second result:

```sh
pnpm exec vitest run tests/integration/t07-persistence.test.ts
# FAIL before fix: 1 test; expected revision 2 / first payload, received revision 3 / second payload
```

The minimal repair changes the existing conditional statement to `UPDATE ...
RETURNING *` and maps that returned row directly. The membership, creator and
expected-revision predicates remain in the same statement; a no-row response
retains the existing scoped conflict/not-found resolution. No schema change is
needed.

## Controlled race and idempotency coverage

`tests/integration/t07-persistence.test.ts` uses the real local SQLite D1 helper
with deterministic statement barriers and the application service:

- A post-CAS competing revision cannot alter the first successful response.
- Swap-vs-swap and swap-vs-regenerate both permit exactly one revision-1 writer;
  the loser receives `REVISION_CONFLICT`, the persisted plan is revision 2, and no
  household inventory event is created.
- Feedback paused after its plan read but before its guarded INSERT is rejected
  after a concurrent regeneration; no taste event is persisted.
- Shopping paused in the reviewed-catalog loader is rejected after concurrent
  regeneration by its final revision check; shopping has no durable cache/write.
- Exact feedback retry returns the original receipt and remains one event.
  Reusing that retry key with a different feedback intent conflicts; the same key
  at a new plan revision has a different deterministic feedback ID. A
  same-household non-creator cannot record feedback against the private plan.
- Two simultaneous initial generates with one key both perform planning, but the
  scoped unique key leaves exactly one durable plan. With a different intent under
  the same key, exactly one writer succeeds and the other receives
  `IDEMPOTENCY_CONFLICT`.

The last point is a reproduced structural limitation, not a data-integrity bug:
`generate` checks for a durable retry before it loads the snapshot and invokes
T04, so simultaneous first requests can both compute before one `INSERT ... ON
CONFLICT DO NOTHING` wins. There is no reservation row, stock mutation, or
partially persisted plan to become stuck. ADR-017 explicitly permits that bounded
redundant initial compute. A distributed/single-flight reservation is deferred:
it would add failure recovery and quota semantics beyond the proven persistence
correction. H2 separately owns aggregate compute-abuse policy.

## Predicate, snapshot and migration audit

### Planner persistence and feedback

- Generated plans are creator-private: exact/current/replay reads constrain
  `plan.id` where appropriate plus `(household_id, creator_user_id)` and validate
  current membership. A revoked/missing member resolves as forbidden; an
  authorized non-creator receives no plan row.
- Creation writes use membership-guarded `INSERT ... SELECT` and a scoped unique
  `(household_id, creator_user_id, request_key)`. Matching fingerprints replay;
  different fingerprints conflict.
- Plan updates are membership-guarded, owner-scoped revision CAS writes. The
  repaired `RETURNING` row eliminates the prior post-CAS response race.
- Taste feedback uses a deterministic ID over scope, plan ID, revision, slot and
  retry key. Its replay query requires the same membership and current plan
  revision, compares every feedback identity field, and the durable feedback
  INSERT repeats plan/member/revision guards. Cooked annotations are separately
  unique by `(plan_id, plan_revision, slot_id, request_key)` and never touch
  `inventory_items` or `cooked_meals`.
- T03 preference writes use membership-guarded `INSERT ... ON CONFLICT DO UPDATE`;
  household values additionally require `role = 'owner'`. Ranking reads load one
  household scope and one member scope; feedback reads are constrained by both
  household and user except shared cooked history.

`loadMealPlanningSnapshot` builds one read-only D1 batch: 8 catalog statements,
6 ranking-context statements, 1 household inventory statement, 1 nutrition
statement, and 1 recipe-step statement (**17 total**). Existing snapshot coverage
confirms one batch and forbids any D1 call from planner search. Thus there is no
candidate-loop N+1 query; global catalog/steps are deliberately snapshot-wide and
not household-filtered.

Fresh local `node:sqlite` replay of migrations 0001–0022 with foreign keys enabled
reported `PRAGMA foreign_key_check = []`. The audited 0021/0022 constraints include:

- household/member preference and feedback composite membership FKs with
  `ON DELETE CASCADE`;
- generated-plan composite membership FK and annotation composite
  `(plan_id, household_id, creator_user_id)` FK with `ON DELETE CASCADE`;
- generated-plan scoped retry uniqueness plus composite parent key required by the
  annotation FK; annotation revision/slot/retry uniqueness;
- JSON version/data checks, non-null opaque plan envelopes, valid timestamps and
  positive revisions; recipe/family feedback target/replacement pair checks.

The existing persistence tests additionally exercise malformed envelopes, orphan
rejection, household/user cascades, and cooked annotations without inventory or
cooked-history mutation. No applied migration was edited and no new migration is
justified by this H3 finding.

### `INSERT OR REPLACE` review

No planner persistence, snapshot, ranking preference, or feedback writer uses
`INSERT OR REPLACE`: they use targeted `ON CONFLICT DO NOTHING`, `DO UPDATE`, or
`INSERT OR IGNORE` semantics. Repository-wide search found `INSERT OR REPLACE`
only in the unrelated legacy `user_preferences` route and a foundation test seed;
those are outside this H3 planner boundary. Migration 0020 also has a recipe
version trigger explicitly guarding replacement-style parent writes from silently
bypassing recipe-nutrition version integrity. There is consequently no planner
parent replacement call that could delete generated-plan annotations by cascade,
and no child-preservation fix was warranted.

## Local query-plan evidence

The following was executed against a fresh migration 0001–0022 `node:sqlite`
database with representative scoped rows; it did not contact D1:

```sh
node scripts/t07-query-plans.mjs
```

- Exact owner read, CAS and feedback replay use the generated-plan composite
  `(id, household_id, creator_user_id)` key; membership uses the composite
  household-member key; current-plan lookup uses
  `idx_generated_meal_plans_owner_updated`.
- Inventory uses `idx_inventory_items_household_version`; it needs a temporary
  B-tree for the deterministic `ORDER BY id`.
- Household/member preferences use their primary keys. Taste/recent-feedback reads
  use `idx_recipe_feedback_recent`, with a temporary order B-tree because the
  queries span two event types and validate timestamps. Cooked history uses
  `idx_cooked_meals_ranking_recent` and recipe primary-key lookups.
- Snapshot-wide recipe ingredient and step reads use their existing recipe indexes
  but need temporary sorting for their full deterministic compound ordering.

No new index was added. The current 59-recipe/328-line/295-step audited baseline
makes these global-sort costs small, while a new index would add write/storage cost
without a measured endpoint regression. The inventory and multi-event feedback
sorts should be remeasured on representative production-sized local fixtures before
an additive index is proposed; this is a performance limitation, not an
authorization or persistence-integrity failure.

## Verification

All commands below ran on the shared writable continuation worktree after the H3
repair. Expected tests deliberately log mocked/degraded-KV warnings; no assertion
failed.

```sh
pnpm exec vitest run tests/integration/t07-persistence.test.ts
# PASS: 6 tests / 1 file (2.00 s wall clock)

pnpm check:migrations
# PASS: migration-smoke=ok

pnpm exec wrangler d1 migrations apply frigo-db --local
pnpm schema:check:local
# PASS: all 0001–0022 migrations applied to local D1; required ledger, generated-plan,
# ranking, Week, and foreign-key schema checks pass

pnpm exec vitest run tests/integration/t07-persistence.test.ts \
  tests/integration/meal-planning-persistence.test.ts \
  tests/integration/meal-planning-snapshot.test.ts \
  tests/integration/recipe-personalization.test.ts \
  tests/integration/meal-planning-http.test.ts
# PASS: 66 tests / 5 files (5.99 s Vitest duration)

pnpm exec eslint packages/db/src/meal-planning.ts tests/integration/t07-persistence.test.ts
# PASS
```

The first `pnpm check:migrations` attempt was blocked because the current sandbox
lacked `sqlite3`; the repository's existing effective idempotent setup command
installed it and ran frozen pnpm install without manifest or lockfile changes. A
subsequent migration run passed. `sandbox_setup` itself could not claim an idle
workspace despite that effective setup configuration; this platform-tool issue was
reported with the exact evidence and the durable repository command was used as
the safe workaround.

The H3 fixture initially needed its normalized `sequence` fields and was corrected.
An intermediate shared-worktree `pnpm typecheck` found a concurrent H2 fixture
inference error: `tests/integration/t07-rate-limit.test.ts(72,13): TS7022`.
The parent added an explicit `MealPlanDto[]` fixture type; **pnpm typecheck PASS**
on the assembled H1–H5 worktree afterward. This is not final frozen verification. No
full suite, browser replay, deployment, remote migration, hosted CI, or production
data access was run by H3.

## Next action

Parent verification added `tests/integration/t07-rate-limit.test.ts` to the
five-file focused command above: **68 tests / 6 files PASS**, 7.27 s. The local
query-plan helper is now versioned at `scripts/t07-query-plans.mjs`; its replay and
ESLint passed. No source/index changes were made in response to the observed sorts.

Parent: preserve this H3 patch and documentation with the next shared checkpoint.
Proceed with the assigned H2/H4/H5/H6 work, then freeze source and run the complete
T07 final verification. H3 needs no further code change unless representative-size
performance measurement proves one of the documented sort/index limitations merits
an additive migration.
