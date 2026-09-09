import { z } from 'zod';
import { Quantity } from '../../domain/src/quantity';
import { NutrientSchema, type RankingNutrient } from './personalization';
import { nutrientRangeFit } from './ranking-evidence';
import { clampScore } from './ranking-policy';
import type { RankedRecipeCandidate } from './ranking';

const NutritionValueSchema = z.number().finite().nonnegative().max(1e9);
const IsoDateSchema = z.string().date();

export const PeriodNutritionTargetSchema = z.object({
  period: z.enum(['day', 'horizon']),
  date: IsoDateSchema.optional(),
  basis: z.literal('household_total'),
  nutrient: NutrientSchema,
  min: NutritionValueSchema.default(0),
  max: NutritionValueSchema,
  hard: z.boolean().default(false),
  allowEstimates: z.boolean().default(false),
}).strict().superRefine((target, ctx) => {
  if (target.period === 'day' && target.date === undefined) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['date'], message: 'Daily nutrition targets require a date' });
  }
  if (target.period === 'horizon' && target.date !== undefined) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['date'], message: 'Horizon nutrition targets cannot specify a date' });
  }
  if (target.min > target.max) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['min'], message: 'Nutrition target range is reversed' });
  }
});
export type PeriodNutritionTarget = Readonly<z.output<typeof PeriodNutritionTargetSchema>>;
export type PeriodNutritionTargets = readonly PeriodNutritionTarget[];

export const PeriodNutritionTargetsSchema = z.array(PeriodNutritionTargetSchema).max(28).superRefine((targets, ctx) => {
  const keys = new Set<string>();
  for (const [index, target] of targets.entries()) {
    const key = `${target.period}:${target.date ?? ''}:${target.nutrient}`;
    if (keys.has(key)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [index], message: 'Duplicate period nutrition target' });
    keys.add(key);
  }
});

/** Parses and freezes targets so a planner branch cannot alter its policy in place. */
export function parsePeriodNutritionTargets(input: unknown): PeriodNutritionTargets {
  return Object.freeze(PeriodNutritionTargetsSchema.parse(input).map((target) => Object.freeze(target)));
}

export interface PlannerNutritionMeal {
  date: string;
  servings: number;
  ranked: RankedRecipeCandidate;
}

export interface NutrientPeriodSummary {
  knownTotal: number | null;
  knownMeals: number;
  unknownMeals: number;
  reviewedMeals: number;
  estimatedMeals: number;
  coverage: number;
}

export interface NutritionConfidence {
  coverage: number;
  reviewedCoverage: number;
  estimatedCoverage: number;
  qualifiedCoverage: number;
  complete: boolean;
}

export type NutritionAssessmentStatus = 'satisfied' | 'violated' | 'unknown' | 'pending';
export type NutritionDiagnosticCode = 'NUTRITION_UNKNOWN' | 'NUTRITION_MIN' | 'NUTRITION_MAX';

export interface PeriodNutritionAssessment {
  target: PeriodNutritionTarget;
  status: NutritionAssessmentStatus;
  code?: NutritionDiagnosticCode;
  knownTotal: number | null;
  qualifiedTotal: number | null;
  confidence: NutritionConfidence;
  fit: number;
  canPrune: boolean;
}

export interface PlanNutritionSummary {
  nutrients: Record<RankingNutrient, NutrientPeriodSummary>;
  byDay: Array<{ date: string; plannedMeals: number; pending: boolean; nutrients: Record<RankingNutrient, NutrientPeriodSummary> }>;
  pendingDates: string[];
  assessments: PeriodNutritionAssessment[];
  hardPruning: { shouldPrune: boolean; assessments: PeriodNutritionAssessment[] };
  softFit: { score: number; coverage: number | null; requestedTargets: number; qualifiedTargets: number };
}

interface Accumulator {
  total: Quantity;
  qualifiedTotal: Quantity;
  knownMeals: number;
  reviewedMeals: number;
  estimatedMeals: number;
  qualifiedMeals: number;
}

const nutrients = NutrientSchema.options;
const zero = () => Quantity.from(0);

function newAccumulator(): Accumulator {
  return { total: zero(), qualifiedTotal: zero(), knownMeals: 0, reviewedMeals: 0, estimatedMeals: 0, qualifiedMeals: 0 };
}

function toTotal(value: Quantity, knownMeals: number, mealCount: number): number | null {
  // An empty completed period has a known zero; a non-empty period with no observations does not.
  return mealCount === 0 || knownMeals > 0 ? value.toNumber() : null;
}

function summarizeNutrient(meals: readonly PlannerNutritionMeal[], nutrient: RankingNutrient,
  allowEstimates: boolean): { summary: NutrientPeriodSummary; qualifiedTotal: number | null; qualifiedMeals: number } {
  const accumulator = newAccumulator();
  for (const meal of meals) {
    const nutrition = meal.ranked.facts.nutrition;
    const perServing = nutrition.perServing[nutrient];
    if (perServing === undefined) continue;
    if (!Number.isFinite(perServing) || perServing < 0) throw new RangeError('Planner nutrition values must be finite and nonnegative');
    const contribution = Quantity.from(perServing).multiply(Quantity.from(meal.servings));
    accumulator.total = accumulator.total.add(contribution);
    accumulator.knownMeals++;
    const reviewed = nutrition.verificationState === 'reviewed';
    const estimated = nutrition.profile?.sourceType === 'estimated';
    if (reviewed) accumulator.reviewedMeals++;
    if (estimated) accumulator.estimatedMeals++;
    if (reviewed && (!estimated || allowEstimates)) {
      accumulator.qualifiedMeals++;
      accumulator.qualifiedTotal = accumulator.qualifiedTotal.add(contribution);
    }
  }
  return {
    summary: {
      knownTotal: toTotal(accumulator.total, accumulator.knownMeals, meals.length),
      knownMeals: accumulator.knownMeals,
      unknownMeals: meals.length - accumulator.knownMeals,
      reviewedMeals: accumulator.reviewedMeals,
      estimatedMeals: accumulator.estimatedMeals,
      coverage: meals.length === 0 ? 1 : accumulator.knownMeals / meals.length,
    },
    qualifiedTotal: toTotal(accumulator.qualifiedTotal, accumulator.qualifiedMeals, meals.length),
    qualifiedMeals: accumulator.qualifiedMeals,
  };
}

function parseMeals(meals: readonly PlannerNutritionMeal[]): PlannerNutritionMeal[] {
  return meals.map((meal) => {
    IsoDateSchema.parse(meal.date);
    if (!Number.isFinite(meal.servings) || meal.servings <= 0) throw new RangeError('Planner meal servings must be finite and positive');
    return meal;
  });
}

function confidence(summary: NutrientPeriodSummary, qualifiedMeals: number, mealCount: number): NutritionConfidence {
  return {
    coverage: summary.coverage,
    reviewedCoverage: mealCount === 0 ? 1 : summary.reviewedMeals / mealCount,
    estimatedCoverage: mealCount === 0 ? 0 : summary.estimatedMeals / mealCount,
    qualifiedCoverage: mealCount === 0 ? 1 : qualifiedMeals / mealCount,
    complete: qualifiedMeals === mealCount,
  };
}

function assess(target: PeriodNutritionTarget, meals: readonly PlannerNutritionMeal[], closed: boolean): PeriodNutritionAssessment {
  const aggregate = summarizeNutrient(meals, target.nutrient, target.allowEstimates);
  const qualified = confidence(aggregate.summary, aggregate.qualifiedMeals, meals.length);
  const qualifiedTotal = aggregate.qualifiedTotal;
  const knownFit = qualifiedTotal === null ? 0.5 : nutrientRangeFit(qualifiedTotal, target.min, target.max);
  const fit = clampScore(0.5 + qualified.qualifiedCoverage * (knownFit - 0.5));
  let status: NutritionAssessmentStatus;
  let code: NutritionDiagnosticCode | undefined;
  if (target.hard && aggregate.summary.knownTotal !== null && aggregate.summary.knownTotal > target.max) {
    // No later positive contribution can correct a maximum already exceeded.
    status = 'violated';
    code = 'NUTRITION_MAX';
  } else if (!qualified.complete) {
    status = 'unknown';
    code = 'NUTRITION_UNKNOWN';
  } else if (!closed) {
    status = 'pending';
  } else if (qualifiedTotal === null || qualifiedTotal < target.min) {
    status = 'violated';
    code = 'NUTRITION_MIN';
  } else if (qualifiedTotal > target.max) {
    status = 'violated';
    code = 'NUTRITION_MAX';
  } else {
    status = 'satisfied';
  }
  return {
    target,
    status,
    code,
    knownTotal: aggregate.summary.knownTotal,
    qualifiedTotal,
    confidence: qualified,
    fit,
    // A hard maximum and evidence quality cannot be repaired by filling later slots.
    canPrune: target.hard && (status === 'unknown' || code === 'NUTRITION_MAX' || (closed && code === 'NUTRITION_MIN')),
  };
}

/**
 * `pendingDates` must contain every date with an unfilled requested slot. This
 * prevents partial planner output from being treated as a closed daily/horizon period.
 */
export function summarizePlanNutrition(meals: readonly PlannerNutritionMeal[], targets: readonly PeriodNutritionTarget[],
  pendingDates: readonly string[] = []): PlanNutritionSummary {
  const parsedMeals = parseMeals(meals);
  const parsedTargets = parsePeriodNutritionTargets(targets);
  const pending = new Set(pendingDates.map((date) => IsoDateSchema.parse(date)));
  if (pending.size !== pendingDates.length) throw new RangeError('Pending planner dates must be unique');

  const nutrientEntries = nutrients.map((nutrient) => [nutrient, summarizeNutrient(parsedMeals, nutrient, true).summary] as const);
  const assessments = parsedTargets.map((target) => {
    const periodMeals = target.period === 'day' ? parsedMeals.filter((meal) => meal.date === target.date) : parsedMeals;
    const closed = target.period === 'day' ? !pending.has(target.date!) : pending.size === 0;
    return assess(target, periodMeals, closed);
  });
  const hardAssessments = assessments.filter((assessment) => assessment.target.hard && assessment.canPrune);
  const softAssessments = assessments.filter((assessment) => !assessment.target.hard);
  const softCoverage = softAssessments.length
    ? softAssessments.reduce((sum, assessment) => sum + assessment.confidence.qualifiedCoverage, 0) / softAssessments.length
    : null;
  return {
    nutrients: Object.fromEntries(nutrientEntries) as Record<RankingNutrient, NutrientPeriodSummary>,
    byDay: [...new Set([...parsedMeals.map((meal) => meal.date), ...pending])].sort().map((date) => {
      const dayMeals = parsedMeals.filter((meal) => meal.date === date);
      return { date, plannedMeals: dayMeals.length, pending: pending.has(date),
        nutrients: Object.fromEntries(nutrients.map((nutrient) =>
          [nutrient, summarizeNutrient(dayMeals, nutrient, true).summary])) as Record<RankingNutrient, NutrientPeriodSummary> };
    }),
    pendingDates: [...pending].sort(),
    assessments,
    hardPruning: { shouldPrune: hardAssessments.length > 0, assessments: hardAssessments },
    // This is only period-level balance; callers should not re-add T03 per-meal nutritionFit.
    softFit: {
      score: softAssessments.length ? clampScore(softAssessments.reduce((sum, assessment) => sum + assessment.fit, 0) / softAssessments.length) : 0.5,
      coverage: softCoverage,
      requestedTargets: softAssessments.length,
      qualifiedTargets: softAssessments.filter((assessment) => assessment.confidence.complete).length,
    },
  };
}
