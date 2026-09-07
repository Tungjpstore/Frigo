-- Migration 0010: additive canonical Frigo Week shadow schema
--
-- Migrations 0003 and 0005 created overlapping Week projections.  This
-- migration introduces a single, richer shape without changing or dropping
-- either historical projection.  Worker cutover is intentionally separate:
-- existing reads/writes remain safe while this backfill is verified.

-- 1. Canonical day projection
CREATE TABLE IF NOT EXISTS meal_plan_days_v2 (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  day_of_week INTEGER NOT NULL,
  day_type TEXT NOT NULL DEFAULT 'cooking',
  snapshot_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_meal_plan_days_v2_plan_date
  ON meal_plan_days_v2(plan_id, date);

-- 2. Canonical slot projection.  The v2 shape keeps the richer 0003 fields
-- alongside the 0005 relational fields and the complete JSON snapshot.
CREATE TABLE IF NOT EXISTS meal_plan_slots_v2 (
  id TEXT PRIMARY KEY,
  day_id TEXT NOT NULL REFERENCES meal_plan_days_v2(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  slot_type TEXT NOT NULL DEFAULT 'dinner',
  status TEXT NOT NULL DEFAULT 'PLANNED',
  recipe_id TEXT,
  servings INTEGER NOT NULL DEFAULT 2,
  source TEXT NOT NULL DEFAULT 'AUTO',
  is_locked INTEGER NOT NULL DEFAULT 0,
  leftover_source_id TEXT,
  notes TEXT,
  snapshot_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_meal_plan_slots_v2_day
  ON meal_plan_slots_v2(day_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_slots_v2_plan
  ON meal_plan_slots_v2(plan_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_slots_v2_recipe
  ON meal_plan_slots_v2(recipe_id);

-- 3. Canonical shopping projection.  `quantity` remains the purchase
-- quantity compatibility alias; the explicit fields retain planner math.
CREATE TABLE IF NOT EXISTS meal_plan_shopping_items_v2 (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  ingredient_id TEXT,
  name TEXT NOT NULL,
  category TEXT,
  required_quantity REAL NOT NULL DEFAULT 0,
  inventory_quantity REAL NOT NULL DEFAULT 0,
  missing_quantity REAL NOT NULL DEFAULT 0,
  purchase_quantity REAL NOT NULL DEFAULT 0,
  quantity REAL NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'piece',
  estimated_price_min REAL NOT NULL DEFAULT 0,
  estimated_price_max REAL NOT NULL DEFAULT 0,
  checked INTEGER NOT NULL DEFAULT 0,
  cannot_buy INTEGER NOT NULL DEFAULT 0,
  snapshot_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_meal_plan_shopping_v2_plan
  ON meal_plan_shopping_items_v2(plan_id);
CREATE INDEX IF NOT EXISTS idx_meal_plan_shopping_v2_plan_ingredient
  ON meal_plan_shopping_items_v2(plan_id, ingredient_id);

-- Backfill days from the surviving 0003/0005 table.  The LEFT JOIN is kept
-- explicit so a future source projection can contribute metadata without
-- dropping a valid day row.
INSERT OR IGNORE INTO meal_plan_days_v2
  (id, plan_id, date, day_of_week, day_type, created_at, updated_at)
SELECT d.id,
       d.plan_id,
       d.date,
       CASE
         WHEN CAST(d.day_of_week AS INTEGER) BETWEEN 1 AND 7
           THEN CAST(d.day_of_week AS INTEGER)
         WHEN strftime('%w', d.date) = '0' THEN 7
         ELSE CAST(strftime('%w', d.date) AS INTEGER)
       END,
       COALESCE(NULLIF(d.day_type, ''), 'cooking'),
       COALESCE(d.created_at, datetime('now')),
       COALESCE(d.created_at, datetime('now'))
FROM meal_plan_days d
JOIN meal_plans p ON p.id = d.plan_id;

-- Prefer the newer relational projection when an id exists in both sources,
-- while recovering rich 0003 metadata from meal_slots.
INSERT OR IGNORE INTO meal_plan_slots_v2
  (id, day_id, plan_id, slot_type, status, recipe_id, servings, source,
   is_locked, leftover_source_id, notes, snapshot_json, created_at, updated_at)
SELECT current_slot.id,
       current_slot.day_id,
       current_slot.plan_id,
       current_slot.slot_type,
       current_slot.status,
       current_slot.recipe_id,
       current_slot.servings,
       COALESCE(NULLIF(legacy_slot.source, ''), 'AUTO'),
       COALESCE(legacy_slot.is_locked, 0),
       legacy_slot.leftover_source_id,
       current_slot.notes,
       current_slot.snapshot_json,
       COALESCE(current_slot.created_at, datetime('now')),
       COALESCE(current_slot.updated_at, current_slot.created_at, datetime('now'))
FROM meal_plan_slots current_slot
JOIN meal_plan_days_v2 d ON d.id = current_slot.day_id AND d.plan_id = current_slot.plan_id
JOIN meal_plans p ON p.id = current_slot.plan_id
LEFT JOIN meal_slots legacy_slot ON legacy_slot.id = current_slot.id
                         AND legacy_slot.day_id = current_slot.day_id
                         AND legacy_slot.plan_id = current_slot.plan_id;

-- Recover rows that only exist in the legacy 0003 projection.
INSERT OR IGNORE INTO meal_plan_slots_v2
  (id, day_id, plan_id, slot_type, status, recipe_id, servings, source,
   is_locked, leftover_source_id, notes, snapshot_json, created_at, updated_at)
SELECT legacy_slot.id,
       legacy_slot.day_id,
       legacy_slot.plan_id,
       legacy_slot.slot_type,
       legacy_slot.status,
       legacy_slot.recipe_id,
       legacy_slot.servings,
       COALESCE(NULLIF(legacy_slot.source, ''), 'AUTO'),
       COALESCE(legacy_slot.is_locked, 0),
       legacy_slot.leftover_source_id,
       legacy_slot.notes,
       NULL,
       COALESCE(legacy_slot.created_at, datetime('now')),
       COALESCE(legacy_slot.created_at, datetime('now'))
FROM meal_slots legacy_slot
JOIN meal_plan_days_v2 d ON d.id = legacy_slot.day_id AND d.plan_id = legacy_slot.plan_id
JOIN meal_plans p ON p.id = legacy_slot.plan_id
WHERE NOT EXISTS (SELECT 1 FROM meal_plan_slots_v2 s WHERE s.id = legacy_slot.id);

-- Backfill the current relational shopping projection first.  Its snapshot
-- is authoritative when present; quantity is retained as a purchase alias.
INSERT OR IGNORE INTO meal_plan_shopping_items_v2
  (id, plan_id, ingredient_id, name, category, required_quantity,
   inventory_quantity, missing_quantity, purchase_quantity, quantity, unit,
   estimated_price_min, estimated_price_max, checked, cannot_buy, snapshot_json,
   created_at, updated_at)
SELECT current_item.id,
       current_item.plan_id,
       current_item.ingredient_id,
       COALESCE(current_item.name, (
         SELECT requirement.name
         FROM meal_plan_ingredient_requirements requirement
         WHERE requirement.plan_id = current_item.plan_id
           AND requirement.ingredient_id = current_item.ingredient_id
         ORDER BY requirement.created_at ASC
         LIMIT 1
       )),
       COALESCE(CASE WHEN json_valid(current_item.snapshot_json)
                     THEN json_extract(current_item.snapshot_json, '$.category') END,
                (
                  SELECT requirement.category
                  FROM meal_plan_ingredient_requirements requirement
                  WHERE requirement.plan_id = current_item.plan_id
                    AND requirement.ingredient_id = current_item.ingredient_id
                  ORDER BY requirement.created_at ASC
                  LIMIT 1
                )),
       COALESCE(CASE WHEN json_valid(current_item.snapshot_json)
                     THEN json_extract(current_item.snapshot_json, '$.requiredQuantity') END,
                (SELECT requirement.required_quantity
                 FROM meal_plan_ingredient_requirements requirement
                 WHERE requirement.plan_id = current_item.plan_id
                   AND requirement.ingredient_id = current_item.ingredient_id
                 ORDER BY requirement.created_at ASC
                 LIMIT 1), current_item.quantity, 0),
       COALESCE(CASE WHEN json_valid(current_item.snapshot_json)
                     THEN json_extract(current_item.snapshot_json, '$.existingInventoryQuantity') END,
                (SELECT requirement.inventory_quantity
                 FROM meal_plan_ingredient_requirements requirement
                 WHERE requirement.plan_id = current_item.plan_id
                   AND requirement.ingredient_id = current_item.ingredient_id
                 ORDER BY requirement.created_at ASC
                 LIMIT 1), 0),
       COALESCE(CASE WHEN json_valid(current_item.snapshot_json)
                     THEN json_extract(current_item.snapshot_json, '$.missingQuantity') END,
                (SELECT requirement.missing_quantity
                 FROM meal_plan_ingredient_requirements requirement
                 WHERE requirement.plan_id = current_item.plan_id
                   AND requirement.ingredient_id = current_item.ingredient_id
                 ORDER BY requirement.created_at ASC
                 LIMIT 1), current_item.quantity, 0),
       COALESCE(CASE WHEN json_valid(current_item.snapshot_json)
                     THEN json_extract(current_item.snapshot_json, '$.recommendedPurchaseQuantity') END,
                (SELECT requirement.purchase_quantity
                 FROM meal_plan_ingredient_requirements requirement
                 WHERE requirement.plan_id = current_item.plan_id
                   AND requirement.ingredient_id = current_item.ingredient_id
                 ORDER BY requirement.created_at ASC
                 LIMIT 1), current_item.quantity, 0),
       current_item.quantity,
       current_item.unit,
       COALESCE(CASE WHEN json_valid(current_item.snapshot_json)
                     THEN json_extract(current_item.snapshot_json, '$.estimatedPriceMin') END,
                (SELECT requirement.estimated_price_min
                 FROM meal_plan_ingredient_requirements requirement
                 WHERE requirement.plan_id = current_item.plan_id
                   AND requirement.ingredient_id = current_item.ingredient_id
                 ORDER BY requirement.created_at ASC
                 LIMIT 1), 0),
       COALESCE(CASE WHEN json_valid(current_item.snapshot_json)
                     THEN json_extract(current_item.snapshot_json, '$.estimatedPriceMax') END,
                (SELECT requirement.estimated_price_max
                 FROM meal_plan_ingredient_requirements requirement
                 WHERE requirement.plan_id = current_item.plan_id
                   AND requirement.ingredient_id = current_item.ingredient_id
                 ORDER BY requirement.created_at ASC
                 LIMIT 1), 0),
       current_item.checked,
       current_item.cannot_buy,
       current_item.snapshot_json,
       COALESCE(current_item.created_at, datetime('now')),
       COALESCE(current_item.updated_at, current_item.created_at, datetime('now'))
FROM meal_plan_shopping_items current_item
JOIN meal_plans p ON p.id = current_item.plan_id;

-- Requirements are the legacy planner projection.  Add only rows absent from
-- the current shopping table so checked/purchase state is never overwritten.
INSERT OR IGNORE INTO meal_plan_shopping_items_v2
  (id, plan_id, ingredient_id, name, category, required_quantity,
   inventory_quantity, missing_quantity, purchase_quantity, quantity, unit,
   estimated_price_min, estimated_price_max, checked, cannot_buy, snapshot_json,
   created_at, updated_at)
SELECT 'legacy_req_' || requirement.id,
       requirement.plan_id,
       requirement.ingredient_id,
       requirement.name,
       requirement.category,
       requirement.required_quantity,
       requirement.inventory_quantity,
       requirement.missing_quantity,
       requirement.purchase_quantity,
       CASE
         WHEN requirement.purchase_quantity > 0 THEN requirement.purchase_quantity
         ELSE requirement.missing_quantity
       END,
       requirement.unit,
       requirement.estimated_price_min,
       requirement.estimated_price_max,
       requirement.is_checked,
       0,
       NULL,
       COALESCE(requirement.created_at, datetime('now')),
       COALESCE(requirement.created_at, datetime('now'))
FROM meal_plan_ingredient_requirements requirement
JOIN meal_plans p ON p.id = requirement.plan_id
WHERE NOT EXISTS (
  SELECT 1
  FROM meal_plan_shopping_items_v2 item
  WHERE item.plan_id = requirement.plan_id
    AND item.ingredient_id = requirement.ingredient_id
);
