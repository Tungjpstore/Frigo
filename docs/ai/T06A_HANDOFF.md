# T06A durable work log

## Base and recovery

- Authorized remote: `arsvn-vn/Frigo`; branch `hoplite/leukas-32474504`.
- Initial checkout: clean `db09fa0`; published dependency history fetched and
  fast-forwarded without rewriting T01–T05.
- T05: `899b6d790b0902c93a17ba060437e3f9802e03e9`.
- Partial T06: `84251cc0b4cf5ced9f62b430b74418a14d2c438c`, direct child of T05.
- Case C: typecheck exit 2 with absent `meal-planning` DB/Worker/web modules,
  domain API/presentation modules, AI presentation provider and four planner pages.
  No new source/test/migration files were present in the partial commit.
- Recovery removes dangling hooks rather than inventing T06B. Query keys and
  layout exclusion survive; the historical diff preserves all removed hooks.
- No backend feature expansion before this decision was recorded.

## Checkpoints

Recovery checks PASS: `pnpm typecheck`, `pnpm build`, `pnpm test` (**1077 tests /
66 files**). Logs under ignored `.hoplite/artifacts/t06a/`. Initial typecheck
failure is retained in `recovery-typecheck.log`. History is append-only.

- **A1 recovery published:** `9f420c05cf3adf48825f2645bcdc5accf36ac4b4`.
- **A2/A3 backend published:** `ca60ced703efc7e1720f885addf551c0ff8b6f51`.
- **A4 final hardening published:** `c46330c61bc1bf3685508716a8ab10d72ec30b1e`.
  This following docs-only checkpoint records that verified implementation SHA.
- **A2/A3 combined backend delivered:** coherent trusted preload,
  strict API schemas/DTOs, minimal current-plan persistence (0022), generate/get,
  regenerate/swap/shopping/feedback routes. `API_INTEGRATION.md` describes exact
  contracts and limitations. `pnpm typecheck` PASS; focused 51 tests / 5 files PASS;
  `pnpm lint` and `pnpm build` PASS. Full test initially 1127 passed / 1 failed:
  foundation test's last migration assertion still expected 0021. Updated to 0022
  because this task intentionally appends that migration; rerun passed below.
- Initial HTTP suite found nullable `openedAt` incompatibility in the new persisted
  T05 projection; corrected with a regression. Initial assertions/fixtures were
  corrected to use `totalCost`, scoped stock and genuinely underflowing quantities;
  no engine assertions/constraints were weakened. The final HTTP suite is 34 PASS.
- Checkpoint full rerun: `pnpm test` **1128 / 71 PASS**. `pnpm check:migrations`,
  `pnpm exec wrangler d1 migrations apply frigo-db --local` (no pending migrations),
  `pnpm schema:check:local` PASS. `git diff --check` PASS. The test shell tool lost
  its result record; complete PASS log and no remaining Vitest process were checked
  read-only rather than blindly rerunning. Final review/gates are recorded below.
- Independent review found a stale-feedback race: revision could advance between
  the service check and T03 event INSERT. Reproduced with an actual concurrent
  regeneration (HTTP returned 200 instead of 409), then fixed with a plan/revision/
  membership-guarded INSERT. All 35 HTTP tests PASS after the fix. Added an explicit
  concurrent exact-feedback replay regression. Final gate rerun passed below.
- **A4 hardening verified:** plan/revision/member-fenced feedback INSERT and replay;
  safe malformed-budget validation; HTTP coverage of later feedback making history
  stale. Keep current-time history windows: freezing the upper cutoff at generation
  would incorrectly hide new feedback/cooked events. No freshness algorithm change.
- Final `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm test`: **PASS, 1136 tests /
  71 files**, including **42 HTTP tests**. `pnpm check:migrations`,
  `pnpm exec wrangler d1 migrations apply frigo-db --local` (no pending migrations),
  `pnpm schema:check:local`, `git diff --check`: **PASS**. Logs: `final-*.log`.
- Final typecheck initially failed TS2571 in the new malformed-budget assertion;
  `toMatchObject` preserves the same assertion without reading a property of unknown
  JSON. All final gates reran after this test-only correction.
- Independent final review ran `pnpm exec vitest run tests/integration/meal-planning-http.test.ts tests/integration/meal-planning-persistence.test.ts`:
  **48 tests / 2 files PASS**, including stale-feedback race, exact concurrent replay
  and later-history freshness. No blocking review finding remains. Per-plan-path
  rate-limit buckets remain documented T07 follow-up, not an aggregate quota claim.
- Final acceptance audit: source intent-only validation, auth/CSRF/owner fencing,
  cross-household/private-member IDOR, CAS stale writes, full downstream swap replay,
  unknown prices/domain results, exact Money/Quantity DTOs, feedback isolation and
  unchanged real inventory covered. T02–T05 core algorithms and protected areas
  unchanged; no untracked required source/test files. No remote migration, hosted
  CI, browser/UI verification or production deployment claimed.

## Next exact action

**T06A COMPLETE — T06B READY.** All implementation checkpoints are published.
Separately authorize T06B; start with shared
domain DTO schemas and `API_INTEGRATION.md`, cookie HTTP transport and explicit
partial/unknown/stale states. No UI/AI/payment expansion is part of T06A.

## T06B recovery material

`src/web/lib/queryKeys.ts` scoped planner keys and
`src/web/components/layout/AppLayout.tsx` planner exclusion remain. Pages and web
service were never published; do not claim their historical test results apply.
The old ADR-016 presentation portion belongs to T06B, not this task.
