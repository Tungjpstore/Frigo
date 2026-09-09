import { afterEach, describe, expect, it } from 'vitest';
import { readRankingNutrition } from '../../packages/db/src/ranking-nutrition';
import { candidateEvidenceKey } from '../../packages/recipes/src/ranking-evidence';
import { createRecipeCatalog } from '../../packages/recipes/src/catalog';
import { generateRecipeCandidates, type CandidateGenerationResult } from '../../packages/recipes/src/candidates';
import { RecipeDefinitionSchema } from '../../packages/recipes/src/foundation';
import { SqliteD1, type SqliteStatementEvent } from '../helpers/sqlite-d1';

const householdId = 'ranking-home';

function definition(id: string, ingredientId = 'CHICKEN_BREAST') {
  return RecipeDefinitionSchema.parse({
    id,
    slug: id,
    title: id,
    cuisine: 'vietnamese',
    servings: 2,
    cookTimeMinutes: 20,
    difficulty: 'easy',
    ingredients: [{ ingredientId, name: ingredientId, requiredQuantity: 100, unit: 'g' }],
  });
}

function generation(
  id: string,
  options: { source?: 'd1' | 'static'; ingredientIds?: string[]; inventory?: unknown[]; substitutions?: unknown[] } = {},
): CandidateGenerationResult {
  const recipe = definition(id);
  return generateRecipeCandidates({
    catalog: createRecipeCatalog({
      source: options.source ?? 'd1',
      ingredientIds: options.ingredientIds ?? ['CHICKEN_BREAST'],
      recipes: [recipe],
    }),
    inventory: options.inventory ?? [{
      id: `${id}-lot`, householdId, ingredientId: 'CHICKEN_BREAST', quantity: 100, unit: 'g',
    }],
    householdId,
    asOfDate: '2026-09-08',
    requestedServings: 2,
    mode: 'cook_now',
    ...(options.substitutions ? { substitutions: options.substitutions, approvedSubstitutionIds: ['replacement'] } : {}),
  });
}

function familyGeneration(): CandidateGenerationResult {
  return generateRecipeCandidates({
    catalog: createRecipeCatalog({
      source: 'd1',
      ingredientIds: ['CHICKEN_BREAST'],
      recipes: [],
      families: [{
        id: 'ranking-family', slug: 'ranking-family', name: 'Ranking family', baseServings: 2,
        slots: [{ key: 'protein', minSelections: 1, maxSelections: 1, options: [{ ingredientId: 'CHICKEN_BREAST', quantity: 100, unit: 'g' }] }],
      }],
    }),
    inventory: [{ id: 'family-lot', householdId, ingredientId: 'CHICKEN_BREAST', quantity: 100, unit: 'g' }],
    householdId,
    asOfDate: '2026-09-08',
    requestedServings: 2,
    mode: 'cook_now',
  });
}

function addRecipe(db: SqliteD1, id: string, version = 1): void {
  db.seed(`INSERT INTO recipes (id, slug, title, cuisine, cook_time_minutes, servings, difficulty, version)
    VALUES ('${id}', '${id}', '${id}', 'vietnamese', 20, 2, 'easy', ${version});`);
}

function addProfile(db: SqliteD1, id: string, basisUnit: 'serving' | 'g', nutrition = 'protein_g'): void {
  db.seed(`INSERT INTO nutrition_profiles
    (id, basis_quantity, basis_unit, source_type, source_reference, ${nutrition})
    VALUES ('${id}', ${basisUnit === 'serving' ? 2 : 100}, '${basisUnit}', 'calculated', 'fixture:${id}', 30);`);
}

function linkProfile(db: SqliteD1, recipeId: string, version: number, profileId: string): void {
  db.seed(`INSERT INTO recipe_nutrition (recipe_id, recipe_version, nutrition_profile_id)
    VALUES ('${recipeId}', ${version}, '${profileId}');`);
}

describe('bulk ranking nutrition evidence', () => {
  const databases: SqliteD1[] = [];
  const database = (hooks: { beforeBatch?: (statements: readonly SqliteStatementEvent[]) => void } = {}) => {
    const db = new SqliteD1({ hooks });
    databases.push(db);
    return db;
  };

  afterEach(() => { for (const db of databases.splice(0)) db.close(); });

  it('returns partial serving nutrition as unverified soft evidence in one bounded read-only batch', async () => {
    const batches: SqliteStatementEvent[][] = [];
    const db = database({ beforeBatch: (statements) => batches.push([...statements]) });
    const input = generation('ranking-partial');
    addRecipe(db, 'ranking-partial');
    addProfile(db, 'ranking-partial-profile', 'serving');
    linkProfile(db, 'ranking-partial', 1, 'ranking-partial-profile');
    const before = db.query('SELECT * FROM nutrition_profiles ORDER BY id');
    const candidateBefore = JSON.stringify(input);

    const result = await readRankingNutrition(db, input);

    expect(result.diagnostics).toEqual([]);
    expect(result.evidence).toHaveLength(1);
    expect(result.evidence[0]).toMatchObject({
      candidateId: input.candidates[0].id,
      evidenceKey: candidateEvidenceKey(input.candidates[0]),
      safety: [],
      nutrition: { verificationState: 'unverified', profile: {
        id: 'ranking-partial-profile', basisUnit: 'serving', basisQuantity: 2,
        proteinG: 30, sourceReference: 'fixture:ranking-partial-profile',
      } },
    });
    expect(result.evidence[0].nutrition?.profile.energyKcal).toBeUndefined();
    expect(JSON.stringify(input)).toBe(candidateBefore);
    expect(db.query('SELECT * FROM nutrition_profiles ORDER BY id')).toEqual(before);
    expect(batches).toHaveLength(1);
    expect(batches[0]).toHaveLength(1);
    expect(batches[0][0].sql).not.toMatch(/\bIN\s*\(/i);
  });

  it('keeps non-serving profiles unknown rather than applying an arbitrary basis conversion', async () => {
    const db = database();
    const input = generation('ranking-grams');
    addRecipe(db, 'ranking-grams');
    addProfile(db, 'ranking-grams-profile', 'g');
    linkProfile(db, 'ranking-grams', 1, 'ranking-grams-profile');

    await expect(readRankingNutrition(db, input)).resolves.toEqual({
      evidence: [],
      diagnostics: [{
        candidateId: input.candidates[0].id,
        sourceId: 'ranking-grams',
        code: 'NUTRITION_BASIS_UNSUPPORTED',
        profileIds: ['ranking-grams-profile'],
      }],
    });
  });

  it('refuses ambiguous current serving profiles instead of choosing an arbitrary row', async () => {
    const db = database();
    const input = generation('ranking-ambiguous');
    addRecipe(db, 'ranking-ambiguous');
    addProfile(db, 'ranking-profile-b', 'serving');
    addProfile(db, 'ranking-profile-a', 'serving');
    linkProfile(db, 'ranking-ambiguous', 1, 'ranking-profile-b');
    linkProfile(db, 'ranking-ambiguous', 1, 'ranking-profile-a');

    const result = await readRankingNutrition(db, input);

    expect(result.evidence).toEqual([]);
    expect(result.diagnostics).toEqual([{ candidateId: input.candidates[0].id, sourceId: 'ranking-ambiguous',
      code: 'NUTRITION_AMBIGUOUS', profileIds: ['ranking-profile-a', 'ranking-profile-b'] }]);
  });

  it('rejects evidence when the candidate version is stale against the current linked recipe version', async () => {
    const db = database();
    addRecipe(db, 'ranking-stale');
    const input = generation('ranking-stale');
    db.seed("UPDATE recipes SET version = 2 WHERE id = 'ranking-stale'");
    addProfile(db, 'ranking-stale-profile', 'serving');
    linkProfile(db, 'ranking-stale', 2, 'ranking-stale-profile');

    const result = await readRankingNutrition(db, input);

    expect(result.evidence).toEqual([]);
    expect(result.diagnostics).toEqual([{ candidateId: input.candidates[0].id, sourceId: 'ranking-stale',
      code: 'STALE_CANDIDATE_VERSION' }]);
  });

  it('leaves static, family, and substituted candidates unknown without reading their nutrition as trusted evidence', async () => {
    const db = database();
    const staticInput = generation('ranking-static', { source: 'static' });
    const familyInput = familyGeneration();
    const substitutedInput = generation('ranking-substituted', {
      ingredientIds: ['CHICKEN_BREAST', 'PORK_BELLY'],
      inventory: [{ id: 'replacement-lot', householdId, ingredientId: 'PORK_BELLY', quantity: 100, unit: 'g' }],
      substitutions: [{
        id: 'replacement', scopeType: 'recipe', scopeId: 'ranking-substituted', scopeVersion: 1,
        fromIngredientId: 'CHICKEN_BREAST', toIngredientId: 'PORK_BELLY', fromUnit: 'g', toUnit: 'g',
        quantityRatio: 1, reason: 'fixture', sourceReference: 'fixture', verificationState: 'reviewed', compatibleWith: [],
      }],
    });
    expect(substitutedInput.candidates[0].requirements[0].substitutions).toHaveLength(1);

    const [staticResult, familyResult, substitutedResult] = await Promise.all([
      readRankingNutrition(db, staticInput),
      readRankingNutrition(db, familyInput),
      readRankingNutrition(db, substitutedInput),
    ]);

    expect(staticResult).toMatchObject({ evidence: [], diagnostics: [{ code: 'UNSUPPORTED_CANDIDATE_SOURCE' }] });
    expect(familyResult).toMatchObject({ evidence: [], diagnostics: [{ code: 'UNSUPPORTED_CANDIDATE_SOURCE' }] });
    expect(substitutedResult).toMatchObject({ evidence: [], diagnostics: [{ code: 'SUBSTITUTED_CANDIDATE' }] });
  });

  it('requires the unmodified server-generated T02 snapshot', async () => {
    const db = database();
    const input = generation('ranking-immutable');
    input.candidates[0].title = 'mutated';

    await expect(readRankingNutrition(db, input)).rejects.toThrow(
      'Ranking requires an unmodified server-generated T02 snapshot',
    );
  });
});
