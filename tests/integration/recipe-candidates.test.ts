import { afterEach, describe, expect, it } from 'vitest';
import { SqliteD1 } from '../helpers/sqlite-d1';
import { readRecipeCatalog } from '../../packages/db/src/recipe-catalog';
import { generateRecipeCandidates } from '../../packages/recipes/src/candidates';
import { ALL_RECIPES } from '../../packages/recipes/src/data';

const inventorySql = `SELECT id, household_id AS householdId, ingredient_id AS ingredientId,
  quantity, unit, freshness, expiry_date AS expiryDate, expiry_kind AS expiryKind
  FROM inventory_items WHERE household_id = ? ORDER BY id`;

describe('D1 catalog and inventory to T02 candidates', () => {
  const databases: SqliteD1[] = [];
  const fixture = () => {
    const db = new SqliteD1();
    databases.push(db);
    db.seed(`
      INSERT INTO users (id) VALUES ('t02-user');
      INSERT INTO households (id, name, created_by) VALUES ('t02-home', 'T02 home', 't02-user'), ('t02-other', 'Other home', 't02-user');
      INSERT INTO recipes (id, slug, title, cuisine, cook_time_minutes, servings, difficulty)
      VALUES ('t02-meal', 't02-meal', 'Persisted meal', 'vietnamese', 20, 2, 'easy');
      INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, name, required_quantity, unit, is_optional)
      VALUES ('t02-chicken', 't02-meal', 'CHICKEN_BREAST', 'Chicken', 300, 'g', 0),
             ('t02-onion', 't02-meal', 'ONION', 'Onion', 50, 'g', 1);
    `);
    return db;
  };
  afterEach(() => { for (const db of databases.splice(0)) db.close(); });

  it('uses real persisted 200 g + 0.15 kg lots without writes, cross-household pooling or runtime catalog cutover', async () => {
    const db = fixture();
    db.seed(`
      INSERT INTO inventory_items (id, household_id, ingredient_id, name, quantity, unit)
      VALUES ('t02-A', 't02-home', 'CHICKEN_BREAST', 'Chicken A', 200, 'g'),
             ('t02-B', 't02-home', 'CHICKEN_BREAST', 'Chicken B', 0.15, 'kg'),
             ('t02-C', 't02-other', 'CHICKEN_BREAST', 'Other chicken', 1000, 'g');
    `);
    const before = db.query('SELECT * FROM inventory_items ORDER BY id');
    const beforeEvents = db.query('SELECT * FROM inventory_events ORDER BY id');
    const source = await readRecipeCatalog(db);
    const result = generateRecipeCandidates({ catalog: source, inventory: db.query(inventorySql, 't02-home'), householdId: 't02-home',
      asOfDate: '2026-09-08', requestedServings: 2, mode: 'cook_now' });
    const candidate = result.candidates.find((item) => item.source.sourceId === 't02-meal');
    expect(candidate).toMatchObject({ source: { catalog: 'd1' }, canCookWithoutBuying: true,
      requirements: [{ ingredientId: 'CHICKEN_BREAST', status: 'satisfied', availableQuantity: 350, requiredQuantity: 300, missingQuantity: 0 },
        { ingredientId: 'ONION', isOptional: true, status: 'missing' }],
    });
    expect(candidate?.lotAllocations.map((allocation) => allocation.lotId)).toEqual(['t02-A', 't02-B']);
    expect(db.query('SELECT * FROM inventory_items ORDER BY id')).toEqual(before);
    expect(db.query('SELECT * FROM inventory_events ORDER BY id')).toEqual(beforeEvents);
    expect(ALL_RECIPES.some((recipe) => recipe.id === 't02-meal')).toBe(false);
    expect(() => JSON.stringify(result)).not.toThrow();
  });

  it('preserves malformed and unmapped D1 inventory diagnostics without invalidating unrelated required stock', async () => {
    const db = fixture();
    db.seed(`
      INSERT INTO inventory_items (id, household_id, ingredient_id, name, quantity, unit)
      VALUES ('t02-A', 't02-home', 'CHICKEN_BREAST', 'Chicken', 300, 'g'),
             ('t02-B', 't02-home', 'ONION', 'Invalid optional quantity', -10, 'g'),
             ('t02-C', 't02-home', NULL, 'Unmapped label', 1, 'pack');
    `);
    const result = generateRecipeCandidates({ catalog: await readRecipeCatalog(db), inventory: db.query(inventorySql, 't02-home'),
      householdId: 't02-home', asOfDate: '2026-09-08', requestedServings: 2, mode: 'cook_now' });
    expect(result.candidates.find((item) => item.source.sourceId === 't02-meal')?.canCookWithoutBuying).toBe(true);
    expect(result.inventoryDiagnostics).toHaveLength(2);
    expect(result.inventoryDiagnostics.every((diagnostic) => diagnostic.code === 'invalid_inventory')).toBe(true);
  });

  it('keeps persisted contextual stock unresolved in shopping mode and excludes it from cook-now', async () => {
    const db = fixture();
    db.seed(`INSERT INTO inventory_items (id, household_id, ingredient_id, name, quantity, unit)
      VALUES ('t02-A', 't02-home', 'CHICKEN_BREAST', 'Chicken pack', 1, 'pack');`);
    const input = { catalog: await readRecipeCatalog(db), inventory: db.query(inventorySql, 't02-home'), householdId: 't02-home',
      asOfDate: '2026-09-08', requestedServings: 2 };
    const result = generateRecipeCandidates({ ...input, mode: 'shopping_allowed' });
    expect(result.candidates.find((item) => item.source.sourceId === 't02-meal')?.requirements[0])
      .toMatchObject({ status: 'unresolved', missingQuantity: null, availableQuantity: 0 });
    const cookNow = generateRecipeCandidates({ ...input, mode: 'cook_now' });
    expect(cookNow.candidates.some((item) => item.source.sourceId === 't02-meal')).toBe(false);
    expect(cookNow.exclusions).toContainEqual({ sourceId: 't02-meal', sourceKind: 'recipe', reason: 'required_unresolved' });
  });
});
