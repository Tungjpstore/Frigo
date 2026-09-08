# Domain Model — T01 contracts and extension points

Implemented SQL is `migrations/0019_recipe_domain_foundation.sql` plus append-only
`0020_t01_foundation_hardening.sql`; validated inputs
are `packages/domain/src/foundation.ts` and `packages/recipes/src/foundation.ts`.
These supplement, not replace, existing runtime `CanonicalIngredient`, `InventoryItem`
and `Recipe` DTOs. Do not cast a database row to those camelCase DTOs.

## Boundaries

| Concept | Identity / ownership | Meaning |
| --- | --- | --- |
| Ingredient | Existing global `ingredients.id` (e.g. `CHICKEN_BREAST`) | Food concept, not brand or stock |
| Retail Product | Deferred to T05 | Retailer/SKU/barcode, actual package amount/price/currency and optional canonical mapping |
| Inventory Item | `inventory_items.id`, household FK | A lot owned now, raw label, nullable ingredient FK, quantity/unit, storage, expiry, revision |
| Recipe | Existing global catalog recipe ID | Recognizable dish and base servings with structured lines/steps |
| Recipe Ingredient | Existing line ID + recipe/ingredient FKs | Demand at recipe's base servings; `required_quantity`, `unit`, `is_optional` |
| Recipe Family | `recipe_families.id` | Bounded ingredient slots/choices for a reusable pattern, not every combination as a recipe |
| Nutrition | Source-identified `nutrition_profiles.id` | Basis-specific observations/calculations, linked to ingredient or recipe version |
| User Preference | Existing user/weekly preference tables | Personal/household intent, not nutritional or safety truth |
| Meal Plan | Existing household `meal_plans` plus Week projections | Scheduled choices and projected stock usage, not actual consumption |
| Shopping List | Existing standalone/Week shopping rows | Aggregated unmet demand/purchases, not a canonical ingredient or stock lot |

## Canonical ingredient and localized identity

Canonical ingredient IDs match `^[A-Z][A-Z0-9_]*$`, maximum 100 ASCII characters,
with no surrounding whitespace, NUL, case coercion or translation-derived IDs.
`CanonicalIngredientIdSchema` applies to ingredient definitions, alias targets,
storage guidelines, recipe lines and family options. SQL INSERT/ID-UPDATE guards
enforce the same identity convention; existing 45 seeded/static IDs remain valid.
Importers must map source IDs explicitly, not silently uppercase unknown IDs.
General recipe/family/profile IDs and slugs retain the separate, case-flexible
`CatalogIdSchema` contract (ADR-008).

Existing `name_vi`, `name_en`, category, default unit/shelf-life and icon
remain. New nullable `default_name` and `subcategory` add presentation/category
detail; legacy default name is `name_vi` until explicitly authored.

`ingredient_translations` already has one name per `(ingredient_id, language)`.
`createIngredientDefinition(db, unknown)` validates input and atomically inserts
the ingredient, localized names and aliases. Vi/en legacy columns use supplied
vi/en names or default-name fallback. This is compatibility text, not a claim of
translation. New names accept canonicalized BCP-47 tags (e.g. `vi`, `ja`, `en`,
`pt-br`); language keys are lowercased. `und` denotes undetermined language.

`ingredient_aliases` retains its raw `alias`, plus language and nullable
`normalized_alias`. Indexed key = `(language, normalized_alias)`, unique for
non-NULL normalized keys. New trusted catalog writes use NFKC -> trim -> collapse
Unicode whitespace -> lowercase. Diacritics/punctuation/word boundaries remain;
no transliteration, substring matching, quantity stripping or NLP is performed.
The original alias string is retained (trimmed by validation); source raw OCR
labels remain in existing scan/inventory records.

Names become aliases in their declared languages; the default name becomes `und`.
Explicit aliases make `ức gà`, `thịt ức gà`, `chicken breast`, `鶏むね肉` resolve
to one existing canonical ID. `resolveIngredientAlias` queries exact supplied
locale plus `und`, returning `matched`, `unmapped`, or a sorted `ambiguous` set.
It never prioritizes one conflicting ID. No implicit `ja-jp -> ja` fallback or
all-language search exists; a caller must choose an explicit language policy.
`鶏むね肉 500g` remains unmapped unless explicitly authored; parsing is future work.

Historical aliases are preserved with NULL keys, excluded from the new resolver.
SQL cannot reproduce JavaScript Unicode normalization reliably. T02 must audit,
normalize and collision-review them before promotion. SQL enforces key uniqueness;
application validation enforces that keys/languages are actually normalized.
Direct SQL/import writers must use the same normalization contract.

## Units and arithmetic

`measurement_units` and `UNIT_DEFINITIONS` mirror the existing `StandardUnit` union:

| Units | Dimension | Base / exact factor |
| --- | --- | --- |
| g, kg | mass | g; 1, 1000 |
| ml, l | volume | ml; 1, 1000 |
| piece | count | piece; 1 |
| pack, bunch, slice | contextual | self only; 1 is identity, not a mass estimate |

Use existing `convertUnitStrict` / `tryConvertUnit`. Legacy `convertUnit` has an
incompatible-unit numeric fallback retained for old guarded callers; no new
arithmetic may use it unguarded. SQL catalog units are controlled reference data,
not user-editable conversion definitions.

`areUnitsCompatible` answers quantity-unit compatibility, not package-content
equivalence. `pack -> pack` and `slice -> slice` can count a specified same-size
package/slice context; `piece -> piece` can count the same canonical item. All
return identity quantities, not grams or volume. Use the unit dimension to
distinguish physical conversion from count/contextual identity. A pack or bunch
against 300 g stays unresolved; matching two `pack` labels alone cannot justify
pooling different products/sizes. No product-specific conversion is implemented.

Even `pack -> pack` identity needs compatible product/size context before adding
different retail lots. T01 does not establish that context. An egg, onion, slice
or package never acquires a universal gram equivalent. T05 can model sourced,
ingredient/product-specific net-content or density estimates; unknown conversion
must remain unresolved. Positive recipe demands are finite; available stock may
legitimately be zero. IEEE number/SQLite REAL precision remains existing behavior;
T02/T05 must define rounding at display/purchase boundaries, not round every step.

## Nutrition and safety metadata

`nutrition_profiles` stores `basis_quantity` and `basis_unit` (`g`, `ml`, `piece`,
`serving`), with energy **kcal**, protein/carbohydrate/fat/fiber/sugar **g**, sodium
**mg**. 100 g, 100 ml and 1 piece are examples, not mandatory fixed bases.
At least one nutrient must be known; NULL in SQL/undefined in inputs means unknown,
not zero. No inferred macros or density conversion. Serving has recipe context;
never convert it to mass without explicit data.

Sources: `authoritative`, `imported`, `calculated`, `estimated`, always with a
nonempty reference (dataset/version/record, calculation revision or estimate note).
Source classification records provenance, not externally verified truth. Multiple
profiles may coexist; choosing an applicable trusted source is future policy.
`ingredient_nutrition` links ingredient observations. `recipe_nutrition` belongs
**only to the current recipe version**: `recipe_version == recipes.version`.
0020 rejects mismatched INSERT/UPDATE links and blocks changing the parent version
while links remain, including replacement INSERTs. To revise nutritional inputs,
the catalog author explicitly removes old links, updates the recipe/version,
and links validated profiles in one D1 batch; failure restores the old state.
The DB does not relabel links or recompute nutrition. Profiles remain stored, but
there is no historical recipe-version identity/archive. Readers still select the
correct current version and basis. There is no calculation engine (ADR-009).

`ingredient_tags` distinguishes `allergen` and `dietary`, with a source reference.
`ingredients.allergen_review_state` defaults to `unknown`. An empty tag set is not
proof of absence. Even `reviewed` needs an agreed allergen taxonomy/completeness
scope before hard safety claims; brand cross-contamination remains product-specific.
Missing dietary tags also mean unknown: no meat assertion does not establish
vegetarian suitability. AI/import labels alone cannot establish allergy safety.
`recipe_classifications` contains meal type/dietary/allergen/method/equipment/
suitability tags for querying; tags are descriptive assertions, not a safety
certificate. No current recipes or ingredients are automatically marked safe.

## Storage and expiration

Keep current lot storage `fridge`, `freezer`, `pantry` (room-temperature storage
bucket; not a precise measured temperature). Keep current `expiry_date`, added
date, computed freshness and data source. Add optional `opened_at`, `expiry_kind`
(`unknown`, `best_before`, `use_by`, `estimated`) and `expiry_source` (`unknown`,
`user`, `ocr`, `imported`, `estimated`). Existing lots default to unknown; do not
infer a date's origin from an inventory row's general source.

`ingredient_storage_guidelines` is keyed by ingredient/storage/sealed-or-opened,
with positive shelf-life days and authoritative/imported/estimated source reference.
It is advisory metadata, not an inventory expiration and never permission to
extend use-by. Opening state is unknown if no evidence exists; absence of an
opened timestamp does not prove sealed. Existing API does not read/write new
condition fields; a later endpoint must validate dates and update condition plus
inventory version/event atomically. Do not use direct side writes from clients.

The combined condition input validates calendar dates/ISO-offset opening timestamps
and requires an expiry date for non-unknown evidence. Insert/update SQL triggers
also require a nonempty date before attaching evidence or clearing the date.
SQL does not enforce timestamp syntax on `opened_at` and legacy expiry dates remain
permissive. Local-date boundary rules, storage changes, semantic source/kind policy
and expiry scoring belong to T03/T04, not this migration.

## Canonical recipes and families

Reuse relational `recipes`, `recipe_ingredients`, `recipe_steps`, translations.
Recipe line quantities are at `recipes.servings`, not per serving. Required and
optional lines have positive amounts; absence/availability/missing amounts are
computed, not persisted on recipe lines. Repeated ingredient rows may represent
different preparation stages; T02 must aggregate them safely, not require a
new uniqueness constraint that would delete detail.

New recipe columns: optional family FK and prep minutes; source type (`legacy`,
`curated`, `imported`, `ai_generated`, `user_generated`), source reference, review
state (`unverified`, `reviewed`, `rejected`) and positive integer version. Old rows
are legacy/unverified/version 1. Imported/AI recipes and families require a
nonblank, NUL-free reference (including Unicode-whitespace rejection) in both Zod
and SQL INSERT/UPDATE guards. Internal import/dataset/generation IDs are valid;
a public URL is unnecessary. Legacy/curated/user-generated references may be
omitted/NULL; any supplied reference must satisfy the same text-presence rule.
Source/review remain independent and defaults are unchanged (ADR-010).

`RecipeDefinitionSchema` validates the core demand
and identity block, **not a complete recipe publication payload** (instructions,
images, translations and safety review need separate validation when integrated).
No existing static recipe is force-cast or auto-imported through this schema.

Families have base servings/version/provenance; slots have min/max selections;
options identify canonical ingredients with their own positive quantity/unit at
family base servings. Example: fried rice has fixed rice (1..1), protein (1..1
from chicken/tofu), vegetables (0..2 from carrot/peas). Options do not mean equal
mass or guaranteed allergy-safe substitution. Required slots have min > 0;
optional slots min = 0. A concrete dish may optionally link its family.

Composite FKs bind options to their family/slot; duplicate slot and option IDs are
rejected. Zod validates selection counts against option count. SQL cannot enforce
that cross-row aggregate during staged inserts; authors must validate the complete
family and write all rows in a D1 batch before making it available. T02 owns bounded
variant generation, selected-slot traces, coherent steps and deterministic
substitution rules. T01 stores neither every permutation nor a generic rules engine.
T02 must enforce named candidate and search-work budgets during expansion (ADR-005,
T02 packet), not build a Cartesian product then truncate it. Slot/option counts
alone do not provide a safe computational bound. T01 implements no generator.

## Provenance, ownership and deferred fields

Current recipes are a global static catalog. T01 adds **no public catalog-write,
recipe-import or user-recipe endpoint**. `user_generated` describes provenance of
a catalog submission; it does not authorize publication or model private ownership.
T06 must add an explicit household-private draft/publication boundary before
accepting end-user recipes. A source reference must not contain private user data
if it will enter a global catalog. AI/import outputs stay untrusted/unverified.

Cuisine/time/difficulty/servings stay core fields. Meal types, methods, equipment,
family-friendly/quick/high-protein/vegetarian/fridge-rescue labels fit classifications;
derived labels need deterministic rules later. Existing free-form `recipes.tags`
are retained, not silently asserted into normalized classifications. Substitution
edges, retailer products/prices, detailed ingredient metadata, family translations,
nutrition goals, new nutrient registries and private recipe ownership are deferred
until a task needs them. No generic JSON metadata bag is introduced speculatively.

Input schemas are authoring contracts, not raw-row decoders. Map SQL NULL to
omitted optional fields where required; recipe source references explicitly accept
NULL. SQL protects identities, relations and scalar invariants. Zod additionally
bounds input text/array sizes, canonicalizes BCP-47/alias Unicode and validates
complete-family option counts; those require validated importers plus atomic
writes, not unrestricted SQL imports. Legacy date syntax remains as noted above.

## Migration constraints and rollout

0019 adds ten tables, nullable/defaulted columns, FK/unique/check constraints,
indexes for aliases, ingredient-to-recipes/families, classifications, family recipes
and active household expiry. Insert/update triggers validate future recipe
servings/time/difficulty and line quantity/unit/optional flags without rebuilding
historical tables. Existing malformed rows are not silently fixed; ordinary writes
to guarded fields must satisfy the new invariant. T02 audits old rows before import.

0020 adds ten guards for canonical identity, current-version nutrition and traceable
recipe/family provenance. It checks existing rows first using named preflight
constraints, then removes the transient guard table. Invalid IDs, nutrition-version
mismatches or missing/blank/NUL source evidence abort the ledger transaction before
any lasting schema change. The catalog/D1 owner must review affected rows and supply
authentic mapping/evidence before retrying; no automatic rename, backfill or delete.

Migrations are applied **once via ledger**, not idempotently re-executed. 0001–0019
remain unchanged because 0019 was published and applied locally before hardening.
`pnpm check:migrations` covers full replay; integration tests cover populated 0019
upgrade, preflight rollback and real SQL rejection. The schema gate requires 0019,
0020 and all ten hardening triggers for releases containing this code. Release/D1
owners must apply pending migrations to the target database before deployment;
the remote release gate is read-only. No production migration ran in T01.

Prefer application rollback with additive schema retained after compatibility
review. The existing release gate rejects an older release's shorter migration
ledger, so rollback is operator-reviewed, not an automatic redeploy of an old SHA.
If schema rollback is necessary, use an approved backup restore; never drop new
tables/triggers or delete data blindly (`DEPLOYMENT.md`).
