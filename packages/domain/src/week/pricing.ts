import { StandardUnit } from '../index';

export interface IngredientPriceRecord {
  ingredientId: string;
  nameVi: string;
  pricePerUnitMin: number; // in VND
  pricePerUnitMax: number; // in VND
  baseUnit: StandardUnit;
}

export interface PriceProvider {
  getPrice(ingredientId: string): IngredientPriceRecord | null;
  estimateCost(
    ingredientId: string,
    quantity: number,
    unit: StandardUnit
  ): { minVnd: number; maxVnd: number; isEstimated: boolean };
}

/**
 * Standard Vietnam average retail market prices (2025/2026 data in VND).
 */
export const VIETNAM_AVERAGE_PRICES: Record<string, IngredientPriceRecord> = {
  // MEAT & POULTRY
  PORK_BELLY: {
    ingredientId: 'PORK_BELLY',
    nameVi: 'Thịt ba chỉ',
    pricePerUnitMin: 140, // 140 VND/g -> 140.000đ/kg
    pricePerUnitMax: 170, // 170 VND/g -> 170.000đ/kg
    baseUnit: 'g',
  },
  GROUND_PORK: {
    ingredientId: 'GROUND_PORK',
    nameVi: 'Thịt heo xay',
    pricePerUnitMin: 110,
    pricePerUnitMax: 135,
    baseUnit: 'g',
  },
  BEEF_SIRLOIN: {
    ingredientId: 'BEEF_SIRLOIN',
    nameVi: 'Thịt bò',
    pricePerUnitMin: 240, // 240.000đ/kg
    pricePerUnitMax: 290, // 290.000đ/kg
    baseUnit: 'g',
  },
  CHICKEN_BREAST: {
    ingredientId: 'CHICKEN_BREAST',
    nameVi: 'Ức gà',
    pricePerUnitMin: 70, // 70.000đ/kg
    pricePerUnitMax: 90,
    baseUnit: 'g',
  },
  CHICKEN_THIGH: {
    ingredientId: 'CHICKEN_THIGH',
    nameVi: 'Đùi gà',
    pricePerUnitMin: 75,
    pricePerUnitMax: 95,
    baseUnit: 'g',
  },
  // SEAFOOD
  SHRIMP: {
    ingredientId: 'SHRIMP',
    nameVi: 'Tôm tươi',
    pricePerUnitMin: 180, // 180.000đ/kg
    pricePerUnitMax: 230,
    baseUnit: 'g',
  },
  SALMON_FILLET: {
    ingredientId: 'SALMON_FILLET',
    nameVi: 'Cá hồi',
    pricePerUnitMin: 450, // 450.000đ/kg
    pricePerUnitMax: 550,
    baseUnit: 'g',
  },
  WHITE_FISH: {
    ingredientId: 'WHITE_FISH',
    nameVi: 'Cá trắng / cá quả',
    pricePerUnitMin: 90,
    pricePerUnitMax: 130,
    baseUnit: 'g',
  },
  // EGGS & DAIRY
  CHICKEN_EGG: {
    ingredientId: 'CHICKEN_EGG',
    nameVi: 'Trứng gà',
    pricePerUnitMin: 2800, // 2.800đ - 3.500đ/quả
    pricePerUnitMax: 3500,
    baseUnit: 'piece',
  },
  FRESH_MILK: {
    ingredientId: 'FRESH_MILK',
    nameVi: 'Sữa tươi',
    pricePerUnitMin: 32, // 32.000đ/lít
    pricePerUnitMax: 38,
    baseUnit: 'ml',
  },
  CHEDDAR_CHEESE: {
    ingredientId: 'CHEDDAR_CHEESE',
    nameVi: 'Phô mai',
    pricePerUnitMin: 4500,
    pricePerUnitMax: 6000,
    baseUnit: 'slice',
  },
  BUTTER: {
    ingredientId: 'BUTTER',
    nameVi: 'Bơ',
    pricePerUnitMin: 120,
    pricePerUnitMax: 180,
    baseUnit: 'g',
  },
  // VEGETABLES
  TOMATO: {
    ingredientId: 'TOMATO',
    nameVi: 'Cà chua',
    pricePerUnitMin: 2500, // ~2.500đ/quả (~25k/kg)
    pricePerUnitMax: 3500,
    baseUnit: 'piece',
  },
  ONION: {
    ingredientId: 'ONION',
    nameVi: 'Hành tây',
    pricePerUnitMin: 3000,
    pricePerUnitMax: 5000,
    baseUnit: 'piece',
  },
  GARLIC: {
    ingredientId: 'GARLIC',
    nameVi: 'Tỏi',
    pricePerUnitMin: 2000,
    pricePerUnitMax: 3000,
    baseUnit: 'piece',
  },
  SCALLION: {
    ingredientId: 'SCALLION',
    nameVi: 'Hành lá',
    pricePerUnitMin: 4000, // 4.000đ/bó
    pricePerUnitMax: 6000,
    baseUnit: 'bunch',
  },
  CABBAGE: {
    ingredientId: 'CABBAGE',
    nameVi: 'Bắp cải',
    pricePerUnitMin: 15000,
    pricePerUnitMax: 22000,
    baseUnit: 'piece',
  },
  CARROT: {
    ingredientId: 'CARROT',
    nameVi: 'Cà rốt',
    pricePerUnitMin: 3000,
    pricePerUnitMax: 5000,
    baseUnit: 'piece',
  },
  WATER_SPINACH: {
    ingredientId: 'WATER_SPINACH',
    nameVi: 'Rau muống',
    pricePerUnitMin: 8000, // 8.000đ/mớ
    pricePerUnitMax: 12000,
    baseUnit: 'bunch',
  },
  BROCCOLI: {
    ingredientId: 'BROCCOLI',
    nameVi: 'Súp lơ xanh',
    pricePerUnitMin: 20000,
    pricePerUnitMax: 30000,
    baseUnit: 'piece',
  },
  CUCUMBER: {
    ingredientId: 'CUCUMBER',
    nameVi: 'Dưa leo',
    pricePerUnitMin: 2500,
    pricePerUnitMax: 4000,
    baseUnit: 'piece',
  },
  CHILI: {
    ingredientId: 'CHILI',
    nameVi: 'Ớt',
    pricePerUnitMin: 500,
    pricePerUnitMax: 1000,
    baseUnit: 'piece',
  },
  GINGER: {
    ingredientId: 'GINGER',
    nameVi: 'Gừng',
    pricePerUnitMin: 2000,
    pricePerUnitMax: 3500,
    baseUnit: 'piece',
  },
  TOFU: {
    ingredientId: 'TOFU',
    nameVi: 'Đậu phụ',
    pricePerUnitMin: 4000, // 4.000đ - 6.000đ/bìa
    pricePerUnitMax: 6000,
    baseUnit: 'piece',
  },
  KIMCHI: {
    ingredientId: 'KIMCHI',
    nameVi: 'Kim chi',
    pricePerUnitMin: 90, // 90.000đ/kg
    pricePerUnitMax: 130,
    baseUnit: 'g',
  },
  RICE: {
    ingredientId: 'RICE',
    nameVi: 'Gạo',
    pricePerUnitMin: 20, // 20.000đ/kg -> 20đ/g
    pricePerUnitMax: 26,
    baseUnit: 'g',
  },
  SPAGHETTI_PASTA: {
    ingredientId: 'SPAGHETTI_PASTA',
    nameVi: 'Mì Ý',
    pricePerUnitMin: 35000, // 35.000đ/gói 500g
    pricePerUnitMax: 45000,
    baseUnit: 'pack',
  },
  NOODLE: {
    ingredientId: 'NOODLE',
    nameVi: 'Bún / Phở khô',
    pricePerUnitMin: 25000,
    pricePerUnitMax: 35000,
    baseUnit: 'pack',
  },
  // PANTRY & SPICES
  FISH_SAUCE: {
    ingredientId: 'FISH_SAUCE',
    nameVi: 'Nước mắm',
    pricePerUnitMin: 50, // 50đ/ml -> ~25k-35k/chai 500ml
    pricePerUnitMax: 80,
    baseUnit: 'ml',
  },
  SOY_SAUCE: {
    ingredientId: 'SOY_SAUCE',
    nameVi: 'Nước tương',
    pricePerUnitMin: 30,
    pricePerUnitMax: 50,
    baseUnit: 'ml',
  },
  COOKING_OIL: {
    ingredientId: 'COOKING_OIL',
    nameVi: 'Dầu ăn',
    pricePerUnitMin: 45, // 45.000đ/lít
    pricePerUnitMax: 60,
    baseUnit: 'ml',
  },
  SUGAR: {
    ingredientId: 'SUGAR',
    nameVi: 'Đường',
    pricePerUnitMin: 22, // 22.000đ/kg
    pricePerUnitMax: 28,
    baseUnit: 'g',
  },
  PORK_RIBS: {
    ingredientId: 'PORK_RIBS',
    nameVi: 'Sườn heo / Sườn non',
    pricePerUnitMin: 130, // 130.000đ/kg
    pricePerUnitMax: 160,
    baseUnit: 'g',
  },
  CRAB_MEAT: {
    ingredientId: 'CRAB_MEAT',
    nameVi: 'Cua đồng / Cua thịt',
    pricePerUnitMin: 140, // 140.000đ/kg
    pricePerUnitMax: 180,
    baseUnit: 'g',
  },
  SQUID: {
    ingredientId: 'SQUID',
    nameVi: 'Mực tươi',
    pricePerUnitMin: 180, // 180.000đ/kg
    pricePerUnitMax: 240,
    baseUnit: 'g',
  },
  FISH_FRESHWATER: {
    ingredientId: 'FISH_FRESHWATER',
    nameVi: 'Cá tươi (Cá lóc, điêu hồng, rô)',
    pricePerUnitMin: 65, // 65.000đ/kg
    pricePerUnitMax: 95,
    baseUnit: 'g',
  },
  BITTER_MELON: {
    ingredientId: 'BITTER_MELON',
    nameVi: 'Khổ qua',
    pricePerUnitMin: 4000,
    pricePerUnitMax: 7000,
    baseUnit: 'piece',
  },
  WINTER_MELON: {
    ingredientId: 'WINTER_MELON',
    nameVi: 'Bí đao',
    pricePerUnitMin: 10000,
    pricePerUnitMax: 18000,
    baseUnit: 'piece',
  },
  PUMPKIN: {
    ingredientId: 'PUMPKIN',
    nameVi: 'Bí đỏ',
    pricePerUnitMin: 12000,
    pricePerUnitMax: 20000,
    baseUnit: 'piece',
  },
  PINEAPPLE: {
    ingredientId: 'PINEAPPLE',
    nameVi: 'Dứa / Thơm',
    pricePerUnitMin: 12000,
    pricePerUnitMax: 18000,
    baseUnit: 'piece',
  },
  BEAN_SPROUTS: {
    ingredientId: 'BEAN_SPROUTS',
    nameVi: 'Giá đỗ',
    pricePerUnitMin: 20, // 20.000đ/kg
    pricePerUnitMax: 30,
    baseUnit: 'g',
  },
  CHAYOTE: {
    ingredientId: 'CHAYOTE',
    nameVi: 'Su su',
    pricePerUnitMin: 5000,
    pricePerUnitMax: 8000,
    baseUnit: 'piece',
  },
  LEMONGRASS: {
    ingredientId: 'LEMONGRASS',
    nameVi: 'Sả tươi',
    pricePerUnitMin: 1000,
    pricePerUnitMax: 2000,
    baseUnit: 'piece',
  },
  LIME: {
    ingredientId: 'LIME',
    nameVi: 'Chanh tươi',
    pricePerUnitMin: 1500,
    pricePerUnitMax: 3000,
    baseUnit: 'piece',
  },
  RICE_PAPER: {
    ingredientId: 'RICE_PAPER',
    nameVi: 'Bánh tráng cuốn',
    pricePerUnitMin: 12000,
    pricePerUnitMax: 18000,
    baseUnit: 'pack',
  },
};

export class ManualAveragePriceProvider implements PriceProvider {
  private prices: Record<string, IngredientPriceRecord>;

  constructor(customPrices?: Record<string, IngredientPriceRecord>) {
    this.prices = { ...VIETNAM_AVERAGE_PRICES, ...(customPrices || {}) };
  }

  getPrice(ingredientId: string): IngredientPriceRecord | null {
    const cleanId = (ingredientId || '').toUpperCase();
    return this.prices[cleanId] || null;
  }

  estimateCost(
    ingredientId: string,
    quantity: number,
    unit: StandardUnit
  ): { minVnd: number; maxVnd: number; isEstimated: boolean } {
    if (quantity <= 0) {
      return { minVnd: 0, maxVnd: 0, isEstimated: false };
    }

    const price = this.getPrice(ingredientId);

    if (!price) {
      // Conservative default estimate for unlisted ingredient: ~15.000đ - 25.000đ
      return {
        minVnd: 15000,
        maxVnd: 25000,
        isEstimated: true,
      };
    }

    let multiplier = quantity;

    // Handle unit conversions
    if (price.baseUnit === 'g' && unit === 'kg') multiplier = quantity * 1000;
    if (price.baseUnit === 'kg' && unit === 'g') multiplier = quantity / 1000;
    if (price.baseUnit === 'ml' && unit === 'l') multiplier = quantity * 1000;
    if (price.baseUnit === 'l' && unit === 'ml') multiplier = quantity / 1000;

    const min = Math.round(price.pricePerUnitMin * multiplier);
    const max = Math.round(price.pricePerUnitMax * multiplier);

    return {
      minVnd: Math.max(1000, min),
      maxVnd: Math.max(2000, max),
      isEstimated: false,
    };
  }
}

export const defaultPriceProvider = new ManualAveragePriceProvider();
