-- Migration 0008: preserve the complete Frigo Week read model.
--
-- The normalized Week tables keep queryable fields for filtering and updates,
-- while these JSON snapshots retain planner-only metadata (ingredients,
-- availability, cost, badges, source recipes, and summary counters). The
-- columns are additive so existing plans remain readable and can be rebuilt
-- by the worker's legacy fallback path.

ALTER TABLE meal_plans ADD COLUMN snapshot_json TEXT;
ALTER TABLE meal_plan_slots ADD COLUMN snapshot_json TEXT;
ALTER TABLE meal_plan_shopping_items ADD COLUMN snapshot_json TEXT;

