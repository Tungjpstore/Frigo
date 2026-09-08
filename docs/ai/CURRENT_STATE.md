# Current State — Recipe / Meal Planning Program

Verified 2026-09-08. **T01 complete; T02 ready.** This is the actual repository
checkpoint, not a claim that the seven-task platform is finished.

Verified implementation commit: `e2a63bbd09e31b4f9d2628a0ad459653a9527056` on
`hoplite/olbia-borysthenes-fbc61adc`. This state document is in the subsequent
documentation-only checkpoint. Neither commit is claimed published/deployed.

## Implemented

- Architecture/Git audit: React/Vite frontend, Hono Worker, raw SQL D1, no ORM or
  independent package workspaces; existing inventory/OCR/recipe/Week/user/household
  flows mapped in `ARCHITECTURE.md`.
- Additive migration `0019_recipe_domain_foundation.sql`: constrained eight-unit
  catalog; ingredient default name/subcategory/allergen review state; language
  and unique normalized alias keys; ingredient dietary/allergen tags and sourced
  storage guidelines; optional lot opening/date-kind/date-source evidence;
  basis-aware nutrition and ingredient/recipe-version links; recipe provenance,
  prep time/version/review/family link; relational families/slots/options and
  recipe classifications. No existing row deleted, seed replaced or pre-existing migration edited.
- Validated domain/recipe schemas and inferred types, NFKC exact alias normalization,
  explicit matched/unmapped/ambiguous outcomes; atomic ingredient/name/alias creation
  and alias addition via trusted catalog-only D1 helpers.
- Future-write recipe quantity/servings/unit constraints and expiry evidence/date
  constraints, lookup/query indexes, full migration smoke/schema gate integration.
- Seventeen new focused tests in two files, including real SQLite upgrade/rollback/
  FK/unique/check failures. No mass seed: only eight unit definitions are seeded;
  ingredients/recipes/families used for demonstrations are isolated test fixtures.
- Root `AGENTS.md`, eight `docs/ai` protocol files, seven precise task packets and
  ADR-001 through ADR-007. Existing historical reports are linked, not rewritten.

## Partially implemented / compatibility foundations only

- D1 canonical/recipe tables and runtime static catalogs coexist. New helpers are
  exported, but no current HTTP/scan/recipe/Week reader is switched to them.
- Nutrition, tags, family choices and condition evidence are storable/validated;
  no bulk authoritative data, variant generator, new nutrition calculation,
  allergy policy or condition-edit endpoint is implemented.
- Recipe source/review fields describe global catalog provenance. They do not
  implement private user drafts, publication permissions or a review workflow.

## Not implemented in this task

New candidate engine, substitutions, ranking/personalization feedback, constrained
lot-aware planner, budget/waste optimizer, product/SKU/price integration, AI recipe
generation or new planner UI. These are T02–T07 scope, regardless of legacy features
that overlap. No public API, auth, PayOS, checkout, billing or deployment behavior
was changed.

## Important existing legacy behavior / limitations

1. `ALL_RECIPES` and `CANONICAL_INGREDIENTS` remain runtime catalog sources. Seeded
   D1 has 45 ingredients/59 recipes but no baseline aliases/translations. Do not
   assume new D1 entries appear in screens. T02 owns drift audit/internal adapter.
2. Historical aliases keep NULL normalized keys; existing substring matching is
   unchanged. New resolver is exact locale + `und`, with no quantity stripping,
   cross-locale guessing or NLP. Collision-reviewed promotion is still required.
3. Existing match engine keeps the last ingredient lot in some paths; Week finds
   the first lot in others. Week is already sequential but has unsafe empty-eligible
   fallback and string-only dietary tests. T02–T04 improve this deliberately;
   T01 does not claim allergy-safe planning or fix the old algorithm.
4. Generic runtime price/package estimates are not retailer products. Contextual
   pack/bunch/slice identity does not authorize cross-lot pooling of different sizes.
5. Existing recipe macros lack explicit provenance/basis and are not auto-imported.
   Missing nutrition/allergen/price data is unknown, not zero or proof of safety.
6. SQL family option counts need complete-object validation plus atomic writes;
   no SQL aggregate/publication gate is built. Recipe nutrition readers must select
   a matching recipe version. Private user recipe ownership is required before T06
   permits end-user submissions; source type alone is not authorization.
7. New expiry evidence needs a date, but SQL legacy date/timestamp syntax remains
   permissive. No timezone/expiry scoring, automatic shelf-life inference or inventory
   condition UI exists. Future condition mutations must share version/events.
8. Existing Week legacy/`_v2` dual-write and reconciliation, inventory optimistic
   versions/idempotency and scan-confirm transaction flow remain unchanged.
9. Existing ESLint rules are permissive; the repository-wide TypeScript checks do
   not include all test files. Passing those gates is not a claim of exhaustive
   static or production security verification.

## Relevant modules

- `packages/domain/src/foundation.ts`, `packages/recipes/src/foundation.ts`
- `packages/db/src/catalog.ts`, existing `queries.ts`
- `migrations/0019_recipe_domain_foundation.sql`
- `tests/unit/domain-foundation.test.ts`, `tests/integration/recipe-foundation.test.ts`
- Existing `packages/domain/src/index.ts`, `week/*`, `packages/recipes/src/engine.ts`
- Existing `src/worker/routes/{inventory,recipes,scans,week,preferences}.ts`
- `scripts/{migration-smoke.sh,d1-schema-gate.sql,d1-schema-gate.sh}`

## Database state / recovery

Final 0019 applied with Wrangler to **sandbox-local D1 only**, all 0001–0019 ledger
entries present. Earlier development local state was preserved at ignored
`.wrangler/state-t01-before-review` before final clean-state replay. No remote
migration, production read/write, deployment or credential operation occurred.
Migration smoke also verifies seeded recipe replay and historical Week upgrade;
integration tests verify upgrade with existing unmapped inventory/aliases.

0019 is ledger-applied once, not rerunnable standalone SQL. Existing migrations
0001–0018 are unchanged. Future published changes require a new migration, not
editing 0019. Prefer application rollback with additive schema retained; any
database restore requires approved backup/recovery work (`DEPLOYMENT.md`).

## Test state — exact executed checks

| Check | Result |
| --- | --- |
| Initial `git status --short`, `git diff`, `git log --oneline -15` | Clean baseline `57c88c5140cec3cd6cbf763fda5592bcd9568e32`; history inspected |
| Baseline `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm check:migrations` | Passed; 44 files / 621 tests |
| Final `pnpm exec vitest run tests/unit/domain-foundation.test.ts tests/integration/recipe-foundation.test.ts` | Passed; 2 files / 17 tests |
| Final `pnpm lint` | Passed |
| Final `pnpm typecheck` | Passed (web/worker source packages) |
| Final `pnpm test` | Passed; 46 files / 638 tests, no failures |
| Final `pnpm check:migrations` | Passed, `migration-smoke=ok` |
| Final `pnpm build` | Passed, Vite client + Worker TypeScript build |
| Final `pnpm exec wrangler d1 migrations apply frigo-db --local` | Passed; all 19 migrations on fresh local state |
| Final `pnpm schema:check:local` | Passed; updated 0019 gate + foreign keys |
| `git diff --cached --check` and protected/prior-migration path diffs | Passed; protected paths and migrations 0001–0018 unchanged |
| Protocol manifest and heading inspection using `find`/`grep` | All 15 documents present; every required packet heading appears 7 times; fixed handoff headings present |

Before final review, delegated runs also passed 14 focused tests and 635 full tests;
three additional storage/provenance/date cases produced the final 17/638 counts.
Final code was formatted with `pnpm exec prettier --write` on the three new source
files and two new test files only. No repository test gate failed.

Environment issue: platform setup tools incorrectly reported no versioned setup
file, and `sandbox_setup` rejected its lifecycle claim. The existing
`.hoplite/settings.json` command was executed directly and succeeded:

```sh
command -v sqlite3 >/dev/null 2>&1 || (apt-get update -qq && apt-get install -y -qq sqlite3); pnpm install --frozen-lockfile
```

No dependency/config change was needed; platform issue reported. Node 24.19.0,
pnpm 10.26.0 and sqlite3 3.45.1 used. Install warned about ignored native build
scripts; actual tests, Vite and local Wrangler succeeded. Hosted CI, remote D1,
production integrations and browser/UI checks were not run; no UI changed.
Optional inline Node manifest commands were blocked before execution by sandbox
shell policy; equivalent read-only `find`/`grep` validation passed. Local Git
checkpoint operations were run separately and succeeded.

## Next exact action

Follow `AGENT_RULES.md` startup reads/Git checks, then read
`tasks/T02-recipe-engine.md`, the new foundation files, `packages/recipes/src/engine.ts`,
`packages/domain/src/week/{planner,portion}.ts` and their tests. Write a failing
lot-aware availability test: 200 g + 0.15 kg of the same canonical ingredient must
cover a 300 g required line, while a `pack` lot must not add invented grams.
Define the shared candidate/allocation contract and catalog drift report before
implementation. Do not switch live readers or add ranking in T02.
