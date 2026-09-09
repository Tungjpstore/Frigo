# T07 WIP Handoff

## Active continuation — 2026-09-09

**T07 IN PROGRESS. Publication is working.** This section supersedes the
historical blocked/interrupted instructions below.

- Original T07 branch: `hoplite/lipara-d81160ee`.
- Continuation checkpoint: `006742bc179d58aae53106c88aff8a2667dbd1ca`.
- Writable continuation branch: `hoplite/prokonnesos-74e71894`.
- The user explicitly authorized this branch. It was safely fast-forwarded to
  preserve the exact `f39180421f12ff68751dba7898aa39535b2d3a95` documentation
  commit and then successfully published by the trusted tool. Both checkpoint
  ancestor checks passed; source/tests/migrations/config had no divergence.
- This intentional publisher topology is not an architectural repository issue.
  Do not return to `lipara` for publication or request branch confirmation again
  unless ancestry actually fails. Do not reset/restart T07.

### Phase ledger

| Phase | Evidence | Current status |
| --- | --- | --- |
| H1 | `T07_H1_SECURITY.md`, 51 new actual-auth HTTP cases; related boundary 125/4 and CSRF/CORS 87/2 PASS | Published `65c1367`; no H1 production fix justified |
| H2 | `T07_H2_ABUSE.md`: 11th cross-plan request reproduction fixed; 95/6 focused PASS and targeted ESLint PASS; KV race/real-Hono error characterization | Published `55020bc`; ADR-019 records approximate guarantee |
| H3 | `T07_H3_PERSISTENCE.md`: own-CAS-response race fixed with RETURNING; six new cases, 68/6 parent focused PASS; local migrations/schema/EXPLAIN and assembled typecheck PASS | Ready for checkpoint; no new migration/index |
| H4 | Precision, unknown, proof and search-bound matrix | In progress |
| H5 | Mounted frontend/AI and flags; existing browser replay | In progress |
| H6 | Measurements, failures/logs, rollout/readiness | Pending |

The fresh recovery baseline **1,390/79** and focused **74/3** already passed; do
not rerun it merely because of the branch change. Phase-specific targeted checks
are new evidence, not final full verification. No final source freeze yet.
Other phase files can exist in the shared worktree; commit only each phase's
reviewed changes, preserve all others, and push promptly.

### Next exact action

Publish H3's verified CAS response correction and query-plan evidence. Continue
H3–H6 and the original user audit matrix, freeze the final application SHA, then
run full tests/lint/types/build/migrations/clean local D1/schema, focused suites,
375/390/desktop browser matrix and safe hosted CI where available. Never weaken
assertions to hide a failure. No remote D1, production deployment or flag cutover.
**PayOS/payment code untouched.**

## Historical recovery attempt (blocker resolved above)

## Recovery attempt — 2026-09-09, publication blocked

**T07 NOT COMPLETE.** The user renewed authorization to continue from
`006742bc179d58aae53106c88aff8a2667dbd1ca` on `hoplite/lipara-d81160ee`.
Recovery and the requested new-environment baseline succeeded. Implementation
has not resumed because this thread cannot publish the requested branch.
This section supersedes the historical stop/authorization instructions below;
the original audit leads and remaining-work matrix are unchanged.

### Verified recovery and blocker

- First commands: `git branch --show-current`, `git rev-parse HEAD`,
  `git status --short`, `git log --oneline -15`, and
  `git merge-base --is-ancestor 0f6c3824efa359e5b2e6938840ac2c40b06e7004 HEAD`.
- Initial local branch: `hoplite/prokonnesos-74e71894`; exact starting HEAD:
  **`006742bc179d58aae53106c88aff8a2667dbd1ca`**. Tree clean; ancestry exit 0.
- Trusted fetch of `hoplite/lipara-d81160ee` returned the same exact SHA.
  No newer remote commits were found or discarded. No existing PR for that
  head was returned by the repository-bound PR lookup.
- The configured repository now reports `https://github.com/fri-go/Frigo.git`;
  the commit API confirms the exact supplied checkpoint there. Historical
  `sex-vn/Frigo` labels were not used to rewrite remotes or request credentials.
- A no-content-change publication attempt used branch `hoplite/lipara-d81160ee`,
  source SHA and expected remote SHA both `006742bc179d58aae53106c88aff8a2667dbd1ca`.
  The trusted publisher rejected it with:
  **`Cannot publish the configured base branch hoplite/lipara-d81160ee`**.
  This is a publication-policy blocker, not an application test failure.
- `git switch hoplite/lipara-d81160ee` safely selected the existing local branch
  at that exact SHA. Tree remained clean and the ancestor check passed. Switching
  locally does not change the protected-base publication policy.
- No reset, rebase, implementation change, remote mutation, PR, deployment,
  remote migration or production flag change was performed.

### Fresh recovery verification (not final T07 gates)

Executed sequentially on unchanged `006742b` source:

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm exec vitest run tests/unit/rate-limit.test.ts tests/integration/meal-planning-http.test.ts tests/integration/meal-planning-presentation-http.test.ts
```

All exit 0. Install used pnpm 10.26.0 without manifest/lockfile changes.
Full suite: **1,390 tests / 79 files PASS**, Vitest duration **57.44 s**.
Focused recovery set: **74 tests / 3 files PASS**, **5.33 s**: limiter 5,
planner HTTP 42, presentation HTTP 27. Counts overlap the full suite.
Existing mounted planner tests **48**, planner explanation unit tests **18**,
and preview API tests **17** also passed within the full suite; the actual
managed-browser matrix was **not run** in this recovery attempt.
Expected failure-injection/degraded-KV warnings appeared; no assertion failed.
Install reported ignored dependency build scripts; the requested tests passed.

The mandatory protocol and listed task/subsystem documents were consumed
(subsystem/task reading was delegated read-only). No new adversarial reproducer,
regression, route/repository audit sign-off, query plan, benchmark or fix exists.
No final lint/typecheck/build/migration/D1/schema/browser/hosted-CI gates were run.
The historical baseline below must not be substituted for final T07 evidence.

### Local checkpoint and exact next action

Only this handoff, `CURRENT_STATE.md`, `TASK_BOARD.md` and `HANDOFF.md` change
to preserve the blocker and fresh test receipt. This recovery documentation
checkpoint is **local-only / not pushed** while the branch is protected; discover
its SHA with `git log -1 --format=%H -- docs/ai/T07_WIP_HANDOFF.md`.
Application source still matches verified T06B `0fc78a4`; there is no final
T07 application SHA or production-readiness report.

Ask the user to either provide a writable thread/PR binding for the requested
`hoplite/lipara-d81160ee`, or explicitly authorize continuing from this checkpoint
on the provisioned writable `hoplite/prokonnesos-74e71894` branch. Do not bypass
the protected-base rule or silently publish on a substitute branch. Preserve this
local documentation checkpoint. Once publication is authorized, publish it through
the trusted path, recheck remote ancestry, and begin H1 security/trust/tenancy
reproduction before H2 limiter work. Do not redo the green recovery baseline
without a source/environment change or other concrete reason.

**PayOS/payment code untouched.** All H1–H6 audits and final verification remain
outstanding; the prior hypotheses are not promoted to confirmed findings.

## Historical interruption record (preserved)

Recorded 2026-09-09 after an explicit user instruction to **stop T07 immediately**,
preserve work, commit/push checkpoints and hand off. Do not resume audits or fixes
without renewed user authorization. This document is the current interruption
record; `T07_BASELINE.md` contains the durable exact verification receipt.

## Git state

- Authorized repository: `https://github.com/sex-vn/Frigo.git`, not the historical
  `tun-vn/Frigo` label in the original request. Do not change remotes to compensate.
- Branch: **`hoplite/lipara-d81160ee`**. Preserve this branch; the T06B continuation
  `hoplite/mende-90a2dbb1` is the verified input, not the T07 publication target.
- Provisioned HEAD: `db09fa0c4353ddf4840e04c10b96a33240de3497` (T02 merge).
  The clean thread branch was fast-forwarded to the fetched T06B continuation.
- T06B base SHA: **`6d4e873b180e46edcaf8088f848b3afab853bc66`**.
- Verified T06B application SHA:
  **`0fc78a4fdc624973413259c048e65ed585fa2b8e`**. Ancestry is proven; the subsequent
  two T06B commits change documentation and one browser-harness readiness wait.
- Current T07 WIP SHA:
  **`0f6c3824efa359e5b2e6938840ac2c40b06e7004`**,
  `wip(t07): checkpoint interrupted final hardening`.
  It adds only `docs/ai/T07_BASELINE.md`; there was no implementation patch to save.
- Latest pushed SHA verified before writing this handoff:
  **`0f6c3824efa359e5b2e6938840ac2c40b06e7004`**, confirmed by the trusted publish tool.
- This following documentation checkpoint cannot contain its own future hash.
  Resolve its exact SHA using `git log -1 --format=%H -- docs/ai/T07_WIP_HANDOFF.md`,
  and compare the fetched remote branch with `git rev-parse HEAD`. The closing
  interruption report records the final documentation and remote SHAs.
- No source/test/migration/configuration changes, resets, restores, rebases,
  amendments, squashes, PRs, merges or deployments were performed for T07.

## T07 status

**IN PROGRESS / INTERRUPTED**, approximately **10%** complete (rough planning
estimate, not a scored audit). Baseline verification is complete; initial
read-only inventory/review was under way. No new regression, fix, query plan,
performance benchmark or production-readiness conclusion was completed.

At interruption, the parent was reading planner routes, strict DTO/request
schemas, the cookie/owner-fenced client, private-session/cache handling, planner
views, exact money display, AI explanation transport and existing limiter code.
Four parallel read-only reviews covered security/API, persistence/concurrency,
engines/integrity and documentation. Their results had not been joined/accepted.
Do not assume their assigned areas were completed.

## Baseline

Baseline HEAD: **`6d4e873b180e46edcaf8088f848b3afab853bc66`**, unchanged application
content from `0fc78a4`. All checks preceded the first T07 documentation edit.

- `pnpm test`: **1,390 tests / 79 files PASS**; wall 61 s, Vitest 59.75 s.
- `pnpm lint`: PASS, 5 s.
- `pnpm typecheck`: PASS, 15 s (web/packages/TS tests and Worker).
- `pnpm build`: PASS, 11 s (Vite client and Worker TypeScript).
- `pnpm check:migrations`: PASS, 1 s, clean SQLite migration smoke.
- Local D1 migrations 0001–0022 apply: PASS, 7 s.
- `pnpm schema:check:local`: PASS, 3 s.
- Focused T02–T06B plus preview API: **722 tests / 32 files PASS**; wall 27 s,
  Vitest 25.70 s. Categories overlap the full suite.
- Existing browser matrix: **88 named assertions / 12 phase executions PASS**,
  English 375×812 and Vietnamese 390×844; no unhandled browser errors reported.

## Completed audit areas

No full security/concurrency/production audit area is certified complete.
The completed evidence is deliberately narrower:

| Area | What was actually completed | Findings / changes / tests |
| --- | --- | --- |
| Git preflight | Verified repository identity, missing T06B objects, fetched continuation, ancestry, clean fast-forward and post-application commits | Starting checkout was older T02, safely resolved; no source changes |
| Unchanged regression baseline | All required local gates and the 32-file focused selection ran | All pass; no tests added or weakened |
| Migration baseline | Existing clean migration smoke, full local D1 apply and read-only local schema gate | Pass; no migration/index/schema edits |
| Existing browser/mobile baseline | Actual synthetic registered session, generation, detail, swap, feedback, AI-disabled fallback, shopping uncertainty, regenerate, freshness, reload and conflict recovery | 88 existing assertions pass; no UI/harness edit |
| Existing keyboard baseline | Native Tab/Shift+Tab containment, Escape and focus return in both existing locale runs | Pass; not a full accessibility audit |

All meaningful T07 work saved so far is documentation:
`T07_BASELINE.md`, this handoff and interruption updates to `CURRENT_STATE.md`,
`TASK_BOARD.md`, `HANDOFF.md`. Application/test files are identical to the base.

## Findings fixed

**None.** No T07 bug was fixed and no T07 regression test was added. The workspace
baseline mismatch was resolved by fetching/fast-forwarding existing commits, not
by changing implementation. Do not count that recovery as a security fix.

## Findings confirmed but NOT fixed

These are inspected implementation limitations, not newly executed exploit tests.
Severity is preliminary; final production impact still requires reproduction.

1. **Medium — account/path fan-out leaves no aggregate planner compute budget.**
   `src/worker/routes/meal-planning.ts` configures expensive operations at 10/minute;
   `src/worker/middleware/rate-limit.ts` keys by prefix, authenticated account and
   raw path. Different plan IDs and action suffixes use separate counters.
   No T07 change or adversarial fan-out test exists. Next: reproduce through real
   authenticated routes, then evaluate the smallest planner-scoped aggregate
   account limiter supported by the current architecture. Do not change payment
   or unrelated auth policy, and do not invent a distributed quota platform.
2. **Medium — the existing KV limiter does not atomically reserve capacity.**
   The inspected implementation reads a counter and separately writes the
   increment; fallback is isolate-local. It cannot promise an exact global quota
   under concurrency. No synchronized race was run. Next: characterize current
   behavior with controlled concurrent requests and document guarantees before
   deciding whether a small planner-only atomic improvement is justified.

Work stopped at the user's instruction, before reproduction or design decisions.
Neither item has been accepted as a harmless production limitation or fixed.

## Findings investigated and NOT reproduced

- The existing mobile browser replay did **not** reproduce stale mutation or
  alternatives-recovery failures, focus escape, false known shopping totals,
  uncontrolled 429 retry, failed restoration or unhandled happy-path page errors.
  This only covers its named fixtures/actions and two tested viewport/locale pairs.
- Existing mounted cache/session and AI-fallback tests passed in the baseline.
  No new T07 adversarial variation was attempted; a baseline pass is not proof
  that every possible race or provider failure is safe.
- No raw-HTML render pattern was found in the inspected new planner feature,
  PlannerPage and planner client. Text rendering was inspected; app-wide XSS and
  newly injected malicious browser fixtures were not completed.
- The limiter's `try` also encloses `await next()`. A possible confusion between
  downstream errors and KV errors was noticed, but actual Hono behavior was **not
  reproduced or established**. Treat this as a question, not a confirmed bug.

## Audit areas NOT STARTED

The original T07 request requires the following outstanding work. Some had a
read-only review assigned; no accepted findings/proof were available at the stop.
Do not convert assignment or historical documentation into completed audit status.

- Exhaustive route **and repository predicate** IDOR matrix for inventory, plans,
  current-plan, shopping, feedback, preferences and recipe-private state; creator
  privacy within one household and membership revocation at each boundary.
- New adversarial mass-assignment, trusted-snapshot, null/empty/malformed hard
  restriction removal, reviewed-substitution elevation and price/shortage spoofing
  tests across API routes (not just domain helpers).
- Full T02–T06 quantity/money round-trip, MAX_SAFE_INTEGER, zero, JPY, supported
  multi-digit currencies, very large internal BigInt, tiny rational quantities and
  unknown-state propagation audit.
- Hostile planner/family/optimizer sizes, all search caps, deterministic ordering,
  truncation/proof semantics, budget bounds and meaningful rate-limit fan-out tests.
- T05 option-ID-prefix preselection quality; alternatives feasibility/quality;
  implement only a small proven safe improvement or explicitly defer.
- Initial generation duplicate-compute reproduction and failure-safe single-flight/
  reservation feasibility; generate/regenerate/feedback retry-intent conflicts.
- New swap-vs-swap, swap-vs-regenerate, feedback-vs-regenerate and
  shopping-vs-regenerate races; feedback global IDs and durable event uniqueness.
- Complete auth/CSRF/CORS production threat model; app-wide XSS, secrets/bundle/
  response/log audit and production error sanitization outside inspected routes.
- D1 invariants, all relevant foreign keys/cascades, SQL atomicity, authoritative
  catalog `INSERT OR REPLACE`, exact current-plan ordering, EXPLAIN/index review,
  query counts/N+1, representative latency/payload/search-state measurements.
- Fresh-install versus populated-upgrade/cascade cases specific to T07; final
  clean isolated D1 migration/schema verification after any changes.
- Fixed-offset/UTC/household timezone, midnight/DST/horizon boundaries; expiry
  use-by/best-before/estimated/unknown safety and conservative mid-week freshness.
- Full explicit inventory-command boundary, shopping/payment boundary, static/D1
  catalog authority review, legacy Week and missing/invalid flag matrix.
- Structured observability and log privacy; D1/catalog/price/rate-store outages;
  HTTP timeout/abort behavior, AI abuse/cost and final frontend retry review.
- Broader mounted and browser session/navigation races, desktop and the requested
  375/390/desktop locale matrix, tiny tap/label/status issues and final console audit.
- Property/randomized tests where useful, measured frontend-render loops, dead
  artifacts/dependency/type-safety/test-quality review without broad cleanup.
- Hosted CI, fresh-install final sanity, frozen-source full verification, final
  protected-path diff, production readiness report, rollout/rollback plan, actual
  ADR/architecture changes and final completion decision.

## Partially completed work

| Partial area | Files / present behavior | Remaining and exact next step |
| --- | --- | --- |
| Mandatory reading | `docs/ai` protocol and subsystem docs; all packets were assigned to readers, including the full T06B user packet | Reader completion was not returned. Fresh agent must complete mandatory preflight rather than assume every document was fully read. |
| System inventory | Initial table in `T07_BASELINE.md` | Finish map before fixes: auth/session; tenancy; inventory/recipes/preferences/planner/shopping; D1/migrations/indexes; all routes; query/cache/UI; AI; flags/legacy. |
| Security/trust | Planner routes and shared schemas inspected; real middleware baseline passed | Inspect `packages/db/src/{meal-planning,meal-planning-snapshot,personalization}.ts` and service orchestration alongside HTTP fixtures, then prove missing cases. |
| Frontend races | `usePlanner.ts`, `PlannerPage.tsx`, planner views/client/private-session and existing tests read | Add only evidence-backed race cases. An in-flight action across same-session plan-route navigation was an untested review question, not a defect. |
| AI | Explanation transport/schema behavior and existing unit tests inspected | Complete route/privacy/failure/abuse matrix; keep AI presentation-only and do not connect live providers for tests. |
| Precision | Strict budget bound and BigInt formatter inspected | Trace internal T05 arithmetic through DTO/schema and formatting before proposing changes. |
| Rate limiting | Account/raw-path KV policy inspected | Run existing limiter/HTTP tests, create a fan-out reproducer, assess atomicity without touching other protected route policies. |

No partially written source, migration, regression test, query-plan helper or
production-readiness document exists. Do not search other chat history for missing
implementation files: there were none at interruption.

## Current tests

Exact executed commands/results are retained in `T07_BASELINE.md`, including the
long focused command and exact managed-browser replay invocation. In addition:

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm lint
pnpm typecheck
pnpm build
pnpm check:migrations
pnpm exec wrangler d1 migrations apply frigo-db --local
pnpm schema:check:local
```

All passed at the baseline SHA. Focused **722/32**, full **1390/79** and browser
**88 assertions** are overlapping/different categories, not an additive total.
No application content changed afterward; documentation-only checkpoints do not
constitute a new frozen T07 application verification. WIP staging checks
`git diff --check` and `git diff --cached --check` passed before the first commit.

## Current failures

- **No failing application test/check is known** from the commands actually run.
- The first ancestry command failed before fetching unavailable objects; resolved.
- An inline Python baseline runner was blocked before execution; the shell runner
  replaced it and all gates passed. No test assertion was removed or weakened.
- A named-preview request used nonexistent name `default`; selecting the default
  target started the existing preview. No script/config repair was needed.
- User interruption started a new platform run. Attempts to interrupt the four
  previous read-only children were rejected as belonging to a different parent
  run; the new run's child list was empty. This was reported to Hoplite developers.
  Their termination cannot be claimed from tool evidence. See Known risks below.

## Verification NOT yet run

All baseline commands above have run. **Final T07** versions of `pnpm test`, lint,
typecheck, build, migration smoke, isolated clean D1 apply/schema check, focused
T02–T07/HTTP/frontend suites and browser matrix have **not** run because no T07
hardening implementation exists yet. No new property/fuzz tests, endpoint
benchmarks, query plans or hosted CI were executed. Desktop and full responsive
locale cross-product remain unverified. No remote migration/production test,
live AI-provider validation or deployment was authorized or performed.

## Database / migrations

- No new migrations, changed indexes, schema changes or old-migration edits.
- Baseline local D1 applied 0001–0022; clean migration smoke and read-only schema
  gate passed. Existing local database state is generated and ignored.
- New T07 FK/cascade, populated-upgrade, query-plan and `INSERT OR REPLACE`
  investigation remains incomplete. Do not infer it from the schema gate alone.
- Never apply remote migrations or alter payment migration 0018 in T07.

## Security state

| Boundary | Current conclusion |
| --- | --- |
| Tenant/creator isolation | Existing baseline tests pass; route guards seen. Complete repository/route IDOR audit still pending; no T07 sign-off. |
| Trusted snapshots | Inspected intent schemas are strict and no client context is spread by the inspected router. Service/repository end-to-end audit incomplete. |
| Price spoofing | Shopping accepts currency and bounded budget intent, not authoritative prices. New route-level spoofing matrix pending. |
| Hard restrictions | No client safety-authoring field in inspected planner intent. Server persisted-policy enforcement/removal adversarial audit pending. |
| Substitutions | Swap schema accepts source identity, not reviewed evidence. Full reviewed-substitution API-boundary proof pending. |
| XSS | Inspected planner renders React text, no raw HTML pattern found; full app audit and new malicious fixture pending. |
| Secrets | No keys/credentials were used or added. A complete bundle/log/history secret audit was not performed; never print secret values in reports. |
| AI authority | Inspected provider gets only locale/reason IDs and may only permute the complete grounded set. No tool/mutation authority. Existing fallback tests pass. |
| Auth/CSRF/CORS | Cookie/owner-fenced client and real synthetic authenticated flows inspected. Do not infer complete production threat-model approval. |

## Concurrency state

The preserved T06A/T06B implementation claims CAS/revision-fenced persistence and
creator-private plans; its existing integration/mounted tests all pass in the new
baseline. No T07 race test or persistence fix was written. `usePlanner` cancels
query delivery before replacing full plan caches and checks captured private
session/gate ownership; keyed views isolate revision-local state. Existing browser
mutation/alternatives 409 recovery passed.

Generate/regenerate/feedback idempotency semantics, stale durable writes, feedback
global IDs, concurrent shopping/revision behavior and duplicate initial compute
still require explicit T07 proof. Do not introduce an in-progress reservation with
stuck-request risk just to avoid duplicate CPU. Same-session route-navigation and
limiter downstream-error questions remain untested, not confirmed defects.

## Performance state

Only baseline check/build timings and bundle output were observed. Vite reported
PlannerPage **80.61 kB / 23.78 kB gzip**, not a measured API payload. No generate,
regenerate, swap, shopping or GET latency; query counts; EXPLAIN output; search-state
benchmark; render profile or N+1 reproduction was produced. No optimization was
attempted. Do not invent millisecond thresholds or infer production speed from
test-suite wall time.

## Rate limiting

Unchanged planner route policy: expensive operations **10/minute/account/raw
path**; read/feedback categories **60/minute/account/raw path**. Existing middleware
uses KV read/put and an explicitly degraded isolate-local fallback, with optional
production fail-closed policy for storage failure. Aggregate protection is absent
in the inspected planner composition; atomicity is not promised. Baseline tests
and existing 429 UI replay pass, but cross-plan fan-out/concurrency remain untested.
No new limiter, migration, quota platform or policy decision was made.

## Legacy / rollout

Existing flags remain opt-in: `VITE_MEAL_PLANNER_ENABLED`, `MEAL_PLANNER_ENABLED`,
`MEAL_PLANNER_AI_ENABLED` require literal `true`. The synthetic preview explicitly
enables planner UI/backend and uses deterministic AI fallback. Production flags
were not changed. Legacy Week/recipes/shopping/cooking and dual-write compatibility
were not edited. A T07 staged rollout/rollback plan and invalid-flag/legacy matrix
are still required. Do not enable production, deploy, force catalog cutover or
prescribe destructive DB rollback as part of resuming an audit.

## Protected areas

**PayOS/payment touched: NO.** No application file changed during T07, including
payments, billing, checkout, subscriptions, callbacks/webhooks or migration 0018.
Unrelated auth and production infrastructure are likewise untouched. Planning
and shopping did not get new inventory, ordering or payment side effects.

## Known risks / temporary code

- No T07 TODO hack, unfinished test, temporary implementation or new dependency.
- `T06B_WIP_HANDOFF.md` is retained retired history, not current unfinished work.
- `docs/ai/PRODUCTION_READINESS.md` has **not** been created. Architecture/ADRs
  were not changed because no T07 architectural decision was made.
- Original user-known concerns (option prefix quality, unranked alternatives,
  conservative freshness, duplicate compute) are leads, not verified T07 results.
- Mandatory reading was distributed; not all delegated results were returned.
  Required protocol files: MASTER_SPEC, AGENT_RULES, ARCHITECTURE, DOMAIN_MODEL,
  DECISIONS, CURRENT_STATE, TASK_BOARD, HANDOFF. Required packets: T01–T05,
  `tasks/T06-ai-api-frontend.md` (current T06A equivalent), full
  `tasks/T06B-frontend-user-packet.md`, `tasks/T07-hardening-final-review.md`.
  Read RECIPE_ENGINE, RANKING_ENGINE, WEEKLY_PLANNER, SHOPPING_OPTIMIZER,
  API_INTEGRATION, T06A_HANDOFF (current backend handoff), FRONTEND_MEAL_PLANNER,
  AI_LAYER, T06B_VERIFICATION, T06B_E2E and retained T06B_WIP_HANDOFF.
- Prior read-only child IDs: `subagent_4cb7330e0aec355f2da8f21a` (security),
  `subagent_c01748fb66a34d6fdaf8daa1` (persistence/rate),
  `subagent_0dc72bc94734adf532481429` (engines),
  `subagent_1fcd5ce27bfc6129e40106a0` (docs). Their parent was
  `run_1c7a5156fa654186bd591398210385e3`; the stop message started another run.
  All were explicitly prohibited from editing/committing. No accepted findings
  were available; do not resume them merely to fill in this handoff. Platform
  cancellation ownership errors were reported, not bypassed.
- Ignored raw evidence/preview state is not needed to recover source. Exact useful
  results are tracked in `T07_BASELINE.md`; browser replay is already versioned.

## Exact next actions

Only after renewed authorization:

1. Fetch **`hoplite/lipara-d81160ee`** through the authorized Git broker. Run
   `git status --short`, `git rev-parse HEAD`, and
   `git merge-base --is-ancestor 0f6c3824efa359e5b2e6938840ac2c40b06e7004 HEAD`.
   Resolve the handoff commit with `git log -1 --format=%H -- docs/ai/T07_WIP_HANDOFF.md`;
   do not resume from main/T02 or reset to T06A.
2. Read this handoff, `T07_BASELINE.md`, the mandatory protocol/task/subsystem
   documents above and live diff. Finish the audit inventory before fixing anything.
3. Establish current local setup with `pnpm install --frozen-lockfile` and rerun
   `pnpm test` on the recovered HEAD. Retain any unrelated work and record failures
   as current baseline, not presumed T07 regressions.
4. Run `pnpm exec vitest run tests/unit/rate-limit.test.ts tests/integration/meal-planning-http.test.ts tests/integration/meal-planning-presentation-http.test.ts`.
   Then add a controlled same-account/multiple-plan-ID expensive-route fan-out
   reproducer before proposing a planner-scoped aggregate limiter.
5. Inspect `packages/db/src/meal-planning.ts` and the existing persistence/HTTP
   fixtures; prove creator-private and membership predicates, CAS/idempotency and
   feedback races before changing repositories or reserving duplicate compute.
6. Complete the strict-input/server-hard-policy adversarial matrix, then exact
   arithmetic/search/unknown/determinism review. Preserve T02–T05 proof semantics;
   do not redesign working engines or add products/features.
7. Measure representative endpoints, payloads, query counts and SQLite query
   plans before performance/index changes. Review migration/FK/UPSERT safety.
8. Complete frontend/AI/legacy/flag checks and full 375/390/desktop browser matrix
   using the existing managed preview/replay, not a new browser framework.
9. Commit/push evidence-backed source checkpoints frequently. After freezing the
   final application SHA, run the full required gates, clean migration/schema,
   focused/HTTP/browser suites and hosted CI if available. Never weaken tests.
10. Create `PRODUCTION_READINESS.md` only from actual completed evidence; update
    architecture/ADRs only for real decisions and finish state/board/handoff. Use
    **T07 COMPLETE — PRODUCTION-READY CANDIDATE** only when all required audits and
    gates support it; otherwise **T07 NOT COMPLETE** with exact blockers.

The original final-report sections remain: Baseline; Audit summary (severity
counts); Security; Concurrency; Rate limiting / abuse resistance; Database /
persistence; Performance; Planner / optimizer integrity; Frontend; AI; Legacy /
rollout; Findings fixed; Findings deferred; Tests; Verification; Protected areas;
Production readiness; Git; Final status. Preserve `unknown != zero`, `best known !=
proven optimal`, `surplus != certain waste`, `planned != actual consumption`,
`client intent != trusted state`, `AI explanation != fact`, tenant/creator access,
revision fencing and bounded compute. No payment work is authorized.
