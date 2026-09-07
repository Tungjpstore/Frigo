-- Migration 0007: Frigo Week command integrity and query indexes
--
-- This migration is additive. It does not alter the overlapping legacy Week
-- tables created by migrations 0003 and 0005; that schema reconciliation needs
-- a separately verified data migration.

-- Compatibility guard for databases that received 0003 but not the 0005
-- relational projection (for example, an interrupted first deployment). These
-- definitions match the 0005 contract and are no-ops when those tables exist.
CREATE TABLE IF NOT EXISTS meal_plan_slots (
  id TEXT PRIMARY KEY,
  day_id TEXT NOT NULL REFERENCES meal_plan_days(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  slot_type TEXT NOT NULL,
  recipe_id TEXT,
  servings INTEGER NOT NULL DEFAULT 2,
  status TEXT NOT NULL DEFAULT 'PLANNED',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_meal_plan_slots_day ON meal_plan_slots(day_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_slots_plan ON meal_plan_slots(plan_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_slots_recipe ON meal_plan_slots(recipe_id);

CREATE TABLE IF NOT EXISTS meal_plan_shopping_items (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  ingredient_id TEXT,
  name TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'piece',
  checked INTEGER NOT NULL DEFAULT 0,
  cannot_buy INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_meal_plan_shopping_plan ON meal_plan_shopping_items(plan_id);

-- Backfill the active relational projection from the original 0003 tables.
-- JOINs exclude orphaned legacy rows, so foreign-key enforcement can remain on.
INSERT OR IGNORE INTO meal_plan_slots
  (id, day_id, plan_id, slot_type, recipe_id, servings, status, notes)
SELECT s.id, s.day_id, s.plan_id, s.slot_type, s.recipe_id, s.servings, s.status, s.notes
FROM meal_slots s
JOIN meal_plan_days d ON d.id = s.day_id AND d.plan_id = s.plan_id;

INSERT OR IGNORE INTO meal_plan_shopping_items
  (id, plan_id, ingredient_id, name, quantity, unit, checked, cannot_buy)
SELECT 'legacy_req_' || r.id, r.plan_id, r.ingredient_id, r.name,
       CASE WHEN r.purchase_quantity > 0 THEN r.purchase_quantity ELSE r.missing_quantity END,
       r.unit, r.is_checked, 0
FROM meal_plan_ingredient_requirements r
JOIN meal_plans p ON p.id = r.plan_id
WHERE r.purchase_quantity > 0 OR r.missing_quantity > 0;

-- A durable command ledger makes shopping imports safe to retry. The row is
-- scoped to both household and plan so a client key cannot cross tenants.
CREATE TABLE IF NOT EXISTS shopping_import_commands (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  client_key TEXT NOT NULL,
  request_fingerprint TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing', 'completed', 'failed')),
  imported_items_count INTEGER NOT NULL DEFAULT 0,
  response_json TEXT,
  error_code TEXT,
  lock_token TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  UNIQUE(household_id, plan_id, client_key)
);

CREATE INDEX IF NOT EXISTS idx_shopping_import_commands_household
  ON shopping_import_commands(household_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_shopping_import_commands_plan
  ON shopping_import_commands(plan_id, status);

-- Keep the relational read path bounded as plans and event history grow.
CREATE INDEX IF NOT EXISTS idx_meal_plan_days_plan_date
  ON meal_plan_days(plan_id, date);
CREATE INDEX IF NOT EXISTS idx_meal_plan_shopping_plan_ingredient
  ON meal_plan_shopping_items(plan_id, ingredient_id);
CREATE INDEX IF NOT EXISTS idx_inventory_events_household_created
  ON inventory_events(household_id, created_at);
