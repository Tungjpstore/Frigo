import { compareIds } from '../../domain/src/availability';
import type { CandidateMode, RecipeCandidate } from './candidates';
import type { RankingPreferences } from './personalization';
import type { CandidateRankingEvidence, RankedNutritionFacts } from './ranking-evidence';

export type RankingExclusionReason = 'INVALID_CANDIDATE' | 'CANDIDATE_MODE' | 'FORBIDDEN_INGREDIENT'
  | 'NEVER_RECOMMEND' | 'ALLERGEN_CONFLICT' | 'DIETARY_CONFLICT' | 'SAFETY_UNKNOWN'
  | 'COOKING_TIME_UNKNOWN' | 'COOKING_TIME_LIMIT' | 'NUTRITION_UNKNOWN' | 'NUTRITION_CONFLICT';

export function candidateIngredientIds(candidate: RecipeCandidate): string[] {
  return [...new Set(candidate.requirements.flatMap((requirement) =>
    [requirement.ingredientId, ...requirement.substitutions.map((use) => use.rule.toIngredientId)]))].sort(compareIds);
}

export function cookingTimeFacts(candidate: RecipeCandidate) {
  const cook = candidate.cookTimeMinutes;
  const prep = candidate.prepTimeMinutes;
  const total = cook !== undefined && prep !== undefined ? cook + prep : null;
  if (total !== null && !Number.isFinite(total)) throw new Error('Cooking time outside supported range');
  return { cookMinutes: cook ?? null, prepMinutes: prep ?? null, totalMinutes: total,
    lowerBoundMinutes: total ?? cook ?? prep ?? null,
    coverage: total !== null ? 1 : cook !== undefined || prep !== undefined ? 0.5 : 0 };
}

export function evaluateRankingEligibility(candidate: RecipeCandidate, mode: CandidateMode,
  policies: readonly RankingPreferences[], evidence: CandidateRankingEvidence | undefined,
  nutrition: RankedNutritionFacts) {
  const reasons = new Set<RankingExclusionReason>();
  const constraints: Array<{ kind: string; key: string; state: 'safe' | 'conflict' | 'unknown' }> = [];
  const qualifications: string[] = [];
  if (candidate.source.provenance.verificationState === 'rejected' || !candidate.requirements.length ||
    candidate.eligibilityScope !== 'quantity_only') reasons.add('INVALID_CANDIDATE');
  if (mode === 'cook_now' && !candidate.canCookWithoutBuying) reasons.add('CANDIDATE_MODE');
  const ingredients = candidateIngredientIds(candidate);
  const time = cookingTimeFacts(candidate);
  for (const policy of policies) {
    if (policy.forbiddenIngredientIds.some((id) => ingredients.includes(id))) reasons.add('FORBIDDEN_INGREDIENT');
    if (candidate.source.kind === 'recipe' && policy.neverRecommendRecipeIds.includes(candidate.source.sourceId)) reasons.add('NEVER_RECOMMEND');
    for (const [kind, keys] of [['allergen', policy.allergens], ['dietary', policy.requiredDietaryTags]] as const) {
      for (const key of keys) {
        const reviews = evidence?.safety.filter((item) => item.kind === kind && item.key === key) ?? [];
        const conflict = reviews.some((item) => item.verdict === 'conflict') ||
          (kind === 'allergen' && candidate.classifications.some((item) => item.kind === 'allergen' && item.tag === key));
        const state = conflict ? 'conflict' : reviews.some((item) => item.verdict === 'safe') ? 'safe' : 'unknown';
        constraints.push({ kind, key, state });
        if (state === 'conflict') reasons.add(kind === 'allergen' ? 'ALLERGEN_CONFLICT' : 'DIETARY_CONFLICT');
        if (state === 'unknown') reasons.add('SAFETY_UNKNOWN');
      }
    }
    if (policy.hardMaxTimeMinutes !== undefined) {
      if (time.totalMinutes === null) reasons.add('COOKING_TIME_UNKNOWN');
      else if (time.totalMinutes > policy.hardMaxTimeMinutes) reasons.add('COOKING_TIME_LIMIT');
    }
    for (const target of policy.mealNutritionTargets.filter((item) => item.hard)) {
      const value = nutrition.perServing[target.nutrient];
      const estimated = nutrition.profile?.sourceType === 'estimated';
      if (value === undefined || nutrition.verificationState !== 'reviewed' || (estimated && !target.allowEstimates)) {
        reasons.add('NUTRITION_UNKNOWN');
      } else if (value < target.min || value > target.max) {
        reasons.add('NUTRITION_CONFLICT');
      } else if (estimated) qualifications.push(`ESTIMATED_NUTRIENT_ACCEPTED:${target.nutrient}`);
    }
  }
  return { eligible: reasons.size === 0, reasons: [...reasons].sort(compareIds), constraints,
    safetyAssessment: constraints.length ? 'requested_constraints_only' as const : 'not_requested' as const,
    qualifications: [...new Set(qualifications)].sort(compareIds) };
}
