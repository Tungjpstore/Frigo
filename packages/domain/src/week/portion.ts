import { RecipeIngredient } from '@frigo/recipes';
import { StandardUnit } from '../index';

export interface ScaledIngredient extends RecipeIngredient {
  scaledQuantity: number;
}

/**
 * Calculates scaling factor based on household size and recipe default servings.
 * Adult equivalent default is 1.0.
 */
export function calculatePortionRatio(targetServings: number, baseServings: number): number {
  if (!baseServings || baseServings <= 0) return 1.0;
  if (!targetServings || targetServings <= 0) return 1.0;
  return targetServings / baseServings;
}

/**
 * Deterministically scales ingredient quantities.
 * Rounding rules:
 * - Units like 'g', 'ml' round to nearest 10 (or 5 for small quantities).
 * - Discrete units like 'piece', 'bunch', 'pack' round up or to nearest 0.5/integer so users aren't left with tiny impossible fractions.
 */
export function scaleIngredientQuantity(
  baseQuantity: number,
  unit: StandardUnit,
  ratio: number
): number {
  const rawScaled = baseQuantity * ratio;

  if (unit === 'g' || unit === 'ml') {
    if (rawScaled < 20) {
      return Math.max(1, Math.round(rawScaled));
    }
    // Round to nearest 5 or 10
    return Math.round(rawScaled / 5) * 5;
  }

  if (unit === 'kg' || unit === 'l') {
    return Math.round(rawScaled * 10) / 10;
  }

  if (unit === 'piece' || unit === 'bunch' || unit === 'pack' || unit === 'slice') {
    // Keep at least 1, round to nearest integer or 0.5
    if (rawScaled < 1) return 1;
    return Math.round(rawScaled);
  }

  return Math.round(rawScaled * 10) / 10;
}

/**
 * Scales all ingredients in a recipe for a target serving count.
 */
export function scaleRecipeIngredients(
  ingredients: RecipeIngredient[],
  targetServings: number,
  baseServings: number
): ScaledIngredient[] {
  const ratio = calculatePortionRatio(targetServings, baseServings);

  return ingredients.map((ing) => ({
    ...ing,
    scaledQuantity: scaleIngredientQuantity(ing.requiredQuantity, ing.unit, ratio),
  }));
}
