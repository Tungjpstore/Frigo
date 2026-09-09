# T07 baseline and interruption checkpoint

Recorded 2026-09-09. **T07 IN PROGRESS / INTERRUPTED.** The user stopped work
after baseline verification and during initial read-only review. No T07
application, test, migration, dependency, configuration or payment changes were
made. This is a recoverable audit checkpoint, not a production-readiness report.

## Verified Git identity

- Authorized repository: `https://github.com/sex-vn/Frigo.git`. The original
  request named `tun-vn/Frigo`; the configured repository and existing T06B handoff
  both identify `sex-vn/Frigo`. No remote was changed or bypassed.
- Thread branch: `hoplite/lipara-d81160ee`.
- Provisioned starting HEAD: `db09fa0c4353ddf4840e04c10b96a33240de3497`, the T02
  merge, with a clean worktree. It was not the requested T06B implementation.
- Fetched `hoplite/mende-90a2dbb1` through the repository-bound Git broker:
  **`6d4e873b180e46edcaf8088f848b3afab853bc66`**.
- Verified T06B application checkpoint:
  **`0fc78a4fdc624973413259c048e65ed585fa2b8e`**.
- Both `git merge-base --is-ancestor 0fc78a4 origin/hoplite/mende-90a2dbb1`
  and the old checkout-to-continuation ancestor check returned 0. The existing
  thread branch was then fast-forwarded with
  `git merge --ff-only origin/hoplite/mende-90a2dbb1`; no reset, rebase or source
  discard occurred.
- After the fast-forward, `git merge-base --is-ancestor 0fc78a4 HEAD` returned 0.
  `git diff --name-only 0fc78a4 HEAD -- src packages migrations package.json
  pnpm-lock.yaml .hoplite` was empty.
- The initial ancestry attempt before fetching returned exit 128 because the
  T06B objects were absent locally. Fetch resolved that preflight issue; it was
  not a code/test failure.

### Commits after the application checkpoint, before T07

| Commit | Actual changes |
| --- | --- |
| `14f5186e539a53d7e535255d41f6ab70c2696f2a` | T06B state, handoff, verification and historical WIP documentation only |
| `6d4e873b180e46edcaf8088f848b3afab853bc66` | `tests/e2e/planner-browser.mjs` waits for the alternatives-specific recovery action; two handoff/verification docs |

Neither commit changes application source, migrations, dependencies or runtime
configuration. T07 had no commits or modified/untracked files when interrupted.

## Unchanged baseline verification

All commands below ran on **`6d4e873b180e46edcaf8088f848b3afab853bc66`**, before
any T07 tracked-file edit. Node **v24.19.0**, pnpm **10.26.0**, sqlite3 installed.
`pnpm install --frozen-lockfile` passed after fetching T06B; it installed the
already-committed jsdom dependency without changing the manifest/lockfile.

| Exact command | Result | Observed wall time |
| --- | --- | --- |
| `pnpm test` | PASS, **1,390 tests / 79 files**; Vitest duration 59.75 s | 61 s |
| `pnpm lint` | PASS, exit 0 | 5 s |
| `pnpm typecheck` | PASS, web/packages/tests and Worker, exit 0 | 15 s |
| `pnpm build` | PASS, Vite client and Worker TypeScript; Vite 5.65 s | 11 s |
| `pnpm check:migrations` | PASS, `migration-smoke=ok` | 1 s |
| `pnpm exec wrangler d1 migrations apply frigo-db --local` | PASS, migrations 0001–0022 applied locally | 7 s |
| `pnpm schema:check:local` | PASS, required ledger/schema/guards/FKs | 3 s |

Timings are observations from this shared sandbox, not performance budgets or
CI assertions. Expected failure-injection/KV-degradation warnings appeared in
tests. Wrangler 3 printed its existing upgrade warning. pnpm reported ignored
dependency build scripts; all listed gates nevertheless passed without dependency
or configuration changes. No remote D1 operation or deployment occurred.

### Focused T02–T06B and preview API baseline

Executed exactly:

```sh
pnpm exec vitest run tests/unit/quantity.test.ts tests/unit/ingredient-availability.test.ts tests/unit/recipe-candidates.test.ts tests/unit/recipe-families.test.ts tests/integration/recipe-candidates.test.ts tests/integration/recipe-catalog.test.ts recipe-ranking recipe-personalization ranking-nutrition planner-contract planner-inventory planner-nutrition weekly-planner shopping-catalog shopping-hardening shopping-optimizer shopping-plan-snapshot shopping-search meal-planning meal-shopping-dto planner-hook planner-presentation planner-reason-coverage planner-ui planner-preview
```

**PASS: 722 tests / 32 files**, exit 0, wall time 27 s; Vitest duration 25.70 s.
This overlaps the full suite; do not add these counts together. It includes the
existing real-Worker preview API suite, not just unit helpers. No T07 regression
test had been added.

### Browser baseline

Started the managed preview using the existing
`node scripts/security-preview.mjs` command, port 3000. It serves the real Vite
app/Hono routes over synthetic in-memory SQLite and registered cookie sessions;
backend external fetches are blocked. No production identity/data/provider was
used. `preview_start(name="default")` initially reported that named port was not
configured; selecting the default target succeeded without a configuration edit.

Opened `http://127.0.0.1:3000/__preview` in the canonical managed browser. Executed
the complete contents of `tests/e2e/planner-browser.commands.json` as finite stdin
to `browser_cli` with `args: ["batch", "--bail"]`.

**PASS: 88 named browser assertions / 12 phase executions**, 44 per locale:
English **375×812**, Vietnamese **390×844**. Per locale: real-worker happy/
uncertainty/stale flow 30; navigation restoration 2; frontend response fixtures 5;
real revision conflict 2; alternatives revision conflict 2; native keyboard 3.
Native Shift+Tab, Tab and Escape were exercised. `browser_errors` returned an
empty errors array. These are browser assertions, not 88 Vitest test cases.

Happy/stale/conflict flows use real Worker/SQLite/T02–T05 behavior. Mixed JPY
subtotal/unknown-item presentation and 429 use the existing explicitly labeled
frontend response fixtures; they do not prove a live retailer or provider.
Desktop and a full locale-by-viewport cross-product were **not** run. No T07
screenshot/video was captured. The preview may require restarting in a fresh
workspace; a running process is not a durable artifact.

## Initial review preserved at interruption

These are code locations and partial observations, **not completed T07 audit
certification**. Four delegated read-only reviews had not delivered accepted
results when the user stopped work. None was authorized to edit or commit.

| Surface | Inspected locations / established baseline |
| --- | --- |
| Planner API | `src/worker/routes/meal-planning.ts`: registered-user/feature/tenancy gates, no-store, 64 KiB body limit, strict route schemas, sanitized service failures |
| Request/DTO contracts | `packages/domain/src/meal-planning-api.ts`: 14-day/42-slot/20-serving intent caps; strict regenerate/swap/shopping/feedback bodies; bounded budget intent separate from prices |
| Frontend transport | `src/web/services/{http,meal-planning}.ts`: cookies, owner expectations, private-session acceptance checks, parsed planner DTOs, no automatic mutation retry loop |
| Private state | `src/web/lib/{queryKeys,private-session}.ts`, `features/planner/usePlanner.ts`, `pages/PlannerPage.tsx`: user+household keys, reset generation, mutation gate, cancellation before replacement, revision-keyed child views |
| Planner views | `Planner{Setup,Week,Meal,Shopping}.tsx`, `intent.ts`, `presentation.ts`: explicit actions, real full-revision replacement, text rendering, BigInt money formatting, no authoritative browser optimizer |
| AI | `src/worker/services/meal-planning-explanation.ts`, existing AI unit tests: locale/reason IDs only, strict permutation output, one native call, 256 tokens, 2500 ms response wait, deterministic fallback |
| Rate limiting | `src/worker/middleware/rate-limit.ts`, planner routes: authenticated account + raw request path in each key, KV get/put, isolate-local degraded fallback; see unfinished audit in WIP handoff |
| CI/release boundary | Read `.github/workflows/{ci,deploy}.yml`: this topic-branch push alone does not trigger CI; PRs targeting main/master do. No workflow dispatch, deployment or PR was created. |

No raw HTML rendering pattern was found in the inspected new planner feature,
PlannerPage or planner client. That is not a completed app-wide XSS audit. Existing
tests passed; no new adversarial T07 proof or fix had been produced. Baseline
Vite output reported PlannerPage **80.61 kB / 23.78 kB gzip**; no endpoint latency,
query-count, payload-size, EXPLAIN or optimizer benchmark was measured.

## Evidence retention and limits

The workspace retains ignored raw logs at `.hoplite/artifacts/t07/baseline/`:
`results.txt`, `test.log`, `lint.log`, `typecheck.log`, `build.log`,
`migrations.log`, `d1-apply.log`, `schema.log`, `focused.log`. They are generated
local artifacts, not required source and not guaranteed to survive a fresh clone.
All essential commands, counts, results and limitations are recorded above.

The first attempted inline Python gate runner was rejected by platform command
policy before execution. The ordinary shell runner recorded above was used
instead. This was not a repository test failure.

**PayOS/payment touched: NO.** At interruption the diff from the T06B base was
empty. Only preservation documentation follows. Continue only on renewed user
authorization and use `T07_WIP_HANDOFF.md` for precise remaining work.
