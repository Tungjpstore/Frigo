# T02 — Recipe Engine

## Task ID

T02

## Title

Recipe Engine

## Objective

Build a deterministic candidate-generation engine over the Task 1 canonical ingredient, unit, recipe, and family contracts. It must calculate actual availability, shortages, scaling, finite family variations, explicit substitutions, and rescue candidates without taking responsibility for personalized ranking.

## Dependencies

T01 complete. Read its migration/contracts, ADRs, current state, handoff, this packet, and existing recipe/week tests.

## Context

Today, `@frigo/recipes` evaluates/ranks static `ALL_RECIPES`; its inventory map overwrites all but the last lot of an ingredient. The Week implementation uses a different first-lot behavior. T02 must consolidate calculation semantics incrementally around canonical IDs and lot-aware aggregation without replacing the static runtime catalogue or prematurely changing public behavior. D1 uses raw SQL, not an ORM.

## In Scope

- Define deterministic input/output contracts for recipe availability and candidate generation.
- Build an internal validated catalog adapter for existing static/D1 inputs without switching live readers. Report canonical ID/unit/recipe drift and legacy alias collisions; promote only explicitly reviewed normalized aliases. Do not import conflicting data with replacement semantics.
- Aggregate inventory by canonical ingredient across eligible lots while retaining lot-level allocation details and conversion failures.
- Calculate required versus optional coverage, shortages by quantity/unit, and `canCookWithoutBuying`; distinguish missing, insufficient, incompatible-unit, unknown-canonical, and unavailable/expired states.
- Scale structured recipe requirements from base servings to requested servings with documented quantity rounding. Do not turn contextual retail units into mass/volume.
- Expand only finite, persisted recipe-family slots into valid variants. Require explicit slot constraints and stable identifiers/provenance for generated variants.
- Implement deterministic, data-backed substitutions; retain reason, eligibility constraints, quantity conversion requirement, and source. Never invent a substitution via a heuristic or LLM.
- Produce rescue candidates that consume eligible near-expiry lots where their structured requirements support it.
- Add unit and integration tests covering multiple lots, compatible and incompatible conversion, required/optional rows, partial shortages, zero/invalid servings, no inventory, family bounds, substitution safety, and no candidates.

## Out of Scope

- Preference, cuisine, time, cost, variety, nutrition, or expiry weighting/ranking beyond candidate annotations.
- Weekly multi-day planning, shopping aggregation, budget decisions, UI/API changes, D1 runtime catalogue cutover, AI generation, and generalized NLP normalization.

## Required Deliverables

- A reusable, typed candidate/availability module placed according to existing domain/package conventions.
- Deterministic errors or structured infeasible/empty outputs instead of unsafe fallback recipes.
- Tests demonstrating that inventory is summed/allocated across lots rather than last-lot overwrite or first-lot-only behavior.
- Documentation updates describing any compatibility bridge or migration strategy.

## Acceptance Criteria

- Two compatible lots of one canonical ingredient can cover one requirement; incompatible lots cannot be counted as coverage.
- Required shortages report a numeric missing amount only in a compatible unit; contextual/unknown conversions remain explicit unresolved requirements.
- Optional ingredients never prevent candidacy, but are reported separately.
- With empty inventory and shopping allowed, otherwise valid candidates report zero availability and full missing requirements. In no-buy mode they are excluded. Unknown stock never creates invented coverage; invalid recipes, unsafe substitutions and no valid family variants yield explicit exclusion reasons, not guessed candidates.
- All generated family variants are finite, satisfy required slots, preserve source/template provenance, and remain compatible with existing structured recipe ingredients.
- Existing `ALL_RECIPES` remains available and unchanged as the legacy runtime source until an explicitly approved cutover.

## Verification

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm check:migrations
pnpm build
```

Add focused tests alongside `tests/unit/recipe-engine.test.ts` or an appropriately named new test, and use `tests/helpers/sqlite-d1.ts` for persistence behavior. Record test counts/results and any skipped command.

## Known Risks

- Existing static recipe rows may contain incomplete canonical/unit data. Return structured incompatibility rather than fabricate coverage.
- Lot allocation ordering affects later expiry/waste behavior; make it explicit and preserve enough allocation data for T04.
- Substitutions can violate allergies/dietary rules; they must be data-backed and later eligibility-safe, not automatic text replacements.

## Protected Areas

PayOS, billing, unrelated auth/tenancy/cookies, deployment, scan confirmation, and Week dual-write/reconciliation behavior. Do not implement score ordering in this task.

## Expected Handoff

Update protocol state with contracts, compatibility choices, and exact test evidence. T03 starts by consuming T02 candidate outputs and defining a separate eligibility/ranking layer; it must not duplicate availability or unit arithmetic.
