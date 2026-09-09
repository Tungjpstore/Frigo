# Frigo AI Handoff

## Current Task
T07 — final hardening, interrupted after baseline and during initial read-only review.

## Task Status
**T01–T05 COMPLETE. T06A COMPLETE. T06B COMPLETE. T07 IN PROGRESS / INTERRUPTED.**
The user explicitly stopped further audits/fixes on 2026-09-09. Do not resume
without renewed authorization. No T07 implementation, new regression or production
readiness conclusion exists. `T06B_WIP_HANDOFF.md` remains retired T06B history.

## T07 Interruption Recovery

Read **`T07_WIP_HANDOFF.md`** for complete zero-chat recovery and remaining work;
read `T07_BASELINE.md` for exact new baseline commands/results/timings. Published
WIP evidence: **`0f6c3824efa359e5b2e6938840ac2c40b06e7004`**. It adds only the
baseline receipt; this following checkpoint adds interruption handoff/state docs.
Resolve its hash with `git log -1 --format=%H -- docs/ai/T07_WIP_HANDOFF.md`.

At `6d4e873`, fresh full **1,390/79**, focused **722/32**, browser **88 named
assertions/12 phases**, lint/typecheck/build/migration smoke/local D1 apply/schema
gate all passed. No current failing executed check; no new T07 source was written.
Raw-path fan-out and non-atomic KV rate limiting are inspected limitations, not
fixed or newly reproduced exploits. Other audits are incomplete. Baseline green
does not mean T07 complete. **PayOS/payment touched: NO.**

The implementation/history details below preserve the completed T06B baseline;
they must not be read as T07 audit results.

## Dependency Baseline
T01–T05 complete; T05 `899b6d790b0902c93a17ba060437e3f9802e03e9`.
Verified T06A `c46330c61bc1bf3685508716a8ab10d72ec30b1e`.
Preserved T06B backend `1f7802f48b64c5998ccac28d532070a3721c07f9`, frontend
`08d90fa99ea032e20697744bdab64caa81056d9d`, interruption
`c5f86232f572b3194cdff5e0b8113dd254ab15fe`. Both requested ancestor checks passed.

## Repository / Branch Topology
Authorized workspace `https://github.com/sex-vn/Frigo.git`, branch
**`hoplite/lipara-d81160ee`**. It was provisioned clean at T02 `db09fa0`, then
fast-forwarded to verified T06B base
**`6d4e873b180e46edcaf8088f848b3afab853bc66`** from `hoplite/mende-90a2dbb1`.
T06B's continuation had begun at `c5f8623`; `hoplite/leukas-32474504` remains older
history. Neither old branch is the T07 publication target. No reset/rebase/source
discard occurred.

## Last Verified Commit
**`0fc78a4fdc624973413259c048e65ed585fa2b8e`**, final implementation, published.
Earlier continuation checkpoints `e178d04a04d3acb54d2e3fc8a3878577c5081467` and
`63aae9d9c2094951dd34e032cd0983ba7fcc48f8` are also published.

T07 reran the baseline on `6d4e873`, including the browser-only readiness-wait
follow-up documented below; application source remains identical to `0fc78a4`.
No final T07 application verification exists yet because implementation was not
started. The interrupted state is saved in the WIP/handoff checkpoints above.

## Implemented
- Reused all existing T06B APIs/client/components/preview/AI architecture rather
  than rebuilding. Read `FRONTEND_MEAL_PLANNER.md` for the source-grounded guide.
- Routes: `/planner`, `/planner/new`, `/planner/:planId`,
  `/planner/:planId/meal/:slotId`, `/planner/:planId/shopping`.
- API prefix `/api/v1/meal-planning/plans`: POST root; GET `/current`, `/:id`,
  `/:id/alternatives?revision=N`; POST `/:id/regenerate`, `/:id/swap`,
  `/:id/shopping`, `/:id/feedback`, `/:id/explanation`. See `API_INTEGRATION.md`.
- `/planner` discovers the server's latest authenticated creator-private plan or
  shows empty/setup state. It does not trust local cached plan content/references.
- Private creator+household persistence and revision CAS remain T06A-owned.
  Swap/regenerate receive complete new authoritative revisions. Cancellation before
  cache installation prevents late old GET delivery; shopping/alternatives are
  removed. Both mutation and alternatives 409s offer authoritative recovery.
- Owner/session reset clears transient state and retry keys. Per-operation tokens
  keep obsolete completions from unlocking a new session's action. Creation keys
  are retired only after confirmed success; exact ambiguous retries retain them.
- Weekly/meal cards disclose partial/no-proof/truncated outcomes, unresolved
  quantities, unknown nutrition and limited safety scope. All currently extracted
  public reason/status codes have intentional vi/en labels, with future fallback.
- Shopping uses revision-bound trusted results; exact money stays string/BigInt
  formatted. Known subtotal is not final total; four budget states remain distinct.
  No-option/no-proof/availability/optional demand are explicit, largest known costs
  do not compare missing prices, and surplus is never certain waste.
- Liked/disliked/cooked/skipped/swapped feedback receipts are supported. Cooked is
  annotation-only (`inventoryMutated:false`), not actual stock consumption.
- AI receives only locale and server-grounded reason IDs, and may reorder every
  permitted ID exactly once. It cannot change meals, facts or shopping. Strict
  output schema rejects invented/dropped IDs, prose/HTML and extra fields.
  Disabled/missing/unavailable/timed-out/malformed AI falls back deterministically.
  React text templates render safely; generated recipes remain deferred.
- English 375×812 and Vietnamese 390×844 browser flows exercise week/detail/swap/
  shopping/budget/stale/feedback with no critical horizontal overflow. Native Tab,
  Shift+Tab, Escape and dialog focus return are verified.

## In Progress
None in T06B. T07 is ready only for a separately authorized task.

## Remaining
Aggregate account/cross-plan rate-limit review, advanced optimizer package
preselection/temporal splitting and wider production security/performance review
remain T07. No full plan/revision/feedback history, live-provider certification,
reviewed retail/safety data provisioning, complete catalog translation or
AI-generated recipes are implied. Native provider timeout does not guarantee
cancellation. The safe DTO does not expose nutrient values/substitution traces;
the frontend must not invent them.

## Files Changed
Continuation source corrections are confined to planner setup/hook/meal/week/
shopping/presentation/copy. Added semantic component/reason tests, mounted hook
fixtures/tests, browser module/command matrix, jsdom 26.1.0 devDependency/lock and
frontend/verification guides. No Worker/API/core algorithm compatibility change.

## Database / Migration Changes
None during continuation. Existing migration 0022 stores private current plans,
source hashes, idempotent creation identity and cooked annotations. Local D1
0001–0022 apply and schema gates pass. No remote migration or production deployment.

## Tests / Verification
Verified code `0fc78a4`, all commands exit 0:
- `pnpm test`: **1,390 tests / 79 files PASS**, no skipped/failing tests.
- `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm check:migrations`: **PASS**.
- `pnpm exec wrangler d1 migrations apply frigo-db --local`: **PASS**.
- `pnpm schema:check:local`, `pnpm install --frozen-lockfile`: **PASS**.
- Frontend five-file focused command in `T06B_VERIFICATION.md`: **192 tests PASS**.
- Breakdown: unit-directory **1,015 / 55**, integration **358 / 23**, preview API
  **17 / 1**. Frontend = component 58 + reason 6 + client 24 + presentation 56 +
  mounted 48. Mounted = restoration 10 + revision/shopping races 15 + session 8 +
  generation 4 + mutation/feedback 11. T06B-specific suites **254 / 8**.
- Planning HTTP **69 / 2**, AI grounding/fallback unit **18 / 1**; subsets overlap.
- Native browser: `browser_cli` args `["batch","--bail"]`, stdin exact contents of
  `tests/e2e/planner-browser.commands.json`: **88 named assertions / 12 phase
  executions PASS** (44 each locale/viewport), not 88 Vitest cases.
- Real Worker browser happy/uncertainty/stale/conflict paths are separate from
  explicit mixed-JPY-price/429 frontend response fixtures. No fabricated provider
  success or production retail total is claimed.
- Logs under ignored `.hoplite/artifacts/t06b/`; portable counts, commands, scope
  and corrected failures are retained in `T06B_VERIFICATION.md`. No hosted CI or
  deployment result is claimed. Re-execute rather than relying on transferred logs.

### Failed / corrected
Original-hook control: 10 failed / 31 passed, now all 48 mounted tests pass.
Real native reverse-Tab and stale-alternatives retry regressions fixed. Successful
creation/retry identity is separately tested. Test-only unknown JSON typing,
loading-button selectors and vi grouping expectations corrected, not weakened.
The final browser waiter now waits for the alternatives alert's enabled retry
button rather than a retained earlier mutation alert while that query is pending.
Intermediate hot-reload errors are not final clean-browser evidence. Initial
platform setup/settings failure used the exact repository-owned workaround.
Full details and historical results are in `T06B_VERIFICATION.md`; 1,386 was an
intermediate count and must not be reported as final.

## Feature Flags / Rate Limits / Legacy Coexistence
UI `VITE_MEAL_PLANNER_ENABLED=true`; server `MEAL_PLANNER_ENABLED=true`; optional
AI `MEAL_PLANNER_AI_ENABLED=true`. All remain opt-in; no production cutover.
Existing expensive limit is 10/minute/account/path; reads/feedback 60. This is
best-effort, not atomic aggregate cross-plan quota. UI uses no automatic expensive
retry loop; 429 is localized. Legacy Week/recipes/shopping/cooking, household
inventory commands and Week dual-write/reconciliation remain intact.

## Environment / Preview
Node 24.19.0, sqlite3, frozen pnpm install. The tracked `.hoplite/settings.json`
setup/run commands are mirrored exactly in effective overrides because platform
settings discovery reported that file missing. Run uses
`node scripts/security-preview.mjs`, managed port 3000, isolated in-memory SQLite
API 8787; `/__preview` reset/login issues a real synthetic registered session.
No external provider network or production credentials/data are used. Never point
fixture controls at persistent data. See `T06B_E2E.md` for replay and reset details.

## Protected Areas
**PayOS/payment code untouched.** No T02–T05 core algorithm reimplementation,
T06A trust weakening, unrelated auth or production infrastructure change.
Frontend does not calculate authoritative shortages/totals; AI is not authoritative;
plan generation does not mutate inventory; shopping does not execute a purchase.

## Next Exact Action
Stay stopped until renewed authorization. Then fetch `hoplite/lipara-d81160ee`,
run `git status --short`, `git rev-parse HEAD` and
`git merge-base --is-ancestor 0f6c3824efa359e5b2e6938840ac2c40b06e7004 HEAD`.
Read `T07_WIP_HANDOFF.md` and its exact next actions before resuming the inventory
or limiter reproducer. Do not reset to an older checkpoint, start new features,
enable production flags, deploy, migrate remotely or change PayOS.
