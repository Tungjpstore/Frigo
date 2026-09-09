import { describe, expect, it } from 'vitest';
import type { RankedRecipeCandidate } from '../../packages/recipes/src/ranking';
import {
  parsePeriodNutritionTargets,
  summarizePlanNutrition,
  type PlannerNutritionMeal,
} from '../../packages/recipes/src/planner-nutrition';

const ranked = (perServing: Record<string, number> = {}, verificationState: 'reviewed' | 'unverified' | 'unknown' = 'reviewed',
  sourceType: 'authoritative' | 'estimated' = 'authoritative'): RankedRecipeCandidate => ({
  facts: { nutrition: { perServing, verificationState, profile: { sourceType } } },
} as unknown as RankedRecipeCandidate);

const meal = (date: string, servings: number, perServing: Record<string, number> = {},
  verificationState: 'reviewed' | 'unverified' | 'unknown' = 'reviewed', sourceType: 'authoritative' | 'estimated' = 'authoritative'):
  PlannerNutritionMeal => ({ date, servings, ranked: ranked(perServing, verificationState, sourceType) });

const targets = (input: unknown) => parsePeriodNutritionTargets(input);

describe('plan-level nutrition aggregation', () => {
  it('reports daily known totals without requiring daily targets and keeps unfilled days pending', () => {
    const result = summarizePlanNutrition([
      meal('2026-09-08', 2, { energyKcal: 400 }),
      meal('2026-09-09', 1, {}),
    ], [], ['2026-09-09', '2026-09-10']);
    expect(result.byDay).toMatchObject([
      { date: '2026-09-08', plannedMeals: 1, pending: false, nutrients: { energyKcal: { knownTotal: 800 } } },
      { date: '2026-09-09', plannedMeals: 1, pending: true, nutrients: { energyKcal: { knownTotal: null, unknownMeals: 1 } } },
      { date: '2026-09-10', plannedMeals: 0, pending: true },
    ]);
    expect(result.pendingDates).toEqual(['2026-09-09', '2026-09-10']);
  });
  it('adds reviewed daily nutrient contributions using servings', () => {
    const result = summarizePlanNutrition([
      meal('2026-09-08', 2, { proteinG: 10 }),
      meal('2026-09-08', 3, { proteinG: 5 }),
    ], targets([{ period: 'day', date: '2026-09-08', basis: 'household_total', nutrient: 'proteinG', min: 35, max: 35 }]));

    expect(result.nutrients.proteinG).toMatchObject({ knownTotal: 35, knownMeals: 2, unknownMeals: 0, reviewedMeals: 2, coverage: 1 });
    expect(result.assessments[0]).toMatchObject({ knownTotal: 35, qualifiedTotal: 35, status: 'satisfied', fit: 1 });
  });

  it('aggregates horizon totals across dates without dividing a daily target', () => {
    const result = summarizePlanNutrition([
      meal('2026-09-08', 2, { energyKcal: 400 }),
      meal('2026-09-09', 1, { energyKcal: 300 }),
    ], targets([{ period: 'horizon', basis: 'household_total', nutrient: 'energyKcal', min: 1100, max: 1100 }]));

    expect(result.assessments[0]).toMatchObject({ knownTotal: 1100, status: 'satisfied' });
  });

  it('uses exact Quantity arithmetic while accumulating decimal contributions', () => {
    const result = summarizePlanNutrition([
      meal('2026-09-08', 1, { fiberG: 0.1 }),
      meal('2026-09-09', 1, { fiberG: 0.1 }),
      meal('2026-09-10', 1, { fiberG: 0.1 }),
    ], targets([{ period: 'horizon', basis: 'household_total', nutrient: 'fiberG', min: 0.3, max: 0.3 }]));

    expect(result.nutrients.fiberG.knownTotal).toBe(0.3);
    expect(result.assessments[0]).toMatchObject({ qualifiedTotal: 0.3, status: 'satisfied' });
  });

  it('does not convert a missing nutrient dimension into a zero total', () => {
    const result = summarizePlanNutrition([
      meal('2026-09-08', 1, { proteinG: 0 }),
      meal('2026-09-08', 1, { proteinG: 10 }),
    ], targets([{ period: 'horizon', basis: 'household_total', nutrient: 'fiberG', min: 1, max: 100, hard: true }]));

    expect(result.nutrients.proteinG.knownTotal).toBe(10);
    expect(result.nutrients.fiberG).toMatchObject({ knownTotal: null, knownMeals: 0, unknownMeals: 2, coverage: 0 });
    expect(result.assessments[0]).toMatchObject({ status: 'unknown', code: 'NUTRITION_UNKNOWN', knownTotal: null, canPrune: true });
  });

  it('preserves a reviewed known zero separately from unknown nutrition', () => {
    const result = summarizePlanNutrition([meal('2026-09-08', 2, { sodiumMg: 0 })],
      targets([{ period: 'day', date: '2026-09-08', basis: 'household_total', nutrient: 'sodiumMg', min: 0, max: 0, hard: true }]));

    expect(result.nutrients.sodiumMg).toMatchObject({ knownTotal: 0, knownMeals: 1, unknownMeals: 0 });
    expect(result.assessments[0]).toMatchObject({ knownTotal: 0, qualifiedTotal: 0, status: 'satisfied' });
  });

  it('prunes unreviewed hard nutrition before the period is closed', () => {
    const result = summarizePlanNutrition([meal('2026-09-08', 1, { proteinG: 20 }, 'unverified')],
      targets([{ period: 'day', date: '2026-09-08', basis: 'household_total', nutrient: 'proteinG', max: 50, hard: true }]), ['2026-09-08']);

    expect(result.assessments[0]).toMatchObject({ status: 'unknown', code: 'NUTRITION_UNKNOWN', canPrune: true });
    expect(result.hardPruning.shouldPrune).toBe(true);
  });

  it('reports a known hard maximum excess even when another meal is unreviewed', () => {
    const result = summarizePlanNutrition([
      meal('2026-09-08', 1, { sodiumMg: 60 }),
      meal('2026-09-08', 1, { sodiumMg: 10 }, 'unverified'),
    ], targets([{ period: 'day', date: '2026-09-08', basis: 'household_total', nutrient: 'sodiumMg', max: 50, hard: true }]), ['2026-09-08']);

    expect(result.assessments[0]).toMatchObject({ status: 'violated', code: 'NUTRITION_MAX', knownTotal: 70, canPrune: true });
  });

  it('accepts reviewed estimates only when the exact target opts in', () => {
    const meals = [meal('2026-09-08', 1, { proteinG: 20 }, 'reviewed', 'estimated')];
    const optedIn = summarizePlanNutrition(meals,
      targets([{ period: 'horizon', basis: 'household_total', nutrient: 'proteinG', min: 20, max: 20, hard: true, allowEstimates: true }]));
    const notOptedIn = summarizePlanNutrition(meals,
      targets([{ period: 'horizon', basis: 'household_total', nutrient: 'proteinG', min: 20, max: 20, hard: true }]));

    expect(optedIn.assessments[0]).toMatchObject({ status: 'satisfied', qualifiedTotal: 20 });
    expect(notOptedIn.assessments[0]).toMatchObject({ status: 'unknown', code: 'NUTRITION_UNKNOWN', canPrune: true });
  });

  it('keeps a hard minimum pending until all requested daily slots are filled', () => {
    const policy = targets([{ period: 'day', date: '2026-09-08', basis: 'household_total', nutrient: 'proteinG', min: 10, max: 100, hard: true }]);
    const meals = [meal('2026-09-08', 1, { proteinG: 5 })];

    const pending = summarizePlanNutrition(meals, policy, ['2026-09-08']);
    const closed = summarizePlanNutrition(meals, policy);
    expect(pending.assessments[0]).toMatchObject({ status: 'pending', canPrune: false });
    expect(closed.assessments[0]).toMatchObject({ status: 'violated', code: 'NUTRITION_MIN', canPrune: true });
  });

  it('uses coverage-qualified period fit for soft goals without adding the T03 meal fit', () => {
    const result = summarizePlanNutrition([
      meal('2026-09-08', 1, { proteinG: 20 }),
      meal('2026-09-08', 1, { proteinG: 20 }, 'unverified'),
    ], targets([{ period: 'horizon', basis: 'household_total', nutrient: 'proteinG', min: 20, max: 20 }]));

    expect(result.assessments[0]).toMatchObject({ status: 'unknown', fit: 0.75,
      confidence: { coverage: 1, qualifiedCoverage: 0.5, complete: false } });
    expect(result.softFit).toMatchObject({ score: 0.75, coverage: 0.5, requestedTargets: 1, qualifiedTargets: 0 });
  });

  it('prunes a hard maximum as soon as known contributions exceed it', () => {
    const result = summarizePlanNutrition([meal('2026-09-08', 2, { sodiumMg: 600 })],
      targets([{ period: 'horizon', basis: 'household_total', nutrient: 'sodiumMg', min: 0, max: 1000, hard: true }]), ['2026-09-09']);

    expect(result.assessments[0]).toMatchObject({ status: 'violated', code: 'NUTRITION_MAX', knownTotal: 1200, canPrune: true });
  });

  it('rejects absent daily target dates and invalid numeric ranges', () => {
    expect(() => targets([{ period: 'day', basis: 'household_total', nutrient: 'proteinG', max: 10 }])).toThrow(/require a date/);
    expect(() => targets([{ period: 'horizon', basis: 'household_total', nutrient: 'proteinG', min: 11, max: 10 }])).toThrow(/reversed/);
    expect(() => targets([{ period: 'horizon', basis: 'household_total', nutrient: 'proteinG', min: Number.NaN, max: 10 }])).toThrow();
    expect(() => targets([{ period: 'horizon', basis: 'household_total', nutrient: 'proteinG', max: Number.POSITIVE_INFINITY }])).toThrow();
  });

  it('freezes parsed targets and bounds the target count', () => {
    const parsed = targets([{ period: 'horizon', basis: 'household_total', nutrient: 'proteinG', max: 10 }]);
    expect(Object.isFrozen(parsed)).toBe(true);
    expect(Object.isFrozen(parsed[0])).toBe(true);
    expect(() => targets(Array.from({ length: 29 }, (_, index) => ({
      period: 'horizon', basis: 'household_total', nutrient: 'proteinG', max: index + 1,
    })))).toThrow();
  });
});
