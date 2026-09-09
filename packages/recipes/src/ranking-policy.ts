import { z } from 'zod';

const weight = z.number().finite().min(0).max(1000);
export const RankingProfileSchema = z.object({
  id: z.string().min(1).max(100),
  weights: z.object({
    inventoryFit: weight, expiryPriority: weight, preferenceFit: weight,
    nutritionFit: weight, cookingTimeFit: weight, variety: weight,
    recentMealPenalty: weight, shoppingBurden: weight, substitutionPenalty: weight,
  }).strict().refine((value) => Object.values(value).some((item) => item > 0), 'At least one positive weight required'),
  expiryWindowDays: z.number().int().min(1).max(30),
  historyWindowDays: z.number().int().min(1).max(365),
  feedbackWindowDays: z.number().int().min(1).max(365),
  familyRepetitionStrength: z.number().min(0).max(1),
  cuisineRepetitionStrength: z.number().min(0).max(1),
  skippedPenalty: z.number().min(0).max(0.25),
  swappedPenalty: z.number().min(0).max(0.25),
}).strict();
export type RankingProfile = z.infer<typeof RankingProfileSchema>;
export type RankingComponents = RankingProfile['weights'];
export const BALANCED_RANKING_PROFILE: Readonly<RankingProfile> = Object.freeze({
  id: 'balanced-v1',
  weights: Object.freeze({ inventoryFit: 30, expiryPriority: 12, preferenceFit: 30,
    nutritionFit: 8, cookingTimeFit: 8, variety: 3,
    recentMealPenalty: 6, shoppingBurden: 2, substitutionPenalty: 1 }),
  expiryWindowDays: 7, historyWindowDays: 14, feedbackWindowDays: 7,
  familyRepetitionStrength: 0.5, cuisineRepetitionStrength: 0.25,
  skippedPenalty: 0.1, swappedPenalty: 0.15,
});
export const clampScore = (value: number): number => {
  if (!Number.isFinite(value)) throw new Error('Ranking component must be finite');
  return Math.min(1, Math.max(0, value));
};
export const DAY_MS = 86_400_000;
export function recencyDecay(occurredAt: string, referenceTime: string, days: number): number {
  const age = Date.parse(referenceTime) - Date.parse(occurredAt);
  return age < 0 ? 0 : clampScore(1 - age / (days * DAY_MS));
}

export function aggregateRankingScore(components: RankingComponents, profile: RankingProfile) {
  const denominator = Object.values(profile.weights).reduce((sum, value) => sum + value, 0);
  const penalties = new Set<keyof RankingComponents>(['recentMealPenalty', 'shoppingBurden', 'substitutionPenalty']);
  const contributions = {} as RankingComponents;
  let finalScore = 0;
  for (const key of Object.keys(profile.weights) as Array<keyof RankingComponents>) {
    const raw = clampScore(components[key]);
    contributions[key] = (penalties.has(key) ? 1 - raw : raw) * (profile.weights[key] / denominator);
    finalScore += contributions[key];
  }
  return { finalScore: clampScore(finalScore), contributions };
}
