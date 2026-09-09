# T07 H2 — planner abuse controls

Original branch: `hoplite/lipara-d81160ee`. Continuation checkpoint:
`006742bc179d58aae53106c88aff8a2667dbd1ca`. Writable continuation:
`hoplite/prokonnesos-74e71894`. This is intentional publisher topology, not an
application architecture issue. Recovery `f391804` is preserved and published.

## Medium — reproduced account/path fan-out, fixed

`tests/integration/t07-rate-limit.test.ts` creates two plans through actual cookie
authentication and planner routes, then alternates eight successful regenerations
between their IDs. The eleventh compute request returned 200 on the original
implementation, both with a deterministic working KV double and with KV unbound.
Both regression cases failed specifically at the expected 429 assertion.

The existing key included the raw URL path, so plan IDs and action suffixes
partitioned the nominal account budget. The smallest fix adds an optional
`scope: 'account'` key to the existing middleware and installs a
`planner-compute:<authenticated-user>` bucket, **10 requests / 60 seconds**, on
generate, regenerate, swap, shopping and explanation. Existing route-specific
buckets remain. Reads and feedback retain separate 60/minute policies. No auth,
payment or other route policy changes. The budget is per account, not household
or IP: another registered member retains independent capacity.

The regression proves all five expensive actions reject after exhaustion, reject
before further T04 computation, provide Retry-After, and leave read/current/feedback
available. The previous AI test now expects nine explanations after one generation
(ten shared requests), rather than ten explanations plus a separate generation.
This is the intended stricter policy, not removed coverage.

## Medium — approximate distributed enforcement, explicitly retained

`tests/unit/t07-rate-limit.test.ts` synchronizes twelve KV reads before any write.
All twelve requests pass a nominal ten-request bucket, leaving the stored counter
at one. This controlled double proves a read/put lost-update race; it is not a
live Cloudflare load test. No atomic/global quota is claimed or introduced.

Actual Cloudflare KV is eventually consistent, and writes to the same key are
limited to one per second. See official documentation, checked 2026-09-09:

- <https://developers.cloudflare.com/kv/concepts/how-kv-works/>
- <https://developers.cloudflare.com/kv/platform/limits/>

Consequently, even sequential cross-location reads can be stale. Concurrent writes
and same-key write throttling can invoke the existing degraded path. Healthy-KV
and fallback counters are not a single durable reservation ledger. Guarantees:

- Serial requests against a consistently observed counter share the account limit.
- KV failure/unbound uses synchronous isolate-local counters and explicitly emits
  `X-RateLimit-Mode: degraded-isolate-local` and a bounded warning.
- Production fail-closed configuration returns 503 when KV fails; this does not
  make successful KV operations atomic or immune to stale reads.
- Distributed limits remain best-effort abuse controls, never financial quotas or
  exact CPU reservations. Isolate churn/account creation can increase total load.

Retain this known limitation with hard per-request search/input bounds, registered
membership, explicit UI actions/no automatic expensive retry, and staged rollout.
If measured abuse requires exact reservations, separately design an atomic shared
primitive with failure recovery; do not introduce a stuck in-progress flag or a
new Durable Object platform speculatively.

## Downstream error hypothesis not reproduced

A real Hono route throws a known HTTPException(409) behind a healthy fail-closed
limiter. It remains 409 with the original application message, one KV read/write,
and no degraded header. Hono maps the downstream exception before unwinding the
middleware. The enclosing `await next()` is not changed without a failing actual
route reproduction. Directly invoking middleware with an artificial throwing
`next` is not evidence that this application misclassifies route errors.

## Verification during H2 (not final freeze)

Initial fixture-only failure: missing required recipe cuisine; corrected fixture
columns before accepting any reproduction. Then pre-fix: **2 failing fan-out / 2
passing characterization tests**. Post-fix exact command:

```sh
pnpm exec vitest run tests/integration/t07-rate-limit.test.ts tests/unit/t07-rate-limit.test.ts tests/unit/rate-limit.test.ts tests/integration/meal-planning-http.test.ts tests/integration/meal-planning-presentation-http.test.ts tests/e2e/planner-preview.test.mjs
```

**95 tests / 6 files PASS**, 8.65 s. An intermediate run found the expected obsolete
AI per-path budget assumption (94 pass / 1 fail), updated as explained above.
Hard engine caps and hostile request bounds are recorded with H1/H4 evidence.

Shared-worktree typecheck later exposed TypeScript circular inference in the new
fixture's evolving empty plan array. An explicit `MealPlanDto[]` annotation fixes
the test-only type error without changing assertions; `pnpm typecheck` then passed.
