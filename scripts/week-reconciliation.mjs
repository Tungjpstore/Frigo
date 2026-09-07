import { createHash } from 'node:crypto';

const DATASETS = ['plans', 'v1_days', 'v2_days', 'v1_slots', 'v2_slots', 'v1_shopping', 'v2_shopping'];

function parseSnapshot(raw) {
  if (typeof raw !== 'string' || raw.length === 0) return {};
  try {
    const value = JSON.parse(raw);
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function bool(value) {
  return value === true || value === 1 || value === '1';
}

function normalizeDayOfWeek(value, date) {
  const numeric = Number(value);
  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 7) return numeric;
  if (numeric === 0) return 7;
  const names = {
    sunday: 7, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
  };
  if (typeof value === 'string' && names[value.trim().toLowerCase()]) return names[value.trim().toLowerCase()];
  const parsed = new Date(`${date}T00:00:00Z`).getUTCDay();
  return parsed === 0 ? 7 : parsed;
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
  }
  return value;
}

export function stableStringify(value) {
  return JSON.stringify(stableValue(value));
}

export function sha256(value) {
  return createHash('sha256').update(stableStringify(value)).digest('hex');
}

function canonicalPlan(row) {
  return {
    id: row.id,
    householdId: row.household_id,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    budgetTargetVnd: row.budget_target === null ? null : finiteNumber(row.budget_target, null),
    budgetMinVnd: finiteNumber(row.budget_min),
    budgetMaxVnd: finiteNumber(row.budget_max),
    currency: row.currency || 'VND',
    shoppingFrequency: row.shopping_frequency || 'once',
    wasteRisk: String(row.waste_risk || 'LOW').toUpperCase(),
    aiExplanation: row.ai_explanation || null,
  };
}

function canonicalDay(row) {
  return {
    id: row.id,
    planId: row.plan_id,
    date: row.date,
    dayOfWeek: normalizeDayOfWeek(row.day_of_week, row.date),
    dayType: row.day_type || 'cooking',
  };
}

function canonicalSlot(row, side) {
  const snapshot = parseSnapshot(row.snapshot_json);
  const recipe = snapshot.recipe;
  return {
    id: row.id,
    dayId: row.day_id,
    planId: row.plan_id,
    slotType: snapshot.slotType || row.slot_type,
    status: snapshot.status || row.status || 'PLANNED',
    recipeId: recipe?.id || row.recipe_id || null,
    servings: finiteNumber(snapshot.servings, finiteNumber(row.servings, 2)),
    notes: snapshot.notes ?? row.notes ?? null,
    source: snapshot.source || (side === 'v2' ? row.source : 'AUTO') || 'AUTO',
    isLocked: snapshot.isLocked === true || (side === 'v2' && bool(row.is_locked)),
    leftoverSourceSlotId: snapshot.leftoverSourceSlotId || (side === 'v2' ? row.leftover_source_id : null),
    isLeftover: snapshot.isLeftover === true,
    availabilityPercent: finiteNumber(snapshot.availabilityPercent),
    incrementalCostVnd: finiteNumber(snapshot.incrementalCostVnd),
    rescuedExpiringIngredients: Array.isArray(snapshot.rescuedExpiringIngredients) ? snapshot.rescuedExpiringIngredients : [],
    badges: Array.isArray(snapshot.badges) ? snapshot.badges : [],
    ingredients: Array.isArray(snapshot.ingredients) ? snapshot.ingredients : [],
  };
}

function canonicalShopping(row) {
  const snapshot = parseSnapshot(row.snapshot_json);
  return {
    id: row.id,
    planId: row.plan_id,
    ingredientId: snapshot.ingredientId || row.ingredient_id || '',
    name: snapshot.name || row.name,
    category: snapshot.category || row.category || 'other',
    requiredQuantity: finiteNumber(snapshot.requiredQuantity, finiteNumber(row.required_quantity, finiteNumber(row.quantity, 0))),
    existingInventoryQuantity: finiteNumber(snapshot.existingInventoryQuantity, finiteNumber(row.inventory_quantity)),
    missingQuantity: finiteNumber(snapshot.missingQuantity, finiteNumber(row.missing_quantity, finiteNumber(row.quantity, 0))),
    recommendedPurchaseQuantity: finiteNumber(snapshot.recommendedPurchaseQuantity, finiteNumber(row.purchase_quantity, finiteNumber(row.quantity, 0))),
    unit: snapshot.unit || row.unit || 'piece',
    estimatedPriceMin: finiteNumber(snapshot.estimatedPriceMin, finiteNumber(row.estimated_price_min)),
    estimatedPriceMax: finiteNumber(snapshot.estimatedPriceMax, finiteNumber(row.estimated_price_max)),
    checked: typeof snapshot.checked === 'boolean' ? snapshot.checked : bool(row.checked),
    cannotBuy: typeof snapshot.cannotBuy === 'boolean' ? snapshot.cannotBuy : bool(row.cannot_buy),
    sourceRecipes: Array.isArray(snapshot.sourceRecipes) ? snapshot.sourceRecipes : [],
  };
}

function parsePayload(statements) {
  if (!Array.isArray(statements) || statements.some((statement) => statement?.success !== true)) {
    throw new Error('Wrangler did not return successful D1 results');
  }
  const rows = statements.flatMap((statement) => Array.isArray(statement.results) ? statement.results : []);
  const datasets = Object.fromEntries(DATASETS.map((name) => [name, []]));
  for (const row of rows) {
    if (!datasets[row.dataset]) continue;
    try {
      datasets[row.dataset].push(JSON.parse(row.payload || '{}'));
    } catch {
      throw new Error(`Invalid JSON payload for ${row.dataset}`);
    }
  }
  return datasets;
}

function byPlan(rows) {
  const result = new Map();
  for (const row of rows) {
    const list = result.get(row.plan_id) || [];
    list.push(row);
    result.set(row.plan_id, list);
  }
  return result;
}

function sortRows(rows) {
  return [...rows].sort((a, b) => String(a.id).localeCompare(String(b.id)));
}

function rowsById(rows) {
  return new Map(rows.map((row) => [row.id, row]));
}

function compareRows(leftRows, rightRows, canonicalizeLeft, canonicalizeRight) {
  const left = rowsById(leftRows);
  const right = rowsById(rightRows);
  const ids = new Set([...left.keys(), ...right.keys()]);
  const orphanLeft = [];
  const orphanRight = [];
  const contentMismatch = [];
  for (const id of [...ids].sort()) {
    if (!left.has(id)) orphanRight.push(id);
    else if (!right.has(id)) orphanLeft.push(id);
    else if (stableStringify(canonicalizeLeft(left.get(id))) !== stableStringify(canonicalizeRight(right.get(id)))) contentMismatch.push(id);
  }
  return { orphanLeft, orphanRight, contentMismatch };
}

export function reconcileWeekDatasets(rawDatasets) {
  const datasets = rawDatasets;
  const plans = new Map(datasets.plans.map((row) => [row.id, canonicalPlan(row)]));
  const v1Days = byPlan(datasets.v1_days);
  const v2Days = byPlan(datasets.v2_days);
  const v1Slots = byPlan(datasets.v1_slots);
  const v2Slots = byPlan(datasets.v2_slots);
  const v1Shopping = byPlan(datasets.v1_shopping);
  const v2Shopping = byPlan(datasets.v2_shopping);
  const planIds = new Set([...plans.keys(), ...v1Days.keys(), ...v2Days.keys(), ...v1Slots.keys(), ...v2Slots.keys(), ...v1Shopping.keys(), ...v2Shopping.keys()]);
  const orphanRows = [];
  const knownPlanIds = new Set(plans.keys());
  const dayOwners = {
    v1: new Map(datasets.v1_days.map((row) => [row.id, row.plan_id])),
    v2: new Map(datasets.v2_days.map((row) => [row.id, row.plan_id])),
  };
  for (const side of ['v1', 'v2']) {
    const sideDatasets = [
      ['days', datasets[`${side}_days`]],
      ['shopping', datasets[`${side}_shopping`]],
      ['slots', datasets[`${side}_slots`]],
    ];
    for (const [kind, rows] of sideDatasets) {
      for (const row of rows) {
        if (!knownPlanIds.has(row.plan_id)) orphanRows.push({ side, kind, id: row.id, reason: 'missing_plan', planId: row.plan_id });
        if (kind === 'slots') {
          const owner = dayOwners[side].get(row.day_id);
          if (!owner) orphanRows.push({ side, kind, id: row.id, reason: 'missing_day', dayId: row.day_id, planId: row.plan_id });
          else if (owner !== row.plan_id) orphanRows.push({ side, kind, id: row.id, reason: 'day_plan_mismatch', dayId: row.day_id, planId: row.plan_id });
        }
      }
    }
  }
  const reports = [];
  for (const planId of [...planIds].sort()) {
    const leftPlan = plans.get(planId) || null;
    const v1DayRows = v1Days.get(planId) || [];
    const v2DayRows = v2Days.get(planId) || [];
    const projectionIssues = [];
    if (leftPlan && ['READY', 'ACTIVE', 'COMPLETED'].includes(leftPlan.status) && v1DayRows.length === 0) {
      projectionIssues.push('v1_missing_days_for_materialized_plan');
    }
    if (leftPlan && ['READY', 'ACTIVE', 'COMPLETED'].includes(leftPlan.status) && v2DayRows.length === 0) {
      projectionIssues.push('v2_missing_days_for_materialized_plan');
    }
    const dayDiff = compareRows(v1DayRows, v2DayRows, canonicalDay, canonicalDay);
    const slotDiff = compareRows(v1Slots.get(planId) || [], v2Slots.get(planId) || [], (row) => canonicalSlot(row, 'v1'), (row) => canonicalSlot(row, 'v2'));
    const shoppingDiff = compareRows(v1Shopping.get(planId) || [], v2Shopping.get(planId) || [], canonicalShopping, canonicalShopping);
    const canonical = {
      plan: leftPlan,
      days: sortRows(v1DayRows).map(canonicalDay),
      slots: sortRows(v1Slots.get(planId) || []).map((row) => canonicalSlot(row, 'v1')),
      shoppingItems: sortRows(v1Shopping.get(planId) || []).map(canonicalShopping),
    };
    const canonicalV2 = {
      plan: leftPlan,
      days: sortRows(v2DayRows).map(canonicalDay),
      slots: sortRows(v2Slots.get(planId) || []).map((row) => canonicalSlot(row, 'v2')),
      shoppingItems: sortRows(v2Shopping.get(planId) || []).map(canonicalShopping),
    };
    const checksumV1 = sha256(canonical);
    const checksumV2 = sha256(canonicalV2);
    const report = {
      planId,
      planPresent: Boolean(leftPlan),
      counts: {
        v1Days: v1DayRows.length,
        v2Days: v2DayRows.length,
        v1Slots: (v1Slots.get(planId) || []).length,
        v2Slots: (v2Slots.get(planId) || []).length,
        v1Shopping: (v1Shopping.get(planId) || []).length,
        v2Shopping: (v2Shopping.get(planId) || []).length,
      },
      checksums: { v1: checksumV1, v2: checksumV2 },
      parity: Boolean(leftPlan) && projectionIssues.length === 0 && checksumV1 === checksumV2 && orphanRows.every((row) => row.planId !== planId) && dayDiff.orphanLeft.length === 0 && dayDiff.orphanRight.length === 0 && slotDiff.orphanLeft.length === 0 && slotDiff.orphanRight.length === 0 && shoppingDiff.orphanLeft.length === 0 && shoppingDiff.orphanRight.length === 0,
      projectionIssues,
      differences: {
        days: dayDiff,
        slots: slotDiff,
        shopping: shoppingDiff,
      },
    };
    reports.push(report);
  }
  return {
    generatedAt: new Date().toISOString(),
    plans: reports,
    orphanRows,
    summary: {
      totalPlans: reports.length,
      parityPlans: reports.filter((report) => report.parity).length,
      mismatchPlans: reports.filter((report) => !report.parity).length,
      orphanRows: orphanRows.length,
    },
  };
}

function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const strict = args.includes('--strict');
  const database = args[args.indexOf('--database') + 1] || 'frigo-db';
  const scope = args[args.indexOf('--scope') + 1] || 'unknown';
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => { input += chunk; });
  process.stdin.on('end', () => {
    try {
      const report = reconcileWeekDatasets(parsePayload(JSON.parse(input)));
      report.database = database;
      report.scope = scope;
      if (json) console.log(JSON.stringify(report, null, 2));
      else {
        console.log(`Week reconciliation: database=${database} scope=${scope}`);
        for (const plan of report.plans) {
          const marker = plan.parity ? 'PASS' : 'MISMATCH';
          console.log(`${marker} plan=${plan.planId} days=${plan.counts.v1Days}/${plan.counts.v2Days} slots=${plan.counts.v1Slots}/${plan.counts.v2Slots} shopping=${plan.counts.v1Shopping}/${plan.counts.v2Shopping} checksum_v1=${plan.checksums.v1.slice(0, 12)} checksum_v2=${plan.checksums.v2.slice(0, 12)}`);
          if (!plan.parity) console.log(`  issues=${JSON.stringify(plan.projectionIssues)} differences=${JSON.stringify(plan.differences)}`);
        }
        console.log(`Totals: plans=${report.summary.totalPlans} parity=${report.summary.parityPlans} mismatches=${report.summary.mismatchPlans} orphan_rows=${report.summary.orphanRows}`);
      }
      if (strict && report.summary.mismatchPlans > 0) process.exitCode = 1;
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  });
}

if (process.argv[1] && process.argv[1].endsWith('week-reconciliation.mjs')) main();
