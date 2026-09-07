import { Recipe, RecipeScoringContext, RecipeMatchResult, RecipeIngredient } from './types';
import { tryConvertUnit } from '@frigo/domain';

export function evaluateRecipeMatch(recipe: Recipe, context: RecipeScoringContext): RecipeMatchResult {
  const inventoryMap = new Map<string, { quantity: number; unit: string; freshness: string }>();
  for (const item of context.inventory) {
    inventoryMap.set(item.ingredientId, item);
  }

  const requiredIngredients = recipe.ingredients.filter(i => !i.isOptional);
  const totalRequired = requiredIngredients.length > 0 ? requiredIngredients.length : recipe.ingredients.length;

  let matchedRequired = 0;
  let sufficientQtyCount = 0;
  const missingRequiredIngredients: RecipeIngredient[] = [];
  const expiringIngredientsUsed: string[] = [];

  for (const ing of requiredIngredients) {
    const inv = inventoryMap.get(ing.ingredientId);
    if (inv && inv.quantity > 0) {
      const userQtyConverted = tryConvertUnit(inv.quantity, inv.unit as any, ing.unit);
      if (userQtyConverted === null) {
        missingRequiredIngredients.push(ing);
        continue;
      }
      matchedRequired++;
      if (userQtyConverted >= ing.requiredQuantity) {
        sufficientQtyCount++;
      }
      if (inv.freshness === 'expiring') {
        expiringIngredientsUsed.push(ing.name);
      } else if (inv.freshness === 'use_soon') {
        expiringIngredientsUsed.push(ing.name);
      }
    } else {
      missingRequiredIngredients.push(ing);
    }
  }

  // Calculate Match %
  const matchPercentage = totalRequired > 0 
    ? Math.round((matchedRequired / totalRequired) * 100) 
    : 100;

  // 1. Availability Score (35%)
  const availabilityScore = (matchedRequired / (totalRequired || 1)) * 35;

  // 2. Expiry Priority Score (25%)
  let expiryScore = 0;
  if (expiringIngredientsUsed.length > 0) {
    // Proportional to how many expiring ingredients are rescued
    const ratio = Math.min(1, expiringIngredientsUsed.length / 2);
    expiryScore = ratio * 25;
  }

  // 3. Cuisine Preference Score (15%)
  let cuisineScore = 0;
  if (context.preferredCuisines && context.preferredCuisines.length > 0) {
    if (context.preferredCuisines.includes(recipe.cuisine)) {
      cuisineScore = 15;
    }
  } else {
    // Neutral fallback
    cuisineScore = 10;
  }

  // 4. Cooking Time Score (10%)
  let timeScore = 0;
  if (context.maxCookTimeMinutes) {
    timeScore = recipe.cookTimeMinutes <= context.maxCookTimeMinutes ? 10 : Math.max(0, 10 - (recipe.cookTimeMinutes - context.maxCookTimeMinutes));
  } else {
    timeScore = recipe.cookTimeMinutes <= 25 ? 10 : 7;
  }

  // 5. Quantity Fit Score (10%)
  const quantityScore = (sufficientQtyCount / (totalRequired || 1)) * 10;

  // 6. Cooking History Score (5%)
  let historyScore = 5;
  if (context.recentCookedRecipeIds && context.recentCookedRecipeIds.includes(recipe.id)) {
    historyScore = 1; // Minor penalty to encourage recipe variety
  }

  const totalScore = Math.min(100, Math.round(
    availabilityScore + expiryScore + cuisineScore + timeScore + quantityScore + historyScore
  ));

  const canCookWithoutBuying = missingRequiredIngredients.length === 0;

  return {
    recipe,
    score: totalScore,
    matchPercentage,
    availableIngredientCount: matchedRequired,
    missingRequiredIngredients,
    expiringIngredientsUsed,
    canCookWithoutBuying,
  };
}

export function rankRecipes(recipes: Recipe[], context: RecipeScoringContext): RecipeMatchResult[] {
  const evaluated = recipes.map(recipe => evaluateRecipeMatch(recipe, context));

  let filtered = evaluated;
  if (context.onlyNoBuyNeeded) {
    filtered = filtered.filter(item => item.canCookWithoutBuying);
  }

  // Sort descending by score, then by matchPercentage, then by cookTime asc
  return filtered.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (b.matchPercentage !== a.matchPercentage) {
      return b.matchPercentage - a.matchPercentage;
    }
    return a.recipe.cookTimeMinutes - b.recipe.cookTimeMinutes;
  });
}
