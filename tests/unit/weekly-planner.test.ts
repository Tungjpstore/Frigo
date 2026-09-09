import { describe, expect, it } from 'vitest';
import { planWeeklyMeals } from '../../packages/recipes/src/weekly-planner';
import type { RecipeCatalogSnapshot } from '../../packages/recipes/src/catalog';
import {
  createPlanningContext,
  planningReference,
  readPlanningContext,
  slotInstant,
} from '../../packages/recipes/src/planner-context';
import { candidateEvidenceKey } from '../../packages/recipes/src/ranking-evidence';
import {
  catalog,
  context,
  dinner,
  HOUSEHOLD_ID,
  lot,
  nutritionEvidence,
  PLANNING_INSTANT,
  recipe,
  request,
  reviewedEvidence,
  USER_ID,
} from '../helpers/planner-fixtures';

const plan = (
  slots: unknown[],
  options: Parameters<typeof context>[0] = {},
  policy: Record<string, unknown> = {},
  requestOptions: Record<string, unknown> = {},
) =>
  planWeeklyMeals({ context: context(options), request: request(slots, requestOptions), policy });
const selectedIds = (result: ReturnType<typeof plan>) =>
  result.slots.map((slot) => slot.ranked.candidate.source.sourceId);

// These cases intentionally exercise public planner contracts, not private search helpers.
describe('T04 weekly planner', () => {
  it('regenerates against sequential projected stock and looks ahead to preserve a locked future meal', () => {
    const chicken300 = recipe('b-light', 'CHICKEN', 300);
    const chicken600 = recipe('a-heavy', 'CHICKEN', 600);
    const result = plan(
      [
        dinner('2026-09-08'),
        dinner('2026-09-09', { lock: { kind: 'recipe', id: 'a-heavy', version: 1 } }),
      ],
      { inventory: [lot({ quantity: 900 })], catalog: catalog([chicken300, chicken600]) },
      { beamWidth: 6 },
    );

    expect(selectedIds(result)).toEqual(['b-light', 'a-heavy']);
    expect(result.slots[0].ranked.rank).toBe(2);
    expect(result.projectedFinalInventory).toMatchObject([
      { id: 'lot-chicken', quantity: 0, consumedQuantity: 900 },
    ]);
    expect(result.status).toBe('feasible');
    const greedy = plan([
      dinner('2026-09-08'), dinner('2026-09-09', { lock: { kind: 'recipe', id: 'a-heavy', version: 1 } }),
    ], { inventory: [lot({ quantity: 900 })], catalog: catalog([chicken300, chicken600]) },
    { beamWidth: 1, candidateLimitPerSlot: 1 });
    expect(greedy.status).toBe('partial');
    expect(greedy.slots[0].ranked.rank).toBe(1);
  });

  it('never spends the same 300 g twice across two pantry-only slots', () => {
    const result = plan([dinner('2026-09-08'), dinner('2026-09-09')], {
      inventory: [lot({ quantity: 500 })],
      catalog: catalog([recipe('chicken-300')]),
    });

    expect(result.slots).toHaveLength(1);
    expect(result.unplannedSlots).toHaveLength(1);
    expect(result.projectedFinalInventory[0]).toMatchObject({
      quantity: 200,
      consumedQuantity: 300,
    });
    expect(result.status).not.toBe('feasible');
  });

  it('replays 1,000 g through ordered 300 g meals as 700 g then 400 g', () => {
    const result = plan([dinner('2026-09-08'), dinner('2026-09-09')], {
      inventory: [lot({ quantity: 1_000 })],
      catalog: catalog([recipe('chicken-300')]),
    });

    expect(result.slots.map((slot) => slot.projectedConsumption[0])).toMatchObject([
      { previousQuantity: 1_000, consumedQuantity: 300, remainingQuantity: 700 },
      { previousQuantity: 700, consumedQuantity: 300, remainingQuantity: 400 },
    ]);
    expect(result.projectedFinalInventory[0]).toMatchObject({
      quantity: 400,
      consumedQuantity: 600,
    });
  });

  it('uses remaining stock once in shopping mode and reports the later meal shortage', () => {
    const result = plan(
      [dinner('2026-09-08'), dinner('2026-09-09')],
      {
        inventory: [lot({ quantity: 300 })],
        catalog: catalog([recipe('chicken-300')]),
      },
      { candidateLimitPerSlot: 4 },
    );

    const shopping = plan(
      [dinner('2026-09-08'), dinner('2026-09-09')],
      {
        inventory: [lot({ quantity: 300 })],
        catalog: catalog([recipe('chicken-300')]),
      },
      { candidateLimitPerSlot: 4 },
      { mode: 'shopping_allowed' },
    );
    expect(result.unplannedSlots).toHaveLength(1);
    expect(shopping.slots).toHaveLength(2);
    expect(shopping.projectedFinalInventory[0]).toMatchObject({
      quantity: 0,
      consumedQuantity: 300,
    });
    expect(shopping.shortages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ingredientId: 'CHICKEN',
          knownMissingQuantity: 300,
          slotIds: ['2026-09-09:dinner:0'],
        }),
      ]),
    );
  });

  it('scales four servings from a two-serving 300 g recipe without rounding fractional count ingredients', () => {
    const meal = recipe('scaled', 'CHICKEN', 300, {
      ingredients: [
        {
          ingredientId: 'CHICKEN',
          name: 'CHICKEN',
          requiredQuantity: 300,
          unit: 'g',
          isOptional: false,
        },
        { ingredientId: 'EGG', name: 'EGG', requiredQuantity: 1, unit: 'piece', isOptional: false },
      ],
    });
    const result = plan([dinner('2026-09-08', { servings: 4 })], {
      inventory: [
        lot({ quantity: 600 }),
        lot({ id: 'eggs', ingredientId: 'EGG', quantity: 2, unit: 'piece' }),
      ],
      catalog: catalog([meal]),
    });

    expect(result.slots[0].projectedConsumption).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ingredientId: 'CHICKEN', consumedQuantity: 600 }),
        expect.objectContaining({ ingredientId: 'EGG', consumedQuantity: 2, unit: 'piece' }),
      ]),
    );
  });

  it('does not choose a recipe with known allergen conflict or unknown evidence under a hard allergy policy', () => {
    const safe = recipe('safe');
    const allergen = recipe('allergen');
    const evidenceProvider = (candidates: Parameters<typeof reviewedEvidence>[0]) =>
      candidates.map((candidate) => ({
        candidateId: candidate.id,
        evidenceKey: candidateEvidenceKey(candidate),
        safety:
          candidate.source.sourceId === 'safe'
            ? [{ kind: 'allergen', key: 'PEANUT', verdict: 'safe', sourceReference: 'fixture' }]
            : [
                {
                  kind: 'allergen',
                  key: 'PEANUT',
                  verdict: 'conflict',
                  sourceReference: 'fixture',
                },
              ],
      }));
    const result = plan([dinner('2026-09-08')], {
      catalog: catalog([safe, allergen]),
      evidenceProvider,
      rankingContext: {
        householdId: HOUSEHOLD_ID,
        userId: USER_ID,
        feedback: [],
        preferences: [
          {
            householdId: HOUSEHOLD_ID,
            userId: null,
            values: {
              allergens: ['PEANUT'],
              preferredCuisines: [],
              avoidedCuisines: [],
              likedIngredientIds: [],
              dislikedIngredientIds: [],
              forbiddenIngredientIds: [],
              neverRecommendRecipeIds: [],
              requiredDietaryTags: [],
              mealNutritionTargets: [],
            },
          },
        ],
      },
    });

    expect(selectedIds(result)).toEqual(['safe']);
  });

  it('fails closed when the only candidate lacks required hard allergen evidence', () => {
    const result = plan([dinner('2026-09-08')], {
      rankingContext: {
        householdId: HOUSEHOLD_ID,
        userId: USER_ID,
        feedback: [],
        preferences: [
          { householdId: HOUSEHOLD_ID, userId: null, values: { allergens: ['PEANUT'] } },
        ],
      },
    });

    expect(result.slots).toEqual([]);
    expect(result.status).toBe('infeasible');
    expect(result.conclusion).toBe('proven_infeasible');
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'SAFETY_UNKNOWN' })]),
    );
  });

  it('enforces known hard slot time but does not invent a time for unknown preparation metadata', () => {
    const quick = recipe('quick', 'CHICKEN', 300, { cookTimeMinutes: 10, prepTimeMinutes: 0 });
    const slow = recipe('slow', 'CHICKEN', 300, { cookTimeMinutes: 80, prepTimeMinutes: 0 });
    const unknown = recipe('unknown', 'CHICKEN', 300, {
      cookTimeMinutes: 0,
      prepTimeMinutes: undefined,
    });
    const constrained = plan([dinner('2026-09-08', { hardMaxTimeMinutes: 20 })], {
      catalog: catalog([quick, slow]),
      inventory: [lot({ quantity: 600 })],
    });
    const unknownResult = plan([dinner('2026-09-08', { hardMaxTimeMinutes: 20 })], {
      catalog: catalog([unknown]),
    });

    expect(selectedIds(constrained)).toEqual(['quick']);
    expect(unknownResult.slots).toHaveLength(0);
  });

  it('honors known meal-type mismatch and applies the configured unknown metadata policy', () => {
    const breakfast = recipe('breakfast');
    const unclassified = recipe('unclassified');
    const strict = plan(
      [dinner('2026-09-08')],
      {
        catalog: catalog(
          [breakfast, unclassified],
          [{ recipeId: 'breakfast', kind: 'meal_type', tag: 'breakfast' }],
        ),
      },
      { unknownMealType: 'exclude' },
    );
    const permissive = plan([dinner('2026-09-08')], {
      catalog: catalog(
        [breakfast, unclassified],
        [{ recipeId: 'breakfast', kind: 'meal_type', tag: 'breakfast' }],
      ),
    });

    expect(strict.slots).toHaveLength(0);
    expect(selectedIds(permissive)).toEqual(['unclassified']);
  });

  it('uses a locked family variant exactly and carries family search truncation metadata forward', () => {
    const family: RecipeCatalogSnapshot['families'][number] = {
      id: 'family',
      slug: 'family',
      name: 'family',
      baseServings: 2,
      provenance: { sourceType: 'curated', verificationState: 'reviewed', version: 1 },
      slots: [
        {
          key: 'protein',
          minSelections: 1,
          maxSelections: 1,
          options: [{ ingredientId: 'CHICKEN', quantity: 300, unit: 'g' }],
        },
      ],
    };
    const supplied = catalog([], [], [family]);
    const variantId = 'family:family:v1:[["CHICKEN","g",300,null]]';
    const result = plan(
      [dinner('2026-09-08', { lock: { kind: 'family', id: 'family', version: 1, variantId } })],
      {
        catalog: supplied,
        inventory: [lot({ quantity: 300 })],
      },
    );

    expect(result.slots[0].ranked.candidate.source).toMatchObject({
      kind: 'family',
      sourceId: 'family',
      version: 1,
    });
    expect(result.search.familySearches).toEqual(
      expect.arrayContaining([expect.objectContaining({ familyId: 'family' })]),
    );
  });

  it('distinguishes a bounded no-plan search from proven infeasibility and retains the best feasible prefix', () => {
    const recipes = [recipe('a', 'CHICKEN', 300), recipe('b', 'CHICKEN', 300)];
    const limited = plan(
      [dinner('2026-09-08'), dinner('2026-09-09')],
      {
        catalog: catalog(recipes),
        inventory: [lot({ quantity: 600 })],
      },
      { maxSearchStates: 2, beamWidth: 1 },
    );
    const impossible = plan([dinner('2026-09-08')], {
      catalog: catalog([recipe('too-much', 'CHICKEN', 600)]),
      inventory: [lot({ quantity: 100 })],
    });

    expect(limited.search.statesExplored).toBeLessThanOrEqual(2);
    expect(limited.conclusion).toBe('no_plan_found_without_proof');
    expect(limited.search.incompleteReasons).toContainEqual({ source: 'planner_search', code: 'MAX_SEARCH_STATES' });
    expect(limited.slots).toHaveLength(1);
    expect(impossible.conclusion).toBe('proven_infeasible');
    expect(impossible.search).toMatchObject({ searchExhaustive: true, truncated: false, limitReasons: [], incompleteReasons: [] });
  });

  it('enforces exact repeat count and minimum gap as hard plan constraints', () => {
    const result = plan(
      [dinner('2026-09-08'), dinner('2026-09-09'), dinner('2026-09-10')],
      {
        inventory: [lot({ quantity: 900 })],
        catalog: catalog([recipe('only')]),
      },
      { maxExactRecipeRepeats: 1, minimumRepeatGap: 2 },
    );

    expect(selectedIds(result)).toEqual(['only']);
    expect(result.unplannedSlots).toHaveLength(2);
  });

  it('uses plan-level repetition utility to vary otherwise equally ranked future meals', () => {
    const result = plan(
      [dinner('2026-09-08'), dinner('2026-09-09')],
      {
        inventory: [
          lot({ quantity: 300 }),
          lot({ id: 'tofu', ingredientId: 'TOFU', quantity: 300 }),
        ],
        catalog: catalog([recipe('chicken'), recipe('tofu', 'TOFU')]),
      },
    );

    expect(selectedIds(result)).toHaveLength(2);
    expect(new Set(selectedIds(result)).size).toBe(2);
    expect(result.slots[1].utility.exactRepetition).toBe(0);
    expect(result.slots[1].reasons).not.toContain('EXACT_RECIPE_REPEATED');
  });

  it('produces deterministic IDs and state caps for input permutations and repeated calls', () => {
    const recipes = [recipe('z'), recipe('a', 'TOFU', 200)];
    const inventory = [
      lot({ id: 'z', quantity: 500 }),
      lot({ id: 'a', ingredientId: 'TOFU', quantity: 500 }),
    ];
    const input = [dinner('2026-09-08'), dinner('2026-09-09')];
    const first = plan(
      input,
      { catalog: catalog(recipes), inventory },
      { beamWidth: 6, maxSearchStates: 100 },
    );
    const second = plan(
      [...input].reverse(),
      { catalog: catalog([...recipes].reverse()), inventory: [...inventory].reverse() },
      { beamWidth: 6, maxSearchStates: 100 },
    );

    expect(selectedIds(first)).toEqual(selectedIds(second));
    expect(first.projectedFinalInventory).toEqual(second.projectedFinalInventory);
    expect(first.search.statesExplored).toBeLessThanOrEqual(100);
  });

  it('validates fixed-offset temporal coherence and rejects past or out-of-range slots', () => {
    const reference = planningReference('2026-09-08T07:00:00+07:00');
    expect(reference.localDate).toBe('2026-09-08');
    expect(slotInstant('2026-09-08', '08:00', reference)).toBe('2026-09-08T01:00:00.000Z');
    expect(() => plan([dinner('2026-09-08', { time: '06:00' })])).toThrow(/precedes/i);
    expect(() => plan([dinner('2026-09-15')], {}, {}, { horizonDays: 1 })).toThrow(/outside/i);
    expect(() =>
      createPlanningContext(
        () =>
          ({
            snapshotId: 'bad',
            referenceInstant: '2026-09-08T07:00:00+07:00',
            inventory: [lot()],
            catalog: catalog([recipe('a')]),
            rankingContext: {
              householdId: HOUSEHOLD_ID,
              userId: USER_ID,
              preferences: [],
              feedback: [],
            },
            evidenceProvider: reviewedEvidence,
          }) as never,
      ),
    ).not.toThrow();
  });

  it('rejects foreign household snapshots and opaque/raw-JSON context spoofing', () => {
    expect(() => context({ inventory: [lot({ householdId: 'foreign' })] })).toThrow(/household/i);
    expect(() =>
      planWeeklyMeals({ context: {} as never, request: request([dinner('2026-09-08')]) }),
    ).toThrow(/trusted context/i);
  });

  it('copies and freezes the source snapshot so later source mutation cannot affect planning', () => {
    const source = {
      snapshotId: 'immutable',
      referenceInstant: '2026-09-08T07:00:00+07:00',
      inventory: [lot({ quantity: 300 })],
      catalog: catalog([recipe('immutable')]),
      rankingContext: { householdId: HOUSEHOLD_ID, userId: USER_ID, preferences: [], feedback: [] },
      evidenceProvider: reviewedEvidence,
    };
    const planningContext = createPlanningContext(() => source);
    source.inventory[0].quantity = 999;
    source.catalog.recipes[0].id = 'mutated';

    expect(Object.isFrozen(readPlanningContext(planningContext))).toBe(true);
    expect(
      planWeeklyMeals({ context: planningContext, request: request([dinner('2026-09-08')]) })
        .slots[0].ranked.candidate.source.sourceId,
    ).toBe('immutable');
  });

  it('preserves all compatible locks during a replan conflict rather than silently replacing them', () => {
    const locked = recipe('locked', 'CHICKEN', 300);
    const result = plan(
      [
        dinner('2026-09-08', { lock: { kind: 'recipe', id: 'locked', version: 1 } }),
        dinner('2026-09-09', { lock: { kind: 'recipe', id: 'locked', version: 1 } }),
      ],
      { catalog: catalog([locked]), inventory: [lot({ quantity: 300 })] },
    );

    expect(selectedIds(result)).toEqual(['locked']);
    expect(result.unplannedSlots[0].lock).toMatchObject({ kind: 'recipe', id: 'locked' });
  });

  it('uses hard daily nutrition minima in lookahead and fails closed for unknown nutrition', () => {
    const low = recipe('a-low');
    const high = recipe('b-high');
    const result = plan(
      [dinner('2026-09-08'), dinner('2026-09-08', { sequence: 1 })],
      {
        catalog: catalog([low, high]),
        inventory: [lot({ quantity: 1000 })],
        evidenceProvider: (candidates) => candidates.flatMap((candidate) =>
          nutritionEvidence({ proteinG: candidate.source.sourceId === 'a-low' ? 20 : 80 })([candidate])),
      },
      { beamWidth: 6 },
      {
        nutritionTargets: [
          {
            period: 'day',
            date: '2026-09-08',
            basis: 'household_total',
            nutrient: 'proteinG',
            min: 280,
            max: 320,
            hard: true,
          },
        ],
      },
    );

    expect(result.status).toBe('feasible');
    expect(selectedIds(result)).toEqual(['b-high', 'b-high']);
    expect(result.slots[0].ranked.rank).toBe(2);
    expect(result.nutrition.assessments[0]).toMatchObject({ status: 'satisfied', knownTotal: 320 });
    const unknown = plan([dinner('2026-09-08')], { evidenceProvider: reviewedEvidence }, {}, {
      nutritionTargets: [{ period: 'day', date: '2026-09-08', basis: 'household_total',
        nutrient: 'proteinG', min: 20, max: 100, hard: true }],
    });
    expect(unknown.slots).toEqual([]);
    expect(unknown.diagnostics.some((issue) => issue.code === 'NUTRITION_UNKNOWN')).toBe(true);
  });

  it('returns versioned final deltas that conserve every projected lot and performs no real inventory writes', () => {
    const original = lot({ quantity: 300, version: 7 });
    const result = plan([dinner('2026-09-08')], {
      inventory: [original],
      catalog: catalog([recipe('one')]),
    });

    expect(result.initialInventorySnapshot[0]).toMatchObject({
      id: original.id,
      version: 7,
      quantity: 300,
      consumedQuantity: 0,
    });
    expect(result.projectedFinalInventory[0]).toMatchObject({
      id: original.id,
      version: 7,
      quantity: 0,
      consumedQuantity: 300,
    });
    expect(original.quantity).toBe(300);
    expect(result.persistence).toBe('generated_only');
  });

  it('orders default meal times at one fixed offset and retains explicit serving decisions', () => {
    const result = plan(
      [
        { date: '2026-09-08', mealType: 'dinner', servings: 3 },
        { date: '2026-09-08', mealType: 'breakfast', servings: 1 },
        { date: '2026-09-08', mealType: 'lunch' },
      ],
      { inventory: [lot({ quantity: 1_200 })], catalog: catalog([recipe('meal')]) },
    );

    expect(result.slots.map(({ mealType, time, instant, servings }) => ({ mealType, time, instant, servings }))).toEqual([
      { mealType: 'breakfast', time: '08:00', instant: '2026-09-08T01:00:00.000Z', servings: 1 },
      { mealType: 'lunch', time: '12:00', instant: '2026-09-08T05:00:00.000Z', servings: 2 },
      { mealType: 'dinner', time: '18:00', instant: '2026-09-08T11:00:00.000Z', servings: 3 },
    ]);
    expect(result.projectedFinalInventory[0]).toMatchObject({ quantity: 300, consumedQuantity: 900 });
  });

  it('rejects an ambiguous lock rather than selecting a related recipe or family variant', () => {
    expect(() =>
      plan([
        dinner('2026-09-08', {
          lock: { kind: 'family', id: 'family', version: 1 },
        }),
      ]),
    ).toThrow(/variant/i);
    expect(() =>
      plan([
        dinner('2026-09-08', {
          lock: { kind: 'recipe', id: 'chicken-300', version: 1, variantId: 'forbidden' },
        }),
      ]),
    ).toThrow(/variant/i);
  });

  it('does not mutate the caller request while normalizing its ordered slots and targets', () => {
    const raw = request(
      [dinner('2026-09-09'), dinner('2026-09-08')],
      {
        nutritionTargets: [
          { period: 'horizon', basis: 'household_total', nutrient: 'proteinG', min: 1, max: 100 },
          { period: 'horizon', basis: 'household_total', nutrient: 'energyKcal', min: 1, max: 100 },
        ],
      },
    );
    const before = structuredClone(raw);

    const result = planWeeklyMeals({ context: context(), request: raw });

    expect(raw).toEqual(before);
    expect(result.request.slots.map((slot) => slot.date)).toEqual(['2026-09-08', '2026-09-09']);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.projectedFinalInventory)).toBe(true);
  });

  it('uses the original opaque snapshot only and cannot be influenced by later context-source mutation', () => {
    const source = {
      snapshotId: 'opaque-copy',
      referenceInstant: PLANNING_INSTANT,
      inventory: [lot({ quantity: 600 })],
      catalog: catalog([recipe('first'), recipe('second')]),
      rankingContext: { householdId: HOUSEHOLD_ID, userId: USER_ID, preferences: [], feedback: [] },
      evidenceProvider: reviewedEvidence,
    };
    const planningContext = createPlanningContext(() => source);
    source.rankingContext.userId = 'other-user';
    source.catalog.recipes.splice(0, source.catalog.recipes.length);
    source.inventory.splice(0, source.inventory.length);

    const result = planWeeklyMeals({ context: planningContext, request: request([dinner('2026-09-08')]) });

    expect(result).toMatchObject({ householdId: HOUSEHOLD_ID, userId: USER_ID });
    expect(selectedIds(result)).toEqual(['first']);
    expect(() => readPlanningContext({} as never)).toThrow(/trusted context/i);
  });

  it('keeps a 21-slot, 100-recipe stress plan bounded and deterministic without wall-clock assertions', () => {
    const recipes = Array.from({ length: 100 }, (_, index) =>
      recipe(`meal-${String(index).padStart(3, '0')}`, 'CHICKEN', 10),
    );
    const slots = Array.from({ length: 7 }, (_, day) =>
      ['breakfast', 'lunch', 'dinner'].map((mealType) => ({
        date: `2026-09-${String(8 + day).padStart(2, '0')}`,
        mealType,
      })),
    ).flat();
    const options = { catalog: catalog(recipes), inventory: [lot({ quantity: 1_000 })] };
    const policy = { beamWidth: 6, candidateLimitPerSlot: 8, maxSearchStates: 200 };
    const first = plan(slots, options, policy);
    const second = plan(slots, options, policy);

    expect(first.search.statesExplored).toBe(200);
    expect(first.search.maxFrontierSize).toBeLessThanOrEqual(6);
    expect(first.search.maxCandidatesConsidered).toBeLessThanOrEqual(8);
    expect(first.search.maxCandidatesGenerated).toBeLessThanOrEqual(80);
    expect(first.search.generationCalls).toBeLessThanOrEqual(200);
    expect(first.search.truncated).toBe(true);
    expect(first.search.limitReasons).toContain('MAX_SEARCH_STATES');
    expect(first.slots.length).toBeLessThanOrEqual(21);
    expect(first.projectedFinalInventory.every((row) => row.quantity >= 0)).toBe(true);
    expect(first).toEqual(second);
    expect(selectedIds(first)).toEqual(selectedIds(second));
  });
});
