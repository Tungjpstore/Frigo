import type { RecipeDefinition } from '../../packages/recipes/src/foundation';
import type { PlanningSourceInput } from '../../packages/recipes/src/planner-context';
import type { PlannerRequestInput } from '../../packages/recipes/src/planner-request';
import type { WeeklyMealPlan, WeeklyPlanningInput } from '../../packages/recipes/src/planner-types';
import {
  createShoppingContext,
  type PurchaseOption,
  type ShoppingBudget,
  type ShoppingSourceInput,
} from '../../packages/recipes/src/shopping-catalog';
import { planWeeklyMeals } from '../../packages/recipes/src/weekly-planner';
import { catalog, context, HOUSEHOLD_ID, PLANNING_INSTANT, recipe } from './planner-fixtures';

export const SHOPPING_AS_OF = '2026-09-08T09:00:00+07:00';
export const SHOPPING_SNAPSHOT_ID = 'trusted-shopping-snapshot';

export interface ShoppingPlanFixtureOptions {
  source?: Partial<PlanningSourceInput>;
  request?: Partial<PlannerRequestInput>;
  policy?: WeeklyPlanningInput['policy'];
}

export function shoppingPlan(
  meals: readonly RecipeDefinition[] = [recipe('shopping-chicken', 'CHICKEN', 700)],
  options: ShoppingPlanFixtureOptions = {},
): WeeklyMealPlan {
  const slots = meals.map((meal, index) => ({
    date: new Date(Date.UTC(2026, 8, 8 + index)).toISOString().slice(0, 10),
    mealType: 'dinner' as const,
    lock: { kind: 'recipe' as const, id: meal.id, version: meal.provenance.version },
  }));
  return planWeeklyMeals({
    context: context({
      referenceInstant: PLANNING_INSTANT,
      inventory: [],
      catalog: catalog(meals),
      ...options.source,
    }),
    request: {
      startDate: '2026-09-08',
      horizonDays: Math.max(7, meals.length),
      defaultServings: 2,
      mode: 'shopping_allowed',
      slots,
      ...options.request,
    },
    policy: options.policy,
  });
}

export function purchaseOption(
  id = 'chicken-500',
  quantity = 500,
  amountMinor: number | null = 520,
  overrides: Partial<PurchaseOption> = {},
): PurchaseOption {
  return {
    id,
    ingredientId: 'CHICKEN',
    productId: `product-${id}`,
    retailerId: 'fixture-retailer',
    packageContent: { quantity, unit: 'g', sourceReference: `label:${id}` },
    price: {
      amountMinor,
      currency: 'JPY',
      asOf: SHOPPING_AS_OF,
      source: 'catalog',
      sourceReference: `price:${id}`,
    },
    availability: 'available',
    expiry: null,
    ...overrides,
  };
}

export function shoppingBudget(
  amountMinor: number,
  overrides: Partial<ShoppingBudget> = {},
): ShoppingBudget {
  return {
    householdId: HOUSEHOLD_ID,
    mode: 'hard',
    currency: 'JPY',
    amountMinor,
    revision: 'budget-v1',
    ...overrides,
  };
}

export function shoppingSource(
  mealPlan = shoppingPlan(),
  options: readonly PurchaseOption[] = [purchaseOption()],
  overrides: Partial<ShoppingSourceInput> = {},
): ShoppingSourceInput {
  return {
    householdId: mealPlan.householdId,
    userId: mealPlan.userId,
    currency: 'JPY',
    mealPlan,
    catalog: { snapshotId: SHOPPING_SNAPSHOT_ID, asOf: SHOPPING_AS_OF, options },
    budget: null,
    ...overrides,
  };
}

export function shoppingContext(source: ShoppingSourceInput = shoppingSource()) {
  return createShoppingContext(() => source);
}
