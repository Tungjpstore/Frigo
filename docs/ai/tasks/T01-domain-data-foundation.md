# T01 — Domain & Data Foundation + AI Development Protocol

## Task ID

T01

## Title

Domain & Data Foundation + AI Development Protocol

## Objective

Create the additive, typed and validated foundation that later recipe/planning work can depend on, while preserving Frigo's existing runtime behavior. Make the repository self-describing through durable architecture, decision, state, handoff, and task documentation.

## Dependencies

None. Read the existing repository and all AI protocol files before implementation.

## Context

Frigo is a React/Vite PWA with a Hono Cloudflare Worker and D1 accessed through raw SQL; it does not use an ORM. The static `@frigo/domain` ingredient catalog and `@frigo/recipes` `ALL_RECIPES` catalog are currently the principal runtime catalogues, while D1 recipes are seeded/persisted but are not the runtime source of truth. Existing recipe matching/ranking uses a last-lot-wins inventory map. Existing Week logic produces a sequential seven-day plan using first-lot matching and has an unsafe fallback when no eligible recipe exists. Preserve legacy behavior while creating a safe, explicit migration path.

The Task 1 implementation is additive migration `0019` plus shared, validated ingredient/alias/unit/nutrition/storage and recipe-family contracts. Its focused hardening appends `0020`; published/applied 0019 is not rewritten. It must not switch production runtime reads from the static catalog to D1.

## In Scope

- Audit package layout, Worker routes/services, D1 migrations, domain/recipe packages, validation, tests, configuration, and Git state.
- Establish clear boundaries among canonical ingredient, retail product, household inventory lot, recipe ingredient, recipe family, nutrition data, preferences, meal plan, and shopping list.
- Extend canonical ingredients with default/localized names, normalized aliases and category/subcategory. Use concrete storage, nutrition and tag relations rather than a speculative generic metadata bag; aliases must support multilingual OCR/manual/import inputs without assuming a three-language limit.
- Define a unit taxonomy that distinguishes convertible mass (`g`/`kg`) and volume (`ml`/`l`) from contextual/non-convertible count, piece, slice, bunch, and package units. No fabricated food-density or package-to-mass conversion.
- Define nutrition with explicit basis quantity/unit (e.g. 100 g, 100 ml, 1 piece or recipe serving) and provenance/quality appropriate to authoritative, imported, calculated, and estimated data.
- Capture storage and expiration provenance needed for future waste prioritization: opened state, storage condition, best-before/use-by/estimated/user-entered/OCR-derived dates where compatible with existing inventory behavior.
- Add relational recipe and recipe-family/template foundations needed for structured ingredients, required/optional status, quantities/units, provenance, verification/version, controlled metadata, and finite variation slots.
- Add only justified foreign keys, `CHECK`s, unique constraints, and expected-query indexes. Use additive D1 migration conventions and preserve existing data.
- Add focused tests for validation, aliases, units, relational constraints, and recipe-family/ingredient integrity using `tests/helpers/sqlite-d1.ts` where database behavior is tested.
- Create and update the durable `docs/ai` protocol, state, decision record, handoff, task board, and all task packets.

## Out of Scope

- Candidate generation, recipe recommendation/ranking redesign, personalization, weekly planning, shopping optimization, price optimization, waste optimization, AI recipe generation, or planner UI.
- Replacing static `ALL_RECIPES`, migrating or bulk-seeding a recipe bank, or loading D1 catalogues at runtime.
- Arbitrary unit conversions (for example, onion-to-grams), a complete nutrition database, retailer integration, OCR matching NLP, or broad data backfill.
- PayOS/payment work, authentication redesign, deployment/infrastructure changes, and unrelated refactors.

## Required Deliverables

- Audited, additive migration `0019` and follow-up `0020`, replayable with prior migrations and safe for a populated 0019 database; dirty preflight failures must preserve data.
- Shared TypeScript contracts/validation for the accepted foundation, integrated through current package conventions.
- Tests that exercise meaningful positive and fail-closed cases, including duplicate normalized aliases, incompatible units, invalid quantities/bases, recipe ingredient constraints, and family-slot integrity as applicable.
- `docs/ai/{MASTER_SPEC,AGENT_RULES,ARCHITECTURE,DOMAIN_MODEL,DECISIONS,TASK_BOARD,CURRENT_STATE,HANDOFF}.md` and all seven packets under `docs/ai/tasks/`.
- ADRs documenting canonical ingredient versus inventory, alias normalization, unit/nutrition provenance, recipe-family representation, static-catalog coexistence, and deterministic versus AI boundaries when those decisions are implemented.

## Acceptance Criteria

- Existing inventory records remain valid; no destructive migration, silent data deletion, or runtime catalogue switch occurs.
- An alias such as Vietnamese `ức gà`, English `chicken breast`, and Japanese `鶏むね肉` can be represented as aliases/localized names for one canonical ingredient, with normalized lookup designed for future resolution.
- Only compatible physical units convert; unknown/contextual units remain unavailable for automatic arithmetic unless a documented explicit conversion exists.
- Nutrition has an explicit basis and provenance rather than silently treating estimates as authoritative.
- Inventory lot, canonical ingredient, and retail product remain distinct; household ownership stays on household-scoped records.
- Recipe ingredients are structured and queryable; recipe families express bounded slots/allowed choices without materializing infinite variants.
- AI/imported recipes can be distinguished from curated/verified content.
- Canonical ingredient IDs remain uppercase ASCII snake case in validation and SQL; case variants cannot create separate identities. General recipe/family/profile IDs remain separate.
- Recipe nutrition links equal the current recipe version in the database; inconsistent INSERT/UPDATE and parent version changes are blocked until links are explicitly replaced transactionally.
- Imported/AI recipes and families require traceable nonblank references in validation and SQL. A source reference never establishes verification or private publication authority.
- T02 has explicit candidate/work budgets and an oversized-family acceptance case; no expansion algorithm is implemented in T01.
- The existing Week dual-write/reconciliation strategy, auth cookies/tenancy/idempotency/version controls, and scan-confirm flow remain untouched.
- Documentation reports implementation reality, exact verification results, known legacy limitations, and a precise T02 start action.

## Verification

Run from repository root after implementation:

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm check:migrations
pnpm build
pnpm exec wrangler d1 migrations apply frigo-db --local
pnpm schema:check:local
```

The SQLite/D1 integration helper is `tests/helpers/sqlite-d1.ts`; its `node:sqlite` dependency requires Node 22.13 or newer (the current development runtime is Node 24). Review migration replay/foreign-key behavior and the final diff; record any command not run or failed verbatim in the handoff.

## Known Risks

- D1 and static catalogues are divergent sources today; enabling a runtime read switch would alter behavior and is not safe in T01.
- The existing engine's last-lot overwrite and Week first-lot fallback are legacy limitations, not behavior to conceal with this migration.
- D1 SQLite migration capabilities constrain destructive alterations; use new tables/additive columns and compatibility bridges instead.
- Recipe/ingredient data supplied by imports or AI is untrusted until a later verification workflow accepts it.

## Protected Areas

- PayOS integrations, billing, checkout, webhooks, and `migrations/0018_payments.sql`.
- Unrelated authentication, session/cookie, tenancy, idempotency/version, scan-confirm, deployment, and production infrastructure behavior.
- Week dual-write and reconciliation code, except documentation of its existing state.

## Expected Handoff

Mark T01 complete only after all relevant checks have actual results. Update `CURRENT_STATE.md`, `TASK_BOARD.md`, `HANDOFF.md`, and `DECISIONS.md`; include exact changed files, migration effects, test commands/results, unresolved catalogue divergence, and this next action: **start T02 by reading the T02 packet, the Task 1 contracts/migration, and current recipe/Week engine tests before implementing candidate generation.**
