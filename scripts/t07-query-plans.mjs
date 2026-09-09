import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync(':memory:');
db.exec('PRAGMA foreign_keys = ON');
for (const file of readdirSync('migrations').filter((name) => /^\d+.*\.sql$/.test(name)).sort()) {
  db.exec(readFileSync(path.join('migrations', file), 'utf8'));
}
db.exec(`
  INSERT INTO users (id) VALUES ('t07-plan-user');
  INSERT INTO households (id, name, created_by) VALUES ('t07-plan-home', 'T07 plans', 't07-plan-user');
  INSERT INTO household_members (id, household_id, user_id, role)
    VALUES ('t07-plan-member', 't07-plan-home', 't07-plan-user', 'owner');
  INSERT INTO generated_meal_plans
    (id, household_id, creator_user_id, request_key, request_fingerprint, intent_json, result_json, source_json)
    VALUES ('t07-plan-id', 't07-plan-home', 't07-plan-user', 't07-plan-key', '${'a'.repeat(64)}',
      '{"version":1,"data":{}}', '{"version":1,"data":{}}', '{"version":1,"data":{}}');
  INSERT INTO recipes
    (id, slug, title, cuisine, servings, prep_time_minutes, cook_time_minutes, difficulty, source_type, verification_state, version)
    VALUES ('t07-plan-recipe', 't07-plan-recipe', 'T07 recipe', 'viet', 2, 0, 10, 'easy', 'curated', 'reviewed', 1);
  INSERT INTO recipe_feedback_events
    (id, household_id, user_id, event_type, target_recipe_id, occurred_at)
    VALUES ('t07-feedback-id', 't07-plan-home', 't07-plan-user', 'liked', 't07-plan-recipe', '2030-01-01T00:00:00.000Z');
  INSERT INTO inventory_items (id, household_id, name, quantity, unit, version)
    VALUES ('t07-plan-lot', 't07-plan-home', 'T07 item', 1, 'piece', 1);
`);

const queries = {
  exactPlan: [`SELECT plan.* FROM generated_meal_plans plan
    JOIN household_members member ON member.household_id = plan.household_id AND member.user_id = plan.creator_user_id
    WHERE plan.id = ? AND plan.household_id = ? AND plan.creator_user_id = ?
      AND member.household_id = ? AND member.user_id = ?`, ['t07-plan-id', 't07-plan-home', 't07-plan-user', 't07-plan-home', 't07-plan-user']],
  currentPlan: [`SELECT plan.* FROM generated_meal_plans plan
    JOIN household_members member ON member.household_id = plan.household_id AND member.user_id = plan.creator_user_id
    WHERE plan.household_id = ? AND plan.creator_user_id = ?
    ORDER BY plan.updated_at DESC, plan.id DESC LIMIT 1`, ['t07-plan-home', 't07-plan-user']],
  cas: [`UPDATE generated_meal_plans SET result_json = result_json, revision = revision + 1
    WHERE id = ? AND household_id = ? AND creator_user_id = ? AND revision = ?
      AND EXISTS (SELECT 1 FROM household_members WHERE household_id = ? AND user_id = ?)`,
    ['t07-plan-id', 't07-plan-home', 't07-plan-user', 1, 't07-plan-home', 't07-plan-user']],
  feedbackReplay: [`SELECT e.* FROM recipe_feedback_events e
    JOIN household_members m ON m.household_id = e.household_id AND m.user_id = e.user_id
    JOIN generated_meal_plans p ON p.household_id = e.household_id AND p.creator_user_id = e.user_id
    WHERE e.id = ? AND e.household_id = ? AND e.user_id = ? AND p.id = ? AND p.revision = ?`,
    ['t07-feedback-id', 't07-plan-home', 't07-plan-user', 't07-plan-id', 1]],
  inventory: [`SELECT id, household_id, version, ingredient_id, quantity, unit, freshness,
    expiry_date, expiry_kind, storage, opened_at, expiry_source, added_date, updated_at
    FROM inventory_items WHERE household_id = ? ORDER BY id`, ['t07-plan-home']],
  membership: ['SELECT 1 FROM household_members WHERE household_id = ? AND user_id = ?', ['t07-plan-home', 't07-plan-user']],
  householdPreferences: ['SELECT values_json FROM household_ranking_preferences WHERE household_id = ?', ['t07-plan-home']],
  memberPreferences: ['SELECT values_json FROM member_ranking_preferences WHERE household_id = ? AND user_id = ?', ['t07-plan-home', 't07-plan-user']],
  feedbackTastes: [`SELECT e.id FROM recipe_feedback_events e
    WHERE e.household_id = ? AND e.user_id = ? AND e.event_type IN ('liked', 'disliked')
      AND (e.occurred_at NOT GLOB '????-??-??T??:??:??*Z' OR julianday(e.occurred_at) IS NULL OR julianday(e.occurred_at) <= julianday(?))
    ORDER BY e.occurred_at DESC, e.id DESC`, ['t07-plan-home', 't07-plan-user', '2030-01-02T00:00:00.000Z']],
  recentFeedback: [`SELECT e.id FROM recipe_feedback_events e
    WHERE e.household_id = ? AND e.user_id = ? AND e.event_type IN ('skipped', 'swapped')
      AND (e.occurred_at NOT GLOB '????-??-??T??:??:??*Z' OR julianday(e.occurred_at) IS NULL OR (julianday(e.occurred_at) >= julianday(?) AND julianday(e.occurred_at) <= julianday(?)))
    ORDER BY e.occurred_at DESC, e.id DESC`, ['t07-plan-home', 't07-plan-user', '2029-12-01T00:00:00.000Z', '2030-01-02T00:00:00.000Z']],
  cookedHistory: [`SELECT cooked.id FROM cooked_meals cooked
    JOIN recipes recipe ON recipe.id = cooked.recipe_id
    WHERE cooked.household_id = ?
      AND (NOT ((cooked.completed_at GLOB '????-??-?? ??:??:??*' AND instr(cooked.completed_at, 'T') = 0)
        OR cooked.completed_at GLOB '????-??-??T??:??:??*Z') OR julianday(cooked.completed_at) IS NULL OR (julianday(cooked.completed_at) >= julianday(?) AND julianday(cooked.completed_at) <= julianday(?)))
    ORDER BY cooked.completed_at DESC, cooked.id DESC`, ['t07-plan-home', '2029-12-01T00:00:00.000Z', '2030-01-02T00:00:00.000Z']],
  recipeIngredients: ['SELECT id, recipe_id, ingredient_id, name, required_quantity, unit, is_optional FROM recipe_ingredients ORDER BY recipe_id, id', []],
  recipeSteps: ['SELECT id, recipe_id, step_number, instruction, tip, timer_minutes FROM recipe_steps ORDER BY recipe_id, step_number, id', []],
};
for (const [name, [sql, bindings]] of Object.entries(queries)) {
  const details = db.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...bindings).map(({ detail }) => detail);
  console.log(`${name}: ${details.join(' | ')}`);
}
console.log(`foreignKeyCheck: ${JSON.stringify(db.prepare('PRAGMA foreign_key_check').all())}`);
for (const table of ['household_ranking_preferences', 'member_ranking_preferences', 'recipe_feedback_events', 'generated_meal_plans', 'generated_meal_plan_annotations']) {
  console.log(`${table}Fks: ${JSON.stringify(db.prepare(`PRAGMA foreign_key_list(${table})`).all())}`);
}
db.close();
