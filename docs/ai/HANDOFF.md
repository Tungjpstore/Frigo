# Frigo AI Handoff

## T06A recovery override — 2026-09-09

**T06A IN PROGRESS; T06B deferred.** The old T06 progress paragraphs below are
historical and not completion evidence. Base T05 `899b6d7`; recovered partial
checkpoint `84251cc` preserves history on `hoplite/leukas-32474504`.
Case C confirmed: published references point to absent implementation files and
`pnpm typecheck` failed exit 2. Minimal recovery removes only missing-module hooks,
missing-page routes and dead navigation; keeps nonblocking query/layout material.
No unpublished source recovery, T02–T05 rewrite or frontend implementation.
See CURRENT_STATE and `T06A_HANDOFF.md`. Recovery `pnpm typecheck`, `pnpm build`,
`pnpm test` PASS (1077 tests / 66 files). Next: commit/publish recovery, then build
the trusted backend composition.


## Current Task
T06 — AI Layer + API + Frontend Integration

## Task Status
**T06 IN PROGRESS** after explicit authorization. Base:
`899b6d790b0902c93a17ba060437e3f9802e03e9`. Required preflight reviewed;
fresh `pnpm test`: **1077 tests / 66 files PASS**. ADR-016 specifies the trusted
integration design. Backend, frontend and bounded AI presentation implementation
are underway; completion gates have not run. No PR, merge, remote migration or
deployment was requested/performed. Remaining sections preserve historical T05
evidence and will be replaced at the verified T06 checkpoint.

## T06 Frontend checkpoint

- New lazy `/planner` pages are additive to the existing React application;
  `/week` remains default. The client is cookie-authenticated, owner-fenced and
  contains no local/offline planning or shopping fallback.
- Planner UI exposes creation, plan, meal and shopping views with exact money,
  package expiry, unknown-price/no-reviewed-catalog, partial/incomplete and stale
  states. It cannot purchase/import stock; cooked is an annotation only.
- Explicit budget feedback no longer offers the current unsupported
  `within_budget` replan. Dislike is a separate taste event from skip annotation;
  retry behavior keeps the original client idempotency key and supports the case
  where the annotation succeeded but skip feedback did not.
- Exact passed checks: focused planner UI/client/T05 DTO suite **35 tests / 6
  files**, scoped planner lint, `pnpm build:web`, and `git diff --check`. Full
  `pnpm typecheck` is currently blocked by in-progress Worker
  `src/worker/services/meal-planning.ts` diagnostics. No browser, Preview or
  server was manipulated; parent owns live verification after the route is ready.

## Dependency Baseline
Exact immutable hardened T04 checkpoint:
`ebd538b4a57c2af85ad28a34c54f762093bc2403`, parent hardening
`d7dff8f5b986c141ddddb464e86524a3a367392a`. Preflight was clean; T01–T04 COMPLETE,
T05 READY. Latest T04 hardening was already in HANDOFF/CURRENT_STATE/TASK_BOARD.
Fresh baseline `pnpm test` passed **924 tests / 61 files**. No T04 architecture
repair or dependency source modification was necessary.

## Repository / Branch Topology
Configured repository `ars-vn/Frigo`; verified user-supplied `tun-vn/Frigo` redirects
there. Dedicated thread branch `hoplite/datala-8b986478` starts directly at `ebd538b`.
No fallback dependency branch, remote change, amendment, rebase or history rewrite.

T05 commits:
- `f28ab54d8084ec737382cb11a00b49275930fa3b` — preflight checkpoint, current identity,
  and removal of the old packet's now-prohibited replanning-loop requirement.
- `4f3f5394772e0be57108b179775034dbb64e5073` — implementation, tests, ADR-015 and
  shopping architecture/contract. **First-party publication confirmed this exact SHA.**
- This following documentation-only checkpoint cannot record its own SHA. Use
  `git log --reverse --format='%H %s' ebd538b..HEAD` for the full append-only range.

## Last Verified Commit
`4f3f5394772e0be57108b179775034dbb64e5073`
(`feat(shopping): add deterministic bounded budget and waste optimizer`).
Final source/tests passed all gates before this documentation-only update. Historical
T04 handoff/verification remains available at `ebd538b:docs/ai/HANDOFF.md`.

## Implemented
- Audited existing package/price/inventory/retail/receipt/shopping infrastructure.
  Legacy VND benchmarks and package-size rows do not form authoritative package
  offers. No SKU/barcode/store/bundle platform exists; none was invented.
- `createShoppingContext`: opaque, copied/frozen authorized server snapshot binding
  household/user, T04 plan, catalog as-of, explicit currency and scoped budget.
- Sole demand source: T04 per-slot shortages. Exact physical aggregation, preserved
  source meals/lines and optional/contextual uncertainty. No second inventory deduction.
- Trusted sourced package net contents, optional retail identity, price provenance,
  availability and expiry. Strict validation/deduplication, no fabricated conversions.
- Exact minor-unit money: safe-integer inputs, BigInt calculation and decimal-string
  outputs. Unknown/stale/future/estimated/foreign prices stay explicitly unpriced;
  no FX or fallback price guesses. Explicit proof is required for free offers.
- Bounded seeded iterative package search, additive global cost aggregation, default
  cost-first and optional bounded-premium surplus policy. Hard budgets filter all
  affordable premium alternatives; soft targets diagnose selected overruns.
- Structured known/incomplete totals, best-known/exhaustive cost distinctions,
  conservative lower-bound proofs, gaps/cost drivers and explicit feedback without
  hidden replanning. Unpriced alternatives cannot falsely prove an impossible budget.
- Temporal evaluation incompleteness is separate from search caps: early-use-only
  offers and pending expiry review suppress affected economic proof while preserving
  safe best-known purchases. No global temporal allocation optimum is claimed.
- Exact quantity round-trip output guard prevents serialization from erasing a tiny
  deficit or misstating purchased/surplus quantities. Unsupported range fails explicitly.
- Separate T04 existing-stock remainder and purchase surplus with sourced expiry
  risk/coverage. Unknown shelf life is unknown; no certain waste or safety inference.
- T06-ready generated output preserves upstream plan/recipe search, diagnostics,
  unplanned slots, source revisions and separate shopping search/evaluation metadata.
- 153 new tests and independent review/re-review, with all repository gates passing.

## In Progress
None in T05 implementation. This documentation checkpoint follows confirmed
implementation publication; it changes no source/tests.

## Remaining
- Review the published T05 range. Create/link a PR only on request and subscribe
  to auto-fix updates if one is created. Do not merge or deploy implicitly.
- T06 may start only with separate authorization. It must establish reviewed trusted
  data loading and authenticated integration, not accept request prices as authority.

## Files Changed
- New pure modules: `packages/recipes/src/shopping-{catalog,demand,packages,policy,
  waste,optimizer}.ts`; additive exports in `packages/recipes/src/index.ts`.
- Tests: `tests/helpers/shopping-fixtures.ts`, `tests/unit/shopping-{optimizer,
  catalog,search,hardening}.test.ts`, `tests/integration/shopping-optimizer.test.ts`.
- Documentation: `SHOPPING_OPTIMIZER.md`, `ARCHITECTURE.md`, `DOMAIN_MODEL.md`,
  ADR-015 in `DECISIONS.md`, state/board/handoff and the T05 packet.

## Database / Migration Changes
**None.** Existing 0001–0021 migrations and DB repositories are unchanged.
Full migration smoke and sandbox-local D1 apply/schema checks passed. No production
D1 access, catalog import, shopping persistence or inventory update was performed.
Generated results do not belong in legacy Week JSON or optimizer-state tables.

## Real Inventory
**NOT mutated by shopping optimization.** T05 receives no DB binding and performs
no I/O after preload. SQLite tests demonstrate unchanged stock/events/Week/shopping
rows and zero statements during generation. Input plan/catalog/budget objects remain
unchanged. No actual reservation, purchase confirmation or cooking command exists here.
Future acceptance must reauthorize and revalidate the whole inventory, plan, reviewed
catalog/prices and budget. Snapshot fingerprints are not concurrency/security tokens.

## Architecture Decisions
ADR-015 and `SHOPPING_OPTIMIZER.md` specify:
- Authorized provider boundary, not raw request price/product/safety data.
- T04 per-slot deficits only; optional shortages excluded from mandatory spending.
- Exact Quantity semantics and integer minor-unit money with explicit currencies.
- Unknown price != free; purchase surplus != certain waste.
- Bounded per-ingredient search and deterministic hard-budget premium admission,
  not a global meal/bundle/store/waste solver.
- Best-known != minimum after caps or unsupported temporal evaluation; unknown
  alternative prices invalidate unjustified economic lower bounds.
- Existing remainder is the T04 allocation witness, not globally waste-optimal truth.
- Generated-only coexistence with legacy shopping; no new schema or runtime cutover.

## Shopping Search
Default/max limits: options 12/32, states per requirement 2048/16384, total states
16384/65536, packages per requirement 128/1024. Trusted input caps: 2000 catalog
options and 2000 per-slot shortages. No full Cartesian product is materialized.

`optimization.searchExhaustive` covers traversal caps; `exhaustive` also requires
complete quantity/temporal evaluation. `truncated`/`limitReasons` describe actual
caps only. `incompleteReasons` retains evaluation limitations. Price completeness
separately controls cost/minimum and budget claims. A quantity-covered T04 plan,
fulfillable shopping result and infeasible budget remain three different facts.

## Tests

### Passed
Final source/test content before completion-only documentation edits:
- `pnpm test` — **1077 tests / 66 files**.
- `pnpm lint` — PASS.
- `pnpm typecheck` — PASS, application/packages/tests and Worker.
- `pnpm build` — PASS, Vite client and Worker TypeScript.
- `pnpm check:migrations` — PASS, `migration-smoke=ok`.
- `pnpm exec wrangler d1 migrations apply frigo-db --local` — PASS, unchanged
  existing migration chain applied in the private sandbox.
- `pnpm schema:check:local` — PASS, required ledger/schema/foreign keys.
- `git diff --check`, `git diff --cached --check` — PASS.
- Protected/dependency path diff against `ebd538b` — empty for src, migrations,
  scripts/config/package/lock files, DB, AI, domain/Week and T02–T04 implementation.

T05-only: **153 / 5 PASS** (optimizer 56, catalog 61, search 16, hardening 17,
SQLite integration 3):

```sh
pnpm exec vitest run tests/unit/shopping-optimizer.test.ts tests/unit/shopping-catalog.test.ts tests/unit/shopping-search.test.ts tests/unit/shopping-hardening.test.ts tests/integration/shopping-optimizer.test.ts
```

Focused T02–T05: **403 / 18 PASS**:

```sh
pnpm exec vitest run tests/unit/quantity.test.ts tests/unit/ingredient-availability.test.ts tests/unit/recipe-candidates.test.ts tests/unit/recipe-families.test.ts tests/unit/recipe-ranking.test.ts tests/unit/planner-{contract,inventory,nutrition}.test.ts tests/unit/weekly-planner.test.ts tests/integration/recipe-{candidates,catalog,personalization}.test.ts tests/integration/weekly-planner.test.ts tests/unit/shopping-*.test.ts tests/integration/shopping-optimizer.test.ts
```

Fresh preflight: `pnpm test` **924 / 61 PASS**, before T05 implementation.
Final logs: `.hoplite/artifacts/t05/final/`; targeted/red/setup evidence is described
in CURRENT_STATE. These ignored logs are local evidence, not hosted CI artifacts.

Regressions cover multi-meal/cross-unit aggregation, double deduction, optional/
contextual uncertainty, fractional/count packages, mixed package combinations,
exact/unknown/mixed/stale/estimated prices, free/invalid prices, all budget states,
unknown alternatives, hard/soft premiums, no options/availability/expiry exclusions,
stock/surplus risk, partial T04 plans, deterministic ordering and household isolation.

Structural stress: 32 options and a 2e9 g requirement, exactly **200 explored states**
on each of two identical runs, sufficient best-known seed, visible truncation and
no minimum claim. Shared-global-budget case uses exactly 5 states across two
searches. Ten small independent brute-force oracle cases verify exhaustive
cost/surplus/count matches. Fractional/free package cases are exhaustive. No latency
claim or wall-clock threshold is used.

Independent review initially found three issues; all were reproduced and fixed.
Re-review found **no remaining blockers**, and reran focused T05 **153 / 5 PASS**.

### Failed / Corrected
- Pre-fix `pnpm exec vitest run tests/unit/shopping-hardening.test.ts`:
  **3 failed / 1 file**. Early-use offer filtering falsely proved ¥1,000 minimum
  against a feasible ¥600 alternative; 1 + 5e-17 g rounded to 1 g; hard-budget
  surplus selection skipped a ¥105 intermediate package. All now pass. The original
  expiry-only no-option tests were corrected to require unknown/no-proof outcomes,
  not weakened into allowing expired purchases. Log: `.hoplite/artifacts/t05/review-red.log`.
- Managed setup reported the tracked settings file missing and rejected a lifecycle
  claim. Inspected effective settings and repository file, reported the platform
  fault, then successfully ran the existing durable setup command directly:
  `command -v sqlite3 >/dev/null 2>&1 || (apt-get update -qq && apt-get install -y -qq sqlite3); pnpm install --frozen-lockfile`.
  No unrelated environment/dependency/configuration changes were committed.
- Shell remote-ref discovery was policy-blocked; first-party repository tools and
  compare-and-swap publication succeeded. An absent initial T05 remote branch was
  expected; no unauthorized Git credentials/remote were used.

### Not Run
- UI/browser/preview — no UI/API change.
- Hosted CI/PR checks — no PR requested or created; no hosted success claimed.
- Remote D1, migrations, deployment and production integrations — not authorized.

## Known Limitations
- Trusted reviewed package/price snapshots must be supplied; no live catalog, FX,
  delivery fees/coupons, retailer travel/single-store policy, finite stock or bundles.
- Bounded traversal may miss better purchases; package/option/global caps remain
  visible. No global waste/knapsack optimum is claimed for premium admission.
- Offers usable only for earlier meals are not temporally allocated. Affected
  minimum/budget-infeasibility proofs remain incomplete, not falsely decisive.
- Waste risk uses existing dated evidence only; no invented shelf life, opening
  state, safe prepared leftovers or expected discarded mass.
- Numeric quantity DTOs reject exceptional exact values they cannot round-trip;
  no new rational-string quantity API was introduced.
- Generated-only; future integration must revalidate. Current legacy shopping and
  Week stay the production path; T06 is not implemented.

## Protected Areas
**PayOS/payment code untouched.** Billing, checkout, callbacks/webhooks,
subscriptions, unrelated authentication and production infrastructure unchanged.
Household isolation, inventory commands/revisions/idempotency, scan confirmation
and Week dual-write/reconciliation behavior remain intact.

## Next Task
T06 — AI Layer + API + Frontend Integration (**READY, not started**).

## Next Exact Action
1. Review the published T05 range without merging/deploying implicitly.
2. Only on separate T06 authorization, read AGENT_RULES, all required current docs,
   `tasks/T06-ai-api-frontend.md`, `WEEKLY_PLANNER.md` and `SHOPPING_OPTIMIZER.md`.
3. Define authorized server preload and reviewed quote/product sources, preserving
   household scope and product safety; never forward raw client prices as authority.
4. Integrate through the documented generated/shadow path, preserving legacy Week
   compatibility and revalidation. T06 consumes arithmetic already solved by T05.
5. Do not start a hidden T04 replan loop, actual purchase/payment or production
   cutover. If a PR is requested, create/link it and subscribe to auto-fix updates.
