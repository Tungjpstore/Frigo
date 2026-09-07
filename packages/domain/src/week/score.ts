import { Recipe, CuisineType } from '@frigo/recipes';
import { InventoryItem, tryConvertUnit } from '../index';
import { PlannerConfig, DEFAULT_PLANNER_CONFIG } from './types';
import { PriceProvider, defaultPriceProvider } from './pricing';

export interface WeeklyRecipeEvaluation {
  recipe: Recipe;
  score: number; // 0 - 100
  inventoryMatchScore: number;
  expiryPriorityScore: number;
  budgetFitScore: number;
  preferenceMatchScore: number;
  varietyScore: number;
  rescuedExpiringIngredients: string[];
  missingCount: number;
  estimatedCostVnd: number;
  mainProtein?: string;
  isEligible: boolean;
  exclusionReason?: string;
}

export function extractMainProtein(recipe: Recipe): string | undefined {
  // Check canonical ingredients first for accurate categorization
  for (const ing of recipe.ingredients) {
    const id = (ing.ingredientId || '').toUpperCase();
    if (id.includes('PORK') || id.includes('HEO') || id.includes('LON')) return 'pork';
    if (id.includes('BEEF') || id.includes('BO')) return 'beef';
    if (id.includes('CHICKEN') || id.includes('GA')) return 'chicken';
    if (id.includes('FISH') || id.includes('SALMON') || id.includes('CA')) return 'fish';
    if (id.includes('SHRIMP') || id.includes('TOM')) return 'shrimp';
    if (id.includes('TOFU') || id.includes('DAU')) return 'tofu';
  }

  const title = recipe.title.toLowerCase();
  if (title.includes('thịt') || title.includes('ba chỉ') || title.includes('heo') || title.includes('lợn') || title.includes('sườn')) return 'pork';
  if (title.includes('bò')) return 'beef';
  if (title.includes('gà')) return 'chicken';
  if (title.includes('cá')) return 'fish';
  if (title.includes('tôm')) return 'shrimp';
  if (title.includes('đậu phụ') || title.includes('đậu hũ')) return 'tofu';
  if (title.includes('trứng')) return 'egg';

  for (const ing of recipe.ingredients) {
    const id = (ing.ingredientId || '').toUpperCase();
    if (id.includes('EGG')) return 'egg';
  }

  return undefined;
}

/**
 * Checks hard constraints (Allergies, Disliked ingredients, Strict prohibitions).
 */
export function isRecipeEligible(
  recipe: Recipe,
  restrictions: string[] = [],
  dislikes: string[] = []
): { eligible: boolean; reason?: string } {
  const normRestrictions = restrictions.map((r) => r.toLowerCase().trim());
  const normDislikes = dislikes.map((d) => d.toLowerCase().trim());

  // Vegetarian check
  if (normRestrictions.some((r) => r.includes('chay') || r.includes('vegetarian'))) {
    const meatKeys = ['pork', 'beef', 'chicken', 'fish', 'salmon', 'shrimp'];
    const protein = extractMainProtein(recipe);
    if (protein && meatKeys.includes(protein)) {
      return { eligible: false, reason: 'Chứa thịt/hải sản không phù hợp ăn chay' };
    }
  }

  // Check ingredients against restrictions & dislikes
  for (const ing of recipe.ingredients) {
    const ingName = ing.name.toLowerCase();
    const ingId = ing.ingredientId.toLowerCase();

    for (const dis of normDislikes) {
      if (ingName.includes(dis) || ingId.includes(dis)) {
        return { eligible: false, reason: `Chứa nguyên liệu kiêng/không thích: ${ing.name}` };
      }
    }

    for (const rest of normRestrictions) {
      if (ingName.includes(rest) || ingId.includes(rest)) {
        return { eligible: false, reason: `Vi phạm hạn chế ăn uống: ${rest}` };
      }
    }
  }

  return { eligible: true };
}

/**
 * Deterministically evaluates a candidate recipe for weekly meal planning.
 */
export function evaluateWeeklyCandidate(
  recipe: Recipe,
  inventory: InventoryItem[],
  priceProvider: PriceProvider = defaultPriceProvider,
  context: {
    preferredCuisines?: CuisineType[];
    recentProteins?: string[];
    recentRecipeIds?: string[];
    maxCookTimeMinutes?: number;
    budgetFocus?: boolean;
    config?: PlannerConfig;
  } = {}
): WeeklyRecipeEvaluation {
  const config = context.config || DEFAULT_PLANNER_CONFIG;

  // Inventory Map
  const invMap = new Map<string, InventoryItem>();
  for (const item of inventory) {
    invMap.set(item.ingredientId.toUpperCase(), item);
  }

  const required = recipe.ingredients.filter((i) => !i.isOptional);
  const totalRequired = required.length > 0 ? required.length : recipe.ingredients.length;

  let matchedRequired = 0;
  let missingCount = 0;
  let estimatedCostVnd = 0;
  const rescuedExpiring: string[] = [];

  for (const ing of required) {
    const inv = invMap.get(ing.ingredientId.toUpperCase());
    if (inv && inv.quantity > 0) {
      const userQtyConverted = tryConvertUnit(inv.quantity, inv.unit, ing.unit);
      if (userQtyConverted === null) {
        missingCount++;
        const est = priceProvider.estimateCost(ing.ingredientId, ing.requiredQuantity, ing.unit);
        estimatedCostVnd += est.minVnd;
        continue;
      }
      matchedRequired++;
      if (inv.freshness === 'expiring' || inv.freshness === 'use_soon') {
        rescuedExpiring.push(ing.name);
      }
      if (userQtyConverted < ing.requiredQuantity) {
        const missing = ing.requiredQuantity - userQtyConverted;
        const est = priceProvider.estimateCost(ing.ingredientId, missing, ing.unit);
        estimatedCostVnd += est.minVnd;
      }
    } else {
      missingCount++;
      const est = priceProvider.estimateCost(ing.ingredientId, ing.requiredQuantity, ing.unit);
      estimatedCostVnd += est.minVnd;
    }
  }

  // 1. Inventory Match (weightInventoryMatch = 20%)
  const inventoryRatio = totalRequired > 0 ? matchedRequired / totalRequired : 1;
  const inventoryScore = inventoryRatio * (config.weightInventoryMatch * 100);

  // 2. Expiry Priority (weightExpiryPriority = 20%)
  let expiryScore = 0;
  if (rescuedExpiring.length > 0) {
    const factor = Math.min(1, rescuedExpiring.length / 2);
    expiryScore = factor * (config.weightExpiryPriority * 100);
  }

  // 3. Budget Fit (weightBudgetFit = 15%)
  // Cheaper meals or meals with less incremental cost score higher
  let budgetScore = config.weightBudgetFit * 100;
  if (estimatedCostVnd > 50000) {
    budgetScore = Math.max(0, (config.weightBudgetFit * 100) - (estimatedCostVnd - 50000) / 10000);
  }

  // 4. Preference Match (weightPreferenceMatch = 10%)
  let preferenceScore = 0;
  if (context.preferredCuisines && context.preferredCuisines.length > 0) {
    if (context.preferredCuisines.includes(recipe.cuisine)) {
      preferenceScore = config.weightPreferenceMatch * 100;
    } else {
      preferenceScore = (config.weightPreferenceMatch * 100) * 0.5;
    }
  } else {
    preferenceScore = (config.weightPreferenceMatch * 100) * 0.8;
  }

  // 5. Cooking Time Fit (weightCookingTimeFit = 10%)
  let timeScore = config.weightCookingTimeFit * 100;
  if (context.maxCookTimeMinutes && recipe.cookTimeMinutes > context.maxCookTimeMinutes) {
    timeScore = Math.max(0, timeScore - (recipe.cookTimeMinutes - context.maxCookTimeMinutes));
  } else if (recipe.cookTimeMinutes <= 25) {
    timeScore = config.weightCookingTimeFit * 100;
  } else {
    timeScore = (config.weightCookingTimeFit * 100) * 0.7;
  }

  // 6. Variety Score (weightVariety = 10%)
  const mainProtein = extractMainProtein(recipe);
  let varietyScore = config.weightVariety * 100;
  if (context.recentProteins && mainProtein) {
    const consecutiveCount = context.recentProteins
      .slice(-2)
      .filter((p) => p === mainProtein).length;
    if (consecutiveCount >= config.maxSameProteinConsecutiveDays) {
      varietyScore = 0; // Heavy penalty if consecutive same protein
    } else if (consecutiveCount === 1) {
      varietyScore = (config.weightVariety * 100) * 0.5;
    }
  }

  // 7. Novelty / History (weightHistoryNovelty = 5%)
  let noveltyScore = config.weightHistoryNovelty * 100;
  if (context.recentRecipeIds && context.recentRecipeIds.includes(recipe.id)) {
    noveltyScore = 0; // Don't repeat same recipe in the same week
  }

  const totalScore = Math.min(
    100,
    Math.round(
      inventoryScore +
      expiryScore +
      budgetScore +
      preferenceScore +
      timeScore +
      varietyScore +
      noveltyScore
    )
  );

  return {
    recipe,
    score: totalScore,
    inventoryMatchScore: Math.round(inventoryScore),
    expiryPriorityScore: Math.round(expiryScore),
    budgetFitScore: Math.round(budgetScore),
    preferenceMatchScore: Math.round(preferenceScore),
    varietyScore: Math.round(varietyScore),
    rescuedExpiringIngredients: rescuedExpiring,
    missingCount,
    estimatedCostVnd,
    mainProtein,
    isEligible: true,
  };
}
