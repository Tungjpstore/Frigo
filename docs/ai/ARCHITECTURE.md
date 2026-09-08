# Architecture — audited T01 baseline

## Stack and layout

Single private pnpm project, not a pnpm workspace. `packages/*` are source folders
resolved by TypeScript/Vite aliases; there are no independent package manifests.
Lockfile versions, not README ranges, govern dependencies (React 18, Hono 4,
Zod 3, Vite 6, Vitest 3, TypeScript 5, Wrangler 3).

| Layer | Actual paths / responsibility |
| --- | --- |
| Web | `src/web/App.tsx`, `pages`, `components`, `features/week`; React Router lazy routes, Tailwind, shared TanStack Query, Zustand workflow drafts |
| Web data | `src/web/services/api.ts` compatibility facade; `http.ts` cookie transport/owner fencing; domain services; scoped query keys/cache/outbox |
| Worker | `src/worker/index.ts`, Hono `/api/v1` routers; middleware for sessions, CSRF, tenancy, rate limits; Cloudflare Queue consumer |
| Validation | `src/worker/validation/schemas.ts` Zod request schemas, additional route-local validation; older routes still contain loosely typed code |
| Domain | `packages/domain/src/index.ts` static ingredients, normalization, units/freshness; `week/*` deterministic planning, scoring, pricing, packages, portions, shopping, leftovers/utilization |
| Recipes | `packages/recipes/src/{types,data,engine,vietnamese-bank}.ts`; static `ALL_RECIPES` drives API, cook commands and Week |
| Database | `packages/db/src/{index,queries}.ts`; raw prepared SQL and D1 batch, **no ORM**; numbered `migrations/*.sql` |
| AI | `packages/ai/src/router.ts`, `schemas.ts`, `providers/*`; validated structured predictions, provider routing and mock mode |

T01 adds leaf `foundation.ts` domain/recipe contracts and `packages/db/src/catalog.ts`
for explicitly invoked catalog authoring/exact alias lookup. Legacy entry-point
types/engines remain intact. Leaf imports avoid expanding the existing
domain-week/recipes barrel dependency cycle.

## Data/runtime split (important)

- D1 contains canonical ingredients, aliases, translations, recipes, recipe lines
  and steps, but runtime normalization uses `CANONICAL_INGREDIENTS` and runtime
  recipes use `ALL_RECIPES`. They are not automatically hydrated from D1.
- At the audited seed baseline there are 45 D1 ingredients, 59 recipes, 328 recipe
  lines and 295 steps; DB aliases/translations start empty. Static catalogs contain
  aliases and optional recipe macro summaries absent from those SQL tables.
- T01 does **not** reconcile/import the whole catalog or switch any live reader.
  T02 must introduce an explicit validated catalog adapter and a drift report.
- D1 is authoritative for household inventory and commands. KV caches are not a
  replacement for failed authoritative reads; command paths already use strict
  reads, transactions/idempotency and version checks.

## Inventory, OCR and ownership

`inventory_items` are household-owned lots; canonical FK is nullable. HTTP maps
unmapped FK to `ingredientId: ''` plus normalization status. Preserve raw name.
`inventory_events` logs changes; `version` prevents stale edits. Cooking allocates
across compatible lots with command replay protection (`routes/recipes.ts`).

Scan upload -> durable scan/quota/queue state -> fenced AI/OCR worker -> `scan_items`
drafts -> user confirmation -> inventory/event transaction. Receipt metadata
comes from migrations 0013+; user review must remain between AI and stock writes.
T01's new normalized aliases and condition columns are **not wired into** this flow.

`users`, `profiles`, `households`, `household_members`, `user_preferences`, and
`weekly_planner_preferences` already exist. Household access is checked by server
session and tenancy guard. Preferences currently contain household size, cuisines,
dietary strings, language and weekly settings, not a structured nutrition/taste
model. The older preference route has weak validation/replacement semantics;
address only when extending planner preferences in T03, not unrelated auth.

## Existing recipes / Week / shopping

Recommendation scoring and seven-day sequential planning already run. Week clones
and decrements tracking inventory, scales servings, considers price/preferences,
supports swaps and shopping. Known gaps include first/last-lot matching in some
paths, string dietary tests, unsafe fallback when no eligible candidate, static
price/package assumptions and lack of hard nutrition/allergy constraints.

Week persistence has historical overlapping models: 0003 `meal_slots`, 0005
`meal_plan_slots`, and 0010 shadow `_v2` tables. Existing routes dual-write according
to `WEEK_SCHEMA_MODE`, with snapshots and legacy reads. Do not change that cutover
in T01. See `docs/WEEK_RECONCILIATION.md`, `WEEK_KV_RECOVERY.md`, `D1_SCHEMA_GATE.md`.
Existing weekly and standalone shopping lists are different workflows.

No retail SKU/barcode/product table exists; generic ingredient prices/packages
exist in SQL while runtime Week uses static providers. T05 owns product/price
context and package arithmetic, not T01.

## Environment, tests and release

- `wrangler.jsonc` binds D1/KV/R2/queues and runtime settings; `.dev.vars.example`
  documents local variables. Never commit `.dev.vars` or production secrets.
- Vite proxies to local Worker by default (`VITE_API_URL` can override).
- `.hoplite/settings.json`: idempotent sqlite3 install + frozen pnpm install;
  managed run is `node scripts/security-preview.mjs`. It serves real app/routes
  with private in-memory SQLite, mocked AI and blocked outbound backend fetches.
- `tests/helpers/sqlite-d1.ts` replays every migration with real `node:sqlite`
  constraints and atomic batch rollback; tests also cover Worker routes, frontend
  services, session boundaries and concurrency. Vitest runs Node, not a DOM browser.
- `scripts/migration-smoke.sh` tests the entire chain and historical Week/seed
  recovery cases. `scripts/d1-schema-gate.sql` checks migration ledger/schema.
- `pnpm lint`, `typecheck`, `test`, `check:migrations`, `build`; `pnpm check` wraps
  local gates. `typecheck` checks source/packages, not all test types.
- Existing `.github/workflows/{ci,deploy}.yml` and `DEPLOYMENT.md` govern release.
  T01 makes no deployment/config/auth/payment change. Existing migrations are
  immutable; 0019 is additive and ledger-applied once.

Historical `docs/HOPLITE_HANDOFF.md` and root hardening/frontend reports retain
security integration context. For this seven-task program, `docs/ai/HANDOFF.md`
supersedes their current-task/status claims; no duplicate security protocol is created.
