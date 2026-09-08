-- Additive catalog foundation. Existing runtime catalogs and household commands stay unchanged.
CREATE TABLE measurement_units (
  code TEXT PRIMARY KEY NOT NULL,
  dimension TEXT NOT NULL CHECK (dimension IN ('mass', 'volume', 'count', 'contextual')),
  base_unit TEXT NOT NULL REFERENCES measurement_units(code),
  factor_to_base REAL NOT NULL CHECK (factor_to_base > 0 AND factor_to_base < 1e308),
  CHECK (
    (dimension = 'mass' AND code IN ('g', 'kg') AND base_unit = 'g'
      AND factor_to_base = CASE code WHEN 'kg' THEN 1000 ELSE 1 END) OR
    (dimension = 'volume' AND code IN ('ml', 'l') AND base_unit = 'ml'
      AND factor_to_base = CASE code WHEN 'l' THEN 1000 ELSE 1 END) OR
    (dimension = 'count' AND code = 'piece' AND base_unit = code AND factor_to_base = 1) OR
    (dimension = 'contextual' AND code IN ('pack', 'bunch', 'slice') AND base_unit = code AND factor_to_base = 1)
  )
);
INSERT INTO measurement_units (code, dimension, base_unit, factor_to_base) VALUES
  ('g', 'mass', 'g', 1), ('kg', 'mass', 'g', 1000),
  ('ml', 'volume', 'ml', 1), ('l', 'volume', 'ml', 1000),
  ('piece', 'count', 'piece', 1), ('pack', 'contextual', 'pack', 1),
  ('bunch', 'contextual', 'bunch', 1), ('slice', 'contextual', 'slice', 1);

ALTER TABLE ingredients ADD COLUMN default_name TEXT CHECK (default_name IS NULL OR length(trim(default_name)) > 0);
ALTER TABLE ingredients ADD COLUMN subcategory TEXT;
ALTER TABLE ingredients ADD COLUMN allergen_review_state TEXT NOT NULL DEFAULT 'unknown'
  CHECK (allergen_review_state IN ('unknown', 'reviewed'));

-- NULL keys preserve legacy aliases; promote only after application-level Unicode normalization/collision review.
ALTER TABLE ingredient_aliases ADD COLUMN language TEXT NOT NULL DEFAULT 'und' CHECK (length(trim(language)) > 0);
ALTER TABLE ingredient_aliases ADD COLUMN normalized_alias TEXT CHECK (normalized_alias IS NULL OR length(trim(normalized_alias)) > 0);
CREATE UNIQUE INDEX idx_ingredient_aliases_normalized ON ingredient_aliases(language, normalized_alias)
  WHERE normalized_alias IS NOT NULL;
CREATE INDEX idx_ingredient_aliases_ingredient ON ingredient_aliases(ingredient_id);

CREATE TABLE ingredient_tags (
  ingredient_id TEXT NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('allergen', 'dietary')),
  tag TEXT NOT NULL CHECK (length(trim(tag)) > 0),
  source_reference TEXT NOT NULL CHECK (length(trim(source_reference)) > 0),
  PRIMARY KEY (ingredient_id, kind, tag)
);

CREATE TABLE ingredient_storage_guidelines (
  ingredient_id TEXT NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  storage TEXT NOT NULL CHECK (storage IN ('fridge', 'freezer', 'pantry')),
  package_state TEXT NOT NULL CHECK (package_state IN ('sealed', 'opened')),
  shelf_life_days INTEGER NOT NULL CHECK (typeof(shelf_life_days) = 'integer' AND shelf_life_days > 0),
  source_type TEXT NOT NULL CHECK (source_type IN ('authoritative', 'imported', 'estimated')),
  source_reference TEXT NOT NULL CHECK (length(trim(source_reference)) > 0),
  PRIMARY KEY (ingredient_id, storage, package_state)
);
ALTER TABLE inventory_items ADD COLUMN opened_at TEXT;
ALTER TABLE inventory_items ADD COLUMN expiry_kind TEXT NOT NULL DEFAULT 'unknown'
  CHECK (expiry_kind IN ('unknown', 'best_before', 'use_by', 'estimated'));
ALTER TABLE inventory_items ADD COLUMN expiry_source TEXT NOT NULL DEFAULT 'unknown'
  CHECK (expiry_source IN ('unknown', 'user', 'ocr', 'imported', 'estimated'));
CREATE TRIGGER trg_inventory_expiry_evidence_insert BEFORE INSERT ON inventory_items
WHEN (NEW.expiry_kind <> 'unknown' OR NEW.expiry_source <> 'unknown')
  AND (NEW.expiry_date IS NULL OR length(trim(NEW.expiry_date)) = 0)
BEGIN SELECT RAISE(ABORT, 'Expiry evidence requires a date'); END;
CREATE TRIGGER trg_inventory_expiry_evidence_update BEFORE UPDATE OF expiry_date, expiry_kind, expiry_source ON inventory_items
WHEN (NEW.expiry_kind <> 'unknown' OR NEW.expiry_source <> 'unknown')
  AND (NEW.expiry_date IS NULL OR length(trim(NEW.expiry_date)) = 0)
BEGIN SELECT RAISE(ABORT, 'Expiry evidence requires a date'); END;
CREATE INDEX idx_inventory_household_expiry ON inventory_items(household_id, expiry_date)
  WHERE quantity > 0 AND expiry_date IS NOT NULL;

CREATE TABLE nutrition_profiles (
  id TEXT PRIMARY KEY NOT NULL,
  basis_quantity REAL NOT NULL CHECK (basis_quantity > 0 AND basis_quantity < 1e308),
  basis_unit TEXT NOT NULL CHECK (basis_unit IN ('g', 'ml', 'piece', 'serving')),
  source_type TEXT NOT NULL CHECK (source_type IN ('authoritative', 'imported', 'calculated', 'estimated')),
  source_reference TEXT NOT NULL CHECK (length(trim(source_reference)) > 0),
  energy_kcal REAL CHECK (energy_kcal >= 0 AND energy_kcal < 1e308),
  protein_g REAL CHECK (protein_g >= 0 AND protein_g < 1e308),
  carbohydrate_g REAL CHECK (carbohydrate_g >= 0 AND carbohydrate_g < 1e308),
  fat_g REAL CHECK (fat_g >= 0 AND fat_g < 1e308),
  fiber_g REAL CHECK (fiber_g >= 0 AND fiber_g < 1e308),
  sugar_g REAL CHECK (sugar_g >= 0 AND sugar_g < 1e308),
  sodium_mg REAL CHECK (sodium_mg >= 0 AND sodium_mg < 1e308),
  CHECK (energy_kcal IS NOT NULL OR protein_g IS NOT NULL OR carbohydrate_g IS NOT NULL OR
    fat_g IS NOT NULL OR fiber_g IS NOT NULL OR sugar_g IS NOT NULL OR sodium_mg IS NOT NULL)
);
CREATE TABLE ingredient_nutrition (
  ingredient_id TEXT NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  nutrition_profile_id TEXT NOT NULL REFERENCES nutrition_profiles(id),
  PRIMARY KEY (ingredient_id, nutrition_profile_id)
);

CREATE TABLE recipe_families (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE CHECK (length(trim(slug)) > 0),
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  base_servings INTEGER NOT NULL CHECK (typeof(base_servings) = 'integer' AND base_servings > 0),
  version INTEGER NOT NULL DEFAULT 1 CHECK (typeof(version) = 'integer' AND version > 0),
  source_type TEXT NOT NULL DEFAULT 'curated' CHECK (source_type IN ('curated', 'imported', 'ai_generated', 'user_generated')),
  source_reference TEXT,
  verification_state TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_state IN ('unverified', 'reviewed', 'rejected'))
);
CREATE TABLE recipe_family_slots (
  family_id TEXT NOT NULL REFERENCES recipe_families(id) ON DELETE CASCADE,
  slot_key TEXT NOT NULL CHECK (length(trim(slot_key)) > 0),
  min_selections INTEGER NOT NULL CHECK (typeof(min_selections) = 'integer' AND min_selections >= 0),
  max_selections INTEGER NOT NULL CHECK (typeof(max_selections) = 'integer' AND max_selections > 0 AND max_selections >= min_selections),
  PRIMARY KEY (family_id, slot_key)
);
CREATE TABLE recipe_family_options (
  family_id TEXT NOT NULL,
  slot_key TEXT NOT NULL,
  ingredient_id TEXT NOT NULL REFERENCES ingredients(id),
  quantity REAL NOT NULL CHECK (quantity > 0 AND quantity < 1e308),
  unit TEXT NOT NULL REFERENCES measurement_units(code),
  PRIMARY KEY (family_id, slot_key, ingredient_id),
  FOREIGN KEY (family_id, slot_key) REFERENCES recipe_family_slots(family_id, slot_key) ON DELETE CASCADE
);
CREATE INDEX idx_recipe_family_options_ingredient ON recipe_family_options(ingredient_id, family_id);

ALTER TABLE recipes ADD COLUMN family_id TEXT REFERENCES recipe_families(id);
ALTER TABLE recipes ADD COLUMN prep_time_minutes INTEGER CHECK (prep_time_minutes IS NULL OR (typeof(prep_time_minutes) = 'integer' AND prep_time_minutes >= 0));
ALTER TABLE recipes ADD COLUMN source_type TEXT NOT NULL DEFAULT 'legacy'
  CHECK (source_type IN ('legacy', 'curated', 'imported', 'ai_generated', 'user_generated'));
ALTER TABLE recipes ADD COLUMN source_reference TEXT;
ALTER TABLE recipes ADD COLUMN verification_state TEXT NOT NULL DEFAULT 'unverified'
  CHECK (verification_state IN ('unverified', 'reviewed', 'rejected'));
ALTER TABLE recipes ADD COLUMN version INTEGER NOT NULL DEFAULT 1 CHECK (typeof(version) = 'integer' AND version > 0);
CREATE INDEX idx_recipes_family ON recipes(family_id) WHERE family_id IS NOT NULL;
CREATE INDEX idx_recipe_ingredients_ingredient ON recipe_ingredients(ingredient_id, recipe_id);
CREATE TABLE recipe_nutrition (
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  recipe_version INTEGER NOT NULL CHECK (typeof(recipe_version) = 'integer' AND recipe_version > 0),
  nutrition_profile_id TEXT NOT NULL REFERENCES nutrition_profiles(id),
  PRIMARY KEY (recipe_id, recipe_version, nutrition_profile_id)
);
CREATE TABLE recipe_classifications (
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('meal_type', 'dietary', 'allergen', 'method', 'equipment', 'suitability')),
  tag TEXT NOT NULL CHECK (length(trim(tag)) > 0),
  PRIMARY KEY (recipe_id, kind, tag)
);
CREATE INDEX idx_recipe_classifications_tag ON recipe_classifications(kind, tag, recipe_id);

-- Validate future writes without rebuilding or rejecting historical rows during migration.
CREATE TRIGGER trg_recipe_ingredients_foundation_insert BEFORE INSERT ON recipe_ingredients
WHEN NEW.required_quantity IS NULL OR NOT (NEW.required_quantity > 0 AND NEW.required_quantity < 1e308)
  OR NEW.is_optional NOT IN (0, 1) OR NEW.is_optional IS NULL
  OR NEW.unit IS NULL OR NEW.unit NOT IN (SELECT code FROM measurement_units)
BEGIN SELECT RAISE(ABORT, 'Invalid structured recipe ingredient'); END;
CREATE TRIGGER trg_recipe_ingredients_foundation_update BEFORE UPDATE OF required_quantity, is_optional, unit ON recipe_ingredients
WHEN NEW.required_quantity IS NULL OR NOT (NEW.required_quantity > 0 AND NEW.required_quantity < 1e308)
  OR NEW.is_optional NOT IN (0, 1) OR NEW.is_optional IS NULL
  OR NEW.unit IS NULL OR NEW.unit NOT IN (SELECT code FROM measurement_units)
BEGIN SELECT RAISE(ABORT, 'Invalid structured recipe ingredient'); END;
CREATE TRIGGER trg_recipes_foundation_insert BEFORE INSERT ON recipes
WHEN typeof(NEW.servings) <> 'integer' OR NEW.servings <= 0
  OR typeof(NEW.cook_time_minutes) <> 'integer' OR NEW.cook_time_minutes < 0
  OR NEW.difficulty IS NULL OR NEW.difficulty NOT IN ('easy', 'medium', 'hard')
BEGIN SELECT RAISE(ABORT, 'Invalid recipe servings/time/difficulty'); END;
CREATE TRIGGER trg_recipes_foundation_update BEFORE UPDATE OF servings, cook_time_minutes, difficulty ON recipes
WHEN typeof(NEW.servings) <> 'integer' OR NEW.servings <= 0
  OR typeof(NEW.cook_time_minutes) <> 'integer' OR NEW.cook_time_minutes < 0
  OR NEW.difficulty IS NULL OR NEW.difficulty NOT IN ('easy', 'medium', 'hard')
BEGIN SELECT RAISE(ABORT, 'Invalid recipe servings/time/difficulty'); END;
