-- Migration 0001: Initial Frigo Schema for Cloudflare D1

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  is_guest INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- 3. Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 4. Households
CREATE TABLE IF NOT EXISTS households (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 5. Household Members
CREATE TABLE IF NOT EXISTS household_members (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner', -- 'owner', 'member'
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(household_id, user_id)
);

-- 6. User Preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  household_size INTEGER NOT NULL DEFAULT 2,
  spicy_level TEXT NOT NULL DEFAULT 'medium', -- 'none', 'mild', 'medium', 'hot'
  favorite_cuisines TEXT NOT NULL DEFAULT '["vietnamese"]', -- JSON array
  dietary_restrictions TEXT NOT NULL DEFAULT '[]', -- JSON array
  language TEXT NOT NULL DEFAULT 'vi',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 7. Cuisines
CREATE TABLE IF NOT EXISTS cuisines (
  id TEXT PRIMARY KEY,
  name_vi TEXT NOT NULL,
  name_en TEXT NOT NULL,
  icon TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 8. Canonical Ingredients
CREATE TABLE IF NOT EXISTS ingredients (
  id TEXT PRIMARY KEY,
  name_vi TEXT NOT NULL,
  name_en TEXT NOT NULL,
  category TEXT NOT NULL, -- 'meat', 'vegetable', 'egg', 'dairy', 'spice', etc.
  default_unit TEXT NOT NULL DEFAULT 'g',
  default_shelf_life_days INTEGER NOT NULL DEFAULT 7,
  icon TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ingredients_category ON ingredients(category);

-- 9. Ingredient Aliases
CREATE TABLE IF NOT EXISTS ingredient_aliases (
  id TEXT PRIMARY KEY,
  ingredient_id TEXT NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ingredient_aliases_alias ON ingredient_aliases(alias);

-- 10. Ingredient Translations
CREATE TABLE IF NOT EXISTS ingredient_translations (
  id TEXT PRIMARY KEY,
  ingredient_id TEXT NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(ingredient_id, language)
);

-- 11. Inventory Items
CREATE TABLE IF NOT EXISTS inventory_items (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  ingredient_id TEXT REFERENCES ingredients(id),
  name TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'piece',
  category TEXT NOT NULL DEFAULT 'other',
  storage TEXT NOT NULL DEFAULT 'fridge', -- 'fridge', 'freezer', 'pantry'
  expiry_date TEXT,
  added_date TEXT NOT NULL DEFAULT (datetime('now')),
  freshness TEXT NOT NULL DEFAULT 'fresh',
  data_source TEXT NOT NULL DEFAULT 'manual', -- 'scan', 'manual', 'shopping'
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_inventory_items_household ON inventory_items(household_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_freshness ON inventory_items(freshness);

-- 12. Inventory Events (Event Sourcing)
CREATE TABLE IF NOT EXISTS inventory_events (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  inventory_item_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'ADD', 'MANUAL_UPDATE', 'SCAN_CONFIRM', 'SCAN_CORRECTION', 'COOK', 'DISCARD', 'SHOPPING_IMPORT'
  quantity_delta REAL NOT NULL,
  unit TEXT NOT NULL,
  reason TEXT,
  metadata TEXT, -- JSON
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_inventory_events_item ON inventory_events(inventory_item_id);

-- 13. Scans
CREATE TABLE IF NOT EXISTS scans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  household_id TEXT NOT NULL REFERENCES households(id),
  image_key TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'ready', 'confirmed', 'failed'
  scan_type TEXT NOT NULL DEFAULT 'fridge', -- 'fridge', 'receipt'
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 14. Scan Items (AI predictions before user confirmation)
CREATE TABLE IF NOT EXISTS scan_items (
  id TEXT PRIMARY KEY,
  scan_id TEXT NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  raw_name TEXT NOT NULL,
  canonical_id TEXT REFERENCES ingredients(id),
  estimated_quantity REAL NOT NULL,
  unit TEXT NOT NULL,
  confidence REAL NOT NULL DEFAULT 0.9,
  category TEXT,
  storage TEXT NOT NULL DEFAULT 'fridge',
  is_confirmed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_scan_items_scan ON scan_items(scan_id);

-- 15. Recipes
CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cuisine TEXT NOT NULL,
  cook_time_minutes INTEGER NOT NULL,
  servings INTEGER NOT NULL DEFAULT 2,
  difficulty TEXT NOT NULL DEFAULT 'easy',
  image_url TEXT,
  tags TEXT, -- JSON array
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_recipes_cuisine ON recipes(cuisine);

-- 16. Recipe Ingredients
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id TEXT NOT NULL REFERENCES ingredients(id),
  name TEXT NOT NULL,
  required_quantity REAL NOT NULL,
  unit TEXT NOT NULL,
  is_optional INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);

-- 17. Recipe Steps
CREATE TABLE IF NOT EXISTS recipe_steps (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  instruction TEXT NOT NULL,
  tip TEXT,
  timer_minutes INTEGER
);
CREATE INDEX IF NOT EXISTS idx_recipe_steps_recipe ON recipe_steps(recipe_id);

-- 18. Recipe Translations
CREATE TABLE IF NOT EXISTS recipe_translations (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  UNIQUE(recipe_id, language)
);

-- 19. Favorites
CREATE TABLE IF NOT EXISTS favorites (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, recipe_id)
);

-- 20. Cooked Meals
CREATE TABLE IF NOT EXISTS cooked_meals (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  recipe_id TEXT NOT NULL REFERENCES recipes(id),
  servings_cooked INTEGER NOT NULL DEFAULT 2,
  deductions_applied TEXT, -- JSON array of deducted ingredients
  completed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 21. Shopping Lists
CREATE TABLE IF NOT EXISTS shopping_lists (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Danh sách mua sắm',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 22. Shopping Items
CREATE TABLE IF NOT EXISTS shopping_items (
  id TEXT PRIMARY KEY,
  list_id TEXT NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  ingredient_id TEXT REFERENCES ingredients(id),
  name TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'piece',
  is_checked INTEGER NOT NULL DEFAULT 0,
  source_recipe_id TEXT REFERENCES recipes(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_shopping_items_list ON shopping_items(list_id);

-- 23. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'expiring_soon', 'cook_ready', 'shopping_reminder'
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 24. AI Requests (Tracking & Cost Analytics)
CREATE TABLE IF NOT EXISTS ai_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  task TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  latency_ms INTEGER NOT NULL DEFAULT 0,
  estimated_cost REAL NOT NULL DEFAULT 0.0,
  status TEXT NOT NULL DEFAULT 'success',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 25. Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free', -- 'free', 'plus'
  status TEXT NOT NULL DEFAULT 'active',
  scan_count_current_month INTEGER NOT NULL DEFAULT 0,
  max_scans_per_month INTEGER NOT NULL DEFAULT 5,
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
