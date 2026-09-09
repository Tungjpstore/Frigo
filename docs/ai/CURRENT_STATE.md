# Frigo current state — T06B product integration

## Active continuation (2026-09-09)

T06B has resumed from exact clean `c5f86232f572b3194cdff5e0b8113dd254ab15fe`
on authorized workspace `sex-vn/Frigo`, branch `hoplite/mende-90a2dbb1`.
Both T06A and WIP ancestor checks pass. No reset or source replacement occurred.
Baseline focused client/presentation: 80 tests / 2 files PASS; typecheck/lint PASS.
Fresh API/AI/persistence/preview integration: 110 tests / 5 files PASS.
Repository-owned native-browser replay now covers happy, uncertainty, all feedback,
stale/revision recovery, reload, mixed-price/429 fixtures and mobile keyboard flows.
The native dialog failed Shift+Tab containment; a small planner-only focus wrap
now passes. Component/reason/race work and final exact-tree gates are ongoing.
**T06B remains IN PROGRESS; T07 is not yet ready.** Historical interruption below
is superseded for active status, not erased as earlier evidence.

## Current task

**T06A COMPLETE; T06B IN PROGRESS / INTERRUPTED. T07 BLOCKED.**
The user stopped implementation on 2026-09-09 for account/agent handoff. Read
`T06B_WIP_HANDOFF.md` first: published backend slice `1f7802f`, preserved/published
frontend/client/preview/test WIP `08d90fa`. All required source was captured,
including new files. No T06B completion or final integrated gate success is claimed.
Scoped checks: 93 backend tests and 17 preview API tests pass; frontend delegate
reported 129 tests/4 files (exact invocation not retained). Earlier T06B typecheck,
lint/build passed, but all final gates require rerun. Browser verified only login,
empty state, real seven-day generation and Vietnamese mobile week layout.
Preflight: clean `9ec7b68`, verified `c46330c` ancestry, no missing/untracked T06A
source. Existing planner query keys/layout exclusion reused; absent historical
pages are not treated as working implementations. T06B adds opt-in React routes,
typed cookie API client, exact localized presentation, current-plan restoration,
revisioned actions, shopping and grounded optional explanations. ADR-018 records
the minimal compatible discovery/choice endpoints. Initial integrated typecheck
found two unused React imports; corrected before checkpoint verification. Remaining browser flows and final gates are pending; do not infer T06B completion
from the historical T06A checks below.

T01–T05 remain COMPLETE; T07 is blocked by T06B. This replaces the interrupted combined
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
- Non-cooked feedback INSERT and replay are atomically plan/revision/member-fenced;
  concurrent exact retries share one durable event/receipt. Malformed budget strings
  return 422 rather than reaching an unsafe BigInt conversion.

## Current verification

- Recovery: `pnpm typecheck`, `pnpm build`, `pnpm test` PASS (1077 / 66).
- Final hardening: `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm test` PASS:
  **1136 tests / 71 files**, including **42 HTTP tests**.
- Independent review: `pnpm exec vitest run tests/integration/meal-planning-http.test.ts tests/integration/meal-planning-persistence.test.ts`:
  **48 tests / 2 files PASS**. Feedback-race fix verified; no remaining blocking finding.
- Initial backend full test: 1127 passed / 1 failed (last-migration assertion expected
  0021). Updated expected applied head to 0022, not weakened schema coverage;
  pre-hardening rerun PASS: **1128 tests / 71 files**.
- `pnpm check:migrations`, `pnpm exec wrangler d1 migrations apply frigo-db --local`
  (no pending migrations), `pnpm schema:check:local`: PASS, schema 0001–0022.
- Initial HTTP failures exposed new codec nullability for `openedAt`; fixed and
  regressed. Test fixture/field assumptions corrected without relaxing engines.
- Review reproduced stale feedback after concurrent regeneration (200 instead of
  409); atomic INSERT and scoped replay now pass. Current-time history checks are
  intentionally retained to catch later feedback; a new HTTP regression proves it.
- Final typecheck initially caught a test-only unknown-JSON property access (TS2571);
  retained the assertion using `toMatchObject`, then reran all gates successfully.
- Logs: ignored `.hoplite/artifacts/t06a/`. No hosted CI, browser/UI, remote migration
  or production deployment verification is claimed.

## Known limitations and compatibility

`API_INTEGRATION.md` is the exact T06B contract; ADR-017 supersedes ADR-016's combined
scope. Default reviewed retail catalog is empty, so costs remain unknown rather
than using legacy/OCR guesses. No reviewed safety/substitution registry is fabricated;
active hard safety restrictions without reviewed evidence fail closed. Typed T03
preferences are separate from legacy free-form settings; no implicit import occurs.
T06B adds private current-plan discovery, bounded non-eligibility catalog choices,
grounded explanations and the unfinished frontend described in `T06B_WIP_HANDOFF.md`.
No plan-list/history API, annotation-list UX, stock acceptance, global atomic quota
or production cutover is supplied.

Legacy Week/recipe/shopping/cooking, household command semantics and PayOS/payment
code remain untouched. Recovery removed broken frontend references; the new opt-in T06B implementation
reuses its surviving query keys and layout exclusion without changing Week default.

## Environment and next action

Managed setup/settings tools misreported tracked settings absent and rejected setup
claim. Executed the existing repository-owned sqlite3 install and
`pnpm install --frozen-lockfile` via shell successfully; platform issue reported.
No unrelated setup or production configuration change. Node 24.19.0.

A2/A3 backend `ca60ced703efc7e1720f885addf551c0ff8b6f51` and final verified hardening
`c46330c61bc1bf3685508716a8ab10d72ec30b1e` are published. This documentation-only
checkpoint records that verified implementation SHA, not its own future hash.
Next, when authorized to resume: open `T06B_WIP_HANDOFF.md` and run the two explicit
frontend unit suites in its first action before adding UI. T06B remains interrupted;
T07 and deployment/remote migration are not authorized by this preservation step.
