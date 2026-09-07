import { describe, expect, it } from 'vitest';
import { reconcileWeekDatasets, sha256, stableStringify } from '../../scripts/week-reconciliation.mjs';
import type { WeekDatasets } from '../../scripts/week-reconciliation.mjs';

const baseDatasets = (): WeekDatasets => ({
  plans: [{
    id: 'plan_1', household_id: 'household_1', start_date: '2026-09-07', end_date: '2026-09-13',
    status: 'READY', budget_target: null, budget_min: 0, budget_max: 0, currency: 'VND',
    shopping_frequency: 'once', waste_risk: 'LOW', ai_explanation: null,
  }],
  v1_days: [{ id: 'day_1', plan_id: 'plan_1', date: '2026-09-07', day_of_week: 1, day_type: 'cooking' }],
  v2_days: [{ id: 'day_1', plan_id: 'plan_1', date: '2026-09-07', day_of_week: 1, day_type: 'cooking' }],
  v1_slots: [{ id: 'slot_1', day_id: 'day_1', plan_id: 'plan_1', slot_type: 'dinner', status: 'PLANNED', recipe_id: 'r1', servings: 2, notes: null, snapshot_json: null }],
  v2_slots: [{ id: 'slot_1', day_id: 'day_1', plan_id: 'plan_1', slot_type: 'dinner', status: 'PLANNED', recipe_id: 'r1', servings: 2, source: 'AUTO', is_locked: 0, leftover_source_id: null, notes: null, snapshot_json: null }],
  v1_shopping: [],
  v2_shopping: [],
});

describe('Week v1/v2 reconciliation', () => {
  it('reports parity when normalized rows match', () => {
    const report = reconcileWeekDatasets(baseDatasets());
    expect(report.summary).toMatchObject({ totalPlans: 1, parityPlans: 1, mismatchPlans: 0 });
    expect(report.plans[0]).toMatchObject({ planId: 'plan_1', parity: true });
  });

  it('reports orphan rows and content mismatches without mutating input', () => {
    const datasets = baseDatasets();
    datasets.v2_days.push({ id: 'day_orphan', plan_id: 'plan_1', date: '2026-09-08', day_of_week: 2, day_type: 'cooking' });
    datasets.v2_slots[0].servings = 3;
    const report = reconcileWeekDatasets(datasets);
    const plan = report.plans[0];
    expect(plan.parity).toBe(false);
    expect(plan.differences.days.orphanRight).toEqual(['day_orphan']);
    expect(plan.differences.slots.contentMismatch).toEqual(['slot_1']);
    expect(datasets.v2_slots[0].servings).toBe(3);
  });

  it('flags rows whose plan or parent day is missing', () => {
    const datasets = baseDatasets();
    datasets.v2_shopping.push({ id: 'shop_orphan', plan_id: 'missing_plan', ingredient_id: 'TOMATO' });
    datasets.v1_slots.push({ id: 'slot_bad_day', day_id: 'missing_day', plan_id: 'plan_1', slot_type: 'dinner', status: 'PLANNED', servings: 2 });
    const report = reconcileWeekDatasets(datasets);
    expect(report.summary.orphanRows).toBe(2);
    expect(report.orphanRows).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'shop_orphan', reason: 'missing_plan' }),
      expect.objectContaining({ id: 'slot_bad_day', reason: 'missing_day' }),
    ]));
  });

  it('normalizes object key order for deterministic SHA-256 checksums', () => {
    expect(stableStringify({ z: 1, a: { y: 2, x: 3 } })).toBe('{"a":{"x":3,"y":2},"z":1}');
    expect(sha256({ z: 1, a: 2 })).toBe(sha256({ a: 2, z: 1 }));
  });

  it('rejects vacuous parity for materialized plans with no week days', () => {
    const datasets = baseDatasets();
    datasets.v1_days = [];
    datasets.v2_days = [];
    datasets.v1_slots = [];
    datasets.v2_slots = [];
    const report = reconcileWeekDatasets(datasets);
    expect(report.plans[0].parity).toBe(false);
    expect(report.plans[0].projectionIssues).toEqual([
      'v1_missing_days_for_materialized_plan',
      'v2_missing_days_for_materialized_plan',
    ]);
  });
});
