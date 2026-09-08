-- Keep published 0019 immutable. Reject incompatible existing data; never infer or erase evidence.
CREATE TABLE _t01_hardening_guard (
  canonical_ids INTEGER NOT NULL CONSTRAINT canonical_ingredient_id_preflight CHECK (canonical_ids = 0),
  nutrition_versions INTEGER NOT NULL CONSTRAINT recipe_nutrition_version_preflight CHECK (nutrition_versions = 0),
  recipe_sources INTEGER NOT NULL CONSTRAINT recipe_provenance_preflight CHECK (recipe_sources = 0),
  family_sources INTEGER NOT NULL CONSTRAINT family_provenance_preflight CHECK (family_sources = 0)
);
INSERT INTO _t01_hardening_guard
SELECT
  (SELECT COUNT(*) FROM ingredients WHERE id IS NULL OR length(id) NOT BETWEEN 1 AND 100
    OR id NOT GLOB '[A-Z]*' OR id GLOB '*[^A-Z0-9_]*' OR instr(id, char(0)) > 0),
  (SELECT COUNT(*) FROM recipe_nutrition n WHERE NOT EXISTS
    (SELECT 1 FROM recipes r WHERE r.id = n.recipe_id AND r.version = n.recipe_version)),
  (SELECT COUNT(*) FROM recipes WHERE
    (source_type IN ('imported', 'ai_generated') AND source_reference IS NULL) OR
    (source_reference IS NOT NULL AND (instr(source_reference, char(0)) > 0 OR
      length(trim(source_reference, char(9,10,11,12,13,32,160,5760,8192,8193,8194,8195,8196,
        8197,8198,8199,8200,8201,8202,8232,8233,8239,8287,12288,65279))) = 0))),
  (SELECT COUNT(*) FROM recipe_families WHERE
    (source_type IN ('imported', 'ai_generated') AND source_reference IS NULL) OR
    (source_reference IS NOT NULL AND (instr(source_reference, char(0)) > 0 OR
      length(trim(source_reference, char(9,10,11,12,13,32,160,5760,8192,8193,8194,8195,8196,
        8197,8198,8199,8200,8201,8202,8232,8233,8239,8287,12288,65279))) = 0)));
DROP TABLE _t01_hardening_guard;

CREATE TRIGGER trg_ingredients_canonical_id_insert BEFORE INSERT ON ingredients
WHEN NEW.id IS NULL OR length(NEW.id) NOT BETWEEN 1 AND 100
  OR NEW.id NOT GLOB '[A-Z]*' OR NEW.id GLOB '*[^A-Z0-9_]*' OR instr(NEW.id, char(0)) > 0
BEGIN SELECT RAISE(ABORT, 'Invalid canonical ingredient ID'); END;
CREATE TRIGGER trg_ingredients_canonical_id_update BEFORE UPDATE OF id ON ingredients
WHEN NEW.id IS NULL OR length(NEW.id) NOT BETWEEN 1 AND 100
  OR NEW.id NOT GLOB '[A-Z]*' OR NEW.id GLOB '*[^A-Z0-9_]*' OR instr(NEW.id, char(0)) > 0
BEGIN SELECT RAISE(ABORT, 'Invalid canonical ingredient ID'); END;

CREATE TRIGGER trg_recipe_nutrition_version_insert BEFORE INSERT ON recipe_nutrition
WHEN NOT EXISTS (SELECT 1 FROM recipes WHERE id = NEW.recipe_id AND version = NEW.recipe_version)
BEGIN SELECT RAISE(ABORT, 'Recipe nutrition must use the current recipe version'); END;
CREATE TRIGGER trg_recipe_nutrition_version_update BEFORE UPDATE ON recipe_nutrition
WHEN NOT EXISTS (SELECT 1 FROM recipes WHERE id = NEW.recipe_id AND version = NEW.recipe_version)
BEGIN SELECT RAISE(ABORT, 'Recipe nutrition must use the current recipe version'); END;
CREATE TRIGGER trg_recipes_nutrition_version_update BEFORE UPDATE OF version ON recipes
WHEN NEW.version <> OLD.version AND EXISTS (SELECT 1 FROM recipe_nutrition WHERE recipe_id = OLD.id)
BEGIN SELECT RAISE(ABORT, 'Unlink recipe nutrition before changing its version'); END;
-- INSERT OR REPLACE must not use cascades to silently bypass the revision protocol.
CREATE TRIGGER trg_recipes_nutrition_version_insert BEFORE INSERT ON recipes
WHEN EXISTS (
  SELECT 1 FROM recipes r JOIN recipe_nutrition n ON n.recipe_id = r.id
  WHERE r.id = NEW.id AND r.version <> NEW.version
)
BEGIN SELECT RAISE(ABORT, 'Unlink recipe nutrition before changing its version'); END;

-- Match JavaScript trim whitespace, not SQLite's space-only default.
CREATE TRIGGER trg_recipes_source_reference_insert BEFORE INSERT ON recipes
WHEN (NEW.source_type IN ('imported', 'ai_generated') AND NEW.source_reference IS NULL) OR
  (NEW.source_reference IS NOT NULL AND (instr(NEW.source_reference, char(0)) > 0 OR
    length(trim(NEW.source_reference, char(9,10,11,12,13,32,160,5760,8192,8193,8194,8195,8196,
      8197,8198,8199,8200,8201,8202,8232,8233,8239,8287,12288,65279))) = 0))
BEGIN SELECT RAISE(ABORT, 'Invalid recipe source reference'); END;
CREATE TRIGGER trg_recipes_source_reference_update BEFORE UPDATE OF source_type, source_reference ON recipes
WHEN (NEW.source_type IN ('imported', 'ai_generated') AND NEW.source_reference IS NULL) OR
  (NEW.source_reference IS NOT NULL AND (instr(NEW.source_reference, char(0)) > 0 OR
    length(trim(NEW.source_reference, char(9,10,11,12,13,32,160,5760,8192,8193,8194,8195,8196,
      8197,8198,8199,8200,8201,8202,8232,8233,8239,8287,12288,65279))) = 0))
BEGIN SELECT RAISE(ABORT, 'Invalid recipe source reference'); END;
CREATE TRIGGER trg_recipe_families_source_reference_insert BEFORE INSERT ON recipe_families
WHEN (NEW.source_type IN ('imported', 'ai_generated') AND NEW.source_reference IS NULL) OR
  (NEW.source_reference IS NOT NULL AND (instr(NEW.source_reference, char(0)) > 0 OR
    length(trim(NEW.source_reference, char(9,10,11,12,13,32,160,5760,8192,8193,8194,8195,8196,
      8197,8198,8199,8200,8201,8202,8232,8233,8239,8287,12288,65279))) = 0))
BEGIN SELECT RAISE(ABORT, 'Invalid recipe source reference'); END;
CREATE TRIGGER trg_recipe_families_source_reference_update BEFORE UPDATE OF source_type, source_reference ON recipe_families
WHEN (NEW.source_type IN ('imported', 'ai_generated') AND NEW.source_reference IS NULL) OR
  (NEW.source_reference IS NOT NULL AND (instr(NEW.source_reference, char(0)) > 0 OR
    length(trim(NEW.source_reference, char(9,10,11,12,13,32,160,5760,8192,8193,8194,8195,8196,
      8197,8198,8199,8200,8201,8202,8232,8233,8239,8287,12288,65279))) = 0))
BEGIN SELECT RAISE(ABORT, 'Invalid recipe source reference'); END;
