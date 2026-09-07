-- Read-only Week v1/v2 reconciliation projection.
-- The shell wrapper executes this as one D1 statement and hashes rows locally.
SELECT 'plans' AS dataset,
       json_object(
         'id', id,
         'household_id', household_id,
         'start_date', start_date,
         'end_date', end_date,
         'status', status,
         'budget_target', budget_target,
         'budget_min', budget_min,
         'budget_max', budget_max,
         'currency', currency,
         'shopping_frequency', shopping_frequency,
         'waste_risk', waste_risk,
         'ai_explanation', ai_explanation
       ) AS payload
FROM meal_plans
;
SELECT 'v1_days' AS dataset,
       json_object(
         'id', id,
         'plan_id', plan_id,
         'date', date,
         'day_of_week', day_of_week,
         'day_type', day_type
       ) AS payload
FROM meal_plan_days
;
SELECT 'v2_days' AS dataset,
       json_object(
         'id', id,
         'plan_id', plan_id,
         'date', date,
         'day_of_week', day_of_week,
         'day_type', day_type
       ) AS payload
FROM meal_plan_days_v2
;
SELECT 'v1_slots' AS dataset,
       json_object(
         'id', id,
         'day_id', day_id,
         'plan_id', plan_id,
         'slot_type', slot_type,
         'status', status,
         'recipe_id', recipe_id,
         'servings', servings,
         'notes', notes,
         'snapshot_json', snapshot_json
       ) AS payload
FROM meal_plan_slots
;
SELECT 'v2_slots' AS dataset,
       json_object(
         'id', id,
         'day_id', day_id,
         'plan_id', plan_id,
         'slot_type', slot_type,
         'status', status,
         'recipe_id', recipe_id,
         'servings', servings,
         'source', source,
         'is_locked', is_locked,
         'leftover_source_id', leftover_source_id,
         'notes', notes,
         'snapshot_json', snapshot_json
       ) AS payload
FROM meal_plan_slots_v2
;
SELECT 'v1_shopping' AS dataset,
       json_object(
         'id', id,
         'plan_id', plan_id,
         'ingredient_id', ingredient_id,
         'name', name,
         'quantity', quantity,
         'unit', unit,
         'checked', checked,
         'cannot_buy', cannot_buy,
         'snapshot_json', snapshot_json
       ) AS payload
FROM meal_plan_shopping_items
;
SELECT 'v2_shopping' AS dataset,
       json_object(
         'id', id,
         'plan_id', plan_id,
         'ingredient_id', ingredient_id,
         'name', name,
         'category', category,
         'required_quantity', required_quantity,
         'inventory_quantity', inventory_quantity,
         'missing_quantity', missing_quantity,
         'purchase_quantity', purchase_quantity,
         'quantity', quantity,
         'unit', unit,
         'estimated_price_min', estimated_price_min,
         'estimated_price_max', estimated_price_max,
         'checked', checked,
         'cannot_buy', cannot_buy,
         'snapshot_json', snapshot_json
       ) AS payload
FROM meal_plan_shopping_items_v2;
