-- Migration 0003: Frigo Week / Weekly Planner Schema for Cloudflare D1

-- 1. Meal Plans
CREATE TABLE IF NOT EXISTS meal_plans (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'READY', -- 'DRAFT', 'GENERATING', 'READY', 'ACTIVE', 'COMPLETED', 'ARCHIVED', 'FAILED'
  budget_target REAL,
  budget_min REAL NOT NULL DEFAULT 0,
  budget_max REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'VND',
  shopping_frequency TEXT NOT NULL DEFAULT 'once',
  fridge_utilization REAL NOT NULL DEFAULT 0,
  waste_risk TEXT NOT NULL DEFAULT 'LOW',
  ai_explanation TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_meal_plans_household ON meal_plans(household_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_dates ON meal_plans(start_date, end_date);

-- 2. Meal Plan Days
CREATE TABLE IF NOT EXISTS meal_plan_days (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  day_of_week INTEGER NOT NULL,
  day_type TEXT NOT NULL DEFAULT 'cooking', -- 'cooking', 'eat_out', 'away', 'leftover', 'flexible'
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_meal_plan_days_plan ON meal_plan_days(plan_id);

-- 3. Meal Slots
CREATE TABLE IF NOT EXISTS meal_slots (
  id TEXT PRIMARY KEY,
  day_id TEXT NOT NULL REFERENCES meal_plan_days(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  slot_type TEXT NOT NULL DEFAULT 'dinner', -- 'breakfast', 'lunch', 'dinner'
  status TEXT NOT NULL DEFAULT 'PLANNED', -- 'PLANNED', 'FLEXIBLE', 'EATING_OUT', 'SKIPPED', 'LEFTOVER', 'COOKED'
  recipe_id TEXT REFERENCES recipes(id),
  servings INTEGER NOT NULL DEFAULT 2,
  source TEXT NOT NULL DEFAULT 'AUTO', -- 'AUTO', 'USER'
  is_locked INTEGER NOT NULL DEFAULT 0,
  leftover_source_id TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_meal_slots_day ON meal_slots(day_id);
CREATE INDEX IF NOT EXISTS idx_meal_slots_plan ON meal_slots(plan_id);

-- 4. Meal Plan Ingredient Requirements
CREATE TABLE IF NOT EXISTS meal_plan_ingredient_requirements (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  ingredient_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  required_quantity REAL NOT NULL,
  inventory_quantity REAL NOT NULL DEFAULT 0,
  missing_quantity REAL NOT NULL DEFAULT 0,
  purchase_quantity REAL NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  estimated_price_min REAL NOT NULL DEFAULT 0,
  estimated_price_max REAL NOT NULL DEFAULT 0,
  is_checked INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_plan_ingredients_plan ON meal_plan_ingredient_requirements(plan_id);

-- 5. Shopping Runs
CREATE TABLE IF NOT EXISTS shopping_runs (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
  started_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_shopping_runs_plan ON shopping_runs(plan_id);

-- 6. Shopping Run Items
CREATE TABLE IF NOT EXISTS shopping_run_items (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES shopping_runs(id) ON DELETE CASCADE,
  ingredient_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  quantity REAL NOT NULL,
  unit TEXT NOT NULL,
  estimated_price_min REAL NOT NULL DEFAULT 0,
  estimated_price_max REAL NOT NULL DEFAULT 0,
  is_checked INTEGER NOT NULL DEFAULT 0,
  cannot_buy INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_shopping_run_items_run ON shopping_run_items(run_id);

-- 7. Weekly Planner Preferences
CREATE TABLE IF NOT EXISTS weekly_planner_preferences (
  id TEXT PRIMARY KEY,
  household_id TEXT UNIQUE NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  meal_slots_preset TEXT NOT NULL DEFAULT 'dinner_only',
  budget_target_vnd REAL,
  shopping_frequency TEXT NOT NULL DEFAULT 'once',
  priorities TEXT NOT NULL DEFAULT '["use_fridge"]', -- JSON array
  auto_weekly_plan_enabled INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 8. Pantry Staples ("Luôn có ở nhà")
CREATE TABLE IF NOT EXISTS pantry_staples (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  ingredient_id TEXT NOT NULL,
  name TEXT NOT NULL,
  is_enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(household_id, ingredient_id)
);

-- 9. Ingredient Prices (Benchmark Pricing Table)
CREATE TABLE IF NOT EXISTS ingredient_prices (
  id TEXT PRIMARY KEY,
  ingredient_id TEXT UNIQUE NOT NULL,
  name_vi TEXT NOT NULL,
  price_min REAL NOT NULL,
  price_max REAL NOT NULL,
  unit TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'VND',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 10. Ingredient Package Sizes
CREATE TABLE IF NOT EXISTS ingredient_package_sizes (
  id TEXT PRIMARY KEY,
  ingredient_id TEXT NOT NULL,
  package_quantity REAL NOT NULL,
  unit TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pkg_sizes_ing ON ingredient_package_sizes(ingredient_id);
