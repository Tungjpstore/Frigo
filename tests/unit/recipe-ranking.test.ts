import { describe, expect, it } from 'vitest';
import type { z } from 'zod';
import { generateRecipeCandidates } from '../../packages/recipes/src/candidates';
import { createRecipeCatalog } from '../../packages/recipes/src/catalog';
import { RecipeDefinitionSchema } from '../../packages/recipes/src/foundation';
import { rankRecipeCandidates } from '../../packages/recipes/src/ranking';
import type { RecipeRankingInput } from '../../packages/recipes/src/ranking';
import { RecipeFamilySchema, type RecipeDefinition } from '../../packages/recipes/src/foundation';
import { RankingPreferencesSchema, type RecipeFeedback } from '../../packages/recipes/src/personalization';
import { candidateEvidenceKey, createRankingEvidenceSnapshot } from '../../packages/recipes/src/ranking-evidence';
import { BALANCED_RANKING_PROFILE } from '../../packages/recipes/src/ranking-policy';
import { SubstitutionRuleSchema } from '../../packages/recipes/src/substitutions';

const referenceTime = '2026-09-08T12:00:00.000Z';
const referenceDate = '2026-09-08';
const recipe = RecipeDefinitionSchema.parse({
  id: 'meal', slug: 'meal', title: 'Meal', cuisine: 'japanese', servings: 2,
  cookTimeMinutes: 20, difficulty: 'easy',
  ingredients: [{ ingredientId: 'TOFU', name: 'Tofu', requiredQuantity: 200, unit: 'g' }],
});

const makeRecipe = (id: string, changes: Partial<RecipeDefinition> = {}) => RecipeDefinitionSchema.parse({
  ...recipe, id, slug: id, prepTimeMinutes: 0, ...changes,
});
const lot = (id: string, quantity = 200, changes: Record<string, unknown> = {}) =>
  ({ id, householdId: 'home', ingredientId: 'TOFU', quantity, unit: 'g', ...changes });
const makeGeneration = (recipes = [makeRecipe('meal')], inventory: unknown[] = [lot('lot')], extra = {}) =>
  generateRecipeCandidates({ catalog: createRecipeCatalog({ source: 'provided', ingredientIds: ['TOFU', 'ONION'], recipes }),
    inventory, householdId: 'home', asOfDate: referenceDate, requestedServings: 2, mode: 'shopping_allowed', ...extra });
const run = (generation = makeGeneration(), values: z.input<typeof RankingPreferencesSchema> = {},
  feedback: RecipeFeedback[] = [], extra: Omit<Partial<RecipeRankingInput>, 'evidence'> & { evidence?: readonly unknown[] } = {}) => rankRecipeCandidates({
    generation, referenceDate, referenceTime,
    context: { householdId: 'home', userId: 'user', preferences: [{ householdId: 'home', userId: 'user', values }], feedback },
    ...extra,
    evidence: extra.evidence === undefined ? undefined : createRankingEvidenceSnapshot(generation, () => extra.evidence ?? []),
  });
const event = (type: RecipeFeedback['type'], changes: Partial<RecipeFeedback> = {}): RecipeFeedback => ({
  id: 'event', householdId: 'home', userId: 'user', type, occurredAt: '2026-09-07T12:00:00.000Z',
  target: { kind: 'recipe', id: 'meal' }, ...(type === 'swapped' ? { replacement: { kind: 'recipe' as const, id: 'other' } } : {}), ...changes,
});
const evidence = (gen: ReturnType<typeof makeGeneration>, extra = {}, index = 0) => ({
  candidateId: gen.candidates[index].id, evidenceKey: candidateEvidenceKey(gen.candidates[index]), ...extra,
});
const nutrition = (values = {}, sourceType = 'authoritative', verificationState = 'reviewed') => ({
  profile: { id: 'nutrition', basisQuantity: 1, basisUnit: 'serving', sourceType,
    sourceReference: 'fixture:reviewed-meal', proteinG: 25, ...values }, verificationState,
});

describe('T03 normalized components and cold start', () => {
  it('retains known partial T02 coverage rather than equating 199g with an empty fridge', () => {
    const partial = run(makeGeneration(undefined, [lot('partial', 199)])).ranked[0];
    const empty = run(makeGeneration(undefined, [])).ranked[0];
    expect(partial.components.inventoryFit).toBe(0.995);
    expect(empty.components.inventoryFit).toBe(0);
    expect(partial.finalScore).toBeGreaterThan(empty.finalScore);
  });
  it('ranks full required coverage above otherwise equivalent shopping demand', () => {
    const gen = makeGeneration([makeRecipe('shopping', { ingredients: [{ ...recipe.ingredients[0], ingredientId: 'ONION' }] }), makeRecipe('fridge')]);
    const result = run(gen);
    expect(result.ranked.map((row) => row.candidate.source.sourceId)).toEqual(['fridge', 'shopping']);
    expect(result.ranked.map((row) => row.components.inventoryFit)).toEqual([1, 0]);
    expect(result.ranked[1].components.shoppingBurden).toBe(1);
    expect(result.ranked[1].reasons).toContain('REQUIRES_SHOPPING');
  });

  it('does not score unresolved packs as satisfied or as a fabricated known shopping shortage', () => {
    const result = run(makeGeneration(undefined, [lot('pack', 1, { unit: 'pack' })])).ranked[0];
    expect(result.components.inventoryFit).toBe(0);
    expect(result.components.shoppingBurden).toBe(0);
    expect(result.dataCoverage.availability).toBe(0);
    expect(result.candidate.requirements[0].missingQuantity).toBeNull();
    expect(result.reasons).toContain('AVAILABILITY_UNRESOLVED');
  });

  it('supports cold start with stable canonical tie breaks independent of input order', () => {
    const recipes = ['b', 'a', 'c'].map((id) => makeRecipe(id));
    const rank = (items: RecipeDefinition[]) => rankRecipeCandidates({ generation: makeGeneration(items), referenceDate, referenceTime,
      context: { householdId: 'home', userId: 'user' } });
    expect(rank(recipes).ranked.map((row) => row.candidate.source.sourceId)).toEqual(['a', 'b', 'c']);
    expect(rank(recipes)).toEqual(rank([...recipes].reverse()));
    expect(rank(recipes).ranked[0].reasons).toContain('COLD_START');
  });

  it('does not mutate or recalculate T02 quantities', () => {
    const gen = makeGeneration(undefined, [lot('a', 100), lot('b', 0.15, { unit: 'kg' })]);
    const before = structuredClone(gen);
    const result = run(gen);
    expect(gen).toEqual(before);
    expect(result.ranked[0].candidate).toBe(gen.candidates[0]);
    expect(result.ranked[0].candidate.requirements[0].availableQuantity).toBe(250);
    expect(run(gen)).toEqual(result);
  });

  it('keeps all components, contributions and scores finite in [0,1]', () => {
    for (const stock of [[], [lot('pack', 1, { unit: 'pack' })], [lot('partial', 50)], [lot('full')]]) {
      for (const row of run(makeGeneration(undefined, stock), { preferredTimeMinutes: 1 }).ranked) {
        for (const value of [row.finalScore, ...Object.values(row.components), ...Object.values(row.contributions)]) {
          expect(Number.isFinite(value)).toBe(true);
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(1);
        }
        expect(Object.values(row.contributions).reduce((sum, value) => sum + value, 0)).toBeCloseTo(row.finalScore);
      }
    }
  });

  it.each([-1, NaN, Infinity, 1001])('rejects invalid weight %s', (value) => {
    expect(() => run(undefined, {}, [], { profile: { ...BALANCED_RANKING_PROFILE,
      weights: { ...BALANCED_RANKING_PROFILE.weights, inventoryFit: value } } })).toThrow();
  });

  it('rejects all-zero weights and supports one typed custom profile', () => {
    const weights = { inventoryFit: 0, expiryPriority: 0, preferenceFit: 0, nutritionFit: 0,
      cookingTimeFit: 0, variety: 0, recentMealPenalty: 0, shoppingBurden: 0, substitutionPenalty: 0 };
    expect(() => run(undefined, {}, [], { profile: { ...BALANCED_RANKING_PROFILE, weights } })).toThrow();
    const result = run(undefined, {}, [], { profile: { ...BALANCED_RANKING_PROFILE, id: 'inventory-only',
      weights: { ...weights, inventoryFit: 3 } } });
    expect(result.ranked[0].finalScore).toBe(1);
  });
});

describe('T03 expiry allocation approximation', () => {
  it('keeps estimated and use-by allocation provenance distinct', () => {
    const gen = makeGeneration(undefined, [lot('a', 100, { expiryKind: 'estimated', expiryDate: '2026-09-09' }),
      lot('b', 100, { expiryKind: 'use_by', expiryDate: '2026-09-09' })]);
    expect(run(gen).ranked[0].facts.expiry.kindShares).toEqual({ use_by: 0.5, estimated: 0.5, best_before: 0, unknown: 0 });
  });

  it('does not count repeated lot IDs as whole lots across required and optional demands', () => {
    const gen = makeGeneration([makeRecipe('meal', { ingredients: [{ ...recipe.ingredients[0], requiredQuantity: 100 },
      { ...recipe.ingredients[0], requiredQuantity: 100, isOptional: true }] })],
    [lot('a', 150, { expiryKind: 'use_by', expiryDate: '2026-09-09' })]);
    expect(gen.candidates[0].lotAllocations.map((item) => item.quantity)).toEqual([100, 50]);
    expect(run(gen).ranked[0].components.expiryPriority).toBeCloseTo(6 / 7);
  });
  it('scores soon-expiring usable allocations above nonurgent ones', () => {
    const urgent = run(makeGeneration(undefined, [lot('a', 200, { expiryKind: 'use_by', expiryDate: '2026-09-09' })])).ranked[0];
    const later = run(makeGeneration(undefined, [lot('a', 200, { expiryKind: 'use_by', expiryDate: '2026-10-09' })])).ranked[0];
    expect(urgent.components.expiryPriority).toBeCloseTo(6 / 7);
    expect(urgent.components.expiryPriority).toBeGreaterThan(later.components.expiryPriority);
    expect(urgent.reasons).toContain('USES_EXPIRING_INGREDIENTS');
  });

  it.each([{ freshness: 'expiring' }, { expiryDate: '2026-09-09', expiryKind: 'unknown' }])('keeps unknown expiry nonurgent: %j', (fields) => {
    const row = run(makeGeneration(undefined, [lot('a', 200, fields)])).ranked[0];
    expect(row.components.expiryPriority).toBe(0);
    expect(row.dataCoverage.expiry).toBe(0);
  });

  it('counts only 100g urgent of a 200g requirement, not all 1000g in the fridge', () => {
    const gen = makeGeneration(undefined, [lot('a', 100, { expiryKind: 'use_by', expiryDate: '2026-09-09' }),
      lot('b', 900, { expiryKind: 'use_by', expiryDate: '2026-10-09' })]);
    const row = run(gen).ranked[0];
    expect(row.components.expiryPriority).toBeCloseTo(0.5 * 6 / 7);
    expect(row.candidate.lotAllocations.map((allocation) => allocation.quantity)).toEqual([100, 100]);
  });

  it('does not award urgency for a lot outside the T02 ID-order witness', () => {
    const gen = makeGeneration(undefined, [lot('a', 200), lot('z', 100, { expiryKind: 'use_by', expiryDate: '2026-09-09' })]);
    expect(run(gen).ranked[0].components.expiryPriority).toBe(0);
  });

  it('does not automatically recommend past dates or call past best-before unsafe', () => {
    const bestBefore = run(makeGeneration(undefined, [lot('a', 200, { expiryKind: 'best_before', expiryDate: '2026-09-07' })])).ranked[0];
    expect(bestBefore.components.inventoryFit).toBe(1);
    expect(bestBefore.components.expiryPriority).toBe(0);
    const useBy = run(makeGeneration(undefined, [lot('a', 200, { expiryKind: 'use_by', expiryDate: '2026-09-07' })])).ranked[0];
    expect(useBy.components.inventoryFit).toBe(0);
    expect(useBy.components.expiryPriority).toBe(0);
  });
});

describe('T03 explicit preferences and deterministic feedback', () => {
  it('gives an explicit like a stronger signal than cuisine and ingredient matches', () => {
    const like = run(undefined, {}, [event('liked')]).ranked[0];
    const cuisine = run(undefined, { preferredCuisines: ['japanese'] }).ranked[0];
    expect(like.components.preferenceFit).toBe(1);
    expect(cuisine.components.preferenceFit).toBe(0.75);
    expect(run(undefined, { likedIngredientIds: ['TOFU'] }).ranked[0].components.preferenceFit).toBe(0.75);
  });

  it('dislike is a strong soft penalty, never an allergy-style exclusion', () => {
    const result = run(undefined, { preferredCuisines: ['japanese'], likedIngredientIds: ['TOFU'] }, [event('disliked'), event('cooked', { id: 'cooked' })]);
    expect(result.excluded).toEqual([]);
    expect(result.ranked[0].components.preferenceFit).toBe(0);
    expect(result.ranked[0].reasons).toContain('DISLIKED_RECIPE');
  });

  it('negative cuisine/ingredient intent wins contradictory soft lists', () => {
    const row = run(undefined, { preferredCuisines: ['japanese'], avoidedCuisines: ['japanese'],
      likedIngredientIds: ['TOFU'], dislikedIngredientIds: ['TOFU'] }).ranked[0];
    expect(row.components.preferenceFit).toBe(0);
  });

  it('latest explicit taste wins deterministically, including timestamp ties', () => {
    const events = [event('liked', { id: 'a' }), event('disliked', { id: 'b' })];
    expect(run(undefined, {}, events)).toEqual(run(undefined, {}, [...events].reverse()));
    expect(run(undefined, {}, events).ranked[0].components.preferenceFit).toBe(0);
    expect(run(undefined, {}, [event('liked', { occurredAt: '2020-01-01T00:00:00Z' })]).ranked[0].components.preferenceFit).toBe(1);
  });

  it.each(['skipped', 'swapped'] as const)('%s weakly lowers preference without asserting cooked or dislike', (type) => {
    const row = run(undefined, {}, [event(type)]).ranked[0];
    expect(row.components.preferenceFit).toBeLessThan(0.5);
    expect(row.components.preferenceFit).toBeGreaterThan(0.25);
    expect(row.components.recentMealPenalty).toBe(0);
    expect(row.facts.preference.explicitTaste).toBeNull();
  });

  it('swapped replacement receives no inferred like', () => {
    const gen = makeGeneration([makeRecipe('meal'), makeRecipe('other')]);
    const row = run(gen, {}, [event('swapped')]).ranked.find((item) => item.candidate.source.sourceId === 'other')!;
    expect(row.components.preferenceFit).toBe(0.5);
  });

  it('explicit like overrides weak skips, but not a hard household restriction', () => {
    const feedback = [event('liked'), event('skipped', { id: 'skip' })];
    expect(run(undefined, {}, feedback).ranked[0].components.preferenceFit).toBe(1);
    expect(run(undefined, { forbiddenIngredientIds: ['TOFU'] }, feedback).ranked).toEqual([]);
  });

  it('recent cooked meals decay and never imply liking', () => {
    const recent = run(undefined, {}, [event('cooked')]).ranked[0];
    const older = run(undefined, {}, [event('cooked', { occurredAt: '2026-09-01T12:00:00Z' })]).ranked[0];
    const old = run(undefined, {}, [event('cooked', { occurredAt: '2020-01-01T00:00:00Z' })]).ranked[0];
    expect(recent.components.recentMealPenalty).toBeCloseTo(13 / 14);
    expect(recent.components.recentMealPenalty).toBeGreaterThan(older.components.recentMealPenalty);
    expect(old.components.recentMealPenalty).toBe(0);
    expect(recent.components.preferenceFit).toBe(0.5);
  });

  it('uses max recency rather than duplicate-history accumulation and ignores future events', () => {
    const cooked = event('cooked');
    expect(run(undefined, {}, [cooked]).ranked[0].components).toEqual(
      run(undefined, {}, [cooked, { ...cooked, id: 'duplicate-command' }]).ranked[0].components);
    const future = event('disliked', { occurredAt: '2026-09-09T00:00:00Z' });
    expect(run(undefined, {}, [future]).ranked[0].components.preferenceFit).toBe(0.5);
  });

  it('gives new cuisines weak variety benefits without punishing common ingredients', () => {
    const gen = makeGeneration([makeRecipe('meal'), makeRecipe('new', { cuisine: 'vietnamese' })]);
    const result = run(gen, {}, [event('cooked', { cuisine: 'japanese' })]);
    const recent = result.ranked.find((row) => row.candidate.source.sourceId === 'meal')!;
    const novel = result.ranked.find((row) => row.candidate.source.sourceId === 'new')!;
    expect(novel.components.variety).toBe(1);
    expect(recent.components.variety).toBeLessThan(novel.components.variety);
    expect(novel.components.recentMealPenalty).toBe(0);
  });
});

describe('T03 cooking-time and nutrition fit', () => {
  it('gives 30 minutes full soft fit and 90 minutes one-third fit at a 30-minute preference', () => {
    const gen = makeGeneration([makeRecipe('quick', { cookTimeMinutes: 20, prepTimeMinutes: 10 }), makeRecipe('slow', { cookTimeMinutes: 90 })]);
    const result = run(gen, { preferredTimeMinutes: 30 });
    expect(result.ranked[0].components.cookingTimeFit).toBe(1);
    expect(result.ranked[1].components.cookingTimeFit).toBeCloseTo(1 / 3);
    expect(result.ranked[1].reasons).toContain('COOK_TIME_ABOVE_PREFERENCE');
  });

  it('does not interpret unknown prep time as zero or full-confidence total time', () => {
    const gen = generation();
    expect(run(gen, { preferredTimeMinutes: 30 }).ranked[0].components.cookingTimeFit).toBe(0.75);
    expect(run(gen, { preferredTimeMinutes: 30 }).ranked[0].dataCoverage.cookingTime).toBe(0.5);
    expect(run(gen, { hardMaxTimeMinutes: 30 }).excluded[0].reasons).toContain('COOKING_TIME_UNKNOWN');
  });

  it('hard time constraints exclude rather than score', () => {
    expect(run(makeGeneration([makeRecipe('meal', { cookTimeMinutes: 45 })]), { hardMaxTimeMinutes: 30 }).ranked).toEqual([]);
  });

  it('ranks known meal nutrition fit, without allocating daily targets', () => {
    const gen = makeGeneration([makeRecipe('a'), makeRecipe('b')]);
    const result = run(gen, { mealNutritionTargets: [{ nutrient: 'proteinG', min: 20, max: 30 }] }, [], {
      evidence: [evidence(gen, { nutrition: nutrition({ proteinG: 25 }) }), evidence(gen, { nutrition: nutrition({ proteinG: 5 }) }, 1)],
    });
    expect(result.ranked[0].components.nutritionFit).toBe(1);
    expect(result.ranked[1].components.nutritionFit).toBe(0.25);
  });

  it('keeps absent nutrients unknown and coverage-adjusts the known-only mean', () => {
    const gen = makeGeneration();
    const row = run(gen, { mealNutritionTargets: [{ nutrient: 'proteinG', min: 20, max: 30 }, { nutrient: 'sodiumMg', max: 500 }] }, [], {
      evidence: [evidence(gen, { nutrition: nutrition() })],
    }).ranked[0];
    expect(row.facts.nutrition.perServing.sodiumMg).toBeUndefined();
    expect(row.facts.nutrition.fit.knownFit).toBe(1);
    expect(row.dataCoverage.nutrition).toBe(0.5);
    expect(row.components.nutritionFit).toBe(0.75);
    expect(row.reasons).toContain('NUTRITION_DATA_PARTIAL');
  });

  it('normalizes an explicit serving basis, but never converts mass to servings', () => {
    const gen = makeGeneration();
    const targets = { mealNutritionTargets: [{ nutrient: 'proteinG' as const, min: 20, max: 30 }] };
    const serving = run(gen, targets, [], { evidence: [evidence(gen, { nutrition: nutrition({ basisQuantity: 2, proteinG: 50 }) })] }).ranked[0];
    expect(serving.facts.nutrition.perServing.proteinG).toBe(25);
    const mass = run(gen, targets, [], { evidence: [evidence(gen, { nutrition: nutrition({ basisUnit: 'g', basisQuantity: 100 }) })] }).ranked[0];
    expect(mass.facts.nutrition.perServing).toEqual({});
    expect(mass.components.nutritionFit).toBe(0.5);
  });

  it.each(['missing', 'unverified', 'estimated'] as const)('hard nutrition fails closed for %s data', (mode) => {
    const gen = makeGeneration();
    const ev = mode === 'missing' ? [] : [evidence(gen, { nutrition: nutrition({}, mode === 'estimated' ? 'estimated' : 'authoritative',
      mode === 'unverified' ? 'unverified' : 'reviewed') })];
    const result = run(gen, { mealNutritionTargets: [{ nutrient: 'proteinG', min: 20, max: 30, hard: true }] }, [], { evidence: ev });
    expect(result.ranked).toEqual([]);
    expect(result.excluded[0].reasons).toContain('NUTRITION_UNKNOWN');
  });

  it('qualifies explicitly permitted reviewed estimates and still enforces the hard range', () => {
    const gen = makeGeneration();
    const target = { mealNutritionTargets: [{ nutrient: 'proteinG' as const, min: 20, max: 30, hard: true, allowEstimates: true }] };
    const accepted = run(gen, target, [], { evidence: [evidence(gen, { nutrition: nutrition({}, 'estimated') })] });
    expect(accepted.ranked[0].eligibility.qualifications).toContain('ESTIMATED_NUTRIENT_ACCEPTED:proteinG');
    expect(run(gen, target, [], { evidence: [evidence(gen, { nutrition: nutrition({ proteinG: 5 }, 'estimated') })] }).excluded[0].reasons)
      .toContain('NUTRITION_CONFLICT');
  });

  it('rejects unsupported normalization ranges rather than emitting Infinity', () => {
    const gen = makeGeneration();
    expect(() => run(gen, {}, [], { evidence: [evidence(gen, { nutrition: nutrition({ basisQuantity: Number.MIN_VALUE, proteinG: 1e308 }) })] })).toThrow();
  });
});

describe('T03 safety, ownership and T02 trust boundaries', () => {
  it('rejects raw safe JSON and serialized evidence snapshots at the ranking boundary', () => {
    const gen = makeGeneration();
    const raw = evidence(gen, { safety: [{ kind: 'allergen', key: 'soy', verdict: 'safe', sourceReference: 'client-claim' }] });
    expect(() => rankRecipeCandidates({ generation: gen, referenceDate, referenceTime,
      context: { householdId: 'home', userId: 'user' },
      // @ts-expect-error Raw client evidence is deliberately not a ranking input.
      evidence: [raw],
    })).toThrow(/trusted evidence/);
    const snapshot = createRankingEvidenceSnapshot(gen, () => [raw]);
    expect(() => rankRecipeCandidates({ generation: gen, referenceDate, referenceTime,
      context: { householdId: 'home', userId: 'user' }, evidence: structuredClone(snapshot),
    })).toThrow(/trusted evidence/);
    expect(() => rankRecipeCandidates({ generation: makeGeneration(), referenceDate, referenceTime,
      context: { householdId: 'home', userId: 'user' }, evidence: snapshot,
    })).toThrow(/trusted evidence/);
    expect(() => createRankingEvidenceSnapshot(gen,
      // @ts-expect-error A JSON object cannot install a server evidence provider.
      [raw])).toThrow(/server-owned provider/);
  });

  it('rejects evidence reused after catalog classifications change without changing recipe ID', () => {
    const original = makeGeneration();
    const stale = evidence(original);
    const catalog = createRecipeCatalog({ source: 'provided', ingredientIds: ['TOFU'], recipes: [makeRecipe('meal')],
      classifications: [{ recipeId: 'meal', kind: 'allergen', tag: 'soy' }] });
    const changed = makeGeneration(undefined, undefined, { catalog });
    expect(() => run(changed, {}, [], { evidence: [stale] })).toThrow(/Stale/);
  });
  it.each(['allergen', 'dietary'] as const)('requires explicit matching %s evidence and excludes conflicts before likes', (kind) => {
    const gen = makeGeneration();
    const prefs = kind === 'allergen' ? { allergens: ['soy'] } : { requiredDietaryTags: ['vegetarian'] };
    const key = kind === 'allergen' ? 'soy' : 'vegetarian';
    const safe = evidence(gen, { safety: [{ kind, key, verdict: 'safe', sourceReference: 'review:1' }] });
    expect(run(gen, prefs, [], { evidence: [safe] }).ranked).toHaveLength(1);
    const conflict = evidence(gen, { safety: [{ kind, key, verdict: 'conflict', sourceReference: 'review:2' }] });
    const result = run(gen, prefs, [event('liked')], { evidence: [conflict] });
    expect(result.ranked).toEqual([]);
    expect(result.excluded[0].eligibility.constraints[0].state).toBe('conflict');
    expect(run(gen, prefs).excluded[0].reasons).toContain('SAFETY_UNKNOWN');
  });

  it('does not turn generic catalog tags into safe evidence; allergen assertions block conservatively', () => {
    const catalog = createRecipeCatalog({ source: 'provided', ingredientIds: ['TOFU'], recipes: [recipe],
      classifications: [{ recipeId: 'meal', kind: 'allergen', tag: 'soy' }, { recipeId: 'meal', kind: 'dietary', tag: 'vegetarian' }] });
    const gen = makeGeneration(undefined, undefined, { catalog });
    expect(run(gen, { allergens: ['soy'] }).excluded[0].reasons).toContain('ALLERGEN_CONFLICT');
    expect(run(gen, { requiredDietaryTags: ['vegetarian'] }).excluded[0].reasons).toContain('SAFETY_UNKNOWN');
  });

  it('conflicting reviews always beat safe reviews regardless of order', () => {
    const gen = makeGeneration();
    const safety = [{ kind: 'allergen', key: 'soy', verdict: 'safe', sourceReference: 'r1' },
      { kind: 'allergen', key: 'soy', verdict: 'conflict', sourceReference: 'r2' }];
    for (const rows of [safety, [...safety].reverse()]) {
      expect(run(gen, { allergens: ['soy'] }, [], { evidence: [evidence(gen, { safety: rows })] }).ranked).toEqual([]);
    }
  });

  it('personal soft defaults cannot override household hard constraints', () => {
    const result = run(undefined, {}, [event('liked')], { context: { householdId: 'home', userId: 'user',
      preferences: [{ householdId: 'home', userId: null, values: { forbiddenIngredientIds: ['TOFU'], preferredCuisines: ['vietnamese'] } },
        { householdId: 'home', userId: 'user', values: { preferredCuisines: ['japanese'] } }] } });
    expect(result.ranked).toEqual([]);
  });

  it.each(['household', 'user', 'duplicate'] as const)('fails closed on %s preference scope ambiguity', (kind) => {
    const preference = { householdId: kind === 'household' ? 'other' : 'home', userId: kind === 'user' ? 'other' : 'user', values: {} };
    expect(() => run(undefined, {}, [], { context: { householdId: 'home', userId: 'user',
      preferences: kind === 'duplicate' ? [preference, preference] : [preference] } })).toThrow();
  });

  it('rejects other-household history and other-user tastes but explicitly shares household cooking', () => {
    expect(() => run(undefined, {}, [event('cooked', { householdId: 'other' })])).toThrow();
    expect(() => run(undefined, {}, [event('liked', { userId: 'other' })])).toThrow();
    expect(run(undefined, {}, [event('cooked', { userId: 'other' })]).ranked[0].components.recentMealPenalty).toBeGreaterThan(0);
  });

  it('rejects mismatching or unscoped T02 inventory snapshots and stale dates', () => {
    expect(() => run(makeGeneration(undefined, undefined, { householdId: undefined }))).toThrow();
    expect(() => run(undefined, {}, [], { context: { householdId: 'other', userId: 'user' } })).toThrow();
    expect(() => run(undefined, {}, [], { referenceDate: '2026-09-09' })).toThrow();
  });

  it('rejects serialized or modified T02 candidates rather than trusting client review claims', () => {
    const gen = makeGeneration();
    expect(() => run(structuredClone(gen))).toThrow(/server-generated/);
    gen.candidates[0].coverage.satisfiedRequiredCount = 99;
    expect(() => run(gen)).toThrow(/unmodified/);
  });

  it('rejects stale or duplicate candidate evidence', () => {
    const gen = makeGeneration();
    expect(() => run(gen, {}, [], { evidence: [{ ...evidence(gen), evidenceKey: 'wrong' }] })).toThrow();
    expect(() => run(gen, {}, [], { evidence: [evidence(gen), evidence(gen)] })).toThrow();
  });

  it('keeps never-recommend distinct from a soft dislike', () => {
    expect(run(undefined, { neverRecommendRecipeIds: ['meal'] }).excluded[0].reasons).toContain('NEVER_RECOMMEND');
  });
});

describe('T03 families and substitutions', () => {
  const family = RecipeFamilySchema.parse({ id: 'family', slug: 'family', name: 'Family', baseServings: 2,
    slots: [{ key: 'base', minSelections: 1, maxSelections: 1,
      options: [{ ingredientId: 'TOFU', quantity: 200, unit: 'g' }, { ingredientId: 'ONION', quantity: 200, unit: 'g' }] }] });
  const catalog = createRecipeCatalog({ source: 'provided', ingredientIds: ['TOFU', 'ONION'], recipes: [], families: [family] });

  it('preserves truncated searches and unknown family cooking metadata', () => {
    const gen = makeGeneration([], [], { catalog, maxVariantCandidatesPerFamily: 1 });
    const result = run(gen, { preferredTimeMinutes: 30 });
    expect(result.truncated).toBe(true);
    expect(result.searchExhaustive).toBe(false);
    expect(result.familySearches).toBe(gen.familySearches);
    expect(result.ranked[0].components.cookingTimeFit).toBe(0.5);
    expect(result.ranked[0].reasons).toContain('COOK_TIME_UNKNOWN');
    expect(result.ranked[0].reasons).toContain('SEARCH_TRUNCATED');
  });

  it('keeps empty truncated results without an unsafe fallback', () => {
    const gen = makeGeneration([], [], { catalog, mode: 'cook_now', maxVariantSearchStatesPerFamily: 1 });
    const result = run(gen);
    expect(result.ranked).toEqual([]);
    expect(result.truncated).toBe(true);
  });

  it('uses family identity for weaker novelty across related recipes', () => {
    const related = createRecipeCatalog({ source: 'provided', ingredientIds: ['TOFU', 'ONION'], families: [family],
      recipes: [makeRecipe('meal', { familyId: 'family' }), makeRecipe('new')] });
    const result = run(makeGeneration(undefined, undefined, { catalog: related }), {}, [event('cooked', { target: { kind: 'recipe', id: 'sibling' }, familyId: 'family' })]);
    const row = result.ranked.find((item) => item.candidate.source.sourceId === 'meal')!;
    expect(row.components.recentMealPenalty).toBe(0);
    expect(row.components.variety).toBeCloseTo(1 - 0.5 * 13 / 14);
  });

  const substituted = () => {
    const substitution = SubstitutionRuleSchema.parse({ id: 'sub', scopeType: 'recipe', scopeId: 'meal', scopeVersion: 1,
      fromIngredientId: 'TOFU', toIngredientId: 'ONION', fromUnit: 'g', toUnit: 'g', quantityRatio: 2,
      reason: 'Explicit test adaptation', sourceReference: 'review:sub', verificationState: 'reviewed' });
    return makeGeneration(undefined, [lot('onion', 400, { ingredientId: 'ONION', expiryKind: 'use_by', expiryDate: '2026-09-09' })],
      { substitutions: [substitution], approvedSubstitutionIds: ['sub'] });
  };

  it('makes substitution use transparent and scores only its covered requirement share', () => {
    const row = run(substituted()).ranked[0];
    expect(row.components.substitutionPenalty).toBe(1);
    expect(row.components.inventoryFit).toBe(1);
    expect(row.components.expiryPriority).toBeCloseTo(6 / 7);
    expect(row.reasons).toContain('USES_SUBSTITUTION');
  });

  it('blocks forbidden replacement ingredients and never treats reviewed substitutions as whole-dish safety', () => {
    const gen = substituted();
    expect(run(gen, { forbiddenIngredientIds: ['ONION'] }).excluded[0].reasons).toContain('FORBIDDEN_INGREDIENT');
    expect(run(gen, { allergens: ['soy'] }).excluded[0].reasons).toContain('SAFETY_UNKNOWN');
    expect(candidateEvidenceKey(gen.candidates[0])).not.toEqual(candidateEvidenceKey(makeGeneration().candidates[0]));
  });
});
const generation = () => generateRecipeCandidates({
  catalog: createRecipeCatalog({ source: 'provided', ingredientIds: ['TOFU'], recipes: [recipe] }),
  inventory: [{ id: 'lot', householdId: 'home', ingredientId: 'TOFU', quantity: 200, unit: 'g' }],
  householdId: 'home', asOfDate: referenceDate, requestedServings: 2, mode: 'cook_now',
});

describe('T03 hard eligibility before ranking', () => {
  it('excludes full T02 quantity coverage when an explicit ingredient is forbidden', () => {
    const candidates = generation();
    expect(candidates.candidates[0].canCookWithoutBuying).toBe(true);
    const result = rankRecipeCandidates({ generation: candidates, referenceTime, referenceDate,
      context: { householdId: 'home', userId: 'user',
        preferences: [{ householdId: 'home', userId: null, values: { forbiddenIngredientIds: ['TOFU'] } }] },
    });
    expect(result.ranked).toEqual([]);
    expect(result.excluded[0].reasons).toContain('FORBIDDEN_INGREDIENT');
  });

  it('never treats missing allergen evidence as safe despite full quantity coverage', () => {
    const result = rankRecipeCandidates({ generation: generation(), referenceTime, referenceDate,
      context: { householdId: 'home', userId: 'user',
        preferences: [{ householdId: 'home', userId: null, values: { allergens: ['soy'] } }] },
    });
    expect(result.ranked).toEqual([]);
    expect(result.excluded[0].reasons).toContain('SAFETY_UNKNOWN');
  });
});
