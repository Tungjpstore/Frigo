import { describe, expect, it } from 'vitest';
import { createPlanningContext } from '../../packages/recipes/src/planner-context';
import { planWeeklyMeals } from '../../packages/recipes/src/weekly-planner';
import { candidateEvidenceKey } from '../../packages/recipes/src/ranking-evidence';
import { SubstitutionRuleSchema } from '../../packages/recipes/src/substitutions';
import { catalog, context, dinner, lot, nutritionEvidence, recipe, request, HOUSEHOLD_ID, USER_ID } from '../helpers/planner-fixtures';

describe('T04 contract and review regressions', () => {
  it('returns the best complete plan already found when the state budget is reached', () => {
    const result = planWeeklyMeals({ context: context({ catalog: catalog([recipe('a'), recipe('b'), recipe('c')]) }),
      request: request([dinner('2026-09-08')]), policy: { maxSearchStates: 2 } });
    expect(result.status).toBe('feasible');
    expect(result.conclusion).toBe('feasible');
    expect(result.slots).toHaveLength(1);
    expect(result.search).toMatchObject({ statesExplored: 2, truncated: true, plannerSearchExhaustive: false });
    expect(result.search.limitReasons).toContain('MAX_SEARCH_STATES');
    expect(result.search.incompleteReasons).toEqual([{ source: 'planner_search', code: 'MAX_SEARCH_STATES' }]);
  });

  it('reports incomplete catalog data without claiming a search limit or proven infeasibility', () => {
    const result = planWeeklyMeals({ context: context({ catalog: catalog([recipe('invalid', 'CHICKEN', 300, { servings: 0 })]) }),
      request: request([dinner('2026-09-08')]) });
    expect(result).toMatchObject({ status: 'incomplete', conclusion: 'no_plan_found_without_proof', slots: [] });
    expect(result.search).toMatchObject({ searchExhaustive: false, plannerSearchExhaustive: true,
      recipeSearchExhaustive: false, truncated: false, statesExplored: 1, limitReasons: [],
      incompleteReasons: [{ source: 'catalog', code: 'CATALOG_DATA_INCOMPLETE' }] });
    expect(result.catalogDiagnostics).toContainEqual(expect.objectContaining({ code: 'invalid_recipe' }));
    expect(result.diagnostics).toContainEqual({ slotId: null, code: 'NO_PLAN_FOUND_WITHOUT_PROOF', count: 1 });
    expect(result.diagnostics.some((issue) => issue.code.includes('SEARCH_LIMIT'))).toBe(false);
  });

  it('preserves T02 family traversal limits separately from planner search limits', () => {
    const supplied = catalog([], [], [{ id: 'family', slug: 'family', name: 'family', baseServings: 2,
      provenance: { sourceType: 'curated', verificationState: 'reviewed', version: 1 },
      slots: [{ key: 'protein', minSelections: 1, maxSelections: 1,
        options: [{ ingredientId: 'CHICKEN', quantity: 300, unit: 'g' }] }] }]);
    const result = planWeeklyMeals({ context: context({ catalog: supplied }), request: request([dinner('2026-09-08')]),
      policy: { variantSearchStatesPerFamily: 1 } });
    expect(result).toMatchObject({ status: 'search_limited', conclusion: 'no_plan_found_without_proof', slots: [] });
    expect(result.search).toMatchObject({ searchExhaustive: false, plannerSearchExhaustive: true,
      recipeSearchExhaustive: false, truncated: true, limitReasons: ['T02_SEARCH_STATE_LIMIT'],
      incompleteReasons: [{ source: 'recipe_search', code: 'T02_SEARCH_STATE_LIMIT' }] });
    expect(result.search.familySearches).toContainEqual(expect.objectContaining({ familyId: 'family',
      maxStatesPerCall: 1, candidateCount: 0, truncated: true, exhaustive: false }));
  });

  it('preserves simultaneous catalog incompleteness, catalog caps and planner caps deterministically', () => {
    const input = { context: context({ catalog: catalog([recipe('a'), recipe('b'), recipe('invalid', 'CHICKEN', 300, { servings: 0 })]) }),
      request: request([dinner('2026-09-08')]), policy: { recipeLimit: 1, maxSearchStates: 1 } };
    const result = planWeeklyMeals(input);
    expect(result).toMatchObject({ status: 'search_limited', conclusion: 'no_plan_found_without_proof' });
    expect(result.search).toMatchObject({ statesExplored: 1, generationCalls: 0, truncated: true,
      plannerSearchExhaustive: false, recipeSearchExhaustive: false,
      limitReasons: ['CATALOG_RECIPE_LIMIT', 'MAX_SEARCH_STATES'], incompleteReasons: [
        { source: 'catalog', code: 'CATALOG_DATA_INCOMPLETE' },
        { source: 'planner_search', code: 'MAX_SEARCH_STATES' },
        { source: 'recipe_search', code: 'CATALOG_RECIPE_LIMIT' },
      ] });
    expect(planWeeklyMeals(input)).toEqual(result);
  });

  it.each(['substitution', 'numeric'] as const)('preserves %s incompleteness without inventing a computational limit', (source) => {
    const options = source === 'numeric'
      ? { inventory: [], catalog: catalog([recipe('huge', 'CHICKEN', 9e307, { servings: 1 })]) }
      : { inventory: [], substitutions: [SubstitutionRuleSchema.parse({ id: 'unknown-replacement', scopeType: 'recipe',
        scopeId: 'chicken-300', scopeVersion: 1, fromIngredientId: 'CHICKEN', toIngredientId: 'TOFU',
        fromUnit: 'g', toUnit: 'g', quantityRatio: 1, reason: 'Reviewed fixture', sourceReference: 'fixture', verificationState: 'reviewed' })] };
    const result = planWeeklyMeals({ context: context(options), request: request([dinner('2026-09-08')]) });
    const reason = source === 'numeric' ? { source: 'candidate', code: 'T02_NUMERIC_RANGE' }
      : { source: 'substitution', code: 'SUBSTITUTION_UNKNOWN_INGREDIENT' };
    expect(result).toMatchObject({ status: 'incomplete', conclusion: 'no_plan_found_without_proof', slots: [] });
    expect(result.search).toMatchObject({ truncated: false, plannerSearchExhaustive: true, recipeSearchExhaustive: false,
      limitReasons: [], incompleteReasons: [reason] });
    expect(result.search.rejections).toContainEqual(expect.objectContaining({ code: reason.code }));
  });

  it('keeps zero-evidence nutrition neutral without support reasons, including an empty future target period', () => {
    const result = planWeeklyMeals({ context: context(), request: request([dinner('2026-09-08')], {
      nutritionTargets: [{ period: 'horizon', basis: 'household_total', nutrient: 'proteinG', min: 10, max: 100 }],
    }) });
    expect(result.nutrition.softFit).toEqual({ score: 0.5, coverage: 0, requestedTargets: 1, qualifiedTargets: 0 });
    expect(result.utility.components.nutritionBalance).toBe(0.04);
    expect(result.nutrition.nutrients.proteinG).toMatchObject({ knownTotal: null, knownMeals: 0, unknownMeals: 1 });
    expect(result.slots[0].reasons).not.toContain('NUTRITION_BALANCE_SUPPORT');

    const futureTarget = planWeeklyMeals({ context: context(), request: request([dinner('2026-09-08'), dinner('2026-09-09')], {
      nutritionTargets: [{ period: 'day', date: '2026-09-09', basis: 'household_total', nutrient: 'proteinG', max: 100 }],
    }) });
    expect(futureTarget.slots[0].utility.nutritionBalance).toBe(0.08);
    expect(futureTarget.slots.every((slot) => !slot.reasons.includes('NUTRITION_BALANCE_SUPPORT'))).toBe(true);
    expect(futureTarget.nutrition.assessments[0].knownTotal).toBeNull();
  });

  it('does not explain partial nutrition evidence with below-neutral fit as positive support', () => {
    const result = planWeeklyMeals({ context: context({ evidenceProvider: nutritionEvidence({ proteinG: 0 }) }),
      request: request([dinner('2026-09-08')], { nutritionTargets: [
        { period: 'horizon', basis: 'household_total', nutrient: 'proteinG', min: 20, max: 40 },
        { period: 'horizon', basis: 'household_total', nutrient: 'energyKcal', min: 100, max: 200 },
      ] }) });
    expect(result.nutrition.softFit).toEqual({ score: 0.25, coverage: 0.5, requestedTargets: 2, qualifiedTargets: 1 });
    expect(result.nutrition.nutrients.proteinG.knownTotal).toBe(0);
    expect(result.nutrition.nutrients.energyKcal.knownTotal).toBeNull();
    expect(result.slots[0].utility.nutritionBalance).toBeGreaterThan(0);
    expect(result.slots[0].reasons).not.toContain('NUTRITION_BALANCE_SUPPORT');
  });

  it('explains above-neutral nutrition fit supported by a qualified target covering the selected meal', () => {
    const result = planWeeklyMeals({ context: context({ evidenceProvider: nutritionEvidence({ proteinG: 20 }) }),
      request: request([dinner('2026-09-08')], { nutritionTargets: [
        { period: 'horizon', basis: 'household_total', nutrient: 'proteinG', min: 30, max: 50 },
      ] }) });
    expect(result.status).toBe('feasible');
    expect(result.nutrition.softFit).toEqual({ score: 1, coverage: 1, requestedTargets: 1, qualifiedTargets: 1 });
    expect(result.nutrition.nutrients.proteinG.knownTotal).toBe(40);
    expect(result.slots[0].reasons).toContain('NUTRITION_BALANCE_SUPPORT');
  });

  it('uses soft slot cooking time for ranking without excluding a locked slower meal', () => {
    const source = context({ catalog: catalog([
      recipe('fast', 'CHICKEN', 300, { prepTimeMinutes: 0, cookTimeMinutes: 20 }),
      recipe('slow', 'CHICKEN', 300, { prepTimeMinutes: 0, cookTimeMinutes: 50 }),
    ]) });
    const preferred = planWeeklyMeals({ context: source, request: request([dinner('2026-09-08', { preferredTimeMinutes: 20 })]) });
    expect(preferred.slots[0].ranked.candidate.source.sourceId).toBe('fast');
    const locked = planWeeklyMeals({ context: source, request: request([dinner('2026-09-08', {
      preferredTimeMinutes: 20, lock: { kind: 'recipe', id: 'slow', version: 1 },
    })]) });
    expect(locked.status).toBe('feasible');
    expect(locked.slots[0].ranked.reasons).toContain('COOK_TIME_ABOVE_PREFERENCE');
  });

  it('does not invent a shopping shortage from an unresolved required package conversion', () => {
    const result = planWeeklyMeals({ context: context({ inventory: [lot({ quantity: 1, unit: 'pack' })] }),
      request: request([dinner('2026-09-08')], { mode: 'shopping_allowed' }) });
    expect(result.slots).toEqual([]);
    expect(result.diagnostics.some((issue) => issue.code === 'UNRESOLVED_QUANTITY')).toBe(true);
    expect(result.shortages).toEqual([]);
    expect(result.projectedFinalInventory[0].quantity).toBe(1);
  });

  it('keeps a rejected nutrition alternative out of a feasible plan diagnostics', () => {
    const result = planWeeklyMeals({ context: context({
      inventory: [lot({ quantity: 2000 })], catalog: catalog([recipe('high'), recipe('low')]),
      evidenceProvider: (candidates) => candidates.map((candidate) => ({ candidateId: candidate.id,
        evidenceKey: candidateEvidenceKey(candidate), nutrition: { verificationState: 'reviewed',
          profile: { id: 'profile', basisUnit: 'serving', basisQuantity: 1, sourceType: 'authoritative',
            sourceReference: 'reviewed fixture', proteinG: candidate.source.sourceId === 'high' ? 100 : 25 } } })),
    }), request: request([
      dinner('2026-09-08', { lock: { kind: 'recipe', id: 'high', version: 1 } }),
      dinner('2026-09-08', { sequence: 1, time: '19:00' }),
    ], { nutritionTargets: [{ period: 'day', date: '2026-09-08', basis: 'household_total', nutrient: 'proteinG', max: 300, hard: true }] }) });
    expect(result.status).toBe('feasible');
    expect(result.slots.map((slot) => slot.ranked.candidate.source.sourceId)).toEqual(['high', 'low']);
    expect(result.diagnostics.some((issue) => issue.code === 'NUTRITION_MAX')).toBe(false);
    expect(result.search.rejections.some((issue) => issue.code === 'NUTRITION_MAX')).toBe(true);
  });

  it('freezes actual history at the planning reference rather than admitting future feedback', () => {
    const result = planWeeklyMeals({ context: context({ catalog: catalog([recipe('a'), recipe('z')]),
      rankingContext: { householdId: HOUSEHOLD_ID, userId: USER_ID, feedback: [{ id: 'future',
        householdId: HOUSEHOLD_ID, userId: USER_ID, type: 'liked', target: { kind: 'recipe', id: 'z' },
        occurredAt: '2026-09-09T00:00:00Z' }] },
    }), request: request([dinner('2026-09-10')]) });
    expect(result.slots[0].ranked.candidate.source.sourceId).toBe('a');
    expect(result.slots[0].ranked.reasons).not.toContain('LIKED_RECIPE');
    expect(result.slots[0].ranked.dataCoverage.preferences).toBe(0);
  });

  it('never loosens household hard time when a slot or personal soft preference asks for more', () => {
    const result = planWeeklyMeals({ context: context({ catalog: catalog([recipe('slow', 'CHICKEN', 300, { prepTimeMinutes: 10, cookTimeMinutes: 50 })]),
      rankingContext: { householdId: HOUSEHOLD_ID, userId: USER_ID, preferences: [
        { householdId: HOUSEHOLD_ID, userId: null, values: { hardMaxTimeMinutes: 30 } },
        { householdId: HOUSEHOLD_ID, userId: USER_ID, values: { preferredTimeMinutes: 90 } },
      ] },
    }), request: request([dinner('2026-09-08', { hardMaxTimeMinutes: 100, preferredTimeMinutes: 100 })]) });
    expect(result.status).toBe('infeasible');
    expect(result.diagnostics.some((issue) => issue.code === 'COOKING_TIME_LIMIT')).toBe(true);
  });

  it('rejects inventory outside the existing T02 numeric contract at the context boundary', () => {
    expect(() => context({ inventory: [lot({ quantity: 1e308 })] })).toThrow();
    expect(() => context({ inventory: [lot({ quantity: 0 })] })).not.toThrow();
  });

  it('rejects oversized trusted preloads before searching', () => {
    const source = catalog([recipe('meal')]);
    source.recipes = Array.from({ length: 501 }, () => source.recipes[0]);
    expect(() => context({ catalog: source })).toThrow('catalog input limit');
  });

  it('retains locked catalog sources outside the ordinary deterministic breadth cap', () => {
    const result = planWeeklyMeals({ context: context({ catalog: catalog([recipe('a'), recipe('b'), recipe('z')]) }),
      request: request([dinner('2026-09-08', { lock: { kind: 'recipe', id: 'z', version: 1 } })]), policy: { recipeLimit: 1 } });
    expect(result.status).toBe('feasible');
    expect(result.slots[0].ranked.candidate.source.sourceId).toBe('z');
    expect(result.search.recipeSearchExhaustive).toBe(false);
    expect(result.search.limitReasons).toContain('CATALOG_RECIPE_LIMIT');
  });

  it('does not silently update a locked recipe version', () => {
    const result = planWeeklyMeals({ context: context(),
      request: request([dinner('2026-09-08', { lock: { kind: 'recipe', id: 'chicken-300', version: 2 } })]) });
    expect(result.status).toBe('infeasible');
    expect(result.unplannedSlots[0].reasons).toContain('LOCK_UNAVAILABLE');
  });

  it('conserves mixed native units over seven actual T02/T03 regenerations', () => {
    const result = planWeeklyMeals({ context: context({ inventory: [lot({ id: 'a-g', quantity: 200 }), lot({ id: 'b-kg', quantity: 0.5, unit: 'kg' })],
      catalog: catalog([recipe('meal', 'CHICKEN', 100)]),
    }), request: request(Array.from({ length: 7 }, (_, index) => dinner(`2026-09-${String(8 + index).padStart(2, '0')}`))) });
    expect(result.status).toBe('feasible');
    expect(result.search.generationCalls).toBe(7);
    expect(result.projectedFinalInventory).toMatchObject([
      { id: 'a-g', initialQuantity: 200, consumedQuantity: 200, quantity: 0 },
      { id: 'b-kg', initialQuantity: 0.5, consumedQuantity: 0.5, quantity: 0 },
    ]);
  });

  it('preserves optional unresolved facts as null rather than a zero shopping requirement', () => {
    const definition = recipe('meal');
    definition.ingredients.push({ ingredientId: 'ONION', name: 'Onion', requiredQuantity: 50, unit: 'g', isOptional: true });
    const result = planWeeklyMeals({ context: context({ catalog: catalog([definition]), inventory: [lot(),
      lot({ id: 'onion', ingredientId: 'ONION', quantity: 1, unit: 'pack' })] }), request: request([dinner('2026-09-08')]) });
    expect(result.status).toBe('feasible');
    expect(result.shortages).toMatchObject([{ ingredientId: 'ONION', isOptional: true,
      knownMissingQuantity: 0, totalMissingQuantity: null, unresolvedCount: 1 }]);
    expect(result.slots[0].shortages[0].missingQuantity).toBeNull();
  });

  it('requires substitution compatibility for household safety constraints before whole-dish review', () => {
    const sourceCatalog = catalog([recipe('meal')]);
    sourceCatalog.ingredientIds.push('TOFU');
    const rule = SubstitutionRuleSchema.parse({ id: 'swap', scopeType: 'recipe', scopeId: 'meal', scopeVersion: 1,
      fromIngredientId: 'CHICKEN', toIngredientId: 'TOFU', fromUnit: 'g', toUnit: 'g', quantityRatio: 1,
      reason: 'Reviewed swap', sourceReference: 'fixture:swap', verificationState: 'reviewed', compatibleWith: ['milk'] });
    const make = (compatibleWith: string[]) => context({ catalog: sourceCatalog,
      inventory: [lot({ ingredientId: 'TOFU' })], substitutions: [{ ...rule, compatibleWith }], approvedSubstitutionIds: ['swap'],
      rankingContext: { householdId: HOUSEHOLD_ID, userId: USER_ID, preferences: [
        { householdId: HOUSEHOLD_ID, userId: null, values: { allergens: ['milk'] } },
      ] }, evidenceProvider: (candidates) => candidates.map((candidate) => ({ candidateId: candidate.id,
        evidenceKey: candidateEvidenceKey(candidate), safety: [{ kind: 'allergen', key: 'milk', verdict: 'safe', sourceReference: 'exact dish fixture' }] })),
    });
    const denied = planWeeklyMeals({ context: make(['milk']), request: request([dinner('2026-09-08')]) });
    expect(denied.status).toBe('infeasible');
    const allowed = planWeeklyMeals({ context: make(['allergen:milk']), request: request([dinner('2026-09-08')]) });
    expect(allowed.status).toBe('feasible');
    expect(allowed.slots[0].ranked.candidate.requirements[0].substitutions[0].rule.id).toBe('swap');
  });

  it('does not accept leftover scheduling or a client object disguised as the server provider', () => {
    expect(() => planWeeklyMeals({ context: context(),
      request: request([dinner('2026-09-08')], { leftovers: 'enabled' as never }) })).toThrow();
    expect(() => createPlanningContext({} as never)).toThrow('server-owned');
  });
});
