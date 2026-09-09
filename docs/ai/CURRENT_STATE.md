# Current State — Recipe / Meal Planning Program

Verified 2026-09-09. **T06 IN PROGRESS** after explicit authorization. Immutable
T05 base `899b6d790b0902c93a17ba060437e3f9802e03e9`; fresh `pnpm test` baseline
passes **1077 tests / 66 files**. Required preflight and architecture review complete;
ADR-016 records the integration boundary. Implementation and final verification are
pending. The sections below retain the verified T05 checkpoint until the T06 handoff.
Local verification is not hosted CI, production migration or deployment evidence.

## T06 frontend checkpoint — 2026-09-09

- Additive `/planner` React routes/screens use only authenticated server APIs and
  owner-scoped Query keys. Legacy `/week` remains the default route and its
  offline/local-plan behavior is not reused.
- The mobile plan, meal, and shopping screens preserve visible partial,
  incomplete, stale, unknown-price, exact-money, package-expiry, and no-reviewed-
  catalog states. The shopping surface cannot purchase/import inventory. A cooked
  annotation is explicitly non-inventory-mutating.
- Budget feedback is display-only: the UI no longer offers a `within_budget`
  replan which the current no-reviewed-catalog service correctly rejects. Taste
  feedback is distinct from a skip annotation, and retry actions retain the
  original idempotent client command.
- Focused checks passed: `pnpm test --run tests/unit/meal-planning-client.test.ts
  tests/unit/planner-actions.test.ts tests/unit/planner-cache.test.ts
  tests/unit/exact-display.test.ts tests/integration/planner-ui.test.tsx
  tests/unit/meal-planning-shopping-dto.test.ts` (**35 tests / 6 files**), scoped
  planner lint, `pnpm build:web`, and `git diff --check`. Full `pnpm typecheck`
  remains blocked by the in-progress Worker `meal-planning.ts` implementation,
  not by a frontend diagnostic. Browser/managed-preview verification was not run
  because parent ownership is explicit.

## Repository and checkpoint

Configured repository: `ars-vn/Frigo`. The supplied `https://github.com/tun-vn/Frigo`
was verified to redirect there. Current dedicated T05 branch:
`hoplite/datala-8b986478`. No remote change, history rewrite, PR, merge or deployment.

Preflight verified a clean tree at hardened T04 checkpoint
`ebd538b4a57c2af85ad28a34c54f762093bc2403`, immediately after
`d7dff8f5b986c141ddddb464e86524a3a367392a`. All required documents, T01–T05 packets,
T02/T03/T04 contracts and Git history/diff were read. T01–T04 were COMPLETE and T05
READY. The latest T04 hardening was already included in HANDOFF; no T04 architecture
repair was needed. Historical repository/branch names were corrected in a preflight
checkpoint, and the old packet's proposed replanning loop was superseded by the
explicit no-replanning task authorization.

New append-only commits:
- `f28ab54d8084ec737382cb11a00b49275930fa3b` — verified T04
  baseline, current repository/branch and T05 scope checkpoint.
- `4f3f5394772e0be57108b179775034dbb64e5073` — implementation, 153 tests, ADR-015,
  architecture/domain updates and `SHOPPING_OPTIMIZER.md`.

First-party publication confirmed implementation head
`4f3f5394772e0be57108b179775034dbb64e5073` on the dedicated branch. This following
handoff-only commit records the verified implementation and cannot contain its own
hash. Enumerate the complete range with:
`git log --reverse --format='%H %s' ebd538b..HEAD`.
Historical T04 evidence remains at `ebd538b:docs/ai/{CURRENT_STATE,HANDOFF}.md`.

## Existing infrastructure assessment

Legacy standalone and Week shopping remain separate production workflows. Migration
0003 contains `ingredient_prices` and `ingredient_package_sizes`, but no reliable
package-price relation, price source reference, retail SKU/barcode/store identity,
stock-quantity offer catalog or bundle model. Runtime Week uses static **VND**
benchmarks and unitless package heuristics, including unsafe unknown-price fallbacks
for authoritative use. Receipt merchant/price fields are OCR draft observations,
not reviewed current offers. None of those defaults is promoted into T05 authority.

T05 reuses canonical ingredient IDs, explicit package concepts and T02 exact
Quantity/strict physical conversion. No new retail platform, table or migration.

## Implemented T05

- Opaque copied/frozen server-owned shopping context, matching household/user,
  scoped budget and inventory/delta/offer ownership. Schema validation does not
  confer authority: a trusted provider must never forward client/LLM price or
  product/safety claims. No endpoint or catalog writer is introduced.
- Per-slot T04 missing quantities are the only purchase deficit. Compatible physical
  units aggregate across meals; original provenance survives. Original inventory
  is never deducted twice. Contextual pack/bunch/slice requirements remain unresolved
  and distinct; fractional pieces remain mathematical requirements. Optional demand
  is exposed but not purchased or budgeted.
- Sourced explicit package net contents, optional product/retailer identity,
  availability, price observation and expiry evidence. Duplicate/conflicting
  identities and invalid values are handled deterministically. No inferred density,
  multipack restriction, retailer route, live stock or bundle semantics.
- Mandatory currency identity (VND/JPY/USD/EUR), safe integer minor-unit inputs,
  BigInt monetary arithmetic and decimal-string calculated money. Stale, future,
  estimated, foreign-currency and unknown prices retain observations/diagnostics,
  not fabricated zero cost. Free offers require explicit evidence.
- Bounded iterative per-requirement package enumeration with homogeneous seeds and
  one shared state budget. Default cost-first; optional dimensionless bounded-cost-
  premium surplus reduction. Hard budgets admit the best affordable improvement
  from all enumerated premium candidates; soft targets report overruns.
- Separate known subtotal, unknown item count, exact selected total, best-known
  complete cost, exhaustive minimum and proven lower bound. Unknown-price
  alternatives suppress unjustified infeasibility proofs. A truncated over-budget
  witness is not an impossible-budget proof. Hard budget feedback never replans.
- Partially usable early-expiring offers and pending expiry review suppress affected
  economic proof without pretending a computational cap occurred. Useful best-known
  late-valid purchases remain available with explicit incomplete reasons.
- Exact decimal round-trip checks at demand/purchased/surplus Number boundaries:
  lossy quantities throw rather than silently erasing a shortage or inventing stock.
  Utilization is only an approximate display ratio.
- T04 final inventory and purchased surplus are distinct. Dated expiry gives risk,
  not certain disposal. Unknown shelf life remains unknown; no inferred opening,
  storage safety or LLM waste calculation. T04 allocation is not globally waste optimal.
- T06-ready schema-version-1 output includes all selected package arithmetic,
  provenance, budget feedback, risk, upstream completeness/diagnostics/search,
  separate T05 search/evaluation metadata and stale-detection references.
- Pure generated-only library. No DB/network calls inside search, real stock writes,
  plan changes, legacy cutover, T06 implementation, AI authority or payment.

See `SHOPPING_OPTIMIZER.md` and ADR-015 for full contracts, objective, money units,
proof scope, diagnostics, temporal restrictions and caller responsibilities.

## Verification — exact executed checks

All final source/test edits preceded these gates; only completion documentation
changed afterward. Logs are ignored under `.hoplite/artifacts/t05/final/`.

| Command | Result |
| --- | --- |
| `pnpm test` | PASS — **1077 tests / 66 files** |
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS — application/packages/tests and Worker |
| `pnpm build` | PASS — Vite client and Worker TypeScript |
| `pnpm check:migrations` | PASS — `migration-smoke=ok` |
| `pnpm exec wrangler d1 migrations apply frigo-db --local` | PASS — unchanged existing 0001–0021 applied to sandbox-local D1 |
| `pnpm schema:check:local` | PASS — required ledger/schema/foreign keys |
| `git diff --check`, `git diff --cached --check` | PASS |
| Protected/dependency-path diff against `ebd538b` | Empty; includes src, migrations, DB, AI, domain/Week, T02–T04 core, scripts/config/package/lock files |

Focused T02–T05: **403 tests / 18 files PASS**, exact command:

```sh
pnpm exec vitest run tests/unit/quantity.test.ts tests/unit/ingredient-availability.test.ts tests/unit/recipe-candidates.test.ts tests/unit/recipe-families.test.ts tests/unit/recipe-ranking.test.ts tests/unit/planner-{contract,inventory,nutrition}.test.ts tests/unit/weekly-planner.test.ts tests/integration/recipe-{candidates,catalog,personalization}.test.ts tests/integration/weekly-planner.test.ts tests/unit/shopping-*.test.ts tests/integration/shopping-optimizer.test.ts
```

T05 alone: **153 tests / 5 files PASS**: optimizer 56, catalog 61, search 16,
hardening 17, SQLite integration 3. Command:

```sh
pnpm exec vitest run tests/unit/shopping-optimizer.test.ts tests/unit/shopping-catalog.test.ts tests/unit/shopping-search.test.ts tests/unit/shopping-hardening.test.ts tests/integration/shopping-optimizer.test.ts
```

Fresh preflight `pnpm test`: **924 / 61 PASS** before T05 implementation. All baseline tests remain.
Independent review reproduced three defects, then re-reviewed the fixes and found
no remaining blockers; its final focused execution also passed 153 / 5.

## Bounds and structural performance

Default/max: options per requirement 12/32; states per requirement 2048/16384;
global states 16384/65536; packages per requirement 128/1024. Input caps: 2000
catalog options, 2000 per-slot shortage rows. No full Cartesian product or DB query
inside enumeration. Stable requirement/offer order and all cap reasons are explicit.

Stress: 32 options, 2-billion-gram requirement, per-requirement cap 200, global cap
300, package cap 1024. Two identical runs each explore exactly **200 states**,
retain a sufficient seeded choice and report truncation/non-exhaustiveness. Shared
budget test stops at exactly 5 total states across two ingredient searches. Ten
small independent brute-force oracle cases prove exhaustive cost/surplus/count
matches; fractional package and free-price cases are exhaustive. No flaky timing
assertion or production latency guarantee.

## Failures investigated and corrected

- `pnpm exec vitest run tests/unit/shopping-hardening.test.ts` before fixes:
  **3 failed / 1 file**. Counterexamples: false infeasibility after excluding an
  early-use package; rounded-away 5e-17 g deficit; skipped affordable intermediate
  surplus option. All corrected; final hardening suite has 17 passing regressions.
  Red log: `.hoplite/artifacts/t05/review-red.log`.
- Managed setup/settings tools incorrectly reported tracked `.hoplite/settings.json`
  absent, and `sandbox_setup` rejected its lifecycle claim. Platform issue reported.
  The existing repository-owned sqlite3 install + `pnpm install --frozen-lockfile`
  command ran successfully via shell. No unrelated configuration change was needed.
- Shell remote-ref discovery was policy-blocked; first-party repository tools and
  exact-lease publication were used instead. The initially absent T05 remote branch
  was expected and was created by confirmed authorized publication.

## Persistence, compatibility and protected areas

No migrations or production data changes. Existing schema was replayed locally only.
Legacy Week, standalone shopping, inventory commands, revision/idempotency logic,
authentication, production infrastructure and PayOS/payment code are untouched.
Future acceptance must reauthorize and reread plan/inventory/catalog/budget snapshots;
fingerprints are not authorization or collision-proof concurrency locks.

## Genuine remaining limitations / not run

- No live reviewed retail catalog is populated; server integration must supply
  trustworthy quotes/contents and product suitability. Legacy/OCR defaults are not
  authoritative. No FX, travel/store constraint, fees/promotion or bundle solver.
- Bounded search can miss better purchases. Partial-horizon dated offers are not
  temporally allocated; affected proofs are explicitly incomplete, not infeasible.
- Waste risk uses supplied expiry evidence only, not invented shelf life or expected
  discarded mass. Surplus reduction is not globally optimal waste allocation.
- Exceptional quantities that cannot round-trip exactly through the numeric DTO
  reject explicitly; there is no rational-string quantity DTO in this release.
- Generated-only contract; no API/frontend/cutover. UI/browser/preview and hosted CI
  were **NOT RUN**, no PR requested/created. Remote D1/deployment **NOT RUN / not authorized**.

## Next exact action

T06 is READY but not started. On explicit authorization, read AGENT_RULES, required
current documents, `tasks/T06-ai-api-frontend.md`, `WEEKLY_PLANNER.md` and
`SHOPPING_OPTIMIZER.md`; design the authenticated preload/shadow integration and
reviewed price/product source without recomputing package arithmetic or trusting
client quotes. Preserve legacy compatibility and revalidate before any acceptance.
Do not merge, deploy, start T06 or alter payment code implicitly.
# T06A recovery assessment — 2026-09-09

Current task is **T06A IN PROGRESS**, backend only; T06B is deferred. This section
supersedes the interrupted T06 progress claims above, which describe unpublished
files rather than the committed tree.

- Workspace initially clean at `db09fa0` (T02). Authorized remote is
  `https://github.com/arsvn-vn/Frigo.git`, not a newly configured remote.
- Fetched published T05 `899b6d790b0902c93a17ba060437e3f9802e03e9` and partial T06
  `84251cc0b4cf5ced9f62b430b74418a14d2c438c` through the trusted broker. Fast-forwarded
  existing thread branch `hoplite/leukas-32474504`; both are now ancestors. No
  descendant of 84251cc was found on the fetched published task branches.
- **Case C**: `pnpm typecheck` at 84251cc failed (exit 2): absent DB, domain, Worker,
  AI and frontend integration modules plus cascading frontend type errors.
  No implementation, migration or test files were committed by that checkpoint.
- Recovery removes dangling imports/exports and missing-page routes; dead `/planner`
  navigation is removed because its target does not exist. Existing scoped query
  keys and layout exclusion remain untouched as T06B recovery material. Useful
  T04 projection export and opt-in environment declarations remain. No earlier
  history is reset or amended; no unpublished workspace is reconstructed.
- AI hooks are T06B; DTO exports are shared contracts; DB/Worker registration and
  feature flag are T06A; page/client references are T06B. No unrelated change found.
- Setup tool misreported tracked settings and rejected its lifecycle claim; exact
  repository-owned sqlite3 install/frozen pnpm setup succeeded via shell. Platform
  fault reported. Recovery `pnpm typecheck`, `pnpm build`, `pnpm test` PASS
  (**1077 tests / 66 files**); no backend implementation yet.

See `T06A_HANDOFF.md` for durable checkpoints and next action. Historical T05
evidence above is not fresh T06A verification.
