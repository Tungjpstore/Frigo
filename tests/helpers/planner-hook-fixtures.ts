import { MealPlanDtoSchema, PlanShoppingDtoSchema } from '../../packages/domain/src/meal-planning-api';

export const hookPlanId = 'c6c5f00c-cf24-4c98-8f50-8123510f1f80';
export const hookSlotId = '2030-01-02:dinner:0';
export const hookInstant = '2030-01-01T00:00:00.000Z';

export function hookPlan(revision = 1, householdId = 'house-a') {
  return MealPlanDtoSchema.parse({
    schemaVersion: 1, id: hookPlanId, householdId, revision,
    createdAt: hookInstant, updatedAt: hookInstant,
    intent: { startDate: '2030-01-02', defaultServings: 2,
      slots: [{ date: '2030-01-02', mealType: 'dinner' }] },
    result: {
      status: 'feasible', conclusion: 'feasible',
      planningReference: { instant: hookInstant, localDate: '2030-01-01', utcOffsetMinutes: 0 },
      meals: [{ slotId: hookSlotId, date: '2030-01-02', mealType: 'dinner', time: '18:00',
        instant: '2030-01-02T18:00:00.000Z', servings: 2, candidateId: `recipe-${revision}`,
        source: { kind: 'recipe', id: `recipe-${revision}`, version: 1, variantId: null },
        title: `Dinner revision ${revision}`, cuisine: null, prepTimeMinutes: null,
        cookTimeMinutes: 20, instructions: ['Cook thoroughly.'], requirements: [],
        reasons: ['LIKED_RECIPE'], safetyAssessment: 'not_requested', projectedConsumption: [] }],
      unplannedSlots: [], diagnostics: [],
      search: { exhaustive: true, plannerExhaustive: true, recipeExhaustive: true,
        truncated: false, limitReasons: [], incompleteReasons: [], rejections: [] },
    },
    freshness: { status: 'fresh', reasons: [], checkedAt: hookInstant,
      requiresRevalidationBeforeConsumption: true },
  });
}

export function hookShopping(revision = 1) {
  const money = { currency: 'JPY', minorAmount: '4820' };
  const zero = { currency: 'JPY', minorAmount: '0' };
  return PlanShoppingDtoSchema.parse({
    schemaVersion: 1, planId: hookPlanId, planRevision: revision, priceAsOf: hookInstant,
    requiresPriceRevalidation: true, catalogStatus: 'available',
    result: {
      schemaVersion: 1, id: `shopping-${revision}`, mealPlanId: hookPlanId,
      currency: 'JPY', currencyMinorDigits: 0,
      priceSnapshot: { id: 'prices', asOf: hookInstant, requiresRevalidationBeforeAcceptance: true },
      planner: { status: 'feasible', conclusion: 'feasible', truncated: false,
        limitReasons: [], incompleteReasons: [], unplannedSlots: [] },
      shoppingCompleteness: 'complete', shoppingStatus: 'fulfilled', requirements: [],
      optionalRequirements: [], purchaseLines: [], unresolvedRequirements: [],
      cost: { knownCost: money, totalCost: money, status: 'known', unknownCostItemCount: 0,
        bestKnownCompleteCost: money, minimumCost: money, provenKnownCostLowerBound: money },
      budget: { status: 'not_configured', selectedKnownGap: zero, knownRemaining: null,
        provenGap: zero, replanRecommended: false, largestKnownCostDrivers: [],
        ingredientsWithNoCheaperKnownOption: [], unknownPriceRequirementIds: [] },
      existingInventoryRemainder: [], purchaseSurplus: [],
      wasteSummary: { existingAtRiskLotCount: 0, purchaseAtRiskSurplusCount: 0,
        unknownRiskItemCount: 0, assessedItemCount: 0, coverage: null, certainWasteQuantity: null },
      optimization: { exhaustive: true, searchExhaustive: true, truncated: false,
        limitReasons: [], incompleteReasons: [],
        proofScope: 'supplied_comparable_catalog_per_ingredient_package_cost' },
      diagnostics: [],
    },
  });
}
