import { afterEach, describe, expect, it } from 'vitest';
import {
  GeneratedMealPlanPersistenceError,
  createGeneratedMealPlan,
  getGeneratedMealPlan,
  recordCookedGeneratedMealPlanAnnotation,
  updateGeneratedMealPlan,
} from '../../packages/db/src/meal-planning';
import { createBarrier, SqliteD1 } from '../helpers/sqlite-d1';

const HOME_A = 'generated-home-a';
const HOME_B = 'generated-home-b';
const OWNER_A = 'generated-owner-a';
const OWNER_B = 'generated-owner-b';
const MEMBER_A = 'generated-member-a';
const fingerprint = 'a'.repeat(64);
const alternateFingerprint = 'b'.repeat(64);

function payload(data: Record<string, unknown>) {
  return JSON.stringify({ version: 1, data });
}

function createInput(overrides: Partial<Parameters<typeof createGeneratedMealPlan>[2]> = {}) {
  return {
    id: 'generated-plan-a',
    requestKey: 'create-a',
    requestFingerprint: fingerprint,
    intentJson: payload({ slots: ['2026-09-10:dinner:0'] }),
    resultJson: payload({ status: 'feasible' }),
    sourceJson: payload({ snapshot: 'snapshot-a' }),
    ...overrides,
  };
}

function fixture() {
  const db = new SqliteD1();
  db.seed(`
    INSERT INTO users (id) VALUES ('${OWNER_A}'), ('${OWNER_B}'), ('${MEMBER_A}');
    INSERT INTO households (id, name, created_by) VALUES
      ('${HOME_A}', 'Generated A', '${OWNER_A}'),
      ('${HOME_B}', 'Generated B', '${OWNER_B}');
    INSERT INTO household_members (id, household_id, user_id, role) VALUES
      ('generated-owner-member-a', '${HOME_A}', '${OWNER_A}', 'owner'),
      ('generated-member-a', '${HOME_A}', '${MEMBER_A}', 'member'),
      ('generated-owner-member-b', '${HOME_B}', '${OWNER_B}', 'owner');
  `);
  return db;
}

const scopeA = { householdId: HOME_A, userId: OWNER_A };
const scopeB = { householdId: HOME_B, userId: OWNER_B };
const databases: SqliteD1[] = [];

function testDb() {
  const db = fixture();
  databases.push(db);
  return db;
}

afterEach(() => { databases.splice(0).forEach((db) => db.close()); });

describe('T06A generated meal plan persistence', () => {
  it('creates a private plan from server-written opaque envelopes and replays only the same request', async () => {
    const db = testDb();
    const created = await createGeneratedMealPlan(db, scopeA, createInput());
    expect(created).toMatchObject({ replayed: false, plan: { id: 'generated-plan-a', revision: 1 } });
    expect(created.plan.intentJson).toBe('{"data":{"slots":["2026-09-10:dinner:0"]},"version":1}');

    const replayed = await createGeneratedMealPlan(db, scopeA, createInput({ id: 'generated-plan-retry' }));
    expect(replayed).toMatchObject({ replayed: true, plan: { id: 'generated-plan-a', revision: 1 } });
    await expect(createGeneratedMealPlan(db, scopeA, createInput({ id: 'generated-plan-conflict', requestFingerprint: alternateFingerprint })))
      .rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT' });
    expect(db.query('SELECT id FROM generated_meal_plans ORDER BY id')).toEqual([{ id: 'generated-plan-a' }]);
  });

  it('deduplicates concurrent creation retries with the same scoped request key', async () => {
    const db = testDb();
    const barrier = createBarrier(2);
    db.hooks.beforeStatement = async (event) => {
      if (event.method === 'run' && event.sql.startsWith('INSERT INTO generated_meal_plans')) await barrier.wait();
    };
    const results = await Promise.all([
      createGeneratedMealPlan(db, scopeA, createInput({ id: 'generated-plan-concurrent-a', requestKey: 'concurrent-a' })),
      createGeneratedMealPlan(db, scopeA, createInput({ id: 'generated-plan-concurrent-b', requestKey: 'concurrent-a' })),
    ]);
    expect(results.map((result) => result.plan.id)).toEqual([
      'generated-plan-concurrent-a', 'generated-plan-concurrent-a',
    ]);
    expect(results.filter((result) => !result.replayed)).toHaveLength(1);
    expect(db.query('SELECT id FROM generated_meal_plans')).toEqual([{ id: 'generated-plan-concurrent-a' }]);
  });

  it('requires current membership and never discloses a private plan across household or user scopes', async () => {
    const db = testDb();
    await createGeneratedMealPlan(db, scopeA, createInput());
    await expect(getGeneratedMealPlan(db, scopeB, 'generated-plan-a')).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(getGeneratedMealPlan(db, { householdId: HOME_A, userId: MEMBER_A }, 'generated-plan-a'))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(updateGeneratedMealPlan(db, { householdId: HOME_A, userId: OWNER_B }, {
      id: 'generated-plan-a', expectedRevision: 1,
      intentJson: payload({ changed: true }), resultJson: payload({ changed: true }), sourceJson: payload({ changed: true }),
    })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(createGeneratedMealPlan(db, { householdId: HOME_A, userId: OWNER_B }, createInput({ id: 'forbidden-plan', requestKey: 'forbidden' })))
      .rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(await getGeneratedMealPlan(db, scopeA, 'generated-plan-a')).toMatchObject({ revision: 1 });
  });

  it('uses an atomic revision compare-and-swap and rejects stale concurrent writes', async () => {
    const db = testDb();
    await createGeneratedMealPlan(db, scopeA, createInput());
    const barrier = createBarrier(2);
    db.hooks.beforeStatement = async (event) => {
      if (event.method === 'run' && event.sql.startsWith('UPDATE generated_meal_plans')) await barrier.wait();
    };
    const update = (status: string) => updateGeneratedMealPlan(db, scopeA, {
      id: 'generated-plan-a', expectedRevision: 1,
      intentJson: payload({ status }), resultJson: payload({ status }), sourceJson: payload({ status }),
    });
    const results = await Promise.allSettled([update('first'), update('second')]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected').map((result) =>
      result.status === 'rejected' && (result.reason as GeneratedMealPlanPersistenceError).code,
    )).toContain('REVISION_CONFLICT');
    expect(await getGeneratedMealPlan(db, scopeA, 'generated-plan-a')).toMatchObject({ revision: 2 });
  });

  it('guards cooked annotations by the current revision and does not mutate stock or cooked history', async () => {
    const db = testDb();
    await createGeneratedMealPlan(db, scopeA, createInput());
    const beforeInventory = db.query('SELECT * FROM inventory_items ORDER BY id');
    const beforeCooked = db.query('SELECT * FROM cooked_meals ORDER BY id');
    const annotation = await recordCookedGeneratedMealPlanAnnotation(db, scopeA, {
      id: 'generated-cooked-a', planId: 'generated-plan-a', expectedRevision: 1,
      slotId: '2026-09-10:dinner:0', requestKey: 'cooked-a',
    });
    expect(annotation).toMatchObject({ replayed: false, annotation: { eventType: 'cooked', planRevision: 1 } });
    expect(await recordCookedGeneratedMealPlanAnnotation(db, scopeA, {
      id: 'generated-cooked-retry', planId: 'generated-plan-a', expectedRevision: 1,
      slotId: '2026-09-10:dinner:0', requestKey: 'cooked-a',
    })).toMatchObject({ replayed: true, annotation: { id: 'generated-cooked-a' } });
    await updateGeneratedMealPlan(db, scopeA, {
      id: 'generated-plan-a', expectedRevision: 1,
      intentJson: payload({ replacement: true }), resultJson: payload({ replacement: true }), sourceJson: payload({ replacement: true }),
    });
    await expect(recordCookedGeneratedMealPlanAnnotation(db, scopeA, {
      id: 'generated-cooked-stale', planId: 'generated-plan-a', expectedRevision: 1,
      slotId: '2026-09-10:dinner:0', requestKey: 'cooked-stale',
    })).rejects.toMatchObject({ code: 'REVISION_CONFLICT' });
    expect(db.query('SELECT * FROM inventory_items ORDER BY id')).toEqual(beforeInventory);
    expect(db.query('SELECT * FROM cooked_meals ORDER BY id')).toEqual(beforeCooked);
  });

  it('enforces JSON envelopes and cascading membership, user, and household ownership constraints', async () => {
    const db = testDb();
    await expect(createGeneratedMealPlan(db, scopeA, createInput({ intentJson: '{"version":1,"data":[]}' })))
      .rejects.toThrow('intent JSON is invalid');
    await expect(createGeneratedMealPlan(db, scopeA, createInput({ sourceJson: '{"version":2,"data":{}}' })))
      .rejects.toThrow('source JSON is invalid');
    expect(() => db.execute(`INSERT INTO generated_meal_plans
      (id, household_id, creator_user_id, request_key, request_fingerprint, intent_json, result_json, source_json)
      VALUES ('invalid-plan', '${HOME_A}', '${OWNER_A}', 'invalid-json', '${fingerprint}', '{}', '${payload({ ok: true })}', '${payload({ ok: true })}')`)).toThrow();
    expect(() => db.execute(`INSERT INTO generated_meal_plans
      (id, household_id, creator_user_id, request_key, request_fingerprint, intent_json, result_json, source_json)
      VALUES ('invalid-version-plan', '${HOME_A}', '${OWNER_A}', 'invalid-version', '${fingerprint}', '{"version":2,"data":{}}', '${payload({ ok: true })}', '${payload({ ok: true })}')`)).toThrow();
    expect(() => db.execute(`INSERT INTO generated_meal_plans
      (id, household_id, creator_user_id, request_key, request_fingerprint, intent_json, result_json, source_json)
      VALUES ('orphan-plan', '${HOME_A}', '${OWNER_B}', 'orphan', '${fingerprint}', '${payload({ ok: true })}', '${payload({ ok: true })}', '${payload({ ok: true })}')`)).toThrow();

    await createGeneratedMealPlan(db, scopeA, createInput());
    await recordCookedGeneratedMealPlanAnnotation(db, scopeA, {
      id: 'generated-cascade-annotation', planId: 'generated-plan-a', expectedRevision: 1,
      slotId: '2026-09-10:dinner:0', requestKey: 'cascade-a',
    });
    db.seed(`DELETE FROM households WHERE id = '${HOME_A}'`);
    expect(db.query('SELECT * FROM generated_meal_plans')).toEqual([]);
    expect(db.query('SELECT * FROM generated_meal_plan_annotations')).toEqual([]);

    const userCascade = fixture();
    databases.push(userCascade);
    const memberScope = { householdId: HOME_A, userId: MEMBER_A };
    await createGeneratedMealPlan(userCascade, memberScope, createInput({
      id: 'generated-member-plan', requestKey: 'member-plan',
    }));
    userCascade.seed(`DELETE FROM users WHERE id = '${MEMBER_A}'`);
    expect(userCascade.query('SELECT * FROM generated_meal_plans')).toEqual([]);
  });
});
