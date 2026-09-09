import { PlanResultDtoSchema, type PlanResultDto } from '../../../packages/domain/src/meal-planning-api';
import type { WeeklyMealPlan } from '../../../packages/recipes/src/planner-types';
import type { StandardUnit } from '../../../packages/domain/src/units';

function quantity(amount: number, unit: StandardUnit) {
  if (!Number.isFinite(amount) || amount < 0) throw new Error('Invalid generated quantity');
  return { value: amount.toString(), unit };
}

export function mapPlanResultDto(
  plan: WeeklyMealPlan,
  instructions: ReadonlyMap<string, readonly string[]> = new Map(),
): PlanResultDto {
  return PlanResultDtoSchema.parse({
    status: plan.status,
    conclusion: plan.conclusion,
    planningReference: plan.planningReference,
    meals: plan.slots.map((slot) => {
      const candidate = slot.ranked.candidate;
      return {
        slotId: slot.id, date: slot.date, mealType: slot.mealType,
        time: slot.time, instant: slot.instant, servings: slot.servings,
        candidateId: candidate.id,
        source: {
          kind: candidate.source.kind, id: candidate.source.sourceId,
          version: candidate.source.version, variantId: candidate.variant?.id ?? null,
        },
        title: candidate.title, cuisine: candidate.cuisine ?? null,
        prepTimeMinutes: candidate.prepTimeMinutes ?? null,
        cookTimeMinutes: candidate.cookTimeMinutes ?? null,
        instructions: candidate.source.kind === 'recipe'
          ? [...(instructions.get(candidate.source.sourceId) ?? [])] : [],
        requirements: candidate.requirements.map((row) => ({
          ingredientId: row.ingredientId, optional: row.isOptional, status: row.status,
          required: quantity(row.requiredQuantity, row.unit),
          covered: quantity(row.coveredQuantity, row.unit),
          missing: row.missingQuantity === null ? null : quantity(row.missingQuantity, row.unit),
          reasons: row.direct.reasons,
        })),
        reasons: [...new Set([...slot.reasons, ...slot.ranked.reasons])],
        safetyAssessment: slot.ranked.eligibility.safetyAssessment,
        projectedConsumption: slot.projectedConsumption.map((row) => ({
          lotId: row.lotId, ingredientId: row.ingredientId,
          consumed: quantity(row.consumedQuantity, row.unit),
          remaining: quantity(row.remainingQuantity, row.unit),
        })),
      };
    }),
    unplannedSlots: plan.unplannedSlots.map((slot) => ({
      slotId: slot.id, date: slot.date, mealType: slot.mealType, reasons: slot.reasons,
    })),
    search: {
      exhaustive: plan.search.searchExhaustive,
      plannerExhaustive: plan.search.plannerSearchExhaustive,
      recipeExhaustive: plan.search.recipeSearchExhaustive,
      truncated: plan.search.truncated,
      limitReasons: plan.search.limitReasons,
      incompleteReasons: plan.search.incompleteReasons,
      rejections: plan.search.rejections.map(({ slotId, code, count }) => ({ slotId, code, count })),
    },
    diagnostics: plan.diagnostics.map(({ slotId, code, count }) => ({ slotId, code, count })),
  });
}
