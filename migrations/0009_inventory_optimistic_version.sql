-- Migration 0009: optimistic concurrency for inventory projections.
--
-- Every inventory mutation increments version. PATCH/DELETE commands include
-- the version observed during their read, so concurrent edits return a
-- conflict instead of silently overwriting each other.

ALTER TABLE inventory_items ADD COLUMN version INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_inventory_items_household_version
  ON inventory_items(household_id, version);

