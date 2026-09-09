import { Quantity } from '../../../packages/domain/src/quantity';
import {
  ShoppingResultDtoSchema,
  type ExactQuantityDto,
  type MoneyDto,
  type ShoppingResultDto,
} from '../../../packages/domain/src/meal-shopping-api';
import type { StandardUnit } from '../../../packages/domain/src/units';
import type { OptimizedShoppingPlan } from '../../../packages/recipes/src/shopping-optimizer';

function quantity(value: number, unit: StandardUnit): ExactQuantityDto {
  // T05 has already rejected lossy Quantity -> Number conversion before this DTO boundary.
  return { value: Quantity.from(value).toNumber().toString(), unit };
}

function money(currency: OptimizedShoppingPlan['currency'], minorAmount: string): MoneyDto {
  return { currency, minorAmount };
}

function sourceMealSlots(sources: OptimizedShoppingPlan['requirements'][number]['sourceMealSlots']) {
  return sources.map((source) => ({
    slotId: source.slotId,
    date: source.date,
    candidateId: source.candidateId,
    sourceLineIndices: source.sourceLineIndices,
    shortageType: source.shortageType,
    quantity: source.quantity === null ? null : quantity(source.quantity, source.unit),
  }));
}

function requirement(row: OptimizedShoppingPlan['requirements'][number]) {
  return {
    id: row.id,
    ingredientId: row.ingredientId,
    required: row.requiredQuantity === null ? null : quantity(row.requiredQuantity, row.unit),
    knownRequired: quantity(row.knownRequiredQuantity, row.unit),
    status: row.status,
    optional: row.isOptional,
    sourceMealSlots: sourceMealSlots(row.sourceMealSlots),
    unresolvedCount: row.unresolvedCount,
  };
}

/** Maps only client-safe T05 facts; snapshot provenance, review evidence, and search branches stay private. */
export function toShoppingResultDto(plan: OptimizedShoppingPlan): ShoppingResultDto {
  const result = {
    schemaVersion: plan.schemaVersion,
    id: plan.id,
    mealPlanId: plan.mealPlanId,
    currency: plan.currency,
    currencyMinorDigits: plan.currencyMinorDigits,
    priceSnapshot: {
      id: plan.priceSnapshot.id,
      asOf: plan.priceSnapshot.asOf,
      requiresRevalidationBeforeAcceptance: plan.priceSnapshot.requiresRevalidationBeforeAcceptance,
    },
    planner: {
      status: plan.mealPlan.status,
      conclusion: plan.mealPlan.conclusion,
      truncated: plan.mealPlan.search.truncated,
      limitReasons: plan.mealPlan.search.limitReasons,
      incompleteReasons: plan.mealPlan.search.incompleteReasons.map((reason) => reason.code),
      unplannedSlots: plan.mealPlan.unplannedSlots.map((slot) => ({
        slotId: slot.id,
        date: slot.date,
        reasons: slot.reasons,
      })),
    },
    shoppingCompleteness: plan.shoppingCompleteness,
    shoppingStatus: plan.shoppingStatus,
    requirements: plan.requirements.map(requirement),
    optionalRequirements: plan.optionalRequirements.map(requirement),
    purchaseLines: plan.purchaseLines.map((line) => ({
      requirementId: line.requirementId,
      ingredientId: line.ingredientId,
      required: quantity(line.requiredQuantity, line.unit),
      sourceMealSlots: sourceMealSlots(line.sourceMealSlots),
      selectedPackages: line.selectedPackages.map((item) => ({
        purchaseOptionId: item.purchaseOptionId,
        productId: item.productId,
        retailerId: item.retailerId,
        packageContent: quantity(item.packageContent.quantity, item.packageContent.unit),
        packageCount: item.packageCount,
        unitPrice: item.unitPriceMinor === null ? null : money(plan.currency, item.unitPriceMinor),
        lineCost: item.lineCostMinor === null ? null : money(plan.currency, item.lineCostMinor),
        availability: item.availability,
        expiry: item.expiry === null ? null : { date: item.expiry.date, kind: item.expiry.kind },
      })),
      purchased: quantity(line.purchasedQuantity, line.unit),
      surplus: quantity(line.surplusQuantity, line.unit),
      knownCost: money(plan.currency, line.knownCostMinor),
      totalCost: line.totalCostMinor === null ? null : money(plan.currency, line.totalCostMinor),
      unknownPricePackageCount: line.unknownPricePackageCount,
      bestKnownCompleteCost:
        line.bestKnownCompleteCostMinor === null
          ? null
          : money(plan.currency, line.bestKnownCompleteCostMinor),
      provenMinimumCost:
        line.minimumCostMinor === null ? null : money(plan.currency, line.minimumCostMinor),
      reasons: line.reasons,
    })),
    unresolvedRequirements: plan.unresolvedRequirements.map(({ requirement: item, code }) => ({
      requirementId: item.id,
      code,
    })),
    cost: {
      knownCost: money(plan.currency, plan.cost.knownCostMinor),
      totalCost: plan.cost.totalCostMinor === null ? null : money(plan.currency, plan.cost.totalCostMinor),
      status: plan.cost.status,
      unknownCostItemCount: plan.cost.unknownCostItemCount,
      bestKnownCompleteCost:
        plan.cost.bestKnownCompleteCostMinor === null
          ? null
          : money(plan.currency, plan.cost.bestKnownCompleteCostMinor),
      minimumCost:
        plan.cost.minimumCostMinor === null ? null : money(plan.currency, plan.cost.minimumCostMinor),
      provenKnownCostLowerBound: money(plan.currency, plan.cost.provenKnownCostLowerBoundMinor),
    },
    budget: {
      status: plan.budget.status,
      selectedKnownGap: money(plan.currency, plan.budget.selectedKnownGapMinor),
      knownRemaining:
        plan.budget.knownRemainingMinor === null
          ? null
          : money(plan.currency, plan.budget.knownRemainingMinor),
      provenGap: money(plan.currency, plan.budget.provenGapMinor),
      replanRecommended: plan.budget.replanRecommended,
      largestKnownCostDrivers: plan.budget.largestCostDrivers.map((driver) => ({
        ingredientId: driver.ingredientId,
        knownCost: money(plan.currency, driver.knownCostMinor),
      })),
      ingredientsWithNoCheaperKnownOption: plan.budget.ingredientsWithNoCheaperKnownOption,
      unknownPriceRequirementIds: plan.budget.unknownPriceRequirementIds,
    },
    existingInventoryRemainder: plan.existingInventoryRemainder
      .filter((item) => item.ingredientId !== '')
      .map((item) => ({
        lotId: item.id,
        ingredientId: item.ingredientId,
        remaining: quantity(item.quantity, item.unit),
        risk: item.risk,
      })),
    purchaseSurplus: plan.purchaseSurplus.map((item) => ({
      requirementId: item.requirementId,
      ingredientId: item.ingredientId,
      purchaseOptionId: item.purchaseOptionId,
      quantity: quantity(item.quantity, item.unit),
      risk: item.risk,
    })),
    wasteSummary: plan.wasteSummary,
    optimization: {
      exhaustive: plan.optimization.exhaustive,
      searchExhaustive: plan.optimization.searchExhaustive,
      truncated: plan.optimization.truncated,
      limitReasons: plan.optimization.limitReasons,
      incompleteReasons: plan.optimization.incompleteReasons,
      proofScope: plan.optimization.proofScope,
    },
    diagnostics: plan.diagnostics,
  };
  return ShoppingResultDtoSchema.parse(result);
}
