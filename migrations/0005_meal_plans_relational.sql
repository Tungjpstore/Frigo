-- Migration 0005: Relational Meal Plans (Days, Slots, Shopping Items)
-- Ensures permanent, normalized relational persistence for Frigo Week in D1

-- 1. Meal Plan Days
CREATE TABLE IF NOT EXISTS meal_plan_days (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL, -- 'Monday', 'Tuesday', ...
  date TEXT NOT NULL,        -- 'YYYY-MM-DD'
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_meal_plan_days_plan ON meal_plan_days(plan_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_days_date ON meal_plan_days(date);

-- 2. Meal Plan Slots
CREATE TABLE IF NOT EXISTS meal_plan_slots (
  id TEXT PRIMARY KEY,
  day_id TEXT NOT NULL REFERENCES meal_plan_days(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  slot_type TEXT NOT NULL,   -- 'breakfast', 'lunch', 'dinner'
  recipe_id TEXT,
  servings INTEGER NOT NULL DEFAULT 2,
  status TEXT NOT NULL DEFAULT 'PLANNED', -- 'PLANNED', 'COOKED', 'SKIPPED'
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_meal_plan_slots_day ON meal_plan_slots(day_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_slots_plan ON meal_plan_slots(plan_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_slots_recipe ON meal_plan_slots(recipe_id);

-- 3. Meal Plan Shopping Items
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
