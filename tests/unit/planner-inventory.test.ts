import { describe, expect, it } from 'vitest';
import { generateRecipeCandidates, type RecipeCandidate } from '../../packages/recipes/src/candidates';
import { createRecipeCatalog } from '../../packages/recipes/src/catalog';
import { RecipeDefinitionSchema, type RecipeDefinition } from '../../packages/recipes/src/foundation';
import {
  applyProjectedConsumption, createProjectedInventory, InventoryProjectionError, InventoryProjectionNumericError, projectInventoryRows,
  type InventoryLotSnapshot,
} from '../../packages/recipes/src/planner-inventory';
import { SubstitutionRuleSchema } from '../../packages/recipes/src/substitutions';

const asOfDate = '2026-09-08';
const snapshot = (overrides: Partial<InventoryLotSnapshot> = {}): InventoryLotSnapshot => ({
  id: 'lot-a', householdId: 'home', version: 1, ingredientId: 'CHICKEN_BREAST', quantity: 1000, unit: 'g',
  freshness: null, expiryDate: null, expiryKind: 'unknown', ...overrides,
});
const witness = (lotId: string, ingredientId: string, quantity: number, unit: 'g' | 'kg' | 'piece' = 'g') => ({
  lotId, ingredientId, quantity, unit, contributedQuantity: quantity, contributedUnit: unit,
  freshness: null, expiryDate: null, expiryKind: 'unknown' as const,
});
const candidate = (lotAllocations: RecipeCandidate['lotAllocations'], canCookWithoutBuying = true): Pick<RecipeCandidate, 'canCookWithoutBuying' | 'lotAllocations'> =>
  ({ canCookWithoutBuying, lotAllocations });

const recipe = (ingredients: RecipeDefinition['ingredients']): RecipeDefinition => RecipeDefinitionSchema.parse({
  id: 'meal', slug: 'meal', title: 'Projection meal', cuisine: 'vietnamese', servings: 2,
  cookTimeMinutes: 20, difficulty: 'easy', ingredients,
});
const catalog = (recipes: RecipeDefinition[]) => createRecipeCatalog({
  source: 'provided', ingredientIds: ['CHICKEN_BREAST', 'TOFU', 'ONION'], recipes, families: [],
});

function generatedCandidate(
  inventory: readonly unknown[],
  ingredients: RecipeDefinition['ingredients'],
  overrides: Partial<Parameters<typeof generateRecipeCandidates>[0]> = {},
): RecipeCandidate {
  const t02Inventory = inventory.map((raw) => {
    if (!raw || typeof raw !== 'object' || !('freshness' in raw) || raw.freshness !== null) return raw;
    const { freshness: _freshness, ...lot } = raw;
    return lot;
  });
  const result = generateRecipeCandidates({
    catalog: catalog([recipe(ingredients)]), inventory: t02Inventory, asOfDate, householdId: 'home', requestedServings: 2,
    mode: 'cook_now', ...overrides,
  });
  expect(result.candidates).toHaveLength(1);
  return result.candidates[0];
}

describe('T04 projected inventory', () => {
  it('sequentially depletes inventory while independent branches retain their own exact state', () => {
    const initial = createProjectedInventory([snapshot()], { householdId: 'home', asOfDate });
    const first = applyProjectedConsumption(initial, candidate([witness('lot-a', 'CHICKEN_BREAST', 300)]));
    const alternate = applyProjectedConsumption(initial, candidate([witness('lot-a', 'CHICKEN_BREAST', 600)]));

    expect(projectInventoryRows(initial)[0]).toMatchObject({ quantity: 1000, consumedQuantity: 0 });
    expect(projectInventoryRows(first.state)[0]).toMatchObject({ quantity: 700, consumedQuantity: 300 });
    expect(projectInventoryRows(alternate.state)[0]).toMatchObject({ quantity: 400, consumedQuantity: 600 });
    expect(first.deltas).toMatchObject([{ lotId: 'lot-a', previousQuantity: 1000, consumedQuantity: 300, remainingQuantity: 700 }]);
  });

  it('consumes a T02 mixed-unit witness in native lot units and exposes remaining rows for regeneration', () => {
    const rows = [snapshot({ id: 'g-lot', quantity: 200 }), snapshot({ id: 'kg-lot', quantity: 0.5, unit: 'kg' })];
    const selected = generatedCandidate(rows, [{ ingredientId: 'CHICKEN_BREAST', name: 'Chicken', requiredQuantity: 400, unit: 'g', isOptional: false }]);
    const result = applyProjectedConsumption(createProjectedInventory(rows, { householdId: 'home', asOfDate }), selected);

    expect(selected.lotAllocations.map((allocation) => [allocation.lotId, allocation.quantity, allocation.unit])).toEqual([
      ['g-lot', 200, 'g'], ['kg-lot', 0.2, 'kg'],
    ]);
    expect(projectInventoryRows(result.state)).toMatchObject([
      { id: 'g-lot', quantity: 0, initialQuantity: 200, consumedQuantity: 200, unit: 'g' },
      { id: 'kg-lot', quantity: 0.3, initialQuantity: 0.5, consumedQuantity: 0.2, unit: 'kg' },
    ]);
  });

  it('retains exact rational arithmetic across repeated decimal and fractional count consumption', () => {
    let state = createProjectedInventory([snapshot({ quantity: 1 }), snapshot({ id: 'pieces', ingredientId: 'TOFU', quantity: 3, unit: 'piece' })], { householdId: 'home', asOfDate });
    for (let index = 0; index < 10; index++) {
      state = applyProjectedConsumption(state, candidate([witness('lot-a', 'CHICKEN_BREAST', 0.1)])).state;
    }
    state = applyProjectedConsumption(state, candidate([witness('pieces', 'TOFU', 1.5, 'piece')])).state;

    expect(projectInventoryRows(state)).toMatchObject([
      { id: 'lot-a', quantity: 0, consumedQuantity: 1 },
      { id: 'pieces', quantity: 1.5, consumedQuantity: 1.5, unit: 'piece' },
    ]);
  });

  it('does not revive T02-unavailable lots and rejects double spending', () => {
    const expired = snapshot({ expiryDate: '2026-09-07', expiryKind: 'use_by' });
    const state = createProjectedInventory([expired], { householdId: 'home', asOfDate });
    expect(() => applyProjectedConsumption(state, candidate([{
      ...witness('lot-a', 'CHICKEN_BREAST', 1), expiryDate: '2026-09-07', expiryKind: 'use_by',
    }]))).toThrow('unavailable lot');
    expect(() => applyProjectedConsumption(createProjectedInventory([snapshot({ quantity: 100 })], { householdId: 'home', asOfDate }),
      candidate([witness('lot-a', 'CHICKEN_BREAST', 60), witness('lot-a', 'CHICKEN_BREAST', 60)]))).toThrow('overconsume');
  });

  it('projects only proven stock for shopping candidates without creating hypothetical purchases', () => {
    const rows = [snapshot({ quantity: 100 })];
    const selected = generatedCandidate(rows, [{ ingredientId: 'CHICKEN_BREAST', name: 'Chicken',
      requiredQuantity: 300, unit: 'g', isOptional: false }], { mode: 'shopping_allowed' });
    expect(selected.canCookWithoutBuying).toBe(false);
    expect(selected.requirements[0].missingQuantity).toBe(200);
    const first = applyProjectedConsumption(createProjectedInventory(rows, { householdId: 'home', asOfDate }), selected);
    expect(projectInventoryRows(first.state)[0].quantity).toBe(0);
    const later = generatedCandidate(projectInventoryRows(first.state), [{ ingredientId: 'CHICKEN_BREAST', name: 'Chicken',
      requiredQuantity: 300, unit: 'g', isOptional: false }], { mode: 'shopping_allowed', asOfDate: '2026-09-09' });
    const next = applyProjectedConsumption(first.state, later, '2026-09-09');
    expect(next.deltas).toEqual([]);
    expect(later.requirements[0].missingQuantity).toBe(300);
    expect(next.state.asOfDate).toBe('2026-09-09');
  });

  it('rechecks availability on the future slot date and rejects backwards projection', () => {
    const row = snapshot({ expiryDate: asOfDate, expiryKind: 'use_by' });
    const initial = createProjectedInventory([row], { householdId: 'home', asOfDate });
    const selected = generatedCandidate([row], [{ ingredientId: 'CHICKEN_BREAST', name: 'Chicken',
      requiredQuantity: 100, unit: 'g', isOptional: false }]);
    expect(() => applyProjectedConsumption(initial, selected, '2026-09-09')).toThrow('unavailable');
    expect(() => applyProjectedConsumption(initial, selected, '2026-09-07')).toThrow('backwards');
    expect(projectInventoryRows(initial)[0].quantity).toBe(1000);
  });

  it('reports a rounded Number boundary rather than overdrawing an exact branch balance', () => {
    const initial = createProjectedInventory([snapshot({ quantity: 0.10000000000000002 })], { householdId: 'home', asOfDate });
    const first = applyProjectedConsumption(initial, candidate([witness('lot-a', 'CHICKEN_BREAST', 1e-18)]));
    const exposed = projectInventoryRows(first.state)[0].quantity;
    expect(() => applyProjectedConsumption(first.state, candidate([witness('lot-a', 'CHICKEN_BREAST', exposed)])))
      .toThrow(InventoryProjectionNumericError);
  });

  it('conserves direct, approved substitution, and available optional T02 allocations', () => {
    const inventory = [
      { id: 'tofu', householdId: 'home', ingredientId: 'TOFU', quantity: 400, unit: 'g' },
      { id: 'onion', householdId: 'home', ingredientId: 'ONION', quantity: 50, unit: 'g' },
    ];
    const substitution = SubstitutionRuleSchema.parse({
      id: 'tofu-for-chicken', scopeType: 'recipe', scopeId: 'meal', scopeVersion: 1,
      fromIngredientId: 'CHICKEN_BREAST', toIngredientId: 'TOFU', fromUnit: 'g', toUnit: 'g', quantityRatio: 1,
      reason: 'Reviewed adaptation', sourceReference: 'test:substitution', verificationState: 'reviewed', compatibleWith: [],
    });
    const selected = generatedCandidate(inventory, [
      { ingredientId: 'CHICKEN_BREAST', name: 'Chicken', requiredQuantity: 200, unit: 'g', isOptional: false },
      { ingredientId: 'ONION', name: 'Onion', requiredQuantity: 50, unit: 'g', isOptional: true },
    ], { substitutions: [substitution], approvedSubstitutionIds: [substitution.id] });
    const result = applyProjectedConsumption(createProjectedInventory(inventory.map((lot) => ({
      ...lot, version: 1, freshness: null, expiryDate: null, expiryKind: 'unknown' as const,
    })), { householdId: 'home', asOfDate }), selected);

    expect(projectInventoryRows(result.state)).toMatchObject([
      { id: 'onion', quantity: 0, consumedQuantity: 50 },
      { id: 'tofu', quantity: 200, consumedQuantity: 200 },
    ]);
  });

  it('fails closed for invalid, mixed-household, and duplicate inventory snapshots', () => {
    expect(() => createProjectedInventory([snapshot({ version: 0 })], { householdId: 'home', asOfDate })).toThrow();
    expect(() => createProjectedInventory([snapshot(), snapshot({ id: 'other', householdId: 'other-home' })], { householdId: 'home', asOfDate })).toThrow('one household');
    expect(() => createProjectedInventory([snapshot(), snapshot()], { householdId: 'home', asOfDate })).toThrow('Duplicate inventory lot');
    expect(() => createProjectedInventory([{ ...snapshot(), unexpected: true }], { householdId: 'home', asOfDate })).toThrow();
    expect(InventoryProjectionError).toBeTypeOf('function');
  });

  it('preserves qualified storage and concurrency metadata without using it for allocation', () => {
    const initial = createProjectedInventory([snapshot({
      storage: 'freezer', openedAt: '2026-09-07T12:30:00+07:00', expirySource: 'user',
      expiryDate: '2026-10-01', expiryKind: 'best_before', addedDate: '2026-09-01',
      updatedAt: '2026-09-08 12:30:00',
    })], { householdId: 'home', asOfDate });
    const result = applyProjectedConsumption(initial, candidate([{
      ...witness('lot-a', 'CHICKEN_BREAST', 100), expiryDate: '2026-10-01', expiryKind: 'best_before',
    }]));

    expect(projectInventoryRows(result.state)[0]).toMatchObject({
      storage: 'freezer', openedAt: '2026-09-07T12:30:00+07:00', expirySource: 'user',
      addedDate: '2026-09-01', updatedAt: '2026-09-08 12:30:00', version: 1,
    });
    expect(result.deltas[0]).toMatchObject({ storage: 'freezer', expirySource: 'user', version: 1 });
    expect(() => createProjectedInventory([snapshot({ expirySource: 'ocr' })], { householdId: 'home', asOfDate })).toThrow('expiry date');
    expect(() => createProjectedInventory([snapshot({ version: Number.MAX_SAFE_INTEGER + 1 })], { householdId: 'home', asOfDate })).toThrow();
  });
});
