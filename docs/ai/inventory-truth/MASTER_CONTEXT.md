# Inventory Truth Layer — repository authority

## Objective and roadmap

Answer what Frigo believes is in a household and what evidence supports it.
T08 builds a foundation, not the complete truth engine.

- T08: storage locations, lots, quantity/money/expiry/provenance contracts,
  additive persistence, legacy backfill, projection/parity and handoff.
- T09: lot commands, FEFO, CAS/idempotency, existing event authority, dual-write.
- T10: observations and reconciliation.
- T11: receipt/vision truth and inventory UX V2.
- T12: closed-loop integration and hardening.

## Authority and branch policy

User confirmed `vn-2c/Frigo` on 2026-09-09 (the initial packet named another owner).
Canonical branch: `feature/t08-inventory-truth-foundation`.
BASE_MAIN_SHA: `d1b06732f8a80db4e77986df31ff28d9f04641fa`.
Git, source, migrations, tests and these documents are authoritative, not chat or
account memory. On takeover read these six files in the specified order, inspect
Git status/HEAD/main and diff Last Verified SHA..HEAD before edits. Use trusted
repository-bound fetch/publication tools; shell fetch is blocked in this workspace.
Only the canonical branch may be published. Never force-push or merge/rebase a
new main automatically; record divergence and numbering collisions instead.

## Architecture and compatibility

Existing inputs -> `inventory_items` / `inventory_events` -> explicitly invoked
foundation backfill -> `inventory_lots` / `storage_locations` -> pure projection.
Existing inventory remains authoritative. Foundation persistence is not a live
read-path switch. No planner/cook/shopping/scan/frontend DTO or workflow cutover.
The legacy schema already permits multiple rows per ingredient; preserve row
identity rather than assuming one aggregate row per ingredient.

## Invariants

- Household ownership on each location/lot; composite relation forbids cross-tenant binding.
- Nonnegative deterministic quantities; unsupported conversion must fail, not round.
- Valid ingredient references when known; unmapped identity remains unknown.
- At most one LEGACY_BACKFILL lot per legacy inventory row.
- Backfill preserves observable legacy facts; representable active totals prove parity.
- UNKNOWN != ZERO; ESTIMATED != CONFIRMED; OBSERVED != VERIFIED.
- Money uses validated currency/minor digits/integer minor amount, never new REAL prices.
- No fabricated purchase/receipt/merchant/price/expiry confidence.

## Exclusions

Main, production/staging deployment, remote D1, secrets and flags are untouched.
The T01–T07 release/production reconciliation stream remains independent.
PayOS, billing, subscriptions, checkout and payment webhooks/migrations are protected.
No new service, event bus, auth changes, observation engine or T09–T12 implementation.

## Dependency audit

T08A in progress. Exact source/schema findings and index rationale will be added
before persistence implementation. Latest migration at base is `0022`.
