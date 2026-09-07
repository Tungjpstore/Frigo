import { StandardUnit } from '../index';

export interface PackageOption {
  ingredientId: string;
  packageSize: number;
  unit: StandardUnit;
  description: string;
}

export const TYPICAL_PACKAGE_SIZES: Record<string, number[]> = {
  // Meat: 300g, 500g, 1000g
  PORK_BELLY: [300, 500, 1000],
  PORK_RIBS: [500, 1000],
  GROUND_PORK: [300, 500],
  BEEF_SIRLOIN: [250, 500],
  CHICKEN_BREAST: [500, 1000],
  CHICKEN_THIGH: [500, 1000],
  SHRIMP: [300, 500],
  CRAB_MEAT: [250, 500],
  SQUID: [300, 500],
  FISH_FRESHWATER: [500, 1000],
  SALMON_FILLET: [200, 400],
  // Eggs: 6, 10
  CHICKEN_EGG: [6, 10],
  // Dairy & liquids: 500ml, 1000ml
  FRESH_MILK: [1000],
  COOKING_OIL: [500, 1000],
  FISH_SAUCE: [500],
  SOY_SAUCE: [500],
  // Tofu: 1 piece each
  TOFU: [1, 2, 3],
  // Pasta & Rice paper: 1 pack
  SPAGHETTI_PASTA: [1],
  NOODLE: [1],
  RICE_PAPER: [1],
};

/**
 * Calculates real-world recommended purchase quantity based on retail package sizes.
 */
export function calculatePackageRecommendation(
  ingredientId: string,
  missingQuantity: number,
  unit: StandardUnit
): { recommendedPurchase: number; expectedLeftover: number } {
  if (missingQuantity <= 0) {
    return { recommendedPurchase: 0, expectedLeftover: 0 };
  }

  const cleanId = (ingredientId || '').toUpperCase();
  const options = TYPICAL_PACKAGE_SIZES[cleanId];

  if (!options || options.length === 0) {
    // If no specific packaging rule, round up slightly for safety
    if (unit === 'g' || unit === 'ml') {
      const rounded = Math.ceil(missingQuantity / 50) * 50;
      return {
        recommendedPurchase: rounded,
        expectedLeftover: Math.max(0, rounded - missingQuantity),
      };
    }
    const rounded = Math.ceil(missingQuantity);
    return {
      recommendedPurchase: rounded,
      expectedLeftover: Math.max(0, rounded - missingQuantity),
    };
  }

  // Find the smallest single package or combination that covers missingQuantity
  // If missingQuantity is smaller than smallest package, recommend smallest package
  const smallest = options[0];
  if (missingQuantity <= smallest) {
    return {
      recommendedPurchase: smallest,
      expectedLeftover: smallest - missingQuantity,
    };
  }

  // Find exact or closest higher package
  for (const opt of options) {
    if (opt >= missingQuantity) {
      return {
        recommendedPurchase: opt,
        expectedLeftover: opt - missingQuantity,
      };
    }
  }

  // If larger than biggest package, multiply the largest package size
  const largest = options[options.length - 1];
  const multiplier = Math.ceil(missingQuantity / largest);
  const total = multiplier * largest;

  return {
    recommendedPurchase: total,
    expectedLeftover: total - missingQuantity,
  };
}
