import { describe, expect, it } from 'vitest';
import {
  parseShoppingMealPlanJson,
  projectShoppingMealPlan,
  serializeShoppingMealPlan,
} from '../../packages/recipes/src/shopping-plan-snapshot';
import { lot } from '../helpers/planner-fixtures';
import { shoppingPlan } from '../helpers/shopping-fixtures';

describe('T06A persisted shopping-plan projection', () => {
  it('retains only T05 inputs and decodes its serialized projection strictly', () => {
    const plan = shoppingPlan();
    const snapshot = projectShoppingMealPlan(plan);
    const decoded = parseShoppingMealPlanJson(JSON.parse(serializeShoppingMealPlan(snapshot)));

    expect(decoded).toEqual(snapshot);
    expect(decoded).not.toHaveProperty('nutrition');
    expect(decoded).not.toHaveProperty('utility');
    expect(decoded.slots[0].ranked).toEqual({ candidate: { id: plan.slots[0].ranked.candidate.id } });
    expect(decoded.slots[0].projectedConsumption).toEqual(
      plan.slots[0].projectedConsumption.map(({ householdId }) => ({ householdId })),
    );
  });

  it('rejects client-shaped extras and never treats a full serialized T04 plan as persisted input', () => {
    const snapshot = projectShoppingMealPlan(shoppingPlan());
    expect(() => parseShoppingMealPlanJson({ ...snapshot, clientShortages: [] })).toThrow();
    expect(() => parseShoppingMealPlanJson(shoppingPlan())).toThrow();
  });

  it('preserves the nullable T04 opened-at fact from D1 inventory projections', () => {
    const plan = shoppingPlan(undefined, { source: { inventory: [lot({ openedAt: null })] } });
    expect(projectShoppingMealPlan(plan).projectedFinalInventory[0].openedAt).toBeNull();
  });
});
