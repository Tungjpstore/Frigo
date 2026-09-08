# Architecture Decisions

All entries accepted in T01. Supersede an ADR explicitly; do not silently rewrite
the agreed architecture. Later tasks must record migration and compatibility impact.

## ADR-001 — Extend existing identities and runtime boundaries

**Status:** Accepted 2026-09-08

**Context:** D1 and static catalogs already model ingredients/recipes. Inventory
and Week have household isolation, command fencing and compatibility migrations.
Replacing these for a new greenfield planner would duplicate or break live behavior.

**Decision:** Extend existing tables/IDs additively. Keep Ingredient, Inventory Item,
Retail Product, Recipe/line, Family, Nutrition, Preferences, Plan and Shopping as
separate concepts. Keep static normalization/`ALL_RECIPES` readers and all current
routes unchanged in T01. New catalog helpers are explicit library calls, not APIs.

**Consequences:** T01 data is not automatically visible in old screens. T02 needs
an explicit audited catalog adapter and import/drift policy; no hidden dual source
switch. Household commands, Week dual-write and old DTOs stay compatible. Leaf
foundation imports avoid expanding the existing domain/recipe barrel cycle.

**Alternatives considered:** New ingredient/recipe replacement tables; wholesale
ORM migration; immediate D1 runtime cutover. Rejected as unnecessary risk/scope.

## ADR-002 — Multilingual exact alias keys, explicit ambiguity

**Status:** Accepted 2026-09-08

**Context:** Existing aliases are loose strings; runtime uses first substring
matches. SQL cannot reliably perform full Unicode normalization on historical data.

**Decision:** Preserve raw aliases, add canonicalized language and nullable
normalized key. App uses NFKC/whitespace/lowercase, preserving accents. Unique
non-NULL `(language, normalized_alias)`; look up exact locale plus `und` and fail
closed as ambiguous if more than one ingredient matches. Atomic authoring also
indexes localized/default names. Preserve old NULL keys for reviewed promotion.

**Consequences:** Locale collisions are rejected; cross-locale/und ambiguity is
represented, not resolved by insertion order. Japanese works without a special
schema; retail quantity stripping/fuzzy NLP/automatic locale fallback wait. New
SQL writers must follow application normalization. No destructive alias backfill.

**Alternatives considered:** Global unlocalized alias uniqueness, accent folding,
SQL `lower()` backfill, first-match fuzzy resolution. Rejected for false matches.

## ADR-003 — Physical dimensions versus contextual retail quantities

**Status:** Accepted 2026-09-08

**Context:** Strict conversion already exists alongside a legacy numeric fallback.
Retail packages and count units lack universal mass/density.

**Decision:** Preserve `StandardUnit` and strict helpers. Add mirrored unit reference
data/typed dimensions: mass g/kg, volume ml/l, piece count, contextual pack/bunch/
slice. Only exact physical factors are universal; contextual identity is not proof
that two differently sized packages can be pooled.

The SQL catalog constrains codes/dimensions/bases/factors to this supported set;
adding a unit requires a matching typed change and migration, not an arbitrary row.

**Consequences:** No arbitrary onion/egg/package-to-gram conversion. Product-specific
content/estimates and rounding policy belong to T05. Tests detect SQL/type drift.
No change to legacy inventory conversions or guarded cooking commands.

**Alternatives considered:** Convert all units to grams; introduce a generic
conversion graph now. Rejected as unsafe or speculative.

## ADR-004 — Explicit nutrition basis, provenance and unknown safety state

**Status:** Accepted 2026-09-08

**Context:** Runtime recipes have optional unproven macro totals; no ingredient
nutrition schema or structured allergen evidence exists.

**Decision:** Store nullable nutrient observations in independent basis-aware
profiles (kcal/g/mg), linked to ingredients or recipe versions. Distinguish
authoritative/imported/calculated/estimated with a reference. Separate ingredient
allergen/dietary assertions from unknown/reviewed state and recipe classifications.

**Consequences:** NULL is not zero; absence of tags is not safe. Existing macros
are not promoted or reinterpreted. Later code chooses trusted applicable profiles
and current recipe version; authoritative labeling alone is not verification.
No complete nutrition database, nutrient calculator or allergy guarantee in T01.

**Alternatives considered:** Unqualified totals on recipes, JSON nutrition blob,
implicitly safe empty tags. Rejected for arithmetic/safety ambiguity.

## ADR-005 — Families as bounded relational slots and options

**Status:** Accepted 2026-09-08

**Context:** Structured recipe lines exist, but modeling every fried-rice variation
as a separate dish scales poorly and obscures canonical identity.

**Decision:** Families define base servings and min/max selection slots; options
carry canonical ingredient, quantity and unit. Recipes optionally reference a
family. Core recipe quantities/servings remain existing relational fields; add
provenance/version/review fields and descriptive classifications.

**Consequences:** FK/unique/check constraints plus full-object validation protect
authoring. Families require an atomic complete write; SQL alone cannot enforce
aggregate option counts. T02 owns bounded generation and coherent instructions;
options are not arbitrary safe substitutions. Current global source metadata does
not create private user recipe ownership/publication authority.

**Alternatives considered:** Unstructured JSON templates, EAV rule engine, storing
all variations. Rejected for weak referential integrity or premature complexity.

## ADR-006 — Lot condition evidence without inventory rewrite

**Status:** Accepted 2026-09-08

**Context:** Inventory has storage/expiry but no date kind/source or opening evidence.
Rewriting inventory commands would threaten event/revision/idempotency guarantees.

**Decision:** Add nullable opening timestamp and unknown-default expiry kind/source
to existing lots; separate sourced ingredient/storage/package-state shelf-life
guidelines. Do not backfill guesses or expose side-channel writes in T01.

Non-unknown expiry evidence requires a date in both the combined validated input
and future-write SQL triggers. Removing that date must reset its evidence atomically.

**Consequences:** Existing HTTP projections remain unchanged. A future validated
condition endpoint must share the inventory command transaction/version. Guidelines
are advisory, not lot expiry; unknown opening does not imply sealed. Timezone and
expiry-priority logic wait for T03/T04.

**Alternatives considered:** Recompute every expiry from ingredient defaults or
infer source from `data_source`. Rejected as potentially unsafe historical rewriting.

## ADR-007 — Deterministic core and repository-owned delivery protocol

**Status:** Accepted 2026-09-08

**Context:** Future agents cannot rely on this task's conversation; current AI and
planner overlap later work, but neither is a complete safe optimizer.

**Decision:** Persist specification, ADRs, current reality, task graph and fixed
handoff in `docs/ai`; root AGENTS points there. Deterministic code/DB enforce stock,
constraints, allergies, expiry and budgets. AI only proposes/explains validated
data after the deterministic core is stable. Deliver T01–T07 incrementally.

**Consequences:** All seven task packets describe explicit incremental improvements,
not a replacement platform. Update state/board/handoff after every task and report
exact checks/failures. Older security reports remain linked historical references.

**Alternatives considered:** Chat-only handoff, prompt-only/LLM planning, a single
large implementation task. Rejected for recoverability and correctness risk.
