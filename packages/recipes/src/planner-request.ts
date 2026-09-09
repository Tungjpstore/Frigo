import { z } from 'zod';
import { compareIds } from '../../domain/src/availability';
import { CatalogIdSchema } from '../../domain/src/foundation';
import { RequestedServingsSchema } from './requirements';
import { PeriodNutritionTargetsSchema } from './planner-nutrition';
import { PLANNER_LIMITS } from './planner-policy';
import { slotInstant, type PlanningReference } from './planner-context';

const MealTypeSchema = z.enum(['breakfast', 'lunch', 'dinner']);
const ServingsSchema = RequestedServingsSchema.max(PLANNER_LIMITS.servings);
export const PlannerLockSchema = z.object({
  kind: z.enum(['recipe', 'family']),
  id: CatalogIdSchema,
  version: z.number().int().positive().safe(),
  variantId: z.string().min(1).max(20_000).optional(),
}).strict().refine((lock) => (lock.kind === 'family') === (lock.variantId !== undefined),
  'Family locks require an exact variant; recipe locks cannot carry a variant');

export const PlannerMealSlotSchema = z.object({
  date: z.string().date(),
  mealType: MealTypeSchema,
  sequence: z.number().int().min(0).max(PLANNER_LIMITS.slots).default(0),
  time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/).optional(),
  servings: ServingsSchema.optional(),
  hardMaxTimeMinutes: z.number().int().min(1).max(1440).optional(),
  preferredTimeMinutes: z.number().int().min(1).max(1440).optional(),
  lock: PlannerLockSchema.optional(),
}).strict();

export const PlannerRequestSchema = z.object({
  startDate: z.string().date(),
  horizonDays: z.number().int().min(1).max(PLANNER_LIMITS.horizonDays).default(7),
  slots: z.array(PlannerMealSlotSchema).min(1).max(PLANNER_LIMITS.slots),
  defaultServings: ServingsSchema,
  mode: z.enum(['cook_now', 'shopping_allowed']).default('cook_now'),
  nutritionTargets: PeriodNutritionTargetsSchema.default([]),
  leftovers: z.literal('disabled').default('disabled'),
}).strict();
export type PlannerRequestInput = z.input<typeof PlannerRequestSchema>;
export type PlannerRequest = z.infer<typeof PlannerRequestSchema>;
export type PlannerLock = z.infer<typeof PlannerLockSchema>;
export interface NormalizedPlannerSlot extends z.infer<typeof PlannerMealSlotSchema> {
  id: string;
  time: string;
  instant: string;
  servings: number;
}
export interface NormalizedPlannerRequest extends Omit<PlannerRequest, 'slots'> {
  slots: NormalizedPlannerSlot[];
}
const defaultTimes = { breakfast: '08:00', lunch: '12:00', dinner: '18:00' } as const;

export function normalizePlannerRequest(input: PlannerRequestInput, reference: PlanningReference): NormalizedPlannerRequest {
  const request = PlannerRequestSchema.parse(input);
  if (request.startDate < reference.localDate) throw new Error('Planning horizon precedes snapshot local date');
  const horizonEnd = new Date(Date.parse(`${request.startDate}T00:00:00Z`) + request.horizonDays * 86_400_000)
    .toISOString().slice(0, 10);
  const seen = new Set<string>();
  const slots = request.slots.map((slot) => {
    if (slot.date < request.startDate || slot.date >= horizonEnd) throw new Error('Meal slot is outside the planning horizon');
    const id = `${slot.date}:${slot.mealType}:${slot.sequence}`;
    if (seen.has(id)) throw new Error('Duplicate meal slot identity');
    seen.add(id);
    const time = slot.time ?? defaultTimes[slot.mealType];
    const instant = slotInstant(slot.date, time, reference);
    if (Date.parse(instant) < Date.parse(reference.instant)) throw new Error('Meal slot precedes the planning snapshot');
    return { ...slot, id, time, instant, servings: slot.servings ?? request.defaultServings };
  }).sort((a, b) => compareIds(a.instant, b.instant) || a.sequence - b.sequence || compareIds(a.id, b.id));
  for (const target of request.nutritionTargets) {
    if (target.period === 'day' && !slots.some((slot) => slot.date === target.date)) {
      throw new Error('Daily nutrition targets require at least one requested meal on that date');
    }
  }
  request.nutritionTargets.sort((a, b) => compareIds(`${a.period}:${a.date ?? ''}:${a.nutrient}`, `${b.period}:${b.date ?? ''}:${b.nutrient}`));
  return { ...request, slots };
}
