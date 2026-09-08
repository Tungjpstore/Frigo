import { compareIds } from '../../domain/src/availability';
import { Quantity } from '../../domain/src/quantity';
import type { RecipeCandidate } from './candidates';
import type { PlannerPolicy } from './planner-policy';
import type { AggregatedPlannerShortage, PlannedMeal, PlannerReason, PlanUtilityComponents } from './planner-types';

export function candidatePlanIdentity(candidate: RecipeCandidate): string {
  return JSON.stringify([candidate.source.kind, candidate.source.sourceId, candidate.source.version, candidate.variant?.id ?? null]);
}
export function candidateFamilyIdentity(candidate: RecipeCandidate): string | undefined {
  return candidate.source.kind === 'family' ? candidate.source.sourceId : candidate.familyId;
}
export const emptyPlanUtility = (): PlanUtilityComponents => ({
  ranking: 0, exactRepetition: 0, familyRepetition: 0, cuisineRepetition: 0, ingredientReuse: 0, nutritionBalance: 0,
});
export function totalPlanUtility(components: PlanUtilityComponents): number {
  return components.ranking - components.exactRepetition - components.familyRepetition - components.cuisineRepetition +
    components.ingredientReuse + components.nutritionBalance;
}

export function futureMealUtility(candidate: RecipeCandidate, past: readonly PlannedMeal[], policy: PlannerPolicy) {
  const identity = candidatePlanIdentity(candidate);
  const family = candidateFamilyIdentity(candidate);
  const exact = past.filter((meal) => candidatePlanIdentity(meal.ranked.candidate) === identity);
  const familyRepeated = family !== undefined && past.some((meal) => candidateFamilyIdentity(meal.ranked.candidate) === family);
  const cuisineRepeated = candidate.cuisine !== undefined && past.some((meal) => meal.ranked.candidate.cuisine === candidate.cuisine);
  const usedIngredients = new Set(past.flatMap((meal) => meal.projectedConsumption.map((delta) => delta.ingredientId)));
  const ingredients = [...new Set(candidate.lotAllocations.map((lot) => lot.ingredientId))];
  const reuse = ingredients.length ? ingredients.filter((id) => usedIngredients.has(id)).length / ingredients.length : 0;
  const lastIndex = past.map((meal) => candidatePlanIdentity(meal.ranked.candidate)).lastIndexOf(identity);
  const repeatAllowed = exact.length < policy.maxExactRecipeRepeats &&
    (lastIndex === -1 || past.length - lastIndex - 1 >= policy.minimumRepeatGap);
  const reasons: PlannerReason[] = [];
  if (exact.length) reasons.push('EXACT_RECIPE_REPEATED');
  else if (familyRepeated) reasons.push('RELATED_FAMILY_REPEATED');
  else if (cuisineRepeated) reasons.push('CUISINE_REPEATED');
  else reasons.push('IMPROVES_FUTURE_VARIETY');
  if (reuse > 0) reasons.push('REUSES_AVAILABLE_INGREDIENT');
  return { repeatAllowed, reasons,
    components: { ...emptyPlanUtility(),
      exactRepetition: exact.length ? policy.exactRepeatPenalty : 0,
      familyRepetition: !exact.length && familyRepeated ? policy.familyRepeatPenalty : 0,
      cuisineRepetition: !exact.length && !familyRepeated && cuisineRepeated ? policy.cuisineRepeatPenalty : 0,
      ingredientReuse: reuse * policy.ingredientReuseWeight,
    } };
}

// Aggregate facts in their existing units; no conversion, package rounding or inventory subtraction.
export function aggregatePlanShortages(meals: readonly PlannedMeal[]): AggregatedPlannerShortage[] {
  const groups = new Map<string, { fact: AggregatedPlannerShortage; known: Quantity }>();
  for (const meal of meals) for (const requirement of meal.shortages) {
    const key = JSON.stringify([requirement.ingredientId, requirement.unit, requirement.isOptional]);
    const group = groups.get(key) ?? { fact: { ingredientId: requirement.ingredientId, unit: requirement.unit,
      isOptional: requirement.isOptional, knownMissingQuantity: 0, totalMissingQuantity: null, unresolvedCount: 0, slotIds: [] },
    known: Quantity.from(0) };
    if (requirement.missingQuantity === null) group.fact.unresolvedCount++;
    else group.known = group.known.add(Quantity.from(requirement.missingQuantity));
    if (!group.fact.slotIds.includes(meal.id)) group.fact.slotIds.push(meal.id);
    groups.set(key, group);
  }
  return [...groups].sort(([a], [b]) => compareIds(a, b)).map(([, { fact, known }]) => {
    const amount = known.toNumber();
    return { ...fact, knownMissingQuantity: amount, totalMissingQuantity: fact.unresolvedCount ? null : amount };
  });
}
