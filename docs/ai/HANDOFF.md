# Frigo AI Handoff

## Current Task
T02 — Recipe Engine

## Task Status
**T02 COMPLETE — T03 READY**. T03 has not been started.

## Last Verified Commit
`0051276f61445437d323ca318378e16fc0ad6967`
(`feat(recipe-engine): add deterministic lot-aware candidates and bounded families`).
All implementation/test content passed the final local gates before this commit;
this following checkpoint changes only state/handoff documentation and cannot name
its own hash. Branch: `hoplite/olbia-borysthenes-fbc61adc-recipe-engine-t02`.

Base: `main` at `ae0ed794abacdb97792b0013f332e0ee67fb3270`, the explicitly authorized
merge of T01 PR #5. T01's historical handoff is available at
`ae0ed79:docs/ai/HANDOFF.md`. The independent branch resolves the earlier stack-ref
prefix collision. T02 is the next review unit against `main`; consult live Git/PR
state for publication/hosted checks. No T02 merge, remote migration or manual deployment.

## Completed
- Verified T01 COMPLETE/T02 READY and code/migrations against the T01 checkpoint;
  read required documents and legacy consumers. Corrected stale documentation about
  TS/TSX tests being excluded from typecheck; compiler configuration was already correct.
- Added a reusable canonical lot index and per-candidate reservation sessions;
  strict conversions, exact rational intermediate arithmetic and explicit numeric
  range failures. Lot IDs are deduplicated/quarantined, never first/last-wins.
- Added deterministic scaled requirements, required/optional coverage, missing vs
  unresolved quantities and cook-now/shopping-allowed modes. Inputs remain immutable.
- Added reviewed, source-referenced, version-scoped, caller-approved one-hop
  substitutions with explicit ratios, decisions and donor-lot witnesses.
- Added lazy family traversal with candidate/state budgets during search, semantic
  deduplication, explicit truncation and separate contextual slot identities.
- Added validated explicit static/D1/provided snapshots and a drift/alias audit.
  D1's eight catalog SELECTs run in one read-only transactional batch.
- Added 106 tests across six files. Full suite: 774 tests / 53 files, all passing.
- Documented the consumer contract in `RECIPE_ENGINE.md`, ADR-011/012, architecture,
  domain model and T02/T03 packets. No future-task implementation.

## In Progress
None in the T02 implementation. PR review remains a separate step.

## Remaining
- Review T02, address actual feedback, and merge only with separate authorization.
- Authorized release owner verifies target D1 migration/schema state before any
  deployment; local results are not target-environment evidence.
- T03 separate eligibility/ranking; T04 sequential planning; T05 package/shopping/
  waste optimization; T06 reviewed API/UI integration; T07 final hardening.

## Files Changed
- `packages/domain/src/{availability,quantity,units}.ts`, `index.ts` exports.
- `packages/recipes/src/{catalog,requirements,substitutions,families,candidates}.ts`,
  `index.ts` exports.
- `packages/db/src/recipe-catalog.ts`, `index.ts` export.
- `tests/unit/{ingredient-availability,quantity,recipe-candidates,recipe-families}.test.ts`.
- `tests/integration/{recipe-catalog,recipe-candidates}.test.ts`.
- `docs/ai/{ARCHITECTURE,DOMAIN_MODEL,DECISIONS,RECIPE_ENGINE,CURRENT_STATE,TASK_BOARD,HANDOFF}.md`
  and `docs/ai/tasks/{T02-recipe-engine,T03-ranking-personalization}.md`.

## Database / Migration Changes
**None in T02.** All migrations 0001–0020 are unchanged. Local Wrangler reports no
pending migrations; the read-only local schema gate passes. No remote D1 was read
or changed. Prior ignored `.wrangler/state-t01-before-review` remains retained.

T01's foundation authoring remains explicitly invoked and separate from live
catalog publication. `readRecipeCatalog(db)` is read-only and throws on D1 read
failure, never falling back to fabricated empty results. Static replay audit finds
45 shared ingredient IDs and 59 shared recipes with no requirement/unit drift;
static-only `gl-01`–`gl-12` remain available. Alias normalization/collision output is
review-only, with no writes/imports or source authority switch.

## Architecture Decisions
- ADR-001–010 remain the accepted T01 foundation; no silent redesign or migration rewrite.
- ADR-011: indexed quantity feasibility with explicit uncertainty and per-candidate
  conservation; preserved fractional counts, explicit as-of/expiry policy and unchanged
  legacy runtime consumers. No FEFO or multi-day consumption claim.
- ADR-012: approved reviewed one-hop substitutions and lazy, bounded family traversal;
  contextual demands preserve slot identity, not inferred package equivalence.
- See `RECIPE_ENGINE.md` for the exact contract and D1 batch reference.

### Consumer invariants
- Caller supplies authorized stock, explicit `asOfDate` and positive safe-integer
  servings. Household filtering is defensive, not authentication/authorization.
- `satisfied` proves quantity coverage; `partial`/`missing` provide known shortages;
  `unresolved` uses `missingQuantity: null`. 200 g + 0.15 kg = 350 g; a pack provides
  no invented grams. Same contextual labels do not prove equal contents.
- Required direct demands reserve before substitutions and optional demands; each
  candidate has an independent stock witness. Optional shortage alone is not exclusion.
- Shopping mode retains valid incomplete/unresolved requirements; cook-now requires
  every required demand satisfied. `eligibilityScope: 'quantity_only'` is not safety.
- One egg / two base servings scales to 1.5 pieces / three servings with explicit
  `fractionalCount` and `countPolicy: 'preserve_fraction'`; no purchase rounding.
- Caps are 64 accepted candidates and 1024 attempted states per family. Callers may
  lower, not raise, caps. Truncation or invalid numeric variants precludes an
  exhaustive-feasibility claim; empty truncated output is not proof of no solution.
- Candidate IDs/order are deterministic identities, not scores; rescue flags are
  raw witness metadata, not expiry weighting. No LLM is needed.

## Tests / Verification

### Passed
Executed on final implementation content, Node v24.19.0 / pnpm 10.26.0:
- `pnpm lint` — PASS.
- `pnpm typecheck` — PASS (source/packages/TS tests + Worker).
- `pnpm test` — PASS, **774 tests / 53 files**. New T02 counts: availability 29,
  quantity 11, candidates 42, families 14, D1 catalog 7, D1 candidates 3 (**106 / 6**).
- `pnpm build` — PASS, Vite client and Worker TypeScript.
- `pnpm check:migrations` — PASS, `migration-smoke=ok`.
- `pnpm exec wrangler d1 migrations apply frigo-db --local` — PASS, nothing pending.
- `pnpm schema:check:local` — PASS, required ledger/schema, guards and foreign keys.
- `pnpm exec vitest run tests/unit/recipe-families.test.ts` — PASS, 14 tests.
- `git diff --check`, `git diff --cached --check` — PASS; protected-path and all
  migration diffs against `ae0ed79` are empty.

A–O request coverage includes lot aggregation/partial shortage, empty modes,
optional ingredients, contextual/physical units, serving/count scaling, approved/
denied substitutions, family variants/deduplication and in-traversal budgets.
Additional coverage includes malformed/duplicate/household stock, expiry evidence,
required-before-optional reservation, numeric ranges, catalog drift/read failures,
transactional snapshots and unchanged persisted inventory events.

### Failed During Development / Corrected
- Initial lot/pack regression run failed collection because the new module did not
  yet exist; it was not two executed assertion failures. Both assertions now pass.
- D1 candidate fixture incorrectly assumed an empty seeded event table; now asserts
  exact before/after equality, retaining the read-only guarantee.
- `pnpm exec vitest run tests/unit/recipe-families.test.ts -t 'keeps contextual demands'`
  deliberately failed (1 failed / 13 skipped) before the contextual-slot identity
  fix. Its complete suite and all final gates passed after that fix.
- Earlier review fixes for D1 snapshot coherence, multiset requirement drift and
  stopping before extra family callbacks are retained with regression coverage.
- Nonfatal expected failure-injection/KV warnings and pinned Wrangler v3 warning;
  no unrelated dependency upgrades. Full evidence is in `CURRENT_STATE.md`.

### Not Run
- Hosted CI outcomes are not inferred from local gates; consult the linked T02 PR.
- Remote D1, production integrations, migration or manual deployment; not authorized.
- Browser/preview/UI verification; no UI/API behavior was changed.

## Known Issues
- Static/D1 catalogs are not synchronized; the new library does not change live
  `ALL_RECIPES`, cooking or Week readers. Legacy first/last-lot paths and old safety
  fallbacks still need explicit later integration, not an implicit T02 cutover.
- No package context, comprehensive nutrition/allergen/price catalog or whole-dish
  safety policy. Missing classifications/provenance cannot establish allergy safety.
- Substitutions use deterministic one-hop greedy allocation, not globally exhaustive
  assignment. No persisted registry, transitive chain or preference ranking.
- Family definitions do not supply cooking steps/times/cuisine; T02 does not invent
  them. Variant output is structured demand, not publication-ready instructions.
- T01 authoring schema/SQL differences, private user-recipe ownership and legacy
  date/condition APIs remain as documented in `DOMAIN_MODEL.md`.

## Protected / Do Not Touch
- PayOS, payments, billing, checkout, callbacks/webhooks, payment UI and migration 0018.
- Unrelated authentication, cookie/CSRF/session logic and production infrastructure.
- Household isolation, inventory commands/idempotency/optimistic versions,
  scan confirmation and Week dual-write/reconciliation behavior.

## Next Task
T03 — Ranking & Personalization (**READY**, not started)

## Next Exact Action
1. Start only as a separately authorized task. Read `AGENT_RULES.md`, required
   protocol docs and T03 packet; inspect `git status`, `git diff`, `git log --oneline -10`.
2. Read `RECIPE_ENGINE.md`, `candidates.ts`, `substitutions.ts`, existing preferences/
   feedback, legacy ranker/callers and candidate tests. Do not rebuild stock arithmetic.
3. Add a failing test using actual T02 output: full quantity coverage must not pass
   an explicit allergen conflict or an unprovable requested hard safety constraint.
4. Define eligibility before scoring; preserve unresolved/truncated/empty outcomes
   without unsafe fallback. Keep any legacy bridging explicit and reviewable.
5. T04 sequential depletion, T05 optimization and T06 integration remain separate.
