# Frigo Recipe & Meal Planning — Master Specification

## Product objective

Frigo manages household food inventory and helps people decide what to cook.
The Recipe / Weekly Meal Planning platform should turn owned ingredients,
expiration information, household size, dietary restrictions, time, nutrition
goals and budget into practical meals with less waste and unnecessary shopping.

This is an incremental program, not a greenfield replacement. Existing inventory,
scan/OCR, recipe recommendations, cooking deductions, Frigo Week, shopping and
frontend screens must continue to work. See `CURRENT_STATE.md` for what actually
exists; this specification describes the target, not a completion claim.

## Domain flow

```text
Retail label / manual input / OCR -> reviewed canonical ingredient mapping
Household inventory lots -> recipe candidates -> deterministic ranking
  -> sequential weekly plan -> shopping / price / waste optimization
  -> validated AI assistance and existing frontend experience
```

- An ingredient is a food concept, not a retail SKU, a stock lot or a recipe line.
- Inventory is owned stock in particular units and storage conditions.
- Recipes and families describe demands per base serving count; availability is
  a calculation against inventory, never a stored truth on a recipe.
- Plans project consumption; generating a plan must not consume real stock.
- Shopping aggregates unmet demand after inventory subtraction **once**. Purchased
  packages and leftovers must be tracked separately from raw ingredient demand.
- Real cooking/import/discard commands remain household-scoped, transactional,
  version-fenced and idempotent.

## Core invariants

1. Never invent stock, quantities, known nutrition, prices or allergy safety.
2. Only mass and volume have universal cross-unit factors. Contextual packages,
   bunches and slices require explicit compatible context; pieces have no fixed
   mass. Estimates must remain visibly estimates.
3. Unknown is not zero, absent is not safe, and best-before is not use-by.
4. Raw labels survive normalization. Unmapped or ambiguous input is a valid
   outcome, not permission to pick the first fuzzy match.
5. Allergies/hard constraints filter before ranking. Empty or infeasible results
   must not fall back to an unsafe recipe or fabricated budget.
6. Monday's projected consumption reduces Tuesday's available lots. Replanning
   and swapping replay the relevant projection rather than double-spending stock.
7. Recipe provenance and review state are independent: curated/imported/AI/user
   source alone does not confer verification. Derived nutrition is version-bound.
8. User/household access is server-authorized. Global catalog authoring is not a
   normal household permission. Untrusted recipes cannot silently enter it.

## Deterministic core and AI responsibilities

Database/domain logic and deterministic algorithms make critical planning
decisions whenever practical. LLMs augment the system; they are **not** the source
of truth for inventory arithmetic, allergies, quantities, expiration, budgets,
hard constraints or deterministic ranking. AI can propose normalization, recipe
adaptations, instructions and explanations, subject to validation and review.
Provider failure must not prevent core planning or silently relax constraints.

## Goals and non-goals

Goals: multilingual canonical identity (initially vi/ja/en, extensible language
tags), reliable arithmetic, structured recipes/families, explicit data quality,
lot-aware planning, useful budget and waste trade-offs, explainable personalization,
and a recoverable repository-owned development protocol.

T01 non-goals: rebuilding existing recommendations/planning; mass recipe seeding;
NLP/fuzzy matching; substitutions, rankers or optimizers; AI generation; new
frontend screens; production deployment. Later tasks are defined in `tasks/`.
Across this program, PayOS and unrelated payment/auth/infrastructure work are
protected unless separately and explicitly authorized.

## Document authority

`AGENT_RULES.md` governs workflow; `ARCHITECTURE.md` maps real modules;
`DOMAIN_MODEL.md` defines contracts; `DECISIONS.md` records accepted ADRs;
`TASK_BOARD.md` and task packets define scope; `CURRENT_STATE.md` and `HANDOFF.md`
record the last checkpoint. Older reports remain historical evidence, not an
alternative current specification.
