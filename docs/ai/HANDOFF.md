# Frigo AI Handoff

## Current Task
T03 — Recipe Ranking & Personalization

## Task Status
**T03 NOT READY** — implementation and all local gates pass; publication is blocked
pending confirmation of the intended repository. T04 remains blocked/not started.

## Last Verified Commit
`01f9d874c72f67dc8b414caab926aba8d4be2f68`
(`feat(recipe-ranking): add scoped deterministic ranking and feedback`).
Branch `hoplite/stagiros-728cc726`; base is merged T02
`db09fa0c4353ddf4840e04c10b96a33240de3497`. This following documentation checkpoint
cannot name its own hash. Source/test changes passed final gates before the
implementation commit. Inspect live Git for the documentation commit and clean state.

User repository: `https://github.com/tun-vn/Frigo`.
Configured origin: `https://github.com/ganghienteck-droid/Frigo.git`.
No push, PR, merge, remote migration or deployment was attempted. Do not silently
publish to the differently named repository or change remotes to bypass authorization.

## Completed
- Read mandatory specs/rules/architecture/domain/decisions/state/board/handoff,
  T01–T03 packets, T02 documentation, implementation/tests and existing consumers.
- Verified T02 baseline with 106 tests / 6 files passing before T03 edits; corrected
  stale unmerged documentation using actual merged Git state. No T02 code mismatch.
- Added original-server-snapshot scope/date/fingerprint checks; existing family and
  prep metadata retained. No T02 availability/conversion/quantity recomputation.
- Added hard eligibility before scores, opaque evidence snapshots from trusted
  server providers and full candidate evidence binding. Unknown requested safety
  conditions fail closed; high preferences cannot override restrictions.
- Added nine bounded ranking components, one validated balanced profile, explicit
  normalized contributions/reasons, data coverage and deterministic stable ties.
- Added conservative expiry allocation-share scoring, partial nutrition, total-time
  uncertainty, current household/member preference precedence, durable explicit
  tastes, decaying history/variety and weak skip/swap signals.
- Added migration 0021 and authorized persistence. Existing cooked_meals is reused;
  new writer cannot create cooked events. Context uses six statements in one batch,
  nutrition one bulk query; pure ranking makes no I/O.
- Added 76 tests / 3 files and dedicated RANKING_ENGINE contract, ADR-013, updated
  architecture/domain/T02/T03 documentation. No legacy runtime cutover.

## In Progress
None in local implementation. Publication target confirmation is outstanding.

## Remaining
- Obtain user confirmation of configured origin or reconnect the intended repository.
- Publish clean commits through authorized source-control tools; only then advance
  T03 COMPLETE/T04 READY if no new blockers arise. If creating a PR, link/subscribe
  to auto-fix and keep its holistic verification evidence current.
- T04 future planning, T05 optimization, T06 authenticated integration and T07
  hardening remain separate tasks. Do not start them under this handoff.

## Files Changed
- `packages/recipes/src/{personalization,ranking-policy,ranking-evidence,ranking-eligibility,ranking-features,ranking}.ts`.
- `packages/recipes/src/candidates.ts` metadata/provenance guard; recipe barrel exports.
- `packages/db/src/{personalization,ranking-nutrition}.ts` and DB barrel exports.
- `migrations/0021_recipe_personalization.sql`.
- `tests/unit/recipe-ranking.test.ts` (63 tests).
- `tests/integration/{recipe-personalization,ranking-nutrition}.test.ts` (7 and 6 tests).
- Existing foundation assertions, migration smoke/schema gate scripts extended for 0021.
- `docs/ai/{RANKING_ENGINE,RECIPE_ENGINE,ARCHITECTURE,DOMAIN_MODEL,DECISIONS,CURRENT_STATE,TASK_BOARD,HANDOFF}.md`
  and `tasks/T03-ranking-personalization.md`.

## Database / Migration Changes
Additive 0021: `household_ranking_preferences`, `member_ranking_preferences`,
`recipe_feedback_events`, scoped recent/taste/cooked indexes. Versioned JSON and
canonical UTC guards; composite membership FKs for personal state; canonical
recipe/family target and swap FKs, cascading on referenced target/member deletion.
Owner-only household writes and member-only personal writes use atomic SQL guards.
Feedback IDs are idempotent, conflicting replays reject; cooked writes unsupported.
No existing migrations 0001–0020 were edited and no catalog data imported.

Final migration bytes were applied to fresh sandbox-local D1; previous local state
is preserved at `.wrangler/state-t03-before-final-7x8GEE/state`. Full local chain
and read-only schema gate pass. Nothing ran against remote D1 or production.

## Architecture Decisions
ADR-013 supplements ADR-001–012; see RANKING_ENGINE for exact formulas/API.
- Original T02 candidates + server-owned opaque evidence; no request-to-review shortcut.
- Hard policies union, personal soft defaults replace household defaults; tastes are
  private per membership while cooked history is intentionally household-shared.
- Explicit taste wins weak feedback, never hard constraints; cooked does not imply liking.
- Expiry consumes only the existing independent witness fractions; no FEFO/reallocation.
- Nutrition targets are per meal serving, absent dimensions remain absent, estimated
  hard facts require explicit permission and review. Provenance alone is not review.
- T03 utility is a T04 input, not a weekly plan or actual stock-consumption command.

## Tests / Verification

### Passed
Final content, all source/test edits included:
- `pnpm test` — **850 tests / 56 files** (T03 adds **76 / 3** to T02's 774 / 53).
- `pnpm lint` — PASS.
- `pnpm typecheck` — PASS, source/packages/TS tests and Worker.
- `pnpm build` — PASS, Vite client and Worker TypeScript.
- `pnpm check:migrations` — PASS, `migration-smoke=ok`.
- `pnpm exec wrangler d1 migrations apply frigo-db --local` — PASS, fresh through 0021.
- `pnpm schema:check:local` — PASS.
- `git diff --check`, `git diff --cached --check` — PASS.
- Protected-path diff against `db09fa0` — no changes in src, domain arithmetic,
  or migrations 0001–0020. No clock/random/network calls in new ranker modules.
- `pnpm install --frozen-lockfile` and T02 six-file preflight suite — PASS (106 tests).

Ignored exact final logs: `.hoplite/artifacts/t03-checks/`.

### Failed / Corrected
- Initial `pnpm exec vitest run tests/unit/recipe-ranking.test.ts`: missing-module
  collection failure, one failed suite/no tests. Both initial safety regressions
  passed after implementation; do not claim two executed red assertions.
- Concurrent intermediate `pnpm typecheck`/`pnpm build` observed incomplete nutrition
  row typing and old evidence-index import during edits. Fixed; final full gates pass.
- Review corrections now tested: opaque evidence and complete binding; partial
  coverage preserved; expiry-kind shares; namespaced history IDs; SQL NULL-safe
  JSON version/value guards; filter future tastes before selecting latest event.
- Setup tools misreported missing repository settings. Used repository-documented
  idempotent SQLite/dependency setup directly and reported the platform fault.
  No dependency upgrades or project setup override changes were made.

### Not Run
- Push/PR/hosted CI: blocked pending repository identity confirmation.
- Remote D1, migration, deployment, production integrations: not authorized.
- Browser/preview checks: no UI/API behavior changed.

## Known Issues
- No comprehensive trusted safety catalog; conservative hard policies may yield
  empty ranking until a trusted exact-dish review provider supplies evidence.
- ID-order expiry witness may miss FEFO opportunities. T03 does not optimize consumption.
- Static-only recipe feedback needs reviewed D1 registration. No automatic Week
  skip/swap capture, exact generated-variant cooking history or global-preference import.
- Missing prep time and unsupported/ambiguous nutrition stay unknown. Bulk D1 nutrition
  is unverified and cannot independently authorize hard nutrient constraints.
- Preferences are current snapshots, not historical versions; no household timezone
  inferred. Legacy runtime rankers and catalog divergence remain unchanged.

## Protected / Do Not Touch
PayOS/payment/billing/checkout/callback/webhook code and migration 0018; unrelated
authentication and production infrastructure; household isolation, inventory
commands/idempotency/revisions, scan confirmation and Week compatibility.
All protected implementation paths remain untouched.

## Next Task
Finish authorized T03 publication. **Do not start T04.**

## Next Exact Action
1. Ask/obtain confirmation whether the intended target is configured
   `ganghienteck-droid/Frigo` or requested `tun-vn/Frigo`.
2. Preserve the local implementation and documentation commits. If reconnection is
   needed, use the platform's authorized repository path, not arbitrary remote changes.
3. Inspect clean Git state; publish the exact branch/commit through authorized tools.
4. Update CURRENT_STATE/TASK_BOARD/HANDOFF publication evidence and only then mark
   T03 COMPLETE — T04 READY when genuinely true. Subscribe to auto-fix if a PR is created.
