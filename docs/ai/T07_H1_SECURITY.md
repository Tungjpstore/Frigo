# T07 H1 — Security / Trust / Tenancy Audit

**Status:** complete for the generated meal-planning HTTP boundary. No application
security defect was reproduced, so this phase adds regression coverage and no
production-source, migration, payment, authentication, or deployment change.

## Continuation topology

- Original T07 branch: `hoplite/lipara-d81160ee`
- Continuation checkpoint: `006742bc179d58aae53106c88aff8a2667dbd1ca`
- Writable continuation branch: `hoplite/prokonnesos-74e71894`

This topology is intentional because of the Hoplite publisher binding; it is not
an architectural repository issue. H1 began from the preserved `f391804` recovery
documentation checkpoint. It is a shared worktree: rate-limit and persistence
changes owned by later H2/H3 work were present but were not edited by H1.

## Method and scope

The audit traces authenticated cookie → owner fence → current membership →
server-loaded snapshot → opaque generated-plan persistence → safe DTO. It covers
`/api/v1/meal-planning/plans` generation, current, read, alternatives,
explanation, regenerate, swap, shopping, and feedback; their D1 ownership
predicates; and the T03 preference/history snapshot they use. It does not certify
the whole legacy application or change unrelated auth/session infrastructure.

`tests/integration/t07-security.test.ts` uses the existing `SqliteD1` migration
fixture and real cookie authentication plus `createMealPlanningRoutes`; it does
not introduce a new E2E framework or an auth bypass.

## Ownership matrix

| Surface | HTTP/session guard | Repository or service ownership proof | H1 result |
| --- | --- | --- | --- |
| Inventory lots and commands | `inventoryRoutes` applies `tenancyGuard`; route SQL binds `auth.householdId` | `src/worker/routes/inventory.ts` selects/mutates with `id` plus authenticated household; commands derive event IDs from that household | Read-only audit: household scoped. Existing inventory ownership tests remain the broader regression suite. |
| Plan creation | registered cookie, expected user+household headers when supplied, `tenancyGuard`, feature flag | `generate` passes only authenticated scope; `createGeneratedMealPlan` uses membership-guarded `INSERT … SELECT` | Covered: client cannot submit owner/snapshot/catalog/ranking state. |
| Plan read/current | same route middleware; `Cache-Control: no-store` | `currentPlan`, request-key lookup, and current lookup bind both `household_id` and `creator_user_id`; current query is never a household listing | Covered: a foreign household and a different member of the same household get `404` for a known ID and `{plan:null}` for current. |
| Regenerate/swap/shopping/feedback | same middleware, then ID validation and strict body schema | each action starts with `getGeneratedMealPlan(scope,id)`; mutation/annotation SQL repeats creator membership and revision predicates | Covered: cross-household and same-household noncreator actions return `404` without plan, feedback, or annotation mutation. |
| Alternatives/explanation | same private plan lookup and revision check | alternatives reloads only a server snapshot; explanation resolves only selected server meal/reason IDs then rechecks plan revision | Covered: both private actors receive `404`; injected catalog/reasons/plans are `422`. |
| Membership revocation | `tenancyGuard` rereads `household_members` on every planner request | generated plan has the composite creator membership FK; persistence rechecks membership on every lookup/write | Covered: every plan path returns `403` after revocation. The FK cascade removes the now-inaccessible plan and annotations; this was expected, not a security regression. |
| Typed ranking preferences | no planner preference-authoring HTTP route | `prepareRankingContextRead` binds personal preference and personal feedback to current `(household,user)`; household preference is separately scoped | Covered: an owner’s personal `neverRecommendRecipeIds` does not affect a same-household member’s generated plan. |
| History | no client history input | likes/dislikes/skips/swaps bind household **and current user**; actual `cooked_meals` is intentionally household shared | Audited by predicate. Client-supplied history is rejected at feedback/generation schemas. |
| Legacy preferences | normal authenticated API route; no planner intent import | `preferencesRoutes` selects/replaces only `auth.userId`; T06 planner reads typed ranking tables instead of legacy free-form preferences | Audited: legacy preference body cannot become planner hard-policy authority. No unrelated legacy-route change is authorized. |
| Recipes/catalog/private recipe state | planner takes no recipe body or review/author field | snapshot catalog reads global reviewed catalog data; swap finds the requested ID in that server snapshot and applies the catalog version itself | No private recipe authoring/state exists in the T06 schema/API. Client recipe, variant, safety, review, or substitution-elevation claims are rejected. |
| Household member state | request membership derives from session only | `tenancyGuard`, ranking snapshot membership query, generated-plan composite FK, and write `EXISTS`/joins all use authenticated scope | Covered including revocation. No client household/member field is accepted. |

## Adversarial HTTP evidence

The new regression matrix has 51 tests. It sends claims such as `householdId`,
`creatorUserId`, `userId`, revision, snapshot, inventory, ranking context,
catalog, shortage, price, safety-review, substitution, and approval data at the
generation, regenerate, swap, shopping, feedback, explanation, and alternatives
boundaries.

- Every unknown authority claim was rejected with `422` before a durable write.
  Regenerate/swap malformed, missing, empty, `null`, wrong-type, and nested claim
  variants leave the revision unchanged.
- Swap can carry only `kind`, ID, and the exact family-only `variantId` intent.
  The service finds the source in the current server snapshot and uses the
  server-provided catalog version. Client review/safety/substitution fields are
  not parsed.
- Shopping accepts an explicit currency and bounded budget intent only. It rejects
  prices, shortages, inventory, catalog, creator, `null` budget, and nested
  price-as-of claims. The purchase catalog is service-owned and price output is
  marked revalidation-required.
- A persisted household allergen restriction makes both fixture recipes
  infeasible despite a favorable personal soft preference. Regeneration with no
  policy body remains infeasible; empty/null/malformed policy removal attempts
  are strict-body `422`s. Server hard policy beats soft preference.
- Alternatives reject unknown, duplicate, and noncanonical revision query values.
  They cannot be used to supply a client catalog snapshot.

A first test run exposed an assertion mistake in the new test rather than a
product failure: after membership deletion the migration’s intended composite FK
cascade deletes the private plan, so there is no remaining revision to inspect.
The test was corrected to assert that cascade and rerun. No implementation fix
was indicated or made.

## CSRF, CORS, XSS, errors, and logs

- Cookie-authenticated unsafe requests require a trusted `Origin` or `Referer`
  in `authMiddleware`; this includes all planner POSTs. Supplied expected-owner
  headers must exactly match the cookie session. The new route tests use a hostile
  origin and observe `403`; existing Worker CORS coverage checks the same trusted
  origin predicate for preflight.
- Worker CORS uses exact configured application origin (plus a narrow development
  loopback list), `credentials:true`, and no wildcard. `applicationOrigin` rejects
  credentials in URLs and requires HTTPS/non-loopback in production.
- Planner-facing React source has no `dangerouslySetInnerHTML`, `innerHTML`,
  `outerHTML`, or `insertAdjacentHTML` sink. Planner DTOs are schema parsed before
  display. This is a scoped planner review, not a claim of complete app-wide XSS
  certification.
- Planner routes map expected errors to small `{code,error}` envelopes and log
  only event/status/search/categorized failure metadata, not snapshot data,
  cookies, preferences, evidence, or price values. Existing HTTP coverage proves
  an unexpected planner service error does not return its SQL/stack text. The
  Worker’s broader development error behavior and legacy-route log review remain
  outside this H1 sign-off.

## Findings and accepted limits

**Confirmed H1 findings fixed:** none. **Deferred H1 security defect:** none
reproduced in the audited generated-planner boundary.

The following remain intentionally outside this phase: full legacy/application-wide
XSS and log audit, production deployment/secret review, authentication redesign,
and H2 aggregate-abuse/rate-limit behavior. The existing account/path limiter
warning in fixture runs is H2-owned and is not interpreted here as a tenancy
bypass. No PayOS, billing, checkout, payment webhook, or production credentials
were read or changed.

## Verification

Executed after the test assertion correction:

```sh
pnpm exec vitest run tests/integration/t07-security.test.ts
```

Result: **PASS — 51 tests / 1 file**, Vitest duration **4.46 s**, wall duration
**6.77 s**. The related authenticated boundary and server-snapshot regressions
also passed:

```sh
pnpm exec vitest run tests/integration/t07-security.test.ts tests/integration/meal-planning-http.test.ts tests/integration/meal-planning-presentation-http.test.ts tests/integration/meal-planning-snapshot.test.ts
```

Result: **PASS — 125 tests / 4 files**, Vitest duration **5.99 s**, wall duration
**11.67 s**. Existing CSRF and CORS coverage was also rerun:

```sh
pnpm exec vitest run tests/integration/worker-cors.test.mjs tests/integration/auth-hardening.test.ts
```

Result: **PASS — 87 tests / 2 files**, Vitest duration **3.32 s**, wall duration
**5.52 s**. Expected fixture warnings report an unbound KV rate store and
isolate-local enforcement; they do not fail an assertion. The full baseline
`pnpm test` result remains the preserved **1,390 tests / 79 files PASS** and was
not rerun for H1.

Next: run this H1 suite with the related planner HTTP/presentation/snapshot suites
on the shared checkpoint, then let the parent checkpoint/publish the combined
phase. H2 owns aggregate rate-limit work; H3 owns persistence/concurrency.
