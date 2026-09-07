import { Recipe } from '@frigo/recipes';
import { MealSlotItem, MealSlotStatus } from './types';

export interface LeftoverAllocation {
  sourceSlotId: string;
  sourceRecipeTitle: string;
  recipe: Recipe;
  totalPortionsCooked: number;
  consumedPortions: number;
  remainingPortions: number;
  targetSlotId: string;
  targetDate: string;
}

/**
 * Checks if a recipe is well-suited for leftovers/meal prep.
 * Braised, stewed, curries, and fried rice hold up very well overnight.
 */
export function isMealPrepFriendly(recipe: Recipe): boolean {
  const prepFriendlyTags = ['Món mặn', 'Truyền thống', 'Bữa cơm gia đình', 'Kho', 'Hầm'];
  const title = recipe.title.toLowerCase();

  if (title.includes('kho') || title.includes('hầm') || title.includes('sốt') || title.includes('cà ri')) {
    return true;
  }

  return recipe.tags.some((tag) => prepFriendlyTags.includes(tag));
}

/**
 * Creates a linked leftover slot from a source cooking slot.
 */
export function createLeftoverSlot(
  sourceSlot: MealSlotItem,
  targetSlotId: string,
  targetDayId: string,
  targetDate: string,
  targetDayOfWeek: number,
  servings: number
): MealSlotItem {
  return {
    id: targetSlotId,
    dayId: targetDayId,
    planId: sourceSlot.planId,
    slotType: 'lunch', // typical leftover slot
    status: 'LEFTOVER' as MealSlotStatus,
    date: targetDate,
    dayOfWeek: targetDayOfWeek,
    recipe: sourceSlot.recipe,
    servings,
    source: 'AUTO',
    leftoverSourceSlotId: sourceSlot.id,
    isLeftover: true,
    notes: `Thức ăn còn lại từ bữa ${sourceSlot.recipe?.title || ''}`,
    availabilityPercent: 100,
    incrementalCostVnd: 0,
    rescuedExpiringIngredients: [],
    badges: ['Thức ăn nấu sẵn (Leftover)', '0đ mua thêm'],
    ingredients: [], // 0 additional ingredients needed
  };
}
