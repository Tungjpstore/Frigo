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
failure is retained in `recovery-typecheck.log`. Recovery commit is the next
append-only commit; its exact SHA will be recorded by the following checkpoint.

- **A1 recovery published:** `9f420c05cf3adf48825f2645bcdc5accf36ac4b4`.
- **A2/A3 combined backend checkpoint in progress:** coherent trusted preload,
  strict API schemas/DTOs, minimal current-plan persistence (0022), generate/get,
  regenerate/swap/shopping/feedback routes. `API_INTEGRATION.md` describes exact
  contracts and limitations. `pnpm typecheck` PASS; focused 51 tests / 5 files PASS;
  `pnpm lint` and `pnpm build` PASS. Full test initially 1127 passed / 1 failed:
  foundation test's last migration assertion still expected 0021. Updated to 0022
  because this task intentionally appends that migration; rerun pending.
- Initial HTTP suite found nullable `openedAt` incompatibility in the new persisted
  T05 projection; corrected with a regression. Initial assertions/fixtures were
  corrected to use `totalCost`, scoped stock and genuinely underflowing quantities;
  no engine assertions/constraints were weakened. The final HTTP suite is 34 PASS.
- Checkpoint full rerun: `pnpm test` **1128 / 71 PASS**. `pnpm check:migrations`,
  `pnpm exec wrangler d1 migrations apply frigo-db --local` (no pending migrations),
  `pnpm schema:check:local` PASS. `git diff --check` PASS. The test shell tool lost
  its result record; complete PASS log and no remaining Vitest process were checked
  read-only rather than blindly rerunning. Review/documentation readiness pending.

## Next exact action

Commit/publish verified recovery, then implement typed intent/DTO contracts,
server-owned context and minimal revisioned final-plan persistence. Reuse T02–T05,
existing auth/CSRF/household authorization/rate limits. No UI/AI/payment expansion.

## T06B recovery material

`src/web/lib/queryKeys.ts` scoped planner keys and
`src/web/components/layout/AppLayout.tsx` planner exclusion remain. Pages and web
service were never published; do not claim their historical test results apply.
The old ADR-016 presentation portion belongs to T06B, not this task.
