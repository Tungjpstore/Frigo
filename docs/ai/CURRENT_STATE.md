# Current State — Recipe / Meal Planning Program

Verified 2026-09-08. **T01 COMPLETE — T02 READY**, including the focused T01
foundation hardening. This is not completion of the seven-task platform.

Last verified implementation commit: `a730da85967284afb2071140d51a3ea1c39dac9f`
(`fix(recipe-foundation): harden T01 domain invariants`) on
`hoplite/olbia-borysthenes-fbc61adc`. This document is in the following
state/handoff-only checkpoint. Review target remains [PR #5](https://github.com/tun-vn/Frigo/pull/5)
against `main`, with automatic CI/review feedback tracking. No merge, squash,
remote migration or deployment was performed. Read live PR checks for hosted CI;
the results below are local evidence for the hardened implementation.

## Implemented

- Audited React/Vite, Hono Worker, raw SQL D1, inventory/OCR/recipe/Week and household
  boundaries; see `ARCHITECTURE.md`. Existing runtime catalogs/readers are retained.
- Migration `0019_recipe_domain_foundation.sql`: ten relational foundation tables,
  eight constrained unit definitions, multilingual aliases/default names,
  nutrition/storage/safety metadata, recipe/family/provenance and lot condition
  evidence, compatible columns, indexes and future-write validation.
- Append-only `0020_t01_foundation_hardening.sql`: preflight existing data and add
  ten guards for canonical ingredient IDs, current-version nutrition links and
  traceable recipe/family sources. No persistent new table, data backfill or deletion.
- `CanonicalIngredientIdSchema` enforces uppercase ASCII snake case (max 100,
  no whitespace/case coercion) at ingredient/alias/storage/recipe-line/family-option
  boundaries. General recipe/family/profile IDs and slugs keep their separate contract.
- Recipe nutrition links must match the current recipe version in SQL. Version
  changes with attached links are rejected, including replacement INSERTs. An author
  must explicitly unlink/update/relink in a D1 batch; failed revisions roll back.
  Historical recipe versions are not modeled; nutrition is never automatically relabeled.
- Imported/AI recipes and families require nonblank, NUL-free source references in
  Zod and SQL. Unicode whitespace is rejected; internal job/dataset IDs are valid.
  Optional references may be omitted/NULL for legacy/curated/user sources. Neither
  source nor reference confers verification or catalog publication authority.
- Exact multilingual alias lookup with explicit matched/unmapped/ambiguous results;
  atomic ingredient/name/alias authoring remains a trusted library operation, not an API.
- 47 focused tests across three files (17 initial + 30 hardening), including real
  SQLite constraints, rollback, populated upgrade and migration/trigger gate failures.
- Root `AGENTS.md`, eight protocol files, seven task packets and ADR-001–ADR-010.
  T02 now requires explicit candidate/search-work budgets and oversized-family tests;
  no generator or runtime configuration was introduced in T01.

## Hardening findings verified against the pre-fix implementation

| Issue | Classification | Evidence / disposition |
| --- | --- | --- |
| A — Canonical ID case | CONFIRMED | General validation and binary SQL PK admitted casing variants. All 45 D1/static IDs and 385 static recipe references (43 distinct) fit the chosen strict convention; application + SQL guards added. |
| B — Nutrition version | CONFIRMED | Positive link versions could differ from the sole current recipe row. Current-only semantics and link/parent guards added; transactional replacement tested. |
| C — Contextual units | ALREADY_SAFE | Strict conversion already rejects contextual-to-physical conversion; typed dimensions distinguish identity. Added identity/conversion regressions and explicit documentation, not new conversion behavior. |
| D — Provenance | CONFIRMED | Imported/AI source references were optional in recipes/families. Required evidence now enforced on INSERT/UPDATE and by shared Zod validation. |
| E — Family expansion | PARTIALLY_CONFIRMED | Finite slots/options existed, but no computational budget was required. ADR-005/T02 now name candidate and search-state budgets, deterministic truncation and over-limit acceptance cases. |
| F — Unknown safety | ALREADY_SAFE | Unknown-default allergen review plus sourced assertions preserve absence of evidence. Documentation explicitly rejects inferring vegetarian/allergy safety from missing tags. No filtering was added. |
| G — Catalog coexistence | ALREADY_SAFE | Static runtime catalogs, D1 household authority and internal-only future adapters were already separated. Cutover remains separately reviewed future work. |

## Compatibility / non-blocking limitations

1. `ALL_RECIPES` and `CANONICAL_INGREDIENTS` still power legacy runtime catalog paths.
   D1 seeds contain 45 ingredients/59 recipes; aliases/translations start empty.
   New D1 entries do not automatically reach screens. T02 owns the internal adapter
   and drift report, not a silent source-of-truth switch.
2. Historical aliases retain NULL normalized keys. SQL uniqueness does not perform
   NFKC/BCP-47 normalization; direct/import writers must use the validated contract.
   Locale + `und` ambiguity remains explicit; no fuzzy/quantity-stripping fallback.
3. Old engine last-lot and Week first-lot behavior, unsafe empty-eligible fallback
   and string dietary checks remain for T02–T04. T01 is not allergy-safe planning.
4. `pack -> pack`, `slice -> slice` and `piece -> piece` preserve quantity identity,
   not known physical contents. Unknown nutrients/prices/dietary data stay unknown.
   Product/SKU/package equivalence and conversion metadata remain T05 work.
5. Zod adds authoring text/array limits and full-family option-count checks beyond
   SQL scalar/FK guards. Input schemas are not raw SQL row decoders; map nullable
   optional fields deliberately. No unrestricted importer/publication endpoint exists.
6. Missing tags, even with descriptive AI/import labels, do not establish safety.
   No complete nutrition/allergen database, safety policy or calculation engine exists.
7. Private user-recipe drafts/publication ownership must be implemented before T06
   accepts user submissions. Source type alone never grants global catalog authority.
8. Lot expiry evidence requires a date; SQL legacy date syntax/timezone policy and
   condition-edit endpoints remain deferred. Mutations must preserve versions/events.
9. Household isolation, inventory commands, scan-confirm transactions and Week
   legacy/`_v2` dual-write/reconciliation remain unchanged. No T02 engine, ranker,
   planner, optimizer, AI generation, UI, PayOS/payment, auth or infrastructure change.

## Database state / migration ownership

All 0001–0020 ledger entries are present in **sandbox-local D1 only**. Wrangler
applied 0020 onto the existing 0019 database; the local schema gate passed. Fresh
SQLite replay and populated 0019 upgrade/preflight rollback are also tested.
Migrations 0001–0019 are byte-for-byte unchanged by hardening. Existing ignored
`.wrangler/state-t01-before-review` remains the earlier T01 development snapshot.

0020 uses named preflight constraints for invalid IDs, mismatched nutrition versions
and opaque/blank source references. Failure aborts without silently repairing data;
the catalog/D1 owner must review affected records and authentic evidence before retry.
Always apply through Wrangler's ledger, not standalone SQL re-execution.

Before deployment, the D1/release owner must apply pending 0019/0020 migrations to
the target database and pass the remote schema gate. This is a deployment prerequisite,
not a merge blocker. No production credentials, remote data or configuration were used.
Keep additive schema for an application rollback only after compatibility review;
the existing exact-ledger release gate rejects blind deployment of an older SHA.
Schema recovery requires an approved backup/restore, not dropping new data or guards.

## Exact verification

Final full source gates ran on implementation commit `a730da85967284afb2071140d51a3ea1c39dac9f`.
Focused tests and the actual local migration apply also ran on the same implementation
content before commit; only state/handoff documents follow it.

| Command / check | Result |
| --- | --- |
| Startup `git status`, `git branch --show-current`, `git log --oneline -15`, `git diff main...HEAD` | Clean original head `63ecbd9`, correct branch; inspected full T01 scope |
| Baseline `pnpm exec vitest run tests/unit/domain-foundation.test.ts tests/integration/recipe-foundation.test.ts` | PASS — 17 tests / 2 files |
| Pre-fix `pnpm exec vitest run tests/unit/domain-foundation.test.ts tests/integration/foundation-hardening.test.ts --reporter=dot` | Expected FAIL — 16 failed / 16 passed; demonstrated missing A/B/D guards and optional-reference NULL mismatch |
| `pnpm exec vitest run tests/unit/domain-foundation.test.ts tests/integration/recipe-foundation.test.ts tests/integration/foundation-hardening.test.ts` | PASS — 47 tests / 3 files |
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS — source/package web + Worker checks |
| `pnpm test` | PASS — 668 tests / 47 files; repeated on the exact implementation commit |
| `pnpm check:migrations` | PASS — `migration-smoke=ok`, full chain + historical compatibility replay |
| `pnpm build` | PASS — Vite client + Worker TypeScript build |
| `pnpm exec wrangler d1 migrations apply frigo-db --local` | PASS — 0020 applied onto existing 0019; all 20 ledger entries present |
| `pnpm schema:check:local` | PASS — required ledger/schema, all ten hardening triggers, foreign keys |
| `git diff --check`, `git diff --cached --check`, `git diff main...HEAD --check` | PASS |
| Protected-path and prior-migration diff checks | Empty for runtime/UI/auth/PayOS, config/workflows, static catalogs/engines, and hardening changes to 0001–0019 |

The first red-test run also exposed a newly written recipe fixture missing cook
minutes; it was corrected before the repeat red run, so provenance regressions
exercise the intended guard. All intended red failures are resolved. Original
lowercase T01 fixture IDs were changed to valid uppercase IDs, and the AI fixture
received an internal source reference; alias/FK/transaction assertions were retained.
Expected failure-injection/KV warnings in existing tests are not failing checks.
Wrangler warned that its pinned v3 is old; no unrelated dependency upgrade was made.

Earlier setup-tool misdetection/workaround is recorded in the prior T01 checkpoint
(`63ecbd9:docs/ai/CURRENT_STATE.md`); this pass used the prepared workspace without
setup/config changes. No remote D1, deployment or browser/UI checks were run; no UI
changed. Hosted CI for new commits must be read from PR #5, not inferred from this table.

## Next exact action

Read `AGENT_RULES.md` and all required documents, then `tasks/T02-recipe-engine.md`,
foundation contracts/migrations, `packages/recipes/src/engine.ts`,
`packages/domain/src/week/{planner,portion}.ts` and their tests. Start with a failing
lot-aware availability regression: 200 g + 0.15 kg of one canonical ingredient
provides 350 g against a 300 g requirement; a 1-pack lot must not contribute invented
grams. Define the shared candidate/allocation contract and catalog drift audit
before implementing. Keep contextual uncertainty and family search budgets explicit;
do not switch live readers, add ranking or begin T03.
