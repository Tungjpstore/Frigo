# T07 H6 — operational observations and readiness boundaries

Original T07 branch: `hoplite/lipara-d81160ee`. Continuation checkpoint:
`006742bc179d58aae53106c88aff8a2667dbd1ca`. Writable continuation:
`hoplite/prokonnesos-74e71894`. This intentional publisher binding preserves the
exact `f391804` recovery checkpoint; it is not an architecture issue.

## Actual measurements

`pnpm exec vitest run tests/e2e/t07-operations.test.mjs` passed **3 tests / 1 file**
(2.11 s Vitest duration). It uses the existing preview seed, real registered cookie
authentication, complete Worker routing and in-memory SQLite migrated 0001–0022.
The fixture has three recipes, three stock lots, seven dinners and no reviewed
retail offers. All external fetches are blocked. One observed run:

| Operation | Wall ms | SQL statements | D1 batches | JSON bytes | T04 states |
| --- | ---: | ---: | ---: | ---: | ---: |
| Generate | 213.97 | 40 | 2 | 9,822 | 103 |
| Regenerate | 74.73 | 38 | 2 | 9,822 | 103 |
| Swap | 51.36 | 38 | 2 | 9,801 | 86 |
| Shopping, missing reviewed catalog | 10.75 | 21 | 1 | 4,891 | not T04 |
| GET current | 5.31 | 21 | 1 | 9,810 | not T04 |

These include auth and statement counts inside batches; they exclude migration/
fixture seeding and SQLite-helper internal bookkeeping. JSON bytes are UTF-8 body
size, not network transfer compression. Wall time includes local response reading,
not production D1/network latency. The first request can include session-touch work.
They are observations, never CI timing thresholds, SLA estimates or a priced-catalog
stress benchmark. Final gates will emit a fresh observation line without asserting
these timing values.

The fixture confirms all household inventory rows/events remain unchanged after
these operations. Two preliminary fixture assertions were corrected: public cost
is `cost.totalCost`, not the engine's `totalCostMinor`, and migration seeds include
legacy inventory events, so integrity compares the complete before/after state
rather than assuming an empty global table. Neither required an application fix.

## Query and payload review

H3 records indexed owner/current/CAS/feedback access and an explicit 17-statement
snapshot batch. There is no DB access inside deterministic candidate/search/package
loops. Generate/regenerate/swap intentionally read and revalidate source snapshots;
removing the second read for a smaller count would weaken freshness. No query or
index optimization was justified by these measurements.

Strict plan/shopping response DTOs expose chosen meals, useful projected quantities,
public diagnostics and bounded-search conclusions. They do not expose beam
frontiers, complete catalogs, ranking/review contexts or the stored opaque shopping
snapshot. Plan result/intent overlap is useful for editing/revision recovery, not a
confirmed payload bug; no field was removed speculatively. Existing 21-slot/
100-recipe planner stress tests and H4 cap regressions cover structural bounds,
not production capacity claims.

## Failure modes

- A catalog snapshot batch failure produces sanitized HTTP 500
  `MEAL_PLANNING_UNAVAILABLE`, logs only its categorized code, and persists no
  partial plan. The new test's private SQL sentinel appears in neither response
  nor planner error log.
- An empty catalog returns an honest infeasible plan with seven unplanned slots,
  not an unsafe legacy fallback. Missing prices/catalog remain unknown, never zero.
- H1/H3 retain membership/revision checks and conflict semantics during revoked
  access or concurrent writes. No stock reservation or permanent in-progress row.
- AI timeout/429/network/malformed output retain deterministic grounded labels
  (H5). Native provider cancellation is not guaranteed by its response deadline.
- KV unbound/error is explicitly degraded; production fail-closed returns 503.
  KV successful reads/writes still do not provide atomic global quotas (H2).
- Failed or malformed frontend 409 recovery retains the last accepted plan and
  conflict alert. No automatic expensive retry/offline queue. The generic browser
  transport has no custom global request deadline; network errors/cancellation and
  reload/current-plan discovery provide recovery, not a promised request timeout.
  A custom deadline would need ambiguous-mutation/retry design and is deferred.

## Rendering, errors, secrets and observability

Repository search of `src/web` and `packages/ai` found no executable raw-HTML sinks
(`dangerouslySetInnerHTML`, assigned `innerHTML`, `insertAdjacentHTML`,
`document.write`) or unsafe markdown renderer in the relevant application source.
Existing malicious recipe title/instruction tests and H5 AI-ID validation cover
text-as-data rendering. Test/browser harnesses use DOM APIs only in isolated fixtures.

Worker production request logs contain method/path/status/duration/request ID, not
Cookie, Authorization, intent bodies or trusted household snapshots. Plan compute
logs status/conclusion/truncation/states; shopping logs catalog availability;
feedback/AI actions have ordinary request status logs. AI fallback reason is an
explicit response field, not raw provider prose. Degraded limiter warnings are
bounded by prefix/reason. No new observability platform is introduced.

Legacy inventory/preferences/cooking error handlers still log Error objects to
server logs. No credential leak was reproduced; treat those operational logs as
restricted, never public artifacts. The global development handler deliberately
returns stack details, while production returns a sanitized envelope; the new
planner boundary sanitizes unexpected errors in either mode. This is not a claim
that historical repository/provider logs or production secrets were inspected.
A final high-confidence credential-marker scan of source/tests/frontend output is
recorded in the final receipt; it cannot prove absence of every possible secret.

## Preview and hosted CI

Managed preview uses the versioned isolated Vite/Worker harness, not a new E2E
framework. Settings discovery incorrectly reported the existing `.hoplite/settings.json`
missing; exact setup/run commands were mirrored into project overrides, no production
configuration changed. The sqlite3 dependency was installed via the existing setup
path. A partial tool-write interruption left a temporary buffer, preserved under
ignored `.hoplite/artifacts/t07/abandoned-write.md`; required source is tracked.

Existing CI triggers topic validation only for PRs targeting main/master. This
thread's configured PR base is the original T07 checkpoint branch. Topic pushes
and a PR to that base do not trigger that workflow; it has no workflow_dispatch.
Do not alter production/CI infrastructure or retarget onto an unauthorized base to
force a green badge. Unless a safe configured provider run is observed separately,
**hosted CI not verified**. Deployment workflows are never dispatched in T07.

## Rollout / rollback

1. Apply operator-approved additive migrations through the existing release
   procedure and read-only remote schema gate outside this task. Never deploy on
   the strength of local tests alone; obtain exact-head hosted CI before release.
2. Internal isolated environment first: explicitly enable backend/UI flags, leave
   AI off initially, verify representative reviewed catalog/safety coverage.
3. Controlled cohort using existing deployment/access controls, then broader
   enablement only after reviewing 409/429/5xx, latency, search truncation and price
   uncertainty. Current flags are deployment-wide, not per-user targeting.
4. Roll back by disabling `MEAL_PLANNER_ENABLED` and rebuilding/restoring UI assets
   with `VITE_MEAL_PLANNER_ENABLED` off; disable AI independently. Backend disable
   immediately stops new-planner routes, while the UI build flag requires new assets.
   Keep legacy `/week`; retain additive tables/data. No destructive DB rollback.

No production flag, deployment, remote migration or payment action was performed.
**PayOS/payment code untouched.**
