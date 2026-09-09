# Release candidate — existing PR #8

## Status and scope

**T01–T07 ENGINEERING COMPLETE.**
**RELEASE INTEGRATION IN PROGRESS.**
**PRODUCTION DEPLOYMENT NOT PERFORMED.**

All frozen-source local and hosted-source gates are green. The remaining release
gate is publication and successful validation of the documentation head on PR #8;
do not treat the prior source-head check as the new documentation-head check.

This continues the existing release PR, not another integration or product change.
Application, tests, migrations, dependencies, scripts and config remain frozen.
No integration source fix has been required. Results below are fresh release
checks on 2026-09-09, not reused historical T07 test results.

## Immutable identity and preserved lineage

| Item | Verified identity |
| --- | --- |
| Existing draft PR | [#8 — Release: consolidate complete T01–T07 lineage onto main](https://github.com/vn-2c/Frigo/pull/8) |
| Release branch | `hoplite/kirrha-5f4057f0` |
| Main base, unchanged from PR creation | `db09fa0c4353ddf4840e04c10b96a33240de3497` |
| T07 source / release source candidate | `0b20061e7dc7405df68b18a18da4166e09494ecd` |
| Last application/test commit | `f9d2ff871da155ba7f1aaedd3112a5ed6ea8d2c0` |
| Release integration changes | Documentation only, after the source candidate |

The supplied historical repository name was `fri-go/Frigo`; the configured remote
and live provider identify this existing PR as `vn-2c/Frigo`. No remote was changed.
The new workspace initially named the same source object
`hoplite/koroneia-355b17d0`; it was switched to the **existing** release branch.
No new release branch, reset, squash, rebase, cherry-pick or replacement PR.

The trusted broker fetched only `main` and `hoplite/kirrha-5f4057f0` (the authorized
explicit-ref equivalent of the requested broad fetch). Both matched the supplied
SHAs. Branch/HEAD/status, `git log --oneline -15`, and the T07 ancestor check passed;
the tree was clean. Main had not changed, so integration topology was not redone.
The established 0-independent-main / 34-additional-T07-commit relationship remains
applicable to the frozen source; later release documentation adds commits only.

Complete T01–T07 ancestry is retained, including T01/T02 already merged in main:

| Task | Preserved checkpoints |
| --- | --- |
| T01 foundation/hardening | `a730da8`, merged by `ae0ed79` |
| T02 recipe engine | `0051276`, `ef13acd`, merged by main `db09fa0` |
| T03 ranking | `01f9d87`, `3592de9` |
| T04 planner | `a687a63`, `d7dff8f`, `ebd538b` |
| T05 shopping | `4f3f539`, `899b6d7`, `84251cc` |
| T06A HTTP/trust | `9f420c0`, `ca60ced`, `c46330c` |
| T06B frontend | `1f7802f`, `0fc78a4`, `6d4e873` |
| T07 recovery and final hardening | `006742b`, `f391804`, H1–H6 `65c1367` through `f9d2ff8`, final receipt `0b20061` |

`git diff --exit-code f9d2ff871da155ba7f1aaedd3112a5ed6ea8d2c0
0b20061e7dc7405df68b18a18da4166e09494ecd -- . ':!docs/ai/**'` passed.
Documentation checkpoints cannot contain their own commit SHA; the immutable
source identity above is the verification anchor and the PR supplies the live head.

## Fresh local verification

Runtime: Node **24.19.0**, pnpm **10.26.0**, Vitest **3.2.7**, SQLite CLI **3.45.1**,
locked Wrangler **3.114.17**. Shared-sandbox timings are observations, not capacity
benchmarks. Focused and adjacent checks overlap the full suite; do not add counts.

| Exact command | Result | Duration |
| --- | --- | --- |
| `pnpm install --frozen-lockfile` | PASS; lockfile unchanged | pnpm 14.1 s |
| `pnpm test` | **1,487 tests / 87 files PASS; 0 failures** | Vitest 140.36 s; wall 141.834 s |
| Focused command below | **819 tests / 40 files PASS; 0 failures** | Vitest 56.48 s; wall 59.555 s |
| Payment-adjacent command below | **82 tests / 7 files PASS; 0 failures** | Vitest 9.83 s; wall 13.006 s |
| `pnpm lint` | PASS | wall 10.682 s |
| `pnpm typecheck` | PASS, both targets | wall 33.524 s |
| `pnpm build` | PASS, ordinary flag-off Vite/Worker build | Vite 11.32 s; wall 22.997 s |

Focused coverage, partitioned by test file within that single fresh run:

| Critical area | Tests / files |
| --- | ---: |
| T02 recipe/quantity/availability/catalog | 107 / 6 |
| T03 ranking/personalization/nutrition | 76 / 3 |
| T04 planner/contracts/inventory/nutrition | 73 / 5 |
| T05 shopping/catalog/search/proof | 156 / 6 |
| T06A HTTP/trust/persistence/snapshot/DTO | 56 / 4 |
| T06B mounted frontend/client/presentation/preview | 254 / 8 |
| T07 security/concurrency/abuse/domain/AI/operations | 97 / 8 |

```sh
pnpm exec vitest run tests/unit/quantity.test.ts tests/unit/ingredient-availability.test.ts tests/unit/recipe-candidates.test.ts tests/unit/recipe-families.test.ts tests/integration/recipe-candidates.test.ts tests/integration/recipe-catalog.test.ts recipe-ranking recipe-personalization ranking-nutrition planner-contract planner-inventory planner-nutrition weekly-planner shopping-catalog shopping-hardening shopping-optimizer shopping-plan-snapshot shopping-search meal-planning meal-shopping-dto planner-hook planner-presentation planner-reason-coverage planner-ui planner-preview t07

pnpm exec vitest run tests/integration/auth-me-quota.test.ts tests/integration/scan-quota-idempotency.test.ts tests/unit/config-validation.test.ts tests/unit/health.test.ts tests/unit/rate-limit.test.ts tests/unit/t07-rate-limit.test.ts tests/integration/t07-rate-limit.test.ts
```

Deliberately injected KV/config/queue/database failures emit warnings/errors in
passing negative tests; these are not failing checks. No test assertion was changed.
Logs are ignored under `.hoplite/artifacts/release/`; this tracked receipt preserves
commands, counts and limitations without committing transient output.

## Migration verification

**PASS: clean local apply, populated upgrade and schema gate.** Main already
includes 0001–0020; the release adds only **0021 and 0022**. All 0001–0020 files
were compared byte-for-byte against main; existing payment migration 0018 is
unchanged. No prior `.wrangler/state` existed. No remote D1 operation ran.

| Exact command / operation | Result | Wall time |
| --- | --- | ---: |
| `pnpm check:migrations` | PASS, `migration-smoke=ok` | 0.666 s |
| `pnpm wrangler d1 migrations apply frigo-db --local` | PASS, clean **22/22**, 0001–0022 | 11.844 s |
| `pnpm schema:check:local` | PASS, zero schema/ledger/FK issues | 2.642 s |
| `pnpm test tests/integration/recipe-foundation.test.ts tests/integration/foundation-hardening.test.ts` | PASS, **22 tests / 2 files**, zero failures; Vitest 3.16 s | 4.626 s |
| Staged actual-main local D1 **0020 → 0022** apply | PASS, 2/2 pending migrations | 3.019 s |
| Existing schema-gate SQL on upgraded local D1 | PASS, `success: true`, `results: []` | 2.587 s |

Local-only commands used `CI=1 WRANGLER_SEND_METRICS=false`, unset Cloudflare
credential variables without reading values, and passed `--local` explicitly.
The staged verifier used an ignored local Wrangler config and separate
`--persist-to` directory, not production bindings. Existing fixtures came from
the two foundation suites and `scripts/migration-smoke.sh`; no tracked tooling
was added or changed.

Upgrade proof: 0001–0018 plus legacy fixtures → 0019 preserved **762 rows / 48
tables** on old columns; populated 0019 → 0020 preserved **776 rows / 58 tables**;
the actual-main 0020 → 0022 upgrade preserved **all 776 rows across all 58 prior
tables**, with five new empty tables. All boundaries had integrity `ok` and zero
FK violations. Unknown inventory identity, raw labels, contextual units and safety
provenance were retained, not promoted into reviewed facts. Existing tests also
passed four unsafe-preflight rollback cases with no partial schema/data changes.

The saved orchestration command was
`python3 .hoplite/artifacts/release/migrations-20260909T185024Z-l7ouxC/upgrade.py`
(26.136 s total, including the child operations above). Its numbered receipts,
exact argument vectors, snapshots and `FINDINGS.md` remain in that ignored
directory. The clean database remains in `.wrangler/state`.

**Recorded supplemental failure:** a direct Wrangler `PRAGMA integrity_check;
PRAGMA foreign_key_check;` probe returned `SQLITE_AUTH` (exit 1, 1.952 s).
The supported `SELECT * FROM pragma_foreign_key_check` query passed, and a read-only
SQLite connection to the same local database proved integrity `ok`. This query-form
limitation was not hidden or called a migration failure. An inline-interpreter
shell wrapper was blocked before execution; saved local scripts then ran normally.

## Managed browser / E2E

**PASS: 264 named assertions / 36 phase executions, zero failures, timeouts,
retries or page errors.** Replayed all **121 unchanged commands** from
`tests/e2e/t07-planner-browser.commands.json` through six managed
`browser_cli batch --bail` calls on `scripts/security-preview.mjs`. All native
keyboard steps and six real 61-second rate-window waits were retained; no bypass.

| Viewport | English | Vietnamese |
| --- | --- | --- |
| 375×812 | 44/44 PASS; 80.108 s | 44/44 PASS; 79.879 s |
| 390×844 | 44/44 PASS; 80.830 s | 44/44 PASS; 83.591 s |
| 1280×900 | 44/44 PASS; 79.522 s | 44/44 PASS; 82.046 s |

Total bracketed wall time **485.976 s**, including tool orchestration and waits,
from **18:51:36.294Z to 18:59:42.270Z**. Each combination passed happy/current-plan/
generate/detail/swap/feedback/AI fallback/shopping/budget/stale flows (30), actual
reload restoration (2), presentation failure fixtures (5), real revision conflict
(2), alternatives conflict (2), and native keyboard/focus checks (3).

Receipt: `.hoplite/artifacts/release/browser-evidence.json`, command chunks and UTC
timing files. Command concatenation was checked against the tracked matrix. Parent
then reopened `/planner`: seven meals, revision 6, Vietnamese uncertainty and
non-consumption text, legacy Week link, no page errors. One synthetic-only full-page
screenshot was shared in the thread/PR; no video or private data was published.

The harness has isolated in-memory SQLite, a synthetic registered cookie session,
and blocked outbound backend fetch. Explicit presentation fixtures are not live
retailer/provider verification. Browser account-B login, physical touch devices,
screen readers and live providers are not covered; separate actual-auth HTTP and
mounted session tests cover creator/household privacy and recovery races.

## Hosted CI

Existing PR #8 targets main, so the existing validation workflow now executes.
Provider-observed run **[34387688066](https://github.com/vn-2c/Frigo/actions/runs/34387688066)**,
attempt 1, `pull_request`, exact source head `0b20061e7dc7405df68b18a18da4166e09494ecd`:
**SUCCESS**. Job `validate` **102587994085** completed at
**2026-09-09T18:14:28Z**; install, lint, typecheck, tests, migration smoke and build
all succeeded. This is actual release-PR CI, not historical T07 local evidence.

Documentation publication must trigger/recheck PR validation on its new head.
No CI/deployment workflow was rewritten or dispatched. PR CI against the merge
test ref does **not** satisfy the later deployment gate: `release-check.mjs` requires
a successful exact-SHA **push run on main**, main ancestry and approved hardening.
Merge and deployment remain separate operator actions. Successful future main-push
CI can trigger **staging** via the existing workflow if configured; the operator
must review that consequence before merging. Production remains explicitly gated.

## Feature flags and production readiness

No production configuration was enabled or changed. Checked-in defaults remain
off; live deployed values/secrets were not read and are not certified by this audit.

| Boundary | Verified behavior / operator prerequisite |
| --- | --- |
| Backend | Only `MEAL_PLANNER_ENABLED='true'` enables new routes; otherwise 404 after authentication. |
| Frontend | Only build-time `VITE_MEAL_PLANNER_ENABLED='true'` enables planner UI; otherwise legacy `/week`. |
| AI | Only `MEAL_PLANNER_AI_ENABLED='true'` permits on-demand native explanation ordering; disabled/missing/failing provider uses deterministic grounded IDs. |
| D1 | Correct `DB` binding and ledger through 0022; production ledger, backups and data readiness remain operator-owned. Health `SELECT 1` is not a schema gate. |
| KV | Production `CACHE` binding required. Ten compute requests/account/60 seconds plus path limits; KV read/put is non-atomic. Configured fail-closed mode rejects outages; default fallback is explicitly best-effort. |
| AI provider | Existing production config still requires the AI binding for other application features. Planner uses native `AI.run`, 256 tokens, 2,500-ms response deadline; no external fallback and no cancellation of already-started native work. |
| Catalog/safety | D1 catalog is read through trusted snapshots. No reviewed safety/substitution registry; unverified nutrition/absent safety evidence must not be advertised as complete allergy or hard-nutrition support. |
| Price data | Production composition supplies no reviewed `purchaseCatalog` adapter, so `reviewed_catalog_unavailable`/unknown costs are expected. Legacy price rows do not activate priced shopping; a future authorized adapter is needed. |
| Auth/origin | Preserve opaque-cookie sessions, CSRF, exact HTTPS `APP_URL`, creator/household scope, auth/OTP secrets, Turnstile and existing queues/bindings. Operator verifies presence/validity without publishing secret values. Email delivery also needs operational validation. |

The existing **development-only** preview explicitly enables backend/UI with AI
fallback; this is not production flag enablement. Flags are deployment-wide, not
built-in per-user rollout targeting.

## PayOS / protected areas

**PayOS/payment code untouched by release integration. No real payments executed.**
Explicit main-to-source comparisons passed for billing routes, payment UI, migration
0018, auth/session/CSRF/tenancy/config middleware, HTTP/auth clients, Wrangler and
`.github`. Shared Worker registration adds only planner routes; optional account
limiter scoping leaves existing callers path-scoped. No payment runtime dependency
upgrade. Household isolation, inventory commands and legacy Week remain intact.

No dedicated PayOS webhook/signature/payment-intent/UI suite exists in the inspected
test tree. The 82-test entitlement/quota/config/limiter run above is **adjacent
coverage**, not end-to-end payment certification. The schema gate does not inspect
payment-specific tables; clean full-chain replay includes unchanged 0018.

## Known limitations and environment receipt

Accepted engineering limits remain those in `PRODUCTION_READINESS.md`: non-atomic
KV; duplicate initial concurrent CPU before one durable winner; native AI work not
cancelled by deadline; fixed-offset dates rather than IANA/DST; ID-order option
clipping/best-known rather than global optimum; large-catalog/sort capacity not
certified; no custom browser request deadline. No new integration regression has
been reproduced. Remote schema/data/provider/capacity readiness is not claimed.

Platform settings discovery missed the existing `.hoplite/settings.json`; exact
tracked setup/run commands were mirrored into project overrides without repository
config edits. `sandbox_setup` was rejected by a lifecycle claim despite ready state;
the unchanged durable setup command was run successfully via shell. Managed
`preview_start` then succeeded. This was reported to Hoplite. `qa_environment_audit`
could not parse the legacy settings and no data profiles were exposed; the existing
guarded preview reset/session harness was retained rather than creating a framework.
Frozen install warned about skipped dependency build scripts; actual Vite/Worker
build and checks, not the warning alone, establish usability. No dependency upgrade.

## Operator rollout and rollback — not executed

1. Review this receipt, exact latest PR checks and unchanged main; keep PR #8 and
   preserve full ancestry. Final approval/promotion and **normal merge** are explicit
   operator actions, never squash/rebase. Review existing automatic staging behavior
   before merging if no deployment is intended.
2. After merge, require exact-main-SHA push CI and an approved hardening SHA through
   the existing release gate. Separately authorize target schema inspection,
   backup/recovery, migrations 0021–0022 where pending, and read-only schema/ledger
   verification. Do not execute remote migrations from this handoff.
3. Verify D1/KV/AI/auth/origin/queue/email and catalog policies in the target. Start
   in an isolated/internal environment, backend/UI explicitly opted in and AI off.
   Preserve visible unknown prices/safety limitations; do not promise unavailable
   priced-shopping or reviewed-safety support.
4. Only with separate rollout approval, monitor 409/429/5xx, privacy, latency,
   truncation, DB/KV failures and uncertainty before broader enablement. Ordinary
   successful tests are not production load or live-provider certification.
5. Roll back new-planner access by disabling backend/AI flags and rebuilding or
   restoring UI assets with the UI flag off. Keep `/week` and additive schema/data.
   Older-code rollback requires compatibility/ledger review; the release gate
   rejects mismatched shorter ledgers. Never drop tables/triggers or delete ledger
   entries to force rollback. Restore backups only with separate operator approval.

## Next action

Publish this documentation-only receipt on the existing release branch and inspect
exact latest PR CI. If it is pending, retain **RELEASE INTEGRATION IN PROGRESS**;
do not rerun integration or already-green source tests. After that check succeeds,
record the hosted receipt and mark **RELEASE CANDIDATE READY FOR MAIN MERGE** in
the release protocol documents. Final normal merge is an explicit operator action.
Do not deploy, remotely migrate D1, enable production flags or change PayOS.
