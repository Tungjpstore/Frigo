import { afterEach, describe, expect, it } from 'vitest';
import { loadRankingContext, saveRankingPreferences } from '../../packages/db/src/personalization';
import { createPlanningContext } from '../../packages/recipes/src/planner-context';
import type { InventoryLotSnapshot } from '../../packages/recipes/src/planner-inventory';
import { planWeeklyMeals } from '../../packages/recipes/src/weekly-planner';
import { SqliteD1 } from '../helpers/sqlite-d1';
import { catalog, dinner, recipe, request } from '../helpers/planner-fixtures';

const instant = '2026-09-08T00:00:00.000Z';
const databases: SqliteD1[] = [];
function fixture() {
  const db = new SqliteD1();
  databases.push(db);
  db.seed(`
    INSERT INTO users (id) VALUES ('planner-user'), ('planner-other');
    INSERT INTO households (id, name, created_by) VALUES
      ('planner-a', 'Planner A', 'planner-user'), ('planner-b', 'Planner B', 'planner-user');
    INSERT INTO household_members (id, household_id, user_id, role) VALUES
      ('planner-member-a', 'planner-a', 'planner-user', 'owner'),
      ('planner-member-b', 'planner-b', 'planner-user', 'owner');
    INSERT INTO inventory_items (id, household_id, ingredient_id, name, quantity, unit, version) VALUES
      ('planner-lot-a', 'planner-a', 'CHICKEN_BREAST', 'Chicken A', 600, 'g', 3),
      ('planner-lot-b', 'planner-b', 'CHICKEN_BREAST', 'Chicken B', 900, 'g', 7);
  `);
  return db;
}
async function preload(db: SqliteD1, householdId: string, userId = 'planner-user') {
  const rankingContext = await loadRankingContext(db, { householdId, userId }, instant);
  const inventory = await db.prepare(`SELECT id, household_id AS householdId, version,
    COALESCE(ingredient_id, '') AS ingredientId, quantity, unit, freshness,
    expiry_date AS expiryDate, expiry_kind AS expiryKind, storage, expiry_source AS expirySource
    FROM inventory_items WHERE household_id = ? ORDER BY id`).bind(householdId).all<InventoryLotSnapshot>();
  if (!inventory.success) throw new Error('Inventory read failed');
  return createPlanningContext(() => ({ snapshotId: `snapshot-${householdId}`, referenceInstant: instant,
    inventory: inventory.results, rankingContext, catalog: catalog([recipe('meal', 'CHICKEN_BREAST')]) }));
}

afterEach(() => { databases.splice(0).forEach((db) => db.close()); });

describe('T04 trusted preload and read-only persistence boundary', () => {
  it('uses persisted household hard restrictions without leaking another household preferences or lots', async () => {
    const db = fixture();
    await saveRankingPreferences(db, { householdId: 'planner-a', userId: 'planner-user' }, {
      scope: 'household', values: { forbiddenIngredientIds: ['CHICKEN_BREAST'] }, updatedAt: instant,
    });
    const a = planWeeklyMeals({ context: await preload(db, 'planner-a'), request: request([dinner('2026-09-08')]) });
    const b = planWeeklyMeals({ context: await preload(db, 'planner-b'), request: request([dinner('2026-09-08')]) });
    expect(a.status).toBe('infeasible');
    expect(a.diagnostics.some((issue) => issue.code === 'FORBIDDEN_INGREDIENT')).toBe(true);
    expect(b.status).toBe('feasible');
    expect(b.projectedFinalInventory).toMatchObject([{ id: 'planner-lot-b', householdId: 'planner-b', quantity: 600, version: 7 }]);
    await expect(preload(db, 'planner-a', 'planner-other')).rejects.toThrow('not authorized');
  });

  it('performs no database access or actual stock/Week changes during search and preserves stale snapshot evidence', async () => {
    const db = fixture();
    const context = await preload(db, 'planner-a');
    const before = {
      stock: db.query('SELECT * FROM inventory_items ORDER BY id'),
      events: db.query('SELECT * FROM inventory_events'),
      plans: db.query('SELECT * FROM meal_plans'),
    };
    let statementsDuringSearch = 0;
    db.hooks = { beforeStatement: () => { statementsDuringSearch++; throw new Error('Unexpected planner I/O'); },
      beforeBatch: () => { statementsDuringSearch++; throw new Error('Unexpected planner batch'); } };
    const result = planWeeklyMeals({ context, request: request([dinner('2026-09-08'), dinner('2026-09-09')]) });
    expect(result.status).toBe('feasible');
    expect(result.projectedFinalInventory[0]).toMatchObject({ quantity: 0, consumedQuantity: 600, version: 3 });
    expect(statementsDuringSearch).toBe(0);
    expect({ stock: db.query('SELECT * FROM inventory_items ORDER BY id'), events: db.query('SELECT * FROM inventory_events'),
      plans: db.query('SELECT * FROM meal_plans') }).toEqual(before);
    db.seed("UPDATE inventory_items SET quantity = 500, version = version + 1 WHERE id = 'planner-lot-a'");
    expect(result.initialInventorySnapshot[0]).toMatchObject({ quantity: 600, version: 3 });
    expect(db.query('SELECT quantity, version FROM inventory_items WHERE id = ?', 'planner-lot-a')[0]).toMatchObject({ quantity: 500, version: 4 });
    expect(result.sourceSnapshot.requiresRevalidationBeforeAcceptance).toBe(true);
  });
});
