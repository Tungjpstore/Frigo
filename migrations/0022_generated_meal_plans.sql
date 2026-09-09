-- T06A generated planner state. This is deliberately separate from legacy Week plans:
-- it persists only the server-produced final snapshot for a private household member.
CREATE TABLE generated_meal_plans (
  id TEXT PRIMARY KEY NOT NULL,
  household_id TEXT NOT NULL,
  creator_user_id TEXT NOT NULL,
  request_key TEXT NOT NULL,
  request_fingerprint TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  intent_json TEXT NOT NULL
    CHECK (json_valid(intent_json) AND json_type(intent_json) = 'object'
      AND json_type(intent_json, '$.version') IS 'integer'
      AND json_extract(intent_json, '$.version') IS 1
      AND json_type(intent_json, '$.data') IS 'object'),
  result_json TEXT NOT NULL
    CHECK (json_valid(result_json) AND json_type(result_json) = 'object'
      AND json_type(result_json, '$.version') IS 'integer'
      AND json_extract(result_json, '$.version') IS 1
      AND json_type(result_json, '$.data') IS 'object'),
  source_json TEXT NOT NULL
    CHECK (json_valid(source_json) AND json_type(source_json) = 'object'
      AND json_type(source_json, '$.version') IS 'integer'
      AND json_extract(source_json, '$.version') IS 1
      AND json_type(source_json, '$.data') IS 'object'),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    CHECK (created_at IS strftime('%Y-%m-%dT%H:%M:%fZ', created_at)),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    CHECK (updated_at IS strftime('%Y-%m-%dT%H:%M:%fZ', updated_at)),
  UNIQUE (household_id, creator_user_id, request_key),
  UNIQUE (id, household_id, creator_user_id),
  FOREIGN KEY (household_id, creator_user_id)
    REFERENCES household_members(household_id, user_id) ON DELETE CASCADE
);

CREATE INDEX idx_generated_meal_plans_owner_updated
  ON generated_meal_plans(household_id, creator_user_id, updated_at DESC, id DESC);

-- Cooking annotations describe a completed action against a generated snapshot;
-- they are not inventory consumption commands or T03 cooked-meal history.
CREATE TABLE generated_meal_plan_annotations (
  id TEXT PRIMARY KEY NOT NULL,
  plan_id TEXT NOT NULL,
  household_id TEXT NOT NULL,
  creator_user_id TEXT NOT NULL,
  plan_revision INTEGER NOT NULL CHECK (plan_revision >= 1),
  slot_id TEXT NOT NULL,
  request_key TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type = 'cooked'),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    CHECK (created_at IS strftime('%Y-%m-%dT%H:%M:%fZ', created_at)),
  UNIQUE (plan_id, plan_revision, slot_id, request_key),
  FOREIGN KEY (plan_id, household_id, creator_user_id)
    REFERENCES generated_meal_plans(id, household_id, creator_user_id) ON DELETE CASCADE
);

CREATE INDEX idx_generated_meal_plan_annotations_plan
  ON generated_meal_plan_annotations(plan_id, plan_revision, slot_id, created_at DESC, id DESC);
