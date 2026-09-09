-- T03 ranking preferences and feedback. Existing global user_preferences stays untouched.
-- Scoped preferences deliberately require an explicit future import; legacy cuisine/diet strings
-- are weak/unvalidated and must not silently become ranking or safety policy.
CREATE TABLE household_ranking_preferences (
  household_id TEXT PRIMARY KEY NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  values_json TEXT NOT NULL
    CHECK (json_valid(values_json) AND json_type(values_json) = 'object'
      AND json_type(values_json, '$.version') IS 'integer'
      AND json_extract(values_json, '$.version') IS 1
      AND json_type(values_json, '$.values') IS 'object'),
  updated_at TEXT NOT NULL CHECK (updated_at IS strftime('%Y-%m-%dT%H:%M:%fZ', updated_at))
);

CREATE TABLE member_ranking_preferences (
  household_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  values_json TEXT NOT NULL
    CHECK (json_valid(values_json) AND json_type(values_json) = 'object'
      AND json_type(values_json, '$.version') IS 'integer'
      AND json_extract(values_json, '$.version') IS 1
      AND json_type(values_json, '$.values') IS 'object'),
  updated_at TEXT NOT NULL CHECK (updated_at IS strftime('%Y-%m-%dT%H:%M:%fZ', updated_at)),
  PRIMARY KEY (household_id, user_id),
  FOREIGN KEY (household_id, user_id)
    REFERENCES household_members(household_id, user_id) ON DELETE CASCADE
);

CREATE TABLE recipe_feedback_events (
  id TEXT PRIMARY KEY NOT NULL,
  household_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('liked', 'disliked', 'skipped', 'swapped')),
  target_recipe_id TEXT REFERENCES recipes(id) ON DELETE CASCADE,
  target_family_id TEXT REFERENCES recipe_families(id) ON DELETE CASCADE,
  replacement_recipe_id TEXT REFERENCES recipes(id) ON DELETE CASCADE,
  replacement_family_id TEXT REFERENCES recipe_families(id) ON DELETE CASCADE,
  occurred_at TEXT NOT NULL CHECK (occurred_at IS strftime('%Y-%m-%dT%H:%M:%fZ', occurred_at)),
  FOREIGN KEY (household_id, user_id)
    REFERENCES household_members(household_id, user_id) ON DELETE CASCADE,
  CHECK ((target_recipe_id IS NOT NULL) <> (target_family_id IS NOT NULL)),
  CHECK (
    (event_type = 'swapped' AND ((replacement_recipe_id IS NOT NULL) <> (replacement_family_id IS NOT NULL)))
    OR
    (event_type <> 'swapped' AND replacement_recipe_id IS NULL AND replacement_family_id IS NULL)
  )
);

CREATE INDEX idx_member_ranking_preferences_user
  ON member_ranking_preferences(user_id, household_id);
CREATE INDEX idx_recipe_feedback_recent
  ON recipe_feedback_events(household_id, user_id, event_type, occurred_at DESC, id DESC);
CREATE INDEX idx_recipe_feedback_recipe_tastes
  ON recipe_feedback_events(household_id, user_id, target_recipe_id, event_type, occurred_at DESC, id DESC)
  WHERE target_recipe_id IS NOT NULL;
CREATE INDEX idx_recipe_feedback_family_tastes
  ON recipe_feedback_events(household_id, user_id, target_family_id, event_type, occurred_at DESC, id DESC)
  WHERE target_family_id IS NOT NULL;
CREATE INDEX idx_cooked_meals_ranking_recent
  ON cooked_meals(household_id, completed_at DESC, id DESC);
