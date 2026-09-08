# Architecture Decisions

Entries identify the task in which they were accepted. Supersede an ADR explicitly; do not silently rewrite
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

**Hardening clarification:** `areUnitsCompatible`/`convertUnitStrict` accept
same-unit quantity identity, not proof of physical equivalence. `pack -> pack`
and `slice -> slice` count the same defined package/slice context; `piece -> piece`
counts the same canonical item. Neither proves mass, volume, or equivalence across
different product sizes. `UNIT_DEFINITIONS.dimension` distinguishes those cases.

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
ADR-009 clarifies and enforces that only the current recipe version is stored.
Missing dietary assertions also remain unknown; no meat tag is not evidence of
vegetarian suitability. Imported/AI classifications are not an allergy authority.

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

**Hardening clarification:** Finite slots do not bound computational work. T02
must enforce `MAX_VARIANT_CANDIDATES_PER_FAMILY` (initial default 64) and
`MAX_VARIANT_SEARCH_STATES_PER_FAMILY` (initial default 1024) while exploring, not
after constructing the Cartesian product. Reaching either budget must return
deterministic truncation metadata, not a false claim of exhaustive infeasibility.
These are T02 requirements, not a generator or runtime policy implemented in T01.

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

## ADR-008 — Strict canonical ingredient identity, separate from catalog IDs

**Status:** Accepted 2026-09-08 (T01 hardening)

**Context:** All 45 seeded D1 ingredient IDs, all 45 static ingredient IDs, and
385 static recipe ingredient references (43 distinct IDs) use uppercase ASCII
snake case. The general `CatalogIdSchema` and case-sensitive SQL primary key
previously allowed a separate `chicken_breast` beside `CHICKEN_BREAST`.

**Decision:** Canonical ingredient IDs must match `^[A-Z][A-Z0-9_]*$`, be at most
100 characters, and contain no surrounding whitespace or implicit coercion.
Use a dedicated `CanonicalIngredientIdSchema` for catalog authoring, alias target
IDs, storage guidelines, recipe lines and family options. Recipe/family/profile
IDs, slugs and locale keys retain their existing distinct contracts. SQL guards
reject invalid ingredient INSERTs and ID UPDATEs, including NULL and embedded NUL.

**Consequences:** Importers must explicitly map external IDs to existing canonical
identities; do not uppercase unknown IDs or derive them from translations. No
existing legitimate seed/catalog ID changes. Published/applied 0019 is immutable;
append 0020. Its preflight stops on invalid existing IDs without renaming, merging
or deleting rows. The catalog owner must review any failing data before retrying.

**Alternatives considered:** Case-insensitive uniqueness with case-flexible IDs;
automatic uppercasing/backfill. Rejected because every current legitimate ID
already follows one strict convention and coercion would hide import mistakes.

## ADR-009 — Nutrition links belong only to the current recipe version

**Status:** Accepted 2026-09-08 (T01 hardening; clarifies ADR-004)

**Context:** T01 has one row per recipe, not historical recipe-version identities.
The positive `recipe_nutrition.recipe_version` check alone allowed impossible or
stale links, despite readers being instructed to select the current version.

**Decision:** Every nutrition link must equal its parent recipe's current version.
0020 guards link INSERT/UPDATE and blocks parent version changes (including
replacement INSERTs) while dependent nutrition links remain. To revise a recipe,
explicitly unlink its nutrition, update the recipe/version, then link newly
validated profiles in one D1 batch. Failure rolls the entire batch back. Profiles
are retained; nothing is implicitly relabeled or recomputed.

**Consequences:** No historical recipe version support is implied. Preflight
rejects existing mismatches for owner review rather than dropping evidence or
guessing a version. Deleting a recipe still intentionally cascades its links;
linked profiles themselves remain protected from deletion by foreign keys.

**Alternatives considered:** Historical recipe-version tables or automatic link
version updates. Rejected as out of scope or liable to attach stale nutrition to
changed ingredients/servings.

## ADR-010 — Traceable imported and AI recipe provenance

**Status:** Accepted 2026-09-08 (T01 hardening)

**Context:** Source type and verification were independent, but imported/AI
recipes and families could omit all traceability.

**Decision:** `imported` and `ai_generated` recipes/families require a nonblank,
NUL-free source reference. Legacy/curated/user-generated references are optional
(omitted/SQL NULL); any supplied reference must also be nonblank and NUL-free.
An internal dataset-row, import-batch or generation-job ID suffices; no public URL
is required. Zod and 0020 INSERT/UPDATE guards enforce these presence rules,
including Unicode whitespace. Zod additionally bounds authoring text lengths.
Family source types still exclude `legacy`; defaults remain legacy/curated,
unverified, version 1. A reference never confers verification or publication rights.

**Consequences:** Preflight rejects opaque existing imports/AI rows without
inventing references. Catalog owners must supply authentic evidence before retrying.
Global references must not contain private user data or credentials. No import,
generation, ownership or review endpoint is implemented in T01.

**Alternatives considered:** Require public URLs or a full provenance subsystem;
infer traceability from source type. Rejected as unnecessary or unauditable.

## ADR-011 — Indexed quantity feasibility, not runtime ranking or consumption planning

**Status:** Accepted 2026-09-08 (T02)

**Decision:** Add a reusable leaf availability index and per-candidate reservation
session. Re-export unchanged strict unit semantics from a leaf module to avoid
barrel cycles. Aggregate compatible physical lots and canonical piece quantities;
contextual package labels alone never prove equivalent contents. Preserve explicit
missing/partial/unresolved/satisfied outcomes and diagnostics. Duplicate identical
lot IDs count once; conflicting/invalid related stock is quarantined as uncertainty.
Use exact decimal rational intermediate arithmetic and explicit finite Number
boundaries; arithmetic range failures are reported, never coerced to zero coverage.

Aggregate repeated compatible requirements before serving scaling, retain source
line indices and units (mixed physical units use their base). Preserve mathematical
fractional pieces with an explicit flag: existing T01 quantity contracts allow
fractions. No hidden whole-item/purchase rounding or Week portion optimizer.
Reserve direct required demand first, then approved substitutions, then optional
demand. Lot-ID order is only a reproducible feasibility witness, not FEFO, actual
stock consumption or a multi-meal simulation. Each candidate starts independently.

Caller supplies an explicit as-of date and authorized household-scoped inventory.
Past use-by is unavailable; past best-before is not automatically unsafe; elapsed
unknown/estimated dates require review and remain uncertain. Freshness rescue flags
are carried as raw witness facts, not recalculated/weighted expiry priorities.

**Consequences:** Legacy recipe scoring, static readers, cooking commands and Week
behavior stay unchanged pending their explicit integration tasks. New functions
claim quantity feasibility only, not nutrition/allergy certification. No migration,
API, UI, payment/auth or production configuration change is required.

## ADR-012 — Explicit one-hop substitutions and bounded family traversal

**Status:** Accepted 2026-09-08 (T02)

**Decision:** Substitution rules are explicit reviewed, source-referenced quantities,
scoped to a recipe/family ID and version. Every use needs per-call approval and
positive compatibility evidence for every active constraint; missing evidence
denies use. Rules express the replacement amount per original unit, including
partial replacements, never inferred food density. No contextual conversions,
transitive substitutions, preferences or learned rules. Deterministic rule-ID order
does not claim globally optimal allocation among competing substitutes.

Family traversal is lazy with the ADR-005 limits enforced during attempted partial
states, including rejected branches; callers may lower but not exceed 64 candidates
or 1024 states per family. Canonicalize slot/options and semantic aggregate demands;
contextual demands retain separate lines and slot identities because equal labels
do not prove equivalent contents. Retain selected-slot evidence and do not persist
variants. A selected optional-slot
option is required within that variant; omission is its separate zero-selection
choice. Never emit a zero-demand variant. Truncated searches do not prove no
feasible variant exists. Family instructions/cuisine/times absent in T01 stay absent.

**Consequences:** T03 can consume structured requirement facts without repeating
inventory math. D1/static catalog snapshots remain explicit internal read-only
sources; drift/alias promotion proposals require review, not automatic writes or
runtime cutover. No new persisted substitution or variant schema is needed.
