# Frigo current state — T06A backend integration

## Current task

**T06A IN PROGRESS**. T01–T05 remain COMPLETE; T06B is blocked until final backend
verification/review. T07 is blocked by T06B. This replaces the interrupted combined
T06 progress claims, which referred to source files that were never published.

## Recovery and repository identity

Authorized remote: `https://github.com/arsvn-vn/Frigo.git`; thread branch
`hoplite/leukas-32474504`. Initial checkout was clean T02 `db09fa0`. The published
history was fetched through the trusted broker and fast-forwarded without rewriting
T01–T05. T05 checkpoint: `899b6d790b0902c93a17ba060437e3f9802e03e9`.
Partial T06: `84251cc0b4cf5ced9f62b430b74418a14d2c438c`, its direct child. No newer
descendant was found on the fetched published task branches. Both are ancestors.

**Case C**: `pnpm typecheck` at 84251cc failed exit 2, missing DB/domain/AI/Worker/web
modules and four planner pages plus cascading type errors. Its 15-file diff added
only references/docs; no new implementation, migration or test files were committed.
Recovery removed dangling hooks, missing-page routes and dead navigation, retaining
nonblocking scoped query keys/layout exclusion, valid projection export and flags.
AI/presentation and absent frontend implementations are deferred, not reconstructed.
Recovery `9f420c05cf3adf48825f2645bcdc5accf36ac4b4` is committed and published.
Fresh recovery typecheck/build and 1077 tests / 66 files passed.

## Implemented backend checkpoint

- Strict frontend-safe request/response schemas: `domain/src/meal-planning-api.ts`
  and `meal-shopping-api.ts`. Exact decimal quantity strings, minor-unit money,
  explicit partial/incomplete/search proof/unknown-cost states.
- One D1 batch for authorized inventory, catalog, typed household/member T03
  preferences/history, bulk nutrition and instructions; existing readers retain
  wrappers. No database I/O inside deterministic engine search.
- `MealPlanningApplicationService` creates only server-owned contexts, invokes T04
  once per generation/replan (which composes T02/T03), stores final state and calls
  T05 only for explicit shopping requests. No engine algorithm is reimplemented.
- Generate/get/regenerate/swap/shopping/feedback under opt-in
  `/api/v1/meal-planning/plans`. Existing cookie/CSRF/tenancy/rate limits, strict
  schemas, registered-member checks and sanitized errors; no client authority.
- Migration 0022: private creator/household current-plan row, source hashes, scoped
  creation retry identity, atomic revision CAS, cooked annotations and membership
  cascades. No duplicate Week storage, search frontiers or actual stock commands.
- Full sequential swap replanning, server-validated source/version locks, rejected
  unsafe swaps leave the plan unchanged. Shopping checks revision/source freshness
  and uses schema-validated persisted T04 projection plus a server-only provider.
- SHA-256 source comparisons detect inventory/preferences/catalog/history changes;
  time-elapsed plans require revalidation. These are as-of snapshots, not stock
  reservations or future consumption authority.
- Feedback identity/time/scope are server-established. Cooked is annotation-only;
  real cooked history and inventory remain untouched. No purchase/payment exists.

## Current verification

- Recovery: `pnpm typecheck`, `pnpm build`, `pnpm test` PASS (1077 / 66).
- Backend: `pnpm typecheck`, `pnpm lint`, `pnpm build` PASS.
- `pnpm exec vitest run tests/integration/meal-planning-http.test.ts tests/integration/meal-planning-persistence.test.ts tests/integration/meal-planning-snapshot.test.ts tests/unit/shopping-plan-snapshot.test.ts tests/unit/meal-shopping-dto.test.ts`: **51 tests / 5 files PASS**.
- Initial backend full test: 1127 passed / 1 failed (last-migration assertion expected
  0021). Updated expected applied head to 0022, not weakened schema coverage; final
  full rerun PASS: **1128 tests / 71 files**. Independent review remains pending.
- `pnpm check:migrations`, `pnpm exec wrangler d1 migrations apply frigo-db --local`
  (no pending migrations), `pnpm schema:check:local`: PASS, schema 0001–0022.
- Initial HTTP failures exposed new codec nullability for `openedAt`; fixed and
  regressed. Test fixture/field assumptions corrected without relaxing engines.
- Logs: ignored `.hoplite/artifacts/t06a/`. No hosted CI, browser/UI, remote migration
  or production deployment verification is claimed.

## Known limitations and compatibility

`API_INTEGRATION.md` is the exact T06B contract; ADR-017 supersedes ADR-016's combined
scope. Default reviewed retail catalog is empty, so costs remain unknown rather
than using legacy/OCR guesses. No reviewed safety/substitution registry is fabricated;
active hard safety restrictions without reviewed evidence fail closed. Typed T03
preferences are separate from legacy free-form settings; no implicit import occurs.
No candidate-browser or plan-list/history API, annotation-list UX, stock acceptance,
AI explanation, frontend implementation, global atomic quota or production cutover.

Legacy Week/recipe/shopping/cooking, household command semantics and PayOS/payment
code remain untouched. Recovery's only frontend edits remove broken references;
`queryKeys.ts` planner keys and `AppLayout.tsx` exclusion survive for T06B.

## Environment and next action

Managed setup/settings tools misreported tracked settings absent and rejected setup
claim. Executed the existing repository-owned sqlite3 install and
`pnpm install --frozen-lockfile` via shell successfully; platform issue reported.
No unrelated setup or production configuration change. Node 24.19.0.

Finish review and full gates, publish the coherent A2/A3 backend checkpoint, then
finalize docs and T06B readiness. Exact checkpoint log: `T06A_HANDOFF.md`.
