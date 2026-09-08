# Frigo AI Handoff

## Current Task
T01 — Domain & Data Foundation + AI Development Protocol

## Task Status
complete

## Last Verified Commit
`e2a63bbd09e31b4f9d2628a0ad459653a9527056`
(`feat(recipe-foundation): establish ingredient and recipe domain foundation`).
All final source checks below ran on that exact implementation tree before commit.
This handoff is in the following documentation-only checkpoint, so it deliberately
references the tested implementation rather than trying to embed its own Git hash.

Branch: `hoplite/olbia-borysthenes-fbc61adc`. Baseline:
`57c88c5140cec3cd6cbf763fda5592bcd9568e32`. Published for team review on 2026-09-08:
[PR #5](https://github.com/tun-vn/Frigo/pull/5), targeting `main`, ready for review.
Automatic CI/review feedback tracking is enabled. No merge or deployment was
performed. Use `git log --oneline -3` and `git status --short` to confirm the
implementation/documentation checkpoints and current working tree.

## Completed
- Audited Git and actual frontend/Worker/D1/domain/recipe/OCR/household architecture.
- Added non-destructive migration 0019, typed/validated foundation and atomic
  catalog helpers, leaving all existing runtime engines/routes untouched.
- Established canonical locale/alias, physical versus contextual unit, nutrition
  provenance, storage/expiry evidence, recipe/family and quality boundaries.
- Added 17 meaningful unit/SQLite tests and extended migration/schema gates.
- Created all protocol documents/task packets and recorded ADR-001–ADR-007.
- Completed local validation; T02 ready, T03–T07 dependency-blocked.
- Published the checkpoint and opened PR #5 at the user's request; enabled the
  automatic review loop. Publication follow-up changes only these state documents.

## In Progress
- None. T01 implementation and protocol are complete.

## Remaining
- T02 internal catalog adapter/drift audit, collision-reviewed alias promotion,
  lot-aware availability/scaling/family variants/substitutions/rescue candidates.
- T03–T07 per packets. No new ranker, optimizer, AI generation or frontend in T01.

## Files Changed
- `AGENTS.md`
- `packages/domain/src/foundation.ts`, `packages/domain/src/index.ts`
- `packages/recipes/src/foundation.ts`, `packages/recipes/src/index.ts`
- `packages/db/src/catalog.ts`, `packages/db/src/index.ts`
- `migrations/0019_recipe_domain_foundation.sql`
- `scripts/migration-smoke.sh`, `scripts/d1-schema-gate.sql`, `scripts/d1-schema-gate.sh`
- `tests/unit/domain-foundation.test.ts`, `tests/integration/recipe-foundation.test.ts`
- `docs/ai/MASTER_SPEC.md`, `AGENT_RULES.md`, `ARCHITECTURE.md`, `DOMAIN_MODEL.md`,
  `DECISIONS.md`, `TASK_BOARD.md`, `CURRENT_STATE.md`, `HANDOFF.md`
- `docs/ai/tasks/T01-domain-data-foundation.md`, `T02-recipe-engine.md`,
  `T03-ranking-personalization.md`, `T04-weekly-meal-planner.md`,
  `T05-budget-shopping-waste.md`, `T06-ai-api-frontend.md`, `T07-hardening-final-review.md`

## Database / Migration Changes
0019 adds ten relational tables and compatible columns/indexes/triggers to existing
ingredient/alias/recipe/inventory structures. Exact contracts and constraints are
in `DOMAIN_MODEL.md`. Old IDs/rows, nullable unmapped ingredient FKs, static catalogs
and all migrations 0001–0018 are preserved. No bulk seed beyond unit definitions.

Applied once through Wrangler to fresh **local** D1 after final review; all 19
migrations/gate passed. Pre-review local state kept in ignored
`.wrangler/state-t01-before-review`. No remote state changed. Do not rerun 0019
direct SQL; use its ledger. Do not edit published migrations. Revert application
code rather than blindly dropping additive schema; production requires explicit
authorization and backup/ledger checks from `DEPLOYMENT.md`.

## Architecture Decisions
- ADR-001: preserve existing identity/runtime and domain boundaries.
- ADR-002: exact multilingual alias keys, legacy NULL preservation, explicit ambiguity.
- ADR-003: strict physical dimensions; no universal contextual conversions.
- ADR-004: basis/provenance-aware nutrition, unknown safety data stays unknown.
- ADR-005: bounded relational family slots/options and recipe provenance.
- ADR-006: lot condition evidence without rewriting inventory commands.
- ADR-007: deterministic critical decisions and repository-owned AI protocol.

## Tests Executed
### Passed
- Baseline `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm check:migrations`:
  621 tests / 44 files, all passed.
- Final `pnpm exec vitest run tests/unit/domain-foundation.test.ts tests/integration/recipe-foundation.test.ts`:
  17 tests / 2 files passed.
- Final `pnpm lint`, `pnpm typecheck`: passed.
- Final `pnpm test`: **638 tests / 46 files passed**, no failures.
- Final `pnpm check:migrations`: `migration-smoke=ok`.
- Final `pnpm build`: client and Worker build passed.
- Final `pnpm exec wrangler d1 migrations apply frigo-db --local`: all 19 applied.
- Final `pnpm schema:check:local`: passed.
- Focused source/test formatting via `pnpm exec prettier --write`; delegated
  intermediate focused/full suites passed 14/635 before final added cases.
- `git diff --cached --check`: passed. Protected-path and prior-migration diff:
  empty. `find docs/ai -type f | sort`, task heading `grep`/counts and handoff heading
  inspection confirm all 15 documents and every required heading (7/7 packets).

### Failed
- No repository test/build/type/lint/migration gate failed.
- Platform setup tooling reported the existing `.hoplite/settings.json` missing;
  `sandbox_setup` rejected a lifecycle claim. Reported platform issue and executed
  the exact existing setup command directly (see `CURRENT_STATE.md`); succeeded.
  No dependency/config modifications or bypass of remote authority.
- Optional inline Node documentation-manifest commands were blocked by sandbox
  shell policy before execution. Equivalent `find`/`grep` inspection succeeded;
  this was not a repository test failure. Local Git commits ran separately.

### Not Run
- Hosted CI outcomes are not asserted here; consult PR #5 checks for current state.
- Remote D1/production integration or deployment. Publication did not authorize them.
- Full local gates were not rerun for the documentation-only publication follow-up;
  the verified implementation commit is unchanged. Git status/diff/history and
  `git diff --check` were checked before committing the publication note.
- Browser/preview/UI smoke: no UI changes. Source regression tests are not visual proof.

## Known Issues
- Runtime static catalogs are not synchronized with D1; new helpers/metadata do
  not automatically alter existing UI/OCR/Week behavior. Old alias keys remain NULL.
- Legacy recommendation/Week last/first-lot behavior, empty-eligible fallback,
  string-based dietary logic and static price/package assumptions remain for later
  tasks. T01 is not an allergy-safe planner certification.
- No complete nutrition/safety database; absent values/tags are not zero/safe.
- Family aggregate option limits need full validation + atomic write; private
  user-recipe ownership/publication must be implemented before T06 submissions.
- Dates require evidence but timezone/expiry prioritization and legacy date syntax
  cleanup are deferred. Condition updates must retain inventory versions/events.
- Existing lint is permissive and project typechecks exclude most tests.

## Protected / Do Not Touch
- PayOS, payments, billing, checkout, callbacks/webhooks, payment UI and 0018.
- Unrelated authentication, cookie/CSRF/session logic, production infrastructure.
- Household isolation, inventory commands/idempotency/optimistic versions,
  scan confirmation and Week dual-write/reconciliation behavior.

## Next Task
T02 — Recipe Engine (**READY**)

## Next Exact Action
1. Read `AGENT_RULES.md` and all required documents plus the T02 packet; inspect
   `git status`, `git diff`, `git log --oneline -10`.
2. Read `packages/recipes/src/engine.ts`, `packages/domain/src/week/{planner,portion}.ts`,
   the foundation contracts/migration and existing recipe/Week tests.
3. Add a failing availability test: 200 g + 0.15 kg of the same canonical ingredient
   covers a 300 g required line; a contextual `pack` lot contributes no invented
   grams. Define the shared allocation/candidate contract and catalog drift audit.
4. Implement T02 only. Keep static runtime readers/Week compatibility intact; no
   personalized scoring, full planner, shopping optimizer or AI/frontend changes.
