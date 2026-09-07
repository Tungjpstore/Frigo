import { InventoryItem } from '../index';
import { FridgeUtilizationSummary, FoodWasteRiskSummary, FoodWasteRiskLevel } from './types';

export interface ItemUsagePlan {
  ingredientId: string;
  plannedUsedQuantity: number;
}

/**
 * Calculates Fridge Utilization:
 * weighted planned usage of existing inventory vs usable stock.
 * Higher weight is given to items marked 'expiring' and 'use_soon'.
 */
export function calculateFridgeUtilization(
  inventory: InventoryItem[],
  usagePlans: ItemUsagePlan[]
): FridgeUtilizationSummary {
  if (!inventory || inventory.length === 0) {
    return {
      utilizationPercent: 0,
      plannedItemsCount: 0,
      totalUsableItemsCount: 0,
      highPriorityUsedCount: 0,
    };
  }

  const usageMap = new Map<string, number>();
  for (const plan of usagePlans) {
    const current = usageMap.get(plan.ingredientId) || 0;
    usageMap.set(plan.ingredientId, current + plan.plannedUsedQuantity);
  }

  let totalWeight = 0;
  let usedWeight = 0;
  let plannedItemsCount = 0;
  let highPriorityUsedCount = 0;

  for (const item of inventory) {
    if (item.quantity <= 0) continue;

    // Weight based on freshness:
    // expiring = 3.0, use_soon = 2.0, fresh = 1.0
    let weightFactor = 1.0;
    if (item.freshness === 'expiring') weightFactor = 3.0;
    else if (item.freshness === 'use_soon') weightFactor = 2.0;

    totalWeight += weightFactor;

    const plannedQty = usageMap.get(item.ingredientId) || 0;
    if (plannedQty > 0) {
      plannedItemsCount++;
      // Utilization fraction capped at 1.0
      const fractionUsed = Math.min(1.0, plannedQty / item.quantity);
      usedWeight += fractionUsed * weightFactor;

      if (item.freshness === 'expiring' || item.freshness === 'use_soon') {
        highPriorityUsedCount++;
      }
    }
  }

  const utilizationPercent = totalWeight > 0
    ? Math.min(100, Math.round((usedWeight / totalWeight) * 100))
    : 0;

  return {
    utilizationPercent,
    plannedItemsCount,
    totalUsableItemsCount: inventory.filter((i) => i.quantity > 0).length,
    highPriorityUsedCount,
  };
}

/**
 * Calculates Food Waste Risk (Nguy cơ bỏ phí thực phẩm):
 * Evaluates expiring items in the inventory against planned rescued items.
 */
export function calculateFoodWasteRisk(
  inventory: InventoryItem[],
  rescuedIngredientIds: string[]
): FoodWasteRiskSummary {
  const expiringItems = inventory.filter(
    (i) => i.freshness === 'expiring' || i.freshness === 'use_soon'
  );

  if (expiringItems.length === 0) {
    return {
      level: 'LOW',
      expiringItemsCount: 0,
      rescuedItemsCount: 0,
      displayText: 'Nguy cơ thấp (0 thực phẩm sắp hết hạn)',
    };
  }

  const rescuedSet = new Set(rescuedIngredientIds.map((id) => id.toUpperCase()));
  let rescuedCount = 0;

  for (const item of expiringItems) {
    if (rescuedSet.has(item.ingredientId.toUpperCase())) {
      rescuedCount++;
    }
  }

  const unrescuedCount = expiringItems.length - rescuedCount;

  let level: FoodWasteRiskLevel = 'LOW';
  let displayText = 'Nguy cơ thấp';

  if (unrescuedCount >= 3) {
    level = 'HIGH';
    displayText = `Nguy cơ cao (${unrescuedCount} món cận date chưa có kế hoạch dùng)`;
  } else if (unrescuedCount >= 1) {
    level = 'MEDIUM';
    displayText = `Nguy cơ trung bình (${unrescuedCount} món cận date cần lưu ý)`;
  } else {
    level = 'LOW';
    displayText = `Nguy cơ thấp (Đã tận dụng ${rescuedCount}/${expiringItems.length} món cận date)`;
  }

  return {
    level,
    expiringItemsCount: expiringItems.length,
    rescuedItemsCount: rescuedCount,
    displayText,
  };
}
