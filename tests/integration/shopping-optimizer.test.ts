import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { loadRankingContext } from '../../packages/db/src/personalization';
import { createPlanningContext } from '../../packages/recipes/src/planner-context';
import type { InventoryLotSnapshot } from '../../packages/recipes/src/planner-inventory';
import { planWeeklyMeals } from '../../packages/recipes/src/weekly-planner';
import {
  createShoppingContext,
  type ShoppingSourceInput,
} from '../../packages/recipes/src/shopping-catalog';
import { optimizeShopping } from '../../packages/recipes/src/shopping-optimizer';
import { SqliteD1 } from '../helpers/sqlite-d1';
import { catalog, dinner, recipe, request } from '../helpers/planner-fixtures';

const instant = '2026-09-08T00:00:00.000Z';
const databases: SqliteD1[] = [];
function fixture() {
  const db = new SqliteD1();
  databases.push(db);
  db.seed(`
    INSERT INTO users (id) VALUES ('shop-user'), ('shop-outsider');
    INSERT INTO households (id, name, created_by) VALUES ('shop-a', 'A', 'shop-user'), ('shop-b', 'B', 'shop-user');
    INSERT INTO household_members (id, household_id, user_id, role) VALUES
      ('shop-member-a', 'shop-a', 'shop-user', 'owner'), ('shop-member-b', 'shop-b', 'shop-user', 'owner');
    INSERT INTO inventory_items (id, household_id, ingredient_id, name, quantity, unit, version) VALUES
      ('shop-lot-a', 'shop-a', 'CHICKEN_BREAST', 'Chicken A', 100, 'g', 3),
      ('shop-lot-b', 'shop-b', 'CHICKEN_BREAST', 'Chicken B', 300, 'g', 7);
  `);
  return db;
}
async function preload(
  db: SqliteD1,
  householdId: string,
  userId = 'shop-user',
): Promise<ShoppingSourceInput> {
  const rankingContext = await loadRankingContext(db, { householdId, userId }, instant);
  const inventory = await db
    .prepare(
      `SELECT id, household_id AS householdId, version,
    ingredient_id AS ingredientId, quantity, unit, freshness, expiry_date AS expiryDate,
    expiry_kind AS expiryKind FROM inventory_items WHERE household_id = ? ORDER BY id`,
    )
    .bind(householdId)
    .all<InventoryLotSnapshot>();
  if (!inventory.success) throw new Error('Inventory unavailable');
  const mealPlan = planWeeklyMeals({
    context: createPlanningContext(() => ({
      snapshotId: householdId,
      referenceInstant: instant,
      inventory: inventory.results,
      rankingContext,
      catalog: catalog([recipe('meal', 'CHICKEN_BREAST')]),
    })),
    request: request([dinner('2026-09-08'), dinner('2026-09-09')], { mode: 'shopping_allowed' }),
  });
  return {
    householdId,
    userId,
    mealPlan,
    currency: 'VND',
    budget: {
      householdId,
      currency: 'VND',
      amountMinor: householdId === 'shop-a' ? 40000 : 60000,
      mode: 'hard',
      revision: '1',
    },
    catalog: {
      snapshotId: 'reviewed-test-offers',
      asOf: instant,
      options: [
        {
          id: 'chicken-500',
          ingredientId: 'CHICKEN_BREAST',
          packageContent: { quantity: 500, unit: 'g', sourceReference: 'reviewed-test-package' },
          price: {
            amountMinor: 50000,
            currency: 'VND',
            source: 'manual',
            sourceReference: 'test-observation',
            asOf: instant,
          },
          availability: 'available',
          expiry: null,
        },
      ],
    },
  };
}
afterEach(() => {
  databases.splice(0).forEach((db) => db.close());
});

describe('T05 authorized preload and generated-only boundary', () => {
  it('keeps household stock and budget isolated and refuses an unauthorized preload', async () => {
    const db = fixture();
    const aSource = await preload(db, 'shop-a');
    const bSource = await preload(db, 'shop-b');
    const a = optimizeShopping({ context: createShoppingContext(() => aSource) });
    const bContext = createShoppingContext(() => bSource);
    const b = optimizeShopping({ context: bContext });
    expect(a.requirements[0].requiredQuantity).toBe(500);
    expect(b.requirements[0].requiredQuantity).toBe(300);
    expect(a.budget.status).toBe('over_budget');
    expect(b.budget.status).toBe('within_budget');
    aSource.budget!.amountMinor = 1;
    aSource.catalog.options[0].price!.amountMinor = 1;
    expect(optimizeShopping({ context: bContext })).toEqual(b);
    expect(() => createShoppingContext(() => ({ ...bSource, budget: aSource.budget }))).toThrow(
      'scope',
    );
    await expect(preload(db, 'shop-a', 'shop-outsider')).rejects.toThrow('not authorized');
  });

  it('does no DB/network work, changes no inventory/Week/shopping rows, and retains stale-detection metadata', async () => {
    const db = fixture();
    const source = await preload(db, 'shop-a');
    const original = structuredClone(source);
    const context = createShoppingContext(() => source);
    const snapshot = () => ({
      stock: db.query('SELECT * FROM inventory_items ORDER BY id'),
      events: db.query('SELECT * FROM inventory_events'),
      plans: db.query('SELECT * FROM meal_plans'),
      shopping: db.query('SELECT * FROM shopping_lists'),
    });
    const before = snapshot();
    let calls = 0;
    db.hooks = {
      beforeStatement: () => {
        calls++;
        throw new Error('Unexpected optimizer I/O');
      },
      beforeBatch: () => {
        calls++;
        throw new Error('Unexpected optimizer batch');
      },
    };
    const result = optimizeShopping({ context });
    expect(result).toEqual(optimizeShopping({ context }));
    expect(calls).toBe(0);
    expect(snapshot()).toEqual(before);
    expect(source).toEqual(original);
    expect(result.purchaseLines[0].requiredQuantity).toBe(500);
    expect(result.priceSnapshot.requiresRevalidationBeforeAcceptance).toBe(true);
    expect(result.mealPlan.sourceSnapshot).toEqual(source.mealPlan.sourceSnapshot);
    expect(result.mealPlan.search).toEqual(source.mealPlan.search);
    db.seed(
      "UPDATE inventory_items SET quantity = 50, version = version + 1 WHERE id = 'shop-lot-a'",
    );
    expect(result).toEqual(optimizeShopping({ context }));
    expect(result.mealPlan.sourceSnapshot.requiresRevalidationBeforeAcceptance).toBe(true);
    expect(
      db.query('SELECT version FROM inventory_items WHERE id = ?', 'shop-lot-a')[0].version,
    ).toBe(4);
  });

  it('has no planner/AI/DB/payment/runtime imports or I/O inside the T05 core', () => {
    const modules = ['catalog', 'demand', 'packages', 'policy', 'waste', 'optimizer'];
    for (const name of modules) {
      const source = readFileSync(`packages/recipes/src/shopping-${name}.ts`, 'utf8');
      expect(source).not.toMatch(
        /from\s+['"][^'"]*(?:weekly-planner|\/db\/|\/ai\/|\/worker\/|week\/|payment|payos)/i,
      );
      expect(source).not.toMatch(/\b(?:fetch|planWeeklyMeals|Date\.now|Math\.random)\s*\(/);
      expect(source).not.toMatch(/\.\s*(?:prepare|batch)\s*\(/);
    }
  });
});
