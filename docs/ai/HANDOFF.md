# Frigo AI Handoff

## Current Task
T01 — Domain & Data Foundation + AI Development Protocol; focused final hardening

## Task Status
complete — **T01 COMPLETE — T02 READY**

## Last Verified Commit
`a730da85967284afb2071140d51a3ea1c39dac9f`
(`fix(recipe-foundation): harden T01 domain invariants`). Full lint/typecheck/tests,
migration smoke, build and local schema gate passed on this exact implementation
commit. The actual local 0020 apply and focused regressions passed on the same
implementation content before commit. This handoff is the following state-only
checkpoint; it does not attempt to include its own Git hash.

Branch: `hoplite/olbia-borysthenes-fbc61adc`.
Program baseline: `57c88c5140cec3cd6cbf763fda5592bcd9568e32`.
Hardening began at published head `63ecbd9f7033f4f256ddfcc15dc66512ae85a6c6`.
Review target: [PR #5](https://github.com/tun-vn/Frigo/pull/5), base `main`, with
automatic CI/review feedback tracking. Existing T01 history is retained. No merge,
squash, production migration or deployment was performed. Check live PR/Git state
for publication and hosted-CI status, not historical chat or local test counts.

## Completed
- Audited existing frontend/Worker/D1/domain/recipe/OCR/household architecture.
- Added 0019 foundation, schemas and atomic catalog helpers without switching
  runtime catalogs, routes, inventory commands or Week compatibility.
- Verified all hardening findings first: A/B/D CONFIRMED; E PARTIALLY_CONFIRMED;
  C/F/G ALREADY_SAFE. Exact evidence and disposition are in `CURRENT_STATE.md`.
- Added strict canonical ingredient identity at authoring/reference boundaries
  and SQL INSERT/ID-UPDATE guards; all 45 seeded/static IDs remain legitimate.
- Enforced current-only recipe nutrition versions in SQL, including relevant
  link/parent updates and replacement INSERTs; explicit D1 batch replacement and
  rollback tested. No historical recipe version model or automatic nutrition mutation.
- Required traceable nonblank/NUL-free imported/AI recipe/family references in
  Zod and SQL, retaining source/review independence and optional other references.
- Appended 0020 rather than editing published 0019; preflight refuses incompatible
  data without guessing IDs/evidence or deleting rows. All ten triggers are schema-gated.
- Clarified contextual quantity identity, unknown allergy/dietary state and static
  versus D1 ownership. Existing conversion behavior is unchanged.
- Required named candidate/search-state budgets and deterministic truncation in
  T02's packet; no variant generator, runtime flag or T02 functionality added.
- Added 30 regressions beyond the original 17; full suite now 668 tests / 47 files.
- Maintained all protocol documents/task packets; accepted ADR-008–ADR-010 and
  clarified ADR-003–ADR-005. T02's starting lot-aggregation regression is retained.

## In Progress
- None. T01 hardening and repository handoff are complete.

## Remaining
- External review of PR #5; merge/deployment require separate authorization.
- Deployment only: D1/release owner applies pending 0019/0020 migrations and passes
  the remote schema gate. Catalog owner reviews any preflight failures first.
- T02 internal catalog adapter/drift audit, reviewed alias promotion, lot-aware
  availability/scaling, computationally bounded family variants and substitutions.
- T03–T07 per packets; no new ranking, planning, optimizer, AI or frontend work here.

## Files Changed
Cumulative T01:
- `AGENTS.md`, all eight `docs/ai` protocol files and seven `docs/ai/tasks/T0N-*.md` packets.
- `packages/domain/src/foundation.ts`, `packages/domain/src/index.ts`.
- `packages/recipes/src/foundation.ts`, `packages/recipes/src/index.ts`.
- `packages/db/src/catalog.ts`, `packages/db/src/index.ts`.
- `migrations/0019_recipe_domain_foundation.sql`, `migrations/0020_t01_foundation_hardening.sql`.
- `scripts/migration-smoke.sh`, `scripts/d1-schema-gate.sql`, `scripts/d1-schema-gate.sh`.
- `tests/unit/domain-foundation.test.ts`, `tests/integration/recipe-foundation.test.ts`,
  `tests/integration/foundation-hardening.test.ts`.

The hardening commit contains the exact implementation/contract/test subset;
this follow-up changes only `CURRENT_STATE.md`, `TASK_BOARD.md`, and `HANDOFF.md`.

## Database / Migration Changes
0019 adds ten relational tables and compatible columns/indexes/triggers for the
foundation. 0020 adds ten integrity triggers plus a transient preflight guard
that is removed on success. Existing valid catalog, inventory, family and nutrition
rows are preserved. Named preflight checks fail on invalid canonical IDs, mismatched
nutrition versions or missing/blank/NUL recipe/family source evidence; the ledger
transaction must be rolled back and data reviewed, never silently rewritten.

All 0001–0020 ledger entries are present in **sandbox-local D1**. Wrangler applied
0020 onto the already-applied 0019 state; local schema gate passed. Fresh SQLite
replay, populated 0019 upgrade, failed-preflight rollback and missing-trigger gate
failures are covered. No remote database was read or changed. Prior ignored
`.wrangler/state-t01-before-review` is retained.

0001–0019 are unchanged by hardening. Use Wrangler's migration ledger once; do not
rerun SQL manually or edit published migrations. Deployment's remote gate does not
auto-apply. Application rollback with retained schema requires compatibility review
because the existing exact-ledger release gate rejects an older release's shorter
manifest. Any schema recovery requires approved backup/restore (`DEPLOYMENT.md`).

## Architecture Decisions
- ADR-001: preserve existing identity/runtime/domain boundaries.
- ADR-002: multilingual exact alias keys, legacy NULL preservation and ambiguity.
- ADR-003: physical conversion versus contextual/count identity; no package mass inference.
- ADR-004: explicit nutrition basis/provenance and unknown safety state.
- ADR-005: relational family slots/options; T02 candidate/work budgets, not just finite output.
- ADR-006: lot condition evidence without inventory command rewrites.
- ADR-007: deterministic critical decisions and repository-owned AI protocol.
- ADR-008: uppercase canonical ingredient IDs separate from general catalog IDs;
  importer mapping is explicit and published 0019 is preserved.
- ADR-009: only current-version recipe nutrition; explicit transactional unlink/revise/relink.
- ADR-010: traceable imported/AI recipe/family references, without verification or authority inference.

## Tests Executed
### Passed
- Pre-edit Git status/branch/history and complete `git diff main...HEAD` review.
- Baseline `pnpm exec vitest run tests/unit/domain-foundation.test.ts tests/integration/recipe-foundation.test.ts`:
  17 tests / 2 files.
- Final `pnpm exec vitest run tests/unit/domain-foundation.test.ts tests/integration/recipe-foundation.test.ts tests/integration/foundation-hardening.test.ts`:
  **47 tests / 3 files**.
- `pnpm lint`, `pnpm typecheck`: passed, including on the implementation commit.
- `pnpm test`: **668 tests / 47 files passed**, repeated on the implementation commit.
- `pnpm check:migrations`: `migration-smoke=ok`.
- `pnpm build`: Vite client + Worker TypeScript passed.
- `pnpm exec wrangler d1 migrations apply frigo-db --local`: 0020 applied successfully
  onto 0019, leaving all 20 migrations present.
- `pnpm schema:check:local`: required ledger/schema, ten hardening guards and FK checks passed.
- Focused `pnpm exec prettier --write` on changed source/test files.
- `git diff --check`, `git diff --cached --check`, `git diff main...HEAD --check`:
  passed; protected/runtime paths, static catalogs/engines and published 0019 unchanged.
- SQLite/static ID inspection: 45 D1 ingredients, 45 static ingredients, 385 static
  recipe references (43 distinct); no invalid ID or case collision.

### Failed
- Intentional pre-fix regression run:
  `pnpm exec vitest run tests/unit/domain-foundation.test.ts tests/integration/foundation-hardening.test.ts --reporter=dot`
  reported **16 failed / 16 passed**, exposing the missing identity/version/provenance
  guards and nullable optional-reference mismatch. All failures are now resolved.
- The initial red run additionally caught a missing cook-time field in the newly
  authored recipe fixture; it was corrected before repeating the red regression run.
- No final lint/typecheck/test/build/migration/schema gate failure remains. Existing
  failure-injection/KV warnings and the pinned Wrangler v3 upgrade warning were nonfatal.

### Not Run
- Hosted CI outcomes for the hardened commits are not asserted; consult PR #5.
  Automatic CI/review feedback tracking remains enabled.
- Remote D1, production integrations, migration or deployment; not authorized.
- Browser/preview/UI verification; no UI/runtime behavior was changed.

## Known Issues
- Static catalogs and D1 are not synchronized; foundation authoring is not runtime
  publication. Historical alias keys await reviewed normalization/promotion.
- Legacy first/last-lot, unsafe fallback and dietary-string behavior remain deferred;
  T01 is not an allergy-safe planner certification.
- No authoritative bulk nutrition/allergy/price catalog, package-size equivalence,
  nutrition calculation or product-specific conversion was introduced.
- SQL does not duplicate Zod text/array limits, Unicode/locale normalization or
  complete-family aggregate checks. Importers must validate full inputs before an
  atomic write. Do not cast database rows to authoring or legacy camelCase DTOs.
- Missing dietary tags do not imply vegetarian status; AI/import assertions are
  not safety authority. Private user recipe ownership remains required before T06.
- Legacy date syntax/timezone prioritization and condition-edit APIs are deferred;
  future changes must preserve inventory versions/events.
- Existing lint is permissive; project typechecks exclude most test files.

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
   foundation contracts, migrations 0019/0020 and existing recipe/Week tests.
3. Add a failing availability test: 200 g + 0.15 kg of one canonical ingredient
   yields **350 g**, satisfying a **300 g** required line. A **1-pack** lot alone
   must leave the 300 g conversion unresolved, never assume sufficient physical stock.
4. Define the shared candidate/allocation contract and catalog drift audit. Preserve
   source boundaries; reject invalid IDs/mappings and retain conversion uncertainty.
   Include named candidate/search-state budgets before implementing family expansion.
5. Implement T02 only. Keep static readers/Week compatibility intact; no ranking,
   full planner, shopping optimizer, AI/frontend or production cutover changes.
