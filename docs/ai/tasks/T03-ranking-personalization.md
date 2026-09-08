# T03 — Ranking & Personalization

## Task ID

T03

## Title

Ranking & Personalization

## Objective

Implement a deterministic eligibility and ranking layer over T02 candidates, with household/user preferences and feedback. The layer must explain score components and refuse unsafe choices; an LLM must not be required for core ranking.

## Dependencies

T02 complete.

Read `../RECIPE_ENGINE.md`, ADR-011/012, T02 `candidates.ts` and its unit/integration
tests before editing. `generateRecipeCandidates` supplies requirement status,
shortages/uncertainty, approved replacement traces, raw coverage/classifications,
source/version identity and family truncation. It explicitly assesses quantities
only; hard allergy/dietary/nutrition eligibility is not implied by cook-now coverage.

## Context

Frigo already has a simple recipe score in `@frigo/recipes` and preference data, but it is not a complete, persisted, safety-aware ranking contract. T02 owns availability and shortage calculations. T03 must consume those outputs rather than recreate inventory maps or unit conversions.

## In Scope

- Define deterministic eligibility gates before scoring: allergy conflicts, dietary restrictions, verified ingredient/recipe data, hard cooking-time constraints, and unresolved unit/nutrition assumptions where a requested hard constraint depends on them.
- Persist/read authorized household or user feedback for liked, disliked, cooked, skipped, and swapped recipes/ingredients according to established tenancy conventions.
- Define cuisine preferences, recent-meal history and household-member preference aggregation/conflict behavior. Extend and validate existing preference routes only as needed for this task; keep authentication and membership authorization unchanged.
- Produce a transparent score breakdown with documented components: inventory match, expiry priority, preference, nutrition fit, cooking-time fit, variety/recent meals, and cost fit when reliable inputs exist.
- Define explicit neutral/unknown-data behavior and stable tie-breaking.
- Retire or bridge the current monolithic ranking implementation only through compatible callers and regression tests.
- Test deterministic ordering, hard exclusions, feedback effects, recently cooked penalties, ties, empty candidates, missing nutrition data, and unknown/allergen data.

## Out of Scope

- Candidate generation/lot aggregation, seven-day planning, shopping optimization, AI ranking, natural-language explanations, frontend planner UI, or preference redesign unrelated to recipes.

## Required Deliverables

- Typed eligibility result and score breakdown that callers can audit.
- Durable feedback persistence/query contract with household/user authorization.
- Clear, configured/default component weights and deterministic tie-break order.
- Documentation/ADR if preference ownership, data quality policy, or legacy-score migration changes accepted architecture.

## Acceptance Criteria

- A recipe or substitution with an explicit allergy conflict is rejected, not merely penalized.
- Missing/unknown allergen information is rejected whenever the requested safety policy cannot be proven; document any less-strict product policy before implementing it.
- Nutrition-based hard requirements do not pass with missing/estimated data unless the user policy explicitly permits estimates and the result exposes that qualification.
- Same input snapshot produces identical eligibility, breakdown, and order.
- Feedback modifies eligible recipe ordering predictably but cannot override safety gates.
- No LLM/API call is necessary to return ranked candidates.

## Verification

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm check:migrations
pnpm build
```

Add D1 tests with `tests/helpers/sqlite-d1.ts` for constraints/tenancy if persistence changes. Include regression coverage for existing recipe consumers and record actual results.

## Known Risks

- Preferences currently span user and household concepts; do not leak one member's data across households.
- Scores are not safety policies. Keep eligibility separate and evaluate it before every score.
- Imported/AI provenance can be insufficient for nutrition/allergen assertions; fail closed for hard constraints.

## Protected Areas

PayOS, unrelated auth/session mechanics, deployment, scan confirmation, and Task 4+ planning/shopping features. Do not make a weekly plan here.

## Expected Handoff

Document score inputs, eligibility policy, persisted feedback schema, migration impact, weights, test results, and any legacy bridge. T04 must use the ranked eligible candidate list but retain sequential inventory simulation as its own responsibility.

## First Recommended Action

Write a failing eligibility regression using actual T02 output: a candidate with
full quantity coverage must be excluded before scoring when an explicit allergen
conflict exists or a requested hard safety condition lacks trustworthy evidence.
Also preserve an empty/truncated-family result without an unsafe fallback. Build
the separate eligibility/score contract around these facts, not a new inventory
map or quantity converter. Keep legacy ranker bridging explicit and reviewed.
