import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};

const scope = option('--scope', 'local');
const database = option('--database', 'frigo-db');
const planIds = args.filter((value, index) => args[index - 1] === '--plan-id');
const apply = args.includes('--apply');
const confirmed = args.includes('--confirm-production-repair');

if (!['local', 'remote'].includes(scope) || planIds.length === 0) {
  console.error('Usage: node scripts/week-repair-from-kv.mjs --scope <local|remote> --plan-id <id> [--plan-id <id>] [--apply --confirm-production-repair]');
  process.exit(2);
}
if (planIds.some((id) => !/^plan_[A-Za-z0-9_-]{8,200}$/.test(id))) {
  console.error('Every --plan-id must be an explicit Frigo plan id.');
  process.exit(2);
}
if (apply && scope === 'remote' && !confirmed) {
  console.error('Remote writes require --confirm-production-repair.');
  process.exit(2);
}

function wrangler(commandArgs, options = {}) {
  return execFileSync('pnpm', ['wrangler', ...commandArgs], {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    ...options,
  });
}

function sqlText(value) {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? String(number) : String(fallback);
}

function sqlBoolean(value) {
  return value ? '1' : '0';
}

function parseD1Rows(output) {
  const statements = JSON.parse(output);
  if (!Array.isArray(statements) || statements.some((statement) => statement.success !== true)) {
    throw new Error('D1 query did not complete successfully');
  }
  return statements.flatMap((statement) => statement.results || []);
}

function getCachedPlan(planId) {
  const kvArgs = ['kv', 'key', 'get', `plan_${planId}`, '--binding', 'CACHE', '--text'];
  if (scope === 'local') kvArgs.push('--local');
  const raw = wrangler(kvArgs).trim();
  if (!raw) throw new Error(`KV snapshot is missing for ${planId}`);
  const plan = JSON.parse(raw);
  if (plan.id !== planId || typeof plan.householdId !== 'string') {
    throw new Error(`KV snapshot identity mismatch for ${planId}`);
  }
  if (!Array.isArray(plan.days) || plan.days.length === 0 || !Array.isArray(plan.shoppingItems)) {
    throw new Error(`KV snapshot is incomplete for ${planId}`);
  }
  return plan;
}

function getD1State(plan) {
  const planId = sqlText(plan.id);
  const query = `SELECT p.id, p.household_id, p.snapshot_json IS NOT NULL AS has_snapshot,
    (SELECT COUNT(*) FROM meal_plan_days WHERE plan_id = p.id) AS v1_days,
    (SELECT COUNT(*) FROM meal_plan_days_v2 WHERE plan_id = p.id) AS v2_days,
    (SELECT COUNT(*) FROM meal_plan_slots WHERE plan_id = p.id) AS v1_slots,
    (SELECT COUNT(*) FROM meal_plan_slots_v2 WHERE plan_id = p.id) AS v2_slots,
    (SELECT COUNT(*) FROM meal_plan_shopping_items WHERE plan_id = p.id) AS v1_shopping,
    (SELECT COUNT(*) FROM meal_plan_shopping_items_v2 WHERE plan_id = p.id) AS v2_shopping
    FROM meal_plans p WHERE p.id = ${planId}`;
  const rows = parseD1Rows(wrangler(['d1', 'execute', database, `--${scope}`, '--command', query, '--json']));
  if (rows.length !== 1) throw new Error(`D1 plan row is missing for ${plan.id}`);
  if (rows[0].household_id !== plan.householdId) {
    throw new Error(`D1/KV household mismatch for ${plan.id}`);
  }
  return rows[0];
}

function expectedCounts(plan) {
  return {
    days: plan.days.length,
    slots: plan.days.reduce((total, day) => total + (Array.isArray(day.slots) ? day.slots.length : 0), 0),
    shopping: plan.shoppingItems.length,
  };
}

function classifyState(state, expected) {
  const counts = ['v1_days', 'v2_days', 'v1_slots', 'v2_slots', 'v1_shopping', 'v2_shopping'];
  if (Number(state.has_snapshot) === 0 && counts.every((name) => Number(state[name]) === 0)) return 'empty';
  if (
    Number(state.has_snapshot) === 1 &&
    Number(state.v1_days) === expected.days && Number(state.v2_days) === expected.days &&
    Number(state.v1_slots) === expected.slots && Number(state.v2_slots) === expected.slots &&
    Number(state.v1_shopping) === expected.shopping && Number(state.v2_shopping) === expected.shopping
  ) return 'restored';
  return 'partial';
}

function ownerGuard(plan) {
  return `EXISTS (SELECT 1 FROM meal_plans WHERE id = ${sqlText(plan.id)} AND household_id = ${sqlText(plan.householdId)})`;
}

function buildRepairSql(plan) {
  const guard = ownerGuard(plan);
  const statements = [
    `UPDATE meal_plans SET start_date = ${sqlText(plan.startDate)}, end_date = ${sqlText(plan.endDate)}, status = ${sqlText(plan.status)}, budget_target = ${plan.budget?.targetVnd == null ? 'NULL' : sqlNumber(plan.budget.targetVnd)}, budget_min = ${sqlNumber(plan.budget?.estimatedMinVnd)}, budget_max = ${sqlNumber(plan.budget?.estimatedMaxVnd)}, currency = 'VND', shopping_frequency = ${sqlText(plan.shoppingFrequency)}, fridge_utilization = ${sqlNumber(plan.utilization?.utilizationPercent)}, waste_risk = ${sqlText(plan.wasteRisk?.level || 'LOW')}, ai_explanation = ${sqlText(plan.aiExplanation)}, snapshot_json = ${sqlText(JSON.stringify({ version: 1, plan }))}, updated_at = datetime('now') WHERE id = ${sqlText(plan.id)} AND household_id = ${sqlText(plan.householdId)}`,
    `DELETE FROM meal_plan_shopping_items WHERE plan_id = ${sqlText(plan.id)} AND ${guard}`,
    `DELETE FROM meal_plan_slots WHERE plan_id = ${sqlText(plan.id)} AND ${guard}`,
    `DELETE FROM meal_plan_days WHERE plan_id = ${sqlText(plan.id)} AND ${guard}`,
    `DELETE FROM meal_plan_shopping_items_v2 WHERE plan_id = ${sqlText(plan.id)} AND ${guard}`,
    `DELETE FROM meal_plan_slots_v2 WHERE plan_id = ${sqlText(plan.id)} AND ${guard}`,
    `DELETE FROM meal_plan_days_v2 WHERE plan_id = ${sqlText(plan.id)} AND ${guard}`,
  ];

  for (const day of plan.days) {
    statements.push(
      `INSERT INTO meal_plan_days (id, plan_id, day_of_week, date, day_type) SELECT ${sqlText(day.id)}, ${sqlText(plan.id)}, ${sqlNumber(day.dayOfWeek)}, ${sqlText(day.date)}, ${sqlText(day.dayType || 'cooking')} WHERE ${guard}`,
      `INSERT INTO meal_plan_days_v2 (id, plan_id, date, day_of_week, day_type) SELECT ${sqlText(day.id)}, ${sqlText(plan.id)}, ${sqlText(day.date)}, ${sqlNumber(day.dayOfWeek)}, ${sqlText(day.dayType || 'cooking')} WHERE ${guard}`,
    );
    for (const slot of day.slots || []) {
      statements.push(
        `INSERT INTO meal_plan_slots (id, day_id, plan_id, slot_type, recipe_id, servings, status, notes, snapshot_json) SELECT ${sqlText(slot.id)}, ${sqlText(day.id)}, ${sqlText(plan.id)}, ${sqlText(slot.slotType)}, ${sqlText(slot.recipe?.id)}, ${sqlNumber(slot.servings, 2)}, ${sqlText(slot.status || 'PLANNED')}, ${sqlText(slot.notes)}, ${sqlText(JSON.stringify(slot))} WHERE ${guard}`,
        `INSERT INTO meal_plan_slots_v2 (id, day_id, plan_id, slot_type, status, recipe_id, servings, source, is_locked, leftover_source_id, notes, snapshot_json) SELECT ${sqlText(slot.id)}, ${sqlText(day.id)}, ${sqlText(plan.id)}, ${sqlText(slot.slotType)}, ${sqlText(slot.status || 'PLANNED')}, ${sqlText(slot.recipe?.id)}, ${sqlNumber(slot.servings, 2)}, ${sqlText(slot.source || 'AUTO')}, ${sqlBoolean(slot.isLocked)}, ${sqlText(slot.leftoverSourceSlotId)}, ${sqlText(slot.notes)}, ${sqlText(JSON.stringify(slot))} WHERE ${guard}`,
      );
    }
  }

  for (const item of plan.shoppingItems) {
    const id = `shop_${plan.id}_${item.ingredientId}`;
    const quantity = item.recommendedPurchaseQuantity || item.missingQuantity || 1;
    statements.push(
      `INSERT INTO meal_plan_shopping_items (id, plan_id, ingredient_id, name, quantity, unit, checked, cannot_buy, snapshot_json) SELECT ${sqlText(id)}, ${sqlText(plan.id)}, ${sqlText(item.ingredientId)}, ${sqlText(item.name)}, ${sqlNumber(quantity, 1)}, ${sqlText(item.unit || 'piece')}, ${sqlBoolean(item.checked)}, ${sqlBoolean(item.cannotBuy)}, ${sqlText(JSON.stringify(item))} WHERE ${guard}`,
      `INSERT INTO meal_plan_shopping_items_v2 (id, plan_id, ingredient_id, name, category, required_quantity, inventory_quantity, missing_quantity, purchase_quantity, quantity, unit, estimated_price_min, estimated_price_max, checked, cannot_buy, snapshot_json) SELECT ${sqlText(id)}, ${sqlText(plan.id)}, ${sqlText(item.ingredientId)}, ${sqlText(item.name)}, ${sqlText(item.category || 'other')}, ${sqlNumber(item.requiredQuantity)}, ${sqlNumber(item.existingInventoryQuantity)}, ${sqlNumber(item.missingQuantity)}, ${sqlNumber(item.recommendedPurchaseQuantity)}, ${sqlNumber(item.recommendedPurchaseQuantity)}, ${sqlText(item.unit || 'piece')}, ${sqlNumber(item.estimatedPriceMin)}, ${sqlNumber(item.estimatedPriceMax)}, ${sqlBoolean(item.checked)}, ${sqlBoolean(item.cannotBuy)}, ${sqlText(JSON.stringify(item))} WHERE ${guard}`,
    );
  }
  return `${statements.join(';\n')};`;
}

const plans = planIds.map((id) => {
  const plan = getCachedPlan(id);
  const expected = expectedCounts(plan);
  const state = getD1State(plan);
  const classification = classifyState(state, expected);
  if (classification === 'partial') {
    throw new Error(`Refusing to overwrite partial D1 projection for ${id}`);
  }
  const checksum = createHash('sha256').update(JSON.stringify(plan)).digest('hex');
  console.log(`plan=${id} state=${classification} days=${expected.days} slots=${expected.slots} shopping=${expected.shopping} kv_sha256=${checksum.slice(0, 16)}`);
  return { plan, classification };
});

if (!apply) {
  console.log('Dry run only. Add --apply and the production confirmation flag to repair D1.');
  process.exit(0);
}

if (scope === 'remote') {
  const stamp = new Date().toISOString().replaceAll(/[:.]/g, '-');
  const backup = `.artifacts/frigo-db-pre-week-repair-${stamp}.sql`;
  wrangler(['d1', 'export', database, '--remote', '--output', backup], { stdio: 'inherit' });
  console.log(`backup=${backup}`);
}

for (const { plan, classification } of plans) {
  if (classification === 'restored') {
    console.log(`skip=${plan.id} reason=already_restored`);
    continue;
  }
  const output = wrangler(['d1', 'execute', database, `--${scope}`, '--command', buildRepairSql(plan), '--json']);
  parseD1Rows(output);
  console.log(`repaired=${plan.id}`);
}

execFileSync('bash', ['scripts/d1-week-reconcile.sh', scope, '--strict'], {
  cwd: process.cwd(),
  stdio: 'inherit',
});
