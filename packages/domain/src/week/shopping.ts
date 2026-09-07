import { InventoryItem, StandardUnit, IngredientCategory, tryConvertUnit } from '../index';
import { AggregatedShoppingItem, WeeklyBudgetSummary, BudgetStatus } from './types';
import { PriceProvider, defaultPriceProvider } from './pricing';
import { calculatePackageRecommendation } from './packages';

export interface RecipeRequirementEntry {
  recipeId: string;
  recipeTitle: string;
  ingredientId: string;
  name: string;
  category?: IngredientCategory;
  quantity: number;
  unit: StandardUnit;
}

export function mapCategoryToShoppingSection(category?: IngredientCategory): string {
  switch (category) {
    case 'meat':
    case 'seafood':
      return 'Thịt & cá';
    case 'vegetable':
    case 'fruit':
      return 'Rau củ';
    case 'egg':
    case 'dairy':
      return 'Trứng & sữa';
    case 'grain':
      return 'Tinh bột';
    case 'spice':
      return 'Gia vị';
    default:
      return 'Khác';
  }
}

/**
 * Aggregates all meal ingredients across the entire week,
 * subtracts existing inventory, calculates purchase recommendations,
 * and estimates total budget.
 */
export function aggregateShoppingRequirements(
  requirements: RecipeRequirementEntry[],
  inventory: InventoryItem[],
  priceProvider: PriceProvider = defaultPriceProvider,
  budgetTargetVnd: number | null = null
): {
  shoppingItems: AggregatedShoppingItem[];
  budget: WeeklyBudgetSummary;
} {
  // 1. Group requirements by canonical ingredientId
  const aggregatedMap = new Map<
    string,
    {
      name: string;
      category: IngredientCategory;
      unit: StandardUnit;
      totalRequired: number;
      sources: { recipeId: string; recipeTitle: string; quantity: number }[];
    }
  >();

  for (const req of requirements) {
    const key = req.ingredientId.toUpperCase();
    // Keep incompatible units separate; silently treating pieces as grams can
    // understate the shopping list.
    const existingEntry = [...aggregatedMap.entries()].find(([entryKey, item]) =>
      (entryKey === key || entryKey.startsWith(`${key}:`)) &&
      tryConvertUnit(req.quantity, req.unit, item.unit) !== null
    );
    const existing = existingEntry?.[1];

    if (existing) {
      existing.totalRequired += tryConvertUnit(req.quantity, req.unit, existing.unit) ?? 0;
      existing.sources.push({
        recipeId: req.recipeId,
        recipeTitle: req.recipeTitle,
        quantity: req.quantity,
      });
    } else {
      const baseKey = aggregatedMap.has(key) ? `${key}:${req.unit}` : key;
      let entryKey = baseKey;
      while (aggregatedMap.has(entryKey)) entryKey = `${baseKey}:${aggregatedMap.size}`;
      aggregatedMap.set(entryKey, {
        name: req.name,
        category: req.category || 'other',
        unit: req.unit,
        totalRequired: req.quantity,
        sources: [
          {
            recipeId: req.recipeId,
            recipeTitle: req.recipeTitle,
            quantity: req.quantity,
          },
        ],
      });
    }
  }

  // 2. Map existing inventory quantities
  const inventoryStockMap = new Map<string, { quantity: number; unit: StandardUnit }>();
  for (const inv of inventory) {
    const key = inv.ingredientId.toUpperCase();
    const compatibleEntry = [...inventoryStockMap.entries()].find(([stockKey, stock]) =>
      (stockKey === key || stockKey.startsWith(`${key}:`)) &&
      tryConvertUnit(inv.quantity, inv.unit, stock.unit) !== null
    );
    const current = compatibleEntry?.[1];
    if (current) {
      current.quantity += tryConvertUnit(inv.quantity, inv.unit, current.unit) ?? 0;
    } else {
      const baseKey = inventoryStockMap.has(key) ? `${key}:${inv.unit}` : key;
      let stockKey = baseKey;
      while (inventoryStockMap.has(stockKey)) stockKey = `${baseKey}:${inventoryStockMap.size}`;
      inventoryStockMap.set(stockKey, { quantity: inv.quantity, unit: inv.unit });
    }
  }

  // 3. For each required ingredient, calculate missing quantity and package recommendation
  const shoppingItems: AggregatedShoppingItem[] = [];
  let totalMinCost = 0;
  let totalMaxCost = 0;

  for (const [requirementKey, item] of aggregatedMap.entries()) {
    const ingredientId = requirementKey.split(':', 1)[0];
    let availableInInventory = 0;
    for (const [stockKey, stock] of inventoryStockMap.entries()) {
      if (!(stockKey === ingredientId || stockKey.startsWith(`${ingredientId}:`)) || stock.quantity <= 0) continue;
      const converted = tryConvertUnit(stock.quantity, stock.unit, item.unit);
      if (converted !== null) availableInInventory += converted;
    }

    const missingQuantity = Math.max(0, item.totalRequired - availableInInventory);

    // Apply package size recommendation
    const { recommendedPurchase } = calculatePackageRecommendation(
      ingredientId,
      missingQuantity,
      item.unit
    );

    // Calculate price estimate
    const costEstimate = priceProvider.estimateCost(
      ingredientId,
      recommendedPurchase,
      item.unit
    );

    totalMinCost += costEstimate.minVnd;
    totalMaxCost += costEstimate.maxVnd;

    // Only add to shopping list if there is missing quantity to purchase
    if (recommendedPurchase > 0) {
      shoppingItems.push({
        ingredientId,
        name: item.name,
        category: item.category,
        requiredQuantity: item.totalRequired,
        existingInventoryQuantity: availableInInventory,
        missingQuantity,
        recommendedPurchaseQuantity: recommendedPurchase,
        unit: item.unit,
        estimatedPriceMin: costEstimate.minVnd,
        estimatedPriceMax: costEstimate.maxVnd,
        checked: false,
        sourceRecipes: item.sources,
      });
    }
  }

  // Sort shopping items by category
  shoppingItems.sort((a, b) => a.category.localeCompare(b.category));

  // Determine budget status
  let budgetStatus: BudgetStatus = 'UNDER';
  if (budgetTargetVnd && budgetTargetVnd > 0) {
    if (totalMinCost > budgetTargetVnd) {
      budgetStatus = 'OVER';
    } else if (totalMaxCost >= budgetTargetVnd * 0.9) {
      budgetStatus = 'NEAR';
    } else {
      budgetStatus = 'UNDER';
    }
  }

  const formatVnd = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}tr`;
    }
    return `${Math.round(num / 1000)}k`;
  };

  const displayText = totalMaxCost > 0
    ? `~${formatVnd(totalMinCost)}–${formatVnd(totalMaxCost)}đ`
    : '0đ (100% đồ có sẵn)';

  return {
    shoppingItems,
    budget: {
      targetVnd: budgetTargetVnd,
      estimatedMinVnd: totalMinCost,
      estimatedMaxVnd: totalMaxCost,
      status: budgetStatus,
      displayText,
    },
  };
}
