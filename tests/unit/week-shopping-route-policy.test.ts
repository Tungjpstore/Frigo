import { describe, expect, it } from 'vitest';
import { AggregatedShoppingItem } from '../../packages/domain/src';
import { selectPlanShoppingItems } from '../../src/worker/utils/week-shopping';

const planItem: AggregatedShoppingItem = {
  ingredientId: 'TOMATO',
  name: 'Cà chua',
  category: 'vegetable',
  requiredQuantity: 4,
  existingInventoryQuantity: 0,
  missingQuantity: 4,
  recommendedPurchaseQuantity: 4,
  unit: 'piece',
  estimatedPriceMin: 12000,
  estimatedPriceMax: 20000,
  checked: true,
  sourceRecipes: [],
};

describe('weekly shopping import policy', () => {
  it('rejects client items outside the plan snapshot', () => {
    expect(
      selectPlanShoppingItems([planItem], [{ ingredientId: 'BEEF_SIRLOIN', name: 'Crafted' }])
    ).toEqual({ ok: false, reason: 'unknown_item' });
  });

  it('uses canonical plan values and deduplicates requested items', () => {
    const result = selectPlanShoppingItems(
      [planItem],
      [
        { ingredientId: 'TOMATO', name: 'Tampered', recommendedPurchaseQuantity: 999 },
        { ingredientId: 'TOMATO' },
      ]
    );

    expect(result).toEqual({ ok: true, items: [planItem] });
  });

  it('defaults to checked items when the client omits items', () => {
    expect(selectPlanShoppingItems([planItem])).toEqual({ ok: true, items: [planItem] });
  });

  it('normalizes ingredient identifiers before matching', () => {
    expect(
      selectPlanShoppingItems([planItem], [{ ingredientId: ' tomato ' }])
    ).toEqual({ ok: true, items: [planItem] });
  });

  it('rejects a corrupt plan snapshot instead of importing arbitrary values', () => {
    expect(
      selectPlanShoppingItems(
        [{ ...planItem, unit: 'not-a-unit' as any }],
        [{ ingredientId: 'TOMATO' }]
      )
    ).toEqual({ ok: false, reason: 'invalid_plan' });
  });

  it('rejects non-positive purchase quantities in a plan snapshot', () => {
    expect(
      selectPlanShoppingItems(
        [{ ...planItem, recommendedPurchaseQuantity: 0, missingQuantity: 0 }],
        [{ ingredientId: 'TOMATO' }]
      )
    ).toEqual({ ok: false, reason: 'invalid_plan' });
  });
});
