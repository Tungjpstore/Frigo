import { StandardUnit, IngredientCategory } from '../index';
import { Recipe, CuisineType } from '@frigo/recipes';

export type MealPlanStatus =
  | 'DRAFT'
  | 'GENERATING'
  | 'READY'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'ARCHIVED'
  | 'FAILED';

export type DayType = 'cooking' | 'eat_out' | 'away' | 'leftover' | 'flexible';

export type MealSlotType = 'breakfast' | 'lunch' | 'dinner';

export type MealSlotStatus =
  | 'PLANNED'
  | 'FLEXIBLE'
  | 'EATING_OUT'
  | 'SKIPPED'
  | 'LEFTOVER'
  | 'COOKED';

export type WeeklyPriority =
  | 'use_fridge' // Dùng hết đồ trong tủ
  | 'budget' // Tiết kiệm
  | 'quick' // Nấu nhanh
  | 'variety' // Ăn đa dạng
  | 'more_veggies' // Nhiều rau hơn
  | 'high_protein' // Protein cao hơn
  | 'low_oil' // Ít dầu mỡ
  | 'less_shopping' // Ít mua thêm
  | 'meal_prep' // Meal prep
  | 'new_recipes'; // Thử món mới

export type ShoppingFrequency = 'once' | 'twice' | 'three_plus' | 'flexible';

export type FoodWasteRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type BudgetStatus = 'UNDER' | 'NEAR' | 'OVER';

export interface WeeklyScheduleDay {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  date: string; // YYYY-MM-DD
  dayType: DayType;
  slots: {
    slotType: MealSlotType;
    status: MealSlotStatus;
  }[];
}

export interface MealSlotIngredientRequirement {
  ingredientId: string;
  name: string;
  category: IngredientCategory;
  requiredQuantity: number;
  availableQuantity: number;
  missingQuantity: number;
  unit: StandardUnit;
  estimatedCostVnd: number;
  fromFridge: boolean;
}

export interface MealSlotItem {
  id: string;
  dayId: string;
  planId: string;
  slotType: MealSlotType;
  status: MealSlotStatus;
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 1 = Monday, etc.
  recipe?: Recipe;
  servings: number;
  source: 'AUTO' | 'USER';
  isLocked?: boolean;
  leftoverSourceSlotId?: string;
  isLeftover?: boolean;
  notes?: string;
  availabilityPercent: number; // 0 - 100%
  incrementalCostVnd: number;
  rescuedExpiringIngredients: string[];
  badges: string[]; // e.g. ["Dùng đồ sắp hết", "100% có sẵn", "Ăn ngoài"]
  ingredients: MealSlotIngredientRequirement[];
}

export interface MealPlanDay {
  id: string;
  planId: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 1 = Monday, ..., 7 = Sunday
  dayNameVi: string; // 'Thứ 2', 'Thứ 3', ...
  dayType: DayType;
  slots: MealSlotItem[];
}

export interface AggregatedShoppingItem {
  ingredientId: string;
  name: string;
  category: IngredientCategory;
  requiredQuantity: number;
  existingInventoryQuantity: number;
  missingQuantity: number;
  recommendedPurchaseQuantity: number;
  unit: StandardUnit;
  estimatedPriceMin: number;
  estimatedPriceMax: number;
  checked: boolean;
  cannotBuy?: boolean;
  sourceRecipes: {
    recipeId: string;
    recipeTitle: string;
    quantity: number;
  }[];
}

export interface ShoppingRun {
  id: string;
  planId: string;
  householdId: string;
  status: 'pending' | 'in_progress' | 'completed';
  startedAt?: string;
  completedAt?: string;
  items: AggregatedShoppingItem[];
}

export interface WeeklyBudgetSummary {
  targetVnd: number | null; // null if unlimited
  estimatedMinVnd: number;
  estimatedMaxVnd: number;
  status: BudgetStatus;
  displayText: string; // e.g. "~650.000–720.000đ"
}

export interface FridgeUtilizationSummary {
  utilizationPercent: number; // 0 - 100%
  plannedItemsCount: number;
  totalUsableItemsCount: number;
  highPriorityUsedCount: number;
}

export interface FoodWasteRiskSummary {
  level: FoodWasteRiskLevel;
  expiringItemsCount: number;
  rescuedItemsCount: number;
  displayText: string; // "Nguy cơ thấp" / "Nguy cơ trung bình" / "Nguy cơ cao"
}

export interface MealPlan {
  id: string;
  householdId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: MealPlanStatus;
  days: MealPlanDay[];
  budget: WeeklyBudgetSummary;
  utilization: FridgeUtilizationSummary;
  wasteRisk: FoodWasteRiskSummary;
  shoppingItems: AggregatedShoppingItem[];
  priorities: WeeklyPriority[];
  shoppingFrequency: ShoppingFrequency;
  createdAt: string;
  updatedAt: string;
  aiExplanation?: string;
}

export interface MealSwapAlternative {
  recipe: Recipe;
  budgetDeltaVnd: number; // e.g. +15000 or -20000
  fridgeUtilizationDeltaPercent: number; // e.g. +4 or -2
  cookingTimeDeltaMinutes: number; // e.g. +10 or -5
  matchPercent: number;
  badges: string[];
}

export interface MealPlanSetupInput {
  householdId: string;
  startDate: string; // YYYY-MM-DD
  /** Optional client-generated resource id used to make offline plan creation idempotent. */
  planId?: string;
  householdSize: number;
  mealSlotsPreset: 'dinner_only' | 'working_people' | 'all';
  selectedSlots?: {
    weekday: MealSlotType[];
    weekend: MealSlotType[];
  };
  budgetTargetVnd: number | null; // null = unlimited
  schedule?: {
    date: string;
    dayType: DayType;
  }[];
  priorities: WeeklyPriority[];
  shoppingFrequency: ShoppingFrequency;
  dietaryRestrictions?: string[];
  dislikedIngredients?: string[];
  preferredCuisines?: CuisineType[];
}

export interface PlannerConfig {
  weightInventoryMatch: number; // 0.20
  weightExpiryPriority: number; // 0.20
  weightBudgetFit: number; // 0.15
  weightPreferenceMatch: number; // 0.10
  weightCookingTimeFit: number; // 0.10
  weightVariety: number; // 0.10
  weightQuantityFit: number; // 0.05
  weightPackageReuse: number; // 0.05
  weightHistoryNovelty: number; // 0.05
  maxSameProteinConsecutiveDays: number; // 2
  maxSameRecipePerWeek: number; // 1
  adultPortionRatio: number; // 1.0
  childPortionRatio: number; // 0.7
}

export const DEFAULT_PLANNER_CONFIG: PlannerConfig = {
  weightInventoryMatch: 0.20,
  weightExpiryPriority: 0.20,
  weightBudgetFit: 0.15,
  weightPreferenceMatch: 0.10,
  weightCookingTimeFit: 0.10,
  weightVariety: 0.10,
  weightQuantityFit: 0.05,
  weightPackageReuse: 0.05,
  weightHistoryNovelty: 0.05,
  maxSameProteinConsecutiveDays: 2,
  maxSameRecipePerWeek: 1,
  adultPortionRatio: 1.0,
  childPortionRatio: 0.7,
};
