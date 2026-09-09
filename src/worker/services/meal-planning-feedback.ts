import { z } from 'zod';
import type { D1DatabaseBinding } from '../../../packages/db/src/index';
import { insertGeneratedMealPlanFeedback } from '../../../packages/db/src/meal-planning';
import { RecipeIdentitySchema } from '../../../packages/recipes/src/personalization';
import { canonicalJson } from '../../../packages/recipes/src/planner-context';
import { sha256Hex } from '../utils/session';
import { MealPlanningError } from './meal-planning-error';

type Scope = { householdId: string; userId: string };
type Identity = z.infer<typeof RecipeIdentitySchema>;
const StoredEventSchema = z.object({
  id: z.string(), event_type: z.string(), occurred_at: z.string(),
  target_recipe_id: z.string().nullable(), target_family_id: z.string().nullable(),
  replacement_recipe_id: z.string().nullable(), replacement_family_id: z.string().nullable(),
});

export async function recordPlanningTaste(
  db: D1DatabaseBinding,
  scope: Scope,
  input: { planId: string; revision: number; slotId: string; key: string; type: 'liked' | 'disliked' | 'skipped' | 'swapped';
    target: Identity; replacement?: Identity; occurredAt: string },
) {
  const id = `mpf_${await sha256Hex(canonicalJson([scope, input.planId, input.revision, input.slotId, input.key]))}`;
  const expected = {
    event_type: input.type,
    target_recipe_id: input.target.kind === 'recipe' ? input.target.id : null,
    target_family_id: input.target.kind === 'family' ? input.target.id : null,
    replacement_recipe_id: input.replacement?.kind === 'recipe' ? input.replacement.id : null,
    replacement_family_id: input.replacement?.kind === 'family' ? input.replacement.id : null,
  };
  async function replay() {
    const raw = await db.prepare(`SELECT e.* FROM recipe_feedback_events e
      JOIN household_members m ON m.household_id = e.household_id AND m.user_id = e.user_id
      JOIN generated_meal_plans p ON p.household_id = e.household_id AND p.creator_user_id = e.user_id
      WHERE e.id = ? AND e.household_id = ? AND e.user_id = ? AND p.id = ? AND p.revision = ?`)
      .bind(id, scope.householdId, scope.userId, input.planId, input.revision).first();
    if (!raw) return null;
    const event = StoredEventSchema.parse(raw);
    if (Object.entries(expected).some(([key, value]) => event[key as keyof typeof expected] !== value)) {
      throw new MealPlanningError('IDEMPOTENCY_CONFLICT', 409, 'Feedback key was already used for another event');
    }
    return { id: event.id, occurredAt: event.occurred_at };
  }
  const prior = await replay();
  if (prior) return prior;
  const inserted = await insertGeneratedMealPlanFeedback(db, scope, {
    id, planId: input.planId, expectedRevision: input.revision,
    type: input.type, target: input.target, replacement: input.replacement, occurredAt: input.occurredAt,
  });
  if (inserted) return { id, occurredAt: input.occurredAt };
  const concurrent = await replay();
  if (concurrent) return concurrent;
  throw new MealPlanningError('PLAN_REVISION_CONFLICT', 409, 'Plan changed before feedback could be recorded');
}
