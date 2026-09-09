import { compareIds, type LotAllocation } from '../../domain/src/availability';
import type { RecipeCandidate } from './candidates';
import type { RankingContext, RankingPreferences, RecipeFeedback } from './personalization';
import { cookingTimeFacts, candidateIngredientIds } from './ranking-eligibility';
import { clampScore, DAY_MS, recencyDecay, type RankingProfile } from './ranking-policy';

const identityKey = (kind: 'recipe' | 'family', id: string) => JSON.stringify([kind, id]);
export function buildHistoryIndex(context: RankingContext, referenceTime: string, profile: RankingProfile) {
  const cooked = new Map<string, number>();
  const families = new Map<string, number>();
  const cuisines = new Map<string, number>();
  const tastes = new Map<string, RecipeFeedback>();
  const weak = new Map<string, number>();
  const setMax = (map: Map<string, number>, key: string, value: number) => map.set(key, Math.max(value, map.get(key) ?? 0));
  const events = [...context.feedback].filter((event) => Date.parse(event.occurredAt) <= Date.parse(referenceTime))
    .sort((a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt) || compareIds(a.id, b.id));
  for (const event of events) {
    const key = identityKey(event.target.kind, event.target.id);
    if (event.type === 'cooked') {
      const decay = recencyDecay(event.occurredAt, referenceTime, profile.historyWindowDays);
      setMax(cooked, key, decay);
      const family = event.target.kind === 'family' ? event.target.id : event.familyId;
      if (family) setMax(families, family, decay);
      if (event.cuisine) setMax(cuisines, event.cuisine, decay);
    } else if (event.type === 'liked' || event.type === 'disliked') {
      tastes.set(key, event);
    } else {
      const strength = event.type === 'skipped' ? profile.skippedPenalty : profile.swappedPenalty;
      setMax(weak, key, strength * recencyDecay(event.occurredAt, referenceTime, profile.feedbackWindowDays));
    }
  }
  return { cooked, families, cuisines, tastes, weak };
}

export function candidateHistoryFeatures(candidate: RecipeCandidate, index: ReturnType<typeof buildHistoryIndex>, profile: RankingProfile) {
  const key = identityKey(candidate.source.kind, candidate.source.sourceId);
  const familyId = candidate.source.kind === 'family' ? candidate.source.sourceId : candidate.familyId;
  const familyKey = familyId ? identityKey('family', familyId) : null;
  const taste = index.tastes.get(key) ?? (familyKey ? index.tastes.get(familyKey) : undefined);
  const exact = index.cooked.get(key) ?? 0;
  const family = familyId ? index.families.get(familyId) ?? 0 : 0;
  const cuisine = candidate.cuisine ? index.cuisines.get(candidate.cuisine) ?? 0 : 0;
  const weakPenalty = Math.max(index.weak.get(key) ?? 0, familyKey ? index.weak.get(familyKey) ?? 0 : 0);
  return { exactRecency: exact, familyRecency: family, cuisineRecency: cuisine,
    explicitTaste: taste?.type === 'liked' || taste?.type === 'disliked' ? taste.type : null,
    tasteEventId: taste?.id ?? null, weakPenalty,
    // Broad novelty is deliberately weak and separate from exact-dish repetition.
    variety: clampScore(1 - Math.max(family * profile.familyRepetitionStrength, cuisine * profile.cuisineRepetitionStrength)) };
}

export function preferenceFeatures(candidate: RecipeCandidate, preferences: RankingPreferences,
  history: ReturnType<typeof candidateHistoryFeatures>) {
  const ids = candidateIngredientIds(candidate);
  const preferredCuisine = candidate.cuisine !== undefined && preferences.preferredCuisines.includes(candidate.cuisine);
  const avoidedCuisine = candidate.cuisine !== undefined && preferences.avoidedCuisines.includes(candidate.cuisine);
  const likedIngredients = ids.filter((id) => preferences.likedIngredientIds.includes(id));
  const dislikedIngredients = ids.filter((id) => preferences.dislikedIngredientIds.includes(id));
  const cuisineSignal = avoidedCuisine ? -1 : preferredCuisine ? 1 : 0;
  const ingredientSignal = ids.length ? ids.reduce((sum, id) => sum +
    (dislikedIngredients.includes(id) ? -1 : likedIngredients.includes(id) ? 1 : 0), 0) / ids.length : 0;
  const score = history.explicitTaste === 'liked' ? 1 : history.explicitTaste === 'disliked' ? 0 :
    clampScore(0.5 + 0.25 * cuisineSignal + 0.25 * ingredientSignal - history.weakPenalty);
  return { score, preferredCuisine, avoidedCuisine, likedIngredients, dislikedIngredients,
    explicitTaste: history.explicitTaste, tasteEventId: history.tasteEventId,
    weakPenaltyApplied: history.explicitTaste === null ? history.weakPenalty : 0 };
}

export function expiryFeatures(candidate: RecipeCandidate, referenceDate: string, profile: RankingProfile) {
  const required = candidate.requirements.filter((requirement) => !requirement.isOptional);
  const urgentLotIds = new Set<string>();
  const kindShares = { use_by: 0, best_before: 0, estimated: 0, unknown: 0 };
  let sum = 0;
  let known = 0;
  const urgency = (lot: LotAllocation) => {
    if (lot.expiryDate === null || lot.expiryKind === 'unknown') return { score: 0, known: 0 };
    const days = (Date.parse(`${lot.expiryDate}T00:00:00Z`) - Date.parse(`${referenceDate}T00:00:00Z`)) / DAY_MS;
    // Past best-before is not an unsafe-food claim, nor a reason to auto-prioritize it.
    const score = days < 0 ? 0 : clampScore(1 - days / profile.expiryWindowDays);
    if (score > 0) urgentLotIds.add(lot.lotId);
    return { score, known: 1 };
  };
  for (const requirement of required) {
    let score = 0;
    let coverage = 0;
    for (const lot of requirement.direct.lotsUsed) {
      const value = urgency(lot);
      const share = clampScore(lot.contributedQuantity / requirement.requiredQuantity);
      kindShares[lot.expiryKind] += share / required.length;
      score += share * value.score;
      coverage += share * value.known;
    }
    for (const use of requirement.substitutions) {
      const originalShare = clampScore(use.coveredOriginalQuantity / requirement.requiredQuantity);
      for (const lot of use.lotsUsed) {
        const value = urgency(lot);
        const share = originalShare * clampScore(lot.contributedQuantity / use.quantity);
        kindShares[lot.expiryKind] += share / required.length;
        score += share * value.score;
        coverage += share * value.known;
      }
    }
    sum += clampScore(score);
    known += clampScore(coverage);
  }
  return { score: required.length ? clampScore(sum / required.length) : 0,
    coverage: required.length ? clampScore(known / required.length) : 0,
    kindShares, urgentLotIds: [...urgentLotIds].sort(compareIds), policy: 't02_allocated_requirement_share' as const };
}

export function inventoryFeatures(candidate: RecipeCandidate) {
  const count = candidate.coverage.requiredRequirementCount;
  const required = candidate.requirements.filter((requirement) => !requirement.isOptional);
  const distinct = new Set(required.map((requirement) => requirement.ingredientId)).size;
  const shoppingIds = [...new Set(required.filter((requirement) => requirement.status === 'missing' || requirement.status === 'partial')
    .map((requirement) => requirement.ingredientId))].sort(compareIds);
  return { fit: count ? required.reduce((sum, requirement) => sum + (requirement.status === 'unresolved' ? 0 :
    clampScore(requirement.coveredQuantity / requirement.requiredQuantity)), 0) / count : 0,
    coverage: count ? clampScore(1 - candidate.coverage.unresolvedRequiredCount / count) : 0,
    shoppingBurden: distinct ? shoppingIds.length / distinct : 0, shoppingIngredientIds: shoppingIds,
    substitutionPenalty: candidate.requirements.filter((requirement) => requirement.substitutions.length > 0).length / candidate.requirements.length };
}

export function cookingTimeFeatures(candidate: RecipeCandidate, preferences: RankingPreferences) {
  const facts = cookingTimeFacts(candidate);
  const preferred = preferences.preferredTimeMinutes;
  const observed = facts.lowerBoundMinutes;
  const fit = preferred === undefined || observed === null ? 0.5 : observed <= preferred ? 1 : preferred / observed;
  return { ...facts, preferredMinutes: preferred ?? null,
    abovePreference: preferred !== undefined && observed !== null && observed > preferred,
    score: clampScore(0.5 + facts.coverage * (fit - 0.5)) };
}
