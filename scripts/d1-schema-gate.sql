WITH
required_migrations(name) AS (
  VALUES
    ('0001_initial_schema.sql'),
    ('0002_seed_data.sql'),
    ('0003_weekly_planner.sql'),
    ('0004_auth_system.sql'),
    ('0005_meal_plans_relational.sql'),
    ('0006_vietnamese_recipe_bank.sql'),
    ('0007_week_integrity.sql'),
    ('0008_week_snapshot_metadata.sql'),
    ('0009_inventory_optimistic_version.sql'),
    ('0010_week_schema_shadow_canonical.sql'),
    ('0011_meal_plan_tenant_ownership.sql'),
    ('0012_scan_queue_jobs.sql'),
    ('0013_scan_receipt_metadata.sql')
),
required_tables(name) AS (
  VALUES
    ('users'),
    ('households'),
    ('inventory_items'),
    ('inventory_events'),
    ('scans'),
    ('meal_plans'),
    ('shopping_import_commands'),
    ('meal_plan_days_v2'),
    ('meal_plan_slots_v2'),
    ('meal_plan_shopping_items_v2')
    ,('scan_queue_jobs')
),
required_columns(table_name, column_name) AS (
  VALUES
    ('inventory_items', 'version'),
    ('meal_plans', 'snapshot_json'),
    ('shopping_import_commands', 'request_fingerprint'),
    ('shopping_import_commands', 'lock_token'),
    ('meal_plan_days_v2', 'day_type'),
    ('meal_plan_days_v2', 'snapshot_json'),
    ('meal_plan_slots_v2', 'source'),
    ('meal_plan_slots_v2', 'is_locked'),
    ('meal_plan_slots_v2', 'leftover_source_id'),
    ('meal_plan_slots_v2', 'snapshot_json'),
    ('meal_plan_shopping_items_v2', 'required_quantity'),
    ('meal_plan_shopping_items_v2', 'inventory_quantity'),
    ('meal_plan_shopping_items_v2', 'missing_quantity'),
    ('meal_plan_shopping_items_v2', 'purchase_quantity'),
    ('meal_plan_shopping_items_v2', 'estimated_price_min'),
    ('meal_plan_shopping_items_v2', 'estimated_price_max'),
    ('meal_plan_shopping_items_v2', 'snapshot_json')
    ,('scan_queue_jobs', 'status')
    ,('scan_queue_jobs', 'attempts')
    ,('scan_queue_jobs', 'max_attempts')
    ,('scan_queue_jobs', 'idempotency_key')
    ,('scans', 'merchant_name')
    ,('scans', 'invoice_number')
    ,('scans', 'purchase_date')
    ,('scans', 'total_amount_vnd')
    ,('scan_items', 'unit_price_vnd')
    ,('scan_items', 'total_price_vnd')
)
SELECT 'missing_migration' AS issue, migration.name AS detail
FROM required_migrations migration
WHERE NOT EXISTS (
  SELECT 1 FROM d1_migrations applied WHERE applied.name = migration.name
)
UNION ALL
SELECT 'missing_table', required.name
FROM required_tables required
WHERE NOT EXISTS (
  SELECT 1
  FROM sqlite_master existing
  WHERE existing.type = 'table' AND existing.name = required.name
)
UNION ALL
SELECT 'missing_column', required.table_name || '.' || required.column_name
FROM required_columns required
WHERE NOT EXISTS (
  SELECT 1
  FROM pragma_table_info(required.table_name) column_info
  WHERE column_info.name = required.column_name
)
UNION ALL
SELECT 'missing_trigger', 'trg_meal_plans_household_immutable'
WHERE NOT EXISTS (
  SELECT 1 FROM sqlite_master
  WHERE type = 'trigger' AND name = 'trg_meal_plans_household_immutable'
)
UNION ALL
SELECT 'foreign_key_violation',
       foreign_keys."table" || '[rowid=' || foreign_keys.rowid || '] -> ' || foreign_keys.parent
FROM pragma_foreign_key_check foreign_keys
ORDER BY issue, detail;
