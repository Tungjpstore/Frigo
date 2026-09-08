import { describe, expect, it } from 'vitest';
import { generateRecipeCandidates, type CandidateGenerationInput } from '../../packages/recipes/src/candidates';
import { createRecipeCatalog } from '../../packages/recipes/src/catalog';
import { RecipeDefinitionSchema, RecipeFamilySchema, type RecipeDefinition, type RecipeFamily } from '../../packages/recipes/src/foundation';
import { scaleRecipeRequirements } from '../../packages/recipes/src/requirements';
import { SubstitutionRuleSchema } from '../../packages/recipes/src/substitutions';

const ids = ['CHICKEN_BREAST', 'CHICKEN_EGG', 'ONION', 'TOFU', 'RICE'];
const line = (ingredientId = 'CHICKEN_BREAST', quantity = 300, unit: 'g' | 'kg' | 'piece' | 'pack' = 'g', isOptional = false) =>
  ({ ingredientId, name: ingredientId, requiredQuantity: quantity, unit, isOptional });
const recipe = (changes: Partial<RecipeDefinition> = {}): RecipeDefinition => RecipeDefinitionSchema.parse({
  id: 'meal', slug: 'meal', title: 'Test meal', cuisine: 'vietnamese', servings: 2,
  cookTimeMinutes: 20, difficulty: 'easy', ingredients: [line()], ...changes,
});
const catalog = (recipes: RecipeDefinition[] = [recipe()], families: RecipeFamily[] = []) =>
  createRecipeCatalog({ source: 'provided', ingredientIds: ids, recipes, families });
const run = (inventory: readonly unknown[] = [], overrides: Partial<CandidateGenerationInput> = {}) => generateRecipeCandidates({
  catalog: catalog(), inventory, asOfDate: '2026-09-08', requestedServings: 2, mode: 'shopping_allowed', ...overrides,
});
const lot = (id: string, ingredientId: string, quantity: number, unit: 'g' | 'kg' | 'piece' | 'pack' = 'g') =>
  ({ id, ingredientId, quantity, unit });
const rule = (changes = {}) => SubstitutionRuleSchema.parse({
  id: 'tofu-for-chicken', scopeType: 'recipe', scopeId: 'meal', scopeVersion: 1,
  fromIngredientId: 'CHICKEN_BREAST', toIngredientId: 'TOFU', fromUnit: 'g', toUnit: 'g',
  quantityRatio: 2, reason: 'Reviewed test recipe adaptation', sourceReference: 'test-kitchen:adaptation-1',
  verificationState: 'reviewed', compatibleWith: ['allergen:milk-free'], ...changes,
});

function family(): RecipeFamily {
  return RecipeFamilySchema.parse({ id: 'stir-fry', slug: 'stir-fry', name: 'Stir fry', baseServings: 2,
    provenance: { sourceType: 'curated', version: 3, sourceReference: 'test-kitchen:family-1' },
    slots: [
      { key: 'protein', minSelections: 1, maxSelections: 1, options: [
        { ingredientId: 'CHICKEN_BREAST', quantity: 300, unit: 'g' },
        { ingredientId: 'TOFU', quantity: 300, unit: 'g' },
      ] },
      { key: 'garnish', minSelections: 0, maxSelections: 1, options: [{ ingredientId: 'ONION', quantity: 50, unit: 'g' }] },
    ],
  });
}

describe('T02 deterministic recipe candidates', () => {
  it('proves 200 g + 0.15 kg covers a 300 g recipe using both lots', () => {
    const result = run([lot('A', 'CHICKEN_BREAST', 200), lot('B', 'CHICKEN_BREAST', 0.15, 'kg')], { mode: 'cook_now' });
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].requirements[0]).toMatchObject({ status: 'satisfied', availableQuantity: 350, missingQuantity: 0 });
    expect(result.candidates[0].lotAllocations).toMatchObject([{ lotId: 'A', quantity: 200 }, { lotId: 'B', quantity: 0.1, unit: 'kg' }]);
    expect(result.candidates[0].canCookWithoutBuying).toBe(true);
  });

  it('returns the exact partial shortage, not mere ingredient presence', () => {
    const input = [lot('A', 'CHICKEN_BREAST', 100)];
    const result = run(input);
    expect(result.candidates[0].requirements[0]).toMatchObject({ status: 'partial', missingQuantity: 200, coveredQuantity: 100 });
    expect(result.candidates[0].coverage.partialRequiredCount).toBe(1);
    expect(run(input, { mode: 'cook_now' })).toMatchObject({ candidates: [], exclusions: [{ reason: 'required_shortage' }] });
  });

  it('returns full g/piece shortages for an empty fridge in shopping mode, and no cook-now fallback', () => {
    const source = catalog([recipe({ ingredients: [line(), line('CHICKEN_EGG', 2, 'piece')] })]);
    const result = run([], { catalog: source });
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].requirements).toMatchObject([
      { ingredientId: 'CHICKEN_BREAST', status: 'missing', missingQuantity: 300, unit: 'g' },
      { ingredientId: 'CHICKEN_EGG', status: 'missing', missingQuantity: 2, unit: 'piece' },
    ]);
    expect(run([], { catalog: source, mode: 'cook_now' }).candidates).toEqual([]);
    expect(run([], { catalog: catalog([]) }).candidates).toEqual([]);
  });

  it('never invalidates an otherwise cookable recipe solely because optional stock is absent', () => {
    const result = run([lot('A', 'CHICKEN_BREAST', 300)], { mode: 'cook_now',
      catalog: catalog([recipe({ ingredients: [line(), line('ONION', 50, 'g', true)] })]),
    });
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].coverage).toMatchObject({ requiredRequirementCount: 1, satisfiedRequiredCount: 1, optionalRequirementCount: 1, unavailableOptionalCount: 1 });
    expect(result.candidates[0].requirements[1]).toMatchObject({ isOptional: true, status: 'missing', missingQuantity: 50 });
  });

  it('keeps pack uncertainty distinct from a shortage in both modes', () => {
    const inventory = [lot('A', 'CHICKEN_BREAST', 1, 'pack')];
    expect(run(inventory).candidates[0].requirements[0]).toMatchObject({ status: 'unresolved', missingQuantity: null, availableQuantity: 0 });
    expect(run(inventory, { mode: 'cook_now' })).toMatchObject({ candidates: [], exclusions: [{ reason: 'required_unresolved' }] });
  });

  it('scales two servings to four without silently changing units or rounding physical amounts', () => {
    const result = run([], { requestedServings: 4, catalog: catalog([recipe({ ingredients: [line(), line('ONION', 0.1, 'kg')] })]) });
    expect(result.candidates[0].requirements).toMatchObject([
      { ingredientId: 'CHICKEN_BREAST', requiredQuantity: 600, unit: 'g' },
      { ingredientId: 'ONION', requiredQuantity: 0.2, unit: 'kg' },
    ]);
  });

  it('exposes mathematical 1.5-piece scaling explicitly rather than hiding whole-item rounding', () => {
    const source = catalog([recipe({ ingredients: [line('CHICKEN_EGG', 1, 'piece')] })]);
    const result = run([lot('A', 'CHICKEN_EGG', 2, 'piece')], { catalog: source, requestedServings: 3, mode: 'cook_now' });
    expect(result.candidates[0].requirements[0]).toMatchObject({ requiredQuantity: 1.5, fractionalCount: true, countPolicy: 'preserve_fraction', status: 'satisfied' });
    expect(run([lot('A', 'CHICKEN_EGG', 1, 'piece')], { catalog: source, requestedServings: 3 }).candidates[0].requirements[0].missingQuantity).toBe(0.5);
  });

  it.each([0, -1, NaN, Infinity, 1.5, Number.MAX_VALUE])('rejects invalid servings %s rather than defaulting to one', (requestedServings) => {
    expect(() => run([], { requestedServings })).toThrow();
  });

  it('aggregates repeated physical recipe demands before scaling and never double-spends a lot', () => {
    const source = catalog([recipe({ ingredients: [line('CHICKEN_BREAST', 200), line('CHICKEN_BREAST', 0.2, 'kg')] })]);
    const result = run([lot('A', 'CHICKEN_BREAST', 300)], { catalog: source });
    expect(result.candidates[0].requirements).toHaveLength(1);
    expect(result.candidates[0].requirements[0]).toMatchObject({ requiredQuantity: 400, status: 'partial', missingQuantity: 100, sourceLineIndices: [0, 1] });
    expect(run([lot('A', 'CHICKEN_BREAST', 300)], { catalog: source, mode: 'cook_now' }).candidates).toEqual([]);
    const scaled = scaleRecipeRequirements([line('CHICKEN_BREAST', 1), line('CHICKEN_BREAST', 2)], 3, 1);
    expect(scaled[0].requiredQuantity).toBe(1);
  });

  it('gives required demands priority over optional demands using the same stock', () => {
    const result = run([lot('A', 'CHICKEN_BREAST', 350)], { mode: 'cook_now',
      catalog: catalog([recipe({ ingredients: [line('CHICKEN_BREAST', 100, 'g', true), line()] })]),
    });
    expect(result.candidates[0].requirements).toMatchObject([
      { isOptional: false, status: 'satisfied', coveredQuantity: 300 },
      { isOptional: true, status: 'partial', availableQuantity: 50, missingQuantity: 50 },
    ]);
    expect(result.candidates[0].lotAllocations.reduce((sum, allocation) => sum + allocation.quantity, 0)).toBe(350);
  });

  it('uses explicit reviewed, approved, version-scoped replacement ratios and keeps their source trace', () => {
    const substitution = rule();
    const result = run([lot('A', 'CHICKEN_BREAST', 100), lot('B', 'TOFU', 400)], {
      mode: 'cook_now', substitutions: [substitution], approvedSubstitutionIds: [substitution.id],
      activeConstraints: ['allergen:milk-free'],
    });
    const requirement = result.candidates[0].requirements[0];
    expect(requirement).toMatchObject({ status: 'satisfied', availableQuantity: 300, coveredQuantity: 300, missingQuantity: 0 });
    expect(requirement.substitutions).toMatchObject([{ quantity: 400, coveredOriginalQuantity: 200, rule: { id: substitution.id, quantityRatio: 2, sourceReference: 'test-kitchen:adaptation-1' }, lotsUsed: [{ lotId: 'B', quantity: 400 }] }]);
    expect(requirement.direct.status).toBe('partial');
  });

  it('does not invent substitutions or silently apply an unapproved edge', () => {
    const inventory = [lot('A', 'TOFU', 1000)];
    expect(run(inventory).candidates[0].requirements[0].status).toBe('missing');
    const result = run(inventory, { substitutions: [rule()] });
    expect(result.candidates[0].requirements[0]).toMatchObject({ status: 'missing', substitutions: [], substitutionDecisions: [{ reason: 'not_approved' }] });
  });

  it('fails closed when any active dietary/allergen constraint lacks explicit replacement evidence', () => {
    const substitution = rule();
    const result = run([lot('A', 'TOFU', 1000)], { substitutions: [substitution], approvedSubstitutionIds: [substitution.id], activeConstraints: ['allergen:soy-free'] });
    expect(result.candidates[0].requirements[0]).toMatchObject({ status: 'missing', substitutions: [], substitutionDecisions: [{ reason: 'constraint_unverified' }] });
  });

  it.each([{ scopeVersion: 2 }, { scopeId: 'other-recipe' }, { scopeType: 'family' }])('does not apply a rule outside its exact scope: %s', (change) => {
    const substitution = rule(change);
    const result = run([lot('A', 'TOFU', 1000)], { substitutions: [substitution], approvedSubstitutionIds: [substitution.id] });
    expect(result.candidates[0].requirements[0].substitutions).toEqual([]);
  });

  it('reserves all direct required ingredients before allowing substitutes to borrow them', () => {
    const substitution = rule();
    const result = run([lot('A', 'TOFU', 600)], { substitutions: [substitution], approvedSubstitutionIds: [substitution.id],
      catalog: catalog([recipe({ ingredients: [line(), line('TOFU', 300)] })]),
    });
    expect(result.candidates[0].requirements).toMatchObject([
      { ingredientId: 'CHICKEN_BREAST', status: 'partial', coveredQuantity: 150, missingQuantity: 150 },
      { ingredientId: 'TOFU', status: 'satisfied', coveredQuantity: 300 },
    ]);
    expect(result.candidates[0].lotAllocations.reduce((sum, allocation) => sum + allocation.quantity, 0)).toBe(600);
  });

  it('does not borrow a required ingredient for an optional substitution', () => {
    const substitution = rule();
    const result = run([lot('A', 'TOFU', 300)], { substitutions: [substitution], approvedSubstitutionIds: [substitution.id], mode: 'cook_now',
      catalog: catalog([recipe({ ingredients: [line('CHICKEN_BREAST', 300, 'g', true), line('TOFU', 300)] })]),
    });
    expect(result.candidates[0].canCookWithoutBuying).toBe(true);
    expect(result.candidates[0].requirements[1]).toMatchObject({ isOptional: true, status: 'missing', substitutions: [] });
  });

  it('reports unknown replacement stock as unresolved without inventing package conversions', () => {
    const substitution = rule();
    const result = run([lot('A', 'TOFU', 1, 'pack')], { substitutions: [substitution], approvedSubstitutionIds: [substitution.id] });
    expect(result.candidates[0].requirements[0]).toMatchObject({ status: 'unresolved', missingQuantity: null, substitutions: [], substitutionDecisions: [{ reason: 'unknown_stock' }] });
  });

  it('isolates invalid/unreviewed/contextual and duplicate substitution rules with diagnostics', () => {
    const good = rule();
    const substitutions = [
      { ...good, id: 'bad-ratio', quantityRatio: -1 },
      { ...good, id: 'unreviewed', verificationState: 'unverified' },
      { ...good, id: 'contextual', toUnit: 'pack' },
      { ...good, id: 'missing-source', sourceReference: '' },
      good, { ...good, quantityRatio: 3 },
    ];
    const result = run([lot('A', 'TOFU', 1000)], { substitutions, approvedSubstitutionIds: substitutions.map((item) => item.id) });
    expect(result.substitutionDiagnostics).toHaveLength(6);
    expect(result.candidates[0].requirements[0].substitutions).toEqual([]);
  });

  it('rejects substitution identity collisions after catalog ID normalization', () => {
    const first = rule();
    const result = run([lot('A', 'TOFU', 1000)], { substitutions: [first, { ...first, id: ` ${first.id} `, quantityRatio: 1 }], approvedSubstitutionIds: [first.id] });
    expect(result.substitutionDiagnostics.map((diagnostic) => diagnostic.reason)).toEqual(['duplicate_rule', 'duplicate_rule']);
    expect(result.candidates[0].requirements[0].substitutions).toEqual([]);
  });

  it('uses deterministic approved rule ordering with no transitive replacement chain', () => {
    const first = rule({ id: 'a-rule' });
    const second = rule({ id: 'z-rule', quantityRatio: 1 });
    const config = { approvedSubstitutionIds: [first.id, second.id] };
    const inventory = [lot('A', 'TOFU', 600)];
    const a = run(inventory, { ...config, substitutions: [second, first] });
    const b = run(inventory, { ...config, substitutions: [first, second] });
    expect(a).toEqual(b);
    expect(a.candidates[0].requirements[0].substitutions[0].rule.id).toBe('a-rule');
    const chain = rule({ id: 'rice-for-tofu', fromIngredientId: 'TOFU', toIngredientId: 'RICE' });
    expect(run([lot('A', 'RICE', 1000)], { substitutions: [first, chain], approvedSubstitutionIds: [first.id, chain.id] }).candidates[0].requirements[0].status).toBe('missing');
  });

  it('evaluates independent candidates without reserving inventory across recipes or adding ranking', () => {
    const result = run([lot('A', 'CHICKEN_BREAST', 300)], { mode: 'cook_now', catalog: catalog([recipe({ id: 'z-recipe' }), recipe({ id: 'a-recipe' })]) });
    expect(result.candidates.map((item) => item.source.sourceId)).toEqual(['a-recipe', 'z-recipe']);
    for (const candidate of result.candidates) {
      expect(candidate.canCookWithoutBuying).toBe(true);
      expect(candidate).not.toHaveProperty('score');
      expect(candidate).not.toHaveProperty('weeklyPlan');
    }
  });

  it('exposes rescue lot witnesses without an expiry score or reordered consumption strategy', () => {
    const result = run([{ ...lot('A', 'CHICKEN_BREAST', 300), freshness: 'expiring', expiryDate: '2026-09-09', expiryKind: 'use_by' }]);
    expect(result.candidates[0].rescueLotIds).toEqual(['A']);
    expect(result.candidates[0]).not.toHaveProperty('expiryScore');
  });

  it('passes sourced classification facts without claiming a complete dietary/allergy safety assessment', () => {
    const source = createRecipeCatalog({ source: 'provided', ingredientIds: ids, recipes: [recipe()],
      classifications: [{ recipeId: 'meal', kind: 'suitability', tag: 'fridge_rescue' }],
    });
    const result = run([lot('A', 'CHICKEN_BREAST', 300)], { catalog: source });
    expect(result.candidates[0].eligibilityScope).toBe('quantity_only');
    expect(result.candidates[0].classifications).toEqual([{ recipeId: 'meal', kind: 'suitability', tag: 'fridge_rescue' }]);
    expect(result.candidates[0].source.provenance.verificationState).toBe('unverified');
  });

  it('returns valid family candidates with provenance/slot traces and no invented time or instructions', () => {
    const source = catalog([], [family()]);
    const result = run([lot('A', 'TOFU', 300)], { catalog: source, mode: 'cook_now' });
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]).toMatchObject({ source: { kind: 'family', sourceId: 'stir-fry', version: 3, provenance: { sourceReference: 'test-kitchen:family-1' } }, canCookWithoutBuying: true });
    expect(result.candidates[0].variant?.selections).toContainEqual({ slotKey: 'protein', ingredientIds: ['TOFU'] });
    expect(result.candidates[0].variant?.selections).toContainEqual({ slotKey: 'garnish', ingredientIds: [] });
    expect(result.candidates[0]).not.toHaveProperty('cookTimeMinutes');
    expect(result.candidates[0]).not.toHaveProperty('steps');
    expect(run([lot('A', 'TOFU', 300)], { catalog: source, mode: 'cook_now' })).toEqual(result);
  });

  it('shares scaling/substitution arithmetic with families rather than maintaining a second matcher', () => {
    const value = family();
    value.slots = value.slots.filter((slot) => slot.key === 'protein');
    value.slots[0].options = value.slots[0].options.filter((option) => option.ingredientId === 'CHICKEN_BREAST');
    const substitution = rule({ scopeType: 'family', scopeId: value.id, scopeVersion: 3 });
    const result = run([lot('A', 'TOFU', 1200)], { catalog: catalog([], [value]), requestedServings: 4, mode: 'cook_now',
      substitutions: [substitution], approvedSubstitutionIds: [substitution.id],
    });
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].requirements[0]).toMatchObject({ requiredQuantity: 600, status: 'satisfied', substitutions: [{ quantity: 1200 }] });
  });

  it('does not claim no feasible recipe exists when a budget stops before valid inventory-backed combinations', () => {
    const ingredientIds = Array.from({ length: 100 }, (_, index) => `ITEM_${String(index).padStart(2, '0')}`);
    const huge = RecipeFamilySchema.parse({ id: 'huge', slug: 'huge', name: 'Huge', baseServings: 2,
      slots: Array.from({ length: 10 }, (_, index) => ({ key: `slot-${index}`, minSelections: 1, maxSelections: 1,
        options: ingredientIds.map((ingredientId) => ({ ingredientId, quantity: 1, unit: 'g' })),
      })),
    });
    const source = createRecipeCatalog({ source: 'provided', ingredientIds, recipes: [], families: [huge] });
    const input = { catalog: source, mode: 'cook_now' as const, maxVariantSearchStatesPerFamily: 50 };
    const result = run([lot('A', 'ITEM_99', 10)], input);
    expect(result.candidates).toHaveLength(0);
    expect(result.exclusions).toContainEqual({ sourceId: 'huge', sourceKind: 'family', reason: 'search_truncated' });
    expect(result.familySearches[0]).toMatchObject({ truncated: true, exhaustive: false, truncationReason: 'search_state_limit', candidateCount: 0 });
    expect(result.familySearches[0].searchStates).toBeLessThanOrEqual(50);
    expect(run([lot('A', 'ITEM_99', 10)], input)).toEqual(result);
  });

  it('enforces candidate budgets during shopping-mode family generation', () => {
    const result = run([], { catalog: catalog([], [family()]), maxVariantCandidatesPerFamily: 1 });
    expect(result.candidates).toHaveLength(1);
    expect(result.familySearches[0]).toMatchObject({ candidateCount: 1, truncated: true, truncationReason: 'candidate_limit' });
    expect(result.familySearches[0].searchStates).toBeLessThanOrEqual(1024);
  });

  it.each([0, -1, 1.5, 65, Infinity])('validates a candidate budget %s even if no families exist', (maxVariantCandidatesPerFamily) => {
    expect(() => run([], { maxVariantCandidatesPerFamily })).toThrow();
  });

  it('quarantines numeric failures in one recipe/family and still returns valid unrelated recipes', () => {
    const huge = recipe({ id: 'huge-recipe', servings: 1, ingredients: [line('CHICKEN_BREAST', 9e307)] });
    const hugeFamily = family();
    hugeFamily.slots[0].options[0].quantity = 9e307;
    hugeFamily.slots[0].options[0].unit = 'kg';
    const result = run([], { catalog: catalog([huge, recipe()], [hugeFamily]) });
    expect(result.candidates.some((item) => item.source.sourceId === 'meal')).toBe(true);
    expect(result.exclusions).toContainEqual({ sourceId: 'huge-recipe', sourceKind: 'recipe', reason: 'numeric_range' });
    expect(result.exclusions).toContainEqual({ sourceId: hugeFamily.id, sourceKind: 'family', reason: 'numeric_range' });
  });

  it('never publishes rejected sources as candidates', () => {
    const rejectedRecipe = recipe({ provenance: { ...recipe().provenance, verificationState: 'rejected' } });
    const rejectedFamily = family();
    rejectedFamily.provenance.verificationState = 'rejected';
    const result = run([], { catalog: catalog([rejectedRecipe], [rejectedFamily]) });
    expect(result.candidates).toHaveLength(0);
    expect(result.exclusions.map((item) => item.reason)).toEqual(['rejected_source', 'rejected_source']);
  });

  it('exposes invalid source diagnostics instead of inventing a canonical mapping or fallback', () => {
    const source = createRecipeCatalog({ source: 'provided', ingredientIds: ids,
      recipes: [recipe({ ingredients: [line('UNMAPPED')] }), { ...recipe(), servings: 0 }],
      families: [{ ...family(), slots: [{ key: 'bad', minSelections: 2, maxSelections: 1, options: [] }] }],
    });
    const result = run([], { catalog: source });
    expect(result.candidates).toHaveLength(0);
    expect(result.catalogDiagnostics.length).toBeGreaterThan(0);
  });
});
