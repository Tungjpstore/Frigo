import { afterEach, describe, expect, it } from 'vitest';
import {
  loadRankingContext,
  recordRecipeFeedback,
  saveRankingPreferences,
} from '../../packages/db/src/personalization';
import { SqliteD1 } from '../helpers/sqlite-d1';
import { createRecipeCatalog } from '../../packages/recipes/src/catalog';
import { generateRecipeCandidates } from '../../packages/recipes/src/candidates';
import { rankRecipeCandidates } from '../../packages/recipes/src/ranking';

const HOME_A = 'ranking-home-a';
const HOME_B = 'ranking-home-b';
const OWNER = 'ranking-owner';
const MEMBER = 'ranking-member';
const OTHER = 'ranking-other';
const referenceTime = '2026-09-08T12:00:00.000Z';

function createFixture() {
  const db = new SqliteD1();
  db.seed(`
    INSERT INTO users (id) VALUES ('${OWNER}'), ('${MEMBER}'), ('${OTHER}');
    INSERT INTO households (id, name, created_by) VALUES
      ('${HOME_A}', 'Ranking A', '${OWNER}'), ('${HOME_B}', 'Ranking B', '${OTHER}');
    INSERT INTO household_members (id, household_id, user_id, role) VALUES
      ('ranking-owner-a', '${HOME_A}', '${OWNER}', 'owner'),
      ('ranking-member-a', '${HOME_A}', '${MEMBER}', 'member'),
      ('ranking-owner-b', '${HOME_B}', '${OTHER}', 'owner'),
      ('ranking-member-b', '${HOME_B}', '${MEMBER}', 'member');
    INSERT INTO recipe_families (id, slug, name, base_servings)
      VALUES ('ranking-family', 'ranking-family', 'Ranking family', 2);
    INSERT INTO recipes (id, slug, title, cuisine, cook_time_minutes, servings, difficulty, family_id)
      VALUES
        ('ranking-recipe-a', 'ranking-recipe-a', 'Ranking recipe A', 'vietnamese', 20, 2, 'easy', 'ranking-family'),
        ('ranking-recipe-b', 'ranking-recipe-b', 'Ranking recipe B', 'japanese', 30, 2, 'easy', NULL);
  `);
  return db;
}

describe('T03 ranking personalization persistence', () => {
  const databases: SqliteD1[] = [];
  const fixture = () => {
    const db = createFixture();
    databases.push(db);
    return db;
  };
  afterEach(() => { for (const db of databases.splice(0)) db.close(); });

  it('persisted household A tastes and cooking cannot change household B rankings for the same user', async () => {
    const db = fixture();
    const catalog = createRecipeCatalog({ source: 'provided', ingredientIds: ['TOFU'],
      recipes: ['ranking-recipe-a', 'ranking-recipe-b'].map((id) => ({ id, slug: id, title: id, cuisine: 'vietnamese',
        servings: 2, prepTimeMinutes: 0, cookTimeMinutes: 20, difficulty: 'easy',
        ingredients: [{ ingredientId: 'TOFU', name: 'Tofu', requiredQuantity: 200, unit: 'g' }] })) });
    const rank = async (householdId: string) => {
      const context = await loadRankingContext(db, { householdId, userId: MEMBER }, referenceTime);
      const generation = generateRecipeCandidates({ catalog, householdId, inventory: [],
        asOfDate: '2026-09-08', requestedServings: 2, mode: 'shopping_allowed' });
      return rankRecipeCandidates({ generation, context, referenceDate: '2026-09-08', referenceTime }).ranked;
    };
    const beforeB = await rank(HOME_B);
    await recordRecipeFeedback(db, { householdId: HOME_A, userId: MEMBER }, {
      id: 'isolation-dislike', type: 'disliked', target: { kind: 'recipe', id: 'ranking-recipe-a' }, occurredAt: referenceTime,
    });
    db.seed(`INSERT INTO cooked_meals (id, household_id, user_id, recipe_id, completed_at)
      VALUES ('isolation-cooked', '${HOME_A}', '${OWNER}', 'ranking-recipe-a', '2026-09-08 11:00:00')`);
    const afterA = await rank(HOME_A);
    expect(afterA.map((row) => row.candidate.source.sourceId)).toEqual(['ranking-recipe-b', 'ranking-recipe-a']);
    expect(await rank(HOME_B)).toEqual(beforeB);
  });

  it('authorizes owner-only household defaults and personal writes without accepting payload scope IDs', async () => {
    const db = fixture();
    await expect(saveRankingPreferences(db, { householdId: HOME_A, userId: MEMBER }, {
      scope: 'household', values: { preferredCuisines: ['japanese'] }, updatedAt: referenceTime,
    })).rejects.toThrow('not authorized');

    await expect(saveRankingPreferences(db, { householdId: HOME_A, userId: MEMBER }, {
      scope: 'user', values: { preferredCuisines: ['japanese'] }, updatedAt: referenceTime,
      householdId: HOME_B,
    })).rejects.toThrow();

    await saveRankingPreferences(db, { householdId: HOME_A, userId: OWNER }, {
      scope: 'household', values: { preferredCuisines: ['vietnamese'] }, updatedAt: referenceTime,
    });
    await saveRankingPreferences(db, { householdId: HOME_A, userId: MEMBER }, {
      scope: 'user', values: { preferredCuisines: ['japanese'] }, updatedAt: referenceTime,
    });
    const context = await loadRankingContext(db, { householdId: HOME_A, userId: MEMBER }, referenceTime, 7);
    expect(context.preferences).toEqual([
      { householdId: HOME_A, userId: null, values: expect.objectContaining({ preferredCuisines: ['vietnamese'] }) },
      { householdId: HOME_A, userId: MEMBER, values: expect.objectContaining({ preferredCuisines: ['japanese'] }) },
    ]);
    await expect(loadRankingContext(db, { householdId: HOME_A, userId: OTHER }, referenceTime, 7))
      .rejects.toThrow('not authorized');
  });

  it('rejects direct JSON rows missing required version/value fields and non-UTC timestamps', () => {
    const db = fixture();
    const invalidPreferencePayloads = [
      '{}',
      '{"version":1}',
      '{"values":{}}',
      '{"version":null,"values":{}}',
      '{"version":1,"values":null}',
      '{"version":"1","values":{}}',
      '{"version":1,"values":',
    ];
    for (const valuesJson of invalidPreferencePayloads) {
      expect(() => db.execute(
        'INSERT INTO household_ranking_preferences (household_id, values_json, updated_at) VALUES (?, ?, ?)',
        [HOME_A, valuesJson, referenceTime],
      )).toThrow();
      expect(() => db.execute(
        `INSERT INTO member_ranking_preferences (household_id, user_id, values_json, updated_at)
         VALUES (?, ?, ?, ?)`,
        [HOME_A, MEMBER, valuesJson, referenceTime],
      )).toThrow();
    }
    for (const timestamp of ['2026-09-08 12:00:00', '2026-09-08T12:00:00Z', 'not-a-timestamp']) {
      expect(() => db.execute(
        `INSERT INTO recipe_feedback_events
          (id, household_id, user_id, event_type, target_recipe_id, occurred_at)
         VALUES (?, ?, ?, 'liked', 'ranking-recipe-a', ?)`,
        [`ranking-invalid-time-${timestamp.length}`, HOME_A, MEMBER, timestamp],
      )).toThrow();
    }
    expect(db.query('SELECT * FROM household_ranking_preferences')).toEqual([]);
    expect(db.query('SELECT * FROM member_ranking_preferences')).toEqual([]);
    expect(db.query('SELECT * FROM recipe_feedback_events')).toEqual([]);
  });

  it('keeps users and households isolated, and deletes personal state when membership is removed', async () => {
    const db = fixture();
    await saveRankingPreferences(db, { householdId: HOME_A, userId: MEMBER }, {
      scope: 'user', values: { likedIngredientIds: ['TOFU'] }, updatedAt: referenceTime,
    });
    await saveRankingPreferences(db, { householdId: HOME_B, userId: MEMBER }, {
      scope: 'user', values: { likedIngredientIds: ['CHICKEN_BREAST'] }, updatedAt: referenceTime,
    });
    await recordRecipeFeedback(db, { householdId: HOME_A, userId: MEMBER }, {
      id: 'ranking-like-a', type: 'liked', target: { kind: 'recipe', id: 'ranking-recipe-a' }, occurredAt: referenceTime,
    });
    await recordRecipeFeedback(db, { householdId: HOME_B, userId: MEMBER }, {
      id: 'ranking-like-b', type: 'liked', target: { kind: 'recipe', id: 'ranking-recipe-b' }, occurredAt: referenceTime,
    });

    expect((await loadRankingContext(db, { householdId: HOME_A, userId: MEMBER }, referenceTime, 7)).feedback)
      .toHaveLength(1);
    expect((await loadRankingContext(db, { householdId: HOME_B, userId: MEMBER }, referenceTime, 7)).preferences[0])
      .toMatchObject({ values: { likedIngredientIds: ['CHICKEN_BREAST'] } });

    db.seed(`DELETE FROM household_members WHERE household_id = '${HOME_A}' AND user_id = '${MEMBER}'`);
    expect(db.query('SELECT * FROM member_ranking_preferences WHERE household_id = ?', HOME_A)).toEqual([]);
    expect(db.query('SELECT * FROM recipe_feedback_events WHERE household_id = ?', HOME_A)).toEqual([]);
    db.seed(`INSERT INTO household_members (id, household_id, user_id, role)
      VALUES ('ranking-member-a-rejoined', '${HOME_A}', '${MEMBER}', 'member')`);
    expect((await loadRankingContext(db, { householdId: HOME_A, userId: MEMBER }, referenceTime, 7)).preferences).toEqual([]);
  });

  it('is idempotent only for an exact feedback retry and rejects conflicting IDs', async () => {
    const db = fixture();
    const input = {
      id: 'ranking-feedback-id', type: 'swapped' as const,
      target: { kind: 'recipe' as const, id: 'ranking-recipe-a' },
      replacement: { kind: 'family' as const, id: 'ranking-family' }, occurredAt: referenceTime,
    };
    const first = await recordRecipeFeedback(db, { householdId: HOME_A, userId: MEMBER }, input);
    const replay = await recordRecipeFeedback(db, { householdId: HOME_A, userId: MEMBER }, input);
    expect(replay).toEqual(first);
    expect(db.query('SELECT id FROM recipe_feedback_events')).toHaveLength(1);
    db.seed(`INSERT INTO cooked_meals (id, household_id, user_id, recipe_id, servings_cooked, completed_at)
      VALUES ('ranking-feedback-id', '${HOME_A}', '${OWNER}', 'ranking-recipe-a', 2, '2026-09-08 11:00:00')`);
    const context = await loadRankingContext(db, { householdId: HOME_A, userId: MEMBER }, referenceTime, 7);
    expect(context.feedback.map((item) => item.id).sort()).toEqual([
      'cooked:ranking-feedback-id', 'feedback:ranking-feedback-id',
    ]);
    await expect(recordRecipeFeedback(db, { householdId: HOME_A, userId: MEMBER }, {
      ...input, type: 'skipped', replacement: undefined,
    })).rejects.toThrow('conflicts');
    await expect(recordRecipeFeedback(db, { householdId: HOME_B, userId: MEMBER }, {
      ...input, id: 'ranking-feedback-id', target: { kind: 'recipe', id: 'ranking-recipe-b' }, replacement: undefined, type: 'skipped',
    })).rejects.toThrow('not authorized or conflicts');
    await expect(recordRecipeFeedback(db, { householdId: HOME_A, userId: MEMBER }, {
      id: 'ranking-unknown-target', type: 'liked', target: { kind: 'recipe', id: 'missing-recipe' }, occurredAt: referenceTime,
    })).rejects.toThrow();
  });

  it('projects current durable tastes, recent personal feedback, and household cooked history in one batch', async () => {
    const db = fixture();
    await recordRecipeFeedback(db, { householdId: HOME_A, userId: MEMBER }, {
      id: 'ranking-like-old', type: 'liked', target: { kind: 'recipe', id: 'ranking-recipe-a' }, occurredAt: '2020-01-01T00:00:00.000Z',
    });
    await recordRecipeFeedback(db, { householdId: HOME_A, userId: MEMBER }, {
      id: 'ranking-like-durable', type: 'liked', target: { kind: 'recipe', id: 'ranking-recipe-b' }, occurredAt: '2020-01-01T00:00:00.000Z',
    });
    await recordRecipeFeedback(db, { householdId: HOME_A, userId: MEMBER }, {
      id: 'ranking-dislike-new', type: 'disliked', target: { kind: 'recipe', id: 'ranking-recipe-a' }, occurredAt: referenceTime,
    });
    await recordRecipeFeedback(db, { householdId: HOME_A, userId: MEMBER }, {
      id: 'ranking-like-future', type: 'liked', target: { kind: 'recipe', id: 'ranking-recipe-a' }, occurredAt: '2026-09-09T12:00:00.000Z',
    });
    await recordRecipeFeedback(db, { householdId: HOME_A, userId: MEMBER }, {
      id: 'ranking-skip-boundary', type: 'skipped', target: { kind: 'family', id: 'ranking-family' }, occurredAt: '2026-09-01T12:00:00.000Z',
    });
    await recordRecipeFeedback(db, { householdId: HOME_A, userId: MEMBER }, {
      id: 'ranking-swap-recent', type: 'swapped', target: { kind: 'recipe', id: 'ranking-recipe-b' },
      replacement: { kind: 'recipe', id: 'ranking-recipe-a' }, occurredAt: '2026-09-08T11:00:00.000Z',
    });
    await recordRecipeFeedback(db, { householdId: HOME_A, userId: MEMBER }, {
      id: 'ranking-skip-old', type: 'skipped', target: { kind: 'recipe', id: 'ranking-recipe-b' }, occurredAt: '2026-08-30T12:00:00.000Z',
    });
    db.seed(`
      INSERT INTO cooked_meals (id, household_id, user_id, recipe_id, servings_cooked, completed_at) VALUES
        ('ranking-cooked-recent', '${HOME_A}', '${OWNER}', 'ranking-recipe-a', 2, '2026-09-08 10:00:00'),
        ('ranking-cooked-old', '${HOME_A}', '${OWNER}', 'ranking-recipe-b', 2, '2026-08-30 12:00:00');
    `);
    let batchSize = 0;
    db.hooks.beforeBatch = async (statements) => { batchSize = statements.length; };
    const context = await loadRankingContext(db, { householdId: HOME_A, userId: MEMBER }, referenceTime, {
      historyWindowDays: 14, feedbackWindowDays: 7,
    });
    expect(batchSize).toBe(6);
    expect(context.feedback.map((item) => item.id).sort()).toEqual([
      'cooked:ranking-cooked-old', 'cooked:ranking-cooked-recent', 'feedback:ranking-dislike-new',
      'feedback:ranking-like-durable', 'feedback:ranking-skip-boundary', 'feedback:ranking-skip-old',
      'feedback:ranking-swap-recent',
    ]);
    expect(context.feedback.some((item) => item.id === 'feedback:ranking-like-future')).toBe(false);
    expect(new Set(context.feedback.map((item) => item.type))).toEqual(
      new Set(['liked', 'disliked', 'cooked', 'skipped', 'swapped']),
    );
    expect(context.feedback.find((item) => item.id === 'cooked:ranking-cooked-recent')).toMatchObject({
      type: 'cooked', target: { kind: 'recipe', id: 'ranking-recipe-a' }, familyId: 'ranking-family', cuisine: 'vietnamese',
      occurredAt: '2026-09-08T10:00:00.000Z',
    });
  });

  it('fails closed for D1 batch failures and malformed persisted preference data without touching cooked or inventory state', async () => {
    const db = fixture();
    const beforeCooked = db.query('SELECT * FROM cooked_meals ORDER BY id');
    const beforeInventory = db.query('SELECT * FROM inventory_items ORDER BY id');
    await recordRecipeFeedback(db, { householdId: HOME_A, userId: MEMBER }, {
      id: 'ranking-no-cook-mutation', type: 'liked', target: { kind: 'recipe', id: 'ranking-recipe-a' }, occurredAt: referenceTime,
    });
    expect(db.query('SELECT * FROM cooked_meals ORDER BY id')).toEqual(beforeCooked);
    expect(db.query('SELECT * FROM inventory_items ORDER BY id')).toEqual(beforeInventory);

    db.seed(`INSERT INTO household_ranking_preferences (household_id, values_json, updated_at)
      VALUES ('${HOME_A}', '{"version":1,"values":{"preferredCuisines":"not-an-array"}}', '${referenceTime}')`);
    await expect(loadRankingContext(db, { householdId: HOME_A, userId: MEMBER }, referenceTime, 7))
      .rejects.toThrow('preference JSON is invalid');

    const unavailable = fixture();
    unavailable.hooks.beforeBatch = async () => { throw new Error('D1 unavailable'); };
    await expect(loadRankingContext(unavailable, { householdId: HOME_A, userId: MEMBER }, referenceTime, 7))
      .rejects.toThrow('D1 unavailable');

    const nonUtcCooked = fixture();
    nonUtcCooked.seed(`INSERT INTO cooked_meals
      (id, household_id, user_id, recipe_id, servings_cooked, completed_at)
      VALUES ('ranking-cooked-nonutc', '${HOME_A}', '${OWNER}', 'ranking-recipe-a', 2, '2026-09-08T10:00:00+07:00')`);
    await expect(loadRankingContext(nonUtcCooked, { householdId: HOME_A, userId: MEMBER }, referenceTime, 7))
      .rejects.toThrow('cooked history timestamp is not explicit UTC');

    const malformedCooked = fixture();
    malformedCooked.seed(`INSERT INTO cooked_meals
      (id, household_id, user_id, recipe_id, servings_cooked, completed_at)
      VALUES ('ranking-cooked-invalid', '${HOME_A}', '${OWNER}', 'ranking-recipe-a', 2, '2026-02-30 10:00:00')`);
    await expect(loadRankingContext(malformedCooked, { householdId: HOME_A, userId: MEMBER }, referenceTime, 365))
      .rejects.toThrow('cooked history timestamp is not explicit UTC');
  });
});
