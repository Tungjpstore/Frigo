import { z } from 'zod';

export const PLANNER_LIMITS = Object.freeze({
  horizonDays: 14, slots: 42, servings: 20, inventoryLots: 1000,
  catalogRecipes: 500, catalogFamilies: 16, feedbackEvents: 2000,
  beamWidth: 16, candidateLimitPerSlot: 32, maxSearchStates: 4096,
});

export const PlannerPolicySchema = z.object({
  id: z.literal('balanced-week-v1').default('balanced-week-v1'),
  beamWidth: z.number().int().min(1).max(PLANNER_LIMITS.beamWidth).default(6),
  candidateLimitPerSlot: z.number().int().min(1).max(PLANNER_LIMITS.candidateLimitPerSlot).default(8),
  maxSearchStates: z.number().int().min(1).max(PLANNER_LIMITS.maxSearchStates).default(1024),
  recipeLimit: z.number().int().min(1).max(PLANNER_LIMITS.catalogRecipes).default(80),
  familyLimit: z.number().int().min(1).max(PLANNER_LIMITS.catalogFamilies).default(4),
  variantCandidatesPerFamily: z.number().int().min(1).max(64).default(16),
  variantSearchStatesPerFamily: z.number().int().min(1).max(1024).default(128),
  maxExactRecipeRepeats: z.number().int().min(1).max(PLANNER_LIMITS.slots).default(PLANNER_LIMITS.slots),
  minimumRepeatGap: z.number().int().min(0).max(PLANNER_LIMITS.slots).default(0),
  unknownMealType: z.enum(['allow', 'exclude']).default('allow'),
  exactRepeatPenalty: z.number().finite().min(0).max(1).default(0.18),
  familyRepeatPenalty: z.number().finite().min(0).max(1).default(0.06),
  cuisineRepeatPenalty: z.number().finite().min(0).max(1).default(0.02),
  ingredientReuseWeight: z.number().finite().min(0).max(1).default(0.025),
  nutritionBalanceWeight: z.number().finite().min(0).max(1).default(0.08),
}).strict().refine((policy) => policy.exactRepeatPenalty >= policy.familyRepeatPenalty &&
  policy.familyRepeatPenalty >= policy.cuisineRepeatPenalty, 'Broader repetition must not outweigh exact repetition');
export type PlannerPolicy = z.infer<typeof PlannerPolicySchema>;
export const DEFAULT_PLANNER_POLICY: Readonly<PlannerPolicy> = Object.freeze(PlannerPolicySchema.parse({}));
